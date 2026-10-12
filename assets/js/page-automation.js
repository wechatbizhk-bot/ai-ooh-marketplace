/* ============================================================================
 * 3dNakedEye — page-automation.js
 * Email automation console: rules, event simulator, outbox with preview and
 * .eml download, template browser and delivery settings.
 * ==========================================================================*/
(function () {
  'use strict';
  const S = window.LG.store, A = window.LG.app, CFG = window.LG_CONFIG;
  const N = window.LG.notify;
  const q = id => document.getElementById(id);
  let tplLang = null;

  /* Which in-app event each trigger simulates, using real campaign data. */
  function samplePayload(trigger) {
    const c = S.campaigns()[0];
    const loc = c ? S.location((c.locationIds || [])[0]) : S.liveLocations()[0];
    const market = loc ? S.marketOfLocation(loc) : 'hk';
    const p = c ? S.proofOfPlay(c) : { verified: { plays: 0 }, exposure: { impressions: 0 }, engagement: { scans: 0, redemptions: 0 } };
    const vars = {
      id: c ? c.id : 'BK-DEMO', campaign: c ? c.id : 'CMP-DEMO', name: A.L(c ? c.advertiser : { en: 'Demo advertiser' }),
      advertiser: A.L(c ? c.advertiser : { en: 'Demo advertiser' }),
      location: loc ? A.L(loc.name) : '', locations: loc ? A.L(loc.name) : '',
      amount: A.money(c ? c.spend : 0), date: A.date(c ? c.start : S.util.todayISO(3)),
      days: c ? c.days : 7, sov: c ? c.sov : 100,
      share: A.money(Math.round(((c ? c.spend : 0)) * S.state.split.landlord)),
      fee: A.money(Math.round(((c ? c.spend : 0)) * S.state.split.platform)),
      method: A.t('pay.card'), reason: A.t('ll.no_note'),
      devices: A.num((c ? (c.locationIds || []) : []).reduce((s, id) => { const l = S.location(id); return s + (l ? l.devices.length : 0); }, 1)),
      plays: A.num(p.verified.plays), impressions: A.num(p.exposure.impressions),
      clicks: A.num(p.engagement.scans), conversions: A.num(p.engagement.redemptions),
      period: new Date().toISOString().slice(0, 7), gross: A.money(c ? c.spend : 0), pct: A.pct(S.state.split.landlord, 0),
      device: loc && loc.devices[0] ? loc.devices[0].id : 'DV-0000', hours: 6,
      free: A.num(100 - (loc ? loc.bookedPct : 30)), occupancy: A.num(loc ? loc.bookedPct : 30),
      venues: A.L(S.venue(loc ? loc.venue : 'mall').label), districts: A.num(2)
    };
    return {
      market,
      advertiser: { name: A.L(c ? c.advertiser : { en: 'Demo advertiser' }), email: 'advertiser@example.com' },
      landlord: loc ? { name: A.L(loc.landlord), email: 'landlord@example.com' } : { name: 'Demo landlord', email: 'landlord@example.com' },
      operator: { name: CFG.brand.name, email: CFG.brand.email },
      vars,
      facts: [['Campaign', vars.campaign], ['Plays', vars.plays], ['Impressions', vars.impressions], ['Amount', vars.amount]]
    };
  }

  function renderRules() {
    const rows = N.rules();
    q('autoRules').innerHTML = `<thead><tr>
        <th>${A.esc(A.t('ads.col_on'))}</th>
        <th>${A.esc(A.t('auto.trigger'))}</th>
        <th>${A.esc(A.t('auto.audience'))}</th>
        <th>${A.esc(A.t('auto.schedule'))}</th>
        <th>${A.esc(A.t('auto.template'))}</th>
        <th>${A.esc(A.t('auto.last_run'))}</th></tr></thead>
      <tbody>${rows.map(r => {
        const t = N.template(r.id, A.lang);
        return `<tr>
          <td><input type="checkbox" data-rule="${r.id}" ${r.enabled ? 'checked' : ''} aria-label="${A.esc(A.t('ads.col_on'))}"></td>
          <td><strong>${A.esc(A.t('auto.tr_' + r.id.replace('booking_created', 'booking').replace('approval_requested', 'approval')
            .replace('campaign_approved', 'approved').replace('campaign_rejected', 'rejected')
            .replace('payment_received', 'payment').replace('campaign_live', 'live').replace('campaign_ending', 'ending')
            .replace('weekly_report', 'weekly').replace('statement_ready', 'statement').replace('device_offline', 'device')
            .replace('occupancy_low', 'occupancy').replace('plan_summary', 'summary')))}</strong>
            <div class="tiny muted mono">${A.esc(r.trigger)}</div></td>
          <td class="tiny">${A.esc(A.t('auto.aud_' + r.audience))}</td>
          <td class="tiny">${A.esc(A.t('auto.' + r.timing))}</td>
          <td class="tiny">${A.esc(t.subject)}</td>
          <td class="tiny">${r.lastRun ? A.esc(new Date(r.lastRun).toLocaleString(A.locale())) : `<span class="muted">${A.esc(A.t('auto.never'))}</span>`}</td>
        </tr>`;
      }).join('')}</tbody>`;

    q('autoRules').querySelectorAll('[data-rule]').forEach(cb => cb.addEventListener('change', () => {
      N.setRule(cb.getAttribute('data-rule'), { enabled: cb.checked });
      A.toast(A.t('auto.saved'), 'ok');
    }));
  }

  function renderSim() {
    q('autoSim').innerHTML = N.RULES.map(r => {
      const key = r.id.replace('booking_created', 'booking').replace('approval_requested', 'approval')
        .replace('campaign_approved', 'approved').replace('campaign_rejected', 'rejected')
        .replace('payment_received', 'payment').replace('campaign_live', 'live').replace('campaign_ending', 'ending')
        .replace('weekly_report', 'weekly').replace('statement_ready', 'statement').replace('device_offline', 'device')
        .replace('occupancy_low', 'occupancy').replace('plan_summary', 'summary');
      return `<button class="btn btn--ghost btn--sm" type="button" data-fire="${r.trigger}">${A.esc(A.t('auto.tr_' + key))}</button>`;
    }).join('');
    q('autoSim').querySelectorAll('[data-fire]').forEach(b => b.addEventListener('click', () => {
      const trigger = b.getAttribute('data-fire');
      const sent = N.fire(trigger, samplePayload(trigger));
      A.toast(A.t('auto.fired', { n: sent.length }), sent.length ? 'ok' : 'warn');
      renderOutbox();
      show('outbox');
    }));
  }

  function renderOutbox() {
    const list = N.outbox();
    q('autoOutbox').innerHTML = `<thead><tr>
        <th>${A.esc(A.t('auto.col_when'))}</th>
        <th>${A.esc(A.t('auto.col_to'))}</th>
        <th>${A.esc(A.t('auto.col_subject'))}</th>
        <th>${A.esc(A.t('auto.col_trigger'))}</th>
        <th>${A.esc(A.t('auto.col_lang'))}</th>
        <th>${A.esc(A.t('auto.col_status'))}</th>
        <th></th></tr></thead>
      <tbody>${list.length ? list.map(e => `<tr>
        <td class="tiny">${A.esc(new Date(e.when).toLocaleString(A.locale()))}</td>
        <td class="tiny">${A.esc(e.toName || '')}<div class="mono tiny muted">${A.esc(e.to)}</div></td>
        <td class="small">${A.esc(e.subject)}</td>
        <td class="tiny mono">${A.esc(e.trigger)}</td>
        <td class="tiny">${A.esc(e.lang)}</td>
        <td>${A.statusPill(e.status === 'sent' ? 'paid' : e.status === 'failed' ? 'rejected' : 'pending')}</td>
        <td><div class="row" style="gap:4px">
          <button class="btn btn--quiet btn--sm" type="button" data-view="${e.id}">${A.esc(A.t('auto.test_send'))}</button>
          <button class="btn btn--quiet btn--sm" type="button" data-eml="${e.id}">${A.esc(A.t('auto.download_eml'))}</button>
        </div></td></tr>`).join('') : `<tr><td colspan="7" class="muted">${A.esc(A.t('auto.empty'))}</td></tr>`}</tbody>`;

    q('autoOutbox').querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => {
      const e = N.outbox().find(x => x.id === b.getAttribute('data-view'));
      if (!e) return;
      A.modal({
        title: A.t('auto.preview_title') + ' · ' + e.id,
        html: `<p class="tiny muted" style="margin:0 0 10px">${A.esc(A.t('auto.preview_note'))}</p>
          <iframe style="width:100%;height:380px;border:1px solid var(--line);border-radius:10px;background:#fff"
            srcdoc="${A.esc(N.html(e))}"></iframe>`,
        actions: [{ label: A.t('auto.download_eml'), className: 'btn--ghost', onClick: () => downloadEml(e) },
          { label: A.t('ads.applied'), className: 'btn--primary', onClick: () => { N.markSent(e.id); renderOutbox(); } }]
      });
    }));
    q('autoOutbox').querySelectorAll('[data-eml]').forEach(b => b.addEventListener('click', () => {
      const e = N.outbox().find(x => x.id === b.getAttribute('data-eml'));
      if (e) downloadEml(e);
    }));
  }

  function downloadEml(entry) {
    const blob = new Blob([N.eml(entry)], { type: 'message/rfc822' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = entry.id + '.eml';
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 500);
  }

  function renderTemplates() {
    tplLang = tplLang || A.lang;
    q('autoLang').innerHTML = CFG.locales.map(l =>
      `<button type="button" data-tl="${l.code}" class="${l.code === tplLang ? 'is-active' : ''}">${A.esc(l.label)}</button>`).join('');
    q('autoLang').querySelectorAll('[data-tl]').forEach(b => b.addEventListener('click', () => {
      tplLang = b.getAttribute('data-tl');
      renderTemplates();
    }));
    q('autoTemplates').innerHTML = N.RULES.map(r => {
      const t = N.template(r.id, tplLang);
      return `<div class="card card--tight">
        <div class="row row--between" style="align-items:flex-start">
          <div><span class="chip mono">${A.esc(r.trigger)}</span>
            <h4 class="card__title" style="margin:8px 0 4px">${A.esc(t.subject)}</h4></div>
          <span class="pill pill--info">${A.esc(A.t('auto.aud_' + r.audience))}</span>
        </div>
        <p class="small" style="margin:8px 0 0">${A.esc(t.body)}</p>
      </div>`;
    }).join('');
  }

  function renderSettings() {
    const s = N.settings();
    q('autoFrom').value = s.fromName;
    q('autoReply').value = s.replyTo;
    q('autoAdvOpt').checked = !!s.advertiserOptIn;
    q('autoLlOpt').checked = !!s.landlordOptIn;
    q('autoDigestDay').value = s.digest || 'weekly';
  }

  function show(sec) {
    document.querySelectorAll('#autoNav button').forEach(b =>
      b.classList.toggle('is-active', b.getAttribute('data-sec') === sec));
    ['rules', 'outbox', 'templates', 'settings'].forEach(s =>
      q('sec-' + s).classList.toggle('is-active', s === sec));
  }

  function renderAll() { renderRules(); renderSim(); renderOutbox(); renderTemplates(); renderSettings(); }

  document.addEventListener('DOMContentLoaded', () => {
    q('autoNav').addEventListener('click', e => {
      const b = e.target.closest('button'); if (b) show(b.getAttribute('data-sec'));
    });
    q('autoSave').addEventListener('click', () => {
      N.saveSettings({
        fromName: q('autoFrom').value, replyTo: q('autoReply').value,
        advertiserOptIn: q('autoAdvOpt').checked, landlordOptIn: q('autoLlOpt').checked,
        digest: q('autoDigestDay').value
      });
      A.toast(A.t('auto.saved'), 'ok');
    });
    q('autoDigest').addEventListener('click', () => {
      const n = N.runDigest('weekly');
      A.toast(A.t('auto.fired', { n }), n ? 'ok' : 'warn');
      renderOutbox(); show('outbox');
    });
    q('autoExport').addEventListener('click', () => {
      const rows = [['id', 'when', 'to', 'role', 'lang', 'trigger', 'subject', 'status']]
        .concat(N.outbox().map(e => [e.id, e.when, e.to, e.role, e.lang, e.trigger, e.subject, e.status]));
      A.downloadCSV('3dNakedEye-outbox.csv', rows);
    });
    q('autoClear').addEventListener('click', () => { N.clearOutbox(); renderOutbox(); });
    renderAll();
  });
  A.onLangChange(() => { tplLang = A.lang; renderAll(); });
})();
