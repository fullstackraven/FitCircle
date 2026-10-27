import { repsForSets } from '@/lib/workout-progress';
import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Zap,
  Pill,
  Edit2,
  Save,
  X,
  Heart,
  Timer,
  Plus,
  ChevronRight,
  Check,
} from "lucide-react";
import { useLocation } from "wouter";
import { useWorkouts } from "@/hooks/use-workouts";
import { useSupplements } from "@/hooks/use-supplements";
import { useEnergyLevel } from "@/hooks/use-energy-level";
import { useRecovery } from "@/hooks/use-recovery";
import { useWorkoutDuration } from "@/hooks/use-workout-duration";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const colorClassMap: { [key: string]: string } = {
  green: "workout-green",
  blue: "workout-blue",
  purple: "workout-purple",
  amber: "workout-amber",
  red: "workout-red",
  pink: "workout-pink",
  cyan: "workout-cyan",
  lime: "workout-lime",
  orange: "workout-orange",
  indigo: "workout-indigo",
  emerald: "workout-emerald",
  yellow: "workout-yellow",
};

interface DynamicOverviewProps {
  selectedDate: string;
}

export function DynamicOverview({ selectedDate }: DynamicOverviewProps) {
  const [, navigate] = useLocation();
  const {
    getWorkoutLogsForDate,
    editWorkoutForDate,
    getJournalEntry,
    addJournalEntry,
  } = useWorkouts({ skipInitialWrite: true });
  const {
    supplements: allSupplements,
    getSupplementLogsForDate,
    setSupplementLog,
    createSupplement,
    getSupplements,
  } = useSupplements();
  const { getEnergyLevel, setEnergyLevelForDate } = useEnergyLevel();
  const { isRecoveryDay, addRecoveryDay, removeRecoveryDay } = useRecovery();
  const {
    getWorkoutDurationForDate,
    formatDuration,
    updateWorkoutDurationForDate,
  } = useWorkoutDuration();

  const [segment, setSegment] = useState("daily");
  const [feedback, setFeedback] = useState<{
    kind: "error" | "success";
    text: string;
  } | null>(null);
  const [energySaved, setEnergySaved] = useState(false);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [journalText, setJournalText] = useState("");
  const [energyLevel, setEnergyLevel] = useState(0);
  const [supplementLogs, setSupplementLogs] = useState<
    { id: number; name: string; taken: boolean }[]
  >([]);
  const [isRecovery, setIsRecovery] = useState(false);

  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  const [editingWorkoutCount, setEditingWorkoutCount] = useState("");

  // Supplement creation state
  const [isAddingSuplement, setIsAddingSupplement] = useState(false);
  const [newSupplementName, setNewSupplementName] = useState("");

  // Duration edit modal state
  const [isDurationModalOpen, setIsDurationModalOpen] = useState(false);
  const [editHours, setEditHours] = useState("");
  const [editMinutes, setEditMinutes] = useState("");
  const [editSeconds, setEditSeconds] = useState("");

  const selectedDateObj = new Date(selectedDate + "T00:00:00");

  useEffect(() => {
    // Load all data for the selected date
    const workoutData = getWorkoutLogsForDate(selectedDate);
    const journalData = getJournalEntry(selectedDate);
    const energyData = getEnergyLevel(selectedDateObj);
    const supplementLogsData = getSupplementLogsForDate(selectedDate);
    const recoveryData = isRecoveryDay(selectedDate);

    // Filter workouts to show only those with activity (count > 0) on this date
    // This ensures historical workouts remain visible regardless of current schedule
    const filteredWorkouts = workoutData.filter((workout) => workout.count > 0);

    // Combine all supplements with their status for this date
    const supplementLogs = allSupplements.map((supplement) => ({
      id: supplement.id,
      name: supplement.name,
      taken: supplementLogsData[supplement.id] || false,
    }));

    setWorkouts(filteredWorkouts);
    setJournalText(journalData || "");
    setEnergyLevel(energyData >= 1 && energyData <= 10 ? energyData : 5);
    setEnergySaved(energyData >= 1 && energyData <= 10);
    setSegment("daily");
    setFeedback(null);
    setSupplementLogs(supplementLogs);
    setIsRecovery(recoveryData);
  }, [selectedDate]);

  const handleEditWorkout = (workoutId: string, currentCount: number) => {
    setEditingWorkoutId(workoutId);
    setEditingWorkoutCount(currentCount.toString());
  };

  const handleSaveWorkoutEdit = () => {
    if (editingWorkoutId && editingWorkoutCount !== "") {
      const newCount = Number(editingWorkoutCount);
      const edited = workouts.find(w => w.id === editingWorkoutId);
      if (!Number.isInteger(newCount) || newCount < 0 || (edited?.progress.mode === 'sets' && newCount > edited.progress.goal)) {
        setFeedback({kind:'error',text:'Enter a valid completed count within the daily set target.'});
        return;
      }
      editWorkoutForDate(editingWorkoutId, selectedDate, newCount);

      // Update local state
      setWorkouts((prev) =>
        prev.map((workout) =>
          workout.id === editingWorkoutId
            ? { ...workout, count: workout.progress.mode === 'sets' ? repsForSets(newCount, workout.progress.repGoal, workout.progress.goal) : newCount,
                progress: {...workout.progress, count:newCount} }
            : workout,
        ),
      );

      setEditingWorkoutId(null);
      setEditingWorkoutCount("");
    }
  };

  const handleCancelWorkoutEdit = () => {
    setEditingWorkoutId(null);
    setEditingWorkoutCount("");
  };

  const report = (success: boolean, message: string) =>
    setFeedback({
      kind: success ? "success" : "error",
      text: success
        ? message
        : "Could not save. Your changes are still here; check storage and try again.",
    });
  const handleJournalSave = () => {
    report(addJournalEntry(selectedDate, journalText), "Journal entry saved");
  };
  const handleEnergySave = () => {
    if (!Number.isInteger(energyLevel) || energyLevel < 1 || energyLevel > 10)
      return;
    try {
      setEnergyLevelForDate(selectedDateObj, energyLevel);
      const saved = getEnergyLevel(selectedDateObj) === energyLevel;
      setEnergySaved(saved);
      report(saved, "Energy level saved");
    } catch {
      report(false, "");
    }
  };

  const handleSupplementToggle = (supplementId: number) => {
    setSupplementLogs((prev) =>
      prev.map((log) =>
        log.id === supplementId ? { ...log, taken: !log.taken } : log,
      ),
    );
  };

  const handleSupplementsSave = () => {
    try {
      supplementLogs.forEach((log) =>
        setSupplementLog(selectedDate, log.id, log.taken),
      );
      const stored = getSupplementLogsForDate(selectedDate);
      report(
        supplementLogs.every((log) => stored[log.id] === log.taken),
        "Supplement log saved",
      );
    } catch {
      report(false, "");
    }
  };
  const handleAddSupplement = () => {
    if (!newSupplementName.trim()) return;
    try {
      const created = createSupplement({
        name: newSupplementName.trim(),
        measurementType: "pills",
        amount: 1,
      });
      if (
        !getSupplements().some(
          (item) => item.id === created.id && item.name === created.name,
        )
      ) {
        report(false, "");
        return;
      }
      setSupplementLogs((previous) => [
        ...previous,
        { id: created.id, name: created.name, taken: false },
      ]);
      setNewSupplementName("");
      setIsAddingSupplement(false);
      report(true, "Supplement added");
    } catch {
      report(false, "");
    }
  };
  const handleRecoveryToggle = () => {
    try {
      if (isRecovery) removeRecoveryDay(selectedDate);
      else addRecoveryDay(selectedDate);
      const stored = JSON.parse(
        localStorage.getItem("fitcircle_recovery_data") || "{}",
      );
      const saved = stored.recoveryDays?.includes(selectedDate) === !isRecovery;
      if (saved) setIsRecovery(!isRecovery);
      report(
        saved,
        isRecovery ? "Recovery day removed" : "Recovery day marked",
      );
    } catch {
      report(false, "");
    }
  };
  const takenCount = supplementLogs.filter((log) => log.taken).length;
  const supplementPercent = supplementLogs.length
    ? (takenCount / supplementLogs.length) * 100
    : 0;
  const back = () => {
    if (window.history.state?.overviewFrom) window.history.back();
    else navigate("/calendar", { replace: true });
  };

  const handleOpenDurationModal = () => {
    const currentDuration = getWorkoutDurationForDate(selectedDate);
    const hours = Math.floor(currentDuration / 3600);
    const minutes = Math.floor((currentDuration % 3600) / 60);
    const seconds = currentDuration % 60;

    setEditHours(hours.toString());
    setEditMinutes(minutes.toString());
    setEditSeconds(seconds.toString());
    setIsDurationModalOpen(true);
  };

  const handleSaveDuration = () => {
    const hours = parseInt(editHours) || 0;
    const minutes = parseInt(editMinutes) || 0;
    const seconds = parseInt(editSeconds) || 0;

    const totalSeconds = hours * 3600 + minutes * 60 + seconds;

    if (totalSeconds > 0) {
      updateWorkoutDurationForDate(selectedDate, totalSeconds);
      setIsDurationModalOpen(false);
    }
  };

  const getEditDurationTotal = () => {
    const hours = parseInt(editHours) || 0;
    const minutes = parseInt(editMinutes) || 0;
    const seconds = parseInt(editSeconds) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  };

  const getJournalWordCount = () => {
    if (!journalText.trim()) return 0;
    return journalText.trim().split(/\s+/).length;
  };

  return (
    <div className="dynamic-overview-page">
      <header className="overview-header">
        <button onClick={back} aria-label="Back" title="Back to Calendar">
          <ArrowLeft size={20} />
        </button>
        <h1>Dynamic Overview</h1>
        <span />
      </header>
      <div className="overview-date">
        <p>{format(selectedDateObj, "EEEE")}</p>
        <h2>{format(selectedDateObj, "MMMM d, yyyy")}</h2>
      </div>
      <div
        role="tablist"
        aria-label="Overview sections"
        className="overview-tabs"
      >
        {[
          { id: "daily", label: "Daily Overview" },
          { id: "supplements", label: "Supplements" },
        ].map(({ id, label }) => (
          <button
            key={id}
            id={`overview-tab-${id}`}
            role="tab"
            aria-selected={segment === id}
            aria-controls={`overview-panel-${id}`}
            tabIndex={segment === id ? 0 : -1}
            onClick={() => setSegment(id)}
            onKeyDown={(event) => {
              if (
                !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
              )
                return;
              event.preventDefault();
              const next =
                event.key === "Home"
                  ? "daily"
                  : event.key === "End"
                    ? "supplements"
                    : segment === "daily"
                      ? "supplements"
                      : "daily";
              setSegment(next);
              document.getElementById(`overview-tab-${next}`)?.focus();
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {feedback && (
        <p
          role={feedback.kind === "error" ? "alert" : "status"}
          className={
            feedback.kind === "error"
              ? "text-feature-red text-sm mb-3"
              : "text-supporting text-sm mb-3"
          }
        >
          {feedback.text}
        </p>
      )}
      <div
        id="overview-panel-daily"
        role="tabpanel"
        aria-labelledby="overview-tab-daily"
        hidden={segment !== "daily"}
      >
        <div className="overview-stack">
          <section className="overview-card overview-recovery">
            <div className="overview-card-heading">
              <Heart />
              <h3>Recovery Day</h3>
              <span className="overview-status">
                {isRecovery ? "Marked" : "Not marked"}
              </span>
            </div>
            <div className="overview-recovery-actions">
              <p>
                {isRecovery
                  ? "Recovery day — workout goals don’t apply"
                  : "Designate this day as a recovery day"}
              </p>
              <button
                className="overview-action"
                aria-pressed={isRecovery}
                onClick={handleRecoveryToggle}
              >
                {isRecovery ? "Undo Recovery" : "Mark as Recovery"}
              </button>
            </div>
          </section>
          <section className="overview-card overview-energy">
            <div className="overview-card-heading">
              <Zap />
              <h3>Energy Level</h3>
              <span>1–10 scale</span>
            </div>
            <div className="overview-energy-controls">
              <div
                className="overview-energy-gauge"
                role="meter"
                aria-label="Energy level"
                aria-valuemin={1}
                aria-valuemax={10}
                aria-valuenow={energyLevel || 5}
              >
                <svg viewBox="0 0 100 100" aria-hidden="true">
                  <circle
                    cx="50"
                    cy="50"
                    r="43"
                    fill="none"
                    stroke="hsl(var(--progress-track))"
                    strokeWidth="6"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="43"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    strokeLinecap="round"
                    pathLength="100"
                    strokeDasharray={`${(energyLevel || 5) * 10} 100`}
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div>
                  <strong>{energyLevel || 5}</strong>
                  <span>of 10</span>
                </div>
              </div>
              <div className="overview-slider">
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  aria-label="Energy level"
                  value={energyLevel || 5}
                  onChange={(event) => {
                    setEnergyLevel(Number(event.target.value));
                    setEnergySaved(false);
                  }}
                  style={
                    {
                      "--energy-fill": `${(((energyLevel || 5) - 1) / 9) * 100}%`,
                    } as React.CSSProperties
                  }
                />
                <div>
                  <span>Low</span>
                  <span>High</span>
                </div>
                {!energySaved && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Not saved
                  </p>
                )}
              </div>
            </div>
            <button
              className="overview-action overview-wide"
              onClick={handleEnergySave}
            >
              Save Energy Level
            </button>
          </section>
          <section className="overview-card overview-journal">
            <div className="overview-card-heading">
              <BookOpen />
              <h3>Daily Journal</h3>
              <span data-testid="text-journal-word-count">
                {getJournalWordCount()}{" "}
                {getJournalWordCount() === 1 ? "word" : "words"}
              </span>
            </div>
            <textarea
              value={journalText}
              onChange={(event) => setJournalText(event.target.value)}
              aria-label="Journal entry"
              placeholder="How was your day? Capture a thought…"
              autoComplete="off"
              autoCorrect="on"
              autoCapitalize="sentences"
              spellCheck
              data-testid="textarea-journal-entry"
            />
            <div className="overview-journal-actions">
              <button className="overview-action" onClick={handleJournalSave}>
                Save Entry
              </button>
            </div>
          </section>
          <button
            className="overview-card overview-supplements overview-summary"
            onClick={() => setSegment("supplements")}
            aria-label="View and log supplements"
          >
            <div className="overview-card-heading">
              <Pill />
              <h3>Supplements</h3>
              <strong>
                {takenCount}/{supplementLogs.length}
              </strong>
              <ChevronRight className="overview-chevron" />
            </div>
            <div className="overview-progress" aria-hidden="true">
              <div style={{ width: `${supplementPercent}%` }} />
            </div>
            <p>Tap to view and log this day’s supplements</p>
          </button>
          {/* Workout Statistics */}
          {workouts.length > 0 && (
            <div className="overview-card">
              <div className="flex items-center space-x-3 mb-4">
                <BarChart3 className="w-5 h-5 text-feature-blue" />
                <h3 className="text-base font-semibold text-strong">
                  Workout Statistics
                </h3>
              </div>
              <div className="space-y-3">
                {workouts.map((workout) => (
                  <div
                    key={workout.id}
                    className="flex items-center justify-between p-3 bg-surface-secondary rounded-xl"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-3 h-3 rounded-full ${colorClassMap[workout.color]}`}
                      ></div>
                      <span className="text-sm font-medium text-strong">
                        {workout.name}
                      </span>
                    </div>

                    {editingWorkoutId === workout.id ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={editingWorkoutCount}
                          onChange={(e) =>
                            setEditingWorkoutCount(e.target.value)
                          }
                          className="w-16 px-2 py-1 text-sm bg-surface text-strong rounded border border-control-muted-border focus:outline-none focus:border-blue-400"
                          aria-label={workout.progress.mode === "sets" ? "Completed sets" : "Recorded reps"}
                          max={workout.progress.mode === "sets" ? workout.progress.goal : undefined}
                          min="0"
                          autoFocus
                        />
                        <button
                          onClick={handleSaveWorkoutEdit}
                          className="p-1 text-accent-text hover:text-accent-soft transition-colors"
                          title="Save"
                        >
                          <Save size={14} />
                        </button>
                        <button
                          onClick={handleCancelWorkoutEdit}
                          className="p-1 text-feature-red hover:text-feature-red-soft transition-colors"
                          title="Cancel"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-strong">
                          {workout.count}{workout.progress.mode === "sets" && ` reps · ${workout.progress.count}/${workout.progress.goal} sets`}
                        </span>
                        <button
                          onClick={() =>
                            handleEditWorkout(workout.id, workout.progress.mode === "sets" ? workout.progress.count : workout.count)
                          }
                          className="p-1 text-muted-foreground hover:text-subtle transition-colors"
                          title="Edit count"
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Workout Duration */}
              {(() => {
                const workoutDuration = getWorkoutDurationForDate(selectedDate);
                return workoutDuration > 0 ? (
                  <button
                    onClick={handleOpenDurationModal}
                    className="mt-4 p-3 bg-surface-secondary rounded-xl w-full hover:bg-control-strong transition-colors"
                    data-testid="button-edit-workout-duration"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Timer className="w-4 h-4 text-accent-text" />
                        <span className="text-sm font-medium text-strong">
                          Workout Duration
                        </span>
                      </div>
                      <span className="text-sm font-bold text-accent-text">
                        {formatDuration(workoutDuration)}
                      </span>
                    </div>
                  </button>
                ) : null;
              })()}
            </div>
          )}
        </div>
      </div>
      <div
        id="overview-panel-supplements"
        role="tabpanel"
        aria-labelledby="overview-tab-supplements"
        hidden={segment !== "supplements"}
      >
        <section className="overview-card overview-supplements">
          <div className="overview-card-heading">
            <Pill />
            <h3>
              {format(selectedDateObj, "yyyy-MM-dd") ===
              format(new Date(), "yyyy-MM-dd")
                ? "Today’s Supplements"
                : "Daily Supplements"}
            </h3>
            <strong>
              {takenCount}/{supplementLogs.length}
            </strong>
          </div>
          <div
            className="overview-progress"
            role="progressbar"
            aria-label="Supplements taken"
            aria-valuemin={0}
            aria-valuemax={supplementLogs.length || 1}
            aria-valuenow={takenCount}
          >
            <div style={{ width: `${supplementPercent}%` }} />
          </div>
          <div className="overview-supplement-list">
            {supplementLogs.map((log) => (
              <button
                key={log.id}
                role="checkbox"
                aria-checked={log.taken}
                aria-label={log.name}
                className="overview-supplement-row"
                onClick={() => handleSupplementToggle(log.id)}
              >
                <span
                  className={`overview-check ${log.taken ? "is-taken" : ""}`}
                >
                  {log.taken && <Check size={15} />}
                </span>
                <span className="overview-supplement-name">{log.name}</span>
                <span
                  className={
                    log.taken ? "text-accent-text" : "text-muted-foreground"
                  }
                >
                  {log.taken ? "Taken" : "Not taken"}
                </span>
              </button>
            ))}
            {!supplementLogs.length && (
              <p className="text-supporting text-sm">
                No supplements added yet
              </p>
            )}
          </div>
          {isAddingSuplement && (
            <div className="overview-add-form">
              <input
                aria-label="Supplement name"
                value={newSupplementName}
                onChange={(event) => setNewSupplementName(event.target.value)}
                autoFocus
              />
              <button className="overview-action" onClick={handleAddSupplement}>
                Add
              </button>
              <button
                className="overview-action"
                onClick={() => {
                  setIsAddingSupplement(false);
                  setNewSupplementName("");
                }}
              >
                Cancel
              </button>
            </div>
          )}
          <div className="overview-supplement-actions">
            <button
              className="overview-action overview-add"
              onClick={() => setIsAddingSupplement(true)}
              title="Add supplement"
            >
              <Plus size={16} />
              Add Supplement
            </button>
            <button
              className="overview-action"
              onClick={handleSupplementsSave}
              disabled={!supplementLogs.length}
            >
              Save Supplement Log
            </button>
          </div>
          <button
            className="overview-manage"
            onClick={() => navigate("/supplements-page")}
          >
            Manage supplement definitions
          </button>
        </section>
      </div>
      {/* Duration Edit Modal */}
      <Dialog open={isDurationModalOpen} onOpenChange={setIsDurationModalOpen}>
        <DialogContent className="bg-surface text-strong border-separator">
          <DialogHeader>
            <DialogTitle>Edit Workout Duration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Adjust the total workout duration for{" "}
              {format(selectedDateObj, "MMMM d, yyyy")}
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-2">
                  Hours
                </label>
                <input
                  type="number"
                  value={editHours}
                  onChange={(e) => setEditHours(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-secondary text-strong rounded-lg border border-control focus:outline-none focus:border-green-400"
                  min="0"
                  data-testid="input-duration-hours"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-2">
                  Minutes
                </label>
                <input
                  type="number"
                  value={editMinutes}
                  onChange={(e) => setEditMinutes(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-secondary text-strong rounded-lg border border-control focus:outline-none focus:border-green-400"
                  min="0"
                  max="59"
                  data-testid="input-duration-minutes"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-2">
                  Seconds
                </label>
                <input
                  type="number"
                  value={editSeconds}
                  onChange={(e) => setEditSeconds(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-secondary text-strong rounded-lg border border-control focus:outline-none focus:border-green-400"
                  min="0"
                  max="59"
                  data-testid="input-duration-seconds"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            {getEditDurationTotal() === 0 && (
              <p className="text-sm text-feature-red flex-1 text-center sm:text-left">
                Duration must be greater than 0
              </p>
            )}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setIsDurationModalOpen(false)}
                className="px-4 py-2 bg-surface-secondary hover:bg-control-strong text-strong rounded-lg transition-colors"
                data-testid="button-cancel-duration"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDuration}
                disabled={getEditDurationTotal() === 0}
                className="px-4 py-2 bg-action hover:bg-action-hover text-on-action rounded-lg transition-colors disabled:bg-control-strong disabled:cursor-not-allowed disabled:opacity-50"
                data-testid="button-save-duration"
              >
                Save Duration
              </button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
