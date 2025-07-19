"use client";

import {
  Identity as ComposerIdentity,
  Avatar,
  Balance,
  Name,
  Social,
} from "@composer-kit/ui/identity";

type Address = string;
type Token = "CELO" | "cUSD";
type SocialTag = "github" | "twitter";

interface IdentityProps {
  address?: Address;
  token?: Token;
  isTruncated?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function Identity({
  address = "0xE1061b397cC3C381E95a411967e3F053A7c50E70",
  token = "cUSD",
  isTruncated = false,
  className = "",
  children,
}: IdentityProps) {
  return (
    <div className="flex items-center justify-center bg-white dark:bg-black p-4 rounded-lg">
      <div className="w-auto p-6 bg-white dark:bg-black rounded-lg shadow-lg min-w-[200px]">
        <ComposerIdentity
          address={address}
          className={`flex gap-4 items-center ${className}`}
          token={token}
          isTruncated={isTruncated}
        >
          {children || (
            <>
              <Avatar />
              <div className="flex flex-col">
                <Name />
                <Balance />
              </div>
              <Social tag="twitter" />
            </>
          )}
        </ComposerIdentity>
      </div>
    </div>
  );
}

export { ComposerIdentity, Avatar, Balance as IdentityBalance, Name, Social };
export type { Address, Token, SocialTag };
