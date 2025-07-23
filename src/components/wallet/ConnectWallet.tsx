'use client';
import { ConnectButton as RainbowConnectButton } from '@rainbow-me/rainbowkit';

type ChainButtonProps = {
  chain: any;
  onClick: () => void;
};

const ChainButton = ({ chain, onClick }: ChainButtonProps) => (
  <button
    onClick={onClick}
    type="button"
    className="flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all duration-200 bg-gray-900 rounded-lg hover:bg-gray-800 text-gray-100 hover:shadow-lg hover:scale-105"
  >
    {chain.hasIcon && (
      <div className="flex items-center justify-center w-5 h-5 overflow-hidden rounded-full">
        {chain.iconUrl && (
          <img
            alt={chain.name ?? 'Chain icon'}
            src={chain.iconUrl}
            className="w-4 h-4"
          />
        )}
      </div>
    )}
    <span className="hidden sm:inline">{chain.name}</span>
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  </button>
);

const ConnectButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    type="button"
    className="px-6 py-2.5 text-sm font-medium text-white transition-all duration-200 bg-gradient-to-r from-purple-600 to-blue-500 rounded-lg hover:from-purple-700 hover:to-blue-600 hover:shadow-lg hover:scale-105 focus:ring-2 focus:ring-purple-300 focus:ring-opacity-50"
  >
    Connect Wallet
  </button>
);

const WalletButton = ({ 
  displayName, 
  displayBalance,
  onClick 
}: { 
  displayName: string; 
  displayBalance?: string | null;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    type="button"
    className="px-4 py-2 text-sm font-medium transition-all duration-200 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-900 hover:shadow-md hover:scale-105"
  >
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      <span className="font-mono text-sm">
        {displayName}
        {displayBalance ? ` (${displayBalance})` : ''}
      </span>
    </div>
  </button>
);

export function ConnectWallet() {
  return (
    <RainbowConnectButton.Custom>
      {({ 
        account, 
        chain, 
        openAccountModal, 
        openChainModal, 
        openConnectModal, 
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === 'authenticated');

        if (!ready) {
          return (
            <div className="opacity-0 pointer-events-none select-none">
              <ConnectButton onClick={openConnectModal} />
            </div>
          );
        }

        if (!connected) {
          return <ConnectButton onClick={openConnectModal} />;
        }

        if (chain.unsupported) {
          return (
            <button
              onClick={openChainModal}
              type="button"
              className="px-4 py-2 text-sm font-medium text-white transition-all duration-200 bg-red-500 rounded-lg hover:bg-red-600 hover:shadow-lg hover:scale-105"
            >
              Wrong Network
            </button>
          );
        }

        return (
          <div className="flex items-center gap-3">
            <ChainButton chain={chain} onClick={openChainModal} />
            <WalletButton 
              displayName={account.displayName}
              displayBalance={account.displayBalance}
              onClick={openAccountModal}
            />
          </div>
        );
      }}
    </RainbowConnectButton.Custom>
  );
}
