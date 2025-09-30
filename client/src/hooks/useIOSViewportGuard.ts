import { useEffect, useRef, useState } from "react";

export function useIOSViewportGuard(opts: {
  scrollEl?: HTMLElement | null;
  dockEl?: HTMLElement | null;
  keyboardThreshold?: number;
  glitchDebounceMs?: number;
}) {
  const {
    scrollEl,
    dockEl,
    keyboardThreshold = 80,
    glitchDebounceMs = 120,
  } = opts;

  const raf = useRef<number | null>(null);
  const lastH = useRef<number>(0);
  const [shellKey, setShellKey] = useState(0);

  function applyViewportVars() {
    const vv = window.visualViewport;
    const vh = (vv?.height ?? window.innerHeight) * 0.01;
    document.documentElement.style.setProperty("--app-dvh", `${vh}px`);

    const kbOffset = Math.max(0, window.innerHeight - (vv?.height ?? window.innerHeight));
    document.documentElement.style.setProperty("--kb-offset", `${kbOffset}px`);
    document.documentElement.classList.toggle("keyboard-open", kbOffset > keyboardThreshold);
  }

  function forceStableReflow() {
    applyViewportVars();

    if (scrollEl) {
      const prev = scrollEl.style.overflow;
      scrollEl.style.overflow = "hidden";
      scrollEl.offsetHeight;
      scrollEl.style.overflow = prev || "auto";
    }

    if (dockEl) {
      const prev = dockEl.style.transform;
      dockEl.style.willChange = "transform";
      dockEl.style.transform = "translateZ(0)";
      dockEl.offsetHeight;
      dockEl.style.transform = prev || "";
      dockEl.style.willChange = "";
    }
  }

  function maybeNormalizeGlitch() {
    const vv = window.visualViewport;
    const h = vv?.height ?? window.innerHeight;

    const heightJump = Math.abs(h - (lastH.current || h));
    const noFocus = document.activeElement === document.body || !document.activeElement;

    const kbOffset = Math.max(0, window.innerHeight - h);
    const keyboardOpen = kbOffset > keyboardThreshold;

    if (!keyboardOpen && noFocus && heightJump > 40) {
      forceStableReflow();
    }

    lastH.current = h;
  }

  useEffect(() => {
    applyViewportVars();
    lastH.current = window.visualViewport?.height ?? window.innerHeight;

    const onVVChange = () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        applyViewportVars();
        setTimeout(maybeNormalizeGlitch, glitchDebounceMs);
      });
    };

    const onResize = onVVChange;

    const vv = window.visualViewport;
    vv?.addEventListener("resize", onVVChange);
    vv?.addEventListener("scroll", onVVChange);
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    const onFocusOut = () => setTimeout(onVVChange, 150);
    document.addEventListener("focusout", onFocusOut, true);

    return () => {
      vv?.removeEventListener("resize", onVVChange);
      vv?.removeEventListener("scroll", onVVChange);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      document.removeEventListener("focusout", onFocusOut, true);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [scrollEl, dockEl, keyboardThreshold, glitchDebounceMs]);

  return { shellKey, hardReset: () => setShellKey(k => k + 1), normalizeNow: forceStableReflow };
}
