/* ============================================================================
 * 3dNakedEye — page-adsmanager.js
 * Advertiser console in the shape of Meta Ads Manager / Google Ads:
 * KPI strip, campaign table with delivery diagnostics and pacing, ad sets,
 * creatives, audiences, a placement planner (keyword-planner analog),
 * benchmark reporting, recommendations and a 5-step creation wizard.
 * ==========================================================================*/
(function () {
  'use strict';
  const S = window.LG.store, A = window.LG.app, CFG = window.LG_CONFIG;
  const N = () => window.LG.notify;
  const q = id => document.getElementById(id);
  const DAY = 86400000;

  const state = { range: 7, market: 'all', status: 'all', plan: null };
  const RANGES = [7, 14, 30, 'flight'];
  const RANGE_KEY = { 7: 'ads.range_7', 14: 'ads.range_14', 30: 'ads.range_30', flight: 'ads.range_flight' };

  /* ---------- metrics ---------------------------------------------------- */
  const flightEnd = c => c.end || S.util.addDays(c.start, c.days);
  function windowOf() {
    const today = new Date();
    if (state.range === 'flight') {
      const camps = visibleCampaigns();
      const starts = camps.map(c => new Date(c.start + 'T00:00:00'));
      const ends = camps.map(c => new Date(flightEnd(c) + 'T00:00:00'));
      if (!starts.length) return { from: today, to: today, days: 30 };
      const from = new Date(Math.min.apply(null, starts));
      const to = new Date(Math.max.apply(null, ends));
      return { from, to, days: Math.max(1, Math.round((to - from) / DAY) + 1) };
    }
    const from = new Date(today.getTime() - (state.range - 1) * DAY);
    return { from, to: today, days: state.range };
  }
  function overlap(c, win) {
    const cs = new Date(c.start + 'T00:00:00');
    const ce = new Date(flightEnd(c) + 'T00:00:00');
    const s = Math.max(cs, win.from), e = Math.min(ce, win.to);
    const days = Math.max(0, Math.round((e - s) / DAY) + 1);
    const flight = Math.max(1, Math.round((ce - cs) / DAY) + 1);
    return { days, flight, frac: Math.min(1, days / flight), elapsed: Math.max(0, Math.round((new Date() - cs) / DAY) + 1) / flight };
  }
  function metrics(c, win) {
    const o = overlap(c, win);
    const p = S.proofOfPlay(c);
    const plays = Math.round(p.verified.plays * o.frac);
    const impressions = Math.round(p.exposure.impressions * o.frac);
    const clicks = Math.round(p.engagement.scans * o.frac);
    const conversions = Math.round(p.engagement.redemptions * o.frac);
    const spend = Math.round((c.spend || 0) * o.frac);
    const delivered = (p.verified.uptimePct * p.verified.completionPct) || 1;
    const expected = Math.min(1, Math.max(0.05, o.elapsed));
    const ratio = delivered / expected;
    return {
      c, o, plays, impressions, clicks, conversions, spend,
      uptime: p.verified.uptimePct, completion: p.verified.completionPct,
      ctr: impressions ? clicks / impressions : 0,
      cpm: impressions ? (spend / impressions) * 1000 : 0,
      cpa: conversions ? spend / conversions : 0,
      delivery: c.status === 'live' ? (ratio < 0.95 ? 'under' : ratio > 1.05 ? 'over' : 'ok')
        : c.status === 'scheduled' ? 'ok' : 'other',
      status: c.status === 'live' && c.scheduled === false ? 'paused' : c.status
    };
  }
  const visibleCampaigns = () => S.campaigns().filter(c => {
    if (state.market === 'all') return true;
    return (c.locationIds || []).some(id => {
      const l = S.location(id);
      return l && S.marketOfLocation(l) === state.market;
    });
  });
  const filtered = () => {
    const list = visibleCampaigns();
    if (state.status === 'all') return list;
    return list.filter(c => (c.status === state.status) ||
      (state.status === 'paused' && c.status === 'live' && c.scheduled === false));
  };
  const bench = (v, mult) => v * (CFG.benchmarks[mult] || 1);
  const delta = (mine, ref) => (ref ? Math.round(((mine - ref) / ref) * 100) : 0);
  const deltaHtml = (mine, ref, invert) => {
    const d = delta(mine, ref);
    const good = invert ? d < 0 : d > 0;
    return `<span class="pill pill--${Math.abs(d) < 2 ? 'muted' : good ? 'ok' : 'warn'}">${d > 0 ? '+' : ''}${d}%</span>`;
  };

  /* ---------- KPIs ------------------------------------------------------- */
  function renderKpis(rows) {
    const sum = k => rows.reduce((s, r) => s + r[k], 0);
    const spend = sum('spend'), imp = sum('impressions'), plays = sum('plays');
    const clicks = sum('clicks'), conv = sum('conversions');
    const cpm = imp ? (spend / imp) * 1000 : 0;
    const cpa = conv ? spend / conv : 0;
    const ctr = imp ? clicks / imp : 0;
    q('adsKpis').innerHTML =
      A.stat(A.t('ads.col_spend'), A.money(spend), A.t('ads.totals')) +
      A.stat(A.t('ads.col_plays'), A.num(plays), A.t('measure.verified'), 'ok') +
      A.stat(A.t('ads.col_impr'), A.num(imp), A.t('measure.exposure')) +
      A.stat(A.t('ads.col_clicks'), A.num(clicks), A.t('measure.g1')) +
      A.stat(A.t('ads.col_cpm'), A.money(cpm, { maximumFractionDigits: 2 }), A.t('ads.bench_vs', { pct: delta(cpm, bench(cpm, 'cpmMultiplier')) + '%' }), 'brand') +
      A.stat(A.t('ads.col_ctr'), A.pct(ctr, 3), A.t('ads.bench_vs', { pct: delta(ctr, bench(ctr, 'ctrMultiplier')) + '%' })) +
      A.stat(A.t('ads.col_conv'), A.num(conv), A.t('measure.g3'), 'ok') +
      A.stat(A.t('ads.col_cpa'), cpa ? A.money(cpa) : '—', A.t('ads.bench_vs', { pct: delta(cpa, bench(cpa, 'cpaMultiplier')) + '%' }), 'warn');
  }

  /* ---------- campaigns table ------------------------------------------- */
  function renderTable(rows) {
    const win = windowOf();
    q('adsTable').innerHTML = `<thead><tr>
        <th>${A.esc(A.t('ads.col_on'))}</th>
        <th>${A.esc(A.t('ads.col_campaign'))}</th>
        <th>${A.esc(A.t('ads.col_delivery'))}</th>
        <th>${A.esc(A.t('ads.col_objective'))}</th>
        <th>${A.esc(A.t('ads.col_budget'))}</th>
        <th class="num">${A.esc(A.t('ads.col_spend'))}</th>
        <th class="num">${A.esc(A.t('ads.col_plays'))}</th>
        <th class="num">${A.esc(A.t('ads.col_impr'))}</th>
        <th class="num">${A.esc(A.t('ads.col_clicks'))}</th>
        <th class="num">${A.esc(A.t('ads.col_ctr'))}</th>
        <th class="num">${A.esc(A.t('ads.col_cpm'))}</th>
        <th class="num">${A.esc(A.t('ads.col_conv'))}</th>
        <th class="num">${A.esc(A.t('ads.col_cpa'))}</th>
        <th></th></tr></thead>
      <tbody>${rows.length ? rows.map(r => {
        const c = r.c;
        const on = c.status === 'live' || c.status === 'scheduled';
        const obj = window.LG_OBJECTIVES.find(o => o.id === c.objective);
        const placements = (c.locationIds || []).map(id => { const l = S.location(id); return l ? A.L(l.name) : id; }).join(' · ');
        const pacePill = r.delivery === 'over' ? `<span class="pill pill--warn">${A.esc(A.t('ads.pacing_over'))}</span>`
          : r.delivery === 'under' ? `<span class="pill pill--bad">${A.esc(A.t('ads.pacing_under'))}</span>`
          : `<span class="pill pill--ok">${A.esc(A.t('ads.pacing_ok'))}</span>`;
        return `<tr>
          <td><input type="checkbox" data-on="${c.id}" ${on ? 'checked' : ''} aria-label="${A.esc(A.t('ads.col_on'))}"></td>
          <td><strong>${A.esc(A.L(c.advertiser))}</strong>
            <div class="tiny muted mono">${A.esc(c.id)}</div>
            <div class="tiny muted">${A.esc(placements)}</div></td>
          <td>${A.statusPill(c.status)}<div class="tiny muted">${A.esc(A.t('ads.pacing'))}</div>${pacePill}</td>
          <td class="tiny">${A.esc(obj ? A.L(obj.label) : c.objective)}</td>
          <td class="num">${A.money(c.spend)}<div class="tiny muted">${c.days} ${A.esc(A.t('unit.days'))} · ${c.sov}%</div></td>
          <td class="num">${A.money(r.spend)}</td>
          <td class="num">${A.num(r.plays)}</td>
          <td class="num">${A.num(r.impressions)}</td>
          <td class="num">${A.num(r.clicks)}</td>
          <td class="num">${A.pct(r.ctr, 3)} ${deltaHtml(r.ctr, bench(r.ctr, 'ctrMultiplier'))}</td>
          <td class="num">${A.money(r.cpm, { maximumFractionDigits: 2 })} ${deltaHtml(r.cpm, bench(r.cpm, 'cpmMultiplier'), true)}</td>
          <td class="num">${A.num(r.conversions)}</td>
          <td class="num">${r.cpa ? A.money(r.cpa) : '—'} ${r.cpa ? deltaHtml(r.cpa, bench(r.cpa, 'cpaMultiplier'), true) : ''}</td>
          <td><div class="row" style="gap:4px">
            <button class="btn btn--quiet btn--sm" type="button" data-diag="${c.id}" title="${A.esc(A.t('ads.diagnostics'))}">⚙</button>
            <button class="btn btn--quiet btn--sm" type="button" data-edit="${c.id}" title="${A.esc(A.t('ads.edit'))}">✎</button>
            <button class="btn btn--quiet btn--sm" type="button" data-dup="${c.id}" title="${A.esc(A.t('ads.duplicate'))}">⧉</button>
          </div></td></tr>`;
      }).join('') : `<tr><td colspan="14" class="muted">${A.esc(A.t('ads.empty'))}</td></tr>`}</tbody>`;

    const t = q('adsTable');
    t.querySelectorAll('[data-on]').forEach(cb => cb.addEventListener('change', () => {
      const c = S.campaign(cb.getAttribute('data-on'));
      const next = cb.checked ? 'live' : 'paused';
      S.updateCampaign(c.id, { status: next, scheduled: cb.checked });
      if (cb.checked) N().fire('campaign.live', livePayload(c));
      renderAll();
    }));
    t.querySelectorAll('[data-diag]').forEach(b => b.addEventListener('click', () => diagnostics(b.getAttribute('data-diag'))));
    t.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => editBudget(b.getAttribute('data-edit'))));
    t.querySelectorAll('[data-dup]').forEach(b => b.addEventListener('click', () => {
      const c = S.campaign(b.getAttribute('data-dup'));
      const copy = JSON.parse(JSON.stringify(c));
      copy.id = 'CMP-' + Math.random().toString(36).slice(2, 8).toUpperCase();
      copy.status = 'in_review'; copy.approval = 'pending_landlord'; delete copy.bookingId;
      S.addCampaign(copy);
      N().fire('approval.requested', approvalPayload(copy));
      A.toast(A.t('ads.created_toast', { id: copy.id }), 'ok');
      renderAll();
    }));
    void win;
  }

  function livePayload(c) {
    const loc = S.location((c.locationIds || [])[0]);
    const p = S.proofOfPlay(c);
    return {
      market: loc ? S.marketOfLocation(loc) : 'hk',
      advertiser: { name: A.L(c.advertiser), email: 'advertiser@example.com' },
      landlord: loc ? { name: A.L(loc.landlord), email: 'landlord@example.com' } : null,
      vars: {
        campaign: c.id, name: A.L(c.advertiser),
        locations: (c.locationIds || []).map(id => { const l = S.location(id); return l ? A.L(l.name) : id; }).join(', '),
        devices: A.num((c.locationIds || []).reduce((s, id) => {
          const l = S.location(id); return s + (l ? l.devices.length : 0);
        }, 0)),
        plays: A.num(p.verified.plays), impressions: A.num(p.exposure.impressions),
        date: A.date(c.start)
      },
      facts: [['Campaign', c.id], ['Plays', A.num(p.verified.plays)]]
    };
  }
  function approvalPayload(c) {
    const loc = S.location((c.locationIds || [])[0]);
    return {
      market: loc ? S.marketOfLocation(loc) : 'hk',
      advertiser: { name: A.L(c.advertiser), email: 'advertiser@example.com' },
      landlord: loc ? { name: A.L(loc.landlord), email: 'landlord@example.com' } : null,
      vars: {
        campaign: c.id, advertiser: A.L(c.advertiser),
        location: loc ? A.L(loc.name) : '', date: A.date(c.start), days: c.days, sov: c.sov,
        share: A.money(Math.round((c.spend || 0) * S.state.split.landlord))
      },
      facts: [['Campaign', c.id], ['Location', loc ? A.L(loc.name) : ''], ['Window', A.date(c.start) + ' → ' + A.date(flightEnd(c))]]
    };
  }

  /* ---------- diagnostics, budget editing ------------------------------- */
  function diagnostics(id) {
    const c = S.campaign(id);
    const r = metrics(c, windowOf());
    const loc = S.location((c.locationIds || [])[0]);
    const p = S.proofOfPlay(c);
    A.modal({
      title: A.t('ads.diagnostics') + ' · ' + c.id,
      html: `<ul class="kpi-list">
        <li><span>${A.esc(A.t('ads.col_delivery'))}</span><b>${A.esc(A.t('ads.pacing_' + (r.delivery === 'other' ? 'ok' : r.delivery)))}</b></li>
        <li><span>${A.esc(A.t('ads.diag_1'))}</span><b>${A.esc((loc ? loc.bookedPct : 0) + '%')}</b></li>
        <li><span>${A.esc(A.t('ads.diag_2'))}</span><b>${A.esc(A.t('status.' + (c.approval === 'approved' ? 'approved' : c.approval === 'rejected' ? 'rejected' : 'pending')))}</b></li>
        <li><span>${A.esc(A.t('ads.diag_3'))}</span><b>${A.pct(p.verified.uptimePct, 1)}</b></li>
        <li><span>${A.esc(A.t('ads.diag_4'))}</span><b>${A.esc(A.t('status.' + (c.creative && c.creative.form === 'hologram' ? 'approved' : 'live')))}</b></li>
      </ul>
      <p class="small muted" style="margin-top:12px">${A.esc(A.t('measure.note'))}</p>`,
      actions: [{ label: A.t('cta.cancel'), className: 'btn--ghost' }]
    });
  }

  function editBudget(id) {
    const c = S.campaign(id);
    A.modal({
      title: A.t('ads.edit') + ' · ' + c.id,
      html: `<div class="form-row"><label>${A.esc(A.t('ads.col_budget'))} (HK$)</label>
          <input type="number" id="edBudget" value="${c.spend}" min="0" step="100"></div>
        <div class="form-row" style="margin-top:10px"><label>${A.esc(A.t('loc.days'))}</label>
          <input type="number" id="edDays" value="${c.days}" min="1" max="90"></div>
        <div class="form-row" style="margin-top:10px"><label>${A.esc(A.t('loc.sov'))}</label>
          <select id="edSov">${CFG.pricing.shareOfVoice.map(v => `<option value="${v}" ${v === c.sov ? 'selected' : ''}>${v}%</option>`).join('')}</select></div>
        <p class="tiny muted" style="margin-top:10px">${A.esc(A.t('ads.learning_note'))}</p>`,
      actions: [
        { label: A.t('cta.cancel'), className: 'btn--quiet' },
        { label: A.t('ll.save'), className: 'btn--primary', onClick: wrap => {
          S.updateCampaign(c.id, {
            spend: parseInt(wrap.querySelector('#edBudget').value, 10) || c.spend,
            days: parseInt(wrap.querySelector('#edDays').value, 10) || c.days,
            sov: parseInt(wrap.querySelector('#edSov').value, 10) || c.sov,
            end: S.util.addDays(c.start, parseInt(wrap.querySelector('#edDays').value, 10) || c.days)
          });
          A.toast(A.t('auto.saved'), 'ok');
          renderAll();
        } }
      ]
    });
  }

  /* ---------- recommendations ------------------------------------------- */
  const RECOS = [
    { id: 'reco_1', action: () => raiseSov() },
    { id: 'reco_2', action: () => setHologram() },
    { id: 'reco_3', action: () => extendFlight() },
    { id: 'reco_4', action: () => turnOnCoupon() },
    { id: 'reco_5', action: () => suggestDistrict() }
  ];
  function renderRecos() {
    q('adsRecos').innerHTML = RECOS.map(r => `
      <div class="panel">
        <div class="row row--between" style="align-items:flex-start">
          <div><strong>${A.esc(A.t('ads.' + r.id))}</strong>
            <p class="small muted" style="margin:6px 0 0">${A.esc(A.t('ads.' + r.id + '_d'))}</p></div>
          <button class="btn btn--primary btn--sm" type="button" data-reco="${r.id}">${A.esc(A.t('ads.apply'))}</button>
        </div>
      </div>`).join('');
    q('adsRecos').querySelectorAll('[data-reco]').forEach(b => b.addEventListener('click', () => {
      const r = RECOS.find(x => x.id === b.getAttribute('data-reco'));
      r.action();
      b.textContent = A.t('ads.applied');
      b.className = 'btn btn--ok btn--sm';
    }));
  }
  function firstLive() { return filtered()[0] || visibleCampaigns()[0]; }
  function raiseSov() {
    const c = firstLive(); if (!c) return;
    const next = c.sov === 100 ? 100 : c.sov === 50 ? 100 : 50;
    S.updateCampaign(c.id, { sov: next });
    A.toast(A.t('ads.applied') + ' · SOV ' + next + '%', 'ok'); renderAll();
  }
  function setHologram() {
    const c = firstLive(); if (!c) return;
    S.updateCampaign(c.id, { aiUsed: true, creative: Object.assign({}, c.creative, { form: 'hologram' }) });
    A.toast(A.t('ads.applied'), 'ok'); renderAll();
  }
  function extendFlight() {
    const c = firstLive(); if (!c) return;
    const days = c.days + 7;
    S.updateCampaign(c.id, { days, end: S.util.addDays(c.start, days), spend: Math.round(c.spend * (days / c.days)) });
    A.toast(A.t('ads.applied') + ' · +7 ' + A.t('unit.days'), 'ok'); renderAll();
  }
  function turnOnCoupon() {
    const c = firstLive(); if (!c) return;
    S.updateCampaign(c.id, { coupon: true, objective: 'coupon' });
    A.toast(A.t('ads.applied'), 'ok'); renderAll();
  }
  function suggestDistrict() {
    const c = firstLive(); if (!c) return;
    const loc = S.location((c.locationIds || [])[0]); if (!loc) return;
    const mk = S.marketOfLocation(loc);
    const cand = S.locationsByMarket(mk).filter(l => l.district !== loc.district && !(c.locationIds || []).includes(l.id))[0];
    if (!cand) return;
    S.updateCampaign(c.id, { locationIds: (c.locationIds || []).concat([cand.id]) });
    S.addToCart({ locationId: cand.id, days: c.days, sov: c.sov, start: c.start });
    A.toast(A.t('ads.applied') + ' · ' + A.L(cand.name), 'ok'); renderAll();
  }

  /* ---------- ad sets / creatives / audiences --------------------------- */
  function renderAdsets(rows) {
    const byLoc = {};
    rows.forEach(r => (r.c.locationIds || []).forEach(id => {
      byLoc[id] = byLoc[id] || { spend: 0, plays: 0, impressions: 0, clicks: 0, conversions: 0, campaigns: 0 };
      const b = byLoc[id];
      b.spend += r.spend / (r.c.locationIds || [1]).length;
      b.plays += r.plays / (r.c.locationIds || [1]).length;
      b.impressions += r.impressions / (r.c.locationIds || [1]).length;
      b.clicks += r.clicks / (r.c.locationIds || [1]).length;
      b.conversions += r.conversions / (r.c.locationIds || [1]).length;
      b.campaigns += 1;
    }));
    q('adsAdsets').innerHTML = `<thead><tr>
        <th>${A.esc(A.t('ads.col_placement'))}</th><th>${A.esc(A.t('mkt.market'))}</th>
        <th class="num">${A.esc(A.t('ads.col_campaign'))}</th><th class="num">${A.esc(A.t('ads.col_spend'))}</th>
        <th class="num">${A.esc(A.t('ads.col_plays'))}</th><th class="num">${A.esc(A.t('ads.col_impr'))}</th>
        <th class="num">${A.esc(A.t('ads.col_ctr'))}</th><th class="num">${A.esc(A.t('ads.col_cpa'))}</th></tr></thead>
      <tbody>${Object.keys(byLoc).map(id => {
        const b = byLoc[id], l = S.location(id);
        return `<tr><td>${A.esc(l ? A.L(l.name) : id)}<div class="tiny muted mono">${A.esc(id)}</div></td>
          <td class="tiny">${A.esc(A.marketLabel(l ? S.marketOfLocation(l) : 'hk'))}</td>
          <td class="num">${b.campaigns}</td><td class="num">${A.money(b.spend)}</td>
          <td class="num">${A.num(b.plays)}</td><td class="num">${A.num(b.impressions)}</td>
          <td class="num">${b.impressions ? A.pct(b.clicks / b.impressions, 3) : '—'}</td>
          <td class="num">${b.conversions ? A.money(b.spend / b.conversions) : '—'}</td></tr>`;
      }).join('') || `<tr><td colspan="8" class="muted">${A.esc(A.t('ads.empty'))}</td></tr>`}</tbody>`;
  }

  function renderCreatives(rows) {
    q('adsCreatives').innerHTML = `<thead><tr>
        <th>${A.esc(A.t('ads.col_campaign'))}</th><th>${A.esc(A.t('studio.f_files'))}</th>
        <th>${A.esc(A.t('ads.format'))}</th><th>${A.esc(A.t('ll.languages'))}</th>
        <th>${A.esc(A.t('ads.col_delivery'))}</th><th>${A.esc(A.t('studio.tab_check'))}</th></tr></thead>
      <tbody>${rows.map(r => {
        const c = r.c, cr = c.creative || {};
        const form = cr.form === 'hologram' ? A.t('ads.format_square') : cr.form === 'screen' ? A.t('ads.format_vertical') : A.t('ads.format_landscape');
        return `<tr><td>${A.esc(A.L(c.advertiser))}<div class="tiny muted mono">${A.esc(c.id)}</div></td>
          <td class="tiny mono">${A.esc(cr.name || '—')}</td>
          <td class="tiny">${A.esc(form)}</td>
          <td class="tiny">${A.esc((cr.languages || ['en']).join(', '))}</td>
          <td>${A.statusPill(c.status)}</td>
          <td>${c.aiUsed ? `<span class="pill pill--info">AI</span>` : `<span class="pill pill--muted">—</span>`}
            <span class="pill pill--ok">1:1 · #000</span></td></tr>`;
      }).join('') || `<tr><td colspan="6" class="muted">${A.esc(A.t('ads.empty'))}</td></tr>`}</tbody>`;
  }

  function renderAudiences() {
    const mk = state.market === 'all' ? A.market : state.market;
    const pool = S.locationsByMarket(mk);
    const byVenue = {};
    pool.forEach(l => {
      byVenue[l.venue] = byVenue[l.venue] || { footfall: 0, audience: 0, sites: 0, dwell: 0 };
      byVenue[l.venue].footfall += l.footfallPerDay;
      byVenue[l.venue].audience += l.footfallPerDay * l.visibility;
      byVenue[l.venue].dwell += l.dwellSec;
      byVenue[l.venue].sites += 1;
    });
    q('adsAudiences').innerHTML = `<thead><tr>
        <th>${A.esc(A.t('ads.audience_venue'))}</th><th class="num">${A.esc(A.t('op.kpi_locations'))}</th>
        <th class="num">${A.esc(A.t('stat.footfall'))}</th><th class="num">${A.esc(A.t('stat.est_audience'))}</th>
        <th class="num">${A.esc(A.t('stat.dwell'))}</th><th></th></tr></thead>
      <tbody>${Object.keys(byVenue).map(v => {
        const b = byVenue[v];
        return `<tr><td>${A.esc(A.L(S.venue(v).label))}</td>
          <td class="num">${b.sites}</td>
          <td class="num">${A.num(b.footfall)}</td>
          <td class="num">${A.num(b.audience)}</td>
          <td class="num">${A.num(b.dwell / b.sites)} s</td>
          <td><button class="btn btn--ghost btn--sm" type="button" data-aud="${v}">${A.esc(A.t('ads.apply'))}</button></td></tr>`;
      }).join('')}</tbody>`;
    q('adsAudiences').querySelectorAll('[data-aud]').forEach(b => b.addEventListener('click', () => {
      const v = b.getAttribute('data-aud');
      const target = S.locationsByMarket(mk).filter(l => l.venue === v && l.status === 'live')[0];
      if (target) {
        S.addToCart({ locationId: target.id, days: 7, sov: 100, start: S.util.todayISO(3) });
        A.toast(A.t('ads.planner_added') + ' · ' + A.L(target.name), 'ok');
      }
    }));
  }

  /* ---------- placement planner ---------------------------------------- */
  const SYNONYMS = {
    bakery: ['restaurant', 'supermarket', 'mall'], cake: ['restaurant', 'mall'], food: ['restaurant', 'supermarket', 'mall'],
    clinic: ['clinic'], dental: ['clinic'], doctor: ['clinic'], hospital: ['clinic'], health: ['clinic', 'gym'],
    gym: ['gym'], fitness: ['gym'], yoga: ['gym'],
    student: ['campus'], students: ['campus'], family: ['mall', 'supermarket', 'cinema'], families: ['mall', 'supermarket', 'cinema'],
    office: ['office'], worker: ['office'], commuter: ['transport'], tourist: ['hotel', 'transport', 'mall'],
    luxury: ['mall', 'hotel'], sale: ['retail', 'mall'], fashion: ['retail'], phone: ['retail', 'mall'],
    event: ['exhibition', 'transport'], exhibition: ['exhibition'], concert: ['exhibition', 'cinema']
  };
  function planner() {
    const term = (q('adsPlannerQ').value || '').trim().toLowerCase();
    const pool = state.market === 'all' ? S.liveLocations() : S.locationsByMarket(state.market);
    if (!term) { q('adsPlannerOut').innerHTML = `<p class="small muted" style="margin:0">${A.esc(A.t('ads.planner_lede'))}</p>`; return; }
    const venues = SYNONYMS[term] || Object.keys(window.LG_VENUES).length ? (SYNONYMS[term] || []) : [];
    const hits = pool.filter(l => {
      const hay = [A.L(l.name), A.L(S.venue(l.venue).label), A.L(S.district(l.district).label)].join(' ').toLowerCase();
      return hay.indexOf(term) !== -1 || venues.indexOf(l.venue) !== -1;
    }).slice(0, 8);
    if (!hits.length) { q('adsPlannerOut').innerHTML = `<p class="small muted" style="margin:0">${A.esc(A.t('ads.planner_none'))}</p>`; return; }
    q('adsPlannerOut').innerHTML = `
      <div class="table-wrap"><table class="data data--compact">
        <thead><tr><th>${A.esc(A.t('mkt.col_location'))}</th><th>${A.esc(A.t('mkt.col_venue'))}</th>
          <th class="num">${A.esc(A.t('stat.footfall'))}</th><th class="num">${A.esc(A.t('ads.planner_est'))}</th>
          <th class="num">${A.esc(A.t('mkt.col_price'))}</th><th></th></tr></thead>
        <tbody>${hits.map(l => `<tr>
          <td>${A.esc(A.L(l.name))}<div class="tiny muted">${A.esc(A.L(S.district(l.district).label))} · ${A.esc(A.marketLabel(S.marketOfLocation(l)))}</div></td>
          <td class="tiny">${A.esc(A.L(S.venue(l.venue).label))}</td>
          <td class="num">${A.num(l.footfallPerDay)}</td>
          <td class="num">${A.num(l.footfallPerDay * l.visibility)}</td>
          <td class="num">${A.esc(A.priceWithLocal(A.dayRate(l), S.marketOfLocation(l)))}</td>
          <td><button class="btn btn--primary btn--sm" type="button" data-plan="${l.id}">${A.esc(A.t('ads.planner_add'))}</button></td></tr>`).join('')}</tbody>
      </table></div>
      <p class="tiny muted" style="margin-top:10px">${A.esc(A.t('ads.planner_note'))}</p>`;
    q('adsPlannerOut').querySelectorAll('[data-plan]').forEach(b => b.addEventListener('click', () => {
      const id = b.getAttribute('data-plan');
      S.addToCart({ locationId: id, days: 7, sov: 100, start: S.util.todayISO(3) });
      A.toast(A.t('ads.planner_added'), 'ok');
      b.textContent = A.t('cta.added');
    }));
  }

  /* ---------- reports --------------------------------------------------- */
  function renderReports(rows) {
    const sum = k => rows.reduce((s, r) => s + r[k], 0);
    const spend = sum('spend'), imp = sum('impressions'), clicks = sum('clicks'), conv = sum('conversions');
    const cpm = imp ? (spend / imp) * 1000 : 0, ctr = imp ? clicks / imp : 0, cpa = conv ? spend / conv : 0;
    const mk = (label, mine, ref, invert) => `<div class="card">
        <h4 class="card__title" style="font-size:.95rem">${A.esc(label)}</h4>
        ${A.bars([
          { label: A.t('ads.bench_you'), value: Math.round(mine * 100) },
          { label: A.t('ads.bench_market'), value: Math.round(ref * 100) }
        ], { valueFormat: v => A.num(v / 100, 2) })}
        <p class="small" style="margin:10px 0 0">${A.t('ads.bench_vs', { pct: delta(mine, ref) + '%' })} ${invert ? '· ' + A.esc(A.t('ads.col_cpa')) : ''}</p>
      </div>`;
    q('adsBench').innerHTML =
      mk(A.t('ads.col_cpm'), cpm / 1000, bench(cpm, 'cpmMultiplier') / 1000, true) +
      mk(A.t('ads.col_ctr'), ctr, bench(ctr, 'ctrMultiplier'), false) +
      (cpa ? mk(A.t('ads.col_cpa'), cpa, bench(cpa, 'cpaMultiplier'), true) : '') +
      `<div class="card"><h4 class="card__title" style="font-size:.95rem">${A.esc(A.t('ads.bench_title'))}</h4>
        <p class="small muted" style="margin:0">${A.esc(A.t('ads.bench_note'))}</p></div>`;

    q('adsReports').innerHTML = `<thead><tr>
        <th>${A.esc(A.t('ads.col_campaign'))}</th><th>${A.esc(A.t('measure.verified'))}</th>
        <th>${A.esc(A.t('measure.exposure'))}</th><th>${A.esc(A.t('measure.engagement'))}</th>
        <th class="num">${A.esc(A.t('ads.col_spend'))}</th></tr></thead>
      <tbody>${rows.map(r => `<tr>
        <td>${A.esc(A.L(r.c.advertiser))}<div class="tiny muted mono">${A.esc(r.c.id)}</div></td>
        <td class="tiny">${A.num(r.plays)} ${A.esc(A.t('measure.v1'))}<br>${A.esc(A.t('adv.kpi_uptime'))} ${A.pct(r.uptime, 1)}</td>
        <td class="tiny">${A.num(r.impressions)} ${A.esc(A.t('measure.e4'))}<br>${A.esc(A.t('measure.e1b'))}</td>
        <td class="tiny">${A.num(r.clicks)} ${A.esc(A.t('measure.g1'))}<br>${A.num(r.conversions)} ${A.esc(A.t('measure.g3'))}</td>
        <td class="num">${A.money(r.spend)}</td></tr>`).join('')}</tbody>`;
  }

  /* ---------- creation wizard ------------------------------------------ */
  function wizard() {
    const objectives = window.LG_OBJECTIVES;
    const venues = window.LG_VENUES;
    const districts = S.districts().filter(d => A.marketOfLocation({ district: d.id }) === A.market);
    A.modal({
      title: A.t('ads.wizard_title'),
      html: `<ol class="steps" style="margin-bottom:16px">
          ${['step1', 'step2', 'step3', 'step4', 'step5'].map(k => `<li><h4>${A.esc(A.t('ads.' + k))}</h4></li>`).join('')}
        </ol>
        <div class="form-row"><label>${A.esc(A.t('ads.step1'))}</label>
          <select id="wzObjective">${objectives.map(o => `<option value="${o.id}">${A.esc(A.L(o.label))}</option>`).join('')}</select></div>
        <div class="form-row--2 form-row" style="margin-top:10px">
          <div class="form-row"><label>${A.esc(A.t('ads.audience_venue'))}</label>
            <select id="wzVenue">${venues.map(v => `<option value="${v.id}">${A.esc(A.L(v.label))}</option>`).join('')}</select></div>
          <div class="form-row"><label>${A.esc(A.t('ads.audience_district'))}</label>
            <select id="wzDistrict">${districts.map(d => `<option value="${d.id}">${A.esc(A.L(d.label))}</option>`).join('')}</select></div>
        </div>
        <div class="form-row--3 form-row" style="margin-top:10px">
          <div class="form-row"><label>${A.esc(A.t('ads.budget_total'))} (HK$)</label><input type="number" id="wzBudget" value="12000" min="500" step="500"></div>
          <div class="form-row"><label>${A.esc(A.t('loc.days'))}</label><input type="number" id="wzDays" value="14" min="1" max="90"></div>
          <div class="form-row"><label>${A.esc(A.t('loc.sov'))}</label>
            <select id="wzSov">${CFG.pricing.shareOfVoice.map(v => `<option value="${v}">${v}%</option>`).join('')}</select></div>
        </div>
        <div class="form-row--2 form-row" style="margin-top:10px">
          <div class="form-row"><label>${A.esc(A.t('ads.format'))}</label>
            <select id="wzFormat">
              <option value="hologram">${A.esc(A.t('ads.format_square'))}</option>
              <option value="screen">${A.esc(A.t('ads.format_vertical'))}</option>
              <option value="landscape">${A.esc(A.t('ads.format_landscape'))}</option>
            </select></div>
          <div class="form-row"><label>${A.esc(A.t('ads.frequency'))}</label>
            <select id="wzFreq"><option value="100">100%</option><option value="50">50%</option><option value="25">25%</option></select></div>
        </div>
        <p class="tiny muted" style="margin-top:12px" id="wzEst"></p>`,
      actions: [
        { label: A.t('ads.save_draft'), className: 'btn--ghost' },
        { label: A.t('ads.publish'), className: 'btn--primary', onClick: wrap => publishFrom(wrap) }
      ]
    });
    const est = () => {
      const dId = q('wzDistrict') ? q('wzDistrict').value : districts[0].id;
      const pool = S.locationsByMarket(A.market).filter(l => l.district === dId);
      const target = pool[0] || S.locationsByMarket(A.market)[0];
      const days = parseInt((document.getElementById('wzDays') || {}).value, 10) || 14;
      const sov = parseInt((document.getElementById('wzSov') || {}).value, 10) || 100;
      const el = document.getElementById('wzEst');
      if (target && el) {
        const plays = 480 * (sov / 100) * days * target.devices.length;
        el.textContent = A.t('ads.review_est') + ': ' + A.num(plays) + ' ' + A.t('measure.v1') + ' · ' +
          A.num(target.footfallPerDay * target.visibility * (sov / 100) * days) + ' ' + A.t('measure.e4');
      }
    };
    ['wzDistrict', 'wzDays', 'wzSov', 'wzVenue'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.addEventListener('change', est); el.addEventListener('input', est); }
    });
    est();
  }

  function publishFrom(wrap) {
    const g = id => wrap.querySelector('#' + id);
    const dId = g('wzDistrict').value, vId = g('wzVenue').value;
    const target = S.locationsByMarket(A.market).filter(l => l.district === dId && l.venue === vId)[0]
      || S.locationsByMarket(A.market).filter(l => l.district === dId)[0]
      || S.locationsByMarket(A.market)[0];
    if (!target) return;
    const days = parseInt(g('wzDays').value, 10) || 14;
    const sov = parseInt(g('wzSov').value, 10) || 100;
    const budget = parseInt(g('wzBudget').value, 10) || 12000;
    const camp = {
      id: 'CMP-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
      advertiser: { en: 'Your brand (draft)', zhHant: '你的品牌（草稿）', zhHans: '你的品牌（草稿）', th: 'แบรนด์ของคุณ (ฉบับร่าง)' },
      objective: g('wzObjective').value, status: 'in_review', approval: 'pending_landlord',
      locationIds: [target.id], days, sov, start: S.util.todayISO(3), end: S.util.addDays(S.util.todayISO(3), days),
      created: S.util.todayISO(), spend: budget, aiUsed: false,
      creative: { name: 'wizard_creative.mp4', form: g('wzFormat').value, languages: [A.lang] }
    };
    S.addCampaign(camp);
    S.addToCart({ locationId: target.id, days, sov, start: camp.start });
    N().fire('approval.requested', approvalPayload(camp));
    N().fire('booking_created', {
      market: S.marketOfLocation(target),
      advertiser: { name: A.L(camp.advertiser), email: 'advertiser@example.com' },
      vars: { id: camp.id, campaign: camp.id, name: A.L(camp.advertiser), amount: A.money(budget), date: A.date(camp.start), locations: A.L(target.name) },
      facts: [['Campaign', camp.id], ['Location', A.L(target.name)]]
    });
    A.toast(A.t('ads.created_toast', { id: camp.id }), 'ok');
    renderAll();
  }

  /* ---------- export + orchestration ----------------------------------- */
  function exportCsv() {
    const win = windowOf();
    const rows = [['campaign', 'advertiser', 'status', 'objective', 'spend', 'plays', 'impressions', 'clicks', 'conversions', 'cpm', 'cpa']]
      .concat(filtered().map(c => {
        const m = metrics(c, win);
        return [c.id, A.L(c.advertiser), c.status, c.objective, m.spend, m.plays, m.impressions, m.clicks, m.conversions,
          m.cpm.toFixed(2), m.cpa ? m.cpa.toFixed(2) : ''];
      }));
    A.downloadCSV('3dNakedEye-ads-manager.csv', rows);
  }

  function renderAll() {
    const win = windowOf();
    const rows = filtered().map(c => metrics(c, win));
    renderKpis(rows); renderTable(rows); renderAdsets(rows); renderCreatives(rows);
    renderAudiences(); renderReports(rows); renderRecos();
    if (q('adsPlannerOut') && !q('adsPlannerOut').innerHTML) planner();
  }

  function initSelects() {
    q('adsRange').innerHTML = RANGES.map(r => `<option value="${r}" ${r === state.range ? 'selected' : ''}>${A.esc(A.t(RANGE_KEY[r]))}</option>`).join('');
    q('adsMarketFilter').innerHTML = `<option value="all">${A.esc(A.t('mkt.all_markets'))}</option>` +
      A.markets().map(m => `<option value="${m.id}" ${m.id === state.market ? 'selected' : ''}>${A.esc(A.t('market.' + m.id))}</option>`).join('');
    q('adsStatus').innerHTML = `<option value="all">${A.esc(A.t('ads.all_status'))}</option>` +
      ['live', 'scheduled', 'in_review', 'completed', 'rejected'].map(s =>
        `<option value="${s}">${A.esc(A.t('ads.st_' + (s === 'live' ? 'active' : s === 'scheduled' ? 'learning' : s === 'in_review' ? 'review' : s)))}</option>`).join('');
  }

  document.addEventListener('DOMContentLoaded', () => {
    initSelects();
    q('adsNav').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      document.querySelectorAll('#adsNav button').forEach(x => x.classList.toggle('is-active', x === b));
      ['campaigns', 'adsets', 'ads', 'audiences', 'planner', 'reports'].forEach(s =>
        q('sec-' + s).classList.toggle('is-active', s === b.getAttribute('data-sec')));
    });
    q('adsRange').addEventListener('change', e => { state.range = e.target.value === 'flight' ? 'flight' : parseInt(e.target.value, 10); renderAll(); });
    q('adsMarketFilter').addEventListener('change', e => { state.market = e.target.value; renderAll(); });
    q('adsStatus').addEventListener('change', e => { state.status = e.target.value; renderAll(); });
    q('adsCreate').addEventListener('click', wizard);
    q('adsExport').addEventListener('click', exportCsv);
    q('adsPlannerGo').addEventListener('click', planner);
    q('adsPlannerQ').addEventListener('keydown', e => { if (e.key === 'Enter') planner(); });
    document.querySelectorAll('[data-bulk]').forEach(b => b.addEventListener('click', () => {
      const next = b.getAttribute('data-bulk') === 'pause' ? 'paused' : 'live';
      filtered().forEach(c => S.updateCampaign(c.id, { status: next, scheduled: next === 'live' }));
      A.toast(A.t('ads.applied'), 'ok');
      renderAll();
    }));
    renderAll();
  });
  A.onLangChange(() => { initSelects(); renderAll(); });
})();
