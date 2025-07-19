"use client";

import {
  NFT as ComposerNFT,
  NFTCard,
  NFTImage,
  NFTMeta,
  NFTMint,
  NFTTokenId,
} from "@composer-kit/ui/nft";

interface NFTProps {
  contractAddress?: string;
  tokenId?: bigint;
  className?: string;
  children?: React.ReactNode;
}

export function NFTPreview({
  contractAddress = "0xd447209176470be0db276549c7143265a559Fb6b",
  tokenId = BigInt("2334"),
  className = "",
  children,
}: NFTProps) {
  return (
    <div
      className={`flex items-center justify-center bg-white dark:bg-black p-4 rounded-lg ${className}`}
    >
      <ComposerNFT contractAddress={contractAddress} tokenId={tokenId}>
        {children || (
          <NFTCard>
            <NFTMeta />
            <NFTImage />
            <NFTTokenId />
          </NFTCard>
        )}
      </ComposerNFT>
    </div>
  );
}

export function NFTMintComponent({
  contractAddress = "0xd447209176470be0db276549c7143265a559Fb6b",
  tokenId = BigInt("2334"),
  className = "",
  children,
}: NFTProps) {
  return (
    <div
      className={`flex items-center justify-center bg-white dark:bg-black p-4 rounded-lg ${className}`}
    >
      <ComposerNFT contractAddress={contractAddress} tokenId={tokenId}>
        {children || (
          <NFTCard>
            <NFTMeta />
            <NFTImage />
            <NFTTokenId />
            <NFTMint />
          </NFTCard>
        )}
      </ComposerNFT>
    </div>
  );
}

export { ComposerNFT as NFT, NFTCard, NFTImage, NFTMeta, NFTMint, NFTTokenId };
