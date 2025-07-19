"use client";

import { Address as ComposerAddress } from "@composer-kit/ui/address";
import { useState } from "react";

interface AddressProps {
  address: string;
  isTruncated?: boolean;
  className?: string;
  copyOnClick?: boolean;
  onCopyComplete?: (message: string) => void;
}

export function Address({
  address = "0x208B03553D46A8A16ed53e8632743249dd2E79c3",
  isTruncated = false,
  className = "",
  copyOnClick = true,
  onCopyComplete,
}: AddressProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyComplete = (message: string) => {
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 1000);
    onCopyComplete?.(message);
  };

  return (
    <div className="bg-white dark:bg-black p-4 rounded-lg">
      <ComposerAddress
        address={address}
        isTruncated={isTruncated}
        className={`bg-white dark:bg-black p-2 rounded-md font-semibold ${className}`}
        copyOnClick={copyOnClick}
        onCopyComplete={handleCopyComplete}
      />
      {isCopied && (
        <p className="mt-2 text-white dark:text-black bg-black dark:bg-white p-1 font-medium text-sm text-center w-[4rem] rounded-md">
          Copied
        </p>
      )}
    </div>
  );
}

export { ComposerAddress };
