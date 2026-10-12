/* ============================================================================
 * 3dNakedEye — page-mega.js
 * One renderer for the nine structure pages (solutions, industries, events,
 * mobile-unit, booth, ooh, technology, company, partnership). Each page carries
 * <main data-mega="<key>"> and this module builds it from LG_MEGA_PAGES, so the
 * pages stay consistent and adding a tenth is a data change.
 *
 * Block kinds: cards | steps | list | table | stats | note | faq | stage
 * ==========================================================================*/
(function () {
  'use strict';

  const A = () => window.LG.app;
  const t = (k, v) => A().t(k, v);
  const esc = s => A().esc(s || '');
  const q = id => document.getElementById(id);

  const pageKey = () => {
    const main = document.querySelector('[data-mega]');
    return main ? main.getAttribute('data-mega') : null;
  };
  const spec = key => (window.LG_MEGA_PAGES || {})[key] || null;

  /* ---------- blocks ------------------------------------------------------- */
  function blockHtml(b) {
    const head = b.title ? `<div class="section-head">
        <h2>${esc(t(b.title))}</h2>
        ${b.lede ? `<p>${esc(t(b.lede))}</p>` : ''}
      </div>` : '';

    if (b.kind === 'cards') {
      const cols = b.cols === 2 ? 'grid--2' : (b.cols === 4 ? 'grid--4' : 'grid--3');
      return `<section class="section--tight" id="${esc(b.id || '')}">${head}
        <div class="grid ${cols} mega-cards">
          ${b.items.map(it => {
            const inner = `<span class="mega-card__icon" aria-hidden="true">${esc(it.icon || '•')}</span>
              <h3>${esc(t(it.i18n))}</h3>
              <p>${esc(t(it.text))}</p>
              ${it.href ? `<span class="mega-card__go">${esc(t('mg.all'))} →</span>` : ''}`;
            /* an item may carry its own id so a menu entry can deep-link to the card */
            const idAttr = it.id ? ` id="${esc(it.id)}"` : '';
            return it.href
              ? `<a class="card mega-card"${idAttr} href="${esc(it.href)}">${inner}</a>`
              : `<div class="card mega-card"${idAttr}>${inner}</div>`;
          }).join('')}
        </div></section>`;
    }

    if (b.kind === 'steps') {
      return `<section class="section--tight" id="${esc(b.id || '')}">${head}
        <ol class="steps">${b.items.map(k => `<li><span>${esc(t(k))}</span></li>`).join('')}</ol></section>`;
    }

    if (b.kind === 'list') {
      return `<section class="section--tight" id="${esc(b.id || '')}">${head}
        <ul class="checklist mega-list">${b.items.map(k =>
          `<li><span class="mark mark--pass" aria-hidden="true">✓</span><span>${esc(t(k))}</span></li>`).join('')}</ul></section>`;
    }

    if (b.kind === 'table') {
      return `<section class="section--tight" id="${esc(b.id || '')}">${head}
        <div class="table-wrap"><table class="data">
          <thead><tr>${b.head.map(h => `<th>${esc(t(h))}</th>`).join('')}</tr></thead>
          <tbody>${b.rows.map(r => `<tr>${r.map((c, i) =>
            `<td${i === 0 ? ' class="mega-table__key"' : ''}>${esc(t(c))}</td>`).join('')}</tr>`).join('')}</tbody>
        </table></div></section>`;
    }

    if (b.kind === 'faq') {
      return `<section class="section--tight" id="${esc(b.id || '')}">${head}
        <div class="mega-faq">${b.items.map(k => `<details class="faq-item">
          <summary><span class="faq-item__q">${esc(t(k + '.q'))}</span>
            <span class="faq-item__chev" aria-hidden="true">▾</span></summary>
          <div class="faq-item__a"><p>${esc(t(k + '.a'))}</p>
            <div class="faq-item__links"><a class="btn btn--quiet btn--sm" href="faq.html#${esc(k.replace(/\./g, '-'))}">${esc(t('nav.faq'))}</a></div>
          </div></details>`).join('')}</div></section>`;
    }

    if (b.kind === 'stage') {
      /* a figure host for a page-owned visual (the Holobox explainer draws
       * itself into [data-visual] after this markup is in the DOM) */
      return `<section class="section--tight" id="${esc(b.id || '')}">${head}
        <div class="card card--flush stage-card" data-visual="${esc(b.visual || '')}" id="${esc(b.host || 'stage')}Host">
          <noscript><p class="tiny muted">${esc(t(b.caption || 'hb.player_note'))}</p></noscript>
        </div>
        ${b.caption ? `<p class="tiny muted stage-cap">${esc(t(b.caption))}</p>` : ''}</section>`;
    }

    if (b.kind === 'note') {
      return `<section class="section--tight">${head}
        <div class="card mega-note">
          <p>${esc(t(b.text))}</p>
          ${b.href ? `<a class="btn btn--primary" href="${esc(b.href)}">${esc(t(b.cta || 'cta.contact'))}</a>` : ''}
        </div></section>`;
    }

    return '';
  }

  function statsHtml(keys) {
    if (!keys || !keys.length) return '';
    /* values come from the live store where they exist, so the numbers on these
       pages are the same numbers the marketplace shows */
    const S = window.LG.store;
    const live = S ? S.liveLocations().length : 0;
    const districts = new Set((S ? S.liveLocations() : []).map(l => l.district)).size;
    const cities = (window.LG_DISTRICTS || []).length;
    const values = {
      'sol.stat1': '28 cm · 43" · 55" · 65" · 75"',
      'sol.stat2': '10',
      'sol.stat3': String(cities),
      'sol.stat4': 'EN · 繁 · 简 · ไทย',
      'ind.stat1': '6+', 'ind.stat2': String(live), 'ind.stat3': String(districts),
      'evt.stat1': '< 2 h', 'evt.stat2': '1–5 days', 'evt.stat3': '1',
      'mu.stat1': '< 2 h', 'mu.stat2': '2–3', 'mu.stat3': '6–8',
      'bt.stat1': '3', 'bt.stat2': '< 4 h', 'bt.stat3': 'QR + tablet',
      'ooh.stat1': String(live), 'ooh.stat2': String(districts), 'ooh.stat3': String(cities), 'ooh.stat4': 'play log',
      'tec.stat1': '≥ 55%', 'tec.stat2': '1:1', 'tec.stat3': '10–30 s',
      'hb.stat1': 'transparent LCD', 'hb.stat2': '4K two-way', 'hb.stat3': 'power + internet', 'hb.stat4': 'AI metahuman',
      'lf.stat1': '4–20 mm', 'lf.stat2': '90–98 %', 'lf.stat3': '240 × 1500 mm', 'lf.stat4': '10 years',
      'af.stat1': '3', 'af.stat2': '7 · 30 · 90', 'af.stat3': '3', 'af.stat4': '10',
      'cmp.stat1': '2', 'cmp.stat2': String(live), 'cmp.stat3': '4', 'cmp.stat4': '< 1 day',
      'part.stat1': '5', 'part.stat2': '2 weeks', 'part.stat3': '2'
    };
    return `<section class="grid grid--4 mega-stats">${keys.map(k => `
      <div class="stat"><span class="stat__value">${esc(values[k] || '—')}</span>
        <span class="stat__label">${esc(t(k))}</span></div>`).join('')}</section>`;
  }

  /* ---------- render ------------------------------------------------------- */
  function render() {
    const key = pageKey();
    const s = spec(key);
    const host = q('megaBody');
    if (!s || !host) return;

    document.title = t(s.title) + ' | ' + (A().CFG && A().CFG.brand ? A().CFG.brand.name : '3dNakedEye');
    host.innerHTML = `
      <div class="page-head">
        <span class="eyebrow">${esc(t(s.eyebrow))}</span>
        <h1>${esc(t(s.title))}</h1>
        <p class="lede">${esc(t(s.lede))}</p>
        ${s.source ? `<p class="tiny muted">${esc(t(s.source))}</p>` : ''}
      </div>
      ${statsHtml(s.stats)}
      ${s.blocks.map(blockHtml).join('')}`;

    /* deep link support after a re-render */
    if (location.hash) {
      const target = document.getElementById(location.hash.slice(1));
      if (target) target.scrollIntoView({ block: 'start' });
    }
  }

  document.addEventListener('DOMContentLoaded', render);
  A().onLangChange(render);

  window.LG = window.LG || {};
  window.LG.megaPage = { render, block: blockHtml, spec };
})();
