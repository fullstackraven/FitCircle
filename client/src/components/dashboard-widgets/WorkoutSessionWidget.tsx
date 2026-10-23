import { Play, Pause, Square, RotateCcw, StopCircle } from 'lucide-react';
import { DashboardWidget } from '@/hooks/use-dashboard-widgets';
import { useWorkoutDuration } from '@/hooks/use-workout-duration';

interface WorkoutSessionWidgetProps {
  widget: DashboardWidget;
}

export function WorkoutSessionWidget({ widget }: WorkoutSessionWidgetProps) {
  const {
    isActive: isWorkoutActive,
    isPaused: isWorkoutPaused,
    startWorkout,
    stopWorkout,
    resetWorkout,
    pauseWorkout,
    resumeWorkout,
    getCurrentSessionDuration
  } = useWorkoutDuration();

  if (widget.size === 'small') {
    return (
      <div className="fitcircle-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Play className="w-4 h-4 text-accent-text" />
            <h3 className="text-sm font-semibold text-strong">Workout Session</h3>
          </div>
          {isWorkoutActive && (
            <div className={`w-2 h-2 rounded-full ${isWorkoutPaused ? 'bg-yellow-400' : 'bg-green-400 animate-pulse'}`} />
          )}
        </div>
        
        {isWorkoutActive ? (
          <div className="space-y-2">
            <div className="text-center">
              <div className="text-strong type-metric text-lg">{getCurrentSessionDuration()}</div>
              <div className="text-muted-foreground text-xs">
                {isWorkoutPaused ? 'Paused' : 'Active'}
              </div>
            </div>
            <div className="flex justify-center space-x-2">
              <button
                onClick={isWorkoutPaused ? resumeWorkout : pauseWorkout}
                className="p-1 rounded bg-surface-secondary hover:bg-control-strong transition-colors"
              >
                {isWorkoutPaused ? <Play className="w-3 h-3 text-strong" /> : <Pause className="w-3 h-3 text-strong" />}
              </button>
              <button
                onClick={stopWorkout}
                className="p-1 rounded bg-surface-secondary hover:bg-control-strong transition-colors"
              >
                <Square className="w-3 h-3 text-strong" />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <button
              onClick={startWorkout}
              className="text-accent-text hover:text-accent-soft transition-colors text-sm font-medium"
            >
              Start Session
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
          <Play className="w-5 h-5 text-accent-text" />
          <h3 className="text-lg font-semibold text-strong">{widget.title}</h3>
        </div>
        {isWorkoutActive && (
          <div className={`w-3 h-3 rounded-full ${isWorkoutPaused ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
        )}
      </div>
      
      {!isWorkoutActive ? (
        <div className="text-center py-6">
          <button
            onClick={startWorkout}
            className="w-full flex items-center justify-center space-x-3 py-4 px-6 rounded-xl font-medium text-black transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #00ff41 0%, #00cc33 100%)',
              boxShadow: '0 0 10px rgba(0, 255, 65, 0.2)'
            }}
          >
            <Play className="w-5 h-5" />
            <span className="text-base whitespace-nowrap">Start Workout Session</span>
          </button>
          <p className="text-sm text-muted-foreground text-center mt-3">
            Start a Workout Session to track the duration of your workouts
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-surface-secondary rounded-xl py-4 px-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${isWorkoutPaused ? 'bg-yellow-400' : 'bg-green-400 animate-pulse'}`}></div>
              <span className="text-strong type-metric text-xl">{getCurrentSessionDuration()}</span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={stopWorkout}
                className="w-10 h-10 bg-red-500 hover:bg-red-600 text-on-action rounded-full flex items-center justify-center transition-colors"
                title="Stop workout"
              >
                <StopCircle className="w-5 h-5" />
              </button>
              <button
                onClick={isWorkoutPaused ? resumeWorkout : pauseWorkout}
                className="w-10 h-10 bg-blue-500 hover:bg-blue-600 text-on-action rounded-full flex items-center justify-center transition-colors"
                title={isWorkoutPaused ? "Resume workout" : "Pause workout"}
              >
                {isWorkoutPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </button>
              <button
                onClick={resetWorkout}
                className="w-10 h-10 bg-control-strong hover:bg-surface-secondary text-strong rounded-full flex items-center justify-center transition-colors"
                title="Reset without saving"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground text-center">Workout session in progress</p>
        </div>
      )}
    </div>
  );
}