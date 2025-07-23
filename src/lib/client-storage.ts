"use client";

import { useState, useCallback } from 'react';

/**
 * Client-side storage utilities
 * Safely handles browser storage APIs that are not available during SSR
 */

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined' && 
                 typeof window.document !== 'undefined' &&
                 typeof window.localStorage !== 'undefined' &&
                 typeof window.sessionStorage !== 'undefined';

/**
 * Safe wrapper for localStorage operations
 */
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (!isBrowser) return null;
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (!isBrowser) return;
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting localStorage:', error);
    }
  },
  removeItem: (key: string): void => {
    if (!isBrowser) return;
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }
};

/**
 * Safe wrapper for sessionStorage operations
 */
export const safeSessionStorage = {
  getItem: (key: string): string | null => {
    if (!isBrowser) return null;
    try {
      return window.sessionStorage.getItem(key);
    } catch (error) {
      console.error('Error accessing sessionStorage:', error);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (!isBrowser) return;
    try {
      window.sessionStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting sessionStorage:', error);
    }
  },
  removeItem: (key: string): void => {
    if (!isBrowser) return;
    try {
      window.sessionStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from sessionStorage:', error);
    }
  }
};

/**
 * Hook to safely access client-side storage
 */
export const useClientStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = safeLocalStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from storage:', error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      safeLocalStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error writing to storage:', error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue] as const;
};

export default {
  localStorage: safeLocalStorage,
  sessionStorage: safeSessionStorage,
  // Add any additional storage utilities here
};
