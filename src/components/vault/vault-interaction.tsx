'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VaultView } from './vault-view';
import { AdminView } from './admin-view';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Wallet, Loader2 } from 'lucide-react';
import { VaultsCard } from './vaults-card';
import { useVaultInteractions } from '@/hooks/useVaultInteractions';

interface VaultInteractionProps { }

export function VaultInteraction({ }: VaultInteractionProps): React.JSX.Element {
  const { isConnected, chain, address } = useAccount();
  const { toast } = useToast();

  const {
    selectedToken,
    vaultAddress,
    isWrongNetwork,
    isManager,
    isCreatingVault,
    isLoadingVaults,
    userVaults,
    handleCreateVault,
    handleTokenChange,
    refetchVaults,
    setVaultAddress,
    lastFetched,
    error: fetchError
  } = useVaultInteractions();

  const [error, setError] = useState<string | null>(null);

  // Update error state when fetchError changes
  useEffect(() => {
    if (fetchError) {
      setError(fetchError.toString());
    } else if (userVaults.length === 0 && !isLoadingVaults && isConnected && !isWrongNetwork) {
      setError('No vaults found for this account');
    } else {
      setError(null);
    }
  }, [fetchError, userVaults, isLoadingVaults, isConnected, isWrongNetwork]);

  const handleRetry = async () => {
    try {
      await refetchVaults(true);
      setError(null);
    } catch (err) {
      console.error('Error retrying vault fetch:', err);
      setError('Failed to load vaults. Please try again.');
    }
  };

  const handleRefresh = useCallback(async () => {
    try {
      await refetchVaults(true); // Force refresh
      toast({
        title: 'Success',
        description: 'Vaults refreshed successfully',
      });
    } catch (error) {
      console.error('Error refreshing vaults:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh vaults. Please try again.',
        variant: 'destructive',
      });
    }
  }, [refetchVaults, toast]);

  // Handle vault creation with proper error handling
  const handleCreateVaultWrapper = async () => {
    try {
      await handleCreateVault();
      await refetchVaults();
    } catch (error) {
      console.error('Error in vault creation:', error);
      toast({
        title: 'Error',
        description: 'Failed to create vault. Please try again.',
        variant: 'destructive',
      });
    }
  };



  // Show wallet connection prompt if not connected
  if (!isConnected) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Wallet className="w-6 h-6" />
            <CardTitle>Connect Your Wallet</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Please connect your wallet to interact with the vault.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Show network warning if on wrong network
  if (isWrongNetwork) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertCircle className="h-4 w-4" />
        <h3 className="font-medium">Wrong Network</h3>
        <AlertDescription>
          Please switch to the correct network to interact with the vault.
        </AlertDescription>
      </Alert>
    );
  }

  // Get the current chain ID
  const chainId = chain?.id || 0;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">

      {/* Vault List and Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="lg:col-span-2">

          <Tabs defaultValue="vault" className="w-full">
            <TabsList className={`grid w-full ${isManager ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <TabsTrigger value="vault">Vault Management</TabsTrigger>
              {isManager && <TabsTrigger value="admin">Admin Controls</TabsTrigger>}
            </TabsList>
            <TabsContent value="vault">
              <>
                <div className="lg:col-span-1 lg:col-start-1 flex flex-col space-y-4">
                  <VaultsCard
                    userVaults={userVaults}
                    vaultAddress={vaultAddress}
                    setVaultAddress={setVaultAddress}
                    chainId={chainId}
                    isLoadingVaults={isLoadingVaults}
                    isCreatingVault={isCreatingVault}
                    lastFetched={lastFetched}
                    handleRefresh={handleRefresh}
                    handleCreateVaultWrapper={handleCreateVaultWrapper}
                    handleRetry={handleRetry}
                  />
                </div>

                <div className="w-full h-8" />

                <Card>
                  <CardHeader>
                    <CardTitle>Vault Operations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <VaultView
                      vaultAddress={vaultAddress}
                      isManager={isManager}
                      chainId={chainId}
                      selectedToken={selectedToken}
                      onTokenChange={handleTokenChange}
                      isWrongNetwork={isWrongNetwork}
                      isRefreshing={isLoadingVaults}
                    />
                  </CardContent>
                </Card>
              </>
            </TabsContent>

            {isManager && <TabsContent value="admin">
              <Card>
                <CardHeader>
                  <CardTitle>Admin Controls</CardTitle>
                </CardHeader>
                <CardContent>
                  <AdminView
                    vaultAddress={vaultAddress}
                    chainId={chainId}
                  />
                </CardContent>
              </Card>
            </TabsContent>}
          </Tabs>

        </div>
      </div>
    </div>
  );
}