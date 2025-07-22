"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

import { Loader2, Wallet2, Smartphone, ExternalLink, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useWallet } from "@/contexts/WalletContext";
import { isMobile, isAndroid, isIOS } from "react-device-detect";

// Get the current host and protocol for deep linking
const getDappUrl = () => {
  if (typeof window === 'undefined') return '';
  return encodeURIComponent(window.location.href);
};

interface WalletModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConnectSuccess?: () => void;
}

export function WalletModal({ isOpen, onOpenChange, onConnectSuccess }: WalletModalProps) {
  const { connect, isConnecting: walletIsConnecting, error } = useWallet();
  const [isInstallingMetaMask, setIsInstallingMetaMask] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = typeof window !== 'undefined' &&
    typeof (window as any).ethereum !== 'undefined' &&
    (window as any).ethereum.isMetaMask;

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal is closed
      setConnectionError(null);
    }
  }, [isOpen]);

  const handleMetaMaskConnect = async (event: React.MouseEvent<HTMLButtonElement>, isMobileConnect: boolean = false) => {
    event.preventDefault();
    setIsConnecting(true);
    setConnectionError(null);

    try {
      // Handle mobile connection
      if (isMobileConnect || isMobile) {
        const dappUrl = getDappUrl();
        let deepLink = '';
        
        // Use the MetaMask universal link for mobile
        deepLink = `https://metamask.app.link/dapp/${dappUrl.replace(/^https?:\/\//, '')}`;
        
        // For WalletConnect, we need to use the connect flow directly
        if (!isMetaMaskInstalled) {
          // Open the deep link in a new tab on mobile
          window.open(deepLink, '_blank');
          
          // Also try to connect using WalletConnect
          await connect('walletConnect');
          
          // Close the modal and show success
          onOpenChange(false);
          toast.success("Please complete the connection in your wallet app");
          return;
        }
        
        // If MetaMask is installed on mobile, use the injected provider
        if (isMobile && isMetaMaskInstalled) {
          await connect('injected');
          onOpenChange(false);
          toast.success("Wallet connected successfully");
          if (onConnectSuccess) onConnectSuccess();
          return;
        }
        
        // Fallback for other mobile cases
        window.location.href = deepLink;
        return;
      }

      // For desktop with MetaMask installed
      if (isMetaMaskInstalled) {
        await connect('injected');
      } else {
        // If MetaMask is not installed, use WalletConnect
        await connect('walletConnect');
      }
      
      // Close the modal and show success
      onOpenChange(false);
      toast.success("Wallet connected successfully");
      if (onConnectSuccess) onConnectSuccess();
    } catch (err) {
      console.error("Failed to connect wallet:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to connect to MetaMask";
      setConnectionError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const installMetaMask = () => {
    setIsInstallingMetaMask(true);
    window.open('https://metamask.io/download.html', '_blank');
    // Reset the state after a delay
    setTimeout(() => setIsInstallingMetaMask(false), 3000);
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">Connect Wallet</DialogTitle>
          <DialogDescription className="text-center">
            Choose how you want to connect
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-4">
            {/* MetaMask Browser Extension Option */}
            {!isMobile && (
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src="https://images.ctfassets.net/clixtyxoaeas/4rnpEzy1ATWRKVBOLxZ1Fm/a74dc1eed36d23d7ea6030383a4d5163/MetaMask-icon-fox.svg"
                    alt="MetaMask"
                    className="h-8 w-8"
                  />
                  <div className="text-left">
                    <div className="font-medium">MetaMask Browser</div>
                    <div className="text-xs text-muted-foreground">Connect using your MetaMask extension</div>
                  </div>
                </div>
                {isMetaMaskInstalled ? (
                  <Button
                    onClick={handleMetaMaskConnect}
                    disabled={isConnecting}
                    className="w-full"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      'Connect with MetaMask'
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={installMetaMask}
                    disabled={isInstallingMetaMask}
                    className="w-full"
                  >
                    {isInstallingMetaMask ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Redirecting...
                      </>
                    ) : (
                      'Install MetaMask'
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* Mobile App Option - Only show on mobile devices */}
            {isMobile && (
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src="https://images.ctfassets.net/clixtyxoaeas/4rnpEzy1ATWRKVBOLxZ1Fm/a74dc1eed36d23d7ea6030383a4d5163/MetaMask-icon-fox.svg"
                    alt="MetaMask Mobile"
                    className="h-8 w-8"
                  />
                  <div className="text-left">
                    <div className="font-medium">MetaMask Mobile</div>
                    <div className="text-xs text-muted-foreground">
                      {isMetaMaskInstalled ? 'Connect with MetaMask app' : 'Open in MetaMask app'}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={(e) => handleMetaMaskConnect(e, true)}
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isMetaMaskInstalled ? 'Connecting...' : 'Opening...'}
                    </>
                  ) : (
                    <>
                      {isMetaMaskInstalled ? 'Connect' : 'Open MetaMask'}
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {connectionError && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {connectionError}
                  </h3>
                </div>
              </div>
            </div>
          )}

          <p className="text-xs text-center text-muted-foreground">
            By connecting a wallet, you agree to our Terms of Service and our Privacy Policy.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
