/** Recheck suspended PWAs without navigating or touching personal data. */
export function watchPWAUpdates(
  registration: ServiceWorkerRegistration,
  container: ServiceWorkerContainer,
  onReady: () => void,
  originalController = container.controller,
): () => void {
  let loadedController = originalController;
  let disposed = false;
  let notified = false;
  let checking = false;
  const workers = new Set<ServiceWorker>();
  const ready = () => {
    // First-time offline installation is not an update to the loaded app.
    if (!disposed && loadedController && !notified) {
      notified = true;
      onReady();
    }
  };
  const controllerChanged = () => {
    if (!loadedController) loadedController = container.controller;
    else if (container.controller && container.controller !== loadedController) ready();
  };
  const stateChanged = () => {
    if ([...workers].some(worker => worker !== loadedController && (worker.state === 'installed' || worker.state === 'activated'))) ready();
  };
  const trackInstalling = () => {
    const worker = registration.installing;
    if (worker && !workers.has(worker)) {
      workers.add(worker);
      worker.addEventListener('statechange', stateChanged);
      stateChanged();
    }
  };
  const check = async () => {
    if (disposed || checking || document.visibilityState !== 'visible' || !navigator.onLine) return;
    checking = true;
    try { await registration.update(); }
    catch { /* Offline/transient checks must not interrupt the current app. */ }
    finally { checking = false; }
  };
  registration.addEventListener('updatefound', trackInstalling);
  container.addEventListener('controllerchange', controllerChanged);
  document.addEventListener('visibilitychange', check);
  window.addEventListener('online', check);
  trackInstalling();
  if (registration.waiting) ready();
  controllerChanged();
  return () => {
    disposed = true;
    registration.removeEventListener('updatefound', trackInstalling);
    container.removeEventListener('controllerchange', controllerChanged);
    document.removeEventListener('visibilitychange', check);
    window.removeEventListener('online', check);
    for (const worker of workers) worker.removeEventListener('statechange', stateChanged);
  };
}
