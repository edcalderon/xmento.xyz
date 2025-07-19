import { Address } from "@/components/ui/address";
import { Balance } from "@/components/ui/balance";
import { Identity } from "@/components/ui/identity";
import { NFTPreview, NFTMintComponent } from "@/components/ui/nft";
import { Payment } from "@/components/ui/payment";
import { Swap } from "@/components/ui/swap";
import { TokenSelect } from "@/components/ui/token-select";
import { Transaction } from "@/components/ui/transaction";
import { Wallet } from "@/components/ui/wallet";

export default function Page() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-12 text-foreground">
          Mento FX Exchange - Composer Kit Components
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Wallet Component */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              Wallet Connection
            </h2>
            <Wallet />
          </div>

          {/* Address Component */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              Address Display
            </h2>
            <Address address="0x208B03553D46A8A16ed53e8632743249dd2E79c3" />
          </div>

          {/* Identity Component */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              User Identity
            </h2>
            <Identity />
          </div>

          {/* Balance Component */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              Token Balance
            </h2>
            <Balance />
          </div>

          {/* Swap Component */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              Token Swap
            </h2>
            <Swap />
          </div>

          {/* Token Select Component */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              Token Selection
            </h2>
            <TokenSelect />
          </div>

          {/* Payment Component */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Payment</h2>
            <Payment />
          </div>

          {/* Transaction Component */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              Transaction
            </h2>
            <Transaction />
          </div>

          {/* NFT Preview Component */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              NFT Preview
            </h2>
            <NFTPreview />
          </div>

          {/* NFT Mint Component */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">NFT Mint</h2>
            <NFTMintComponent />
          </div>
        </div>
      </div>
    </div>
  );
}
