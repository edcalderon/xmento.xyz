'use client';

import { useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { XmentoVaultABI } from '@/components/vault/XmentoVaultABI';

const VAULT_ADDRESS = '0xYourVaultAddress' as `0x${string}`; // Replace with your deployed vault address

// Mock APY data until we connect to the actual contract
const MOCK_APYS = [5, 2, 3]; // cUSD, cEUR, cREAL APY percentages

export function VaultInteraction() {
  const { address, isConnected } = useAccount();
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState('cUSD');

  // Mock data for now - replace with actual contract calls
  const tokenBalance = BigInt(0);
  const tvl = BigInt(0);
  const apys = MOCK_APYS;

  const { 
    writeContract: deposit, 
    isPending: isDepositPending, 
    data: depositHash 
  } = useWriteContract();
  
  const { isLoading: isDepositProcessing } = useWaitForTransactionReceipt({
    hash: depositHash,
  });

  // Withdraw function
  const { 
    writeContract: withdraw, 
    isPending: isWithdrawPending, 
    data: withdrawHash 
  } = useWriteContract();
  
  const { isLoading: isWithdrawProcessing } = useWaitForTransactionReceipt({
    hash: withdrawHash,
  });

  // Derived states
  const isDepositing = isDepositPending || isDepositProcessing;
  const isWithdrawing = isWithdrawPending || isWithdrawProcessing;

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || !parseFloat(depositAmount) || !address) return;
    
    deposit({
      address: VAULT_ADDRESS,
      abi: XmentoVaultABI,
      functionName: 'deposit',
      args: [selectedToken, parseEther(depositAmount)],
    });
  };

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || !parseFloat(withdrawAmount) || !address) return;
    
    withdraw({
      address: VAULT_ADDRESS,
      abi: XmentoVaultABI,
      functionName: 'withdraw',
      args: [parseEther(withdrawAmount)],
    });
  };

  return (
    <div className="space-y-8">
      {/* Vault Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Your Balance</CardTitle>
            <CardDescription>Total value in the vault</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {tokenBalance ? formatEther(tokenBalance as bigint) : '0.00'} cUSD
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Total Value Locked</CardTitle>
            <CardDescription>Across all users</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {tvl ? formatEther(tvl as bigint) : '0.00'} cUSD
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Current APY</CardTitle>
            <CardDescription>Estimated annual yield</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {apys ? `${(apys as number[])[0] / 100}%` : 'Loading...'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Deposit/Withdraw Tabs */}
      <Tabs defaultValue="deposit" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="deposit">Deposit</TabsTrigger>
          <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
        </TabsList>
        
        <TabsContent value="deposit">
          <Card>
            <CardHeader>
              <CardTitle>Deposit Funds</CardTitle>
              <CardDescription>Add funds to your vault position</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDeposit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Token</label>
                  <select
                    value={selectedToken}
                    onChange={(e) => setSelectedToken(e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="cUSD">cUSD</option>
                    <option value="cEUR">cEUR</option>
                    <option value="cREAL">cREAL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Amount</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={!deposit || isDepositing}
                >
                  {isDepositing ? 'Processing...' : 'Deposit'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="withdraw">
          <Card>
            <CardHeader>
              <CardTitle>Withdraw Funds</CardTitle>
              <CardDescription>Withdraw from your vault position</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleWithdraw} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Amount</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                  variant="outline"
                  disabled={!withdraw || isWithdrawing}
                >
                  {isWithdrawing ? 'Processing...' : 'Withdraw'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Allocation Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Allocation</CardTitle>
          <CardDescription>Current asset distribution</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span>cUSD</span>
              <span>{apys ? `${(apys as number[])[0]}%` : '0%'}</span>
            </div>
            <Progress value={apys ? (apys as number[])[0] : 0} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span>cEUR</span>
              <span>{apys ? `${(apys as number[])[1]}%` : '0%'}</span>
            </div>
            <Progress value={apys ? (apys as number[])[1] : 0} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span>cREAL</span>
              <span>{apys ? `${(apys as number[])[2]}%` : '0%'}</span>
            </div>
            <Progress value={apys ? (apys as number[])[2] : 0} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
