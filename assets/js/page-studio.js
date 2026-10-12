/* ============================================================================
 * 3dNakedEye — page-studio.js
 * AI Creative Studio: brief → generated copy, storyboard, hologram spec,
 * device compliance check, preview frames, and "add studio to booking".
 *
 * Two backends:
 *   demo  — deterministic local templates (default, fully offline)
 *   proxy — POST to LG_CONFIG.ai.proxyUrl (bundled Node proxy holding the
 *           DeepSeek API key server-side). Falls back to demo on any error.
 * ==========================================================================*/
(function () {
  'use strict';
  const S = window.LG.store, A = window.LG.app, CFG = window.LG_CONFIG;
  const q = id => document.getElementById(id);
  let files = [];
  let result = null;
  let activeTab = 'assets';

  /* ---------- brief ------------------------------------------------------- */
  const brief = () => ({
    brand: q('sBrand').value.trim(),
    product: q('sProduct').value.trim(),
    info: q('sInfo').value.trim(),
    offer: q('sOffer').value.trim(),
    audience: q('sAudience').value.trim(),
    style: q('sStyle').value,
    cta: q('sCta').value.trim(),
    langs: Array.from(q('langChecks').querySelectorAll('input:checked')).map(i => i.value),
    outputs: Array.from(q('outChecks').querySelectorAll('input:checked')).map(i => i.value)
  });

  /* ---------- controls ---------------------------------------------------- */
  function buildControls() {
    q('sStyle').innerHTML = window.LG_CREATIVE_STYLES
      .map(s => `<option value="${s.id}">${A.esc(A.L(s.label))}</option>`).join('');

    q('langChecks').innerHTML = CFG.locales.map((l, i) =>
      `<label class="check"><input type="checkbox" value="${l.code}" ${i < 2 ? 'checked' : ''}>
        <span>${A.esc(l.label)}</span></label>`).join('');

    const outs = [
      ['static', 'studio.out_static'], ['social', 'studio.out_social'], ['holo', 'studio.out_holo'],
      ['cutout', 'studio.out_cutout'], ['subs', 'studio.out_subs'], ['voice', 'studio.out_voice'],
      ['qr', 'studio.out_qr'], ['versions', 'studio.out_versions']
    ];
    q('outChecks').innerHTML = outs.map(([id, key], i) =>
      `<label class="check"><input type="checkbox" value="${id}" ${i < 5 ? 'checked' : ''}>
        <span>${A.esc(A.t(key))}</span></label>`).join('');

    q('aiModePill').textContent = CFG.ai.mode === 'proxy'
      ? A.t('studio.mode_live', { model: CFG.ai.model })
      : A.t('studio.mode_demo');
    q('aiNote').textContent = CFG.ai.mode === 'proxy'
      ? A.t('studio.note_live', { url: CFG.ai.proxyUrl })
      : A.t('studio.note_demo');
  }

  function demoBrief() {
    q('sBrand').value = 'Wing Fat Bakery';
    q('sProduct').value = 'Snow skin mooncake gift box (8 pieces)';
    q('sInfo').value = 'Handmade daily, low sugar, chilled, four flavours including durian and matcha. Collect in store or deliver within Kowloon.';
    q('sOffer').value = '20% off with the QR coupon until 30 September';
    q('sAudience').value = 'Families and office workers shopping in Tsim Sha Tsui and Sha Tin';
    q('sStyle').value = 'festive';
    q('sCta').value = 'Scan to redeem';
  }

  /* ---------- deterministic demo generation ------------------------------- */
  const T = {
    en: {
      kicker: b => b.brand || 'Your brand',
      a: { head: b => b.product || 'New arrival', sub: b => b.offer || b.info || 'Available in store now', cta: b => b.cta || 'Scan to redeem' },
      b: { head: b => b.offer || 'Limited-time offer', sub: b => [b.brand, b.product].filter(Boolean).join(' · ') || 'Visit us today', cta: b => b.cta || 'Scan to redeem' },
      c: { head: b => (b.brand ? b.brand + ' presents' : 'Introducing') + ' ' + (b.product || 'something new'), sub: b => b.audience ? ('For ' + b.audience) : 'Made for your neighbourhood', cta: b => b.cta || 'Scan to redeem' },
      tags: b => ['#' + (b.brand || 'brand').replace(/\s+/g, ''), '#' + (b.product || 'offer').split(' ')[0], '#HK', '#OOH'],
      lines: b => [b.brand, b.product, b.offer, b.cta].filter(Boolean)
    },
    zhHant: {
      kicker: b => b.brand || '你的品牌',
      a: { head: b => b.product || '新品登場', sub: b => b.offer || b.info || '門店現貨發售', cta: b => b.cta || '掃碼領取優惠' },
      b: { head: b => b.offer || '限時優惠', sub: b => [b.brand, b.product].filter(Boolean).join('｜') || '歡迎親臨選購', cta: b => b.cta || '掃碼領取優惠' },
      c: { head: b => (b.brand || '全新') + '呈獻 ' + (b.product || '新品'), sub: b => b.audience ? ('為' + b.audience + '而設') : '為你所在的社區而設', cta: b => b.cta || '掃碼領取優惠' },
      tags: b => ['#' + (b.brand || '品牌'), '#' + (b.product || '優惠').split(/[\s（(]/)[0], '#香港', '#戶外廣告'],
      lines: b => [b.brand, b.product, b.offer, b.cta].filter(Boolean)
    },
    zhHans: {
      kicker: b => b.brand || '你的品牌',
      a: { head: b => b.product || '新品上市', sub: b => b.offer || b.info || '门店现货发售', cta: b => b.cta || '扫码领取优惠' },
      b: { head: b => b.offer || '限时优惠', sub: b => [b.brand, b.product].filter(Boolean).join('｜') || '欢迎亲临选购', cta: b => b.cta || '扫码领取优惠' },
      c: { head: b => (b.brand || '全新') + '呈现 ' + (b.product || '新品'), sub: b => b.audience ? ('为' + b.audience + '而设') : '为你所在的社区而设', cta: b => b.cta || '扫码领取优惠' },
      tags: b => ['#' + (b.brand || '品牌'), '#' + (b.product || '优惠').split(/[\s（(]/)[0], '#香港', '#户外广告'],
      lines: b => [b.brand, b.product, b.offer, b.cta].filter(Boolean)
    }
  };
  const LANG_KEY = { en: 'en', 'zh-HK': 'zhHant', 'zh-CN': 'zhHans' };

  function demoResult(b) {
    const langs = b.langs.length ? b.langs : ['en'];
    return {
      source: 'demo',
      brief: b,
      perLanguage: langs.map(code => {
        const t = T[LANG_KEY[code]] || T.en;
        return {
          lang: code,
          kicker: t.kicker(b),
          variants: ['a', 'b', 'c'].map(k => ({
            id: k, head: t[k].head(b), sub: t[k].sub(b), cta: t[k].cta(b), hashtags: t.tags(b).join(' ')
          })),
          subtitles: t.lines(b).slice(0, 4),
          voiceover: t.lines(b).join('。')
        };
      }),
      storyboardHolo: [
        { t: '00:00–00:02', en: 'Black frame, product silhouette fades up in the centre.', zhHant: '純黑畫面，產品剪影由中央淡入。', zhHans: '纯黑画面，产品剪影自中央淡入。' },
        { t: '00:02–00:06', en: 'Product rotates 180°, key feature text appears beside it.', zhHant: '產品旋轉 180 度，主要賣點文字於側邊出現。', zhHans: '产品旋转 180 度，主要卖点文字在侧边出现。' },
        { t: '00:06–00:10', en: 'Offer burst: coupon code and QR placed bottom-centre.', zhHant: '優惠彈出：優惠碼及二維碼置於下方中央。', zhHans: '优惠弹出：优惠码及二维码置于下方中央。' },
        { t: '00:10–00:14', en: 'Call to action holds, then loops back to black.', zhHant: '行動呼籲停留，之後回到純黑循環。', zhHans: '行动号召停留，之后回到纯黑循环。' }
      ],
      storyboardSocial: [
        { t: '00:00–00:03', en: 'Vertical hook: strongest single benefit, large type.', zhHant: '直向開場：最強單一賣點，大字呈現。', zhHans: '竖向开场：最强单一卖点，大字呈现。' },
        { t: '00:03–00:08', en: 'Product in use, handheld, natural light.', zhHant: '產品使用情境，手持拍攝，自然光。', zhHans: '产品使用场景，手持拍摄，自然光。' },
        { t: '00:08–00:14', en: 'Offer and coupon overlay, subtitles burned in.', zhHant: '優惠及優惠券疊加，字幕內嵌。', zhHans: '优惠及优惠券叠加，字幕内嵌。' },
        { t: '00:14–00:20', en: 'End card: brand lockup, QR, store hours.', zhHant: '結尾卡：品牌標誌、二維碼、營業時間。', zhHans: '结尾卡：品牌标识、二维码、营业时间。' }
      ],
      notes: ['studio.gen_note_1', 'studio.gen_note_2', 'studio.gen_note_3']
    };
  }

  /* ---------- live (DeepSeek via proxy) ----------------------------------- */
  function promptFor(b) {
    return [
      'You are the creative engine of an out-of-home (DOOH) advertising marketplace in Hong Kong.',
      'Return STRICT JSON only, no prose, with this shape:',
      '{"perLanguage":[{"lang":"en|zh-HK|zh-CN","kicker":"","variants":[{"id":"a|b|c","head":"","sub":"","cta":"","hashtags":""}],"subtitles":["",""],"voiceover":""}],',
      '"storyboardHolo":[{"t":"00:00-00:02","text":""}],"storyboardSocial":[{"t":"","text":""}],"notes":[""]}',
      'Rules: hologram creative must assume a pure black background, square 1:1, 10-30 second loop, no small text.',
      'Keep headlines under 7 words for screens and under 5 words for holograms.',
      'Languages requested: ' + b.langs.join(', ') + '.',
      'Brief: ' + JSON.stringify({ brand: b.brand, product: b.product, info: b.info, offer: b.offer, audience: b.audience, style: b.style, cta: b.cta })
    ].join('\n');
  }

  async function liveResult(b) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 45000);
    try {
      const res = await fetch(CFG.ai.proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: CFG.ai.model, temperature: CFG.ai.temperature, max_tokens: CFG.ai.maxTokens,
          json: true, prompt: promptFor(b), brief: b
        }),
        signal: ctrl.signal
      });
      if (!res.ok) throw new Error('proxy ' + res.status);
      const data = await res.json();
      const parsed = typeof data.text === 'string' ? JSON.parse(data.text) : data;
      if (!parsed || !parsed.perLanguage) throw new Error('bad payload');
      parsed.source = 'deepseek';
      parsed.brief = b;
      return parsed;
    } finally { clearTimeout(timer); }
  }

  /* ---------- rendering --------------------------------------------------- */
  function renderAssets() {
    const out = q('assetsOut');
    if (!result) return;
    const src = result.source === 'deepseek'
      ? `<span class="pill pill--ok">${A.esc(A.t('studio.src_live', { model: CFG.ai.model }))}</span>`
      : `<span class="pill pill--info">${A.esc(A.t('studio.src_demo'))}</span>`;

    out.innerHTML = `<div class="row row--between" style="margin-bottom:14px">
        <div class="row">${src}
          <span class="tiny muted">${A.esc(A.t('studio.generated_at'))} ${A.esc(new Date().toLocaleTimeString(A.locale()))}</span></div>
        <button class="btn btn--ghost btn--sm" type="button" id="regen" data-i18n="studio.regenerate">Regenerate</button>
      </div>` +
      result.perLanguage.map(p => `<div class="card" style="margin-bottom:16px">
        <div class="row row--between" style="margin-bottom:10px">
          <h3 class="card__title">${A.esc(langLabel(p.lang))}</h3>
          <span class="chip">${A.esc(p.lang)}</span>
        </div>
        <div class="grid grid--3">${p.variants.map(v => `<div class="copy-variant">
          <h4>${A.esc(A.t('studio.variant_' + v.id))}</h4>
          <p><strong>${A.esc(v.head)}</strong></p>
          <p class="muted">${A.esc(v.sub)}</p>
          <p><span class="chip">${A.esc(v.cta)}</span></p>
          <p class="hashtags">${A.esc(v.hashtags)}</p>
          <button class="btn btn--quiet btn--sm" type="button" data-copy="${A.esc(v.head + ' — ' + v.sub)}" data-i18n="studio.copy">Copy</button>
        </div>`).join('')}</div>
        <div class="card__foot">
          <div class="row" style="gap:18px;align-items:flex-start">
            <div style="flex:1">
              <span class="label">${A.esc(A.t('studio.subtitles'))}</span>
              <ul class="small muted" style="margin:6px 0 0;padding-left:18px">${p.subtitles.map(s => `<li>${A.esc(s)}</li>`).join('')}</ul>
            </div>
            <div style="flex:1">
              <span class="label">${A.esc(A.t('studio.voiceover'))}</span>
              <p class="small muted" style="margin:6px 0 0">${A.esc(p.voiceover)}</p>
            </div>
          </div>
        </div>
      </div>`).join('') +
      `<div class="card"><h3 class="card__title">${A.esc(A.t('studio.notes_title'))}</h3>
        <ul class="small muted">${(result.notes || []).map(n => `<li>${A.esc(n.indexOf('studio.') === 0 ? A.t(n) : n)}</li>`).join('')}</ul>
      </div>`;

    out.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', () => {
      navigator.clipboard && navigator.clipboard.writeText(b.getAttribute('data-copy'));
      A.toast(A.t('toast.copied'), 'ok');
    }));
    const rg = q('regen'); if (rg) rg.addEventListener('click', generate);
  }

  function langLabel(code) {
    const l = CFG.locales.find(x => x.code === code);
    return l ? l.label : code;
  }

  function qrSvg(seedStr, size) {
    const rnd = S.util.seedFrom(seedStr);
    const n = 21, cell = (size || 74) / n;
    let rects = '';
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const finder = (x < 7 && y < 7) || (x > n - 8 && y < 7) || (x < 7 && y > n - 8);
      const on = finder ? ((x % 6 === 0 || y % 6 === 0 || (x > 1 && x < 5 && y > 1 && y < 5)) ? 1 : 0) : (rnd() > 0.52 ? 1 : 0);
      if (on) rects += `<rect x="${(x * cell).toFixed(2)}" y="${(y * cell).toFixed(2)}" width="${cell.toFixed(2)}" height="${cell.toFixed(2)}"/>`;
    }
    return `<svg class="pv-qr" viewBox="0 0 ${size || 74} ${size || 74}" width="${size || 74}" height="${size || 74}"
      role="img" aria-label="${A.esc(A.t('studio.qr_aria'))}"><rect width="100%" height="100%" fill="#fff"/>
      <g fill="#000">${rects}</g></svg>`;
  }

  function renderPreview() {
    const b = brief();
    const primary = (result && result.perLanguage[0]) || null;
    const v = primary ? primary.variants[0] : { head: b.product || 'Your headline', sub: b.offer || 'Your offer line', cta: b.cta || 'Scan to redeem' };
    const kicker = (primary && primary.kicker) || b.brand || 'Your brand';
    const frame = (cls, label, extra) => `<div class="card">
      <div class="card__head"><h3 class="card__title" style="font-size:.95rem">${A.esc(label)}</h3></div>
      <div class="preview-frame"><div class="preview-frame__device preview-frame__device--${cls}">
        <div class="preview-canvas"><div>
          <div class="pv-brand">${A.esc(kicker)}</div>
          <div class="pv-head">${A.esc(v.head)}</div>
          <div class="pv-sub">${A.esc(v.sub)}</div>
          <span class="pv-cta">${A.esc(v.cta)}</span>
          ${extra || ''}
        </div></div>
      </div></div>
      <p class="tiny muted" style="margin-top:10px">${A.esc(A.t('studio.frame_' + cls))}</p>
    </div>`;
    q('previewOut').innerHTML =
      frame('square', A.t('studio.frame_square_t'), qrSvg('holo' + (b.brand || 'x'), 74)) +
      frame('portrait', A.t('studio.frame_portrait_t'), '') +
      frame('landscape', A.t('studio.frame_landscape_t'), '');
  }

  function renderStory() {
    if (!result) {
      q('storyOut').innerHTML = `<div class="empty"><h3>${A.esc(A.t('studio.empty_title'))}</h3>
        <p>${A.esc(A.t('studio.empty_body'))}</p></div>`;
      return;
    }
    const li = (arr, fallbackKey) => `<ul class="storyboard">${arr.map(s => `<li>
      <time>${A.esc(s.t)}</time><span>${A.esc(s.text || A.L(s))}</span></li>`).join('')}</ul>`;
    q('storyOut').innerHTML = `
      <div class="card"><h3 class="card__title">${A.esc(A.t('studio.story_holo'))}</h3>
        <p class="card__sub">${A.esc(A.t('studio.story_holo_sub'))}</p>${li(result.storyboardHolo)}</div>
      <div class="card"><h3 class="card__title">${A.esc(A.t('studio.story_social'))}</h3>
        <p class="card__sub">${A.esc(A.t('studio.story_social_sub'))}</p>${li(result.storyboardSocial)}</div>`;
  }

  function specRows() {
    const h = CFG.hologram;
    return [
      ['studio.spec_aspect', '1:1 (' + A.esc(A.t('studio.spec_square')) + ')', A.t('studio.spec_aspect_v')],
      ['studio.spec_bg', '#000000', A.t('studio.spec_bg_v', { n: Math.round(h.backgroundCoverageMin * 100) })],
      ['studio.spec_safe', Math.round((1 - h.marginSafePct * 2) * 100) + '%', A.t('studio.spec_safe_v', { n: Math.round(h.marginSafePct * 100) })],
      ['studio.spec_loop', h.durationTarget[0] + '–' + h.durationTarget[1] + ' s', A.t('studio.spec_loop_v')],
      ['studio.spec_codec', 'MP4 / H.264', A.t('studio.spec_codec_v')],
      ['studio.spec_size', '≤ ' + h.maxFileMb + ' MB', A.t('studio.spec_size_v')],
      ['studio.spec_text', A.t('studio.spec_text_v'), A.t('studio.spec_text_d')],
      ['studio.spec_duty', h.minRunHours + ' h', A.t('studio.spec_duty_v')],
      ['studio.spec_hw', A.t('studio.spec_hw_v'), A.t('studio.spec_hw_d')]
    ];
  }

  function renderSpec() {
    q('specTable').innerHTML = `<thead><tr><th>${A.esc(A.t('studio.spec_item'))}</th>
      <th>${A.esc(A.t('studio.spec_value'))}</th><th>${A.esc(A.t('studio.spec_why'))}</th></tr></thead>
      <tbody>${specRows().map(r => `<tr><td>${A.esc(A.t(r[0]))}</td><td class="mono">${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody>`;
  }

  /* ---------- compliance check -------------------------------------------- */
  const mark = s => `<span class="mark mark--${s.k}">${s.k === 'pass' ? '✓' : s.k === 'warn' ? '!' : s.k === 'fail' ? '✕' : '–'}</span>`;
  function checkRow(s) {
    return `<li>${mark(s)}<span><b>${A.esc(s.name)}</b> — ${A.esc(s.detail)}</span>
      <span class="tiny muted nowrap">${A.esc(s.value || '')}</span></li>`;
  }

  function imageChecks(file, img) {
    const h = CFG.hologram;
    return new Promise(resolve => {
      const scale = Math.min(1, 480 / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale)), ht = Math.max(1, Math.round(img.height * scale));
      const cv = document.createElement('canvas');
      cv.width = w; cv.height = ht;
      const ctx = cv.getContext('2d');
      ctx.drawImage(img, 0, 0, w, ht);
      const data = ctx.getImageData(0, 0, w, ht).data;
      let black = 0, minX = w, minY = ht, maxX = 0, maxY = 0, lum = 0;
      for (let y = 0; y < ht; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          lum += l;
          if (r < h.blackThreshold && g < h.blackThreshold && b < h.blackThreshold) black++;
          else {
            if (x < minX) minX = x; if (x > maxX) maxX = x;
            if (y < minY) minY = y; if (y > maxY) maxY = y;
          }
        }
      }
      const blackRatio = black / (w * ht);
      const marginLeft = minX / w, marginRight = (w - 1 - maxX) / w, marginTop = minY / ht, marginBottom = (ht - 1 - maxY) / ht;
      const minMargin = Math.min(marginLeft, marginRight, marginTop, marginBottom);
      const aspect = img.width / img.height;
      const sizeMb = file.size / 1048576;
      const rows = [];
      const aspectOk = Math.abs(aspect - h.aspectTarget) <= h.aspectTolerance;
      rows.push({
        k: aspectOk ? 'pass' : 'warn', name: A.t('studio.chk_aspect'),
        detail: aspectOk ? A.t('studio.chk_aspect_ok') : A.t('studio.chk_aspect_bad'),
        value: aspect.toFixed(2) + ':1'
      });
      rows.push({
        k: blackRatio >= h.backgroundCoverageMin ? 'pass' : 'fail', name: A.t('studio.chk_bg'),
        detail: blackRatio >= h.backgroundCoverageMin ? A.t('studio.chk_bg_ok') : A.t('studio.chk_bg_bad'),
        value: A.pct(blackRatio, 0)
      });
      rows.push({
        k: minMargin >= h.marginSafePct ? 'pass' : 'warn', name: A.t('studio.chk_safe'),
        detail: minMargin >= h.marginSafePct ? A.t('studio.chk_safe_ok') : A.t('studio.chk_safe_bad'),
        value: A.pct(minMargin, 0) + ' ' + A.t('studio.chk_margin')
      });
      rows.push({
        k: sizeMb <= h.maxFileMb ? 'pass' : 'warn', name: A.t('studio.chk_size'),
        detail: sizeMb <= h.maxFileMb ? A.t('studio.chk_size_ok') : A.t('studio.chk_size_bad'),
        value: sizeMb.toFixed(1) + ' MB'
      });
      rows.push({
        k: /image\/(jpeg|png|gif|webp)/.test(file.type) ? 'pass' : 'warn', name: A.t('studio.chk_format'),
        detail: A.t('studio.chk_format_img'), value: (file.name.split('.').pop() || '').toUpperCase()
      });
      rows.push({ k: 'skip', name: A.t('studio.chk_loop'), detail: A.t('studio.chk_loop_img'), value: '—' });
      rows.push({ k: 'warn', name: A.t('studio.chk_text'), detail: A.t('studio.chk_text_manual'), value: A.t('studio.chk_manual') });
      resolve(rows);
    });
  }

  function videoChecks(file, video) {
    const h = CFG.hologram;
    const dur = video.duration, aspect = video.videoWidth / video.videoHeight, sizeMb = file.size / 1048576;
    const inRange = dur >= h.durationTarget[0] && dur <= h.durationTarget[1];
    return [
      { k: Math.abs(aspect - h.aspectTarget) <= h.aspectTolerance ? 'pass' : 'warn', name: A.t('studio.chk_aspect'),
        detail: A.t('studio.chk_aspect_bad'), value: aspect.toFixed(2) + ':1 (' + video.videoWidth + '×' + video.videoHeight + ')' },
      { k: inRange ? 'pass' : 'warn', name: A.t('studio.chk_loop'),
        detail: inRange ? A.t('studio.chk_loop_ok') : A.t('studio.chk_loop_bad'),
        value: dur.toFixed(1) + ' s' },
      { k: /mp4|quicktime|x-msvideo/.test(file.type) ? 'pass' : 'warn', name: A.t('studio.chk_format'),
        detail: A.t('studio.chk_format_vid'), value: (file.name.split('.').pop() || '').toUpperCase() },
      { k: sizeMb <= h.maxFileMb ? 'pass' : 'warn', name: A.t('studio.chk_size'),
        detail: sizeMb <= h.maxFileMb ? A.t('studio.chk_size_ok') : A.t('studio.chk_size_bad'), value: sizeMb.toFixed(1) + ' MB' },
      { k: 'skip', name: A.t('studio.chk_bg'), detail: A.t('studio.chk_bg_video'), value: A.t('studio.chk_manual') },
      { k: 'skip', name: A.t('studio.chk_safe'), detail: A.t('studio.chk_safe_video'), value: A.t('studio.chk_manual') },
      { k: 'warn', name: A.t('studio.chk_text'), detail: A.t('studio.chk_text_manual'), value: A.t('studio.chk_manual') }
    ];
  }

  function runCheck() {
    const f = q('checkFile').files && q('checkFile').files[0];
    if (!f) { A.toast(A.t('studio.check_need_file'), 'warn'); return; }
    const out = q('checkOut');
    out.innerHTML = `<li><span class="mark mark--skip">…</span><span>${A.esc(A.t('studio.check_running'))}</span><span></span></li>`;
    const url = URL.createObjectURL(f);
    if (f.type.startsWith('video/')) {
      const v = document.createElement('video');
      v.preload = 'metadata'; v.muted = true;
      v.onloadedmetadata = () => {
        out.innerHTML = videoChecks(f, v).map(checkRow).join('');
        URL.revokeObjectURL(url);
      };
      v.onerror = () => {
        out.innerHTML = checkRow({ k: 'fail', name: A.t('studio.chk_format'), detail: A.t('studio.check_decode_fail'), value: '' });
        URL.revokeObjectURL(url);
      };
      v.src = url;
    } else {
      const img = new Image();
      img.onload = async () => {
        const rows = await imageChecks(f, img);
        out.innerHTML = rows.map(checkRow).join('');
        URL.revokeObjectURL(url);
      };
      img.onerror = () => {
        out.innerHTML = checkRow({ k: 'fail', name: A.t('studio.chk_format'), detail: A.t('studio.check_decode_fail'), value: '' });
        URL.revokeObjectURL(url);
      };
      img.src = url;
    }
  }

  /* ---------- generate ---------------------------------------------------- */
  async function generate(ev) {
    if (ev && ev.preventDefault) ev.preventDefault();
    const b = brief();
    if (!b.brand && !b.product) { A.toast(A.t('studio.need_brief'), 'warn'); return; }
    const btn = q('genBtn');
    btn.disabled = true;
    btn.textContent = A.t('studio.generating');
    try {
      if (CFG.ai.mode === 'proxy') {
        try { result = await liveResult(b); }
        catch (e) { result = demoResult(b); A.toast(A.t('studio.fallback'), 'warn'); }
      } else {
        await new Promise(r => setTimeout(r, 550)); /* keep the demo honest about latency */
        result = demoResult(b);
      }
      renderAssets(); renderPreview(); renderStory(); renderSpec();
      showTab(activeTab);
      A.toast(A.t('studio.toast_generated'), 'ok');
    } finally {
      btn.disabled = false;
      btn.textContent = A.t('studio.generate');
    }
  }

  function showTab(name) {
    activeTab = name;
    ['assets', 'preview', 'story', 'spec', 'check'].forEach(t =>
      q('tab-' + t).classList.toggle('is-active', t === name));
    q('studioTabs').querySelectorAll('button').forEach(b =>
      b.classList.toggle('is-active', b.getAttribute('data-tab') === name));
  }

  function textReport() {
    if (!result) return '';
    const b = brief();
    const L = [];
    L.push('3dNakedEye AI Creative Studio — generated copy');
    L.push('Brand: ' + (b.brand || '-') + ' | Product: ' + (b.product || '-') + ' | Source: ' + result.source);
    L.push('');
    result.perLanguage.forEach(p => {
      L.push('=== ' + langLabel(p.lang) + ' (' + p.lang + ') ===');
      p.variants.forEach(v => {
        L.push('[' + A.t('studio.variant_' + v.id) + '] ' + v.head);
        L.push('   ' + v.sub + ' | CTA: ' + v.cta + ' | ' + v.hashtags);
      });
      L.push('Subtitles: ' + p.subtitles.join(' / '));
      L.push('Voice-over: ' + p.voiceover);
      L.push('');
    });
    L.push('=== Hologram storyboard ===');
    result.storyboardHolo.forEach(s => L.push(s.t + '  ' + (s.text || A.L(s))));
    L.push('=== Vertical social storyboard ===');
    result.storyboardSocial.forEach(s => L.push(s.t + '  ' + (s.text || A.L(s))));
    return L.join('\n');
  }

  function specReport() {
    const L = ['3dNakedEye — hologram delivery specification', ''];
    specRows().forEach(r => L.push(A.t(r[0]) + ': ' + String(r[1]).replace(/<[^>]+>/g, '') + '  (' + r[2].replace(/<[^>]+>/g, '') + ')'));
    L.push('', 'Devices: 3DNE-P30S (28 cm, 0.5-2 m) / 3DNE-P65YD (65 cm, 1.5-5 m)');
    L.push('Supported files: ' + CFG.hologram.formats.join(', '));
    return L.join('\n');
  }

  function download(name, text) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 500);
  }

  function useCreative() {
    const b = brief();
    if (!b.brand && !b.product) { A.toast(A.t('studio.need_brief'), 'warn'); return; }
    const langs = b.langs.length || 1;
    const hologram = b.outputs.includes('holo');
    const fee = S.aiFee({ enabled: true, languages: langs.length, hologram });
    S.saveDraft({
      useInBooking: true, brief: b, source: result ? result.source : 'none',
      languages: b.langs, hologram,
      fee, creative: { name: 'ai_studio_' + (b.brand || 'brand').replace(/\s+/g, '_').slice(0, 18) + (hologram ? '_1x1.mp4' : '_9x16.mp4'), form: hologram ? 'hologram' : 'screen', languages: b.langs },
      report: textReport()
    });
    A.toast(A.t('studio.toast_added', { fee: A.money(fee) }), 'ok');
  }

  function saveDraft() {
    const draft = S.state.aiDrafts[0];
    if (!draft || !draft.useInBooking) {
      S.saveDraft({ useInBooking: false, brief: brief(), source: result ? result.source : 'none', report: textReport() });
    }
    A.toast(A.t('studio.toast_saved'), 'ok');
  }

  /* ---------- init -------------------------------------------------------- */
  function refresh() {
    buildControls();
    renderAssets(); renderPreview(); renderStory(); renderSpec();
  }

  document.addEventListener('DOMContentLoaded', () => {
    buildControls();
    q('briefForm').addEventListener('submit', generate);
    q('demoFill').addEventListener('click', () => { demoBrief(); A.toast(A.t('studio.toast_demo'), 'ok'); });
    q('studioTabs').addEventListener('click', e => {
      const b = e.target.closest('button'); if (b) showTab(b.getAttribute('data-tab'));
    });
    q('runCheck').addEventListener('click', runCheck);
    q('dlSpec').addEventListener('click', () => download('3dNakedEye-hologram-spec.txt', specReport()));
    q('dlScript').addEventListener('click', () => download('3dNakedEye-creative-copy.txt', textReport() || 'No output yet'));
    q('useCreative').addEventListener('click', useCreative);
    q('saveDraft').addEventListener('click', saveDraft);
    q('sFiles').addEventListener('change', e => {
      files = Array.from(e.target.files || []).slice(0, 6);
      q('filePreview').innerHTML = files.map(f => {
        const url = URL.createObjectURL(f);
        return `<figure style="margin:0"><img src="${url}" alt="${A.esc(f.name)}" style="width:74px;height:74px;object-fit:cover;border-radius:10px;border:1px solid var(--line)">
          <figcaption class="tiny muted" style="max-width:74px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${A.esc(f.name)}</figcaption></figure>`;
      }).join('');
      if (files.length) A.toast(A.t('studio.files_ready', { n: files.length }), 'ok');
    });
    renderSpec();
  });

  A.onLangChange(refresh);
})();
