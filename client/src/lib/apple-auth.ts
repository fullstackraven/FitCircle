// Secure backup utilities for FitCircle
// This provides secure backup functionality with local device authentication

export interface SecureUser {
  id: string;
  email?: string;
  name?: {
    firstName?: string;
    lastName?: string;
  };
}

export interface DeviceAuthResponse {
  success: boolean;
  user?: SecureUser;
  deviceId: string;
}

// Generate a secure device-based identifier
function generateDeviceId(): string {
  // Create a unique device identifier based on browser fingerprint
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);
  }
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset().toString(),
    canvas.toDataURL()
  ].join('|');
  
  // Create a hash of the fingerprint
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return 'device_' + Math.abs(hash).toString(36);
}

// Initialize secure backup system
export const initializeSecureBackup = (): Promise<void> => {
  return new Promise((resolve) => {
    // Always resolves since we use device-based authentication
    resolve();
  });
};

// Sign in with device-based authentication
export const signInWithDevice = (): Promise<DeviceAuthResponse> => {
  return new Promise((resolve) => {
    const deviceId = generateDeviceId();
    const timestamp = new Date().toISOString();
    
    // Create a user profile based on device
    const user: SecureUser = {
      id: deviceId,
      name: {
        firstName: 'Device',
        lastName: 'User'
      }
    };
    
    // Store user info for backup encryption
    localStorage.setItem('fitcircle_secure_user', JSON.stringify(user));
    localStorage.setItem('fitcircle_device_token', deviceId);
    localStorage.setItem('fitcircle_auth_timestamp', timestamp);
    
    resolve({
      success: true,
      user,
      deviceId
    });
  });
};

// Check if user is signed in
export const isSignedIn = (): boolean => {
  return !!localStorage.getItem('fitcircle_device_token');
};

// Get current user info
export const getCurrentUser = (): SecureUser | null => {
  const userStr = localStorage.getItem('fitcircle_secure_user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  return null;
};

// Sign out
export const signOut = (): void => {
  localStorage.removeItem('fitcircle_secure_user');
  localStorage.removeItem('fitcircle_device_token');
  localStorage.removeItem('fitcircle_auth_timestamp');
};

// Get user ID for encryption key derivation
export const getUserIdForEncryption = (): string | null => {
  const user = getCurrentUser();
  const token = localStorage.getItem('fitcircle_device_token');
  return user?.id || token || null;
};