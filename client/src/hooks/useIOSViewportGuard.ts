import { useLayoutEffect } from 'react';

/** One viewport source for the shell and portalled overlays. visualViewport
 * includes keyboard resizing/panning; CSS dvh is the no-JavaScript fallback. */
export function useIOSViewportGuard() {
  useLayoutEffect(() => {
    const root = document.documentElement;
    const viewport = window.visualViewport;
    let frame = 0;
    const update = () => {
      frame = 0;
      // Pinch zoom should magnify the interface, not re-layout it.
      if (viewport && viewport.scale !== 1) return;
      const height = viewport?.height ?? window.innerHeight;
      const top = viewport?.offsetTop ?? 0;
      root.style.setProperty('--app-height', `${height}px`);
      root.style.setProperty('--viewport-top', `${top}px`);
      const active = document.activeElement as HTMLElement | null;
      const focused = active?.matches('input, textarea, [contenteditable="true"]');
      root.classList.toggle('keyboard-open', Boolean(focused && window.innerHeight - height - top > 80));
      // Resize only the overlay's own scroller when the keyboard would cover
      // its active field; never reset the page's scroll position or React tree.
      const scroller = focused ? active?.closest<HTMLElement>('.dialog-body, .sheet-body, .viewport-overlay [role="dialog"]') : null;
      if (scroller && active) {
        const field = active.getBoundingClientRect();
        const bounds = scroller.getBoundingClientRect();
        if (field.bottom > bounds.bottom) scroller.scrollTop += field.bottom - bounds.bottom + 16;
        else if (field.top < bounds.top) scroller.scrollTop -= bounds.top - field.top + 16;
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    viewport?.addEventListener('resize', schedule);
    viewport?.addEventListener('scroll', schedule);
    window.addEventListener('resize', schedule);
    window.addEventListener('orientationchange', schedule);
    window.addEventListener('pageshow', schedule);
    document.addEventListener('focusin', schedule);
    document.addEventListener('focusout', schedule);
    return () => {
      cancelAnimationFrame(frame);
      viewport?.removeEventListener('resize', schedule);
      viewport?.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('orientationchange', schedule);
      window.removeEventListener('pageshow', schedule);
      document.removeEventListener('focusin', schedule);
      document.removeEventListener('focusout', schedule);
      root.style.removeProperty('--app-height');
      root.style.removeProperty('--viewport-top');
      root.classList.remove('keyboard-open');
    };
  }, []);
}
