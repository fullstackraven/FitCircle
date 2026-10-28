import { test } from 'node:test';
import assert from 'node:assert/strict';
import { watchPWAUpdates } from '../client/src/lib/pwa-update-detection';

function fixture(original = true) {
  const doc = Object.assign(new EventTarget(), { visibilityState: 'visible' });
  const win = new EventTarget();
  const connection = { onLine: true };
  const previous = ['document', 'window', 'navigator'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
  Object.defineProperties(globalThis, {
    document: { configurable: true, value: doc },
    window: { configurable: true, value: win },
    navigator: { configurable: true, value: connection },
  });
  const worker = (state: ServiceWorkerState) => Object.assign(new EventTarget(), { state });
  const old = worker('activated');
  const container = Object.assign(new EventTarget(), { controller: original ? old : null });
  let checks = 0, notices = 0;
  const registration = Object.assign(new EventTarget(), {
    installing: null as ReturnType<typeof worker> | null,
    waiting: null as ReturnType<typeof worker> | null,
    update: async () => { checks++; return registration; },
  });
  let stop = () => {};
  return {
    doc, win, connection, worker, container, registration,
    get checks() { return checks; }, get notices() { return notices; },
    start() { stop = watchPWAUpdates(registration as unknown as ServiceWorkerRegistration, container as unknown as ServiceWorkerContainer, () => notices++); },
    close() {
      stop();
      for (const [key, descriptor] of previous) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else Reflect.deleteProperty(globalThis, key);
      }
    },
  };
}

test('a resumed or reconnected PWA checks for new builds; hidden/offline checks are deferred', async () => {
  const f = fixture();
  try {
    f.start();
    f.doc.visibilityState = 'hidden'; f.doc.dispatchEvent(new Event('visibilitychange'));
    assert.equal(f.checks, 0);
    f.doc.visibilityState = 'visible'; f.doc.dispatchEvent(new Event('visibilitychange'));
    await Promise.resolve();
    assert.equal(f.checks, 1);
    f.connection.onLine = false; f.win.dispatchEvent(new Event('online'));
    assert.equal(f.checks, 1);
    f.connection.onLine = true; f.win.dispatchEvent(new Event('online'));
    await Promise.resolve();
    assert.equal(f.checks, 2);
    assert.equal(f.notices, 0);
  } finally { f.close(); }
});

test('a new worker installing, activating and claiming an old tab produces one notice', () => {
  const f = fixture();
  try {
    f.start();
    const next = f.worker('installing');
    f.registration.installing = next; f.registration.dispatchEvent(new Event('updatefound'));
    assert.equal(f.notices, 0);
    next.state = 'installed'; next.dispatchEvent(new Event('statechange'));
    assert.equal(f.notices, 1);
    next.state = 'activated'; next.dispatchEvent(new Event('statechange'));
    f.container.controller = next; f.container.dispatchEvent(new Event('controllerchange'));
    assert.equal(f.notices, 1);
  } finally { f.close(); }
});

test('first installation is quiet, but a later update in that same window is detected', () => {
  const f = fixture(false);
  try {
    f.start();
    f.registration.installing = f.worker('installed'); f.registration.dispatchEvent(new Event('updatefound'));
    f.registration.installing.state = 'activated';
    f.container.controller = f.registration.installing; f.container.dispatchEvent(new Event('controllerchange'));
    assert.equal(f.notices, 0);
    f.registration.installing = f.worker('installing'); f.registration.dispatchEvent(new Event('updatefound'));
    assert.equal(f.notices, 0);
    f.registration.installing.state = 'installed'; f.registration.installing.dispatchEvent(new Event('statechange'));
    assert.equal(f.notices, 1);
  } finally { f.close(); }
});

test('an already waiting build is detected when subscriptions attach', () => {
  const f = fixture();
  try { f.registration.waiting = f.worker('installed'); f.start(); assert.equal(f.notices, 1); }
  finally { f.close(); }
});

test('a failed worker does not advertise an update and cleanup removes listeners', () => {
  const f = fixture();
  try {
    f.start();
    f.registration.installing = f.worker('redundant'); f.registration.dispatchEvent(new Event('updatefound'));
    assert.equal(f.notices, 0);
  } finally { f.close(); }
  f.container.controller = f.worker('activated'); f.container.dispatchEvent(new Event('controllerchange'));
  f.doc.dispatchEvent(new Event('visibilitychange'));
  assert.equal(f.notices, 0); assert.equal(f.checks, 0);
});

test('concurrent and failed update checks do not interrupt the app or block future checks', async () => {
  const f = fixture();
  try {
    let reject!: (reason: Error) => void;
    f.registration.update = () => new Promise((_, fail) => { reject = fail; });
    f.start();
    f.doc.dispatchEvent(new Event('visibilitychange'));
    const firstReject = reject;
    f.win.dispatchEvent(new Event('online'));
    assert.equal(reject, firstReject);
    reject(new Error('network unavailable')); await Promise.resolve(); await Promise.resolve();
    f.win.dispatchEvent(new Event('online'));
    assert.notEqual(reject, firstReject);
    reject(new Error('still offline')); await Promise.resolve();
    assert.equal(f.notices, 0);
  } finally { f.close(); }
});
