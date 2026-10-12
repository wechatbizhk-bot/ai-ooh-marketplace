/* ============================================================================
 * 3dNakedEye — page-cloud.js
 * The cloud-control walkthrough. The section tree is the platform's own menu
 * order, taken from the manufacturer's cloud operation manual (LG_CLOUD in
 * catalog-data.js), so the page matches what an operator sees on screen.
 * ==========================================================================*/
(function () {
  'use strict';

  const A = () => window.LG.app;
  const t = (k, v) => A().t(k, v);
  const esc = s => A().esc(s == null ? '' : s);
  const q = id => document.getElementById(id);

  function treeHtml() {
    const tree = window.LG_CLOUD || [];
    return `<div class="cloud-tree">${tree.map(sec => {
      const has = sec.items.length > 0;
      return `
      <details class="cloud-sec"${sec.id === 'start' || sec.id === 'devices' ? ' open' : ''}>
        <summary>
          <span class="cloud-sec__n">${esc(t(sec.i18n))}</span>
          ${has ? `<span class="cloud-sec__count">${sec.items.length}</span>` : ''}
          ${has ? '<span class="faq-item__chev" aria-hidden="true">▾</span>' : ''}
        </summary>
        ${has
          ? `<ul class="cloud-sec__items">${sec.items.map(i => `<li>${esc(t(i))}</li>`).join('')}</ul>`
          : `<p class="cloud-sec__empty tiny muted">${esc(t('cloud.no_ops'))}</p>`}
      </details>`;
    }).join('')}</div>`;
  }

  function stepsHtml() {
    const steps = ['cloud.step1', 'cloud.step2', 'cloud.step3', 'cloud.step4', 'cloud.step5', 'cloud.step6'];
    return `<ol class="steps">${steps.map(s => `<li><span>${esc(t(s))}</span></li>`).join('')}</ol>`;
  }

  function render() {
    const host = q('cloudBody');
    if (!host) return;
    const tree = window.LG_CLOUD || [];
    const ops = tree.reduce((n, s) => n + s.items.length, 0);
    host.innerHTML = `
      <div class="page-head">
        <span class="eyebrow">${esc(t('cloud.eyebrow'))}</span>
        <h1>${esc(t('cloud.title'))}</h1>
        <p class="lede">${esc(t('cloud.lede'))}</p>
      </div>

      <section class="grid grid--4 mega-stats">
        <div class="stat"><span class="stat__value">${tree.length}</span><span class="stat__label">${esc(t('cloud.stat1'))}</span></div>
        <div class="stat"><span class="stat__value">${ops}</span><span class="stat__label">${esc(t('cloud.stat2'))}</span></div>
        <div class="stat"><span class="stat__value">cron</span><span class="stat__label">${esc(t('cloud.stat3'))}</span></div>
        <div class="stat"><span class="stat__value">4</span><span class="stat__label">${esc(t('cmp.stat3'))}</span></div>
      </section>

      <section class="grid grid--2 section--tight" style="align-items:start">
        <div class="card">
          <h2 class="card__title">${esc(t('cloud.what'))}</h2>
          <ul class="checklist mega-list">
            <li><span class="mark mark--pass" aria-hidden="true">✓</span><span>${esc(t('cloud.what_1'))}</span></li>
            <li><span class="mark mark--pass" aria-hidden="true">✓</span><span>${esc(t('cloud.what_2'))}</span></li>
            <li><span class="mark mark--pass" aria-hidden="true">✓</span><span>${esc(t('cloud.what_3'))}</span></li>
            <li><span class="mark mark--pass" aria-hidden="true">✓</span><span>${esc(t('cloud.what_4'))}</span></li>
          </ul>
        </div>
        <div class="card">
          <h2 class="card__title">${esc(t('cloud.first'))}</h2>
          ${stepsHtml()}
        </div>
      </section>

      <section class="section--tight" id="menu">
        <div class="section-head">
          <h2>${esc(t('cloud.tree'))}</h2>
          <p>${esc(t('cloud.tree_lede'))}</p>
        </div>
        ${treeHtml()}
      </section>

      <section class="grid grid--2 section--tight">
        <div class="card">
          <h3>${esc(t('cloud.sched'))}</h3>
          <p class="tiny muted">${esc(t('cloud.sched_lede'))}</p>
          <p class="tiny"><code>0 9 * * 1-5</code> — ${esc(t('cloud.cron_eg'))}</p>
        </div>
        <div class="card">
          <h3>${esc(t('cloud.safety'))}</h3>
          <ul class="kpi-list">
            <li><span>${esc(t('cloud.safety_1'))}</span></li>
            <li><span>${esc(t('cloud.safety_2'))}</span></li>
          </ul>
        </div>
      </section>

      <section class="section--tight">
        <div class="card mega-note">
          <p>${esc(t('cloud.note'))}</p>
          <div class="row row--wrap">
            <a class="btn btn--primary" href="contact.html?interest=ooh_booking">${esc(t('cloud.cta'))}</a>
            <a class="btn btn--ghost" href="dimension.html">${esc(t('nav.dimension'))}</a>
            <a class="btn btn--quiet" href="catalog.html">${esc(t('nav.catalog'))}</a>
          </div>
        </div>
        <p class="tiny muted">${esc(t('cloud.source_note'))}</p>
      </section>`;
  }

  document.addEventListener('DOMContentLoaded', render);
  A().onLangChange(render);
  window.LG = window.LG || {};
  window.LG.cloud = { render };
})();
