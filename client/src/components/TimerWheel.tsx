import { useId, useLayoutEffect, useRef } from 'react';

const ROW_HEIGHT = 44;

export function TimerWheel({ label, unit, max, value, onChange }: {
  label: string;
  unit: string;
  max: number;
  value: number;
  onChange: (value: number) => void;
}) {
  const wheel = useRef<HTMLDivElement>(null);
  const id = useId();

  useLayoutEffect(() => {
    const element = wheel.current;
    if (element && Math.round(element.scrollTop / ROW_HEIGHT) !== value) {
      element.scrollTop = value * ROW_HEIGHT;
    }
  }, [value]);

  const select = (next: number) => {
    const selected = Math.min(max, Math.max(0, next));
    wheel.current?.scrollTo({ top: selected * ROW_HEIGHT, behavior: 'instant' });
    wheel.current?.focus({ preventScroll: true });
    onChange(selected);
  };

  return (
    <div
      ref={wheel}
      role="listbox"
      aria-label={label}
      aria-orientation="vertical"
      aria-activedescendant={`${id}-${value}`}
      tabIndex={0}
      className="timer-wheel"
      onScroll={event => {
        const selected = Math.min(max, Math.max(0, Math.round(event.currentTarget.scrollTop / ROW_HEIGHT)));
        if (selected !== value) onChange(selected);
      }}
      onKeyDown={event => {
        const next = event.key === 'ArrowDown' ? value + 1
          : event.key === 'ArrowUp' ? value - 1
          : event.key === 'Home' ? 0
          : event.key === 'End' ? max
          : event.key === 'PageDown' ? value + 5
          : event.key === 'PageUp' ? value - 5 : undefined;
        if (next !== undefined) { event.preventDefault(); select(next); }
      }}
    >
      {Array.from({ length: max + 1 }, (_, number) => (
        <div
          key={number}
          id={`${id}-${number}`}
          role="option"
          aria-selected={number === value}
          aria-label={`${number} ${label.toLowerCase()}`}
          onClick={() => select(number)}
          className={`timer-wheel-option ${number === value ? 'text-white' : 'text-slate-500'}`}
        >
          <span className="type-metric text-2xl">{number}</span>
          <span className={`text-sm font-medium ${number === value ? '' : 'invisible'}`} aria-hidden="true">{unit}</span>
        </div>
      ))}
    </div>
  );
}
