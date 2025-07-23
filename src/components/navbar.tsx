"use client";

import { ThemeSwitcher } from "@/components/theme-switcher";
//import { ConnectWallet } from "@/components/wallet/ConnectWallet";
import {WalletConnectButton} from "@/components/wallet/wallet-connect-button";
const { version } = require("../../package.json");

export function Navbar() {
  return (
    <div className="w-full overflow-hidden">
      <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
        <div className="mx-auto flex h-14 max-w-screen-2xl items-center">
          <div className="flex-shrink-0">
            <a className="flex items-center space-x-2" href="/">
              <div className="flex items-baseline space-x-2">
                <span className="font-bold text-xl whitespace-nowrap">Mento FX</span>
                <span className="text-xs text-muted-foreground font-mono hidden sm:inline">v{version}</span>
              </div>
            </a>
          </div>
          <div className="flex flex-1 items-center justify-end gap-2 md:gap-4">
            <div className="flex-shrink-0">
              <WalletConnectButton />
            </div>
            <div className="flex-shrink-0">
              <ThemeSwitcher />
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
