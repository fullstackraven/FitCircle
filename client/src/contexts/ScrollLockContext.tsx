import React, { createContext, useContext, useRef, useCallback } from 'react';

interface ScrollLockContextType {
  lockScroll: () => void;
  unlockScroll: () => void;
}

const ScrollLockContext = createContext<ScrollLockContextType | null>(null);

export function ScrollLockProvider({ children }: { children: React.ReactNode }) {
  const lockCountRef = useRef(0);

  const lockScroll = useCallback(() => {
    lockCountRef.current += 1;
    
    // Only apply the lock on the first request
    if (lockCountRef.current === 1) {
      document.documentElement.style.overflow = 'hidden';
    }
  }, []);

  const unlockScroll = useCallback(() => {
    lockCountRef.current = Math.max(0, lockCountRef.current - 1);
    
    // Only remove the lock when all requests are cleared
    if (lockCountRef.current === 0) {
      document.documentElement.style.overflow = '';
    }
  }, []);

  return (
    <ScrollLockContext.Provider value={{ lockScroll, unlockScroll }}>
      {children}
    </ScrollLockContext.Provider>
  );
}

export function useScrollLock() {
  const context = useContext(ScrollLockContext);
  if (!context) {
    throw new Error('useScrollLock must be used within a ScrollLockProvider');
  }
  return context;
}