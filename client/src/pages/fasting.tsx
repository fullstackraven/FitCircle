import { fastingDailyHours } from "@/lib/wellness-activity";
import {
  WellnessPageShell,
  WellnessProgressHero,
  WellnessRecentActivity,
  WellnessTodaySection,
  WellnessPrimaryAction,
  WellnessHistoryRow,
  WellnessGoalSheet,
} from "@/components/wellness/WellnessUI";

import { percentage, completedFasts, amount } from "@/lib/wellness-progress";
import { useState, useEffect } from "react";
import { Edit, Trash2, Target, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { GoalCircle } from "@/components/GoalCircle";
import { useFasting, type FastingLog } from "@/hooks/use-fasting";
import { useGoals } from "@/hooks/use-goals";
import {
  getTodayString,
  getDateString,
  getCurrentTime24,
  getDisplayDate,
  groupLogsByMonth,
} from "@/lib/date-utils";

export default function FastingPage() {
  const { error, stats, logs, now, addLog, updateLog, deleteLog } = useFasting();
  const completed = completedFasts(logs, now);
  const { goals, updateGoal } = useGoals();
  const [isFastingDialogOpen, setIsFastingDialogOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<FastingLog | null>(null);

  // Form state
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");

  // Goal state
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalHoursInput, setGoalHoursInput] = useState("");
  const [goalHoursFocused, setGoalHoursFocused] = useState(false);

  // Max hours state (for integrated modal)
  const [maxHoursInput, setMaxHoursInput] = useState("");
  const [maxHoursFocused, setMaxHoursFocused] = useState(false);

  // UI state for monthly collapsible sections
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Initialize goal input with current goal value
    setGoalHoursInput(goals.fastingHours?.toString() || "");
    setMaxHoursInput(goals.maxFastingHours?.toString() || "24");
  }, [goals.fastingHours]);

  // Group logs by month for display
  const monthlyLogs = groupLogsByMonth(logs, "startDate");

  const calculateDuration = (
    startDate: string,
    startTime: string,
    endDate: string,
    endTime: string,
  ): number => {
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);

    // Validate that the dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.error("Invalid date format provided to calculateDuration");
      return 0;
    }

    const duration = Math.floor(
      (end.getTime() - start.getTime()) / (1000 * 60),
    ); // in minutes
    return duration < 0 ? 0 : duration; // Ensure non-negative duration
  };

  const formatDuration = (minutes: number): string => {
    minutes = amount(minutes);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const secs = 0; // We don't track seconds for logged fasts
    return `${hours.toString().padStart(2, "0")}h ${mins.toString().padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`;
  };

  // Backward compatibility functions for existing code
  const getHeatBarColor = (hours: number): string => {
    if (hours <= 1) return "bg-blue-500";
    if (hours <= 6) return "bg-action-selected";
    if (hours <= 12) return "bg-yellow-500";
    if (hours <= 18) return "bg-orange-500";
    return "bg-red-500";
  };

  const getHeatBarWidth = (hours: number): string => {
    const maxHours = goals.maxFastingHours;
    const progress = percentage(hours, maxHours);
    return String(progress) + "%";
  };

  const handleLogFast = () => {
    if (!startDate || !startTime || !endDate || !endTime) {
      alert("Please fill in all fields");
      return;
    }

    const duration = calculateDuration(startDate, startTime, endDate, endTime);

    if (duration <= 0) {
      alert("End time must be after start time");
      return;
    }

    if (editingLog) {
      // Update existing log
      if (
        !updateLog(editingLog.id, {
          startDate,
          startTime,
          endDate,
          endTime,
          duration,
        })
      )
        return;
      setEditingLog(null);
    } else {
      // Create new log
      if (
        !addLog({
          startDate,
          startTime,
          endDate,
          endTime,
          duration,
        })
      )
        return;
    }

    // Reset form
    setStartDate("");
    setStartTime("");
    setEndDate("");
    setEndTime("");
    setIsFastingDialogOpen(false);
  };

  const handleEditLog = (log: FastingLog) => {
    setEditingLog(log);
    setStartDate(log.startDate);
    setStartTime(log.startTime);
    setEndDate(log.endDate);
    setEndTime(log.endTime);
    setIsFastingDialogOpen(true);
  };

  const handleDeleteLog = (logId: string) => {
    if (confirm("Are you sure you want to delete this fasting log?")) {
      deleteLog(logId);
    }
  };

  const handleCancelEdit = () => {
    setEditingLog(null);
    setStartDate("");
    setStartTime("");
    setEndDate("");
    setEndTime("");
    setIsFastingDialogOpen(false);
  };

  const handleSetGoal = async () => {
    const hoursGoal = parseFloat(goalHoursInput);
    const maxHours = parseFloat(maxHoursInput);

    if (isNaN(hoursGoal) || hoursGoal <= 0) {
      alert("Please enter a valid goal in hours");
      return;
    }

    if (isNaN(maxHours) || maxHours <= 0) {
      alert("Please enter a valid maximum in hours");
      return;
    }

    if (!updateGoal("fastingHours", hoursGoal)) return;
    if (!updateGoal("maxFastingHours", maxHours)) return;
    setIsGoalModalOpen(false);
    alert("Fasting settings saved successfully!");
  };

  const currentDuration =
    startDate && startTime && endDate && endTime
      ? calculateDuration(startDate, startTime, endDate, endTime)
      : 0;

  return (
    <>
      <WellnessPageShell
        title="Fasting"
        accent="var(--wellness-amber)"
        onGoal={() => setIsGoalModalOpen(true)}
      >
        {error && (
          <p role="alert" className="text-sm text-warning-soft">
            {error}
          </p>
        )}

        <WellnessProgressHero
          current={stats.todayHours}
          target={goals.fastingHours}
          unit="hr"
          period="Today’s Completed Fast"
          title="Today’s Completed Fast"
        />
        <WellnessTodaySection title="Fasting timeline">
          <dl className="wellness-timeline mt-3">
            <div>
              <dt>Start</dt>
              <dd>Not started</dd>
            </div>
            <div>
              <dt>Elapsed</dt>
              <dd>—</dd>
            </div>
            <div>
              <dt>Target duration</dt>
              <dd>{goals.fastingHours} hr</dd>
            </div>
            <div>
              <dt>Target end / eating window</dt>
              <dd>—</dd>
            </div>
          </dl>
          <p className="text-xs text-muted-foreground mt-3">
            Completed today: {stats.todayHours.toFixed(1)} hr ·{" "}
            {Math.round(stats.percentage)}% of duration goal
          </p>
        </WellnessTodaySection>
        <WellnessRecentActivity
          totals={fastingDailyHours(completed)}
          unit="hr"
          summary={(days, dates) => {
            const recent = completed.filter((fast) =>
              dates.includes(fast.date),
            );
            const achieved = new Set(
              recent
                .filter(
                  (fast) =>
                    goals.fastingHours > 0 && fast.hours >= goals.fastingHours,
                )
                .map((fast) => fast.date),
            ).size;
            return `Recent fasts · ${recent.length} completed in last ${days} days · ${achieved} of ${days} days met goal`;
          }}
        />

        {/* Add Fasting Log Button */}
        <div>
          <WellnessPrimaryAction
            onClick={() => {
              // Initialize form with current date/time using master timezone utilities
              const currentDate = getTodayString();
              const currentTime = getCurrentTime24();
              setStartDate(currentDate);
              setStartTime(currentTime);
              setEndDate(currentDate);
              setEndTime(currentTime);
              setIsFastingDialogOpen(true);
            }}
          >
            <span>Add Fast</span>
          </WellnessPrimaryAction>
        </div>

        {/* Today's Fast */}
        <WellnessTodaySection title="Today's Completed Fasts">
          <div className="space-y-2">
            {(() => {
              const today = getDateString(now);
              const todayFasts = completed
                .filter((f) => f.date === today)
                .map((f) => ({
                  ...f.log,
                  duration: f.hours * 60,
                })) as FastingLog[];

              if (todayFasts.length > 0) {
                return todayFasts
                  .slice()
                  .reverse()
                  .map((fast) => {
                    const hours = fast.duration / 60;
                    return (
                      <div
                        key={fast.id}
                        className="wellness-record-row flex justify-between items-center text-sm"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <span className="text-supporting">
                            {fast.startDate} {fast.startTime} → {fast.endDate}{" "}
                            {fast.endTime}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-feature-amber font-medium text-sm">
                            {hours.toFixed(1)}h
                          </span>
                        </div>
                      </div>
                    );
                  });
              } else {
                return (
                  <div className="text-center text-dim py-4 text-sm">
                    No completed fast today
                  </div>
                );
              }
            })()}
          </div>
        </WellnessTodaySection>

        {/* Fasting Log - Monthly Sections */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">History</h3>
          <div className="space-y-3">
            {Object.keys(monthlyLogs).length === 0 ? (
              <div className="fc-empty">
                <p>No fasting logs yet.</p>
                <p className="text-xs mt-2">
                  Start tracking your intermittent fasting journey!
                </p>
              </div>
            ) : (
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
                    <WellnessHistoryRow
                      month={monthName}
                      count={monthLogs.length}
                      unit="fasts"
                    />
                  </CollapsibleTrigger>

                  <CollapsibleContent className="space-y-2 mt-2">
                    {monthLogs
                      .sort(
                        (a, b) =>
                          new Date(b.loggedAt).getTime() -
                          new Date(a.loggedAt).getTime(),
                      )
                      .map((log) => {
                        const hours = log.duration / 60;
                        const loggedDate = new Date(
                          log.loggedAt,
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        });
                        const loggedTime = new Date(
                          log.loggedAt,
                        ).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        });

                        return (
                          <div
                            key={log.id}
                            className="bg-surface rounded-xl p-3"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="text-sm text-supporting">
                                {loggedDate} at {loggedTime}
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  aria-label="Edit fast"
                                  onClick={() => handleEditLog(log)}
                                  className="text-muted-foreground hover:text-feature-blue transition-colors"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  aria-label="Delete fast"
                                  onClick={() => handleDeleteLog(log.id)}
                                  className="text-muted-foreground hover:text-feature-red transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            <div className="text-center">
                              {/* Heat Bar */}
                              <div className="mb-2">
                                <div className="w-full bg-control-strong rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${getHeatBarColor(hours)}`}
                                    title={
                                      "Duration scale: " +
                                      goals.maxFastingHours +
                                      "h maximum"
                                    }
                                    style={{ width: getHeatBarWidth(hours) }}
                                  ></div>
                                </div>
                              </div>

                              {/* Duration */}
                              <div className="text-lg font-bold text-feature-amber type-metric mb-2">
                                {formatDuration(log.duration)}
                              </div>

                              {/* Fast Period */}
                              <div className="text-sm text-muted-foreground">
                                {getDisplayDate(log.startDate)} -{" "}
                                {getDisplayDate(log.endDate)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </CollapsibleContent>
                </Collapsible>
              ))
            )}
          </div>
        </div>
      </WellnessPageShell>

      {/* Goal Setting Modal */}
      {isGoalModalOpen && (
        <WellnessGoalSheet
          title="Fasting Goal"
          onDismiss={() => setIsGoalModalOpen(false)}
        >
          <div className="glass-panel bg-surface rounded-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-strong">Fasting Goal</h3>
              <button
                aria-label="Close"
                onClick={() => setIsGoalModalOpen(false)}
                className="p-2 text-muted-foreground hover:text-strong hover:bg-surface-secondary rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Goal Progress Circle */}
            <div className="flex justify-center mb-8">
              <GoalCircle
                percentage={percentage(
                  stats.completedAverage,
                  Number(goalHoursInput),
                )}
                color="var(--bmi-amber)"
                size={120}
                currentValue={stats.completedAverage}
                goalValue={parseFloat(goalHoursInput) || 0}
                unit="hrs"
                title="Average Fast Duration"
                description="All-time completed-fast average"
              />
            </div>

            {/* Goal Input Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="goalHours" className="text-supporting">
                  Goal Hours per Fast
                </Label>
                <Input
                  id="goalHours"
                  type="number"
                  value={goalHoursInput}
                  onChange={(e) => setGoalHoursInput(e.target.value)}
                  onFocus={() => setGoalHoursFocused(true)}
                  onBlur={() => setGoalHoursFocused(false)}
                  className="bg-surface-secondary border-control text-strong mt-1"
                />
              </div>
              <div>
                <Label htmlFor="maxHours" className="text-supporting">
                  Maximum Fasting Hours
                </Label>
                <Input
                  id="maxHours"
                  type="number"
                  value={maxHoursInput}
                  onChange={(e) => setMaxHoursInput(e.target.value)}
                  onFocus={() => {
                    setMaxHoursFocused(true);
                    if (!maxHoursInput) {
                      setMaxHoursInput(
                        goals.maxFastingHours?.toString() || "24",
                      );
                    }
                  }}
                  onBlur={() => setMaxHoursFocused(false)}
                  className="bg-surface-secondary border-control text-strong mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Heat-bar scale only; achievement uses Goal Hours per Fast
                </p>
              </div>
              <div className="flex space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsGoalModalOpen(false)}
                  className="flex-1 border-control text-supporting hover:bg-surface-secondary"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSetGoal}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-on-action-soft"
                >
                  Save Settings
                </Button>
              </div>
            </div>
          </div>
        </WellnessGoalSheet>
      )}

      {/* Log Fast Dialog */}
      <Dialog open={isFastingDialogOpen} onOpenChange={setIsFastingDialogOpen}>
        <DialogContent
          className="bg-surface border-separator text-strong max-w-sm mx-auto rounded-2xl"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogTitle className="text-lg font-semibold text-center">
            {editingLog ? "Edit Fast" : "Log Fast"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Log your intermittent fasting period by entering start and end times
          </DialogDescription>

          <div className="space-y-4">
            {/* Start Date & Time */}
            <div>
              <label className="block text-sm font-medium text-supporting mb-2">
                Start Fast
              </label>
              <div className="space-y-2 max-w-[280px] mx-auto">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-surface-secondary border-control text-strong text-base"
                />
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="bg-surface-secondary border-control text-strong text-base"
                />
              </div>
            </div>

            {/* End Date & Time */}
            <div>
              <label className="block text-sm font-medium text-supporting mb-2">
                End Fast
              </label>
              <div className="space-y-2 max-w-[280px] mx-auto">
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-surface-secondary border-control text-strong text-base"
                />
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="bg-surface-secondary border-control text-strong text-base"
                />
              </div>
            </div>

            {/* Duration Display */}
            {currentDuration > 0 && (
              <div className="text-center">
                <label className="block text-sm font-medium text-supporting mb-2">
                  Duration
                </label>
                <div className="bg-surface-secondary rounded-xl p-4">
                  {/* Heat Bar */}
                  <div className="mb-2">
                    <div className="w-full bg-control-strong rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${getHeatBarColor(currentDuration / 60)}`}
                        title={
                          "Duration scale: " +
                          goals.maxFastingHours +
                          "h maximum"
                        }
                        style={{ width: getHeatBarWidth(currentDuration / 60) }}
                      ></div>
                    </div>
                  </div>
                  {/* Duration Text */}
                  <div className="type-metric text-2xl font-bold text-strong">
                    {formatDuration(currentDuration)}
                  </div>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex space-x-2 pt-2">
              <Button
                onClick={handleCancelEdit}
                variant="outline"
                className="flex-1 border-control text-supporting hover:bg-surface-secondary"
              >
                Cancel
              </Button>
              <Button
                onClick={handleLogFast}
                className="flex-1 bg-action hover:bg-action-hover text-on-action"
              >
                {editingLog ? "Update Fast" : "Log Fast"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
