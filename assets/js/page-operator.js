/* 3dNakedEye — page-operator.js : platform operator console */
(function () {
  'use strict';
  const S = window.LG.store, A = window.LG.app, CFG = window.LG_CONFIG;
  const q = id => document.getElementById(id);
  let deviceFilter = 'all';

  /* ---------- navigation -------------------------------------------------- */
  function show(sec) {
    document.querySelectorAll('#opNav button').forEach(b =>
      b.classList.toggle('is-active', b.getAttribute('data-sec') === sec));
    ['overview', 'verify', 'moderate', 'devices', 'billing', 'coupons', 'audit']
      .forEach(s => q('sec-' + s).classList.toggle('is-active', s === sec));
  }

  const allDevices = () => S.locations().reduce((acc, l) => {
    l.devices.forEach(d => acc.push({ loc: l, dev: d })); return acc;
  }, []);

  /* ---------- overview --------------------------------------------------- */
  function renderOverview() {
    const locs = S.locations();
    const devs = allDevices();
    const online = devs.filter(x => x.dev.online).length;
    const live = S.campaigns().filter(c => c.status === 'live').length;
    const gmv = S.campaigns().reduce((s, c) => s + (c.spend || 0), 0);
    const payable = S.ledger().reduce((s, x) => s + (x.share || Math.round(x.gross * S.state.split.landlord)), 0);
    const tickets = S.maintenance().filter(m => m.status !== 'resolved').length;
    const pendingLoc = locs.filter(l => !l.verified).length;
    const pendingApp = S.approvals().filter(a => a.status === 'pending').length;

    q('opKpis').innerHTML =
      A.stat(A.t('op.kpi_locations'), A.num(locs.length), A.t('op.kpi_locations_sub', { n: pendingLoc }), 'brand') +
      A.stat(A.t('op.kpi_devices'), A.num(online) + ' / ' + A.num(devs.length), A.t('op.kpi_devices_sub'),
        online === devs.length ? 'ok' : 'warn') +
      A.stat(A.t('op.kpi_live'), A.num(live), A.t('op.kpi_live_sub', { n: S.campaigns().length })) +
      A.stat(A.t('op.kpi_gmv'), A.money(gmv), A.t('op.kpi_gmv_sub')) +
      A.stat(A.t('op.kpi_payable'), A.money(payable), A.t('op.kpi_payable_sub'), 'warn') +
      A.stat(A.t('op.kpi_tickets'), A.num(tickets), A.t('op.kpi_tickets_sub'), tickets ? 'bad' : 'ok') +
      A.stat(A.t('op.kpi_approvals'), A.num(pendingApp), A.t('op.kpi_approvals_sub'), pendingApp ? 'warn' : 'ok');

    const byDistrict = {};
    devs.forEach(x => { byDistrict[x.loc.district] = (byDistrict[x.loc.district] || 0) + 1; });
    q('opDistrictBars').innerHTML = A.bars(Object.keys(byDistrict).map(k => ({
      label: A.L(S.district(k).label), value: byDistrict[k]
    })), { valueFormat: v => A.num(v) + ' ' + A.t('stat.devices') });

    const alerts = [];
    devs.filter(x => !x.dev.online).forEach(x => alerts.push({
      tone: 'bad', title: A.t('op.alert_offline', { id: x.dev.id }), body: A.L(x.loc.name)
    }));
    S.maintenance().filter(m => m.priority === 'high' && m.status !== 'resolved').forEach(m =>
      alerts.push({ tone: 'warn', title: A.t('op.alert_ticket', { id: m.id }), body: A.L(m.issue) }));
    locs.filter(l => l.bookedPct >= 85).forEach(l => alerts.push({
      tone: 'info', title: A.t('op.alert_saturation', { pct: l.bookedPct }), body: A.L(l.name)
    }));
    q('opAlerts').innerHTML = alerts.length
      ? `<ul class="kpi-list">${alerts.map(a => `<li>
          <span>${A.esc(a.title)}<br><span class="tiny muted">${A.esc(a.body)}</span></span>
          <span class="pill pill--${a.tone === 'bad' ? 'bad' : a.tone === 'warn' ? 'warn' : 'info'}">${A.esc(A.t('op.' + a.tone))}</span></li>`).join('')}</ul>`
      : `<p class="muted small" style="margin:0">${A.esc(A.t('op.no_alerts'))}</p>`;

    const byMonth = {};
    S.ledger().forEach(x => { byMonth[x.period] = (byMonth[x.period] || 0) + x.gross; });
    const months = Object.keys(byMonth).sort();
    q('opGmv').innerHTML = months.length
      ? A.bars(months.map(m => ({ label: m, value: byMonth[m] })), { valueFormat: v => A.money(v) })
      : `<p class="muted small">${A.esc(A.t('op.no_gmv'))}</p>`;
  }

  /* ---------- verification ---------------------------------------------- */
  function renderVerify() {
    const pending = S.locations().filter(l => !l.verified);
    q('opVerifyCount').textContent = A.t('ll.n_pending', { n: pending.length });
    q('opVerify').innerHTML = pending.length ? pending.map(l => `
      <div class="card">
        <div class="row row--between" style="align-items:flex-start">
          <div>
            <div class="row" style="gap:8px;margin-bottom:6px">
              <span class="pill pill--warn">${A.esc(A.t('badge.pending'))}</span>
              <span class="chip mono">${A.esc(l.id)}</span>
              <span class="chip">${A.esc(A.L(S.venue(l.venue).label))}</span>
              <span class="chip">${A.esc(A.L(S.district(l.district).label))}</span>
            </div>
            <h3 class="card__title" style="margin:0 0 4px">${A.esc(A.L(l.name))}</h3>
            <p class="card__sub">${A.esc(A.L(l.address))} · ${A.esc(A.L(l.landlord))}</p>
          </div>
          <div class="row">
            <button class="btn btn--ok btn--sm" type="button" data-verify="${l.id}">${A.esc(A.t('op.approve_loc'))}</button>
            <button class="btn btn--danger btn--sm" type="button" data-rejectloc="${l.id}">${A.esc(A.t('op.reject_loc'))}</button>
          </div>
        </div>
        <div class="grid grid--2" style="margin-top:14px">
          <ul class="kpi-list">
            <li><span>${A.esc(A.t('ll.f_footfall'))}</span><b>${A.num(l.footfallPerDay)}</b></li>
            <li><span>${A.esc(A.t('ll.f_dwell'))}</span><b>${A.num(l.dwellSec)} s</b></li>
            <li><span>${A.esc(A.t('ll.f_visibility'))}</span><b>${A.num(l.visibility, 2)}</b></li>
            <li><span>${A.esc(A.t('op.checklist_minprice'))}</span><b>${A.money(l.minPrice || 0)}</b></li>
          </ul>
          <ul class="checklist">
            ${['survey', 'power', 'network', 'safety', 'authority'].map(k => `<li>
              <span class="mark mark--${k === 'safety' ? 'warn' : 'pass'}">${k === 'safety' ? '!' : '✓'}</span>
              <span>${A.esc(A.t('op.v_' + k))}</span>
              <span class="tiny muted">${A.esc(A.t('op.v_' + k + '_v'))}</span></li>`).join('')}
          </ul>
        </div>
      </div>`).join('')
      : `<div class="empty"><p style="margin:0">${A.esc(A.t('op.nothing_verify'))}</p></div>`;

    q('opVerify').querySelectorAll('[data-verify]').forEach(b => b.addEventListener('click', () => {
      const id = b.getAttribute('data-verify');
      S.updateLocation(id, { verified: true, status: 'live' });
      A.toast(A.t('op.toast_verified', { id }), 'ok'); renderAll();
    }));
    q('opVerify').querySelectorAll('[data-rejectloc]').forEach(b => b.addEventListener('click', () => {
      const id = b.getAttribute('data-rejectloc');
      S.updateLocation(id, { status: 'paused' });
      A.toast(A.t('op.toast_loc_rejected', { id }), 'warn'); renderAll();
    }));

    q('opDeviceRegister').innerHTML = `<thead><tr>
        <th>${A.esc(A.t('loc.col_device'))}</th><th>${A.esc(A.t('ll.col_loc'))}</th>
        <th>${A.esc(A.t('ll.col_type'))}</th><th>${A.esc(A.t('op.col_position'))}</th>
        <th>${A.esc(A.t('ll.col_status'))}</th><th class="num">${A.esc(A.t('adv.kpi_uptime'))}</th></tr></thead>
      <tbody>${allDevices().map(({ loc, dev }) => `<tr>
        <td class="mono tiny">${A.esc(dev.id)}</td>
        <td class="tiny">${A.esc(A.L(loc.name))}</td>
        <td class="tiny">${A.esc(window.LG_DEVICES[dev.type].sku)}</td>
        <td class="tiny">${A.esc(A.L(dev.position))}</td>
        <td>${dev.online ? A.statusPill('live') : A.statusPill('offline')}</td>
        <td class="num">${A.num(dev.uptime, 1)}%</td></tr>`).join('')}</tbody>`;
  }

  /* ---------- moderation ------------------------------------------------- */
  function renderModerate() {
    const pending = S.campaigns().filter(c => c.status === 'in_review');
    q('opModerate').innerHTML = pending.length ? pending.map(c => {
      const obj = window.LG_OBJECTIVES.find(o => o.id === c.objective);
      const checks = [
        { k: 'holo', ok: c.creative && c.creative.form !== 'hologram' ? 'skip' : 'pass' },
        { k: 'regulatory', ok: 'pass' },
        { k: 'venue', ok: 'pass' },
        { k: 'duplicate', ok: 'pass' },
        { k: 'claim', ok: 'warn' },
        { k: 'ai_disclosure', ok: c.aiUsed ? 'warn' : 'skip' }
      ];
      return `<div class="card">
        <div class="row row--between" style="align-items:flex-start">
          <div>
            <div class="row" style="gap:8px;margin-bottom:6px">
              ${A.statusPill('in_review')}<span class="chip mono">${A.esc(c.id)}</span>
              ${c.aiUsed ? `<span class="pill pill--info">${A.esc(A.t('adv.ai_used'))}</span>` : ''}
            </div>
            <h3 class="card__title" style="margin:0 0 4px">${A.esc(A.L(c.advertiser))}</h3>
            <p class="card__sub">${A.esc(obj ? A.L(obj.label) : c.objective)} · ${(c.locationIds || []).map(id => {
              const l = S.location(id); return A.esc(l ? A.L(l.name) : id);
            }).join(' · ')}</p>
          </div>
          <div class="row">
            <button class="btn btn--ok btn--sm" type="button" data-modok="${c.id}">${A.esc(A.t('op.approve_campaign'))}</button>
            <button class="btn btn--danger btn--sm" type="button" data-modno="${c.id}">${A.esc(A.t('op.reject_campaign'))}</button>
          </div>
        </div>
        <ul class="checklist" style="margin-top:14px">
          ${checks.map(x => `<li><span class="mark mark--${x.ok}">${x.ok === 'pass' ? '✓' : x.ok === 'warn' ? '!' : '–'}</span>
            <span><b>${A.esc(A.t('op.mod_' + x.k))}</b> — ${A.esc(A.t('op.mod_' + x.k + '_d'))}</span>
            <span class="tiny muted">${A.esc(A.t('op.mod_' + x.k + '_v'))}</span></li>`).join('')}
        </ul>
      </div>`;
    }).join('') : `<div class="empty"><p style="margin:0">${A.esc(A.t('op.nothing_moderate'))}</p></div>`;

    q('opModerate').querySelectorAll('[data-modok]').forEach(b => b.addEventListener('click', () => {
      const id = b.getAttribute('data-modok');
      S.updateCampaign(id, { status: 'scheduled', approval: 'approved' });
      A.toast(A.t('op.toast_approved', { id }), 'ok'); renderAll();
    }));
    q('opModerate').querySelectorAll('[data-modno]').forEach(b => b.addEventListener('click', () => {
      const id = b.getAttribute('data-modno');
      S.updateCampaign(id, { status: 'rejected', approval: 'rejected' });
      A.toast(A.t('op.toast_rejected', { id }), 'warn'); renderAll();
    }));
  }

  /* ---------- devices ---------------------------------------------------- */
  function renderDevices() {
    const rows = allDevices().filter(x =>
      deviceFilter === 'all' ? true : deviceFilter === 'online' ? x.dev.online : !x.dev.online);
    q('opDeviceTable').innerHTML = `<thead><tr>
        <th>${A.esc(A.t('loc.col_device'))}</th><th>${A.esc(A.t('ll.col_loc'))}</th>
        <th>${A.esc(A.t('ll.col_type'))}</th><th>${A.esc(A.t('ll.col_status'))}</th>
        <th class="num">${A.esc(A.t('adv.kpi_uptime'))}</th><th>${A.esc(A.t('op.col_content'))}</th>
        <th>${A.esc(A.t('op.col_errors'))}</th><th></th></tr></thead>
      <tbody>${rows.map(({ loc, dev }) => {
        const camp = S.campaigns().find(c => c.locationIds.includes(loc.id) && (c.deviceIds ? c.deviceIds.includes(dev.id) : true));
        const rnd = S.util.seedFrom(dev.id);
        const errs = Math.floor(rnd() * 3);
        return `<tr>
          <td class="mono tiny">${A.esc(dev.id)}</td>
          <td class="tiny">${A.esc(A.L(loc.name))}</td>
          <td class="tiny">${A.esc(window.LG_DEVICES[dev.type].sku)}</td>
          <td>${dev.online ? A.statusPill('live') : A.statusPill('offline')}</td>
          <td class="num">${A.num(dev.uptime, 1)}%</td>
          <td class="tiny">${A.esc(camp && camp.creative ? camp.creative.name : A.t('op.house_content'))}
            <div class="tiny muted">v${1 + Math.floor(rnd() * 3)}.0</div></td>
          <td class="tiny">${errs ? `<span class="pill pill--warn">${errs}</span>` : `<span class="pill pill--ok">0</span>`}</td>
          <td><button class="btn btn--ghost btn--sm" type="button" data-sync="${dev.id}">${A.esc(A.t('op.sync'))}</button></td>
        </tr>`;
      }).join('')}</tbody>`;
    q('opDeviceTable').querySelectorAll('[data-sync]').forEach(b => b.addEventListener('click', () => {
      A.toast(A.t('op.toast_sync', { id: b.getAttribute('data-sync') }), 'ok');
    }));

    const health = allDevices().map(({ dev }) => ({ label: dev.id, value: Math.round(dev.uptime * 10) / 10 }));
    q('opPlaybackHealth').innerHTML = A.bars(health.slice(0, 12), { valueFormat: v => A.num(v, 1) + '%' }) +
      `<p class="tiny muted" style="margin-top:10px">${A.esc(A.t('op.health_note'))}</p>`;
  }

  /* ---------- billing ---------------------------------------------------- */
  function renderBilling() {
    const led = S.ledger();
    const share = x => x.share || Math.round(x.gross * S.state.split.landlord);
    const gross = led.reduce((s, x) => s + x.gross, 0);
    const payable = led.reduce((s, x) => s + share(x), 0);
    const paid = led.filter(x => x.status === 'paid').reduce((s, x) => s + share(x), 0);
    q('opBillingKpis').innerHTML =
      A.stat(A.t('op.kpi_gmv'), A.money(gross), A.t('op.kpi_gmv_sub'), 'brand') +
      A.stat(A.t('op.kpi_payable'), A.money(payable), A.t('op.kpi_payable_sub'), 'warn') +
      A.stat(A.t('ll.kpi_paid'), A.money(paid), A.t('ll.kpi_paid_sub'), 'ok') +
      A.stat(A.t('share.platform'), A.money(gross * S.state.split.platform), A.t('op.platform_fee_sub')) +
      A.stat(A.t('share.ai'), A.money(gross * S.state.split.ai), A.t('op.ai_fee_sub')) +
      A.stat(A.t('share.sales'), A.money(gross * S.state.split.sales), A.t('op.sales_fee_sub'));

    q('opLedgerTable').innerHTML = `<thead><tr>
        <th>${A.esc(A.t('ll.col_stmt'))}</th><th>${A.esc(A.t('ll.col_period'))}</th>
        <th>${A.esc(A.t('ll.col_landlord'))}</th><th class="num">${A.esc(A.t('ll.col_gross'))}</th>
        <th class="num">${A.esc(A.t('ll.your_share'))}</th><th class="num">${A.esc(A.t('measure.v1'))}</th>
        <th>${A.esc(A.t('ll.col_status'))}</th></tr></thead>
      <tbody>${led.map(x => `<tr>
        <td class="mono tiny">${A.esc(x.id)}</td><td>${A.esc(x.period)}</td>
        <td class="tiny">${A.esc(x.landlord ? A.L(x.landlord) : '—')}</td>
        <td class="num">${A.money(x.gross)}</td><td class="num"><strong>${A.money(share(x))}</strong></td>
        <td class="num">${A.num(x.plays)}</td>
        <td>${A.statusPill(x.status === 'paid' ? 'paid' : x.status === 'accruing' ? 'accruing' : 'pending')}</td></tr>`).join('')}</tbody>`;

    const sp = S.state.split;
    q('opSplitSliders').innerHTML = ['landlord', 'platform', 'ai', 'sales'].map(k => `
      <div class="range-row" style="margin-bottom:12px">
        <label for="sp_${k}">${A.esc(A.t('share.' + k))} — <span data-out="${k}">${Math.round(sp[k] * 100)}%</span></label>
        <input type="range" id="sp_${k}" min="0" max="60" step="1" value="${Math.round(sp[k] * 100)}">
      </div>`).join('') + `<div class="row"><span class="pill${Math.round((sp.landlord + sp.platform + sp.ai + sp.sales) * 100) === 100 ? ' pill--ok' : ' pill--bad'}" id="spTotal">
        ${A.esc(A.t('op.split_total'))}: ${Math.round((sp.landlord + sp.platform + sp.ai + sp.sales) * 100)}%</span>
        <button class="btn btn--primary btn--sm" type="button" id="spSave" ${Math.round((sp.landlord + sp.platform + sp.ai + sp.sales) * 100) === 100 ? '' : 'disabled'}>${A.esc(A.t('ll.save'))}</button></div>`;

    ['landlord', 'platform', 'ai', 'sales'].forEach(k => {
      q('sp_' + k).addEventListener('input', e => {
        const v = parseInt(e.target.value, 10);
        q('[data-out="' + k + '"]').textContent = v + '%';
        const total = ['landlord', 'platform', 'ai', 'sales'].reduce((s, kk) => s + (kk === k ? v : parseInt(q('sp_' + kk).value, 10)), 0);
        const pill = q('spTotal');
        pill.textContent = A.t('op.split_total') + ': ' + total + '%';
        pill.className = 'pill ' + (total === 100 ? 'pill--ok' : 'pill--bad');
        q('spSave').disabled = total !== 100;
      });
    });
    q('spSave').addEventListener('click', () => {
      const next = {};
      ['landlord', 'platform', 'ai', 'sales'].forEach(k => { next[k] = parseInt(q('sp_' + k).value, 10) / 100; });
      S.setSplit(next);
      A.toast(A.t('op.toast_split'), 'ok');
      renderAll();
    });

    q('opSplitDonut').innerHTML = A.donut(Object.keys(sp).map((k, i) => ({
      label: A.t('share.' + k), value: sp[k] * 1000,
      color: ['#7a6bff', '#35d0ff', '#ff5fa2', '#34d399'][i]
    })), { center: A.pct(sp.landlord, 0), centerSub: A.t('share.landlord'), label: A.t('op.split_title') });
  }

  /* ---------- coupons ---------------------------------------------------- */
  function renderCoupons() {
    const rows = S.campaigns().filter(c => c.objective === 'coupon' || c.status === 'live').slice(0, 8);
    q('opCouponTable').innerHTML = `<thead><tr>
        <th>${A.esc(A.t('adv.col_campaign'))}</th><th>${A.esc(A.t('op.col_code'))}</th>
        <th>${A.esc(A.t('op.col_landing'))}</th>
        <th class="num">${A.esc(A.t('measure.g1'))}</th><th class="num">${A.esc(A.t('op.col_claims'))}</th>
        <th class="num">${A.esc(A.t('op.col_redeemed'))}</th><th class="num">${A.esc(A.t('op.col_rate'))}</th></tr></thead>
      <tbody>${rows.map(c => {
        const p = S.proofOfPlay(c);
        const code = 'LG-' + c.id.slice(-4) + '-' + (c.sov);
        return `<tr>
          <td class="tiny">${A.esc(A.L(c.advertiser))}<div class="tiny muted mono">${A.esc(c.id)}</div></td>
          <td class="mono tiny">${A.esc(code)}</td>
          <td class="tiny"><a href="#" onclick="return false">3dnakedeye.example/r/${A.esc(code)}</a></td>
          <td class="num">${A.num(p.engagement.scans)}</td>
          <td class="num">${A.num(p.engagement.claims)}</td>
          <td class="num">${A.num(p.engagement.redemptions)}</td>
          <td class="num">${p.engagement.scans ? A.pct(p.engagement.redemptions / p.engagement.scans, 1) : '—'}</td>
        </tr>`;
      }).join('')}</tbody>
      <caption class="tiny muted" style="caption-side:bottom;text-align:left;padding:10px">${A.esc(A.t('op.coupon_note'))}</caption>`;
  }

  /* ---------- audit + roles ---------------------------------------------- */
  function renderAudit() {
    const log = [];
    S.approvals().slice(0, 4).forEach(a => log.push({
      when: a.decided || a.created,
      title: A.t('op.log_approval', { status: A.t('status.' + (a.status === 'pending' ? 'pending' : a.status)) }),
      body: (a.landlord ? A.L(a.landlord) : '') + ' · ' + (S.location(a.locationId) ? A.L(S.location(a.locationId).name) : a.locationId)
    }));
    S.campaigns().slice(0, 3).forEach(c => log.push({
      when: c.created, title: A.t('op.log_campaign', { status: A.t('status.' + c.status) }),
      body: A.L(c.advertiser) + ' · ' + c.id
    }));
    S.ledger().slice(0, 3).forEach(x => log.push({
      when: x.period + '-28', title: A.t('op.log_settlement', { amount: A.money(x.share || Math.round(x.gross * S.state.split.landlord)) }),
      body: (x.landlord ? A.L(x.landlord) : '') + ' · ' + x.id
    }));
    S.maintenance().slice(0, 2).forEach(m => log.push({
      when: m.opened, title: A.t('op.log_ticket', { id: m.id }), body: A.L(m.issue)
    }));
    q('opAudit').innerHTML = log
      .sort((a, b) => String(b.when).localeCompare(String(a.when)))
      .map(x => `<li><time>${A.esc(x.when)}</time><h4>${A.esc(x.title)}</h4><p>${A.esc(x.body)}</p></li>`).join('');

    const roles = [
      ['advertiser', 'user, campaign:create, booking:pay, report:read'],
      ['landlord', 'location:create, device:manage, campaign:approve, statement:read'],
      ['operator', 'inventory:verify, campaign:moderate, schedule:write, settlement:run'],
      ['finance', 'settlement:run, invoice:write, report:read'],
      ['admin', '*']
    ];
    q('opRoles').innerHTML = `<thead><tr><th>${A.esc(A.t('op.col_role'))}</th><th>${A.esc(A.t('op.col_perms'))}</th></tr></thead>
      <tbody>${roles.map(r => `<tr><td class="mono tiny">${A.esc(r[0])}</td><td class="tiny">${A.esc(r[1])}</td></tr>`).join('')}</tbody>`;
  }

  /* ---------- init ------------------------------------------------------- */
  function renderAll() {
    renderOverview(); renderVerify(); renderModerate(); renderDevices();
    renderBilling(); renderCoupons(); renderAudit();
  }

  document.addEventListener('DOMContentLoaded', () => {
    q('opNav').addEventListener('click', e => {
      const b = e.target.closest('button'); if (b) show(b.getAttribute('data-sec'));
    });
    q('opDeviceFilter').addEventListener('change', e => { deviceFilter = e.target.value; renderDevices(); });
    q('opResync').addEventListener('click', () => A.toast(A.t('op.toast_resync'), 'ok'));
    q('opSettle').addEventListener('click', () => {
      let n = 0;
      S.ledger().forEach(x => { if (x.status !== 'paid') { x.status = 'paid'; n++; } });
      S.save();
      A.toast(A.t('op.toast_settled', { n }), 'ok');
      renderAll();
    });
    q('opReset').addEventListener('click', () => {
      S.reset();
      A.toast(A.t('op.toast_reset'), 'warn');
      renderAll();
    });
    q('opExportLedger').addEventListener('click', () => {
      const rows = [['statement', 'period', 'landlord', 'gross', 'share', 'plays', 'status']]
        .concat(S.ledger().map(x => [x.id, x.period, x.landlord ? A.L(x.landlord) : '', x.gross,
          x.share || Math.round(x.gross * S.state.split.landlord), x.plays, x.status]));
      A.downloadCSV('3dNakedEye-ledger.csv', rows);
    });
    renderAll();
  });
  A.onLangChange(renderAll);
})();
