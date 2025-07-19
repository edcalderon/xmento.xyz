"use client";

import {
  Balance as ComposerBalance,
  BalanceInput,
  BalanceOptions,
  BalanceText,
} from "@composer-kit/ui/balance";

interface Token {
  name: string;
  symbol: string;
  address: string;
  decimals: number;
  icon?: string;
  chainId: number;
}

interface BalanceProps {
  children?: React.ReactNode;
  precision?: number;
  tokens?: Token[];
  className?: string;
}

const defaultTokens: Token[] = [
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
];

export function Balance({
  children,
  precision = 18,
  tokens = defaultTokens,
  className = "",
}: BalanceProps) {
  return (
    <div
      className={`flex items-center justify-center bg-white dark:bg-black p-4 rounded-lg ${className}`}
    >
      <div className="w-96 p-4 bg-white dark:bg-black rounded-lg shadow-lg">
        <ComposerBalance>
          {children || (
            <>
              <div className="flex flex-col gap-4">
                <BalanceOptions tokens={tokens} />
                <BalanceInput />
              </div>
              <div className="mt-4">
                <BalanceText />
              </div>
            </>
          )}
        </ComposerBalance>
      </div>
    </div>
  );
}

export { ComposerBalance, BalanceInput, BalanceOptions, BalanceText };
export type { Token };
