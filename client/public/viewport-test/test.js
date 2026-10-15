// Deliberately standalone: no fitness-app imports, storage access, worker registration,
// telemetry, or navigation into the real application.
const shell = document.querySelector('.shell');
const main = document.querySelector('main');
const dock = document.querySelector('nav');
const report = document.querySelector('#report');
const variant = document.body.dataset.variant;
for (let i = 1; i <= 8; i++) {
  const card = document.createElement('p');
  card.className = 'card';
  card.textContent = `Synthetic test card ${i}`;
  document.querySelector('#tiles').append(card);
}
let frame = 0;
let taps = 0;
function capture() {
  const viewport = window.visualViewport;
  const landscape = screen.orientation?.type?.startsWith('landscape') || Math.abs(window.orientation) === 90;
  return {
    variant,
    standalone: matchMedia('(display-mode: standalone)').matches || navigator.standalone === true,
    statusStyle: document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')?.content ?? 'omitted (standard)',
    screenHeightOriented: landscape ? Math.min(screen.width, screen.height) : Math.max(screen.width, screen.height),
    innerHeight,
    visualHeight: viewport?.height ?? null,
    visualTop: viewport?.offsetTop ?? null,
    scale: viewport?.scale ?? null,
    shellBottom: shell.getBoundingClientRect().bottom,
    scrollBottom: main.getBoundingClientRect().bottom,
    dockBottom: dock.getBoundingClientRect().bottom,
    headerPaddingTop: getComputedStyle(document.querySelector('header')).paddingTop,
    dockPaddingBottom: getComputedStyle(dock).paddingBottom,
    focused: document.activeElement?.tagName,
    bottomControlTaps: taps,
    userAgent: navigator.userAgent,
  };
}
function update() {
  frame = 0;
  document.documentElement.style.setProperty('--dock-height', `${dock.getBoundingClientRect().height}px`);
  // Keep controls stationary when reports wrap differently during rotation/focus.
  const scrollTop = main.scrollTop;
  report.textContent = JSON.stringify(capture(), null, 2);
  main.scrollTop = scrollTop;
}
const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
new ResizeObserver(schedule).observe(dock);
window.addEventListener('resize', schedule);
window.addEventListener('orientationchange', schedule);
window.addEventListener('pageshow', schedule);
window.visualViewport?.addEventListener('resize', schedule);
window.visualViewport?.addEventListener('scroll', schedule);
document.addEventListener('focusin', schedule);
document.addEventListener('focusout', schedule);
document.querySelector('#bottom-target').addEventListener('click', () => {
  document.querySelector('#tap-status').textContent = `Tapped ${++taps}`;
  schedule();
});
document.querySelector('#copy').addEventListener('click', async () => {
  const text = JSON.stringify(capture(), null, 2);
  try {
    await navigator.clipboard.writeText(text);
    document.querySelector('#copy-status').textContent = 'Report copied. Include whether the bottom strip remains.';
  } catch {
    document.querySelector('#copy-status').textContent = 'Copy unavailable. Select the report text above to copy it.';
  }
});
update();
