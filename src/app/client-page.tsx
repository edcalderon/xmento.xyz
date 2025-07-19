"use client";

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import all components with SSR disabled
const Wallet = dynamic(
  () => import('@/components/ui/wallet').then((mod) => mod.Wallet),
  { ssr: false, loading: () => <div>Loading wallet...</div> }
);

const Address = dynamic(
  () => import('@/components/ui/address').then((mod) => mod.Address),
  { ssr: false, loading: () => <div>Loading address...</div> }
);

const Identity = dynamic(
  () => import('@/components/ui/identity').then((mod) => mod.Identity),
  { ssr: false, loading: () => <div>Loading identity...</div> }
);

const Balance = dynamic(
  () => import('@/components/ui/balance').then((mod) => mod.Balance),
  { ssr: false, loading: () => <div>Loading balance...</div> }
);

const Swap = dynamic(
  () => import('@/components/ui/swap').then((mod) => mod.Swap),
  { ssr: false, loading: () => <div>Loading swap...</div> }
);

const TokenSelect = dynamic(
  () => import('@/components/ui/token-select').then((mod) => mod.TokenSelect),
  { ssr: false, loading: () => <div>Loading token select...</div> }
);

const Payment = dynamic(
  () => import('@/components/ui/payment').then((mod) => mod.Payment),
  { ssr: false, loading: () => <div>Loading payment...</div> }
);

const Transaction = dynamic(
  () => import('@/components/ui/transaction').then((mod) => mod.Transaction),
  { ssr: false, loading: () => <div>Loading transaction...</div> }
);

const NFTPreview = dynamic(
  () => import('@/components/ui/nft').then((mod) => mod.NFTPreview),
  { ssr: false, loading: () => <div>Loading NFT preview...</div> }
);

const NFTMintComponent = dynamic(
  () => import('@/components/ui/nft').then((mod) => mod.NFTMintComponent),
  { ssr: false, loading: () => <div>Loading NFT mint...</div> }
);

export default function ClientPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-12 text-foreground">
          Mento FX Exchange - Composer Kit Components
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              Wallet Connection
            </h2>
            <Suspense fallback={<div>Loading wallet...</div>}>
              <Wallet />
            </Suspense>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              Address Display
            </h2>
            <Suspense fallback={<div>Loading address...</div>}>
              <Address address="0x208B03553D46A8A16ed53e8632743249dd2E79c3" />
            </Suspense>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              User Identity
            </h2>
            <Suspense fallback={<div>Loading identity...</div>}>
              <Identity />
            </Suspense>
          </div>


          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              Token Balance
            </h2>
            <Suspense fallback={<div>Loading balance...</div>}>
              <Balance />
            </Suspense>
          </div>


          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              Token Swap
            </h2>
            <Suspense fallback={<div>Loading swap...</div>}>
              <Swap />
            </Suspense>
          </div>

 
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              Token Selection
            </h2>
            <Suspense fallback={<div>Loading token select...</div>}>
              <TokenSelect />
            </Suspense>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Payment</h2>
            <Suspense fallback={<div>Loading payment...</div>}>
              <Payment />
            </Suspense>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              Transaction
            </h2>
            <Suspense fallback={<div>Loading transaction...</div>}>
              <Transaction />
            </Suspense>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              NFT Preview
            </h2>
            <Suspense fallback={<div>Loading NFT preview...</div>}>
              <NFTPreview />
            </Suspense>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              NFT Mint
            </h2>
            <Suspense fallback={<div>Loading NFT mint...</div>}>
              <NFTMintComponent />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
