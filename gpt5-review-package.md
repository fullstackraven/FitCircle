# FitCircle Force Refresh White Screen - GPT-5 Diagnostic Package

## Problem Summary

**Issue:** Force Refresh button works perfectly in Replit preview but causes white screen in actual iOS PWA.

**Context:**
- Implemented deterministic SW update flow per GPT-5 recommendations
- Removed all auto-reload listeners from index.html
- Updated SW fetch strategy to network-first with cached /index.html fallback
- React hook is now sole controller of SW updates
- No race conditions in code logic

**Status:** White screen still occurs in iOS PWA after tapping Force Refresh, despite all fixes.

## Files Included in Archive

### Critical Service Worker Files:
1. **client/sw.js** - Updated with tuned navigation strategy (cache v4)
2. **client/index.html** - Simplified SW registration (auto-reload listeners removed)
3. **client/src/hooks/use-service-worker-update.ts** - Deterministic waitForWaiting() implementation

### Force Refresh Implementation:
4. **client/src/pages/settings.tsx** - Force Refresh button handler using deterministic flow

### Configuration:
5. **vite.config.ts** - Vite build configuration
6. **package.json** - Dependencies and scripts
7. **tsconfig.json** - TypeScript configuration

### Full Source:
- All React components and hooks
- All utility functions
- Complete client-side codebase

## Key Implementation Details

### Current SW Registration (client/index.html):
```javascript
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(reg => {
        reg.update?.();
      })
      .catch(console.error);
  });
}
```

### Current Navigation Strategy (client/sw.js):
- Cache: `fitcircle-v4-2025-10-02`
- Precached: `['/', '/index.html', '/manifest.json', '/icon-192.png', '/icon-512.png']`
- Network-first for navigations with navigation preload
- Cached /index.html fallback for offline
- Atomic cache writes with `event.waitUntil()`
- Only caches successful HTML responses (`resp.ok` check)

### Current Force Refresh Flow (settings.tsx):
1. Check if SW supported
2. Get registration
3. Call `reg.update()`
4. Deterministically wait for waiting worker (no timeouts)
5. Attach controllerchange listener BEFORE SKIP_WAITING
6. Post SKIP_WAITING message
7. Wait for controllerchange
8. Reload after 50ms delay

## Questions for GPT-5

1. **Why does this work in Replit preview but not iOS PWA?**
   - Different caching behavior?
   - iOS-specific SW lifecycle quirks?
   - Timing issues with navigation preload on iOS?

2. **What could cause white screen despite:**
   - No auto-reload race conditions
   - Deterministic waiting
   - Proper cache fallbacks
   - Atomic cache writes

3. **Potential iOS PWA-specific issues:**
   - Does iOS PWA handle SW updates differently than Safari?
   - Is navigation preload causing issues?
   - Cache timing/availability during update?

4. **Next debugging steps:**
   - What specific errors should we look for in iOS console?
   - What Network panel patterns indicate the root cause?
   - Any iOS-specific SW workarounds needed?

## What User Needs to Provide

From actual iOS PWA (using Safari Remote Debugging or eruda):

### Console Tab:
- Any JavaScript errors (red)
- Failed module loads
- SW lifecycle events
- Timing of errors

### Network Tab:
- Status codes (especially 404s)
- Failed `main.*.js` or `index.*.js` requests
- `/index.html` load status
- Cache vs network indicators
- Request timing relative to white screen

## Hypothesis

Possible causes:
1. **Vite's hashed bundles**: Old cached index.html references new bundle hashes that don't exist in cache yet
2. **SW activation timing**: iOS PWA might activate SW differently than browser
3. **Navigation preload**: May not be compatible with iOS PWA context
4. **Cache clear timing**: Old caches deleted before new assets fully cached
5. **Index.html caching**: Despite fallback, might be serving stale version pointing to old bundles

## Expected Outcome

GPT-5 should be able to:
1. Identify iOS PWA-specific issue from error logs
2. Recommend iOS-compatible SW update strategy
3. Suggest cache management approach that works in PWA context
4. Provide iOS PWA testing methodology
