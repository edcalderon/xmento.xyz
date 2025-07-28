import React from 'react';
import { VaultStatusList } from './vault-status-scroll-area';
import { Loader2 } from 'lucide-react';

interface VaultsListCardProps {
  userVaults: any[];
  vaultAddress: `0x${string}` | null;
  setVaultAddress: (address: `0x${string}`) => void;
  chainId: number;
  isLoadingVaults: boolean;
  isCreatingVault: boolean;
  lastFetched: number | null;
  handleRefresh: () => void;
  handleCreateVaultWrapper: () => void;
  handleRetry: () => void;
}

export function VaultsListCard({
  userVaults,
  vaultAddress,
  setVaultAddress,
  chainId,
  isLoadingVaults,
  isCreatingVault,
  lastFetched,
  handleRefresh,
  handleCreateVaultWrapper,
  handleRetry
}: VaultsListCardProps): React.JSX.Element {
  return (
    <div className="bg-card rounded-lg border p-4 flex flex-col h-[400px] lg:h-[500px] lg:min-h-[400px]">
      <div className="flex justify-between items-center mb-4">
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
      <div className="flex-1 min-h-0">
        <VaultStatusList
          vaults={userVaults}
          selectedVault={vaultAddress}
          onSelectVault={setVaultAddress}
          chainId={chainId}
          isLoading={isLoadingVaults}
          onRetry={handleRetry}
        />
      </div>

      <div className="mt-4 p-4">
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
      <div className="flex justify-between items-center pt-2 mt-2 border-t">
        <span className="text-xs text-muted-foreground">
          {userVaults.length} Vault{userVaults.length !== 1 ? 's' : ''} Found
        </span>
        <span className="text-xs text-muted-foreground">
          {lastFetched ? `Updated ${new Date(lastFetched).toLocaleTimeString()}` : 'Never updated'}
        </span>
      </div>
    </div>
  );
}
