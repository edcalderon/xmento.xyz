'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import React from 'react';
import { useAccount, useWriteContract, usePublicClient, useDisconnect } from 'wagmi';
import { useWallet } from '@/providers/wallet-provider';
import { isAddress } from 'viem';
import { XmentoVaultFactoryABI } from './XmentoVaultFactoryABI';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VaultView } from './vault-view';
import { AdminView } from './AdminView';
import { Card, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Wallet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VaultStatus } from './vault-status';
import { useUserVaults } from '@/hooks/useUserVaults';
import { VAULT_CREATED_TOPIC } from '@/config/contracts';

import {
  TokenSymbol,
  CONTRACT_ADDRESSES,
  DEFAULT_CHAIN,
} from '@/config/contracts';

type BrowserWindow = Window & typeof globalThis & {
  ethereum?: any;
  localStorage: {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
  };
};


declare const window: BrowserWindow | undefined;

export function VaultInteraction(): React.JSX.Element {
  const [selectedToken, setSelectedToken] = useState<TokenSymbol>('cUSD');
  const [vaultAddress, setVaultAddress] = useState<`0x${string}` | null>(null);
  const [isWrongNetwork, setIsWrongNetwork] = useState<boolean>(false);
  const [isManager, setIsManager] = useState<boolean>(false);
  const [isCreatingVault, setIsCreatingVault] = useState<boolean>(false);
  const { address, isConnected, chain } = useAccount();
  const chainId = chain?.id || DEFAULT_CHAIN;
  const { toast } = useToast();
  const publicClient = usePublicClient();
  
  // Track initial load state
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // Use the useUserVaults hook to manage vaults state
  const { 
    vaults: userVaults, 
    isInitialLoading,
    isRefreshing,
    refetch: refetchVaults 
  } = useUserVaults();
  
  // Track when initial load is complete
  useEffect(() => {
    if (!isInitialLoading && userVaults.length > 0) {
      setInitialLoadComplete(true);
    }
  }, [isInitialLoading, userVaults.length]);
  
  const currentNetworkAddresses = {
    ...(CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES] || CONTRACT_ADDRESSES[DEFAULT_CHAIN])
  };

  const VAULT_FACTORY_ADDRESS = currentNetworkAddresses.factory;
  const isSupportedNetwork = chainId in CONTRACT_ADDRESSES;

  useEffect(() => {
    setIsManager(address?.toLowerCase() === process.env.NEXT_PUBLIC_MANAGER_ADDRESS?.toLowerCase());
    // Remove any direct calls to setIsLoadingVaults since we're using isRefreshingVaults now
  }, [address]);

  useEffect(() => {
    if (chain) {
      const isWrong = !(chain.id in CONTRACT_ADDRESSES);
      setIsWrongNetwork(isWrong);

      if (isWrong) {
        toast({
          title: 'Unsupported Network',
          description: 'Please switch to Celo Mainnet or Alfajores Testnet',
          variant: 'destructive',
        });
      }
    }
  }, [chain, toast]);

  // Helper function to validate Ethereum addresses
  const isValidEthAddress = useCallback((value: unknown): value is `0x${string}` => {
    return typeof value === 'string' && isAddress(value);
  }, []);

  // Clear vault data for a specific address
  const clearVaultData = useCallback((address: string) => {
    if (typeof window === 'undefined') return;
    
    try {
      // Clear vault-related data from localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`vault_${address.toLowerCase()}`)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Error clearing vault data:', error);
    }
  }, []);

  const { disconnect: disconnectWallet } = useWallet();
  const { disconnect: disconnectWagmi } = useDisconnect();

  const handleDisconnect = useCallback(async () => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    try {
      // Clear all vault-related data from localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('vaults_') || key.startsWith('vault_'))) {
          keysToRemove.push(key);
        }
      }

      // Remove all the keys we found
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Disconnect from both wallet contexts
      await Promise.allSettled([
        disconnectWallet?.().catch(console.error),
        disconnectWagmi()
      ]);

      // Force a page refresh to ensure clean state
      setTimeout(() => {
        window.location.reload();
      }, 100);

    } catch (error) {
      console.error('Error during disconnect:', error);
      // Even if there's an error, try to force a refresh to ensure clean state
      window.location.reload();
    }
  }, [disconnectWallet, disconnectWagmi]);

  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        handleDisconnect();
      }
    };

    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }

    return () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  // Use a ref to track the last address without causing re-renders
  const lastAddressRef = React.useRef<string | null>(null);
  const [isClient, setIsClient] = React.useState(false);

  // Set isClient to true on mount (client-side only)
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Clear vault data for a specific address (moved to the top of the component)

  // Update the ref when userVaults changes
  React.useEffect(() => {
    if (isClient && userVaults.length > 0) {
      lastAddressRef.current = userVaults[0]?.split('_')[2] || null;
    }
  }, [userVaults, isClient]);

  // Handle address changes and cleanup
  useEffect(() => {
    if (!isClient) return;
    
    if (address) {
      const currentAddress = address;
      return () => {
        clearVaultData(currentAddress);
      };
    } else {
      setVaultAddress(null);
      if (lastAddressRef.current) {
        clearVaultData(lastAddressRef.current);
      }
    }
  }, [address, clearVaultData, isClient]);

  // Update selected vault when userVaults changes
  useEffect(() => {
    if (userVaults.length > 0) {
      // If no vault is selected or the selected vault is not in the list, select the first one
      if (!vaultAddress || !userVaults.includes(vaultAddress)) {
        // Ensure the first vault is a valid address before setting it
        const firstVault = userVaults[0];
        if (isValidEthAddress(firstVault)) {
          setVaultAddress(firstVault);
        }
      }
    } else {
      setVaultAddress(null);
    }
  }, [userVaults, vaultAddress, isValidEthAddress]);

  useEffect(() => {
    setIsWrongNetwork(!isSupportedNetwork);
  }, [isSupportedNetwork]);

  const handleTokenChange = (token: TokenSymbol) => {
    setSelectedToken(token);
  };

  // Get writeContract function from wagmi
  const { writeContract } = useWriteContract();

  // Handle vault creation
  const handleCreateVault = async () => {
    setIsCreatingVault(true);
    if (isCreatingVault) return; // Prevent multiple clicks
    // Loading state is now handled by the useUserVaults hook
    
    if (!address) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to create a vault.',
        variant: 'destructive',
      });
      return;
    }

    if (!publicClient) {
      toast({
        title: 'Network Error',
        description: 'Unable to connect to the network. Please try again later.',
        variant: 'destructive',
      });
      return;
    }

    // Show loading toast with loading state
    const loadingToast = toast({
      title: 'Creating Vault',
      description: 'Please wait while we create your vault...',
      variant: 'default',
    });

    const showExplorerLink = (hash: string, type: 'tx' | 'address') => {
      if (typeof window === 'undefined') return;
      const explorerUrl = chain?.blockExplorers?.default?.url || 'https://explorer.celo.org';
      window.open(`${explorerUrl}/${type}/${hash}`, '_blank', 'noopener,noreferrer');
    };

    try {
      // Track transaction state
      let transactionHash: string | null = null;

      // Execute the vault creation transaction
      const result = await new Promise<`0x${string}`>((resolve, reject) => {
        writeContract({
          address: VAULT_FACTORY_ADDRESS,
          abi: XmentoVaultFactoryABI,
          functionName: 'createVault',
          args: [],
          chainId,
        }, {
          onSuccess: (hash) => {
            transactionHash = hash;
            // Dismiss the loading toast
            loadingToast.dismiss();
            // Loading state is now handled by the useUserVaults hook

            // Show a new toast for the transaction without action
            toast({
              title: 'Transaction Sent',
              description: 'Waiting for confirmation...',
            });

            // Show explorer link in a new tab
            showExplorerLink(hash, 'tx');
            
            // Refresh the vault list after a short delay to ensure the blockchain has updated
            setTimeout(() => {
              refetchVaults().catch(error => {
                console.error('Error refreshing vault list:', error);
              });
            }, 2000);
            
            // Show success message after a short delay to allow for the transaction to be mined
            setTimeout(() => {
              toast({
                title: 'Vault Created',
                description: 'Your vault has been successfully created!',
                variant: 'default',
              });
            }, 3000);
            
            resolve(hash);
          },
          onError: (error: Error) => {
            console.error('Transaction error:', error);
            loadingToast.dismiss();
            // Loading state is now handled by the useUserVaults hook
            reject(new Error(`Transaction failed: ${error.message}`));
          }
        });
      });

      // Wait for transaction receipt with better error handling
      let receipt;
      try {
        receipt = await publicClient.waitForTransactionReceipt({
          hash: result,
          confirmations: 1,
          timeout: 120_000, // 2 minute timeout
          onReplaced: (replacement) => {
            console.log('Transaction replaced:', replacement);
            // Continue waiting for the replacement transaction
          },
        });
      } catch (receiptError) {
        console.error('Error waiting for transaction receipt:', receiptError);
        
        // Check if the error is due to block being out of range
        if (receiptError instanceof Error && 
            receiptError.message.includes('block is out of range')) {
          // If we can't get the receipt, try to confirm the transaction directly
          console.log('Block out of range, checking transaction status directly...');
          try {
            const tx = await publicClient.getTransaction({ hash: result });
            if (tx) {
              // If we can get the transaction, it was likely successful
              // but we can't confirm the receipt due to node sync issues
              console.log('Transaction found, assuming success:', tx);
              // Create a minimal receipt-like object
              receipt = {
                status: 'success',
                transactionHash: result,
                logs: []
              } as any; // Type assertion since we're creating a partial receipt
            } else {
              throw new Error('Transaction not found');
            }
          } catch (txError) {
            console.error('Error checking transaction status:', txError);
            throw new Error('Failed to confirm transaction status. Please check the blockchain explorer.');
          }
        } else {
          // Re-throw other errors
          throw receiptError;
        }
      }

      console.log('Transaction receipt:', receipt);
      
      // Check if transaction was successful
      // Handle different status formats from different providers
      const status = receipt.status as unknown;
      
      // Check if the transaction was reverted using type assertions
      const isReverted = (
        (typeof status === 'string' && (status === '0x0' || status === 'reverted')) ||
        (typeof status === 'number' && status === 0)
      );
      
      if (isReverted) {
        throw new Error('Transaction reverted. Please try again.');
      }

      // Define log type for better type safety
      type LogWithTopics = {
        topics: string[];
        [key: string]: any;
      };

      // Find the VaultCreatedV2 event
    
      
      // Type guard to check if log has topics
      const hasTopics = (log: unknown): log is LogWithTopics => {
        return Boolean(
          log && 
          typeof log === 'object' && 
          'topics' in log && 
          Array.isArray((log as LogWithTopics).topics)
        );
      };

      // Safely find the vault creation event
      const vaultCreatedEvent = (receipt.logs || []).find((log: unknown) => 
        hasTopics(log) && 
        log.topics[0] === VAULT_CREATED_TOPIC
      ) as LogWithTopics | undefined;

      if (!vaultCreatedEvent?.topics?.[1] || !vaultCreatedEvent?.topics?.[2]) {
        console.error('Vault creation event not found in transaction receipt. Logs:', receipt.logs);
        throw new Error('Vault creation event not found in transaction receipt');
      }

      // In V2, topics[1] is user address and topics[2] is vault address
      const newVaultAddress = `0x${vaultCreatedEvent.topics[2].slice(-40)}` as `0x${string}`;
      
      // Log the full event for debugging
      console.log('VaultCreatedV2 event:', {
        userAddress: `0x${vaultCreatedEvent.topics[1].slice(-40)}`,
        vaultAddress: newVaultAddress,
        rawTopics: vaultCreatedEvent.topics
      });

      // The new vault will be automatically added by the useUserVaults hook
      // Just update the selected vault and refresh the list
      setVaultAddress(newVaultAddress);
      refetchVaults?.();
      
      // Save to local storage as a fallback
      if (address) {
        const storageKey = `vaults_${chainId}_${address.toLowerCase()}`;
        try {
          const existingVaults = JSON.parse(localStorage.getItem(storageKey) || '[]');
          if (!existingVaults.includes(newVaultAddress)) {
            localStorage.setItem(storageKey, JSON.stringify([...existingVaults, newVaultAddress]));
          }
        } catch (error) {
          console.error('Failed to save vault to localStorage:', error);
        }
      }

      // Dismiss loading toast if it exists
      if (loadingToast && 'dismiss' in loadingToast) {
        loadingToast.dismiss();
      }

      // Show success toast with vault details
      toast({
        title: '🎉 Vault Created!',
        description: `Your new vault has been created at ${newVaultAddress.slice(0, 6)}...${newVaultAddress.slice(-4)}`,
        action: (
          <button
            onClick={() => showExplorerLink(newVaultAddress, 'address')}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            View Vault
          </button>
        ),
        duration: 10000, // Show for 10 seconds
      });

      // Auto-select the new vault
      setVaultAddress(newVaultAddress);
      // Loading state is managed by the useUserVaults hook

    } catch (error: unknown) {
      console.error('Vault creation error:', error);

      // Dismiss loading toast on error
      if ('dismiss' in loadingToast) {
        loadingToast.dismiss();
      }

      let errorMessage = 'Failed to create vault. Please try again.';
      let showReload = false;
      
      if (error instanceof Error) {
        if (error.message.includes('User rejected the request')) {
          errorMessage = 'Transaction was rejected by your wallet.';
        } else if (error.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for transaction.';
        } else if (error.message.includes('Transaction reverted')) {
          errorMessage = 'Transaction reverted on chain. Please try again.';
          showReload = true;
        } else if (error.message) {
          errorMessage = error.message;
        }
      }

      // Show error toast with reload option if needed
      toast({
        title: 'Error Creating Vault',
        description: errorMessage,
        variant: 'destructive',
        duration: 10000, // Show for 10 seconds
        action: showReload ? (
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.reload();
              }
            }}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 text-xs"
          >
            Reload Page
          </button>
        ) : undefined,
      });

      // Log full error for debugging
      if (process.env.NODE_ENV === 'development') {
        console.error('Full error details:', error);
      }
    } finally {
      setIsCreatingVault(false);
      // Loading state is now handled by the useUserVaults hook
    }
  };

  // Memoize the vault select handler to prevent unnecessary re-renders
  const handleVaultSelect = useCallback((vault: `0x${string}`) => {
    // Only update if the vault is different
    if (vaultAddress !== vault) {
      setVaultAddress(vault);
    }
  }, [vaultAddress]);

  // Vault selector component
  const VaultSelector = (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-medium">Your Vaults</h3>
          {isCreatingVault && (
           <><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> Processing...</>
          )}
        </div>
        <button
          onClick={handleCreateVault}
          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isCreatingVault}
        >
          {isCreatingVault ? (
            <span className="flex items-center">
              <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
              Processing...
            </span>
          ) : (
            '+ Create New Vault'
          )}
        </button>
      </div>
      
      <VaultStatus 
        key="vault-status"
        vaultAddress={vaultAddress} 
        onVaultSelect={handleVaultSelect} 
      />
    </div>
  );
  
  // Memoize the vault selector to prevent unnecessary re-renders
  const MemoizedVaultSelector = useMemo(
    () => VaultSelector,
    [isCreatingVault, vaultAddress, handleVaultSelect]
  );
  
  // Use userVaults instead of vaults to fix the lint error
  const hasVaults = userVaults.length > 0;

  // Show loading state only for initial load
  if (isInitialLoading && !hasVaults) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading your vaults...</span>
      </div>
    );
  }

  // Render different states based on connection and vault status
  if (!isConnected) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Wallet className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl">Connect Your Wallet</CardTitle>
          <CardDescription className="text-center">
            Connect your wallet to create or manage your Xmento Vault
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isWrongNetwork) {
    return (
      <Alert variant="destructive" className="max-w-md mx-auto">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Wrong Network</AlertTitle>
        <AlertDescription>
          Please switch to Celo Mainnet or Alfajores Testnet to use Xmento Vault.
        </AlertDescription>
      </Alert>
    );
  }

  // Show create vault prompt if no vaults exist and we're not loading
  if (userVaults.length === 0 && !isInitialLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Wallet className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Create Your First Vault</CardTitle>
          <CardDescription>
            Get started by creating a new vault to manage your assets
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            onClick={handleCreateVault}
            className="w-full"
            size="lg"
            disabled={isCreatingVault}
          > 
            {isCreatingVault ? (
             <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> 
            ) : (
              'Create New Vault'
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Show main vault interface
  return (
    <div className="space-y-6">
      <Tabs defaultValue="vault" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="vault">Vault</TabsTrigger>
          {isManager && <TabsTrigger value="admin">Admin</TabsTrigger>}
        </TabsList>

        <TabsContent value="vault" className="space-y-6">
          {VaultSelector}
          {vaultAddress && (
            <VaultView
              key={`vault-${vaultAddress}`}
              vaultAddress={vaultAddress}
              isManager={isManager}
              chainId={chainId}
              selectedToken={selectedToken}
              onTokenChange={handleTokenChange}
              isWrongNetwork={isWrongNetwork}
            />
          )}
        </TabsContent>

        {isManager && (
          <TabsContent value="admin" className="mt-6">
            <AdminView vaultAddress={vaultAddress} chainId={chainId} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
