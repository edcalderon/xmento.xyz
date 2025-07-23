'use client';

import { useEffect, useState } from 'react';

// This will be populated on the client side only
let storage: any = {
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  },
  sessionStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  }
};

// Only import the actual implementation on the client side
if (typeof window !== 'undefined') {
  import('./client-storage').then((module) => {
    storage = module.default;
  });
}

// Hook to safely use storage with SSR support
export function useStorage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Load the storage module on the client side
    if (isClient && typeof window !== 'undefined') {
      import('./client-storage').then((module) => {
        storage = module.default;
      });
    }
  }, [isClient]);

  return {
    isClient,
    ...storage,
    // Add any additional utilities here
  };
}

export default storage;
