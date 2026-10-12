/* ============================================================================
 * 3dNakedEye — translate.js
 * Optional Google Translate widget: adds 100+ machine-translated languages on
 * top of the four built-in locales (EN / 繁體中文 / 简体中文 / ไทย).
 *
 * Two entry points:
 *   • one-click quick buttons (日本語, 한국어, Tiếng Việt, …) set the googtrans
 *     cookie and reload — no widget round-trip, works even if the widget fails
 *   • the standard TranslateElement dropdown for every other language
 * A `?gt=ja` link applies a language directly, so a translated page can be
 * shared. The third-party script is still loaded lazily.
 *
 * Requires the page to be served over http(s) — file:// blocks the widget.
 * ==========================================================================*/
(function () {
  'use strict';
  const CFG = window.LG_CONFIG;
  const A = () => window.LG.app;
  let opened = false, loading = false;

  const isFile = location.protocol === 'file:';
  const ORIGIN = location.hostname && location.hostname.indexOf('127.0.0.1') === 0 ? '' : location.hostname;
  const SOURCE = (CFG.translate && CFG.translate.pageLanguage) || 'en';

  /* Google stores the choice in a cookie shaped /source/target. */
  function setGoogTrans(target) {
    const value = target ? '/' + SOURCE + '/' + target : '';
    const expiry = target
      ? 'expires=Fri, 31 Dec 9999 23:59:59 GMT'
      : 'expires=Thu, 01 Jan 1970 00:00:00 GMT';
    ['googtrans', 'googtrans_c'].forEach(name => {
      document.cookie = name + '=' + value + '; ' + expiry + '; path=/';
      if (ORIGIN) document.cookie = name + '=' + value + '; ' + expiry + '; path=/; domain=.' + ORIGIN;
    });
  }

  function currentTarget() {
    const m = /googtrans=([^;]*)/.exec(document.cookie || '');
    if (!m) return '';
    const parts = decodeURIComponent(m[1]).split('/');
    return parts[2] || '';
  }

  function applyLanguage(code, opts) {
    setGoogTrans(code || '');
    if (opts && opts.noReload) return;
    const url = new URL(location.href);
    if (code) url.searchParams.set('gt', code); else url.searchParams.delete('gt');
    location.href = url.toString();
  }

  function buildUi() {
    const tools = document.querySelector('.nav__tools');
    if (!tools || document.getElementById('gtToggle')) return;

    const quick = (CFG.translate.quickLanguages || []);
    const active = currentTarget();

    const btn = document.createElement('button');
    btn.id = 'gtToggle';
    btn.type = 'button';
    btn.className = 'gt-toggle';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'gtPanel');
    btn.innerHTML = '<span aria-hidden="true">🌐</span><span class="gt-toggle__label" data-i18n="gt.more">More languages</span>';

    const panel = document.createElement('div');
    panel.id = 'gtPanel';
    panel.className = 'gt-panel';
    panel.hidden = true;
    panel.innerHTML = `
      <div class="gt-panel__head">
        <strong data-i18n="gt.title">Translate this page</strong>
        <button type="button" class="gt-panel__close" data-i18n-label="cta.cancel" aria-label="Close">&times;</button>
      </div>
      <p class="tiny muted" data-i18n="gt.lede">Machine translation by Google, on top of the built-in languages.</p>
      <p class="gt-quick__label tiny muted" data-i18n="gt.quick">Quick machine translation</p>
      <div class="gt-quick" id="gtQuick">
        ${quick.map(l => `<button type="button" class="chip${active === l.code ? ' is-active' : ''}" data-gt="${A().esc(l.code)}">${A().esc(l.label)}</button>`).join('')}
      </div>
      <p class="tiny muted" data-i18n="gt.quick_note">One click translates and reloads; the list below has 100+ languages.</p>
      <div id="google_translate_element" class="notranslate"></div>
      <p class="tiny muted gt-panel__note" id="gtNote" data-i18n="gt.note">Prices, addresses and legal text are always authoritative in the original language.</p>
      <p class="tiny muted gt-panel__note${active ? '' : ' is-empty'}" id="gtActive">${active ? A().esc(A().t('gt.active', { lang: activeLabel(active) })) : ''}</p>
      <div class="row">
        <button type="button" class="btn btn--ghost btn--sm" id="gtReset" data-i18n="gt.reset">Show original language</button>
        <a class="btn btn--quiet btn--sm" href="docs.html#locales" data-i18n="gt.docs">How localisation works</a>
      </div>`;

    tools.insertBefore(btn, tools.firstChild);
    document.body.appendChild(panel);
    A().applyStatic(panel);
    A().applyStatic(btn);

    if (isFile) {
      const note = panel.querySelector('#gtNote');
      note.textContent = A().t('gt.file_warning');
      note.classList.add('gt-panel__note--warn');
    }

    btn.addEventListener('click', () => {
      opened = !opened;
      panel.hidden = !opened;
      btn.setAttribute('aria-expanded', String(opened));
      if (opened) loadWidget();
    });
    panel.querySelector('.gt-panel__close').addEventListener('click', () => {
      opened = false; panel.hidden = true; btn.setAttribute('aria-expanded', 'false');
    });
    panel.querySelector('#gtReset').addEventListener('click', () => applyLanguage(''));
    panel.querySelectorAll('[data-gt]').forEach(b => b.addEventListener('click', () =>
      applyLanguage(b.getAttribute('data-gt'))));
    document.addEventListener('lg:lang', () => {
      A().applyStatic(panel);
      A().applyStatic(btn);
      const act = panel.querySelector('#gtActive');
      const tgt = currentTarget();
      if (act) act.textContent = tgt ? A().t('gt.active', { lang: activeLabel(tgt) }) : '';
    });
  }

  function activeLabel(code) {
    const hit = (CFG.translate.quickLanguages || []).find(l => l.code === code);
    return hit ? hit.label + ' (' + code + ')' : code;
  }

  /* A ?gt=xx link applies the language on arrival (then the cookie keeps it). */
  function applyFromUrl() {
    const want = new URLSearchParams(location.search).get('gt');
    if (!want) return;
    if (currentTarget() === want) return;
    setGoogTrans(want);
    /* the widget reads the cookie on load; no further reload needed */
  }

  /* Global callback name referenced by the Google script URL. */
  window.lgGoogleTranslateInit = function () {
    if (!window.google || !window.google.translate) return;
    /* eslint-disable no-new */
    new window.google.translate.TranslateElement({
      pageLanguage: SOURCE,
      includedLanguages: CFG.translate.includedLanguages || '',
      layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
      autoDisplay: false
    }, 'google_translate_element');
    document.documentElement.classList.add('gt-active');
  };

  function loadWidget() {
    if (loading || document.getElementById('gtScript')) return;
    loading = true;
    const s = document.createElement('script');
    s.id = 'gtScript';
    s.src = CFG.translate.scriptUrl;
    s.async = true;
    s.onerror = () => {
      loading = false;
      const note = document.getElementById('gtNote');
      if (note) {
        note.textContent = A().t('gt.blocked');
        note.classList.add('gt-panel__note--warn');
      }
    };
    document.body.appendChild(s);
  }

  function init() {
    if (!CFG.translate || !CFG.translate.enabled) return;
    applyFromUrl();
    buildUi();
    /* A `?gt=` link, or a visitor who chose a language earlier, gets the real
     * widget loaded straight away — otherwise the cookie would sit there and
     * the page would only translate once the panel was opened. */
    if (currentTarget()) loadWidget();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
