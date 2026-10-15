import * as DialogPrimitive from '@radix-ui/react-dialog';
import type { ReactElement } from 'react';
import { OverlayScrollLock } from '@/contexts/ScrollLockContext';

/** Existing custom goal cards retain their markup while sharing the viewport,
 * focus containment, portal layering, and scroll lock of the other overlays. */
export function ViewportOverlay({ children, title, onDismiss, className = '' }: {
  children: ReactElement;
  title: string;
  onDismiss?: () => void;
  className?: string;
}) {
  return <DialogPrimitive.Root open onOpenChange={open => { if (!open) onDismiss?.(); }}>
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className={`overlay-frame viewport-overlay bg-black/50 ${className}`}>
        <OverlayScrollLock />
        <DialogPrimitive.Content asChild className="glass-dialog" aria-label={title} aria-describedby={undefined}>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Overlay>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>;
}
