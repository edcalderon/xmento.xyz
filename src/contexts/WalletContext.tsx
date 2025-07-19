"use client";

import { createContext, useContext, ReactNode, useCallback } from "react";
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
  const [walletAddress, setWalletAddress] = useLocalStorage<string | null>('walletAddress', null);

  const handleConnect = useCallback(async () => {
    try {
      const wallet = createWallet("io.metamask");
      await connect(wallet);
      // Store the wallet address in localStorage when connected
      const account = wallet?.getAccount();
      if (account?.address) {
        setWalletAddress(account.address);
      }
    } catch (err) {
      console.error("Failed to connect wallet:", err);
      setWalletAddress(null);
      throw err;
    }
  }, [connect, setWalletAddress]);

  const handleDisconnect = useCallback(async () => {
    try {
      if (wallet) {
        await disconnect(wallet);
        setWalletAddress(null);
      }
    } catch (err) {
      console.error("Failed to disconnect wallet:", err);
      throw err;
    }
  }, [wallet, disconnect, setWalletAddress]);

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
