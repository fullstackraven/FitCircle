import type { ReactNode } from 'react';
import { Check, X } from 'lucide-react';
import { WellnessGoalSheet } from './WellnessUI';
import { Button } from '@/components/ui/button';
import '@/styles/goal-editor.css';

/** Presentation only: callers retain their existing inputs, calculations and handlers. */
export function GoalEditor({ title, subtitle, onDismiss, onSave, saveLabel = 'Save Goal', children, summary }: {
  title: string; subtitle: string; onDismiss: () => void; onSave: () => void;
  saveLabel?: string; children: ReactNode; summary: ReactNode;
}) {
  return <WellnessGoalSheet className="goal-editor-shell" title={title} onDismiss={onDismiss}>
    <div className="goal-editor">
      <header className="goal-editor-header">
        <span className="goal-editor-handle" aria-hidden="true" />
        <h2>{title}</h2><p>{subtitle}</p>
        <button className="fc-pill fc-icon-button goal-editor-close" aria-label="Close" onClick={onDismiss}><X size={22} /></button>
      </header>
      {summary}
      <div className="goal-editor-fields">{children}</div>
      <footer className="goal-editor-footer">
        <Button className="goal-editor-save" onClick={onSave}><Check size={19} />{saveLabel}</Button>
        <Button variant="ghost" className="goal-editor-cancel" onClick={onDismiss}>Cancel</Button>
      </footer>
    </div>
  </WellnessGoalSheet>;
}
export function GoalSummary({ percentage, label, value, detail, average = false }: {
  percentage: number; label: string; value: ReactNode; detail: ReactNode; average?: boolean;
}) {
  // Same finite/clamped display rule as GoalCircle; caller percentages are unchanged.
  const safe = Number.isFinite(percentage) ? Math.max(0, Math.min(100, percentage)) : 0;
  const length = 2 * Math.PI * 44;
  return <section className="goal-editor-summary">
    <div className="goal-editor-ring" role="img" aria-label={`${Math.round(safe)}% ${average ? 'average' : 'complete'}`}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="44" fill="none" stroke="hsl(var(--progress-track))" strokeWidth="8" />
        <circle cx="50" cy="50" r="44" fill="none" stroke="hsl(var(--action-selected))" strokeWidth="8" strokeLinecap="round" strokeDasharray={length} strokeDashoffset={length - safe / 100 * length} transform="rotate(-90 50 50)" />
      </svg>
      <div><strong className="type-caption">{Math.round(safe)}%</strong><span>{average ? 'Average' : 'Complete'}</span></div>
    </div>
    <div className="goal-editor-summary-text"><p>{label}</p><strong>{value}</strong><span>{detail}</span></div>
  </section>;
}
export function GoalField({ id, label, unit, description, children }: {
  id: string; label: string; unit: string; description?: string; children: ReactNode;
}) {
  return <div className="goal-editor-field">
    <label htmlFor={id}>{label}</label>
    <div className="goal-editor-input-row">{children}<span aria-hidden="true">{unit}</span></div>
    {description && <p>{description}</p>}
  </div>;
}
