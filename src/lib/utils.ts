import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Chain } from "viem";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (!navigator?.clipboard) {
    console.warn('Clipboard API not available');
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy text to clipboard', error);
    return false;
  }
}

export const shortenAddress = (address: string) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};


export const handleViewOnExplorer = (vaultAddress: string, chain?: Chain) => {
  if (typeof window === 'undefined') return;

  const explorerUrl = chain?.blockExplorers?.default?.url || 'https://alfajores.celoscan.io';
  window.open(`${explorerUrl}/address/${vaultAddress}`, '_blank', 'noopener,noreferrer');
};  