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
    testRevision: 'rounded-dock-v3',
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
    dockHeight: dock.getBoundingClientRect().height,
    dockControls: Array.from(dock.querySelectorAll('button')).map(button => ({
      label: button.textContent,
      bottom: button.getBoundingClientRect().bottom,
      height: button.getBoundingClientRect().height,
      iconBottom: button.querySelector('svg').getBoundingClientRect().bottom,
      labelBottom: button.querySelector('span').getBoundingClientRect().bottom,
    })),
    headerPaddingTop: getComputedStyle(document.querySelector('header')).paddingTop,
    dockPaddingBottom: getComputedStyle(dock).paddingBottom,
    focused: document.activeElement?.tagName,
    bottomControlTaps: taps,
    userAgent: navigator.userAgent,
  };
}
function update() {
  frame = 0;
  document.documentElement.style.setProperty('--dock-height', `${document.querySelector('.test-dock').getBoundingClientRect().height}px`);
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
dock.querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
  dock.querySelectorAll('button').forEach(tab => tab.removeAttribute('aria-current'));
  button.setAttribute('aria-current', 'page');
  document.querySelector('#tap-status').textContent = `${button.textContent} tapped (${++taps} total)`;
  schedule();
}));
document.querySelector('#toggle-boundary').addEventListener('click', event => {
  const boundary = document.querySelector('.boundary');
  boundary.hidden = !boundary.hidden;
  event.currentTarget.textContent = boundary.hidden ? 'Show cyan boundary' : 'Hide cyan boundary';
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
