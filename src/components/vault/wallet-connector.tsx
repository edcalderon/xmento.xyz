'use client';

import { useEffect, useState } from 'react';
import { useAccount, useDisconnect, useSwitchChain, useChainId, useConnect } from 'wagmi';
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
  const { address, isConnected, chain } = useAccount();
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
  };
  
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
