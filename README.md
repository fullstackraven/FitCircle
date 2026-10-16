# FitCircle

*Your fitness. Your progress. Your data.*

FitCircle is a free, mobile-first fitness and wellness tracking app designed to make building healthy habits simple, visual, and personal.

From strength training and cardio to nutrition, hydration, fasting, and mindfulness, FitCircle brings your daily health and fitness tracking together in one place.

Built as a Progressive Web App (PWA), FitCircle works directly in your browser, can be installed on your phone, and supports offline use. No account, subscription, or cloud service is required.

[Open FitCircle](https://fullstackraven.github.io/FitCircle/)

---

## What Can FitCircle Do?

### Workout & Activity Tracking

- **Custom Workouts:** Create personalized exercises with daily targets, schedules, and optional weight tracking.
- **Progress Circles:** Track repetitions and daily goals through interactive, color-coded progress rings.
- **Workout Routines:** Organize workouts into routines and plan your training schedule.
- **Cardio Tracking:** Log walking, running, cycling, swimming, and other activities, including duration and distance.
- **Recovery & Statistics:** Track rest days, workout consistency, and progress over time.

### Health & Wellness

- **Hydration:** Track water and other beverages against daily goals.
- **Intermittent Fasting:** Time fasting sessions and review your history.
- **Meditation:** Use a built-in meditation timer and monitor consistency.
- **Body Measurements:** Record weight, body measurements, and changes over time.
- **Supplements:** Create custom supplement lists and track daily intake.

### Nutrition & Lifestyle

- **Food Tracking:** Record meals, calories, and macronutrients.
- **Food Database:** Browse foods and manage custom food entries.
- **Daily Journal:** Record personal reflections, moods, and wellness notes.
- **Energy Tracking:** Log daily energy levels and observe patterns.
- **Goals & Reminders:** Keep your fitness and wellness priorities organized.

### Progress & Insights

FitCircle turns everyday tracking into a clearer picture of your progress through interactive calendars, progress indicators, historical logs, and visual statistics.

Whether you’re working toward a new personal best or simply trying to stay consistent, the focus is on making progress easy to see.

---

## Designed for Everyday Use

FitCircle combines a clean, dark interface with large touch-friendly controls and simple navigation.

- **Mobile-first:** Designed for smartphones, with responsive support for larger screens.
- **Installable:** Add FitCircle to your home screen for an app-like experience.
- **Offline capable:** Continue tracking without an internet connection after the app has been loaded and cached.
- **Personalizable:** Customize workouts, schedules, targets, and your profile.
- **Private by design:** Your fitness records stay in your browser instead of being uploaded to an online account.

---

## Getting Started

1. [Open FitCircle](https://fullstackraven.github.io/FitCircle/) in your browser.
2. Create your first workout or explore the other tracking features.
3. Set your daily goals and start recording your progress.
4. Optionally install FitCircle on your device for convenient access.

**On iPhone:** [Open FitCircle](https://fullstackraven.github.io/FitCircle/) in Safari, use the Share menu, and select **Add to Home Screen**.

FitCircle does not require registration or a login.

**Existing iPhone installations:** Open FitCircle online and relaunch it to receive updates. iOS may retain older status-bar presentation settings for an installed app. Keep your existing installation and records; do not clear website data or remove the app to troubleshoot the bottom dock. See the [iPhone presentation notes](docs/diagnostics/status-bar-presentation-test.md#approved-production-integration) if a bottom strip persists.

---

## Your Data, Your Control

FitCircle is built around local-first storage. Your workouts, health logs, goals, and other records are stored on your device in your browser’s local storage.

There is no FitCircle account, hosted database, or automatic cloud synchronization.

You can export your information as a JSON backup and restore it through the app’s Settings page.

**Important things to know:**

- Your data does not automatically transfer between devices or browsers.
- Clearing browser or website data may erase your records.
- Export regular backups, especially before changing devices or browsers.
- Backup files may contain sensitive personal information, so store them securely.

### Moving from Replit?

If you previously used FitCircle through Replit, export your data from that version before switching to GitHub Pages.

Browser storage does not transfer automatically between the two websites. Use the backup and restore options in Settings, and keep your original backup until you’ve verified your records in the new app.

Older versions that stored custom foods in IndexedDB may require the [additional migration instructions included in the repository](scripts/export-legacy-backup.js).

---

## For Developers

FitCircle is an open-source React and TypeScript application built with Vite, Tailwind CSS, Wouter, and Recharts.

It runs entirely in the browser and is deployed as a static website using GitHub Pages.

### Run Locally

Requires Node.js 22 or newer.

```bash
git clone https://github.com/fullstackraven/FitCircle.git
cd FitCircle
npm ci
npm run dev
```

### Build & Test

```bash
npm run check
npm test
npm run build
npm run test:e2e
```

The production build is generated in `dist/`. GitHub Actions handles automated testing and deployment from the `main` branch.

For deployment configuration, see the [GitHub Pages workflow](.github/workflows/pages.yml).

---

## Contributing

Suggestions, bug reports, and contributions are welcome. Open a [GitHub issue](https://github.com/fullstackraven/FitCircle/issues) to share feedback or submit a [pull request](https://github.com/fullstackraven/FitCircle/pulls) with proposed improvements.

## License

FitCircle is licensed under the MIT License. See the LICENSE file for details.

---

**FitCircle — Build consistency. Track progress. Own your data.**
