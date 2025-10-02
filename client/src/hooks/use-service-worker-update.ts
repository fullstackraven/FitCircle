import { useEffect, useRef, useState, useCallback } from "react";

export function useServiceWorkerUpdate(pollMs: number = 0) {
  const [updateReady, setUpdateReady] = useState(false);
  const [installingState, setInstallingState] = useState<ServiceWorkerState | null>(null);
  const waitingRef = useRef<ServiceWorker | null>(null);
  const reloadedRef = useRef(false);
  const controllerChangeHandlerRef = useRef<() => void>();

  useEffect(() => {
    const onControllerChange = () => {
      if (reloadedRef.current) return;
      reloadedRef.current = true;
      window.location.reload();
    };
    controllerChangeHandlerRef.current = onControllerChange;
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    return () => {
      const handler = controllerChangeHandlerRef.current;
      if (handler) navigator.serviceWorker.removeEventListener("controllerchange", handler);
    };
  }, []);

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
        waitingRef.current = reg.waiting;
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
    const waiting = reg?.waiting ?? waitingRef.current;

    if (waiting) {
      waitingRef.current = waiting;
      waiting.postMessage({ type: "SKIP_WAITING" });
    } else {
      setTimeout(() => updateNow(), 300);
    }
  }, []);

  return {
    updateReady,
    updateNow,
    checkForUpdates,
    installingState,
  };
}
