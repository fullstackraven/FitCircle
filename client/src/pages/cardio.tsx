import React, { useState, useEffect } from 'react';
import { ArrowLeft, Target, Plus, Edit2, Trash2, Clock, MapPin, FileText, Save, X, Activity } from 'lucide-react';
import { useLocation } from 'wouter';
import { useCardio, CardioEntry, CardioSession } from '@/hooks/use-cardio';
import { GoalCircle } from '@/components/GoalCircle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent } from '@/components/ui/card';
import { getTodayString, groupLogsByMonth, getAllTimeCardioAverage } from '@/lib/date-utils';

export default function CardioPage() {
  const [, navigate] = useLocation();
  const {
    addCardioEntry,
    updateCardioSession,
    deleteCardioSession,
    updateGoal,
    addCustomType,
    getAllCardioTypes,
    getTodaysProgress,
    getWeeklyProgress,
    getLast10LogsAverage,
    getCardioStats,
    getAllTimeGoalPercentage,
    data
  } = useCardio();

  // Check if we came from dashboard
  const fromDashboard = new URLSearchParams(window.location.search).get('from') === 'dashboard';

  const handleBack = () => {
    navigate('/wellness');
  };

  // State for modals and forms
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddCustomTypeOpen, setIsAddCustomTypeOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CardioSession | null>(null);
  
  // Goal dialog state
  const [goalInput, setGoalInput] = useState('');
  const [goalInputFocused, setGoalInputFocused] = useState(false);

  // Form states
  const [newEntry, setNewEntry] = useState({
    type: '',
    duration: '',
    distance: '',
    notes: ''
  });
  const [newCustomType, setNewCustomType] = useState('');
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  const todaysProgress = getTodaysProgress();
  const weeklyProgress = getWeeklyProgress();
  const last10LogsAverage = getLast10LogsAverage();
  const stats = getCardioStats();
  const cardioTypes = getAllCardioTypes();

  // Calculate daily goal target for the circle  
  const dailyGoalTarget = data.goal.target; // Daily goal target
  const todaysValue = data.goal.type === 'duration' ? todaysProgress.today.duration : todaysProgress.today.distance;
  const progressPercentage = dailyGoalTarget > 0 ? Math.min((todaysValue / dailyGoalTarget) * 100, 100) : 0;

  const resetAddForm = () => {
    setNewEntry({
      type: '',
      duration: '',
      distance: '',
      notes: ''
    });
  };

  // Get all sessions as flat array for grouping (using legacy compatibility)
  const allSessions = Object.values(data.dailyLogs || {}).flatMap(dayLog => 
    dayLog.sessions.map(session => ({
      ...session,
      date: dayLog.date,
      timestamp: new Date(dayLog.date + ' ' + session.time).getTime()
    }))
  );
  
  // Get recent activity - all entries sorted by date/time (most recent first)  
  const recentActivity = allSessions
    .sort((a, b) => b.timestamp - a.timestamp);
    
  // Group all entries by month
  const monthlyLogs = groupLogsByMonth(recentActivity);
  
  // Get today's sessions for the "Today's Cardio" section
  const getTodaySessions = () => {
    const today = getTodayString(); // YYYY-MM-DD format
    const todayLegacy = new Date().toLocaleDateString('en-US'); // MM/DD/YYYY format
    
    // Try both date formats to handle legacy data
    let todayLogKey = Object.keys(data.dailyLogs).find(date => date === today);
    if (!todayLogKey) {
      todayLogKey = Object.keys(data.dailyLogs).find(date => date === todayLegacy);
    }
    
    return todayLogKey ? data.dailyLogs[todayLogKey].sessions : [];
  };
  
  const todaySessions = getTodaySessions();

  const handleAddEntry = () => {
    if (!newEntry.type || (!newEntry.duration && !newEntry.distance)) {
      alert('Please fill in the cardio type and either duration or distance');
      return;
    }

    addCardioEntry(
      newEntry.type,
      parseFloat(newEntry.duration) || 0,
      parseFloat(newEntry.distance) || 0,
      newEntry.notes || undefined
    );
    resetAddForm();
    setIsAddDialogOpen(false);
  };

  const handleUpdateEntry = () => {
    if (!editingEntry || !newEntry.type || (!newEntry.duration && !newEntry.distance)) {
      alert('Please fill in the cardio type and either duration or distance');
      return;
    }

    const updatedEntry: Partial<CardioEntry> = {
      type: newEntry.type,
      duration: parseFloat(newEntry.duration) || 0,
      distance: parseFloat(newEntry.distance) || 0,
      notes: newEntry.notes || undefined
    };

    // Find the date for this session
    const sessionDate = Object.entries(data.dailyLogs).find(([date, dayLog]) => 
      dayLog.sessions.some(s => s.id === editingEntry.id)
    )?.[0];
    
    if (sessionDate) {
      updateCardioSession(sessionDate, editingEntry.id, updatedEntry);
    }
    setEditingEntry(null);
    resetAddForm();
    setIsEditDialogOpen(false);
  };

  const handleDeleteEntry = (id: string) => {
    if (confirm('Are you sure you want to delete this cardio entry?')) {
      // Find which date this entry belongs to
      const entryToDelete = allSessions.find(entry => entry.id === id);
      if (entryToDelete) {
        deleteCardioSession(entryToDelete.date, id);
      }
    }
  };

  const handleAddCustomType = () => {
    if (!newCustomType.trim()) return;
    
    addCustomType(newCustomType);
    setNewCustomType('');
    setIsAddCustomTypeOpen(false);
  };

  const handleSetGoal = async () => {
    const targetValue = parseFloat(goalInput);
    
    if (isNaN(targetValue) || targetValue <= 0) {
      alert('Please enter a valid goal value');
      return;
    }
    
    await updateGoal({ type: data.goal.type, target: targetValue, period: data.goal.period });
    setIsGoalDialogOpen(false);
    alert('Cardio goal saved successfully!');
  };

  // Initialize goal input when dialog opens
  const handleOpenGoalDialog = () => {
    setGoalInput(data.goal.target?.toString() || '');
    setIsGoalDialogOpen(true);
  };

  const formatDuration = (minutes: any) => {
    // Convert to number and clean it
    const num = parseFloat(String(minutes)) || 0;
    
    // Round to remove floating point precision issues
    const cleanNum = Math.round(num * 100) / 100;
    
    if (cleanNum < 60) {
      // For numbers like 22.0, show as 22. For 22.5, show as 22.5
      return cleanNum % 1 === 0 ? `${Math.floor(cleanNum)}min` : `${cleanNum}min`;
    }
    
    const hours = Math.floor(cleanNum / 60);
    const remainingMins = cleanNum % 60;
    
    if (remainingMins === 0) {
      return `${hours}h`;
    }
    
    return remainingMins % 1 === 0 ? 
      `${hours}h ${Math.floor(remainingMins)}min` : 
      `${hours}h ${remainingMins}min`;
  };

  // Helper function to convert 24-hour time to 12-hour format for display
  const formatTimeFor12Hour = (timeString: string): string => {
    // If it's already in 12-hour format (contains AM/PM), return as-is
    if (timeString.includes('AM') || timeString.includes('PM')) {
      return timeString;
    }
    
    // If it's in 24-hour format (HH:MM), convert it
    if (timeString.match(/^\d{1,2}:\d{2}$/)) {
      const [hours, minutes] = timeString.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' });
    }
    
    return timeString; // Return as-is if format is unrecognized
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
          <h1 className="fitcircle-page-title">Cardio</h1>
          <button 
            onClick={handleOpenGoalDialog}
            className="flex items-center space-x-1 fitcircle-text-muted hover:text-white transition-colors"
          >
            <Target className="w-5 h-5" />
            <span>Goal</span>
          </button>
        </div>

        {/* Main Progress Circle */}
        <div className="flex justify-center mb-8">
          <GoalCircle
            percentage={progressPercentage}
            color="rgb(34, 197, 94)"
            size={240}
            strokeWidth={16}
            currentValue={Math.round(todaysValue * 10) / 10}
            goalValue={Math.round(data.goal.target * 10) / 10}
            unit={data.goal.type === 'duration' ? 'min' : 'mi'}
            title="Today's Cardio"
            description={`Goal: ${Math.round(data.goal.target * 10) / 10} ${data.goal.type === 'duration' ? 'min' : 'mi'}/day`}
          />
        </div>

        {/* Weekly Progress Stats */}
        <Card className="fitcircle-card-lg mb-6">
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-3 text-center">Last 10 Logs</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-400">
                  {data.goal.type === 'duration' ? formatDuration(weeklyProgress.totalDuration) : `${weeklyProgress.totalDistance.toFixed(1)}mi`}
                </div>
                <div className="text-sm text-slate-400">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">
                  {data.goal.type === 'duration' ? `${getLast10LogsAverage().average}min` : `${getLast10LogsAverage().average}mi`}
                </div>
                <div className="text-sm text-slate-400">Daily Average</div>
              </div>
            </div>
            {weeklyProgress.remaining > 0 && (
              <div className="mt-3 text-center text-slate-300">
                <span className="text-sm">
                  {data.goal.type === 'duration' 
                    ? `${Math.round(weeklyProgress.remaining)} minutes remaining`
                    : `${weeklyProgress.remaining.toFixed(1)} miles remaining`
                  }
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Entry Button */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-green-600 hover:bg-green-700 h-12 mb-6">
              <Plus className="w-5 h-5 mr-2" />
              Log Cardio
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-center text-white">Add Cardio Entry</DialogTitle>
              <DialogDescription className="text-sm text-slate-400 text-center">
                Log your cardio workout details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium text-white">Cardio Type</Label>
                <div className="flex space-x-2">
                  <Select value={newEntry.type} onValueChange={(value) => setNewEntry({...newEntry, type: value})}>
                    <SelectTrigger className="flex-1 bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-green-500 focus:ring-green-500">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {cardioTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog open={isAddCustomTypeOpen} onOpenChange={setIsAddCustomTypeOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="px-3">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700 text-white">
                      <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-center text-white">Add Custom Type</DialogTitle>
                        <DialogDescription className="text-sm text-slate-400 text-center">Create a new cardio type</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-white">Type Name</Label>
                          <Input
                            value={newCustomType}
                            onChange={(e) => setNewCustomType(e.target.value)}
                            placeholder="e.g., Swimming"
                            className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-green-500 focus:ring-green-500"
                          />
                        </div>
                        <div className="flex space-x-2">
                          <Button onClick={handleAddCustomType} className="flex-1">
                            Add Type
                          </Button>
                          <Button variant="outline" onClick={() => setIsAddCustomTypeOpen(false)} className="border-slate-600 text-slate-300 hover:bg-slate-700">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-white">Duration (minutes)</Label>
                  <Input
                    type="number"
                    placeholder="30"
                    value={newEntry.duration}
                    onChange={(e) => setNewEntry({...newEntry, duration: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-white">Distance (miles)</Label>
                  <Input
                    type="number"
                    placeholder="3.0"
                    step="0.1"
                    value={newEntry.distance}
                    onChange={(e) => setNewEntry({...newEntry, distance: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-white">Notes - Optional</Label>
                <Textarea
                  value={newEntry.notes}
                  onChange={(e) => setNewEntry({...newEntry, notes: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-green-500 focus:ring-green-500"
                  rows={2}
                />
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleAddEntry} className="flex-1 bg-green-500 hover:bg-green-600 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Entry
                </Button>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Today's Cardio */}
        {todaySessions.length > 0 && (
          <div className="fitcircle-card-lg mb-6">
            <h3 className="text-lg font-semibold mb-3">Today's Cardio</h3>
            <div className="space-y-2">
              {todaySessions.slice().reverse().map((session: CardioSession, index: number) => (
                <div key={session.id} className="flex justify-between items-center text-sm relative">
                  <div className="flex items-center space-x-3">
                    <span className="text-slate-400">{formatTimeFor12Hour(session.time)}</span>
                    <span className="text-slate-300">{session.type}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex flex-col items-end space-y-1">
                      {session.duration > 0 && (
                        <span className="text-green-400 font-medium text-xs">
                          {formatDuration(session.duration)}
                        </span>
                      )}
                      {session.distance && session.distance > 0 && (
                        <span className="text-blue-400 font-medium text-xs">
                          {session.distance}mi
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingEntry(session);
                          setNewEntry({
                            type: session.type,
                            duration: session.duration.toString(),
                            distance: session.distance?.toString() || '',
                            notes: session.notes || ''
                          });
                          setIsEditDialogOpen(true);
                        }}
                        className="text-slate-400 hover:text-white p-1 h-auto"
                        data-testid={`button-edit-session-${session.id}`}
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Find which date this entry belongs to
                          const entryToDelete = allSessions.find(entry => entry.id === session.id);
                          if (entryToDelete && confirm('Are you sure you want to delete this cardio session?')) {
                            deleteCardioSession(entryToDelete.date, session.id);
                          }
                        }}
                        className="text-slate-400 hover:text-red-300 p-1 h-auto"
                        data-testid={`button-delete-session-${session.id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cardio Log - Daily Aggregation */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Cardio Log</h3>
          <div className="space-y-3">
            {Object.keys(data.dailyLogs).length > 0 ? (
              Object.entries(groupLogsByMonth(Object.values(data.dailyLogs))).map(([monthName, monthLogs]) => (
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
                          <span className="text-green-400 text-sm">{monthLogs.length} days</span>
                          <span className="text-slate-400">
                            {expandedMonths.has(monthName) ? '−' : '+'}
                          </span>
                        </div>
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="space-y-2 mt-2">
                    {monthLogs.map((log) => (
                      <div key={log.date} className="fitcircle-card ml-4">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-white font-medium">
                            {new Date(log.date + 'T00:00:00').toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                          <div className="flex items-center space-x-2">
                            {log.totalDuration > 0 && (
                              <span className="text-green-400 font-semibold text-sm">
                                {formatDuration(log.totalDuration)}
                              </span>
                            )}
                            {log.totalDistance > 0 && (
                              <span className="text-blue-400 font-semibold text-sm">
                                {log.totalDistance.toFixed(1)}mi
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-slate-400 mb-2">
                          {log.sessions.length} sessions
                        </div>
                        
                        {/* Show detailed sessions for this day */}
                        <div className="space-y-1">
                          {(expandedDays.has(log.date) ? log.sessions : log.sessions.slice(0, 3)).map((session, index) => (
                            <div key={session.id} className="flex justify-between items-center text-xs">
                              <div className="flex items-center space-x-2">
                                <span className="text-slate-500">{formatTimeFor12Hour(session.time)}</span>
                                <span className="text-slate-400">{session.type}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                {session.duration > 0 && (
                                  <span className="text-slate-300">{formatDuration(session.duration)}</span>
                                )}
                                {session.distance && session.distance > 0 && (
                                  <span className="text-slate-300">{session.distance}mi</span>
                                )}
                              </div>
                            </div>
                          ))}
                          {log.sessions.length > 3 && (
                            <button
                              onClick={() => {
                                const newExpanded = new Set(expandedDays);
                                if (newExpanded.has(log.date)) {
                                  newExpanded.delete(log.date);
                                } else {
                                  newExpanded.add(log.date);
                                }
                                setExpandedDays(newExpanded);
                              }}
                              className="text-xs text-slate-500 hover:text-slate-300 text-center mt-1 w-full transition-colors"
                            >
                              {expandedDays.has(log.date) 
                                ? 'Show less' 
                                : `+${log.sessions.length - 3} more sessions`
                              }
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))
            ) : (
              <Card className="fitcircle-card">
                <CardContent className="p-8 text-center">
                  <div className="text-slate-400">
                    <Activity className="w-12 h-12 mx-auto mb-2" />
                    <p>No cardio activity yet</p>
                    <p className="text-sm">Tap "Log Cardio" to get started!</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Edit Entry Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-center text-white">Edit Cardio Entry</DialogTitle>
              <DialogDescription className="text-sm text-slate-400 text-center">
                Update your cardio workout details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium text-white">Cardio Type</Label>
                <Select value={newEntry.type} onValueChange={(value) => setNewEntry({...newEntry, type: value})}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-green-500 focus:ring-green-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {cardioTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-white">Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={newEntry.duration}
                    onChange={(e) => setNewEntry({...newEntry, duration: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-white">Distance (miles)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={newEntry.distance}
                    onChange={(e) => setNewEntry({...newEntry, distance: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-white">Notes - Optional</Label>
                <Textarea
                  value={newEntry.notes}
                  onChange={(e) => setNewEntry({...newEntry, notes: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-green-500 focus:ring-green-500"
                  rows={2}
                />
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleUpdateEntry} className="flex-1 bg-green-500 hover:bg-green-600 text-white">
                  <Save className="w-4 h-4 mr-2" />
                  Update Entry
                </Button>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Simple Goal Setting Modal - Fasting Style */}
      {isGoalDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Cardio Goal</h3>
              <button
                onClick={() => setIsGoalDialogOpen(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Goal Progress Circle */}
            <div className="flex justify-center mb-8">
              <GoalCircle
                percentage={(() => {
                  const targetValue = parseFloat(goalInput) || data.goal.target || 0;
                  if (targetValue === 0) return 0;
                  
                  const { averageDuration, averageDistance } = getAllTimeCardioAverage(allSessions);
                  const currentAverage = data.goal.type === 'duration' ? averageDuration : averageDistance;
                  return Math.min(100, (currentAverage / targetValue) * 100);
                })()}
                color="rgb(34, 197, 94)"
                size={120}
                currentValue={(() => {
                  const { averageDuration, averageDistance } = getAllTimeCardioAverage(allSessions);
                  return data.goal.type === 'duration' ? averageDuration : averageDistance;
                })()}
                goalValue={parseFloat(goalInput) || data.goal.target || 0}
                unit={data.goal.type === 'duration' ? 'min' : 'mi'}
                title="Daily Average"
                description="All-time average"
              />
            </div>

            {/* Goal Input Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="goalTarget" className="text-slate-300">
                  Daily Goal ({data.goal.type === 'duration' ? 'minutes' : 'miles'})
                </Label>
                <Input
                  id="goalTarget"
                  type="number"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  onFocus={() => setGoalInputFocused(true)}
                  onBlur={() => setGoalInputFocused(false)}
                  className="bg-slate-700 border-slate-600 text-white mt-1"
                  placeholder={goalInputFocused ? "" : `Enter daily ${data.goal.type === 'duration' ? 'minutes' : 'miles'}`}
                  step="0.1"
                />
              </div>
              
              <div className="flex space-x-3">
                <Button
                  onClick={() => {
                    if (data.goal.type === 'duration') {
                      updateGoal({ type: 'distance', target: data.goal.target, period: data.goal.period });
                    } else {
                      updateGoal({ type: 'duration', target: data.goal.target, period: data.goal.period });
                    }
                  }}
                  variant="outline"
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Switch to {data.goal.type === 'duration' ? 'Miles' : 'Minutes'}
                </Button>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsGoalDialogOpen(false)}
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSetGoal}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Save Goal
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}