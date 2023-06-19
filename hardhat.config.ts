import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-contract-sizer";

const config: any = {
  solidity: "0.8.18",

  contractSizer: {
    alphaSort: true,
    runOnCompile: !!process.env.REPORT_CONTRACT_SIZE,
    disambiguatePaths: false,
  },
};

export default config;
