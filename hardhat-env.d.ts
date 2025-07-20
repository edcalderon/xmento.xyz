import "@nomicfoundation/hardhat-toolbox";
import { HardhatUserConfig } from "hardhat/config";

declare module "hardhat/types/config" {
  export interface HardhatUserConfig {
    // Your Hardhat configuration goes here
  }
}
