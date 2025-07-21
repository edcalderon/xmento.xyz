import { createConfig, http } from 'wagmi';
import { injected, walletConnect } from 'wagmi/connectors';
import { celoMainnet, celoTestnet } from './chains';

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
