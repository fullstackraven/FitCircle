import { useTimer } from '@/hooks/use-timer';
import { useWorkoutDuration } from '@/hooks/use-workout-duration';
import { Timer, Play, Pause, Square } from 'lucide-react';
import { DashboardWidget } from '@/hooks/use-dashboard-widgets';

interface TimerWidgetProps {
  widget: DashboardWidget;
  onOpenTimer?: () => void;
}

export function TimerWidget({ widget, onOpenTimer }: TimerWidgetProps) {
  const { timerState, pauseTimer, resumeTimer, resetTimer, formatTime } = useTimer();
  const {
    isActive: isWorkoutActive,
    isPaused: isWorkoutPaused,
    pauseWorkout,
    resumeWorkout,
    stopWorkout,
    getCurrentSessionDuration
  } = useWorkoutDuration();

  // Determine which timer is active
  const hasActiveTimer = timerState.isRunning || isWorkoutActive;
  const isPaused = !timerState.isRunning || isWorkoutPaused;
  const displayTime = isWorkoutActive
    ? getCurrentSessionDuration()
    : formatTime(timerState.remainingTime);

  const handlePauseResume = () => {
    if (isWorkoutActive) {
      isWorkoutPaused ? resumeWorkout() : pauseWorkout();
    } else if (timerState.isRunning) {
      pauseTimer();
    } else {
      resumeTimer();
    }
  };

  const handleStop = () => {
    if (isWorkoutActive) {
      stopWorkout();
    } else if (timerState.isRunning) {
      resetTimer();
    }
  };

  if (widget.size === 'small') {
    return (
      <div className="fitcircle-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Timer className="w-4 h-4 text-accent-text" />
            <h3 className="text-sm font-semibold text-strong">Timer</h3>
          </div>
          {hasActiveTimer && (
            <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-yellow-400' : 'bg-green-400'}`} />
          )}
        </div>
        
        {hasActiveTimer ? (
          <div className="space-y-2">
            <div className="text-center">
              <div className="text-strong type-metric text-lg">{displayTime}</div>
              <div className="text-muted-foreground text-xs">
                {isWorkoutActive ? 'Workout Session' : 'Timer Running'}
              </div>
            </div>
            <div className="flex justify-center space-x-2">
              <button
                onClick={handlePauseResume}
                className="p-1 rounded bg-surface-secondary hover:bg-control-strong transition-colors"
              >
                {!timerState.isRunning ? <Play className="w-3 h-3 text-strong" /> : <Pause className="w-3 h-3 text-strong" />}
              </button>
              <button
                onClick={handleStop}
                className="p-1 rounded bg-surface-secondary hover:bg-control-strong transition-colors"
              >
                <Square className="w-3 h-3 text-strong" />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <button
              onClick={onOpenTimer}
              className="text-muted-foreground hover:text-strong transition-colors text-sm"
            >
              Start Timer
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fitcircle-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Timer className="w-5 h-5 text-accent-text" />
          <h3 className="text-lg font-semibold text-strong">{widget.title}</h3>
        </div>
        {hasActiveTimer && (
          <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
        )}
      </div>
      
      {hasActiveTimer ? (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-strong type-metric text-3xl mb-1">{displayTime}</div>
            <div className="text-muted-foreground">
              {isWorkoutActive ? 'Workout Session Active' : 'Timer Running'}
            </div>
          </div>
          
          <div className="flex justify-center space-x-3">
            <button
              onClick={handlePauseResume}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors text-on-action-soft"
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </button>
            <button
              onClick={handleStop}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-xl transition-colors text-on-action-soft"
            >
              <Square className="w-4 h-4" />
              <span>Stop</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-muted-foreground mb-4">No active timer</div>
          <button
            onClick={onOpenTimer}
            className="flex items-center space-x-2 mx-auto px-4 py-2 bg-action hover:bg-action-hover rounded-xl transition-colors text-on-action-soft"
          >
            <Play className="w-4 h-4" />
            <span>Start Timer</span>
          </button>
        </div>
      )}
    </div>
  );
}