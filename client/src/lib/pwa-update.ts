const UPDATE_TIMEOUT = 15000;

function bounded<T>(promise: Promise<T>, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error(message)), UPDATE_TIMEOUT); }),
  ]).finally(() => clearTimeout(timer));
}

function waitForState(worker: ServiceWorker, states: ServiceWorkerState[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = () => { clearTimeout(timer); worker.removeEventListener('statechange', check); };
    const check = () => {
      if (states.includes(worker.state)) { cleanup(); resolve(); }
      else if (worker.state === 'redundant') { cleanup(); reject(new Error('The update could not be installed. Please try again.')); }
    };
    const timer = setTimeout(() => { cleanup(); reject(new Error('The update timed out. Your current app and data are unchanged.')); }, UPDATE_TIMEOUT);
    worker.addEventListener('statechange', check);
    check();
  });
}

function waitForController(container: ServiceWorkerContainer, worker: ServiceWorker): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = () => { clearTimeout(timer); container.removeEventListener('controllerchange', check); };
    const check = () => { if (container.controller === worker) { cleanup(); resolve(); } };
    const timer = setTimeout(() => { cleanup(); reject(new Error('The updated app is not ready yet. Close other FitCircle tabs and try again.')); }, UPDATE_TIMEOUT);
    container.addEventListener('controllerchange', check);
    check();
  });
}

/** Navigate only after the complete new build is installed and controls this
 * page. Do not delete caches or touch localStorage/IndexedDB during an update. */
export async function refreshApp(): Promise<void> {
  if (!navigator.onLine) throw new Error('You are offline. Reconnect before checking for app updates.');
  const base = import.meta.env.BASE_URL;
  const container = navigator.serviceWorker;
  const registration = container && await container.getRegistration(base);
  if (registration) {
    await bounded(registration.update(), 'The update check timed out. Please try again when the connection is stable.');
    const worker = registration.installing || registration.waiting || registration.active;
    if (worker) {
      await waitForState(worker, ['installed', 'activating', 'activated']);
      const controlling = waitForController(container, worker);
      if (worker.state === 'installed') worker.postMessage({ type: 'SKIP_WAITING' });
      await Promise.all([waitForState(worker, ['activated']), controlling]);
    }
  }
  // A fresh navigation to the Pages entry point avoids reloading a deep route
  // while its worker is changing, including in standalone iOS windows.
  window.location.replace(`${base}?refresh=${Date.now()}`);
}
