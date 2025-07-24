import { useCallback, useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useToast } from '@/components/ui/use-toast';
import { useIsMobile } from './useIsMobile';

export type ConnectionMethod = 'injected' | 'walletconnect' | 'metaMask' | null;

interface UseWalletConnectionReturn {
  address: `0x${string}` | undefined;
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  connectionError: string | null;
  isMobileBrowser: boolean;
  isMetaMaskInstalled: boolean;
  hasInjectedWallet: boolean;
  connect: (method?: ConnectionMethod) => Promise<void>;
  disconnect: () => Promise<void>;
}

export const useWalletConnection = (): UseWalletConnectionReturn => {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const isMobileBrowser = useIsMobile();
  
  const { connectAsync, connectors } = useConnect();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { address, isConnected } = useAccount();

  // Check if any injected wallet is available
  const hasInjectedWallet = typeof window !== 'undefined' && (
    typeof window.ethereum !== 'undefined' || 
    typeof (window as any).web3 !== 'undefined'
  );

  // Check if MetaMask is installed
  const isMetaMaskInstalled = typeof window !== 'undefined' && (
    !!window.ethereum?.isMetaMask || 
    !!(window as any).ethereum?.providers?.some((p: any) => p.isMetaMask)
  );

  // Get the best available connector
  const getBestConnector = (connectorType?: ConnectionMethod) => {
    // If no specific type, try to find the best available
    if (!connectorType) {
      return connectors.find(c => c.id === 'injected' || c.id === 'metaMask' || c.id === 'walletConnect');
    }

    // Map our connection method to the actual connector IDs used by wagmi
    const connectorMap: Record<string, string[]> = {
      'injected': ['injected', 'io.metamask', 'metaMask'],
      'walletconnect': ['walletConnect', 'wallet_connect'],
      'metaMask': ['io.metamask', 'metaMask', 'injected']
    };

    const possibleIds = connectorMap[connectorType] || [];
    return connectors.find(c => possibleIds.some(id => c.id.toLowerCase().includes(id.toLowerCase())));
  };

  // Connect function
  const connect = useCallback(async (connectorType?: ConnectionMethod) => {
    try {
      setIsConnecting(true);
      setError(null);
      setConnectionError(null);

      // If trying to connect with injected but no injected wallet found
      if (connectorType === 'injected' && !hasInjectedWallet) {
        const errorMsg = 'No injected wallet found. Please install MetaMask or another Web3 wallet.';
        setConnectionError(errorMsg);
        throw new Error(errorMsg);
      }

      // If trying to connect with MetaMask but it's not installed
      if (connectorType === 'metaMask' && !isMetaMaskInstalled) {
        const errorMsg = 'MetaMask not detected. Please install the MetaMask extension or use WalletConnect.';
        setConnectionError(errorMsg);
        throw new Error(errorMsg);
      }

      const connector = getBestConnector(connectorType);
      
      if (!connector) {
        const errorMsg = `Wallet connector not available. Please ensure you have a compatible wallet installed.`;
        setConnectionError(errorMsg);
        throw new Error(errorMsg);
      }

      await connectAsync({ connector });
      toast({
        title: 'Success',
        description: 'Wallet connected successfully',
        variant: 'default'
      });
    } catch (err) {
      console.error('Connection error:', err);
      let errorMessage = 'Failed to connect wallet';
      
      if (err instanceof Error) {
        errorMessage = err.message;
        // Handle common MetaMask errors
        if (errorMessage.includes('user rejected request')) {
          errorMessage = 'Connection was rejected';
        } else if (errorMessage.includes('already processing')) {
          errorMessage = 'A connection request is already pending';
        }
      }
      
      setError(err instanceof Error ? err : new Error(errorMessage));
      setConnectionError(errorMessage);
      toast({
        title: 'Error',
        description: `Connection failed: ${errorMessage}`,
        variant: 'destructive'
      });
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, [connectAsync, connectors]);

  // Handle connection based on method
  const handleConnect = useCallback(async (method?: ConnectionMethod) => {
    if (!method) return undefined;
    
    try {
      // Handle MetaMask mobile browser specifically
      if (isMobileBrowser && window.ethereum?.isMetaMask) {
        try {
          await connect(method);
          return;
        } catch (err) {
          console.warn('Direct MetaMask connection failed, attempting fallback...', err);
          // Wait a bit before fallback to allow user to handle initial error
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Try deeplink fallback
          const deeplink = `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`;
          window.open(deeplink, '_blank');
          
          // Set up retry mechanism
          const retryInterval = setInterval(async () => {
            if (window.ethereum?.isMetaMask) {
              try {
                await connect(method);
                clearInterval(retryInterval);
                return;
              } catch (retryErr) {
                // Keep retrying until connection is established
                console.log('Retrying connection...');
              }
            }
          }, 5000); // Retry every 5 seconds

          // Clear interval after max retries
          setTimeout(() => clearInterval(retryInterval), 30000); // 30 seconds max retry time
        }
      }

      await connect(method);
    } catch (err) {
      console.error('Connection error:', err);
      throw err;
    }
  }, [connect, isMobileBrowser]);

  // Disconnect function
  const disconnect = useCallback(async () => {
    try {
      await wagmiDisconnect();
      toast({
        title: 'Success',
        description: 'Wallet disconnected',
        variant: 'default'
      });
    } catch (err) {
      console.error('Disconnection error:', err);
      toast({
        title: 'Error',
        description: 'Failed to disconnect wallet',
        variant: 'destructive'
      });
      throw err;
    }
  }, [wagmiDisconnect]);

  return {
    address,
    isConnected,
    isConnecting,
    error,
    connectionError,
    isMobileBrowser,
    isMetaMaskInstalled,
    hasInjectedWallet,
    connect: handleConnect,
    disconnect,
  };
};
