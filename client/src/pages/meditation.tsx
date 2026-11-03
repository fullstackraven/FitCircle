import { QuickAddMinutes } from '@/components/wellness/QuickAddMinutes';
import { MeditationTimer } from '@/components/wellness/MeditationTimer';
import { FormActions } from '@/components/forms/form-page';
import { FormScreen } from '@/components/forms/form-page';
import { useRouteState, useRouteForm, useRecordFormState } from '@/components/forms/FormNavigation';
import { GoalEditor, GoalSummary, GoalField } from "@/components/wellness/GoalEditor";
import {
  WellnessPageShell,
  WellnessProgressHero,
  WellnessRecentActivity,
  WellnessTodaySection,
  WellnessPrimaryAction,
  WellnessHistoryRow,
  WellnessEntryActions,
} from "@/components/wellness/WellnessUI";
import { dailyTotals } from "@/lib/wellness-progress";
import { WellnessHistory } from "@/components/WellnessHistory";
import { percentage } from "@/lib/wellness-progress";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FormGroup,
  FormContent,
  FormDescription,
  FormTitle,
} from "@/components/forms/form-page";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useMeditation, type MeditationSession } from "@/hooks/use-meditation";
import { useGoals } from "@/hooks/use-goals";

import { groupLogsByMonth, getTodayString } from "@/lib/date-utils";

export default function MeditationPage() {
  const {
    error,
    logs,
    dailyLogs,
    addSession,
    updateSession,
    deleteSession,
    getTodayMinutes,
    getDailyGoal,
    isGoalReached,
    getHistoricalStats,
  } = useMeditation();
  const { goals, updateGoal } = useGoals();
  const [editingSession, setEditingSession] = useRecordFormState<{
    date: string;
    id: string;
    duration: string;
  } | null>('editingSession', null, 'meditation-edit');
  const [timerOpen, setTimerOpen] = useState(false);
  // Goal state
  const [isMeditationGoalPageOpen, setMeditationGoalPageOpen] = useRouteForm('meditation-goal');
  const [goalMinutesInput, setGoalMinutesInput] = useRouteState('goalMinutesInput', "");
  const [goalMinutesFocused, setGoalMinutesFocused] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Initialize goal input with current goal value from hook
    setGoalMinutesInput(getDailyGoal().toString());
  }, [getDailyGoal()]);

  // Get today's sessions for the "Today's Meditation" section
  const getTodaySessions = () => {
    const today = getTodayString(); // YYYY-MM-DD format
    const todayLegacy = new Date().toLocaleDateString("en-US"); // MM/DD/YYYY format

    // Try both date formats to handle legacy data
    let todayLogKey = Object.keys(dailyLogs).find((date) => date === today);
    if (!todayLogKey) {
      todayLogKey = Object.keys(dailyLogs).find((date) => date === todayLegacy);
    }

    return todayLogKey ? dailyLogs[todayLogKey].sessions : [];
  };

  const todaySessions = getTodaySessions();

  // Listen for goal changes from other pages
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "fitcircle_goal_meditation") {
        setGoalMinutesInput(getDailyGoal().toString());
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [getDailyGoal()]);

  const handleSetGoal = async () => {
    const minutesGoal = parseFloat(goalMinutesInput);

    if (isNaN(minutesGoal) || minutesGoal <= 0) {
      alert("Please enter a valid goal in minutes");
      return;
    }

    if (!updateGoal("meditationMinutes", minutesGoal)) return;
    setMeditationGoalPageOpen(false);
    alert("Meditation goal saved successfully!");
  };

  return <FormScreen>{(
    <>
      <WellnessPageShell
        title="Meditation"
        accent="var(--wellness-purple)"
        textAccent="hsl(var(--feature-purple))"
        onGoal={() => setMeditationGoalPageOpen(true)}
      >
        {error && (
          <p role="alert" className="text-sm text-warning-soft">
            {error}
          </p>
        )}

        <WellnessProgressHero current={getTodayMinutes()} target={getDailyGoal()} unit="min" period="Today" title="Today's Meditation" />
        {isGoalReached() && <div className="text-feature-purple font-medium text-center -mt-4 mb-6">🧘‍♂️ Daily goal achieved!</div>}
        <WellnessRecentActivity
          totals={dailyTotals("meditation", { dailyLogs })}
          unit="min"
          summary={(days, dates, activeDays) =>
            `Practice consistency · ${activeDays} of ${days} days practiced`
          }
        />

        <QuickAddMinutes presets={[5, 10, 15]} onAdd={addSession} />
        <WellnessPrimaryAction onClick={() => setTimerOpen(true)} data-testid="button-start-meditation">Start Meditation</WellnessPrimaryAction>
        {timerOpen && <MeditationTimer onClose={() => setTimerOpen(false)} onComplete={addSession} />}

        {/* Today's Meditation */}
        <WellnessTodaySection title="Today's Meditation">
          <div className="space-y-2">
            {todaySessions.length > 0 ? (
              todaySessions
                .slice()
                .reverse()
                .map((session: MeditationSession, index: number) => (
                  <div
                    key={session.id}
                    className="wellness-record-row flex justify-between items-center text-sm relative"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-muted-foreground">{session.time}</span>
                      <span className="text-supporting">Meditation</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-feature-purple font-medium text-sm">
                        {session.duration}min
                      </span>
                      <WellnessEntryActions
                        label="meditation session"
                        onEdit={() =>
                          setEditingSession({
                            date: getTodayString(),
                            id: session.id,
                            duration: String(session.duration),
                          })
                        }
                        onDelete={() => {
                          if (confirm("Delete this meditation session?"))
                            deleteSession(getTodayString(), session.id);
                        }}
                      />
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-center text-dim py-4 text-sm">
                No meditation sessions today yet
              </div>
            )}
          </div>
        </WellnessTodaySection>

        {/* Meditation Log - Daily Aggregation */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">History</h3>
          <div className="space-y-3">
            {Object.keys(dailyLogs).length === 0 ? (
              <div className="fc-empty">
                <p>No meditation sessions yet.</p>
                <p className="text-xs mt-2">
                  Complete a meditation session to see your log here.
                </p>
              </div>
            ) : (
              Object.entries(groupLogsByMonth(Object.values(dailyLogs))).map(
                ([monthName, monthLogs]) => (
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
                        unit="days"
                      />
                    </CollapsibleTrigger>

                    <CollapsibleContent className="space-y-2 mt-2">
                      {monthLogs
                        .sort((a, b) => b.date.localeCompare(a.date))
                        .map((log) => (
                          <div key={log.date} className="fitcircle-card ml-4">
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-strong font-medium">
                                {(() => {
                                  try {
                                    // Handle both YYYY-MM-DD and other date formats
                                    let dateToFormat;
                                    if (log.date.includes("-")) {
                                      // YYYY-MM-DD format
                                      dateToFormat = new Date(
                                        log.date + "T00:00:00",
                                      );
                                    } else {
                                      // Other formats, try direct parsing
                                      dateToFormat = new Date(log.date);
                                    }

                                    if (isNaN(dateToFormat.getTime())) {
                                      return log.date; // Fallback to raw date string
                                    }

                                    return dateToFormat.toLocaleDateString(
                                      "en-US",
                                      {
                                        weekday: "short",
                                        month: "short",
                                        day: "numeric",
                                      },
                                    );
                                  } catch (e) {
                                    return log.date; // Fallback to raw date string
                                  }
                                })()}
                              </span>
                              <div className="flex items-center space-x-2">
                                <span className="text-feature-purple font-semibold text-sm">
                                  {log.totalMinutes}min
                                </span>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground mb-2">
                              {log.sessions.length} sessions
                            </div>

                            {/* Show detailed sessions for this day */}
                            <div className="space-y-1">
                              {(expandedDays.has(log.date)
                                ? log.sessions
                                : log.sessions.slice(0, 3)
                              ).map((session, index) => (
                                <div
                                  key={session.id}
                                  className="wellness-record-row flex justify-between items-center text-xs"
                                >
                                  <div className="flex items-center space-x-2">
                                    <span className="text-dim">
                                      {session.time}
                                    </span>
                                    <span className="text-muted-foreground">
                                      Meditation
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <span className="text-supporting">
                                      {session.duration}min
                                    </span>
                                    <WellnessEntryActions
                                      label="historical meditation session"
                                      onEdit={() =>
                                        setEditingSession({
                                          date: log.date,
                                          id: session.id,
                                          duration: String(session.duration),
                                        })
                                      }
                                      onDelete={() => {
                                        if (
                                          confirm(
                                            "Delete this meditation session?",
                                          )
                                        )
                                          deleteSession(log.date, session.id);
                                      }}
                                    />
                                  </div>
                                </div>
                              ))}
                              {log.sessions.length > 3 && (
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
                                  className="fc-pill text-xs text-dim hover:text-supporting text-center mt-1 w-full transition-colors"
                                >
                                  {expandedDays.has(log.date)
                                    ? "Show less"
                                    : `+${log.sessions.length - 3} more sessions`}
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                    </CollapsibleContent>
                  </Collapsible>
                ),
              )
            )}
          </div>
        </div>
        <WellnessHistory stats={getHistoricalStats()} unit="min" />
      </WellnessPageShell>

      {/* Goal settings page */}
      {isMeditationGoalPageOpen && (
        <GoalEditor formId="meditation-goal" title="Meditation Goal" subtitle="Build a consistent daily practice" onDismiss={() => setMeditationGoalPageOpen(false)} onSave={handleSetGoal}
          summary={<GoalSummary percentage={percentage(getTodayMinutes(), Number(goalMinutesInput))} label="Daily target" value={`${parseFloat(goalMinutesInput) || 0} min`} detail={`Today · ${getTodayMinutes()} minutes logged`} />}>
          <GoalField id="goalMinutes" label="Daily Meditation Goal (minutes)" unit="minutes" description="Your daily target for meditation sessions."><Input
                  id="goalMinutes"
                  type="number"
                  value={goalMinutesInput}
                  onChange={(e) => setGoalMinutesInput(e.target.value)}
                  onFocus={() => setGoalMinutesFocused(true)}
                  onBlur={() => setGoalMinutesFocused(false)}
                  className="goal-editor-input"
                /></GoalField>
        </GoalEditor>
      )}

      <FormGroup formId="meditation-edit"
        open={Boolean(editingSession)}
        onOpenChange={(open) => {
          if (!open) setEditingSession(null);
        }}
      >
        <FormContent>
          <FormTitle>Edit Meditation</FormTitle>
          <FormDescription className="sr-only">
            Edit recorded session duration
          </FormDescription>
          <div className="form-field"><Label htmlFor="edit-meditation-minutes">Duration (minutes)</Label>
          <Input
            id="edit-meditation-minutes"
            type="number"
            min="1"
            value={editingSession?.duration ?? ""}
            onChange={(event) =>
              setEditingSession((previous) =>
                previous ? { ...previous, duration: event.target.value } : null,
              )
            }
          />
          </div>
          {error && (
            <p role="alert" className="text-warning-soft text-sm">
              {error}
            </p>
          )}
<FormActions primary={<Button
            onClick={() => {
              if (!editingSession) return;
              const duration = Number(editingSession.duration);
              if (
                Number.isFinite(duration) &&
                duration > 0 &&
                updateSession(editingSession.date, editingSession.id, {
                  duration,
                })
              )
                setEditingSession(null);
            }}
          >
            Save Changes
          </Button>} secondary={<Button variant="ghost" onClick={()=>setEditingSession(null)}>Cancel</Button>}/>
        </FormContent>
      </FormGroup>

    </>
  )}</FormScreen>;
}
