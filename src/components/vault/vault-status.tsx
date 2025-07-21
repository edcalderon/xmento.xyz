"use client";

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Button } from "@/components/ui/button";
import dynamic from 'next/dynamic';
import { ethers } from 'ethers';

// TypeScript declarations for browser globals
type BrowserWindow = Window & typeof globalThis & {
  ethereum?: any;
  localStorage: {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
  };
};

declare const window: BrowserWindow | undefined;

const DynamicWallet = dynamic(
  () => import('@/components/ui/wallet').then((mod) => mod.Wallet),
  { ssr: false }
);

interface VaultStatusProps {
  address: string | undefined;
}

export function VaultStatus({ address }: VaultStatusProps) {

  const [vaultAddress, setVaultAddress] = useState<string | null>(null);

  // Check for deployed vault using factory contract
  useEffect(() => {
    const checkDeployedVault = async () => {
      if (!address) {
        setVaultAddress(null);
        return;
      }

      // Check local storage first (only in browser environment)
      if (typeof window !== 'undefined' && window?.localStorage) {
        try {
          const savedVault = window.localStorage.getItem(`vault_${address}`);
          if (savedVault) {
            setVaultAddress(savedVault);
          }
        } catch (error) {
          console.error('Error accessing localStorage:', error);
        }
      }

      try {
        // Factory contract ABI - this should match your deployed contract
        const factoryABI = [
          'function getVaultAddress(address) view returns (address)',
          'function createVault() returns (address)'
        ] as const;
        
        // Get the provider from the window.ethereum object (browser only)
        if (typeof window === 'undefined' || !window?.ethereum) {
          console.warn('Ethereum provider not found');
          return;
        }

        const provider = new ethers.BrowserProvider((window as any).ethereum);
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
      }
    };

    checkDeployedVault();
  }, [address]);

  if (!address) {
    return <DynamicWallet />;
  }

  if (vaultAddress) {
    return (
      <div className="flex flex-col items-end">
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
