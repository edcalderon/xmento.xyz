export interface AccountInfo {
    address: string;
    formattedAddress?: string;
    ensName?: string;
}

export type Account = string | AccountInfo;

export type ButtonVariant = 'default' | 'outline' | 'ghost' | 'link';

export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export interface WalletConnectButtonProps {
    className?: string;
    variant?: ButtonVariant;
    size?: ButtonSize;
}