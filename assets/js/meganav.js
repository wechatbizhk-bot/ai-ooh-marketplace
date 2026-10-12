/* ============================================================================
 * 3dNakedEye — meganav.js
 * The header navigation: ten top-level entries, most of them opening a
 * full-width panel with grouped items and a featured card, exactly the way
 * buyers in this category expect to browse (solutions by capability, an
 * industries list, product pages for events / mobile / booth / OOH, technology,
 * platform, company, partnership).
 *
 * Behaviour:
 *   • desktop  — hover or click to open, click outside / Esc / focus-out to close
 *   • keyboard — Enter or Space toggles, Esc closes and returns focus
 *   • mobile   — the burger opens an accordion of the same structure
 *   • a page with no menu (a plain link) simply navigates
 * Everything is rebuilt on language change from LG_NAV, so the menu can never
 * drift from the pages.
 * ==========================================================================*/
(function () {
  'use strict';

  const A = () => window.LG.app;
  const t = (k, v) => A().t(k, v);
  const esc = s => A().esc(s || '');
  let openId = null, closeTimer = null, bound = false;

  const navData = () => window.LG_NAV || [];
  const isMobile = () => window.matchMedia && window.matchMedia('(max-width: 1080px)').matches;

  /* ---------- markup ------------------------------------------------------- */
  function columnHtml(col) {
    return `<div class="meganav__col">
      <p class="meganav__coltitle">${esc(t(col.title))}</p>
      <ul class="meganav__list">
        ${col.items.map(it => `<li>
          <a class="meganav__item" href="${esc(it.href)}">
            <span class="meganav__icon" aria-hidden="true">${esc(it.icon || '•')}</span>
            <span class="meganav__text">
              <strong>${esc(t(it.i18n))}</strong>
              ${it.desc ? `<span>${esc(t(it.desc))}</span>` : ''}
            </span>
          </a></li>`).join('')}
      </ul></div>`;
  }

  function panelHtml(item) {
    const featured = item.featured ? `
      <a class="meganav__featured" href="${esc(item.featured.href)}">
        <span class="meganav__icon meganav__icon--lg" aria-hidden="true">${esc(item.featured.icon || '◆')}</span>
        <strong>${esc(t(item.featured.label))}</strong>
        <span>${esc(t(item.featured.desc))}</span>
        <span class="meganav__more">${esc(t('mg.all'))} →</span>
      </a>` : '';
    return `<div class="meganav__inner">
        <div class="meganav__cols">${item.columns.map(columnHtml).join('')}</div>
        ${featured}
      </div>
      <p class="meganav__foot">
        <a class="meganav__all" href="${esc(item.href)}">${esc(t(item.label))} — ${esc(t('mg.all'))} →</a>
      </p>`;
  }

  /* ---------- build -------------------------------------------------------- */
  function build() {
    const links = document.getElementById('navLinks');
    const header = document.querySelector('.site-header');
    if (!links || !header) return;

    const items = navData();
    links.classList.add('meganav');
    links.innerHTML = items.map(item => {
      const hasMenu = !!(item.columns && item.columns.length);
      if (!hasMenu) {
        return `<li class="meganav__top"><a class="meganav__trigger" href="${esc(item.href)}">${esc(t(item.label))}</a></li>`;
      }
      return `<li class="meganav__top" data-nav="${esc(item.id)}">
        <button type="button" class="meganav__trigger" aria-expanded="false" aria-haspopup="true"
                aria-controls="meganav-${esc(item.id)}">
          ${esc(t(item.label))}<span class="meganav__chev" aria-hidden="true">▾</span>
        </button></li>`;
    }).join('');

    /* one panel host, re-filled on open so only one menu is ever in the DOM */
    let host = document.getElementById('megaPanels');
    if (!host) {
      host = document.createElement('div');
      host.id = 'megaPanels';
      host.className = 'meganav__panels';
      header.appendChild(host);
    }
    host.innerHTML = '';

    /* header CTAs, if the page does not already have them */
    const tools = document.querySelector('.nav__tools');
    if (tools && !document.getElementById('megaCta')) {
      const cta = document.createElement('span');
      cta.id = 'megaCta';
      cta.className = 'meganav__cta';
      cta.innerHTML = `
        <a class="btn btn--ghost btn--sm" href="partnership.html">${esc(t('mg.partner_cta'))}</a>
        <a class="btn btn--primary btn--sm" href="contact.html?interest=ooh_booking">${esc(t('mg.demo_cta'))}</a>`;
      tools.insertBefore(cta, tools.firstChild);
    }
    if (!bound) { bind(); bound = true; }
    markCurrent();
  }

  /* ---------- open / close ------------------------------------------------- */
  function open(item, trigger) {
    const host = document.getElementById('megaPanels');
    if (!host) return;
    clearTimeout(closeTimer);
    openId = item.id;
    host.innerHTML = `<div class="meganav__panel" id="meganav-${esc(item.id)}" role="region"
        aria-label="${esc(t(item.label))}">${panelHtml(item)}</div>`;
    document.querySelectorAll('.meganav__top').forEach(li => {
      const on = li.getAttribute('data-nav') === item.id;
      li.classList.toggle('is-open', on);
      const b = li.querySelector('.meganav__trigger');
      if (b && b.tagName === 'BUTTON') b.setAttribute('aria-expanded', String(on));
    });
    document.documentElement.classList.add('meganav-open');
    void trigger;
  }

  function close() {
    const host = document.getElementById('megaPanels');
    openId = null;
    if (host) host.innerHTML = '';
    document.querySelectorAll('.meganav__top').forEach(li => {
      li.classList.remove('is-open');
      const b = li.querySelector('.meganav__trigger');
      if (b && b.tagName === 'BUTTON') b.setAttribute('aria-expanded', 'false');
    });
    document.documentElement.classList.remove('meganav-open');
  }

  const scheduleClose = () => { clearTimeout(closeTimer); closeTimer = setTimeout(close, 220); };

  /* ---------- events ------------------------------------------------------ */
  function bind() {
    const links = document.getElementById('navLinks');
    if (!links) return;

    const itemFor = id => navData().find(i => i.id === id);

    const toggle = (li, ev) => {
      const item = itemFor(li.getAttribute('data-nav'));
      if (!item) return;
      if (openId === item.id) close();
      else open(item, ev.currentTarget);
    };

    links.addEventListener('click', e => {
      const trigger = e.target.closest('.meganav__trigger');
      if (!trigger || trigger.tagName !== 'BUTTON') return;
      e.preventDefault();
      toggle(trigger.closest('.meganav__top'), e);
    });

    links.addEventListener('mouseover', e => {
      if (isMobile()) return;
      const li = e.target.closest('.meganav__top');
      if (!li || !li.getAttribute('data-nav')) return;
      const item = itemFor(li.getAttribute('data-nav'));
      if (item && openId !== item.id) open(item, li.querySelector('.meganav__trigger'));
    });

    const header = document.querySelector('.site-header');
    if (header) {
      header.addEventListener('mouseleave', () => { if (!isMobile()) scheduleClose(); });
      header.addEventListener('mouseenter', () => clearTimeout(closeTimer));
      /* keep the menu open while the pointer is inside the panel */
      header.addEventListener('mouseover', () => clearTimeout(closeTimer));
    }

    document.addEventListener('click', e => {
      if (!openId) return;
      if (e.target.closest('.site-header')) return;
      close();
    });

    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape' || !openId) return;
      const btn = document.querySelector('.meganav__top.is-open .meganav__trigger');
      close();
      if (btn) btn.focus();
    });

    /* desktop ⇄ mobile: a resize should not leave a panel stranded */
    window.addEventListener('resize', () => { if (openId && isMobile()) close(); });

    /* the burger turns the same structure into an accordion */
    const burger = document.getElementById('navToggle');
    if (burger) {
      burger.addEventListener('click', () => {
        const openNow = links.classList.contains('is-open');
        if (openNow) buildAccordion();
      });
    }
  }

  /* ---------- mobile accordion -------------------------------------------- */
  function buildAccordion() {
    const links = document.getElementById('navLinks');
    if (!links) return;
    links.innerHTML = navData().map(item => {
      const hasMenu = !!(item.columns && item.columns.length);
      const body = hasMenu ? `<div class="meganav__acc-body" hidden>
          ${item.columns.map(col => `<p class="meganav__coltitle">${esc(t(col.title))}</p>
            <ul class="meganav__list">${col.items.map(it => `<li>
              <a class="meganav__item" href="${esc(it.href)}">
                <span class="meganav__icon" aria-hidden="true">${esc(it.icon || '•')}</span>
                <span class="meganav__text"><strong>${esc(t(it.i18n))}</strong>
                ${it.desc ? `<span>${esc(t(it.desc))}</span>` : ''}</span>
              </a></li>`).join('')}</ul>`).join('')}
        </div>` : '';
      return `<li class="meganav__top meganav__top--acc" data-nav="${esc(item.id)}">
        ${hasMenu
          ? `<button type="button" class="meganav__trigger" aria-expanded="false">${esc(t(item.label))}<span class="meganav__chev" aria-hidden="true">▾</span></button>${body}`
          : `<a class="meganav__trigger" href="${esc(item.href)}">${esc(t(item.label))}</a>`}
      </li>`;
    }).join('');
    links.querySelectorAll('.meganav__top--acc > button').forEach(b => {
      b.addEventListener('click', () => {
        const body = b.nextElementSibling;
        const on = b.getAttribute('aria-expanded') === 'true';
        b.setAttribute('aria-expanded', String(!on));
        if (body) body.hidden = on;
      });
    });
  }

  function markCurrent() {
    const page = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('#navLinks a').forEach(a => {
      const href = (a.getAttribute('href') || '').split('#')[0].split('?')[0];
      if (href && href === page) a.classList.add('is-current');
    });
    const top = Array.from(document.querySelectorAll('.meganav__top')).find(li => {
      const item = navData().find(i => i.id === li.getAttribute('data-nav'));
      return item && item.href === page;
    });
    if (top) top.classList.add('is-current');
  }

  function render() {
    build();
    if (isMobile()) buildAccordion();
    /* ?nav=solutions opens that menu — handy for deep links and screenshots */
    const want = new URLSearchParams(location.search || '').get('nav');
    if (want && !isMobile()) {
      const item = (window.LG_NAV || []).find(i => i.id === want);
      if (item && item.columns && item.columns.length) open(item, null);
    }
  }

  document.addEventListener('DOMContentLoaded', render);
  document.addEventListener('lg:lang', () => { close(); render(); });

  window.LG = window.LG || {};
  window.LG.meganav = { render, close, open: id => {
    const item = (window.LG_NAV || []).find(i => i.id === id);
    if (item) open(item, null);
  }, isOpen: () => openId };
})();
