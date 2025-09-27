import { DashboardWidget } from '@/hooks/use-dashboard-widgets';
import { WorkoutWidget } from './WorkoutWidget';
import { WorkoutSessionWidget } from './WorkoutSessionWidget';
import { MeditationWidget } from './MeditationWidget';
import { HydrationWidget } from './HydrationWidget';
import { CardioWidget } from './CardioWidget';
import { TimerWidget } from './TimerWidget';
import { QuoteWidget } from './QuoteWidget';

interface WidgetRendererProps {
  widget: DashboardWidget;
  onWorkoutClick?: (workoutId: string) => void;
  onNavigate?: (path: string) => void;
  onOpenTimer?: () => void;
}

export function WidgetRenderer({ widget, onWorkoutClick, onNavigate, onOpenTimer }: WidgetRendererProps) {
  const getWidgetClassName = (size: 'small' | 'medium' | 'large') => {
    switch (size) {
      case 'small':
        return 'col-span-1';
      case 'medium':
        return 'col-span-1 md:col-span-2';
      case 'large':
        return 'col-span-1 md:col-span-2 lg:col-span-3';
      default:
        return 'col-span-1';
    }
  };

  const renderWidget = () => {
    switch (widget.type) {
      case 'workout':
        return <WorkoutWidget widget={widget} onWorkoutClick={onWorkoutClick} />;
      case 'workout-session':
        return <WorkoutSessionWidget widget={widget} />;
      case 'meditation':
        return <MeditationWidget widget={widget} onClick={() => onNavigate?.('/meditation')} />;
      case 'hydration':
        return <HydrationWidget widget={widget} onClick={() => onNavigate?.('/hydration')} />;
      case 'cardio':
        return <CardioWidget widget={widget} onClick={() => onNavigate?.('/cardio')} />;
      case 'timer':
        return <TimerWidget widget={widget} onOpenTimer={onOpenTimer} />;
      case 'quote':
        return <QuoteWidget widget={widget} />;
      case 'goals':
        // TODO: Create GoalsWidget component
        return <div className="fitcircle-card p-4"><p className="text-slate-400">Goals widget coming soon</p></div>;
      case 'recent-activity':
        // TODO: Create RecentActivityWidget component  
        return <div className="fitcircle-card p-4"><p className="text-slate-400">Recent activity widget coming soon</p></div>;
      default:
        return null;
    }
  };

  return (
    <div className={getWidgetClassName(widget.size)}>
      {renderWidget()}
    </div>
  );
}