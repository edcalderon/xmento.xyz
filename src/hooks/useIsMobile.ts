'use client';

import { useEffect, useState } from 'react';
import { isMobile as isMobileDevice } from 'react-device-detect';

/**
 * Custom hook to detect if the current device is a mobile device.
 * Uses react-device-detect for reliable mobile detection.
 * 
 * @returns {boolean} True if the device is a mobile device, false otherwise
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Set initial value
    setIsMobile(isMobileDevice);
    
    // Optional: Handle window resize if needed
    const handleResize = () => {
      setIsMobile(isMobileDevice);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}

/**
 * Legacy export for backward compatibility
 * @deprecated Use useIsMobile instead
 */
export const useMobileDetection = useIsMobile;
