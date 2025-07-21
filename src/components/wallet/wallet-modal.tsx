"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/contexts/WalletContext";
import { AlertCircle, Loader2, Wallet2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface WalletModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConnectSuccess?: () => void;
}

export function WalletModal({ isOpen, onOpenChange, onConnectSuccess }: WalletModalProps) {
  const { connect, isConnecting, error } = useWallet();
  const [isInstallingMetaMask, setIsInstallingMetaMask] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal is closed
      setConnectionError(null);
    }
  }, [isOpen]);

  const handleMetaMaskConnect = async () => {
    try {
      setConnectionError(null);
      await connect();
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
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIwLjc1IDNIMy4yNUMxLjkxIDMgLjc1IDQuMTUuNzUgNS41VjE4LjVDLjc1IDE5Ljg1IDEuOTEgMjEgMy4yNSAyMUgyMGMxLjM4IDAgMi41LTEuMTIgMi41LTIuNVY1LjVDMjIuNSA0LjEyIDIxLjM4IDMgMjAgM1pNMTkuNSA3LjVIMTdWNS41QzE3IDQuOTUgMTcuNDUgNC41IDE4IDQuNUgxOUMxOS41NSA0LjUgMjAgNC45NSAyMCA1LjVWNy41SDIwLjVWMTEuNUgxNi43NUw2LjIgNi43NUw3LjI1IDQuMjVMMTkuNSAxMS4yNVY3LjVaTTE5LjUgMTYuNUgxNlYxOC41QzE2IDE5LjA1IDE1LjU1IDE5LjUgMTUgMTkuNUgxNEMxMy40NSAxOS41IDEzIDE5LjA1IDEzIDE4LjVWMTYuNUg0LjVWNy41SDdsLTMtM0g0VNS41QzQgNC42NyA0LjY3IDQgNS41IDRIMTguNUMxOS4zMyA0IDIwIDQuNjcgMjAgNS41VjE2LjVDMjAgMTcuMzMgMTkuMzMgMTggMTguNSAxOEgxN1YxNi41SDE5LjVaTTUuNSAxNS41SDEzVjE4SDUuNVYxNS41Wk0xNiAxMy41SDE5LjVWMTFIMTZWNi41SMTNWOUMxMyAxMC4xMyAxMy44OCAxMS4xMiAxNSAxMS4zN0wxNiAxMy41WiIgZmlsbD0iIEMxQzFDMCIvPgo8L3N2Zz4=';
                    }}
                  />
                  <span>MetaMask</span>
                </div>
                {isConnecting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <span className="text-xs opacity-50">Popular</span>
                )}
              </Button>
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
