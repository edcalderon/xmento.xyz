"use client";

import { useState } from "react";
import {
  Payment as ComposerPayment,
  PaymentError,
  PaymentDialog,
} from "@composer-kit/ui/payment";
import { celo } from "viem/chains";

type Address = string;
type Chain = typeof celo;

interface PaymentProps {
  amount?: string;
  tokenAddress?: `0x${string}`;
  recipientAddress?: `0x${string}`;
  onSuccess?: (txHash: string) => void;
  onError?: (error: Error) => void;
  children?: React.ReactNode;
  chain?: Chain;
  className?: string;
}

export function Payment({
  amount = "0.001",
  tokenAddress = "0x765de816845861e75a25fca122bb6898b8b1282a",
  recipientAddress = "0x717F8A0b80CbEDe59EcA195F1E3D8E142C84d4d6",
  onSuccess,
  onError,
  children,
  chain = celo,
  className = "",
}: PaymentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [txHash, setTxHash] = useState("");

  const handleSuccess = (hash: string) => {
    setTxHash(hash);
    setIsOpen(false);
    onSuccess?.(hash);
  };

  const handleError = (error: Error) => {
    console.error("Payment error", error);
    onError?.(error);
  };

  return (
    <div
      className={`w-full items-center justify-center flex flex-col gap-4 bg-white dark:bg-black p-4 rounded-lg ${className}`}
    >
      <ComposerPayment
        amount={amount}
        //@ts-ignore
        chain={chain}
        onSuccess={handleSuccess}
        onError={handleError}
        recipientAddress={recipientAddress}
        tokenAddress={tokenAddress}
      >
        {children || (
          <button
            className="bg-black font-medium dark:bg-white text-white dark:text-black px-4 py-2 rounded"
            onClick={() => {
              setIsOpen(!isOpen);
            }}
          >
            Pay Now
          </button>
        )}
        <PaymentDialog
          onOpenChange={() => {
            setIsOpen(!isOpen);
          }}
          open={isOpen}
        />
        <PaymentError />
      </ComposerPayment>
      {txHash && (
        <p className="text-sm text-green-600 dark:text-green-400 break-all">
          Transaction: {txHash}
        </p>
      )}
    </div>
  );
}

export { ComposerPayment, PaymentError, PaymentDialog };
export type { Address, Chain };
