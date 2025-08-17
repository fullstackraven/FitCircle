/**
 * Safe localStorage wrapper with versioning and validation
 * Provides type-safe, schema-validated storage operations
 */

import { z } from 'zod';
import { K } from './keys';

export const CURRENT_VERSION = 2;

/**
 * Safe JSON parsing with fallback
 */
function safeParseJSON<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  
  try {
    return JSON.parse(value);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Failed to parse JSON from localStorage:', error);
    }
    return fallback;
  }
}

/**
 * Safe localStorage getter with schema validation
 */
export function getStorageData<T>(key: string, schema: z.ZodSchema<T>, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    const parsed = safeParseJSON(raw, fallback);
    
    // Validate with schema
    const result = schema.safeParse(parsed);
    if (result.success) {
      return result.data;
    } else {
      if (import.meta.env.DEV) {
        console.warn(`Storage validation failed for key "${key}":`, result.error);
      }
      return fallback;
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(`Error reading from localStorage for key "${key}":`, error);
    }
    return fallback;
  }
}

/**
 * Safe localStorage setter with schema validation
 */
export function setStorageData<T>(key: string, data: T, schema: z.ZodSchema<T>): boolean {
  try {
    // Validate before saving
    const result = schema.safeParse(data);
    if (!result.success) {
      if (import.meta.env.DEV) {
        console.error(`Storage validation failed before saving key "${key}":`, result.error);
      }
      return false;
    }
    
    const serialized = JSON.stringify(result.data);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(`Error writing to localStorage for key "${key}":`, error);
    }
    return false;
  }
}

/**
 * Remove item from localStorage safely
 */
export function removeStorageData(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(`Error removing from localStorage for key "${key}":`, error);
    }
    return false;
  }
}

/**
 * Simple non-validating storage functions for backward compatibility
 */
export function get(key: string) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export function set(key: string, data: any): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if localStorage is available
 */
export function isStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, 'test');
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get current app version from storage
 */
export function getStorageVersion(): number {
  const version = localStorage.getItem(K.version);
  return version ? parseInt(version, 10) : 1;
}

/**
 * Set app version in storage
 */
export function setStorageVersion(version: number): void {
  localStorage.setItem(K.version, version.toString());
}

/**
 * Clear all app data (nuclear option)
 */
export function clearAllAppData(): void {
  Object.values(K).forEach(key => {
    if (typeof key === 'string') {
      removeStorageData(key);
    }
  });
}

/**
 * Export all app data for backup
 */
export function exportAppData(): Record<string, unknown> {
  const backup: Record<string, unknown> = {};
  
  Object.entries(K).forEach(([name, key]) => {
    if (typeof key === 'string' && key.startsWith('fitcircle:')) {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          backup[name] = JSON.parse(data);
        } catch {
          backup[name] = data; // Store as string if not JSON
        }
      }
    }
  });
  
  return backup;
}

/**
 * Import app data from backup
 */
export function importAppData(backup: Record<string, unknown>): boolean {
  try {
    Object.entries(backup).forEach(([name, data]) => {
      const key = K[name as keyof typeof K];
      if (typeof key === 'string' && key.startsWith('fitcircle:')) {
        localStorage.setItem(key, JSON.stringify(data));
      }
    });
    return true;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error importing app data:', error);
    }
    return false;
  }
}

/**
 * Get storage usage information
 */
export function getStorageInfo(): { used: number; available: number; percentage: number } {
  let used = 0;
  
  // Calculate used space for app keys only
  Object.values(K).forEach(key => {
    if (typeof key === 'string') {
      const item = localStorage.getItem(key);
      if (item) {
        used += item.length;
      }
    }
  });
  
  // Rough estimate of 5MB localStorage limit
  const available = 5 * 1024 * 1024;
  const percentage = (used / available) * 100;
  
  return { used, available, percentage };
}