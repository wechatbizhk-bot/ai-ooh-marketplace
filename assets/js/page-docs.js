/* 3dNakedEye — page-docs.js : fills the technical tables and lists */
(function () {
  'use strict';
  const A = window.LG.app, CFG = window.LG_CONFIG;
  const q = id => document.getElementById(id);

  const COMPONENTS = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10', 'c11', 'c12', 'c13'];
  const STACK = ['s1', 's2', 's3', 's4', 's5', 's6', 's7'];
  const NONFUNC = ['n1', 'n2', 'n3', 'n4', 'n5', 'n6'];
  const TABLES = [
    { n: 'inventory', fields: 'location, venue_type, device, screen_size, hours, slots, floor_price, content_rules, audience_estimate' },
    { n: 'campaign', fields: 'advertiser, objective, lines[], creative, ai_flags, status, approval_state' },
    { n: 'booking', fields: 'lines[], pricing_snapshot, payment, invoice, idempotency_key' },
    { n: 'playback', fields: 'device_id, campaign_id, scheduled_at, played_at, duration, completion, content_version, error' },
    { n: 'engagement', fields: 'qr_token, scan, nfc_tap, landing_view, coupon_claim, redemption' },
    { n: 'ledger', fields: 'gross, landlord_share, platform_fee, ai_fee, sales_commission, processing, payout_batch' }
  ];
  const INVENTORY = ['i1', 'i2', 'i3', 'i4', 'i5', 'i6', 'i7', 'i8', 'i9'];
  const API = [
    { m: 'GET', p: '/v1/inventory?district=&venue=&device=&from=&to=', d: 'api_inv' },
    { m: 'GET', p: '/v1/inventory/nearby?lat=&lng=&radius_km=', d: 'api_nearby' },
    { m: 'GET', p: '/v1/availability?from=&to=&category=', d: 'api_avail' },
    { m: 'GET', p: '/v1/inventory/{location_id}', d: 'api_inv1' },
    { m: 'POST', p: '/v1/quotes', d: 'api_quote' },
    { m: 'POST', p: '/v1/bookings', d: 'api_book' },
    { m: 'POST', p: '/v1/campaigns/{id}/creative', d: 'api_creative' },
    { m: 'POST', p: '/v1/campaigns/{id}/approve', d: 'api_approve' },
    { m: 'POST', p: '/v1/ai/brief', d: 'api_ai' },
    { m: 'POST', p: '/api/pay/intent', d: 'api_pay' },
    { m: 'GET', p: '/v1/proof-of-play?campaign_id=', d: 'api_pop' },
    { m: 'GET', p: '/v1/reports/{campaign_id}', d: 'api_report' },
    { m: 'GET', p: '/v1/ledger?landlord_id=&period=', d: 'api_ledger' },
    { m: 'POST', p: '/v1/devices/{id}/heartbeat', d: 'api_hb' },
    { m: 'GET', p: '/v1/devices/{id}/manifest', d: 'api_manifest' },
    { m: 'GET', p: '/v1/video/explainer?lang=', d: 'api_video' }
  ];
  const AVAIL = [
    { k: 'available', mark: 'pass' }, { k: 'partial', mark: 'warn' },
    { k: 'occupied', mark: 'fail' }, { k: 'restricted', mark: 'skip' }
  ];
  const LBS_LIST = ['lbs1', 'lbs2', 'lbs3', 'lbs4'];
  const LBS_PRIV = ['priv1', 'priv2', 'priv3'];
  const PAY_ROWS = ['stripe', 'paypal', 'crypto', 'local'];
  const PAY_FLOW = ['f1', 'f2', 'f3', 'f4'];
  const PAY_RULES = ['r1', 'r2', 'r3', 'r4'];
  const VID_SWAP = ['v1', 'v2', 'v3'];
  const LOCALE = ['l1', 'l2', 'l3', 'l4', 'l5'];
  const MEASURE = [
    { tier: 'verified', items: ['measure.v1', 'measure.v2', 'measure.v3', 'measure.v4'] },
    { tier: 'exposure', items: ['measure.e1', 'measure.e2', 'measure.e3', 'measure.e4'] },
    { tier: 'engagement', items: ['measure.g1', 'measure.g2', 'measure.g3', 'measure.g4'] }
  ];
  const ROADMAP = [
    { k: 'road.p1', when: 'road.p1_when', phase: 1 },
    { k: 'road.p2', when: 'road.p2_when', phase: 2 },
    { k: 'road.p3', when: 'road.p3_when', phase: 3 }
  ];
  const PLAYER = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'];
  const HOLO = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'h7'];

  function render() {
    q('docsComponents').innerHTML = COMPONENTS.map(k =>
      `<li><span>${A.esc(A.t('docs.' + k))}</span><b>${A.esc(A.t('docs.' + k + '_v'))}</b></li>`).join('');
    q('docsStack').innerHTML = STACK.map(k =>
      `<li><span>${A.esc(A.t('docs.' + k))}</span><b>${A.esc(A.t('docs.' + k + '_v'))}</b></li>`).join('');
    q('docsNonFunc').innerHTML = NONFUNC.map(k =>
      `<li><span>${A.esc(A.t('docs.' + k))}</span><b>${A.esc(A.t('docs.' + k + '_v'))}</b></li>`).join('');

    q('docsTables').innerHTML = `<thead><tr><th>${A.esc(A.t('docs.col_table'))}</th>
        <th>${A.esc(A.t('docs.col_fields'))}</th></tr></thead>
      <tbody>${TABLES.map(t => `<tr><td><strong class="mono">${A.esc(t.n)}</strong>
        <div class="tiny muted">${A.esc(A.t('docs.tbl_' + t.n))}</div></td>
        <td class="tiny mono">${A.esc(t.fields)}</td></tr>`).join('')}</tbody>`;

    q('docsInventory').innerHTML = `<thead><tr><th>${A.esc(A.t('docs.col_field'))}</th>
        <th>${A.esc(A.t('docs.col_type'))}</th><th>${A.esc(A.t('docs.col_purpose'))}</th></tr></thead>
      <tbody>${INVENTORY.map(k => `<tr><td class="mono tiny">${A.esc(A.t('docs.' + k + '_f'))}</td>
        <td class="tiny">${A.esc(A.t('docs.' + k + '_t'))}</td>
        <td class="tiny muted">${A.esc(A.t('docs.' + k + '_d'))}</td></tr>`).join('')}</tbody>`;

    q('docsApi').innerHTML = `<thead><tr><th>${A.esc(A.t('docs.col_method'))}</th>
        <th>${A.esc(A.t('docs.col_path'))}</th><th>${A.esc(A.t('docs.col_purpose'))}</th></tr></thead>
      <tbody>${API.map(a => `<tr><td><span class="pill ${a.m === 'GET' ? 'pill--info' : 'pill--ok'}">${a.m}</span></td>
        <td class="mono tiny">${A.esc(a.p)}</td><td class="tiny muted">${A.esc(A.t('docs.' + a.d))}</td></tr>`).join('')}</tbody>`;

    const DS = [
      { m: 'DeepSeek-V4.1-Flash', id: 'deepseek-flash', hit: [0.003, 0.006], miss: [0.15, 0.3], out: [0.6, 1.2], conc: 2500 },
      { m: 'DeepSeek-V4-Pro', id: 'deepseek-v4-pro', hit: [0.022, 0.044], miss: [0.66, 1.32], out: [1.98, 3.96], conc: 500 }
    ];
    q('docsDsPrices').innerHTML = `<thead><tr><th>${A.esc(A.t('docs.col_model'))}</th>
        <th>${A.esc(A.t('docs.col_model_id'))}</th>
        <th class="num">${A.esc(A.t('docs.col_cache_hit'))}</th>
        <th class="num">${A.esc(A.t('docs.col_cache_miss'))}</th>
        <th class="num">${A.esc(A.t('docs.col_output'))}</th>
        <th class="num">${A.esc(A.t('docs.col_concurrency'))}</th></tr></thead>
      <tbody>${DS.map(d => `<tr><td><strong>${A.esc(d.m)}</strong></td><td class="mono tiny">${A.esc(d.id)}</td>
        <td class="num tiny">$${d.hit[0]} / $${d.hit[1]}</td>
        <td class="num tiny">$${d.miss[0]} / $${d.miss[1]}</td>
        <td class="num tiny">$${d.out[0]} / $${d.out[1]}</td>
        <td class="num tiny">${A.num(d.conc)}</td></tr>`).join('')}</tbody>
      <caption class="tiny muted" style="caption-side:bottom;text-align:left;padding:10px">${A.esc(A.t('docs.ds_caption'))}</caption>`;

    q('docsMeasure').innerHTML = `<thead><tr><th>${A.esc(A.t('docs.col_tier'))}</th>
        <th>${A.esc(A.t('docs.col_metrics'))}</th><th>${A.esc(A.t('docs.col_source'))}</th></tr></thead>
      <tbody>${MEASURE.map(m => `<tr>
        <td>${A.statusPill(m.tier === 'verified' ? 'approved' : m.tier === 'exposure' ? 'pending' : 'in_review')}
          <div class="tiny muted">${A.esc(A.t('measure.' + m.tier))}</div></td>
        <td class="tiny">${m.items.map(i => A.esc(A.t(i))).join('<br>')}</td>
        <td class="tiny muted">${A.esc(A.t('docs.src_' + m.tier))}</td></tr>`).join('')}</tbody>`;

    q('docsRoadmap').innerHTML = `<thead><tr><th>${A.esc(A.t('docs.col_phase'))}</th>
        <th>${A.esc(A.t('docs.col_scope'))}</th><th class="num">${A.esc(A.t('docs.col_locations'))}</th></tr></thead>
      <tbody>${ROADMAP.map(r => `<tr><td><strong>${A.esc(A.t(r.k))}</strong>
        <div class="tiny muted">${A.esc(A.t(r.when))}</div></td>
        <td class="tiny muted">${A.esc(A.t(r.k + '_d'))}</td>
        <td class="num">${A.esc(A.t('docs.loc_' + r.phase))}</td></tr>`).join('')}</tbody>`;

    q('docsPlayer').innerHTML = PLAYER.map(k =>
      `<li><span>${A.esc(A.t('docs.' + k))}</span><b>${A.esc(A.t('docs.' + k + '_v'))}</b></li>`).join('');
    q('docsHolo').innerHTML = HOLO.map(k =>
      `<li><span>${A.esc(A.t('docs.' + k))}</span><b>${A.esc(A.t('docs.' + k + '_v'))}</b></li>`).join('');

    /* --- LBS glossary: signal sources, pull vs push ---------------------- */
    const ls = q('docsLbsSources');
    if (ls) ls.innerHTML = ['gps', 'cell', 'wifi', 'ble'].map(k =>
      `<li><span><strong>${A.esc(A.t('lbs.src_' + k))}</strong><br><span class="tiny muted">${A.esc(A.t('lbs.src_' + k + '_d'))}</span></span></li>`).join('');
    const lpp = q('docsLbsPullPush');
    if (lpp) lpp.innerHTML = ['pull', 'push'].map(k =>
      `<li><span><strong>${A.esc(A.t('lbs.' + k))}</strong><br><span class="tiny muted">${A.esc(A.t('lbs.' + k + '_d'))}</span></span></li>`).join('') +
      `<li><span>${A.esc(A.t('lbs.sim_title'))}</span><b>${A.esc(A.t('mkt.title'))}</b></li>`;

    /* --- LBS ------------------------------------------------------------- */
    const st = q('docsAvailStates');
    if (st) st.innerHTML = AVAIL.map(x =>
      `<li><span class="mark mark--${x.mark}">${x.mark === 'pass' ? '✓' : x.mark === 'warn' ? '!' : x.mark === 'fail' ? '✕' : '–'}</span>
        <span><b>${A.esc(A.t('avail.' + x.k))}</b> — ${A.esc(A.t('docs.av_' + x.k))}</span>
        <span class="tiny muted">${A.esc(A.t('docs.av_' + x.k + '_v'))}</span></li>`).join('');
    const ll = q('docsLbsList');
    if (ll) ll.innerHTML = LBS_LIST.map(k =>
      `<li><span>${A.esc(A.t('docs.' + k))}</span><b>${A.esc(A.t('docs.' + k + '_v'))}</b></li>`).join('');
    const lp = q('docsLbsPrivacy');
    if (lp) lp.innerHTML = LBS_PRIV.map(k =>
      `<li><span>${A.esc(A.t('docs.' + k))}</span><b>${A.esc(A.t('docs.' + k + '_v'))}</b></li>`).join('');

    /* --- payments -------------------------------------------------------- */
    const pt = q('docsPayTable');
    if (pt) {
      const prov = window.LG.store.payProviders();
      pt.innerHTML = `<thead><tr>
          <th>${A.esc(A.t('docs.col_provider'))}</th><th>${A.esc(A.t('docs.col_methods2'))}</th>
          <th class="num">${A.esc(A.t('docs.col_fees'))}</th><th>${A.esc(A.t('docs.col_settle2'))}</th>
          <th>${A.esc(A.t('docs.col_use2'))}</th></tr></thead>
        <tbody>${PAY_ROWS.map(k => {
          const p = prov[k] || {};
          return `<tr>
            <td><strong>${A.esc(A.t('pay.' + k))}</strong><div class="tiny muted">${A.esc(A.t('docs.pay_' + k + '_mode', { mode: p.mode || 'simulated' }))}</div></td>
            <td class="tiny">${A.esc(A.t('docs.pay_' + k + '_methods'))}</td>
            <td class="num tiny">${p.pct ? A.pct(p.pct, 2) + (p.flat ? ' + ' + A.money(p.flat) : '') : A.esc(A.t('pay.no_fee'))}</td>
            <td class="tiny">${A.esc(A.t('docs.pay_' + k + '_settle'))}</td>
            <td class="tiny muted">${A.esc(A.t('docs.pay_' + k + '_use'))}</td></tr>`;
        }).join('')}</tbody>`;
    }
    const pf = q('docsPayFlow');
    if (pf) pf.innerHTML = PAY_FLOW.map(k =>
      `<li><h4>${A.esc(A.t('docs.' + k))}</h4><p>${A.esc(A.t('docs.' + k + '_d'))}</p></li>`).join('');
    const pr = q('docsPayRules');
    if (pr) pr.innerHTML = PAY_RULES.map(k =>
      `<li><span>${A.esc(A.t('docs.' + k))}</span><b>${A.esc(A.t('docs.' + k + '_v'))}</b></li>`).join('');

    /* --- video + localisation -------------------------------------------- */
    const vs = q('docsVidSwap');
    if (vs) vs.innerHTML = VID_SWAP.map(k =>
      `<li><span>${A.esc(A.t('docs.' + k))}</span><b>${A.esc(A.t('docs.' + k + '_v'))}</b></li>`).join('');
    const lc = q('docsLocale');
    if (lc) lc.innerHTML = LOCALE.map(k => {
      const val = k === 'l2'
        ? A.t('docs.l2_v', { n: A.num(Object.keys(window.LG_I18N || {}).length) })
        : A.t('docs.' + k + '_v');
      return `<li><span>${A.esc(A.t('docs.' + k))}</span><b>${A.esc(val)}</b></li>`;
    }).join('');

    /* --- markets ---------------------------------------------------------- */
    const mk = q('docsMarkets');
    if (mk) {
      const S = window.LG.store;
      mk.innerHTML = `<thead><tr>
          <th>${A.esc(A.t('docs.col_market'))}</th>
          <th>${A.esc(A.t('docs.col_currency'))}</th>
          <th class="num">${A.esc(A.t('op.kpi_locations'))}</th>
          <th>${A.esc(A.t('docs.col_cities'))}</th>
          <th>${A.esc(A.t('docs.col_notes'))}</th></tr></thead>
        <tbody>${A.markets().map(m => {
          const sites = S.locationsByMarket(m.id);
          const districts = Array.from(new Set(sites.map(l => l.district)))
            .map(d => A.L(S.district(d).label)).join(', ');
          const rate = (A.CFG.currency.rates || {})[m.currency.code] || 1;
          return `<tr>
            <td><strong>${A.esc(A.t('market.' + m.id))}</strong>
              <div class="tiny muted">${A.esc(m.center.lat.toFixed(2))}, ${A.esc(m.center.lng.toFixed(2))}</div></td>
            <td class="tiny">${A.esc(m.currency.code)} · 1 HK$ = ${A.num(rate, 2)}
              ${m.currency.code !== A.CFG.currency.code ? `<div class="tiny muted">${A.esc(A.localPrice(1000, m.id))} per HK$1,000</div>` : ''}</td>
            <td class="num">${A.num(sites.length)}</td>
            <td class="tiny muted">${A.esc(districts)}</td>
            <td class="tiny">${A.esc(A.t('docs.mk_' + m.id + '_notes'))}</td></tr>`;
        }).join('')}</tbody>`;
    }

    /* --- console + automation -------------------------------------------- */
    const console_ = q('docsConsole');
    if (console_) console_.innerHTML = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'].map(k =>
      `<li><span>${A.esc(A.t('docs.cn_' + k))}</span><b>${A.esc(A.t('docs.cn_' + k + '_v'))}</b></li>`).join('');
    const auto = q('docsAutomation');
    if (auto) auto.innerHTML = ['a1', 'a2', 'a3', 'a4', 'a5'].map(k =>
      `<li><span>${A.esc(A.t('docs.au_' + k))}</span><b>${A.esc(A.t('docs.au_' + k + '_v'))}</b></li>`).join('');

    /* --- front of site: FAQ, assistant, WhatsApp, social ------------------- */
    const faqCount = q('docsFaqCount');
    if (faqCount) {
      const n = (window.LG_FAQ || []).reduce((s, c) => s + c.items.length, 0) +
        (window.LG_CHAT_EXTRA || []).length;
      faqCount.textContent = A.t('docs.front_a1_v', { n: A.num(n) });
    }
    const social = q('docsSocial');
    if (social) {
      social.innerHTML = (A.CFG.social || []).map(s => s.kind === 'account'
        ? `<button type="button" class="social-btn" data-wechat="${A.esc(s.handle)}">${A.socialIcon(s.id)}<span>${A.esc(s.label)}</span></button>`
        : `<a class="social-btn" href="${A.esc(s.url)}" target="_blank" rel="noopener noreferrer"><span>${A.esc(s.label)}</span><span class="tiny muted">${A.esc(s.handle)}</span></a>`).join('');
      const c = q('docsSocialCount');
      if (c) c.textContent = A.num((A.CFG.social || []).length) + ' — ' + (A.CFG.social || []).map(s => s.label).join(' · ');
    }
    const waV = q('docsWaVersion');
    if (waV && A.CFG.contact && A.CFG.contact.whatsappApi) waV.textContent = A.CFG.contact.whatsappApi.version;
    /* machine-translation quick languages + messaging IDs */
    const quick = q('docsQuickLangs');
    if (quick) {
      quick.textContent = (A.CFG.translate.quickLanguages || []).map(l => l.label).join(' · ');
    }
    const lineId = q('docsLineId');
    if (lineId) lineId.textContent = (A.CFG.contact && A.CFG.contact.line) || '—';
    const wxId = q('docsWechatId');
    if (wxId) wxId.textContent = (A.CFG.contact && A.CFG.contact.wechatId) || '—';
    const trig = q('docsTriggers');
    if (trig && window.LG.notify) {
      trig.innerHTML = `<thead><tr>
          <th>${A.esc(A.t('auto.trigger'))}</th><th>${A.esc(A.t('auto.audience'))}</th>
          <th>${A.esc(A.t('auto.schedule'))}</th><th>${A.esc(A.t('auto.col_subject'))}</th></tr></thead>
        <tbody>${window.LG.notify.RULES.map(r => {
          const key = r.id.replace('booking_created', 'booking').replace('approval_requested', 'approval')
            .replace('campaign_approved', 'approved').replace('campaign_rejected', 'rejected')
            .replace('payment_received', 'payment').replace('campaign_live', 'live').replace('campaign_ending', 'ending')
            .replace('weekly_report', 'weekly').replace('statement_ready', 'statement').replace('device_offline', 'device')
            .replace('occupancy_low', 'occupancy').replace('plan_summary', 'summary');
          return `<tr><td><strong>${A.esc(A.t('auto.tr_' + key))}</strong>
              <div class="tiny muted mono">${A.esc(r.trigger)}</div></td>
            <td class="tiny">${A.esc(A.t('auto.aud_' + r.audience))}</td>
            <td class="tiny">${A.esc(A.t('auto.' + r.timing))}</td>
            <td class="tiny muted">${A.esc(window.LG.notify.template(r.id, A.lang).subject)}</td></tr>`;
        }).join('')}</tbody>`;
    }
  }

  document.addEventListener('DOMContentLoaded', render);
  A.onLangChange(render);
  void CFG;
})();
