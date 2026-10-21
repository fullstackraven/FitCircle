# Current-weight comparison for calculator goals

PR #59 incorrectly rejected a loss target above the original historical starting weight (and the reverse for gain). The calculator now compares only the latest valid current weight, saved target and selected objective.

- Lose: pounds remaining = max(0, current − target).
- Gain: pounds remaining = max(0, target − current).
- Maintain: distance from target; within the existing 0.5 lb tolerance displays “At goal weight.”
- Reaching/passing a loss or gain target displays “Goal reached.”
- No original-start-weight restrictions or prompts remain in the calculator.

Example: first recorded weight 200 lb, current 210 lb, target 205 lb, Lose selected → **5.0 lb to lose**. First recorded 200 lb, current 190 lb, target 195 lb, Gain selected → **5.0 lb to gain**.

The old journey percentage/bar is replaced with pounds remaining. A journey percentage requires a relevant goal-start baseline, which is not available from current weight and target alone; historical measurements are not repurposed or rewritten to invent one. Other existing consumers of historical-baseline progress retain their behavior.

No storage keys, saved goals, nutrition formulas, backup formats, or measurement records change. Browser regressions cover both examples, direction changes, maintenance, reload and byte preservation.

## Validation

Application/regression TypeScript, all 248 unit tests, storage audit (200 call sites, zero errors), and production build passed. Full browser run: 197 passed, one failure in the unchanged `update.spec.ts:76` old-installed-shell recovery test (5-second timeout waiting for recovered index HTML). All seven calculator/measurement integration tests passed. The failed update test passed both unchanged isolated reruns (2/2); no PWA code or test timing was changed. This observed intermittent update-test failure remains separate from the goal correction. Git whitespace check passed. Synthetic data only; no physical iPhone Safari/PWA verification.
