'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useReadContract } from 'wagmi';
import { XmentoVaultABI } from './XmentoVaultABI';
import { formatEther } from 'viem';
import { Skeleton } from '@/components/ui/skeleton';

type VaultStatusListProps = {
    vaults: `0x${string}`[];
    selectedVault: `0x${string}` | null;
    onSelectVault: (vaultAddress: `0x${string}`) => void;
    chainId: number;
};

type VaultStatus = {
    address: `0x${string}`;
    tvl: string;
    isActive: boolean;
};

export function VaultStatusList({
    vaults,
    selectedVault,
    onSelectVault,
    chainId,
}: VaultStatusListProps) {
    return (

        <ScrollArea className="h-full w-full p-4">
            <div className="space-y-2">
                {vaults.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-4">
                        No vaults found
                    </div>
                ) : (
                    vaults.map((vault) => (
                        <VaultStatusItem
                            key={vault}
                            vaultAddress={vault}
                            isSelected={vault === selectedVault}
                            onClick={() => onSelectVault(vault)}
                            chainId={chainId}
                        />
                    ))
                )}
            </div>
        </ScrollArea>

    );
}

function VaultStatusItem({
    vaultAddress,
    isSelected,
    onClick,
    chainId,
}: {
    vaultAddress: `0x${string}`;
    isSelected: boolean;
    onClick: () => void;
    chainId: number;
}) {
    const { data: tvl, isLoading } = useReadContract({
        address: vaultAddress,
        abi: XmentoVaultABI,
        functionName: 'getTVL',
        chainId,
    });

    const formattedTVL = tvl
        ? `$${Number(formatEther(tvl)).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`
        : '$0.00';

    return (
        <div
            className={`p-3 rounded-lg border cursor-pointer transition-colors ${isSelected
                    ? 'bg-primary/10 border-primary'
                    : 'hover:bg-muted/50 border-border'
                }`}
            onClick={onClick}
        >
            <div className="flex items-center justify-between ">
                <div className="space-y-1">
                    <div className="font-medium text-sm">
                        {vaultAddress.slice(0, 6)}...{vaultAddress.slice(-4)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {isLoading ? (
                            <Skeleton className="h-4 w-20" />
                        ) : (
                            <span>{formattedTVL} TVL</span>
                        )}
                    </div>
                </div>
                <Badge variant={isSelected ? 'default' : 'outline'}>
                    {isSelected ? 'Active' : 'Inactive'}
                </Badge>
            </div>
        </div>
    );
}
