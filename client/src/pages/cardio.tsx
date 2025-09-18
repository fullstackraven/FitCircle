import React, { useState, useEffect } from 'react';
import { ArrowLeft, Target, Plus, Edit2, Trash2, Clock, MapPin, FileText, Save, X, Activity } from 'lucide-react';
import { useLocation } from 'wouter';
import { useCardio, CardioEntry } from '@/hooks/use-cardio';
import { GoalCircle } from '@/components/GoalCircle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent } from '@/components/ui/card';
import { getTodayString, groupLogsByMonth } from '@/lib/date-utils';

export default function CardioPage() {
  const [, navigate] = useLocation();
  const {
    addCardioEntry,
    updateCardioEntry,
    deleteCardioEntry,
    updateGoal,
    addCustomType,
    getAllCardioTypes,
    getTodaysProgress,
    getWeeklyProgress,
    getLast7DaysAverage,
    getCardioStats,
    data
  } = useCardio();

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

  // State for modals and forms
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddCustomTypeOpen, setIsAddCustomTypeOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CardioEntry | null>(null);

  // Form states
  const [newEntry, setNewEntry] = useState({
    type: '',
    duration: '',
    distance: '',
    notes: ''
  });
  const [newCustomType, setNewCustomType] = useState('');
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  const todaysProgress = getTodaysProgress();
  const weeklyProgress = getWeeklyProgress();
  const last7DaysAverage = getLast7DaysAverage();
  const stats = getCardioStats();
  const cardioTypes = getAllCardioTypes();

  // Calculate daily goal target for the circle
  const dailyGoalTarget = data.goal.target / 7; // Weekly goal divided by 7 days
  const todaysValue = data.goal.type === 'duration' ? todaysProgress.duration : todaysProgress.distance;
  const progressPercentage = dailyGoalTarget > 0 ? Math.min((todaysValue / dailyGoalTarget) * 100, 100) : 0;

  const resetAddForm = () => {
    setNewEntry({
      type: '',
      duration: '',
      distance: '',
      notes: ''
    });
  };

  // Get recent activity - all entries sorted by date/time (most recent first)  
  const recentActivity = data.entries
    .sort((a, b) => b.timestamp - a.timestamp);
    
  // Group all entries by month
  const monthlyLogs = groupLogsByMonth(recentActivity);

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

    updateCardioEntry(editingEntry.id, updatedEntry);
    setEditingEntry(null);
    resetAddForm();
    setIsEditDialogOpen(false);
  };

  const handleDeleteEntry = (id: string) => {
    if (confirm('Are you sure you want to delete this cardio entry?')) {
      deleteCardioEntry(id);
    }
  };

  const handleAddCustomType = () => {
    if (!newCustomType.trim()) return;
    
    addCustomType(newCustomType);
    setNewCustomType('');
    setIsAddCustomTypeOpen(false);
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
          <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center space-x-1 fitcircle-text-muted hover:text-white">
                <Target className="w-5 h-5" />
                <span>Goal</span>
              </button>
            </DialogTrigger>
            <DialogContent className="fitcircle-dialog">
              <DialogHeader>
                <DialogTitle>Cardio Goal</DialogTitle>
                <DialogDescription className="text-slate-400 text-center">
                  Set and track your weekly cardio goals
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="flex justify-center">
                  <GoalCircle
                    percentage={weeklyProgress.goalProgress || 0}
                    color="rgb(34, 197, 94)"
                    size={120}
                    currentValue={Math.round(data.goal.type === 'duration' ? weeklyProgress.duration : weeklyProgress.distance)}
                    goalValue={data.goal.target}
                    unit={data.goal.type === 'duration' ? 'min' : 'mi'}
                    title="This Week"
                    description=""
                  />
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-sm text-slate-300">Goal Type:</Label>
                    <div className="flex space-x-3">
                      <Button
                        onClick={() => updateGoal({ type: 'distance', target: data.goal.target, period: 'week' })}
                        variant={data.goal.type === 'distance' ? 'default' : 'outline'}
                        className={`flex-1 ${
                          data.goal.type === 'distance' 
                            ? 'bg-green-600 hover:bg-green-700 text-white' 
                            : 'border-slate-600 bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        Miles per week
                      </Button>
                      <Button
                        onClick={() => updateGoal({ type: 'duration', target: data.goal.target, period: 'week' })}
                        variant={data.goal.type === 'duration' ? 'default' : 'outline'}
                        className={`flex-1 ${
                          data.goal.type === 'duration' 
                            ? 'bg-green-600 hover:bg-green-700 text-white' 
                            : 'border-slate-600 bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        Minutes per week
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-sm text-slate-300">Weekly Target:</Label>
                    <Input
                      type="number"
                      value={data.goal.target}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (value > 0) {
                          updateGoal({
                            type: data.goal.type,
                            target: value,
                            period: 'week'
                          });
                        }
                      }}
                      className="fitcircle-input"
                      step="0.1"
                    />
                  </div>
                  
                  <div className="text-xs text-slate-400 bg-slate-700 rounded-xl p-3">
                    <strong>Current Week:</strong> {Math.round(data.goal.type === 'duration' ? weeklyProgress.duration : weeklyProgress.distance)}{data.goal.type === 'duration' ? ' min' : ' mi'}<br/>
                    <strong>Target:</strong> {data.goal.target}{data.goal.type === 'duration' ? ' min' : ' mi'} per week
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <Button
                    onClick={() => setIsGoalDialogOpen(false)}
                    className="flex-1 bg-slate-600 hover:bg-slate-700 text-white"
                  >
                    Done
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Main Progress Circle */}
        <div className="flex justify-center mb-8">
          <GoalCircle
            percentage={progressPercentage}
            color="rgb(34, 197, 94)"
            size={240}
            strokeWidth={16}
            currentValue={Math.round(todaysValue * 10) / 10}
            goalValue={Math.round(dailyGoalTarget * 10) / 10}
            unit={data.goal.type === 'duration' ? 'min' : 'mi'}
            title="Today's Cardio"
            description={`Goal: ${Math.round(dailyGoalTarget * 10) / 10} ${data.goal.type === 'duration' ? 'min' : 'mi'}/day`}
          />
        </div>

        {/* Weekly Progress Stats */}
        <Card className="fitcircle-card-lg mb-6">
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-3 text-center">Last 7 Days</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-400">
                  {data.goal.type === 'duration' ? formatDuration(weeklyProgress.duration) : `${weeklyProgress.distance.toFixed(1)}mi`}
                </div>
                <div className="text-sm text-slate-400">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">
                  {data.goal.type === 'duration' ? `${getLast7DaysAverage().average}min` : `${getLast7DaysAverage().average}mi`}
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
          <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700">
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
                    <DialogContent className="fitcircle-dialog">
                      <DialogHeader>
                        <DialogTitle>Add Custom Type</DialogTitle>
                        <DialogDescription>Create a new cardio type</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Type Name</Label>
                          <Input
                            value={newCustomType}
                            onChange={(e) => setNewCustomType(e.target.value)}
                            placeholder="e.g., Swimming"
                            className="fitcircle-input"
                          />
                        </div>
                        <div className="flex space-x-2">
                          <Button onClick={handleAddCustomType} className="flex-1">
                            Add Type
                          </Button>
                          <Button variant="outline" onClick={() => setIsAddCustomTypeOpen(false)}>
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

        {/* Cardio Log - Monthly Sections */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Cardio Log</h3>
          <div className="space-y-3">
            {Object.keys(monthlyLogs).length > 0 ? (
              Object.entries(monthlyLogs).map(([monthName, monthEntries]) => (
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
                          <span className="text-green-400 text-sm">{monthEntries.length} workouts</span>
                          <span className="text-slate-400">
                            {expandedMonths.has(monthName) ? '−' : '+'}
                          </span>
                        </div>
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="space-y-3 mt-2">
                    {monthEntries.map(entry => (
                      <Card key={entry.id} className="fitcircle-card ml-4">
                        <CardContent className="p-4 relative">
                          <div className="pr-16">
                            {/* Header/Title at the top */}
                            <div className="mb-3">
                              <h4 className="text-green-400 font-semibold capitalize text-lg">{entry.type}</h4>
                            </div>
                            
                            {/* Date and details organized below */}
                            <div className="space-y-2">
                              <div className="text-sm text-slate-400 font-medium">
                                {entry.date}
                              </div>
                              
                              <div className="flex items-center space-x-4 text-sm text-slate-300">
                                {entry.duration > 0 && (
                                  <div className="flex items-center space-x-1">
                                    <Clock className="w-4 h-4" />
                                    <span>{formatDuration(entry.duration)}</span>
                                  </div>
                                )}
                                {entry.distance && entry.distance > 0 && (
                                  <div className="flex items-center space-x-1">
                                    <MapPin className="w-4 h-4" />
                                    <span>{entry.distance} mi</span>
                                  </div>
                                )}
                              </div>
                              
                              {entry.notes && (
                                <div className="flex items-start space-x-1 text-sm text-slate-300">
                                  <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                  <span className="break-words">{entry.notes}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="absolute top-3 right-3 flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingEntry(entry);
                                setNewEntry({
                                  type: entry.type,
                                  duration: entry.duration.toString(),
                                  distance: entry.distance?.toString() || '',
                                  notes: entry.notes || ''
                                });
                                setIsEditDialogOpen(true);
                              }}
                              className="text-slate-400 hover:text-white p-1 h-auto"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="text-slate-400 hover:text-red-300 p-1 h-auto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
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
          <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700">
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
    </div>
  );
}