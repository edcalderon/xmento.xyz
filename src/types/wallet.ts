import type { NetworkID, NetworkInfo } from '@/types/network';

export interface AccountInfo {
    address: string;
    formattedAddress?: string;
    ensName?: string;
}

export type Account = string | AccountInfo;

export type ButtonVariant = 'default' | 'outline' | 'ghost' | 'link';

export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export interface BaseWalletViewProps {
    className?: string;
    variant?: ButtonVariant;
    size?: ButtonSize;
}

export type EIP1193Provider = {
  request: (args: { method: string; params?: Array<unknown> }) => Promise<unknown>;
};


export interface WalletConnectHandlers {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  isSwitching: boolean;
  setIsSwitching: (switching: boolean) => void;
  isNetworkDropdownOpen: boolean;
  setIsNetworkDropdownOpen: (open: boolean) => void;
  isAccountDropdownOpen: boolean;
  setIsAccountDropdownOpen: (open: boolean) => void;
  copied: boolean;
  setCopied: (copied: boolean) => void;
  isSwitchingAccount: boolean;
  setIsSwitchingAccount: (switching: boolean) => void;
  isDisconnecting: boolean;
  setIsDisconnecting: (disconnecting: boolean) => void;
  isNetworkModalOpen: boolean;
  setIsNetworkModalOpen: (open: boolean) => void;
  isAccountModalOpen: boolean;
  setIsAccountModalOpen: (open: boolean) => void;
  handleSwitchNetwork: (targetChainId: NetworkID) => Promise<void>;
  handleConnect: () => void;
  handleDisconnect: () => Promise<void>;
  handleCopyAddress: () => void;
  handleSwitchAccount: (address: string) => Promise<void>;
  handleAddAccount: () => Promise<void>;
  isSupportedChain: boolean;
  networkInfo: Record<number, NetworkInfo>;
  otherAccounts: AccountInfo[];
  formattedAddress: string;
}

export interface WalletViewProps {
  showNetworkSwitcher?: boolean;
  address?: `0x${string}`;
  isConnecting?: boolean;
  isSwitching?: boolean;
  isSwitchingAccount?: boolean;
  isDisconnecting?: boolean;
  isAccountDropdownOpen?: boolean;
  setIsAccountDropdownOpen?: (open: boolean) => void;
  isNetworkDropdownOpen?: boolean;
  setIsNetworkDropdownOpen?: (open: boolean) => void;
  handleConnect?: () => void;
  handleDisconnect?: () => void;
  handleSwitchNetwork?: (chainId: number) => void;
  handleCopyAddress?: () => void;
  handleSwitchAccount?: (address: string) => void;
  isSupportedChain?: boolean;
  networkInfo?: Record<number, NetworkInfo>;
  otherAccounts?: Account[];
  handleAddAccount?: () => void;
  formattedAddress?: string;
  connector?: {
    id: string;
    name: string;
  };
}

export interface WalletViewDesktopProps extends WalletViewProps, BaseWalletViewProps {}

export interface WalletViewMobileProps extends WalletViewProps, BaseWalletViewProps {}