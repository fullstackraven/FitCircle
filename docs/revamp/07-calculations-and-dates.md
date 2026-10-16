# Dates, time and fitness calculations

All formulas were inspected; no fitness formula changes in batch A. Local day helpers construct YYYY-MM-DD from local components and parse legacy MM/DD/YYYY. parseLocalDate currently normalizes impossible dates rather than validating them. ISO day-key comparisons are safe only for validated zero-padded dates. Month grouping reparses English month names; this deserves cross-engine tests rather than a claimed Safari failure.

| Area | Current semantics / evidence | Required fixtures |
| --- | --- | --- |
| Calendar inclusive days | elapsed milliseconds divided by24h and ceil; fall DST gives3 rather than2 (FC-007) | US spring/fall, Europe/Australia, leap/year, same/reversed/invalid days |
| Workout consistency | separate floor24h denominators; historical goalAtTime vs current goal; schedule/routine rules | Spring DST, goal changes, mixed log forms, deleted workouts, routine schedule precedence |
| Hydration/cardio/meditation averages | Include zero days from first date through today; daily aggregation differs by storage shape | No logs, sparse history, multiple sessions, zero goals, units and rounding |
| Fasting | Hook duration is minutes; all-time average converts to hours, filters >0 and <48h, includes zero days | Cross-midnight, DST elapsed duration, incomplete fast,48h boundary, legacy strings |
| Goal progress helpers | Some legacy helpers assume arrays; current meditation data is dailyLogs object; dormant GoalsWidget affected | Current+legacy schemas before widget integration |
| Workout duration | Date.now wall time minus accumulated pauses; paused reload loses pause start (FC-008) | Pause/reload/resume, stop paused, suspension, midnight ownership |
| Countdown and meditation | Callback-counting; active state in memory (FC-023) | Delayed callbacks, route unmount, iOS backgrounding/audio |
| Calculator | Mifflin-style sex/age/height/weight equation, lb→kg/in→cm, activity multiplier, rate/calorie and macro presets | Fixed male/female profiles, each activity/goal/style, custom percentages, rounding; wrong age source FC-011 |
| Food totals | Serving multiplier on base nutrition, per-meal sum, rounded display; separate per100g helper | Fractional/multiple servings, zero nutrients, g/oz/volume semantics FC-012/013 |
| Body measurements | Sorted date history, latest/trend, weight direction/goals | Historical edit vs latest scalar, duplicate dates, unit labels |

The executed synthetic DST probe uses America/New_York and reports expected2/actual3 for Nov1→2 2026; spring Mar8→9 gives2. This does not validate every timezone. New baseline date tests should protect existing local parsing, leap boundaries and zero-data calculations without freezing a known bad DST result as expected behavior. The roadmap assigns the correction and additional DST matrix to a separate PR.

No live clock or real device timezone was changed. Browser tests use isolated clocks/contexts. Daily reset coverage distinguishes clearing today's counter from retaining yesterday's history. Physical suspension across midnight and timezone changes remain manual acceptance work.
