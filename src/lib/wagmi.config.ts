import { http, createConfig } from 'wagmi';
import { celoMainnet, celoTestnet } from './chains';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  walletConnectWallet,
  metaMaskWallet,
} from '@rainbow-me/rainbowkit/wallets';

// Get project ID from environment variables
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

// Warn if project ID is not set
if (!projectId && typeof window !== 'undefined') {
  console.warn('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. WalletConnect will not work properly.');
}

// Configure wallets
const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [
        walletConnectWallet,
        metaMaskWallet
      ],
    },
  ],
  {
    appName: 'Xmento',
    projectId: projectId,
  }
);


// Configure chains
const chains = [celoMainnet, celoTestnet] as const;

// Create wagmi config with the configured connectors
export const config = createConfig({
  chains,
  ssr: true,
  transports: {
    [celoMainnet.id]: http(),
    [celoTestnet.id]: http(),
  },
  batch: {
    multicall: {
      wait: 16,
    },
  },
  connectors
});

// Export chain IDs for easy access
export const CHAIN_IDS = {
  CELO_MAINNET: celoMainnet.id,
  CELO_ALFAJORES: celoTestnet.id,
} as const;

export const DEFAULT_CHAIN = celoTestnet; // Default to testnet for development


export default config;
