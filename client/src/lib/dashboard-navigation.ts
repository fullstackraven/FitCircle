export function dashboardContext() {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get('returnTo');
  return {
    fromDashboard: params.get('from') === 'dashboard',
    returnTo: requested && ['/', '/calendar', '/routines', '/wellness', '/reminders'].includes(requested) ? requested : '/',
  };
}
export function dashboardQuery(returnTo: string) {
  return `?from=dashboard&returnTo=${encodeURIComponent(returnTo)}`;
}
export function reopenDashboard() {
  try { sessionStorage.setItem('fitcircle_dashboard_open', 'true'); } catch { /* Navigation remains available without session storage. */ }
}

/** Keep touch opening from highlighting the first navigation destination.
 * The dialog remains focused/trapped; Tab still reaches the profile first. */
export function focusDashboardOnOpen(event: Event) {
  event.preventDefault();
  if (event.target instanceof HTMLElement) event.target.focus({ preventScroll: true });
}

export function returnDashboardFocus(event: Event) {
  const trigger = document.querySelector<HTMLButtonElement>('button[aria-label="Open Menu"], button[title="Open Menu"]');
  if (trigger) {
    event.preventDefault();
    trigger.focus({ preventScroll: true });
  }
}
