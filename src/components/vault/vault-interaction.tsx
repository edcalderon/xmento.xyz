'use client';

import React, { useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VaultView } from './vault-view';
import { AdminView } from './AdminView';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Wallet, Loader2 } from 'lucide-react';
import { VaultStatusList } from './vault-status-list';
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
    lastFetched
  } = useVaultInteractions();

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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Vault Manager</h1>
      </div>

      {/* Vault List and Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">


        <div className="lg:col-span-2">
          <Tabs defaultValue="vault" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="vault">Vault Operations</TabsTrigger>
              <TabsTrigger value="admin" disabled={!isManager}>
                Admin Controls
              </TabsTrigger>
            </TabsList>

            <TabsContent value="vault">
              <div className="lg:col-span-1 lg:col-start-1 flex flex-col space-y-4">
                <div className="bg-card rounded-lg border p-4 h-[calc(100vh-250px)] min-h-[400px] max-h-[600px] flex flex-col">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium">Your Vaults</h3>
                    <button
                      onClick={handleRefresh}
                      disabled={isLoadingVaults}
                      className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                      title="Refresh vaults"
                    >
                      <Loader2 className={`h-4 w-4 ${isLoadingVaults ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto pr-2 -mx-2 px-2">
                    <VaultStatusList
                      vaults={userVaults}
                      selectedVault={vaultAddress}
                      onSelectVault={setVaultAddress}
                      chainId={chainId}
                    />
                  </div>
                  <div className="flex pr-2 mb-3 justify-between">
                    <span className="text-xs text-muted-foreground">{userVaults.length} Vault(s) Found</span>
                    <span className="ml-2 text-xs text-muted-foreground text-right">Last updated {lastFetched ? new Date(lastFetched).toLocaleString() : 'Never'}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    onClick={handleCreateVaultWrapper}
                    disabled={isCreatingVault}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                  >
                    {isCreatingVault ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create New Vault'
                    )}
                  </button>
                </div>

              </div>

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
            </TabsContent>

            <TabsContent value="admin">
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
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}