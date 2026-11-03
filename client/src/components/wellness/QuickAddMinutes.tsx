import { useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { WellnessTodaySection } from './WellnessUI';

export function QuickAddMinutes({ presets, onAdd }: { presets: number[]; onAdd: (minutes: number) => boolean | void }) {
  const [custom, setCustom] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const submit = (minutes: number) => {
    if (locked.current) return;
    if (!Number.isFinite(minutes) || minutes <= 0) {
      setError('Enter a valid positive duration in minutes.');
      return;
    }
    locked.current = true;
    setBusy(true);
    try {
      if (onAdd(minutes) !== false) { setCustom(''); setError(''); }
      else setError('Unable to save this session. Please try again.');
    } finally {
      window.setTimeout(() => { locked.current = false; setBusy(false); }, 400);
    }
  };
  return <WellnessTodaySection title="Quick add">
    <div className="wellness-quick-add">
      {presets.map(minutes => <button key={minutes} className="fc-pill" disabled={busy} onClick={() => submit(minutes)}>+{minutes} min</button>)}
    </div>
    <form className="flex gap-2 mt-3 min-w-0" onSubmit={event => { event.preventDefault(); submit(Number(custom)); }} noValidate>
      <Input type="number" min="0" step="any" inputMode="decimal" aria-label="Custom duration (minutes)" placeholder="Custom duration (min)" value={custom} onChange={event => setCustom(event.target.value)} aria-invalid={Boolean(error)} className="min-w-0 flex-1" />
      <Button type="submit" disabled={busy}>Add</Button>
    </form>
    {error && <p role="alert" className="mt-2 text-sm text-warning-soft">{error}</p>}
  </WellnessTodaySection>;
}
