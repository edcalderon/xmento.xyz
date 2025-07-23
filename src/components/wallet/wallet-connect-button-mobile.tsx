"use client";

import { ChevronDown, Check, Copy, ExternalLink } from "lucide-react";
import { NetworkInfo } from "@/types/network";
import { Account } from "@/types/wallet";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAccount } from 'wagmi';
import { CHAIN_IDS } from "@/lib/wagmi.config";

export interface WalletConnectButtonMobileProps {
  className?: string;
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  showNetworkSwitcher?: boolean;
  address?: `0x${string}`;
  isConnecting?: boolean;
  isSwitching?: boolean;
  isSwitchingAccount?: boolean;
  isDisconnecting?: boolean;
  isAccountDropdownOpen?: boolean;
  setIsAccountDropdownOpen?: (open: boolean) => void;
  isNetworkDropdownOpen?: boolean;
  setIsNetworkDropdownOpen?: (open: boolean) => void;
  handleConnect?: () => void;
  handleDisconnect?: () => void;
  handleSwitchNetwork?: (chainId: number) => void;
  handleCopyAddress?: () => void;
  handleSwitchAccount?: (address: string) => void;
  isSupportedChain?: boolean;
  networkInfo?: Record<number, NetworkInfo>;
  otherAccounts?: Account[];
  handleAddAccount?: () => void;
  formattedAddress?: string;
  connector?: {
    id: string;
    name: string;
  };
}

export function WalletConnectButtonMobile({
  className = "",
  size = "default",
  showNetworkSwitcher = true,
  address,
  isConnecting = false,
  isSwitching = false,
  isSwitchingAccount = false,
  isDisconnecting = false,
  isAccountDropdownOpen = false,
  setIsAccountDropdownOpen = () => {},
  isNetworkDropdownOpen = false,
  setIsNetworkDropdownOpen = () => {},
  handleDisconnect = () => {},
  handleSwitchNetwork = () => {},
  handleCopyAddress = () => {},
  handleSwitchAccount = () => {},
  isSupportedChain = true,
  networkInfo = {},
  otherAccounts = [],
  formattedAddress = '',
}: WalletConnectButtonMobileProps) {
  const { chain } = useAccount();

  // If no address is provided, this shouldn't be rendered
  if (!address) {
    return null;
  }

  // Get the current network info
  const currentNetwork = chain?.id ? networkInfo?.[chain.id] : null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Network Switcher */}
      {showNetworkSwitcher && (
        <DropdownMenu 
          open={isNetworkDropdownOpen} 
          onOpenChange={setIsNetworkDropdownOpen}
        >
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5"
              disabled={isSwitching}
            >
              <div 
                className={`h-2 w-2 rounded-full ${
                  isSupportedChain ? 'bg-green-500' : 'bg-yellow-500'
                }`} 
              />
               <span className="hidden sm:inline">
                {currentNetwork?.name || 'Unsupported Network'}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {networkInfo && Object.values(networkInfo).map((network) => (
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

      {/* Account Dropdown */}
      <DropdownMenu 
        open={isAccountDropdownOpen} 
        onOpenChange={setIsAccountDropdownOpen}
      >
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5"
            disabled={isSwitchingAccount}
          >
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="hidden sm:inline">
              {formattedAddress}
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
              handleCopyAddress();
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyAddress();
                          }}
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
              <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                <span className="font-mono">
                  {formattedAddress}
                </span>
                <div className="flex items-center space-x-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (chain?.id) {
                              const explorerUrl = `https://${chain.id === CHAIN_IDS.CELO_MAINNET ? 'celo' : 'celo-alfajores'}.blockscout.com/address/${address}`;
                              window.open(explorerUrl, '_blank', 'noopener,noreferrer');
                            }
                          }}
                          className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View on Explorer</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          </DropdownMenuItem>
          {otherAccounts && otherAccounts.length > 0 ? (
            otherAccounts.map((account) => {
              const accountAddress = typeof account === 'string' ? account : account.address;
              const displayName = typeof account === 'string' 
                ? `${account.slice(0, 6)}...${account.slice(-4)}`
                : account.formattedAddress || `${account.address.slice(0, 6)}...${account.address.slice(-4)}`;
              
              return (
                <DropdownMenuItem
                  key={accountAddress}
                  onClick={() => handleSwitchAccount(accountAddress)}
                  className="flex items-center gap-2"
                  disabled={isSwitchingAccount}
                >
                  <div className="w-2 h-2 rounded-full bg-primary/50"></div>
                  <span className="font-mono">
                    {displayName}
                  </span>
                </DropdownMenuItem>
              );
            })
          ) : (
            <>
              <div className="px-2 py-1.5 mt-1">
                <div className="text-xs text-muted-foreground mb-2">
                  No other accounts found in your wallet.
                </div>
              </div>
              <div className="px-2 py-2 border-t mt-1">
                <div className="text-xs text-muted-foreground whitespace-pre-line">
                  Add accounts in your wallet and refresh this page
                </div>
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Disconnect Button */}
      <Button
        variant="outline"
        size={size}
        onClick={handleDisconnect}
        disabled={isDisconnecting || isConnecting || isSwitching}
      >
        {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
      </Button>
    </div>
  );
}
