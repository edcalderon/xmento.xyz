import { renderHook, act } from '@testing-library/react';
import { useDisconnect } from '@/hooks/useDisconnect';
import { useWallet } from '@/contexts/WalletContext';
import { useDisconnect as useWagmiDisconnect } from 'wagmi';
import { useToast } from '@/components/ui/use-toast';

// Mock the required modules
jest.mock('@/contexts/WalletContext');
jest.mock('wagmi');
jest.mock('@/components/ui/use-toast');

describe('useDisconnect', () => {
  const mockWalletDisconnect = jest.fn();
  const mockWagmiDisconnect = jest.fn();
  const mockToast = jest.fn();

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup mocks
    (useWallet as jest.Mock).mockReturnValue({
      disconnect: mockWalletDisconnect,
    });
    
    (useWagmiDisconnect as jest.Mock).mockReturnValue({
      disconnect: mockWagmiDisconnect,
    });
    
    (useToast as jest.Mock).mockReturnValue({
      toast: mockToast,
    });
    
    // Mock localStorage and sessionStorage
    Storage.prototype.removeItem = jest.fn();
    Storage.prototype.clear = jest.fn();
    
    // Mock window.ethereum
    Object.defineProperty(window, 'ethereum', {
      value: {
        isMetaMask: true,
        request: jest.fn(),
      },
      writable: true,
    });
  });

  it('should disconnect from both wallet context and wagmi', async () => {
    const { result } = renderHook(() => useDisconnect());
    
    await act(async () => {
      await result.current.disconnect({ showToast: true });
    });
    
    expect(mockWalletDisconnect).toHaveBeenCalledTimes(1);
    expect(mockWagmiDisconnect).toHaveBeenCalledTimes(1);
    
    // Verify toast was shown
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Disconnected',
      description: 'You have been disconnected from your wallet.',
    });
  });

  it('should clear all relevant storage', async () => {
    const { result } = renderHook(() => useDisconnect());
    
    await act(async () => {
      await result.current.disconnect({ showToast: false });
    });
    
    // Verify storage was cleared
    const removedKeys = [
      'walletAddress',
      'walletConnected',
      'walletProvider',
      'wagmi.store',
      'wagmi.cache',
      'walletconnect',
      'wc@2',
    ];
    
    removedKeys.forEach(key => {
      expect(localStorage.removeItem).toHaveBeenCalledWith(key);
    });
    
    // Verify session storage was updated
    expect(sessionStorage.setItem).toHaveBeenCalledWith('walletDisconnected', expect.any(String));
  });

  it('should handle errors gracefully', async () => {
    const error = new Error('Disconnect failed');
    mockWalletDisconnect.mockRejectedValueOnce(error);
    
    const { result } = renderHook(() => useDisconnect());
    
    await act(async () => {
      await result.current.disconnect({ showToast: true });
    });
    
    // Verify error toast was shown
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Error',
      description: 'Failed to disconnect properly. Please try again.',
      variant: 'destructive',
    });
  });
});
