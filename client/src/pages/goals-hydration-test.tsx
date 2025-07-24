import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { useHydration } from '@/hooks/use-hydration';
import { GoalCircle } from '@/components/GoalCircle';

export default function GoalsHydrationTest() {
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
    progressPercentage
  } = useHydration();

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
        <h1 className="text-xl font-semibold">Goals Test - Hydration Only</h1>
        <div className="w-16"></div>
      </div>

      <div className="p-4">
        <div className="bg-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Testing Goal Circle (Same as Hydration Modal)</h2>
          
          <div className="flex justify-center">
            <GoalCircle
              percentage={progressPercentage}
              color="rgb(59, 130, 246)"
              size={120}
              currentValue={Math.round(currentDayOz)}
              goalValue={dailyGoalOz}
              unit="oz"
              title="Daily Hydration"
              description="Today's progress"
            />
          </div>
        </div>
      </div>
    </div>
  );
}