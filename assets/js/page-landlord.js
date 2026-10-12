/* 3dNakedEye — page-landlord.js : landlord / location-owner portal */
(function () {
  'use strict';
  const S = window.LG.store, A = window.LG.app, CFG = window.LG_CONFIG;
  const q = id => document.getElementById(id);
  const MY = 'Harbour'; /* demo landlord identity — matches the seeded portfolio */
  let scheduleLoc = null, setLoc = null;

  const mine = () => S.locations().filter(l =>
    l.owner === 'me' || (l.landlord && String(l.landlord.en || '').indexOf(MY) === 0));
  const mineIds = () => mine().map(l => l.id);
  const myLedger = () => S.ledger().filter(s => !s.landlordId || mineIds().includes(s.landlordId) ||
    (s.landlord && String(s.landlord.en || '').indexOf(MY) === 0));

  /* ---------- navigation -------------------------------------------------- */
  function show(sec) {
    document.querySelectorAll('#llNav button').forEach(b =>
      b.classList.toggle('is-active', b.getAttribute('data-sec') === sec));
    ['overview', 'register', 'approvals', 'schedule', 'devices', 'earnings', 'notices', 'settings']
      .forEach(s => q('sec-' + s).classList.toggle('is-active', s === sec));
    if (sec === 'schedule') renderSchedule();
    if (sec === 'settings') renderSettings();
  }

  /* ---------- overview --------------------------------------------------- */
  function renderOverview() {
    const locs = mine();
    const devices = locs.reduce((s, l) => s + l.devices.length, 0);
    const online = locs.reduce((s, l) => s + l.devices.filter(d => d.online).length, 0);
    const led = myLedger();
    const accrued = led.reduce((s, x) => s + (x.share || Math.round(x.gross * S.state.split.landlord)), 0);
    const paid = led.filter(x => x.status === 'paid')
      .reduce((s, x) => s + (x.share || Math.round(x.gross * S.state.split.landlord)), 0);
    const occupancy = locs.length ? locs.reduce((s, l) => s + l.bookedPct, 0) / locs.length : 0;
    const pending = S.approvals().filter(a => a.status === 'pending' && mineIds().includes(a.locationId));

    q('llKpis').innerHTML =
      A.stat(A.t('ll.kpi_accrued'), A.money(accrued), A.t('ll.kpi_accrued_sub', { n: led.length }), 'brand') +
      A.stat(A.t('ll.kpi_paid'), A.money(paid), A.t('ll.kpi_paid_sub')) +
      A.stat(A.t('ll.kpi_devices'), A.num(online) + ' / ' + A.num(devices), A.t('ll.kpi_devices_sub'), online === devices ? 'ok' : 'warn') +
      A.stat(A.t('ll.kpi_occupancy'), A.pct(occupancy / 100, 0), A.t('ll.kpi_occupancy_sub')) +
      A.stat(A.t('ll.kpi_locations'), A.num(locs.length), A.t('ll.kpi_locations_sub')) +
      A.stat(A.t('ll.kpi_pending'), A.num(pending.length), A.t('ll.kpi_pending_sub'), pending.length ? 'warn' : 'ok');

    /* revenue by month */
    const byMonth = {};
    led.forEach(x => { byMonth[x.period] = (byMonth[x.period] || 0) + (x.share || Math.round(x.gross * S.state.split.landlord)); });
    const months = Object.keys(byMonth).sort();
    q('llTrend').innerHTML = months.length
      ? A.bars(months.map(m => ({ label: m, value: byMonth[m] })), { valueFormat: v => A.money(v) }) +
        `<p class="tiny muted" style="margin-top:10px">${A.esc(A.t('ll.trend_note', { pct: A.pct(S.state.split.landlord, 0) }))}</p>`
      : `<p class="muted small">${A.esc(A.t('ll.no_earnings'))}</p>`;

    q('llPendingShort').innerHTML = pending.length
      ? `<ul class="kpi-list">${pending.map(a => {
          const c = S.campaign(a.campaignId), loc = S.location(a.locationId);
          return `<li><span>${A.esc(c ? A.L(c.advertiser) : a.campaignId)}<br>
            <span class="tiny muted">${A.esc(loc ? A.L(loc.name) : a.locationId)}</span></span>
            <button class="btn btn--primary btn--sm" type="button" data-goto="approvals">${A.esc(A.t('ll.review'))}</button></li>`;
        }).join('')}</ul>`
      : `<p class="muted small" style="margin:0">${A.esc(A.t('ll.no_pending'))}</p>`;
    q('llPendingShort').querySelectorAll('[data-goto]').forEach(b =>
      b.addEventListener('click', () => show(b.getAttribute('data-goto'))));

    const acts = [];
    led.slice(0, 3).forEach(x => acts.push({
      when: x.period, title: A.t('ll.act_accrual', { amount: A.money(x.share || Math.round(x.gross * S.state.split.landlord)) }),
      body: A.t('ll.act_accrual_body', { plays: A.num(x.plays), landlord: x.landlord ? A.L(x.landlord) : '—' })
    }));
    S.maintenance().filter(m => mineIds().includes(m.locationId)).slice(0, 2).forEach(m => acts.push({
      when: m.opened, title: A.t('ll.act_ticket', { id: m.id }), body: A.L(m.issue)
    }));
    S.notices().slice(0, 2).forEach(n => acts.push({
      when: n.created, title: A.t('ll.act_notice'), body: n.text
    }));
    q('llActivity').innerHTML = `<ol class="timeline">${acts.map(a => `<li>
      <time>${A.esc(a.when)}</time><h4>${A.esc(a.title)}</h4><p>${A.esc(a.body)}</p></li>`).join('')}</ol>`;
  }

  /* ---------- register + my locations ------------------------------------ */
  function populateFormSelects() {
    /* market select, then districts belonging to that market */
    const mSel = q('llMarket');
    if (mSel) {
      const cur = mSel.value || A.market || (A.CFG.geo && A.CFG.geo.defaultMarket) || 'hk';
      mSel.innerHTML = A.markets().map(m => `<option value="${m.id}">${A.esc(A.t('market.' + m.id))}</option>`).join('');
      mSel.value = A.markets().some(m => m.id === cur) ? cur : (A.CFG.geo.defaultMarket || 'hk');
    }
    const mkt = (mSel && mSel.value) || A.market;
    q('llDistrict').innerHTML = S.districts()
      .filter(d => (d.market || (A.CFG.geo && A.CFG.geo.defaultMarket)) === mkt)
      .map(d => `<option value="${d.id}">${A.esc(A.L(d.label))}</option>`).join('');

    if (q('llVenue').options.length === 0) {
      q('llVenue').innerHTML = window.LG_VENUES.map(v => `<option value="${v.id}">${A.esc(A.L(v.label))}</option>`).join('');
      q('llDevice').innerHTML = Object.keys(window.LG_DEVICES).map(k => {
        const t = window.LG_DEVICES[k];
        return `<option value="${k}" ${k === 'holo_p65yd' ? 'selected' : ''}>${A.esc(t.sku)} · ${A.esc(A.L(t.label))}</option>`;
      }).join('');
      q('llRestrict').innerHTML = window.LG_CATEGORIES.map(c =>
        `<label class="check"><input type="checkbox" value="${c.id}"><span>${A.esc(A.L(c.label))}</span></label>`).join('');
    } else {
      Array.from(q('llVenue').options).forEach(o => { o.textContent = A.L(S.venue(o.value).label); });
      Array.from(q('llDevice').options).forEach(o => {
        const t = window.LG_DEVICES[o.value]; o.textContent = t.sku + ' · ' + A.L(t.label);
      });
      Array.from(q('llRestrict').querySelectorAll('label')).forEach((lab, i) => {
        lab.querySelector('span').textContent = A.L(window.LG_CATEGORIES[i].label);
      });
    }
  }

  function renderLocations() {
    const rows = mine();
    q('llLocTable').innerHTML = `<thead><tr>
        <th>${A.esc(A.t('ll.col_loc'))}</th><th>${A.esc(A.t('ll.col_status'))}</th>
        <th>${A.esc(A.t('ll.col_devices'))}</th><th class="num">${A.esc(A.t('stat.footfall'))}</th>
        <th class="num">${A.esc(A.t('ll.col_occupancy'))}</th><th class="num">${A.esc(A.t('ll.col_minprice'))}</th>
        <th></th></tr></thead>
      <tbody>${rows.map(l => `<tr>
        <td><a href="location.html?id=${encodeURIComponent(l.id)}">${A.esc(A.L(l.name))}</a>
          <div class="tiny muted">${A.esc(A.L(l.address))}</div></td>
        <td>${l.verified ? A.statusPill('approved') : A.statusPill('pending')}
          <div class="tiny muted">${l.verified ? A.esc(A.t('ll.verified_on')) : A.esc(A.t('ll.awaiting_survey'))}</div></td>
        <td>${l.devices.map(d => A.deviceChip(d.type)).join(' ')}</td>
        <td class="num">${A.num(l.footfallPerDay)}</td>
        <td class="num">${l.bookedPct}%</td>
        <td class="num">${A.money(l.minPrice || Math.round(l.devices.reduce((s, d) => s + window.LG_DEVICES[d.type].dailyRate, 0) * 0.6))}</td>
        <td><button class="btn btn--ghost btn--sm" type="button" data-set="${l.id}" data-i18n="ll.manage">Manage</button></td>
      </tr>`).join('')}</tbody>`;
    q('llLocTable').querySelectorAll('[data-set]').forEach(b => b.addEventListener('click', () => {
      setLoc = b.getAttribute('data-set'); show('settings');
    }));
  }

  function submitLocation(e) {
    e.preventDefault();
    const name = q('llName').value.trim();
    if (!name) { A.toast(A.t('ll.need_name'), 'warn'); return; }
    if (!q('llTerms').checked) { A.toast(A.t('ll.need_terms'), 'warn'); return; }
    const dId = q('llDistrict').value, vId = q('llVenue').value, devType = q('llDevice').value;
    const mId = (q('llMarket') && q('llMarket').value) || A.market;
    const loc = S.addLocation({
      owner: 'me',
      market: mId,
      name: { en: name, zhHant: name, zhHans: name, th: name },
      district: dId, venue: vId,
      address: { en: q('llAddress').value || name, zhHant: q('llAddress').value || name, zhHans: q('llAddress').value || name, th: q('llAddress').value || name },
      x: S.district(dId).x + 1.5, y: S.district(dId).y + 1.5,
      footfallPerDay: parseInt(q('llFootfall').value, 10) || 10000,
      dwellSec: parseInt(q('llDwell').value, 10) || 30,
      visibility: parseFloat(q('llVisibility').value) || 0.5,
      landlord: { en: 'Your portfolio (demo)', zhHant: '你的組合（示範）', zhHans: '你的组合（示范）', th: 'พอร์ตของคุณ (ตัวอย่าง)' },
      restrictions: Array.from(q('llRestrict').querySelectorAll('input:checked')).map(i => i.value),
      minPrice: parseInt(q('llMinPrice').value, 10) || 0,
      bank: q('llBank').value, split: parseInt(q('llSplit').value, 10) || 35,
      power: q('llPower').value, network: q('llNetwork').value,
      devices: [{
        id: 'DV-' + Math.floor(1000 + Math.random() * 8999), type: devType,
        position: { en: q('llPosition').value || 'Main entrance', zhHant: q('llPosition').value || '主要入口', zhHans: q('llPosition').value || '主要入口' },
        online: false, uptime: 0
      }]
    });
    A.toast(A.t('ll.toast_submitted', { id: loc.id }), 'ok');
    e.target.reset();
    populateFormSelects();
    renderAll();
    show('register');
  }

  /* ---------- approvals -------------------------------------------------- */
  function renderApprovals() {
    const all = S.approvals().filter(a => mineIds().includes(a.locationId) || !a.locationId);
    const pending = all.filter(a => a.status === 'pending');
    q('llApprovalCount').textContent = A.t('ll.n_pending', { n: pending.length });
    if (!all.length) {
      q('llApprovals').innerHTML = `<div class="empty"><p style="margin:0">${A.esc(A.t('ll.no_pending'))}</p></div>`;
      return;
    }
    q('llApprovals').innerHTML = all.map(a => {
      const c = S.campaign(a.campaignId), loc = S.location(a.locationId);
      if (!c) return '';
      const obj = window.LG_OBJECTIVES.find(o => o.id === c.objective);
      return `<div class="card">
        <div class="row row--between" style="align-items:flex-start">
          <div>
            <div class="row" style="gap:8px;margin-bottom:6px">
              ${A.statusPill(a.status === 'approved' ? 'approved' : a.status === 'rejected' ? 'rejected' : 'pending')}
              <span class="chip mono">${A.esc(c.id)}</span>
              ${c.aiUsed ? `<span class="pill pill--info">${A.esc(A.t('adv.ai_used'))}</span>` : ''}
            </div>
            <h3 class="card__title" style="margin:0 0 4px">${A.esc(A.L(c.advertiser))}</h3>
            <p class="card__sub">${A.esc(loc ? A.L(loc.name) : a.locationId)} · ${A.esc(obj ? A.L(obj.label) : c.objective)} ·
              ${A.esc(A.date(c.start))} → ${A.esc(A.date(c.end || S.util.addDays(c.start, c.days)))} · ${c.days} ${A.esc(A.t('unit.days'))} · SOV ${c.sov}%</p>
          </div>
          <div style="text-align:right">
            <strong>${A.money(Math.round((c.spend || 0) * S.state.split.landlord))}</strong>
            <div class="tiny muted">${A.esc(A.t('ll.your_share'))}</div>
          </div>
        </div>
        <div class="grid grid--2" style="margin-top:14px">
          <div class="panel">
            <span class="label">${A.esc(A.t('ll.creative'))}</span>
            <p class="small mono" style="margin:6px 0 0">${A.esc(c.creative ? c.creative.name : '—')}</p>
            <ul class="kpi-list" style="margin-top:10px">
              <li><span>${A.esc(A.t('ll.form'))}</span><b>${A.esc(c.creative && c.creative.form === 'hologram' ? A.t('legend.hologram') : A.t('legend.screen'))}</b></li>
              <li><span>${A.esc(A.t('ll.languages'))}</span><b>${A.esc((c.creative && c.creative.languages || []).join(', '))}</b></li>
              <li><span>${A.esc(A.t('ll.category_check'))}</span><b>${(loc && loc.restrictions || []).length ? A.esc(A.t('ll.cat_blocked', { n: (loc.restrictions || []).length })) : A.esc(A.t('ll.cat_ok'))}</b></li>
            </ul>
          </div>
          <div class="panel ${a.status === 'pending' ? 'panel--accent' : ''}">
            <span class="label">${A.esc(A.t('ll.decision'))}</span>
            ${a.status === 'pending' ? `
              <div class="row" style="margin-top:8px">
                <button class="btn btn--ok btn--sm" type="button" data-approve="${a.id}">${A.esc(A.t('ll.approve'))}</button>
                <button class="btn btn--danger btn--sm" type="button" data-reject="${a.id}">${A.esc(A.t('ll.reject'))}</button>
              </div>
              <p class="tiny muted" style="margin:10px 0 0">${A.esc(A.t('ll.decision_note'))}</p>`
              : `<p class="small" style="margin:8px 0 0">${A.esc(a.note ? A.L(a.note) : A.t('ll.no_note'))}</p>
                 <p class="tiny muted">${A.esc(a.decided || '')}</p>`}
          </div>
        </div>
      </div>`;
    }).join('');

    q('llApprovals').querySelectorAll('[data-approve]').forEach(b =>
      b.addEventListener('click', () => decide(b.getAttribute('data-approve'), 'approved')));
    q('llApprovals').querySelectorAll('[data-reject]').forEach(b =>
      b.addEventListener('click', () => decide(b.getAttribute('data-reject'), 'rejected')));
  }

  function decide(id, status) {
    const m = A.modal({
      title: status === 'approved' ? A.t('ll.approve') : A.t('ll.reject'),
      html: `<label class="label" for="apNote">${A.esc(A.t('ll.note_label'))}</label>
        <textarea id="apNote" placeholder="${A.esc(A.t('ll.note_ph'))}"></textarea>
        <p class="tiny muted" style="margin-top:8px">${A.esc(A.t('ll.note_hint'))}</p>`,
      actions: [
        { label: A.t('cta.cancel'), className: 'btn--quiet' },
        { label: status === 'approved' ? A.t('ll.approve') : A.t('ll.reject'),
          className: status === 'approved' ? 'btn--ok' : 'btn--danger',
          onClick: wrap => {
            const txt = wrap.querySelector('#apNote').value.trim();
            const bilingual = { en: txt || '', zhHant: txt || '', zhHans: txt || '' };
            S.decideApproval(id, status, bilingual);
            A.toast(status === 'approved' ? A.t('ll.toast_approved') : A.t('ll.toast_rejected'),
              status === 'approved' ? 'ok' : 'warn');
            renderAll();
          } }
      ]
    });
    void m;
  }

  /* ---------- schedule --------------------------------------------------- */
  function populateLocSelectors() {
    const opts = mine().map(l => `<option value="${l.id}">${A.esc(A.L(l.name))}</option>`).join('');
    ['llScheduleLoc', 'llNoticeLoc', 'llSetLoc'].forEach(id => {
      const sel = q(id); if (!sel) return;
      const cur = id === 'llScheduleLoc' ? scheduleLoc : id === 'llSetLoc' ? setLoc : null;
      sel.innerHTML = opts;
      if (cur && mineIds().includes(cur)) sel.value = cur;
    });
    if (!scheduleLoc) scheduleLoc = q('llScheduleLoc').value;
    if (!setLoc) setLoc = q('llSetLoc').value;
  }

  function renderSchedule() {
    populateLocSelectors();
    const loc = S.location(scheduleLoc) || mine()[0];
    const out = q('llScheduleOut');
    if (!loc) { out.innerHTML = `<p class="muted">${A.esc(A.t('ll.no_locations'))}</p>`; return; }
    scheduleLoc = loc.id; q('llScheduleLoc').value = loc.id;
    const rnd = S.util.seedFrom(loc.id + 'sched');
    const hours = Array.from({ length: 12 }, (_, i) => 10 + i);
    const camps = S.campaigns().filter(c => c.locationIds.includes(loc.id));

    const grid = loc.devices.map(dev => {
      const cells = hours.map(h => {
        const r = rnd();
        if (h === 13 || (h === 20 && r > 0.6)) return { kind: 'house', label: A.t('ll.cell_house') };
        if (camps.length && r > 0.35) {
          const c = camps[Math.floor(rnd() * camps.length)];
          return { kind: 'paid', label: A.L(c.advertiser), sov: c.sov };
        }
        return { kind: 'free', label: A.t('ll.cell_free') };
      });
      return `<tr><td class="mono tiny">${A.esc(dev.id)}<div class="tiny muted">${A.esc(window.LG_DEVICES[dev.type].sku)}</div></td>
        ${cells.map(c => `<td style="min-width:74px">
          <span class="chip ${c.kind === 'paid' ? '' : 'chip--off'}" style="font-size:.68rem"
            title="${A.esc(c.label)}">${c.kind === 'paid' ? '◆ ' : c.kind === 'house' ? '🏠 ' : '· '}${A.esc(String(c.label).slice(0, 10))}${c.sov ? ' ' + c.sov + '%' : ''}</span>
        </td>`).join('')}</tr>`;
    }).join('');

    out.innerHTML = `
      <div class="table-wrap"><table class="data data--compact">
        <thead><tr><th>${A.esc(A.t('loc.col_device'))}</th>
          ${hours.map(h => `<th class="num">${h}:00</th>`).join('')}</tr></thead>
        <tbody>${grid}</tbody></table></div>
      <div class="row" style="margin-top:12px;gap:16px">
        <span class="chip">◆ ${A.esc(A.t('ll.cell_paid'))}</span>
        <span class="chip chip--off">🏠 ${A.esc(A.t('ll.cell_house'))}</span>
        <span class="chip chip--off">· ${A.esc(A.t('ll.cell_free'))}</span>
        <span class="tiny muted">${A.esc(A.t('ll.schedule_note'))}</span>
      </div>`;
  }

  /* ---------- devices ---------------------------------------------------- */
  function renderDevices() {
    const rows = [];
    mine().forEach(l => l.devices.forEach(d => rows.push({ l, d })));
    q('llDeviceTable').innerHTML = `<thead><tr>
        <th>${A.esc(A.t('loc.col_device'))}</th><th>${A.esc(A.t('ll.col_loc'))}</th>
        <th>${A.esc(A.t('ll.col_type'))}</th><th>${A.esc(A.t('ll.col_status'))}</th>
        <th class="num">${A.esc(A.t('adv.kpi_uptime'))}</th><th>${A.esc(A.t('ll.col_firmware'))}</th>
        <th></th></tr></thead>
      <tbody>${rows.map(({ l, d }) => {
        const t = window.LG_DEVICES[d.type];
        const hb = d.online ? new Date(Date.now() - Math.round(Math.random() * 240000)) : new Date(Date.now() - 6 * 3600000);
        return `<tr>
          <td class="mono">${A.esc(d.id)}</td>
          <td>${A.esc(A.L(l.name))}</td>
          <td class="tiny">${A.esc(t.sku)}<div class="tiny muted">${A.esc(A.L(d.position))}</div></td>
          <td>${d.online ? A.statusPill('live') : A.statusPill('offline')}
            <div class="tiny muted">${A.esc(A.t('ll.heartbeat'))}: ${A.esc(hb.toISOString().slice(11, 16))}</div></td>
          <td class="num">${A.num(d.uptime, 1)}%</td>
          <td class="tiny mono">fw ${1 + (d.id.charCodeAt(5) % 3)}.4.${2 + (d.id.charCodeAt(6) % 5)}</td>
          <td><button class="btn btn--ghost btn--sm" type="button" data-mt="${l.id}|${d.id}">${A.esc(A.t('ll.request_mt'))}</button></td>
        </tr>`;
      }).join('')}</tbody>`;
    q('llDeviceTable').querySelectorAll('[data-mt]').forEach(b => b.addEventListener('click', () => {
      const [locId, devId] = b.getAttribute('data-mt').split('|');
      const t = S.addMaintenance({ deviceId: devId, locationId: locId, priority: 'medium',
        issue: { en: 'Maintenance requested by location owner', zhHant: '場地擁有人要求維修檢查', zhHans: '场地拥有人要求维修检查' } });
      A.toast(A.t('ll.toast_ticket', { id: t.id }), 'ok');
      renderDevices(); renderTickets();
    }));

    renderTickets();
  }

  function renderTickets() {
    q('llTicketTable').innerHTML = `<thead><tr>
        <th>${A.esc(A.t('ll.col_ticket'))}</th><th>${A.esc(A.t('loc.col_device'))}</th>
        <th>${A.esc(A.t('ll.col_issue'))}</th><th>${A.esc(A.t('ll.col_priority'))}</th>
        <th>${A.esc(A.t('ll.col_status'))}</th><th>${A.esc(A.t('ll.col_opened'))}</th></tr></thead>
      <tbody>${S.maintenance().map(m => `<tr>
        <td class="mono tiny">${A.esc(m.id)}</td>
        <td class="mono tiny">${A.esc(m.deviceId)}</td>
        <td class="tiny">${A.esc(A.L(m.issue))}</td>
        <td>${A.statusPill(m.priority === 'high' ? 'pending' : 'live')}</td>
        <td>${A.statusPill(m.status)}</td>
        <td class="tiny">${A.esc(A.date(m.opened))}</td></tr>`).join('')}</tbody>`;
  }

  /* ---------- earnings --------------------------------------------------- */
  function renderEarnings() {
    const led = myLedger();
    const share = x => x.share || Math.round(x.gross * S.state.split.landlord);
    const accrued = led.reduce((s, x) => s + share(x), 0);
    const paid = led.filter(x => x.status === 'paid').reduce((s, x) => s + share(x), 0);
    const pending = led.filter(x => x.status !== 'paid').reduce((s, x) => s + share(x), 0);
    const plays = led.reduce((s, x) => s + (x.plays || 0), 0);

    q('llEarnKpis').innerHTML =
      A.stat(A.t('ll.kpi_accrued'), A.money(accrued), A.t('ll.earn_accrued_sub'), 'brand') +
      A.stat(A.t('ll.kpi_paid'), A.money(paid), A.t('ll.earn_paid_sub'), 'ok') +
      A.stat(A.t('ll.kpi_pending_amt'), A.money(pending), A.t('ll.earn_pending_sub'), 'warn') +
      A.stat(A.t('measure.v1'), A.num(plays), A.t('ll.earn_plays_sub')) +
      A.stat(A.t('ll.kpi_eff'), plays ? A.money(accrued / plays, { maximumFractionDigits: 3 }) : '—', A.t('ll.earn_eff_sub'));

    q('llStmtTable').innerHTML = `<thead><tr>
        <th>${A.esc(A.t('ll.col_stmt'))}</th><th>${A.esc(A.t('ll.col_period'))}</th>
        <th>${A.esc(A.t('ll.col_landlord'))}</th><th class="num">${A.esc(A.t('ll.col_gross'))}</th>
        <th class="num">${A.esc(A.t('ll.your_share'))}</th><th class="num">${A.esc(A.t('measure.v1'))}</th>
        <th>${A.esc(A.t('ll.col_status'))}</th></tr></thead>
      <tbody>${led.map(x => `<tr>
        <td class="mono tiny">${A.esc(x.id)}</td><td>${A.esc(x.period)}</td>
        <td class="tiny">${A.esc(x.landlord ? A.L(x.landlord) : '—')}</td>
        <td class="num">${A.money(x.gross)}</td><td class="num"><strong>${A.money(share(x))}</strong></td>
        <td class="num">${A.num(x.plays)}</td><td>${A.statusPill(x.status === 'paid' ? 'paid' : 'accruing')}</td></tr>`).join('')}</tbody>`;
    q('llSettlementNote').textContent = A.t('ll.settlement_note', { days: CFG.payment.settlementDays, pct: A.pct(S.state.split.landlord, 0) });
  }

  /* ---------- notices + settings ----------------------------------------- */
  function renderNotices() {
    const ns = S.notices();
    q('llNotices').innerHTML = ns.length
      ? `<div class="table-wrap"><table class="data data--compact">
          <thead><tr><th>${A.esc(A.t('ll.col_period'))}</th><th>${A.esc(A.t('ll.notice_loc'))}</th>
            <th>${A.esc(A.t('ll.notice_kind'))}</th><th>${A.esc(A.t('ll.notice_text'))}</th></tr></thead>
          <tbody>${ns.map(n => {
            const l = S.location(n.locationId);
            return `<tr><td class="tiny">${A.esc(n.created)}</td>
              <td class="tiny">${A.esc(l ? A.L(l.name) : n.locationId)}</td>
              <td class="tiny">${A.esc(A.t('ll.kind_' + n.kind))}</td>
              <td>${A.esc(n.text)}</td></tr>`;
          }).join('')}</tbody></table></div>`
      : `<p class="muted small" style="margin:0">${A.esc(A.t('ll.no_notices'))}</p>`;
  }

  function renderSettings() {
    populateLocSelectors();
    const loc = S.location(setLoc) || mine()[0];
    if (!loc) return;
    setLoc = loc.id; q('llSetLoc').value = loc.id;
    const listPrice = Math.round(loc.devices.reduce((s, d) => s + window.LG_DEVICES[d.type].dailyRate, 0) * S.venue(loc.venue).mult);
    q('llSetPrice').value = loc.minPrice || Math.round(listPrice * 0.6);
    q('llBlockCats').innerHTML = window.LG_CATEGORIES.map(c => {
      const on = (loc.restrictions || []).includes(c.id);
      return `<label class="check"><input type="checkbox" value="${c.id}" ${on ? 'checked' : ''}>
        <span>${A.esc(A.L(c.label))}</span></label>`;
    }).join('');

    const sp = S.state.split;
    q('llShareBox').innerHTML = A.donut([
      { label: A.t('share.landlord'), value: sp.landlord * 100, color: '#7a6bff' },
      { label: A.t('share.platform'), value: sp.platform * 100, color: '#35d0ff' },
      { label: A.t('share.ai'), value: sp.ai * 100, color: '#ff5fa2' },
      { label: A.t('share.sales'), value: sp.sales * 100, color: '#34d399' }
    ], { center: A.pct(sp.landlord, 0), centerSub: A.t('share.landlord'), label: A.t('ll.share_title') }) +
      `<ul class="kpi-list" style="margin-top:12px">
        <li><span>${A.esc(A.t('ll.list_price'))}</span><b>${A.money(listPrice)}</b></li>
        <li><span>${A.esc(A.t('ll.device_count'))}</span><b>${loc.devices.length}</b></li>
        <li><span>${A.esc(A.t('ll.status'))}</span><b>${A.esc(A.t('status.' + (loc.verified ? 'approved' : 'pending')))}</b></li>
        <li><span>${A.esc(A.t('ll.bank'))}</span><b>${A.esc(loc.bank || A.t('ll.bank_missing'))}</b></li>
      </ul>`;
  }

  function saveSettings() {
    const loc = S.location(setLoc); if (!loc) return;
    S.updateLocation(loc.id, {
      minPrice: parseInt(q('llSetPrice').value, 10) || 0,
      restrictions: Array.from(q('llBlockCats').querySelectorAll('input:checked')).map(i => i.value)
    });
    A.toast(A.t('ll.toast_saved'), 'ok');
    renderAll();
  }

  /* ---------- init ------------------------------------------------------- */
  function renderAll() {
    populateFormSelects(); populateLocSelectors();
    renderOverview(); renderLocations(); renderApprovals();
    renderDevices(); renderEarnings(); renderNotices(); renderSettings();
    renderSchedule();
  }

  document.addEventListener('DOMContentLoaded', () => {
    q('llNav').addEventListener('click', e => {
      const b = e.target.closest('button'); if (b) show(b.getAttribute('data-sec'));
    });
    document.querySelectorAll('[data-goto]').forEach(b =>
      b.addEventListener('click', () => show(b.getAttribute('data-goto'))));
    q('llForm').addEventListener('submit', submitLocation);
    if (q('llMarket')) q('llMarket').addEventListener('change', () => { populateFormSelects(); });
    q('llScheduleLoc').addEventListener('change', e => { scheduleLoc = e.target.value; renderSchedule(); });
    q('llSetLoc').addEventListener('change', e => { setLoc = e.target.value; renderSettings(); });
    q('llSaveSettings').addEventListener('click', saveSettings);
    q('llNoticeForm').addEventListener('submit', e => {
      e.preventDefault();
      const text = q('llNoticeText').value.trim();
      if (!text) { A.toast(A.t('ll.notice_need_text'), 'warn'); return; }
      S.addNotice({ locationId: q('llNoticeLoc').value, kind: q('llNoticeKind').value, text });
      q('llNoticeText').value = '';
      A.toast(A.t('ll.toast_notice'), 'ok');
      renderAll();
    });
    q('llExportStmt').addEventListener('click', () => {
      const rows = [['statement', 'period', 'landlord', 'gross', 'share', 'plays', 'status']]
        .concat(myLedger().map(x => [x.id, x.period, x.landlord ? A.L(x.landlord) : '', x.gross,
          x.share || Math.round(x.gross * S.state.split.landlord), x.plays, x.status]));
      A.downloadCSV('3dNakedEye-landlord-statements.csv', rows);
    });
    q('llPrintStmt').addEventListener('click', () => { A.toast(A.t('ll.print_hint'), 'ok'); window.print(); });
    if (location.hash === '#register') show('register');
    renderAll();
  });
  A.onLangChange(renderAll);
})();
