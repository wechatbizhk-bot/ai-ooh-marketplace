/* ============================================================================
 * 3dNakedEye — page-checkout.js
 * Basket review → AI add-on → payment method (Stripe card/wallets, PayPal,
 * crypto, local Hong Kong rails) → simulated authorisation → invoice.
 *
 * Payment providers run in 'simulated' mode unless LG_CONFIG.payments.useServer
 * is true and the bundled server holds real keys — see server/deepseek-proxy.mjs.
 * ==========================================================================*/
(function () {
  'use strict';
  const S = window.LG.store, A = window.LG.app, CFG = window.LG_CONFIG;
  const q = id => document.getElementById(id);

  let ai = { enabled: false, languages: 2, hologram: true };
  let method = 'card';
  let crypto = null;          /* { index, quote, sent } */
  let paypal = null;          /* { orderId, email, approved } */
  let cryptoPath = null;      /* server-issued payment path when useServer is on */
  let step = 1, cryptoTimer = null;

  const METHODS = [
    { id: 'card',   group: 'gp_card',   icon: '💳', key: 'pay.card',   provider: 'stripe' },
    { id: 'wallet', group: 'gp_card',   icon: '📱', key: 'pay.wallet', provider: 'stripe' },
    { id: 'paypal', group: 'gp_paypal', icon: '🅿', key: 'pay.paypal', provider: 'paypal' },
    { id: 'crypto', group: 'gp_crypto', icon: '₿', key: 'pay.crypto', provider: 'crypto' },
    { id: 'fps',    group: 'gp_local',  icon: '⚡', key: 'pay.fps',    provider: 'local' },
    { id: 'payme',  group: 'gp_local',  icon: '🅜', key: 'pay.payme',  provider: 'local' },
    { id: 'bank',   group: 'gp_local',  icon: '🏦', key: 'pay.bank',   provider: 'local' }
  ];
  const methodDef = id => METHODS.find(m => m.id === id) || METHODS[0];
  const coinList = () => (S.payProviders().crypto && S.payProviders().crypto.coins) || [];

  /* ---------- steps ------------------------------------------------------- */
  function renderSteps() {
    const keys = ['co.step1', 'co.step2', 'co.step3', 'co.step4'];
    q('coSteps').innerHTML = keys.map((k, i) => {
      const n = i + 1;
      return `<li style="grid-template-columns:auto 1fr;list-style:none;display:flex;gap:8px;align-items:center">
        <span class="mark mark--${n < step ? 'pass' : n === step ? 'warn' : 'skip'}">${n}</span>
        <span class="small ${n <= step ? '' : 'muted'}">${A.esc(A.t(k))}</span></li>`;
    }).join('');
  }

  /* ---------- AI add-on --------------------------------------------------- */
  function initAi() {
    const draft = S.aiDrafts().find(d => d.useInBooking);
    if (draft) {
      ai.enabled = true;
      ai.languages = (draft.languages && draft.languages.length) || 2;
      ai.hologram = !!draft.hologram;
      q('coAiToggle').checked = true;
      q('coAiLangs').value = String(Math.min(3, ai.languages));
      q('coAiHolo').value = ai.hologram ? 'yes' : 'no';
      q('coAiBody').innerHTML = `<span class="pill pill--ok">${A.esc(A.t('co.ai_attached'))}</span>
        <p class="small" style="margin:8px 0 0">${A.esc(A.t('co.ai_attached_body', { name: (draft.creative && draft.creative.name) || '—' }))}</p>`;
    } else {
      q('coAiBody').innerHTML = `<p style="margin:0">${A.esc(A.t('co.ai_none'))}</p>
        <p style="margin:6px 0 0"><a href="studio.html">${A.esc(A.t('co.ai_open'))} →</a></p>`;
    }
  }
  const aiObj = () => ({ enabled: ai.enabled, languages: ai.languages, hologram: ai.hologram });

  /* ---------- basket ------------------------------------------------------ */
  function renderLines() {
    const cart = S.cart();
    q('coCartCount').textContent = A.t('co.items', { n: cart.length });
    if (!cart.length) {
      q('coLines').innerHTML = `<div class="empty"><p style="margin:0">${A.esc(A.t('co.no_lines'))}</p></div>`;
      return;
    }
    q('coLines').innerHTML = cart.map(line => {
      const l = S.lineQuote(line);
      if (!l) return '';
      const loc = S.location(line.locationId);
      const devs = loc.devices.filter(d => l.devices.includes(d.id));
      return `<div class="panel">
        <div class="row row--between" style="align-items:flex-start">
          <div>
            <strong>${A.esc(A.L(loc.name))}</strong>
            <p class="tiny muted" style="margin:2px 0 6px">${A.esc(A.L(loc.address))} · <span class="mono">${A.esc(loc.id)}</span></p>
            <div class="row" style="gap:6px">${devs.map(d => A.deviceChip(d.type)).join('')}</div>
          </div>
          <div style="text-align:right">
            <strong class="nowrap" style="display:block">${A.money(l.media)}</strong>
            <button class="btn btn--quiet btn--sm" type="button" data-del="${line.ref}" data-i18n="co.remove">Remove</button>
          </div>
        </div>
        <div class="form-row--3 form-row" style="margin-top:12px">
          <div class="form-row">
            <label>${A.esc(A.t('loc.start'))}</label>
            <input type="date" data-line="${line.ref}" data-field="start" value="${A.esc(line.start || S.util.todayISO(3))}"></div>
          <div class="form-row">
            <label>${A.esc(A.t('loc.days'))}</label>
            <input type="number" min="1" max="90" data-line="${line.ref}" data-field="days" value="${l.days}"></div>
          <div class="form-row">
            <label>${A.esc(A.t('loc.sov'))}</label>
            <select data-line="${line.ref}" data-field="sov">
              ${CFG.pricing.shareOfVoice.map(v => `<option value="${v}" ${v === l.sov ? 'selected' : ''}>${v}%</option>`).join('')}
            </select></div>
        </div>
        <div class="row row--between" style="margin-top:10px">
          <span class="tiny muted">${A.esc(A.t('co.line_detail', {
            rate: A.money(l.ratePerDay), days: l.days,
            plays: A.num(l.playsPerDay * l.deviceCount), imp: A.num(l.estImpressionsPerDay * l.deviceCount)
          }))}</span>
          ${l.dayDiscount ? `<span class="chip">−${A.pct(l.dayDiscount, 0)} ${A.esc(A.t('co.discount'))}</span>` : ''}
        </div>
      </div>`;
    }).join('');

    q('coLines').querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => {
      S.removeFromCart(b.getAttribute('data-del')); renderAll();
    }));
    q('coLines').querySelectorAll('[data-line]').forEach(inp => inp.addEventListener('change', () => {
      const ref = inp.getAttribute('data-line'), field = inp.getAttribute('data-field');
      const line = S.cart().find(x => x.ref === ref); if (!line) return;
      line[field] = field === 'sov' ? parseInt(inp.value, 10)
        : field === 'days' ? Math.max(1, Math.min(90, parseInt(inp.value, 10) || 1)) : inp.value;
      S.save(); renderAll();
    }));
  }

  /* ---------- summary ---------------------------------------------------- */
  function renderSummary() {
    const quote = S.quote(S.cart(), aiObj(), method);
    const md = methodDef(method);
    const feeRow = S.paymentQuote(method, quote.gross);
    /* Thailand lines settle in THB — show the indicative equivalent alongside HKD */
    const thaiMedia = quote.lines.filter(l => S.marketOfLocation(S.location(l.locationId)) === 'th')
      .reduce((s, l) => s + l.media, 0);
    q('coSummary').innerHTML = `
      <ul class="kpi-list" style="margin:10px 0 12px">
        <li><span>${A.esc(A.t('co.media'))}</span><b>${A.money(quote.media)}</b></li>
        <li><span>${A.esc(A.t('co.ai_fee'))}</span><b>${quote.aiFee ? A.money(quote.aiFee) : '—'}</b></li>
        <li><span>${A.esc(A.t('co.gross'))}</span><b>${A.money(quote.gross)}</b></li>
        <li><span>${A.esc(A.t('co.processing'))} · ${A.esc(A.t(md.key))}</span><b>${A.money(feeRow.fee)}</b></li>
      </ul>
      <div class="row row--between">
        <span class="label">${A.esc(A.t('co.total_due'))}</span>
        <strong class="quote-total">${A.money(quote.total)}</strong>
      </div>
      <p class="tiny muted" style="margin:6px 0 0">${A.esc(A.t('pay.fee_breakdown', {
        pct: A.pct(feeRow.pct, 2), flat: A.money(feeRow.flat), provider: A.t(md.key)
      }))}</p>
      <ul class="kpi-list" style="margin:12px 0 0">
        <li><span>${A.esc(A.t('co.deposit', { pct: A.pct(CFG.payment.depositPct, 0) }))}</span><b>${A.money(quote.deposit)}</b></li>
        <li><span>${A.esc(A.t('co.balance'))}</span><b>${A.money(quote.balance)}</b></li>
        <li><span>${A.esc(A.t('co.plays_total'))}</span><b>${A.num(quote.playsPerDay * quote.days)}</b></li>
        <li><span>${A.esc(A.t('co.imp_total'))}</span><b>${A.num(quote.estImpressionsPerDay * quote.days)}</b></li>
        ${method === 'crypto' ? `<li><span>${A.esc(A.t('pay.crypto_amount'))}</span><b id="coCryptoMini">—</b></li>` : ''}
        ${thaiMedia ? `<li><span>${A.esc(A.t('market.th'))} · ${A.esc(A.t('docs.col_currency'))}</span><b>${A.esc(A.localPrice(thaiMedia, 'th'))}</b></li>` : ''}
      </ul>`;

    const sp = S.state.split;
    const segs = [
      { label: A.t('share.platform'), value: quote.shares.platform, color: '#35d0ff' },
      { label: A.t('share.landlord'), value: quote.shares.landlord, color: '#7a6bff' },
      { label: A.t('share.ai'), value: quote.shares.ai, color: '#ff5fa2' },
      { label: A.t('share.sales'), value: quote.shares.sales, color: '#34d399' }
    ].filter(s => s.value > 0);
    q('coSplit').innerHTML = A.donut(segs, {
      center: A.money(quote.gross), centerSub: A.t('co.gross_short'), label: A.t('co.split_title')
    }) + `<p class="tiny muted" style="margin:0">${A.esc(A.t('co.split_note', {
      landlord: A.pct(sp.landlord, 0), platform: A.pct(sp.platform, 0)
    }))}</p>`;

    if (method === 'crypto') updateCryptoMini(quote.total);
  }

  function updateCryptoMini(total) {
    const el = q('coCryptoMini');
    if (!el) return;
    if (!crypto) crypto = { index: 0, quote: S.cryptoQuote(0, total, currentRef()), sent: false };
    if (crypto.quote) el.textContent = `${crypto.quote.units} ${crypto.quote.coin}`;
  }

  /* ---------- payment methods -------------------------------------------- */
  function renderMethods() {
    const gross = S.quote(S.cart(), aiObj(), method).gross;
    const groups = [];
    METHODS.forEach(m => { if (!groups.includes(m.group)) groups.push(m.group); });
    q('coMethods').innerHTML = groups.map(g => `
      <div class="pay-group">
        <span class="pay-group__title">${A.esc(A.t('pay.' + g))}</span>
        <div class="pay-methods">${METHODS.filter(m => m.group === g).map(m => {
          const f = S.paymentQuote(m.id, gross);
          return `<button type="button" class="pay-method${m.id === method ? ' is-active' : ''}" data-m="${m.id}">
            <span aria-hidden="true">${m.icon}</span>
            <span class="pay-method__logo">${A.esc(A.t(m.key))}</span>
            <small>${f.fee ? A.money(f.fee) : A.esc(A.t('pay.no_fee'))}</small>
          </button>`;
        }).join('')}</div>
      </div>`).join('');

    q('coMethods').querySelectorAll('[data-m]').forEach(b => b.addEventListener('click', () => {
      method = b.getAttribute('data-m');
      if (method !== 'crypto') { crypto = null; stopCryptoTimer(); }
      paypal = null;
      renderMethods(); renderMethodBody(); renderSummary(); renderSteps();
    }));
  }

  function stopCryptoTimer() {
    if (cryptoTimer) { clearInterval(cryptoTimer); cryptoTimer = null; }
  }

  function currentRef() {
    const first = S.cart()[0];
    return (first && first.ref) || 'LG-NEW';
  }

  /* Ask the server for a real intent when configured; otherwise simulate. */
  function requestIntent(total) {
    if (!CFG.payments.useServer) return Promise.resolve(null);
    return fetch(CFG.payments.serverUrl + '/intent', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: methodDef(method).provider, method, amount: total, currency: 'HKD', ref: currentRef() })
    }).then(r => r.ok ? r.json() : null).catch(() => null);
  }

  function renderMethodBody() {
    const quote = S.quote(S.cart(), aiObj(), method);
    const prov = S.payProviders();
    const stripe = prov.stripe || {}, pp = prov.paypal || {}, cr = prov.crypto || {};
    const simulated = A.t('pay.simulated');

    if (method === 'card' || method === 'wallet') {
      q('coMethodBody').innerHTML = `
        <div class="row row--between" style="margin-bottom:12px">
          <span class="pay-badge">${A.esc(A.t('pay.powered_stripe'))}</span>
          <span class="pay-badge">${A.esc(simulated)}</span>
        </div>
        ${method === 'card' ? `
        <div class="form-row--2 form-row">
          <div class="form-row"><label>${A.esc(A.t('co.card_no'))}</label><input type="text" id="stCard" value="4242 4242 4242 4242"></div>
          <div class="form-row"><label>${A.esc(A.t('co.card_name'))}</label><input type="text" id="stName" value="WING FAT BAKERY LTD"></div>
        </div>
        <div class="form-row--3 form-row" style="margin-top:12px">
          <div class="form-row"><label>${A.esc(A.t('co.card_exp'))}</label><input type="text" value="12 / 28"></div>
          <div class="form-row"><label>CVC</label><input type="text" value="123"></div>
          <div class="form-row"><label>${A.esc(A.t('co.card_zip'))}</label><input type="text" value="—"></div>
        </div>` : `
        <div class="row" style="gap:12px">
          <button class="btn btn--ghost" type="button"> Apple Pay</button>
          <button class="btn btn--ghost" type="button"> G Pay</button>
        </div>`}
        <ul class="kpi-list" style="margin-top:14px">
          <li><span>${A.esc(A.t('pay.provider_fee'))}</span><b>${A.pct(stripe.pct, 2)} + ${A.money(stripe.flat)}</b></li>
          <li><span>${A.esc(A.t('pay.3ds'))}</span><b>${stripe.threeDS ? A.esc(A.t('pay.3ds_on')) : '—'}</b></li>
          <li><span>${A.esc(A.t('pay.settlement'))}</span><b>${A.esc(A.t('pay.settle_card'))}</b></li>
        </ul>
        <div class="note" style="margin-top:12px">${A.esc(A.t('pay.stripe_note'))}</div>`;
      return;
    }

    if (method === 'paypal') {
      q('coMethodBody').innerHTML = `
        <div class="row row--between" style="margin-bottom:12px">
          <span class="pay-badge">${A.esc(A.t('pay.powered_paypal'))}</span>
          <span class="pay-badge">${A.esc(simulated)}</span>
        </div>
        ${paypal && paypal.orderId ? `
          <div class="panel">
            <div class="row row--between">
              <div>
                <strong>${A.esc(A.t('pay.paypal_order'))}</strong>
                <p class="mono small" style="margin:4px 0 0">${A.esc(paypal.orderId)}</p>
              </div>
              <span class="pill ${paypal.approved ? 'pill--ok' : 'pill--warn'}">${A.esc(A.t(paypal.approved ? 'pay.approved' : 'pay.awaiting_approval'))}</span>
            </div>
            <p class="small muted" style="margin:10px 0 0">${A.esc(A.t('pay.paypal_sim_note'))}</p>
          </div>` : `
          <div class="form-row">
            <label for="ppEmail">${A.esc(A.t('pay.paypal_email'))}</label>
            <input type="email" id="ppEmail" value="marketing@wingfat.example">
          </div>
          <button class="btn btn--ghost btn--block" type="button" id="ppContinue" style="margin-top:12px">
            ${A.esc(A.t('pay.paypal_continue'))}
          </button>`}
        <ul class="kpi-list" style="margin-top:14px">
          <li><span>${A.esc(A.t('pay.provider_fee'))}</span><b>${A.pct(pp.pct, 2)} + ${A.money(pp.flat)}</b></li>
          <li><span>${A.esc(A.t('pay.currency'))}</span><b>${(pp.currencies || []).join(' / ')}</b></li>
          <li><span>${A.esc(A.t('pay.settlement'))}</span><b>${A.esc(A.t('pay.settle_paypal'))}</b></li>
        </ul>
        <div class="note" style="margin-top:12px">${A.esc(A.t('pay.paypal_note'))}</div>`;

      const cont = q('ppContinue');
      if (cont) cont.addEventListener('click', () => {
        const email = (q('ppEmail').value || '').trim();
        if (!email) { A.toast(A.t('pay.paypal_required'), 'warn'); return; }
        cont.disabled = true;
        requestIntent(quote.total).then(intent => {
          paypal = {
            orderId: (intent && intent.orderId) || ('PAYPAL-' + currentRef().replace(/[^A-Z0-9]/gi, '').slice(-6).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 8999)),
            email, approved: true
          };
          renderMethodBody();
          A.toast(A.t('pay.paypal_linked'), 'ok');
        });
      });
      return;
    }

    if (method === 'crypto') {
      const total = quote.total;
      if (!crypto || crypto.total !== total) {
        crypto = { index: (crypto && crypto.index) || 0, total, quote: S.cryptoQuote((crypto && crypto.index) || 0, total, currentRef()), sent: false };
      }
      const cq = crypto.quote;
      const coins = coinList();
      q('coMethodBody').innerHTML = `
        <div class="row row--between" style="margin-bottom:12px">
          <span class="pay-badge">${A.esc(A.t('pay.crypto_badge'))}</span>
          <span class="pay-badge">${A.esc(simulated)}</span>
        </div>
        <div class="form-row--2 form-row">
          <div class="form-row">
            <label for="crCoin">${A.esc(A.t('pay.coin_network'))}</label>
            <select id="crCoin">
              ${coins.map((c, i) => `<option value="${i}" ${i === crypto.index ? 'selected' : ''}>${c.code} · ${c.network}</option>`).join('')}
            </select>
          </div>
          <div class="form-row">
            <label>${A.esc(A.t('pay.rate_lock'))}</label>
            <div class="panel" style="padding:10px 12px"><span class="countdown" id="crCountdown">—</span></div>
          </div>
        </div>
        <div class="crypto-box" style="margin-top:14px">
          <div class="qr">${A.qrSvg('crypto-' + cq.address, 134)}</div>
          <div class="stack">
            <ul class="kpi-list" style="margin:0">
              <li><span>${A.esc(A.t('pay.crypto_amount'))}</span><b>${cq.units} ${A.esc(cq.coin)}</b></li>
              <li><span>${A.esc(A.t('pay.amount_hkd'))}</span><b>${A.money(total)}</b></li>
              <li><span>${A.esc(A.t('pay.rate'))}</span><b>1 ${A.esc(cq.coin)} = ${A.money(cq.hkdPerUnit)}</b></li>
              <li><span>${A.esc(A.t('pay.network'))}</span><b>${A.esc(cq.network)}</b></li>
            </ul>
            <div>
              <span class="label">${A.esc(A.t('pay.address'))}</span>
              <div class="addr" style="margin-top:6px">
                <span id="crAddr">${A.esc(cq.address)}</span>
                <button type="button" id="crCopy" data-i18n="pay.copy">Copy</button>
              </div>
            </div>
            ${cq.memo ? `<div><span class="label">${A.esc(A.t('pay.memo'))}</span>
              <div class="addr" style="margin-top:6px"><span>${A.esc(cq.memo)}</span></div></div>` : ''}
          </div>
        </div>
        <button class="btn ${crypto.sent ? 'btn--ok' : 'btn--ghost'} btn--block" type="button" id="crSent" style="margin-top:14px">
          ${A.esc(A.t(crypto.sent ? 'pay.sent_confirm' : 'pay.sent'))}
        </button>
        <ul class="kpi-list" style="margin-top:14px">
          <li><span>${A.esc(A.t('pay.provider_fee'))}</span><b>${A.pct(cr.pct, 2)}</b></li>
          <li><span>${A.esc(A.t('pay.confirmations'))}</span><b>${cq.confirmations}</b></li>
          <li><span>${A.esc(A.t('pay.settlement'))}</span><b>${A.esc(A.t('pay.settle_crypto', { to: cr.settleTo || 'HKD' }))}</b></li>
        </ul>
        <div class="note note--warn" style="margin-top:12px">${A.esc(A.t('pay.crypto_note', { min: cq.lockMinutes, buffer: cr.volatilityBufferPct }))}</div>`;

      q('crCoin').addEventListener('change', e => {
        crypto.index = parseInt(e.target.value, 10);
        crypto.quote = S.cryptoQuote(crypto.index, quote.total, currentRef());
        crypto.sent = false;
        cryptoPath = null;
        renderMethodBody(); renderSummary();
      });
      q('crCopy').addEventListener('click', () => {
        if (navigator.clipboard) navigator.clipboard.writeText(cq.address);
        A.toast(A.t('pay.copied'), 'ok');
      });
      q('crSent').addEventListener('click', () => {
        crypto.sent = true;
        requestIntent(quote.total).then(intent => { cryptoPath = intent && intent.address ? intent : null; });
        renderMethodBody();
        A.toast(A.t('pay.sent_toast', { n: cq.confirmations }), 'ok');
      });
      startCryptoTimer(cq.expiresAt);
      return;
    }

    /* local Hong Kong rails: FPS, PayMe, bank transfer */
    const ref = currentRef();
    const bodies = {
      fps: `<div class="row row--between" style="margin-bottom:12px">
            <span class="pay-badge">${A.esc(A.t('pay.rail_local'))}</span><span class="pay-badge">${A.esc(simulated)}</span></div>
          <div class="panel row" style="gap:18px;align-items:center">
            <div style="width:96px;height:96px;background:#fff;border-radius:10px;display:grid;place-items:center;color:#000;font-weight:700">FPS</div>
            <div><strong>${A.esc(A.t('co.fps_title'))}</strong>
              <p class="small muted" style="margin:6px 0 0">${A.esc(A.t('co.fps_body'))}</p></div>
          </div>`,
      payme: `<div class="row row--between" style="margin-bottom:12px">
            <span class="pay-badge">${A.esc(A.t('pay.rail_local'))}</span><span class="pay-badge">${A.esc(simulated)}</span></div>
          <div class="panel">
            <strong>${A.esc(A.t('co.payme_title'))}</strong>
            <p class="small muted" style="margin:6px 0 12px">${A.esc(A.t('co.payme_body'))}</p>
            <input type="tel" value="+852 9000 0000">
          </div>`,
      bank: `<div class="row row--between" style="margin-bottom:12px">
            <span class="pay-badge">${A.esc(A.t('pay.rail_local'))}</span><span class="pay-badge">${A.esc(simulated)}</span></div>
          <div class="panel">
            <strong>${A.esc(A.t('co.bank_title'))}</strong>
            <ul class="kpi-list" style="margin-top:10px">
              <li><span>${A.esc(A.t('co.bank_name'))}</span><b>${A.esc(A.t('co.bank_name_v'))}</b></li>
              <li><span>${A.esc(A.t('co.bank_acct'))}</span><b class="mono">000-000000-000</b></li>
              <li><span>${A.esc(A.t('co.bank_ref'))}</span><b class="mono">LG-${A.esc(ref)}</b></li>
            </ul>
            <p class="small muted" style="margin-top:10px">${A.esc(A.t('co.bank_note', { days: CFG.payment.settlementDays }))}</p>
          </div>`
    };
    q('coMethodBody').innerHTML = (bodies[method] || '') +
      `<ul class="kpi-list" style="margin-top:14px">
        <li><span>${A.esc(A.t('pay.provider_fee'))}</span><b>${A.esc(A.t('pay.no_fee'))}</b></li>
        <li><span>${A.esc(A.t('pay.settlement'))}</span><b>${A.esc(A.t('pay.settle_local'))}</b></li>
      </ul>`;
  }

  function startCryptoTimer(expiresAt) {
    stopCryptoTimer();
    const tick = () => {
      const el = q('crCountdown');
      if (!el) { stopCryptoTimer(); return; }
      const ms = new Date(expiresAt).getTime() - Date.now();
      if (ms <= 0) {
        el.textContent = A.t('pay.expired');
        stopCryptoTimer();
        return;
      }
      const m = Math.floor(ms / 60000), s = Math.floor((ms % 60000) / 1000);
      el.textContent = `${m}:${String(s).padStart(2, '0')}`;
    };
    tick();
    cryptoTimer = setInterval(tick, 1000);
  }

  /* ---------- pay --------------------------------------------------------- */
  function pay() {
    if (!S.cart().length) { A.toast(A.t('co.no_lines'), 'warn'); return; }
    const company = q('coCompany').value.trim();
    const email = q('coEmail').value.trim();
    if (!company || !email) { A.toast(A.t('co.need_details'), 'warn'); return; }
    if (!q('coTerms').checked) { A.toast(A.t('co.need_terms'), 'warn'); return; }
    if (method === 'paypal' && (!paypal || !paypal.approved)) { A.toast(A.t('pay.paypal_required'), 'warn'); return; }
    if (method === 'crypto' && (!crypto || !crypto.sent)) { A.toast(A.t('pay.crypto_required'), 'warn'); return; }

    step = 3; renderSteps();
    const btn = q('coPay');
    btn.disabled = true;
    btn.textContent = method === 'crypto' ? A.t('pay.awaiting_confirm', { n: (crypto && crypto.quote.confirmations) || 1 })
      : method === 'paypal' ? A.t('pay.authorising_paypal')
      : A.t('co.processing_now');

    const finish = () => {
      const startISO = (S.cart()[0] && S.cart()[0].start) || S.util.todayISO(3);
      const booking = S.checkout({
        advertiser: { en: company, zhHant: company, zhHans: company },
        objective: q('coObjective').value,
        start: startISO,
        method,
        ai: ai.enabled ? Object.assign({}, aiObj(), { creative: (S.aiDrafts().find(d => d.useInBooking) || {}).creative }) : null,
        contact: { name: q('coName').value, email, phone: q('coPhone').value },
        coupon: q('coCoupon').value === 'yes',
        landing: q('coLanding').value,
        crypto: method === 'crypto' ? Object.assign({}, crypto.quote, cryptoPath ? { serverPath: cryptoPath } : {}, { sent: true }) : null,
        paypal: method === 'paypal' ? paypal : null,
        stripe: (method === 'card' || method === 'wallet') ? { mode: 'simulated', threeDS: true } : null
      });
      stopCryptoTimer();
      step = 4; renderSteps();
      q('coGrid').classList.add('hide');
      q('coEmpty').classList.add('hide');
      q('coDone').classList.remove('hide');
      renderInvoice(booking);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      A.toast(A.t('co.toast_paid', { id: booking.id }), 'ok');
      A.updateCartBadge();
    };

    const delay = method === 'crypto' ? 2600 : method === 'paypal' ? 1500 : 1500;
    setTimeout(finish, delay);
  }

  /* ---------- invoice ---------------------------------------------------- */
  function renderInvoice(b) {
    const t = b.totals;
    const md = methodDef(b.method);
    const pay = b.payment || {};
    const rows = t.lines.map(l => {
      const loc = S.location(l.locationId);
      return `<tr>
        <td>${A.esc(A.L(loc.name))}<div class="tiny muted">${A.esc(loc.id)} · ${l.devices.length} ${A.esc(A.t('stat.devices'))}</div></td>
        <td>${A.esc(A.date(l.start))} → ${A.esc(A.date(S.util.addDays(l.start, l.days)))}</td>
        <td class="num">${l.days}</td><td class="num">${l.sov}%</td>
        <td class="num">${A.money(l.media)}</td></tr>`;
    }).join('');
    const aiRow = t.aiFee ? `<tr><td>${A.esc(A.t('co.ai_invoice_line'))}
        <div class="tiny muted">${A.esc(A.t('co.ai_invoice_sub', { n: ai.languages, holo: ai.hologram ? A.t('co.yes') : A.t('co.no') }))}</div></td>
        <td>—</td><td class="num">—</td><td class="num">—</td><td class="num">${A.money(t.aiFee)}</td></tr>` : '';

    const payDetail = [];
    if (b.method === 'crypto' && pay.crypto) {
      payDetail.push(`<li><span>${A.esc(A.t('pay.crypto_amount'))}</span><b>${pay.crypto.units} ${A.esc(pay.crypto.coin)} (${A.esc(pay.crypto.network)})</b></li>`);
      payDetail.push(`<li><span>${A.esc(A.t('pay.rate'))}</span><b>1 ${A.esc(pay.crypto.coin)} = ${A.money(pay.crypto.hkdPerUnit)}</b></li>`);
      payDetail.push(`<li><span>${A.esc(A.t('pay.address'))}</span><b class="mono tiny">${A.esc(pay.crypto.address)}</b></li>`);
      payDetail.push(`<li><span>${A.esc(A.t('pay.confirmations'))}</span><b>${pay.crypto.confirmations}</b></li>`);
    }
    if (b.method === 'paypal' && pay.paypal) {
      payDetail.push(`<li><span>${A.esc(A.t('pay.paypal_order'))}</span><b class="mono tiny">${A.esc(pay.paypal.orderId)}</b></li>`);
      payDetail.push(`<li><span>${A.esc(A.t('pay.paypal_email'))}</span><b>${A.esc(pay.paypal.email)}</b></li>`);
    }
    if ((b.method === 'card' || b.method === 'wallet')) {
      payDetail.push(`<li><span>${A.esc(A.t('pay.3ds'))}</span><b>${A.esc(A.t('pay.3ds_passed'))}</b></li>`);
    }

    q('coInvoice').innerHTML = `<div class="card">
      <div class="row row--between" style="align-items:flex-start">
        <div>
          <h3 class="card__title">${A.esc(A.t('co.invoice'))} ${A.esc(b.invoice)}</h3>
          <p class="tiny muted" style="margin:2px 0 0">${A.esc(CFG.brand.legalName)} · ${A.esc(CFG.brand.address)} · ${A.esc(CFG.brand.br)}</p>
        </div>
        <div style="text-align:right">
          <div class="tiny muted">${A.esc(A.t('co.booking_ref'))}</div>
          <strong class="mono">${A.esc(b.id)}</strong>
          <div class="tiny muted" style="margin-top:6px">${A.esc(A.t('co.paid_via'))}:
            <strong>${A.esc(A.t(md.key))}</strong> (${A.esc(pay.provider || methodDef(b.method).provider)})</div>
        </div>
      </div>
      <div class="form-row--2 form-row" style="margin:18px 0">
        <div><span class="label">${A.esc(A.t('co.bill_to'))}</span>
          <p style="margin:4px 0 0">${A.esc((b.advertiser && b.advertiser.en) || '—')}<br>
            <span class="small muted">${A.esc((b.contact && b.contact.email) || '')}</span></p></div>
        <div><span class="label">${A.esc(A.t('co.campaign_window'))}</span>
          <p style="margin:4px 0 0">${A.esc(A.date(b.created.slice(0, 10)))}<br>
            <span class="small muted">${A.esc(A.t('co.invoice_note'))}</span></p></div>
      </div>
      <div class="table-wrap"><table class="data">
        <thead><tr><th>${A.esc(A.t('co.col_item'))}</th><th>${A.esc(A.t('co.col_window'))}</th>
          <th class="num">${A.esc(A.t('co.col_days'))}</th><th class="num">${A.esc(A.t('co.col_sov'))}</th>
          <th class="num">${A.esc(A.t('co.col_amount'))}</th></tr></thead>
        <tbody>${rows}${aiRow}
          <tr><td colspan="4" class="num">${A.esc(A.t('co.media'))}</td><td class="num">${A.money(t.media)}</td></tr>
          <tr><td colspan="4" class="num">${A.esc(A.t('co.processing'))} · ${A.esc(A.t(md.key))}</td>
            <td class="num">${A.money(t.processing)}</td></tr>
          <tr><td colspan="4" class="num"><strong>${A.esc(A.t('co.total_due'))}</strong></td>
            <td class="num"><strong>${A.money(t.total)}</strong></td></tr>
        </tbody></table></div>
      <div class="form-row--2 form-row" style="margin-top:20px">
        <div>
          <h4 class="card__title" style="font-size:.95rem">${A.esc(A.t('pay.payment_detail'))}</h4>
          <ul class="kpi-list" style="margin-top:8px">
            <li><span>${A.esc(A.t('pay.provider_fee'))}</span><b>${A.money(pay.fee || t.processing)}</b></li>
            <li><span>${A.esc(A.t('pay.settlement'))}</span><b>${A.esc(A.t('pay.settle_' + (b.method === 'crypto' ? 'crypto_v' : b.method === 'paypal' ? 'paypal_v' : b.method === 'bank' ? 'bank' : b.method === 'card' || b.method === 'wallet' ? 'card_v' : 'local_v')))}</b></li>
            ${payDetail.join('')}
          </ul>
        </div>
        <div>
          <h4 class="card__title" style="font-size:.95rem">${A.esc(A.t('co.allocation'))}</h4>
          <ul class="kpi-list" style="margin-top:8px">
            <li><span>${A.esc(A.t('share.landlord'))}</span><b>${A.money(t.shares.landlord)}</b></li>
            <li><span>${A.esc(A.t('share.platform'))}</span><b>${A.money(t.shares.platform)}</b></li>
            <li><span>${A.esc(A.t('share.ai'))}</span><b>${A.money(t.shares.ai)}</b></li>
            <li><span>${A.esc(A.t('share.sales'))}</span><b>${A.money(t.shares.sales)}</b></li>
          </ul>
        </div>
      </div>
      <div class="card__foot">
        <h4 class="card__title" style="font-size:.95rem">${A.esc(A.t('co.next_steps'))}</h4>
        <ol class="steps" style="margin-top:8px">
          <li><span>${A.esc(A.t('co.next_1'))}</span></li>
          <li><span>${A.esc(A.t('co.next_2'))}</span></li>
          <li><span>${A.esc(A.t('co.next_3'))}</span></li>
        </ol>
        <p class="tiny muted" style="margin:12px 0 0">${A.esc(A.t('co.invoice_footer', { email: CFG.brand.email }))}</p>
      </div>
    </div>`;
  }

  /* ---------- demo helper ------------------------------------------------- */
  function demoFill(autoPay) {
    q('coCompany').value = 'Wing Fat Bakery Ltd';
    q('coBr').value = '71234567-000-09-25-A';
    q('coName').value = 'Chan Tai Man';
    q('coEmail').value = 'marketing@wingfat.example';
    q('coPhone').value = '+852 9123 4567';
    q('coLanding').value = 'https://wingfat.example/mooncake';
    q('coTerms').checked = true;
    renderAll();
    if (autoPay) setTimeout(pay, 300);
  }

  /* ---------- orchestration ---------------------------------------------- */
  function renderAll() {
    const empty = !S.cart().length;
    q('coEmpty').classList.toggle('hide', !empty);
    q('coGrid').classList.toggle('hide', empty);
    if (empty) { renderSteps(); return; }
    renderLines(); renderMethods(); renderMethodBody(); renderSummary();
    step = q('coCompany').value && q('coEmail').value ? 3 : 2;
    renderSteps();
  }

  function initObjectives() {
    q('coObjective').innerHTML = window.LG_OBJECTIVES
      .map(o => `<option value="${o.id}">${A.esc(A.L(o.label))}</option>`).join('');
  }

  function updateAiFee() {
    q('coAiFee').textContent = ai.enabled
      ? A.money(S.aiFee({ enabled: true, languages: ai.languages, hologram: ai.hologram }))
      : '—';
  }

  function init() {
    initObjectives();
    initAi();
    q('coAiToggle').addEventListener('change', e => { ai.enabled = e.target.checked; updateAiFee(); renderAll(); });
    q('coAiLangs').addEventListener('change', e => { ai.languages = parseInt(e.target.value, 10); updateAiFee(); renderAll(); });
    q('coAiHolo').addEventListener('change', e => { ai.hologram = e.target.value === 'yes'; updateAiFee(); renderAll(); });
    q('coPay').addEventListener('click', pay);
    q('coPrint').addEventListener('click', () => window.print());
    ['coCompany', 'coEmail'].forEach(id => q(id).addEventListener('change', renderAll));
    if (q('coDemo')) q('coDemo').addEventListener('click', () => demoFill(false));
    updateAiFee();
    renderAll();
    const mode = params().get('demo');
    if (mode) demoFill(mode === 'pay');
    const m = params().get('method');
    if (m && METHODS.some(x => x.id === m)) { method = m; renderAll(); }
  }
  const params = () => new URLSearchParams(location.search);

  document.addEventListener('DOMContentLoaded', init);
  A.onLangChange(() => { initObjectives(); initAi(); updateAiFee(); renderAll(); });
})();
