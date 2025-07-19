"use client";

import { useEffect, useState } from 'react';
import {
  Wallet as ComposerWallet,
  Avatar,
  Connect,
  Name,
} from "@composer-kit/ui/wallet";
import { useWallet } from "@/contexts/WalletContext";
import { Button } from "./button";

interface WalletProps {
  children?: React.ReactNode;
  className?: string;
  label?: React.ReactNode;
  onConnect?: () => void;
  isTruncated?: boolean;
}

export function Wallet({
  children,
  className = "",
  label = "Connect Wallet",
  onConnect,
  isTruncated = false,
}: WalletProps) {
  const [isMounted, setIsMounted] = useState(false);
  const { account, isConnected, connect, disconnect } = useWallet();

  // Only render on the client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleConnect = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
      onConnect?.();
    }
  };

  // Don't render anything on the server
  if (!isMounted) {
    return null;
  }

  return (
    <div
      className={`flex items-center justify-center bg-white dark:bg-black p-4 rounded-lg ${className}`}
    >
      {children ? (
        <ComposerWallet>{children}</ComposerWallet>
      ) : (
        <div className="flex items-center gap-4">
          <Button
            onClick={handleConnect}
            variant={isConnected ? "outline" : "default"}
          >
            {isConnected ? "Disconnect" : label}
          </Button>
          {isConnected && account && (
            <div className="flex items-center gap-2">
              <ComposerWallet>
                <Avatar />
                <Name isTruncated={isTruncated} />
              </ComposerWallet>
              <span className="text-sm text-muted-foreground">
                {account.address?.slice(0, 6)}...{account.address?.slice(-4)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export { ComposerWallet, Avatar, Connect, Name };
