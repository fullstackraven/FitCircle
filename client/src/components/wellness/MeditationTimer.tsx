import { useEffect, useRef, useState } from 'react';
import { TimerWheel } from '@/components/TimerWheel';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export function MeditationTimer({ onClose, onComplete }: { onClose: () => void; onComplete: (minutes: number) => boolean }) {
  const [minutes, setMinutes] = useState(10);
  const [seconds, setSeconds] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [status, setStatus] = useState<'setup' | 'running' | 'paused' | 'complete'>('setup');
  const [error, setError] = useState('');
  const duration = useRef(0);
  const deadline = useRef(0);
  const recorded = useRef(false);
  const complete = useRef(onComplete);
  complete.current = onComplete;
  useEffect(() => {
    if (status !== 'running') return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0 && !recorded.current) {
        recorded.current = true;
        setStatus('complete');
        if (!complete.current(duration.current / 60)) setError('Unable to save the completed session.');
      }
    };
    const interval = window.setInterval(tick, 250);
    tick();
    return () => window.clearInterval(interval);
  }, [status]);
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent staticBody fixedFooter className="timer-dialog bg-canvas text-strong border-separator max-w-sm rounded-2xl p-4 gap-4">
      <DialogHeader className="text-left sm:text-left pr-10">
        <DialogTitle className="text-2xl font-bold">Meditation Timer</DialogTitle>
        <DialogDescription>{status === 'setup' ? 'Choose your meditation duration.' : status === 'complete' ? 'Session complete' : 'Take a moment to breathe.'}</DialogDescription>
      </DialogHeader>
      {status === 'setup' ? <div className="timer-picker" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
        <div className="timer-picker-selection" aria-hidden="true" />
        <TimerWheel label="Minutes" unit="min" max={180} value={minutes} onChange={setMinutes} />
        <TimerWheel label="Seconds" unit="sec" max={59} value={seconds} onChange={setSeconds} />
      </div> : <div className="relative mx-auto w-56 h-56 flex items-center justify-center">
        <svg viewBox="0 0 240 240" className="absolute inset-0 w-full h-full -rotate-90" aria-hidden="true">
          <circle cx="120" cy="120" r="104" stroke="var(--meditation-track)" strokeWidth="16" fill="none" />
          <circle cx="120" cy="120" r="104" stroke="var(--wellness-purple)" strokeWidth="16" fill="none" strokeLinecap="round" strokeDasharray={2 * Math.PI * 104} strokeDashoffset={2 * Math.PI * 104 * remaining / (duration.current || 1)} />
        </svg>
        <div className="text-center"><div role="timer" className="type-metric text-4xl font-bold">{Math.floor(remaining / 60).toString().padStart(2, '0')}:{(remaining % 60).toString().padStart(2, '0')}</div><p className="text-sm text-muted-foreground">{status === 'paused' ? 'Paused' : status === 'complete' ? 'Complete' : 'Meditating…'}</p></div>
      </div>}
      {error && <p role="alert" className="text-warning-soft text-sm">{error}</p>}
      <DialogFooter className="flex-row justify-between sm:justify-between gap-2">
        <Button variant="outline" onClick={onClose}>{status === 'setup' ? 'Cancel' : status === 'complete' ? 'Done' : 'Stop'}</Button>
        {status === 'setup' && <Button disabled={minutes * 60 + seconds <= 0} onClick={() => {
          duration.current = minutes * 60 + seconds;
          recorded.current = false;
          setRemaining(duration.current);
          deadline.current = Date.now() + duration.current * 1000;
          setStatus('running');
        }}>Start</Button>}
        {status === 'running' && <Button onClick={() => { setRemaining(Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000))); setStatus('paused'); }}>Pause</Button>}
        {status === 'paused' && <Button onClick={() => { deadline.current = Date.now() + remaining * 1000; setStatus('running'); }}>Resume</Button>}
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
