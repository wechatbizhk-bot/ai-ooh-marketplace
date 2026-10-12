/* ============================================================================
 * 3dNakedEye — page-preview.js
 * Creative Preview: accept a design or video file in ANY format, show it on the
 * device it will actually run on, and check it against the device rules.
 *
 * Design decisions that matter:
 *   • Local only. Files are decoded with object URLs inside the browser; nothing
 *     is uploaded, so an unreleased campaign never leaves the advertiser's device.
 *   • Honest about formats. Images, GIF/WebP animation, SVG, video and PDF-based
 *     files preview natively. A design binary (.psd/.indd/.fig/.sketch) cannot be
 *     rendered by a browser, so it gets a file card and a plain explanation
 *     instead of a fake thumbnail. An .ai/.eps file that really is PDF inside
 *     (Illustrator writes one) is detected by its %PDF signature and previewed.
 *   • The check is real pixel analysis, not a badge: black coverage, safe margin,
 *     mean luminance, dominant colours, alpha, edge contact — from a canvas for
 *     images and sampled across the timeline for video, plus a worst-frame figure.
 *   • The device simulation mirrors the manufacturer FAQ: square 1:1 on black for
 *     the fans, a dimmer mirrored view from behind, the phone-camera black bands,
 *     and 9:16 / 16:9 frames for the screens.
 *
 * API for tests and other pages:
 *   LG.preview.loadFiles(FileList|File[]) · devices · state() · analyse(item)
 * ==========================================================================*/
(function () {
  'use strict';

  const CFG = window.LG_CONFIG;
  const S = () => window.LG.store;
  const A = () => window.LG.app;
  const t = (k, v) => A().t(k, v);
  const q = id => document.getElementById(id);

  /* ---------- devices ----------------------------------------------------- */
  /* Aspect + behaviour per device, derived from the device catalogue. */
  const DEVICE_MAP = {
    holo_p30s: { kind: 'fan', aspect: 1, diameter: 28, scale: 0.62 },
    holo_p65yd: { kind: 'fan', aspect: 1, diameter: 65, scale: 1 },
    ooh_43v: { kind: 'screen', aspect: 9 / 16, orientation: 'portrait', scale: 0.78 },
    ooh_55w: { kind: 'screen', aspect: 16 / 9, orientation: 'landscape', scale: 0.86 },
    ooh_75w: { kind: 'screen', aspect: 16 / 9, orientation: 'landscape', scale: 1 }
  };
  const devices = () => Object.keys(DEVICE_MAP)
    .filter(id => (window.LG_DEVICES || {})[id])
    .map(id => Object.assign({ id, label: A().L(window.LG_DEVICES[id].label), sku: window.LG_DEVICES[id].sku }, DEVICE_MAP[id]));

  /* ---------- state ------------------------------------------------------- */
  const state = {
    items: [],          // { id, file, kind, url, thumb, meta, rows, verdict, sov, duration }
    activeId: null,
    device: 'holo_p65yd',
    angle: 'front',
    fit: 'contain',
    bg: 'black',
    light: 0.35,        // 0 dark room → 1 daylight
    safe: true,
    grid: false,
    mask: false,
    shutter: false,
    loop: true,
    muted: true,
    playing: false,
    loopPlaying: false,
    loopTimer: null
  };
  let seq = 0;
  const uid = () => 'PV-' + (++seq);
  const active = () => state.items.find(i => i.id === state.activeId) || null;

  /* ---------- helpers ----------------------------------------------------- */
  const esc = s => A().esc(s);
  const human = n => {
    if (n == null) return '—';
    if (n < 1024) return n + ' B';
    if (n < 1048576) return (n / 1024).toFixed(0) + ' KB';
    return (n / 1048576).toFixed(1) + ' MB';
  };
  const ext = name => (String(name).split('.').pop() || '').toLowerCase();

  const IMAGE_EXT = /^(png|jpe?g|gif|webp|bmp|avif|svg|ico|tiff?)$/;
  const VIDEO_EXT = /^(mp4|m4v|mov|webm|ogv|avi|mkv|mpe?g|3gp|wmv|flv)$/;
  const DESIGN_EXT = /^(ai|eps|psd|psb|sketch|fig|xd|indd|cdr|afdesign|afphoto|pdf|tiff?|raw|cr2|nef|heic)$/;
  const AUDIO_EXT = /^(mp3|wav|aac|m4a|ogg|flac|aiff?)$/;

  function kindOf(file) {
    const type = (file.type || '').toLowerCase();
    const e = ext(file.name);
    /* Order matters: .psd/.tif/.heic arrive with an image/* MIME type but are
     * not browser-decodable, so the extension is checked before the prefix. */
    if (type.startsWith('video/') || VIDEO_EXT.test(e)) return 'video';
    if (DESIGN_EXT.test(e) || /photoshop|illustrator|postscript|sketch|figma|indesign|corel/.test(type)) return 'design';
    if (type.startsWith('audio/') || AUDIO_EXT.test(e)) return 'audio';
    if (type === 'application/pdf') return 'pdf';
    if (type.startsWith('image/') || IMAGE_EXT.test(e)) return 'image';
    /* an unknown container may still be a video the browser can play */
    if (/^(application\/(octet-stream|x-msvideo|x-matroska))$/.test(type)) return 'video';
    return 'other';
  }

  /* Illustrator/EPS files are PDF documents underneath — sniff the signature so
   * a genuine design file can still be previewed instead of shrugged at. */
  async function isPdfInside(file) {
    try {
      const head = await file.slice(0, 1024).arrayBuffer();
      const bytes = new Uint8Array(head);
      /* skip a UTF-8 BOM / whitespace, then look for %PDF- */
      for (let i = 0; i < Math.min(bytes.length - 5, 512); i++) {
        if (bytes[i] === 0x25 && bytes[i + 1] === 0x50 && bytes[i + 2] === 0x44 && bytes[i + 3] === 0x46 && bytes[i + 4] === 0x2D) return true;
      }
    } catch (e) { /* unreadable — treat as a plain binary */ }
    return false;
  }

  /* ---------- pixel analysis --------------------------------------------- */
  /* One routine for images and for sampled video frames: black coverage, safe
   * margin, mean luminance, alpha, edge contact and the dominant colours. */
  function analysePixels(ctx, w, h) {
    const rule = CFG.hologram;
    const data = ctx.getImageData(0, 0, w, h).data;
    let black = 0, lum = 0, alpha = false;
    let minX = w, minY = h, maxX = -1, maxY = -1;
    const buckets = new Map();
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
        if (a < 250) alpha = true;
        const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        /* composite on black so a transparent PNG is judged as it will look */
        lum += l * (a / 255);
        const isBlack = (r < rule.blackThreshold && g < rule.blackThreshold && b < rule.blackThreshold) || a < 12;
        if (isBlack) black++;
        else {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          if (l > 40) {
            const key = ((r >> 5) << 10) | ((g >> 5) << 5) | (b >> 5);
            const hit = buckets.get(key) || { n: 0, r: 0, g: 0, b: 0 };
            hit.n++; hit.r += r; hit.g += g; hit.b += b;
            buckets.set(key, hit);
          }
        }
      }
    }
    const total = w * h;
    const blackRatio = black / total;
    const margins = maxX < 0 ? { l: 1, r: 1, t: 1, b: 1 } : {
      l: minX / w, r: (w - 1 - maxX) / w, t: minY / h, b: (h - 1 - maxY) / h
    };
    const minMargin = Math.min(margins.l, margins.r, margins.t, margins.b);
    const colours = Array.from(buckets.values())
      .sort((a, b) => b.n - a.n).slice(0, 5)
      .map(c => '#' + [c.r / c.n, c.g / c.n, c.b / c.n].map(v => Math.round(v).toString(16).padStart(2, '0')).join(''));
    return {
      blackRatio, minMargin, margins,
      meanLum: lum / total,
      alpha,
      edgeContact: minMargin < 0.005,
      colours,
      width: w, height: h
    };
  }

  function drawToCanvas(source, srcW, srcH, max) {
    const scale = Math.min(1, max / Math.max(srcW, srcH));
    const w = Math.max(1, Math.round(srcW * scale));
    const h = Math.max(1, Math.round(srcH * scale));
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(source, 0, 0, w, h);
    return { cv, ctx, w, h };
  }

  const loadImage = url => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('decode'));
    img.src = url;
  });
  const loadVideo = url => new Promise((resolve, reject) => {
    const v = document.createElement('video');
    v.preload = 'auto';
    v.muted = true;
    v.playsInline = true;
    v.onloadeddata = () => resolve(v);
    v.onerror = () => reject(new Error('decode'));
    v.src = url;
  });

  /* Sample N frames evenly across a video and measure each one. */
  async function analyseVideo(file, url, frames) {
    const v = await loadVideo(url);
    const n = frames || 6;
    const duration = isFinite(v.duration) && v.duration > 0 ? v.duration : 0;
    const samples = [];
    for (let i = 0; i < n; i++) {
      const at = duration ? Math.min(duration - 0.05, (duration * (i + 0.5)) / n) : 0;
      /* eslint-disable no-await-in-loop */
      await new Promise(res => {
        const done = () => { v.removeEventListener('seeked', done); res(); };
        v.addEventListener('seeked', done);
        try { v.currentTime = at; } catch (e) { res(); }
        setTimeout(res, 1200);
      });
      const { ctx, w, h } = drawToCanvas(v, v.videoWidth || 640, v.videoHeight || 360, 360);
      const stats = analysePixels(ctx, w, h);
      let thumb = '';
      try { thumb = ctx.canvas.toDataURL('image/jpeg', 0.6); } catch (e) { thumb = ''; }
      samples.push({ at, stats, thumb });
    }
    return { duration, samples, width: v.videoWidth, height: v.videoHeight };
  }

  /* Rule rows shared by every kind, judged against the selected device. */
  function rowsFor(item, stats, device) {
    const rule = CFG.hologram;
    const rows = [];
    const isFan = device.kind === 'fan';
    const aspect = stats && stats.width ? stats.width / stats.height : null;
    if (aspect != null) {
      const target = isFan ? 1 : device.aspect;
      const ok = Math.abs(aspect - target) <= (isFan ? rule.aspectTolerance : 0.06);
      rows.push({ k: ok ? 'pass' : 'warn', name: t('studio.chk_aspect'), value: aspect.toFixed(2) + ':1',
        detail: ok ? t('studio.chk_aspect_ok') : t('studio.chk_aspect_bad') });
    }
    if (stats) {
      const bgOk = stats.blackRatio >= rule.backgroundCoverageMin;
      rows.push({ k: bgOk ? 'pass' : 'fail', name: t('studio.chk_bg'), value: A().pct(stats.blackRatio, 0),
        detail: bgOk ? t('studio.chk_bg_ok') : t('studio.chk_bg_bad') });
      const safeOk = stats.minMargin >= rule.marginSafePct;
      rows.push({ k: safeOk ? 'pass' : 'warn', name: t('studio.chk_safe'),
        value: A().pct(stats.minMargin, 0) + ' ' + t('studio.chk_margin'),
        detail: safeOk ? t('studio.chk_safe_ok') : t('studio.chk_safe_bad') });
      rows.push({ k: stats.alpha ? 'warn' : 'pass', name: t('pv.alpha'),
        value: stats.alpha ? t('pv.alpha_yes') : t('pv.alpha_no'),
        detail: stats.alpha ? t('pv.mask_note') : '—' });
    }
    const sizeMb = item.file.size / 1048576;
    rows.push({ k: sizeMb <= rule.maxFileMb ? 'pass' : 'warn', name: t('studio.chk_size'),
      value: sizeMb.toFixed(1) + ' MB', detail: sizeMb <= rule.maxFileMb ? t('studio.chk_size_ok') : t('studio.chk_size_bad') });
    /* No decodable frame (a design binary, an unknown container, a PDF): say so
     * rather than quietly leaving the pixel checks out of the report. */
    if (!stats) {
      rows.push({ k: 'skip', name: t('pv.pixel_checks'), value: t('studio.chk_manual'),
        detail: item.kind === 'design' ? t('pv.design_note') : (item.kind === 'other' ? t('pv.other_note') : t('pv.pdf_ok')) });
    }
    const e = ext(item.file.name).toUpperCase() || (item.file.type || '—');
    if (item.kind === 'video') {
      const dur = item.meta && item.meta.duration;
      const inRange = dur >= rule.durationTarget[0] && dur <= rule.durationTarget[1];
      rows.push({ k: inRange ? 'pass' : 'warn', name: t('studio.chk_loop'), value: (dur || 0).toFixed(1) + ' s',
        detail: inRange ? t('studio.chk_loop_ok') : t('studio.chk_loop_bad') });
    } else {
      rows.push({ k: 'skip', name: t('studio.chk_loop'), value: '—', detail: t('studio.chk_loop_img') });
    }
    rows.push({ k: /^(MP4|MOV|WEBM|M4V|PNG|JPG|JPEG|GIF|WEBP|SVG)$/.test(e) ? 'pass' : 'warn',
      name: t('studio.chk_format'), value: e,
      detail: item.kind === 'video' ? t('studio.chk_format_vid') : t('studio.chk_format_img') });
    /* Advice, not a defect: the verdict must not be dragged to "warn" by a row
     * that can never pass, or nothing would ever be "ready for the device". */
    rows.push({ k: 'warn', advice: true, name: t('studio.chk_text'), value: t('studio.chk_manual'), detail: t('studio.chk_text_manual') });
    return rows;
  }

  function verdictOf(rows) {
    const scored = rows.filter(r => r.k !== 'info' && !r.advice);
    if (scored.some(r => r.k === 'fail')) return 'fail';
    if (scored.some(r => r.k === 'warn')) return 'warn';
    return 'pass';
  }

  /* ---------- adding files ----------------------------------------------- */
  async function addFile(file) {
    const item = {
      id: uid(), file, kind: kindOf(file), url: URL.createObjectURL(file),
      thumb: '', meta: {}, stats: null, rows: [], verdict: 'pass', sov: 100,
      name: file.name, size: file.size, type: file.type || ext(file.name).toUpperCase(), status: 'analysing'
    };
    state.items.push(item);
    /* The file just added becomes the one on the stage: dropping something and
     * not seeing it would be the single most annoying thing this page could do. */
    state.activeId = item.id;
    render();
    try {
      if (item.kind === 'image') {
        const img = await loadImage(item.url);
        item.meta = { width: img.naturalWidth, height: img.naturalHeight };
        const { ctx, w, h } = drawToCanvas(img, img.naturalWidth, img.naturalHeight, 480);
        item.stats = analysePixels(ctx, w, h);
        item.thumb = item.url;
      } else if (item.kind === 'video') {
        const res = await analyseVideo(file, item.url, 6);
        item.meta = { width: res.width, height: res.height, duration: res.duration };
        item.stats = res.samples.length ? res.samples[0].stats : null;
        item.samples = res.samples;
        item.worst = res.samples.reduce((w, s) => (!w || s.stats.blackRatio < w.stats.blackRatio ? s : w), null);
        item.avgBlack = res.samples.length ? res.samples.reduce((a, s) => a + s.stats.blackRatio, 0) / res.samples.length : 0;
        item.thumb = (res.samples[Math.floor(res.samples.length / 2)] || {}).thumb || '';
        item.duration = res.duration;
      } else if (item.kind === 'design' || item.kind === 'other') {
        const pdf = await isPdfInside(file);
        if (pdf) { item.kind = 'pdf'; item.meta = { sniffed: true }; }
      }
      item.status = 'ready';
    } catch (e) {
      item.status = 'error';
    }
    rescan();
    render();
    return item;
  }

  function analyseAll() {
    const device = devices().find(d => d.id === state.device);
    state.items.forEach(item => {
      if (item.status === 'error') {
        item.rows = [{ k: 'fail', name: t('studio.chk_format'), value: ext(item.file.name).toUpperCase() || '—', detail: t('pv.not_decodable') }];
        return;
      }
      if (item.samples && item.samples.length) {
        const avg = Object.assign({}, item.stats, { blackRatio: item.avgBlack });
        item.rows = rowsFor(item, avg, device);
        item.rows.splice(2, 0, { k: 'info', name: t('pv.black_avg'), value: A().pct(item.avgBlack, 0), detail: t('pv.filmstrip') + ': ' + item.samples.length });
        if (item.worst) {
          item.rows.splice(3, 0, { k: item.worst.stats.blackRatio >= CFG.hologram.backgroundCoverageMin ? 'pass' : 'fail',
            name: t('pv.black_worst'), value: A().pct(item.worst.stats.blackRatio, 0) + ' @ ' + item.worst.at.toFixed(1) + 's', detail: t('pv.frame') });
        }
      } else if (item.stats) {
        item.rows = rowsFor(item, item.stats, device);
        item.rows.splice(2, 0, { k: 'info', name: t('pv.mean_lum'), value: A().num(item.stats.meanLum, 0), detail: t('pv.analysis_lede') });
      } else if (item.kind === 'pdf' || item.kind === 'design' || item.kind === 'audio' || item.kind === 'other') {
        item.rows = rowsFor(item, null, device);
      } else {
        item.rows = rowsFor(item, null, device);
      }
      item.verdict = verdictOf(item.rows);
    });
  }
  const rescan = () => { analyseAll(); };

  /* ---------- stage rendering -------------------------------------------- */
  function mediaHtml(item, device) {
    const fit = state.fit === 'cover' ? 'cover' : 'contain';
    const style = `object-fit:${fit}`;
    if (!item) return `<div class="pv-empty"><span>${esc(t('pv.no_media'))}</span><p class="tiny">${esc(t('pv.drop_lede'))}</p></div>`;
    if (item.status === 'error') {
      return `<div class="pv-empty pv-empty--bad"><strong>${esc(t('pv.not_decodable'))}</strong>
        <p class="tiny">${esc(item.name)} · ${human(item.size)}</p></div>`;
    }
    if (item.kind === 'image') {
      return `<img class="pv-media" style="${style}" src="${esc(item.url)}" alt="${esc(item.name)}">`;
    }
    if (item.kind === 'video') {
      return `<video class="pv-media" id="pvVideo" style="${style}" src="${esc(item.url)}"
        ${state.loop ? 'loop' : ''} ${state.muted ? 'muted' : ''} playsinline preload="metadata"></video>`;
    }
    if (item.kind === 'pdf') {
      return `<iframe class="pv-pdf" src="${esc(item.url)}#view=FitH" title="${esc(item.name)}"></iframe>`;
    }
    if (item.kind === 'audio') {
      return `<div class="pv-empty"><strong>${esc(t('pv.audio_note'))}</strong>
        <audio id="pvAudio" src="${esc(item.url)}" controls ${state.loop ? 'loop' : ''} style="margin-top:10px"></audio></div>`;
    }
    /* a design or unknown binary: never fake a preview, show the card */
    return `<div class="pv-filecard">
        <div class="pv-filecard__ext">${esc(ext(item.name).toUpperCase() || '?')}</div>
        <strong>${esc(item.name)}</strong>
        <p class="tiny muted">${human(item.size)} · ${esc(item.type || '—')} · ${esc(t('pv.binary_card'))}</p>
        <p class="tiny">${esc(item.kind === 'design' ? t('pv.design_note') : t('pv.other_note'))}</p>
        <a class="btn btn--quiet btn--sm" href="${esc(item.url)}" download="${esc(item.name)}">${esc(t('pv.download_file'))}</a>
      </div>`;
  }

  function overlayHtml(item, device) {
    if (!item || item.status === 'error') return '';
    const out = [];
    if (state.safe) {
      const inset = Math.round(CFG.hologram.marginSafePct * 100);
      out.push(`<div class="pv-guide pv-guide--safe" style="inset:${inset}%"><span>${esc(t('pv.safe'))}</span></div>`);
    }
    if (state.grid) {
      out.push('<div class="pv-guide pv-guide--thirds"><i></i><i></i><i></i><i></i></div>');
    }
    if (state.mask && item.kind === 'image') {
      out.push(`<canvas class="pv-guide pv-guide--mask" id="pvMask"></canvas>`);
    }
    if (state.shutter && device.kind === 'fan') {
      out.push('<div class="pv-guide pv-guide--shutter" aria-hidden="true"></div>');
    }
    if (device.kind === 'fan') {
      out.push('<div class="pv-guide pv-guide--blades" aria-hidden="true"></div>');
    }
    return out.join('');
  }

  /* Minimal DOM shims expose `style` without setProperty (test harnesses,
   * embedders), so set the custom property defensively. */
  function setVar(el, name, value) {
    if (!el || !el.style) return;
    if (typeof el.style.setProperty === 'function') el.style.setProperty(name, String(value));
    else el.style[name] = String(value);
  }

  function renderStage() {
    const stage = q('pvStage');
    if (!stage) return;
    const device = devices().find(d => d.id === state.device) || devices()[0];
    const item = active();
    const ratio = device.kind === 'fan' ? '1 / 1' : (device.aspect >= 1 ? '16 / 9' : '9 / 16');
    stage.className = 'pv-stage pv-stage--' + device.kind + ' pv-bg--' + state.bg +
      (state.angle === 'back' ? ' pv-stage--back' : '') +
      (state.shutter && device.kind === 'fan' ? ' pv-stage--shutter' : '');
    const light = state.light;
    setVar(stage, '--pv-light', light);
    stage.querySelector('.pv-frame').innerHTML =
      `<div class="pv-frame__inner" style="aspect-ratio:${ratio}">${mediaHtml(item, device)}${overlayHtml(item, device)}</div>`;

    const meta = q('pvStageMeta');
    if (meta) {
      meta.innerHTML = `<span class="pill pill--muted">${esc(device.label)}</span>
        <span class="pill pill--muted">${esc(device.sku)}</span>
        <span class="tiny muted">${device.kind === 'fan' ? esc(t('pv.view_note')) : esc(t('pv.fit'))}</span>`;
    }
    paintMask(item);
    wireMedia(item);
  }

  /* The black-level mask is drawn from the same canvas analysis the check uses,
   * so what you see marked is exactly what was measured. */
  function paintMask(item) {
    const cv = q('pvMask');
    if (!cv || !item || item.kind !== 'image') return;
    const img = new Image();
    img.onload = () => {
      const { ctx, w, h } = drawToCanvas(img, img.naturalWidth, img.naturalHeight, 360);
      const d = ctx.getImageData(0, 0, w, h);
      const rule = CFG.hologram;
      for (let i = 0; i < d.data.length; i += 4) {
        const r = d.data[i], g = d.data[i + 1], b = d.data[i + 2];
        const isBlack = r < rule.blackThreshold && g < rule.blackThreshold && b < rule.blackThreshold;
        d.data[i] = isBlack ? 0 : 255;
        d.data[i + 1] = 0;
        d.data[i + 2] = isBlack ? 0 : 200;
        d.data[i + 3] = isBlack ? 0 : 110;
      }
      ctx.putImageData(d, 0, 0);
      cv.width = w; cv.height = h;
      cv.getContext('2d').drawImage(ctx.canvas, 0, 0);
    };
    img.src = item.url;
  }

  function wireMedia(item) {
    const v = q('pvVideo');
    if (v && item && item.kind === 'video') {
      v.addEventListener('timeupdate', () => {
        const bar = q('pvSeek');
        if (bar && v.duration) bar.value = String((v.currentTime / v.duration) * 100);
        const time = q('pvTime');
        if (time) time.textContent = v.currentTime.toFixed(1) + ' / ' + (v.duration || 0).toFixed(1) + ' s';
      });
      v.addEventListener('play', () => { state.playing = true; syncTransport(); });
      v.addEventListener('pause', () => { state.playing = false; syncTransport(); });
      if (state.playing) v.play().catch(() => { /* autoplay policy */ });
    }
    const a = q('pvAudio');
    if (a && state.playing) a.play().catch(() => {});
  }

  function syncTransport() {
    const btn = q('pvPlayBtn');
    if (btn) btn.textContent = state.playing ? t('pv.pause') : t('pv.play');
  }

  /* ---------- controls ---------------------------------------------------- */
  function renderControls() {
    const dSel = q('pvDevice');
    if (dSel) {
      dSel.innerHTML = devices().map(d =>
        `<option value="${esc(d.id)}"${d.id === state.device ? ' selected' : ''}>${esc(d.label)}</option>`).join('');
      if (!dSel.dataset.bound) {
        dSel.dataset.bound = '1';
        dSel.addEventListener('change', () => { state.device = dSel.value; rescan(); render(); });
      }
    }
    const seg = (hostId, attr, values, current, onPick) => {
      const host = q(hostId);
      if (!host) return;
      host.innerHTML = values.map(v =>
        `<button type="button" data-${attr}="${esc(v.value)}" class="${current() === v.value ? 'is-active' : ''}">${esc(v.label)}</button>`).join('');
      if (host.dataset.bound) return;
      host.dataset.bound = '1';
      host.addEventListener('click', e => {
        const b = e.target.closest('[data-' + attr + ']');
        if (!b) return;
        onPick(b.getAttribute('data-' + attr));
        render();
      });
    };
    seg('pvAngle', 'angle', [
      { value: 'front', label: t('pv.view_front') }, { value: 'back', label: t('pv.view_back') }
    ], () => state.angle, v => { state.angle = v; });

    seg('pvFit', 'fit', [
      { value: 'contain', label: t('pv.fit_contain') }, { value: 'cover', label: t('pv.fit_cover') }
    ], () => state.fit, v => { state.fit = v; });

    seg('pvBg', 'bg', [
      { value: 'black', label: t('pv.bg_black') }, { value: 'white', label: t('pv.bg_white') },
      { value: 'checker', label: t('pv.bg_checker') }
    ], () => state.bg, v => { state.bg = v; });

    const light = q('pvLight');
    if (light && !light.dataset.bound) {
      light.dataset.bound = '1';
      light.value = String(state.light * 100);
      light.addEventListener('input', () => {
        state.light = Number(light.value) / 100;
        setVar(q('pvStage'), '--pv-light', state.light);
      });
    }
    const toggles = [
      ['pvSafe', 'safe'], ['pvGrid', 'grid'], ['pvMaskToggle', 'mask'], ['pvShutter', 'shutter'], ['pvLoop', 'loop']
    ];
    toggles.forEach(([id, key]) => {
      const el = q(id);
      if (!el) return;
      el.checked = !!state[key];
      if (el.dataset.bound) return;
      el.dataset.bound = '1';
      el.addEventListener('change', () => { state[key] = el.checked; render(); });
    });
    const mute = q('pvMute');
    if (mute) {
      mute.checked = state.muted;
      if (!mute.dataset.bound) {
        mute.dataset.bound = '1';
        mute.addEventListener('change', () => { state.muted = mute.checked; render(); });
      }
    }
  }

  /* ---------- playlist ---------------------------------------------------- */
  function renderPlaylist() {
    const host = q('pvList');
    if (!host) return;
    const items = state.items;
    if (!items.length) { host.innerHTML = `<p class="tiny muted">${esc(t('pv.empty_playlist'))}</p>`; }
    else {
      host.innerHTML = items.map((it, i) => {
        const v = it.verdict || 'pass';
        const mark = v === 'pass' ? 'mark--pass' : (v === 'warn' ? 'mark--warn' : 'mark--fail');
        const glyph = v === 'pass' ? '✓' : (v === 'warn' ? '!' : '×');
        return `<div class="pv-item${it.id === state.activeId ? ' is-active' : ''}" data-item="${esc(it.id)}">
          <span class="mark ${mark}">${glyph}</span>
          <span class="pv-item__thumb">${it.thumb ? `<img src="${esc(it.thumb)}" alt="">` : `<span class="pv-item__ext">${esc(ext(it.name).toUpperCase() || '?')}</span>`}</span>
          <span class="pv-item__main">
            <strong>${esc(it.name)}</strong>
            <span class="tiny muted">${esc(t('pv.' + it.kind))} · ${human(it.size)}${it.meta && it.meta.width ? ' · ' + it.meta.width + '×' + it.meta.height : ''}${it.duration ? ' · ' + it.duration.toFixed(1) + 's' : ''}</span>
          </span>
          <select class="pv-sov" data-sov="${esc(it.id)}" aria-label="${esc(t('pv.playlist'))}">
            ${[100, 50, 25].map(s => `<option value="${s}"${it.sov === s ? ' selected' : ''}>${s}%</option>`).join('')}
          </select>
          <span class="pv-item__tools">
            <button type="button" class="chat-icon" data-up="${esc(it.id)}" title="${esc(t('pv.move_up'))}" ${i === 0 ? 'disabled' : ''}>↑</button>
            <button type="button" class="chat-icon" data-down="${esc(it.id)}" title="${esc(t('pv.move_down'))}" ${i === items.length - 1 ? 'disabled' : ''}>↓</button>
            <button type="button" class="chat-icon" data-del="${esc(it.id)}" title="${esc(t('pv.remove'))}">×</button>
          </span>
        </div>`;
      }).join('');
    }

    host.querySelectorAll('[data-item]').forEach(el => el.addEventListener('click', e => {
      if (e.target.closest('select, button')) return;
      state.activeId = el.getAttribute('data-item');
      render();
    }));
    host.querySelectorAll('[data-sov]').forEach(sel => sel.addEventListener('change', () => {
      const it = state.items.find(x => x.id === sel.getAttribute('data-sov'));
      if (it) { it.sov = Number(sel.value); renderLoopLength(); }
    }));
    host.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => removeItem(b.getAttribute('data-del'))));
    host.querySelectorAll('[data-up]').forEach(b => b.addEventListener('click', () => move(b.getAttribute('data-up'), -1)));
    host.querySelectorAll('[data-down]').forEach(b => b.addEventListener('click', () => move(b.getAttribute('data-down'), 1)));

    const count = q('pvCount');
    if (count) count.textContent = !items.length ? t('pv.no_file') : (items.length === 1 ? t('pv.one_file') : t('pv.many_files', { n: A().num(items.length) }));
    renderLoopLength();
  }

  function removeItem(id) {
    const i = state.items.findIndex(x => x.id === id);
    if (i < 0) return;
    try { URL.revokeObjectURL(state.items[i].url); } catch (e) {}
    state.items.splice(i, 1);
    if (state.activeId === id) state.activeId = state.items.length ? state.items[Math.max(0, i - 1)].id : null;
    render();
  }
  function move(id, dir) {
    const i = state.items.findIndex(x => x.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= state.items.length) return;
    const [it] = state.items.splice(i, 1);
    state.items.splice(j, 0, it);
    render();
  }

  const loopSeconds = item => {
    const base = item.duration ? item.duration : 10;
    return (base * (item.sov || 100)) / 100;
  };
  function renderLoopLength() {
    const host = q('pvLoopLen');
    if (!host) return;
    const total = state.items.reduce((s, i) => s + loopSeconds(i), 0);
    host.textContent = total ? total.toFixed(1) + ' s' : '—';
  }

  /* Play the playlist in the stage, honouring each item's share of the loop. */
  function playLoop() {
    if (state.loopPlaying) { stopLoop(); return; }
    if (state.items.length < 1) { A().toast(t('pv.empty_playlist'), 'warn'); return; }
    state.loopPlaying = true;
    state.playing = true;
    const btn = q('pvLoopBtn');
    if (btn) btn.textContent = t('pv.stop_loop');
    let i = Math.max(0, state.items.findIndex(x => x.id === state.activeId));
    const step = () => {
      if (!state.loopPlaying) return;
      const it = state.items[i % state.items.length];
      if (!it) { stopLoop(); return; }
      state.activeId = it.id;
      render();
      const badge = q('pvOnAir');
      if (badge) badge.textContent = t('pv.on_air') + ': ' + it.name;
      const ms = Math.max(1200, loopSeconds(it) * 1000);
      state.loopTimer = setTimeout(() => { i++; step(); }, ms);
    };
    step();
  }
  function stopLoop() {
    state.loopPlaying = false;
    clearTimeout(state.loopTimer);
    state.loopTimer = null;
    const btn = q('pvLoopBtn');
    if (btn) btn.textContent = t('pv.play_loop');
    const badge = q('pvOnAir');
    if (badge) badge.textContent = '';
    stopMedia();
  }
  function stopMedia() {
    state.playing = false;
    const v = q('pvVideo'); if (v) v.pause();
    const a = q('pvAudio'); if (a) a.pause();
    syncTransport();
  }
  function togglePlay() {
    const v = q('pvVideo'), a = q('pvAudio');
    if (state.playing) { stopMedia(); return; }
    state.playing = true;
    if (v) v.play().catch(() => {});
    if (a) a.play().catch(() => {});
    syncTransport();
  }

  /* ---------- analysis panel --------------------------------------------- */
  function renderAnalysis() {
    const host = q('pvCheck');
    if (!host) return;
    const item = active();
    if (!item) { host.innerHTML = `<p class="tiny muted">${esc(t('pv.no_media'))}</p>`; renderVerdict(null); return; }
    if (item.status === 'analysing') { host.innerHTML = `<p class="tiny muted">${esc(t('pv.analysing'))}</p>`; }
    else {
      host.innerHTML = `<ul class="kpi-list pv-checks">${item.rows.map(r =>
        `<li><span class="mark mark--${r.k === 'info' ? 'skip' : r.k}">${r.k === 'pass' ? '✓' : (r.k === 'fail' ? '×' : (r.k === 'info' ? 'i' : '!'))}</span>
          <span><b>${esc(r.name)}</b><span class="tiny muted"> ${esc(r.detail || '')}</span></span>
          <span class="tiny nowrap">${esc(r.value || '')}</span></li>`).join('')}</ul>`;
    }
    const film = q('pvFilm');
    if (film) {
      if (item.status === 'analysing') {
        film.innerHTML = `<p class="tiny muted">${esc(t('pv.analysing'))}</p>`;
      } else if (item.samples && item.samples.length) {
        film.innerHTML = `<h4 class="tiny-head">${esc(t('pv.filmstrip'))}</h4><div class="pv-film">${item.samples.map((s, i) =>
          `<figure><img src="${esc(s.thumb)}" alt=""><figcaption class="tiny">${s.at.toFixed(1)}s · ${A().pct(s.stats.blackRatio, 0)}</figcaption></figure>`).join('')}</div>`;
      } else if (item.stats) {
        film.innerHTML = `<h4 class="tiny-head">${esc(t('pv.colours'))}</h4>
          <div class="pv-swatches">${item.stats.colours.map(c => `<span class="pv-swatch" style="background:${esc(c)}" title="${esc(c)}"></span>`).join('')}</div>
          <p class="tiny muted">${esc(t('pv.mean_lum'))}: ${A().num(item.stats.meanLum, 0)} ·
            ${esc(t('pv.edges'))}: ${item.stats.edgeContact ? esc(t('pv.edges_bad')) : esc(t('pv.edges_ok'))}</p>`;
      } else if (item.status === 'error') {
        film.innerHTML = `<p class="tiny muted">${esc(t('pv.not_decodable'))}</p>`;
      } else if (item.kind === 'pdf') {
        film.innerHTML = `<p class="tiny muted">${esc(t('pv.pdf_ok'))}</p>`;
      } else if (item.kind === 'design') {
        film.innerHTML = `<p class="tiny muted">${esc(t('pv.design_note'))}</p>`;
      } else if (item.kind === 'audio') {
        film.innerHTML = `<p class="tiny muted">${esc(t('pv.audio_note'))}</p>`;
      } else if (item.kind === 'other') {
        film.innerHTML = `<p class="tiny muted">${esc(t('pv.other_note'))}</p>`;
      } else {
        film.innerHTML = '';
      }
    }
    renderVerdict(item);
  }

  function renderVerdict(item) {
    const host = q('pvVerdict');
    if (!host) return;
    if (!item) { host.innerHTML = ''; return; }
    const v = item.verdict || 'pass';
    const label = v === 'pass' ? t('pv.verdict_pass') : (v === 'warn' ? t('pv.verdict_warn') : t('pv.verdict_fail'));
    host.innerHTML = `<span class="pill pill--${v === 'pass' ? 'ok' : (v === 'warn' ? 'warn' : 'bad')}">
      ${esc(t('pv.verdict'))}: ${esc(label)}</span>`;
  }

  /* ---------- report ------------------------------------------------------ */
  function reportText() {
    const L = ['3dNakedEye — ' + t('pv.title'), new Date().toISOString(), ''];
    L.push('Device: ' + (devices().find(d => d.id === state.device) || {}).label);
    L.push('Files: ' + state.items.length, '');
    state.items.forEach((it, i) => {
      L.push((i + 1) + '. ' + it.name + '  [' + it.kind + ', ' + human(it.size) + (it.meta && it.meta.width ? ', ' + it.meta.width + '×' + it.meta.height : '') + (it.duration ? ', ' + it.duration.toFixed(1) + 's' : '') + ']');
      L.push('   SOV: ' + it.sov + '%  → ' + loopSeconds(it).toFixed(1) + 's per loop');
      it.rows.forEach(r => L.push('   ' + (r.k === 'pass' ? '[ok]  ' : r.k === 'fail' ? '[!!]  ' : r.k === 'info' ? '[i]   ' : '[!]   ') + r.name + ': ' + (r.value || '') + ' — ' + (r.detail || '')));
      L.push('');
    });
    L.push('Note: analysis runs in the browser from the actual pixels; decode happens locally and nothing is uploaded.');
    return L.join('\n');
  }
  function downloadReport() {
    const blob = new Blob([reportText()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '3dnakedeye-creative-check.txt';
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 400);
  }
  const copySummary = () => A().copyText(reportText().split('\n').slice(0, 14).join('\n'));

  /* ---------- wiring ------------------------------------------------------ */
  function render() {
    renderControls();
    renderStage();
    renderPlaylist();
    renderAnalysis();
    syncTransport();
  }

  async function loadFiles(list) {
    const files = Array.from(list || []).filter(Boolean);
    if (!files.length) return;
    A().toast(files.length === 1 ? t('pv.one_file') : t('pv.many_files', { n: files.length }), 'ok');
    for (const f of files) { /* sequential keeps memory sane on big videos */ await addFile(f); }
    if (files.length && !state.activeId) state.activeId = state.items[0].id;
    render();
  }

  /* Sample files are generated in the browser, so the demo needs no assets and
   * shows both sides of the check: one hologram-ready key visual and one that
   * is exactly what a designer sends by mistake. */
  async function loadDemo() {
    const make = async (name, w, h, draw) => {
      const cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      draw(cv.getContext('2d'), w, h);
      const blob = await new Promise(r => cv.toBlob(r, 'image/png'));
      await addFile(new File([blob], name, { type: 'image/png' }));
    };

    await make('sample-hologram-ready.png', 800, 800, (ctx, w, h) => {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2;
      const glow = ctx.createRadialGradient(cx, cy, w * 0.05, cx, cy, w * 0.34);
      glow.addColorStop(0, 'rgba(53, 208, 255, .55)');
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(cx, cy, w * 0.34, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#7ef0c2';
      ctx.lineWidth = w * 0.035;
      ctx.beginPath(); ctx.arc(cx, cy, w * 0.27, -Math.PI * 0.15, Math.PI * 1.15); ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(cx, cy, w * 0.055, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(122, 107, 255, .9)';
      ctx.lineWidth = w * 0.012;
      ctx.beginPath(); ctx.arc(cx, cy, w * 0.38, 0, Math.PI * 2); ctx.stroke();
    });

    await make('sample-needs-rework.png', 1280, 720, (ctx, w, h) => {
      ctx.fillStyle = '#d9dee6';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ff3d81';
      ctx.fillRect(0, 0, w, h * 0.42);
      ctx.fillStyle = '#0b5fff';
      ctx.font = 'bold 74px system-ui, sans-serif';
      ctx.fillText('LOGO', 40, h * 0.78);
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 10;
      ctx.strokeRect(0, 0, w, h);
    });

    render();
  }

  function bind() {
    const input = q('pvInput');
    const drop = q('pvDrop');
    if (input) input.addEventListener('change', () => { loadFiles(input.files); input.value = ''; });
    const browse = q('pvBrowse');
    if (browse && input) browse.addEventListener('click', e => { e.preventDefault(); input.click(); });
    const demo = q('pvDemo');
    if (demo) demo.addEventListener('click', e => { e.preventDefault(); loadDemo(); });
    const clear = q('pvClear');
    if (clear) clear.addEventListener('click', () => {
      state.items.forEach(i => { try { URL.revokeObjectURL(i.url); } catch (e) {} });
      state.items = []; state.activeId = null; render();
    });
    if (drop) {
      ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => {
        e.preventDefault(); e.stopPropagation(); drop.classList.add('is-over');
      }));
      ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => {
        e.preventDefault(); e.stopPropagation(); drop.classList.remove('is-over');
      }));
      drop.addEventListener('drop', e => {
        const dt = e.dataTransfer || {};
        if (dt.files && dt.files.length) loadFiles(dt.files);
      });
    }
    /* paste a screenshot straight from the clipboard */
    document.addEventListener('paste', async e => {
      if (!q('pvStage')) return;
      const items = (e.clipboardData && e.clipboardData.items) || [];
      const files = [];
      for (const it of items) if (it.kind === 'file') { const f = it.getAsFile(); if (f) files.push(f); }
      if (!files.length) { A().toast(t('pv.paste_empty'), 'warn'); return; }
      A().toast(t('pv.paste_ok'), 'ok');
      loadFiles(files);
    });
    /* page-wide drag & drop, so the whole page is a target */
    ['dragover', 'drop'].forEach(ev => document.addEventListener(ev, e => { if (ev === 'dragover') e.preventDefault(); }));
    document.addEventListener('drop', e => {
      if (e.target.closest && e.target.closest('#pvDrop')) return;
      e.preventDefault();
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) loadFiles(e.dataTransfer.files);
    });

    const play = q('pvPlayBtn');
    if (play) play.addEventListener('click', togglePlay);
    const restart = q('pvRestart');
    if (restart) restart.addEventListener('click', () => {
      const v = q('pvVideo');
      if (v) { v.currentTime = 0; v.play().catch(() => {}); }
    });
    const seek = q('pvSeek');
    if (seek) seek.addEventListener('input', () => {
      const v = q('pvVideo');
      if (v && v.duration) v.currentTime = (Number(seek.value) / 100) * v.duration;
    });
    const loopBtn = q('pvLoopBtn');
    if (loopBtn) loopBtn.addEventListener('click', playLoop);
    const dl = q('pvDownload');
    if (dl) dl.addEventListener('click', downloadReport);
    const copy = q('pvCopy');
    if (copy) copy.addEventListener('click', copySummary);
    const studio = q('pvStudio');
    if (studio) studio.href = 'studio.html';
  }

  function renderAll() {
    if (!q('pvStage')) return;
    render();
    const note = q('pvAnyFormats');
    if (note) note.textContent = 'JPEG · PNG · GIF · WebP · SVG · AVIF · TIFF · MP4 · MOV · WEBM · AVI · MKV · PDF · AI · EPS · PSD · INDD · FIG · SKETCH · MP3 · WAV · …';
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderAll();
    bind();
    /* ?demo=1 opens the page with the sample artwork already loaded, so a demo
     * link shows the preview working without asking anyone to find a file. */
    if (new URLSearchParams(location.search || '').get('demo') === '1') loadDemo();
  });
  A().onLangChange(renderAll);

  window.LG = window.LG || {};
  window.LG.preview = {
    state, devices, addFile, loadFiles, loadDemo, analyse: analysePixels, rowsFor,
    items: () => state.items, active, report: reportText, playLoop, stopLoop,
    /* select a file for the stage (used by the playlist, other pages and tests) */
    select(id, opts) {
      if (!state.items.some(i => i.id === id)) return null;
      state.activeId = id;
      if (!opts || opts.render !== false) render();
      return active();
    }
  };
})();
