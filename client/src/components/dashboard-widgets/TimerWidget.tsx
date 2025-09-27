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
    ? formatTime(getCurrentSessionDuration()) 
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
            <Timer className="w-4 h-4 text-green-400" />
            <h3 className="text-sm font-semibold text-white">Timer</h3>
          </div>
          {hasActiveTimer && (
            <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-yellow-400' : 'bg-green-400'}`} />
          )}
        </div>
        
        {hasActiveTimer ? (
          <div className="space-y-2">
            <div className="text-center">
              <div className="text-white font-mono text-lg">{displayTime}</div>
              <div className="text-slate-400 text-xs">
                {isWorkoutActive ? 'Workout Session' : 'Timer Running'}
              </div>
            </div>
            <div className="flex justify-center space-x-2">
              <button
                onClick={handlePauseResume}
                className="p-1 rounded bg-slate-700 hover:bg-slate-600 transition-colors"
              >
                {isPaused ? <Play className="w-3 h-3 text-white" /> : <Pause className="w-3 h-3 text-white" />}
              </button>
              <button
                onClick={handleStop}
                className="p-1 rounded bg-slate-700 hover:bg-slate-600 transition-colors"
              >
                <Square className="w-3 h-3 text-white" />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <button
              onClick={onOpenTimer}
              className="text-slate-400 hover:text-white transition-colors text-sm"
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
          <Timer className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-semibold text-white">{widget.title}</h3>
        </div>
        {hasActiveTimer && (
          <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
        )}
      </div>
      
      {hasActiveTimer ? (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-white font-mono text-3xl mb-1">{displayTime}</div>
            <div className="text-slate-400">
              {isWorkoutActive ? 'Workout Session Active' : 'Timer Running'}
            </div>
          </div>
          
          <div className="flex justify-center space-x-3">
            <button
              onClick={handlePauseResume}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </button>
            <button
              onClick={handleStop}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
            >
              <Square className="w-4 h-4" />
              <span>Stop</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-slate-400 mb-4">No active timer</div>
          <button
            onClick={onOpenTimer}
            className="flex items-center space-x-2 mx-auto px-4 py-2 bg-green-600 hover:bg-green-700 rounded-xl transition-colors"
          >
            <Play className="w-4 h-4" />
            <span>Start Timer</span>
          </button>
        </div>
      )}
    </div>
  );
}