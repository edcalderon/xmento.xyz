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
    let interval: NodeJS.Timeout;

    const startPolling = () => {
      if (interval) {
        clearInterval(interval);
      }
      
      const newPollingInterval = {
        manual: 100000000000000,
        '30s': 30000,
        '1m': 60000,
        '5m': 300000,
        '30m': 1800000,
      }[refreshInterval];

      if (newPollingInterval > 0) {
        interval = setInterval(handleRefresh, newPollingInterval);
      }
    };

    // Clear existing interval and start new one
    startPolling();

    // Trigger a refresh when interval changes
    if (refreshInterval !== 'manual') {
      handleRefresh();
    }

    return () => {
      if (interval) {
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
