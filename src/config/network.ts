import { CHAIN_IDS } from '@/lib/wagmi.config';

// Define network ID type for type safety
export type NetworkID = 42220 | 44787; // Celo Mainnet and Alfajores Testnet IDs

export type Network = {
  id: NetworkID;
  name: string;
  isTestnet: boolean;
};

export const NETWORK_INFO: Record<number, Network> = {
  [CHAIN_IDS.CELO_MAINNET]: {
    id: CHAIN_IDS.CELO_MAINNET,
    name: 'Celo Mainnet',
    isTestnet: false,
  },
  [CHAIN_IDS.CELO_ALFAJORES]: {
    id: CHAIN_IDS.CELO_ALFAJORES,
    name: 'Celo Alfajores',
    isTestnet: true,
  },
};

export const SUPPORTED_CHAINS = [CHAIN_IDS.CELO_MAINNET, CHAIN_IDS.CELO_ALFAJORES];
