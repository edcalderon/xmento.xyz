"use client";

import { Wallet2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WalletConnectButtonDesktop } from "./wallet-connect-button-desktop";
import { WalletConnectButtonMobile } from "./wallet-connect-button-mobile";
import { WalletConnectModal } from "./wallet-connect-modal";
import { useWalletConnectHandlers } from "@/hooks/useWalletConnectHandlers";
import { useAccount } from 'wagmi';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { cn } from '@/lib/utils';
import { NetworkInfo } from '@/types/network';
import type { WalletConnectButtonProps } from '@/types/wallet';

export function WalletConnectButton({
  className = "",
  variant = "default",
  size = "default",
}: WalletConnectButtonProps) {
  const isMobile = useBreakpoint().isMobile;
  const {
    isModalOpen,
    setIsModalOpen,
    isSwitching,
    ...handlers
  } = useWalletConnectHandlers();
  
  const { address, isConnecting } = useAccount();

  const networkInfo = Object.fromEntries(
    Object.entries(handlers.networkInfo || {}).map(([chainId, network]) => [
      chainId,
      {
        id: network.id,
        name: network.name,
        isTestnet: network.isTestnet || false, 
        icon: network.icon || '', 
      } as NetworkInfo
    ])
  ) as Record<number, NetworkInfo>;

  const commonProps = {
    ...handlers,
    networkInfo,
    address: address as `0x${string}`,
    isConnecting,
    isSwitching,
    formattedAddress: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''
  };

  const connectButton = (
    <Button
      onClick={() => setIsModalOpen(true)}
      disabled={isConnecting || isSwitching}
      className={cn(className, 'gap-2')}
      variant={variant}
      size={size}
    >
      <Wallet2 className="h-4 w-4" />
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  );

  const connectModal = (
    <WalletConnectModal
      isOpen={isModalOpen}
      onOpenChange={setIsModalOpen}
    />
  );

  if (!address) {
    return (
      <>
        {connectButton}
        {connectModal}
      </>
    );
  }

  if (isMobile) {
    return <WalletConnectButtonMobile {...commonProps} />;
  }
  return <WalletConnectButtonDesktop {...commonProps} />;
}
