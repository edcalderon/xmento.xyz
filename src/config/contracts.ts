import { mainnet } from 'viem/chains';
import { celoAlfajores } from 'viem/chains';

export const TOKENS = {
  cUSD: { name: 'Celo Dollar', symbol: 'cUSD', decimals: 18 },
  cEUR: { name: 'Celo Euro', symbol: 'cEUR', decimals: 18 },
  cREAL: { name: 'Celo Real', symbol: 'cREAL', decimals: 18 },
} as const;

export type TokenSymbol = keyof typeof TOKENS;

// Contract addresses by network
export const CONTRACT_ADDRESSES = {
  [mainnet.id]: {
    factory: '0xYourMainnetFactoryAddress' as `0x${string}`,
  },
  [celoAlfajores.id]: {
    factory: process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}` || '0x36eA57D1D52cd475aD6d842a18EDa975Eb88A31E',
  },
} as const;

// Default to Alfajores if not specified
export const DEFAULT_CHAIN = celoAlfajores.id;

export interface VaultInteractionProps {
  factoryAddress?: `0x${string}`;
}
