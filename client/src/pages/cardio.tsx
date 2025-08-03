import React, { useState, useEffect } from 'react';
import { ChevronLeft, Target, Plus, Edit2, Trash2, Clock, MapPin, FileText, Save, X, Activity } from 'lucide-react';
import { useLocation } from 'wouter';
import { useCardio, CardioEntry } from '@/hooks/use-cardio';
import { GoalCircle } from '@/components/GoalCircle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';

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
      navigate('/?dashboard=open');
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
  const [goalForm, setGoalForm] = useState({
    type: data.goal.type,
    target: data.goal.target.toString()
  });

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

  const handleAddEntry = () => {
    if (!newEntry.type || !newEntry.duration) return;
    
    addCardioEntry(
      newEntry.type,
      parseFloat(newEntry.duration),
      newEntry.distance ? parseFloat(newEntry.distance) : undefined,
      newEntry.notes || undefined
    );
    
    resetAddForm();
    setIsAddDialogOpen(false);
  };

  const handleEditEntry = (entry: CardioEntry) => {
    setEditingEntry(entry);
    setNewEntry({
      type: entry.type,
      duration: entry.duration.toString(),
      distance: entry.distance?.toString() || '',
      notes: entry.notes || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateEntry = () => {
    if (!editingEntry || !newEntry.type || !newEntry.duration) return;
    
    updateCardioEntry(editingEntry.id, {
      type: newEntry.type,
      duration: parseFloat(newEntry.duration),
      distance: newEntry.distance ? parseFloat(newEntry.distance) : undefined,
      notes: newEntry.notes || undefined
    });
    
    resetAddForm();
    setEditingEntry(null);
    setIsEditDialogOpen(false);
  };

  const handleDeleteEntry = (id: string) => {
    if (confirm('Are you sure you want to delete this cardio entry?')) {
      deleteCardioEntry(id);
    }
  };

  const handleUpdateGoal = () => {
    if (!goalForm.target) return;
    
    updateGoal({
      type: goalForm.type as 'duration' | 'distance',
      target: parseFloat(goalForm.target),
      period: 'week'
    });
    
    setIsGoalDialogOpen(false);
  };

  const handleAddCustomType = () => {
    if (!newCustomType.trim()) return;
    
    addCustomType(newCustomType);
    setNewCustomType('');
    setIsAddCustomTypeOpen(false);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  return (
    <div className="min-h-screen text-white pb-32" style={{ backgroundColor: 'hsl(222, 47%, 11%)' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button
          onClick={handleBack}
          className="flex items-center space-x-2 text-slate-300 hover:text-white"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        <h1 className="text-xl font-semibold">Cardio</h1>
        <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center space-x-1 text-slate-300 hover:text-white">
              <Target className="w-5 h-5" />
              <span>Goal</span>
            </button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 text-white border-slate-700">
            <DialogHeader>
              <DialogTitle>Cardio Goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Goal Circle */}
              <div className="flex justify-center">
                <GoalCircle
                  percentage={last7DaysAverage.progressToGoal}
                  color="rgb(34, 197, 94)"
                  size={80}
                  currentValue={Math.round(last7DaysAverage.average)}
                  goalValue={Math.round(last7DaysAverage.dailyTarget)}
                  unit={data.goal.type === 'duration' ? 'min' : 'mi'}
                  title="7-Day Average"
                  description=""
                />
              </div>
              
              <div className="space-y-3">
                <Label>Goal Type</Label>
                <Select value={goalForm.type} onValueChange={(value) => setGoalForm({...goalForm, type: value})}>
                  <SelectTrigger className="bg-slate-700 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="duration">Minutes per week</SelectItem>
                    <SelectItem value="distance">Miles per week</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <Label>Weekly Target</Label>
                <Input
                  type="number"
                  value={goalForm.target}
                  onChange={(e) => setGoalForm({...goalForm, target: e.target.value})}
                  className="bg-slate-700 border-slate-600"
                  placeholder={goalForm.type === 'duration' ? 'Minutes' : 'Miles'}
                />
              </div>
              
              <Button onClick={handleUpdateGoal} className="w-full bg-green-600 hover:bg-green-700">
                Update Goal
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="p-4 space-y-6">
        {/* Main Progress Circle */}
        <div className="flex justify-center">
          <GoalCircle
            percentage={progressPercentage}
            color="rgb(34, 197, 94)"
            size={200}
            currentValue={Math.round(todaysValue * 10) / 10}
            goalValue={Math.round(dailyGoalTarget * 10) / 10}
            unit={data.goal.type === 'duration' ? 'min' : 'mi'}
            title="Today's Cardio"
            description={`Goal: ${Math.round(dailyGoalTarget * 10) / 10} ${data.goal.type === 'duration' ? 'min' : 'mi'}/day`}
          />
        </div>

        {/* Weekly Progress Stats */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-3 text-center">This Week</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-400">
                  {data.goal.type === 'duration' ? formatDuration(weeklyProgress.duration) : `${weeklyProgress.distance.toFixed(1)}mi`}
                </div>
                <div className="text-sm text-slate-400">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">{weeklyProgress.goalProgress.toFixed(1)}%</div>
                <div className="text-sm text-slate-400">Goal Progress</div>
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
            <Button className="w-full bg-green-600 hover:bg-green-700 h-12">
              <Plus className="w-5 h-5 mr-2" />
              Log Cardio
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 text-white border-slate-700">
            <DialogHeader>
              <DialogTitle>Add Cardio Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Cardio Type</Label>
                <div className="flex space-x-2">
                  <Select value={newEntry.type} onValueChange={(value) => setNewEntry({...newEntry, type: value})}>
                    <SelectTrigger className="flex-1 bg-slate-700 border-slate-600">
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
                      <Button variant="outline" size="sm" className="border-slate-600">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-800 text-white border-slate-700">
                      <DialogHeader>
                        <DialogTitle>Add Custom Cardio Type</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          value={newCustomType}
                          onChange={(e) => setNewCustomType(e.target.value)}
                          placeholder="Enter custom cardio type"
                          className="bg-slate-700 border-slate-600"
                        />
                        <div className="flex space-x-2">
                          <Button onClick={handleAddCustomType} className="flex-1">Add</Button>
                          <Button variant="outline" onClick={() => setIsAddCustomTypeOpen(false)}>Cancel</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={newEntry.duration}
                  onChange={(e) => setNewEntry({...newEntry, duration: e.target.value})}
                  className="bg-slate-700 border-slate-600"
                  placeholder="30"
                />
              </div>

              <div className="space-y-3">
                <Label>Distance (miles) - Optional</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={newEntry.distance}
                  onChange={(e) => setNewEntry({...newEntry, distance: e.target.value})}
                  className="bg-slate-700 border-slate-600"
                  placeholder="3.1"
                />
              </div>

              <div className="space-y-3">
                <Label>Notes - Optional</Label>
                <Textarea
                  value={newEntry.notes}
                  onChange={(e) => setNewEntry({...newEntry, notes: e.target.value})}
                  className="bg-slate-700 border-slate-600"
                  placeholder="How did it feel?"
                  rows={2}
                />
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleAddEntry} className="flex-1 bg-green-600 hover:bg-green-700">
                  <Save className="w-4 h-4 mr-2" />
                  Add Entry
                </Button>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Cardio History */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Recent Activity</h3>
          {data.entries.length === 0 ? (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6 text-center text-slate-400">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No cardio entries yet</p>
                <p className="text-sm">Start logging your cardio workouts!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {data.entries.slice(0, 10).map((entry) => (
                <Card key={entry.id} className="bg-slate-800 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-green-400 capitalize">{entry.type}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-300">{entry.date}</span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-slate-400">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatDuration(entry.duration)}</span>
                          </div>
                          {entry.distance && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-3 h-3" />
                              <span>{entry.distance} mi</span>
                            </div>
                          )}
                          {entry.notes && (
                            <div className="flex items-center space-x-1">
                              <FileText className="w-3 h-3" />
                              <span className="truncate max-w-32">{entry.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditEntry(entry)}
                          className="text-slate-400 hover:text-blue-400 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-slate-800 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle>Edit Cardio Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <Label>Cardio Type</Label>
              <Select value={newEntry.type} onValueChange={(value) => setNewEntry({...newEntry, type: value})}>
                <SelectTrigger className="bg-slate-700 border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {cardioTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                value={newEntry.duration}
                onChange={(e) => setNewEntry({...newEntry, duration: e.target.value})}
                className="bg-slate-700 border-slate-600"
              />
            </div>

            <div className="space-y-3">
              <Label>Distance (miles) - Optional</Label>
              <Input
                type="number"
                step="0.1"
                value={newEntry.distance}
                onChange={(e) => setNewEntry({...newEntry, distance: e.target.value})}
                className="bg-slate-700 border-slate-600"
              />
            </div>

            <div className="space-y-3">
              <Label>Notes - Optional</Label>
              <Textarea
                value={newEntry.notes}
                onChange={(e) => setNewEntry({...newEntry, notes: e.target.value})}
                className="bg-slate-700 border-slate-600"
                rows={2}
              />
            </div>

            <div className="flex space-x-2">
              <Button onClick={handleUpdateEntry} className="flex-1 bg-blue-600 hover:bg-blue-700">
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
  );
}