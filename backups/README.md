# Auto Backups

This directory contains automatically generated nightly backups of the FitCircle app's complete state.

## File Structure

Each auto-backup is saved as a JSON file with the following structure:

```json
{
  "id": "backup-1234567890",
  "timestamp": "2025-07-31T04:00:00.000Z",
  "localDate": "2025-07-31",
  "deviceId": "a1b2c3d4",
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

Auto-backup files are named: `fitcircle-auto-backup-{deviceId}-YYYY-MM-DD.json`

Where:
- `{deviceId}` is a unique 8-character identifier for each device/user
- `YYYY-MM-DD` is the backup date

This ensures multiple users can't overwrite each other's backups and makes it easy to identify which device created each backup.

## Recovery

In case of localStorage data loss, developers can:
1. Find the appropriate backup file by date
2. Extract the `data` object from the backup
3. Restore individual localStorage items as needed