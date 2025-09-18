import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Plus, Edit, Trash2, Target, X } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoalCircle } from '@/components/GoalCircle';
import { useFasting, type FastingLog } from '@/hooks/use-fasting';
import { useGoals } from '@/hooks/use-goals';
import { getTodayString, getCurrentTime24, getDisplayDate, isToday, isYesterday, groupLogsByMonth, getAllTimeFastingAverage } from '@/lib/date-utils';

export default function FastingPage() {
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
  const { logs, addLog, updateLog, deleteLog, getLast7DaysProgress } = useFasting();
  const { goals, updateGoal } = useGoals();
  const [isLogging, setIsLogging] = useState(false);
  const [editingLog, setEditingLog] = useState<FastingLog | null>(null);
  
  // Form state
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  
  // Goal state
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalHoursInput, setGoalHoursInput] = useState('');
  const [goalHoursFocused, setGoalHoursFocused] = useState(false);
  
  // Max hours state (for integrated modal)
  const [maxHoursInput, setMaxHoursInput] = useState('');
  const [maxHoursFocused, setMaxHoursFocused] = useState(false);
  
  // UI state for monthly collapsible sections
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Initialize goal input with current goal value
    setGoalHoursInput(goals.fastingHours?.toString() || '');
  }, [goals.fastingHours]);

  // Group logs by month for display
  const monthlyLogs = groupLogsByMonth(logs, 'startDate');

  const calculateDuration = (startDate: string, startTime: string, endDate: string, endTime: string): number => {
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60)); // in minutes
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const secs = 0; // We don't track seconds for logged fasts
    return `${hours.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  };

  // Get today's fasting data for circular display (FIXED TIMEZONE LOGIC)
  const getTodayFastingHours = (): number => {
    const today = getTodayString(); // Use master date utility
    const todayLogs = logs.filter(log => {
      // Show fasts that started today OR ended today (actual fast dates, not log dates)
      const startDate = log.startDate;
      const endDate = log.endDate;
      
      // Direct match for start or end date being today using master date utility
      return isToday(startDate) || isToday(endDate);
    });
    
    if (todayLogs.length === 0) return 0;
    
    // Return the longest fast that actually involves today in hours
    if (todayLogs.length === 0) {
      return 0;
    }
    const longestFast = Math.max(...todayLogs.map(log => log.duration / 60));
    return Math.round(longestFast * 10) / 10; // Round to 1 decimal place
  };

  const getHeatRingColor = (hours: number): string => {
    if (hours <= 1) return 'rgb(59, 130, 246)'; // blue-500
    if (hours <= 6) return 'rgb(34, 197, 94)'; // green-500  
    if (hours <= 12) return 'rgb(234, 179, 8)'; // yellow-500
    if (hours <= 18) return 'rgb(249, 115, 22)'; // orange-500
    return 'rgb(239, 68, 68)'; // red-500
  };

  const getProgressPercentage = (hours: number): number => {
    const maxHours = goals.maxFastingHours || 24;
    return Math.min((hours / maxHours) * 100, 100);
  };

  // Backward compatibility functions for existing code
  const getHeatBarColor = (hours: number): string => {
    if (hours <= 1) return 'bg-blue-500';
    if (hours <= 6) return 'bg-green-500';
    if (hours <= 12) return 'bg-yellow-500';
    if (hours <= 18) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getHeatBarWidth = (hours: number): string => {
    const maxHours = goals.maxFastingHours || 24;
    const percentage = Math.min((hours / maxHours) * 100, 100);
    return `${percentage}%`;
  };

  const handleLogFast = () => {
    if (!startDate || !startTime || !endDate || !endTime) {
      alert('Please fill in all fields');
      return;
    }

    const duration = calculateDuration(startDate, startTime, endDate, endTime);
    
    if (duration <= 0) {
      alert('End time must be after start time');
      return;
    }

    if (editingLog) {
      // Update existing log
      updateLog(editingLog.id, { startDate, startTime, endDate, endTime, duration });
      setEditingLog(null);
    } else {
      // Create new log
      addLog({
        startDate,
        startTime,
        endDate,
        endTime,
        duration
      });
    }

    // Reset form
    setStartDate('');
    setStartTime('');
    setEndDate('');
    setEndTime('');
    setIsLogging(false);
  };

  const handleEditLog = (log: FastingLog) => {
    setEditingLog(log);
    setStartDate(log.startDate);
    setStartTime(log.startTime);
    setEndDate(log.endDate);
    setEndTime(log.endTime);
    setIsLogging(true);
  };

  const handleDeleteLog = (logId: string) => {
    if (confirm('Are you sure you want to delete this fasting log?')) {
      deleteLog(logId);
    }
  };

  const handleCancelEdit = () => {
    setEditingLog(null);
    setStartDate('');
    setStartTime('');
    setEndDate('');
    setEndTime('');
    setIsLogging(false);
  };

  const handleSetGoal = async () => {
    const hoursGoal = parseFloat(goalHoursInput);
    const maxHours = parseFloat(maxHoursInput);
    
    if (isNaN(hoursGoal) || hoursGoal <= 0) {
      alert('Please enter a valid goal in hours');
      return;
    }
    
    if (isNaN(maxHours) || maxHours <= 0) {
      alert('Please enter a valid maximum in hours');
      return;
    }
    
    if (hoursGoal > maxHours) {
      alert('Goal hours cannot be greater than maximum hours');
      return;
    }
    
    // Cross-page sync: Save to individual goal key for Goals page compatibility
    localStorage.setItem('fitcircle_goal_fasting', hoursGoal.toString());
    
    await updateGoal('fastingHours', hoursGoal);
    await updateGoal('maxFastingHours', maxHours);
    setIsGoalModalOpen(false);
    alert('Fasting settings saved successfully!');
  };

  const currentDuration = startDate && startTime && endDate && endTime 
    ? calculateDuration(startDate, startTime, endDate, endTime)
    : 0;

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
          <h1 className="fitcircle-page-title">Fasting</h1>
          <button
            onClick={() => setIsGoalModalOpen(true)}
            className="flex items-center space-x-1 fitcircle-text-muted hover:text-white transition-colors"
          >
            <Target className="w-5 h-5" />
            <span>Goal</span>
          </button>
        </div>

        {/* Today's Fasting Progress Circle */}
        <div className="flex justify-center mb-4">
          <GoalCircle
            percentage={getProgressPercentage(getTodayFastingHours())}
            color={getHeatRingColor(getTodayFastingHours())}
            size={240}
            strokeWidth={16}
            currentValue={getTodayFastingHours()}
            goalValue={goals.maxFastingHours || 24}
            unit="h"
            title="Today's Fasting"
            description={`Max: ${goals.maxFastingHours || 24}h`}
          />
        </div>
        
        <div className="text-center text-sm text-slate-400 mb-8">
          Heat level: <span style={{ color: getHeatRingColor(getTodayFastingHours()) }}>
            {getTodayFastingHours() <= 1 ? 'Cool' : 
             getTodayFastingHours() <= 6 ? 'Warm' :
             getTodayFastingHours() <= 12 ? 'Hot' :
             getTodayFastingHours() <= 18 ? 'Very Hot' : 'Extreme'}
          </span>
        </div>

        {/* Last 7 Days Progress Stats */}
        <Card className="fitcircle-card-lg mb-6">
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-3 text-center">Last 7 Days</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-amber-400">
                  {getLast7DaysProgress().totalHours}h
                </div>
                <div className="text-sm text-slate-400">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-400">
                  {getLast7DaysProgress().averageHours}h
                </div>
                <div className="text-sm text-slate-400">Daily Average</div>
              </div>
            </div>
            {getLast7DaysProgress().remaining > 0 && (
              <div className="mt-3 text-center text-slate-300">
                <span className="text-sm">
                  {getLast7DaysProgress().remaining} hours remaining
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Fasting Log Button */}
        {!isLogging && (
          <div className="mb-8">
            <Button
              onClick={() => {
                // Initialize form with current date/time using master timezone utilities
                const currentDate = getTodayString();
                const currentTime = getCurrentTime24();
                setStartDate(currentDate);
                setStartTime(currentTime);
                setEndDate(currentDate);
                setEndTime(currentTime);
                setIsLogging(true);
              }}
              className="w-full bg-amber-600 hover:bg-amber-700 flex items-center justify-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Fast</span>
            </Button>
          </div>
        )}

        {/* Log Fast Form */}
        {isLogging && (
          <div className="mb-8 fitcircle-card-lg">
            <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>{editingLog ? 'Edit Fast' : 'Log Fast'}</span>
            </h2>
            
            <div className="space-y-4">
              {/* Start Date & Time */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Start Fast</label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              {/* End Date & Time */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">End Fast</label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              {/* Duration Display */}
              {currentDuration > 0 && (
                <div className="text-center">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Duration</label>
                  <div className="bg-slate-700 rounded-xl p-4">
                    {/* Heat Bar */}
                    <div className="mb-2">
                      <div className="w-full bg-slate-600 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${getHeatBarColor(currentDuration / 60)}`}
                          style={{ width: getHeatBarWidth(currentDuration / 60) }}
                        ></div>
                      </div>
                    </div>
                    {/* Duration Text */}
                    <div className="text-2xl font-bold text-white font-mono">
                      {formatDuration(currentDuration)}
                    </div>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex space-x-2">
                <Button
                  onClick={handleLogFast}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {editingLog ? 'Update Fast' : 'Log Fast'}
                </Button>
                <Button
                  onClick={handleCancelEdit}
                  variant="outline"
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Fasting Log - Monthly Sections */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Fasting Log</h3>
          <div className="space-y-3">
            {Object.keys(monthlyLogs).length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <p>No fasting logs yet.</p>
                <p className="text-sm mt-2">Start tracking your intermittent fasting journey!</p>
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
                          <span className="text-amber-400 text-sm">{monthLogs.length} fasts</span>
                          <span className="text-slate-400">
                            {expandedMonths.has(monthName) ? '−' : '+'}
                          </span>
                        </div>
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="space-y-2 mt-2">
                    {monthLogs
                      .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())
                      .map((log) => {
                        const hours = log.duration / 60;
                        const loggedDate = new Date(log.loggedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        });
                        const loggedTime = new Date(log.loggedAt).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit'
                        });
                        
                        return (
                          <div key={log.id} className="bg-slate-800 rounded-xl p-4 ml-4">
                            <div className="flex justify-between items-start mb-2">
                              <div className="text-sm text-slate-300">
                                {loggedDate} at {loggedTime}
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditLog(log)}
                                  className="text-slate-400 hover:text-blue-400 transition-colors"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteLog(log.id)}
                                  className="text-slate-400 hover:text-red-400 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            
                            <div className="text-center">
                              {/* Heat Bar */}
                              <div className="mb-2">
                                <div className="w-full bg-slate-600 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${getHeatBarColor(hours)}`}
                                    style={{ width: getHeatBarWidth(hours) }}
                                  ></div>
                                </div>
                              </div>
                              
                              {/* Duration */}
                              <div className="text-xl font-bold text-amber-400 font-mono mb-2">
                                {formatDuration(log.duration)}
                              </div>
                              
                              {/* Fast Period */}
                              <div className="text-sm text-slate-400">
                                {getDisplayDate(log.startDate)} - {getDisplayDate(log.endDate)}
                              </div>
                            </div>
                          </div>
                        );
                      })
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
              <h3 className="text-lg font-semibold text-white">Fasting Goal</h3>
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
                percentage={(() => {
                  const goalHours = parseFloat(goalHoursInput) || 0;
                  if (goalHours === 0) return 0;
                  
                  const { averageHours } = getAllTimeFastingAverage(logs);
                  return Math.min(100, (averageHours / goalHours) * 100);
                })()}
                color="rgb(245, 158, 11)"
                size={120}
                currentValue={getAllTimeFastingAverage(logs).averageHours}
                goalValue={parseFloat(goalHoursInput) || 0}
                unit="hrs"
                title="Average Fast Duration"
                description="All-time average"
              />
            </div>

            {/* Goal Input Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="goalHours" className="text-slate-300">
                  Goal Hours per Fast
                </Label>
                <Input
                  id="goalHours"
                  type="number"
                  value={goalHoursInput}
                  onChange={(e) => setGoalHoursInput(e.target.value)}
                  onFocus={() => setGoalHoursFocused(true)}
                  onBlur={() => setGoalHoursFocused(false)}
                  className="bg-slate-700 border-slate-600 text-white mt-1"
                  placeholder={goalHoursFocused ? "" : "Enter hours (e.g., 16)"}
                />
              </div>
              <div>
                <Label htmlFor="maxHours" className="text-slate-300">
                  Maximum Fasting Hours
                </Label>
                <Input
                  id="maxHours"
                  type="number"
                  value={maxHoursInput}
                  onChange={(e) => setMaxHoursInput(e.target.value)}
                  onFocus={() => {
                    setMaxHoursFocused(true);
                    if (!maxHoursInput) {
                      setMaxHoursInput(goals.maxFastingHours?.toString() || '24');
                    }
                  }}
                  onBlur={() => setMaxHoursFocused(false)}
                  className="bg-slate-700 border-slate-600 text-white mt-1"
                  placeholder={maxHoursFocused ? "" : "Enter max hours (e.g., 24, 48, 72)"}
                />
                <p className="text-xs text-slate-400 mt-1">
                  Set your maximum fasting duration for progress tracking
                </p>
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
                  Save Settings
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}