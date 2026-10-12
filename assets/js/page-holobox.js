/* ============================================================================
 * 3dNakedEye — page-holobox.js
 * The Holobox page's explainer.
 *
 * The optical stack is drawn in the browser rather than embedded as third-party
 * footage: a light box, a diffuser and a transparent LCD, seen from the side,
 * with the viewer's sight lines showing why the figure reads as solid. Four
 * chapters explain the stack, the depth cue, the live 4K link and the AI avatar.
 *
 * A real film can replace it without touching this file: set
 *   LG_CONFIG.holobox.video = { mode: 'src', src: 'assets/media/holobox.mp4', poster: … }
 * or mode 'youtube' with a youtubeId, and the player renders that instead.
 * ==========================================================================*/
(function () {
  'use strict';

  const A = () => window.LG.app;
  const t = (k, v) => A().t(k, v);
  const esc = s => A().esc(s == null ? '' : s);

  const CH = ['hb.ch1', 'hb.ch2', 'hb.ch3', 'hb.ch4'];
  const CHAPTER_MS = 9000;
  const state = { chapter: 0, playing: false, started: 0, raf: 0, host: null, canvas: null, ctx: null };
  const reduceMotion = () => {
    try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
    catch (e) { return false; }
  };

  const cfg = () => ((window.LG_CONFIG || {}).holobox || {}).video || {};

  /* ---------- geometry ------------------------------------------------------
   * x positions are fractions of the canvas width, back (light box) to front
   * (viewer). They are the whole point of the drawing: the panel sits well in
   * front of the illuminated background, and that gap is the depth cue.       */
  const LAYERS = [
    { x: 0.40, key: 'hb.layer1' },
    { x: 0.53, key: 'hb.layer2' },
    { x: 0.66, key: 'hb.layer3' },
    { x: 0.88, key: 'hb.layer4' }
  ];

  function draw(now) {
    const c = state.canvas, ctx = state.ctx;
    if (!c || !ctx) return;
    const W = c.width, H = c.height;
    const ph = (now % 9000) / 9000;                 /* 0…1 sweep for the light */
    const ch = state.chapter;

    ctx.clearRect(0, 0, W, H);

    /* room */
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#f7fafd');
    bg.addColorStop(1, '#e8eff8');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(13,33,58,.05)';
    ctx.fillRect(0, H * 0.82, W, H * 0.18);

    const top = H * 0.16, bottom = H * 0.82, midY = (top + bottom) / 2;
    const cx = k => LAYERS[k].x * W;

    /* sight lines from the viewer to the panel: two rays that cross the gap */
    if (ch >= 1) {
      ctx.save();
      ctx.strokeStyle = 'rgba(11,95,255,.28)';
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 1.5;
      const eyeX = LAYERS[3].x * W, eyeY = midY;
      [[-0.16, 0.30], [0.16, 0.70]].forEach(([dy, target]) => {
        ctx.beginPath();
        ctx.moveTo(eyeX, eyeY + dy * H);
        ctx.lineTo(cx(2), top + target * (bottom - top));
        ctx.stroke();
      });
      ctx.restore();
    }

    /* 1. the illuminated light box */
    const glow = ctx.createLinearGradient(0, top, 0, bottom);
    glow.addColorStop(0, 'rgba(107,77,255,' + (0.22 + 0.18 * Math.sin(ph * Math.PI * 2)) + ')');
    glow.addColorStop(0.5, 'rgba(53,208,255,.45)');
    glow.addColorStop(1, 'rgba(11,95,255,.25)');
    ctx.fillStyle = glow;
    roundRect(ctx, cx(0) - W * 0.10, top, W * 0.09, bottom - top, 10);
    ctx.fill();

    /* light travelling from the box, through the diffuser, onto the panel */
    ctx.save();
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 7; i++) {
      const y = top + ((i + 0.5) / 7) * (bottom - top);
      const spread = 0.10 * W;
      const x0 = cx(0) - W * 0.01 + ((ph * spread) % spread);
      const g = ctx.createLinearGradient(x0, y, cx(2), y);
      g.addColorStop(0, 'rgba(53,208,255,.55)');
      g.addColorStop(1, 'rgba(53,208,255,0)');
      ctx.strokeStyle = g;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(cx(2) - 4, y + (midY - y) * 0.06);
      ctx.stroke();
    }
    ctx.restore();

    /* 2. the diffuser */
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    roundRect(ctx, cx(1) - 5, top - H * 0.02, 10, bottom - top + H * 0.04, 5);
    ctx.fill();

    /* 3. the transparent panel carrying the figure */
    const panelW = W * 0.075;
    ctx.save();
    ctx.shadowColor = 'rgba(107,77,255,.35)';
    ctx.shadowBlur = 26;
    const pane = ctx.createLinearGradient(cx(2) - panelW / 2, 0, cx(2) + panelW / 2, 0);
    pane.addColorStop(0, 'rgba(11,95,255,.20)');
    pane.addColorStop(0.5, 'rgba(53,208,255,.30)');
    pane.addColorStop(1, 'rgba(107,77,255,.20)');
    ctx.fillStyle = pane;
    roundRect(ctx, cx(2) - panelW / 2, top, panelW, bottom - top, 8);
    ctx.fill();
    ctx.restore();

    /* the figure, drawn as a person silhouette whose opacity pulses with the
       light so the panel clearly is the source of the image */
    const pulse = ch === 0 ? 0.55 + 0.45 * Math.abs(Math.sin(ph * Math.PI)) : 0.92;
    drawFigure(ctx, cx(2), top + (bottom - top) * 0.10, (bottom - top) * 0.78, pulse, ch);

    /* 4. the viewer */
    drawViewer(ctx, cx(3), midY, H, ch);

    /* labels + chapter caption */
    ctx.save();
    ctx.font = '600 13px Inter, "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    LAYERS.forEach((l, i) => {
      ctx.fillStyle = i === 2 ? 'rgba(11,95,255,.95)' : 'rgba(70,88,111,.85)';
      ctx.fillText(t(l.key), l.x * W, bottom + 26);
    });
    ctx.restore();

    /* the depth bracket between the light box and the panel */
    if (ch >= 1) {
      const y = top - 16;
      ctx.save();
      ctx.strokeStyle = 'rgba(11,95,255,.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx(0), y); ctx.lineTo(cx(2), y);
      ctx.moveTo(cx(0), y - 5); ctx.lineTo(cx(0), y + 5);
      ctx.moveTo(cx(2), y - 5); ctx.lineTo(cx(2), y + 5);
      ctx.stroke();
      ctx.fillStyle = 'rgba(11,95,255,.9)';
      ctx.font = '600 12px Inter, "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(t('hb.gap') + ' ≈ ' + Math.round((LAYERS[2].x - LAYERS[0].x) * 100) + ' %', (cx(0) + cx(2)) / 2, y - 8);
      ctx.restore();
    }

    if (ch === 2) {
      /* the camera and microphone sit on the panel */
      ctx.save();
      ctx.fillStyle = 'rgba(217,45,32,.9)';
      ctx.beginPath();
      ctx.arc(cx(2) + panelW * 0.9, top + 14, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(11,95,255,.9)';
      ctx.beginPath();
      ctx.arc(cx(2) - panelW * 0.9, top + 14, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(217,45,32,.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx(2) + panelW * 0.9, top + 14, 12 + 6 * Math.abs(Math.sin(ph * Math.PI * 2)), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  /* a person silhouette: head, shoulders, body — small on the panel */
  function drawFigure(ctx, x, y, h, alpha, chapter) {
    ctx.save();
    ctx.globalAlpha = alpha;
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, chapter === 3 ? 'rgba(255,84,112,.85)' : 'rgba(11,95,255,.85)');
    g.addColorStop(1, chapter === 3 ? 'rgba(107,77,255,.55)' : 'rgba(53,208,255,.55)');
    ctx.fillStyle = g;
    const headR = h * 0.10;
    ctx.beginPath();
    ctx.arc(x, y + headR, headR, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - h * 0.16, y + h);
    ctx.quadraticCurveTo(x - h * 0.15, y + headR * 2.6, x, y + headR * 2.5);
    ctx.quadraticCurveTo(x + h * 0.15, y + headR * 2.6, x + h * 0.16, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawViewer(ctx, x, y, H, chapter) {
    ctx.save();
    ctx.strokeStyle = 'rgba(13,33,58,.55)';
    ctx.fillStyle = 'rgba(13,33,58,.06)';
    ctx.lineWidth = 2;
    const r = H * 0.055;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, r * 0.24, 0, Math.PI * 2);
    ctx.fillStyle = chapter >= 1 ? 'rgba(11,95,255,.85)' : 'rgba(13,33,58,.55)';
    ctx.fill();
    ctx.restore();
  }

  function loop(ts) {
    if (!state.playing) return;
    const elapsed = ts - state.started;
    const idx = Math.min(CH.length - 1, Math.floor(elapsed / CHAPTER_MS));
    if (idx !== state.chapter) { state.chapter = idx; paintChrome(); }
    if (elapsed >= CHAPTER_MS * CH.length) { stop(); state.chapter = CH.length - 1; paintChrome(); draw(performance.now()); return; }
    draw(ts);
    state.raf = requestAnimationFrame(loop);
  }

  function play() {
    if (!state.canvas || state.playing) return;
    if (state.chapter >= CH.length - 1) state.chapter = 0;
    state.playing = true;
    state.started = performance.now() - state.chapter * CHAPTER_MS;
    state.raf = requestAnimationFrame(loop);
    paintChrome();
  }

  function stop() {
    state.playing = false;
    if (state.raf) cancelAnimationFrame(state.raf);
    state.raf = 0;
    paintChrome();
  }

  function goTo(i) {
    state.chapter = Math.max(0, Math.min(CH.length - 1, i));
    if (state.playing) state.started = performance.now() - state.chapter * CHAPTER_MS;
    paintChrome();
    draw(performance.now());
  }

  /* ---------- chrome ------------------------------------------------------- */
  function paintChrome() {
    const host = state.host;
    if (!host) return;
    const bar = host.querySelector('.hb-bar');
    const btn = host.querySelector('.hb-play');
    const cap = host.querySelector('.hb-caption');
    if (bar) bar.style.setProperty('--p', ((state.chapter + (state.playing ? 1 : 0.999)) / CH.length * 100) + '%');
    if (btn) {
      btn.textContent = state.playing ? t('hb.pause') : (state.chapter >= CH.length - 1 ? t('hb.replay') : t('hb.play'));
      btn.setAttribute('aria-pressed', state.playing ? 'true' : 'false');
    }
    if (cap) cap.textContent = t(CH[state.chapter]);
    host.querySelectorAll('.hb-chapter').forEach((c, i) => {
      c.classList.toggle('is-active', i === state.chapter);
      c.setAttribute('aria-current', i === state.chapter ? 'true' : 'false');
    });
  }

  function markup() {
    return `<div class="hb-frame"><canvas class="hb-canvas" width="1120" height="630" role="img"
        aria-label="${esc(t('hb.b1'))}"></canvas></div>
      <div class="hb-bar" style="--p:0%"><span></span></div>
      <div class="hb-controls">
        <button type="button" class="btn btn--primary btn--sm hb-play" aria-pressed="false">${esc(t('hb.play'))}</button>
        <ol class="hb-chapters">${CH.map((k, i) =>
          `<li><button type="button" class="hb-chapter${i === 0 ? ' is-active' : ''}" data-ch="${i}">
            <span class="hb-num">${i + 1}</span>${esc(t(k))}</button></li>`).join('')}</ol>
      </div>
      <p class="hb-caption">${esc(t(CH[0]))}</p>
      <p class="tiny muted hb-note">${esc(t('hb.player_note'))}</p>`;
  }

  /* ---------- a real film, when one is configured --------------------------- */
  function videoMarkup(v) {
    if (!v || !v.mode || v.mode === 'builtin') return '';
    if (v.mode === 'src' && v.src) {
      return `<div class="hb-video"><video controls preload="metadata" playsinline
        ${v.poster ? `poster="${esc(v.poster)}"` : ''} src="${esc(v.src)}"></video></div>`;
    }
    if (v.mode === 'youtube' && v.youtubeId) {
      return `<div class="hb-video hb-video--yt" data-yt="${esc(v.youtubeId)}">
        <button type="button" class="hb-yt-load btn btn--primary btn--sm">${esc(t('hb.play'))}</button></div>`;
    }
    return '';
  }

  function bindVideo(host) {
    const yt = host.querySelector('[data-yt]');
    if (!yt || yt.dataset.bound) return;
    yt.dataset.bound = '1';
    yt.querySelector('.hb-yt-load').addEventListener('click', () => {
      const id = yt.getAttribute('data-yt');
      yt.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0"
        title="${esc(t('hb.b1'))}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
    });
  }

  function render() {
    const host = document.querySelector('[data-visual="holobox"]');
    if (!host) return;
    /* ?hb=<0-3> opens the explainer on a chapter, which is how the screenshots
       in the README were taken */
    const want = /[?&]hb=(\d)/.exec(location.search || '');
    if (want) state.chapter = Math.max(0, Math.min(CH.length - 1, Number(want[1])));
    const film = videoMarkup(cfg());
    host.innerHTML = film ? film + markup().replace(/<div class="hb-frame">[\s\S]*?<\/div>/, '') : markup();
    bindVideo(host);
    state.host = host;

    if (film) { state.canvas = null; state.ctx = null; paintChrome(); return; }
    state.canvas = host.querySelector('.hb-canvas');
    state.ctx = state.canvas ? state.canvas.getContext('2d') : null;
    state.chapter = reduceMotion() ? 0 : state.chapter;
    /* a deep link paints the requested chapter and stays paused, so a shared
       link shows exactly the frame it promises */
    if (reduceMotion() || want) { stop(); draw(0); paintChrome(); }
    else { play(); }

    const btn = host.querySelector('.hb-play');
    if (btn) btn.addEventListener('click', () => (state.playing ? stop() : play()));
    host.querySelectorAll('.hb-chapter').forEach(b =>
      b.addEventListener('click', () => { stop(); goTo(Number(b.getAttribute('data-ch'))); }));
  }

  document.addEventListener('DOMContentLoaded', render);
  A().onLangChange(() => { stop(); render(); });
  /* do not animate in a tab nobody is looking at */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
  });
  window.LG = window.LG || {};
  window.LG.holobox = { render, play, pause: stop, goTo, state, chapters: CH };
})();
