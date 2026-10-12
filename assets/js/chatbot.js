/* ============================================================================
 * 3dNakedEye — chatbot.js
 * The instant-reply assistant.
 *
 * Design rules that matter:
 *   1. It always answers. Retrieval runs against the FAQ corpus in data.js, so
 *      replies are instant and work with no network and no API key.
 *   2. When the bundled server holds a DeepSeek key it *upgrades* the answer:
 *      the question plus the retrieved FAQ passages are sent to /api/chat and
 *      the model answers grounded in that text. If the call fails, the
 *      retrieval answer is already on screen.
 *   3. It never invents availability or prices. Anything numeric either comes
 *      from the live store (availability counts, day rates) or is handed to a
 *      person through the WhatsApp / enquiry / email hand-off.
 *   4. The transcript is kept in the store so a hand-off carries the context.
 *
 * API:  LG.chat.mount() · open() · close() · ask(text) · answer(text)
 * ==========================================================================*/
(function () {
  'use strict';

  const CFG = window.LG_CONFIG;
  const S = () => window.LG.store;
  const A = () => window.LG.app;
  const t = (k, v) => A().t(k, v);

  /* ---------- knowledge base ---------------------------------------------- */
  /* Extra intents map onto notification/answer keys rather than FAQ answers. */
  const EXTRA_ANSWER = {
    chat_hello: 'chat.hello',
    chat_help: 'chat.nav_help',
    chat_quote: 'chat.quote',
    chat_demo: 'chat.demo_offer',
    chat_visit: 'chat.demo_offer',
    chat_enquiry: 'chat.open_enquiry',
    chat_partner: 'chat.partner_offer',
    chat_human: 'chat.fallback'
  };
  const HANDOFF_INTENTS = { chat_human: 1, chat_enquiry: 1 };

  const CAT_OF = {};
  function corpus() {
    const out = [];
    (window.LG_FAQ || []).forEach(cat => {
      cat.items.forEach(it => {
        CAT_OF[it.id] = cat.id;
        out.push({ id: it.id, tags: it.tags || '', link: it.link || '', cat: cat.id });
      });
    });
    (window.LG_CHAT_EXTRA || []).forEach(it => {
      CAT_OF[it.id] = 'chat';
      out.push({ id: it.id, tags: it.tags || '', link: '', cat: 'chat' });
    });
    return out;
  }
  let KB = null;
  const kb = () => (KB = KB || corpus());

  /* Every question is indexed in all four locales, so a Thai question is
   * matched even when the interface is running in English. Tags are indexed
   * separately from the question wording and score higher, because the wording
   * of two questions often shares filler ("how much does it…"). */
  /* Index each item twice: a word set for Latin matching — word equality, not
   * substring, otherwise "30" would match the model name "P30S" — and the raw
   * string for CJK/Thai bigrams, which are not space separated. */
  const fold = w => (w.length > 3 && /s$/.test(w) ? w.slice(0, -1) : w);
  function words(str) {
    const out = new Set();
    String(str || '').toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .split(' ')
      .filter(w => w.length > 1)
      .forEach(w => { out.add(w); out.add(fold(w)); });
    return out;
  }
  function haystack(item) {
    const D = window.LG_I18N || {};
    const q = D['faq.' + item.id + '.q'];
    const x = EXTRA_ANSWER[item.id];
    const qParts = q ? [q.en, q.zhHant, q.zhHans, q.th] : (x && D[x] ? [D[x].en, D[x].zhHant, D[x].zhHans, D[x].th] : []);
    const tagStr = String([item.tags || '', item.id.replace(/_/g, ' ')].join(' ')).toLowerCase();
    const textStr = String(qParts.filter(Boolean).join(' ')).toLowerCase();
    return { tags: tagStr, text: textStr, tagWords: words(tagStr), textWords: words(textStr) };
  }
  const HAY = {};
  const hay = item => (HAY[item.id] = HAY[item.id] || haystack(item));

  const CJK = /[\u3000-\u9FFF\u0E00-\u0E7F]/;
  /* Words that appear in half the questions and therefore carry no signal. */
  const STOP = new Set(['the', 'and', 'for', 'you', 'your', 'with', 'how', 'what', 'why', 'when', 'does',
    'did', 'can', 'could', 'should', 'would', 'much', 'many', 'are', 'was', 'were', 'this', 'that', 'these',
    'those', 'from', 'into', 'about', 'there', 'their', 'they', 'them', 'its', 'it', 'is', 'do', 'my', 'our',
    'have', 'has', 'get', 'got', 'need', 'want', 'any', 'all', 'not', 'but', 'too', 'very', 'more', 'most']);
  function tokens(s) {
    return String(s || '').toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .split(' ')
      .filter(w => w.length > 1 && !STOP.has(w))
      .map(fold);
  }

  /* Score = tag match (weight 3) + question-wording match (weight 1), plus
   * bigram hits for Chinese and Thai. */
  function score(item, query, qTokens) {
    const h = hay(item);
    let s = 0;
    qTokens.forEach(tok => {
      const weight = tok.length > 4 ? 3 : 2;
      if (h.tagWords.has(tok)) s += weight * 1.5;
      else if (h.textWords.has(tok)) s += weight * 0.5;
    });
    if (CJK.test(query)) {
      const chars = query.split('').filter(c => CJK.test(c));
      for (let i = 0; i < chars.length - 1; i++) {
        const bi = chars[i] + chars[i + 1];
        if (h.tags.includes(bi)) s += 4;
        else if (h.text.includes(bi)) s += 2;
      }
    }
    return s;
  }

  function search(query) {
    const q = String(query || '').toLowerCase().trim();
    if (!q) return [];
    const qTokens = tokens(q);
    if (!qTokens.length && !CJK.test(q)) return [];
    return kb().map(item => ({ item, score: score(item, q, qTokens) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  function answerText(id) {
    if (EXTRA_ANSWER[id]) return t(EXTRA_ANSWER[id]);
    return t('faq.' + id + '.a');
  }
  function questionText(id) {
    return EXTRA_ANSWER[id] ? t(EXTRA_ANSWER[id]) : t('faq.' + id + '.q');
  }

  /* ---------- live answers (real data, never invented) -------------------- */
  const AVAIL_WORDS = /availab|free|vacan|book|occup|space|slot|ว่าง|จอง|可用|空置|已滿|已满|占用/i;
  function matchDistrict(q) {
    const s = String(q || '').toLowerCase();
    let best = null;
    (window.LG_DISTRICTS || []).forEach(d => {
      const names = [d.label && d.label.en, d.label && d.label.zhHant, d.label && d.label.zhHans, d.label && d.label.th, d.id]
        .filter(Boolean).map(x => String(x).toLowerCase());
      names.forEach(n => {
        const parts = n.split(/[\s/–-]+/).filter(w => w.length > 2);
        parts.forEach(p => { if (s.includes(p) && (!best || p.length > best.len)) best = { d, len: p.length }; });
      });
    });
    return best && best.d;
  }
  function liveAnswer(q) {
    if (!AVAIL_WORDS.test(q)) return null;
    const d = matchDistrict(q);
    if (!d) return null;
    const store = S();
    const live = store.liveLocationsIn ? store.liveLocationsIn(d.market) : [];
    const mine = live.filter(l => l.district === d.id);
    if (!mine.length) return { text: t('chat.live_none'), live: true };
    let free = 0, partial = 0, full = 0, rate = Infinity;
    mine.forEach(l => {
      const av = store.availability(l.id, null, 7);
      if (av && av.state === 'available') free++;
      else if (av && av.state === 'partial') partial++;
      else full++;
      const r = store.deviceDailyRate ? store.deviceDailyRate(l, (l.devices || []).map(x => x.type)) : 0;
      if (r) rate = Math.min(rate, r);
    });
    return {
      text: t('chat.live_avail', {
        district: A().L(d.label), total: mine.length, free, partial, full,
        rate: isFinite(rate) ? A().money(rate) : '—'
      }),
      live: true,
      link: 'marketplace.html?district=' + d.id
    };
  }

  /* ---------- widget ------------------------------------------------------ */
  const el = {};
  let open = false, busy = false, mode = 'kb';

  function markup() {
    return `
    <button class="chat-launch" type="button" id="chatLaunch" aria-expanded="false" aria-controls="chatPanel">
      <span class="chat-launch__dot"></span><span data-i18n="chat.launch">Ask 3dNakedEye</span>
    </button>
    <section class="chat-panel" id="chatPanel" role="dialog" aria-modal="false" aria-label="${A().esc(t('chat.title'))}" hidden>
      <header class="chat-head">
        <div>
          <strong>${A().esc(t('chat.title'))}</strong>
          <span class="chat-mode" id="chatMode">${A().esc(t('chat.mode_kb'))}</span>
        </div>
        <div class="chat-head__tools">
          <button type="button" class="chat-icon" id="chatClear" title="${A().esc(t('chat.clear'))}" aria-label="${A().esc(t('chat.clear'))}">↺</button>
          <button type="button" class="chat-icon" id="chatClose" title="${A().esc(t('chat.close'))}" aria-label="${A().esc(t('chat.close'))}">×</button>
        </div>
      </header>
      <p class="chat-sub">${A().esc(t('chat.sub'))}</p>
      <div class="chat-log" id="chatLog" aria-live="polite"></div>
      <div class="chat-quick" id="chatQuick"></div>
      <form class="chat-form" id="chatForm">
        <input type="text" id="chatInput" autocomplete="off" placeholder="${A().esc(t('chat.placeholder'))}"
               aria-label="${A().esc(t('chat.placeholder'))}">
        <button class="btn btn--primary btn--sm" type="submit">${A().esc(t('chat.send'))}</button>
      </form>
      <footer class="chat-foot">
        <span>${A().esc(t('chat.disclaimer'))}</span>
      </footer>
    </section>`;
  }

  function mount() {
    if (!CFG.chat || CFG.chat.enabled === false) return;
    if (document.getElementById('chatLaunch')) return;
    const host = document.createElement('div');
    host.className = 'chat-host';
    host.id = 'chatHost';
    host.innerHTML = markup();
    document.body.appendChild(host);

    el.host = host;
    el.launch = host.querySelector('#chatLaunch');
    el.panel = host.querySelector('#chatPanel');
    el.log = host.querySelector('#chatLog');
    el.form = host.querySelector('#chatForm');
    el.input = host.querySelector('#chatInput');
    el.quick = host.querySelector('#chatQuick');
    el.mode = host.querySelector('#chatMode');

    /* NOTE: never call a bare `close()` here — in a browser that identifier is
     * window.close(), which silently does nothing to this panel. */
    el.launch.addEventListener('click', () => (open ? closePanel() : openPanel()));
    host.querySelector('#chatClose').addEventListener('click', closePanel);
    host.querySelector('#chatClear').addEventListener('click', () => {
      S().clearChat();
      el.log.innerHTML = '';
      greet();
    });
    el.form.addEventListener('submit', e => {
      e.preventDefault();
      const q = el.input.value.trim();
      if (!q) return;
      el.input.value = '';
      api.ask(q);
    });
    renderQuick();
    greet();
    probeModel();
    openFromUrl();
  }

  /* Deep links: ?chat=1 (or #ask) opens the panel, ?q=… asks straight away.
   * Any page can link to "faq.html?chat=1&q=What%20is%20a%20hologram%20fan". */
  function openFromUrl() {
    const params = new URLSearchParams(location.search || '');
    const wants = params.get('chat') === '1' || location.hash === '#ask';
    if (!wants) return;
    api.open();
    const q = params.get('q');
    if (q) api.ask(q);
  }

  function greet() {
    pushBot(t('chat.greeting'), { id: null, from: 'bot' });
  }

  function renderQuick() {
    if (!el.quick) return;
    const ids = ['chat.quick_1', 'chat.quick_2', 'chat.quick_3', 'chat.quick_4', 'chat.quick_5', 'chat.quick_6'];
    el.quick.innerHTML = ids.map((k, i) =>
      `<button type="button" class="chip" data-q="${i}">${A().esc(t(k))}</button>`).join('');
    el.quick.querySelectorAll('[data-q]').forEach(b => b.addEventListener('click', () => {
      api.ask(t(ids[parseInt(b.getAttribute('data-q'), 10)]));
    }));
  }

  function bubble(text, from, opts) {
    const o = opts || {};
    const div = document.createElement('div');
    div.className = 'chat-msg chat-msg--' + from;
    const meta = o.live ? `<span class="pill pill--ok">${A().esc(t('chat.source'))} · live</span>`
      : (o.id ? `<span class="pill pill--muted">${A().esc(t('chat.source'))}</span>` : '');
    div.innerHTML = `<div class="chat-msg__body">${A().esc(text)}</div>
      <div class="chat-msg__meta">${meta}${o.link ? ` <a href="${A().esc(o.link)}">${A().esc(t('faq.link'))}</a>` : ''}</div>`;
    el.log.appendChild(div);
    el.log.scrollTop = el.log.scrollHeight;
    return div;
  }
  function pushYou(text) {
    S().addChat({ from: 'you', text });
    bubble(text, 'you');
  }
  function pushBot(text, opts) {
    const o = opts || {};
    if (o.remember !== false) S().addChat({ from: 'bot', text, id: o.id || null, live: !!o.live });
    const node = bubble(text, 'bot', o);
    if (o.related && o.related.length) {
      const wrap = document.createElement('div');
      wrap.className = 'chat-related';
      wrap.innerHTML = o.related.map(r => `<button type="button" class="chip" data-rel="${A().esc(r.id)}">${A().esc(questionText(r.id))}</button>`).join('');
      node.appendChild(wrap);
      wrap.querySelectorAll('[data-rel]').forEach(b => b.addEventListener('click', () => {
        const id = b.getAttribute('data-rel');
        pushYou(questionText(id));
        pushBot(answerText(id), { id, related: relatedFor(id) });
      }));
    }
    if (o.handoff) node.appendChild(handoffBar(o.topic));
    return node;
  }

  function relatedFor(id) {
    return search(questionText(id)).filter(x => x.item.id !== id).slice(0, 3).map(x => ({ id: x.item.id }));
  }

  function handoffBar(topic) {
    const c = A().contact();
    const wrap = document.createElement('div');
    wrap.className = 'chat-handoff';
    const last = S().chatLog().slice(-4);
    const ctx = last.map(m => (m.from === 'you' ? 'Visitor: ' : 'Assistant: ') + m.text).join('\n');
    wrap.innerHTML = `
      <a class="btn btn--primary btn--sm" target="_blank" rel="noopener"
         href="${A().waLink(A().t('chat.title') + ' — ' + (topic || '') + '\n' + ctx)}">${A().esc(t('chat.wa', { number: c.whatsappDisplay || '' }))}</a>
      <a class="btn btn--ghost btn--sm" href="${A().mailLink('3dNakedEye — ' + (topic || 'enquiry'), ctx)}">${A().esc(t('chat.email'))}</a>
      <a class="btn btn--ghost btn--sm" href="contact.html">${A().esc(t('chat.enquiry'))}</a>
      <a class="btn btn--quiet btn--sm" href="faq.html">${A().esc(t('chat.faq'))}</a>
      <button class="btn btn--quiet btn--sm" type="button" data-handoff="1">${A().esc(t('chat.handoff'))}</button>
      <p class="tiny muted">${A().esc(t('chat.handoff_note'))}</p>`;
    const btn = wrap.querySelector('[data-handoff]');
    btn.addEventListener('click', () => {
      S().handOff({ topic: topic || t('chat.launch'), question: topic || '', answer: '' });
      btn.disabled = true;
      btn.textContent = t('chat.handoff_done', { to: A().contact().email });
    });
    return wrap;
  }

  function typing(on) {
    let node = el.log.querySelector('.chat-typing');
    if (on) {
      if (node) return;
      node = document.createElement('div');
      node.className = 'chat-msg chat-msg--bot chat-typing';
      node.innerHTML = `<div class="chat-msg__body">${A().esc(t('chat.thinking'))}</div>`;
      el.log.appendChild(node);
      el.log.scrollTop = el.log.scrollHeight;
    } else if (node) node.remove();
  }

  /* ---------- answering --------------------------------------------------- */
  function localAnswer(q) {
    const live = liveAnswer(q);
    if (live) return live;
    const hits = search(q);
    if (!hits.length) return null;
    const top = hits[0].item;
    return {
      text: answerText(top.id),
      id: top.id,
      link: top.link,
      related: relatedFor(top.id),
      handoff: !!HANDOFF_INTENTS[top.id],
      topic: questionText(top.id)
    };
  }

  /* Ask the model when the server has a key; the retrieved passages are the
   * grounding context so the answer stays about this product. */
  function serverAnswer(q, grounding) {
    if (!CFG.chat || CFG.chat.useServer === false || typeof fetch !== 'function') return Promise.resolve(null);
    const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = setTimeout(() => { if (ctrl) ctrl.abort(); }, CFG.chat.timeoutMs || 7000);
    return fetch(CFG.chat.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: ctrl ? ctrl.signal : undefined,
      body: JSON.stringify({
        question: q,
        lang: A().lang,
        context: grounding.map(g => ({ q: questionText(g.id), a: answerText(g.id) }))
      })
    }).then(r => (r.ok ? r.json() : null))
      .then(res => {
        clearTimeout(timer);
        if (res && res.ok && res.answer) { mode = 'ai'; return res; }
        return null;
      })
      .catch(() => { clearTimeout(timer); return null; });
  }

  function ask(q) {
    if (busy) return;
    busy = true;
    pushYou(q);
    typing(true);
    const hits = search(q).slice(0, 3).map(x => x.item);
    serverAnswer(q, hits).then(res => {
      typing(false);
      busy = false;
      if (res) {
        if (el.mode) el.mode.textContent = t('chat.mode_ai');
        pushBot(res.answer, {
          id: hits[0] ? hits[0].id : null,
          link: res.link || (hits[0] && hits[0].link) || '',
          related: hits[0] ? relatedFor(hits[0].id) : []
        });
        return;
      }
      const local = localAnswer(q);
      if (local) {
        pushBot(local.text, { id: local.id, live: local.live, link: local.link, related: local.related, handoff: local.handoff, topic: local.topic });
      } else {
        pushBot(t('chat.fallback'), { handoff: true, topic: q, remember: true });
      }
    });
  }

  /* Probe once so the header can say whether the model is reachable. */
  function probeModel() {
    if (!CFG.chat || CFG.chat.useServer === false || typeof fetch !== 'function') {
      if (el.mode) el.mode.textContent = t('chat.mode_kb');
      return;
    }
    fetch(CFG.chat.endpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ probe: true, lang: A().lang })
    }).then(r => r.json())
      .then(res => {
        mode = res && res.ok && res.model ? 'ai' : 'kb';
        if (el.mode) el.mode.textContent = t(mode === 'ai' ? 'chat.mode_ai' : 'chat.mode_sim');
      })
      .catch(() => { if (el.mode) el.mode.textContent = t('chat.mode_sim'); });
  }

  /* ---------- open / close ------------------------------------------------ */
  /* These are the only two places that touch the panel's visibility, so the
   * × button, the launcher, Esc and the deep links all agree on the state. */
  function openPanel(opts) {
    if (!el.panel) return;
    open = true;
    el.panel.hidden = false;
    if (el.launch) el.launch.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('chat-open');
    if (!opts || opts.focus !== false) setTimeout(() => el.input && el.input.focus(), 30);
  }

  function closePanel() {
    if (!el.panel) return;
    open = false;
    el.panel.hidden = true;
    if (el.launch) {
      el.launch.setAttribute('aria-expanded', 'false');
      try { el.launch.focus({ preventScroll: true }); } catch (e) { /* older browsers */ }
    }
    document.documentElement.classList.remove('chat-open');
  }

  const api = {
    mount, ask, answer: localAnswer, search,
    open: openPanel,
    close: closePanel,
    isOpen: () => open,
    /* Used by other pages: open the panel with a question already sent. */
    askFrom(url) {
      openPanel();
      const q = new URLSearchParams(String(url || '').split('?')[1] || '').get('q');
      if (q) api.ask(q);
    },
    transcript: () => S().chatLog()
  };

  window.LG = window.LG || {};
  window.LG.chat = api;

  /* Esc closes the panel, and so does a click outside it — the two habits
   * people bring from every other chat widget. */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && open) closePanel();
  });
  document.addEventListener('click', e => {
    if (!open || !el.host) return;
    if (el.host.contains(e.target)) return;
    closePanel();
  });

  /* Re-render chrome text when the language changes; keep it open if it was. */
  document.addEventListener('lg:lang', () => {
    if (!el.host) return;
    const wasOpen = open;
    el.host.remove();
    el.host = null; el.log = null; el.panel = null; el.launch = null;
    mount();
    if (wasOpen) openPanel({ focus: false });
  });
})();
