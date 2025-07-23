"use client";

import { Button } from "@/components/ui/button";
import { Wallet2, Copy, Check, ChevronDown, Plus } from "lucide-react";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { CHAIN_IDS } from "@/lib/wagmi.config";
import { useAccount, useSwitchChain, useChainId, useConnect } from 'wagmi';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { WalletConnectModal } from "./wallet-connect-modal";

// Network types and configuration
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

interface WalletConnectButtonProps {
  className?: string;
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  showNetworkSwitcher?: boolean;
}

export function WalletConnectButton({
  className = "",
  variant = "default",
  size = "default",
  showNetworkSwitcher = true,
}: WalletConnectButtonProps) {
  const { toast } = useToast();
  const { address: account, isConnected, disconnect, isConnecting, error, connectionError, isMobileBrowser, isMetaMaskInstalled, connect } = useWalletConnection();
  const { addresses, connector, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const currentChainId = useChainId();


  // State management
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSwitchingAccount, setIsSwitchingAccount] = useState(false);

  // Check if current chain is supported
  const isSupportedChain = currentChainId ? SUPPORTED_CHAINS.includes(currentChainId as NetworkID) : false;

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
      setIsNetworkDropdownOpen(false);
    }
  };

  // Track if we're in the process of disconnecting
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Handle wallet connection
  const handleConnect = useCallback(async () => {
    if (isConnected) {
      // Only proceed if not already disconnecting or connecting
      if (!isDisconnecting && !isConnecting) {
        try {
          setIsDisconnecting(true);
          await disconnect();
          toast({
            title: 'Disconnected',
            description: 'You have been disconnected from your wallet',
          });
        } catch (error) {
          console.error('Disconnect error:', error);
          toast({
            title: 'Disconnect failed',
            description: error instanceof Error ? error.message : 'Failed to disconnect',
            variant: 'destructive',
          });
        } finally {
          setIsDisconnecting(false);
        }
      }
    } else {
      // Open the modal to connect
      setIsModalOpen(true);
    }
  }, [isConnected, isConnecting, isDisconnecting, disconnect, toast]);

  // Handle copying address to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: 'Copied to clipboard',
      description: 'Wallet address copied',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  // Get other available accounts
  const otherAccounts = (addresses || []).filter(addr => addr.toLowerCase() !== account?.toLowerCase()).map(addr => ({
    address: addr,
    connector
  }));

  // Handle adding a new account or switching accounts in MetaMask
  const handleAddAccount = useCallback(async () => {
    if (!connector || isSwitchingAccount) return;

    try {
      setIsSwitchingAccount(true);

      if (connector.id === 'injected' && typeof window.ethereum?.request === 'function') {
        // This will open the account management in MetaMask
        await (window.ethereum as any).request({
          method: 'wallet_requestPermissions',
          params: [{
            eth_accounts: {}
          }]
        });

        // Wait a moment for any account changes to propagate
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Force a refresh of the connected accounts
        if (window.ethereum?.isMetaMask) {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
        }

        // Close the dropdown
        setIsAccountDropdownOpen(false);

        // Instead of reloading, we'll let the account change event handle the update
        toast({
          title: 'Accounts updated',
          description: 'Please select an account from the list above.',
        });

      } else {
        // For non-MetaMask wallets, show instructions
        toast({
          title: 'Add Account',
          description: 'Please add an account directly in your wallet and refresh this page.',
        });
      }
    } catch (error) {
      // If the user rejects the permission request, we'll get an error
      console.log('User rejected the request or no accounts were changed');
    } finally {
      setIsSwitchingAccount(false);
    }
  }, [connector, isSwitchingAccount]);

  // Handle account switching
  const handleSwitchAccount = async (targetAddress: string) => {
    if (!connector) return;

    try {
      setIsSwitchingAccount(true);

      // Check if the target account is already connected
      if (account && account.toLowerCase() === targetAddress.toLowerCase()) {
        toast({
          title: 'Account already active',
          description: 'This account is already connected',
        });
        return;
      }

      // Try to switch account using the connector's method if available
      if (typeof (connector as any).switchAccount === 'function') {
        await (connector as any).switchAccount(targetAddress);
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
          ...(connector.id === 'injected' && { account: targetAddress })
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

  // Display connection status and controls
  if (!isConnected) {
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
          Connect Wallet
        </Button>

        <WalletConnectModal
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          onConnectSuccess={() => setIsModalOpen(false)}
        />
      </>
    );
  }

  // Connected state
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Network Switcher */}
      {showNetworkSwitcher && (
        <DropdownMenu open={isNetworkDropdownOpen} onOpenChange={setIsNetworkDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5"
              disabled={isSwitching}
            >
              <div className={`h-2 w-2 rounded-full ${isSupportedChain ? 'bg-green-500' : 'bg-yellow-500'
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

      {/* Account Switcher */}
      {account && (
        <DropdownMenu open={isAccountDropdownOpen} onOpenChange={setIsAccountDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5"
              disabled={isSwitchingAccount}
            >
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="hidden sm:inline">
                {`${account.slice(0, 6)}...${account.slice(-4)}`}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <div className="px-2 py-1.5 text-sm font-semibold">Connected Wallet</div>
            <DropdownMenuItem
              className="opacity-100 hover:bg-accent cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(account);
              }}
            >
              <div className="flex flex-col w-full">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <span className="font-medium">Current Account</span>
                    <Check className="h-4 w-4 text-green-500 ml-1" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => copyToClipboard(account)}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Copy address</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
              </div>
            </DropdownMenuItem>
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
                      {`${account?.address.slice(0, 8)}...${account?.address.slice(-6)}`}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
            <div className="px-2 py-2 border-t mt-1">
              <div className="px-2 py-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddAccount();
                  }}
                  disabled={isSwitchingAccount || connector?.id !== 'injected'}
                  className={`w-full flex items-center text-sm h-8 px-2 rounded-md hover:bg-accent ${isSwitchingAccount || connector?.id !== 'injected' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Account
                </button>
              </div>

              <div className="text-xs text-muted-foreground mt-2 mb-1">
                {otherAccounts.length === 0 && 'Or add accounts manually:'}
              </div>
              <div className="text-xs text-muted-foreground whitespace-pre-line">
                {connector?.id === 'injected'
                  ? '1. Open your wallet extension\n2. Create or import another account\n3. Click refresh below'
                  : 'Add accounts in your wallet and refresh this page'}
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Disconnect Button */}
      <Button
        variant="outline"
        size={size}
        onClick={handleConnect}
        disabled={isDisconnecting || isConnecting || isSwitching}
      >
        {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
      </Button>
    </div>
  );
}
