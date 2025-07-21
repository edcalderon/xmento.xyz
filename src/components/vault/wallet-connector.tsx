'use client';

import { useEffect, useState } from 'react';
import { useAccount, useDisconnect, useSwitchChain, useChainId, useConnect } from 'wagmi';
import type { Connector } from 'wagmi';
import { CHAIN_IDS, DEFAULT_CHAIN } from '@/lib/wagmi.config';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { Check, ChevronDown, Copy, LogOut, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

// Define network ID type for type safety
type NetworkID = 42220 | 44787; // Celo Mainnet and Alfajores Testnet IDs

type Network = {
  id: NetworkID;
  name: string;
  isTestnet: boolean;
};

const NETWORK_INFO: Record<number, Network> = {
  [CHAIN_IDS.CELO_MAINNET]: {
    id: CHAIN_IDS.CELO_MAINNET,
    name: 'Celo Mainnet',
    isTestnet: false,
  },
  [CHAIN_IDS.CELO_ALFAJORES]: {
    id: CHAIN_IDS.CELO_ALFAJORES,
    name: 'Celo Alfajores',
    isTestnet: true,
  },
};

const SUPPORTED_CHAINS = [CHAIN_IDS.CELO_MAINNET, CHAIN_IDS.CELO_ALFAJORES];

export function WalletConnector() {
  const { toast } = useToast();
  const { address, isConnected, chain, connector, addresses } = useAccount();
  const [showAccounts, setShowAccounts] = useState(false);
  const [isSwitchingAccount, setIsSwitchingAccount] = useState(false);
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const currentChainId = useChainId();
  const { connectors, connect, isPending } = useConnect();
  
  const [isSwitching, setIsSwitching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Check if current chain is supported
  const isSupportedChain = chain?.id ? SUPPORTED_CHAINS.includes(chain.id as NetworkID) : false;
  
  // Handle network switching
  const handleSwitchNetwork = async (targetChainId: NetworkID) => {
    if (!isConnected || !switchChain) return;
    
    setIsSwitching(true);
    try {
      // Ensure the chain ID is one of the supported networks
      if (!SUPPORTED_CHAINS.includes(targetChainId)) {
        throw new Error('Unsupported network');
      }
      
      await switchChain({ chainId: targetChainId });
      toast({
        title: 'Network switched',
        description: `Connected to ${NETWORK_INFO[targetChainId as keyof typeof NETWORK_INFO]?.name || 'network'}`,
      });
    } catch (error: any) {
      console.error('Failed to switch network:', error);
      toast({
        title: 'Failed to switch network',
        description: error?.message || 'An error occurred while switching networks',
        variant: 'destructive',
      });
    } finally {
      setIsSwitching(false);
      setIsDropdownOpen(false);
    }
  };
  
  // Handle wallet connection
  const handleConnect = async () => {
    try {
      const connector = connectors[0];
      if (!connector) {
        throw new Error('No wallet connector found');
      }
      await connect({ 
        connector,
        chainId: DEFAULT_CHAIN.id,
      });
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      toast({
        title: 'Connection failed',
        description: error?.message || 'Failed to connect wallet',
        variant: 'destructive',
      });
    }
  };
  
  // Handle disconnect
  const handleDisconnect = () => {
    disconnect();
    setIsDropdownOpen(false);
    setShowAccounts(false);
  };

  // Handle account switching
  const handleSwitchAccount = async (targetAddress: string) => {
    if (!connector) return;
    
    try {
      setIsSwitchingAccount(true);
      
      // Check if the target account is already connected
      if (address?.toLowerCase() === targetAddress.toLowerCase()) {
        toast({
          title: 'Account already active',
          description: 'This account is already connected',
        });
        return;
      }
      
      // Try to switch account using the connector's method if available
      if (typeof connector.switchAccount === 'function') {
        await connector.switchAccount(targetAddress);
      } else if (connector.id === 'injected' && typeof window.ethereum?.request === 'function') {
        // For MetaMask and similar injected providers
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{
            eth_accounts: {}
          }]
        });
      } else {
        // Fallback: disconnect and reconnect with the same chain
        await connector.disconnect();
        await connector.connect({ 
          chainId: chain?.id,
          // Some wallets support passing the account directly
          ...(connector.id === 'injected' && { account: targetAddress as `0x${string}` })
        });
      }
      
      toast({
        title: 'Account changed',
        description: `Switched to ${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)}`,
      });
    } catch (error: unknown) {
      console.error('Failed to switch account:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast({
        title: 'Failed to switch account',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSwitchingAccount(false);
    }
  };
  
  // Get other available accounts
  const otherAccounts = (addresses || [])
    .filter(addr => addr.toLowerCase() !== address?.toLowerCase())
    .map(addr => ({
      address: addr,
      connector: connector as Connector
    }));
  
  // Copy address to clipboard
  const copyToClipboard = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    toast({
      title: 'Address copied',
      description: 'Wallet address copied to clipboard',
    });
  };
  
  // Format address for display
  const displayAddress = address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : '';
  const currentNetwork = chain?.id ? NETWORK_INFO[chain.id] : null;
  
  // Display connection status and controls
  if (!isConnected) {
    return (
      <Button 
        onClick={handleConnect}
        disabled={isPending}
        className="min-w-40"
      >
        {isPending ? 'Connecting...' : 'Connect Wallet'}
      </Button>
    );
  }
  
  return (
    <div className="flex items-center gap-2">
      {/* Account Switcher Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            disabled={!isConnected || isSwitchingAccount}
          >
            <span className="hidden sm:inline">Switch Account</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <div className="px-2 py-1.5 text-sm font-semibold">Connected Accounts</div>
          {address && (
            <DropdownMenuItem disabled className="opacity-100">
              <div className="flex flex-col w-full">
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium">Current Account</span>
                  <Check className="h-4 w-4 text-green-500" />
                </div>
                <div className="text-sm text-muted-foreground truncate font-mono">
                  {`${address.slice(0, 6)}...${address.slice(-4)}`}
                </div>
              </div>
            </DropdownMenuItem>
          )}
          <div className="px-2 py-1.5 mt-1">
            <div className="text-xs text-muted-foreground mb-2">
              {otherAccounts.length > 0 
                ? 'Switch to another account:'
                : 'No other accounts found in your wallet.'}
            </div>
            {otherAccounts.map((account) => (
              <DropdownMenuItem
                key={account.address}
                onClick={() => handleSwitchAccount(account.address)}
                disabled={isSwitchingAccount}
                className="cursor-pointer py-2 px-3 rounded-md hover:bg-accent"
              >
                <div className="flex items-center gap-2 w-full">
                  <div className="w-2 h-2 rounded-full bg-primary/50"></div>
                  <span className="font-mono text-sm truncate">
                    {`${account.address.slice(0, 8)}...${account.address.slice(-6)}`}
                  </span>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
          <div className="px-2 py-2 border-t mt-1">
            <div className="text-xs text-muted-foreground mb-1">
              {otherAccounts.length === 0 && 'To add more accounts:'}
            </div>
            <div className="text-xs text-muted-foreground">
              {connector?.id === 'injected' 
                ? '1. Open your wallet extension\n2. Create or import another account\n3. Refresh this page' 
                : 'Add accounts in your wallet and refresh this page'}
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Network Selector */}
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            disabled={isSwitching}
          >
            {isSwitching ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                Switching...
              </span>
            ) : isSupportedChain ? (
              <span className="flex items-center gap-2">
                <span className={cn(
                  'h-2 w-2 rounded-full',
                  chain?.id === CHAIN_IDS.CELO_MAINNET ? 'bg-green-500' : 'bg-blue-500'
                )} />
                {currentNetwork?.name || 'Unknown Network'}
              </span>
            ) : (
              <span className="flex items-center gap-2 text-amber-500">
                <WifiOff className="h-4 w-4" />
                Unsupported Network
              </span>
            )}
            <ChevronDown className={cn(
              'h-4 w-4 transition-transform',
              isDropdownOpen ? 'rotate-180' : ''
            )} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5 text-sm font-semibold">Select Network</div>
          {Object.values(NETWORK_INFO).map((network) => {
            const isActive = network.id === currentChainId;
            return (
              <DropdownMenuItem 
                key={network.id}
                onClick={() => handleSwitchNetwork(network.id)}
                className={cn(
                  'flex items-center justify-between',
                  isActive ? 'bg-muted' : 'cursor-pointer'
                )}
                disabled={isActive}
              >
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'h-2 w-2 rounded-full',
                    network.id === CHAIN_IDS.CELO_MAINNET ? 'bg-green-500' : 'bg-blue-500'
                  )} />
                  <span>{network.name}</span>
                  {network.isTestnet && (
                    <span className="text-xs text-muted-foreground">Testnet</span>
                  )}
                </div>
                {isActive && <Check className="h-4 w-4 text-primary" />}
              </DropdownMenuItem>
            );
          })}
          
          <div className="h-px bg-border my-1" />
          
          {/* Account Info */}
          {address && (
            <div className="px-2 py-1.5">
              <div className="text-xs text-muted-foreground mb-1">Connected with {connectors[0]?.name || 'Wallet'}</div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{displayAddress}</span>
                  <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard();
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span className="sr-only">Copy address</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDisconnect();
                    }}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span className="sr-only">Disconnect</span>
                  </Button>
                  </div>
                </div>
                
                {/* Account Switching */}
                {otherAccounts.length > 0 && (
                  <div className="mt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-xs h-7"
                      disabled={isSwitchingAccount}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAccounts(!showAccounts);
                      }}
                    >
                      {isSwitchingAccount ? (
                        <>
                          <span className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full mr-2" />
                          Switching...
                        </>
                      ) : (
                        'Switch Account'
                      )}
                    </Button>
                    
                    {showAccounts && !isSwitchingAccount && (
                      <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                        {otherAccounts.map((account) => (
                          <div 
                            key={account.address}
                            className="flex items-center justify-between p-1.5 text-xs rounded hover:bg-accent cursor-pointer transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSwitchAccount(account.address);
                            }}
                          >
                            <div className="flex flex-col">
                              <span className="font-mono">
                                {`${account.address.substring(0, 6)}...${account.address.substring(account.address.length - 4)}`}
                              </span>
                              {account.address.toLowerCase() === address?.toLowerCase() && (
                                <span className="text-xs text-green-500">Current</span>
                              )}
                            </div>
                            <span className="text-muted-foreground text-xs">
                              {account.connector?.name || 'Wallet'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Network Status Indicator */}
      {!isSupportedChain && (
        <div className="hidden md:flex items-center gap-1.5 text-amber-500 text-sm">
          <WifiOff className="h-4 w-4" />
          <span>Unsupported Network</span>
        </div>
      )}
    </div>
  );
}
