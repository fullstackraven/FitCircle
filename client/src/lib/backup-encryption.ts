// Secure backup encryption for FitCircle using Web Crypto API
// Provides AES-GCM encryption with key derivation from Apple ID

export interface EncryptedBackup {
  data: string; // Base64 encoded encrypted data
  iv: string;   // Base64 encoded initialization vector
  salt: string; // Base64 encoded salt for key derivation
  version: string;
}

// Derive encryption key from user ID using PBKDF2
async function deriveKey(userId: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(userId),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt backup data
export async function encryptBackup(data: Record<string, string>, userId: string): Promise<EncryptedBackup> {
  if (!userId) {
    throw new Error('User ID required for encryption');
  }

  // Generate random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Derive encryption key
  const key = await deriveKey(userId, salt);

  // Encrypt the data
  const encoder = new TextEncoder();
  const dataString = JSON.stringify(data);
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encoder.encode(dataString)
  );

  // Convert to base64 for storage
  return {
    data: arrayBufferToBase64(encryptedData),
    iv: arrayBufferToBase64(iv),
    salt: arrayBufferToBase64(salt),
    version: '1.0'
  };
}

// Decrypt backup data
export async function decryptBackup(encryptedBackup: EncryptedBackup, userId: string): Promise<Record<string, string>> {
  if (!userId) {
    throw new Error('User ID required for decryption');
  }

  try {
    // Convert from base64
    const encryptedData = base64ToArrayBuffer(encryptedBackup.data);
    const iv = base64ToArrayBuffer(encryptedBackup.iv);
    const salt = base64ToArrayBuffer(encryptedBackup.salt);

    // Derive the same key
    const key = await deriveKey(userId, new Uint8Array(salt));

    // Decrypt the data
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(iv) },
      key,
      encryptedData
    );

    // Convert back to string and parse
    const decoder = new TextDecoder();
    const dataString = decoder.decode(decryptedData);
    return JSON.parse(dataString);
  } catch (error) {
    throw new Error('Failed to decrypt backup. Make sure you\'re signed in with the same Apple ID used to create this backup.');
  }
}

// Utility functions for base64 conversion
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Check if Web Crypto API is supported
export function isEncryptionSupported(): boolean {
  return typeof crypto !== 'undefined' && 
         typeof crypto.subtle !== 'undefined' &&
         typeof crypto.subtle.encrypt === 'function';
}

// Create encrypted backup file for download
export async function createEncryptedBackupFile(data: Record<string, string>, userId: string): Promise<Blob> {
  const encryptedBackup = await encryptBackup(data, userId);
  const backupData = {
    fitcircle: true,
    encrypted: true,
    created: new Date().toISOString(),
    ...encryptedBackup
  };
  
  return new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
}

// Parse and decrypt backup file
export async function parseEncryptedBackupFile(file: File, userId: string): Promise<Record<string, string>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const backupFile = JSON.parse(content);
        
        if (!backupFile.fitcircle || !backupFile.encrypted) {
          throw new Error('Invalid encrypted backup file');
        }
        
        const encryptedBackup: EncryptedBackup = {
          data: backupFile.data,
          iv: backupFile.iv,
          salt: backupFile.salt,
          version: backupFile.version
        };
        
        const decryptedData = await decryptBackup(encryptedBackup, userId);
        resolve(decryptedData);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}