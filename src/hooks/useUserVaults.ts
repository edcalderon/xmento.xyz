import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
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
};

export function useUserVaults(): UseUserVaultsReturn {
  const { address } = useAccount();
  const { toast } = useToast();
  const [vaults, setVaults] = useState<`0x${string}`[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastFetched, setLastFetched] = useState<number | null>(null);
  const [chainId, setChainId] = useState<number | undefined>();
  const [lastFetchError, setLastFetchError] = useState<Error | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  
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
    if ((isLoading || isRefreshing) && !force) {
      console.log('[useUserVaults] Skipping fetch - already in progress');
      return;
    }

    const isInitialLoad = !isInitialized;
    
    // Skip if we have data and it's not a forced refresh
    if (!force && vaultsRef.current.length > 0 && !isInitialLoad) {
      console.log('[useUserVaults] Skipping fetch - already have data and this is not a forced refresh');
      return;
    }

    // Don't proceed if there's no address or chainId
    if (!address) {
      console.log('[useUserVaults] No address connected, skipping fetch');
      setVaults([]);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    if (!chainId) {
      console.log('[useUserVaults] No chain ID detected, skipping fetch');
      setVaults([]);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    try {
      // Clear any previous errors
      setLastFetchError(null);
      
      // Set loading state based on the type of operation
      if (isInitialLoad) {
        setIsLoading(true);
        setIsRefreshing(false);
      } else if (isBackground) {
        // For background refreshes, we don't show a loading state
        setIsRefreshing(false);
      } else {
        // For user-initiated refreshes, show the refreshing state
        setIsRefreshing(true);
      }

      // Log the fetch attempt
      console.log(`[useUserVaults] Fetching vaults for address: ${address} on chain ID: ${chainId}`, {
        isInitialLoad,
        isBackground,
        force,
        currentVaults: vaultsRef.current
      });



      if (!chainId) {
        console.log('No chain ID detected');
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      console.log(`[useUserVaults] Fetching vaults for address: ${address} on chain ID: ${chainId}`);


      const provider = new ethers.BrowserProvider(window.ethereum);
      const factoryAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.factory as `0x${string}`;

      if (!factoryAddress) {
        const errorMsg = `Factory address not found for network with chain ID: ${chainId}. Available chain IDs: ${Object.keys(CONTRACT_ADDRESSES).join(', ')}`;
        console.error('[useUserVaults]', errorMsg);
        setVaults([]);
        setLastFetched(Date.now());
        setIsLoading(false);
        setIsRefreshing(false);
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

        // Always update state when we have vaults, even if they appear unchanged
        // This ensures we have the latest on-chain state
        // Only update if there are actual changes to prevent unnecessary re-renders
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

        const now = Date.now();
        setLastFetched(now);
        if (isInitialLoad) {
          setIsInitialized(true);
        }
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
        setIsLoading(false);
        setIsInitialized(true);
      } else if (isRefreshing) {
        // Small delay to prevent UI flickering
        setTimeout(() => setIsRefreshing(false), 300);
      }
    }
  }, [address, chainId, toast]);

  // Auto-fetch when address or chainId changes
  useEffect(() => {
    // Skip if we're already initialized
    if (isInitialized) {
      return;
    }

    // Use a small timeout to batch multiple rapid changes
    const timer = setTimeout(() => {
      if (!address) {
        console.log('[useUserVaults] No address connected, skipping fetch');
        setVaults([]);
        setIsLoading(false);
        return;
      }
      
      if (!chainId) {
        console.log('[useUserVaults] No chain ID detected, skipping fetch');
        setVaults([]);
        setIsLoading(false);
        return;
      }

      // Check if factory address exists for this chain
      const factoryAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.factory;
      if (!factoryAddress) {
        console.log(`[useUserVaults] No factory address found for chain ID: ${chainId}`);
        setVaults([]);
        setLastFetched(Date.now());
        setIsLoading(false);
        return;
      }

      // Only fetch if not already loading
      if (!isLoading && !isRefreshing) {
        console.log(`[useUserVaults] Auto-fetching vaults for chain ${chainId}`);
        fetchVaults();
      }
    }, 100); // Small debounce

    return () => clearTimeout(timer);
  }, [address, chainId, fetchVaults, isLoading, isRefreshing, isInitialized]);

  // No auto-refreshing

  // Memoize the refetch function to prevent unnecessary re-renders
  const refetch = useCallback(async (force = false, isBackground = false) => {
    if (isRefreshing && !force) return;
    return fetchVaults(force, isBackground);
  }, [fetchVaults, isRefreshing]);

  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(() => ({
    vaults,
    isLoading: isLoading || isRefreshing,
    isRefreshing,
    isInitialized: !isLoading && !isRefreshing,
    setIsRefreshing,
    lastFetched,
    refetch,
  }), [vaults, isLoading, isRefreshing, lastFetched, refetch]);
}
