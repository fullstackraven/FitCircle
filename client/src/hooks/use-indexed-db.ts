import { useState, useEffect, useCallback } from 'react';

interface IndexedDBConfig {
  databaseName: string;
  version: number;
  storeName: string;
}

const DB_CONFIG: IndexedDBConfig = {
  databaseName: 'FitCircleStorage',
  version: 1,
  storeName: 'appData'
};

class IndexedDBStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor(private config: IndexedDBConfig) {}

  private async openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.databaseName, this.config.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create the object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.config.storeName)) {
          db.createObjectStore(this.config.storeName);
        }
      };
    });

    return this.dbPromise;
  }

  async setItem(key: string, value: any): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction([this.config.storeName], 'readwrite');
    const store = transaction.objectStore(this.config.storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.put(JSON.stringify(value), key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getItem<T>(key: string): Promise<T | null> {
    const db = await this.openDB();
    const transaction = db.transaction([this.config.storeName], 'readonly');
    const store = transaction.objectStore(this.config.storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        if (request.result === undefined) {
          resolve(null);
        } else {
          try {
            resolve(JSON.parse(request.result));
          } catch (error) {
            resolve(request.result);
          }
        }
      };
    });
  }

  async removeItem(key: string): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction([this.config.storeName], 'readwrite');
    const store = transaction.objectStore(this.config.storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getAll(): Promise<Record<string, any>> {
    const db = await this.openDB();
    const transaction = db.transaction([this.config.storeName], 'readonly');
    const store = transaction.objectStore(this.config.storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      const keysRequest = store.getAllKeys();
      
      let completed = 0;
      let values: any[] = [];
      let keys: string[] = [];
      
      const checkComplete = () => {
        completed++;
        if (completed === 2) {
          const result: Record<string, any> = {};
          keys.forEach((key, index) => {
            try {
              result[key as string] = JSON.parse(values[index]);
            } catch {
              result[key as string] = values[index];
            }
          });
          resolve(result);
        }
      };
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        values = request.result;
        checkComplete();
      };
      
      keysRequest.onerror = () => reject(keysRequest.error);
      keysRequest.onsuccess = () => {
        keys = keysRequest.result as string[];
        checkComplete();
      };
    });
  }

  async clear(): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction([this.config.storeName], 'readwrite');
    const store = transaction.objectStore(this.config.storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getAllKeys(): Promise<string[]> {
    const db = await this.openDB();
    const transaction = db.transaction([this.config.storeName], 'readonly');
    const store = transaction.objectStore(this.config.storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.getAllKeys();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as string[]);
    });
  }
}

// Migration utilities
class StorageMigration {
  private storage = new IndexedDBStorage(DB_CONFIG);
  private readonly MIGRATION_KEY = 'storage_migration_completed';

  async hasMigrationCompleted(): Promise<boolean> {
    try {
      // Check IndexedDB first
      const migrationCompleted = await this.storage.getItem(this.MIGRATION_KEY);
      if (migrationCompleted) return true;

      // Also check localStorage as fallback
      return localStorage.getItem(this.MIGRATION_KEY) === 'true';
    } catch (error) {
      console.error('Error checking migration status:', error);
      return false;
    }
  }

  async migrateFromLocalStorage(): Promise<{ migrated: number; errors: number }> {
    let migrated = 0;
    let errors = 0;

    try {
      console.log('Starting migration from localStorage to IndexedDB...');
      
      // Get all localStorage data
      const localStorageData: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value !== null) {
            localStorageData[key] = value;
          }
        }
      }

      console.log(`Found ${Object.keys(localStorageData).length} items in localStorage`);

      // Migrate each item to IndexedDB
      for (const [key, value] of Object.entries(localStorageData)) {
        try {
          // Try to parse JSON values, keep strings as-is
          let parsedValue;
          try {
            parsedValue = JSON.parse(value);
          } catch {
            parsedValue = value;
          }
          
          await this.storage.setItem(key, parsedValue);
          migrated++;
        } catch (error) {
          console.error(`Error migrating key "${key}":`, error);
          errors++;
        }
      }

      // Mark migration as completed
      await this.storage.setItem(this.MIGRATION_KEY, true);
      localStorage.setItem(this.MIGRATION_KEY, 'true');

      console.log(`Migration completed: ${migrated} items migrated, ${errors} errors`);
      return { migrated, errors };

    } catch (error) {
      console.error('Migration failed:', error);
      return { migrated, errors: errors + 1 };
    }
  }

  async clearLegacyLocalStorage(): Promise<void> {
    try {
      // Keep only essential items like theme and migration status
      const itemsToKeep = [
        'theme',
        'storage_migration_completed',
        // Add any other simple flags you want to keep in localStorage
      ];

      const dataToKeep: Record<string, string> = {};
      itemsToKeep.forEach(key => {
        const value = localStorage.getItem(key);
        if (value !== null) {
          dataToKeep[key] = value;
        }
      });

      // Clear localStorage
      localStorage.clear();

      // Restore kept items
      Object.entries(dataToKeep).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });

      console.log('Legacy localStorage cleared, kept essential items');
    } catch (error) {
      console.error('Error clearing legacy localStorage:', error);
    }
  }
}

// Main hook for IndexedDB storage
export function useIndexedDB() {
  const [isReady, setIsReady] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<{
    completed: boolean;
    migrated?: number;
    errors?: number;
  }>({ completed: false });

  const storage = new IndexedDBStorage(DB_CONFIG);
  const migration = new StorageMigration();

  useEffect(() => {
    let mounted = true;

    const initializeStorage = async () => {
      try {
        // Check if migration is needed
        const migrationCompleted = await migration.hasMigrationCompleted();
        
        if (!migrationCompleted) {
          console.log('Migration needed, starting migration...');
          const result = await migration.migrateFromLocalStorage();
          
          if (mounted) {
            setMigrationStatus({
              completed: true,
              migrated: result.migrated,
              errors: result.errors
            });
          }

          // Optional: Clear legacy localStorage after successful migration
          if (result.errors === 0) {
            await migration.clearLegacyLocalStorage();
          }
        } else {
          if (mounted) {
            setMigrationStatus({ completed: true });
          }
        }

        if (mounted) {
          setIsReady(true);
        }
      } catch (error) {
        console.error('Storage initialization failed:', error);
        if (mounted) {
          setIsReady(true); // Continue even if migration fails
          setMigrationStatus({ completed: false });
        }
      }
    };

    initializeStorage();

    return () => {
      mounted = false;
    };
  }, []);

  const setItem = useCallback(async (key: string, value: any) => {
    return storage.setItem(key, value);
  }, [storage]);

  const getItem = useCallback(async <T>(key: string): Promise<T | null> => {
    return storage.getItem<T>(key);
  }, [storage]);

  const removeItem = useCallback(async (key: string) => {
    return storage.removeItem(key);
  }, [storage]);

  const getAll = useCallback(async () => {
    return storage.getAll();
  }, [storage]);

  const clear = useCallback(async () => {
    return storage.clear();
  }, [storage]);

  const getAllKeys = useCallback(async () => {
    return storage.getAllKeys();
  }, [storage]);

  return {
    isReady,
    migrationStatus,
    setItem,
    getItem,
    removeItem,
    getAll,
    clear,
    getAllKeys
  };
}

export default useIndexedDB;