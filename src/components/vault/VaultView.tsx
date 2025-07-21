'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { XmentoVaultABI } from './XmentoVaultABI';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

type TokenSymbol = 'cUSD' | 'cEUR' | 'cREAL';

interface VaultViewProps {
  vaultAddress: `0x${string}` | null;
  isManager: boolean;
  chainId: number;
  selectedToken: TokenSymbol;
  onTokenChange: (token: TokenSymbol) => void;
  isWrongNetwork: boolean;
}

export function VaultView({
  vaultAddress,
  isManager,
  chainId,
  selectedToken,
  onTokenChange,
  isWrongNetwork
}: VaultViewProps) {
  const { address } = useAccount();
  const { toast } = useToast();
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [vaultTVL, setVaultTVL] = useState<number>(0);
  
  // Read user balance
  const { data: tokenBalance, refetch: refetchBalance } = useReadContract({
    address: vaultAddress || undefined,
    abi: XmentoVaultABI,
    functionName: 'getUserBalance',
    args: [address as `0x${string}`],
    chainId,
    query: {
      enabled: !!vaultAddress && !!address,
      refetchInterval: 10000,
    },
  });

  // Read TVL
  const { data: tvl, refetch: refetchTVL } = useReadContract({
    address: vaultAddress || undefined,
    abi: XmentoVaultABI,
    functionName: 'getTVL',
    chainId,
    query: {
      enabled: !!vaultAddress,
      refetchInterval: 10000,
    },
  });

  // Update TVL when data changes
  useEffect(() => {
    if (tvl !== undefined) {
      setVaultTVL(Number(tvl));
    }
  }, [tvl]);

  // Format TVL for display
  const formattedTVL = vaultTVL 
    ? `$${vaultTVL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
    : 'Loading...';

  // Format balance for display
  const formattedBalance = tokenBalance 
    ? `${formatEther(tokenBalance)} ${selectedToken}` 
    : '0.00';

  // Handle deposit
  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || !parseFloat(depositAmount) || !address || !vaultAddress) {
      toast({
        title: 'Error',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }
    // Deposit logic will be handled by parent component
  };

  // Handle withdrawal
  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || !parseFloat(withdrawAmount) || !address || !vaultAddress) {
      toast({
        title: 'Error',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }
    // Withdrawal logic will be handled by parent component
  };

  return (
    <div className="grid gap-6">
      {/* Vault Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Your Vault</CardTitle>
          <CardDescription>
            Manage your assets in the Xmento Vault
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Value Locked</span>
              <span className="font-mono">{formattedTVL}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Your Balance</span>
              <span className="font-mono">{formattedBalance}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deposit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Deposit</CardTitle>
          <CardDescription>Add funds to your vault</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleDeposit} className="space-y-4">
            <div className="grid gap-2">
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  step="0.01"
                  min="0"
                  disabled={isWrongNetwork}
                />
                <select
                  value={selectedToken}
                  onChange={(e) => onTokenChange(e.target.value as TokenSymbol)}
                  className="px-3 py-2 border rounded-md"
                  disabled={isWrongNetwork}
                >
                  <option value="cUSD">cUSD</option>
                  <option value="cEUR">cEUR</option>
                  <option value="cREAL">cREAL</option>
                </select>
              </div>
              <Button type="submit" disabled={!vaultAddress || isWrongNetwork}>
                Deposit
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Withdraw Form */}
      <Card>
        <CardHeader>
          <CardTitle>Withdraw</CardTitle>
          <CardDescription>Withdraw funds from your vault</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleWithdraw} className="space-y-4">
            <div className="grid gap-2">
              <Input
                type="number"
                placeholder="0.00"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                step="0.01"
                min="0"
                disabled={isWrongNetwork}
              />
              <Button type="submit" variant="outline" disabled={!vaultAddress || isWrongNetwork}>
                Withdraw
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {isWrongNetwork && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Wrong Network</AlertTitle>
          <AlertDescription>
            Please switch to a supported network to interact with the vault.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
