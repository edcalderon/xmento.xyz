"use client";

import { ChevronDown, Check, Copy, ExternalLink, Wallet, LogOut, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAccount } from 'wagmi';
import { CHAIN_IDS } from "@/lib/wagmi.config";
import type { WalletViewMobileProps } from '@/types/wallet';
import { cn } from "@/lib/utils";

export function WalletViewMobile({
  className = "",
  size = "sm",
  showNetworkSwitcher = true,
  address,
  isSwitching = false,
  isSwitchingAccount = false,
  isDisconnecting = false,
  isAccountDropdownOpen = false,
  setIsAccountDropdownOpen = () => {},
  handleDisconnect = () => {},
  handleSwitchNetwork = () => {},
  handleCopyAddress = () => {},
  handleSwitchAccount = () => {},
  isSupportedChain = true,
  networkInfo = {},
  otherAccounts = [],
  formattedAddress = '',
}: WalletViewMobileProps) {
  const { chain } = useAccount();

  if (!address) {
    return null;
  }

  const currentNetwork = chain?.id ? networkInfo?.[chain.id] : null;
  const shortAddress = formattedAddress ? `${formattedAddress.slice(0, 4)}...${formattedAddress.slice(-4)}` : '';

  return (
    <div className={cn("relative", className)}>
      <DropdownMenu 
        open={isAccountDropdownOpen}
        onOpenChange={setIsAccountDropdownOpen}
      >
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size={size}
            className="flex items-center gap-2 pr-2 pl-3 h-10"
            disabled={isSwitching || isSwitchingAccount}
          >
            <div className={cn(
              "h-2.5 w-2.5 rounded-full",
              isSupportedChain ? 'bg-green-500' : 'bg-yellow-500'
            )} />
            <span className="font-medium text-sm">{shortAddress}</span>
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform",
              isAccountDropdownOpen ? "transform rotate-180" : ""
            )} />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="end" 
          className="w-72 p-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
          sideOffset={8}
        >
          {/* Network Section */}
          {showNetworkSwitcher && (
            <>
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Network</div>
              <div className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-accent transition-colors">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    isSupportedChain ? 'bg-green-500' : 'bg-yellow-500'
                  )} />
                  <span className="text-sm font-medium">
                    {currentNetwork?.name || 'Unsupported Network'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {isSwitching && (
                    <div className="h-3 w-3 border-2 border-muted-foreground/50 border-t-primary rounded-full animate-spin" />
                  )}
                  <Network className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              
              <div className="space-y-1 mt-1 max-h-48 overflow-y-auto">
                {networkInfo && Object.values(networkInfo).map((network) => (
                  <DropdownMenuItem
                    key={network.id}
                    onClick={() => handleSwitchNetwork(network.id)}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-md text-sm",
                      chain?.id === network.id ? "bg-accent font-medium" : ""
                    )}
                    disabled={isSwitching}
                  >
                    <span>{network.name}</span>
                    {chain?.id === network.id && <Check className="h-4 w-4 text-primary" />}
                  </DropdownMenuItem>
                ))}
              </div>
              <DropdownMenuSeparator className="my-2" />
            </>
          )}

          {/* Account Section */}
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Account</div>
          <DropdownMenuItem
            className="flex flex-col items-stretch p-0 rounded-md overflow-hidden hover:bg-accent"
            onClick={(e) => e.preventDefault()}
          >
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Current Account</span>
                  <span className="text-xs text-muted-foreground font-mono">{shortAddress}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyAddress();
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                {chain?.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      const explorerUrl = `https://${chain.id === CHAIN_IDS.CELO_MAINNET ? 'celo' : 'celo-alfajores'}.blockscout.com/address/${address}`;
                      window.open(explorerUrl, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </DropdownMenuItem>

          {/* Other Accounts */}
          {otherAccounts && otherAccounts.length > 0 && (
            <div className="mt-2">
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Switch Account</div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {otherAccounts.map((account) => {
                  const accountAddress = typeof account === 'string' ? account : account.address;
                  const displayName = typeof account === 'string' 
                    ? `${account.slice(0, 6)}...${account.slice(-4)}`
                    : account.formattedAddress || `${account.address.slice(0, 6)}...${account.address.slice(-4)}`;
                  
                  return (
                    <DropdownMenuItem
                      key={accountAddress}
                      onClick={() => handleSwitchAccount(accountAddress)}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-md"
                      disabled={isSwitchingAccount}
                    >
                      <div className="w-2 h-2 rounded-full bg-primary/50"></div>
                      <span className="font-mono">{displayName}</span>
                    </DropdownMenuItem>
                  );
                })}
              </div>
            </div>
          )}

          <DropdownMenuSeparator className="my-2" />

          {/* Actions */}
          <DropdownMenuItem 
            onClick={handleDisconnect}
            className="flex items-center gap-2 px-3 py-2 text-sm text-destructive rounded-md hover:bg-destructive/10"
            disabled={isDisconnecting}
          >
            <LogOut className="h-4 w-4" />
            <span>Disconnect Wallet</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
