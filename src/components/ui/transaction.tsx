"use client";

import {
  Transaction as ComposerTransaction,
  TransactionButton,
  TransactionStatus,
} from "@composer-kit/ui/transaction";

interface TransactionConfig {
  abi: Array<any>;
  address: `0x${string}`;
  args: Array<any>;
  functionName: string;
}

interface TransactionProps {
  chainId?: number;
  transaction?: TransactionConfig;
  onSuccess?: (result: any) => void;
  onError?: (error: any) => void;
  children?: React.ReactNode;
  className?: string;
}

const defaultTransaction: TransactionConfig = {
  abi: [
    {
      name: "transfer",
      type: "function",
      stateMutability: "nonpayable",
      inputs: [
        { name: "recipient", type: "address" },
        { name: "amount", type: "uint256" },
      ],
      outputs: [{ name: "", type: "bool" }],
    },
  ],
  address: "0x765de816845861e75a25fca122bb6898b8b1282a",
  args: ["0x717F8A0b80CbEDe59EcA195F1E3D8E142C84d4d6", 1],
  functionName: "transfer",
};

export function Transaction({
  chainId = 42220,
  transaction = defaultTransaction,
  onSuccess,
  onError,
  children,
  className = "",
}: TransactionProps) {
  const handleSuccess = (result: any) => {
    console.log("Transaction successful:", result);
    onSuccess?.(result);
  };

  const handleError = (error: any) => {
    console.log("Transaction error:", error);
    onError?.(error);
  };

  return (
    <div
      className={`w-full items-center justify-center flex flex-col gap-4 bg-white dark:bg-black p-4 rounded-lg ${className}`}
    >
      <ComposerTransaction
        chainId={chainId}
        onError={handleError}
        onSuccess={handleSuccess}
        transaction={transaction}
      >
        {children || (
          <>
            <TransactionButton className="bg-black font-medium dark:bg-white text-white dark:text-black px-4 py-2 rounded">
              Send Transaction
            </TransactionButton>
            <TransactionStatus />
          </>
        )}
      </ComposerTransaction>
    </div>
  );
}

export { ComposerTransaction, TransactionButton, TransactionStatus };
export type { TransactionConfig };
