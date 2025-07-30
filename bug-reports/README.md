# Bug Reports

This directory contains user-submitted bug reports in JSON format.

## File Structure

Each bug report is saved as a JSON file with the following structure:

```json
{
  "id": "bug-1234567890",
  "timestamp": "2025-07-30T18:52:00.000Z",
  "summary": "Brief description of the issue",
  "hasHappenedMoreThanOnce": "yes/no",
  "stepsToReproduce": "Detailed steps to reproduce the issue",
  "expectedResult": "What should have happened",
  "actualResult": "What actually happened",
  "comments": "Additional user comments",
  "includeLogs": true/false,
  "technicalInfo": {
    "userAgent": "Browser and OS information",
    "url": "Page where issue occurred",
    "timestamp": "When the issue was reported"
  },
  "status": "new"
}
```

## Reviewing Reports

1. Check this directory regularly for new bug reports
2. Each report is timestamped and has a unique ID
3. You can update the `status` field to track progress:
   - `new` - Just reported
   - `in-progress` - Being worked on
   - `resolved` - Fixed
   - `duplicate` - Same as another report
   - `wont-fix` - Not going to be addressed

## File Naming

Files are named: `bug-report-YYYY-MM-DDTHH-mm-ss-sssZ.json`

This makes it easy to sort them chronologically and identify when they were submitted.