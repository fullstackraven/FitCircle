import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, Pause, Square, Target, X, Plus } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { GoalCircle } from '@/components/GoalCircle';
import { useMeditation, type MeditationLog } from '@/hooks/use-meditation';
import { useGoals } from '@/hooks/use-goals';
import { 
  calculateMeditation7DayAverage, 
  calculateMeditationProgress, 
  getMeditationGoal, 
  setMeditationGoal 
} from '@/utils/meditation-calc';
import { groupLogsByMonth } from '@/lib/date-utils';

export default function MeditationPage() {
  const [, navigate] = useLocation();
  
  // Check if we came from dashboard
  const fromDashboard = new URLSearchParams(window.location.search).get('from') === 'dashboard';
  
  const handleBack = () => {
    if (fromDashboard) {
      sessionStorage.setItem('fitcircle_dashboard_open', 'true');
      navigate('/');
    } else {
      navigate('/');
    }
  };
  const { logs, addLog, getTodayMinutes, getDailyGoal, getProgressPercentage, isGoalReached, getLast7DaysProgress, getAllTimeGoalPercentage } = useMeditation();
  const { goals, updateGoal } = useGoals();
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [totalDuration, setTotalDuration] = useState(0); // in seconds
  const [inputMinutes, setInputMinutes] = useState('');
  const [showCompletion, setShowCompletion] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Goal state
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isMeditationDialogOpen, setIsMeditationDialogOpen] = useState(false);
  const [goalMinutesInput, setGoalMinutesInput] = useState('');
  const [inputMinutesFocused, setInputMinutesFocused] = useState(false);
  const [goalMinutesFocused, setGoalMinutesFocused] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Initialize goal input with current goal value from shared utility
    setGoalMinutesInput(getMeditationGoal().toString());
  }, []);
  
  // Group logs by month for display
  const monthlyLogs = groupLogsByMonth(logs);
  
  // Listen for goal changes from other pages
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'fitcircle_goal_meditation') {
        setGoalMinutesInput(getMeditationGoal().toString());
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (isActive && !isPaused && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Session completed
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isPaused, timeLeft]);



  const playGongSound = async () => {
    try {
      // Create audio context - iOS requires user interaction first
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume context if suspended (iOS requirement)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      // Create multiple oscillators for richer gong sound
      const oscillators = [
        { freq: 196, gain: 0.3 }, // G3
        { freq: 220, gain: 0.2 }, // A3
        { freq: 294, gain: 0.1 }, // D4
      ];
      
      const masterGain = audioContext.createGain();
      masterGain.connect(audioContext.destination);
      
      oscillators.forEach(({ freq, gain }) => {
        const osc = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(masterGain);
        
        osc.frequency.setValueAtTime(freq, audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.8, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(gain, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 3);
        
        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 3);
      });
      
      // Set master volume
      masterGain.gain.setValueAtTime(0.5, audioContext.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 3);
      
    } catch (error) {
      console.log('Could not play gong sound:', error);
      // Fallback: try system beep or vibration
      try {
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200, 100, 200]);
        }
      } catch (vibrateError) {
        console.log('Vibration also not available');
      }
    }
  };

  const handleSessionComplete = () => {
    setIsActive(false);
    setIsPaused(false);
    
    // Play completion sound
    playGongSound();
    
    // Show completion message
    setShowCompletion(true);
    setTimeout(() => setShowCompletion(false), 3000);
    
    // Create meditation log entry
    const now = new Date();
    addLog({
      date: now.toLocaleDateString('en-CA'), // YYYY-MM-DD format to match fasting page
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      duration: Math.floor(totalDuration / 60)
    });
  };

  const startMeditation = async () => {
    const minutes = parseInt(inputMinutes);
    if (!minutes || minutes <= 0) {
      alert('Please enter a valid duration in minutes');
      return;
    }

    // Initialize audio context on user interaction (iOS requirement)
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
    } catch (error) {
      console.log('Audio context initialization failed:', error);
    }

    const durationInSeconds = minutes * 60;
    setTotalDuration(durationInSeconds);
    setTimeLeft(durationInSeconds);
    setIsActive(true);
    setIsPaused(false);
    setInputMinutes('');
  };

  const pauseMeditation = () => {
    setIsPaused(true);
  };

  const resumeMeditation = () => {
    setIsPaused(false);
  };

  const stopMeditation = () => {
    setIsActive(false);
    setIsPaused(false);
    setTimeLeft(0);
    setTotalDuration(0);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerProgressPercentage = (): number => {
    if (totalDuration === 0) return 0;
    return ((totalDuration - timeLeft) / totalDuration) * 100;
  };

  const getProgressStroke = (): number => {
    const radius = 120;
    const circumference = 2 * Math.PI * radius;
    const progress = getTimerProgressPercentage();
    return circumference - (progress / 100) * circumference;
  };

  const handleSetGoal = async () => {
    const minutesGoal = parseFloat(goalMinutesInput);
    
    if (isNaN(minutesGoal) || minutesGoal <= 0) {
      alert('Please enter a valid goal in minutes');
      return;
    }
    
    // Use shared utility for goal saving with cross-page sync
    setMeditationGoal(minutesGoal);
    
    await updateGoal('meditationMinutes', minutesGoal);
    setIsGoalModalOpen(false);
    alert('Meditation goal saved successfully!');
  };

  return (
    <div className="fitcircle-page">
      <div className="fitcircle-container">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBack}
            className="fitcircle-back-button"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="fitcircle-page-title">Meditation</h1>
          <button
            onClick={() => setIsGoalModalOpen(true)}
            className="flex items-center space-x-1 fitcircle-text-muted hover:text-white transition-colors"
          >
            <Target className="w-5 h-5" />
            <span>Goal</span>
          </button>
        </div>

        {/* Completion Notification */}
        {showCompletion && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-xl p-8 text-center max-w-sm mx-4 border border-blue-500">
              <div className="text-6xl mb-4">🧘‍♂️</div>
              <h2 className="text-2xl font-bold text-white mb-2">Session Complete!</h2>
              <p className="text-slate-300">Well done on completing your meditation</p>
            </div>
          </div>
        )}

        {/* Main Meditation Circle - transforms between progress tracker and timer */}
        <div className="flex justify-center mb-8">
          {!isActive ? (
            /* Progress Circle when not meditating */
            <GoalCircle
              percentage={getProgressPercentage()}
              color="rgb(168, 85, 247)"
              size={240}
              strokeWidth={16}
              currentValue={getTodayMinutes()}
              goalValue={getDailyGoal()}
              unit="min"
              title="Today's Meditation"
              description={`Goal: ${getDailyGoal()}min/day`}
            />
          ) : (
            /* Timer Circle when meditating */
            <div className="relative">
              <svg width="240" height="240" className="transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="120"
                  cy="120"
                  r="104"
                  stroke="rgba(100, 116, 139, 0.3)"
                  strokeWidth="16"
                  fill="none"
                />
                {/* Progress circle */}
                <circle
                  cx="120"
                  cy="120"
                  r="104"
                  stroke="rgb(59, 130, 246)"
                  strokeWidth="16"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 104}`}
                  strokeDashoffset={2 * Math.PI * 104 - (getTimerProgressPercentage() / 100) * 2 * Math.PI * 104}
                  className="transition-all duration-1000 ease-linear"
                  style={{
                    filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.5))'
                  }}
                />
              </svg>
              
              {/* Time display */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl font-bold text-white font-mono mb-2">
                    {formatTime(timeLeft)}
                  </div>
                  <div className="text-sm text-slate-400">
                    {isPaused ? 'Paused' : 'Meditating...'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {!isActive && isGoalReached() && (
          <div className="text-purple-400 font-medium text-center -mt-4 mb-8">
            🧘‍♂️ Daily goal achieved!
          </div>
        )}

        {/* Last 7 Days Progress Stats */}
        <Card className="fitcircle-card-lg mb-6">
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-3 text-center">Last 7 Days</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-purple-400">
                  {getLast7DaysProgress().totalMinutes}min
                </div>
                <div className="text-sm text-slate-400">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400">
                  {getLast7DaysProgress().averageMinutes}min
                </div>
                <div className="text-sm text-slate-400">Daily Average</div>
              </div>
            </div>
            {getLast7DaysProgress().remaining > 0 && (
              <div className="mt-3 text-center text-slate-300">
                <span className="text-sm">
                  {getLast7DaysProgress().remaining} minutes remaining
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Meditation Controls */}
        <div className="flex flex-col items-center mb-8">
          {!isActive ? (
            /* Add Meditation Button */
            <div className="mb-8 w-full max-w-sm">
              <Button
                onClick={() => setIsMeditationDialogOpen(true)}
                className="w-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Meditation</span>
              </Button>
            </div>
          ) : (
            /* Active Session Controls */
            <div className="flex space-x-4">
              {!isPaused ? (
                <Button
                  onClick={pauseMeditation}
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
              ) : (
                <Button
                  onClick={resumeMeditation}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Resume
                </Button>
              )}
              <Button
                onClick={stopMeditation}
                variant="outline"
                className="border-red-600 text-red-400 hover:bg-red-900/20"
              >
                <Square className="w-4 h-4 mr-2" />
                Stop
              </Button>
            </div>
          )}
        </div>

        {/* Meditation Log - Monthly Sections */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Meditation Log</h3>
          <div className="space-y-3">
            {Object.keys(monthlyLogs).length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <p>No meditation sessions yet.</p>
                <p className="text-sm mt-2">Complete a meditation session to see your log here.</p>
              </div>
            ) : (
              Object.entries(monthlyLogs).map(([monthName, monthLogs]) => (
                <Collapsible
                  key={monthName}
                  open={expandedMonths.has(monthName)}
                  onOpenChange={(isOpen) => {
                    const newExpanded = new Set(expandedMonths);
                    if (isOpen) {
                      newExpanded.add(monthName);
                    } else {
                      newExpanded.delete(monthName);
                    }
                    setExpandedMonths(newExpanded);
                  }}
                >
                  <CollapsibleTrigger asChild>
                    <button className="w-full fitcircle-card hover:bg-slate-700 transition-colors">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-medium">{monthName}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-purple-400 text-sm">{monthLogs.length} sessions</span>
                          <span className="text-slate-400">
                            {expandedMonths.has(monthName) ? '−' : '+'}
                          </span>
                        </div>
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="space-y-2 mt-2">
                    {monthLogs
                      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
                      .map((log) => (
                        <div key={log.id} className="bg-slate-800 rounded-xl p-4 ml-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-sm text-slate-300">
                                {log.date} at {log.time}
                              </div>
                              <div className="text-lg font-semibold text-purple-400">
                                {log.duration} minute{log.duration !== 1 ? 's' : ''}
                              </div>
                            </div>
                            <div className="text-2xl">🧘‍♂️</div>
                          </div>
                        </div>
                      ))
                    }
                  </CollapsibleContent>
                </Collapsible>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Goal Setting Modal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Meditation Goal</h3>
              <button
                onClick={() => setIsGoalModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Goal Progress Circle */}
            <div className="flex justify-center mb-8">
              <GoalCircle
                percentage={getAllTimeGoalPercentage()}
                color="rgb(147, 51, 234)"
                size={120}
                currentValue={Math.round(calculateMeditation7DayAverage(logs))}
                goalValue={parseFloat(goalMinutesInput) || 0}
                unit="min"
                title="Daily Meditation"
                description="All-time average"
              />
            </div>

            {/* Goal Input Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="goalMinutes" className="text-slate-300">
                  Daily Meditation Goal (minutes)
                </Label>
                <Input
                  id="goalMinutes"
                  type="number"
                  value={goalMinutesInput}
                  onChange={(e) => setGoalMinutesInput(e.target.value)}
                  onFocus={() => setGoalMinutesFocused(true)}
                  onBlur={() => setGoalMinutesFocused(false)}
                  className="bg-slate-700 border-slate-600 text-white mt-1"
                  placeholder={goalMinutesFocused ? "" : "Enter daily goal in minutes"}
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsGoalModalOpen(false)}
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSetGoal}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Set Goal
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Start Meditation Dialog */}
      <Dialog open={isMeditationDialogOpen} onOpenChange={setIsMeditationDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-sm mx-auto">
          <DialogTitle className="text-lg font-semibold text-center">Start Meditation</DialogTitle>
          <DialogDescription className="sr-only">
            Set meditation duration and start your session
          </DialogDescription>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Duration (minutes)
              </label>
              <Input
                type="number"
                value={inputMinutes}
                onChange={(e) => setInputMinutes(e.target.value)}
                onFocus={() => setInputMinutesFocused(true)}
                onBlur={() => setInputMinutesFocused(false)}
                placeholder={inputMinutesFocused ? "" : "Enter Duration"}
                className="bg-slate-700 border-slate-600 text-white text-center"
                min="1"
              />
            </div>
            <Button
              onClick={() => {
                startMeditation();
                setIsMeditationDialogOpen(false);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Meditation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}