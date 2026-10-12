/* ============================================================================
 * 3dNakedEye — page-catalog.js
 * The product catalogue page: families, per-series specification tables from
 * catalog-data.js, the engineering-vs-compact comparison, matrix builds and
 * accessories. Values are printed exactly as the manufacturer publishes them —
 * a dash means the catalogue does not state it, and we do not invent it.
 * ==========================================================================*/
(function () {
  'use strict';

  const A = () => window.LG.app;
  const t = (k, v) => A().t(k, v);
  const esc = s => A().esc(s == null ? '' : s);
  const q = id => document.getElementById(id);

  const cell = v => (v === '—' ? '<span class="muted">—</span>' : esc(String(v).indexOf('cat.') === 0 ? t(v) : v));

  function seriesHtml(s) {
    return `<section class="section--tight cat-series" id="series-${esc(s.id)}">
      <div class="section-head">
        <h2>${esc(t(s.name))}${s.tier === 'pro' ? ' <span class="pill pill--info">' + esc(t('cat.tier_pro')) + '</span>' : ''}</h2>
        <p>${esc(t(s.tagline))}</p>
      </div>
      <div class="table-wrap"><table class="data data--compact cat-table">
        <thead><tr><th>${esc(t('cat.col_item'))}</th>${s.cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead>
        <tbody>${s.rows.map(r => `<tr><td class="cat-table__key">${esc(t(r[0]))}</td>${
          r.slice(1).map(v => `<td>${cell(v)}</td>`).join('')}</tr>`).join('')}</tbody>
      </table></div>
      <p class="tiny muted">${esc(t(s.note))}</p>
    </section>`;
  }

  function familiesHtml() {
    const fams = window.LG_FAMILIES || [];
    return `<section class="section--tight" id="families">
      <div class="section-head"><h2>${esc(t('cat.families'))}</h2></div>
      <div class="grid grid--4 mega-cards">${fams.map(f => `
        <a class="card mega-card" href="${esc(f.href)}">
          <span class="mega-card__icon" aria-hidden="true">${esc(f.icon)}</span>
          <h3>${esc(t(f.i18n))}</h3>
          <p>${esc(t(f.desc))}</p>
        </a>`).join('')}</div></section>`;
  }

  function advantagesHtml() {
    const adv = window.LG_ADVANTAGES || [];
    return `<section class="section--tight" id="advantages">
      <div class="section-head">
        <h2>${esc(t('cat.adv'))}</h2>
        <p>${esc(t('cat.adv_lede'))}</p>
      </div>
      <div class="table-wrap"><table class="data cat-adv">
        <thead><tr><th>${esc(t('cat.col_item'))}</th>
          <th class="cat-adv__p">${esc(t('cat.adv_col1'))}</th>
          <th>${esc(t('cat.adv_col2'))}</th></tr></thead>
        <tbody>${adv.map(a => `<tr>
          <td class="cat-table__key">${esc((t('cat.row_' + a.id) !== 'cat.row_' + a.id) ? t('cat.row_' + a.id) : a.id)}</td>
          <td class="cat-adv__p">${esc(t(a.p))}</td>
          <td>${esc(t(a.o))}</td></tr>`).join('')}</tbody>
      </table></div></section>`;
  }

  function matrixHtml() {
    const rows = window.LG_MATRIX || [];
    return `<section class="section--tight" id="matrix">
      <div class="section-head"><h2>${esc(t('cat.matrix'))}</h2><p>${esc(t('cat.matrix_lede'))}</p></div>
      <div class="table-wrap"><table class="data">
        <thead><tr><th>${esc(t('cat.col_build'))}</th><th>${esc(t('cat.col_size'))}</th>
          <th>${esc(t('cat.col_res'))}</th><th>${esc(t('cat.col_units'))}</th></tr></thead>
        <tbody>${rows.map(m => `<tr>
          <td class="cat-table__key">${esc(t(m.name))}</td>
          <td>${esc(m.size)}</td><td>${cell(m.res)}</td><td class="tiny">${esc(t(m.units))}</td></tr>`).join('')}</tbody>
      </table></div></section>`;
  }

  function accessoriesHtml() {
    const acc = window.LG_ACCESSORIES || [];
    return `<section class="section--tight" id="accessories">
      <div class="section-head"><h2>${esc(t('cat.accessories'))}</h2></div>
      <div class="grid grid--4 cat-acc">${acc.map(a => `
        <div class="card card--tight">
          <strong>${esc(t(a.i18n))}</strong>
          <p class="tiny muted">${esc(t(a.note))}</p>
        </div>`).join('')}</div></section>`;
  }

  function render() {
    const host = q('catalogBody');
    if (!host) return;
    const series = window.LG_SERIES || [];
    const models = series.reduce((n, s) => n + s.cols.length, 0);
    host.innerHTML = `
      <div class="page-head">
        <span class="eyebrow">${esc(t('cat.eyebrow'))}</span>
        <h1>${esc(t('cat.title'))}</h1>
        <p class="lede">${esc(t('cat.lede'))}</p>
      </div>
      <section class="grid grid--4 mega-stats">
        <div class="stat"><span class="stat__value">${models}</span><span class="stat__label">${esc(t('cat.stat1'))}</span></div>
        <div class="stat"><span class="stat__value">${series.length}</span><span class="stat__label">${esc(t('cat.stat2'))}</span></div>
        <div class="stat"><span class="stat__value">6912×6912</span><span class="stat__label">${esc(t('cat.stat3'))}</span></div>
        <div class="stat"><span class="stat__value">7500 cd/m²</span><span class="stat__label">${esc(t('cat.stat4'))}</span></div>
      </section>
      ${familiesHtml()}
      <section class="section--tight" id="series">
        <div class="section-head"><h2>${esc(t('cat.series'))}</h2><p>${esc(t('cat.series_lede'))}</p></div>
      </section>
      ${series.map(seriesHtml).join('')}
      ${advantagesHtml()}
      ${matrixHtml()}
      ${accessoriesHtml()}
      <section class="section--tight">
        <div class="card mega-note">
          <p>${esc(t('cat.source_note'))}</p>
          <div class="row row--wrap">
            <a class="btn btn--primary" href="contact.html?interest=hologram_buy">${esc(t('mg.demo_cta'))}</a>
            <a class="btn btn--ghost" href="dimension.html">${esc(t('nav.dimension'))}</a>
            <a class="btn btn--quiet" href="cloud.html">${esc(t('nav.cloud'))}</a>
          </div>
        </div>
      </section>`;
  }

  document.addEventListener('DOMContentLoaded', render);
  A().onLangChange(render);
  window.LG = window.LG || {};
  window.LG.catalog = { render };
})();
