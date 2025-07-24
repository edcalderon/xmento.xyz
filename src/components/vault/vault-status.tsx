"use client";

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { WalletConnectButton } from "@/components/wallet/wallet-connect-button";
import { Copy, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useUserVaults } from '@/hooks/useUserVaults';
import { useAccount } from 'wagmi';
import { useToast } from "@/components/ui/use-toast";
import { CONTRACT_ADDRESSES, DEFAULT_CHAIN } from "@/config/contracts";
import { XmentoVaultFactoryABI as factoryABI } from './XmentoVaultFactoryABI';
import { handleViewOnExplorer } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useIsMobile';

interface VaultStatusProps {
  vaultAddress?: `0x${string}` | null;
  onVaultSelect?: (vault: `0x${string}`) => void;
  isMobileBrowser?: boolean;
}

export function VaultStatus({ vaultAddress, onVaultSelect, isMobileBrowser = false }: VaultStatusProps) {
  const { address } = useAccount();
  const { vaults, isInitialLoading, isRefreshing, lastFetched, refetch } = useUserVaults();
  const [isCreatingVault, setIsCreatingVault] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();
  const { chain } = useAccount();
  const chainId = chain?.id || DEFAULT_CHAIN;
  
  // Ensure we have isMobileBrowser value
  const isMobileBrowserState = useIsMobile();
  const finalIsMobileBrowser = isMobileBrowser || isMobileBrowserState;
  
  // Only show loading state for initial load or explicit user refresh
  // Don't show loading state during background refreshes or vault switching
  const isLoading = isInitialLoading || (isRefreshing && !isClient);
  
  // Set client flag on mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleRefreshVaults = async () => {
    try {
      await refetch();
    } catch (error) {
      console.error('Error refreshing vaults:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh vaults. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle vault creation
  const handleCreateVault = async () => {
    if (!window.ethereum || !address || !chainId) return;

    setIsCreatingVault(true);
    let tx: ethers.TransactionResponse | null = null;
    const TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

    try {
      // Show preparing transaction state
      toast({
        title: 'Preparing Transaction',
        description: 'Please wait while we prepare your vault creation...',
        duration: 10000,
      });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const factoryAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.factory as `0x${string}`;
      if (!factoryAddress) {
        throw new Error('Factory address not found for current network');
      }

      const factory = new ethers.Contract(factoryAddress, factoryABI, signer);

      // Show wallet confirmation state
      toast({
        title: 'Confirm in Wallet',
        description: 'Please confirm the transaction in your wallet to create the vault',
        duration: 60000, // 1 minute for user to confirm
      });

      // Start transaction with timeout
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Transaction timed out. Please try again.')), TIMEOUT_MS)
      );

      // Execute transaction
      tx = await Promise.race([
        factory.createVault(),
        timeoutPromise
      ]) as ethers.TransactionResponse;

      // Show transaction submitted state
      toast({
        title: 'Transaction Submitted',
        description: 'Your vault creation is being processed...',
        duration: 10000,
      });

      // Wait for transaction confirmation
      await tx.wait();

      // Force refresh vaults after confirmation with a small delay
      // to ensure the blockchain has the latest state
      await new Promise(resolve => setTimeout(resolve, 2000));
      await refetch();

      // Show success message
      const explorerUrl = tx?.hash ?
        `${chain?.blockExplorers?.default?.url || 'https://alfajores.celoscan.io'}/tx/${tx.hash}` :
        '';

      toast({
        title: '✅ Vault Created Successfully!',
        description: (
          <div className="flex flex-col gap-2">
            <p>Your new vault has been created.</p>
            {explorerUrl && (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-sm text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                View on Explorer <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            )}
          </div>
        ),
        duration: 10000,
      });

    } catch (error: any) {
      console.error('Error creating vault:', error);

      // Handle specific error cases
      let errorMessage = 'Failed to create vault';

      // Show error toast
      toast({
        title: 'Error creating vault',
        description: error instanceof Error ? error.message : 'Failed to create vault',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingVault(false);
    }
  };

  // Refresh vaults when address or chain changes
  useEffect(() => {
    if (!isClient) return;

    refetch();

    // Set up polling with mobile-specific interval
    const pollingInterval = finalIsMobileBrowser ? 15000 : 30000; // 15 seconds on mobile, 30 seconds on desktop
    const interval = setInterval(refetch, pollingInterval);
    return () => clearInterval(interval);
  }, [refetch, isClient, isMobileBrowser]);

  // Set isClient on mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle copy to clipboard
  const handleCopyAddress = (vaultAddress: string) => {
    if (typeof window === 'undefined') return;

    navigator.clipboard.writeText(vaultAddress);
    toast({
      title: 'Copied!',
      description: 'Vault address copied to clipboard',
    });
  };

  // Loading state - show spinner during initial load and polling
  if (isLoading || isRefreshing) {
    return (
      <div className="p-4 border rounded-lg bg-muted/50">
        <div className="flex flex-col items-center justify-center gap-2 p-4">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm text-muted-foreground">
            {isLoading && vaults.length === 0 ? 'Loading vaults...' : 'Refreshing vaults...'}
          </span>
          {isRefreshing && (
            <span className="text-xs text-muted-foreground">
              Last updated {lastFetched ? new Date(lastFetched).toLocaleTimeString() : 'never'}
            </span>
          )}
        </div>
      </div>
    );
  
  }

  // No vaults found
  if (vaults.length === 0) {
    return (
      <div className="p-4 text-center border rounded-lg bg-muted/50">
        <p className="mb-4 text-sm text-muted-foreground">
          No vaults found for your wallet
        </p>
        <div className="relative">
          <button
            onClick={handleCreateVault}
            disabled={isCreatingVault}
            className={`px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 transition-all duration-200 ${isCreatingVault ? 'pr-10' : ''
              } disabled:opacity-70 disabled:cursor-not-allowed`}
          >
            {isCreatingVault ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Vault'
            )}
          </button>
        </div>
      </div>
    );
  }

  // Show vaults list
  return (
    <div className="space-y-4">
      <TooltipProvider>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium">Your Vaults</h3>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshVaults}
                disabled={isRefreshing}
                className="h-8 w-8 p-0"
              >
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="sr-only">Refresh</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refresh vault list</TooltipContent>
          </Tooltip>
        </div>

        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
          {vaults.map((vault) => {
            const displayAddress = `${vault.slice(0, 6)}...${vault.slice(-4)}`;
            return (
              <div
                key={vault}
                onClick={() => onVaultSelect?.(vault)}
                className={`flex items-center justify-between p-3 border rounded-lg transition-colors cursor-pointer ${vaultAddress === vault
                  ? 'border-primary ring-2 ring-primary/20 bg-accent/50'
                  : 'border-border bg-card hover:bg-accent/30'
                  }`}
              >

                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="font-mono text-sm cursor-default">
                        {displayAddress}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-mono text-xs">{vault}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex space-x-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(vault);
                          toast({
                            title: 'Copied!',
                            description: 'Vault address copied to clipboard',
                          });
                        }}
                        className="p-1.5 rounded-md hover:bg-muted"
                        aria-label="Copy address"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Copy address</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewOnExplorer(vault, chain);
                        }}
                        className="p-1.5 rounded-md hover:bg-muted"
                        aria-label="View on explorer"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>View on explorer</TooltipContent>
                  </Tooltip>
                </div>

              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-sm text-muted-foreground">
            {vaults.length} Vault{vaults.length !== 1 ? 's' : ''} found
          </div>
          <div className="text-xs text-muted-foreground">
            {lastFetched ? `Last updated: ${new Date(lastFetched).toLocaleTimeString()}` : 'Never updated'}
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
}
