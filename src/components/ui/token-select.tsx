"use client";

import {
  TokenSelect as ComposerTokenSelect,
  TokenSelectDropdown,
  TokenSelectGroup,
  TokenSelectInput,
  TokenSelectOption,
} from "@composer-kit/ui/token-select";

interface Token {
  name: string;
  symbol: string;
  address: string;
  decimals: number;
  icon?: string;
  chainId: number;
}

interface TokenSelectProps {
  children?: React.ReactNode;
  defaultToken?: Token;
  delayMs?: number;
  onChange?: (token: Token) => void;
  className?: string;
  tokens?: Token[];
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
  {
    name: "Celo Real",
    symbol: "cREAL",
    address: "0xe8537a3d056da446677b9e9d6c5db704eaab4787",
    decimals: 18,
    chainId: 42220,
  },
];

export function TokenSelect({
  children,
  defaultToken,
  delayMs = 300,
  onChange,
  className = "",
  tokens = defaultTokens,
}: TokenSelectProps) {
  return (
    <div
      className={`flex items-center justify-center bg-white dark:bg-black p-4 rounded-lg ${className}`}
    >
      <ComposerTokenSelect
        defaultToken={defaultToken}
        delayMs={delayMs}
        onChange={onChange}
      >
        {children || (
          <TokenSelectDropdown placeholder="Search tokens...">
            <TokenSelectInput />
            <TokenSelectGroup heading="Available tokens">
              {tokens.map((token) => (
                <TokenSelectOption key={token.address} token={token} />
              ))}
            </TokenSelectGroup>
          </TokenSelectDropdown>
        )}
      </ComposerTokenSelect>
    </div>
  );
}

export {
  ComposerTokenSelect,
  TokenSelectDropdown,
  TokenSelectGroup,
  TokenSelectInput,
  TokenSelectOption,
};
export type { Token };
