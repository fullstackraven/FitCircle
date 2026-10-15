const base = import.meta.env.BASE_URL;

// GitHub Pages serves 404.html for clean SPA routes. Recover the route through
// the real entry point so initial navigation never depends on a service worker.
export function restorePagesRoute() {
  const params = new URLSearchParams(location.search);
  const route = params.get('__fitcircle_route');
  if (route !== null && route.startsWith('/') && !route.startsWith('//')) {
    history.replaceState(null, '', base.slice(0, -1) + route);
  }
}

export function registerPWA() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  const register = () => {
    navigator.serviceWorker.register(`${base}sw.js`, { scope: base, updateViaCache: 'none' })
      .catch(error => console.error('Offline installation failed:', error));
  };
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
}
