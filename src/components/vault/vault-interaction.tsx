'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useChainId, usePublicClient } from 'wagmi';
import { mainnet, celoAlfajores } from 'viem/chains';
import { WalletConnector } from './wallet-connector';
import { parseEther, formatEther, Address } from 'viem';
import { XmentoVaultABI } from './XmentoVaultABI';
import { XmentoVaultFactoryABI } from './XmentoVaultFactoryABI';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VaultView } from './VaultView';
import { AdminView } from './AdminView';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

// Token configuration
export const TOKENS = {
  cUSD: { name: 'Celo Dollar', symbol: 'cUSD', decimals: 18 },
  cEUR: { name: 'Celo Euro', symbol: 'cEUR', decimals: 18 },
  cREAL: { name: 'Celo Real', symbol: 'cREAL', decimals: 18 },
} as const;

export type TokenSymbol = keyof typeof TOKENS;

// Contract addresses by network
const CONTRACT_ADDRESSES = {
  [mainnet.id]: {
    factory: '0xYourMainnetFactoryAddress' as `0x${string}`,
  },
  [celoAlfajores.id]: {
    factory: process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}` || '0x36eA57D1D52cd475aD6d842a18EDa975Eb88A31E',
  },
} as const;

// Default to Alfajores if not specified
const DEFAULT_CHAIN = celoAlfajores.id;

type BrowserWindow = Window & typeof globalThis & {
  ethereum?: any;
  localStorage: {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
  };
};

declare const window: BrowserWindow | undefined;

interface VaultInteractionProps {
  factoryAddress?: `0x${string}`;
}

export function VaultInteraction({ factoryAddress }: VaultInteractionProps) {
  const { address, isConnected, chain } = useAccount();
  const chainId = chain?.id || DEFAULT_CHAIN;
  const { toast } = useToast();
  const publicClient = usePublicClient();
  
  // State
  const [selectedToken, setSelectedToken] = useState<TokenSymbol>('cUSD');
  const [vaultAddress, setVaultAddress] = useState<`0x${string}` | null>(null);
  const [isWrongNetwork, setIsWrongNetwork] = useState<boolean>(false);
  const [isManager, setIsManager] = useState<boolean>(false);
  
  // Get contract addresses for current network
  const currentNetworkAddresses = {
    ...(CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES] || CONTRACT_ADDRESSES[celoAlfajores.id]),
    // Override factory address if provided via props
    ...(factoryAddress ? { factory: factoryAddress } : {}),
  };

  const VAULT_FACTORY_ADDRESS = currentNetworkAddresses.factory;
  const isSupportedNetwork = chainId in CONTRACT_ADDRESSES;

  // Check if current user is the manager
  useEffect(() => {
    setIsManager(address?.toLowerCase() === process.env.NEXT_PUBLIC_MANAGER_ADDRESS?.toLowerCase());
  }, [address]);

  // Update network status when chain changes
  useEffect(() => {
    if (chain) {
      const isWrong = !(chain.id in CONTRACT_ADDRESSES);
      setIsWrongNetwork(isWrong);

      if (isWrong) {
        toast({
          title: 'Unsupported Network',
          description: 'Please switch to Celo Mainnet or Alfajores Testnet',
          variant: 'destructive',
        });
      }
    }
  }, [chain, toast]);

  // Check for deployed vault when address or chain changes
  const { data: hasVault } = useReadContract({
    address: currentNetworkAddresses.factory,
    abi: XmentoVaultFactoryABI,
    functionName: 'userToVault',
    args: [address as `0x${string}`],
    chainId,
    query: {
      enabled: !!address && isSupportedNetwork,
    },
  });

  useEffect(() => {
    const checkForVault = async () => {
      if (typeof window !== 'undefined' && address && isSupportedNetwork) {
        const win = window as BrowserWindow;
        const storageKey = `vault_${chainId}_${address}`;
        const savedVault = win?.localStorage.getItem(storageKey);

        if (savedVault) {
          setVaultAddress(savedVault as `0x${string}`);
        } else if (hasVault && hasVault !== '0x0000000000000000000000000000000000000000') {
          setVaultAddress(hasVault as `0x${string}`);
          win?.localStorage.setItem(storageKey, hasVault);
        }
      }
    };

    checkForVault();
  }, [address, chainId, hasVault, isSupportedNetwork]);

  // Handle token change
  const handleTokenChange = (token: TokenSymbol) => {
    setSelectedToken(token);
  };

  // Get writeContract function from wagmi
  const { writeContract } = useWriteContract();

  // Handle vault creation
  const handleCreateVault = async () => {
    if (!address || !publicClient) return;
    
    try {
      // Use the writeContract function and handle the Promise
      const result = await new Promise<`0x${string}`>((resolve, reject) => {
        writeContract({
          address: VAULT_FACTORY_ADDRESS,
          abi: XmentoVaultFactoryABI,
          functionName: 'createVault',
          args: [],
          chainId,
        }, {
          onSuccess: (hash) => resolve(hash as `0x${string}`),
          onError: (error) => reject(error)
        });
      });
      
      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash: result
      });
      
      // Find the VaultCreated event
      const vaultCreatedEvent = receipt.logs.find(
        (log) => log.topics[0] === '0xb8b2c1a2c2310fce50d68d9a9c3999094974e5892513643ce5d0bd72058f0305' // keccak256('VaultCreated(address,address)')
      );
      
      if (vaultCreatedEvent?.topics?.[2]) {
        const topic = vaultCreatedEvent.topics[2];
        const newVaultAddress = `0x${topic.slice(-40)}` as `0x${string}`;
        setVaultAddress(newVaultAddress);
        
        // Save to local storage
        if (typeof window !== 'undefined') {
          const win = window as BrowserWindow;
          const storageKey = `vault_${chainId}_${address}`;
          win?.localStorage.setItem(storageKey, newVaultAddress);
        }
      } else {
        console.error('Invalid vault created event format');
        toast({
          title: 'Error',
          description: 'Failed to process vault creation. Please try again.',
          variant: 'destructive',
        });
        
        toast({
          title: 'Vault created',
          description: 'Your vault has been created successfully!',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error creating vault',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {!isConnected ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-4">Connect your wallet to continue</h2>
        </div>
      ) : isWrongNetwork ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unsupported Network</AlertTitle>
          <AlertDescription>
            Please switch to a supported network to interact with the vault.
          </AlertDescription>
        </Alert>
      ) : !vaultAddress ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-4">Create your vault to get started</h2>
          <button 
            onClick={handleCreateVault}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Vault
          </button>
        </div>
      ) : (
        <Tabs defaultValue="vault" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="vault">Vault</TabsTrigger>
            {isManager && <TabsTrigger value="admin">Admin</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="vault" className="mt-6">
            <VaultView 
              vaultAddress={vaultAddress}
              isManager={isManager}
              chainId={chainId}
              selectedToken={selectedToken}
              onTokenChange={handleTokenChange}
              isWrongNetwork={isWrongNetwork}
            />

            {/* Vault Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Vault Statistics</CardTitle>
                <CardDescription>Overview of your vault's performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="text-sm font-medium text-muted-foreground">TVL</h3>
                    <p className="text-2xl font-bold">-</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="text-sm font-medium text-muted-foreground">APY</h3>
                    <p className="text-2xl font-bold">-</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="text-sm font-medium text-muted-foreground">Your Balance</h3>
                    <p className="text-2xl font-bold">-</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="admin">
            <AdminView vaultAddress={vaultAddress} chainId={chainId} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
