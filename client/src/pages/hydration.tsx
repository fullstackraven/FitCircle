import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Target, X, Edit2, Trash2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { useHydration, HydrationLog, HydrationEntry } from '@/hooks/use-hydration';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { GoalCircle } from '@/components/GoalCircle';
import { groupLogsByMonth } from '@/lib/date-utils';



export default function HydrationPage() {
  const [, navigate] = useLocation();
  
  // Check if we came from dashboard
  const fromDashboard = new URLSearchParams(window.location.search).get('from') === 'dashboard';
  
  const handleBack = () => {
    navigate('/wellness');
  };
  const { 
    dailyGoalOz, 
    currentDayOz, 
    progressPercentage, 
    addHydration, 
    editHydrationEntry,
    deleteHydrationEntry,
    setDailyGoal, 
    getRecentLogs, 
    getAllLogs,
    getTodayEntries,
    isGoalReached,
    getLast10LogsProgress,
    getAllTimeGoalPercentage
  } = useHydration();

  const [addAmount, setAddAmount] = useState('');
  const [selectedLiquidType, setSelectedLiquidType] = useState('Water');
  const [customLiquidType, setCustomLiquidType] = useState('');
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [newGoal, setNewGoal] = useState(dailyGoalOz.toString());
  const [isHydrationDialogOpen, setIsHydrationDialogOpen] = useState(false);
  const [customLiquidFocused, setCustomLiquidFocused] = useState(false);
  const [addAmountFocused, setAddAmountFocused] = useState(false);
  const [goalFocused, setGoalFocused] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<HydrationEntry | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editLiquidType, setEditLiquidType] = useState('Water');

  // Load goal from Goals page when it changes
  useEffect(() => {
    const hydrationGoalFromGoalsPage = localStorage.getItem('fitcircle_goal_hydration');
    if (hydrationGoalFromGoalsPage) {
      const goalValue = parseFloat(hydrationGoalFromGoalsPage);
      if (goalValue > 0 && goalValue !== dailyGoalOz) {
        setDailyGoal(goalValue);
        setNewGoal(goalValue.toString());
      }
    }
  }, [dailyGoalOz, setDailyGoal]);

  const liquidTypes = ['Water', 'Coffee', 'Tea', 'Custom'];

  // const handleAddHydration = () => {
  //   const amount = parseFloat(addAmount);
  //   if (amount > 0) {
  //     const liquidType = selectedLiquidType === 'Custom' ? customLiquidType || 'Custom' : selectedLiquidType;
  //     addHydration(amount, liquidType);
  //     // Reset custom input after adding
  //     if (selectedLiquidType === 'Custom') {
  //       setCustomLiquidType('');
  //     }
  //   }
  // };
  const handleAddHydration = () => {
    const amount = parseFloat(addAmount);
    if (amount > 0) {
      const liquidType = selectedLiquidType === 'Custom' ? customLiquidType || 'Custom' : selectedLiquidType;
      addHydration(amount, liquidType);

      // Reset custom input and entered amount after adding
      if (selectedLiquidType === 'Custom') {
        setCustomLiquidType('');
      }
      setAddAmount(''); // ← this resets the input field
    }
  };

  const handleQuickAdd = (amount: number) => {
    const liquidType = selectedLiquidType === 'Custom' ? customLiquidType || 'Custom' : selectedLiquidType;
    addHydration(amount, liquidType);
    // Reset custom input after adding
    if (selectedLiquidType === 'Custom') {
      setCustomLiquidType('');
    }
  };

  const handleSetGoal = () => {
    const goal = parseFloat(newGoal);
    if (goal > 0) {
      setDailyGoal(goal);
      // Cross-page sync: Update Goals page storage
      localStorage.setItem('fitcircle_goal_hydration', goal.toString());
      
      // ALSO update any other hydration goal locations for full compatibility
      const existingGoals = localStorage.getItem('fitcircle_goals');
      let goalsObject = {};
      if (existingGoals) {
        try {
          goalsObject = JSON.parse(existingGoals);
        } catch (e) {
          goalsObject = {};
        }
      }
      goalsObject = {
        ...goalsObject,
        hydrationOz: goal
      };
      localStorage.setItem('fitcircle_goals', JSON.stringify(goalsObject));
      
      setIsGoalModalOpen(false);
    }
  };

  const handleEditEntry = (entry: HydrationEntry) => {
    setEditingEntry(entry);
    setEditAmount(entry.amount.toString());
    setEditLiquidType(entry.liquidType);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingEntry || !editAmount || parseFloat(editAmount) <= 0) return;
    
    editHydrationEntry(editingEntry.id, parseFloat(editAmount), editLiquidType);
    setIsEditDialogOpen(false);
    setEditingEntry(null);
    setEditAmount('');
    setEditLiquidType('Water');
  };

  const handleDeleteEntry = (entry: HydrationEntry) => {
    if (confirm(`Delete ${entry.amount}oz of ${entry.liquidType} from ${entry.time}?`)) {
      deleteHydrationEntry(entry.id);
    }
  };

  const quickAddAmounts = [12, 16, 24, 34, 36];
  const recentLogs = getAllLogs();
  const todayEntries = getTodayEntries();
  const monthlyLogs = groupLogsByMonth(recentLogs.reduce((acc, log) => ({ ...acc, [log.date]: log }), {})) as { [monthName: string]: HydrationLog[] };

  // Calculate progress ring
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

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
          <h1 className="fitcircle-page-title">Hydration</h1>
          <button
            onClick={() => setIsGoalModalOpen(true)}
            className="flex items-center space-x-1 fitcircle-text-muted hover:text-white transition-colors"
          >
            <Target className="w-5 h-5" />
            <span>Goal</span>
          </button>
        </div>

        <div className="space-y-8">
          {/* Progress Circle */}
          <div className="flex justify-center">
          <GoalCircle
            percentage={progressPercentage}
            color="rgb(59, 130, 246)"
            size={240}
            strokeWidth={16}
            currentValue={currentDayOz}
            goalValue={dailyGoalOz}
            unit="oz"
            title="Today's Hydration"
            description={`Goal: ${dailyGoalOz}oz/day`}
          />
          </div>

          {isGoalReached && (
          <div className="text-green-400 font-medium text-center -mt-4">
            🎉 Daily goal achieved!
          </div>
          )}

          {/* Last 10 Logs Progress Stats */}
          <Card className="fitcircle-card-lg">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-3 text-center">Last 10 Logs</h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-400">
                    {getLast10LogsProgress().totalOz}oz
                  </div>
                  <div className="text-sm text-slate-400">Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-400">
                    {getLast10LogsProgress().averageOz}oz
                  </div>
                  <div className="text-sm text-slate-400">Daily Average</div>
                </div>
              </div>
              {getLast10LogsProgress().remaining > 0 && (
                <div className="mt-3 text-center text-slate-300">
                  <span className="text-sm">
                    {getLast10LogsProgress().remaining} ounces remaining
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add Liquid Button */}
          <div className="mb-8">
            <Button
              onClick={() => setIsHydrationDialogOpen(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Liquid</span>
            </Button>
          </div>

          {/* Today's Entries */}
          {todayEntries.length > 0 && (
            <div className="fitcircle-card-lg">
              <h3 className="text-lg font-semibold mb-3">Today's Intake</h3>
              <div className="space-y-2">
                {todayEntries.slice().reverse().map((entry: HydrationEntry, index: number) => (
                  <div key={entry.id} className="flex justify-between items-center text-sm relative">
                    <div className="flex items-center space-x-3">
                      <span className="text-slate-400">{entry.time}</span>
                      <span className="text-slate-300">{entry.liquidType || 'Water'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-blue-400 font-medium">{entry.amount}oz</span>
                      <div className="flex items-center space-x-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditEntry(entry)}
                          className="text-slate-400 hover:text-white p-1 h-auto"
                          data-testid={`button-edit-entry-${entry.id}`}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteEntry(entry)}
                          className="text-slate-400 hover:text-red-300 p-1 h-auto"
                          data-testid={`button-delete-entry-${entry.id}`}
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

          {/* Hydration Log - Monthly Sections */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Hydration Log</h3>
            <div className="space-y-3">
              {Object.keys(monthlyLogs).length > 0 ? (
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
                            <span className="text-blue-400 text-sm">{monthLogs.length} days</span>
                            <span className="text-slate-400">
                              {expandedMonths.has(monthName) ? '−' : '+'}
                            </span>
                          </div>
                        </div>
                      </button>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="space-y-2 mt-2">
                      {monthLogs.map((log: HydrationLog) => (
                        <div key={log.date} className="fitcircle-card ml-4">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-white font-medium">
                              {new Date(log.date + 'T00:00:00').toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </span>
                            <span className="text-blue-400 font-semibold">
                              {log.totalOz}oz
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mb-2">
                            {log.entries.length} entries
                          </div>
                          
                          {/* Show detailed entries for this day */}
                          <div className="space-y-1">
                            {(expandedDays.has(log.date) ? log.entries : log.entries.slice(0, 3)).map((entry: HydrationEntry, index: number) => (
                              <div key={index} className="flex justify-between items-center text-xs">
                                <span className="text-slate-500">{entry.time}</span>
                                <div className="flex items-center space-x-1">
                                  <span className="text-slate-400">{entry.liquidType || 'Water'}</span>
                                  <span className="text-slate-300">{entry.amount}oz</span>
                                </div>
                              </div>
                            ))}
                            {log.entries.length > 3 && (
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
                                  : `+${log.entries.length - 3} more entries`
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
                <div className="text-center text-slate-500 py-4">
                  No hydration history yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Goal Setting Modal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Hydration Goal</h3>
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
                color="rgb(59, 130, 246)"
                size={120}
                currentValue={Math.round(currentDayOz)}
                goalValue={parseFloat(newGoal) || dailyGoalOz}
                unit="oz"
                title="Daily Hydration"
                description="All-time average"
              />
            </div>

            {/* Goal Input Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="goal" className="text-slate-300">
                  Daily goal (oz)
                </Label>
                <Input
                  id="goal"
                  type="number"
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  onFocus={() => setGoalFocused(true)}
                  onBlur={() => setGoalFocused(false)}
                  className="bg-slate-700 border-slate-600 text-white mt-1"
                  placeholder={goalFocused ? "" : "Enter daily hydration goal"}
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

      {/* Add Liquid Dialog */}
      <Dialog open={isHydrationDialogOpen} onOpenChange={setIsHydrationDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-sm mx-auto rounded-2xl">
          <DialogTitle className="text-lg font-semibold text-center">Add Liquid</DialogTitle>
          <DialogDescription className="sr-only">
            Add liquid consumption to your hydration tracking
          </DialogDescription>
          <div className="space-y-4">
            {/* Liquid Type Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-slate-300">Liquid Type</Label>
              <div className="grid grid-cols-4 gap-2">
                {liquidTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => setSelectedLiquidType(type)}
                    className={`py-2 px-3 rounded-xl text-sm font-medium transition-colors ${
                      selectedLiquidType === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              
              {/* Custom Liquid Type Input */}
              {selectedLiquidType === 'Custom' && (
                <Input
                  type="text"
                  value={customLiquidType}
                  onChange={(e) => setCustomLiquidType(e.target.value)}
                  onFocus={() => setCustomLiquidFocused(true)}
                  onBlur={() => setCustomLiquidFocused(false)}
                  placeholder={customLiquidFocused ? "" : "Enter liquid type"}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              )}
            </div>
            
            {/* Quick Add Buttons */}
            <div className="grid grid-cols-5 gap-2">
              {quickAddAmounts.map(amount => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleQuickAdd(amount);
                    setIsHydrationDialogOpen(false);
                  }}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  {amount}oz
                </Button>
              ))}
            </div>

            {/* Custom Amount */}
            <div className="flex space-x-2">
              <div className="flex-1">
                <Input
                  type="number"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  onFocus={() => setAddAmountFocused(true)}
                  onBlur={() => setAddAmountFocused(false)}
                  placeholder={addAmountFocused ? "" : "Enter amount"}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <Button
                onClick={() => {
                  handleAddHydration();
                  setIsHydrationDialogOpen(false);
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Entry Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-sm mx-auto rounded-2xl">
          <DialogTitle className="text-lg font-semibold text-center">Edit Entry</DialogTitle>
          <DialogDescription className="sr-only">
            Edit your hydration entry
          </DialogDescription>
          <div className="space-y-4">
            {/* Liquid Type Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-slate-300">Liquid Type</Label>
              <div className="grid grid-cols-4 gap-2">
                {liquidTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => setEditLiquidType(type)}
                    className={`py-2 px-3 rounded-xl text-sm font-medium transition-colors ${
                      editLiquidType === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              
              {/* Custom Liquid Type Input */}
              {editLiquidType === 'Custom' && (
                <Input
                  type="text"
                  value={editLiquidType === 'Custom' ? editLiquidType : ''}
                  onChange={(e) => setEditLiquidType(e.target.value)}
                  placeholder="Enter liquid type"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              )}
            </div>
            
            {/* Amount Input */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-slate-300">Amount (oz)</Label>
              <Input
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                placeholder="Enter amount"
                className="bg-slate-700 border-slate-600 text-white"
                data-testid="input-edit-amount"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                data-testid="button-save-edit"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}