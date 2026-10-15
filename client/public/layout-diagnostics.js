/** Developer-invoked only. No auto-start, app imports, storage access or uploads. */
export function captureViewportGeometry(options = {}) {
  const describe = el => {
    const r = el.getBoundingClientRect(), s = getComputedStyle(el);
    const backdrop = s.backdropFilter || s.webkitBackdropFilter || 'none';
    const edges = name => Object.fromEntries(['Top', 'Right', 'Bottom', 'Left'].map(edge => [edge.toLowerCase(), s[name + edge]]));
    return { element: el.id || el.className || el.tagName,
      rect: { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height },
      overflow: { x: s.overflowX, y: s.overflowY }, position: s.position,
      height: s.height, minHeight: s.minHeight, maxHeight: s.maxHeight,
      padding: edges('padding'), margin: edges('margin'),
      transform: s.transform, filter: s.filter, backdropFilter: backdrop,
      perspective: s.perspective, willChange: s.willChange, isolation: s.isolation,
      clipPath: s.clipPath, contain: s.contain, contentVisibility: s.contentVisibility,
      fixedContainingBlockCandidate: s.transform !== 'none' || s.filter !== 'none' || backdrop !== 'none' || s.perspective !== 'none' || /layout|paint|strict|content/.test(s.contain) || /transform|perspective|filter/.test(s.willChange),
      scrollHeight: el.scrollHeight, clientHeight: el.clientHeight, scrollTop: el.scrollTop };
  };
  const selectors = ['.app-shell', '.app-header', '.app-content', '.app-page', '.app-dock', '.app-dock nav'];
  const ancestors = [];
  for (let el = document.querySelector('.app-content'); el; el = el.parentElement) ancestors.push(describe(el));
  const elements = Object.fromEntries(selectors.map(sel => [sel, document.querySelector(sel) ? describe(document.querySelector(sel)) : null]));
  const probe = document.createElement('div');
  probe.dataset.viewportProbe = '';
  probe.style.cssText = 'all:initial;position:fixed;top:0;left:0;width:0;visibility:hidden;pointer-events:none;border:0;margin:0;padding:0;';
  const viewportUnits = {};
  let safeArea, appSafeArea;
  try {
    document.body.append(probe);
    for (const unit of ['vh', 'dvh', 'svh', 'lvh']) {
      const supported = CSS.supports('height', `100${unit}`);
      probe.style.height = supported ? `100${unit}` : '0px';
      viewportUnits[unit] = { supported, height: supported ? probe.getBoundingClientRect().height : null };
    }
    probe.style.height = '0px';
    probe.style.padding = 'env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px)';
    const readPadding = () => {
      const s = getComputedStyle(probe);
      return { top: s.paddingTop, right: s.paddingRight, bottom: s.paddingBottom, left: s.paddingLeft };
    };
    safeArea = readPadding();
    probe.style.padding = 'var(--safe-top, 0px) var(--safe-right, 0px) var(--safe-bottom, 0px) var(--safe-left, 0px)';
    appSafeArea = readPadding();
  } finally { probe.remove(); }
  const viewport = window.visualViewport;
  const candidates = {
    contentBottom: elements['.app-content']?.rect.bottom ?? null,
    shellBottom: elements['.app-shell']?.rect.bottom ?? null,
    cssDvh: viewportUnits.dvh.height,
    innerHeight: window.innerHeight,
    visualViewportBottom: viewport ? viewport.offsetTop + viewport.height : null,
    dockBottom: elements['.app-dock']?.rect.bottom ?? null,
    navigationBottom: elements['.app-dock nav']?.rect.bottom ?? null,
  };
  const observedCssY = Number.isFinite(options?.cutoffY) ? options.cutoffY : null;
  const differences = observedCssY === null ? [] : Object.entries(candidates)
    .filter(([, y]) => Number.isFinite(y))
    .map(([name, y]) => ({ name, y, deltaFromObserved: y - observedCssY }))
    .sort((a, b) => Math.abs(a.deltaFromObserved) - Math.abs(b.deltaFromObserved));
  return {
    capturedAt: new Date().toISOString(),
    innerHeight: window.innerHeight, outerHeight: window.outerHeight,
    innerWidth: window.innerWidth, clientHeight: document.documentElement.clientHeight,
    bodyClientHeight: document.body.clientHeight, devicePixelRatio: window.devicePixelRatio,
    visualViewport: viewport && { height: viewport.height, width: viewport.width, offsetTop: viewport.offsetTop, offsetLeft: viewport.offsetLeft, scale: viewport.scale },
    standaloneMedia: matchMedia('(display-mode: standalone)').matches,
    standaloneNavigator: navigator.standalone === true,
    standalone: matchMedia('(display-mode: standalone)').matches || navigator.standalone === true,
    screen: { width: screen.width, height: screen.height, availHeight: screen.availHeight, orientation: screen.orientation?.type || null },
    // Build identifiers help detect an older running shell without changing caches.
    entryScript: document.querySelector('script[type="module"][src]')?.getAttribute('src') || null,
    serviceWorkerController: navigator.serviceWorker?.controller?.scriptURL || null,
    viewportUnits, safeArea, appSafeArea,
    dockHeight: getComputedStyle(document.documentElement).getPropertyValue('--dock-height'),
    keyboard: document.documentElement.classList.contains('keyboard-open'),
    elements, ancestors,
    cutoffComparison: { observedCssY, candidates, differences,
      matchingWithinOneCssPixel: differences.filter(d => Math.abs(d.deltaFromObserved) <= 1).map(d => d.name),
      note: 'The cutoff coordinate must be observed/marked by a person. DOM geometry and hit testing do not measure WebKit compositor pixels or prove a paint bug.' },
  };
}

/** Invoke manually from the inspected Home Screen app or Safari console. */
export function startViewportDiagnostics() {
  window.fitcircleViewportDiagnostics?.stop?.();
  const panel = document.createElement('details');
  panel.dataset.viewportDiagnostics = '';
  panel.style.cssText = 'position:fixed;z-index:10000;right:8px;top:calc(env(safe-area-inset-top, 0px) + 8px);max-width:min(340px,calc(100vw - 16px));max-height:60vh;overflow:auto;background:#0f172a;color:#f8fafc;border:1px solid #94a3b8;border-radius:8px;padding:8px;font:12px/1.4 monospace;';
  const summary = document.createElement('summary');
  summary.textContent = 'Viewport diagnostics (developer tool)';
  panel.append(summary);
  const help = document.createElement('p');
  help.textContent = 'Scroll to the cutoff, then mark its edge. Capture reports geometry only; nothing is uploaded or saved to app storage.';
  panel.append(help);
  const actions = document.createElement('div');
  actions.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;';
  panel.append(actions);
  const output = document.createElement('pre');
  output.style.cssText = 'white-space:pre-wrap;overflow-wrap:anywhere;max-height:30vh;overflow:auto;';
  panel.append(output);
  let cutoffY = null, cutoffViewport = null, report = null, picker = null, marker = null;
  const viewportSignature = () => [innerWidth, innerHeight, visualViewport?.height, visualViewport?.offsetTop, visualViewport?.scale].join(':');
  const capture = () => {
    if (cutoffViewport !== null && cutoffViewport !== viewportSignature()) {
      cutoffY = null; cutoffViewport = null; marker?.remove(); marker = null;
      help.textContent = 'Viewport changed. Mark the cutoff again before comparing coordinates.';
    }
    report = captureViewportGeometry({ cutoffY });
    output.textContent = JSON.stringify(report, null, 2);
    return report;
  };
  const button = (label, run) => {
    const el = document.createElement('button');
    el.type = 'button'; el.textContent = label;
    el.style.cssText = 'min-height:44px;padding:8px;background:#1e293b;color:#fff;border:1px solid #64748b;border-radius:4px;';
    el.addEventListener('click', run); actions.append(el);
  };
  const mark = () => {
    picker?.remove(); marker?.remove();
    picker = document.createElement('div');
    picker.dataset.viewportCutoffPicker = '';
    picker.style.cssText = 'position:fixed;inset:0;z-index:10001;cursor:crosshair;touch-action:none;';
    const hint = document.createElement('p');
    hint.textContent = 'Tap the horizontal cutoff edge. Escape cancels.';
    hint.style.cssText = 'margin:0;position:absolute;top:calc(env(safe-area-inset-top, 0px) + 60px);left:8px;padding:8px;background:#0f172a;color:white;font:14px monospace;';
    const cancel = document.createElement('button');
    cancel.type = 'button'; cancel.textContent = 'Cancel';
    cancel.style.cssText = 'min-height:44px;margin-left:8px;padding:8px;background:#1e293b;color:white;border:1px solid #94a3b8;';
    cancel.addEventListener('pointerdown', event => event.stopPropagation());
    cancel.addEventListener('click', event => { event.stopPropagation(); picker?.remove(); picker = null; });
    hint.append(cancel);
    picker.append(hint);
    picker.addEventListener('pointerdown', event => {
      event.preventDefault(); event.stopPropagation();
      cutoffY = event.clientY;
      cutoffViewport = viewportSignature();
      // Keep the selection layer until pointer-up/click so no tap leaks to a card.
      const selectedPicker = picker;
      const removePicker = () => { selectedPicker?.remove(); if (picker === selectedPicker) picker = null; };
      selectedPicker.addEventListener('click', removePicker, { once: true });
      marker = document.createElement('div');
      marker.dataset.viewportCutoffMarker = '';
      marker.style.cssText = `position:fixed;left:0;right:0;top:${cutoffY}px;border-top:1px solid #f87171;z-index:9999;pointer-events:none;`;
      document.body.append(marker);
      capture();
    }, { once: true });
    document.body.append(picker);
  };
  const escape = event => { if (event.key === 'Escape') { picker?.remove(); picker = null; } };
  const stop = () => {
    panel.remove(); picker?.remove(); marker?.remove();
    document.removeEventListener('keydown', escape);
    if (window.fitcircleViewportDiagnostics === api) delete window.fitcircleViewportDiagnostics;
  };
  button('Capture', capture);
  button('Mark cutoff', mark);
  button('Copy JSON', async () => {
    const json = JSON.stringify(capture(), null, 2);
    try { await navigator.clipboard.writeText(json); help.textContent = 'Report copied. Paste it into the issue or chat; it contains geometry, not fitness records.'; }
    catch { help.textContent = 'Clipboard unavailable. Read the report in the console with fitcircleViewportDiagnostics.capture().'; }
  });
  button('Close', stop);
  const api = { capture, mark, stop };
  window.fitcircleViewportDiagnostics = api;
  document.addEventListener('keydown', escape);
  document.body.append(panel);
  capture();
  return api;
}
