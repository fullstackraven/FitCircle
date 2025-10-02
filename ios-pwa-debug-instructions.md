# iOS PWA Debugging Instructions

## How to Capture Console Errors and Network Panel

Since the white screen issue occurs in the iOS PWA but not in the Replit preview, we need to inspect the actual PWA to see what's happening.

### Method 1: Safari Remote Debugging (Recommended)

**Requirements:**
- Mac computer with Safari
- iOS device connected via USB or same WiFi network

**Steps:**
1. **On iOS Device:**
   - Open Settings → Safari → Advanced
   - Enable "Web Inspector"
   - Open your FitCircle PWA app

2. **On Mac:**
   - Open Safari
   - Go to Safari → Settings → Advanced
   - Enable "Show Develop menu in menu bar"
   - In menu bar: Develop → [Your iOS Device Name] → [FitCircle PWA]
   - This opens Safari Web Inspector

3. **Capture Logs:**
   - Go to Settings in the PWA
   - **In Web Inspector, open these tabs:**
     - **Console tab** - for JavaScript errors
     - **Network tab** - for 404s and failed requests
   - **Clear both logs**
   - **Tap "Force Refresh" button**
   - **Take screenshots of:**
     - Any red errors in Console
     - Any failed/404 requests in Network (especially `main.*.js` files)
     - The timing of when white screen appears

### Method 2: eruda Console (In-App Debug Tool)

If you don't have a Mac, we can add eruda (mobile console) to the app:

**Temporary addition to `client/index.html` before `</head>`:**
```html
<script src="https://cdn.jsdelivr.net/npm/eruda"></script>
<script>eruda.init();</script>
```

Then in PWA:
- Open the floating eruda icon (bottom right)
- Go to Console and Network tabs
- Tap Force Refresh
- Screenshot any errors

### What GPT-5 Needs to See

**Console Tab:**
- Any red JavaScript errors
- Failed module loads
- Service worker errors
- Timing of when errors appear (before/during/after reload)

**Network Tab:**
- HTTP status codes (especially 404s)
- Failed requests for `main.*.js` or `index.*.js`
- Failed requests for `/index.html`
- Cache status (from cache vs network)
- Timing: which requests happen before vs after the white screen

### Key Questions to Answer:
1. Does the white screen show immediately or after reload?
2. Are there 404 errors for JavaScript bundles?
3. Does `/index.html` load successfully (200/304)?
4. Are old cached JavaScript files being requested but no longer exist?
5. Does the service worker activate successfully?

### Quick Diagnostic Steps (No Tools Needed)

If debugging tools aren't available:
1. After white screen, try:
   - Pull to refresh (if it works)
   - Close PWA completely and reopen
   - Go to Safari, type the URL directly
2. Note if any of these fix it
3. Check if data persists (localStorage still intact)

## Current Status

**What Works:**
- Force Refresh works perfectly in Replit preview
- Deterministic SW update flow implemented
- No race conditions in code

**What Fails:**
- White screen occurs in actual iOS PWA after Force Refresh
- Likely causes:
  - Cache/asset version mismatch
  - Old service worker serving cached JS that references new files
  - Navigation timing issue specific to iOS PWA context
  - Index.html cached but pointing to non-existent JS bundles

## Files Included for GPT-5 Review

The codebase archive (`fitcircle-source.tar.gz`) includes:
- All client-side source code
- Service worker (`client/sw.js`)
- SW update hook (`client/src/hooks/use-service-worker-update.ts`)
- Settings page with Force Refresh (`client/src/pages/settings.tsx`)
- Index.html with SW registration (`client/index.html`)
- All configuration files (package.json, vite.config.ts, tsconfig.json)

Please provide this along with the console/network screenshots to GPT-5 for comprehensive analysis.
