"use client";

import { VaultInteraction } from '@/components/vault/vault-interaction';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VaultStatus } from "@/components/vault/vault-status";
import { useAccount } from 'wagmi';

export default function Home() {
  const { address } = useAccount();
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Xmento Vault
            </h1>
            <p className="text-muted-foreground mt-2">
              Earn yield on your stablecoins with automated rebalancing
            </p>
          </div>
          <div className="w-full md:w-auto">
            <VaultStatus address={address} />
          </div>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Vault Interaction */}
          <div className="lg:col-span-2 space-y-6">
            <VaultInteraction />
          </div>
          
          {/* Right Column - Info and Stats */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">1</div>
                  <div>
                    <h3 className="font-medium">Deposit</h3>
                    <p className="text-sm text-muted-foreground">Add cUSD, cEUR, or cREAL to your vault</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">2</div>
                  <div>
                    <h3 className="font-medium">Earn</h3>
                    <p className="text-sm text-muted-foreground">Earn yield through automated rebalancing</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">3</div>
                  <div>
                    <h3 className="font-medium">Withdraw</h3>
                    <p className="text-sm text-muted-foreground">Withdraw your funds anytime</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>About Xmento Vault</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Xmento Vault automatically rebalances your stablecoin portfolio to maximize yield based on real-time APY data from the Celo network.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
