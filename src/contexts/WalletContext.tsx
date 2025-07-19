"use client";

import { createContext, useContext, ReactNode } from "react";
import { useActiveAccount, useConnect, useDisconnect } from "thirdweb/react";
import { createWallet } from "thirdweb/wallets";

interface WalletContextType {
  account: any;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const account = useActiveAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  const handleConnect = () => {
    const wallet = createWallet("io.metamask");
    connect(async () => {
      await wallet.connect();
      return wallet;
    });
  };

  const value = {
    account,
    isConnected: !!account,
    connect: handleConnect,
    disconnect,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
