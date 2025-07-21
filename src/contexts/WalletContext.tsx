"use client";

import { createContext, useContext, ReactNode, useCallback, useState, useEffect } from "react";
import { useAccount, useDisconnect as useWagmiDisconnect, useConnect } from "wagmi";
import { useDisconnect } from "@/hooks/useDisconnect";

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
  
  // Get wagmi hooks
  const { address, isConnected, chain } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { disconnect: wagmiDisconnect } = useWagmiDisconnect();
  const { disconnect: unifiedDisconnect } = useDisconnect();
  
  // Update account when wagmi state changes
  useEffect(() => {
    if (isConnected && address) {
      setAccount({
        address,
        chainId: chain?.id,
        isConnected: true,
        connectorName: 'MetaMask' // Default to MetaMask for now
      });
    } else {
      setAccount(null);
    }
  }, [isConnected, address, chain]);
  
  // Check if MetaMask is installed
  const isMetaMaskInstalled = typeof window !== 'undefined' && 
    typeof (window as any).ethereum !== 'undefined' && 
    (window as any).ethereum.isMetaMask;
  
  // Generate a session ID for tracking disconnections
  const [sessionId] = useState(() => {
    if (typeof window === 'undefined') {
      return Math.random().toString(36).substring(2);
    }
    
    const storedId = sessionStorage.getItem('sessionId') || 
                   localStorage.getItem('sessionId') || 
                   Math.random().toString(36).substring(2);
    
    try {
      sessionStorage.setItem('sessionId', storedId);
      localStorage.setItem('sessionId', storedId);
    } catch (e) {
      console.warn('Failed to store session ID:', e);
    }
    
    return storedId;
  });

  // Initialize wallet state on mount
  useEffect(() => {
    const initializeWallet = async () => {
      if (typeof window === 'undefined') return;
      
      // Check if we have a disconnection flag
      const disconnectedSessionId = sessionStorage.getItem('walletDisconnected');
      
      // If we have a disconnection flag from a previous session, don't auto-connect
      if (disconnectedSessionId === sessionId) {
        sessionStorage.removeItem('walletDisconnected');
        localStorage.removeItem('walletAddress');
        return;
      }
      
      // Check for stored wallet address
      const storedAddress = localStorage.getItem('walletAddress');
      if (storedAddress && !disconnectedSessionId) {
        setAccount({
          address: storedAddress,
          isConnected: false,
          connectorName: 'MetaMask'
        });
      }
    };
    
    initializeWallet();
  }, [sessionId]);
  
  // Connect wallet function
  const connect = useCallback(async () => {
    if (!isMetaMaskInstalled) {
      throw new Error('MetaMask is not installed');
    }
    
    setIsConnecting(true);
    setError(null);
    
    try {
      // Use wagmi's connect function
      const connector = connectors.find(c => c.id === 'metaMask');
      if (!connector) {
        throw new Error('MetaMask connector not found');
      }
      
      await connectAsync({ connector });
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError(error as Error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [isMetaMaskInstalled, connectAsync, connectors]);
  
  // Disconnect wallet function
  const disconnect = useCallback(async (): Promise<void> => {
    try {
      // First try the unified disconnect
      const success = await unifiedDisconnect({ showToast: true });
      
      // If unifiedDisconnect returns false, it means disconnection failed
      if (success === false) {
        throw new Error('Failed to disconnect wallet');
      }
      
      // Then ensure wagmi is disconnected
      wagmiDisconnect();
      
      // Clear local state
      setAccount(null);
      setError(null);
      
      // Clear stored wallet address
      if (typeof window !== 'undefined') {
        localStorage.removeItem('walletAddress');
      }
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      setError(error as Error);
      throw error;
    }
  }, [unifiedDisconnect, wagmiDisconnect, setError, setAccount]);
  
  // Provide the context value
  const contextValue: WalletContextType = {
    account,
    isConnected: !!account?.isConnected,
    connect,
    disconnect,
    isConnecting,
    error
  };
  
  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextType {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
