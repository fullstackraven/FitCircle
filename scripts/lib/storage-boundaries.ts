import type { Boundary } from './storage-audit';
// Exact reviewed generic loops; new call sites or changed counts require review.
export const storageBoundaries: Boundary[] = [
  {
    "file": "client/src/lib/backup.ts",
    "owner": "rollback",
    "expression": "key",
    "operations": [
      "getItem",
      "removeItem",
      "setItem"
    ],
    "reason": "Only validated restore-plan or validated recovery-journal keys; preserves originals on failure.",
    "count": 3
  },
  {
    "file": "client/src/lib/backup.ts",
    "owner": "applyRestore",
    "expression": "k",
    "operations": [
      "getItem"
    ],
    "reason": "Plan keys are checked with isAppKey and validateEntry before staging or writing.",
    "count": 1
  },
  {
    "file": "client/src/lib/backup.ts",
    "owner": "applyRestore",
    "expression": "key",
    "operations": [
      "setItem"
    ],
    "reason": "Plan keys are checked with isAppKey and validateEntry before staging or writing.",
    "count": 1
  },
  {
    "file": "client/src/lib/backup.ts",
    "owner": "createBackup",
    "expression": "key",
    "operations": [
      "getItem"
    ],
    "reason": "Enumerated keys pass isAppKey immediately before this read.",
    "count": 1
  },
  {
    "file": "client/src/lib/storage-utils.ts",
    "owner": "createStorageHook",
    "expression": "key",
    "operations": [
      "getItem",
      "setItem",
      "removeItem"
    ],
    "reason": "Generic wrapper; every createStorageHook call site is separately audited.",
    "count": 3
  },
  {
    "file": "client/src/pages/settings.tsx",
    "owner": "eraseAllData",
    "expression": "key",
    "operations": [
      "removeItem"
    ],
    "reason": "Existing user-confirmed erase operation, filtered by isAppKey; not a new source.",
    "count": 1
  },
  {
    "file": "scripts/sw-template.js",
    "owner": "<module>",
    "expression": "key",
    "operations": [
      "open"
    ],
    "reason": "Existing service worker reads build cache names; contains static assets only.",
    "count": 1
  },
  {
    "file": "scripts/export-legacy-backup.js",
    "owner": "<module>",
    "expression": "key",
    "operations": [
      "getItem"
    ],
    "reason": "Existing read-only legacy console exporter filters FitCircle keys.",
    "count": 1
  }
];
