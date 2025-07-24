import { keccak256, toHex } from 'viem';
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
    factory: process.env.NEXT_PUBLIC_CONTRACT_FACTORY_ADDRESS_MAINNET as `0x${string}` || '0x07678F40056AC0c7C664FDA0973E13D62c49E78A',
  },
  [celoAlfajores.id]: {
    factory: process.env.NEXT_PUBLIC_CONTRACT_FACTORY_ADDRESS as `0x${string}` || '0x07678F40056AC0c7C664FDA0973E13D62c49E78A',
  },
} as const;

// Default to Alfajores if not specified
export const DEFAULT_CHAIN = celoAlfajores.id;

export interface VaultInteractionProps {
  factoryAddress?: `0x${string}`;
}

export const VAULT_CREATED_TOPIC = keccak256(toHex('VaultCreatedV2(address,address,uint256)'));