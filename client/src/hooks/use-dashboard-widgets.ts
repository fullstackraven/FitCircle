import { useState, useEffect } from 'react';
import { STORAGE_KEYS, safeParseJSON } from '@/lib/storage-utils';

export interface DashboardWidget {
  id: string;
  type: 'workout' | 'meditation' | 'hydration' | 'cardio' | 'fasting' | 'goals' | 'quote' | 'timer' | 'recent-activity';
  title: string;
  enabled: boolean;
  position: number;
  size: 'small' | 'medium' | 'large';
  config?: Record<string, any>;
}

const defaultWidgets: DashboardWidget[] = [
  {
    id: 'quote',
    type: 'quote',
    title: 'Quote of the Day',
    enabled: true,
    position: 0,
    size: 'medium'
  },
  {
    id: 'workout-progress',
    type: 'workout',
    title: "Today's Workouts",
    enabled: true,
    position: 1,
    size: 'large'
  },
  {
    id: 'timer',
    type: 'timer',
    title: 'Workout Timer',
    enabled: true,
    position: 2,
    size: 'medium'
  },
  {
    id: 'meditation-progress',
    type: 'meditation',
    title: 'Meditation Progress',
    enabled: true,
    position: 3,
    size: 'small'
  },
  {
    id: 'hydration-progress',
    type: 'hydration',
    title: 'Hydration Progress',
    enabled: true,
    position: 4,
    size: 'small'
  },
  {
    id: 'cardio-progress',
    type: 'cardio',
    title: 'Cardio Progress',
    enabled: true,
    position: 5,
    size: 'small'
  },
  {
    id: 'goals-summary',
    type: 'goals',
    title: 'Goals Overview',
    enabled: false,
    position: 6,
    size: 'medium'
  },
  {
    id: 'recent-activity',
    type: 'recent-activity',
    title: 'Recent Activity',
    enabled: false,
    position: 7,
    size: 'large'
  }
];

export function useDashboardWidgets() {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(() => 
    safeParseJSON(localStorage.getItem(STORAGE_KEYS.DASHBOARD_WIDGETS), defaultWidgets)
  );

  // Save to localStorage whenever widgets change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DASHBOARD_WIDGETS, JSON.stringify(widgets));
    } catch (error) {
      console.error('Failed to save dashboard widgets:', error);
    }
  }, [widgets]);

  const updateWidget = (id: string, updates: Partial<DashboardWidget>) => {
    setWidgets(prev => prev.map(widget => 
      widget.id === id ? { ...widget, ...updates } : widget
    ));
  };

  const toggleWidget = (id: string) => {
    setWidgets(prev => prev.map(widget => 
      widget.id === id ? { ...widget, enabled: !widget.enabled } : widget
    ));
  };

  const reorderWidgets = (widgetId: string, newPosition: number) => {
    setWidgets(prev => {
      const widget = prev.find(w => w.id === widgetId);
      if (!widget) return prev;

      const otherWidgets = prev.filter(w => w.id !== widgetId);
      
      // Update positions
      const updatedWidgets = otherWidgets.map(w => {
        if (w.position >= newPosition) {
          return { ...w, position: w.position + 1 };
        }
        return w;
      });

      return [...updatedWidgets, { ...widget, position: newPosition }]
        .sort((a, b) => a.position - b.position);
    });
  };

  const getEnabledWidgets = () => {
    return widgets
      .filter(widget => widget.enabled)
      .sort((a, b) => a.position - b.position);
  };

  const getAvailableWidgets = () => {
    return widgets.sort((a, b) => a.position - b.position);
  };

  const resetToDefaults = () => {
    setWidgets(defaultWidgets);
  };

  return {
    widgets,
    updateWidget,
    toggleWidget,
    reorderWidgets,
    getEnabledWidgets,
    getAvailableWidgets,
    resetToDefaults
  };
}