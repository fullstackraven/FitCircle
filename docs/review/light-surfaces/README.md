# Light-mode surface definition

Focused correction to Home workout cards, Calendar date cells/Workout Statistics/Recent Activity and both Workout/Routine editors. Routines' existing `separator / .7` boundary is the reference.

- Light-only card boundary, using a 1px inset outline so card sizes, grid spacing and progress rings do not move. Native button focus-visible outlines remain owned by the existing focus treatment.
- Name fields and numeric input groups use the existing `surface-secondary` gray-blue fill and `separator` boundary. Three small semantic aliases live in the Light appearance block; only the named components consume them.
- Calendar's white current-month cells and tinted outside-month cells remain distinct; today's label, completed/recovery fills, activity dots and navigation are untouched.
- No Dark-mode selectors or tokens changed. No application logic, data, backups, service worker, release workflow or protected Food buttons changed.

## Review images

390×844 browser viewport, synthetic records, Light mode. Images are advisory review artifacts, not required pixel baselines.

| Surface | Before | After |
| --- | --- | --- |
| Home | [Before](home-before.png) | [After](home-after.png) |
| Calendar | [Before](calendar-before.png) | [After](calendar-after.png) |
| Workout editor | [Before](workout-before.png) | [After](workout-after.png) |
| Routine editor | [Before](routine-before.png) | [After](routine-after.png) |

## Essential validation

- Application TypeScript and regression-test TypeScript: pass.
- Production build: pass.
- Focused browser check: 2/2 cases pass, Light and Dark, 390×844. Verifies the new card/calendar/input materials, unchanged Dark editor materials, editable fields, disabled new-workout action, routine scheduling, Cancel and Add/Edit editor entry points. System preference follows emulated OS appearance.
- Visually reviewed Home, Calendar and editor captures. Dark selectors do not match the Light-only rules; existing Dark sheet/field fills and border widths are asserted.
- Physical iPhone verification unavailable. No broad screenshot-comparison run performed; wider regression coverage remains with existing CI.

Release classification: `release:patch`. Published starting release verified as `v2.16.2`; the normal workflow calculates any subsequent release after merge and successful publication. Not merged or deployed as part of this work.
