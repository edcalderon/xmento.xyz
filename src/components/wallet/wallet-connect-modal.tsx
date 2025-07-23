"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Loader2, ExternalLink, AlertCircle, ChevronRight, ArrowLeft } from "lucide-react";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { isMobile } from "react-device-detect";
import type { ConnectionMethod } from "@/hooks/useWalletConnection";
import Image from "next/image";

// Wallet Icons
const WalletIcons: Record<string, string> = {
  injected: 'wallet/logos/metamask.svg',
  metaMask: 'wallet/logos/metamask.svg',
  walletconnect: 'wallet/logos/walletconnect.svg',
  default: 'wallet/logos/browser.svg'
};

const DEFAULT_WALLET_ICON = WalletIcons.default;

interface WalletModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onConnectSuccess?: () => void;
}

export function WalletConnectModal({ isOpen, onOpenChange, onConnectSuccess }: WalletModalProps): JSX.Element {
    const {
        connect: handleConnect,
        isConnecting,
        connectionError,
        isMobileBrowser,
        isMetaMaskInstalled,
        hasInjectedWallet
    } = useWalletConnection();
    const [connectionMethod, setConnectionMethod] = useState<ConnectionMethod | null>(null);

    // Show appropriate wallet options based on environment
    const showInjectedOption = hasInjectedWallet || isMobileBrowser;
    const showMetaMaskMobileOption = isMobileBrowser && !hasInjectedWallet;

    useEffect(() => {
        if (!isOpen) {
            setConnectionMethod(null);
        }
    }, [isOpen]);

    const handleConnection = async (method: ConnectionMethod) => {
        try {
            setConnectionMethod(method);
            await handleConnect(method);
            onOpenChange(false);
            onConnectSuccess?.();
        } catch (err) {
            console.error('Connection error:', err);
        }
    };

    const renderConnectionMethods = () => {
        if (connectionMethod) {
            return (
                <div className="space-y-4">
                    <Button
                        variant="ghost"
                        className="w-full justify-start px-2 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setConnectionMethod(null)}
                        disabled={isConnecting}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        <span>Back to connect</span>
                    </Button>

                    {connectionMethod === 'injected' && (
                        <div className="space-y-3">
                            <Button
                                variant="outline"
                                className="w-full h-14 px-4 rounded-xl border border-border/50 hover:border-primary/50 transition-colors"
                                onClick={() => handleConnection('injected')}
                                disabled={isConnecting}
                            >
                                <div className="flex items-center w-full">
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mr-3">
                                        <Image 
                                            src={WalletIcons.injected} 
                                            alt="Browser Wallet" 
                                            width={20} 
                                            height={20} 
                                            className="object-contain"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = DEFAULT_WALLET_ICON;
                                            }}
                                        />
                                    </div>
                                    <span className="font-medium">MetaMask</span>
                                    <div className="ml-auto">
                                        {isConnecting && (
                                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                        )}
                                    </div>
                                </div>
                            </Button>
                            {!hasInjectedWallet && (
                                <p className="text-sm text-muted-foreground text-center">
                                    No browser wallet detected. Install MetaMask or another Web3 wallet.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {showInjectedOption && (
                    <Button
                        variant="outline"
                        className="w-full h-14 px-4 rounded-xl border border-border/50 hover:border-primary/50 transition-colors"
                        onClick={() => setConnectionMethod('injected')}
                        disabled={isConnecting}
                    >
                        <div className="flex items-center w-full">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mr-3">
                                <Image 
                                    src={WalletIcons.default} 
                                    alt="Browser Wallet" 
                                    width={20} 
                                    height={20} 
                                    className="object-contain"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = DEFAULT_WALLET_ICON;
                                    }}
                                />
                            </div>
                            <span className="font-medium">Browser Wallets</span>
                            <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                        </div>
                    </Button>
                )}

                {showMetaMaskMobileOption && (
                    <Button
                        variant="outline"
                        className="w-full h-14 px-4 rounded-xl border border-border/50 hover:border-primary/50 transition-colors"
                        onClick={() => setConnectionMethod('metaMask')}
                        disabled={isConnecting}
                    >
                        <div className="flex items-center w-full">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mr-3">
                                <Image 
                                    src={WalletIcons.metaMask} 
                                    alt="MetaMask Mobile" 
                                    width={20} 
                                    height={20} 
                                    className="object-contain"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = DEFAULT_WALLET_ICON;
                                    }}
                                />
                            </div>
                            <span className="font-medium">MetaMask Mobile</span>
                            <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
                        </div>
                    </Button>
                )}

                <div className="space-y-2">
                    <Button
                        variant="outline"
                        className="w-full h-14 px-4 rounded-xl border border-border/50 hover:border-primary/50 transition-colors"
                        onClick={() => handleConnection('walletconnect')}
                        disabled={isConnecting}
                    >
                        <div className="flex items-center w-full">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mr-3">
                                <Image 
                                    src={WalletIcons.walletconnect} 
                                    alt="WalletConnect" 
                                    width={20} 
                                    height={20} 
                                    className="object-contain"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = DEFAULT_WALLET_ICON;
                                    }}
                                />
                            </div>
                            <span className="font-medium">WalletConnect</span>
                            <div className="ml-auto">
                                {isConnecting && (
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                )}
                            </div>
                        </div>
                    </Button>
                    <p className="text-xs text-muted-foreground text-center px-2">
                        Connect with any wallet using WalletConnect
                    </p>
                </div>

                {isMobileBrowser && (
                    <div className="space-y-2">
                        <Button
                            variant="outline"
                            className="w-full h-14 px-4 rounded-xl border border-border/50 hover:border-primary/50 transition-colors"
                            onClick={() => handleConnection('metaMask')}
                            disabled={isConnecting}
                        >
                            <div className="flex items-center w-full">
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mr-3">
                                    <Image 
                                        src={WalletIcons.metaMask} 
                                        alt="MetaMask Browser" 
                                        width={20} 
                                        height={20} 
                                        className="object-contain"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = DEFAULT_WALLET_ICON;
                                        }}
                                    />
                                </div>
                                <span className="font-medium">Open in MetaMask</span>
                                <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
                            </div>
                        </Button>
                        <p className="text-xs text-muted-foreground text-center px-2">
                            Opens in MetaMask mobile app if installed
                        </p>
                    </div>
                )}
            </div>
        );
    };

    const installMetaMask = () => {
        window.open('https://metamask.io/download.html', '_blank');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px] p-6 rounded-2xl">
                <DialogHeader className="space-y-2">
                    <DialogTitle className="text-2xl font-bold text-center">
                        {connectionMethod ? 'Connect Wallet' : 'Connect a Wallet'}
                    </DialogTitle>
                    <DialogDescription className="text-center text-base">
                        {connectionMethod === 'metaMask'
                            ? 'Open the app to continue in MetaMask'
                            : 'Choose how you want to connect to your wallet'}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {connectionError && (
                        <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-md flex items-center">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            {connectionError}
                        </div>
                    )}

                    {renderConnectionMethods()}

                    {isMobile && !isMobileBrowser && !isMetaMaskInstalled && (
                        <div className="mt-4 text-xs text-muted-foreground text-center">
                            <p>Don't have a wallet?</p>
                            <Button
                                variant="link"
                                className="h-auto p-0 text-xs"
                                onClick={installMetaMask}
                                disabled={isConnecting}
                            >
                                Install MetaMask
                            </Button>
                        </div>
                    )}
                </div>
                <p className="text-xs text-center text-muted-foreground">
                    By connecting a wallet, you agree to our Terms of Service and our Privacy Policy.
                </p>
            </DialogContent>
        </Dialog>
    );
}
