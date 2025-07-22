"use client";

import { createContext, useContext, ReactNode, useCallback, useState, useEffect } from "react";
import { 
  useAccount, 
  useConnect, 
  useDisconnect,
} from 'wagmi';
import { walletConnect } from 'wagmi/connectors';
import { useDisconnect as useCustomDisconnect } from "@/hooks/useDisconnect";
import { isMobile } from "react-device-detect";

// Type for wallet account
export interface WalletAccount {
  address: string;
  connector: {
    id: string;
    name: string;
    type: string;
    [key: string]: any;
  };
  chainId?: number; // Make chainId optional
  isConnected: boolean;
  isConnecting?: boolean;
  isReconnecting?: boolean;
  isDisconnected?: boolean;
  status?: 'connected' | 'disconnected' | 'connecting' | 'reconnecting';
  connectorName?: string; // Add connectorName to the interface
}

// Type for the result of connectAsync
type ConnectResult = {
  accounts: readonly string[];
  chainId: number;
  connector: {
    id: string;
    name: string;
    type: string;
    [key: string]: any;
  };
  account: string;
  chain: {
    id: number;
    unsupported?: boolean;
  };
  [key: string]: any; // Allow additional properties
};

export interface WalletContextType {
  account: WalletAccount | null;
  isConnected: boolean;
  connect: (connectorType?: 'injected' | 'walletConnect') => Promise<ConnectResult | void>;
  disconnect: () => Promise<void>;
  isConnecting: boolean;
  error: Error | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<WalletAccount | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Get wagmi hooks
  const { address, isConnected, chain } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { disconnect: unifiedDisconnect } = useCustomDisconnect();
  
  // Update account when wagmi state changes
  useEffect(() => {
    if (isConnected && address) {
      setAccount({
        address,
        connector: {
          id: 'metaMask',
          name: 'MetaMask',
          type: 'injected'
        },
        chainId: chain?.id,
        isConnected: true,
        connectorName: 'MetaMask'
      });
    } else {
      setAccount(null);
    }
  }, [isConnected, address, chain]);
  
  // Check if MetaMask is installed and available
  const isMetaMaskAvailable = typeof window !== 'undefined' && 
    typeof (window as any).ethereum !== 'undefined' && 
    (window as any).ethereum.isMetaMask;
    
  // Check if we should redirect to MetaMask Mobile
  const shouldRedirectToMetaMask = isMobile && !isMetaMaskAvailable;
  
  // WalletConnect connector configuration
  const walletConnectConfig = {
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_WALLETCONNECT_PROJECT_ID',
    metadata: {
      name: 'Xmento',
      description: 'Earn yield on your Mento stables',
      url: 'https://xmento.xyz',
      icons: ['https://xmento.xyz/icon.png'],
    },
  };
  
  // Create connectors
  const walletConnectConnector = walletConnect(walletConnectConfig);
  
  // Generate a session ID for tracking disconnections
  const [sessionId] = useState(() => {
    if (typeof window === 'undefined') {
      return Math.random().toString(36).substring(2);
    }
    
    const storedId = sessionStorage.getItem('sessionId') || 
                   localStorage.getItem('sessionId') || 
                   Math.random().toString(36).substring(2);
    
    try {
      sessionStorage.setItem('sessionId', storedId);
      localStorage.setItem('sessionId', storedId);
    } catch (e) {
      console.warn('Failed to store session ID:', e);
    }
    
    return storedId;
  });

  // Initialize wallet state on mount
  useEffect(() => {
    const initializeWallet = async () => {
      if (typeof window === 'undefined') return;
      
      // Check if we have a disconnection flag
      const disconnectedSessionId = sessionStorage.getItem('walletDisconnected');
      
      // If we have a disconnection flag from a previous session, don't auto-connect
      if (disconnectedSessionId === sessionId) {
        sessionStorage.removeItem('walletDisconnected');
        localStorage.removeItem('walletAddress');
        return;
      }
      
      // Check for stored wallet address
      const storedAddress = localStorage.getItem('walletAddress');
      if (storedAddress && !disconnectedSessionId) {
        setAccount(prev => ({
          ...prev || {},
          address: storedAddress,
          isConnected: false,
          connector: {
            id: 'injected',
            name: 'MetaMask',
            type: 'injected'
          },
          connectorName: 'MetaMask'
        }));
      }
    };
    
    initializeWallet();
  }, [sessionId]);
  
  // Redirect to MetaMask mobile app with deep link
  const redirectToMetaMaskApp = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const dappUrl = window.location.hostname;
    const metamaskDeepLink = `https://metamask.app.link/dapp/${dappUrl}`;
    
    // Store the current URL to redirect back after wallet connection
    sessionStorage.setItem('postAuthRedirect', window.location.href);
    window.location.href = metamaskDeepLink;
  }, []);

  // Connect wallet function with simplified type signature
  const connect = useCallback(async (connectorType: 'injected' | 'walletConnect' = 'injected'): Promise<ConnectResult | void> => {
    setIsConnecting(true);
    setError(null);
    
    try {
      // Handle WalletConnect
      if (connectorType === 'walletConnect') {
        // On mobile, open the WalletConnect modal in a new tab
        if (isMobile) {
          const dappUrl = window.location.hostname;
          const wcUri = `wc:${Date.now()}-1@1?bridge=https%3A%2F%2Fbridge.walletconnect.org&key=91303dedf64285cbbaf9120f6e9d160a5c8aa2deb250274feb16c1ea3e589fe7`;
          const deepLink = `https://metamask.app.link/wc?uri=${encodeURIComponent(wcUri)}`;
          
          // Store the current URL to redirect back after wallet connection
          sessionStorage.setItem('postAuthRedirect', window.location.href);
          
          // Try to open the deep link directly first
          window.location.href = deepLink;
          
          // Fallback to window.open if the above doesn't work
          setTimeout(() => {
            window.open(deepLink, '_blank', 'noopener,noreferrer');
          }, 500);
          
          // Don't wait for connection here - it will be handled by the WalletConnect modal
          return;
        }
        
        // For desktop, use the regular WalletConnect flow
        const result = await connectAsync({ connector: walletConnectConnector });
        if (result.accounts?.[0]) {
          localStorage.setItem('walletAddress', result.accounts[0]);
          localStorage.removeItem('walletDisconnected');
          setAccount({
            address: result.accounts[0],
            chainId: result.chainId,
            isConnected: true,
            connectorName: 'WalletConnect',
            connector: {
              id: 'walletConnect',
              name: 'WalletConnect',
              type: 'walletConnect'
            }
          });
        }
        // Convert accounts to the correct type ensuring they're valid Ethereum addresses
        const accounts = (result.accounts ?? []) as readonly `0x${string}`[];
        const account = accounts[0] ?? '0x' as `0x${string}`;
        
        return {
          accounts,
          chainId: result.chainId,
          connector: {
            id: 'walletconnect',
            name: 'WalletConnect',
            type: 'walletconnect'
          } as const,
          account,
          chain: {
            id: result.chainId,
            unsupported: false
          }
        };
      }
      
      // Handle MetaMask
      if (isMobile && !isMetaMaskAvailable) {
        // On mobile without MetaMask installed, use WalletConnect
        return connect('walletConnect');
      }
      
      const injectedConnector = connectors.find(c => c.id === 'metaMask' || c.id === 'injected');
      if (!injectedConnector) throw new Error('No suitable wallet connector found');
      
      const result = await connectAsync({ connector: injectedConnector });
      if (result.accounts?.[0]) {
        localStorage.setItem('walletAddress', result.accounts[0]);
        localStorage.removeItem('walletDisconnected');
        setAccount({
          address: result.accounts[0],
          chainId: result.chainId,
          isConnected: true,
          connector: {
            id: injectedConnector.id,
            name: injectedConnector.name,
            type: injectedConnector.type || 'injected'  // Default to 'injected' if type is not available
          },
          connectorName: injectedConnector.name
        });
      }
      
      return {
        accounts: result.accounts ?? [],
        chainId: result.chainId,
        connector: {
          id: injectedConnector.id,
          name: injectedConnector.name,
          type: injectedConnector.type || 'injected'
        },
        account: result.accounts?.[0] ?? '0x',
        chain: {
          id: result.chainId,
          unsupported: false
        }
      };
    } catch (err) {
      console.error('Failed to connect wallet:', err);
      const error = err instanceof Error ? err : new Error('Failed to connect wallet');
      setError(error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [connectAsync, connectors, shouldRedirectToMetaMask, redirectToMetaMaskApp, walletConnectConnector]);
  
  // Disconnect wallet function
  const disconnect = useCallback(async (): Promise<void> => {
    try {
      // First try the unified disconnect
      const success = await unifiedDisconnect({ showToast: true });
      
      // If unifiedDisconnect returns false, it means disconnection failed
      if (success === false) {
        throw new Error('Failed to disconnect wallet');
      }
      
      // Then ensure wagmi is disconnected
      wagmiDisconnect();
      
      // Clear local state
      setAccount(null);
      setError(null);
      
      // Clear stored wallet address
      if (typeof window !== 'undefined') {
        localStorage.removeItem('walletAddress');
      }
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      setError(error as Error);
      throw error;
    }
  }, [unifiedDisconnect, wagmiDisconnect, setError, setAccount]);
  
  // Provide the context value
  const contextValue: WalletContextType = {
    account,
    isConnected: !!account?.isConnected,
    connect,
    disconnect,
    isConnecting,
    error
  };
  
  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextType {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
