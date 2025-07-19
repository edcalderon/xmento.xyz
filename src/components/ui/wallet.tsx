"use client";

import { useEffect, useState, useCallback } from 'react';
import { useWallet } from "@/contexts/WalletContext";
import { Button } from "./button";
import { Skeleton } from "./skeleton";
import { Check, Copy, Wallet2 } from "lucide-react";
import { toast } from "sonner";
import { WalletModal } from "@/components/wallet/wallet-modal";

// Mock types for the composer wallet components
const ComposerWallet = ({ children }: { children: React.ReactNode }) => (
  <div className="inline-flex items-center">{children}</div>
);

const Avatar = () => (
  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
    <Wallet2 className="h-3.5 w-3.5" />
  </div>
);

const Name = ({ isTruncated }: { isTruncated?: boolean }) => (
  <span className={isTruncated ? 'truncate' : ''}></span>
);

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
  const [copied, setCopied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { account, isConnected, connect, disconnect, isConnecting, error } = useWallet();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleConnect = useCallback(() => {
    if (isConnected) {
      // If already connected, show disconnect option
      return disconnect()
        .then(() => {
          toast.success("Wallet disconnected");
          onConnect?.();
        })
        .catch((error) => {
          console.error('Wallet disconnection error:', error);
          toast.error("Failed to disconnect wallet");
        });
    } else {
      // If not connected, open the wallet modal
      setIsModalOpen(true);
    }
  }, [isConnected, disconnect, onConnect]);

  // Handle errors from the wallet context
  useEffect(() => {
    if (error) {
      toast.error(error.message);
    }
  }, [error]);

  const copyAddress = useCallback(() => {
    if (!account?.address) return;
    
    navigator.clipboard.writeText(account.address);
    setCopied(true);
    toast.success("Address copied to clipboard");
    
    const timer = setTimeout(() => {
      setCopied(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [account?.address]);

  if (!isMounted) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-10 w-32" />
      </div>
    );
  }

  return (
    <>
      <div className={`flex items-center gap-2 ${className}`}>
        {isConnected && account && account.address ? (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={copyAddress}
            title="Copy wallet address"
          >
            <span className="hidden sm:inline">
              {account.address.slice(0, 6)}...{account.address.slice(-4)}
            </span>
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? "Disconnecting..." : "Disconnect"}
          </Button>
        </div>
      ) : (
        <Button
          onClick={handleConnect}
          disabled={isConnecting}
          className="gap-2"
        >
          <Wallet2 className="h-4 w-4" />
          {isConnecting ? "Connecting..." : label}
        </Button>
        )}
      </div>
      
      <WalletModal 
        isOpen={isModalOpen} 
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            // Reset any error states when modal is closed
            // The modal will handle its own error state reset
          }
        }} 
      />
    </>
  );
}

// Export the wallet components for use in other files
export { ComposerWallet, Avatar, Name };
