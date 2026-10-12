/* ============================================================================
 * 3dNakedEye — page-affiliate.js
 * The affiliate share-link page's working part: build a tracked link, simulate
 * the click that drops the "cookie", then simulate an order inside — or after —
 * the cookie window and watch the attribution and the commission.
 *
 * The tracking itself lives in LG.store.share, so the same click record is what
 * every other page of the demo could read; this module only drives the panel.
 * ==========================================================================*/
(function () {
  'use strict';

  const A = () => window.LG.app;
  const t = (k, v) => A().t(k, v);
  const esc = s => A().esc(s == null ? '' : s);
  const q = id => document.getElementById(id);
  const S = () => window.LG.store.share;
  const D = () => window.LG_SHARE || { destinations: [], models: [], windows: [30] };

  const state = { dest: 'marketplace.html', code: '', cid: '', model: 'pct8', window: 30, amount: 4800, earn: {} };
  (window.LG_SHARE ? window.LG_SHARE.earnEvents : []).forEach(e => { state.earn[e.id] = e.on; });

  const money = n => A().money(n, { maximumFractionDigits: 0 });
  const when = ts => {
    try { return new Date(ts).toLocaleString(A().locale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
    catch (e) { return new Date(ts).toISOString().slice(0, 16).replace('T', ' '); }
  };
  const model = () => D().models.find(m => m.id === state.model) || D().models[0];
  const left = ms => {
    const days = Math.floor(ms / 86400000), hours = Math.floor((ms % 86400000) / 3600000);
    return days > 0 ? t('af.left_days', { days: days, hours: hours }) : t('af.left_hours', { hours: hours });
  };

  /* ---------- the panels --------------------------------------------------- */
  function builderHtml() {
    const code = state.code || S().makeCode('3dne');
    const cid = state.cid || S().makeCode(code + state.dest);
    const link = S().link(state.dest, code, cid, 'social');
    return `<div class="af-grid">
      <div class="af-form">
        <div class="form-row">
          <label for="afDest">${esc(t('af.dest'))}</label>
          <select id="afDest">${D().destinations.map(d =>
            `<option value="${esc(d.page)}"${state.dest === d.page ? ' selected' : ''}>${esc(t(d.i18n))}</option>`).join('')}</select>
        </div>
        <div class="form-row">
          <label for="afCode">${esc(t('af.code'))}</label>
          <input type="text" id="afCode" value="${esc(code)}" maxlength="16" spellcheck="false">
        </div>
        <div class="form-row">
          <label for="afWindow">${esc(t('af.window'))}</label>
          <select id="afWindow">${D().windows.map(w =>
            `<option value="${w}"${state.window === w ? ' selected' : ''}>${esc(t('af.days', { n: w }))}</option>`).join('')}</select>
        </div>
        <div class="row row--wrap">
          <button class="btn btn--ghost btn--sm" type="button" id="afNew">${esc(t('af.new_code'))}</button>
          <button class="btn btn--primary btn--sm" type="button" id="afCopy">${esc(t('af.copy'))}</button>
        </div>
      </div>
      <div class="af-out">
        <span class="dim-out__label">${esc(t('af.your_link'))}</span>
        <code class="af-link" id="afLink">${esc(link)}</code>
        <p class="tiny muted">${esc(t('af.link_note', { cid: cid }))}</p>
        <div class="row row--wrap">
          <button class="btn btn--ghost btn--sm" type="button" id="afSimClick">${esc(t('af.sim_click'))}</button>
          <button class="btn btn--quiet btn--sm" type="button" id="afClear">${esc(t('af.clear'))}</button>
        </div>
        ${shareHtml(link)}
      </div>
    </div>`;
  }

  function attributionHtml() {
    const click = S().current();
    const m = model();
    const order = state.earn.order ? S().attribute(state.amount, m) : { attributed: false };
    const expired = S().log().length && !click;
    return `<div class="af-grid">
      <div class="af-form">
        <div class="form-row">
          <label for="afAmount">${esc(t('af.amount'))}</label>
          <input type="number" id="afAmount" min="0" step="100" value="${state.amount}">
        </div>
        <div class="form-row">
          <label for="afModel">${esc(t('af.model'))}</label>
          <select id="afModel">${D().models.map(x =>
            `<option value="${esc(x.id)}"${state.model === x.id ? ' selected' : ''}>${esc(t(x.i18n))}</option>`).join('')}</select>
        </div>
        <fieldset class="af-earn">
          <legend>${esc(t('af.earn_legend'))}</legend>
          ${(window.LG_SHARE ? window.LG_SHARE.earnEvents : []).map(e => `
            <label class="check"><input type="checkbox" data-earn="${esc(e.id)}"${state.earn[e.id] ? ' checked' : ''}>
              <span>${esc(t(e.i18n))}</span></label>`).join('')}
        </fieldset>
      </div>
      <div class="af-out">
        ${click ? `
          <p class="af-verdict af-verdict--ok">${esc(t('af.attributed', { ref: click.ref }))}</p>
          <ul class="kpi-list">
            <li><span>${esc(t('af.partner'))}</span><b>${esc(click.ref)}</b></li>
            <li><span>${esc(t('af.cid'))}</span><b class="mono">${esc(click.cid)}</b></li>
            <li><span>${esc(t('af.clicked'))}</span><b>${esc(when(click.at))}</b></li>
            <li><span>${esc(t('af.expires'))}</span><b>${esc(when(click.expires))}</b></li>
            <li><span>${esc(t('af.remaining'))}</span><b>${esc(left(click.expires - Date.now()))}</b></li>
            <li><span>${esc(t('af.order'))}</span><b>${esc(money(state.amount))}</b></li>
            <li><span>${esc(t('af.commission'))}</span><b>${order.attributed && state.earn.order ? esc(money(order.commission)) : '—'}</b></li>
          </ul>
          ${order.attributed && state.earn.order ? `<p class="tiny muted">${esc(t('af.commission_note', {
            rate: m.kind === 'pct' ? Math.round(m.value * 100) + '%' : money(m.value),
            window: click.windowDays }))}</p>`
            : `<p class="note note--warn">${esc(t('af.order_off'))}</p>`}`
        : `
          <p class="af-verdict af-verdict--no">${esc(t('af.not_attributed'))}</p>
          <p class="tiny muted">${esc(expired ? t('af.expired_note') : t('af.no_click_note'))}</p>`}
        <div class="row row--wrap">
          <button class="btn btn--ghost btn--sm" type="button" id="afSimOrder">${esc(t('af.sim_order'))}</button>
          <button class="btn btn--quiet btn--sm" type="button" id="afExpire">${esc(t('af.sim_expire'))}</button>
        </div>
      </div>
    </div>`;
  }

  function logHtml() {
    const log = S().log();
    if (!log.length) return `<p class="tiny muted">${esc(t('af.log_empty'))}</p>`;
    return `<div class="table-wrap"><table class="data data--compact">
      <thead><tr>
        <th>${esc(t('af.partner'))}</th><th>${esc(t('af.cid'))}</th>
        <th>${esc(t('af.page'))}</th><th class="num">${esc(t('af.clicked'))}</th>
        <th class="num">${esc(t('af.expires'))}</th>
      </tr></thead>
      <tbody>${log.map(x => `<tr>
        <td class="cat-table__key">${esc(x.ref)}</td>
        <td class="mono tiny">${esc(x.cid)}</td>
        <td class="tiny">${esc(x.page)}</td>
        <td class="num tiny">${esc(when(x.at))}</td>
        <td class="num tiny">${esc(when(x.expires))}</td>
      </tr>`).join('')}</tbody></table></div>`;
  }

  /* ---------- render + bind ------------------------------------------------ */
  function paint() {
    const link = q('afLink');
    if (link) link.textContent = S().link(state.dest, state.code || S().makeCode('3dne'), state.cid || '', 'social');
    const attr = q('afAttr');
    if (attr) attr.innerHTML = attributionHtml();
    const log = q('afLog');
    if (log) log.innerHTML = logHtml();
    bind();
  }

  function render() {
    const host = document.querySelector('[data-visual="affiliate"]');
    if (!host) return;
    const F = window.LG_SHARE;
    const dest = (F.destinations.find(d => d.page === state.dest) || F.destinations[0]).page;
    state.dest = dest;
    state.code = state.code || S().makeCode('3dne');
    host.innerHTML = `
      <div class="af-panel" id="afBuilder">${builderHtml()}</div>
      <div class="af-panel" id="afAttr">${attributionHtml()}</div>
      <div class="af-panel af-panel--log">
        <div class="section-head"><h3>${esc(t('af.log'))}</h3>
          <p class="tiny muted">${esc(t('af.log_note'))}</p></div>
        <div id="afLog">${logHtml()}</div>
      </div>`;
    bind();
  }

  function bind() {
    const on = (id, ev, fn) => {
      const el = q(id);
      if (el && !el.dataset.bound) { el.dataset.bound = '1'; el.addEventListener(ev, fn); }
    };
    on('afDest', 'change', e => { state.dest = e.target.value; state.cid = ''; render(); });
    on('afWindow', 'change', e => { state.window = Number(e.target.value); S().WINDOW_DAYS = state.window; paint(); });
    on('afCode', 'input', e => { state.code = e.target.value.toUpperCase(); state.cid = ''; paint(); });
    on('afNew', 'click', () => { state.code = S().makeCode(Math.random().toString(36).slice(2)); state.cid = ''; render(); });
    on('afCopy', 'click', () => A().copyText(q('afLink').textContent));
    on('afSimClick', 'click', () => {
      const cid = S().makeCode(state.code + state.dest + Date.now());
      state.cid = cid;
      S().WINDOW_DAYS = state.window;
      S().click(state.code, { cid: cid, page: state.dest, windowDays: state.window, channel: 'social' });
      paint();
    });
    on('afClear', 'click', () => { S().clear(); paint(); });
    on('afSimOrder', 'click', () => { paint(); });
    on('afExpire', 'click', () => {
      /* age the stored click past its window, which is what a visitor coming
       * back after the cookie window would look like */
      const st = window.LG.store.state;
      if (st && st.share) { st.share.expires = Date.now() - 1000; window.LG.store.save(); paint(); }
    });
    on('afAmount', 'input', e => {
      const v = parseFloat(e.target.value);
      if (isFinite(v) && v >= 0) { state.amount = v; paint(); }
    });
    on('afModel', 'change', e => { state.model = e.target.value; paint(); });
    document.querySelectorAll('[data-earn]').forEach(cb => {
      if (cb.dataset.bound) return;
      cb.dataset.bound = '1';
      cb.addEventListener('change', () => { state.earn[cb.getAttribute('data-earn')] = cb.checked; paint(); });
    });
  }

  /* ---------- share buttons ------------------------------------------------- */
  function shareHtml(link) {
    const text = t('af.share_note');
    const u = encodeURIComponent(link);
    const msg = encodeURIComponent(t('af.title') + ' — ' + link);
    const buttons = [
      ['WhatsApp', 'af.share_wa', 'https://wa.me/?text=' + msg],
      ['X', 'af.share_x', 'https://twitter.com/intent/tweet?text=' + msg],
      ['Facebook', 'af.share_fb', 'https://www.facebook.com/sharer/sharer.php?u=' + u],
      ['LinkedIn', 'af.share_li', 'https://www.linkedin.com/sharing/share-offsite/?url=' + u],
      ['Telegram', 'af.share_tg', 'https://t.me/share/url?url=' + u + '&text=' + encodeURIComponent(t('af.title'))],
      ['Email', 'af.share_mail', 'mailto:?subject=' + encodeURIComponent(t('af.title')) + '&body=' + msg]
    ];
    return `<div class="af-share">
      <span class="dim-out__label">${esc(t('af.share_row'))}</span>
      <div class="row row--wrap">${buttons.map(([id, key, href]) =>
        `<a class="btn btn--quiet btn--sm" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(t(key))}</a>`).join('')}</div>
      <p class="tiny muted">${esc(text)}</p>
    </div>`;
  }

  /* ---------- the live console (bundled server) ----------------------------- */
  const API = () => (window.LG_CONFIG && window.LG_CONFIG.server && window.LG_CONFIG.server.api) || '';
  const cons = { code: '', stats: null, online: null, error: '' };

  const api = async (method, route, body) => {
    const res = await fetch(API() + route, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || ('HTTP ' + res.status));
    return json;
  };

  function consoleHtml() {
    const online = cons.online;
    return `<div class="af-panel">
      ${online === null ? `<p class="tiny muted">${esc(t('af.cons_note'))}</p>` : online
        ? `<p class="af-verdict af-verdict--ok">${esc(t('af.api_on', { n: cons.schema || 1 }))}</p>`
        : `<p class="note note--warn">${esc(t('af.api_off'))} <code>${esc(t('af.api_cmd'))}</code>
             <button class="btn btn--ghost btn--sm" type="button" id="afRetry">${esc(t('af.api_retry'))}</button></p>`}
      <div class="af-grid">
        <div class="af-form">
          <div class="form-row">
            <label for="afName">${esc(t('af.reg_name'))}</label>
            <input type="text" id="afName" value="Harbour Creators" maxlength="60">
          </div>
          <div class="form-row">
            <label for="afEmail">${esc(t('af.reg_email'))}</label>
            <input type="email" id="afEmail" value="partner@example.com" maxlength="120" spellcheck="false">
          </div>
          <button class="btn btn--primary btn--sm" type="button" id="afRegister">${esc(t('af.reg_submit'))}</button>
          <div class="row row--wrap">
            <button class="btn btn--ghost btn--sm" type="button" id="afTestClick">${esc(t('af.cons_test_click'))}</button>
            <button class="btn btn--ghost btn--sm" type="button" id="afTestOrder">${esc(t('af.cons_test_order'))}</button>
          </div>
          <p class="tiny muted">${esc(t('af.cons_note'))}</p>
        </div>
        <div class="af-out">
          ${cons.code ? `<p class="af-verdict af-verdict--ok">${esc(t('af.reg_done', { code: cons.code }))}</p>` : ''}
          ${cons.error ? `<p class="note note--warn">${esc(t('af.reg_error', { error: cons.error }))}</p>` : ''}
          ${cons.stats ? `<h4>${esc(t('af.cons_stats'))}</h4>
            <ul class="kpi-list">
              <li><span>${esc(t('af.cons_clicks'))}</span><b>${cons.stats.clicks}</b></li>
              <li><span>${esc(t('af.cons_shares'))}</span><b>${cons.stats.shares}</b></li>
              <li><span>${esc(t('af.cons_flagged'))}</span><b>${cons.stats.flagged}</b></li>
              <li><span>${esc(t('af.cons_conv'))}</span><b>${cons.stats.conversions} (${cons.stats.attributed} ✓)</b></li>
              <li><span>${esc(t('af.cons_commission'))}</span><b>${esc(A().money(cons.stats.commission, { maximumFractionDigits: 0 }))}</b></li>
              <li><span>${esc(t('af.cons_epc'))}</span><b>${esc(A().money(cons.stats.epc, { maximumFractionDigits: 0 }))}</b></li>
              <li><span>${esc(t('af.cons_cr'))}</span><b>${cons.stats.conversionRate}%</b></li>
            </ul>` : `<p class="tiny muted">${esc(t('af.cons_none'))}</p>`}
          ${cons.link ? shareHtml(cons.link) : ''}
        </div>
      </div>
    </div>`;
  }

  function paintConsole() {
    const host = document.querySelector('[data-visual="affiliate-console"]');
    if (!host) return;
    host.innerHTML = consoleHtml();
    bindConsole();
  }

  async function refreshStats() {
    if (!cons.code) return;
    try {
      const r = await api('GET', '/api/affiliate/stats?code=' + encodeURIComponent(cons.code));
      cons.stats = r.stats;
      cons.error = '';
    } catch (e) { cons.error = e.message; }
    paintConsole();
  }

  function bindConsole() {
    const on = (id, fn) => {
      const el = q(id);
      if (el && !el.dataset.bound) { el.dataset.bound = '1'; el.addEventListener('click', fn); }
    };
    on('afRetry', async () => { cons.online = null; paintConsole(); await probe(); });
    on('afRegister', async () => {
      try {
        const name = q('afName').value, email = q('afEmail').value;
        const r = await api('POST', '/api/affiliate/register', { name, email, windowDays: state.window });
        cons.code = r.partner.code;
        cons.error = '';
        const l = await api('GET', '/api/affiliate/link?code=' + encodeURIComponent(cons.code) +
          '&dest=' + encodeURIComponent(state.dest) + '&channel=social');
        cons.link = l.url;
        await refreshStats();
      } catch (e) { cons.error = e.message; paintConsole(); }
    });
    on('afTestClick', async () => {
      if (!cons.code) { cons.error = 'register first'; paintConsole(); return; }
      try { await api('POST', '/api/affiliate/click', { ref: cons.code, dest: state.dest, channel: 'social' }); await refreshStats(); }
      catch (e) { cons.error = e.message; paintConsole(); }
    });
    on('afTestOrder', async () => {
      if (!cons.code) { cons.error = 'register first'; paintConsole(); return; }
      try {
        await api('POST', '/api/affiliate/convert', {
          ref: cons.code, orderRef: 'ORD-' + Date.now(), amount: state.amount, currency: 'HKD'
        });
        await refreshStats();
      } catch (e) { cons.error = e.message; paintConsole(); }
    });
  }

  async function probe() {
    try {
      const h = await api('GET', '/api/affiliate/health');
      cons.online = true; cons.schema = h.schema;
      if (cons.code) await refreshStats();
    } catch (e) { cons.online = false; }
    paintConsole();
  }

  document.addEventListener('DOMContentLoaded', () => {
    render();
    if (document.querySelector('[data-visual="affiliate-console"]')) probe();
  });
  A().onLangChange(() => { render(); paintConsole(); });
  window.LG = window.LG || {};
  window.LG.affiliate = {
    render, state, paint, probe,
    console: cons,
    api: (m, r, b) => api(m, r, b || undefined)
  };
})();
