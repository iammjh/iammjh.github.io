'use strict';

// Keep every public entry point on the same cache version, including direct case-study visits.
if ('serviceWorker' in navigator && window.isSecureContext) {
  const register = () => {
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(() => {
      // The portfolio remains usable when offline caching is unavailable.
    });
  };
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
}
