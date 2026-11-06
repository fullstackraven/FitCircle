import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { GripVertical } from 'lucide-react';

export function reorderItems<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** Handle-only Pointer Events work with mouse, pen and iOS touch without HTML drag APIs. */
export function SortableExercises<T extends { id: string }>({ items, name, onReorder, children, rowClassName = '', testId, onActivate }: {
  items: T[]; name: (item: T) => string; onReorder: (items: T[]) => void;
  children: (item: T) => ReactNode; rowClassName?: string; testId?: (item: T) => string; onActivate?: (item: T) => void;
}) {
  const instruction = useId();
  const root = useRef<HTMLDivElement>(null);
  const session = useRef<{ id: string; pointer: number; start: number; y: number; from: number; to: number; active: boolean; scroll: number }>();
  const latest = useRef({ items, onReorder }); latest.current = { items, onReorder };
  const [drag, setDrag] = useState<{ id: string; to: number; before?: string; offset: number }>();
  const [announcement, announce] = useState('');
  const frame = useRef<number>();
  const scroller = () => root.current?.closest('main');
  const update = () => {
    const s = session.current; if (!s?.active || !root.current) return;
    const rows = Array.from(root.current.querySelectorAll<HTMLElement>(':scope > [data-sortable-row]'));
    const others = rows.filter(row => row.dataset.sortableRow !== s.id);
    s.to = others.filter(row => s.y > row.getBoundingClientRect().top + row.offsetHeight / 2).length;
    setDrag({ id: s.id, to: s.to, before: others[s.to]?.dataset.sortableRow, offset: s.y - s.start + (scroller()?.scrollTop ?? 0) - s.scroll });
  };
  const stop = (commit: boolean) => {
    const s = session.current; session.current = undefined;
    if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    frame.current = undefined; setDrag(undefined);
    if (commit && s?.active && s.from !== s.to) {
      const current = latest.current;
      const from = current.items.findIndex(item => item.id === s.id);
      if (from < 0) return;
      current.onReorder(reorderItems(current.items, from, s.to));
      root.current?.dispatchEvent(new Event('input', { bubbles: true }));
      announce(`${name(current.items[from])} moved to position ${s.to + 1} of ${current.items.length}`);
    }
  };
  useEffect(() => {
    const cancel = (event: KeyboardEvent) => { if (event.key === 'Escape' && session.current) { event.preventDefault(); stop(false); } };
    document.addEventListener('keydown', cancel);
    return () => { document.removeEventListener('keydown', cancel); if (frame.current !== undefined) cancelAnimationFrame(frame.current); };
  }, []);
  const autoScroll = () => {
    const s = session.current; const main = scroller();
    if (!s?.active) return;
    if (main) {
      const rect = main.getBoundingClientRect();
      const top = Math.max(rect.top, 110), bottom = Math.min(rect.bottom, innerHeight - 100);
      const delta = s.y < top + 40 ? -7 : s.y > bottom - 40 ? 7 : 0;
      if (delta) { main.scrollTop += delta; update(); }
    }
    frame.current = requestAnimationFrame(autoScroll);
  };
  return <div ref={root} className="space-y-2">
    <p id={instruction} className="sr-only">Drag the handle to reorder. With the handle focused, use Arrow Up or Arrow Down to move an exercise. Escape cancels a drag.</p>
    <span className="sr-only" role="status" aria-live="polite">{announcement}</span>
    {items.map((item, index) => <div key={item.id} onClick={event => { if (!session.current?.active && !(event.target as Element).closest('button')) onActivate?.(item); }} data-sortable-row={item.id} data-testid={testId?.(item)}
      className={`relative flex min-w-0 items-center gap-2 rounded-xl ${rowClassName} ${drag?.id === item.id ? 'z-10 opacity-80 shadow-lg ring-2 ring-accent-text' : ''}`}
      style={{ transform: drag?.id === item.id ? `translateY(${drag.offset}px)` : undefined,
        boxShadow: drag && drag.before === item.id ? '0 -3px 0 hsl(var(--accent-text))' : drag && !drag.before && index === items.length - 1 && drag.id !== item.id ? '0 3px 0 hsl(var(--accent-text))' : undefined }}>
      <button type="button" className="fc-pill flex min-h-11 min-w-11 shrink-0 items-center justify-center text-muted-foreground cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }} data-reorder-handle
        aria-label={`Reorder ${name(item)}`} aria-describedby={instruction} onClick={e => { e.preventDefault(); e.stopPropagation(); }}
        onContextMenu={e => e.preventDefault()}
        onKeyDown={e => {
          if (e.key === 'Escape') { stop(false); return; }
          const to = e.key === 'ArrowUp' ? index - 1 : e.key === 'ArrowDown' ? index + 1 : index;
          if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
          e.preventDefault(); e.stopPropagation();
          if (to < 0 || to >= items.length) return;
          onReorder(reorderItems(items, index, to));
          e.currentTarget.dispatchEvent(new Event('input', { bubbles: true }));
          announce(`${name(item)} moved to position ${to + 1} of ${items.length}`);
        }}
        onPointerDown={e => {
          if (e.button !== 0 || session.current) return;
          e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId);
          session.current = { id: item.id, pointer: e.pointerId, start: e.clientY, y: e.clientY, from: index, to: index, active: false, scroll: scroller()?.scrollTop ?? 0 };
        }}
        onPointerMove={e => {
          const s = session.current; if (!s || s.pointer !== e.pointerId) return;
          s.y = e.clientY;
          if (!s.active && Math.abs(s.y - s.start) > 6) { s.active = true; frame.current = requestAnimationFrame(autoScroll); }
          if (s.active) { e.preventDefault(); update(); }
        }} onPointerUp={e => { if (session.current?.pointer === e.pointerId) { e.stopPropagation(); stop(true); } }}
        onPointerCancel={() => stop(false)} onLostPointerCapture={() => stop(false)}><GripVertical size={18} aria-hidden="true"/></button>
      {children(item)}
    </div>)}
  </div>;
}
