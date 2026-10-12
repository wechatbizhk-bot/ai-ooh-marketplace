/* 3dNakedEye — page-advertiser.js : advertiser portal */
(function () {
  'use strict';
  const S = window.LG.store, A = window.LG.app;
  const q = id => document.getElementById(id);
  let proofCampaign = null, reportCampaign = null;

  const campaigns = () => S.campaigns();

  /* ---------- navigation -------------------------------------------------- */
  function show(sec) {
    document.querySelectorAll('#advNav button').forEach(b =>
      b.classList.toggle('is-active', b.getAttribute('data-sec') === sec));
    ['overview', 'campaigns', 'create', 'proof', 'report', 'invoices', 'support'].forEach(s =>
      q('sec-' + s).classList.toggle('is-active', s === sec));
    if (sec === 'proof') renderProof();
    if (sec === 'report') renderReport();
  }

  /* ---------- overview ---------------------------------------------------- */
  function renderOverview() {
    const cs = campaigns();
    const live = cs.filter(c => c.status === 'live');
    const spend = cs.reduce((s, c) => s + (c.spend || 0), 0);
    const pops = cs.map(c => S.proofOfPlay(c));
    const plays = pops.reduce((s, p) => s + p.verified.plays, 0);
    const imp = pops.reduce((s, p) => s + p.exposure.impressions, 0);
    const scans = pops.reduce((s, p) => s + p.engagement.scans, 0);
    const red = pops.reduce((s, p) => s + p.engagement.redemptions, 0);

    q('advKpis').innerHTML =
      A.stat(A.t('adv.kpi_live'), A.num(live.length), A.t('adv.kpi_live_sub', { n: cs.length }), 'brand') +
      A.stat(A.t('adv.kpi_spend'), A.money(spend), A.t('adv.kpi_spend_sub')) +
      A.stat(A.t('measure.v1'), A.num(plays), A.t('adv.kpi_plays_sub')) +
      A.stat(A.t('measure.e4'), A.num(imp), A.t('adv.kpi_imp_sub')) +
      A.stat(A.t('measure.g1'), A.num(scans), A.t('adv.kpi_scans_sub')) +
      A.stat(A.t('measure.g3'), A.num(red), A.t('adv.kpi_red_sub'), 'ok');

    const recent = cs.slice(0, 5);
    q('advRecent').innerHTML = `<div class="table-wrap"><table class="data data--compact">
      <thead><tr><th>${A.esc(A.t('adv.col_campaign'))}</th><th>${A.esc(A.t('adv.col_status'))}</th>
        <th class="num">${A.esc(A.t('adv.col_spend'))}</th></tr></thead>
      <tbody>${recent.map(c => `<tr>
        <td><a href="#" data-camp="${c.id}">${A.esc(A.L(c.advertiser))}</a>
          <div class="tiny muted mono">${A.esc(c.id)}</div></td>
        <td>${A.statusPill(c.status)}</td>
        <td class="num">${A.money(c.spend)}</td></tr>`).join('')}</tbody></table></div>`;
    q('advRecent').querySelectorAll('[data-camp]').forEach(a => a.addEventListener('click', e => {
      e.preventDefault(); show('campaigns'); renderCampaignDetail(a.getAttribute('data-camp'));
    }));

    const pending = S.approvals().filter(a => a.status === 'pending');
    q('advAlerts').innerHTML = pending.length
      ? `<ul class="kpi-list">${pending.slice(0, 4).map(a => {
          const c = S.campaign(a.campaignId), loc = S.location(a.locationId);
          return `<li><span>${A.esc(A.t('adv.alert_pending', {
            loc: loc ? A.L(loc.name) : a.locationId }))}</span>
            <b>${c ? A.esc(c.id) : '—'}</b></li>`;
        }).join('')}</ul>
        <p class="tiny muted" style="margin:10px 0 0">${A.esc(A.t('adv.alert_pending_note'))}</p>`
      : `<p class="muted small" style="margin:0">${A.esc(A.t('adv.no_alerts'))}</p>`;

    const byVenue = {};
    cs.forEach(c => c.locationIds.forEach(id => {
      const loc = S.location(id); if (!loc) return;
      const k = loc.venue;
      byVenue[k] = (byVenue[k] || 0) + (c.spend || 0) / c.locationIds.length;
    }));
    q('advSpendMix').innerHTML = A.bars(Object.keys(byVenue).map(k => ({
      label: A.L(S.venue(k).label), value: Math.round(byVenue[k])
    })), { valueFormat: v => A.money(v) });
  }

  /* ---------- campaigns --------------------------------------------------- */
  function renderCampaigns() {
    const cs = campaigns();
    q('advCampaignTable').innerHTML = `<thead><tr>
        <th>${A.esc(A.t('adv.col_id'))}</th><th>${A.esc(A.t('adv.col_campaign'))}</th>
        <th>${A.esc(A.t('adv.col_objective'))}</th><th>${A.esc(A.t('adv.col_locations'))}</th>
        <th>${A.esc(A.t('adv.col_window'))}</th><th class="num">${A.esc(A.t('adv.col_sov'))}</th>
        <th class="num">${A.esc(A.t('adv.col_spend'))}</th><th>${A.esc(A.t('adv.col_status'))}</th>
        <th>${A.esc(A.t('adv.col_approval'))}</th><th></th></tr></thead>
      <tbody>${cs.map(c => {
        const obj = window.LG_OBJECTIVES.find(o => o.id === c.objective);
        const end = c.end || S.util.addDays(c.start, c.days);
        return `<tr>
          <td class="mono tiny">${A.esc(c.id)}</td>
          <td><strong>${A.esc(A.L(c.advertiser))}</strong>
            <div class="tiny muted">${A.esc(c.creative ? c.creative.name : '')}</div></td>
          <td>${A.esc(obj ? A.L(obj.label) : c.objective)}</td>
          <td>${(c.locationIds || []).map(id => {
            const loc = S.location(id);
            return `<div class="tiny">${A.esc(loc ? A.L(loc.name) : id)}</div>`;
          }).join('')}</td>
          <td class="tiny">${A.esc(A.date(c.start))}<br>${A.esc(A.date(end))}</td>
          <td class="num">${c.sov}%</td>
          <td class="num">${A.money(c.spend)}</td>
          <td>${A.statusPill(c.status)}</td>
          <td>${c.approval === 'approved' ? A.statusPill('approved')
            : c.approval === 'rejected' ? A.statusPill('rejected') : A.statusPill('pending')}</td>
          <td><button class="btn btn--ghost btn--sm" type="button" data-camp="${c.id}">${A.esc(A.t('cta.details'))}</button></td>
        </tr>`;
      }).join('')}</tbody>`;
    q('advCampaignTable').querySelectorAll('[data-camp]').forEach(b =>
      b.addEventListener('click', () => renderCampaignDetail(b.getAttribute('data-camp'))));

    q('advCreateSteps').innerHTML = ['create_1', 'create_2', 'create_3', 'create_4', 'create_5']
      .map(k => `<li><h4>${A.esc(A.t('adv.' + k))}</h4><p>${A.esc(A.t('adv.' + k + '_d'))}</p></li>`).join('');

    q('advSupport').innerHTML = ['s1', 's2', 's3', 's4', 's5'].map(k =>
      `<details class="accordion"><summary>${A.esc(A.t('adv.' + k))}</summary>
        <div>${A.esc(A.t('adv.' + k + '_d'))}</div></details>`).join('') +
      `<p class="small muted" style="margin-top:14px">${A.esc(A.t('adv.support_contact', {
        email: window.LG_CONFIG.brand.email, phone: window.LG_CONFIG.brand.phone }))}</p>`;
  }

  function renderCampaignDetail(id) {
    const c = S.campaign(id); if (!c) return;
    if (reportCampaign !== id) reportCampaign = id;
    if (proofCampaign !== id) proofCampaign = id;
    const p = S.proofOfPlay(c);
    const obj = window.LG_OBJECTIVES.find(o => o.id === c.objective);
    q('advCampaignDetail').innerHTML = `
      <div class="card__head">
        <div><h3 class="card__title">${A.esc(A.t('adv.detail_title'))} · <span class="mono">${A.esc(c.id)}</span></h3>
        <p class="card__sub">${A.esc(A.L(c.advertiser))} · ${A.esc(obj ? A.L(obj.label) : c.objective)} · ${A.esc(A.date(c.start))} → ${A.esc(A.date(c.end || S.util.addDays(c.start, c.days)))}</p></div>
        <div class="row">${A.statusPill(c.status)}
          ${c.aiUsed ? `<span class="pill pill--info">${A.esc(A.t('adv.ai_used'))}</span>` : ''}</div>
      </div>
      <div class="stat-grid">
        ${A.stat(A.t('measure.v1'), A.num(p.verified.plays), A.t('adv.of_scheduled', { n: A.num(p.verified.scheduledPlays) }))}
        ${A.stat(A.t('adv.kpi_uptime'), A.pct(p.verified.uptimePct, 1), A.t('adv.kpi_uptime_sub'), 'ok')}
        ${A.stat(A.t('measure.e4'), A.num(p.exposure.impressions), A.t('adv.kpi_imp_sub'))}
        ${A.stat(A.t('measure.g1'), A.num(p.engagement.scans), A.t('adv.kpi_scans_sub'))}
        ${A.stat(A.t('measure.g3'), A.num(p.engagement.redemptions), A.t('adv.kpi_red_sub'), 'ok')}
      </div>
      <div class="table-wrap" style="margin-top:18px"><table class="data data--compact">
        <thead><tr><th>${A.esc(A.t('loc.col_device'))}</th><th>${A.esc(A.t('adv.col_location'))}</th>
          <th class="num">${A.esc(A.t('adv.col_scheduled'))}</th><th class="num">${A.esc(A.t('adv.col_actual'))}</th>
          <th class="num">${A.esc(A.t('adv.kpi_uptime'))}</th><th class="num">${A.esc(A.t('adv.col_screens'))}</th>
          <th class="num">${A.esc(A.t('adv.col_errors'))}</th></tr></thead>
        <tbody>${p.rows.map(r => {
          const loc = S.location(r.locationId);
          return `<tr><td class="mono">${A.esc(r.deviceId)}</td>
            <td>${A.esc(loc ? A.L(loc.name) : r.locationId)}</td>
            <td class="num">${A.num(r.scheduled)}</td><td class="num">${A.num(r.actual)}</td>
            <td class="num">${A.num(r.uptime * 100, 1)}%</td><td class="num">${r.screenshots}</td>
            <td class="num">${r.errors}</td></tr>`;
        }).join('')}</tbody></table></div>
      <div class="card__foot row">
        <button class="btn btn--ghost btn--sm" type="button" data-goto="proof" data-i18n="adv.open_proof">Open proof-of-play report</button>
        <button class="btn btn--ghost btn--sm" type="button" data-goto="report" data-i18n="adv.open_report">Open full reporting</button>
      </div>`;
    q('advCampaignDetail').querySelectorAll('[data-goto]').forEach(b =>
      b.addEventListener('click', () => show(b.getAttribute('data-goto'))));
    populateSelectors();
    q('advCampaignDetail').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ---------- proof of play ---------------------------------------------- */
  function populateSelectors() {
    const opts = campaigns().map(c => `<option value="${c.id}">${A.esc(c.id)} · ${A.esc(A.L(c.advertiser))}</option>`).join('');
    [['advProofSelect', 'proofCampaign'], ['advReportSelect', 'reportCampaign']].forEach(([id, key]) => {
      const sel = q(id); if (!sel) return;
      const current = key === 'proofCampaign' ? proofCampaign : reportCampaign;
      sel.innerHTML = opts;
      const val = current || (campaigns()[0] && campaigns()[0].id);
      sel.value = val;
      if (key === 'proofCampaign') proofCampaign = val; else reportCampaign = val;
    });
  }

  function renderProof() {
    populateSelectors();
    const c = S.campaign(proofCampaign) || campaigns()[0];
    const out = q('advProofOut'); if (!out) return;
    if (!c) { out.innerHTML = `<p class="muted">${A.esc(A.t('adv.no_campaigns'))}</p>`; return; }
    proofCampaign = c.id; q('advProofSelect').value = c.id;
    const p = S.proofOfPlay(c);
    const log = S.util.seedFrom(c.id + 'log');
    const rows = Array.from({ length: 10 }, (_, i) => {
      const dev = p.rows[i % Math.max(1, p.rows.length)];
      const hour = 10 + (i % 12);
      const min = String(Math.floor(log() * 60)).padStart(2, '0');
      const ok = log() > 0.06;
      return {
        ts: `${c.start} ${String(hour).padStart(2, '0')}:${min}`,
        device: dev ? dev.deviceId : '—',
        content: (c.creative && c.creative.name) || 'creative.mp4',
        version: 'v' + (1 + Math.floor(log() * 2)) + '.0',
        status: ok ? 'played' : 'retry'
      };
    });
    out.innerHTML = `
      <div class="stat-grid" style="margin-bottom:16px">
        ${A.stat(A.t('measure.v1'), A.num(p.verified.plays), A.t('adv.of_scheduled', { n: A.num(p.verified.scheduledPlays) }))}
        ${A.stat(A.t('measure.v2'), A.pct(p.verified.completionPct, 1), A.t('adv.completion_sub'), 'ok')}
        ${A.stat(A.t('adv.kpi_active_devices'), A.num(p.verified.activeDevices) + ' / ' + A.num(p.verified.devices), '')}
        ${A.stat(A.t('adv.kpi_playtime'), A.num(p.verified.playSeconds / 3600, 1) + ' h', A.t('adv.kpi_playtime_sub'))}
      </div>
      <div class="table-wrap"><table class="data data--compact">
        <thead><tr><th>${A.esc(A.t('loc.col_device'))}</th><th>${A.esc(A.t('adv.col_location'))}</th>
          <th>${A.esc(A.t('adv.col_device_type'))}</th>
          <th class="num">${A.esc(A.t('adv.col_scheduled'))}</th><th class="num">${A.esc(A.t('adv.col_actual'))}</th>
          <th class="num">${A.esc(A.t('adv.kpi_uptime'))}</th><th class="num">${A.esc(A.t('adv.col_completion'))}</th>
          <th class="num">${A.esc(A.t('measure.e4'))}</th></tr></thead>
        <tbody>${p.rows.map(r => {
          const loc = S.location(r.locationId), t = window.LG_DEVICES[r.type];
          return `<tr><td class="mono">${A.esc(r.deviceId)}</td>
            <td>${A.esc(loc ? A.L(loc.name) : r.locationId)}</td>
            <td class="tiny">${A.esc(t ? t.sku : r.type)}</td>
            <td class="num">${A.num(r.scheduled)}</td><td class="num">${A.num(r.actual)}</td>
            <td class="num">${A.num(r.uptime * 100, 1)}%</td><td class="num">${A.num(r.completion * 100, 1)}%</td>
            <td class="num">${A.num(r.impressions)}</td></tr>`;
        }).join('')}</tbody></table></div>
      <h4 class="card__title" style="margin-top:20px;font-size:.95rem">${A.esc(A.t('adv.play_log'))}</h4>
      <p class="card__sub">${A.esc(A.t('adv.play_log_sub'))}</p>
      <div class="table-wrap" style="margin-top:10px"><table class="data data--compact">
        <thead><tr><th>${A.esc(A.t('adv.col_time'))}</th><th>${A.esc(A.t('loc.col_device'))}</th>
          <th>${A.esc(A.t('adv.col_content'))}</th><th>${A.esc(A.t('adv.col_version'))}</th>
          <th>${A.esc(A.t('adv.col_result'))}</th></tr></thead>
        <tbody>${rows.map(r => `<tr><td class="mono tiny">${A.esc(r.ts)}</td>
          <td class="mono tiny">${A.esc(r.device)}</td><td class="tiny">${A.esc(r.content)}</td>
          <td class="tiny">${A.esc(r.version)}</td>
          <td>${r.status === 'played' ? A.statusPill('live') : A.statusPill('pending')}</td></tr>`).join('')}</tbody></table></div>
      <p class="tiny muted" style="margin-top:10px">${A.esc(A.t('adv.proof_note'))}</p>`;
  }

  /* ---------- reporting --------------------------------------------------- */
  function renderReport() {
    populateSelectors();
    const c = S.campaign(reportCampaign) || campaigns()[0];
    const out = q('advReportOut'); if (!out) return;
    if (!c) { out.innerHTML = `<p class="muted">${A.esc(A.t('adv.no_campaigns'))}</p>`; return; }
    reportCampaign = c.id; q('advReportSelect').value = c.id;
    const p = S.proofOfPlay(c);
    const locBars = A.bars((c.locationIds || []).map(id => {
      const loc = S.location(id);
      const sub = p.rows.filter(r => r.locationId === id);
      return { label: loc ? A.L(loc.name) : id, value: sub.reduce((s, r) => s + r.actual, 0) };
    }), { valueFormat: v => A.num(v) });

    out.innerHTML = `
      <div class="grid grid--3">
        <div class="panel panel--accent">
          <span class="pill pill--ok">${A.esc(A.t('measure.verified'))}</span>
          <ul class="kpi-list" style="margin-top:12px">
            <li><span>${A.esc(A.t('measure.v1'))}</span><b>${A.num(p.verified.plays)}</b></li>
            <li><span>${A.esc(A.t('measure.v2'))}</span><b>${A.pct(p.verified.completionPct, 1)}</b></li>
            <li><span>${A.esc(A.t('measure.v3'))}</span><b>${A.num(p.verified.activeDevices)} / ${A.num(p.verified.devices)}</b></li>
            <li><span>${A.esc(A.t('adv.kpi_uptime'))}</span><b>${A.pct(p.verified.uptimePct, 1)}</b></li>
            <li><span>${A.esc(A.t('adv.kpi_playtime'))}</span><b>${A.num(p.verified.playSeconds / 3600, 1)} h</b></li>
          </ul>
        </div>
        <div class="panel">
          <span class="pill pill--info">${A.esc(A.t('measure.exposure'))}</span>
          <ul class="kpi-list" style="margin-top:12px">
            <li><span>${A.esc(A.t('measure.e1'))}</span><b>${A.num(p.exposure.footfall)}</b></li>
            <li><span>${A.esc(A.t('measure.e3'))}</span><b>${A.pct(p.exposure.visibilityMult, 0)}</b></li>
            <li><span>${A.esc(A.t('measure.e4'))}</span><b>${A.num(p.exposure.impressions)}</b></li>
            <li><span>${A.esc(A.t('adv.kpi_freq'))}</span><b>${A.num(p.exposure.avgFrequency, 2)}</b></li>
          </ul>
          <p class="tiny muted" style="margin:10px 0 0">${A.esc(A.t('adv.modelled_note'))}</p>
        </div>
        <div class="panel">
          <span class="pill pill--warn">${A.esc(A.t('measure.engagement'))}</span>
          <ul class="kpi-list" style="margin-top:12px">
            <li><span>${A.esc(A.t('measure.g1'))}</span><b>${A.num(p.engagement.scans)}</b></li>
            <li><span>${A.esc(A.t('adv.kpi_nfc'))}</span><b>${A.num(p.engagement.nfc)}</b></li>
            <li><span>${A.esc(A.t('measure.g2'))}</span><b>${A.num(p.engagement.pageViews)}</b></li>
            <li><span>${A.esc(A.t('measure.g3'))}</span><b>${A.num(p.engagement.claims)} / ${A.num(p.engagement.redemptions)}</b></li>
            <li><span>${A.esc(A.t('measure.g4'))}</span><b>${A.num(p.engagement.leads)}</b></li>
          </ul>
        </div>
      </div>
      <div class="grid grid--2" style="margin-top:20px">
        <div class="card"><h4 class="card__title" style="font-size:.95rem">${A.esc(A.t('adv.plays_by_location'))}</h4>${locBars}</div>
        <div class="card"><h4 class="card__title" style="font-size:.95rem">${A.esc(A.t('adv.funnel'))}</h4>
          ${A.bars([
            { label: A.t('measure.v1'), value: p.verified.plays },
            { label: A.t('measure.e4'), value: p.exposure.impressions },
            { label: A.t('measure.g1'), value: p.engagement.scans },
            { label: A.t('adv.kpi_nfc'), value: p.engagement.nfc },
            { label: A.t('measure.g3'), value: p.engagement.redemptions }
          ], { valueFormat: v => A.num(v) })}
          <p class="tiny muted" style="margin-top:10px">${A.esc(A.t('adv.funnel_note'))}</p>
        </div>
      </div>`;
  }

  /* ---------- invoices --------------------------------------------------- */
  function renderInvoices() {
    const bs = S.bookings();
    const seeded = window.LG_SEED_CAMPAIGNS.map((c, i) => ({
      id: 'INV-SEED-' + (1000 + i), created: c.created, spend: c.spend,
      campaign: c.id, status: i === 0 ? 'paid' : 'paid'
    }));
    const rows = bs.map(b => ({
      id: b.invoice, created: b.created.slice(0, 10), spend: b.totals.total,
      campaign: b.lines.map(l => l.locationId).join(', '), status: 'paid', booking: b.id
    })).concat(seeded);
    q('advInvoiceTable').innerHTML = `<thead><tr>
        <th>${A.esc(A.t('adv.col_invoice'))}</th><th>${A.esc(A.t('adv.col_date'))}</th>
        <th>${A.esc(A.t('adv.col_campaign'))}</th><th class="num">${A.esc(A.t('adv.col_amount'))}</th>
        <th>${A.esc(A.t('adv.col_status'))}</th><th></th></tr></thead>
      <tbody>${rows.map(r => `<tr>
        <td class="mono tiny">${A.esc(r.id)}</td><td>${A.esc(A.date(r.created))}</td>
        <td class="tiny">${A.esc(r.campaign)}</td><td class="num">${A.money(r.spend)}</td>
        <td>${A.statusPill('paid')}</td>
        <td><button class="btn btn--quiet btn--sm" type="button" data-print="1" data-i18n="co.print">Print invoice</button></td>
      </tr>`).join('')}
      ${rows.length ? '' : `<tr><td colspan="6" class="muted">${A.esc(A.t('adv.no_invoices'))}</td></tr>`}
      </tbody>`;
    q('advInvoiceTable').querySelectorAll('[data-print]').forEach(b =>
      b.addEventListener('click', () => { A.toast(A.t('adv.print_hint'), 'ok'); window.print(); }));
  }

  /* ---------- exports ---------------------------------------------------- */
  function exportCampaigns() {
    const rows = [[
      A.t('adv.col_id'), A.t('adv.col_campaign'), A.t('adv.col_objective'), A.t('adv.col_locations'),
      A.t('adv.col_window'), 'SOV %', A.t('adv.col_spend'), A.t('adv.col_status'), A.t('adv.col_approval')
    ]].concat(campaigns().map(c => [
      c.id, A.L(c.advertiser), c.objective, c.locationIds.join(' | '),
      c.start + ' → ' + (c.end || S.util.addDays(c.start, c.days)), c.sov, c.spend, c.status, c.approval || ''
    ]));
    A.downloadCSV('3dNakedEye-campaigns.csv', rows);
  }

  function exportProof() {
    const c = S.campaign(proofCampaign) || campaigns()[0];
    if (!c) return;
    const p = S.proofOfPlay(c);
    const rows = [['campaign', 'device', 'location', 'scheduled', 'actual', 'uptime', 'completion', 'impressions']]
      .concat(p.rows.map(r => [c.id, r.deviceId, r.locationId, r.scheduled, r.actual,
        (r.uptime * 100).toFixed(2), (r.completion * 100).toFixed(2), r.impressions]));
    A.downloadCSV('3dNakedEye-proof-of-play-' + c.id + '.csv', rows);
  }

  function exportInvoices() {
    const rows = [[A.t('adv.col_invoice'), A.t('adv.col_date'), A.t('adv.col_amount'), A.t('adv.col_status')]]
      .concat(S.bookings().map(b => [b.invoice, b.created.slice(0, 10), b.totals.total, 'paid']));
    A.downloadCSV('3dNakedEye-invoices.csv', rows);
  }

  /* ---------- init ------------------------------------------------------- */
  function renderAll() {
    renderOverview(); renderCampaigns(); renderInvoices();
    populateSelectors(); renderProof(); renderReport();
  }

  document.addEventListener('DOMContentLoaded', () => {
    q('advNav').addEventListener('click', e => {
      const b = e.target.closest('button'); if (b) show(b.getAttribute('data-sec'));
    });
    document.querySelectorAll('[data-goto]').forEach(b =>
      b.addEventListener('click', () => show(b.getAttribute('data-goto'))));
    q('advProofSelect').addEventListener('change', e => { proofCampaign = e.target.value; renderProof(); });
    q('advReportSelect').addEventListener('change', e => { reportCampaign = e.target.value; renderReport(); });
    q('advExportCampaigns').addEventListener('click', exportCampaigns);
    q('advExportProof').addEventListener('click', exportProof);
    q('advExportInvoices').addEventListener('click', exportInvoices);
    renderAll();
  });
  A.onLangChange(renderAll);
})();
