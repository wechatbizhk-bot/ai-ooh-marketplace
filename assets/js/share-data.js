/* ============================================================================
 * 3dNakedEye — share-data.js
 * The affiliate share-link model, as demonstrated on affiliate.html.
 *
 * Everything here is configuration for the demo: where a partner can send
 * traffic, what may trigger a commission, the cookie windows, and the networks
 * a partner may already work with (named as third-party references, in the same
 * way video.html names the platforms it links out to — we operate none of them).
 * ==========================================================================*/

window.LG_SHARE = {
  /* the pages worth sharing, in the order a partner would use them */
  destinations: [
    { page: 'marketplace.html', i18n: 'af.d_market', icon: '⌖' },
    { page: 'location.html?id=LC-1042', i18n: 'af.d_location', icon: '◉' },
    { page: 'price-list.html', i18n: 'af.d_prices', icon: '⌗' },
    { page: 'catalog.html', i18n: 'af.d_catalog', icon: '▤' },
    { page: 'holobox.html', i18n: 'af.d_holobox', icon: '⬒' },
    { page: 'led-film.html', i18n: 'af.d_glass', icon: '▥' },
    { page: 'calculator.html', i18n: 'af.d_calc', icon: '⟷' },
    { page: 'studio.html', i18n: 'af.d_studio', icon: '✧' },
    { page: 'membership.html', i18n: 'af.d_member', icon: '★' },
    { page: 'preview.html', i18n: 'af.d_preview', icon: '⇪' }
  ],

  /* what a share can earn on — the three switches the supplier dashboard shows */
  earnEvents: [
    { id: 'order', i18n: 'af.e1', on: true },
    { id: 'signup', i18n: 'af.e2', on: true },
    { id: 'subscribe', i18n: 'af.e3', on: false }
  ],

  /* commission models a merchant can choose between */
  models: [
    { id: 'pct8', kind: 'pct', value: 0.08, i18n: 'af.m1' },
    { id: 'pct12', kind: 'pct', value: 0.12, i18n: 'af.m2' },
    { id: 'flat150', kind: 'flat', value: 150, i18n: 'af.m3' }
  ],

  /* the cookie window: how long a click keeps its claim on an order */
  windows: [7, 30, 90],

  /* where a link gets shared, grouped the way the brief groups it */
  channels: [
    { id: 'social', i18n: 'af.ch1', detail: 'af.ch1_d', icon: '◍' },
    { id: 'content', i18n: 'af.ch2', detail: 'af.ch2_d', icon: '▶' },
    { id: 'message', i18n: 'af.ch3', detail: 'af.ch3_d', icon: '✉' }
  ],

  /* third-party tracking networks a partner may already use. We run none of
   * them; they are here so the page is honest about the industry landscape. */
  networks: [
    { id: 'awin', name: 'Awin / ShareASale', url: 'https://www.awin.com/', note: 'af.n1_d' },
    { id: 'impact', name: 'impact.com', url: 'https://impact.com/', note: 'af.n2_d' },
    { id: 'direct', name: 'Direct with the merchant', url: '', note: 'af.n3_d' }
  ]
};
