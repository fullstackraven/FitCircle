# Two-button green correction

Only Home's Start Workout Session and Routines' existing Create Routine (+) action change colors. The current Routines implementation uses a full-width Create Routine bar; its position, size, shape and behavior are retained. The empty-state Add Routines control is untouched.

Both buttons now use the existing `accent-text` token as their background: Light `#15803D`, Dark `#4ADE80`. The existing `on-selected-action` foreground supplies white in Light and dark ink in Dark. Child text/icons inherit it. Routines retains its existing hover background with a contrasting white hover foreground.

Home no longer consumes its separate neon gradient/glow tokens. Those now-unused four declarations were removed; no shared green token values were changed. All dimensions, spacing, typography and handlers remain. The Routines button's existing shadow treatment remains unchanged. No other buttons, indicators, workout colors, appearance switching, storage or navigation changed.

## Focused validation

- Application TypeScript, regression TypeScript and production build: pass.
- One focused browser case: pass at 390×844, verifying exact greens and text/icon colors, no gradient, stable geometry across Light→Dark/Dark→Light and explicit/System transitions, live OS changes while in System, routine-dialog opening and workout-session start.

No broad audit or screenshot suite. `release:patch`. CI runs asynchronously after push; no CI monitoring, merge or deployment.
