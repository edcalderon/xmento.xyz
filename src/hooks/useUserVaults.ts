import { useState, useCallback, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { useToast } from '@/components/ui/use-toast';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { XmentoVaultFactoryV2ABI } from '@/components/vault/XmentoVaultFactoryV2ABI';

type UseUserVaultsReturn = {
  vaults: `0x${string}`[];
  isLoading: boolean;
  isRefreshing: boolean;
  isInitialized: boolean;
  setIsRefreshing: (value: boolean) => void;
  lastFetched: number | null;
  refetch: (force?: boolean, isBackground?: boolean) => Promise<void>;
  error: Error | null;
};

export function useUserVaults(): UseUserVaultsReturn {
  const { address, chain } = useAccount();
  const chainId = chain?.id;
  const { toast } = useToast();
  const [vaults, setVaults] = useState<`0x${string}`[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [lastFetchError, setLastFetchError] = useState<Error | null>(null);

  // Use refs to track the latest values without causing re-renders
  const vaultsRef = useRef(vaults);

  // Update ref when vaults change
  useEffect(() => {
    vaultsRef.current = vaults;
  }, [vaults]);

  // Check network connectivity
  const checkNetworkStatus = useCallback(async () => {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error('No internet connection');
      }
      return true;
    } catch (error) {
      console.error('[useUserVaults] Network error:', error);
      throw error;
    }
  }, []);

  const fetchVaults = useCallback(async (force = false, isBackground = false) => {
    // Skip if already in progress unless forced
    if (isLoading && !force) {
      console.log('[useUserVaults] Fetch already in progress, skipping...');
      return;
    }
    
    // Check network status before proceeding
    try {
      await checkNetworkStatus();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Network error';
      setLastFetchError(new Error(errorMsg));
      throw error;
    }

    const isInitialLoad = !isInitialized;

    try {
      // Clear any previous errors
      setLastFetchError(null);
      
      // Set loading state for initial load only
      if (isInitialLoad) {
        console.log('[useUserVaults] Starting initial load...');
        setIsLoading(true);
      }

      // Don't proceed if there's no address or chainId
      if (!address) {
        console.log('[useUserVaults] No address connected, skipping fetch');
        setVaults([]);
        return;
      }

      if (!chainId) {
        console.log('[useUserVaults] No chain ID detected, skipping fetch');
        setVaults([]);
        return;
      }

      // Log the fetch attempt
      console.log(`[useUserVaults] Fetching vaults for address: ${address} on chain ID: ${chainId}`, {
        isInitialLoad,
        isBackground,
        force,
        currentVaults: vaultsRef.current
      });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const factoryAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.factory as `0x${string}`;

      if (!factoryAddress) {
        const errorMsg = `Factory address not found for network with chain ID: ${chainId}. Available chain IDs: ${Object.keys(CONTRACT_ADDRESSES).join(', ')}`;
        console.error('[useUserVaults]', errorMsg);
        setVaults([]);
        setIsLoading(false);
        return;
      }

      console.log('[useUserVaults] Using factory address:', factoryAddress);
      const factory = new ethers.Contract(factoryAddress, XmentoVaultFactoryV2ABI, provider);

      // Fetch vaults using V2 contract
      try {
        console.log('[useUserVaults] Calling getUserVaults...');
        const userVaults = await factory.getUserVaults(address) as string[];
        console.log('[useUserVaults] getUserVaults result:', userVaults);

        const validVaults = userVaults
          .filter((vault): vault is `0x${string}` => {
            const isValid = typeof vault === 'string' &&
              vault.startsWith('0x') &&
              vault !== ethers.ZeroAddress &&
              vault !== '0x0000000000000000000000000000000000000000';
            if (!isValid) {
              console.log('[useUserVaults] Filtering out invalid vault address:', vault);
            }
            return isValid;
          });

        console.log(`[useUserVaults] Found ${validVaults.length} valid vault(s):`, validVaults);

        const currentVaults = vaultsRef.current;
        const hasChanges = 
          currentVaults.length !== validVaults.length ||
          currentVaults.some((vault, i) => vault.toLowerCase() !== validVaults[i]?.toLowerCase());

        if (hasChanges) {
          console.log('[useUserVaults] Vaults changed, updating state');
          setVaults(validVaults);
        } else {
          console.log('[useUserVaults] Vaults unchanged, skipping state update');
        }

        const now = new Date();
        if (isInitialLoad) {
          setIsLoading(false);
          setIsInitialized(true);
        }
        console.log(`[useUserVaults] State updated at ${new Date(now).toISOString()}`);
        setLastFetched(new Date(now));

      } catch (error) {
        console.error('[useUserVaults] Error in fetchVaults:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch vaults';
        const enhancedError = new Error(errorMessage, { cause: error });
        setLastFetchError(enhancedError);
        
        if (!isBackground) {
          toast({
            title: 'Error',
            description: errorMessage.includes('network') ? 
              'Network error. Please check your connection and try again.' : 
              'Failed to fetch vaults. Please try again.',
            variant: 'destructive',
          });
        }
        
        throw enhancedError;
      }
    } finally {
      console.log('[useUserVaults] Clearing loading states');
      
 
      // Update error state
      setLastFetchError(lastFetchError);
      
      // Clear loading state
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [address, chainId, toast]);

  // Initial fetch on mount and when address/chain changes
  useEffect(() => {
    if (address && chainId) {
      fetchVaults(true);
    }
  }, [address, chainId, fetchVaults]);

  // Simple refetch function that always does a fresh fetch
  const refetch = useCallback(async (force = false, isBackground = false) => {
    return fetchVaults(force, isBackground);
  }, [fetchVaults]);

  return {
    vaults,
    isLoading,
    isRefreshing,
    isInitialized,
    setIsRefreshing: (value: boolean) => {
      if (value) {
        refetch();
      }
    },
    lastFetched: lastFetched ? lastFetched.getTime() : null,
    refetch,
    error: lastFetchError,
  };
}
