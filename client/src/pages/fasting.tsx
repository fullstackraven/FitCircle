import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Plus } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FastingLog {
  id: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  duration: number; // in minutes
  loggedAt: string;
}

export default function FastingPage() {
  const [, navigate] = useLocation();
  const [logs, setLogs] = useState<FastingLog[]>([]);
  const [isLogging, setIsLogging] = useState(false);
  
  // Form state
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');

  useEffect(() => {
    // Load saved fasting logs
    const savedLogs = localStorage.getItem('fitcircle_fasting_logs');
    if (savedLogs) {
      try {
        setLogs(JSON.parse(savedLogs));
      } catch (error) {
        console.error('Failed to parse fasting logs:', error);
      }
    }
  }, []);

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

    const newLog: FastingLog = {
      id: Date.now().toString(),
      startDate,
      startTime,
      endDate,
      endTime,
      duration,
      loggedAt: new Date().toISOString()
    };

    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);
    localStorage.setItem('fitcircle_fasting_logs', JSON.stringify(updatedLogs));

    // Reset form
    setStartDate('');
    setStartTime('');
    setEndDate('');
    setEndTime('');
    setIsLogging(false);
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
            onClick={() => navigate('/')}
            className="text-slate-400 hover:text-white transition-colors flex items-center space-x-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="text-xl font-semibold">Intermittent Fasting</h1>
          <div className="w-16"></div>
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
          <div className="mb-8 bg-slate-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Log Fast</span>
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
                  <div className="bg-slate-700 rounded-lg p-4">
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
                  Log Fast
                </Button>
                <Button
                  onClick={() => {
                    setIsLogging(false);
                    setStartDate('');
                    setStartTime('');
                    setEndDate('');
                    setEndTime('');
                  }}
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
            {logs.map((log) => {
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
                <div key={log.id} className="bg-slate-800 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm text-slate-300">
                      Logged on {loggedDate} at {loggedTime}
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
                      {new Date(log.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} {log.startTime} - {new Date(log.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} {log.endTime}
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
    </div>
  );
}