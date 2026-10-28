/** Keep this inventory aligned with App.tsx; the consistency test checks it. */
export const visualRoutes = [
  ['/', 'Home'], ['/calendar', 'Calendar'], ['/profile', 'Fitness profile'],
  ['/measurements', 'Measurements'], ['/fitness-calculator', 'Calculator'],
  ['/fasting', 'Fasting'], ['/meditation', 'Meditation'], ['/hydration', 'Hydration'],
  ['/food-tracker', 'Food tracker'], ['/food-database', 'Food database'],
  ['/restore-custom-foods', 'Restore foods'], ['/cardio', 'Cardio'],
  ['/workout-statistics', 'Workout statistics'], ['/daily-journal', 'Daily journal'],
  ['/journal-log', 'Journal'], ['/journal-entry', 'Journal composer'],
  ['/energy-level', 'Energy'], ['/supplements-page', 'Supplements'], ['/recovery', 'Recovery'],
  ['/dynamic-overview/2026-10-19', 'Dynamic overview'], ['/routines', 'Routines'],
  ['/wellness', 'Wellness'], ['/reminders', 'Reminders'],
  ['/account-data', 'Account data'], ['/display', 'Display'], ['/share', 'Share'],
  ['/about/terms', 'Terms'], ['/about/privacy', 'Privacy'], ['/about/licenses', 'Licenses'],
  ['/about/releases', 'Release history'], ['/about', 'About'], ['/settings', 'Compatibility settings'],
  ['/not-a-fitcircle-route', 'Not found'],
] as const;
