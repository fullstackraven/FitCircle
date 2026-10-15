import { createContext, useContext, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export const HeaderHostContext = createContext<HTMLDivElement | null>(null);

/** Keep page-owned controls and state, but paint outside the scroll surface. */
export function AppHeader({ children }: { children: ReactNode }) {
  const host = useContext(HeaderHostContext);
  return host ? createPortal(<header className="fitcircle-fixed-header">{children}</header>, host) : null;
}
