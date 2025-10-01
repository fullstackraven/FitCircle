import React from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Heart, Calendar } from "lucide-react";
import { useRecovery } from "@/hooks/use-recovery";
import { useWorkouts } from "@/hooks/use-workouts";
import { format } from "date-fns";

export default function RecoveryPage() {
  const [, navigate] = useLocation();
  const { getRecoveryStats, data } = useRecovery();
  const { getTotalStats } = useWorkouts();
  
  // Check if we came from wellness page
  const urlParams = new URLSearchParams(window.location.search);
  const fromWellness = urlParams.get('from') === 'wellness';
  
  const handleBack = () => {
    if (fromWellness) {
      navigate('/wellness');
    } else {
      navigate('/calendar');
    }
  };
  
  // Get the same total stats as the statistics page
  const totalStats = getTotalStats();
  const recoveryStats = getRecoveryStats(totalStats?.totalCompletedDays);

  return (
    <div className="p-4 max-w-3xl mx-auto min-h-dvh" style={{ backgroundColor: 'hsl(222, 47%, 11%)', paddingBottom: 'var(--bottom-nav-padding)' }}>
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handleBack}
          className="text-slate-400 hover:text-white transition-colors"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h1 className="text-xl font-bold text-white">Recovery</h1>
        <div className="w-5" />
      </div>

      <div className="space-y-6">
        {/* Recovery Stats */}
        <div className="bg-slate-800 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Heart className="w-6 h-6 text-orange-400" />
            <h2 className="text-xl font-semibold text-white">Recovery Statistics</h2>
          </div>
          
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 bg-slate-700 rounded-xl">
              <div className="text-lg font-bold text-orange-400">{recoveryStats.totalRecoveryDays}</div>
              <div className="text-xs text-slate-400">Recovery Days</div>
            </div>
            <div className="text-center p-3 bg-slate-700 rounded-xl">
              <div className="text-lg font-bold text-white">{recoveryStats.totalWorkoutDays}</div>
              <div className="text-xs text-slate-400">Workout Days</div>
            </div>
            <div className="text-center p-3 bg-slate-700 rounded-xl">
              <div className="text-lg font-bold text-orange-400">{recoveryStats.recoveryPercentage.toFixed(1)}%</div>
              <div className="text-xs text-slate-400">Recovery Rate</div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-slate-300 mb-4">
              Mark days as recovery days to maintain consistency without requiring workout completion.
            </p>
          </div>
        </div>

        {/* Recent Recovery Days */}
        <div className="bg-slate-800 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Calendar className="w-5 h-5 text-orange-400" />
            <h3 className="text-lg font-semibold text-white">Recent Recovery Days</h3>
          </div>
          
          {data.recoveryDays.length > 0 ? (
            <div className="space-y-2">
              {data.recoveryDays
                .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                .slice(0, 10)
                .map((date) => (
                  <div key={date} className="flex items-center justify-between p-3 bg-slate-700 rounded-xl">
                    <span className="text-white font-medium">
                      {format(new Date(date + 'T00:00:00'), "MMMM d, yyyy")}
                    </span>
                    <span className="text-orange-400 text-sm">Recovery Day</span>
                  </div>
                ))}
              {data.recoveryDays.length > 10 && (
                <p className="text-center text-slate-400 text-sm mt-3">
                  And {data.recoveryDays.length - 10} more recovery days...
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-slate-400">No recovery days marked yet</p>
              <p className="text-sm text-slate-500 mt-2">
                Tap any calendar day to mark it as a recovery day
              </p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-slate-800 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-white mb-3">How to Mark Recovery Days</h3>
          <div className="space-y-2 text-sm text-slate-300">
            <p>• Go back to the Calendar page</p>
            <p>• Tap any day to open the Dynamic Overview</p>
            <p>• Use the Recovery toggle to mark/unmark days</p>
            <p>• Recovery days count toward consistency without requiring workouts</p>
          </div>
        </div>
      </div>
    </div>
  );
}