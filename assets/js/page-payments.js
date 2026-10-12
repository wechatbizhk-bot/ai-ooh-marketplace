/* ============================================================================
 * 3dNakedEye — page-payments.js
 * The payment-solutions page: the four families of rail, the registry the
 * server actually serves (/api/pay/methods), the operator's setup panel with
 * masked credentials and a connection test, the FAQ from the shared corpus, and
 * the seven-scene animated walk-through with the site's AI presenter.
 *
 * Everything the panel writes goes to the server; the page never holds a key.
 * ==========================================================================*/
(function () {
  'use strict';

  const A = () => window.LG.app;
  const t = (k, v) => A().t(k, v);
  const esc = s => A().esc(s == null ? '' : s);
  const q = id => document.getElementById(id);

  const FAMILY_KEY = { card: 'pm.family_card', wallet: 'pm.family_wallet', bank: 'pm.family_bank', crypto: 'pm.family_crypto', token: 'pm.family_token' };
  const state = { public: null, admin: null, settings: null, online: null, token: '', notice: '', tests: {} };

  const api = async (method, route, body, headers) => {
    const res = await fetch(route, {
      method,
      headers: Object.assign({ 'Content-Type': 'application/json' }, headers || {}),
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || ('HTTP ' + res.status));
    return json;
  };
  const money = n => A().money(Number(n) || 0, { maximumFractionDigits: 2 });
  const feeText = f => (f.pct ? f.pct + '%' : '') + (f.pct && f.fixed ? ' + ' : '') + (f.fixed ? money(f.fixed) : (f.pct ? '' : '—'));
  const settleText = n => (Number(n) === 0 ? t('pm.same_day') : t('pm.days', { n }));

  /* the registry shown when the server is not running — same shape, built in */
  const FALLBACK = [
    { id: 'visa', family: 'card', label: 'Visa', mode: 'test', currencies: ['HKD', 'USD'], fee: { pct: 2.9, fixed: 2.35 }, settle: 2 },
    { id: 'mastercard', family: 'card', label: 'Mastercard', mode: 'test', currencies: ['HKD', 'USD'], fee: { pct: 2.9, fixed: 2.35 }, settle: 2 },
    { id: 'unionpay', family: 'card', label: 'UnionPay', mode: 'test', currencies: ['HKD', 'CNY'], fee: { pct: 3.1, fixed: 2.35 }, settle: 3 },
    { id: 'paypal', family: 'wallet', label: 'PayPal', mode: 'test', currencies: ['HKD', 'USD'], fee: { pct: 3.4, fixed: 2.35 }, settle: 3 },
    { id: 'swift', family: 'bank', label: 'SWIFT / T-T remittance', mode: 'live', currencies: ['HKD', 'USD', 'EUR'], fee: { pct: 0, fixed: 0 }, settle: 3 },
    { id: 'fps', family: 'bank', label: 'FPS / local transfer', mode: 'live', currencies: ['HKD'], fee: { pct: 0, fixed: 0 }, settle: 1 },
    { id: 'usdt', family: 'crypto', label: 'USDT', mode: 'live', currencies: ['USD', 'HKD'], fee: { pct: 1, fixed: 0 }, settle: 0 },
    { id: 'btc', family: 'crypto', label: 'Bitcoin', mode: 'live', currencies: ['USD'], fee: { pct: 1, fixed: 0 }, settle: 0 },
    { id: 'token', family: 'token', label: 'Platform token / ERC-20', mode: 'off', currencies: ['USD'], fee: { pct: 0.5, fixed: 0 }, settle: 0 }
  ];

  /* ---------- the rail table ---------------------------------------------- */
  function railsHtml() {
    const rows = (state.public || FALLBACK).map(m => `<tr>
      <td class="cat-table__key">${esc(m.label)}${m.scheme ? `<div class="tiny muted">${esc(m.scheme)}</div>` : ''}</td>
      <td class="tiny">${esc(t(FAMILY_KEY[m.family] || 'pm.family_card'))}</td>
      <td class="tiny">${esc((m.currencies || []).join(' · '))}</td>
      <td class="num">${esc(feeText(m.fee))}</td>
      <td class="num tiny">${esc(settleText(m.settle))}</td>
      <td class="tiny">${m.status === 'needs-setup' || (m.missing && m.missing.length && !m.open)
        ? '<span class="pill pill--warn">' + esc(t('pm.need_setup')) + '</span>'
        : m.open ? '<span class="pill pill--ok">' + esc(t('pm.on', { mode: m.mode })) + '</span>'
        : '<span class="pill pill--muted">' + esc(t('pm.off')) + '</span>'}</td>
    </tr>`).join('');
    return `<div class="table-wrap"><table class="data pl-table">
      <thead><tr>
        <th>${esc(t('pm.col_rail'))}</th><th>${esc(t('pm.col_family'))}</th><th>${esc(t('pm.col_cur'))}</th>
        <th class="num">${esc(t('pm.col_fee'))}</th><th class="num">${esc(t('pm.col_settle'))}</th><th>${esc(t('pm.col_mode'))}</th>
      </tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  /* ---------- the operator panel ------------------------------------------ */
  function setupHtml() {
    if (state.online === false) {
      return `<p class="note note--warn">${esc(t('pm.api_off'))}</p>`;
    }
    if (!state.admin) {
      return `<div class="card">
        <p>${esc(t('pm.op_locked'))}</p>
        <div class="row row--wrap">
          <input type="password" id="pmToken" placeholder="${esc(t('pm.op_token'))}" autocomplete="off">
          <button class="btn btn--primary btn--sm" type="button" id="pmLoad">${esc(t('pm.op_connect'))}</button>
          <a class="btn btn--ghost btn--sm" href="login.html?role=operator">${esc(t('pm.op_login'))}</a>
        </div>
        ${state.notice ? `<p class="tiny muted">${esc(state.notice)}</p>` : `<p class="tiny muted">${esc(t('pm.op_bad_token'))}</p>`}
      </div>`;
    }
    const rows = state.admin.map(m => {
      const creds = m.needs.map(k => {
        const c = m.credentials[k] || {};
        return `<label class="pm-cred"><span>${esc(k)}</span>
          <input type="${/secret|key|token|password/i.test(k) ? 'password' : 'text'}" data-cred="${esc(m.id)}:${esc(k)}"
                 value="" placeholder="${esc(c.set ? (c.hint || t('pm.op_hint_set')) : t('pm.op_hint_unset'))}" autocomplete="off"></label>`;
      }).join('');
      const test = state.tests[m.id];
      return `<div class="pm-method" data-method="${esc(m.id)}">
        <div class="pm-method__head">
          <label class="check"><input type="checkbox" data-field="enabled" data-id="${esc(m.id)}"${m.enabled ? ' checked' : ''}>
            <span><strong>${esc(m.label)}</strong> <span class="tiny muted">${esc(t(FAMILY_KEY[m.family] || 'pm.family_card'))}${m.scheme ? ' · ' + esc(m.scheme) : ''}</span></span></label>
          <span class="pill ${m.configured ? 'pill--ok' : 'pill--warn'}">${esc(m.configured ? t('pm.op_hint_set') : t('pm.need_setup'))}</span>
        </div>
        <div class="pm-method__grid">
          <div class="form-row"><label>${esc(t('pm.op_mode'))}</label>
            <select data-field="mode" data-id="${esc(m.id)}">${m.modes.map(x =>
              `<option value="${esc(x)}"${m.mode === x ? ' selected' : ''}>${esc(x)}</option>`).join('')}</select></div>
          <div class="form-row"><label>${esc(t('pm.op_fee'))}</label>
            <div class="row">
              <input type="number" step="0.1" min="0" max="20" data-field="pct" data-id="${esc(m.id)}" value="${esc(m.fee.pct)}">
              <input type="number" step="0.05" min="0" data-field="fixed" data-id="${esc(m.id)}" value="${esc(m.fee.fixed)}">
            </div></div>
          <div class="form-row"><label>${esc(t('pm.op_settle'))}</label>
            <input type="number" min="0" max="30" data-field="settle" data-id="${esc(m.id)}" value="${esc(m.settle)}"></div>
        </div>
        <details class="pm-creds"><summary>${esc(t('pm.op_creds'))} · ${m.needs.length}</summary>
          <div class="pm-cred-grid">${creds}</div></details>
        <div class="row row--wrap">
          <button class="btn btn--primary btn--sm" type="button" data-save="${esc(m.id)}">${esc(t('pm.op_save'))}</button>
          <button class="btn btn--ghost btn--sm" type="button" data-test="${esc(m.id)}">${esc(t('pm.op_test'))}</button>
          ${test ? `<span class="pill ${test.ok ? 'pill--ok' : 'pill--bad'}">${esc(test.ok ? t('pm.op_test_ok') : t('pm.op_test_fail'))}</span>` : ''}
        </div>
        ${test ? `<ul class="kpi-list">${test.steps.map(s => `<li><span>${esc(s.step)}</span><b>${s.ok ? '✓' : '×'} ${esc(s.detail)}</b></li>`).join('')}</ul>` : ''}
      </div>`;
    }).join('');
    return `<p class="af-verdict af-verdict--ok">${esc(t('pm.api_on', { n: 1, n2: state.admin.length }))}</p>
      ${state.notice ? `<p class="note note--ok">${esc(state.notice)}</p>` : ''}
      <div class="pm-list">${rows}</div>
      <p class="tiny muted">${esc(t('pm.op_why_secret'))}</p>`;
  }

  /* ---------- the seven-scene walk-through -------------------------------- */
  const SCENES = [
    { id: 1, key: 'pm.vid_scene1', cap: 'pm.vid_scene1_c', draw: drawRails },
    { id: 2, key: 'pm.vid_scene2', cap: 'pm.vid_scene2_c', draw: drawCreds },
    { id: 3, key: 'pm.vid_scene3', cap: 'pm.vid_scene3_c', draw: drawTest },
    { id: 4, key: 'pm.vid_scene4', cap: 'pm.vid_scene4_c', draw: drawSwitch },
    { id: 5, key: 'pm.vid_scene5', cap: 'pm.vid_scene5_c', draw: drawPay },
    { id: 6, key: 'pm.vid_scene6', cap: 'pm.vid_scene6_c', draw: drawSettle },
    { id: 7, key: 'pm.vid_scene7', cap: 'pm.vid_scene7_c', draw: drawEarn }
  ];
  const SCENE_MS = 11000;
  let film = { playing: false, scene: 0, started: 0, raf: 0, canvas: null, ctx: null };

  const reduceMotion = () => {
    try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; }
  };

  /* --- the presenter: a simple talking avatar, drawn every frame --- */
  function drawPresenter(ctx, W, H, t01, speaking) {
    const cx = W * 0.14, cy = H * 0.44, r = H * 0.13;
    /* shoulders */
    ctx.save();
    const body = ctx.createLinearGradient(cx, cy, cx, cy + r * 2.6);
    body.addColorStop(0, 'rgba(11,95,255,.85)');
    body.addColorStop(1, 'rgba(107,77,255,.55)');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(cx - r * 1.5, cy + r * 3.2);
    ctx.quadraticCurveTo(cx - r * 1.4, cy + r * 1.1, cx, cy + r);
    ctx.quadraticCurveTo(cx + r * 1.4, cy + r * 1.1, cx + r * 1.5, cy + r * 3.2);
    ctx.closePath();
    ctx.fill();
    /* head */
    ctx.fillStyle = '#f6f9ff';
    ctx.strokeStyle = 'rgba(13,33,58,.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    /* eyes, with a blink every few seconds */
    const blink = (t01 % 4) > 3.82;
    ctx.fillStyle = 'rgba(13,33,58,.85)';
    [-0.34, 0.34].forEach(dx => {
      ctx.beginPath();
      if (blink) { ctx.rect(cx + dx * r - r * 0.13, cy - r * 0.16, r * 0.26, 3); }
      else { ctx.arc(cx + dx * r, cy - r * 0.12, r * 0.11, 0, Math.PI * 2); }
      ctx.fill();
    });
    /* mouth: opens while speaking */
    const open = speaking ? 2 + 5 * Math.abs(Math.sin(t01 * 9)) : 1.5;
    ctx.beginPath();
    ctx.ellipse(cx, cy + r * 0.42, r * 0.22, open, 0, 0, Math.PI * 2);
    ctx.fill();
    /* a speaking ring, so it is obvious the presenter is talking */
    if (speaking) {
      ctx.strokeStyle = 'rgba(11,95,255,.35)';
      ctx.beginPath();
      ctx.arc(cx, cy, r + 8 + 4 * Math.sin(t01 * 6), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    /* name plate */
    ctx.save();
    ctx.font = '600 13px Inter, "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(70,88,111,.9)';
    ctx.textAlign = 'center';
    ctx.fillText(A().t('pm.vid_play').replace(/^.*?(AI|presenter).*$/i, 'AI presenter') === A().t('pm.vid_play') ? 'AI presenter' : 'AI presenter', cx, cy + r * 3.7);
    ctx.restore();
  }

  function panel(ctx, x, y, w, h, label, sub, accent) {
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = accent ? 'rgba(11,95,255,.55)' : 'rgba(13,33,58,.14)';
    ctx.lineWidth = accent ? 2 : 1.4;
    const r = 12;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = accent ? 'rgba(11,95,255,.9)' : 'rgba(13,33,58,.85)';
    ctx.font = '700 15px Inter, "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(label, x + 14, y + 26);
    if (sub) {
      ctx.fillStyle = 'rgba(70,88,111,.85)';
      ctx.font = '400 12px Inter, "Segoe UI", system-ui, sans-serif';
      ctx.fillText(sub, x + 14, y + 46);
    }
    ctx.restore();
  }

  const money2 = n => A().money(n, { maximumFractionDigits: 0 });

  function drawRails(ctx, W, H, tt) {
    const names = ['Visa', 'Mastercard', 'UnionPay', 'PayPal', 'SWIFT / T-T', 'USDT', 'Token'];
    names.forEach((n, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = W * 0.30 + col * W * 0.34, y = H * 0.14 + row * H * 0.17;
      panel(ctx, x, y, W * 0.30, H * 0.13, n, i === 3 ? 'wallet' : i === 4 ? 'bank' : i === 6 ? 'ERC-20' : 'card / crypto', (Math.floor(tt * 2) % names.length) === i);
    });
  }

  function drawCreds(ctx, W, H, tt) {
    const keys = ['sk_live_••••4f2a', 'pk_live_••••91c', 'whsec_••••7e0d'];
    keys.forEach((k, i) => {
      const y = H * 0.20 + i * H * 0.16;
      panel(ctx, W * 0.30, y, W * 0.58, H * 0.12, i === 0 ? 'API keys' : i === 1 ? 'publishable key' : 'webhook secret', k, (Math.floor(tt * 1.4) % keys.length) === i);
    });
    ctx.save();
    ctx.fillStyle = 'rgba(15,157,88,.95)';
    ctx.font = '700 14px Inter, system-ui, sans-serif';
    ctx.fillText('stored on the server · never returned', W * 0.30, H * 0.20 + keys.length * H * 0.16 + 6);
    ctx.restore();
  }

  function drawTest(ctx, W, H, tt) {
    const steps = ['credentials set', 'key format matches mode', 'wallet address valid for chain'];
    steps.forEach((s, i) => {
      const y = H * 0.20 + i * H * 0.17;
      const active = (Math.floor(tt * 1.3) % steps.length) === i;
      panel(ctx, W * 0.30, y, W * 0.58, H * 0.13, s, active ? 'testing…' : '✓', active);
    });
  }

  function drawSwitch(ctx, W, H, tt) {
    panel(ctx, W * 0.30, H * 0.18, W * 0.58, H * 0.22, 'Rail enabled', 'fee 2.9% + HK$2.35 · settles in 2 days', true);
    panel(ctx, W * 0.30, H * 0.48, W * 0.58, H * 0.22, 'Checkout offers it', 'only rails that are on and complete', Math.floor(tt * 1.5) % 2 === 0);
  }

  function drawPay(ctx, W, H, tt) {
    const pct = Math.min(1, (tt % 5) / 3);
    panel(ctx, W * 0.30, H * 0.18, W * 0.58, H * 0.20, 'Order HK$4,800', 'card · 3-D Secure · token returned', true);
    panel(ctx, W * 0.30, H * 0.46, W * 0.58, H * 0.24, 'Payment received', pct < 1 ? 'authorising…' : 'token · ref ORD-1042', pct < 1);
    ctx.save();
    ctx.fillStyle = 'rgba(11,95,255,.9)';
    ctx.fillRect(W * 0.30 + 14, H * 0.72, (W * 0.58 - 28) * pct, 8);
    ctx.restore();
  }

  function drawSettle(ctx, W, H, tt) {
    const rows = [['Visa', '2.9% + 2.35', '-HK$141'], ['SWIFT', '0%', 'HK$0'], ['USDT', '1%', '-HK$48']];
    rows.forEach((r, i) => {
      const y = H * 0.22 + i * H * 0.16;
      panel(ctx, W * 0.30, y, W * 0.58, H * 0.12, r[0], r[1] + '  ·  ' + r[2], (Math.floor(tt * 1.2) % rows.length) === i);
    });
  }

  function drawEarn(ctx, W, H, tt) {
    const base = 4800, kept = base - (base * 0.029 + 2.35);
    panel(ctx, W * 0.30, H * 0.16, W * 0.58, H * 0.16, 'Card rail', money2(4800) + ' → ' + money2(kept) + ' kept', false);
    panel(ctx, W * 0.30, H * 0.38, W * 0.58, H * 0.16, 'Bank transfer', money2(4800) + ' → ' + money2(4800) + ' kept', true);
    panel(ctx, W * 0.30, H * 0.60, W * 0.58, H * 0.16, 'Crypto / token', money2(4800) + ' → ' + money2(4800 - 48) + ' kept', false);
    ctx.save();
    ctx.fillStyle = 'rgba(13,33,58,.7)';
    ctx.font = '600 13px Inter, system-ui, sans-serif';
    ctx.fillText('+ ' + money2((4800 * 0.029 + 2.35) - 48) + ' more, on the same order', W * 0.30, H * 0.82);
    ctx.restore();
  }

  function drawFilm(now) {
    const c = film.canvas, ctx = film.ctx;
    if (!c || !ctx) return;
    const W = c.width, H = c.height;
    const tt = now / 1000;
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#f7fafd');
    bg.addColorStop(1, '#e8eff8');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    /* the caption strip along the bottom keeps the scene readable without sound */
    drawPresenter(ctx, W, H, tt, film.playing);
    SCENES[film.scene].draw(ctx, W, H, tt);
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,.92)';
    ctx.fillRect(0, H * 0.88, W, H * 0.12);
    ctx.fillStyle = 'rgba(13,33,58,.92)';
    ctx.font = '600 15px Inter, "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    const cap = A().t(SCENES[film.scene].cap);
    ctx.fillText(cap.length > 118 ? cap.slice(0, 115) + '…' : cap, W / 2, H * 0.945);
    ctx.restore();
  }

  function loop(ts) {
    if (!film.playing) return;
    const elapsed = ts - film.started;
    const idx = Math.min(SCENES.length - 1, Math.floor(elapsed / SCENE_MS));
    if (idx !== film.scene) { film.scene = idx; paintFilm(); }
    if (elapsed >= SCENE_MS * SCENES.length) { stopFilm(); film.scene = SCENES.length - 1; paintFilm(); drawFilm(performance.now()); return; }
    drawFilm(ts);
    film.raf = requestAnimationFrame(loop);
  }
  function playFilm() {
    if (!film.canvas || film.playing) return;
    if (film.scene >= SCENES.length - 1) film.scene = 0;
    film.playing = true;
    film.started = performance.now() - film.scene * SCENE_MS;
    film.raf = requestAnimationFrame(loop);
    paintFilm();
  }
  function stopFilm() {
    film.playing = false;
    if (film.raf) cancelAnimationFrame(film.raf);
    film.raf = 0;
    paintFilm();
  }
  function paintFilm() {
    const host = document.querySelector('[data-visual="pm-film"]');
    if (!host) return;
    const btn = host.querySelector('.pm-play');
    if (btn) {
      btn.textContent = film.playing ? A().t('pm.vid_pause') : (film.scene >= SCENES.length - 1 ? A().t('pm.vid_replay') : A().t('pm.vid_play'));
      btn.setAttribute('aria-pressed', film.playing ? 'true' : 'false');
    }
    host.querySelectorAll('.pm-chapter').forEach((c, i) => {
      c.classList.toggle('is-active', i === film.scene);
      c.setAttribute('aria-current', i === film.scene ? 'true' : 'false');
    });
    const bar = host.querySelector('.pm-bar span');
    if (bar) bar.style.width = (((film.scene + (film.playing ? 1 : 0.999)) / SCENES.length) * 100) + '%';
    const cap = host.querySelector('.pm-caption');
    if (cap) cap.textContent = A().t(SCENES[film.scene].key);
  }

  function filmHtml() {
    return `<div class="hb-frame"><canvas class="hb-canvas pm-canvas" width="1120" height="630" role="img"
      aria-label="${esc(t('pm.vid_title'))}"></canvas></div>
      <div class="hb-bar pm-bar" style="--p:0%"><span></span></div>
      <div class="hb-controls">
        <button type="button" class="btn btn--primary btn--sm pm-play" aria-pressed="false">${esc(t('pm.vid_play'))}</button>
        <ol class="hb-chapters">${SCENES.map((s, i) =>
          `<li><button type="button" class="hb-chapter pm-chapter${i === 0 ? ' is-active' : ''}" data-scene="${i}">
            <span class="hb-num">${i + 1}</span>${esc(t(s.key))}</button></li>`).join('')}</ol>
      </div>
      <p class="hb-caption pm-caption">${esc(t(SCENES[0].key))}</p>
      <p class="tiny muted hb-note">${esc(t('pm.vid_note'))}</p>`;
  }

  /* ---------- page --------------------------------------------------------- */
  function render() {
    const host = q('payBody');
    if (!host) return;
    const rails = (state.public || FALLBACK);
    const families = new Set(rails.map(m => m.family)).size;
    const currencies = new Set(rails.reduce((a, m) => a.concat(m.currencies || []), [])).size;
    host.innerHTML = `
      <div class="page-head">
        <span class="eyebrow">${esc(t('pm.eyebrow'))}</span>
        <h1>${esc(t('pm.title'))}</h1>
        <p class="lede">${esc(t('pm.lede'))}</p>
        <p class="tiny muted">${esc(t('pm.source_line'))}</p>
      </div>
      <section class="grid grid--4 mega-stats">
        <div class="stat"><span class="stat__value">${rails.length}</span><span class="stat__label">${esc(t('pm.stat1'))}</span></div>
        <div class="stat"><span class="stat__value">${families}</span><span class="stat__label">${esc(t('pm.stat2'))}</span></div>
        <div class="stat"><span class="stat__value">${currencies}</span><span class="stat__label">${esc(t('pm.stat3'))}</span></div>
        <div class="stat"><span class="stat__value">${(state.settings && state.settings.crypto ? state.settings.crypto.rateLockSeconds : 900) / 60} min</span><span class="stat__label">${esc(t('pm.stat4'))}</span></div>
      </section>

      <section class="section--tight" id="families">
        <div class="section-head"><h2>${esc(t('pm.b1'))}</h2><p>${esc(t('pm.b1_lede'))}</p></div>
        <div class="grid grid--4 mega-cards">
          ${['f1', 'f2', 'f3', 'f4'].map((f, i) => `<div class="card mega-card">
            <span class="mega-card__icon" aria-hidden="true">${['▤', '◍', '⌸', '⬡'][i]}</span>
            <h3>${esc(t('pm.' + f))}</h3><p>${esc(t('pm.' + f + '_d'))}</p></div>`).join('')}
        </div>
      </section>

      <section class="section--tight" id="rails">
        <div class="section-head"><h2>${esc(t('pm.b2'))}</h2><p>${esc(t('pm.b2_lede'))}</p></div>
        ${railsHtml()}
      </section>

      <section class="section--tight" id="setup">
        <div class="section-head"><h2>${esc(t('pm.b3'))}</h2><p>${esc(t('pm.b3_lede'))}</p></div>
        ${setupHtml()}
      </section>

      <section class="section--tight" id="flow">
        <div class="section-head"><h2>${esc(t('pm.b4'))}</h2><p>${esc(t('pm.b4_lede'))}</p></div>
        <ol class="steps">${['1', '2', '3', '4'].map(n => `<li><span><strong>${esc(t('pm.flow' + n))}</strong> — ${esc(t('pm.flow' + n + '_d'))}</span></li>`).join('')}</ol>
      </section>

      <section class="section--tight" id="film">
        <div class="section-head"><h2>${esc(t('pm.vid_title'))}</h2><p>${esc(t('pm.vid_lede'))}</p></div>
        <div class="card card--flush stage-card" data-visual="pm-film" id="pmFilm">${filmHtml()}</div>
      </section>

      <section class="section--tight" id="faq">
        <div class="section-head"><h2>${esc(t('pm.b5'))}</h2><p>${esc(t('pm.b5_lede'))}</p></div>
        <div class="mega-faq">${['pay_methods', 'pay_setup', 'pay_card', 'pay_swift', 'pay_crypto', 'pay_fees', 'pay_security', 'pay_reconcile'].map(id =>
          `<details class="faq-item" id="faq-${esc(id)}"><summary><span class="faq-item__q">${esc(t('faq.' + id + '.q'))}</span>
            <span class="faq-item__chev" aria-hidden="true">▾</span></summary>
            <div class="faq-item__a"><p>${esc(t('faq.' + id + '.a'))}</p>
              <div class="faq-item__links"><a class="btn btn--quiet btn--sm" href="faq.html#faq-${esc(id)}">${esc(t('nav.faq'))}</a></div>
            </div></details>`).join('')}</div>
      </section>

      <section class="section--tight">
        <div class="card mega-note">
          <p>${esc(t('pm.cta_lede'))}</p>
          <div class="row row--wrap">
            <a class="btn btn--primary" href="contact.html?interest=enterprise">${esc(t('pm.cta'))}</a>
            <a class="btn btn--ghost" href="checkout.html">${esc(t('pm.cta2'))}</a>
            <a class="btn btn--quiet" href="docs.html#payments">${esc(t('nav.docs'))}</a>
          </div>
        </div>
        <p class="tiny muted">${esc(t('pm.api_note'))}</p>
      </section>`;
    bindFilm();
    if (reduceMotion()) { stopFilm(); drawFilm(0); }
    else playFilm();
  }

  function bindFilm() {
    const host = document.querySelector('[data-visual="pm-film"]');
    if (!host) return;
    film.canvas = host.querySelector('.pm-canvas');
    film.ctx = film.canvas ? film.canvas.getContext('2d') : null;
    const btn = host.querySelector('.pm-play');
    if (btn && !btn.dataset.bound) {
      btn.dataset.bound = '1';
      btn.addEventListener('click', () => (film.playing ? stopFilm() : playFilm()));
    }
    host.querySelectorAll('.pm-chapter').forEach(b => {
      if (b.dataset.bound) return;
      b.dataset.bound = '1';
      b.addEventListener('click', () => {
        stopFilm();
        film.scene = Number(b.getAttribute('data-scene'));
        drawFilm(performance.now());
        paintFilm();
      });
    });
  }

  function bindPage() {
    const on = (id, ev, fn) => { const el = q(id); if (el && !el.dataset.bound) { el.dataset.bound = '1'; el.addEventListener(ev, fn); } };
    on('pmLoad', 'click', async () => {
      state.token = q('pmToken') ? q('pmToken').value : '';
      try {
        const r = await api('GET', '/api/pay/methods?admin=1', undefined, { 'X-Operator-Token': state.token });
        state.admin = r.methods; state.settings = r.settings; state.online = true; state.notice = '';
      } catch (e) { state.notice = e.message; state.admin = null; }
      paintSetup();
    });
    document.querySelectorAll('[data-save]').forEach(b => {
      if (b.dataset.bound) return;
      b.dataset.bound = '1';
      b.addEventListener('click', async () => {
        const id = b.getAttribute('data-save');
        const val = f => { const el = document.querySelector(`[data-field="${f}"][data-id="${id}"]`); return el ? el.value : undefined; };
        const creds = {};
        document.querySelectorAll(`[data-cred^="${id}:"]`).forEach(i => {
          if (i.value) creds[i.getAttribute('data-cred').split(':')[1]] = i.value;
        });
        try {
          const r = await api('POST', '/api/pay/methods', {
            method: id,
            enabled: document.querySelector(`[data-field="enabled"][data-id="${id}"]`).checked,
            mode: val('mode'),
            fee: { pct: Number(val('pct')), fixed: Number(val('fixed')) },
            settle: Number(val('settle')),
            credentials: Object.keys(creds).length ? creds : undefined
          }, { 'X-Operator-Token': state.token });
          const i = state.admin.findIndex(m => m.id === id);
          if (i >= 0) state.admin[i] = r.method;
          state.notice = t('pm.op_saved');
          await loadPublic();
        } catch (e) { state.notice = e.message; }
        paintSetup();
      });
    });
    document.querySelectorAll('[data-test]').forEach(b => {
      if (b.dataset.bound) return;
      b.dataset.bound = '1';
      b.addEventListener('click', async () => {
        const id = b.getAttribute('data-test');
        try {
          const r = await api('POST', '/api/pay/test', { method: id }, { 'X-Operator-Token': state.token });
          state.tests[id] = r.result;
        } catch (e) { state.tests[id] = { ok: false, steps: [{ step: 'api', ok: false, detail: e.message }] }; }
        paintSetup();
      });
    });
  }

  function paintSetup() {
    const host = q('pmSetup');
    if (!host) return;
    host.innerHTML = setupHtml();
    bindPage();
  }

  async function loadPublic() {
    try {
      const r = await api('GET', '/api/pay/methods');
      state.public = r.methods;
      state.online = true;
    } catch (e) { state.public = null; state.online = false; }
    render();
    paintSetup();
  }

  document.addEventListener('DOMContentLoaded', loadPublic);
  A().onLangChange(() => { render(); paintSetup(); });
  window.LG = window.LG || {};
  window.LG.payments = { render, state, film, scenes: SCENES, load: loadPublic, play: playFilm, pause: stopFilm };
})();
