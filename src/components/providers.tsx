"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from 'wagmi';
import { config } from '@/lib/wagmi.config';
import { ThirdwebProvider } from "thirdweb/react";
import { ThemeProvider } from "./theme-provider";
import { WalletProvider } from "@/contexts/WalletContext";
import { ReactNode } from 'react';

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThirdwebProvider>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <WalletProvider>
            <ThemeProvider>
              {children}
            </ThemeProvider>
          </WalletProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThirdwebProvider>
  );
}
