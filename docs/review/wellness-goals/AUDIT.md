# Wellness goal audit — before implementation

Baseline: merged main 29f35a3. Inspected the four feature hooks/pages, use-goals, goals-utils, date-utils, meditation-calc, GoalsWidget, cardio initialization and registered storage/backup boundaries.

| Display / path | Stored source | Numerator / denominator / window before | Confirmed discrepancy |
| --- | --- | --- | --- |
| Cardio main circle / getTodaysProgress | cardio dailyLogs | today / goal.target, always labelled per day | Ignores selected weekly period. |
| Cardio initializer | canonical or legacy cardio + goal key | weekly target divided by 7 and rounded into a daily runtime goal | Changes interpretation of saved weekly goals without user action. |
| Cardio weekly summary | dailyLogs | rolling timestamp week / target × 7 | Weekly target can be multiplied by seven; differs from shared Sunday week. |
| Cardio goal dialog | flattened sessions | all-time calendar-day average / edited target | Historical analytics shown as goal progress rather than selected period. |
| Shared cardio | goals-utils | obsolete exercises/logs structure / separate weekly goals | Does not read canonical dailyLogs or selected feature goal. |
| Hydration main / shared | hydration record | cached currentDayOz / dailyGoalOz | Stale cache can show old activity. Historical edit/delete changes today's cache. |
| Hydration goal dialog | same record | all-time average percentage but today's currentValue | Numerator, displayed value and label disagree. |
| Meditation main | dailyLogs | today's cached total / legacy goal (default 20) | Shared defaults to 10 and reads only legacy arrays; malformed numbers can leak through. |
| Meditation dialog | modern/legacy sessions | all-time percentage, seven-day currentValue, edited denominator | Three incompatible mathematical interpretations in one circle. |
| Shared meditation / useGoals | legacy array only | rolling seven-day sum / 7 / shared daily goal | Not today's progress; misses modern records and includes timestamp-based boundaries. |
| Fasting main | completed log array | longest fast touching today / maxFastingHours | Display maximum rather than configured fastingHours determines achievement; completed logs look current. |
| Fasting dialog | completed log array | all-time calendar-day hours / per-fast goal | Calendar-day average mislabeled average fast duration. |
| Shared fasting | completed logs | all-time per-fast or calendar-day average / goal | Different implementations; old fasts presented as current progress. |
| Recent summaries | all four domains | last ten calendar days, labels often “Last 10 Logs” / “Average per Log” | Inactive-day denominator is not identified; cardio target scaling ignores weekly period. |
| Goals widget / wellness score | multiple duplicate readers | current caches, seven-day and all-time percentages mixed | Overview disagrees with pages; no single period contract. |
| All-time date helpers | feature history | first log to today; elapsed milliseconds rounded up | DST changes day counts; future/invalid/negative values inadequately filtered. |
| Hydration/meditation/fasting mount effects | canonical records, legacy meditation arrays | autosave normalized/default state | Merely opening pages can migrate/rewrite history or malformed bytes. Must prevent writes during this display correction. |

No active-fast storage or start/stop workflow exists: the fasting page records completed fasts only. Completed-fast achievement must be explicitly labelled; no active fast will be inferred from old logs or invented via new storage.

Planned shared contracts: local date-only boundaries; Sunday–Saturday current week through today; current-day hydration/meditation records; selected cardio day/week target exactly once; completed fasts attributed to end date, duration achievement against fastingHours, recent consistency against ten calendar days. Historical calendar-day and logged-day analytics stay separate. Goal precedence: valid unified field, valid legacy field, valid embedded hydration goal, existing domain default (64 oz / 20 min / 16 h); invalid explicit values yield a safe zero target rather than a success/default rewrite. No writes while reading, initializing, rolling over or computing.
