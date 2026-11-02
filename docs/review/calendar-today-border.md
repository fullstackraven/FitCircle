# Calendar Today border

Only today's in-month date tile receives a 2px inset border. The existing `text-secondary` token resolves exactly to Light `#475569` and Dark `#CBD5E1`; System follows the resolved appearance normally.

A non-interactive, border-box pseudo-element follows the existing tile radius. It paints inside the tile without altering dimensions, positioning, activity dots or click handling. Only today's former subtle Light outline is suppressed so it cannot overlap the new 2px stroke; all other tiles retain their materials. The existing green number logic and completion/recovery styles are unchanged.

The existing date-fns local `isToday` check is gated by the existing `isSameMonth` result, so adjacent-month cells cannot acquire the border. The existing read-only Wellness clock requests renders at local midnight and resume; no new date calculations or persistent state are introduced.

## Focused verification

- Application TypeScript, regression TypeScript and production build: pass.
- Four Calendar browser cases: **4/4 pass**, covering exact colors/2px stroke, green number, unaltered other-day pseudo-elements, equal tile sizes, 320px overflow, month navigation and current-date navigation/return, System switching, local midnight and month rollover, adjacent-month exclusion and completed-workout styling with the border visible.

No unrelated audit or screenshot suite. No storage, workout/activity calculations, routing, page layout, header/dock, dependencies or PWA changes. Physical iPhone verification unavailable. `release:patch`; no merge or deployment. CI runs asynchronously after push and is not monitored.
