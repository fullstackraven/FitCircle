import { useState } from 'react';
import { Button } from './ui/button';

interface DaySelectorProps {
  selectedDays: number[];
  onSelectionChange: (selectedDays: number[]) => void;
  className?: string;
  compact?: boolean;
  variant?: "default" | "sheet";
  heading?: string;
}

const DAYS = [
  { index: 0, short: 'Sun', full: 'Sunday' },
  { index: 1, short: 'Mon', full: 'Monday' },
  { index: 2, short: 'Tue', full: 'Tuesday' },
  { index: 3, short: 'Wed', full: 'Wednesday' },
  { index: 4, short: 'Thu', full: 'Thursday' },
  { index: 5, short: 'Fri', full: 'Friday' },
  { index: 6, short: 'Sat', full: 'Saturday' },
];

export function DaySelector({ selectedDays, onSelectionChange, className, compact = false, variant = "default", heading = "Schedule" }: DaySelectorProps) {
  const editor = variant === "sheet";
  compact = compact || editor;
  const toggleDay = (dayIndex: number) => {
    if (selectedDays.includes(dayIndex)) {
      onSelectionChange(selectedDays.filter(d => d !== dayIndex));
    } else {
      onSelectionChange([...selectedDays, dayIndex].sort());
    }
  };

  const selectAllDays = () => {
    onSelectionChange([0, 1, 2, 3, 4, 5, 6]);
  };

  const clearAllDays = () => {
    onSelectionChange([]);
  };

  const isEveryDay = selectedDays.length === 7;
  const isWeekdays = selectedDays.length === 5 && selectedDays.every(d => d >= 1 && d <= 5);
  const isWeekends = selectedDays.length === 2 && selectedDays.includes(0) && selectedDays.includes(6);

  return (
    <div className={`${className || ""} ${editor ? "editor-days" : ""}`}>
      <div className={compact ? "mb-1" : "mb-3"}>
        <div className={compact ? "flex items-center justify-between" : ""}>
        <label className={compact ? "block text-xs leading-4 font-medium text-strong" : "block text-sm font-medium text-strong mb-2"}>
          {editor ? heading : "Scheduled Days"}
        </label>
        {compact && <Button type="button" variant="ghost" disabled={!selectedDays.length} onClick={clearAllDays}
          aria-label="Clear Selection" className="h-5 px-1 py-0 text-xs text-muted-foreground">Clear</Button>}
        </div>
        {!compact && <p className="text-xs text-muted-foreground mb-3">
          {selectedDays.length === 0 
            ? "Select days to perform this workout" 
            : isEveryDay 
            ? "Every day"
            : isWeekdays
            ? "Weekdays only"
            : isWeekends
            ? "Weekends only"
            : `${selectedDays.length} day${selectedDays.length === 1 ? '' : 's'} selected`
          }
        </p>}
      </div>

      <div className={compact ? "grid grid-cols-7 gap-1 mb-1" : "grid grid-cols-7 gap-2 mb-3"}>
        {DAYS.map((day) => (
          <Button
            key={day.index}
            type="button"
            variant={selectedDays.includes(day.index) ? "default" : "outline"}
            size="sm"
            onClick={() => toggleDay(day.index)}
            aria-pressed={selectedDays.includes(day.index)}
            aria-label={editor ? day.full : undefined}
            className={`${editor ? "editor-day" : ""} ${compact ? "h-8 min-w-0 px-0" : "h-10"} text-xs font-medium transition-all ${
              selectedDays.includes(day.index)
                ? 'bg-action-selected hover:bg-action text-on-action border-action-selected'
                : 'bg-surface-secondary hover:bg-control-strong text-supporting border-control'
            }`}
            title={day.full}
          >
            {editor ? day.short[0] : day.short}
          </Button>
        ))}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline" 
          size="sm"
          onClick={selectAllDays}
          disabled={isEveryDay}
          className={`${compact ? "h-7 px-2" : ""} flex-1 text-xs bg-surface-secondary hover:bg-control-strong text-supporting border-control`}
        >
          {editor ? "Every day" : "Every Day"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm" 
          onClick={() => onSelectionChange([1, 2, 3, 4, 5])}
          disabled={isWeekdays}
          className={`${compact ? "h-7 px-2" : ""} flex-1 text-xs bg-surface-secondary hover:bg-control-strong text-supporting border-control`}
        >
          Weekdays
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onSelectionChange([0, 6])}
          disabled={isWeekends}
          className={`${compact ? "h-7 px-2" : ""} flex-1 text-xs bg-surface-secondary hover:bg-control-strong text-supporting border-control`}
        >
          Weekends
        </Button>
      </div>

      {!compact && selectedDays.length > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearAllDays}
          className="w-full mt-2 text-xs text-muted-foreground hover:text-strong hover:bg-surface-secondary"
        >
          Clear Selection
        </Button>
      )}
    </div>
  );
}
