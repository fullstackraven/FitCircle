import React from 'react';
import { Home, CalendarDays, Dumbbell, CheckSquare, Folder } from 'lucide-react';

// Pure presentation shared with the data-free, statically rendered iOS test.
export const dockItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/calendar', icon: CalendarDays, label: 'Calendar' },
  { path: '/routines', icon: Dumbbell, label: 'Routines' },
  { path: '/wellness', icon: Folder, label: 'Logs' },
  { path: '/reminders', icon: CheckSquare, label: 'Reminders' },
];

export function DockNavigation({ location, navigate }: { location: string; navigate?: (path: string) => void }) {
  return (
    <div className="dock-wrap">
      <nav aria-label="Bottom navigation" className="dock-nav glass-nav">
        <div className="dock-items">
          {dockItems.map(({ path, icon: Icon, label }) => (
            <button key={path} className="dock-tab" aria-current={location === path ? 'page' : undefined} onClick={() => navigate?.(path)}>
              <Icon aria-hidden="true" />
              <span className="type-caption">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
