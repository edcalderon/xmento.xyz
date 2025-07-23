"use client";

import { ThemeSwitcher } from "@/components/theme-switcher";
import { ConnectWallet } from "@/components/wallet/ConnectWallet";
const { version } = require("../../package.json");

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex">
          <a className="mr-6 flex items-center space-x-2" href="/">
            <div className="flex items-baseline space-x-2">
              <span className="font-bold text-xl">Mento FX</span>
              <span className="text-xs text-muted-foreground font-mono">v{version}</span>
            </div>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Navigation items can be added here */}
          </div>
          <nav className="flex items-center gap-4">
            <ConnectWallet />
            <ThemeSwitcher />
          </nav>
        </div>
      </div>
    </nav>
  );
}
