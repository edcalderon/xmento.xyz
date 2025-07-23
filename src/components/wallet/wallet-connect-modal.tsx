"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import React, { useEffect, useState } from "react";
import { Loader2, ExternalLink, AlertCircle, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useWallet } from "@/contexts/WalletContext";
import { isMobile } from "react-device-detect";

// Clean URL by ensuring it doesn't have duplicate protocols
const cleanUrl = (url: string, keepProtocol: boolean = false): string => {
  if (!url) return '';
  
  if (keepProtocol) {
    return url.replace(/^(https?:\/\/)(.*)/, (_, protocol, rest) => {
      return `${protocol}${rest.replace(/^\/+/, '')}`;
    });
  }
  
  return url
    .replace(/^https?:\/\//, '')
    .replace(/^\/\//, '')
    .replace(/^\/*/, '')
    .split('?')[0]
    .split('#')[0];
};

// Get the current host and protocol for deep linking
const getDappUrl = () => {
  if (typeof window === 'undefined') return '';
  return cleanUrl(window.location.origin, true);
};

interface WalletModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConnectSuccess?: () => void;
}

type ConnectionMethod = 'injected' | 'walletconnect' | 'browser' | null;

export function WalletConnectModal({ isOpen, onOpenChange, onConnectSuccess }: WalletModalProps) {
  const { connect } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionMethod, setConnectionMethod] = useState<ConnectionMethod>(null);
  const [isMobileBrowser, setIsMobileBrowser] = useState(false);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = typeof window !== 'undefined' &&
    typeof (window as any).ethereum !== 'undefined' &&
    (window as any).ethereum.isMetaMask;

  useEffect(() => {
    setIsMobileBrowser(isMobile && !(window as any).ethereum?.isMetaMask);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setConnectionError(null);
      setConnectionMethod(null);
    }
  }, [isOpen]);

  const handleConnect = async (method: ConnectionMethod) => {
    if (!method) return;
    
    setIsConnecting(true);
    setConnectionError(null);

    try {
      if (method === 'injected') {
        await connect('injected');
      } else if (method === 'walletconnect') {
        await connect('walletConnect');
      } else if (method === 'browser') {
        // Store the current URL to redirect back after connection
        const currentUrl = new URL(window.location.href);
        const cleanRedirectUrl = currentUrl.toString();
        
        // Store in session storage for after the redirect back from MetaMask
        sessionStorage.setItem('postAuthRedirect', cleanRedirectUrl);
        
        // Create a unique ID for this connection attempt
        const connectionId = `conn_${Date.now()}`;
        sessionStorage.setItem('connectionId', connectionId);
        
        // Create the deep link to MetaMask with redirect back to current page
        const dappUrl = getDappUrl();
        const deepLink = `https://metamask.app.link/dapp/${dappUrl}?redirect=${encodeURIComponent(cleanRedirectUrl)}`;
        
        // Open the deep link in a new tab
        window.open(deepLink, '_blank');
        
        // Set up a listener for when the user returns to the app
        const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible') {
            // Check if we have a connection in progress
            const storedConnectionId = sessionStorage.getItem('connectionId');
            if (storedConnectionId === connectionId) {
              // Clear the stored ID
              sessionStorage.removeItem('connectionId');
              
              // Try to connect with the injected provider
              setTimeout(async () => {
                try {
                  await connect('injected');
                  onOpenChange(false);
                  onConnectSuccess?.();
                } catch (err) {
                  console.error('Failed to connect after redirect:', err);
                  toast.error('Failed to connect after redirect. Please try again.');
                } finally {
                  setIsConnecting(false);
                }
              }, 1000); // Small delay to ensure the provider is injected
            }
            
            // Clean up the listener
            document.removeEventListener('visibilitychange', handleVisibilityChange);
          }
        };
        
        // Add the visibility change listener
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Also set a timeout in case the visibility change event doesn't fire
        setTimeout(() => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        }, 30000); // 30 second timeout
        
        toast.info('Opening MetaMask...');
        return;
      }
      
      onOpenChange(false);
      toast.success("Wallet connected successfully");
      onConnectSuccess?.();
    } catch (err: any) {
      console.error('Connection error:', err);
      const errorMessage = err.message || 'Failed to connect wallet';
      setConnectionError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsConnecting(false);
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
              onClick={() => handleConnect('injected')}
              disabled={isConnecting}
            >
              <span>MetaMask</span>
              {isConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          )}
          
          {connectionMethod === 'walletconnect' && (
            <Button
              className="w-full justify-between"
              onClick={() => handleConnect('walletconnect')}
              disabled={isConnecting}
            >
              <span>WalletConnect</span>
              {isConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          )}
          
          {connectionMethod === 'browser' && (
            <Button
              className="w-full justify-between"
              onClick={() => handleConnect('browser')}
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
