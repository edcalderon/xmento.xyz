'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useReadContract } from 'wagmi';
import { XmentoVaultABI } from './XmentoVaultABI';
import { formatEther } from 'viem';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, AlertCircle } from 'lucide-react';

type VaultStatusListProps = {
    vaults: `0x${string}`[];
    selectedVault: `0x${string}` | null;
    onSelectVault: (vaultAddress: `0x${string}`) => void;
    chainId: number;
    isLoading?: boolean;
    onRetry?: () => void;
};

export function VaultStatusList({
    vaults,
    selectedVault,
    onSelectVault,
    chainId,
    isLoading = false,
    onRetry,
}: VaultStatusListProps) {
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);

    // Reset error when vaults change
    useEffect(() => {
        if (vaults.length > 0) {
            setError(null);
        }
    }, [vaults]);
    
    const handleRetry = () => {
        setError(null);
        if (onRetry) onRetry();
    };
    // Check if we have any vaults to display
    const hasVaults = vaults.length > 0;
    
    // Show loading state
    if (isLoading && !hasVaults) {
        return (
            <div className="h-full flex items-center justify-center p-6">
                <div className="flex flex-col items-center space-y-2">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Loading vaults...</p>
                </div>
            </div>
        );
    }
    
    // Show error state
    if (error) {
        return (
            <div className="h-full flex items-center justify-center p-6">
                <div className="flex flex-col items-center space-y-4 text-center">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                    <p className="text-sm text-muted-foreground">Failed to load vaults</p>
                    <button
                        onClick={handleRetry}
                        className="text-sm text-primary hover:underline"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Retrying...' : 'Retry'}
                    </button>
                </div>
            </div>
        );
    }
    
    return (
        <div className="h-full flex flex-col relative">
            <ScrollArea 
                ref={scrollAreaRef}
                className="flex-1 w-full px-2 touch-pan-y"
            >
                <div className="space-y-2">
                    {!hasVaults ? (
                        <div className="flex flex-col items-center justify-center p-6 text-center space-y-2">
                            <p className="text-sm text-muted-foreground">
                                No vaults found
                            </p>
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
        </div>

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
                    : 'hover:bg-muted/50 border-border hover:border-primary/50'
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
