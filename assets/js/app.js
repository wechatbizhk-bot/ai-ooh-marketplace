/* ============================================================================
 * 3dNakedEye — app.js
 * Shell: i18n runtime, navigation, language switcher, toasts, modals,
 * schematic map renderer, card renderers, charts and export helpers.
 * ==========================================================================*/
(function () {
  'use strict';

  const CFG = window.LG_CONFIG;
  const DICT = () => window.LG_I18N || {};
  const LANG_FIELD = { en: 'en', 'zh-HK': 'zhHant', 'zh-CN': 'zhHans', th: 'th' };

  /* --- markets: Hong Kong and Thailand run on one platform ---------------- */
  function markets() { return (CFG.geo && CFG.geo.markets) || []; }
  function marketById(id) { return markets().find(m => m.id === id) || markets()[0]; }
  let currentMarket = (window.LG.store && window.LG.store.state && window.LG.store.state.market)
    || (CFG.geo && CFG.geo.defaultMarket) || 'hk';

  /* --- language state ----------------------------------------------------- */
  function detectLang() {
    const q = new URLSearchParams(location.search).get('lang');
    if (q && CFG.locales.some(l => l.code === q)) return q;
    const saved = window.LG.store.state.lang;
    if (saved && CFG.locales.some(l => l.code === saved)) return saved;
    const nav = (navigator.language || 'en').toLowerCase();
    if (nav.startsWith('th')) return 'th';
    if (nav.startsWith('zh')) return /tw|hk|hant|mo/.test(nav) ? 'zh-HK' : 'zh-CN';
    return CFG.defaultLocale;
  }
  let lang = detectLang();

  const app = {
    CFG,
    get lang() { return lang; },

    /* translate a dictionary key with optional {placeholders} */
    t(key, vars) {
      const entry = DICT()[key];
      const field = LANG_FIELD[lang] || 'en';
      let s = entry ? (entry[field] || entry.en) : null;
      if (s == null) s = key;
      if (vars) Object.keys(vars).forEach(k => { s = s.split('{' + k + '}').join(vars[k]); });
      return s;
    },
    /* translate an inline {en, zhHant, zhHans} object from data.js */
    L(obj) {
      if (obj == null) return '';
      if (typeof obj === 'string') return obj;
      return obj[LANG_FIELD[lang]] || obj.en || '';
    },
    locale() { return (CFG.locales.find(l => l.code === lang) || CFG.locales[0]).intl; },

    money(n, opts) {
      const cur = CFG.currency.code;
      try {
        return new Intl.NumberFormat(app.locale(), Object.assign({
          style: 'currency', currency: cur, maximumFractionDigits: 0
        }, opts || {})).format(n || 0);
      } catch (e) { return CFG.currency.symbol + Math.round(n || 0).toLocaleString(); }
    },
    num(n, digits) {
      try { return new Intl.NumberFormat(app.locale(), { maximumFractionDigits: digits == null ? 0 : digits }).format(n || 0); }
      catch (e) { return String(Math.round(n || 0)); }
    },
    pct(n, digits) { return app.num((n || 0) * 100, digits == null ? 1 : digits) + '%'; },
    date(iso) {
      if (!iso) return '—';
      try { return new Intl.DateTimeFormat(app.locale(), { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(iso)); }
      catch (e) { return iso; }
    },
    esc(s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    },

    /* --- language switching ---------------------------------------------- */
    setLang(code, opts) {
      if (!CFG.locales.some(l => l.code === code)) return;
      lang = code;
      window.LG.store.setLang(code);
      document.documentElement.lang = (CFG.locales.find(l => l.code === code)).htmlLang;
      app.applyStatic();
      app.renderLangSwitch();
      app.injectFooter();
      app.injectAccountChip();
      app.injectFloats();
      document.dispatchEvent(new CustomEvent('lg:lang', { detail: { lang: code } }));
      if (!opts || opts.updateUrl !== false) {
        const u = new URL(location.href);
        u.searchParams.set('lang', code);
        history.replaceState(null, '', u.toString());
      }
      try { document.dispatchEvent(new CustomEvent('lg:rendered')); } catch (e) {}
    },

    renderLangSwitch() {
      const host = document.getElementById('langSwitch');
      if (!host) return;
      /* Full label on desktop, short label on a phone — the full name stays on
         aria-label so the accessible name never depends on which one is shown. */
      host.innerHTML = CFG.locales.map(l =>
        `<button type="button" class="lang-btn${l.code === lang ? ' is-active' : ''}" data-lang="${l.code}"
           aria-pressed="${l.code === lang}" aria-label="${app.esc(l.label)}" title="${app.esc(l.label)}"
           ><span class="lang-btn__full">${app.esc(l.label)}</span><span class="lang-btn__short" aria-hidden="true">${app.esc(l.short || l.code)}</span></button>`
      ).join('');
      host.querySelectorAll('[data-lang]').forEach(b =>
        b.addEventListener('click', () => app.setLang(b.getAttribute('data-lang'))));
    },

    /* --- static markup translation --------------------------------------- */
    applyStatic(root) {
      const scope = root || document;
      scope.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = app.t(el.getAttribute('data-i18n'));
      });
      scope.querySelectorAll('[data-i18n-html]').forEach(el => {
        el.innerHTML = app.t(el.getAttribute('data-i18n-html'));
      });
      scope.querySelectorAll('[data-i18n-attr]').forEach(el => {
        el.getAttribute('data-i18n-attr').split(';').forEach(pair => {
          const [attr, key] = pair.split(':').map(s => s && s.trim());
          if (attr && key) el.setAttribute(attr, app.t(key));
        });
      });
      scope.querySelectorAll('[data-i18n-label]').forEach(el => {
        el.setAttribute('aria-label', app.t(el.getAttribute('data-i18n-label')));
      });
    },

    /* --- chrome ----------------------------------------------------------- */
    /* Adds the console links to every page nav from one place. When the site
     * map is present (nav-data.js) the mega menu owns the header instead. */
    injectNav() {
      if (window.LG_NAV && window.LG_NAV.length) return;
      const links = document.getElementById('navLinks');
      if (!links) return;
      const add = (href, key, beforeSel) => {
        if (links.querySelector('a[href^="' + href + '"]')) return;
        const a = document.createElement('a');
        a.href = href;
        a.setAttribute('data-i18n', key);
        a.textContent = app.t(key);
        const anchor = beforeSel ? links.querySelector(beforeSel) : null;
        if (anchor) links.insertBefore(a, anchor); else links.appendChild(a);
      };
      add('video.html', 'nav.video', 'a[href^="docs.html"]');
      add('preview.html', 'nav.preview', 'a[href^="docs.html"]');
      add('adsmanager.html', 'nav.adsmanager', 'a[href^="docs.html"]');
      add('automation.html', 'nav.automation', 'a[href^="docs.html"]');
      /* FAQ and Contact join the header; Preview, Membership and sign-in are in
       * the footer and the account chip so the header does not turn into a list. */
      add('faq.html', 'nav.faq', 'a[href^="docs.html"]');
      add('contact.html', 'nav.contact', 'a[href^="docs.html"]');
    },

    /* Add-friend links: LINE has one, WeChat does not (the UI copies the ID). */
    lineLink(id) { return 'https://line.me/ti/p/~' + String(id || (CFG.contact && CFG.contact.line) || '').replace(/^~/, ''); },
    copyText(text, key) {
      const done = () => app.toast(app.t(key || 'foot.id_copied', { id: text }), 'ok');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(() => app.toast(text, 'info'));
      } else { app.toast(text, 'info'); }
    },

    /* --- contact helpers -------------------------------------------------- */
    contact() { return CFG.contact || {}; },
    /* A wa.me deep link that survives an empty/odd phone number. */
    waLink(text, phone) {
      const num = String(phone || (CFG.contact && CFG.contact.whatsapp) || '').replace(/[^\d]/g, '');
      const q = text ? '?text=' + encodeURIComponent(text) : '';
      return 'https://wa.me/' + num + q;
    },
    mailLink(subject, body) {
      const to = (CFG.contact && CFG.contact.email) || CFG.brand.email;
      const q = [];
      if (subject) q.push('subject=' + encodeURIComponent(subject));
      if (body) q.push('body=' + encodeURIComponent(body));
      return 'mailto:' + to + (q.length ? '?' + q.join('&') : '');
    },
    whatsappNumber() { return (CFG.contact && CFG.contact.whatsappDisplay) || CFG.brand.whatsapp || ''; },

    /* --- social icons (inline SVG so there are no external requests) ------- */
    socialIcon(id) {
      const P = {
        x: '<path d="M4 4l7.6 9.9L4.4 20h2.3l6-6.6L17.6 20H20l-7.8-10.2L19.4 4h-2.3l-5.4 6L8.4 4z"/>',
        facebook: '<path d="M13.5 21v-7h2.4l.4-3h-2.8V9.2c0-.9.3-1.5 1.6-1.5h1.3V5c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.9V11H8v3h2.5v7z"/>',
        instagram: '<path d="M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5zm4 5.5A3.5 3.5 0 1 0 15.5 12 3.5 3.5 0 0 0 12 8.5zM17.6 6a1 1 0 1 0 1 1 1 1 0 0 0-1-1z"/>',
        youtube: '<path d="M21.6 7.6a2.6 2.6 0 0 0-1.8-1.8C18.2 5.3 12 5.3 12 5.3s-6.2 0-7.8.5A2.6 2.6 0 0 0 2.4 7.6 27 27 0 0 0 2 12a27 27 0 0 0 .4 4.4 2.6 2.6 0 0 0 1.8 1.8c1.6.5 7.8.5 7.8.5s6.2 0 7.8-.5a2.6 2.6 0 0 0 1.8-1.8A27 27 0 0 0 22 12a27 27 0 0 0-.4-4.4zM10 15V9l5.2 3z"/>',
        xiaohongshu: '<path d="M4 6h16v12H4z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M7.5 9.5h4v5h-4zM13 9.5h3.5M13 12h3.5M13 14.5h3.5" fill="none" stroke="currentColor" stroke-width="1.4"/>',
        tiktok: '<path d="M15.5 3h-2.7v11.2a2.4 2.4 0 1 1-2.4-2.4c.2 0 .4 0 .6.1V9.1a5 5 0 1 0 4.5 5V8.4a5.6 5.6 0 0 0 3.5 1.2V7a3.4 3.4 0 0 1-3.5-3.4z"/>',
        douyin: '<path d="M14.8 3h-2.6v10.9a2.3 2.3 0 1 1-2.3-2.3c.2 0 .4 0 .5.1V9.2A4.9 4.9 0 1 0 14.8 14V8.6a5.4 5.4 0 0 0 3.3 1.1V7.2a3.3 3.3 0 0 1-3.3-3.3z"/>',
        wechat: '<path d="M9 4C5.1 4 2 6.7 2 10c0 1.9 1 3.5 2.6 4.6L4 17.3l2.9-1.5c.7.2 1.4.3 2.1.3h.6a5.6 5.6 0 0 1-.2-1.4c0-3.2 3.1-5.8 6.9-5.8h.6C16.3 6.2 13 4 9 4zm-2.4 3.6a1 1 0 1 1 1 1 1 1 0 0 1-1-1zm4.6 0a1 1 0 1 1 1 1 1 1 0 0 1-1-1z"/><path d="M22 14.6c0-2.7-2.6-4.9-5.8-4.9s-5.8 2.2-5.8 4.9 2.6 4.9 5.8 4.9a7 7 0 0 0 1.7-.2l2.4 1.3-.6-2a4.6 4.6 0 0 0 2.3-4zm-7.7-.9a.9.9 0 1 1 .9.9.9.9 0 0 1-.9-.9zm3.9 0a.9.9 0 1 1 .9.9.9.9 0 0 1-.9-.9z"/>',
        line: '<path d="M12 3.2C6.8 3.2 2.6 6.5 2.6 10.6c0 3.7 3.3 6.8 7.8 7.4.3.1.7.2.8.5.1.2.1.6 0 .8l-.1.9c0 .3-.2 1 .9.5 1.1-.5 5.8-3.5 7.9-6 1.4-1.5 2.1-3 2.1-4.1 0-4.1-4.2-7.4-9.4-7.4z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M7.4 8.6h4.4v1.2h-1.5v3.6H9V9.8H7.4zM12.6 8.6h1.2v4.8h-1.2zM14.9 8.6h1.2l1.4 2.6V8.6h1.2v4.8h-1.1l-1.5-2.7v2.7h-1.2z" fill="currentColor"/>',
        threads: '<path d="M12.2 21c-4.9 0-7.9-3.3-7.9-9s3-9 8-9c3.7 0 6.2 1.9 7.1 5.1l-1.8.5C16.8 6 15 4.8 12.3 4.8c-3.8 0-6.1 2.5-6.1 7.2s2.3 7.2 6 7.2c2.9 0 4.7-1.4 4.7-3.5 0-1.5-.9-2.5-2.4-2.8-.3 1.9-1.6 3.1-3.4 3.1a3.2 3.2 0 0 1-3.3-3.2c0-2 1.5-3.4 3.6-3.4a4 4 0 0 1 1.9.4V10c1.9.4 3.1 1.8 3.1 3.8 0 2.9-2.4 4.9-5.8 4.9zm-.2-5.4c1.1 0 1.8-.8 1.9-1.9a3 3 0 0 0-1.7-.5c-1.1 0-1.9.7-1.9 1.7 0 .9.7 1.6 1.7 1.6z"/>',
        github: '<path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.9c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.4-2.2-.2-4.6-1.1-4.6-5a4 4 0 0 1 1-2.7 3.7 3.7 0 0 1 .1-2.7s.8-.3 2.7 1a9.4 9.4 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1a3.7 3.7 0 0 1 .1 2.7 4 4 0 0 1 1 2.7c0 3.9-2.4 4.8-4.6 5 .4.3.7 1 .7 2v3c0 .3.2.6.7.5A10 10 0 0 0 12 2z"/>'
      };
      return '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' + (P[id] || P.github) + '</svg>';
    },

    /* --- footer: contact block + every social account --------------------- */
    /* The footer repeats the site map in four columns, so the structure is
     * reachable without opening a menu. */
    footerMap() {
      const nav = window.LG_NAV || [];
      if (!nav.length) return '';
      const pick = { solutions: 5, industries: 5, company: 4, partnership: 4 };
      const wanted = ['solutions', 'industries', 'company', 'partnership'];
      const cols = wanted.map(id => {
        const top = nav.find(n => n.id === id);
        if (!top) return '';
        const items = [];
        (top.columns || []).forEach(col => col.items.forEach(it => {
          if (items.length < (pick[id] || 4)) items.push(it);
        }));
        return `<div>
          <h4><a href="${app.esc(top.href)}">${app.esc(app.t(top.label))}</a></h4>
          <ul>${items.map(it => `<li><a href="${app.esc(it.href)}">${app.esc(app.t(it.i18n))}</a></li>`).join('')}</ul>
        </div>`;
      }).join('');
      /* the reference material gets its own column: the catalogue, the dimension
       * calculator and the cloud walkthrough are what people come back for. */
      const data = `<div>
        <h4><a href="catalog.html">${app.esc(app.t('nav.catalog'))}</a></h4>
        <ul>
          <li><a href="catalog.html">${app.esc(app.t('nav.catalog'))}</a></li>
          <li><a href="led-film.html">${app.esc(app.t('nav.ledfilm'))}</a></li>
          <li><a href="dimension.html">${app.esc(app.t('nav.dimension'))}</a></li>
          <li><a href="calculator.html">${app.esc(app.t('nav.size_calc'))}</a></li>
          <li><a href="cloud.html">${app.esc(app.t('nav.cloud'))}</a></li>
          <li><a href="holobox.html">${app.esc(app.t('nav.holobox'))}</a></li>
          <li><a href="affiliate.html">${app.esc(app.t('nav.affiliate'))}</a></li>
          <li><a href="price-list.html">${app.esc(app.t('nav.price_list'))}</a></li>
          <li><a href="payments.html">${app.esc(app.t('nav.payments'))}</a></li>
          <li><a href="technology.html#products">${app.esc(app.t('tec.products'))}</a></li>
          <li><a href="preview.html">${app.esc(app.t('nav.preview'))}</a></li>
        </ul>
      </div>`;
      return `<div class="footer-map">${cols}${data}</div>`;
    },

    injectFooter() {
      const social = CFG.social || [];
      const c = app.contact();
      const socialHtml = social.map(s => s.kind === 'account'
        ? `<button type="button" class="social-btn" data-wechat="${app.esc(s.handle)}" title="${app.esc(s.label + ' · ' + s.handle)}">
             ${app.socialIcon(s.id)}<span>${app.esc(s.label)}</span></button>`
        : `<a class="social-btn" href="${app.esc(s.url)}" target="_blank" rel="noopener noreferrer me"
             title="${app.esc(s.label + ' · ' + s.handle)}">${app.socialIcon(s.id)}<span>${app.esc(s.label)}</span></a>`).join('');

      const block = `
        ${app.footerMap()}
        <div class="footer-extras" id="footerExtras">
          <div>
            <h4 data-i18n="foot.contact">Talk to us</h4>
            <ul class="footer-contact">
              <li><a class="wa-link" href="${app.waLink(app.t('foot.whatsapp') + ' — ' + (location.host || '3dNakedEye'))}" target="_blank" rel="noopener">
                <span class="ico">${app.socialIcon('wechat')}</span>WhatsApp ${app.esc(c.whatsappDisplay || '')}</a></li>
              <li><button type="button" class="link-btn" data-copy="${app.esc(c.line || '')}">
                <span class="ico">${app.socialIcon('line')}</span>LINE ${app.esc(c.line || '')}</button></li>
              <li><button type="button" class="link-btn" data-copy="${app.esc(c.wechatId || '')}">
                <span class="ico">${app.socialIcon('wechat')}</span>WeChat ${app.esc(c.wechatId || '')}</button></li>
              <li><a href="${app.mailLink()}">${app.esc(c.email || CFG.brand.email)}</a></li>
              <li><span data-i18n="foot.hours">Hours</span>: ${app.esc(c.hours || '')}</li>
              <li><span data-i18n="foot.sla">Reply time</span>: ${app.esc(c.responseSla || '')}</li>
            </ul>
            <div class="row row--wrap" style="margin-top:10px">
              <a class="btn btn--quiet btn--sm" href="preview.html" data-i18n="nav.preview">Preview</a>
              <a class="btn btn--quiet btn--sm" href="faq.html" data-i18n="nav.faq">FAQ</a>
              <a class="btn btn--quiet btn--sm" href="contact.html" data-i18n="nav.contact">Contact</a>
              <a class="btn btn--quiet btn--sm" href="membership.html" data-i18n="nav.membership">Membership</a>
              <a class="btn btn--quiet btn--sm" href="login.html" data-i18n="nav.login">Sign in</a>
            </div>
          </div>
          <div class="footer-social-wrap">
            <h4 data-i18n="foot.follow">Follow 3dNakedEye</h4>
            <div class="social-grid">${socialHtml}</div>
            <p class="tiny muted" data-i18n="foot.social_note"></p>
          </div>
        </div>`;

      document.querySelectorAll('.site-footer').forEach(footer => {
        if (footer.querySelector('#footerExtras')) {
          footer.querySelector('#footerExtras').outerHTML = block;
        } else {
          const wrap = footer.querySelector('.wrap') || footer;
          wrap.insertAdjacentHTML('afterbegin', block);
        }
      });
      /* WeChat has no public URL: the button copies the account name instead. */
      document.querySelectorAll('[data-wechat]').forEach(b => {
        if (b.dataset.bound) return;
        b.dataset.bound = '1';
        b.addEventListener('click', () => {
          const name = b.getAttribute('data-wechat');
          const done = () => app.toast(app.t('foot.wechat_copied'), 'ok');
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(name).then(done).catch(() => app.toast(name, 'info'));
          } else { app.toast(name, 'info'); }
        });
      });
      /* Footer IDs (LINE, WeChat) are copy-to-clipboard, not links. */
      document.querySelectorAll('[data-copy]').forEach(b => {
        if (b.dataset.bound) return;
        b.dataset.bound = '1';
        b.addEventListener('click', () => app.copyText(b.getAttribute('data-copy')));
      });
    },

    /* --- account chip in the header --------------------------------------- */
    injectAccountChip() {
      const tools = document.querySelector('.nav__tools');
      if (!tools) return;
      const S = window.LG.store;
      const old = tools.querySelector('#navAccount');
      if (old) old.remove();
      const host = document.createElement('span');
      host.id = 'navAccount';
      host.className = 'nav-account';
      const sess = S.session();
      if (sess) {
        const tier = S.tier();
        const href = sess.role === 'landlord' ? 'landlord.html' : (sess.role === 'operator' ? 'operator.html' : 'advertiser.html');
        host.innerHTML =
          `<a class="account-chip" href="${href}" title="${app.esc(sess.email)}">
             <span class="avatar avatar--sm">${app.esc(app.initials(sess.name))}</span>
             <span class="account-chip__name">${app.esc(sess.name)}</span>
             ${tier ? `<span class="pill pill--info">${app.esc(app.t('mem.tier_' + tier.id + '.name'))}</span>` : ''}
           </a>
           <button class="btn btn--quiet btn--sm" type="button" id="navSignOut">${app.esc(app.t('nav.signout'))}</button>`;
        tools.appendChild(host);
        const out = host.querySelector('#navSignOut');
        if (out) out.addEventListener('click', () => {
          S.signOut();
          app.injectAccountChip();
          app.toast(app.t('auth.signed_out'), 'ok');
          document.dispatchEvent(new CustomEvent('lg:auth', { detail: { session: null } }));
        });
      } else {
        host.innerHTML = `<a class="btn btn--ghost btn--sm" href="login.html">${app.esc(app.t('nav.login'))}</a>`;
        tools.appendChild(host);
      }
    },
    initials(name) {
      return String(name || '3dNakedEye').trim().split(/\s+/).slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('') || 'AS';
    },

    /* --- affiliate share links -------------------------------------------
     * A visitor arriving on ?ref=CODE is a click the partner earned: keep the
     * record (with its cookie window) and say so once, so the demo on
     * affiliate.html can be seen working from any page of the site. */
    recordReferral() {
      try {
        const p = new URLSearchParams(location.search || '');
        const ref = (p.get('ref') || '').trim();
        if (!ref || !window.LG.store || !window.LG.store.share) return null;
        const rec = window.LG.store.share.click(ref, {
          cid: p.get('cid') || undefined,
          channel: p.get('utm_source') || 'link'
        });
        if (rec) app.toast(app.t('af.referred', { ref: rec.ref }), 'info');
        return rec;
      } catch (e) { return null; }
    },

    /* --- floating WhatsApp + assistant launcher --------------------------- */
    injectFloats() {
      const c = app.contact();
      if (!document.getElementById('waFloat')) {
        const a = document.createElement('a');
        a.id = 'waFloat';
        a.className = 'float-wa';
        a.target = '_blank';
        a.rel = 'noopener';
        a.href = app.waLink(app.t('foot.whatsapp') + ' — 3dNakedEye');
        a.setAttribute('data-i18n-label', 'nav.contact');
        a.innerHTML = `${app.socialIcon('wechat')}<span class="float-wa__label">WhatsApp</span>`;
        document.body.appendChild(a);
      }
    },
    mountAssistant() {
      const chat = window.LG && window.LG.chat;
      if (chat && typeof chat.mount === 'function') chat.mount();
    },

    initChrome() {
      document.documentElement.lang = (CFG.locales.find(l => l.code === lang)).htmlLang;
      app.injectNav();
      app.renderLangSwitch();
      app.applyStatic();
      app.updateCartBadge();

      const burger = document.getElementById('navToggle');
      const links = document.getElementById('navLinks');
      if (burger && links) {
        burger.addEventListener('click', () => {
          const open = links.classList.toggle('is-open');
          burger.setAttribute('aria-expanded', String(open));
        });
        links.addEventListener('click', e => {
          if (e.target.tagName === 'A') { links.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); }
        });
      }
      /* mark current page in nav */
      const page = location.pathname.split('/').pop() || 'index.html';
      document.querySelectorAll('#navLinks a').forEach(a => {
        const href = a.getAttribute('href');
        if (href === page) a.classList.add('is-current');
      });
      /* footer year + brand */
      document.querySelectorAll('[data-brand]').forEach(el => { el.textContent = CFG.brand.name; });
      const y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear();
      const em = document.querySelectorAll('[data-contact="email"]'); em.forEach(e => { e.textContent = CFG.brand.email; });
      const ph = document.querySelectorAll('[data-contact="phone"]'); ph.forEach(e => { e.textContent = CFG.brand.phone; });
      const ad = document.querySelectorAll('[data-contact="address"]'); ad.forEach(e => { e.textContent = CFG.brand.address; });
      app.injectFooter();
      app.injectAccountChip();
      app.injectFloats();
      app.mountAssistant();
    },

    updateCartBadge() {
      const n = window.LG.store.cart().length;
      document.querySelectorAll('[data-cart-count]').forEach(el => {
        el.textContent = String(n);
        el.classList.toggle('is-empty', n === 0);
      });
    },

    /* --- toast + modal --------------------------------------------------- */
    toast(msg, kind) {
      let host = document.getElementById('toastHost');
      if (!host) {
        host = document.createElement('div');
        host.id = 'toastHost';
        host.className = 'toast-host';
        document.body.appendChild(host);
      }
      const el = document.createElement('div');
      el.className = 'toast' + (kind ? ' toast--' + kind : '');
      el.setAttribute('role', 'status');
      el.innerHTML = `<span class="toast__dot"></span><span>${app.esc(msg)}</span>`;
      host.appendChild(el);
      setTimeout(() => { el.classList.add('is-out'); setTimeout(() => el.remove(), 320); }, 3600);
    },

    modal(opts) {
      const wrap = document.createElement('div');
      wrap.className = 'modal-backdrop';
      wrap.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-label="${app.esc(opts.title || '')}">
        <button class="modal__close" type="button" aria-label="Close">&times;</button>
        <h3 class="modal__title">${app.esc(opts.title || '')}</h3>
        <div class="modal__body">${opts.html || ''}</div>
        <div class="modal__actions">${(opts.actions || []).map((a, i) =>
          `<button type="button" class="btn ${a.className || 'btn--ghost'}" data-act="${i}">${app.esc(a.label)}</button>`).join('')}</div>
      </div>`;
      document.body.appendChild(wrap);
      const close = () => wrap.remove();
      wrap.querySelector('.modal__close').addEventListener('click', close);
      wrap.addEventListener('click', e => { if (e.target === wrap) close(); });
      document.addEventListener('keydown', function esc(e) {
        if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
      });
      (opts.actions || []).forEach((a, i) => {
        wrap.querySelector('[data-act="' + i + '"]').addEventListener('click', () => {
          const keep = a.onClick && a.onClick(wrap);
          if (!keep) close();
        });
      });
      return { close, el: wrap };
    },

    /* --- renderers -------------------------------------------------------- */
    statusPill(status) {
      const map = {
        live: 'ok', scheduled: 'info', in_review: 'warn', completed: 'muted', rejected: 'bad',
        pending: 'warn', approved: 'ok', accruing: 'info', paid: 'ok', open: 'warn',
        in_progress: 'info', resolved: 'ok', paused: 'muted', verified: 'ok'
      };
      return `<span class="pill pill--${map[status] || 'muted'}">${app.esc(app.t('status.' + status))}</span>`;
    },

    deviceChip(typeId) {
      const t = window.LG_DEVICES[typeId];
      if (!t) return '';
      const icon = t.form === 'hologram' ? '◎' : '▭';
      return `<span class="chip chip--device" title="${app.esc(app.L(t.label))}">${icon} ${app.esc(t.sku)}</span>`;
    },

    locationCard(loc, opts) {
      const o = opts || {};
      const v = window.LG.store.venue(loc.venue);
      const d = window.LG.store.district(loc.district);
      const mkt = app.marketOfLocation(loc);
      const price = Math.round(loc.devices.reduce((s, dev) => {
        const t = window.LG_DEVICES[dev.type]; return s + (t ? t.dailyRate : 0);
      }, 0) * v.mult);
      const img = app.thumb(loc, 320, 180);
      return `<article class="loc-card" data-loc="${loc.id}">
        <a class="loc-card__media" href="location.html?id=${encodeURIComponent(loc.id)}" aria-label="${app.esc(app.L(loc.name))}">
          ${img}
          <span class="loc-card__price">${app.esc(app.priceWithLocal(price, mkt))}<small>${app.esc(app.t('unit.per_day'))}</small></span>
          ${loc.verified ? `<span class="loc-card__verified">✓ ${app.esc(app.t('badge.verified'))}</span>`
            : `<span class="loc-card__verified loc-card__verified--pending">${app.esc(app.t('badge.pending'))}</span>`}
        </a>
        <div class="loc-card__body">
          <h3 class="loc-card__title"><a href="location.html?id=${encodeURIComponent(loc.id)}">${app.esc(app.L(loc.name))}</a></h3>
          <p class="loc-card__meta"><span class="chip">${app.esc(app.marketLabel(mkt))}</span> ${app.esc(app.L(d.label))} · ${app.esc(app.L(v.label))}</p>
          <ul class="loc-card__stats">
            <li><strong>${app.num(loc.footfallPerDay)}</strong><span>${app.esc(app.t('stat.footfall'))}</span></li>
            <li><strong>${app.num(loc.dwellSec)}s</strong><span>${app.esc(app.t('stat.dwell'))}</span></li>
            <li><strong>${loc.devices.length}</strong><span>${app.esc(app.t('stat.devices'))}</span></li>
            <li><strong>${app.num(loc.footfallPerDay * loc.visibility)}</strong><span>${app.esc(app.t('stat.est_audience'))}</span></li>
          </ul>
          <div class="loc-card__chips">${loc.devices.slice(0, 3).map(dv => app.deviceChip(dv.type)).join('')}</div>
          ${o.avail ? `<div class="row" style="gap:8px">
            ${app.statePill(o.avail.state)}
            <span class="tiny muted">${o.avail.freePct}% ${app.esc(app.t('avail.free'))}</span>
            ${o.distanceKm != null ? `<span class="chip">◎ ${app.num(o.distanceKm, 1)} km</span>` : ''}
          </div>` : ''}
          ${o.showBooked === false ? '' : `<div class="meter" title="${app.esc(app.t('stat.booked'))}">
            <span style="width:${Math.min(100, loc.bookedPct)}%"></span></div>
            <p class="loc-card__booked">${app.esc(app.t('stat.booked'))}: ${loc.bookedPct}%</p>`}
          <div class="loc-card__actions">
            <a class="btn btn--ghost btn--sm" href="location.html?id=${encodeURIComponent(loc.id)}">${app.esc(app.t('cta.view'))}</a>
            ${o.hideAdd ? '' : `<button class="btn btn--primary btn--sm" data-add="${loc.id}">${app.esc(app.t('cta.add_booking'))}</button>`}
          </div>
        </div>
      </article>`;
    },

    /* deterministic gradient placeholder art per location (no external assets) */
    thumb(loc, w, h) {
      const rnd = window.LG.store.util.seedFrom(loc.id);
      const h1 = Math.floor(rnd() * 360), h2 = (h1 + 40 + Math.floor(rnd() * 80)) % 360;
      const form = (loc.devices[0] && window.LG_DEVICES[loc.devices[0].type].form) || 'screen';
      const glow = form === 'hologram'
        ? `<circle cx="50%" cy="48%" r="26" fill="url(#g2)" opacity=".85"/>`
        : `<rect x="18%" y="26%" width="64%" height="46%" rx="6" fill="url(#g2)" opacity=".8"/>`;
      return `<svg class="thumb" viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice" role="img" aria-hidden="true">
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="hsl(${h1} 72% 89%)"/><stop offset="1" stop-color="hsl(${h2} 64% 78%)"/>
          </linearGradient>
          <radialGradient id="g2"><stop offset="0" stop-color="hsl(${h2} 88% 62%)"/>
            <stop offset="1" stop-color="hsl(${h1} 84% 52%)" stop-opacity="0"/></radialGradient>
        </defs>
        <rect width="160" height="90" fill="url(#g1)"/>
        <g opacity=".5" stroke="rgba(13,33,58,.10)" stroke-width=".5">
          ${Array.from({ length: 7 }, (_, i) => `<line x1="0" y1="${12 * (i + 1)}" x2="160" y2="${12 * (i + 1)}"/>`).join('')}
        </g>
        ${glow}
        <text x="8" y="82" fill="#3b5675" font-size="7" opacity=".85">${app.esc(loc.id)}</text>
      </svg>`;
    },

    /* Backwards-compatible entry point: the LBS renderer supersedes the
     * original fixed-schematic map used by the early pages. */
    map(host, locations, opts) {
      return app.lbsMap(host, locations, Object.assign({ showLabels: false, showRadius: false }, opts || {}));
    },

    /* Legacy fixed-schematic renderer (kept as a reference implementation). */
    legacyMap(host, locations, handlers) {
      if (!host) return;
      const h = handlers || {};
      const pins = locations.map(loc => {
        const price = Math.round(loc.devices.reduce((s, dv) => {
          const t = window.LG_DEVICES[dv.type]; return s + (t ? t.dailyRate : 0);
        }, 0) * window.LG.store.venue(loc.venue).mult);
        const isHolo = loc.devices.some(d => window.LG_DEVICES[d.type].form === 'hologram');
        return `<g class="map-pin${loc.verified ? '' : ' map-pin--pending'}" data-pin="${loc.id}"
            tabindex="0" role="button" aria-label="${app.esc(app.L(loc.name))}"
            transform="translate(${loc.x} ${loc.y})">
          <circle class="map-pin__halo" r="3.3"></circle>
          <circle class="map-pin__dot" r="1.45" data-form="${isHolo ? 'hologram' : 'screen'}"></circle>
          <title>${app.esc(app.L(loc.name))} — ${app.money(price)}${app.esc(app.t('unit.per_day'))}</title>
        </g>`;
      }).join('');

      const dots = window.LG_DISTRICTS.map(d =>
        `<g class="map-district"><circle cx="${d.x}" cy="${d.y}" r="0.4"></circle>
         <text x="${d.x + 1.4}" y="${d.y + 0.45}">${app.esc(app.L(d.label))}</text></g>`).join('');

      host.innerHTML = `<svg class="map-svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" role="img"
          aria-label="${app.esc(app.t('map.aria'))}">
        <defs>
          <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#08182e"/><stop offset="1" stop-color="#04101f"/>
          </linearGradient>
          <linearGradient id="land" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#183a5c"/><stop offset="1" stop-color="#0f2740"/>
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill="url(#sea)"/>
        <!-- stylised, not to scale: New Territories / Kowloon / Hong Kong Island / Lantau -->
        <path class="map-land" d="M8 8 L84 6 L90 20 L74 33 L66 40 L60 44 L46 46 L34 44 L24 38 L12 34 Z" fill="url(#land)"/>
        <path class="map-land" d="M34 46 L60 45 L70 49 L74 56 L62 60 L48 59 L38 55 Z" fill="url(#land)"/>
        <path class="map-land" d="M40 66 L68 64 L76 74 L66 84 L48 86 L38 78 Z" fill="url(#land)"/>
        <ellipse class="map-land" cx="15" cy="58" rx="12" ry="17" fill="url(#land)"/>
        <path class="map-water" d="M6 62 Q30 56 52 62 T96 60" fill="none"/>
        ${dots}
        ${pins}
      </svg>
      <div class="map-legend">
        <span><i class="dot dot--holo"></i>${app.esc(app.t('legend.hologram'))}</span>
        <span><i class="dot dot--screen"></i>${app.esc(app.t('legend.screen'))}</span>
        <span><i class="dot dot--pending"></i>${app.esc(app.t('legend.pending'))}</span>
        <span class="map-legend__note">${app.esc(app.t('map.disclaimer'))}</span>
      </div>`;

      host.querySelectorAll('[data-pin]').forEach(el => {
        const id = el.getAttribute('data-pin');
        const go = () => { if (h.onPin) h.onPin(id); else location.href = 'location.html?id=' + encodeURIComponent(id); };
        el.addEventListener('click', go);
        el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
      });
    },

    /* --- schematic + street map (LBS) ------------------------------------- */
    /* --- markets --------------------------------------------------------- */
    markets,
    marketById,
    get market() { return currentMarket; },
    setMarket(id) {
      const m = marketById(id);
      if (!m || m.id !== id) return;
      currentMarket = id;
      window.LG.store.setMarket(id);
      document.dispatchEvent(new CustomEvent('lg:market', { detail: { market: id } }));
    },
    marketOfLocation(loc) {
      if (loc && loc.market) return loc.market;
      const dm = (window.LG_GEO && window.LG_GEO.districtMarket) || {};
      return (loc && dm[loc.district]) || (CFG.geo.defaultMarket || 'hk');
    },
    marketLabel(id) { return app.t('market.' + (id || currentMarket)); },
    /* Platform pricing is quoted in HKD; each market also shows its own
     * currency at the configured rate. */
    localPrice(hkd, marketId) {
      const m = marketById(marketId || currentMarket);
      const rate = (CFG.currency.rates || {})[m.currency.code] || 1;
      const symbol = (CFG.currency.labels || {})[m.currency.code] || m.currency.symbol;
      return symbol + Math.round((hkd || 0) * rate).toLocaleString('en-US');
    },
    priceWithLocal(hkd, marketId) {
      const m = marketById(marketId || currentMarket);
      if (m.currency.code === CFG.currency.code) return app.money(hkd);
      return app.money(hkd) + ' · ' + app.localPrice(hkd, m.id);
    },

    /* Projection into the schematic panel. Each market declares its own canvas
     * box so both axes keep a similar scale and radius rings stay round. */
    project(pt, marketId) {
      const m = marketById(marketId || currentMarket);
      const b = m.bounds, P = m.proj || { x0: 5, x1: 145, y0: 5, y1: 95 };
      const x = P.x0 + ((pt.lng - b.minLng) / (b.maxLng - b.minLng)) * (P.x1 - P.x0);
      const y = P.y0 + ((b.maxLat - pt.lat) / (b.maxLat - b.minLat)) * (P.y1 - P.y0);
      return { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 };
    },
    /* km per panel unit on each axis, used for radius rings and scale bar */
    kmPerUnit(marketId) {
      const m = marketById(marketId || currentMarket);
      const b = m.bounds, P = m.proj || { x0: 5, x1: 145, y0: 5, y1: 95 };
      const kmX = (b.maxLng - b.minLng) * 111.32 * Math.cos(((b.maxLat + b.minLat) / 2) * Math.PI / 180);
      const kmY = (b.maxLat - b.minLat) * 110.57;
      return {
        x: kmX / (P.x1 - P.x0),
        y: kmY / (P.y1 - P.y0), kmX, kmY
      };
    },

    /* Land outlines of the active market (real coordinates, simplified). */
    landOf(marketId) { return marketById(marketId || currentMarket).land || []; },

    statePill(state) {
      const map = { available: 'ok', partial: 'warn', occupied: 'bad', restricted: 'info', pending: 'muted' };
      return `<span class="pill pill--${map[state] || 'muted'}">${app.esc(app.t('avail.' + state))}</span>`;
    },

    /* Street-map tiles when reachable, offline schematic otherwise. */
    LEAFLET: { loading: null, cssAdded: false, failUntil: 0 },
    loadLeaflet() {
      if (window.L) return Promise.resolve(window.L);
      if (app.LEAFLET.loading) return app.LEAFLET.loading;
      if (Date.now() < app.LEAFLET.failUntil) return Promise.reject(new Error('leaflet offline'));
      app.LEAFLET.loading = new Promise((resolve, reject) => {
        const timer = setTimeout(() => { app.LEAFLET.failUntil = Date.now() + 600000; reject(new Error('leaflet timeout')); }, CFG.geo.tileTimeoutMs);
        if (!app.LEAFLET.cssAdded) {
          const link = document.createElement('link');
          link.rel = 'stylesheet'; link.href = CFG.geo.leafletCss;
          document.head.appendChild(link);
          app.LEAFLET.cssAdded = true;
        }
        const s = document.createElement('script');
        s.src = CFG.geo.leafletJs;
        s.onload = () => { clearTimeout(timer); window.L ? resolve(window.L) : reject(new Error('no L')); };
        s.onerror = () => { clearTimeout(timer); app.LEAFLET.failUntil = Date.now() + 600000; reject(new Error('leaflet blocked')); };
        document.head.appendChild(s);
      }).finally(() => { app.LEAFLET.loading = null; });
      return app.LEAFLET.loading;
    },

    /* Main LBS renderer.
     * host      : element
     * locations : array of location records
     * opts      : { origin, radiusKm, from, days, category, height, onPin,
     *               provider: 'auto'|'streets'|'schematic', showLabels, showRadius } */
    lbsMap(host, locations, opts) {
      if (!host) return;
      const mk = marketById((opts && opts.market) || currentMarket);
      const o = Object.assign({
        market: mk.id, provider: CFG.geo.provider, radiusKm: (mk.radiusOptionsKm || [5])[2] || 5,
        origin: null, showRadius: true, showLabels: true, onPin: null, height: null
      }, opts || {});
      const states = {};
      locations.forEach(l => {
        states[l.id] = app.availState(l, o);
      });
      if (o.provider === 'streets' || o.provider === 'auto') {
        app.loadLeaflet()
          .then(L => app.streetMap(host, locations, o, L, states))
          .catch(() => app.schematicMap(host, locations, o, states, true));
      } else {
        app.schematicMap(host, locations, o, states, false);
      }
    },

    /* Availability state for a location under the current booking window. */
    availState(loc, o) {
      const a = window.LG.store.availability(loc.id, o.from, o.days, { category: o.category });
      return a || { state: 'pending', freePct: 0, bookedPct: 100 };
    },

    streetMap(host, locations, o, L, states) {
      host.innerHTML = '<div class="lbs-map" id="lbsStreet"></div>' +
        `<div class="map-legend">${app.legend(o, states, locations)}</div>`;
      const el = host.querySelector('#lbsStreet');
      if (o.height) el.style.height = o.height + 'px';
      const mk = marketById(o.market || currentMarket);
      const map = L.map(el, { scrollWheelZoom: true, zoomControl: true })
        .setView([mk.center.lat, mk.center.lng], mk.zoom || 11);
      let tileErrors = 0;
      const tiles = L.tileLayer(CFG.geo.tiles.url, {
        maxZoom: CFG.geo.tiles.maxZoom, attribution: CFG.geo.tiles.attribution
      });
      tiles.on('tileerror', () => {
        if (++tileErrors === 3) { map.remove(); app.schematicMap(host, locations, o, states, true); }
      });
      tiles.addTo(map);
      locations.forEach(loc => {
        const pt = window.LG.store.locationGeo(loc.id);
        if (!pt) return;
        const st = states[loc.id].state;
        const price = app.dayRate(loc);
        const marker = L.marker([pt.lat, pt.lng], {
          icon: L.divIcon({
            className: 'lg-pin-wrap', iconSize: [18, 18], iconAnchor: [9, 9],
            html: `<span class="lg-pin lg-pin--${st}"></span>`
          }),
          title: app.L(loc.name)
        }).addTo(map);
        marker.bindPopup(`<strong>${app.esc(app.L(loc.name))}</strong><br>
          ${app.esc(app.marketLabel(app.marketOfLocation(loc)))} · ${app.esc(app.L(window.LG.store.venue(loc.venue).label))}<br>
          ${app.esc(app.priceWithLocal(price, app.marketOfLocation(loc)))}${app.esc(app.t('unit.per_day'))}<br>
          ${app.esc(app.t('avail.label'))}: ${app.esc(app.t('avail.' + st))} (${states[loc.id].freePct}% ${app.esc(app.t('avail.free'))})<br>
          ${o.origin ? app.esc(app.t('lbs.distance')) + ': ' + app.num(window.LG.store.distanceKm(o.origin, pt), 1) + ' km<br>' : ''}
          <a href="location.html?id=${encodeURIComponent(loc.id)}">${app.esc(app.t('cta.details'))}</a>`);
        marker.on('click', () => { if (o.onPin) o.onPin(loc.id); });
      });
      if (o.origin && o.showRadius) {
        L.circle([o.origin.lat, o.origin.lng], {
          radius: o.radiusKm * 1000, color: '#35d0ff', weight: 1, fillColor: '#35d0ff', fillOpacity: .06
        }).addTo(map);
        L.marker([o.origin.lat, o.origin.lng], {
          icon: L.divIcon({ className: 'lg-pin-wrap', iconSize: [16, 16], iconAnchor: [8, 8], html: '<span class="lg-pin lg-pin--me"></span>' })
        }).addTo(map).bindPopup(app.esc(app.t('lbs.you_are_here')));
      }
      const pts = locations.map(l => window.LG.store.locationGeo(l.id)).filter(Boolean).map(p => [p.lat, p.lng]);
      if (pts.length) map.fitBounds(pts, { padding: [30, 30] });
      host._mapInstance = map;
    },

    schematicMap(host, locations, o, states, notice) {
      const mk = marketById(o.market || currentMarket);
      const scale = app.kmPerUnit(mk.id);
      const land = app.landOf(mk.id).map(poly => 'M' + poly.map(([lat, lng]) => {
        const p = app.project({ lat, lng }, mk.id);
        return `${p.x} ${p.y}`;
      }).join(' L') + ' Z').join(' ');

      let ring = '';
      if (o.origin && o.showRadius) {
        const c = app.project(o.origin, mk.id);
        ring = `<circle class="lbs-ring" cx="${c.x}" cy="${c.y}" r="1" style="display:none"></circle>
          <ellipse class="lbs-ring" cx="${c.x}" cy="${c.y}"
            rx="${(o.radiusKm / scale.x).toFixed(2)}" ry="${(o.radiusKm / scale.y).toFixed(2)}"></ellipse>
          <circle class="lbs-me" cx="${c.x}" cy="${c.y}" r="1.5"></circle>
          <circle class="lbs-me-pulse" cx="${c.x}" cy="${c.y}" r="3.2"></circle>`;
      }

      const pins = locations.map(loc => {
        const pt = window.LG.store.locationGeo(loc.id);
        if (!pt) return '';
        const p = app.project(pt, mk.id);
        const st = states[loc.id].state;
        const dist = o.origin ? window.LG.store.distanceKm(o.origin, pt) : null;
        const price = app.dayRate(loc);
        const label = o.showLabels
          ? `<text class="lbs-pin-label" x="${p.x + 2.2}" y="${p.y + 0.7}">${app.esc(app.L(loc.name).slice(0, 22))}</text>`
          : '';
        return `<g class="lbs-pin-g lbs-pin-g--${st}" data-pin="${loc.id}" transform="translate(${p.x} ${p.y})"
            tabindex="0" role="button" aria-label="${app.esc(app.L(loc.name))}">
          <circle class="lbs-pin-halo" r="2.6"></circle>
          <circle class="lbs-pin-dot" r="1.35"></circle>
          <title>${app.esc(app.L(loc.name))} — ${app.money(price)}${app.esc(app.t('unit.per_day'))} · ${app.esc(app.t('avail.' + st))}${dist != null ? ' · ' + app.num(dist, 1) + ' km' : ''}</title>
          ${label}
        </g>`;
      }).join('');

      /* Adaptive scale bar: the largest round distance that still fits the panel. */
      const KM_STEPS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
      const scaleBarKm = KM_STEPS.filter(km => km / scale.x <= 30).pop() || 1;
      host.innerHTML = `
        ${notice ? `<p class="tiny muted lbs-notice">${app.esc(app.t('lbs.offline_notice'))}</p>` : ''}
        <svg class="map-svg map-svg--wide" viewBox="0 0 150 100" preserveAspectRatio="xMidYMid meet"
          role="img" aria-label="${app.esc(app.t('map.aria'))}" translate="no">
          <defs>
            <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#eef5fd"/><stop offset="1" stop-color="#dde9f8"/></linearGradient>
            <linearGradient id="land" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#d3e0ef"/><stop offset="1" stop-color="#bfd2e6"/></linearGradient>
          </defs>
          <rect width="150" height="100" fill="url(#sea)"/>
          <path d="${land}" fill="url(#land)" stroke="rgba(13,33,58,.22)" stroke-width=".3"/>
          ${mk.id === 'hk' ? '<line class="map-water" x1="2" y1="60" x2="148" y2="58"/>' : ''}
          ${ring}
          ${pins}
          <g class="lbs-scale">
            <line x1="6" y1="95.5" x2="${6 + scaleBarKm / scale.x}" y2="95.5"/>
            <line x1="6" y1="94.6" x2="6" y2="96.4"/><line x1="${6 + scaleBarKm / scale.x}" y1="94.6" x2="${6 + scaleBarKm / scale.x}" y2="96.4"/>
            <text x="${7 + scaleBarKm / scale.x}" y="96.6">${scaleBarKm} km</text>
          </g>
        </svg>
        <div class="map-legend">${app.legend(o, states, locations)}</div>
        ${o.hideControls ? '' : `<div class="row lbs-locate">
          <button class="btn btn--ghost btn--sm" type="button" data-lbs="locate">◎ ${app.esc(app.t('lbs.locate'))}</button>
          <select data-lbs="landmark" aria-label="${app.esc(app.t('lbs.landmark'))}">
            <option value="">${app.esc(app.t('lbs.landmark'))}</option>
            ${window.LG.store.landmarks().map(l => `<option value="${l.id}">${app.esc(app.t('lbs.lm_' + l.id))}</option>`).join('')}
          </select>
          <button class="btn btn--quiet btn--sm" type="button" data-lbs="clear">${app.esc(app.t('lbs.clear'))}</button>
        </div>`}`;

      host.querySelectorAll('[data-pin]').forEach(el => {
        const id = el.getAttribute('data-pin');
        const go = () => { if (o.onPin) o.onPin(id); else location.href = 'location.html?id=' + encodeURIComponent(id); };
        el.addEventListener('click', go);
        el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
      });
      app.bindLbsControls(host, o);
    },

    bindLbsControls(host, o) {
      const locate = host.querySelector('[data-lbs="locate"]');
      if (locate) locate.addEventListener('click', () => {
        app.locate().then(pt => { o.onOrigin(pt, o.radiusKm || 5); })
          .catch(err => app.toast(app.t(err && err.code === 1 ? 'lbs.denied' : 'lbs.unavailable'), 'warn'));
      });
      const lm = host.querySelector('[data-lbs="landmark"]');
      if (lm) lm.addEventListener('change', () => {
        const id = lm.value;
        const l = window.LG.store.landmarks().find(x => x.id === id);
        if (l && o.onOrigin) o.onOrigin({ lat: l.lat, lng: l.lng }, o.radiusKm);
      });
      const clear = host.querySelector('[data-lbs="clear"]');
      if (clear) clear.addEventListener('click', () => { if (o.onOrigin) o.onOrigin(null, null); });
    },

    legend(o, states, locations) {
      const counts = { available: 0, partial: 0, occupied: 0, restricted: 0, pending: 0 };
      locations.forEach(l => { const s = states[l.id].state; counts[s] = (counts[s] || 0) + 1; });
      const item = (k, cls) => `<span><i class="dot ${cls}"></i>${app.esc(app.t('avail.' + k))} <b>${counts[k] || 0}</b></span>`;
      return [
        item('available', 'dot--free'), item('partial', 'dot--partial'),
        item('occupied', 'dot--full'), item('restricted', 'dot--restricted'),
        o.origin ? `<span class="map-legend__note">${app.esc(app.t('lbs.within', { km: o.radiusKm }))}</span>` : ''
      ].join('');
    },

    /* Landmarks of the active market (fallback origins for "near me"). */
    landmarks(marketId) {
      return (marketById(marketId || currentMarket).landmarks) || [];
    },

    /* Browser geolocation with a friendly failure mode. */
    locate() {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) { reject(new Error('unsupported')); return; }
        navigator.geolocation.getCurrentPosition(
          pos => {
            app._origin = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            resolve(app._origin);
          },
          err => reject(err),
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
        );
      });
    },

    dayRate(loc) {
      return Math.round(loc.devices.reduce((s, d) => {
        const t = window.LG_DEVICES[d.type]; return s + (t ? t.dailyRate : 0);
      }, 0) * window.LG.store.venue(loc.venue).mult);
    },

    /* QR renderer shared by the studio and the crypto checkout. */
    qrSvg(seedStr, size, cls) {
      const rnd = window.LG.store.util.seedFrom(String(seedStr));
      const n = 21, cell = (size || 96) / n;
      let rects = '';
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const finder = (x < 7 && y < 7) || (x > n - 8 && y < 7) || (x < 7 && y > n - 8);
        const on = finder
          ? ((x % 6 === 0 || y % 6 === 0 || (x > 1 && x < 5 && y > 1 && y < 5)) ? 1 : 0)
          : (rnd() > 0.52 ? 1 : 0);
        if (on) rects += `<rect x="${(x * cell).toFixed(2)}" y="${(y * cell).toFixed(2)}" width="${cell.toFixed(2)}" height="${cell.toFixed(2)}"/>`;
      }
      return `<svg class="pv-qr ${cls || ''}" viewBox="0 0 ${size || 96} ${size || 96}" width="${size || 96}" height="${size || 96}"
        role="img" aria-label="${app.esc(app.t('pay.qr_aria'))}" translate="no"><rect width="100%" height="100%" fill="#fff"/>
        <g fill="#000">${rects}</g></svg>`;
    },

    /* --- charts ----------------------------------------------------------- */
    bars(items, opts) {
      const o = Object.assign({ valueFormat: v => app.num(v) }, opts || {});
      const max = Math.max.apply(null, items.map(i => i.value).concat([1]));
      return `<ul class="bars">${items.map(i => `<li>
        <span class="bars__label">${app.esc(i.label)}</span>
        <span class="bars__track"><span class="bars__fill" style="width:${(i.value / max * 100).toFixed(1)}%"></span></span>
        <span class="bars__value">${app.esc(o.valueFormat(i.value))}</span></li>`).join('')}</ul>`;
    },

    donut(segments, opts) {
      const total = segments.reduce((s, x) => s + x.value, 0) || 1;
      let acc = 0;
      const r = 42, c = 2 * Math.PI * r;
      const rings = segments.map(s => {
        const frac = s.value / total;
        const el = `<circle r="${r}" cx="60" cy="60" fill="none" stroke="${s.color}" stroke-width="16"
          stroke-dasharray="${(frac * c).toFixed(2)} ${(c - frac * c).toFixed(2)}"
          stroke-dashoffset="${(-acc * c).toFixed(2)}" transform="rotate(-90 60 60)"></circle>`;
        acc += frac; return el;
      }).join('');
      return `<div class="donut-wrap"><svg viewBox="0 0 120 120" class="donut" role="img"
          aria-label="${app.esc((opts && opts.label) || '')}">${rings}
          <text x="60" y="58" class="donut__value">${app.esc((opts && opts.center) || '')}</text>
          <text x="60" y="72" class="donut__label">${app.esc((opts && opts.centerSub) || '')}</text></svg>
        <ul class="donut-legend">${segments.map(s => `<li><i style="background:${s.color}"></i>
          <span>${app.esc(s.label)}</span><strong>${app.money(s.value)}</strong>
          <em>${app.pct(s.value / total, 0)}</em></li>`).join('')}</ul></div>`;
    },

    stat(label, value, sub, tone) {
      return `<div class="stat${tone ? ' stat--' + tone : ''}">
        <span class="stat__label">${app.esc(label)}</span>
        <strong class="stat__value">${app.esc(value)}</strong>
        ${sub ? `<span class="stat__sub">${app.esc(sub)}</span>` : ''}</div>`;
    },

    /* --- exports ---------------------------------------------------------- */
    downloadCSV(filename, rows) {
      const csv = rows.map(r => r.map(c => {
        const s = String(c == null ? '' : c).replace(/"/g, '""');
        return /[",\n]/.test(s) ? '"' + s + '"' : s;
      }).join(',')).join('\r\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 500);
    },

    /* re-render page-provided render functions on language change */
    onLangChange(fn) { document.addEventListener('lg:lang', fn); },
    onStoreChange(fn) { window.LG.store.subscribe(fn); }
  };

  window.LG = window.LG || {};
  window.LG.app = app;
  window.LG.t = app.t;
  window.LG.L = app.L;

  document.addEventListener('DOMContentLoaded', () => {
    app.initChrome();
    /* an affiliate share link: ?ref=CODE (and optionally ?cid= / ?utm_source=)
     * records the click — the "cookie" — with its window, on whatever page the
     * visitor landed on. See affiliate.html for the whole model. */
    app.recordReferral();
    /* keep ?lang= in internal links so shared URLs keep the language */
    document.querySelectorAll('a[href$=".html"], a[href*=".html?"]').forEach(a => {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('http') || href.includes('lang=')) return;
      a.setAttribute('href', href + (href.includes('?') ? '&' : '?') + 'lang=' + lang);
    });
    window.LG.store.subscribe(() => { app.updateCartBadge(); });
  });
})();
