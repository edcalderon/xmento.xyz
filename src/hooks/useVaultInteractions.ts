'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useAccount, useWriteContract, usePublicClient } from 'wagmi';
import { isAddress } from 'viem';
import { XmentoVaultFactoryABI } from '@/components/vault/XmentoVaultFactoryABI';
import { useToast } from '@/components/ui/use-toast';
import { useUserVaults } from './useUserVaults';
import { TokenSymbol, getCurrentNetworkAddresses } from '@/config/contracts';

type BrowserWindow = Window & typeof globalThis & {
  ethereum?: any;
};

declare const window: BrowserWindow | undefined;

export function useVaultInteractions() {
  const { address, chain } = useAccount();
  const chainId = chain?.id;
  const publicClient = usePublicClient();
  const { toast } = useToast();
  const [isCreatingVault, setIsCreatingVault] = useState<boolean>(false);
  const [selectedToken, setSelectedToken] = useState<TokenSymbol>('cUSD');
  const [vaultAddress, setVaultAddress] = useState<`0x${string}` | null>(null);
  const [isWrongNetwork, setIsWrongNetwork] = useState<boolean>(false);
  const [isManager, setIsManager] = useState<boolean>(false);
  const [newlyCreatedVault, setNewlyCreatedVault] = useState<`0x${string}` | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const lastAddressRef = useRef<string | null>(null);

  const {
    vaults: userVaults,
    isRefreshing: isLoadingVaults,
    refetch: refetchVaults,
    isInitialized: vaultsInitialized,
    lastFetched
  } = useUserVaults();

  // Update isInitialized when vaults are loaded
  useEffect(() => {
    if (vaultsInitialized) {
      console.log('[useVaultInteractions] Vaults initialized from blockchain');
      setIsInitialized(true);
    }
  }, [vaultsInitialized]);

  const currentNetworkAddresses = useMemo(() =>
    getCurrentNetworkAddresses(chainId),
    [chainId]
  );

  const VAULT_FACTORY_ADDRESS = currentNetworkAddresses?.factory;
  const { writeContract } = useWriteContract();

  // Set isClient to true on mount (client-side only)
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update manager status when address changes
  useEffect(() => {
    setIsManager(address?.toLowerCase() === process.env.NEXT_PUBLIC_MANAGER_ADDRESS?.toLowerCase());
  }, [address]);

  // Track the last toast ID to dismiss it later
  const toastRef = useRef<string | null>(null);

  // Update network status when chain changes
  useEffect(() => {
    if (chain) {
      const isAlfajores = chain.id === 44787; // Celo Alfajores chain ID
      const isWrong = !isAlfajores; // Only allow Alfajores for now
      setIsWrongNetwork(isWrong);

      if (isWrong) {

        toast({
          title: 'Unsupported Network',
          description: 'Please switch to Celo Alfajores Testnet',
          variant: 'destructive',
        });
      }
    }
  }, [chain]);

  // Helper function to validate Ethereum addresses
  const isValidEthAddress = useCallback((value: unknown): value is `0x${string}` => {
    return typeof value === 'string' && isAddress(value);
  }, []);

  // Clear vault data for a specific address (no longer using local storage)
  const clearVaultData = useCallback((address: string) => {
    // No-op since we're not using local storage anymore
    console.log(`[useVaultInteractions] Clearing vault data for ${address} (local storage disabled)`);
  }, []);

  // Update the ref when userVaults changes or when loading state changes
  useEffect(() => {
    if (!isClient) return;

    // Only proceed if we're not loading and vaults are initialized
    if (isLoadingVaults || !vaultsInitialized) return;

    if (userVaults.length > 0) {
      console.log('[useVaultInteractions] Received vaults from blockchain:', userVaults);
      
      // Store the first vault address as the last used
      lastAddressRef.current = userVaults[0];
      
      // If we have a newly created vault, prioritize selecting it
      if (newlyCreatedVault && userVaults.includes(newlyCreatedVault)) {
        console.log('[useVaultInteractions] Selecting newly created vault:', newlyCreatedVault);
        setVaultAddress(newlyCreatedVault);
        setNewlyCreatedVault(null);
        return;
      } 
      
      // If no vault is selected or the selected vault is not in the list, select the first one
      if (!vaultAddress || !userVaults.some(v => v.toLowerCase() === vaultAddress.toLowerCase())) {
        console.log('[useVaultInteractions] Selecting first vault from blockchain:', userVaults[0]);
        setVaultAddress(userVaults[0]);
      }
    } else if (vaultsInitialized) {
      console.log('[useVaultInteractions] No vaults found on blockchain after initialization');
      setVaultAddress(null);
    }
  }, [userVaults, isClient, address, newlyCreatedVault, vaultAddress, isLoadingVaults, vaultsInitialized]);

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

  // Load vaults from local storage only after blockchain fetch fails
  useEffect(() => {
    if (!isClient || !address) return;

    const loadFromLocalStorage = () => {
      try {
        const storedVaults = localStorage.getItem(`user_vaults_${address.toLowerCase()}`);
        if (storedVaults) {
          const parsedVaults = JSON.parse(storedVaults);
          if (Array.isArray(parsedVaults) && parsedVaults.length > 0) {
            // Only use local storage if we don't have any vaults from blockchain
            if (userVaults.length === 0) {
              console.log('[useVaultInteractions] Using vaults from local storage as fallback');
              setVaultAddress(parsedVaults[0]);
            }
          }
        }
      } catch (error) {
        console.error('Error loading vaults from local storage:', error);
      }
    };

    // If we have no vaults after loading, try local storage as fallback
    if (isInitialized && userVaults.length === 0) {
      loadFromLocalStorage();
    }
  }, [isClient, address, userVaults.length, isInitialized]);

  // Handle vault creation
  const handleCreateVault = useCallback(async () => {
    setIsCreatingVault(true);

    if (!address) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to create a vault.',
        variant: 'destructive',
      });
      return;
    }

    if (!publicClient || !VAULT_FACTORY_ADDRESS) {
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
            // Show a new toast for the transaction without action
            toast({
              title: 'Transaction Sent',
              description: 'Waiting for confirmation...',
            });

            // Refresh the vault list after a short delay
            setTimeout(() => {
              refetchVaults().catch(error => {
                console.error('Error refreshing vault list:', error);
              });
            }, 2000);
            resolve(hash);
          },
          onError: (error) => {
            console.error('Transaction error:', error);
            toast({
              title: 'Transaction Failed',
              description: error.message || 'Failed to send transaction',
              variant: 'destructive',
            });
            reject(error);
          },
        });
      });

      // Wait for transaction receipt
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: result,
        confirmations: 1,
      });

      // Check if the transaction was successful
      if (receipt.status === 'success') {
        // Find the vault created event
        const vaultCreatedEvent = receipt.logs.find(
          log =>
            log.topics[0] === '0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0' && // Transfer event
            log.topics[1]?.toLowerCase() === '0x0000000000000000000000000000000000000000000000000000000000000000' // from zero address
        );

        if (vaultCreatedEvent) {
          const vaultAddress = `0x${vaultCreatedEvent.topics[2]?.slice(-40)}`;
          if (isValidEthAddress(vaultAddress)) {
            setNewlyCreatedVault(vaultAddress);

            // Show success message with link to explorer
            toast({
              title: 'Vault Created',
              description: 'Your vault has been created successfully!',
              variant: 'default',
            });

            // Refresh vaults list
            await refetchVaults();
            return vaultAddress;
          }
        }

        throw new Error('Failed to extract vault address from transaction');
      } else {
        throw new Error('Transaction reverted');
      }
    } catch (error: any) {
      console.error('Error creating vault:', error);
      toast({
        title: 'Error Creating Vault',
        description: error.message || 'An error occurred while creating the vault',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsCreatingVault(false);
    }
  }, [address, chain, publicClient, VAULT_FACTORY_ADDRESS, writeContract, refetchVaults, toast, isValidEthAddress]);

  const handleTokenChange = useCallback((token: TokenSymbol) => {
    setSelectedToken(token);
  }, []);

  return {
    // State
    selectedToken,
    vaultAddress,
    isWrongNetwork,
    isManager,
    isCreatingVault,
    isLoadingVaults,
    userVaults,
    lastFetched,
    // Actions
    handleCreateVault,
    handleTokenChange,
    setVaultAddress,
    refetchVaults,
  };
}
