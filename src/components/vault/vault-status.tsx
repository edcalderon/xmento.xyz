"use client";

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { WalletConnectButton } from "@/components/wallet/wallet-connect-button";
import { Copy, ExternalLink } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { CONTRACT_ADDRESSES, DEFAULT_CHAIN } from "@/config/contracts";
import { useAccount } from "wagmi";
import { CHAIN_IDS } from '@/lib/wagmi.config';


// TypeScript declarations for browser globals
type BrowserWindow = Window & typeof globalThis & {
  ethereum?: any;
  localStorage: {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
  };
};

declare const window: BrowserWindow | undefined;

interface VaultStatusProps {
  address: string | undefined;
  exists?: boolean; // When true, skips the existence check
}


export function VaultStatus({ address, exists = false }: VaultStatusProps) {
  const [vaultAddress, setVaultAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { chain } = useAccount();
  const chainId = chain?.id || DEFAULT_CHAIN;

  // Skip existence check if we already know the vault exists
  useEffect(() => {
    const checkDeployedVault = async () => {
      setIsLoading(true);

      if (!address) {
        setVaultAddress(null);
        setIsLoading(false);
        return;
      }

      // If we know the vault exists, just use the address
      if (exists) {
        setVaultAddress(address);
        setIsLoading(false);
        return;
      }

      try {
        // Check local storage first (only in browser environment)
        if (typeof window !== 'undefined' && window?.localStorage) {
          try {
            const savedVault = window.localStorage.getItem(`vault_${address}`);
            if (savedVault) {
              setVaultAddress(savedVault);
              setIsLoading(false);
              return;
            }
          } catch (error) {
            console.error('Error accessing localStorage:', error);
          }
        }

        // Factory contract ABI - this should match your deployed contract
        const factoryABI = [
          'function getVaultAddress(address) view returns (address)',
          'function createVault() returns (address)'
        ] as const;

        // Get the provider from the window.ethereum object (browser only)
        if (typeof window === 'undefined' || !window?.ethereum) {
          console.warn('Ethereum provider not found');
          setIsLoading(false);
          return;
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        // Factory contract address - using the one from memory
        const factoryAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES].factory as `0x${string}`;
        const factory = new ethers.Contract(factoryAddress, factoryABI, signer);

        // Check if user already has a vault
        const vaultAddress = await factory.getVaultAddress(address);
        if (vaultAddress && vaultAddress !== ethers.ZeroAddress) {
          setVaultAddress(vaultAddress);
          // Save to local storage (browser only)
          if (typeof window !== 'undefined' && window?.localStorage) {
            try {
              window.localStorage.setItem(`vault_${address}`, vaultAddress);
            } catch (error) {
              console.error('Error saving to localStorage:', error);
            }
          }
        }
      } catch (error: any) {
        console.error('Error checking deployed vault:', error.message);
      } finally {
        setIsLoading(false);
      }
    };

    checkDeployedVault();
  }, [address]);

  // If no wallet is connected, show the connect wallet button with network switcher
  if (!address) {
    return <WalletConnectButton className="w-full sm:w-auto" showNetworkSwitcher={true} />;
  }

  // If loading, show a skeleton
  if (isLoading) {
    return (
      <div className="h-12 w-full bg-muted/50 rounded-lg animate-pulse" />
    );
  }

  // If user has a vault, show the vault info
  if (vaultAddress) {
    // TypeScript now knows vaultAddress is a string here
    const address = vaultAddress; // Create a new variable to help with type narrowing

    const copyToClipboard = (e: React.MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard.writeText(address);
      toast({ 
        title: 'Copied',
        description: 'Vault address copied to clipboard',
      });
    };

    const viewOnExplorer = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (typeof window === 'undefined') return;
      const explorerUrl = `https://${chain?.id === CHAIN_IDS.CELO_MAINNET ? 'celo' : 'celo-alfajores'}.blockscout.com/address/${vaultAddress}`;
      window.open(explorerUrl, '_blank', 'noopener,noreferrer');
    };

    const handleVaultClick = () => {
      // Handle vault selection if needed
      // This can be extended with additional click handlers
    };

    return (
      <div
        onClick={handleVaultClick}
        className={`flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer`}
      >
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-blue-500 mr-3"></div>
          <span className="font-mono">{`${address.slice(0, 6)}...${address.slice(-4)}`}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded-full">
            Active
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={copyToClipboard}
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy address</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={viewOnExplorer}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View on Celo Explorer</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    );
  }

  // User is connected but has no vault
  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 text-center">
      <div className="text-sm text-muted-foreground mb-4">
        No vault found for your wallet address
      </div>
      <div className="text-xs text-muted-foreground">
        Create a new vault to get started
      </div>
    </div>
  );
}
