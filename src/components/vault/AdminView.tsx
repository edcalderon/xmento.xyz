'use client';

import { useState, useEffect } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { XmentoVaultABI } from './XmentoVaultABI';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface AdminViewProps {
  vaultAddress: `0x${string}` | null;
  chainId: number;
}

export function AdminView({ vaultAddress, chainId }: AdminViewProps) {
  const { toast } = useToast();
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [vaultBalance, setVaultBalance] = useState<bigint>(0n);
  const [isProcessing, setIsProcessing] = useState(false);

  // Read vault balance
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: vaultAddress || undefined,
    abi: XmentoVaultABI,
    functionName: 'getTVL',
    chainId,
    query: {
      enabled: !!vaultAddress,
      refetchInterval: 10000,
    },
  });

  // Update vault balance when data changes
  useEffect(() => {
    if (balance !== undefined) {
      setVaultBalance(BigInt(balance.toString()));
    }
  }, [balance]);

  // Withdraw funds from vault
  const { writeContract: withdraw, isPending: isWithdrawPending } = useWriteContract({
    mutation: {
      onSuccess: () => {
        toast({
          title: 'Withdrawal submitted',
          description: 'Funds are being withdrawn from the vault.',
        });
        setWithdrawAmount('');
      },
      onError: (error) => {
        toast({
          title: 'Withdrawal failed',
          description: error.message,
          variant: 'destructive',
        });
        setIsProcessing(false);
      },
    },
  });

  // Wait for transaction receipt
  const { isLoading: isWithdrawProcessing } = useWaitForTransactionReceipt({
    hash: undefined, // Will be set when withdrawal is triggered
  });

  // Handle withdrawal
  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || !parseFloat(withdrawAmount) || !vaultAddress) {
      toast({
        title: 'Error',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }

    const amount = parseEther(withdrawAmount);
    if (amount > vaultBalance) {
      toast({
        title: 'Error',
        description: 'Insufficient balance in vault',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    withdraw({
      address: vaultAddress,
      abi: XmentoVaultABI,
      functionName: 'withdraw',
      args: [amount],
      chainId,
    });
  };

  // Refresh UI when withdrawal is complete
  useEffect(() => {
    if (isWithdrawPending || isWithdrawProcessing) return;
    
    if (isProcessing) {
      setIsProcessing(false);
      refetchBalance();
    }
  }, [isWithdrawPending, isWithdrawProcessing, isProcessing, refetchBalance]);

  return (
    <div className="grid gap-6">
      {/* Vault Balance */}
      <Card>
        <CardHeader>
          <CardTitle>Vault Management</CardTitle>
          <CardDescription>
            Manage the Xmento Vault
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Vault Balance</span>
              <span className="font-mono">
                {vaultBalance !== undefined 
                  ? `${formatEther(vaultBalance)}` 
                  : 'Loading...'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Withdraw Form */}
      <Card>
        <CardHeader>
          <CardTitle>Withdraw Funds</CardTitle>
          <CardDescription>Withdraw funds from the vault</CardDescription>
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
                disabled={!vaultAddress || isWithdrawPending || isWithdrawProcessing}
              />
              <Button 
                type="submit" 
                variant="destructive"
                disabled={!vaultAddress || isWithdrawPending || isWithdrawProcessing}
              >
                {isWithdrawPending || isWithdrawProcessing ? 'Processing...' : 'Withdraw'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {!vaultAddress && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Vault Found</AlertTitle>
          <AlertDescription>
            Please connect a wallet with an associated vault to manage it.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
