/* ============================================================================
 * 3dNakedEye — page-calculator.js
 * The size calculator: what a row of units measures, and how many units cover a
 * wall — from "Dimension Calculation Table for Various Models.xlsx" only.
 *
 * Two ways in, the same numbers out:
 *   • I know how many units  → the display size they make
 *   • I know the wall width  → the units needed, and the size they make
 *
 * The page prints the sheet's own formula beside the result, so the arithmetic
 * can be checked by hand, and carries the sheet's closing note verbatim in
 * substance for anything larger.
 * ==========================================================================*/
(function () {
  'use strict';

  const A = () => window.LG.app;
  const t = (k, v) => A().t(k, v);
  const esc = s => A().esc(s == null ? '' : s);
  const q = id => document.getElementById(id);

  const T = () => window.LG_SIZE_TABLE || null;
  const cls = id => (T().classes.find(c => c.id === id) || T().classes[0]);
  const fx = n => (Math.round(n * 1000) / 1000).toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
  const state = { mode: 'units', classId: '65', units: 9, width: 3 };

  /* ---------- the answer -------------------------------------------------- */
  function calc() {
    const c = cls(state.classId);
    const T0 = T();
    if (state.mode === 'units') {
      const n = Math.max(1, Math.min(T0.maxUnits, Math.round(state.units)));
      const size = T0.sizeFor(n, c.id);
      return { c, n, size, capped: state.units > T0.maxUnits };
    }
    const r = T0.unitsFor(state.width, c.id);
    return { c, n: r.units, size: r.width, capped: state.width > T0.sizeFor(T0.maxUnits, c.id) };
  }

  function resultHtml() {
    const r = calc();
    const gaps = r.n - 1;
    return `<div class="dim-grid">
      <div class="dim-out dim-out--hero"><span class="dim-out__label">${esc(t('sz.r_units'))}</span>
        <span class="dim-out__value">${r.n}</span></div>
      <div class="dim-out dim-out--hero"><span class="dim-out__label">${esc(t('sz.r_size'))}</span>
        <span class="dim-out__value">${fx(r.size)} m</span></div>
      <div class="dim-out"><span class="dim-out__label">${esc(t('sz.r_class'))}</span>
        <span class="dim-out__value">${esc(r.c.id)} cm</span></div>
      <div class="dim-out"><span class="dim-out__label">${esc(t('sz.r_display'))}</span>
        <span class="dim-out__value">${fx(r.c.displayM)} m</span></div>
      <div class="dim-out"><span class="dim-out__label">${esc(t('sz.r_spacing'))}</span>
        <span class="dim-out__value">${fx(r.c.spacingM)} m</span></div>
      <div class="dim-out dim-out--wide"><span class="dim-out__label">${esc(t('sz.r_maths'))}</span>
        <span class="dim-out__value">${fx(r.c.displayM)} + (${r.n} − 1) × ${fx(r.c.spacingM)} = ${fx(r.size)} m${
          gaps > 0 ? ` · ${gaps} × ${esc(t('sz.r_gaps'))}` : ''}</span></div>
    </div>
    ${r.capped ? `<p class="note note--warn">${esc(t('sz.capped'))}</p>` : ''}`;
  }

  function previewHtml() {
    const r = calc();
    const cells = [];
    for (let i = 0; i < r.n; i++) cells.push('<i></i>');
    return `<div class="dim-preview" style="--cols:${r.n};--rows:1" aria-hidden="true">${cells.join('')}</div>
      <p class="tiny muted">${esc(t('sz.preview_cap', { n: r.n, size: fx(r.size) }))}</p>`;
  }

  /* ---------- the model table -------------------------------------------- */
  function modelRows() {
    const T0 = T();
    return T0.models.map(m => {
      const c = m.class ? cls(m.class) : null;
      return `<tr>
        <td class="cat-table__key">${esc(m.id)}${
          m.outdoor ? ` <span class="pill pill--info">${esc(t('sz.outdoor'))}</span>` : ''}</td>
        <td>${c ? `<strong>${esc(c.id)} cm</strong>` : `<span class="muted">${esc(t('sz.outside'))}</span>`}</td>
        <td class="num">${c ? fx(c.displayM) + ' m' : '—'}</td>
        <td class="num">${c ? fx(c.spacingM) + ' m' : '—'}</td>
        <td class="tiny muted">${esc(m.class ? t('sz.model_' + m.id) : t('sz.model_A300'))}</td>
      </tr>`;
    }).join('');
  }

  /* ---------- the printed table ------------------------------------------ */
  function tableRows() {
    const T0 = T();
    return T0.rows().map(r => `<tr>
      <td class="num">${r.units}</td>
      ${T0.classes.map(c => `<td class="num">${fx(r.sizes[c.id])}</td>`).join('')}
    </tr>`).join('');
  }

  function render() {
    const host = q('calcBody');
    const T0 = T();
    if (!host || !T0) return;

    host.innerHTML = `
      <div class="page-head">
        <span class="eyebrow">${esc(t('sz.eyebrow'))}</span>
        <h1>${esc(t('sz.title'))}</h1>
        <p class="lede">${esc(t('sz.lede'))}</p>
        <p class="tiny muted">${esc(t('sz.source_line', { doc: T0.source }))}</p>
      </div>

      <section class="grid grid--4 mega-stats">
        <div class="stat"><span class="stat__value">${T0.classes.length}</span><span class="stat__label">${esc(t('sz.stat_classes'))}</span></div>
        <div class="stat"><span class="stat__value">${T0.models.length}</span><span class="stat__label">${esc(t('sz.stat_models'))}</span></div>
        <div class="stat"><span class="stat__value">${T0.maxUnits}</span><span class="stat__label">${esc(t('sz.stat_units'))}</span></div>
        <div class="stat"><span class="stat__value">${fx(T0.sizeFor(T0.maxUnits, '100'))} m</span><span class="stat__label">${esc(t('sz.stat_max'))}</span></div>
      </section>

      <section class="section--tight" id="models">
        <div class="section-head">
          <h2>${esc(t('sz.models'))}</h2>
          <p>${esc(t('sz.models_lede'))}</p>
        </div>
        <div class="table-wrap"><table class="data pl-table">
          <thead><tr>
            <th>${esc(t('sz.col_model'))}</th>
            <th>${esc(t('sz.col_class'))}</th>
            <th class="num">${esc(t('sz.col_display'))}</th>
            <th class="num">${esc(t('sz.col_spacing'))}</th>
            <th>${esc(t('sz.col_note'))}</th>
          </tr></thead>
          <tbody>${modelRows()}</tbody>
        </table></div>
      </section>

      <section class="card dim-panel" id="calculator">
        <div class="dim-controls">
          <div class="form-row">
            <label for="szMode">${esc(t('sz.mode'))}</label>
            <select id="szMode">
              <option value="units"${state.mode === 'units' ? ' selected' : ''}>${esc(t('sz.mode_units'))}</option>
              <option value="width"${state.mode === 'width' ? ' selected' : ''}>${esc(t('sz.mode_width'))}</option>
            </select>
          </div>
          <div class="form-row">
            <label for="szClass">${esc(t('sz.class'))}</label>
            <select id="szClass">
              ${T0.classes.map(c => `<option value="${esc(c.id)}"${state.classId === c.id ? ' selected' : ''}>${esc(c.id)} cm · ${fx(c.displayM)} m · ${fx(c.spacingM)} m</option>`).join('')}
            </select>
          </div>
          <div class="form-row"${state.mode !== 'units' ? ' hidden' : ''} id="szUnitsRow">
            <label for="szUnits">${esc(t('sz.input_units'))}</label>
            <input type="number" id="szUnits" min="1" max="${T0.maxUnits}" step="1" value="${state.units}">
          </div>
          <div class="form-row"${state.mode !== 'width' ? ' hidden' : ''} id="szWidthRow">
            <label for="szWidth">${esc(t('sz.input_width'))}</label>
            <input type="number" id="szWidth" min="0.5" max="40" step="0.1" value="${state.width}">
          </div>
          <div class="row row--wrap">
            <button class="btn btn--ghost btn--sm" type="button" id="szCopy">${esc(t('sz.copy'))}</button>
            <a class="btn btn--primary btn--sm" href="contact.html?interest=hologram_buy">${esc(t('sz.ask'))}</a>
          </div>
        </div>

        <div class="dim-result">
          <h2 class="card__title">${esc(t('sz.result'))}</h2>
          <div id="szOut">${resultHtml()}</div>
          <div id="szPreview">${previewHtml()}</div>
        </div>
      </section>

      <section class="section--tight" id="table">
        <div class="section-head">
          <h2>${esc(t('sz.table'))}</h2>
          <p>${esc(t('sz.table_lede'))}</p>
        </div>
        <div class="table-wrap"><table class="data data--compact pl-table">
          <thead><tr>
            <th class="num">${esc(t('sz.col_qty'))}</th>
            ${T0.classes.map(c => `<th class="num">${esc(c.id)} cm · ${fx(c.displayM)} m</th>`).join('')}
          </tr></thead>
          <tbody>${tableRows()}</tbody>
        </table></div>
        <p class="tiny muted">${esc(t('sz.table_note', { max: T0.maxUnits }))}</p>
      </section>

      <section class="section--tight">
        <div class="card">
          <h3>${esc(t('sz.how'))}</h3>
          <ul class="kpi-list">
            <li><span>${esc(t('sz.how_1'))}</span><b>${fx(0.65)} + (9 − 1) × ${fx(0.464)} = 4.362 m</b></li>
            <li><span>${esc(t('sz.how_2'))}</span><b>${esc(t('sz.how_2_v'))}</b></li>
            <li><span>${esc(t('sz.how_3'))}</span><b>${esc(t('sz.how_3_v'))}</b></li>
          </ul>
        </div>
        <div class="card card--warn" id="larger">
          <h3>${esc(t('sz.larger'))}</h3>
          <p>${esc(t('sz.larger_body'))}</p>
          <div class="row row--wrap">
            <a class="btn btn--primary btn--sm" href="contact.html?interest=hologram_buy">${esc(t('sz.larger_cta'))}</a>
            <a class="btn btn--ghost btn--sm" href="dimension.html">${esc(t('nav.dimension'))}</a>
            <a class="btn btn--quiet btn--sm" href="price-list.html">${esc(t('nav.price_list'))}</a>
          </div>
        </div>
      </section>`;
    bind();
  }

  function update() {
    const out = q('szOut');
    if (out) out.innerHTML = resultHtml();
    const prev = q('szPreview');
    if (prev) prev.innerHTML = previewHtml();
  }

  function bind() {
    const mode = q('szMode');
    if (mode && !mode.dataset.bound) {
      mode.dataset.bound = '1';
      mode.addEventListener('change', () => { state.mode = mode.value; render(); });
    }
    const klass = q('szClass');
    if (klass && !klass.dataset.bound) {
      klass.dataset.bound = '1';
      klass.addEventListener('change', () => { state.classId = klass.value; update(); });
    }
    [['szUnits', 'units'], ['szWidth', 'width']].forEach(([id, key]) => {
      const el = q(id);
      if (!el || el.dataset.bound) return;
      el.dataset.bound = '1';
      el.addEventListener('input', () => {
        const v = parseFloat(el.value);
        if (isFinite(v) && v > 0) { state[key] = v; update(); }
      });
    });
    const copy = q('szCopy');
    if (copy && !copy.dataset.bound) {
      copy.dataset.bound = '1';
      copy.addEventListener('click', () => {
        const r = calc();
        A().copyText([
          t('sz.title'),
          t('sz.r_class') + ': ' + r.c.id + ' cm',
          t('sz.r_display') + ': ' + fx(r.c.displayM) + ' m',
          t('sz.r_spacing') + ': ' + fx(r.c.spacingM) + ' m',
          t('sz.r_units') + ': ' + r.n,
          t('sz.r_size') + ': ' + fx(r.size) + ' m',
          fx(r.c.displayM) + ' + (' + r.n + ' − 1) × ' + fx(r.c.spacingM) + ' = ' + fx(r.size) + ' m'
        ].join('\n'));
      });
    }
  }

  document.addEventListener('DOMContentLoaded', render);
  A().onLangChange(render);
  window.LG = window.LG || {};
  window.LG.sizeCalc = { render, calc, state, sizeFor: (n, c) => window.LG_SIZE_TABLE.sizeFor(n, c) };
})();
