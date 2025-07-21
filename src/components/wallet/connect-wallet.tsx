"use client";

import { Button } from "@/components/ui/button";
import { Wallet2, Copy, LogOut, Check, ChevronDown } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { WalletModal } from "./wallet-modal";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { CHAIN_IDS, DEFAULT_CHAIN } from "@/lib/wagmi.config";
import { useAccount, useSwitchChain, useChainId } from 'wagmi';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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

interface ConnectWalletProps {
  className?: string;
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  showConnectedInfo?: boolean;
  showNetworkSwitcher?: boolean;
}

export function ConnectWallet({
  className = "",
  variant = "default",
  size = "default",
  showConnectedInfo = true,
  showNetworkSwitcher = true,
}: ConnectWalletProps) {
  const { toast } = useToast();
  const { account, isConnected, isConnecting, disconnect } = useWallet();
  const { chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const currentChainId = useChainId();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Check if current chain is supported
  const isSupportedChain = chain?.id ? SUPPORTED_CHAINS.includes(chain.id as NetworkID) : false;

  // Handle network switching
  const handleSwitchNetwork = async (targetChainId: NetworkID) => {
    if (!isConnected || !switchChain) return;
    
    setIsSwitching(true);
    try {
      if (!SUPPORTED_CHAINS.includes(targetChainId)) {
        throw new Error('Unsupported network');
      }
      
      await switchChain({ chainId: targetChainId });
      toast({
        title: 'Network switched',
        description: `Connected to ${NETWORK_INFO[targetChainId]?.name || 'network'}`,
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

  const handleConnect = () => {
    if (isConnected) {
      disconnect()
        .then(() => {
          // Success handled by context
        })
        .catch(console.error);
    } else {
      setIsModalOpen(true);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: 'Copied to clipboard',
      description: 'Wallet address copied',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  if (isConnected && account?.address && showConnectedInfo) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showNetworkSwitcher && (
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5"
                disabled={isSwitching}
              >
                <div className={`h-2 w-2 rounded-full ${
                  isSupportedChain ? 'bg-green-500' : 'bg-yellow-500'
                }`} />
                <span className="hidden sm:inline">
                  {NETWORK_INFO[chain?.id as NetworkID]?.name || 'Unsupported Network'}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {Object.values(NETWORK_INFO).map((network) => (
                <DropdownMenuItem
                  key={network.id}
                  onClick={() => handleSwitchNetwork(network.id)}
                  className="flex items-center justify-between"
                >
                  <span>{network.name}</span>
                  {chain?.id === network.id && <Check className="h-4 w-4" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        <div className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md bg-muted">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="hidden sm:inline">
            {`${account.address.slice(0, 6)}...${account.address.slice(-4)}`}
          </span>
          <button
            onClick={() => copyToClipboard(account.address)}
            className="ml-1 p-1 rounded hover:bg-muted-foreground/10"
            title="Copy address"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
        
        <Button
          variant="outline"
          size={size}
          onClick={handleConnect}
          disabled={isConnecting || isSwitching}
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={`gap-2 ${className}`}
        onClick={handleConnect}
        disabled={isConnecting || isSwitching}
      >
        <Wallet2 className="h-4 w-4" />
        {isConnected ? "Disconnect" : "Connect Wallet"}
      </Button>
      
      <WalletModal 
        isOpen={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        onConnectSuccess={() => setIsModalOpen(false)}
      />
    </>
  );
}
