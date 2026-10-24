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
