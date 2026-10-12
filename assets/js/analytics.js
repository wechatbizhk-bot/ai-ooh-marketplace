/* Shared GA4 loader — loads gtag only when __GA_MEASUREMENT_ID is non-empty. */
(function () {
  'use strict';
  var id = (typeof window !== 'undefined' && window.__GA_MEASUREMENT_ID)
    ? String(window.__GA_MEASUREMENT_ID).trim()
    : '';
  if (!id || window.__ga4Loaded) return;
  window.__ga4Loaded = true;
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'granted'
  });
  gtag('config', id, { anonymize_ip: true });
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
  document.head.appendChild(s);
})();
