// Supported chain IDs for the application
export type NetworkID = number; 

export interface NetworkInfo {
  id: NetworkID;
  name: string;
  icon: string;
  isTestnet: boolean;
  rpcUrl?: string;
  blockExplorerUrl?: string;
  nativeCurrency?: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

