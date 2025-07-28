"use client";

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { useAccount, useSwitchChain, useChainId, useDisconnect } from 'wagmi';
import { copyToClipboard, shortenAddress } from '@/lib/utils';
import type {  NetworkID } from '@/types/network';
import type { WalletConnectHandlers, AccountInfo, EIP1193Provider } from '@/types/wallet';
import { SUPPORTED_CHAINS, NETWORK_INFO } from '@/lib/wagmi.config';

export function useWalletConnectHandlers(): WalletConnectHandlers {
  const { toast } = useToast();
  const { address: account, isConnected, disconnect: disconnectWallet, connect } = useWalletConnection();
  const { connector } = useAccount();
  const { switchChain } = useSwitchChain();
  const currentChainId = useChainId();
  const { disconnect: wagmiDisconnect } = useDisconnect();

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
  const [accounts, setAccounts] = useState<AccountInfo[]>([]);

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
    if (isDisconnecting) return;

    setIsDisconnecting(true);
    try {
      if (disconnectWallet) {
        await disconnectWallet();
      } else {
        await wagmiDisconnect();
      }
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
  }, [disconnectWallet, isDisconnecting, toast, wagmiDisconnect]);

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
      // For MetaMask and injected providers, we can use the provider to switch accounts
      const provider = await connector.getProvider();
      if (provider && typeof provider === 'object' && 'request' in provider && 
          typeof (provider as any).request === 'function') {
        // Request account switch
        await (provider as any).request({
          method: 'wallet_requestPermissions',
          params: [{
            eth_accounts: {}
          }]
        });
      }
      
      // Update accounts list with the new active account
      const updatedAccounts = accounts.map(acc => ({
        ...acc,
        isActive: acc.address.toLowerCase() === address.toLowerCase()
      }));
      setAccounts(updatedAccounts);
      
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
  }, [connector, accounts]);
  
  // Track account changes
  useEffect(() => {
    const handleAccountsChanged = (newAccounts: string[]) => {
      if (newAccounts.length === 0) {
        // Handle the case where the user disconnects all accounts
        if (disconnectWallet) {
          disconnectWallet();
        } else if (wagmiDisconnect) {
          wagmiDisconnect();
        }
        return;
      }
      
      // Get the current active account
      const currentAccount = account?.toLowerCase();
      
      // Create a map of existing accounts for quick lookup
      const existingAccounts = new Map(accounts.map(acc => [acc.address.toLowerCase(), acc]));
      
      // Update or add accounts
      const updatedAccounts = newAccounts.map(addr => {
        const addrLower = addr.toLowerCase();
        const existing = existingAccounts.get(addrLower);
        
        return {
          address: addr as `0x${string}`,
          isActive: addrLower === currentAccount,
          ensName: existing?.ensName,
          avatar: existing?.avatar,
          formattedAddress: existing?.formattedAddress || `${addr.slice(0, 6)}...${addr.slice(-4)}`
        };
      });
      
      setAccounts(updatedAccounts);
    };
    
    // Set up the event listener for account changes
    const setupAccountListener = async () => {
      if (!connector) return;
      
      try {
        const provider = await connector.getProvider();
        if (provider && typeof provider === 'object' && 'on' in provider && 
            typeof (provider as any).on === 'function') {
          (provider as any).on('accountsChanged', handleAccountsChanged);
        }
      } catch (error) {
        console.error('Error setting up account listener:', error);
      }
    };
    
    setupAccountListener();
    
    // Clean up
    return () => {
      if (connector) {
        connector.getProvider().then(provider => {
          if (provider && typeof provider === 'object' && 'removeListener' in provider && 
              typeof (provider as any).removeListener === 'function') {
            (provider as any).removeListener('accountsChanged', handleAccountsChanged);
          }
        }).catch(console.error);
      }
    };
  }, [connector, account, disconnectWallet]);
  
  // Update accounts when the connected account changes
  useEffect(() => {
    if (!account) {
      setAccounts(prev => prev.map(acc => ({ ...acc, isActive: false })));
      return;
    }
    
    const accountLower = account.toLowerCase();
    
    // Update the accounts list with the new active account
    setAccounts(prev => {
      // If the account is already in the list, just update the active status
      if (prev.some(acc => acc.address.toLowerCase() === accountLower)) {
        return prev.map(acc => ({
          ...acc,
          isActive: acc.address.toLowerCase() === accountLower
        }));
      }
      
      // Otherwise, add the new account
      return [
        ...prev.filter(acc => acc.address.toLowerCase() !== accountLower),
        {
          address: account,
          isActive: true,
          ensName: undefined,
          avatar: undefined,
          formattedAddress: `${account.slice(0, 6)}...${account.slice(-4)}`
        }
      ];
    });
  }, [account]);

  const formattedAddress = useMemo(() => {
    if (!account) return '';
    return shortenAddress(account);
  }, [account]);

  // Derive otherAccounts from accounts (all non-active accounts)
  const otherAccounts = useMemo(() => 
    accounts.filter(acc => acc.address.toLowerCase() !== account?.toLowerCase())
  , [accounts, account]);

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
    accounts,
    otherAccounts,
    formattedAddress,
  };
}
