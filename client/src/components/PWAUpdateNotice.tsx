import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { hasPWAUpdate, PWA_UPDATE_EVENT } from '@/lib/pwa';

/** Updating stays deliberate, so workouts and unsaved forms are uninterrupted. */
export function PWAUpdateNotice() {
  const [available, setAvailable] = useState(hasPWAUpdate);
  useEffect(() => {
    const show = () => setAvailable(true);
    window.addEventListener(PWA_UPDATE_EVENT, show);
    if (hasPWAUpdate()) show();
    return () => window.removeEventListener(PWA_UPDATE_EVENT, show);
  }, []);
  if (!available) return null;
  return <aside role="status" className="mx-4 mt-3 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground">
    FitCircle update available.{' '}
    <Link href="/display" className="font-semibold underline underline-offset-2 focus-visible:outline focus-visible:outline-2">Open Display to refresh</Link>
    <p className="mt-1 text-xs text-muted-foreground">Save your current work before refreshing.</p>
  </aside>;
}
