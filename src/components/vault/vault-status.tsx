"use client";

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { ConnectWallet } from "@/components/wallet/connect-wallet";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

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
}

export function VaultStatus({ address }: VaultStatusProps) {
  const [vaultAddress, setVaultAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for deployed vault using factory contract
  useEffect(() => {
    const checkDeployedVault = async () => {
      setIsLoading(true);
      
      if (!address) {
        setVaultAddress(null);
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
        const factoryAddress = '0xYourVaultFactoryAddress' as `0x${string}`;
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
    return <ConnectWallet className="w-full sm:w-auto" showNetworkSwitcher={true} />;
  }

  // If loading, show a skeleton
  if (isLoading) {
    return (
      <div className="h-10 w-32 bg-muted rounded-md animate-pulse" />
    );
  }

  // If user has a vault, show the vault info
  if (vaultAddress) {
    const formattedAddress = `${vaultAddress.slice(0, 6)}...${vaultAddress.slice(-4)}`;
    
    const copyToClipboard = () => {
      navigator.clipboard.writeText(vaultAddress);
      toast.success('Vault address copied to clipboard');
    };
    
    const viewOnExplorer = () => {
      if (typeof window === 'undefined') return;
      const explorerUrl = `https://explorer.celo.org/alfajores/address/${vaultAddress}`;
      window.open(explorerUrl, '_blank');
    };
    
    return (
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Your Vault:</span>
          <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md">
            <span className="font-mono">{formattedAddress}</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={copyToClipboard}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={viewOnExplorer}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">Your Xmento Vault</div>
        <div className="font-mono text-sm">
          {`${vaultAddress.slice(0, 6)}...${vaultAddress.slice(-4)}`}
        </div>
      </div>
    );
  }

  const handleDeployVault = async () => {
    try {
      // TODO: Implement actual vault deployment logic
      // This is a placeholder - you'll need to implement the actual deployment
      const mockVaultAddress = `0x${'0'.repeat(40)}`; // Replace with actual deployment
      
      // Save to local storage for demo purposes
      localStorage.setItem(`vault_${address}`, mockVaultAddress);
      setVaultAddress(mockVaultAddress);
      
      console.log('Vault deployed at:', mockVaultAddress);
    } catch (error) {
      console.error('Failed to deploy vault:', error);
    }
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleDeployVault}
      className="whitespace-nowrap"
    >
      Deploy Xmento Vault
    </Button>
  );
}
