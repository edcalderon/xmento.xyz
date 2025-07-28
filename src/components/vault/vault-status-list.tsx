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
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [startY, setStartY] = useState(0);
    const [pullDown, setPullDown] = useState(0);
    const [isPulling, setIsPulling] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const pullDownThreshold = 100;
    const lastRefreshTime = useRef<number>(0);
    const minRefreshInterval = 2000; // 2 seconds minimum between refreshes
    
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (scrollAreaRef.current?.scrollTop === 0 && !isRefreshing) {
            setStartY(e.touches[0].pageY);
            setIsPulling(true);
        }
    }, [isRefreshing]);
    
    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (startY > 0 && !isRefreshing) {
            const y = e.touches[0].pageY;
            const diff = y - startY;
            
            if (diff > 0) { // Only allow pull down
                e.preventDefault();
                setPullDown(Math.min(diff, pullDownThreshold * 2)); // Cap the pull distance
            }
        }
    }, [startY, isRefreshing]);
    
    const handleTouchEnd = useCallback(async () => {
        const now = Date.now();
        const timeSinceLastRefresh = now - lastRefreshTime.current;
        
        if (pullDown > pullDownThreshold && onRetry && timeSinceLastRefresh > minRefreshInterval) {
            setIsRefreshing(true);
            lastRefreshTime.current = now;
            
            try {
                await onRetry();
            } catch (error) {
                console.error('Error during refresh:', error);
            } finally {
                // Add a small delay to ensure smooth animation
                setTimeout(() => {
                    setIsRefreshing(false);
                }, 500);
            }
        }
        
        // Reset states with animation
        setStartY(0);
        setPullDown(0);
        
        // Delay resetting isPulling to allow for smooth animation
        setTimeout(() => {
            setIsPulling(false);
        }, 200);
    }, [pullDown, onRetry, minRefreshInterval]);
    
    // Clean up on unmount
    useEffect(() => {
        return () => {
            setStartY(0);
            setPullDown(0);
        };
    }, []);
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

    const pullProgress = Math.min(pullDown / pullDownThreshold, 1);
    const rotation = pullProgress * 180;
    const isRefreshingOrPulling = isRefreshing || isPulling;
    
    return (
        <div className="h-full flex flex-col relative">
            {/* Pull to refresh indicator */}
            <div 
                className={`flex items-center justify-center overflow-hidden transition-all duration-200 ease-out ${isRefreshingOrPulling ? 'opacity-100' : 'opacity-0'}`}
                style={{
                    height: `${isRefreshingOrPulling ? pullDownThreshold : 0}px`,
                    transform: `translateY(${isRefreshing ? 0 : Math.min(pullDown, pullDownThreshold) - pullDownThreshold}px)`,
                }}
            >
                <div className="flex flex-col items-center">
                    <Loader2 
                        className={`h-6 w-6 text-primary transition-transform duration-300 ${isRefreshing ? 'animate-spin' : ''}`}
                        style={{
                            transform: `rotate(${rotation}deg)`,
                            opacity: Math.min(pullProgress * 2, 1),
                        }}
                    />
                    {pullProgress > 0.5 && !isRefreshing && (
                        <span className="text-xs text-muted-foreground mt-1">
                            {pullProgress > 0.9 ? 'Release to refresh' : 'Pull to refresh'}
                        </span>
                    )}
                </div>
            </div>
            
            <ScrollArea 
                ref={scrollAreaRef}
                className="flex-1 w-full px-2 touch-pan-y"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
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
