import QuoteOfTheDay from '@/components/QuoteOfTheDay';
import { DashboardWidget } from '@/hooks/use-dashboard-widgets';

interface QuoteWidgetProps {
  widget: DashboardWidget;
}

export function QuoteWidget({ widget }: QuoteWidgetProps) {
  if (widget.size === 'small') {
    return (
      <div className="fitcircle-card">
        <h3 className="text-sm font-semibold text-white mb-3">Daily Quote</h3>
        <div className="text-slate-300 text-xs leading-relaxed">
          <QuoteOfTheDay />
        </div>
      </div>
    );
  }

  return (
    <div className="fitcircle-card">
      <h3 className="text-lg font-semibold text-white mb-4">{widget.title}</h3>
      <QuoteOfTheDay />
    </div>
  );
}