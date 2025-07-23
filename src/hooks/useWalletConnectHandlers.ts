"use client";

import { useState, useCallback, useMemo } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { useAccount, useSwitchChain, useChainId } from 'wagmi';
import { copyToClipboard, shortenAddress } from '@/lib/utils';
import type {  NetworkID } from '@/types/network';
import type { WalletConnectHandlers, AccountInfo, EIP1193Provider } from '@/types/wallet';
import { SUPPORTED_CHAINS, NETWORK_INFO } from '@/lib/wagmi.config';

export function useWalletConnectHandlers(): WalletConnectHandlers {
  const { toast } = useToast();
  const { address: account, isConnected, disconnect, connect } = useWalletConnection();
  const { connector } = useAccount();
  const { switchChain } = useSwitchChain();
  const currentChainId = useChainId();

  // State management
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSwitchingAccount, setIsSwitchingAccount] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [otherAccounts, setOtherAccounts] = useState<AccountInfo[]>([]);

  // Check if current chain is supported
  const isSupportedChain = currentChainId ? SUPPORTED_CHAINS.some(chain => chain.id === currentChainId) : false;

  // Handle network switching
  const handleSwitchNetwork = useCallback(async (targetChainId: NetworkID) => {
    if (!isConnected || !switchChain) return;

    setIsSwitching(true);
    try {
      if (!SUPPORTED_CHAINS.some(chain => chain.id === targetChainId)) {
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
      setIsNetworkModalOpen(false);
    }
  }, [isConnected, switchChain, toast]);

  // Handle wallet connection
  const handleConnect = useCallback(async () => {
    if (!connect) {
      console.error('Connect function is not available');
      return;
    }
    
    try {
      setIsModalOpen(true);
      await connect();
    } catch (error: any) {
      console.error('Failed to connect:', error);
      toast({
        title: 'Connection failed',
        description: error?.message || 'An error occurred while connecting to wallet',
        variant: 'destructive',
      });
      setIsModalOpen(false);
    }
  }, [connect, toast]);

  // Handle disconnect
  const handleDisconnect = useCallback(async () => {
    if (!disconnect || isDisconnecting) return;

    setIsDisconnecting(true);
    try {
      await disconnect();
      toast({
        title: 'Disconnected',
        description: 'Successfully disconnected from wallet',
      });
    } catch (error: any) {
      console.error('Failed to disconnect:', error);
      toast({
        title: 'Failed to disconnect',
        description: error?.message || 'An error occurred while disconnecting',
        variant: 'destructive',
      });
    } finally {
      setIsDisconnecting(false);
    }
  }, [disconnect, isDisconnecting, toast]);

  // Handle address copy
  const handleCopyAddress = useCallback((): void => {
    if (!account) return;

    copyToClipboard(account);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Address copied',
      description: 'Wallet address has been copied to clipboard',
    });
  }, [account, toast]);

  // Handle adding a new account
  const handleAddAccount = useCallback(async () => {
    if (!connector) return;

    try {
      // This will trigger the wallet's account selection UI
      const provider = await connector.getProvider() as EIP1193Provider;
      await provider.request({ 
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }] 
      });
      toast({
        title: 'Account added',
        description: 'Please select or create a new account in your wallet',
      });
    } catch (error: any) {
      console.error('Failed to add account:', error);
      toast({
        title: 'Failed to add account',
        description: error?.message || 'An error occurred while adding a new account',
        variant: 'destructive',
      });
    } finally {
      setIsAccountDropdownOpen(false);
    }
  }, [connector, toast]);

  // Handle account switching
  const handleSwitchAccount = useCallback(async (address: string) => {
    if (!connector) return;

    setIsSwitchingAccount(true);
    try {
      // Type assertion for switchAccount as it might not be available on all connectors
      const switchAccount = (connector as any).switchAccount;
      if (typeof switchAccount === 'function') {
        await switchAccount(address);
      } else {
        // Fallback for connectors that don't support switchAccount
        await disconnect();
        // Connect using the default connection method
        await connect('injected');
      }
      toast({
        title: 'Account switched',
        description: 'Successfully switched to new account',
      });
    } catch (error: any) {
      console.error('Failed to switch account:', error);
      toast({
        title: 'Failed to switch account',
        description: error?.message || 'An error occurred while switching accounts',
        variant: 'destructive',
      });
    } finally {
      setIsSwitchingAccount(false);
      setIsAccountDropdownOpen(false);
      setIsAccountModalOpen(false);
    }
  }, [connector, disconnect, connect, toast]);

  const formattedAddress = useMemo(() => {
    if (!account) return '';
    return shortenAddress(account);
  }, [account]);

  return {
    isModalOpen,
    setIsModalOpen,
    isSwitching,
    setIsSwitching,
    isNetworkDropdownOpen,
    setIsNetworkDropdownOpen,
    isAccountDropdownOpen,
    setIsAccountDropdownOpen,
    copied,
    setCopied,
    isSwitchingAccount,
    setIsSwitchingAccount,
    isDisconnecting,
    setIsDisconnecting,
    isNetworkModalOpen,
    setIsNetworkModalOpen,
    isAccountModalOpen,
    setIsAccountModalOpen,
    handleSwitchNetwork,
    handleConnect,
    handleDisconnect,
    handleCopyAddress,
    handleSwitchAccount,
    handleAddAccount,
    isSupportedChain,
    networkInfo: NETWORK_INFO,
    otherAccounts,
    formattedAddress,
  };
}
