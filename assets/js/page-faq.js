/* ============================================================================
 * 3dNakedEye — page-faq.js
 * The FAQ page: five groups of questions from the LG_FAQ corpus, instant
 * search across every language, deep links (#faq-holo_what), expand/collapse
 * and the hand-off strip to the assistant, WhatsApp and the enquiry form.
 *
 * The corpus is shared with the assistant (chatbot.js), so the page and the
 * bot can never drift apart.
 * ==========================================================================*/
(function () {
  'use strict';

  const S = window.LG.store;
  const A = () => window.LG.app;
  const t = (k, v) => A().t(k, v);
  const q = id => document.getElementById(id);

  let filter = 'all';
  let query = '';

  const items = () => (window.LG_FAQ || []).reduce((acc, cat) =>
    acc.concat(cat.items.map(it => Object.assign({ cat: cat.id }, it))), []);

  const text = it => (t('faq.' + it.id + '.q') + ' ' + t('faq.' + it.id + '.a') + ' ' + (it.tags || '')).toLowerCase();

  function visible() {
    const all = items();
    if (query) {
      const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
      return all.filter(it => {
        const hay = text(it);
        return terms.every(term => hay.includes(term));
      });
    }
    return filter === 'all' ? all : all.filter(it => it.cat === filter);
  }

  function catLabel(id) { return t('faq.cat_' + id); }

  function renderGroups() {
    const host = q('faqGroups');
    if (!host) return;
    const rows = visible();
    const cats = (window.LG_FAQ || []).filter(c => filter === 'all' || c.id === filter);

    q('faqCount').textContent = t('faq.count', { n: A().num(rows.length) });

    if (!rows.length) {
      host.innerHTML = `<div class="card empty">
        <p>${A().esc(t('faq.no_results'))}</p>
        <div class="row" style="margin-top:12px">
          <button class="btn btn--ghost btn--sm" type="button" id="faqClearEmpty">${A().esc(t('faq.clear'))}</button>
          <button class="btn btn--primary btn--sm" type="button" id="faqAskEmpty">${A().esc(t('faq.ask_ai'))}</button>
        </div></div>`;
      bindEmpty();
      return;
    }

    host.innerHTML = cats.map(cat => {
      const mine = rows.filter(r => r.cat === cat.id);
      if (!mine.length) return '';
      return `<section class="faq-group" id="faq-${cat.id}">
        <div class="faq-group__head">
          <span class="faq-group__icon" aria-hidden="true">${cat.icon || '•'}</span>
          <h2>${A().esc(catLabel(cat.id))}</h2>
          <span class="pill pill--muted">${A().esc(t('faq.count', { n: A().num(mine.length) }))}</span>
        </div>
        <div class="faq-list">
          ${mine.map(it => `
            <details class="faq-item" id="faq-${it.id}"${query ? ' open' : ''}>
              <summary>
                <span class="faq-item__q">${A().esc(t('faq.' + it.id + '.q'))}</span>
                <span class="faq-item__chev" aria-hidden="true">▾</span>
              </summary>
              <div class="faq-item__a">
                <p>${A().esc(t('faq.' + it.id + '.a'))}</p>
                <div class="faq-item__links">
                  ${it.link ? `<a class="btn btn--quiet btn--sm" href="${A().esc(it.link)}">${A().esc(t('faq.link'))}</a>` : ''}
                  <button class="btn btn--quiet btn--sm" type="button" data-ask="${A().esc(t('faq.' + it.id + '.q'))}">${A().esc(t('faq.ask_ai'))}</button>
                  <button class="btn btn--quiet btn--sm" type="button" data-copy="${A().esc(it.id)}">${A().esc(t('enq.copy'))}</button>
                </div>
              </div>
            </details>`).join('')}
        </div>
      </section>`;
    }).join('');

    host.querySelectorAll('[data-ask]').forEach(b => b.addEventListener('click', () => {
      const chat = window.LG.chat;
      if (chat) { chat.open(); chat.ask(b.getAttribute('data-ask')); }
    }));
    host.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', () => {
      const id = b.getAttribute('data-copy');
      const textOut = t('faq.' + id + '.q') + '\n\n' + t('faq.' + id + '.a');
      copy(textOut);
    }));
  }

  function bindEmpty() {
    const c = q('faqClearEmpty');
    if (c) c.addEventListener('click', () => { query = ''; if (q('faqSearch')) q('faqSearch').value = ''; renderGroups(); });
    const a = q('faqAskEmpty');
    if (a) a.addEventListener('click', () => { const chat = window.LG.chat; if (chat) chat.open(); });
  }

  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => A().toast(t('enq.copied'), 'ok')).catch(() => A().toast(text.slice(0, 80), 'info'));
    } else { A().toast(text.slice(0, 80), 'info'); }
  }

  function renderTabs() {
    const host = q('faqTabs');
    if (!host) return;
    const cats = [{ id: 'all', icon: '≡' }].concat(window.LG_FAQ || []);
    host.innerHTML = cats.map(c =>
      `<button type="button" data-cat="${c.id}" class="${filter === c.id ? 'is-active' : ''}">
        <span aria-hidden="true">${c.icon || '≡'}</span> ${A().esc(c.id === 'all' ? t('faq.all') : catLabel(c.id))}
      </button>`).join('');
    host.querySelectorAll('[data-cat]').forEach(b => b.addEventListener('click', () => {
      filter = b.getAttribute('data-cat');
      query = '';
      if (q('faqSearch')) q('faqSearch').value = '';
      renderTabs(); renderGroups();
    }));
  }

  function renderHandoff() {
    const c = A().contact();
    const wa = q('faqWhats');
    if (wa) wa.href = A().waLink(t('faq.title'));
    const em = q('faqEmail');
    if (em) em.href = A().mailLink(t('faq.title'));
    const num = q('faqWaNumber');
    if (num) num.textContent = c.whatsappDisplay || '';
    const hours = q('faqHours');
    if (hours) hours.textContent = c.hours || '';
  }

  function renderSource() {
    const host = q('faqSource');
    if (!host) return;
    const n = items().length;
    host.innerHTML = `<span class="pill pill--muted">${A().esc(t('docs.front_a1_v', { n: A().num(n) }))}</span>
      <span>${A().esc(t('faq.source_note'))}</span>`;
  }

  function bind() {
    const search = q('faqSearch');
    if (search) {
      let timer = null;
      search.addEventListener('input', e => {
        clearTimeout(timer);
        const v = e.target.value.trim();
        timer = setTimeout(() => { query = v; renderGroups(); }, 140);
      });
    }
    const expand = q('faqExpand');
    if (expand) expand.addEventListener('click', () => {
      document.querySelectorAll('.faq-item').forEach(d => { d.open = true; });
    });
    const collapse = q('faqCollapse');
    if (collapse) collapse.addEventListener('click', () => {
      document.querySelectorAll('.faq-item').forEach(d => { d.open = false; });
    });
    const print = q('faqPrint');
    if (print) print.addEventListener('click', () => window.print());
    const ask = q('faqAsk');
    if (ask) ask.addEventListener('click', () => { const chat = window.LG.chat; if (chat) chat.open(); });
    /* direct link from another page: faq.html#faq-svc_pricing opens that item */
    if (location.hash) {
      const target = document.querySelector(location.hash);
      if (target && target.tagName === 'DETAILS') target.open = true;
    }
  }

  function renderAll() {
    const host = q('faqGroups');
    if (!host) return;
    renderTabs(); renderGroups(); renderHandoff(); renderSource();
  }

  document.addEventListener('DOMContentLoaded', () => { renderAll(); bind(); });
  A().onLangChange(renderAll);
})();
