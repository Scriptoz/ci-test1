import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-contract-sizer";
import dotenv from 'dotenv';

dotenv.config();

const config: any = {
  solidity: "0.8.18",

  contractSizer: {
    alphaSort: true,
    runOnCompile: !!process.env.REPORT_CONTRACT_SIZE,
    disambiguatePaths: false,
  },

  networks: {
    bsc: {
      url: process.env.MAINNET_BSC_PROVIDER_URL,
      chainId: 56,
      gas: 2100000,
      accounts: [process.env.PRIVATE_KEY],
      addressesSet: "bsc",
    },
  },

  etherscan: {
    apiKey: process.env.ETHERSCAN_APIKEY,
  },

  typechain: {
    outDir: "typechain-types",
    target: "ethers-v5",
  },
};

export default config;
