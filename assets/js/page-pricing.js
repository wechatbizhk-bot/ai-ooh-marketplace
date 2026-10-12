/* 3dNakedEye — page-pricing.js : booking models, rate card, quote and split calculators */
(function () {
  'use strict';
  const S = window.LG.store, A = window.LG.app, CFG = window.LG_CONFIG;
  const q = id => document.getElementById(id);
  let split = Object.assign({}, S.state.split);

  const MODELS = [
    { id: 'daily', phase: 1, use: 'daily' },
    { id: 'weekly', phase: 1, use: 'weekly' },
    { id: 'slot', phase: 1, use: 'slot' },
    { id: 'package', phase: 1, use: 'package' },
    { id: 'sov', phase: 1, use: 'sov' },
    { id: 'cpm', phase: 2, use: 'cpm' },
    { id: 'cpqr', phase: 2, use: 'cpqr' },
    { id: 'cpcoupon', phase: 2, use: 'cpcoupon' },
    { id: 'sponsor', phase: 3, use: 'sponsor' }
  ];
  const EXTRA = ['e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8', 'e9'];
  const FAQ = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6'];

  const deviceDayRate = (loc, devIds) => Math.round(loc.devices
    .filter(d => !devIds || devIds.includes(d.id))
    .reduce((s, d) => s + window.LG_DEVICES[d.type].dailyRate, 0) * S.venue(loc.venue).mult);

  /* ---------- static blocks ---------------------------------------------- */
  function renderModels() {
    q('prModels').innerHTML = `<thead><tr>
        <th>${A.esc(A.t('pr.col_model'))}</th><th>${A.esc(A.t('pr.col_use'))}</th>
        <th>${A.esc(A.t('pr.col_phase'))}</th><th>${A.esc(A.t('pr.col_status'))}</th></tr></thead>
      <tbody>${MODELS.map(m => `<tr>
        <td><strong>${A.esc(A.t('pr.m_' + m.id))}</strong></td>
        <td class="small muted">${A.esc(A.t('pr.m_' + m.id + '_d'))}</td>
        <td><span class="chip">${A.esc(A.t('pr.phase', { n: m.phase }))}</span></td>
        <td>${m.phase === 1 ? A.statusPill('approved') : A.statusPill('pending')}</td>
      </tr>`).join('')}</tbody>`;
  }

  function renderRateCard() {
    q('prDevices').innerHTML = `<thead><tr>
        <th>${A.esc(A.t('pr.col_sku'))}</th><th>${A.esc(A.t('pr.col_form'))}</th>
        <th>${A.esc(A.t('pr.col_view'))}</th><th class="num">${A.esc(A.t('pr.col_dayrate'))}</th>
        <th class="num">${A.esc(A.t('pr.col_list'))}</th></tr></thead>
      <tbody>${Object.keys(window.LG_DEVICES).map(k => {
        const t = window.LG_DEVICES[k];
        return `<tr>
          <td><strong class="mono">${A.esc(t.sku)}</strong><div class="tiny muted">${A.esc(A.L(t.label))}</div></td>
          <td>${A.esc(t.form === 'hologram' ? A.t('legend.hologram') : A.t('legend.screen'))}</td>
          <td class="tiny">${A.esc(A.L(t.viewDistance))}</td>
          <td class="num">${A.money(t.dailyRate)}</td>
          <td class="num">${t.listPrice ? A.money(t.listPrice) : '—'}</td></tr>`;
      }).join('')}</tbody>`;
    q('prVenues').innerHTML = `<thead><tr>
        <th>${A.esc(A.t('mkt.venue'))}</th><th class="num">${A.esc(A.t('pr.col_mult'))}</th>
        <th class="num">${A.esc(A.t('pr.col_example'))}</th></tr></thead>
      <tbody>${window.LG_VENUES.map(v => `<tr>
        <td>${A.esc(A.L(v.label))}</td><td class="num">×${v.mult.toFixed(2)}</td>
        <td class="num">${A.money(Math.round(520 * v.mult))}</td></tr>`).join('')}</tbody>
      <caption class="tiny muted" style="caption-side:bottom;text-align:left;padding:10px">${A.esc(A.t('pr.venue_note'))}</caption>`;
  }

  /* ---------- quote calculator ------------------------------------------- */
  function populateQuote() {
    const live = S.liveLocations();
    q('pqLoc').innerHTML = live.map(l => `<option value="${l.id}">${A.esc(A.L(l.name))}</option>`).join('');
    const first = live[0];
    if (first) q('pqDevices').max = String(first.devices.length);
  }

  function renderQuote() {
    const loc = S.location(q('pqLoc').value) || S.liveLocations()[0];
    if (!loc) return;
    q('pqDevices').max = String(loc.devices.length);
    const days = parseInt(q('pqDays').value, 10);
    const sov = parseInt(q('pqSov').value, 10);
    const nDev = Math.min(parseInt(q('pqDevices').value, 10), loc.devices.length);
    const devIds = loc.devices.slice(0, nDev).map(d => d.id);
    q('pqDaysOut').textContent = days;
    q('pqDevicesOut').textContent = nDev + ' / ' + loc.devices.length;

    const line = S.lineQuote({ locationId: loc.id, days, sov, deviceIds: devIds });
    const aiSel = q('pqAi').value;
    const ai = aiSel === 'holo' ? { enabled: true, languages: 2, hologram: true }
      : aiSel === '2lang' ? { enabled: true, languages: 2, hologram: false }
      : { enabled: false };
    const quote = S.quote([{ locationId: loc.id, days, sov, deviceIds: devIds }], ai);
    const cpm = quote.estImpressionsPerDay * days > 0
      ? (quote.total / (quote.estImpressionsPerDay * days)) * 1000 : 0;

    q('pqOut').innerHTML = `
      <span class="label">${A.esc(A.t('pr.q_result'))}</span>
      <h3 style="margin:6px 0 4px">${A.esc(A.L(loc.name))}</h3>
      <p class="small muted" style="margin:0 0 14px">${A.esc(A.t('pr.q_line', {
        n: nDev, devs: loc.devices.length, days, sov }))}</p>
      <div class="row row--between" style="align-items:flex-end">
        <span class="label">${A.esc(A.t('co.total_due'))}</span>
        <strong class="quote-total">${A.money(quote.total)}</strong>
      </div>
      <ul class="kpi-list" style="margin-top:14px">
        <li><span>${A.esc(A.t('loc.q_rate'))}</span><b>${A.money(line.ratePerDay)}</b></li>
        <li><span>${A.esc(A.t('loc.q_discount'))}</span><b>${line.dayDiscount ? '−' + A.pct(line.dayDiscount, 0) : '—'}</b></li>
        <li><span>${A.esc(A.t('co.media'))}</span><b>${A.money(quote.media)}</b></li>
        <li><span>${A.esc(A.t('co.ai_fee'))}</span><b>${quote.aiFee ? A.money(quote.aiFee) : '—'}</b></li>
        <li><span>${A.esc(A.t('co.processing'))}</span><b>${A.money(quote.processing)}</b></li>
        <li><span>${A.esc(A.t('pr.q_plays'))}</span><b>${A.num(quote.playsPerDay * days)}</b></li>
        <li><span>${A.esc(A.t('pr.q_imp'))}</span><b>${A.num(quote.estImpressionsPerDay * days)}</b></li>
        <li><span>${A.esc(A.t('pr.q_cpm'))}</span><b>${A.money(cpm, { maximumFractionDigits: 2 })}</b></li>
        <li><span>${A.esc(A.t('ll.your_share'))} — ${A.esc(A.t('share.landlord'))}</span>
          <b>${A.money(quote.shares.landlord)}</b></li>
      </ul>
      <div class="row" style="margin-top:14px">
        <button class="btn btn--primary btn--sm" type="button" id="pqAdd" data-i18n="pr.q_add">Add to booking</button>
        <a class="btn btn--ghost btn--sm" href="location.html?id=${encodeURIComponent(loc.id)}" data-i18n="cta.details">Details</a>
      </div>`;
    q('pqAdd').addEventListener('click', () => {
      S.addToCart({ locationId: loc.id, days, sov, deviceIds: devIds });
      A.toast(A.t('toast.added_cart', { name: A.L(loc.name) }), 'ok');
    });
  }

  /* ---------- revenue split ---------------------------------------------- */
  function renderSliders() {
    q('prSliders').innerHTML = ['landlord', 'platform', 'ai', 'sales'].map(k => `
      <div class="range-row" style="margin-bottom:14px">
        <label for="ps_${k}">${A.esc(A.t('share.' + k))} — <span data-out="${k}">${Math.round(split[k] * 100)}%</span></label>
        <input type="range" id="ps_${k}" min="0" max="60" step="1" value="${Math.round(split[k] * 100)}">
      </div>`).join('') +
      `<div class="split-bars" id="prSplitBars">
        ${['landlord', 'platform', 'ai', 'sales'].map((k, i) => `<span style="width:${split[k] * 100}%;background:${['#7a6bff', '#35d0ff', '#ff5fa2', '#34d399'][i]}"></span>`).join('')}
      </div>`;

    ['landlord', 'platform', 'ai', 'sales'].forEach(k => {
      q('ps_' + k).addEventListener('input', e => {
        split[k] = parseInt(e.target.value, 10) / 100;
        q('[data-out="' + k + '"]').textContent = Math.round(split[k] * 100) + '%';
        updateSplitViews();
      });
    });
    updateSplitViews();
  }

  function updateSplitViews() {
    const total = Math.round((split.landlord + split.platform + split.ai + split.sales) * 100);
    q('prSplitTotal').textContent = A.t('op.split_total') + ': ' + total + '%';
    q('prSplitTotal').className = 'pill ' + (total === 100 ? 'pill--ok' : 'pill--bad');
    q('prSaveSplit').disabled = total !== 100;
    q('prSplitBars').innerHTML = ['landlord', 'platform', 'ai', 'sales']
      .map((k, i) => `<span style="width:${split[k] * 100}%;background:${['#7a6bff', '#35d0ff', '#ff5fa2', '#34d399'][i]}"></span>`).join('');

    const sample = 10000;
    const segs = [
      { label: A.t('share.platform'), value: sample * split.platform, color: '#35d0ff' },
      { label: A.t('share.landlord'), value: sample * split.landlord, color: '#7a6bff' },
      { label: A.t('share.ai'), value: sample * split.ai, color: '#ff5fa2' },
      { label: A.t('share.sales'), value: sample * split.sales, color: '#34d399' }
    ].filter(s => s.value > 0);
    q('prDonut').innerHTML = `<h3 class="card__title">${A.esc(A.t('pr.donut_title'))}</h3>` +
      A.donut(segs, { center: A.money(sample), centerSub: A.t('pr.of_10k'), label: A.t('pr.donut_title') });

    q('prExample').innerHTML = `<thead><tr>
        <th>${A.esc(A.t('co.allocation'))}</th><th class="num">${A.esc(A.t('pr.col_pct'))}</th>
        <th class="num">${A.esc(A.t('pr.col_amount'))}</th><th>${A.esc(A.t('pr.col_resp'))}</th></tr></thead>
      <tbody>
        ${['landlord', 'platform', 'ai', 'sales'].map(k => `<tr>
          <td>${A.esc(A.t('share.' + k))}</td>
          <td class="num">${Math.round(split[k] * 100)}%</td>
          <td class="num"><strong>${A.money(sample * split[k])}</strong></td>
          <td class="tiny muted">${A.esc(A.t('pr.resp_' + k))}</td></tr>`).join('')}
        <tr><td>${A.esc(A.t('share.processing'))}</td><td class="num">${A.pct(CFG.payment.processingPct, 1)} + ${A.money(CFG.payment.processingFlat)}</td>
          <td class="num">${A.money(sample * CFG.payment.processingPct + CFG.payment.processingFlat)}</td>
          <td class="tiny muted">${A.esc(A.t('pr.resp_processing'))}</td></tr>
      </tbody>`;
  }

  function saveSplit() {
    S.setSplit(split);
    A.toast(A.t('pr.toast_split'), 'ok');
  }

  /* ---------- extras + faq ------------------------------------------------ */
  function renderPayments() {
    const host = q('prPayTable');
    if (!host) return;
    const prov = S.payProviders();
    const rows = ['stripe', 'paypal', 'crypto', 'local'];
    host.innerHTML = `<thead><tr>
        <th>${A.esc(A.t('docs.col_provider'))}</th>
        <th>${A.esc(A.t('docs.col_methods2'))}</th>
        <th class="num">${A.esc(A.t('docs.col_fees'))}</th>
        <th>${A.esc(A.t('docs.col_settle2'))}</th>
        <th>${A.esc(A.t('docs.col_use2'))}</th></tr></thead>
      <tbody>${rows.map(k => {
        const p = prov[k] || {};
        const label = k === 'local' ? A.t('pay.rail_local') : A.t('pay.' + k);
        return `<tr>
          <td><strong>${A.esc(label)}</strong>
            <div class="tiny muted">${A.esc(p.mode || 'simulated')}</div></td>
          <td class="tiny">${A.esc(A.t('docs.pay_' + k + '_methods'))}</td>
          <td class="num tiny">${p.pct ? A.pct(p.pct, 2) + (p.flat ? ' + ' + A.money(p.flat) : '') : A.esc(A.t('pay.no_fee'))}</td>
          <td class="tiny">${A.esc(A.t('docs.pay_' + k + '_settle'))}</td>
          <td class="tiny muted">${A.esc(A.t('docs.pay_' + k + '_use'))}</td></tr>`;
      }).join('')}</tbody>`;
  }

  function renderExtras() {
    q('prExtra').innerHTML = EXTRA.map(k =>
      `<li><span>${A.esc(A.t('pr.' + k))}</span><b>${A.esc(A.t('pr.' + k + '_v'))}</b></li>`).join('');
    q('prFaq').innerHTML = FAQ.map(k =>
      `<details class="accordion"><summary>${A.esc(A.t('pr.' + k))}</summary>
        <div>${A.esc(A.t('pr.' + k + '_d'))}</div></details>`).join('');
  }

  /* ---------- init -------------------------------------------------------- */
  function renderAll() {
    renderModels(); renderRateCard(); populateQuote(); renderQuote();
    renderSliders(); renderExtras(); renderPayments();
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderAll();
    ['pqLoc', 'pqDays', 'pqSov', 'pqDevices', 'pqAi'].forEach(id =>
      q(id).addEventListener('input', renderQuote));
    q('prSaveSplit').addEventListener('click', saveSplit);
    q('prResetSplit').addEventListener('click', () => {
      split = Object.assign({}, CFG.revenueSplit);
      renderSliders();
      A.toast(A.t('pr.toast_reset'), 'ok');
    });
  });
  A.onLangChange(renderAll);
})();
