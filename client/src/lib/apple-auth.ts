// Apple Sign In and iCloud backup utilities for FitCircle
// This provides secure backup functionality with Apple ID authentication

export interface AppleUser {
  id: string;
  email?: string;
  name?: {
    firstName?: string;
    lastName?: string;
  };
}

export interface AppleAuthResponse {
  authorization: {
    code: string;
    id_token: string;
    state?: string;
  };
  user?: AppleUser;
}

// Initialize Apple Sign In
export const initializeAppleSignIn = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Apple Sign In requires browser environment'));
      return;
    }

    // Check if Apple ID SDK is already loaded
    if ((window as any).AppleID) {
      resolve();
      return;
    }

    // Load Apple ID JavaScript SDK
    const script = document.createElement('script');
    script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
    script.onload = () => {
      try {
        (window as any).AppleID.auth.init({
          clientId: 'your.app.bundle.id', // Replace with your Apple Developer app ID
          scope: 'name email',
          redirectURI: window.location.origin,
          state: 'fitcircle-backup',
          usePopup: true,
        });
        resolve();
      } catch (error) {
        reject(error);
      }
    };
    script.onerror = () => reject(new Error('Failed to load Apple ID SDK'));
    document.head.appendChild(script);
  });
};

// Sign in with Apple
export const signInWithApple = (): Promise<AppleAuthResponse> => {
  return new Promise((resolve, reject) => {
    if (!(window as any).AppleID) {
      reject(new Error('Apple ID SDK not initialized'));
      return;
    }

    try {
      (window as any).AppleID.auth.signIn()
        .then((response: AppleAuthResponse) => {
          // Store user info for backup encryption
          if (response.user) {
            localStorage.setItem('fitcircle_apple_user', JSON.stringify(response.user));
          }
          if (response.authorization.id_token) {
            localStorage.setItem('fitcircle_apple_token', response.authorization.id_token);
          }
          resolve(response);
        })
        .catch(reject);
    } catch (error) {
      reject(error);
    }
  });
};

// Check if user is signed in
export const isSignedIn = (): boolean => {
  return !!localStorage.getItem('fitcircle_apple_token');
};

// Get current user info
export const getCurrentUser = (): AppleUser | null => {
  const userStr = localStorage.getItem('fitcircle_apple_user');
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
  localStorage.removeItem('fitcircle_apple_user');
  localStorage.removeItem('fitcircle_apple_token');
};

// Get user ID for encryption key derivation
export const getUserIdForEncryption = (): string | null => {
  const user = getCurrentUser();
  const token = localStorage.getItem('fitcircle_apple_token');
  return user?.id || token || null;
};