"use client";

import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
//import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { config } from '@/lib/wagmi.config';
import { useTheme } from 'next-themes';
import { WalletProvider } from "@/contexts/WalletContext";
import { ThemeProvider } from "./theme-provider";
import { getCustomTheme } from '@/lib/theme.config';
import '@rainbow-me/rainbowkit/styles.css';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => new QueryClient());
  const { theme } = useTheme();
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <WalletProvider>
          <ThemeProvider>
         {/*    <RainbowKitProvider
              theme={getCustomTheme(theme === 'dark')}
              modalSize="compact"
              appInfo={{
                appName: 'Xmento',
                learnMoreUrl: 'https://xmento.xyz',
              }}
              showRecentTransactions={false}
            > */}
              {children}
           {/*  </RainbowKitProvider> */}
          </ThemeProvider>
        </WalletProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}