import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Plus, Edit, Trash2, Target, X } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoalCircle } from '@/components/GoalCircle';
import { useFasting, type FastingLog } from '@/hooks/use-fasting';
import { useGoals } from '@/hooks/use-goals';

export default function FastingPage() {
  const [, navigate] = useLocation();
  
  // Check if we came from dashboard
  const fromDashboard = new URLSearchParams(window.location.search).get('from') === 'dashboard';
  
  const handleBack = () => {
    if (fromDashboard) {
      navigate('/?dashboard=open');
    } else {
      navigate('/');
    }
  };
  const { logs, addLog, updateLog, deleteLog } = useFasting();
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

  useEffect(() => {
    // Initialize goal input with current goal value
    setGoalHoursInput(goals.fastingHours?.toString() || '');
  }, [goals.fastingHours]);

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

  const getHeatBarColor = (hours: number): string => {
    if (hours <= 1) return 'bg-blue-500';
    if (hours <= 6) return 'bg-green-500';
    if (hours <= 12) return 'bg-yellow-500';
    if (hours <= 18) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getHeatBarWidth = (hours: number): string => {
    const percentage = Math.min((hours / 24) * 100, 100);
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
    
    if (isNaN(hoursGoal) || hoursGoal <= 0) {
      alert('Please enter a valid goal in hours');
      return;
    }
    
    // Cross-page sync: Save to individual goal key for Goals page compatibility
    localStorage.setItem('fitcircle_goal_fasting', hoursGoal.toString());
    
    await updateGoal('fastingHours', hoursGoal);
    setIsGoalModalOpen(false);
    alert('Fasting goal saved successfully!');
  };

  const currentDuration = startDate && startTime && endDate && endTime 
    ? calculateDuration(startDate, startTime, endDate, endTime)
    : 0;

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: 'hsl(222, 47%, 11%)' }}>
      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBack}
            className="text-slate-400 hover:text-white transition-colors flex items-center space-x-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="text-xl font-semibold">Fasting Log</h1>
          <button
            onClick={() => setIsGoalModalOpen(true)}
            className="flex items-center space-x-1 text-slate-400 hover:text-white transition-colors"
          >
            <Target className="w-5 h-5" />
            <span>Goal</span>
          </button>
        </div>

        {/* Add Fasting Log Button */}
        {!isLogging && (
          <div className="mb-8">
            <Button
              onClick={() => setIsLogging(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Fasting Log</span>
            </Button>
          </div>
        )}

        {/* Log Fast Form */}
        {isLogging && (
          <div className="mb-8 bg-slate-800 rounded-xl p-6">
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

        {/* Fasting Logs */}
        {logs.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Fasting History</h2>
            {logs
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
                <div key={log.id} className="bg-slate-800 rounded-xl p-4">
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
                    <div className="text-xl font-bold text-white font-mono mb-2">
                      {formatDuration(log.duration)}
                    </div>
                    
                    {/* Fast Period */}
                    <div className="text-sm text-slate-400">
                      {new Date(log.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(log.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {logs.length === 0 && !isLogging && (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg mb-2">No fasting logs yet</p>
            <p className="text-slate-500 text-sm">Start tracking your intermittent fasting journey!</p>
          </div>
        )}
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
                  if (goalHours === 0 || logs.length === 0) return 0;
                  
                  // Calculate average fasting hours from recent logs
                  const recentLogs = logs.slice(-7); // Last 7 fasts
                  const totalHours = recentLogs.reduce((sum, log) => sum + (log.duration / 60), 0);
                  const averageHours = totalHours / recentLogs.length;
                  
                  return Math.min(100, (averageHours / goalHours) * 100);
                })()}
                color="rgb(245, 158, 11)"
                size={120}
                currentValue={(() => {
                  if (logs.length === 0) return 0;
                  const recentLogs = logs.slice(-7);
                  const totalHours = recentLogs.reduce((sum, log) => sum + (log.duration / 60), 0);
                  return Math.round((totalHours / recentLogs.length) * 10) / 10;
                })()}
                goalValue={parseFloat(goalHoursInput) || 0}
                unit="hrs"
                title="Average Fast Duration"
                description="Last 7 fasts average"
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
                  className="bg-slate-700 border-slate-600 text-white mt-1"
                  placeholder="Enter hours (e.g., 16)"
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
    </div>
  );
}