'use client';

import { useCallback, useState } from 'react';
import { useDisconnect as useWagmiDisconnect, useAccount } from 'wagmi';
import { useToast } from '@/components/ui/use-toast';

/**
 * A comprehensive hook that handles disconnecting the user from the application
 * by clearing all wallet and vault related data from:
 * - wagmi state
 * - WalletContext
 * - localStorage/sessionStorage
 * - In-memory React state
 */
export function useDisconnect() {
  const { disconnect: wagmiDisconnect } = useWagmiDisconnect();
  const { isConnected } = useAccount();
  const { toast } = useToast();
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  /**
   * Clears all vault-related data from localStorage
   */
  const clearVaultData = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    try {
      // Clear all vault-related keys from localStorage
      const vaultKeys = [];
      
      // Find all keys that start with 'vaults_'
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('vaults_')) {
          vaultKeys.push(key);
        }
      }
      
      // Remove each vault key
      vaultKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Clear any other vault-related data
      localStorage.removeItem('selectedVault');
      localStorage.removeItem('vaultAddress');
    } catch (error) {
      console.error('Error clearing vault data:', error);
    }
  }, []);

  /**
   * Clears all wallet-related data from localStorage and sessionStorage
   */
  const clearWalletData = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    try {
      // Clear all wallet-related keys from localStorage
      const walletKeys = [
        'wagmi.wallet',
        'wagmi.connected',
        'wagmi.connected.connector',
        'wagmi.connected.chainId',
        'wagmi.store',
        'wagmi.cache',
        'walletconnect',
        'WALLETCONNECT_DEEPLINK_CHOICE',
        'walletAddress',
      ];
      
      // Clear each key individually instead of clearing all of sessionStorage
      walletKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
          // Also clear from sessionStorage but only specific keys
          if (['wagmi.connected', 'wagmi.connected.connector', 'wagmi.connected.chainId'].includes(key)) {
            sessionStorage.removeItem(key);
          }
        } catch (e) {
          console.warn(`Failed to remove ${key} from storage:`, e);
        }
      });
      
      // Clear any remaining wagmi cache
      const wagmiKeys = Object.keys(localStorage).filter(key => key.startsWith('wagmi.'));
      wagmiKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.warn(`Failed to remove ${key} from localStorage:`, e);
        }
      });
      
    } catch (error) {
      console.error('Error clearing wallet data:', error);
    }
  }, []);

  /**
   * Handles the complete disconnection process
   */
  const handleDisconnect = useCallback(async (options?: { showToast?: boolean }) => {
    if (isDisconnecting) return false;
    
    setIsDisconnecting(true);
    
    try {
      // 1. First, disconnect from wagmi
      await wagmiDisconnect();
      
      // 2. Clear wallet data
      clearWalletData();
      
      // 3. Clear vault data
      clearVaultData();
      
      // 4. Clear any remaining wallet data
      if (typeof window !== 'undefined') {
        // Only clear specific session storage items instead of everything
        ['wagmi.connected', 'wagmi.connected.connector', 'wagmi.connected.chainId'].forEach(key => {
          try {
            sessionStorage.removeItem(key);
          } catch (e) {
            console.warn(`Failed to remove ${key} from sessionStorage:`, e);
          }
        });
      }
      
      if (options?.showToast !== false) {
        toast({
          title: 'Disconnected',
          description: 'You have been successfully disconnected.',
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast({
        title: 'Error',
        description: 'Failed to disconnect. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsDisconnecting(false);
    }
  }, [wagmiDisconnect, clearVaultData, toast]);

  return {
    disconnect: handleDisconnect as (options?: { showToast?: boolean }) => Promise<boolean>,
    isConnected,
    isDisconnecting
  };
}

export default useDisconnect;
