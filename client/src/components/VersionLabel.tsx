import { useRef } from 'react';
import { useApplicationVersion } from '@/lib/build-info';
import {appVersionLabel} from '@/lib/application-version';

// Explicit developer gesture; no diagnostics import, listeners or storage in
// ordinary usage. Close the sheet before measuring the normal app viewport.
async function openDiagnostics() {
  const root = document.documentElement;
  if (root.dataset.overlayOpen) {
    await new Promise<void>((resolve, reject) => {
      const observer = new MutationObserver(() => {
        if (!root.dataset.overlayOpen) {
          clearTimeout(timeout); observer.disconnect(); resolve();
        }
      });
      const timeout = window.setTimeout(() => {
        observer.disconnect(); reject(new Error('Close the open overlay and try again.'));
      }, 5000);
      observer.observe(root, { attributes: true, attributeFilter: ['data-overlay-open'] });
    });
  }
  const modulePath = `${import.meta.env.BASE_URL}layout-diagnostics.js`;
  const tools = await import(/* @vite-ignore */ modulePath);
  tools.startViewportDiagnostics({ expanded: true });
}

export function VersionLabel({ onActivate }: { onActivate: () => void }) {
  const build = useApplicationVersion();
  const taps = useRef({ count: 0, last: 0 });
  return <button type="button" className="text-dim text-xs text-center block w-full py-4 -my-4" onClick={() => {
    const now = performance.now();
    taps.current.count = now - taps.current.last <= 1500 ? taps.current.count + 1 : 1;
    taps.current.last = now;
    if (taps.current.count === 5) {
      taps.current.count = 0;
      onActivate();
      void openDiagnostics().catch(() => window.alert('Diagnostics could not open. Reconnect, close other dialogs and try again. Your data has not changed.'));
    }
  }}>Version {appVersionLabel(build)}</button>;
}
