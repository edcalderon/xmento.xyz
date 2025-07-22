"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/contexts/WalletContext";
import { AlertCircle, Loader2, Wallet2, Smartphone, Monitor } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";


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

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal is closed
      setConnectionError(null);
    }
  }, [isOpen]);

  const handleMetaMaskConnect = async (event: React.MouseEvent<HTMLButtonElement>, useMobile: boolean = false) => {
    event.preventDefault();
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      // For mobile, open the MetaMask app directly
      if (useMobile) {
        const dappUrl = window.location.hostname;
        const metamaskAppDeepLink = `https://metamask.app.link/dapp/${dappUrl}`;
        window.open(metamaskAppDeepLink, '_blank');
        return; // Early return for mobile
      }
      
      // For web connection
      await connect();
      
      // Close the modal and show success
      onOpenChange(false);
      toast.success("Wallet connected successfully");
      if (onConnectSuccess) {
        onConnectSuccess();
      }  
      setIsConnecting(false);
    } catch (err) {
      console.error("Failed to connect wallet:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to connect to MetaMask";
      setConnectionError(errorMessage);
      setIsConnecting(false);
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

  const isMetaMaskInstalled = typeof window !== 'undefined' && 
    typeof (window as any).ethereum !== 'undefined' && 
    (window as any).ethereum.isMetaMask;
    
  // Check if we're on mobile and not in a WebView
  const isMobileDevice = (() => {
    if (typeof window === 'undefined') return false;
    
    // Check for mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Check if we're in a WebView (like in-app browsers)
    const isWebView = /(WebView|(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)|Android.*(wv|.0.0.0))/i.test(navigator.userAgent);
    
    return isMobile && !isWebView;
  })();

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
          {!isMetaMaskInstalled ? (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 text-center">
                <Wallet2 className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <h3 className="font-medium">MetaMask not detected</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  You'll need to install MetaMask to continue.
                </p>
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
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {/* Web Browser Option */}
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full justify-between px-6 py-6 h-auto"
                  onClick={(e) => handleMetaMaskConnect(e, false)}
                  disabled={isConnecting}
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src="https://images.ctfassets.net/clixtyxoaeas/4rnpEzy1ATWRKVBOLxZ1Fm/a74dc1eed36d23d7ea6030383a4d5163/MetaMask-icon-fox.svg" 
                      alt="MetaMask" 
                      className="h-8 w-8"
                    />
                    <div className="text-left">
                      <div className="font-medium">MetaMask Browser</div>
                      <div className="text-xs text-muted-foreground">Connect using MetaMask extension</div>
                    </div>
                  </div>
                  <Monitor className="h-5 w-5 text-muted-foreground" />
                </Button>

                {/* Mobile App Option - Only show on mobile devices */}
                {isMobileDevice && !isMetaMaskInstalled && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full justify-between px-6 py-6 h-auto"
                    onClick={(e) => handleMetaMaskConnect(e, true)}
                    disabled={isConnecting}
                  >
                    <div className="flex items-center gap-3">
                      <img 
                        src="https://images.ctfassets.net/clixtyxoaeas/4rnpEzy1ATWRKVBOLxZ1Fm/a74dc1eed36d23d7ea6030383a4d5163/MetaMask-icon-fox.svg" 
                        alt="MetaMask Mobile" 
                        className="h-8 w-8"
                      />
                      <div className="text-left">
                        <div className="font-medium">MetaMask Mobile</div>
                        <div className="text-xs text-muted-foreground">Open in MetaMask app</div>
                      </div>
                    </div>
                    <Smartphone className="h-5 w-5 text-muted-foreground" />
                  </Button>
                )}
              </div>
            </>
          )}
          
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
