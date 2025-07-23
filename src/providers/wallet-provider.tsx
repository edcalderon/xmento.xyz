"use client";

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useWalletConnection, type ConnectionMethod } from '../hooks/useWalletConnection';

export interface WalletAccount {
  address: string | null;
  connector: {
    id: string;
    name: string;
    type: string;
    [key: string]: any;
  };
  chainId?: number;
  isConnected: boolean;
  isConnecting?: boolean;
  isReconnecting?: boolean;
  isDisconnected?: boolean;
  status?: 'connected' | 'disconnected' | 'connecting' | 'reconnecting';
  connectorName?: string;
}

export interface WalletContextType {
  account: WalletAccount | null;
  isConnected: boolean;
  connect: (method?: ConnectionMethod) => Promise<void>;
  disconnect: () => Promise<void>;
  isConnecting: boolean;
  error: Error | null;
  isMobileBrowser: boolean;
  isMetaMaskInstalled: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const {
    address,
    isConnected,
    isConnecting,
    error,
    isMobileBrowser,
    isMetaMaskInstalled,
    connect,
    disconnect,
  } = useWalletConnection();

  const account = useMemo<WalletAccount | null>(() => {
    if (!address) return null;
    
    return {
      address,
      connector: {
        id: 'metaMask',
        name: 'MetaMask',
        type: 'injected'
      },
      isConnected,
      connectorName: 'MetaMask',
      isConnecting: false,
      isDisconnected: false,
      isReconnecting: false,
      status: isConnected ? 'connected' : 'disconnected'
    };
  }, [address, isConnected]);

  const contextValue: WalletContextType = {
    account,
    isConnected,
    connect,
    disconnect,
    isConnecting,
    error,
    isMobileBrowser,
    isMetaMaskInstalled,
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