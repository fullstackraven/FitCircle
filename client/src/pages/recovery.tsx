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
    <div className="p-4 max-w-3xl mx-auto min-h-dvh" style={{ backgroundColor: 'var(--page-background)', paddingBottom: 'var(--bottom-nav-padding)' }}>
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handleBack}
          className="text-muted-foreground hover:text-strong transition-colors"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h1 className="text-xl font-bold text-strong">Recovery</h1>
        <div className="w-5" />
      </div>

      <div className="space-y-6">
        {/* Recovery Stats */}
        <div className="glass-panel bg-surface rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Heart className="w-6 h-6 text-feature-orange" />
            <h2 className="text-xl font-semibold text-strong">Recovery Statistics</h2>
          </div>
          
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 bg-surface-secondary rounded-xl">
              <div className="text-lg font-bold text-feature-orange">{recoveryStats.totalRecoveryDays}</div>
              <div className="text-xs text-muted-foreground">Recovery Days</div>
            </div>
            <div className="text-center p-3 bg-surface-secondary rounded-xl">
              <div className="text-lg font-bold text-strong">{recoveryStats.totalWorkoutDays}</div>
              <div className="text-xs text-muted-foreground">Workout Days</div>
            </div>
            <div className="text-center p-3 bg-surface-secondary rounded-xl">
              <div className="text-lg font-bold text-feature-orange">{recoveryStats.recoveryPercentage.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">Recovery Rate</div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-supporting mb-4">
              Mark days as recovery days to maintain consistency without requiring workout completion.
            </p>
          </div>
        </div>

        {/* Recent Recovery Days */}
        <div className="glass-panel bg-surface rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Calendar className="w-5 h-5 text-feature-orange" />
            <h3 className="text-lg font-semibold text-strong">Recent Recovery Days</h3>
          </div>
          
          {data.recoveryDays.length > 0 ? (
            <div className="space-y-2">
              {data.recoveryDays
                .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                .slice(0, 10)
                .map((date) => (
                  <div key={date} className="flex items-center justify-between p-3 bg-surface-secondary rounded-xl">
                    <span className="text-strong font-medium">
                      {format(new Date(date + 'T00:00:00'), "MMMM d, yyyy")}
                    </span>
                    <span className="text-feature-orange text-sm">Recovery Day</span>
                  </div>
                ))}
              {data.recoveryDays.length > 10 && (
                <p className="text-center text-muted-foreground text-sm mt-3">
                  And {data.recoveryDays.length - 10} more recovery days...
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No recovery days marked yet</p>
              <p className="text-sm text-dim mt-2">
                Tap any calendar day to mark it as a recovery day
              </p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="glass-panel bg-surface rounded-xl p-4">
          <h3 className="text-lg font-semibold text-strong mb-3">How to Mark Recovery Days</h3>
          <div className="space-y-2 text-sm text-supporting">
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