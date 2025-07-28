import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { useToast } from '@/components/ui/use-toast';
import { CONTRACT_ADDRESSES, DEFAULT_CHAIN } from '@/config/contracts';
import { XmentoVaultFactoryV2ABI } from '@/components/vault/XmentoVaultFactoryV2ABI';
import { useVaultRefresh } from './useVaultRefresh';

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

  const fetchVaults = useCallback(async (force = false, isBackground = false) => {
    // Skip if already in progress unless forced
    if (isLoading && !force) {
      console.log('[useUserVaults] Fetch already in progress, skipping...');
      return;
    }

    const isInitialLoad = !isInitialized;
    let loadingTimeout: NodeJS.Timeout | null = null;

    // Set a safety timeout to ensure loading states are cleared
    const SAFETY_TIMEOUT = 30000; // 30 seconds

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

        const now = new Date();
        if (isInitialLoad) {
          setIsLoading(false);
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
      
      // Clear the safety timeout
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
      
      // Update error state
      setLastFetchError(lastFetchError);
      
      // Clear loading state
      setIsLoading(false);
    }
  }, [address, chainId, toast]);

  // Set up vault refresh with manual refresh by default
  const { isRefreshing, lastFetched, refresh } = useVaultRefresh(
    useCallback(() => fetchVaults(false, true), [fetchVaults]),
    { initialInterval: 'manual' }
  );

  // Initial fetch on mount and when address/chain changes
  useEffect(() => {
    if (address && chainId) {
      fetchVaults(true);
    }
  }, [address, chainId, fetchVaults]);

  // Create a wrapped refetch function that uses the refresh from useVaultRefresh
  const refetch = useCallback(async (force = false, isBackground = false) => {
    if (force) {
      return fetchVaults(true, isBackground);
    }
    return refresh();
  }, [fetchVaults, refresh]);

  return {
    vaults,
    isLoading,
    isRefreshing,
    isInitialized,
    setIsRefreshing: (value: boolean) => {
      if (value) {
        refresh();
      }
    },
    lastFetched: lastFetched ? lastFetched.getTime() : null,
    refetch,
  };
}
