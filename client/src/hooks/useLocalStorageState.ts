/**
 * Generic localStorage hook with schema validation
 * Provides type-safe state management backed by localStorage
 */

import { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import { getStorageData, setStorageData } from '@/lib/safeStorage';

/**
 * Generic localStorage state hook with schema validation
 * @param key - Storage key
 * @param schema - Zod schema for validation
 * @param defaultValue - Default value if storage is empty or invalid
 * @returns Tuple of [state, setState, isLoading]
 */
export function useLocalStorageState<T>(
  key: string,
  schema: z.ZodSchema<T>,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const [state, setState] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize state from localStorage
  useEffect(() => {
    const storedData = getStorageData(key, schema, defaultValue);
    setState(storedData);
    setIsLoading(false);
  }, [key, schema, defaultValue]);

  // Update localStorage when state changes
  const updateState = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState(prev => {
        const newValue = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value;
        
        // Save to localStorage
        setStorageData(key, newValue, schema);
        
        return newValue;
      });
    },
    [key, schema]
  );

  return [state, updateState, isLoading];
}

/**
 * Hook for localStorage state that only updates on demand
 * Useful for read-heavy scenarios where automatic sync isn't needed
 */
export function useLocalStorageStateManual<T>(
  key: string,
  schema: z.ZodSchema<T>,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void, boolean] {
  const [state, setState] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);

  // Manual refresh from localStorage
  const refresh = useCallback(() => {
    setIsLoading(true);
    const storedData = getStorageData(key, schema, defaultValue);
    setState(storedData);
    setIsLoading(false);
  }, [key, schema, defaultValue]);

  // Initialize state from localStorage
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Update localStorage when state changes
  const updateState = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState(prev => {
        const newValue = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value;
        
        // Save to localStorage
        setStorageData(key, newValue, schema);
        
        return newValue;
      });
    },
    [key, schema]
  );

  return [state, updateState, refresh, isLoading];
}

/**
 * Simple localStorage hook for primitive values
 * @param key - Storage key
 * @param defaultValue - Default value
 * @returns Tuple of [value, setValue]
 */
export function useLocalStorageValue<T extends string | number | boolean>(
  key: string,
  defaultValue: T
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;
      
      // Parse based on default value type
      if (typeof defaultValue === 'boolean') {
        return (item === 'true') as T;
      } else if (typeof defaultValue === 'number') {
        return Number(item) as T;
      } else {
        return item as T;
      }
    } catch {
      return defaultValue;
    }
  });

  const updateValue = useCallback(
    (newValue: T) => {
      try {
        setValue(newValue);
        localStorage.setItem(key, String(newValue));
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error(`Error saving to localStorage for key "${key}":`, error);
        }
      }
    },
    [key]
  );

  return [value, updateValue];
}