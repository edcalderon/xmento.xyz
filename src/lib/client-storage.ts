"use client";

import { useState, useCallback } from 'react';

/**
 * Client-side storage utilities
 * Safely handles browser storage APIs that are not available during SSR
 */

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

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
 * Safe wrapper for indexedDB operations
 */
export const safeIndexedDB = {
  isAvailable: (): boolean => {
    if (typeof window === 'undefined') return false;
    return 'indexedDB' in window && 
           typeof window.indexedDB === 'object';
  },
  
  open: (name: string, version?: number): IDBOpenDBRequest | null => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) return null;
    try {
      return window.indexedDB.open(name, version);
    } catch (error) {
      console.error('Error opening IndexedDB:', error);
      return null;
    }
  },
  
  deleteDatabase: (name: string): IDBOpenDBRequest | null => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) return null;
    try {
      return window.indexedDB.deleteDatabase(name);
    } catch (error) {
      console.error('Error deleting IndexedDB database:', error);
      return null;
    }
  },
  
  // Add a safe wrapper for all indexedDB operations
  withSafeDB: async <T>(
    operation: (db: IDBDatabase) => Promise<T>,
    dbName: string,
    version?: number
  ): Promise<T | null> => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      console.warn('IndexedDB is not available in this environment');
      return null;
    }
    
    try {
      return await new Promise<T | null>((resolve, reject) => {
        const request = window.indexedDB.open(dbName, version);
        
        request.onerror = () => {
          console.error('Error opening database');
          reject(new Error('Failed to open database'));
        };
        
        request.onsuccess = async () => {
          const db = request.result;
          
          try {
            // Execute the operation with the database
            const result = await operation(db);
            
            // Close the database when done
            if (db) {
              db.close();
            }
            
            // Resolve with the result
            resolve(result);
          } catch (error) {
            console.error('Error in IndexedDB operation:', error);
            if (db) {
              db.close();
            }
            resolve(null);
          }
        };
        
        request.onupgradeneeded = (event) => {
          // Handle database upgrades if needed
          const db = (event.target as IDBOpenDBRequest).result;
          console.log('Database upgrade needed', db);
        };
      });
    } catch (error) {
      console.error('Error in IndexedDB operation:', error);
      return null;
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
  indexedDB: safeIndexedDB,
  useClientStorage
};
