import { useState } from 'react';
import { Settings, Eye, EyeOff, Move, RotateCcw, ChevronUp, ChevronDown } from 'lucide-react';
import { DashboardWidget, useDashboardWidgets } from '@/hooks/use-dashboard-widgets';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

interface WidgetSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WidgetSettings({ isOpen, onClose }: WidgetSettingsProps) {
  const { widgets, toggleWidget, reorderWidgets, resetToDefaults, getAvailableWidgets } = useDashboardWidgets();
  const [isDragMode, setIsDragMode] = useState(false);

  const availableWidgets = getAvailableWidgets();

  const handleReset = () => {
    if (confirm('Reset all widgets to default configuration? This will restore all default widgets and their positions.')) {
      resetToDefaults();
    }
  };

  const getSizeLabel = (size: 'small' | 'medium' | 'large') => {
    switch (size) {
      case 'small': return 'Small';
      case 'medium': return 'Medium';
      case 'large': return 'Large';
      default: return 'Medium';
    }
  };

  const moveWidget = (widgetId: string, direction: 'up' | 'down') => {
    const currentWidget = availableWidgets.find(w => w.id === widgetId);
    if (!currentWidget) return;

    const currentPosition = currentWidget.position;
    const newPosition = direction === 'up' ? currentPosition - 1 : currentPosition + 1;
    
    // Check bounds
    if (newPosition < 0 || newPosition >= availableWidgets.length) return;

    reorderWidgets(widgetId, newPosition);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl overflow-y-auto bg-surface border-separator text-strong rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Dashboard Widgets</span>
          </DialogTitle>
          <DialogDescription>
            Customize which widgets appear on your dashboard and their settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Control Buttons */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Button
                variant={isDragMode ? "default" : "outline"}
                size="sm"
                onClick={() => setIsDragMode(!isDragMode)}
                className="flex items-center space-x-2"
              >
                <Move className="w-4 h-4" />
                <span>{isDragMode ? 'Exit Reorder' : 'Reorder Widgets'}</span>
              </Button>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="flex items-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset to Defaults</span>
            </Button>
          </div>

          {/* Widget List */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-strong">Available Widgets</h3>
            <div className="space-y-2">
              {availableWidgets.map((widget) => (
                <div
                  key={widget.id}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                    widget.enabled
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-control bg-surface/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Switch
                      checked={widget.enabled}
                      onCheckedChange={() => toggleWidget(widget.id)}
                    />
                    <div>
                      <div className="text-strong font-medium">{widget.title}</div>
                      <div className="text-muted-foreground text-sm flex items-center space-x-2">
                        <span>Size: {getSizeLabel(widget.size)}</span>
                        <span>•</span>
                        <span>Position: {widget.position + 1}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {widget.enabled ? (
                      <Eye className="w-4 h-4 text-feature-blue" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    )}
                    
                    {/* Reorder Controls */}
                    <div className="flex flex-col">
                      <button
                        onClick={() => moveWidget(widget.id, 'up')}
                        disabled={widget.position === 0}
                        className="p-1 hover:bg-surface-secondary rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        <ChevronUp className="w-3 h-3 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => moveWidget(widget.id, 'down')}
                        disabled={widget.position === availableWidgets.length - 1}
                        className="p-1 hover:bg-surface-secondary rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Move down"
                      >
                        <ChevronDown className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="border border-control rounded-xl p-4 bg-surface/30">
            <h4 className="text-strong font-medium mb-2">Widget Types</h4>
            <div className="text-supporting text-sm space-y-1">
              <div><strong>Small:</strong> Compact view with key metrics</div>
              <div><strong>Medium:</strong> Balanced view with more details</div>
              <div><strong>Large:</strong> Full view with complete information</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}