"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import React, { useEffect, useState } from "react";
import { Loader2, ExternalLink, AlertCircle, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useWallet } from "@/contexts/WalletContext";
import { isMobile } from "react-device-detect";

interface WalletModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConnectSuccess?: () => void;
}

export function WalletConnectModal({ isOpen, onOpenChange, onConnectSuccess }: WalletModalProps): JSX.Element {
  const { 
    handleConnect, 
    isConnecting, 
    connectionError, 
    isMobileBrowser,
    isMetaMaskInstalled 
  } = useWallet();
  const [connectionMethod, setConnectionMethod] = useState<'injected' | 'walletconnect' | 'browser' | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setConnectionMethod(null);
    }
  }, [isOpen]);

  const handleConnection = async (method: 'injected' | 'walletconnect' | 'browser') => {
    try {
      setConnectionMethod(method);
      await handleConnect(method === 'walletconnect' ? 'walletconnect' : method === 'injected' ? 'injected' : 'browser');
      onOpenChange(false);
      onConnectSuccess?.();
      toast.success("Wallet connected successfully");
    } catch (err) {
      console.error('Connection error:', err);
      // Error is already handled in the context
    }
  };

  const renderConnectionMethods = () => {
    if (connectionMethod) {
      return (
        <div className="space-y-4">
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={() => setConnectionMethod(null)}
            disabled={isConnecting}
          >
            <span>← Back</span>
          </Button>
          
          {connectionMethod === 'injected' && (
            <Button
              className="w-full justify-between"
              onClick={() => handleConnection('injected')}
              disabled={isConnecting}
            >
              <span>MetaMask</span>
              {isConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          )}
          
          {connectionMethod === 'walletconnect' && (
            <Button
              className="w-full justify-between"
              onClick={() => handleConnection('walletconnect')}
              disabled={isConnecting}
            >
              <span>WalletConnect</span>
              {isConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          )}
          
          {connectionMethod === 'browser' && (
            <Button
              className="w-full justify-between"
              onClick={() => handleConnection('browser')}
              disabled={isConnecting}
            >
              <span>Open in MetaMask Browser</span>
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <Button
          className="w-full justify-between"
          onClick={() => setConnectionMethod('injected')}
          disabled={isConnecting}
        >
          <span>Browser Wallet</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          className="w-full justify-between"
          onClick={() => setConnectionMethod('walletconnect')}
          disabled={isConnecting}
        >
          <span>WalletConnect</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        {isMobileBrowser && (
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={() => setConnectionMethod('browser')}
            disabled={isConnecting}
          >
            <span>Open in MetaMask</span>
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  };

  const installMetaMask = () => {
    window.open('https://metamask.io/download.html', '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
          <DialogDescription>
            {connectionMethod === 'browser' 
              ? 'Open the app to continue in MetaMask'
              : 'Choose how you want to connect'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {connectionError && (
            <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-md flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              {connectionError}
            </div>
          )}
          
          {renderConnectionMethods()}
          
          {isMobile && !isMobileBrowser && !isMetaMaskInstalled && (
            <div className="mt-4 text-xs text-muted-foreground text-center">
              <p>Don't have a wallet?</p>
              <Button 
                variant="link" 
                className="h-auto p-0 text-xs"
                onClick={installMetaMask}
                disabled={isConnecting}
              >
                Install MetaMask
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
