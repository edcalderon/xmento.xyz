import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { useToast } from '@/components/ui/use-toast';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { XmentoVaultFactoryV2ABI } from '@/components/vault/XmentoVaultFactoryV2ABI';

type UseUserVaultsReturn = {
  vaults: `0x${string}`[];
  isInitialLoading: boolean;
  isRefreshing: boolean;
  setIsRefreshing: (value: boolean) => void;
  lastFetched: number | null;
  refetch: () => Promise<void>;
};

export function useUserVaults(): UseUserVaultsReturn {
  const { address } = useAccount();
  const { toast } = useToast();
  const [vaults, setVaults] = useState<`0x${string}`[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isBackgroundRefreshing, setIsBackgroundRefreshing] = useState<boolean>(false);
  const [lastFetched, setLastFetched] = useState<number | null>(null);
  const [chainId, setChainId] = useState<number | undefined>();
  const [initialLoadComplete, setInitialLoadComplete] = useState<boolean>(false);
  const [lastFetchError, setLastFetchError] = useState<Error | null>(null);
  
  // Use refs to track the latest values without causing re-renders
  const vaultsRef = useRef(vaults);
  const isMounted = useRef(true);

  // Get current chain ID
  useEffect(() => {
    const getChainId = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const network = await provider.getNetwork();
          setChainId(Number(network.chainId));
        } catch (error) {
          console.error('Error getting chain ID:', error);
        }
      }
    };

    getChainId();
  }, []);

  // Update ref when vaults change
  useEffect(() => {
    vaultsRef.current = vaults;
  }, [vaults]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchVaults = useCallback(async (force = false, isBackground = false) => {
    // Skip if already in progress, unless it's a forced refresh
    if ((isInitialLoading || isRefreshing || isBackgroundRefreshing) && !force) {
      console.log('Skipping fetch - already in progress');
      return;
    }

    const isInitialLoad = !initialLoadComplete;
    // Don't skip if it's a forced refresh, initial load, or we don't have any vaults yet
    const shouldSkip = !force && vaultsRef.current.length > 0 && !isInitialLoad && !isBackground;

    if (shouldSkip) {
      console.log('Skipping fetch - already have data and this is not a forced refresh');
      return;
    }

    try {
      // Clear any previous errors
      setLastFetchError(null);
      
      // Set appropriate loading states
      if (isInitialLoad) {
        setIsInitialLoading(true);
      } else if (isBackground) {
        // For background refreshes, we don't show a loading state
        setIsBackgroundRefreshing(true);
      } else {
        // Only show refreshing state for user-initiated refreshes
        setIsRefreshing(true);
      }



      if (!chainId) {
        console.log('No chain ID detected');
        setIsInitialLoading(false);
        setIsRefreshing(false);
        return;
      }

      console.log(`[useUserVaults] Fetching vaults for address: ${address} on chain ID: ${chainId}`);


      const provider = new ethers.BrowserProvider(window.ethereum);
      const factoryAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.factory as `0x${string}`;

      if (!factoryAddress) {
        const errorMsg = `Factory address not found for network with chain ID: ${chainId}`;
        console.error('[useUserVaults]', errorMsg);
        throw new Error(errorMsg);
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

        // Only update if the vaults have actually changed
        setVaults(prevVaults => {
          // Compare lengths first for quick check
          if (prevVaults.length !== validVaults.length) {
            console.log('[useUserVaults] Vaults changed (different length), updating state');
            return validVaults;
          }

          // Compare each vault address
          const hasChanges = prevVaults.some((vault, i) => vault.toLowerCase() !== validVaults[i]?.toLowerCase());

          if (hasChanges) {
            console.log('[useUserVaults] Vaults changed, updating state');
            return validVaults;
          }

          console.log('[useUserVaults] Vaults unchanged, skipping state update');
          return prevVaults;
        });

        const now = Date.now();
        setLastFetched(now);
        setInitialLoadComplete(true);
        console.log(`[useUserVaults] State updated at ${new Date(now).toISOString()}`);

      } catch (error) {
        console.error('[useUserVaults] Error in fetchVaults:', error);
        setLastFetchError(error instanceof Error ? error : new Error('Unknown error'));
        toast({
          title: 'Error',
          description: 'Failed to fetch vaults. Please try again.',
          variant: 'destructive',
        });
        throw error; // Re-throw to allow error handling by the caller if needed
      }
    } finally {
      console.log('[useUserVaults] Clearing loading states');
      if (isInitialLoad) {
        setIsInitialLoading(false);
        setInitialLoadComplete(true);
      } else if (isBackground) {
        setIsBackgroundRefreshing(false);
      } else {
        setIsRefreshing(false);
      }
    }
  }, [address, chainId, toast]);

  // Auto-fetch when address or chainId changes
  useEffect(() => {
    if (!address || !chainId) return;

    // Initial fetch
    fetchVaults();
  }, [address, chainId, fetchVaults]);

  // Set up polling after initial load
  useEffect(() => {
    if (!initialLoadComplete || !address || !chainId) return;

    console.log('[useUserVaults] Setting up polling...');
    
    // Initial setup of polling
    let interval: NodeJS.Timeout;
    
    const poll = () => {
      // Only poll if we have vaults to refresh
      if (vaultsRef.current.length > 0) {
        console.log('[useUserVaults] Background refresh polling...');
        fetchVaults(true, true); // Force refresh with isBackground=true
      }
    };
    
    // Set up the interval
    interval = setInterval(poll, 30000); // Poll every 30 seconds
    
    // Initial poll after a short delay
    const initialPollTimer = setTimeout(poll, 10000);
    
    // Cleanup function
    return () => {
      console.log('[useUserVaults] Cleaning up polling...');
      if (interval) clearInterval(interval);
      clearTimeout(initialPollTimer);
    };
  }, [initialLoadComplete, address, chainId, fetchVaults]);

  // Memoize the refetch function to prevent unnecessary re-renders
  const refetch = useCallback(() => fetchVaults(true, false), [fetchVaults]);

  // Only show refreshing state for non-background refreshes
  const showRefreshing = isRefreshing && !isBackgroundRefreshing;
  
  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(() => ({
    vaults,
    isInitialLoading,
    isRefreshing: showRefreshing, 
    setIsRefreshing,
    lastFetched,
    refetch,
  }), [vaults, isInitialLoading, showRefreshing, lastFetched, refetch]);
}
