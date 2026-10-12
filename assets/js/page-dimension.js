/* ============================================================================
 * 3dNakedEye — page-dimension.js
 * The dimension calculator. Two ways in, the same numbers out:
 *   • I know the size  → columns × rows from the spacing, units, coverage
 *   • I know the units → the squarest layout that fits them
 *
 * The spacing and image sizes come from the manufacturer's calculation table
 * (LG_DIMENSIONS in catalog-data.js). Everything else is arithmetic on those
 * two figures, and the page shows the arithmetic so the result can be checked.
 * ==========================================================================*/
(function () {
  'use strict';

  const A = () => window.LG.app;
  const t = (k, v) => A().t(k, v);
  const esc = s => A().esc(s == null ? '' : s);
  const q = id => document.getElementById(id);

  const dims = () => window.LG_DIMENSIONS || [];
  const rowFor = id => dims().find(d => d.id === id) || dims()[1];
  const modelDims = window.LG_MODEL_DIMS || {};

  /* every model that has a dimension class, grouped for the picker */
  const modelList = () => (window.LG_SERIES || []).flatMap(s =>
    s.cols.filter(c => modelDims[c]).map(c => ({ model: c, series: s.id, dim: modelDims[c] })));

  const state = { mode: 'size', dim: '65', w: 3, h: 2, units: 9, layout: 'auto' };

  /* ---------- the calculation --------------------------------------------- */
  function calculate() {
    const d = rowFor(state.dim);
    const px = d.px === '—' ? 1280 : parseInt(String(d.px).split('×')[0], 10);
    const watts = d.watts === '—' ? 48 : parseInt(d.watts, 10);
    let cols, rows, units;
    if (state.mode === 'size') {
      cols = Math.max(1, Math.ceil(state.w / d.spacingM));
      rows = Math.max(1, Math.ceil(state.h / d.spacingM));
      units = cols * rows;
    } else {
      units = Math.max(1, Math.round(state.units));
      cols = Math.max(1, Math.round(Math.sqrt(units)));
      rows = Math.max(1, Math.ceil(units / cols));
      units = cols * rows;
    }
    const coverW = cols * d.spacingM;
    const coverH = rows * d.spacingM;
    /* software fusion keeps the module, so the fused image is the per-unit
       resolution multiplied by the grid — which is what the catalogue quotes
       for a 2×3 (4608) and a 3×3 (6912) build. */
    const fused = { w: cols * px, h: rows * px };
    const power = units * watts;
    const headroom = power * 1.2;
    /* comfortable viewing distance follows the usual rule of thumb for these
       displays: 1.5–3× the display size for the close work, beyond that for
       the impression. Reported as a range, not a promise. */
    const near = d.displayM * 1.5, far = d.displayM * 3;
    return {
      d, cols, rows, units, coverW, coverH, fused, power, headroom, near, far,
      clip: { w: cols * px, h: rows * px }
    };
  }

  const fx = n => (Math.round(n * 100) / 100).toFixed(2).replace(/\.00$/, '');
  const f1 = n => (Math.round(n * 10) / 10).toFixed(1);
  /* pixels are whole numbers here — do not print 8960.0 */
  const fpx = n => (Number.isInteger(n) ? String(n) : f1(n));

  function resultsHtml() {
    const r = calculate();
    const big = r.units > 30;
    return `<div class="dim-grid">
      <div class="dim-out"><span class="dim-out__label">${esc(t('dim.r_cols'))}</span><span class="dim-out__value">${r.cols}</span></div>
      <div class="dim-out"><span class="dim-out__label">${esc(t('dim.r_rows'))}</span><span class="dim-out__value">${r.rows}</span></div>
      <div class="dim-out dim-out--hero"><span class="dim-out__label">${esc(t('dim.r_units'))}</span><span class="dim-out__value">${r.units}</span></div>
      <div class="dim-out"><span class="dim-out__label">${esc(t('dim.r_cover'))}</span><span class="dim-out__value">${fx(r.coverW)} × ${fx(r.coverH)} m</span></div>
      <div class="dim-out"><span class="dim-out__label">${esc(t('dim.r_spacing'))}</span><span class="dim-out__value">${fx(r.d.spacingM)} m</span></div>
      <div class="dim-out"><span class="dim-out__label">${esc(t('dim.r_size'))}</span><span class="dim-out__value">${fx(r.d.displayM)} m</span></div>
      <div class="dim-out"><span class="dim-out__label">${esc(t('dim.r_res'))}</span><span class="dim-out__value">${fpx(r.fused.w)} × ${fpx(r.fused.h)} px</span></div>
      <div class="dim-out"><span class="dim-out__label">${esc(t('dim.r_power'))}</span><span class="dim-out__value">${r.power} W <span class="tiny muted">(+20% = ${Math.round(r.headroom)} W)</span></span></div>
      <div class="dim-out"><span class="dim-out__label">${esc(t('dim.r_view'))}</span><span class="dim-out__value">${fx(r.near)} – ${fx(r.far)} m</span></div>
      <div class="dim-out dim-out--wide"><span class="dim-out__label">${esc(t('dim.r_content'))}</span>
        <span class="dim-out__value">${r.clip.w} × ${r.clip.h} px · 1:1 per unit · black background · 10–30 s</span></div>
    </div>
    ${big ? `<p class="note note--warn">${esc(t('dim.big'))}</p>` : ''}`;
  }

  /* visual grid preview: what the buyer is actually ordering */
  function previewHtml() {
    const r = calculate();
    const cells = [];
    for (let y = 0; y < r.rows; y++) for (let x = 0; x < r.cols; x++) cells.push(`<i style="--x:${x};--y:${y}"></i>`);
    return `<div class="dim-preview" style="--cols:${r.cols};--rows:${r.rows}" aria-hidden="true">${cells.join('')}</div>`;
  }

  function tableHtml() {
    return `<div class="table-wrap"><table class="data">
      <thead><tr><th>${esc(t('dim.col_model'))}</th><th>${esc(t('dim.col_display'))}</th>
        <th>${esc(t('dim.col_spacing'))}</th><th>${esc(t('cat.row_res'))}</th><th>${esc(t('cat.row_watt'))}</th></tr></thead>
      <tbody>${dims().map(d => `<tr>
        <td class="cat-table__key">${esc(d.label)}</td>
        <td>${fx(d.displayM)} m</td>
        <td><strong>${fx(d.spacingM)} m</strong></td>
        <td>${esc(d.px)}</td>
        <td>${esc(d.watts)}</td></tr>`).join('')}</tbody>
    </table></div>`;
  }

  function render() {
    const host = q('dimBody');
    if (!host) return;
    const models = modelList();
    /* the picker and the numbers must agree: if nothing has been chosen yet,
       start on the model that matches the current dimension class (65 cm). */
    if (models.length && !state.model) {
      const pref = models.find(m => m.dim === state.dim) || models[0];
      state.model = pref.model;
      state.dim = pref.dim;
    }
    host.innerHTML = `
      <div class="page-head">
        <span class="eyebrow">${esc(t('dim.eyebrow'))}</span>
        <h1>${esc(t('dim.title'))}</h1>
        <p class="lede">${esc(t('dim.lede'))}</p>
      </div>

      <section class="card dim-panel">
        <div class="dim-controls">
          <div class="form-row">
            <label for="dimMode">${esc(t('dim.mode'))}</label>
            <select id="dimMode">
              <option value="size"${state.mode === 'size' ? ' selected' : ''}>${esc(t('dim.mode_size'))}</option>
              <option value="units"${state.mode === 'units' ? ' selected' : ''}>${esc(t('dim.mode_units'))}</option>
            </select>
          </div>
          <div class="form-row">
            <label for="dimModel">${esc(t('dim.model'))}</label>
            <select id="dimModel">
              ${models.map(m => `<option value="${esc(m.model)}" data-dim="${esc(m.dim)}"${modelDims[state.model] === m.dim && state.model === m.model ? ' selected' : ''}>${esc(m.model)} · ${esc(rowFor(m.dim).label)}</option>`).join('')}
            </select>
          </div>
          <div class="dim-size-inputs"${state.mode !== 'size' ? ' hidden' : ''}>
            <div class="form-row">
              <label for="dimW">${esc(t('dim.wall_w'))}</label>
              <input type="number" id="dimW" min="0.5" max="40" step="0.1" value="${state.w}">
            </div>
            <div class="form-row">
              <label for="dimH">${esc(t('dim.wall_h'))}</label>
              <input type="number" id="dimH" min="0.5" max="20" step="0.1" value="${state.h}">
            </div>
          </div>
          <div class="form-row dim-units-input"${state.mode !== 'units' ? ' hidden' : ''}>
            <label for="dimUnits">${esc(t('dim.units'))}</label>
            <input type="number" id="dimUnits" min="1" max="200" step="1" value="${state.units}">
          </div>
          <div class="row row--wrap">
            <button class="btn btn--ghost btn--sm" type="button" id="dimCopy">${esc(t('dim.copy'))}</button>
            <a class="btn btn--primary btn--sm" id="dimAsk" href="contact.html?interest=event">${esc(t('dim.ask'))}</a>
          </div>
        </div>

        <div class="dim-result">
          <h2 class="card__title">${esc(t('dim.results'))}</h2>
          <div id="dimOut">${resultsHtml()}</div>
          <div id="dimPreview">${previewHtml()}</div>
        </div>
      </section>

      <section class="section--tight" id="spacing">
        <div class="section-head">
          <h2>${esc(t('dim.spacing_table'))}</h2>
          <p>${esc(t('dim.spacing_lede'))}</p>
        </div>
        ${tableHtml()}
        <p class="tiny muted">${esc(t('dim.note'))}</p>
      </section>

      <section class="grid grid--2 section--tight">
        <div class="card">
          <h3>${esc(t('dim.formula'))}</h3>
          <ul class="kpi-list">
            <li><span>${esc(t('dim.f1'))}</span></li>
            <li><span>${esc(t('dim.f2'))}</span></li>
            <li><span>${esc(t('dim.f3'))}</span></li>
            <li><span>${esc(t('dim.f4'))}</span></li>
          </ul>
        </div>
        <div class="card">
          <h3>${esc(t('cloud.what'))}</h3>
          <ul class="kpi-list">
            <li><span>${esc(t('cloud.what_1'))}</span></li>
            <li><span>${esc(t('cloud.what_2'))}</span></li>
          </ul>
          <a class="btn btn--quiet btn--sm" href="cloud.html">${esc(t('nav.cloud'))}</a>
        </div>
      </section>`;
    bind();
  }

  function update() {
    const out = q('dimOut');
    if (out) out.innerHTML = resultsHtml();
    const prev = q('dimPreview');
    if (prev) prev.innerHTML = previewHtml();
  }

  function bind() {
    const mode = q('dimMode');
    if (mode && !mode.dataset.bound) {
      mode.dataset.bound = '1';
      mode.addEventListener('change', () => {
        state.mode = mode.value;
        render();
      });
    }
    const model = q('dimModel');
    if (model && !model.dataset.bound) {
      model.dataset.bound = '1';
      model.addEventListener('change', () => {
        const opt = model.options[model.selectedIndex];
        state.model = model.value;
        state.dim = opt.getAttribute('data-dim');
        update();
      });
    }
    [['dimW', 'w'], ['dimH', 'h'], ['dimUnits', 'units']].forEach(([id, key]) => {
      const el = q(id);
      if (!el || el.dataset.bound) return;
      el.dataset.bound = '1';
      el.addEventListener('input', () => {
        const v = parseFloat(el.value);
        if (isFinite(v) && v > 0) { state[key] = v; update(); }
      });
    });
    const copy = q('dimCopy');
    if (copy && !copy.dataset.bound) {
      copy.dataset.bound = '1';
      copy.addEventListener('click', () => {
        const r = calculate();
        A().copyText([
          t('dim.results'),
          t('dim.r_cols') + ': ' + r.cols,
          t('dim.r_rows') + ': ' + r.rows,
          t('dim.r_units') + ': ' + r.units,
          t('dim.r_cover') + ': ' + fx(r.coverW) + ' × ' + fx(r.coverH) + ' m',
          t('dim.r_spacing') + ': ' + fx(r.d.spacingM) + ' m',
          t('dim.r_res') + ': ' + r.fused.w + ' × ' + r.fused.h + ' px',
          t('dim.r_power') + ': ' + r.power + ' W (' + Math.round(r.headroom) + ' W with headroom)',
          t('dim.r_view') + ': ' + fx(r.near) + ' – ' + fx(r.far) + ' m'
        ].join('\n'));
      });
    }
  }

  document.addEventListener('DOMContentLoaded', render);
  A().onLangChange(render);
  window.LG = window.LG || {};
  window.LG.dimension = { render, calculate, state };
})();
