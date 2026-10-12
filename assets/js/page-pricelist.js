/* ============================================================================
 * 3dNakedEye — page-pricelist.js
 * The Hong Kong price list page: the line sheet's five series with the models
 * and their HKD suggested retail prices, then the accessories, then the terms
 * the accessory sheet prints on its own header.
 *
 * Data: LG_PRICE_LIST in pricelist-data.js. Nothing here is computed — a '/'
 * in the source document is shown as "on request".
 * ==========================================================================*/
(function () {
  'use strict';

  const A = () => window.LG.app;
  const t = (k, v) => A().t(k, v);
  const esc = s => A().esc(s == null ? '' : s);
  const q = id => document.getElementById(id);
  const L = o => (o ? A().L(o) : '');

  const data = () => window.LG_PRICE_LIST || null;
  /* A().L already maps the locale code onto the dictionary field (zh-HK → zhHant) */
  const day = iso => {
    try { return A().date(iso); } catch (e) { return iso; }
  };
  const money = n => (n == null ? t('pl.on_request') : A().money(n, { maximumFractionDigits: 0 }));

  function seriesHtml(s) {
    const rows = s.items.map(it => `<tr>
        <td class="mega-table__key">${esc(it.code)}${it.name ? `<div class="tiny muted">${esc(L(it.name))}</div>` : ''}</td>
        <td class="tiny">${it.led ? esc(it.led) : '<span class="muted">—</span>'}</td>
        <td class="num"><strong>${esc(money(it.price))}</strong></td>
      </tr>`).join('');
    return `<section class="section--tight pl-series" id="series-${esc(s.id)}">
      <div class="section-head">
        <h2>${esc(L(s.name))}</h2>
        <p>${esc(L(s.lede))}</p>
      </div>
      <div class="table-wrap"><table class="data pl-table">
        <thead><tr>
          <th>${esc(t('pl.col_model'))}</th>
          <th>${esc(t('pl.col_led'))}</th>
          <th class="num">${esc(t('pl.col_price'))} <span class="tiny muted">${esc(t('pl.currency'))}</span></th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table></div></section>`;
  }

  function accHtml(block) {
    const rows = block.items.map(it => `<tr>
        <td class="mega-table__key">${esc(L(it.name))}</td>
        <td class="tiny muted">${esc(it.spec || '—')}</td>
        <td class="num"><strong>${esc(money(it.price))}</strong></td>
      </tr>`).join('');
    return `<section class="section--tight" id="acc-${esc(block.id)}">
      <div class="section-head"><h3>${esc(t(block.titleKey))}</h3></div>
      <div class="table-wrap"><table class="data pl-table">
        <thead><tr>
          <th>${esc(t('pl.col_item'))}</th>
          <th>${esc(t('pl.col_spec'))}</th>
          <th class="num">${esc(t('pl.col_price'))} <span class="tiny muted">${esc(t('pl.currency'))}</span></th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table></div></section>`;
  }

  function render() {
    const host = q('priceListBody');
    const d = data();
    if (!host || !d) return;

    const models = d.series.reduce((n, s) => n + s.items.length, 0);
    const priced = d.series.reduce((n, s) => n + s.items.filter(i => i.price != null).length, 0);
    const accessories = d.accessories.reduce((n, b) => n + b.items.length, 0);
    const prices = d.series.reduce((a, s) => a.concat(s.items.map(i => i.price).filter(p => p != null)), []);
    const from = Math.min.apply(null, prices);

    host.innerHTML = `
      <div class="page-head">
        <span class="eyebrow">${esc(t('pl.eyebrow'))}</span>
        <h1>${esc(t('pl.title'))}</h1>
        <p class="lede">${esc(t('pl.lede'))}</p>
        <p class="pl-valid"><span class="pill pill--info">${esc(t('pl.valid', { from: day(d.valid.from), to: day(d.valid.to) }))}</span></p>
      </div>

      <section class="grid grid--4 mega-stats">
        <div class="stat"><span class="stat__value">${models}</span><span class="stat__label">${esc(t('pl.stat_models'))}</span></div>
        <div class="stat"><span class="stat__value">${d.series.length}</span><span class="stat__label">${esc(t('pl.stat_series'))}</span></div>
        <div class="stat"><span class="stat__value">${A().money(from, { maximumFractionDigits: 0 })}</span><span class="stat__label">${esc(t('pl.stat_from'))}</span></div>
        <div class="stat"><span class="stat__value">${accessories}</span><span class="stat__label">${esc(t('pl.stat_acc'))}</span></div>
      </section>

      <section class="section--tight" id="models">
        <div class="section-head">
          <h2>${esc(t('pl.models'))}</h2>
          <p>${esc(t('pl.models_lede'))}</p>
        </div>
        <div class="pl-grid">${d.series.map(s => `
          <a class="card card--tight pl-jump" href="#series-${esc(s.id)}">
            <strong>${esc(L(s.name))}</strong>
            <span class="tiny muted">${s.items.length} ${esc(t('pl.stat_models')).toLowerCase()}</span>
          </a>`).join('')}</div>
      </section>

      ${d.series.map(seriesHtml).join('')}

      <section class="section--tight" id="accessories">
        <div class="section-head">
          <h2>${esc(t('pl.accessories'))}</h2>
          <p>${esc(t('pl.accessories_lede'))}</p>
        </div>
        ${d.accessories.map(accHtml).join('')}
      </section>

      <section class="section--tight">
        <div class="card">
          <h3>${esc(t('pl.terms'))}</h3>
          <ul class="kpi-list">${(d.noteKeys || []).map(k => `<li><span>${esc(t(k))}</span></li>`).join('')}</ul>
        </div>
        <div class="card mega-note" style="margin-top:14px">
          <p>${esc(t('pl.cta_lede'))}</p>
          <div class="row row--wrap">
            <a class="btn btn--primary" href="contact.html?interest=hologram_buy">${esc(t('pl.cta'))}</a>
            <a class="btn btn--ghost" href="catalog.html">${esc(t('nav.catalog'))}</a>
            <a class="btn btn--quiet" href="pricing.html">${esc(t('nav.pricing'))}</a>
          </div>
        </div>
        <p class="tiny muted">${esc(t('pl.source'))}</p>
      </section>`;
  }

  document.addEventListener('DOMContentLoaded', render);
  A().onLangChange(render);
  window.LG = window.LG || {};
  window.LG.pricelist = { render, data };
})();
