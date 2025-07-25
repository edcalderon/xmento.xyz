import { http, createConfig } from 'wagmi';
import { injected, walletConnect, metaMask } from 'wagmi/connectors';
import { celo, celoAlfajores } from 'viem/chains';
import { NetworkInfo } from '@/types/network';

// Configure Celo chains with proper RPC URLs
const celoMainnet = {
  ...celo,
  rpcUrls: {
    default: { http: ['https://forno.celo.org'] },
    public: { http: ['https://forno.celo.org'] },
  },
} as const;

const celoTestnet = {
  ...celoAlfajores,
  rpcUrls: {
    default: { http: ['https://alfajores-forno.celo-testnet.org'] },
    public: { http: ['https://alfajores-forno.celo-testnet.org'] },
  },
} as const;

// Get project ID from environment variables
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

if (!projectId) {
  console.warn('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. WalletConnect will not work properly.');
}

export const config = createConfig({
  chains: [celoMainnet, celoTestnet],
  connectors: [
    injected({
      target: 'metaMask',
    }),
    walletConnect({
      projectId,
      showQrModal: true,
    }),
    metaMask(),
  ],
  ssr: true,
  transports: {
    [celoMainnet.id]: http(),
    [celoTestnet.id]: http(),
  },
});

// Export chain IDs for easy access
export const CHAIN_IDS = {
  CELO_MAINNET: celoMainnet.id,
  CELO_ALFAJORES: celoTestnet.id,
} as const;

export const DEFAULT_CHAIN = celoTestnet; // Default to testnet for development
export const SUPPORTED_CHAINS = [celoMainnet, celoTestnet];

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

export default config;