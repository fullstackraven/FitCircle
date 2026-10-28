import type { ButtonHTMLAttributes, CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Owns geometry only. Pages retain their existing navigation and state. */
export function PageHeader({ title, onBack, backLabel = 'Back', backProps, actions, sideWidth = 44, align = 'center', className }: {
  title: string;
  onBack: () => void;
  backLabel?: string;
  backProps?: ButtonHTMLAttributes<HTMLButtonElement> & { 'data-testid'?: string };
  actions?: ReactNode;
  sideWidth?: number;
  align?: 'center' | 'start';
  className?: string;
}) {
  return <div className={cn('fc-page-header', align === 'start' && 'fc-page-header-start', className)} style={{ '--header-side': `${sideWidth}px` } as CSSProperties}>
    <button type="button" title={backLabel} {...backProps} onClick={onBack} aria-label={backLabel} className={cn('fc-icon-action', backProps?.className)}><ArrowLeft size={20} aria-hidden="true" /></button>
    <h1 className="fc-page-title">{title}</h1>
    {actions ? <div className="fc-header-actions">{actions}</div> : <span aria-hidden="true" />}
  </div>;
}

/** Controlled selection: deliberately no date calculations or persistence. */
export function PeriodSelector<T extends string | number>({ label, options, value, onChange, className }: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return <div role="group" aria-label={label} className={cn('fc-period', className)}>
    {options.map(option => <button type="button" key={option.value} aria-pressed={value === option.value} onClick={() => onChange(option.value)}>{option.label}</button>)}
  </div>;
}

export function MetricTile({ value, label, valueClassName, valueTestId, className }: {
  value: ReactNode; label: string; valueClassName?: string; valueTestId?: string; className?: string;
}) {
  return <div className={cn('fc-metric', className)}><strong className={cn('type-metric', valueClassName)} data-testid={valueTestId}>{value}</strong><span>{label}</span></div>;
}

export function EmptyState({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('fc-empty', className)} {...props} />;
}
