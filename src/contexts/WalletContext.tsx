"use client";

import { createContext, useContext, ReactNode, useCallback, useState, useEffect } from "react";
import { useActiveAccount, useConnect, useDisconnect, useActiveWallet } from "thirdweb/react";
import { createWallet } from "thirdweb/wallets";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export interface WalletContextType {
  account: ReturnType<typeof useActiveAccount>;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isConnecting: boolean;
  error: Error | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { connect, isConnecting, error } = useConnect();
  const { disconnect } = useDisconnect();
  
  // Initialize with null and update in useEffect to handle SSR
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  
  useEffect(() => {
    // This code runs only on the client side
    const storedAddress = typeof window !== 'undefined' ? localStorage.getItem('walletAddress') : null;
    setWalletAddress(storedAddress);
  }, []);

  const handleConnect = useCallback(async () => {
    try {
      const wallet = createWallet("io.metamask");
      await connect(wallet);
      // Store the wallet address in localStorage when connected
      const account = wallet?.getAccount();
      if (account?.address) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('walletAddress', account.address);
        }
        setWalletAddress(account.address);
      }
    } catch (err) {
      console.error("Failed to connect wallet:", err);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('walletAddress');
      }
      setWalletAddress(null);
      throw err;
    }
  }, [connect]);

  const handleDisconnect = useCallback(async () => {
    try {
      if (wallet) {
        await disconnect(wallet);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('walletAddress');
        }
        setWalletAddress(null);
      }
    } catch (err) {
      console.error("Failed to disconnect wallet:", err);
      throw err;
    }
  }, [wallet, disconnect]);

  const value = {
    account,
    isConnected: !!account,
    connect: handleConnect,
    disconnect: handleDisconnect,
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
