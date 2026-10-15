import { createContext, useContext, useRef, useCallback, useLayoutEffect, type ReactNode } from 'react';

const ScrollLockContext = createContext<(() => () => void) | null>(null);

export function ScrollLockProvider({ children }: { children: ReactNode }) {
  const locks = useRef(0);
  const acquire = useCallback(() => {
    locks.current += 1;
    document.documentElement.dataset.overlayOpen = 'true';
    let released = false;
    return () => {
      if (released) return;
      released = true;
      locks.current -= 1;
      if (!locks.current) delete document.documentElement.dataset.overlayOpen;
    };
  }, []);
  useLayoutEffect(() => () => { delete document.documentElement.dataset.overlayOpen; }, []);
  return <ScrollLockContext.Provider value={acquire}>{children}</ScrollLockContext.Provider>;
}

/** Lock the actual main scroller for the lifetime of each mounted overlay.
 * Nested overlays release independently, including route-change unmounts. */
export function useOverlayScrollLock() {
  const acquire = useContext(ScrollLockContext);
  if (!acquire) throw new Error('Overlay must be inside ScrollLockProvider');
  useLayoutEffect(() => acquire(), [acquire]);
}

export function OverlayScrollLock() {
  useOverlayScrollLock();
  return null;
}
