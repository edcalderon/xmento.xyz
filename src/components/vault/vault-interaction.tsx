'use client';

import { useState, useEffect, useCallback } from 'react';
import React from 'react';
import { useAccount, useReadContract, useWriteContract, usePublicClient, useDisconnect } from 'wagmi';
import { useWallet } from '@/contexts/WalletContext';
import { isAddress } from 'viem';
import { XmentoVaultFactoryABI } from './XmentoVaultFactoryABI';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VaultView } from './VaultView';
import { AdminView } from './AdminView';
import { Card, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VaultStatus } from './vault-status';

import {
  TokenSymbol,
  CONTRACT_ADDRESSES,
  DEFAULT_CHAIN,
  VaultInteractionProps
} from '@/config/contracts';

type BrowserWindow = Window & typeof globalThis & {
  ethereum?: any;
  localStorage: {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
  };
};


declare const window: BrowserWindow | undefined;

export function VaultInteraction({ factoryAddress }: VaultInteractionProps): React.JSX.Element {
  const [selectedToken, setSelectedToken] = useState<TokenSymbol>('cUSD');
  const [vaultAddress, setVaultAddress] = useState<`0x${string}` | null>(null);
  const [isWrongNetwork, setIsWrongNetwork] = useState<boolean>(false);
  const [isManager, setIsManager] = useState<boolean>(false);
  const [userVaults, setUserVaults] = useState<`0x${string}`[]>([]);
  const { address, isConnected, chain } = useAccount();
  const chainId = chain?.id || DEFAULT_CHAIN;
  const { toast } = useToast();
  const publicClient = usePublicClient();

  const currentNetworkAddresses = {
    ...(CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES] || CONTRACT_ADDRESSES[DEFAULT_CHAIN]),
    // Override factory address if provided via props
    ...(factoryAddress ? { factory: factoryAddress } : {}),
  };

  const VAULT_FACTORY_ADDRESS = currentNetworkAddresses.factory;
  const isSupportedNetwork = chainId in CONTRACT_ADDRESSES;

  useEffect(() => {
    setIsManager(address?.toLowerCase() === process.env.NEXT_PUBLIC_MANAGER_ADDRESS?.toLowerCase());
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

  const isValidEthAddress = useCallback((value: unknown): value is `0x${string}` => {
    return typeof value === 'string' && isAddress(value);
  }, []);
  const filterValidAddresses = useCallback((addresses: unknown[]): `0x${string}`[] => {
    return addresses.filter(isValidEthAddress);
  }, [isValidEthAddress]);

  const clearVaultData = useCallback((currentAddress: string) => {
    if (typeof window === 'undefined') return;

    try {
      const storageKey = `vaults_${chainId}_${currentAddress.toLowerCase()}`;
      window.localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Error clearing vault data:', error);
    }
  }, [chainId]);

  const { disconnect: disconnectWallet } = useWallet();
  const { disconnect: disconnectWagmi } = useDisconnect();

  const handleDisconnect = useCallback(async () => {
    try {
      setUserVaults([]);
      setVaultAddress(null);
      setIsManager(false);

      if (typeof window !== 'undefined' && window?.localStorage) {
        // Get all keys that start with vault_ or vaults_
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('vaults_') || key.startsWith('vault_'))) {
            keysToRemove.push(key);
          }
        }

        // Remove all the keys we found
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }

      // Disconnect from both wallet contexts
      await Promise.allSettled([
        disconnectWallet().catch(console.error),
        disconnectWagmi()
      ]);

      // Force a page refresh to ensure clean state
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }

    } catch (error) {
      console.error('Error during disconnect:', error);
      // Even if there's an error, try to force a refresh to ensure clean state
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }
  }, [setUserVaults, setVaultAddress, setIsManager, disconnectWallet, disconnectWagmi]);

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

  // Update the ref when userVaults changes
  React.useEffect(() => {
    if (userVaults.length > 0) {
      lastAddressRef.current = userVaults[0]?.split('_')[2] || null;
    }
  }, [userVaults]);

  useEffect(() => {
    if (address) {
      const currentAddress = address;
      return () => {
        clearVaultData(currentAddress);
      };
    } else {
      setUserVaults([]);
      setVaultAddress(null);

      // Use the ref instead of directly accessing userVaults
      if (lastAddressRef.current) {
        clearVaultData(lastAddressRef.current);
      }
    }
  }, [address, clearVaultData]); // Removed userVaults from dependencies

  const { data: userVaultAddress } = useReadContract({
    address: currentNetworkAddresses.factory,
    abi: XmentoVaultFactoryABI,
    functionName: 'userToVault',
    args: [address as `0x${string}`],
    chainId,
    query: {
      enabled: !!address && isSupportedNetwork,
    },
  });

  useEffect(() => {
    const loadVaults = () => {
      if (!address || !isConnected || !isSupportedNetwork) {
        setUserVaults([]);
        setVaultAddress(null);
        return;
      }

      if (typeof window !== 'undefined') {
        const win = window as BrowserWindow;
        const storageKey = `vaults_${chainId}_${address.toLowerCase()}`;
        try {
          const savedVaults = win?.localStorage.getItem(storageKey);
          let vaults: `0x${string}`[] = [];

          try {
            // Parse and validate saved vaults
            const parsedVaults = savedVaults ? JSON.parse(savedVaults) : [];
            vaults = Array.isArray(parsedVaults) ? filterValidAddresses(parsedVaults) : [];

            // Validate and add the current vault from the chain if it exists and is valid
            if (isValidEthAddress(userVaultAddress) &&
              userVaultAddress !== '0x0000000000000000000000000000000000000000' &&
              !vaults.includes(userVaultAddress)) {
              const updatedVaults = [...vaults, userVaultAddress];
              win?.localStorage.setItem(storageKey, JSON.stringify(updatedVaults));
              vaults = updatedVaults;

              if (!vaultAddress) {
                setVaultAddress(userVaultAddress);
              }
            }

            // Update state with validated vaults
            setUserVaults(vaults);

            // Set the first valid vault if none is selected
            if (vaults.length > 0 && !vaultAddress) {
              setVaultAddress(vaults[0]);
            }
          } catch (error) {
            console.error('Error processing vaults:', error);
            // If there's an error, reset to empty array but keep the current vault if valid
            setUserVaults([]);
            win?.localStorage.removeItem(storageKey);
          }
        } catch (error) {
          console.error('Error loading vaults from storage:', error);
          setUserVaults([]);
          setVaultAddress(null);
        }
      }
    };

    loadVaults();
  }, [address, chainId, userVaultAddress, isSupportedNetwork, isConnected]);

  // Handle token change
  const handleTokenChange = (token: TokenSymbol) => {
    setSelectedToken(token);
  };

  // Get writeContract function from wagmi
  const { writeContract } = useWriteContract();

  // Add a new vault to the user's vault list with type safety
  const addVault = (vaultAddress: unknown) => {
    if (!address || !isValidEthAddress(vaultAddress)) {
      console.error('Invalid vault address or user not connected');
      return;
    }

    const validVaultAddress = vaultAddress as `0x${string}`;

    setUserVaults(prevVaults => {
      // Check if vault already exists
      if (prevVaults.includes(validVaultAddress)) {
        return prevVaults;
      }

      const newVaults = [...prevVaults, validVaultAddress];

      // Save to local storage
      if (typeof window !== 'undefined') {
        const win = window as BrowserWindow;
        const storageKey = `vaults_${chainId}_${address.toLowerCase()}`;
        try {
          win?.localStorage.setItem(storageKey, JSON.stringify(newVaults));
        } catch (error) {
          console.error('Failed to save vault to localStorage:', error);
        }
      }

      return newVaults;
    });

    setVaultAddress(validVaultAddress);
  };

  // Handle vault creation
  const handleCreateVault = async () => {
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

            // Show a new toast for the transaction without action
            toast({
              title: 'Transaction Sent',
              description: 'Waiting for confirmation...',
            });

            // Show explorer link in a new tab
            showExplorerLink(hash, 'tx');
            resolve(hash);
          },
          onError: (error: Error) => {
            console.error('Transaction error:', error);
            reject(new Error(`Transaction failed: ${error.message}`));
          }
        });
      });

      // Wait for transaction receipt with timeout
      const receipt = await Promise.race([
        publicClient.waitForTransactionReceipt({
          hash: result,
          confirmations: 1,
          timeout: 120_000 // 2 minute timeout
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Transaction timeout. Please check the blockchain explorer for updates.')), 120_000)
        )
      ]);

      // Check if transaction was successful
      if (receipt.status === 'reverted') {
        throw new Error('Transaction reverted. Please try again.');
      }

      // Find the VaultCreated event
      const vaultCreatedEvent = receipt.logs.find(
        (log) => log.topics[0] === '0xb8b2c1a2c2310fce50d68d9a9c3999094974e5892513643ce5d0bd72058f0305' // keccak256('VaultCreated(address,address)')
      );

      if (!vaultCreatedEvent?.topics?.[2]) {
        throw new Error('Vault creation event not found in transaction receipt');
      }

      const topic = vaultCreatedEvent.topics[2];
      const newVaultAddress = `0x${topic.slice(-40)}` as `0x${string}`;

      // Add the new vault to the user's vaults
      addVault(newVaultAddress);

      // Dismiss loading toast
      if ('dismiss' in loadingToast) {
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

    } catch (error: unknown) {
      console.error('Vault creation error:', error);

      // Dismiss loading toast on error
      if ('dismiss' in loadingToast) {
        loadingToast.dismiss();
      }

      let errorMessage = 'Failed to create vault. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('User rejected the request')) {
          errorMessage = 'Transaction was rejected by your wallet.';
        } else if (error.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for transaction.';
        } else if (error.message) {
          errorMessage = error.message;
        }
      }

      // Show error toast
      toast({
        title: 'Error Creating Vault',
        description: errorMessage,
        variant: 'destructive',
        duration: 10000, // Show for 10 seconds
      });

      // Log full error for debugging
      if (process.env.NODE_ENV === 'development') {
        console.error('Full error details:', error);
      }
    }
  };

  // Format vault address for display
  const formatVaultAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Handle vault selection
  const handleVaultSelect = (vault: `0x${string}`) => {
    setVaultAddress(vault);
  };

  // Vault selector component
  const VaultSelector = () => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium">Your Vaults</h3>
        <button
          onClick={handleCreateVault}
          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          + Create New Vault
        </button>
      </div>
      
      {userVaults.length > 0 ? (
        <div className="space-y-2">
          {userVaults.map((vault) => (
            <div 
              key={vault}
              onClick={() => handleVaultSelect(vault)}
              className={`transition-all duration-200 ${
                vaultAddress === vault 
                  ? 'ring-2 ring-blue-500 rounded-lg' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg'
              }`}
            >
              <VaultStatus address={vault} exists={true} />
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 text-center text-muted-foreground border border-dashed rounded-lg">
          No vaults found. Create your first vault to get started.
        </div>
      )}
    </div>
  );

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

  // Show create vault prompt if no vaults exist
  if (userVaults.length === 0) {
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
          >
            Create New Vault
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
          <VaultSelector />
          {vaultAddress && (
            <VaultView
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
