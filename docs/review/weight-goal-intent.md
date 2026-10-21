# Calculator goal progress follows selected intent

The calculator previously inferred progress direction solely from the first recorded weight and target, ignoring the selected Lose/Maintain/Gain option.

- Lose: percentage of the recorded starting-to-target loss achieved, clamped to 0–100%.
- Gain: percentage of the recorded starting-to-target gain achieved, clamped to 0–100%.
- Maintain: checks current weight against the target using the existing 0.5 lb tolerance; shows “At goal weight” or distance from goal rather than a loss/gain percentage.
- A target on the wrong side of the recorded starting weight does not display a misleading loss/gain percentage. A concise prompt explains which side to choose.
- Selecting an objective never changes the saved target or measurement history. Existing three-argument progress consumers retain their prior behavior.

This remains a progress indicator from the first recorded weight, not a newly inferred or persisted goal-start baseline. No new storage keys, migrations, nutrition formulas, or unrelated UI changes.

Regression coverage includes loss/gain, movement away from target, overshoot, incompatible target directions, maintenance tolerance, missing baseline, and live intent switching in the calculator.

Validation:
- Application and regression TypeScript: passed.
- Unit tests: 248 passed, zero failures.
- Storage audit: 200 call sites, zero errors.
- Production build: passed (existing bundle-size/Browserslist warnings).
- Full browser suite: 198 passed. After the final equal-baseline guard adjustment, rebuilt and reran all seven calculator/measurement integration browser tests: seven passed.
- Git whitespace check: passed.

Synthetic data only. Physical iPhone Safari/PWA verification was not performed.
