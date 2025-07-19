"use client";

import {
  Swap as ComposerSwap,
  SwapButton,
  SwapHeader,
  SwapToggle,
  SwapToken,
} from "@composer-kit/ui/swap";

interface SwapableToken {
  name: string;
  symbol: string;
  address: string;
  decimals: number;
  icon?: string;
  chainId: number;
}

interface SwapProps {
  children?: React.ReactNode;
  className?: string;
  swapableTokens?: SwapableToken[];
  onSwap?: () => void;
}

const defaultSwapableTokens: SwapableToken[] = [
  {
    name: "Celo Dollar",
    symbol: "cUSD",
    address: "0x765de816845861e75a25fca122bb6898b8b1282a",
    decimals: 18,
    chainId: 42220,
  },
  {
    name: "Celo Euro",
    symbol: "cEUR",
    address: "0xd8763cba276a3738e6de85b4b3bf5fded6d6ca73",
    decimals: 18,
    chainId: 42220,
  },
  {
    name: "Celo",
    symbol: "CELO",
    address: "0x471ece3750da237f93b8e339c536989b8978a438",
    decimals: 18,
    chainId: 42220,
  },
  {
    name: "Celo Real",
    symbol: "cREAL",
    address: "0xe8537a3d056da446677b9e9d6c5db704eaab4787",
    decimals: 18,
    chainId: 42220,
  },
];

export function Swap({
  children,
  className = "",
  swapableTokens = defaultSwapableTokens,
  onSwap = () => {},
}: SwapProps) {
  return (
    <div
      className={`flex items-center justify-center bg-white dark:bg-black p-4 rounded-lg ${className}`}
    >
      <ComposerSwap>
        {children || (
          <>
            <SwapHeader />
            <SwapToken
              label="Sell"
              swapableTokens={swapableTokens}
              type="from"
            />
            <SwapToggle />
            <SwapToken label="Buy" swapableTokens={swapableTokens} type="to" />
            <SwapButton onSwap={onSwap} />
          </>
        )}
      </ComposerSwap>
    </div>
  );
}

export { ComposerSwap, SwapButton, SwapHeader, SwapToggle, SwapToken };
export type { SwapableToken };
