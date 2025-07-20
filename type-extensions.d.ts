import 'hardhat/types/config';
import type { HardhatEthersHelpers } from '@nomicfoundation/hardhat-ethers/types';

declare module 'hardhat/types/runtime' {
  export interface HardhatRuntimeEnvironment {
    ethers: typeof import('ethers') & HardhatEthersHelpers;
  }
}
