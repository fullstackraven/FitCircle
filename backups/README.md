# FitCircle Auto-Backup Files

This directory contains automatic daily backups of user localStorage data when the auto-backup feature is enabled.

## Purpose

Auto-backup creates daily snapshots of all localStorage data to prevent data loss and enable easy recovery or migration between devices.

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
    "fitcircle_workouts": {...},
    "fitcircle_goals": {...},
    "fitcircle_hydration_logs": {...},
    // ... all other localStorage keys
  },
  "itemCount": 15
}
```

## Manual Backups

Users can still create manual backups via the "Download Complete Backup" button in Settings, which downloads a JSON file to their device.

## File Naming

Auto-backup files are named: `fitcircle-auto-backup-{deviceId}-YYYY-MM-DD.json`

Where:
- `{deviceId}` is a unique 8-character identifier for each device/user
- `YYYY-MM-DD` is the backup date

This ensures multiple users can't overwrite each other's backups and makes it easy to identify which device created each backup.

## Data Recovery

To restore data from a backup:
1. Copy the `data` object contents from the backup file
2. Import each key-value pair back into localStorage
3. Refresh the app to load the restored data