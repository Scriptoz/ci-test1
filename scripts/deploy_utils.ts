import {ethers, upgrades, network} from "hardhat";
import {sleep, verify, keypress} from "../utils/helpers";
import {
  multisig,
  secondConfirmTransaction,
  executeBatch,
} from "../utils/multisig";
import { upgradeProxyAbi } from "../data/contracts_abi/upgradeProxy.json";
import { proxyAdminAbi } from "../data/contracts_abi/proxyAdmin.json";
import "@openzeppelin/hardhat-upgrades";

interface ContractDeployParams {
  useMultiSig?: boolean;

  gnosisSafeAddress?: string;

  gnosisSafeServiceURL?: string;

  proxyAddress: string;

  contractFactory: string;

  useUUPS?: boolean;

  libraries?: Array<{ factory: string, address: string }>;
}
  
export async function deployEnvironment(config: any) {
  for (const library of config.libraries) {
    if (!library.address) {
      library.address = await deployLibrary(library.factory);
    }
  }

  for (const contract of config.contracts) {
    const libraries = [];

    for (const libraryFactory of contract.libraries) {
      const library = config.libraries.find((item: any) => item.factory === libraryFactory);

      if (!library) {
        throw new Error(`Library ${libraryFactory} was not defined on environment ${config.name}`);
      }

      libraries.push(library);
    }

    await deployContract({
      contractFactory: contract.factory,
      proxyAddress: contract.address,
      libraries,
    });
  }
}

export async function deployLibrary(libraryFactoryName: string): Promise<string> {
  const [ deployer ] = await ethers.getSigners();

  const libraryFactory = await ethers.getContractFactory(
    libraryFactoryName,
    {
      signer: deployer,
    }
  );

  const library = await libraryFactory.deploy();

  return library.address;
}

export async function deployContract(data: ContractDeployParams) {
  const { useMultiSig, gnosisSafeAddress = '', gnosisSafeServiceURL = '', proxyAddress, contractFactory, useUUPS, libraries = [] } = data;

  const [ deployer ] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  console.log("Proxy Address:", proxyAddress);
  console.log("Contract Factory:", contractFactory);
  console.log("use MultiSig:", useMultiSig);
  if (useMultiSig) console.log("GnosisSafe Address:", gnosisSafeAddress);
  if (useMultiSig) console.log("GnosisSafe URL:", gnosisSafeServiceURL);
  console.log("Use UUPS:", useUUPS);
  console.log("Libraries:", libraries);

  ////////////////////// Admin must be check this settings before run the script ////////////////////////
  await keypress();

  // Contract factory param
  let factoryParam = {};
  let librariesParam: Record<string, string> = {};
  
  for (const library of libraries) {
    librariesParam[library.factory] = library.address;
  }

  if (libraries.length > 0) {
    factoryParam = {
      libraries: librariesParam,
    };
  }

  // Upgrade Param
  let upgradeParam = {
    unsafeAllow: [],
    unsafeAllowLinkedLibraries: !!libraries.length,
  };

  console.log('factoryParam', factoryParam)
  const ContractFactory = await ethers.getContractFactory(
    contractFactory,
    factoryParam
  );

  if (useMultiSig && false) {
    // const provider = new ethers.providers.JsonRpcProvider(
    //   // @ts-ignore
    //   network.config.url,
    //   // @ts-ignore
    //   {name: network.config.addressesSet, chainId: network.config.chainId!}
    // );

    // const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

    // // ---
    // console.log("- Upgrade -");
    // // ---

    // const contractImpl = await upgrades.prepareUpgrade(
    //   proxyAddress,
    //   ContractFactory,
    //   upgradeParam
    // );

    // console.log("Proxy:", proxyAddress);
    // console.log("New Implementation:", contractImpl);

    // if (useUUPS) {
    //   // Factory should be changed for the contract
    //   const ContractFactory = DForceLogic__factory.connect(
    //     proxyAddress,
    //     deployer
    //   );
    //   await multisig(
    //     gnosisSafeServiceURL,
    //     ContractFactory,
    //     "upgradeTo",
    //     [contractImpl],
    //     JSON.stringify(upgradeProxyAbi),
    //     signer
    //   );
    // } else {
    //   // await upgrades.admin.transferProxyAdminOwnership(gnosisSafeAddress);
    //   const proxyAdmin = (await upgrades.admin.getInstance()).address;
    //   const ProxyAdmin = ethers.ContractFactory.getContract(
    //     proxyAdmin,
    //     proxyAdminAbi,
    //     deployer
    //   );

    //   await multisig(
    //     gnosisSafeServiceURL,
    //     ProxyAdmin,
    //     "upgrade",
    //     [proxyAddress, contractImpl],
    //     JSON.stringify(proxyAdminAbi),
    //     signer
    //   );
    // }

    // // ---
    // console.log("- Verify contract -");
    // // ---
    // console.log("Sleeping for 1 seconds before verification...");
    // await sleep(1000);
    // console.log(">>>>>>>>>>>> Verification >>>>>>>>>>>>");
    // await verify(contractImpl);

    // // --- Disable automatic run for GnosisSafe ---
    // // secondConfirmTransaction(signer2);
    // // executeBatch(signer);
  } else {
    let proxy: any;

    if (!proxyAddress) {
      console.log("- Deploy Proxy -");

      proxy = await upgrades.deployProxy(
        ContractFactory,
        [],
        upgradeParam,
      );
      await proxy.deployed();
  
      const proxyImpl = await upgrades.erc1967.getImplementationAddress(
        proxy.address
      );
      console.log("Proxy:", proxy.address);
      console.log("Implementation:", proxyImpl);
    } else {
      console.log("- Upgrade Implementation -");

      proxy = await upgrades.upgradeProxy(
        proxyAddress,
        ContractFactory,
        upgradeParam
      );
      await proxy.deployed();
    }

    // ---
    console.log("- Verify contract -");
    // ---
    console.log("Sleeping for 1 seconds before verification...");
    await sleep(1000);
    console.log(">>>>>>>>>>>> Verification >>>>>>>>>>>>");
    await verify(proxy.address);
  }
}