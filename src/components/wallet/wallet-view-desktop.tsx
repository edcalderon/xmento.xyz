"use client";

import { Copy, Check, ChevronDown, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAccount } from 'wagmi';
import { CHAIN_IDS } from "@/lib/wagmi.config";
import type { WalletViewDesktopProps } from '@/types/wallet';

export function WalletViewDesktop({
  className = "",
  size = "sm",
  showNetworkSwitcher = true,
  address,
  isConnecting = false,
  isSwitching = false,
  isSwitchingAccount = false,
  isDisconnecting = false,
  isAccountDropdownOpen = false,
  setIsAccountDropdownOpen = () => { },
  isNetworkDropdownOpen = false,
  setIsNetworkDropdownOpen = () => { },
  handleDisconnect = () => { },
  handleSwitchNetwork = () => { },
  handleCopyAddress = () => { },
  handleSwitchAccount = () => { },
  isSupportedChain = true,
  networkInfo = {},
  otherAccounts = [],
  accounts = [],
  handleAddAccount = () => { },
  formattedAddress = '',
}: WalletViewDesktopProps) {
  const { chain, connector } = useAccount();

  // Get the current network info
  const currentNetwork = chain?.id ? networkInfo?.[chain.id] : null;

  // Format the current address for display
  const displayAddress = formattedAddress || `${address?.slice(0, 6)}...${address?.slice(-4)}`;

  // Connected state
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Network Switcher */}
      {showNetworkSwitcher && (
        <DropdownMenu open={isNetworkDropdownOpen} onOpenChange={setIsNetworkDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size={size}
              className="flex items-center gap-1.5"
              disabled={isSwitching}
            >
              <div className={`h-2 w-2 rounded-full ${isSupportedChain ? 'bg-green-500' : 'bg-yellow-500'
                }`} />
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

      {/* Account Switcher */}
      <DropdownMenu open={isAccountDropdownOpen} onOpenChange={setIsAccountDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size={size}
            className="flex items-center gap-1.5"
            disabled={isSwitching || isDisconnecting}
          >
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="hidden sm:inline">
              {displayAddress}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <div className="px-2 py-1.5 text-sm font-semibold">Connected Accounts</div>
          {accounts.map((account) => {
            const isCurrentAccount = address ? account.address.toLowerCase() === address.toLowerCase() : false;
            const accountFormattedAddress = account.formattedAddress ||
              `${account.address.slice(0, 6)}...${account.address.slice(-4)}`;

            return (
              <DropdownMenuItem
                key={account.address}
                className={`opacity-100 hover:bg-accent cursor-pointer ${isCurrentAccount ? 'bg-accent/50' : ''}`}
                onClick={isCurrentAccount
                  ? (e) => {
                    e.stopPropagation();
                    handleCopyAddress();
                  }
                  : () => handleSwitchAccount(account.address)
                }
              >
                <div className="flex flex-col w-full">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                      <span className="font-medium">{accountFormattedAddress}</span>
                      {isCurrentAccount && <Check className="h-4 w-4 text-green-500 ml-1" />}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(account.address);
                                // You might want to add a toast notification here
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
                      {account.formattedAddress ||
                        `${account.address.slice(0, 6)}...${account.address.slice(-4)}`}
                    </span>
                    <div className="flex items-center space-x-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(
                                  `https://${chain?.id === CHAIN_IDS.CELO_MAINNET ? 'celo' : 'celo-alfajores'}.blockscout.com/address/${account.address}`,
                                  '_blank',
                                  'noopener,noreferrer'
                                );
                              }}
                              className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
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
            );
          })}
          {/* Connected Accounts Section */}
          <div className="px-2 py-1.5 mt-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">
                Connected Accounts ({accounts.length})
              </span>
              {(connector?.id === 'injected' || connector?.id === 'metaMask') && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddAccount();
                  }}
                  disabled={isSwitchingAccount}
                  className={`text-xs flex items-center text-primary hover:text-primary/80 ${isSwitchingAccount ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Account
                </button>
              )}
            </div>

            {/* Other Accounts in Wallet */}
            {otherAccounts && otherAccounts.length > 0 && (
              <>
                <div className="text-xs text-muted-foreground mb-2">
                  Other accounts in your wallet:
                </div>
                <div className="max-h-40 overflow-y-auto pr-1">
                  {otherAccounts
                    .filter(account =>
                      !accounts.some(acc =>
                        acc.address.toLowerCase() ===
                        (typeof account === 'string' ? account : account.address).toLowerCase()
                      )
                    )
                    .map((account) => {
                      const accountAddress = typeof account === 'string' ? account : account.address;
                      const displayName = typeof account === 'string'
                        ? `${account.slice(0, 6)}...${account.slice(-4)}`
                        : account.formattedAddress || `${account.address.slice(0, 6)}...${account.address.slice(-4)}`;

                      return (
                        <DropdownMenuItem
                          key={accountAddress}
                          onClick={() => handleSwitchAccount(accountAddress)}
                          className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-accent/50"
                        >
                          <div className="flex-1 truncate">
                            <div className="text-sm font-medium">
                              {displayName}
                            </div>
                            {typeof account !== 'string' && account.ensName && (
                              <div className="text-xs text-muted-foreground">
                                {account.ensName}
                              </div>
                            )}
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </DropdownMenuItem>
                      );
                    })}
                </div>
              </>
            )}
          </div>
          {/* Help Section */}
          <div className="px-2 py-2 border-t mt-1">
            {connector?.id === 'injected' || connector?.id === 'metaMask' ? (
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">
                  <p>To add more accounts:</p>
                  <ol className="list-decimal pl-4 space-y-1 mt-1">
                    <li>Open your wallet extension</li>
                    <li>Create or import another account</li>
                    <li>Click the button below to refresh</li>
                  </ol>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => window.location.reload()}
                >
                  Refresh Accounts
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Use an injected wallet (like MetaMask) to manage multiple accounts
              </p>
            )}
          </div>
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
