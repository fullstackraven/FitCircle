import { useState } from 'react';
import { ChevronLeft, Target, Edit } from 'lucide-react';
import { useLocation } from 'wouter';
import { useGoals } from '@/hooks/use-goals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function GoalsPage() {
  const [, navigate] = useLocation();
  const { goals, updateGoal, progress } = useGoals();
  
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [tempValues, setTempValues] = useState(goals);

  const handleEdit = (goalType: string) => {
    setEditingGoal(goalType);
    setTempValues(goals);
  };

  const handleSave = (goalType: keyof typeof goals) => {
    updateGoal(goalType, tempValues[goalType]);
    setEditingGoal(null);
  };

  const handleCancel = () => {
    setTempValues(goals);
    setEditingGoal(null);
  };

  const goalItems = [
    {
      key: 'hydrationOz' as keyof typeof goals,
      title: 'Daily Hydration',
      unit: 'oz',
      icon: '💧',
      description: 'Daily water intake goal',
      progress: progress.hydrationProgress,
      color: 'bg-blue-600'
    },
    {
      key: 'meditationMinutes' as keyof typeof goals,
      title: 'Daily Meditation',
      unit: 'min',
      icon: '🧘‍♀️',
      description: '7-day average meditation time',
      progress: progress.meditationProgress,
      color: 'bg-purple-600'
    },
    {
      key: 'fastingHours' as keyof typeof goals,
      title: 'Intermittent Fasting',
      unit: 'hrs',
      icon: '⏱️',
      description: '7-day average fasting duration',
      progress: progress.fastingProgress,
      color: 'bg-orange-600'
    },
    {
      key: 'weightLbs' as keyof typeof goals,
      title: 'Target Weight',
      unit: 'lbs',
      icon: '⚖️',
      description: 'Body weight target',
      progress: progress.weightProgress,
      color: 'bg-green-600'
    }
  ];

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: 'hsl(222, 47%, 11%)' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-slate-300 hover:text-white"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        <h1 className="text-xl font-semibold">Goals</h1>
        <div className="w-16"></div>
      </div>

      <div className="p-6">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Your Goals</h2>
          <p className="text-slate-400">Set and track your daily wellness targets</p>
        </div>

        {/* Goals List */}
        <div className="space-y-6">
          {goalItems.map((item) => (
            <div key={item.key} className="bg-slate-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                    <p className="text-sm text-slate-400">{item.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleEdit(item.key)}
                  className="text-slate-400 hover:text-white"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>

              {editingGoal === item.key ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor={item.key} className="text-slate-300">
                      Goal ({item.unit})
                    </Label>
                    <Input
                      id={item.key}
                      type="number"
                      value={tempValues[item.key]}
                      onChange={(e) => setTempValues(prev => ({
                        ...prev,
                        [item.key]: parseFloat(e.target.value) || 0
                      }))}
                      className="bg-slate-700 border-slate-600 text-white mt-1"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleSave(item.key)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-white">
                      {goals[item.key]} {item.unit}
                    </span>
                    <span className="text-sm text-slate-400">
                      {Math.round(item.progress)}% achieved
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-700 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${item.color}`}
                      style={{ width: `${Math.min(item.progress, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Tips Section */}
        <div className="mt-8 bg-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3 text-white">💡 Goal Setting Tips</h3>
          <ul className="text-sm text-slate-400 space-y-2">
            <li>• Set realistic and achievable daily targets</li>
            <li>• Progress bars show recent performance vs your goals</li>
            <li>• Weight goal shows how close you are to your target</li>
            <li>• Meditation and fasting show 7-day averages</li>
          </ul>
        </div>
      </div>
    </div>
  );
}