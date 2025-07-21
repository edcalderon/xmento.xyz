"use client";

import { createContext, useContext, ReactNode, useCallback, useState, useEffect } from "react";
import { useActiveAccount, useConnect, useDisconnect, useActiveWallet } from "thirdweb/react";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import { getContract } from "thirdweb";
import { ethereum } from "thirdweb/chains";

export interface WalletAccount {
  address: string;
  chainId?: number;
  isConnected: boolean;
  connectorName?: string;
}

export interface WalletContextType {
  account: WalletAccount | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isConnecting: boolean;
  error: Error | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<WalletAccount | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [wallet, setWallet] = useState<any>(null);
  
  // Initialize web3 and check if MetaMask is installed
  const isMetaMaskInstalled = typeof window !== 'undefined' && 
    typeof (window as any).ethereum !== 'undefined' && 
    (window as any).ethereum.isMetaMask;
  
  // Load stored wallet info on mount
  useEffect(() => {
    const initializeWallet = async () => {
      if (typeof window === 'undefined') return;
      
      const storedAddress = localStorage.getItem('walletAddress');
      if (storedAddress) {
        setAccount({
          address: storedAddress,
          isConnected: false,
          connectorName: 'MetaMask'
        });
      }
      
      // Check if already connected to MetaMask
      if (isMetaMaskInstalled && (window as any).ethereum.selectedAddress) {
        try {
          const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAccount({
              address: accounts[0],
              isConnected: true,
              connectorName: 'MetaMask',
              chainId: parseInt((window as any).ethereum.chainId, 16)
            });
          }
        } catch (err) {
          console.error('Failed to fetch accounts:', err);
        }
      }
    };
    
    initializeWallet();
    
    // Set up event listeners
    if (isMetaMaskInstalled) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // Disconnected
          setAccount(null);
          localStorage.removeItem('walletAddress');
        } else {
          setAccount(prev => ({
            ...prev!,
            address: accounts[0],
            isConnected: true
          }));
          localStorage.setItem('walletAddress', accounts[0]);
        }
      };
      
      const handleChainChanged = (chainId: string) => {
        setAccount(prev => ({
          ...prev!,
          chainId: parseInt(chainId, 16)
        }));
      };
      
      (window as any).ethereum.on('accountsChanged', handleAccountsChanged);
      (window as any).ethereum.on('chainChanged', handleChainChanged);
      
      return () => {
        (window as any).ethereum.removeListener('accountsChanged', handleAccountsChanged);
        (window as any).ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [isMetaMaskInstalled]);

  // Connect to MetaMask
  const connect = useCallback(async () => {
    // Prevent multiple connection attempts
    if (isConnecting) return;
    
    if (!isMetaMaskInstalled) {
      const error = new Error('MetaMask is not installed');
      setError(error);
      throw error;
    }
    
    // If already connected, just return
    if (account?.isConnected) {
      return;
    }
    
    setIsConnecting(true);
    setError(null);
    
    try {
      const ethereum = (window as any).ethereum;
      
      // Request account access
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }
      
      const chainId = await ethereum.request({ method: 'eth_chainId' });
      
      // Only update if we have a new account or different state
      if (!account || account.address !== accounts[0] || account.isConnected !== true) {
        const walletAccount: WalletAccount = {
          address: accounts[0],
          chainId: parseInt(chainId, 16),
          isConnected: true,
          connectorName: 'MetaMask'
        };
        
        setAccount(walletAccount);
        localStorage.setItem('walletAddress', accounts[0]);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to connect to MetaMask');
      setError(error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [isMetaMaskInstalled, isConnecting, account]);
  
  // Disconnect from MetaMask
  const disconnect = useCallback(async () => {
    try {
      // Clear account state first to prevent any UI glitches
      setAccount(null);
      
      // Clear all local storage data related to the wallet
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('vaults_') || key.startsWith('vault_') || key === 'walletAddress')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear any error state
      setError(null);
      
      // Use a simple approach to disconnect without triggering reconnection
      if (isMetaMaskInstalled && (window as any).ethereum?.removeAllListeners) {
        try {
          // Remove all event listeners to prevent reconnection
          (window as any).ethereum.removeAllListeners();
        } catch (err) {
          console.log('Error removing event listeners:', err);
        }
      }
      
      // Small delay before reload to ensure state is cleared
      setTimeout(() => {
        window.location.reload();
      }, 50);
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to disconnect');
      setError(error);
      console.error('Disconnect error:', error);
      throw error;
    }
  }, [isMetaMaskInstalled]);

  // Check if wallet is connected
  const isConnected = !!account?.isConnected;

  const value: WalletContextType = {
    account: account,
    isConnected,
    connect,
    disconnect: disconnect as () => Promise<void>,
    isConnecting,
    error,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextType {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
