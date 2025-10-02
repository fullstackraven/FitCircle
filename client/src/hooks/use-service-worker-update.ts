import { useEffect, useRef, useState, useCallback } from "react";

// Wait deterministically for a waiting worker (no race conditions)
async function waitForWaiting(reg: ServiceWorkerRegistration, maxMs = 15000): Promise<ServiceWorker | null> {
  if (reg.waiting) return reg.waiting;

  if (reg.installing) {
    const sw = reg.installing;
    await new Promise<void>((resolve, reject) => {
      const to = setTimeout(() => reject(new Error('install timeout')), maxMs);
      const onChange = () => {
        if (sw.state === 'installed') {
          clearTimeout(to);
          resolve();
        } else if (sw.state === 'redundant') {
          clearTimeout(to);
          reject(new Error('install redundant'));
        }
      };
      sw.addEventListener('statechange', onChange);
    });
    if (reg.waiting) return reg.waiting;
  }

  const waiting = await new Promise<ServiceWorker | null>((resolve) => {
    const to = setTimeout(() => resolve(null), maxMs);

    const onUpdateFound = () => {
      const sw = reg.installing;
      if (!sw) return;
      sw.addEventListener('statechange', function onChange() {
        if (sw.state === 'installed') {
          clearTimeout(to);
          reg.removeEventListener('updatefound', onUpdateFound);
          resolve(reg.waiting ?? null);
        }
      });
    };

    reg.addEventListener('updatefound', onUpdateFound);
  });

  return waiting;
}

// Wait for controllerchange event (attach before triggering)
function onceControllerChange(): Promise<void> {
  return new Promise((resolve) => {
    const handler = () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handler);
      resolve();
    };
    navigator.serviceWorker.addEventListener('controllerchange', handler);
  });
}

export function useServiceWorkerUpdate(pollMs: number = 0) {
  const [updateReady, setUpdateReady] = useState(false);
  const [installingState, setInstallingState] = useState<ServiceWorkerState | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let reg: ServiceWorkerRegistration | null = null;

    const handleInstalling = (sw: ServiceWorker | null) => {
      if (!sw) return;
      setInstallingState(sw.state);
      const onStateChange = () => {
        setInstallingState(sw.state);
        if (sw.state === "installed" && navigator.serviceWorker.controller) {
          setUpdateReady(true);
        }
      };
      sw.addEventListener("statechange", onStateChange);
    };

    const onUpdateFound = () => {
      if (!reg) return;
      handleInstalling(reg.installing);
    };

    const primeWaiting = async () => {
      const existing = await navigator.serviceWorker.getRegistration();
      if (!existing) return;
      reg = existing;

      if (reg.waiting) {
        setUpdateReady(true);
      }

      reg.addEventListener("updatefound", onUpdateFound);

      if (reg.installing) handleInstalling(reg.installing);
    };

    primeWaiting();

    return () => {
      if (reg) reg.removeEventListener("updatefound", onUpdateFound);
    };
  }, []);

  const checkForUpdates = useCallback(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    await reg?.update();
  }, []);

  useEffect(() => {
    if (!pollMs) return;
    const id = setInterval(() => { checkForUpdates(); }, pollMs);
    return () => clearInterval(id);
  }, [pollMs, checkForUpdates]);

  const updateNow = useCallback(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    const waiting = reg?.waiting;
    if (!waiting) return;

    const waitForControl = onceControllerChange();
    waiting.postMessage({ type: "SKIP_WAITING" });
    await waitForControl;

    setTimeout(() => window.location.reload(), 50);
  }, []);

  return {
    updateReady,
    updateNow,
    checkForUpdates,
    installingState,
    waitForWaiting,
  };
}
