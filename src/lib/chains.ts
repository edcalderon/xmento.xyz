import { celo, celoAlfajores } from 'viem/chains';

// Configure Celo chains with proper RPC URLs
export const celoMainnet = {
  ...celo,
  rpcUrls: {
    default: {
      http: ['https://forno.celo.org'],
      webSocket: ['wss://forno.celo.org/ws'],
    },
    public: {
      http: ['https://forno.celo.org'],
      webSocket: ['wss://forno.celo.org/ws'],
    },
  },
} as const;

export const celoTestnet = {
  ...celoAlfajores,
  rpcUrls: {
    default: {
      http: ['https://alfajores-forno.celo-testnet.org'],
      webSocket: ['wss://alfajores-forno.celo-testnet.org/ws'],
    },
    public: {
      http: ['https://alfajores-forno.celo-testnet.org'],
      webSocket: ['wss://alfajores-forno.celo-testnet.org/ws'],
    },
  },
} as const;

export const supportedChains = [celoMainnet, celoTestnet];
