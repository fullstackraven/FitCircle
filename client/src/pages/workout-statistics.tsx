import React from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { useLocation } from "wouter";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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

function StatisticMetrics({ reps, completedDays, consistency, repsLabel, consistencyLabel, accent }: {
  reps: number;
  completedDays: number;
  consistency: number;
  repsLabel: string;
  consistencyLabel: string;
  accent: 'blue' | 'green';
}) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
      <div className="min-w-0 flex flex-col gap-1">
        <dt className="order-2 text-sm text-muted-foreground">{repsLabel}</dt>
        <dd className="order-1 type-metric text-[clamp(1.5rem,7vw,2.5rem)] font-bold tracking-tight text-strong break-all">{reps.toLocaleString()}</dd>
      </div>
      <div className="min-w-0 flex flex-col gap-1">
        <dt className="order-2 text-sm text-muted-foreground">Days Completed</dt>
        <dd className="order-1 type-metric text-[clamp(1.5rem,7vw,2.5rem)] font-bold tracking-tight text-strong break-all">{completedDays.toLocaleString()}</dd>
      </div>
      <div className="col-span-2 border-t border-control/50 pt-3">
        <dt className="text-sm text-muted-foreground mb-1">{consistencyLabel}</dt>
        <dd className={accent === 'blue' ? 'text-feature-blue' : 'text-accent-text'}>
          <span className="type-metric text-2xl sm:text-3xl font-bold">{consistency.toFixed(1)}%</span>
          <progress className="statistics-progress block w-full h-2 mt-3" max={100} value={consistency} aria-label={consistencyLabel} aria-valuetext={`${consistency.toFixed(1)}%`} />
        </dd>
      </div>
    </dl>
  );
}

export function WorkoutStatistics() {
  const [, navigate] = useLocation();
  const { getMonthlyStats, getTotalStats, getIndividualWorkoutTotals } = useWorkouts();
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [totalsOpen, setTotalsOpen] = React.useState(false);

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
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-5">
        <button
          onClick={() => navigate("/calendar")}
          className="min-h-11 min-w-11 flex items-center justify-center text-muted-foreground hover:text-strong transition-colors"
          title="Back to Calendar"
        >
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
        </button>
        <h1 className="min-w-0 text-2xl sm:text-3xl font-bold text-strong tracking-tight">Workout Statistics</h1>
      </div>

      <div className="space-y-4">
        <section aria-labelledby="all-time-statistics-heading" className="glass-panel bg-surface rounded-2xl p-4 sm:p-5">
          <h2 id="all-time-statistics-heading" className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">All-Time Statistics</h2>
          <StatisticMetrics
            reps={totalStats.totalReps}
            completedDays={totalStats.totalCompletedDays}
            consistency={totalStats.totalConsistency}
            repsLabel="Total Reps"
            consistencyLabel="Overall Consistency"
            accent="blue"
          />
        </section>

        <section aria-labelledby="monthly-statistics-heading" className="glass-panel bg-surface rounded-2xl p-4 sm:p-5">
          <h2 id="monthly-statistics-heading" className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Monthly Statistics</h2>
          <div className="grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-2 mb-4">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} aria-label="Previous month" className="min-h-11 flex items-center justify-center rounded-lg text-muted-foreground hover:text-strong hover:bg-surface-secondary/40 transition-colors">
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
            <span className="text-center text-base sm:text-lg font-semibold text-strong" aria-live="polite">{format(currentMonth, "MMMM yyyy")}</span>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} aria-label="Next month" className="min-h-11 flex items-center justify-center rounded-lg text-muted-foreground hover:text-strong hover:bg-surface-secondary/40 transition-colors">
              <ChevronRight size={20} aria-hidden="true" />
            </button>
          </div>
          <StatisticMetrics
            reps={monthlyStats.monthlyReps}
            completedDays={monthlyStats.monthlyCompletedDays}
            consistency={monthlyStats.monthlyConsistency}
            repsLabel="Monthly Reps"
            consistencyLabel="Monthly Consistency"
            accent="green"
          />
        </section>

        <Collapsible open={totalsOpen} onOpenChange={setTotalsOpen} className="glass-panel bg-surface rounded-2xl overflow-hidden">
          <h2>
            <CollapsibleTrigger className="flex items-center justify-between gap-3 w-full min-h-16 p-4 sm:px-5 text-left text-base font-semibold text-strong hover:bg-surface-secondary/30 transition-colors">
              Individual Workout Totals
              <ChevronDown size={20} aria-hidden="true" className={`shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none ${totalsOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
          </h2>
          <CollapsibleContent className="statistics-workout-totals">
            {individualWorkoutTotals.length > 0 ? (
              <ul aria-label="Individual workout totals" className="divide-y divide-separator/60 px-4 sm:px-5 pb-2">
                {individualWorkoutTotals.map(workout => (
                  <li key={workout.id} className="flex items-center justify-between gap-3 min-h-11 py-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <span aria-hidden="true" className={`w-3 h-3 shrink-0 rounded-full ${colorClassMap[workout.color]}`} />
                      <span className="entity-name text-sm font-medium text-subtle">{workout.name}</span>
                    </div>
                    <span className="type-metric shrink-0 text-base font-semibold text-strong">{workout.totalReps.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 sm:px-5 pb-4 text-sm text-muted-foreground">No workouts created yet</p>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
