import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useToast } from "@/components/ui/use-toast";
import { CONTRACT_ADDRESSES, DEFAULT_CHAIN } from "@/config/contracts";
import { useIsMobile } from '@/hooks/useIsMobile';

export type RefreshInterval = 'manual' | '30s' | '1m' | '5m' | '30m';

interface VaultRefreshOptions {
  initialInterval?: RefreshInterval;
  onRefreshError?: (error: Error) => void;
}

export function useVaultRefresh(
  refetch: () => Promise<void>,
  options: VaultRefreshOptions = {}
) {
  const { chain } = useAccount();
  const chainId = chain?.id || DEFAULT_CHAIN;
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<RefreshInterval>(options.initialInterval || 'manual');

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refetch();
      setLastFetched(new Date());
    } catch (error) {
      console.error('Error refreshing vaults:', error);
      options.onRefreshError?.(error as Error);
      toast({
        title: 'Error',
        description: 'Failed to refresh vaults. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-refresh when address, chain, or interval changes
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    const startPolling = () => {
      // Clear any existing interval
      if (interval) {
        clearInterval(interval);
      }
      
      // Only set up auto-refresh if not in manual mode
      if (refreshInterval !== 'manual') {
        const newPollingInterval = {
          '30s': 30000,
          '1m': 60000,
          '5m': 300000,
          '30m': 1800000,
        }[refreshInterval] || 0;

        if (newPollingInterval > 0) {
          console.log(`[useVaultRefresh] Setting up auto-refresh every ${refreshInterval}`);
          interval = setInterval(handleRefresh, newPollingInterval);
        }
      } else {
        console.log('[useVaultRefresh] Auto-refresh disabled (manual mode)');
      }
    };

    // Only start polling if we have a valid interval
    if (refreshInterval !== 'manual') {
      startPolling();
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (interval) {
        console.log('[useVaultRefresh] Clearing auto-refresh interval');
        clearInterval(interval);
      }
    };
  }, [chainId, refreshInterval, refetch]);

  return {
    isRefreshing,
    lastFetched,
    refresh: handleRefresh,
    refreshInterval,
    setRefreshInterval
  } as const;
}
