import { Component, useState, type ReactNode } from 'react';
import { StoredWorkoutDataError } from '@/lib/workout-initialization';
import { STORAGE_KEYS } from '@/lib/storage-utils';

function WorkoutDataRecovery({ error }: { error: StoredWorkoutDataError }) {
  const [status, setStatus] = useState('');
  const downloadOriginal = () => {
    if (error.raw === null) return;
    let url: string | undefined;
    let link: HTMLAnchorElement | undefined;
    try {
      // Existing legacy raw-string JSON representation preserves even incomplete
      // JSON and escaped Unicode. This is a recovery copy, not a valid full backup.
      const blob = new Blob([JSON.stringify({ [STORAGE_KEYS.WORKOUTS]: error.raw }, null, 2)], { type: 'application/json' });
      url = URL.createObjectURL(blob);
      link = document.createElement('a');
      link.tabIndex = -1;
      link.href = url; link.download = 'fitcircle-original-workout-data.json';
      document.body.appendChild(link); link.click();
      setStatus('Download requested. If a preview opens, use Share → Save to Files. Confirm the file was saved before restoring.');
    } catch {
      setStatus('The download could not start. Your stored data has not been changed. Try again or retry loading.');
    } finally {
      // Safari/PWA handoff can read the blob asynchronously after click returns.
      // Keep both resources briefly; the web page cannot observe Files saving.
      const pendingUrl = url;
      const pendingLink = link;
      if (pendingUrl) window.setTimeout(() => {
        pendingLink?.remove();
        URL.revokeObjectURL(pendingUrl);
      }, 60_000);
      else pendingLink?.remove();
    }
  };
  return (
    <section className="min-h-dvh bg-slate-900 text-slate-100 px-6 py-8" style={{ paddingTop: 'max(2rem, env(safe-area-inset-top))', paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
      <div className="max-w-xl mx-auto space-y-5">
        <h1 className="text-2xl font-semibold">Your saved workouts need attention</h1>
        <p role="alert">{error.reason === 'unavailable'
          ? 'FitCircle cannot read browser storage right now. It has not started an empty workout store.'
          : 'FitCircle could not read or validate your saved workout records. It has left the original stored data unchanged and stopped loading this view to protect it.'}</p>
        <p>Keep an original-data recovery copy before attempting repairs. This copy is not a validated complete backup and may need manual repair. Do not clear website data or uninstall the app.</p>
        <button type="button" className="block rounded-xl bg-slate-700 px-4 py-3 disabled:opacity-50" disabled={error.raw === null} onClick={downloadOriginal}>Download original stored data</button>
        {error.raw === null && <p>The original data could not be read, so a recovery download is unavailable. Check browser storage access and retry.</p>}
        <button type="button" className="block rounded-xl bg-slate-700 px-4 py-3" onClick={() => window.location.reload()}>Retry loading</button>
        <a className="inline-block rounded-xl bg-blue-600 px-4 py-3" href={`${import.meta.env.BASE_URL}settings`}>Open Settings to restore a backup</a>
        <p>Settings can restore an existing verified JSON backup using the usual confirmation. Matching records will be replaced only if you choose to restore. If this screen returns after an older backup is imported, workout tracking has not resumed: required workout collections may still be missing. FitCircle does not fill them automatically. Keep the imported data’s recovery copy before trying another verified backup.</p>
        <p role="status">{status}</p>
      </div>
    </section>
  );
}

export class WorkoutDataBoundary extends Component<{ children: ReactNode }, { error: StoredWorkoutDataError | null }> {
  state: { error: StoredWorkoutDataError | null } = { error: null };
  static getDerivedStateFromError(error: unknown) {
    if (!(error instanceof StoredWorkoutDataError)) throw error;
    return { error };
  }
  render() {
    return this.state.error ? <WorkoutDataRecovery error={this.state.error} /> : this.props.children;
  }
}
