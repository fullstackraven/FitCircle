// Read-only; usable in Playwright or pasted into Safari's remote console.
export function captureViewportGeometry() {
  const describe = el => {
    const r = el.getBoundingClientRect(), s = getComputedStyle(el);
    return { element: el.id || el.className || el.tagName,
      rect: { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height },
      overflow: { x: s.overflowX, y: s.overflowY }, position: s.position,
      height: s.height, minHeight: s.minHeight, maxHeight: s.maxHeight,
      padding: { top: s.paddingTop, bottom: s.paddingBottom },
      transform: s.transform, clipPath: s.clipPath, contain: s.contain,
      scrollHeight: el.scrollHeight, clientHeight: el.clientHeight, scrollTop: el.scrollTop };
  };
  const selectors = ['.app-shell', '.app-content', '.app-page', '.app-dock', '.app-dock nav'];
  const ancestors = [];
  for (let el = document.querySelector('.app-content'); el; el = el.parentElement) ancestors.push(describe(el));
  const s = getComputedStyle(document.documentElement);
  // Resolve env()-backed values through an isolated, temporary box.
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;padding:var(--safe-top) var(--safe-right) var(--safe-bottom) var(--safe-left)';
  document.body.append(probe);
  const ps = getComputedStyle(probe);
  const safeArea = { top: ps.paddingTop, right: ps.paddingRight, bottom: ps.paddingBottom, left: ps.paddingLeft };
  probe.remove();
  return { innerHeight, clientHeight: document.documentElement.clientHeight,
    visualViewport: window.visualViewport && { height: visualViewport.height, offsetTop: visualViewport.offsetTop, scale: visualViewport.scale },
    standalone: matchMedia('(display-mode: standalone)').matches || navigator.standalone === true,
    safeArea, dockHeight: s.getPropertyValue('--dock-height'), keyboard: document.documentElement.classList.contains('keyboard-open'),
    elements: Object.fromEntries(selectors.map(sel => [sel, document.querySelector(sel) ? describe(document.querySelector(sel)) : null])), ancestors };
}
