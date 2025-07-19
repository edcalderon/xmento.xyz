import { TempoInit } from "@/components/tempo-init";
import { WalletProvider } from "@/contexts/WalletContext";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { ThirdwebProvider } from "thirdweb/react";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '@/lib/wagmi.config';
import React from "react";
import "./globals.css";

const queryClient = new QueryClient();

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tempo - Modern SaaS Starter",
  description: "A modern full-stack starter template powered by Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Script src="https://api.tempolabs.ai/proxy-asset?url=https://storage.googleapis.com/tempo-public-assets/error-handling.js" />
      <body className={inter.className}>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <ThirdwebProvider>
              <WalletProvider>
                <ThemeProvider>
                  <Navbar />
                  {children}
                  <TempoInit />
                </ThemeProvider>
              </WalletProvider>
            </ThirdwebProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}
