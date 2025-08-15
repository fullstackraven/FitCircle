import React from "react";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";
import { useWorkouts } from "@/hooks/use-workouts";
import { format, addMonths, subMonths } from "date-fns";

const colorClassMap: { [key: string]: string } = {
  green: 'workout-green',
  blue: 'workout-blue',
  purple: 'workout-purple',
  amber: 'workout-amber',
  red: 'workout-red',
  pink: 'workout-pink',
  cyan: 'workout-cyan',
  lime: 'workout-lime',
  orange: 'workout-orange',
  indigo: 'workout-indigo',
  emerald: 'workout-emerald',
  yellow: 'workout-yellow'
};

export function WorkoutStatistics() {
  const [, navigate] = useLocation();
  const { getMonthlyStats, getTotalStats, getIndividualWorkoutTotals } = useWorkouts();
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  const monthlyStats = getMonthlyStats(currentMonth.getFullYear(), currentMonth.getMonth()) || {
    monthlyReps: 0,
    monthlyCompletedDays: 0,
    monthlyConsistency: 0
  };
  
  const totalStats = getTotalStats() || {
    totalReps: 0,
    totalCompletedDays: 0,
    totalConsistency: 0
  };
  
  const individualWorkoutTotals = getIndividualWorkoutTotals() || [];

  return (
    <div className="p-4 max-w-3xl mx-auto min-h-screen pb-32" style={{ backgroundColor: 'hsl(222, 47%, 11%)' }}>
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate("/calendar")}
          className="text-slate-500 hover:text-white transition-colors flex items-center space-x-1"
          title="Back to Calendar"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </button>

        <h1 className="text-xl font-bold text-white">Workout Statistics</h1>
        <div className="w-[42px]" />
      </div>

      <div className="space-y-6">
        {/* All-Time Statistics */}
        <div className="bg-slate-800 rounded-xl p-6">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">All-Time Statistics</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-slate-700 rounded-xl">
              <div className="text-xl font-bold text-white mb-1">{totalStats.totalReps}</div>
              <div className="text-xs text-slate-400">Total Reps</div>
            </div>
            <div className="text-center p-4 bg-slate-700 rounded-xl">
              <div className="text-xl font-bold text-white mb-1">{totalStats.totalCompletedDays}</div>
              <div className="text-xs text-slate-400">Days Completed</div>
            </div>
            <div className="text-center p-4 bg-slate-700 rounded-xl">
              <div className="text-xl font-bold text-blue-400 mb-1">{totalStats.totalConsistency.toFixed(1)}%</div>
              <div className="text-xs text-slate-400 text-center">Consistency</div>
            </div>
          </div>
        </div>

        {/* Monthly Statistics */}
        <div className="bg-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Monthly Statistics</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="text-slate-400 hover:text-white transition p-1"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-slate-300 min-w-[120px] text-center">
                {format(currentMonth, "MMMM yyyy")}
              </span>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="text-slate-400 hover:text-white transition p-1"
              >
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-slate-700 rounded-xl">
              <div className="text-xl font-bold text-white mb-1">{monthlyStats.monthlyReps}</div>
              <div className="text-xs text-slate-400">Monthly Reps</div>
            </div>
            <div className="text-center p-4 bg-slate-700 rounded-xl">
              <div className="text-xl font-bold text-white mb-1">{monthlyStats.monthlyCompletedDays}</div>
              <div className="text-xs text-slate-400">Days Completed</div>
            </div>
            <div className="text-center p-4 bg-slate-700 rounded-xl">
              <div className="text-xl font-bold text-green-400 mb-1">{monthlyStats.monthlyConsistency.toFixed(1)}%</div>
              <div className="text-xs text-slate-400 text-center">Consistency</div>
            </div>
          </div>
        </div>

        {/* Individual Workout Totals */}
        <div className="bg-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Individual Workout Totals</h2>
          <div className="space-y-3">
            {individualWorkoutTotals.length > 0 ? (
              individualWorkoutTotals.map((workout) => (
                <div key={workout.id} className="flex items-center justify-between p-4 bg-slate-700 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full ${colorClassMap[workout.color]}`}></div>
                    <span className="text-white font-medium text-lg">{workout.name}</span>
                  </div>
                  <span className="text-white font-bold text-xl">{workout.totalReps}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-400">No workouts created yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}