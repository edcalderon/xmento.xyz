"use client";

import { ThemeSwitcher } from "@/components/theme-switcher";
import { Wallet } from "@/components/ui/wallet";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex">
          <a className="mr-6 flex items-center space-x-2" href="/">
            <span className="font-bold text-xl">Mento FX</span>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Navigation items can be added here */}
          </div>
          <nav className="flex items-center space-x-2">
            <Wallet />
            <ThemeSwitcher />
          </nav>
        </div>
      </div>
    </nav>
  );
}
