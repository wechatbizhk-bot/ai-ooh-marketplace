/* ============================================================================
 * 3dNakedEye — page-video.js
 * Explainer video: an animated, trilingual, chaptered walkthrough of the
 * benefits for advertisers and landlords.
 *
 * Three modes (LG_CONFIG.video.mode):
 *   'builtin' — the timeline player below, works offline, narrated by the
 *               browser speech engine, subtitled in the current language
 *   'file'    — your own MP4 (video.src) with an optional poster
 *   'youtube' — your own YouTube ID (video.youtubeId)
 *
 * Query helpers:
 *   ?scene=3          jump to a chapter
 *   ?still=1          render one scene as a still (for thumbnails / export)
 * ==========================================================================*/
(function () {
  'use strict';
  const S = window.LG.store, A = window.LG.app, CFG = window.LG_CONFIG;
  const q = id => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  /* rAF / clock fallbacks keep the player working in unusual embeds and test hosts */
  const now = () => (window.performance && window.performance.now) ? window.performance.now() : Date.now();
  const rAF = typeof window.requestAnimationFrame === 'function'
    ? cb => window.requestAnimationFrame(cb)
    : cb => setTimeout(() => cb(now()), 16);

  /* Chapter durations in seconds — total 146 s. */
  const SCENES = [
    { id: 1, dur: 8 },   /* hook */
    { id: 2, dur: 14 },  /* today's problem */
    { id: 3, dur: 16 },  /* what is a DSP */
    { id: 4, dur: 16 },  /* what an online ad platform gives you */
    { id: 5, dur: 16 },  /* advertiser benefits here */
    { id: 6, dur: 16 },  /* landlord benefits */
    { id: 7, dur: 16 },  /* LBS: pull vs push */
    { id: 8, dur: 12 },  /* pipeline */
    { id: 9, dur: 12 },  /* measurement */
    { id: 10, dur: 12 }, /* roadmap to programmatic */
    { id: 11, dur: 8 }   /* call to action */
  ];
  const TOTAL = SCENES.reduce((s, x) => s + x.dur, 0);
  const starts = () => { let t = 0; return SCENES.map(s => { const o = t; t += s.dur; return o; }); };

  const ADV = ['b1', 'b2', 'b3', 'b4', 'b5'];
  const LL = ['b1', 'b2', 'b3', 'b4', 'b5'];
  const PIPE = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'];

  /* Scene artwork (data-driven, no external assets). */
  const ART = {
    1: () => `<div class="scene__art">
        <span class="art-node">◎ 480 slots / day</span>
        <span class="art-arrow">→</span>
        <span class="art-node art-node--good">✓ 12,480 plays logged</span>
        <span class="art-node art-node--good">✓ 1,204 QR scans</span>
      </div>`,
    2: () => `<div class="scene__art">
        <span class="art-node art-node--bad">✕ phone call</span>
        <span class="art-arrow">→</span>
        <span class="art-node art-node--bad">✕ PDF rate card</span>
        <span class="art-arrow">→</span>
        <span class="art-node art-node--bad">✕ bank transfer</span>
        <span class="art-arrow">→</span>
        <span class="art-node art-node--bad">? did it play?</span>
      </div>`,
    3: () => `<div class="scene__art">
        <span class="art-node">${A.esc(A.t('video.dsp_node1'))}</span>
        <span class="art-arrow">→</span>
        <span class="art-node">${A.esc(A.t('video.dsp_node2'))}</span>
        <span class="art-arrow">→</span>
        <span class="art-node art-node--good">${A.esc(A.t('video.dsp_node3'))}</span>
      </div>`,
    4: () => `<div class="scene__art">
        <span class="art-node art-node--good">${A.esc(A.t('video.pl_node1'))}</span>
        <span class="art-node art-node--good">${A.esc(A.t('video.pl_node2'))}</span>
        <span class="art-node art-node--good">${A.esc(A.t('video.pl_node3'))}</span>
        <span class="art-node art-node--good">${A.esc(A.t('video.pl_node4'))}</span>
      </div>`,
    5: () => `<div class="scene__art">
        <span class="art-node art-node--good">${A.esc(A.t('video.adv_c1'))}</span>
        <span class="art-node art-node--good">${A.esc(A.t('video.adv_c2'))}</span>
        <span class="art-node art-node--good">${A.esc(A.t('video.adv_c3'))}</span>
      </div>`,
    6: () => `<div class="scene__art">
        <span class="art-node art-node--good">${A.esc(A.t('video.ll_c1'))}</span>
        <span class="art-node art-node--good">${A.esc(A.t('video.ll_c2'))}</span>
        <span class="art-node art-node--good">${A.esc(A.t('video.ll_c3'))}</span>
      </div>`,
    7: () => `<div class="scene__art">
        <span class="art-node">${A.esc(A.t('lbs.src_gps'))}</span>
        <span class="art-node">${A.esc(A.t('lbs.src_cell'))}</span>
        <span class="art-node">${A.esc(A.t('lbs.src_wifi'))}</span>
        <span class="art-node">${A.esc(A.t('lbs.src_ble'))}</span>
        <span class="art-arrow">→</span>
        <span class="art-node art-node--good">${A.esc(A.t('lbs.pull'))}</span>
        <span class="art-node art-node--good">${A.esc(A.t('lbs.push'))}</span>
      </div>`,
    8: () => `<div class="scene__art">
        ${PIPE.map(k => `<span class="art-node">${A.esc(A.t('video.pipe_' + k))}</span>`).join('<span class="art-arrow">→</span>')}
      </div>`,
    9: () => `<div class="scene__art">
        <span class="art-node art-node--good">${A.esc(A.t('measure.verified'))}</span>
        <span class="art-node">${A.esc(A.t('measure.exposure'))}</span>
        <span class="art-node">${A.esc(A.t('measure.engagement'))}</span>
      </div>`,
    10: () => `<div class="scene__art">
        <span class="art-node art-node--good">${A.esc(A.t('road.p1'))}</span>
        <span class="art-arrow">→</span>
        <span class="art-node">${A.esc(A.t('road.p2'))}</span>
        <span class="art-arrow">→</span>
        <span class="art-node">${A.esc(A.t('road.p3'))}</span>
      </div>`,
    11: () => `<div class="row" style="margin-top:6px">
        <a class="btn btn--primary btn--sm" href="marketplace.html">${A.esc(A.t('hero.cta_browse'))}</a>
        <a class="btn btn--ghost btn--sm" href="landlord.html#register">${A.esc(A.t('hero.cta_list'))}</a>
      </div>`
  };

  function sceneMarkup(s) {
    return `<section class="scene" data-scene="${s.id}" aria-hidden="true">
      <span class="scene__kicker">${A.esc(A.t('video.s' + s.id + '_kicker'))}</span>
      <h2 class="scene__title">${A.esc(A.t('video.s' + s.id + '_title'))}</h2>
      <p class="scene__body">${A.esc(A.t('video.s' + s.id + '_body'))}</p>
      ${ART[s.id] ? ART[s.id]() : ''}
    </section>`;
  }

  function playerMarkup() {
    const mode = (CFG.video && CFG.video.mode) || 'builtin';
    if (mode === 'youtube' && CFG.video.youtubeId) {
      return `<div class="explainer">
        <div class="explainer__stage" style="aspect-ratio:16/9;padding:0">
          <iframe style="position:absolute;inset:0;width:100%;height:100%;border:0"
            src="https://www.youtube.com/embed/${encodeURIComponent(CFG.video.youtubeId)}"
            title="${A.esc(A.t('video.eyebrow'))}" allowfullscreen></iframe>
        </div>
      </div>`;
    }
    if (mode === 'file' && CFG.video.src) {
      return `<div class="explainer">
        <video controls preload="metadata" style="width:100%;border-radius:var(--radius)"
          ${CFG.video.poster ? `poster="${A.esc(CFG.video.poster)}"` : ''} src="${A.esc(CFG.video.src)}"></video>
        <p class="tiny muted">${A.esc(A.t('video.file_note'))}</p>
      </div>`;
    }
    return `<div class="explainer" id="explainer">
      <div class="explainer__stage" id="stage">
        ${SCENES.map(sceneMarkup).join('')}
        <div class="scene__subs" id="subs"></div>
      </div>
      <div class="explainer__bar">
        <button class="btn btn--primary btn--sm" type="button" id="btnPlay">▶ <span data-i18n="video.play">Play</span></button>
        <button class="btn btn--ghost btn--sm" type="button" id="btnRestart" data-i18n="video.restart">Restart</button>
        <button class="btn btn--quiet btn--sm" type="button" id="btnPrev" data-i18n-label="video.prev">⏮</button>
        <button class="btn btn--quiet btn--sm" type="button" id="btnNext" data-i18n-label="video.next">⏭</button>
        <span class="explainer__time" id="timeOut">0:00 / 1:34</span>
        <div class="explainer__progress" id="progress" role="slider" tabindex="0"
          aria-label="${A.esc(A.t('video.seek'))}" aria-valuemin="0" aria-valuemax="${TOTAL}" aria-valuenow="0">
          <span id="progressFill"></span>
        </div>
        <button class="btn btn--quiet btn--sm" type="button" id="btnFs" data-i18n="video.fullscreen">Full screen</button>
      </div>
    </div>`;
  }

  /* ---------- timeline engine ------------------------------------------- */
  let elapsed = 0, playing = false, last = 0, raf = null, active = 0;
  let subsOn = true, voiceOn = !!(CFG.video && CFG.video.voiceOver);

  const fmt = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');

  function sceneAt(t) {
    const st = starts();
    for (let i = SCENES.length - 1; i >= 0; i--) if (t >= st[i]) return i;
    return 0;
  }

  function setScene(i, opts) {
    if (i === active && !(opts && opts.force)) return;
    active = i;
    document.querySelectorAll('#stage .scene').forEach((el, idx) => {
      const on = idx === i;
      el.classList.toggle('is-active', on);
      el.setAttribute('aria-hidden', String(!on));
    });
    const s = SCENES[i];
    const sub = q('subs');
    if (sub) {
      sub.innerHTML = `<span>${A.esc(A.t('video.s' + s.id + '_sub'))}</span>`;
      sub.classList.toggle('is-hidden', !subsOn);
    }
    document.querySelectorAll('#videoChapters button').forEach((b, idx) =>
      b.classList.toggle('is-active', idx === i));
    if (playing || (opts && opts.speak)) speak(A.t('video.s' + s.id + '_sub'));
  }

  /* ---------- narration voices -------------------------------------------
   * Traditional Chinese (zh-HK) must be narrated in **Cantonese**, never in
   * Mandarin. Voice inventories differ per machine, so each locale declares
   * the language tags it accepts, in priority order, plus name hints. If no
   * Cantonese voice exists we do not silently read Mandarin — playback
   * continues with subtitles and the player says what is missing.
   * -------------------------------------------------------------------*/
  const VOICE_RULES = {
    en: { tags: ['en-HK', 'en-GB', 'en-US', 'en'], hints: /english|us |uk |british|american/i },
    'zh-HK': {
      tags: ['zh-HK', 'zh-Hant-HK', 'yue-HK', 'yue', 'zh-yue', 'zh_HK'],
      hints: /cantonese|hong ?kong|yue|粵|粤|廣東話|广东话|sinji|hiujin|danny|wong|kevin|hongkong/i,
      /* Anything Mandarin/Taiwan/Mainland must never narrate 繁體中文. */
      exclude: /zh[-_]?(tw|cn)([-_]|$)|zh[-_]?hans|taiwan|台灣|台湾|mandarin|putonghua|guoyu|國語|国语|普通话|普通話/i
    },
    'zh-CN': {
      tags: ['zh-CN', 'zh-Hans', 'cmn-Hans', 'cmn', 'zh-TW', 'zh-Hant', 'zh'],
      hints: /mandarin|putonghua|普通话|普通話|mainland|chinese/i,
      /* Simplified Chinese must not be read with a Cantonese voice either. */
      exclude: /cantonese|hong ?kong|yue|zh[-_]?hk|粵|粤|廣東話|广东话|sinji|tracy|danny|wong/i
    },
    th: { tags: ['th-TH', 'th'], hints: /thai|ไทย/i }
  };
  const VOICE_PREF_KEY = '3dnakedeye.voice';
  let voiceNoticeShown = false;
  let voicePref = null;   /* 'auto' | voiceURI */

  try { voicePref = window.localStorage.getItem(VOICE_PREF_KEY) || 'auto'; } catch (e) { voicePref = 'auto'; }

  const allVoices = () => {
    try { return window.speechSynthesis.getVoices() || []; } catch (e) { return []; }
  };

  /* Best voice for a locale, or null when only a wrong-language voice exists. */
  function pickVoice(code) {
    const rule = VOICE_RULES[code] || VOICE_RULES.en;
    const voices = allVoices();
    if (!voices.length) return null;
    if (voicePref && voicePref !== 'auto') {
      /* An explicit pick still cannot force Mandarin onto 繁體中文. */
      const exact = voices.find(v => (v.voiceURI || v.name) === voicePref);
      if (exact && !(rule.exclude && rule.exclude.test((exact.lang || '') + ' ' + (exact.name || '')))) {
        return { voice: exact, exact: true };
      }
    }
    const usable = voices.filter(v => !(rule.exclude && rule.exclude.test((v.lang || '') + ' ' + (v.name || ''))));
    for (const tag of rule.tags) {
      const hit = usable.find(v => (v.lang || '').toLowerCase() === tag.toLowerCase())
        || usable.find(v => (v.lang || '').toLowerCase().startsWith(tag.toLowerCase()));
      if (hit) return { voice: hit };
    }
    const byName = usable.find(v => rule.hints.test((v.name || '') + ' ' + (v.lang || '')));
    if (byName) return { voice: byName, byName: true };
    return null;
  }

  /* Cantonese availability drives a visible note in the player. */
  function cantoneseVoice() { return pickVoice('zh-HK'); }

  function voiceLabel() {
    if (!('speechSynthesis' in window)) return '';
    const picked = pickVoice(A.lang);
    if (picked) return picked.voice.name + ' · ' + picked.voice.lang;
    return A.lang === 'zh-HK' ? A.t('video.voice_missing_cantonese') : A.t('video.voice_none');
  }

  /* One utterance path, so the player and the Test button behave identically. */
  function say(text) {
    const picked = pickVoice(A.lang);
    if (!picked) {
      /* Never read Mandarin for 繁體中文. Continue with subtitles instead. */
      if (A.lang === 'zh-HK' && !voiceNoticeShown) {
        voiceNoticeShown = true;
        A.toast(A.t('video.voice_missing_cantonese'), 'warn');
      }
      updateVoiceLine();
      return false;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = picked.voice.lang || (VOICE_RULES[A.lang] || VOICE_RULES.en).tags[0];
    u.voice = picked.voice;
    u.rate = 0.96;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    return true;
  }

  function speak(text) {
    if (!voiceOn || !('speechSynthesis' in window)) return;
    try { say(text); } catch (e) { /* narration is a bonus, never a blocker */ }
  }

  /* Manual check, independent of the Voice-over checkbox. */
  function testVoice() {
    if (!('speechSynthesis' in window)) { A.toast(A.t('video.voice_none'), 'warn'); return; }
    try {
      const spoken = say('3dNakedEye — ' + A.t('video.voice_test'));
      if (!spoken) {
        A.toast(A.lang === 'zh-HK' ? A.t('video.voice_missing_cantonese') : A.t('video.voice_none'), 'warn');
      }
    } catch (e) { /* ignore */ }
  }

  /* Voice picker: Auto plus every installed voice, with the language tag. */
  function renderVoicePicker() {
    const sel = q('optVoicePick');
    if (!sel) return;
    if (!('speechSynthesis' in window)) { sel.innerHTML = `<option>${A.esc(A.t('video.voice_none'))}</option>`; sel.disabled = true; return; }
    const voices = allVoices();
    if (!voices.length) {
      sel.innerHTML = `<option value="auto">${A.esc(A.t('video.voice_loading'))}</option>`;
      return;
    }
    sel.disabled = false;
    sel.innerHTML = `<option value="auto">${A.esc(A.t('video.voice_auto'))}</option>` +
      voices.map(v => `<option value="${A.esc(v.voiceURI || v.name)}">${A.esc(v.name + ' · ' + v.lang)}</option>`).join('');
    sel.value = voices.some(v => (v.voiceURI || v.name) === voicePref) ? voicePref : 'auto';
    updateVoiceLine();
  }

  function updateVoiceLine() {
    const out = q('optVoiceState');
    if (!out) return;
    const picked = pickVoice(A.lang);
    const canto = cantoneseVoice();
    const bits = [`${A.esc(A.t('video.voice_active'))}: ${A.esc(voiceLabel())}`];
    if (A.lang === 'zh-HK') {
      bits.push(canto
        ? `<span class="pill pill--ok">${A.esc(A.t('video.voice_cantonese_ok'))}</span>`
        : `<span class="pill pill--warn">${A.esc(A.t('video.voice_cantonese_missing'))}</span>`);
    }
    out.innerHTML = bits.join(' ');
    void picked;
  }

  function tick(now) {
    if (playing) {
      const dt = (now - last) / 1000;
      last = now;
      elapsed = Math.min(TOTAL, elapsed + dt);
      if (elapsed >= TOTAL) {
        playing = false;
        if (q('btnPlay')) q('btnPlay').innerHTML = '▶ <span>' + A.esc(A.t('video.replay')) + '</span>';
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      }
      paint();
    } else { last = now; }
    raf = rAF(tick);
  }

  function paint() {
    setScene(sceneAt(elapsed));
    const fill = q('progressFill'), t = q('timeOut'), bar = q('progress');
    if (fill) fill.style.width = (elapsed / TOTAL * 100).toFixed(1) + '%';
    if (t) t.textContent = fmt(elapsed) + ' / ' + fmt(TOTAL);
    if (bar) bar.setAttribute('aria-valuenow', String(Math.round(elapsed)));
  }

  function play() {
    playing = true;
    last = now();
    const b = q('btnPlay');
    if (b) b.innerHTML = '❙❙ <span>' + A.esc(A.t('video.pause')) + '</span>';
    speak(A.t('video.s' + SCENES[active].id + '_sub'));
  }
  function pause() {
    playing = false;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    const b = q('btnPlay');
    if (b) b.innerHTML = '▶ <span>' + A.esc(A.t('video.play')) + '</span>';
  }
  function seekScene(i) {
    const st = starts();
    elapsed = st[Math.max(0, Math.min(SCENES.length - 1, i))] + 0.05;
    setScene(sceneAt(elapsed), { force: true });
    paint();
  }

  function renderChapters() {
    const st = starts();
    q('videoChapters').innerHTML = SCENES.map((s, i) =>
      `<li><button type="button" data-chapter="${i}">
        <time>${fmt(st[i])}</time>
        <span>${A.esc(A.t('video.s' + s.id + '_title'))}</span>
      </button></li>`).join('');
    q('videoChapters').querySelectorAll('[data-chapter]').forEach(b =>
      b.addEventListener('click', () => seekScene(parseInt(b.getAttribute('data-chapter'), 10))));
  }

  function renderPlayer() {
    q('videoHost').innerHTML = playerMarkup();
    A.applyStatic(q('videoHost'));
    if (!q('explainer')) return;                  /* file / youtube mode */
    renderChapters();
    setScene(0, { force: true });
    paint();

    q('btnPlay').addEventListener('click', () => { playing ? pause() : play(); });
    q('btnRestart').addEventListener('click', () => { elapsed = 0; seekScene(0); });
    q('btnPrev').addEventListener('click', () => seekScene(sceneAt(elapsed) - 1));
    q('btnNext').addEventListener('click', () => seekScene(sceneAt(elapsed) + 1));
    q('btnFs').addEventListener('click', () => {
      const el = q('stage');
      if (el.requestFullscreen) el.requestFullscreen();
    });
    const bar = q('progress');
    const seekFromEvent = e => {
      const r = bar.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      elapsed = Math.max(0, Math.min(TOTAL, (x / r.width) * TOTAL));
      setScene(sceneAt(elapsed), { force: true }); paint();
    };
    bar.addEventListener('click', seekFromEvent);
    bar.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { elapsed = Math.min(TOTAL, elapsed + 5); setScene(sceneAt(elapsed), { force: true }); paint(); }
      if (e.key === 'ArrowLeft') { elapsed = Math.max(0, elapsed - 5); setScene(sceneAt(elapsed), { force: true }); paint(); }
    });
    document.addEventListener('keydown', e => {
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (e.key === ' ') { e.preventDefault(); playing ? pause() : play(); }
    });

    q('optSubs').addEventListener('change', e => {
      subsOn = e.target.checked;
      q('subs').classList.toggle('is-hidden', !subsOn);
    });
    q('optVoice').addEventListener('change', e => {
      voiceOn = e.target.checked;
      if (!voiceOn && 'speechSynthesis' in window) window.speechSynthesis.cancel();
      updateVoiceLine();
    });

    /* deep links: ?scene=3 jumps, ?still=1 renders a still frame */
    const still = params.get('still') === '1';
    const sc = parseInt(params.get('scene') || '0', 10);
    if (sc) seekScene(sc - 1);
    if (still) {
      q('vBarHide') || q('.explainer__bar');
      const b = q('explainer').querySelector('.explainer__bar');
      if (b) b.style.display = 'none';
      const subs = q('subs');
      if (subs && params.get('subs') === '0') subs.classList.add('is-hidden');
    } else if (params.get('play') === '1') {
      play();
    }
    raf = rAF(tick);
  }

  /* ---------- benefits --------------------------------------------------- */
  function renderBenefits() {
    q('advBenefits').innerHTML = ADV.map(k =>
      `<div class="benefit"><span class="benefit__icon" aria-hidden="true">●</span>
        <div><h4>${A.esc(A.t('video.adv_' + k))}</h4><p>${A.esc(A.t('video.adv_' + k + '_d'))}</p></div></div>`).join('');
    q('llBenefits').innerHTML = LL.map(k =>
      `<div class="benefit benefit--ll"><span class="benefit__icon" aria-hidden="true">◆</span>
        <div><h4>${A.esc(A.t('video.ll_' + k))}</h4><p>${A.esc(A.t('video.ll_' + k + '_d'))}</p></div></div>`).join('');
    q('pipelineFlow').innerHTML = PIPE.map(k =>
      `<div class="flow__node">${A.esc(A.t('video.pipe_' + k))}<span>${A.esc(A.t('video.pipe_' + k + '_d'))}</span></div>`).join('');
  }

  /* Average of the live rate card — used by both calculators. */
  function marketAverage() {
    const live = S.liveLocations();
    const rates = live.map(l => A.dayRate(l));
    const views = live.map(l => (l.footfallPerDay * l.visibility) / 480);
    const avg = arr => arr.reduce((s, x) => s + x, 0) / Math.max(1, arr.length);
    return { rate: avg(rates), viewsPerPlay: avg(views), locations: live.length };
  }

  function renderAdvCalc() {
    const budget = parseInt(q('advBudget').value, 10);
    const days = parseInt(q('advDays').value, 10);
    q('advBudgetOut').textContent = A.money(budget);
    q('advDaysOut').textContent = days;
    const m = marketAverage();
    const deviceDays = budget / Math.max(1, m.rate);
    const plays = Math.round(deviceDays * 480);
    const impressions = Math.round(plays * m.viewsPerPlay);
    const cpm = impressions ? (budget / impressions) * 1000 : 0;
    const scans = Math.round(plays * 0.004);
    const redemptions = Math.round(scans * 0.35);
    q('advCalcOut').innerHTML = `<ul class="kpi-list">
      <li><span>${A.esc(A.t('video.calc_device_days'))}</span><b>${A.num(deviceDays, 1)}</b></li>
      <li><span>${A.esc(A.t('video.calc_plays'))}</span><b>${A.num(plays)}</b></li>
      <li><span>${A.esc(A.t('video.calc_imp'))}</span><b>${A.num(impressions)}</b></li>
      <li><span>${A.esc(A.t('video.calc_cpm'))}</span><b>${A.money(cpm, { maximumFractionDigits: 2 })}</b></li>
      <li><span>${A.esc(A.t('video.calc_scans'))}</span><b>${A.num(scans)} → ${A.num(redemptions)}</b></li>
    </ul>
    <p class="tiny muted" style="margin:10px 0 0">${A.esc(A.t('video.calc_note', {
      rate: A.money(m.rate), days: days, n: m.locations }))}</p>`;
  }

  function renderLlCalc() {
    const dev = parseInt(q('llDevices').value, 10);
    const occ = parseInt(q('llOcc').value, 10) / 100;
    q('llDevicesOut').textContent = dev;
    q('llOccOut').textContent = Math.round(occ * 100) + '%';
    const m = marketAverage();
    const gross = dev * m.rate * 30 * occ;
    const share = gross * S.state.split.landlord;
    const p30 = window.LG_DEVICES.holo_p30s.listPrice, p65 = window.LG_DEVICES.holo_p65yd.listPrice;
    const year = share * 12;
    const paybackP30 = p30 / Math.max(1, share / dev);
    const paybackP65 = p65 / Math.max(1, share / dev);
    q('llCalcOut').innerHTML = `<ul class="kpi-list">
      <li><span>${A.esc(A.t('video.calc_gross'))}</span><b>${A.money(gross)}</b></li>
      <li><span>${A.esc(A.t('video.calc_share', { pct: A.pct(S.state.split.landlord, 0) }))}</span><b>${A.money(share)}</b></li>
      <li><span>${A.esc(A.t('video.calc_year'))}</span><b>${A.money(year)}</b></li>
      <li><span>${A.esc(A.t('video.calc_cost'))}</span><b>${A.esc(A.t('video.calc_cost_v'))}</b></li>
      <li><span>${A.esc(A.t('video.calc_payback'))}</span><b>${A.num(paybackP30, 1)} / ${A.num(paybackP65, 1)} ${A.esc(A.t('video.months'))}</b></li>
    </ul>
    <p class="tiny muted" style="margin:10px 0 0">${A.esc(A.t('video.ll_calc_note', {
      rate: A.money(m.rate), p30: A.money(p30), p65: A.money(p65) }))}</p>`;
  }

  /* ---------- downloads ------------------------------------------------- */
  function download(name, text) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 500);
  }

  function scriptText() {
    const st = starts();
    const L = ['3dNakedEye — AI OOH Marketplace', 'Explainer narration script', 'Runtime: ' + fmt(TOTAL) + '  ·  Chapters: ' + SCENES.length, ''];
    SCENES.forEach((s, i) => {
      L.push(`[${fmt(st[i])}] CHAPTER ${s.id} — ${A.t('video.s' + s.id + '_title')}`);
      L.push('    Narration: ' + A.t('video.s' + s.id + '_sub'));
      L.push('    On screen: ' + A.t('video.s' + s.id + '_body'));
      L.push('');
    });
    return L.join('\n');
  }

  function shotList() {
    const st = starts();
    const L = ['3dNakedEye — explainer shot list', 'Runtime: ' + fmt(TOTAL), ''];
    const SHOTS = {
      1: 'Opening: hologram fan on black, logo resolves, play counter ticks up.',
      2: 'Split screen: shop owner on a phone call, printed rate card, bank slip, then a blank screen.',
      3: 'DSP explainer: animated diagram — advertiser → demand-side platform → exchanges → publisher inventory, with the DSP logo-neutral.',
      4: 'Online ad platform benefits: licence-plate screen showing targeting, automation, measurement and transparency tiles snapping into place.',
      5: 'Advertiser at a laptop: map with pins, price appears, AI studio generates three variants, checkout.',
      6: 'Location owner at a mall: device hung in the atrium, phone approval tap, statement arrives.',
      7: 'LBS chapter: four signal sources (GPS, cell tower, Wi-Fi, beacon) converging on a phone, then pull (map search) and push (proximity offer) split screen.',
      8: 'Animated pipeline: upload → generate → approve → book → pay → play → prove.',
      9: 'Reporting screen: verified plays, uptime, modelled impressions, QR scans — each on its own row.',
      10: 'Roadmap: pilot network → marketplace → programmatic DOOH with OpenRTB, three stage cards flipping.',
      11: 'End card: brand lockup, both CTAs, QR to the marketplace.'
    };
    SCENES.forEach((s, i) => {
      L.push(`CH ${s.id}  ${fmt(st[i])}–${fmt(st[i] + s.dur)}  ${A.t('video.s' + s.id + '_title')}`);
      L.push('   shot: ' + SHOTS[s.id]);
      L.push('   VO  : ' + A.t('video.s' + s.id + '_sub'));
      L.push('');
    });
    L.push('Lower thirds / captions to burn in:');
    SCENES.forEach(s => L.push('  - ' + A.t('video.s' + s.id + '_kicker') + ' | ' + A.t('video.s' + s.id + '_title')));
    L.push('', 'Third-party reference videos to cite or link in the description:');
    ((CFG.video && CFG.video.references) || []).forEach(r => {
      L.push('  - ' + A.t('video.ref_' + r.id) + ' — ' + r.provider + ': ' + r.channel);
    });
    return L.join('\n');
  }

  /* ---------- third-party reference library ----------------------------- */
  function renderReferences() {
    const host = q('videoRefs');
    if (!host) return;
    const refs = (CFG.video && CFG.video.references) || [];
    const searchUrl = r => 'https://www.youtube.com/results?search_query=' + encodeURIComponent(r.query);
    host.innerHTML = refs.map(r => `
      <article class="card card--tight ref-card">
        <div class="row row--between" style="align-items:flex-start">
          <div>
            <span class="badge">${A.esc(r.provider)}</span>
            <h4 class="card__title" style="font-size:.98rem;margin:6px 0 4px">${A.esc(A.t('video.ref_' + r.id))}</h4>
            <p class="tiny muted" style="margin:0">${A.esc(A.t('video.ref_' + r.id + '_d'))}</p>
          </div>
        </div>
        ${r.youtubeId
          ? `<div class="ref-embed"><iframe src="https://www.youtube-nocookie.com/embed/${A.esc(r.youtubeId)}"
              title="${A.esc(A.t('video.ref_' + r.id))}" allowfullscreen loading="lazy"></iframe></div>`
          : ''}
        <div class="row" style="margin-top:12px;gap:8px">
          ${r.youtubeId ? '' : `<a class="btn btn--ghost btn--sm" href="${A.esc(searchUrl(r))}" target="_blank" rel="noopener">▶ ${A.esc(A.t('video.ref_search'))}</a>`}
          <a class="btn btn--quiet btn--sm" href="${A.esc(r.channel)}" target="_blank" rel="noopener">${A.esc(A.t('video.ref_source'))} ↗</a>
        </div>
      </article>`).join('') +
      `<p class="tiny muted" style="grid-column:1/-1">${A.esc(A.t('video.ref_note'))}</p>`;
  }

  function benefitsText() {
    const L = ['3dNakedEye — benefit summary', ''];
    L.push('ADVERTISER');
    ADV.forEach(k => L.push('  • ' + A.t('video.adv_' + k) + ' — ' + A.t('video.adv_' + k + '_d')));
    L.push('', 'LANDLORD / LOCATION OWNER');
    LL.forEach(k => L.push('  • ' + A.t('video.ll_' + k) + ' — ' + A.t('video.ll_' + k + '_d')));
    L.push('', 'Rev enue split in force: landlord ' + A.pct(S.state.split.landlord, 0) +
      ' · platform ' + A.pct(S.state.split.platform, 0) + ' · AI ' + A.pct(S.state.split.ai, 0) +
      ' · sales ' + A.pct(S.state.split.sales, 0));
    return L.join('\n').replace('Rev enue', 'Revenue');
  }

  /* ---------- init ------------------------------------------------------ */
  function renderAll() {
    renderPlayer();
    renderVoicePicker();
    renderBenefits();
    renderAdvCalc();
    renderLlCalc();
    renderReferences();
  }

  /* The picker lives outside #videoHost, so it is bound once and only its
   * options/value are refreshed on language change. */
  function bindVoicePicker() {
    const sel = q('optVoicePick');
    if (sel) {
      sel.addEventListener('change', e => {
        voicePref = e.target.value || 'auto';
        try { window.localStorage.setItem(VOICE_PREF_KEY, voicePref); } catch (err) { /* private mode */ }
        voiceNoticeShown = false;
        updateVoiceLine();
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        if (voiceOn) speak(A.t('video.voice_test'));
      });
    }
    const test = q('btnVoiceTest');
    if (test) test.addEventListener('click', testVoice);
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderAll();
    bindVoicePicker();
    q('advBudget').addEventListener('input', renderAdvCalc);
    q('advDays').addEventListener('input', renderAdvCalc);
    q('llDevices').addEventListener('input', renderLlCalc);
    q('llOcc').addEventListener('input', renderLlCalc);
    q('dlScript').addEventListener('click', () => download('3dnakedeye-explainer-script.txt', scriptText()));
    q('dlShot').addEventListener('click', () => download('3dNakedEye-explainer-shotlist.txt', shotList()));
    q('dlBenefits').addEventListener('click', () => download('3dnakedeye-benefits.txt', benefitsText()));
    if ('speechSynthesis' in window) {
      const ss = window.speechSynthesis;
      window.speechSynthesis.getVoices();          /* Chromium populates lazily */
      /* Voice inventories arrive asynchronously; refresh whenever they land.
       * Guarded because minimal embedders expose only the speaking methods. */
      const refreshVoices = () => { renderVoicePicker(); paint(); };
      if (typeof ss.addEventListener === 'function') ss.addEventListener('voiceschanged', refreshVoices);
      if ('onvoiceschanged' in ss) ss.onvoiceschanged = refreshVoices;
    }
  });

  A.onLangChange(() => { renderAll(); });
})();
