# Auto Backups

This directory contains automatically generated nightly backups of the FitCircle app's complete state.

## File Structure

Each auto-backup is saved as a JSON file with the following structure:

```json
{
  "id": "backup-1234567890",
  "timestamp": "2025-07-31T04:00:00.000Z",
  "localDate": "2025-07-31",
  "type": "auto-backup", 
  "data": {
    "fitcircle_workouts": "...",
    "fitcircle_hydration_data": "...",
    "fitcircle_measurements": "...",
    "fitcircle_goals": "...",
    // ... all localStorage data
  },
  "itemCount": 25
}
```

## Backup Schedule

- Auto-backups run nightly at midnight (local time) when enabled in Settings
- Only one backup per day is kept (overwrites if multiple backups on same date)
- User can enable/disable auto-backup feature via Settings page toggle

## Manual Backups

Users can still create manual backups via the "Download Complete Backup" button in Settings, which downloads a JSON file to their device.

## File Naming

Auto-backup files are named: `fitcircle-auto-backup-YYYY-MM-DD.json`

This makes it easy to identify the date and distinguish from manual backups.

## Recovery

In case of localStorage data loss, developers can:
1. Find the appropriate backup file by date
2. Extract the `data` object from the backup
3. Restore individual localStorage items as needed