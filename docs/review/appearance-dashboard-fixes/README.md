# Live appearance chrome and dashboard focus

## Changes

The existing appearance controller mutated `theme-color.content` but did not explicitly synchronize the root inline paint color. The reported installed-iPhone behavior retained the previous status-area tint until refresh, although application tokens changed correctly. On a resolved appearance change, the controller now synchronizes the root background and replaces a mismatched theme-color element, prompting browser chrome to re-read it. Unchanged metadata is left alone; missing metadata is created. System changes use the same path. No reload, launch metadata changes, viewport changes, timer interruption, or storage migration is introduced.

The dashboard's Radix dialog previously auto-focused its first button, My Fitness Profile, producing the unwanted native outline on touch opening. All five dashboard entry pages now focus the dialog container on opening. Keyboard Tab still reaches the profile first, with an explicit visible focus indicator. Closing restores focus to the menu button when it is still present; navigation to another page remains unchanged. Shared sheets outside dashboard navigation retain their existing focus behavior.

## Validation and limitations

- Application TypeScript check and regression TypeScript check passed.
- Existing appearance unit tests: 16 passed; DOM mocks support metadata replacement.
- New focused browser tests: six passed, covering live Light/Dark/System paint and metadata changes without reload, plus touch opening, keyboard focus, Escape and focus restoration across Home, Calendar, Routines, Wellness and Reminders.
- Production build passed. Browser checks use system Chromium. Complete regression CI remains with GitHub Actions.

The native installed-iOS status bar cannot be simulated by desktop Chromium. The web-document update is verified; physical confirmation remains required. Test both theme directions without refreshing, System changes while open and after resuming, Safari and installed PWA. Check status text contrast and top safe areas. iOS controls native launch/status-bar behavior and may impose platform limitations; no native-level guarantee or physical-device validation is claimed. No speculative status-bar style/launch-screen changes were made.

The latest published version when implemented is 2.12.0. This fix uses `release:patch`; the workflow computes the next version after approval/merge. No fitness storage, backups, service-worker caching, or production release settings change.
