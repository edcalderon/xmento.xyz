"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

// Utility function to detect mobile devices
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};
import { Loader2, Wallet2, Smartphone, Monitor, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useWallet } from "@/contexts/WalletContext";
import { isMobile } from "react-device-detect";

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
      // For mobile without MetaMask, open the app directly
      if (isMobile && !isMetaMaskInstalled) {
        const dappUrl = window.location.href;
        const metamaskAppDeepLink = `https://metamask.app.link/dapp/${dappUrl}`;
        window.open(metamaskAppDeepLink, '_blank');
        return;
      }
      
      // For web or mobile with MetaMask
      await connect();
      
      // Close the modal and show success
      onOpenChange(false);
      toast.success("Wallet connected successfully");
      if (onConnectSuccess) {
        onConnectSuccess();
      }
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

  // Check if we should show the mobile option (mobile browser without MetaMask)
  const showMobileOption = isMobile && !isMetaMaskInstalled;

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
                  onClick={handleMetaMaskConnect}
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
                {isMobileDevice() && !isMetaMaskInstalled && (
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
