import { CHAIN_IDS } from '@/lib/wagmi.config';
import { NetworkInfo } from '@/types/network';

export const NETWORK_INFO: Record<number, NetworkInfo> = {
  [CHAIN_IDS.CELO_MAINNET]: {
    id: CHAIN_IDS.CELO_MAINNET,
    name: 'Celo Mainnet',
    isTestnet: false, 
    icon: 'celo',
  },
  [CHAIN_IDS.CELO_ALFAJORES]: {
    id: CHAIN_IDS.CELO_ALFAJORES,
    name: 'Celo Alfajores',
    isTestnet: true,
    icon: 'celo',
  },
};

export const SUPPORTED_CHAINS = [CHAIN_IDS.CELO_MAINNET, CHAIN_IDS.CELO_ALFAJORES];
