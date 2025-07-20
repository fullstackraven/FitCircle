import { useState } from 'react';
import { ChevronLeft, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { useLocation } from 'wouter';
import { useHydration } from '@/hooks/use-hydration';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function HydrationPage() {
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
  const { 
    dailyGoalOz, 
    currentDayOz, 
    progressPercentage, 
    addHydration, 
    setDailyGoal, 
    getRecentLogs, 
    getTodayEntries,
    isGoalReached 
  } = useHydration();

  const [addAmount, setAddAmount] = useState('8');
  const [selectedLiquidType, setSelectedLiquidType] = useState('Water');
  const [customLiquidType, setCustomLiquidType] = useState('');
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [newGoal, setNewGoal] = useState(dailyGoalOz.toString());
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const liquidTypes = ['Water', 'Coffee', 'Tea', 'Custom'];

  const handleAddHydration = () => {
    const amount = parseFloat(addAmount);
    if (amount > 0) {
      const liquidType = selectedLiquidType === 'Custom' ? customLiquidType || 'Custom' : selectedLiquidType;
      addHydration(amount, liquidType);
      // Reset custom input after adding
      if (selectedLiquidType === 'Custom') {
        setCustomLiquidType('');
      }
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
      // Also update goals page to keep in sync
      localStorage.setItem('fitcircle_goal_hydration', goal.toString());
      setIsGoalModalOpen(false);
    }
  };

  const quickAddAmounts = [4, 8, 12, 16, 20];
  const recentLogs = getRecentLogs();
  const todayEntries = getTodayEntries();

  // Calculate progress ring
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: 'hsl(222, 47%, 11%)' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <button
          onClick={handleBack}
          className="flex items-center space-x-2 text-slate-300 hover:text-white"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        <h1 className="text-xl font-semibold">Hydration</h1>
        <button
          onClick={() => setIsGoalModalOpen(true)}
          className="text-slate-300 hover:text-white text-sm"
        >
          Goal
        </button>
      </div>

      <div className="p-6 space-y-8">
        {/* Progress Circle */}
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <svg className="transform -rotate-90" width="280" height="280">
              {/* Background circle */}
              <circle
                cx="140"
                cy="140"
                r="120"
                stroke="rgb(71, 85, 105)"
                strokeWidth="12"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="140"
                cy="140"
                r="120"
                stroke="rgb(59, 130, 246)"
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500 ease-out"
              />
            </svg>
            
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-4xl font-bold text-white">
                {currentDayOz}<span className="text-lg text-slate-400">oz</span>
              </div>
              <div className="text-sm text-slate-400">of {dailyGoalOz}oz</div>
              <div className="text-xs text-slate-500 mt-1">
                {Math.round(progressPercentage)}% complete
              </div>
            </div>
          </div>

          {isGoalReached && (
            <div className="text-green-400 font-medium text-center">
              🎉 Daily goal achieved!
            </div>
          )}
        </div>

        {/* Add Hydration Controls */}
        <div className="bg-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold">Add Liquid</h2>
          
          {/* Liquid Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-slate-300">Liquid Type</Label>
            <div className="grid grid-cols-4 gap-2">
              {liquidTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedLiquidType(type)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
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
                placeholder="Enter liquid type"
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
                onClick={() => handleQuickAdd(amount)}
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
                placeholder="Enter amount"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <Button
              onClick={handleAddHydration}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        </div>

        {/* Today's Entries */}
        {todayEntries.length > 0 && (
          <div className="bg-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-3">Today's Intake</h3>
            <div className="space-y-2">
              {todayEntries.slice().reverse().map((entry, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">{entry.time}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-300">{entry.liquidType || 'Water'}</span>
                    <span className="text-blue-400">{entry.amount}oz</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History */}
        <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between text-slate-300 hover:text-white">
              <span>Hydration History</span>
              {isHistoryOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-4">
            {recentLogs.length > 0 ? (
              recentLogs.map((log) => (
                <div key={log.date} className="bg-slate-800 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-white font-medium">
                      {new Date(log.date).toLocaleDateString('en-US', { 
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
                    {log.entries.slice(0, 3).map((entry, index) => (
                      <div key={index} className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">{entry.time}</span>
                        <div className="flex items-center space-x-1">
                          <span className="text-slate-400">{entry.liquidType || 'Water'}</span>
                          <span className="text-slate-300">{entry.amount}oz</span>
                        </div>
                      </div>
                    ))}
                    {log.entries.length > 3 && (
                      <div className="text-xs text-slate-500 text-center mt-1">
                        +{log.entries.length - 3} more entries
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-slate-500 py-4">
                No hydration history yet
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Goal Setting Modal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4">Set Daily Goal</h3>
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
                  className="bg-slate-700 border-slate-600 text-white mt-1"
                />
              </div>
              <div className="flex space-x-3">
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