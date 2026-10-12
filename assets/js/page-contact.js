/* ============================================================================
 * 3dNakedEye — page-contact.js
 * Enquiry form → validated in the browser → stored in the store → queued to
 * the commercialisation team (email rules) → optionally posted to the bundled
 * server, which writes an .eml and forwards to WhatsApp Cloud API.
 *
 * Every exit is honest: the WhatsApp button opens wa.me with the composed
 * message, the mail button opens the user's own client, and the success panel
 * shows exactly where the enquiry went.
 * ==========================================================================*/
(function () {
  'use strict';

  const S = window.LG.store;
  const A = () => window.LG.app;
  const t = (k, v) => A().t(k, v);
  const q = id => document.getElementById(id);

  const ROLES = window.LG_ENQUIRY_ROLES || ['advertiser', 'landlord', 'other'];
  const INTERESTS = window.LG_ENQUIRY_INTERESTS || [];
  const BUDGETS = window.LG_ENQUIRY_BUDGETS || [];
  const DEVICES = window.LG_ENQUIRY_DEVICES || [];
  const CHANNELS = window.LG_ENQUIRY_CHANNELS || ['whatsapp', 'email', 'any'];
  const TIMELINES = window.LG_ENQUIRY_TIMELINES || ['now', 'month', 'later'];

  /* Option lists use enq.<field>_<id> keys (enq.budget_10k_50k), not dots. */
  const opt = (prefix, id) => `<option value="${A().esc(id)}">${A().esc(t(prefix + '_' + id))}</option>`;

  const deviceLabel = id => {
    const d = (window.LG_DEVICES || {})[id];
    return d ? A().L(d.label) : A().esc(t('enq.device_' + id));
  };

  function renderForm() {
    const host = q('enqForm');
    if (!host) return;
    const me = S.session() || {};
    const c = A().contact();

    host.innerHTML = `
      <fieldset class="form-sec">
        <legend data-i18n="enq.sec_you">${A().esc(t('enq.sec_you'))}</legend>
        <div class="form-row--2 form-row">
          <div class="form-row"><label for="enqName" data-i18n="enq.name">${A().esc(t('enq.name'))}</label>
            <input type="text" id="enqName" value="${A().esc(me.name || '')}" placeholder="${A().esc(t('enq.name_ph'))}" autocomplete="name"></div>
          <div class="form-row"><label for="enqCompany" data-i18n="enq.company">${A().esc(t('enq.company'))}</label>
            <input type="text" id="enqCompany" value="${A().esc(me.company || '')}" placeholder="${A().esc(t('enq.company_ph'))}" autocomplete="organization"></div>
        </div>
        <div class="form-row--2 form-row">
          <div class="form-row"><label for="enqEmail" data-i18n="enq.email">${A().esc(t('enq.email'))}</label>
            <input type="email" id="enqEmail" value="${A().esc(me.email || '')}" placeholder="${A().esc(t('enq.email_ph'))}" autocomplete="email"></div>
          <div class="form-row"><label for="enqPhone" data-i18n="enq.phone">${A().esc(t('enq.phone'))}</label>
            <input type="tel" id="enqPhone" placeholder="${A().esc(t('enq.phone_ph'))}" autocomplete="tel"></div>
        </div>
        <div class="form-row--2 form-row">
          <div class="form-row"><label for="enqRole" data-i18n="enq.role">${A().esc(t('enq.role'))}</label>
            <select id="enqRole">${ROLES.map(r => `<option value="${r}"${(me.role === r || (!me.role && r === 'advertiser')) ? ' selected' : ''}>${A().esc(t('enq.role_' + r))}</option>`).join('')}</select></div>
          <div class="form-row"><label for="enqMarket" data-i18n="enq.market">${A().esc(t('enq.market'))}</label>
            <select id="enqMarket">
              <option value="hk">${A().esc(t('enq.market_hk'))}</option>
              <option value="th">${A().esc(t('enq.market_th'))}</option>
              <option value="both">${A().esc(t('enq.market_both'))}</option>
            </select></div>
        </div>
      </fieldset>

      <fieldset class="form-sec">
        <legend data-i18n="enq.sec_need">${A().esc(t('enq.sec_need'))}</legend>
        <div class="form-row">
          <span class="label" data-i18n="enq.interests">${A().esc(t('enq.interests'))}</span>
          <div class="check-grid" id="enqInterests">
            ${INTERESTS.map(i => `<label class="check"><input type="checkbox" value="${i}"> <span>${A().esc(t('enq.interest_' + i))}</span></label>`).join('')}
          </div>
        </div>
        <div class="form-row--3 form-row">
          <div class="form-row"><label for="enqDevice" data-i18n="enq.devices">${A().esc(t('enq.devices'))}</label>
            <select id="enqDevice">
              <option value="">—</option>
              ${DEVICES.map(d => `<option value="${d}">${A().esc(deviceLabel(d))}</option>`).join('')}
            </select></div>
          <div class="form-row"><label for="enqBudget" data-i18n="enq.budget">${A().esc(t('enq.budget'))}</label>
            <select id="enqBudget"><option value="">—</option>${BUDGETS.map(b => opt('enq.budget', b)).join('')}</select></div>
          <div class="form-row"><label for="enqTimeline" data-i18n="enq.timeline">${A().esc(t('enq.timeline'))}</label>
            <select id="enqTimeline"><option value="">—</option>${TIMELINES.map(x => opt('enq.timeline', x)).join('')}</select></div>
        </div>
        <div class="form-row"><label for="enqMessage" data-i18n="enq.message">${A().esc(t('enq.message'))}</label>
          <textarea id="enqMessage" rows="5" placeholder="${A().esc(t('enq.message_ph'))}"></textarea></div>
      </fieldset>

      <fieldset class="form-sec">
        <legend data-i18n="enq.sec_send">${A().esc(t('enq.sec_send'))}</legend>
        <div class="form-row"><label for="enqChannel" data-i18n="enq.channel">${A().esc(t('enq.channel'))}</label>
          <select id="enqChannel">${CHANNELS.map(x => opt('enq.channel', x)).join('')}</select></div>
        <label class="check"><input type="checkbox" id="enqConsent"> <span>${A().esc(t('enq.consent'))}</span></label>
        <p class="note" id="enqErrors" hidden></p>
        <div class="row row--wrap">
          <button class="btn btn--primary" type="button" id="enqSubmit">${A().esc(t('enq.submit'))}</button>
          <button class="btn btn--ghost" type="button" id="enqWhatsApp">${A().esc(t('enq.send_whatsapp'))}</button>
          <a class="btn btn--ghost" id="enqMail" href="#">${A().esc(t('enq.email_draft'))}</a>
          <button class="btn btn--quiet" type="button" id="enqCopy">${A().esc(t('enq.copy'))}</button>
          <button class="btn btn--quiet" type="button" id="enqTxt">${A().esc(t('enq.download'))}</button>
          <button class="btn btn--quiet" type="button" id="enqAsk">${A().esc(t('enq.ask_ai'))}</button>
          <button class="btn btn--quiet" type="button" id="enqReset">${A().esc(t('enq.reset'))}</button>
        </div>
        <p class="tiny muted">${A().esc(t('enq.stored_note', { to: c.email || '' }))}</p>
      </fieldset>`;

    q('enqSubmit').addEventListener('click', () => submit(false));
    q('enqWhatsApp').addEventListener('click', () => submit(true));
    q('enqCopy').addEventListener('click', () => {
      const data = collect();
      if (!data) return;
      copy(summaryText(data));
    });
    q('enqTxt').addEventListener('click', () => {
      const data = collect();
      if (!data) return;
      download('3dnakedeye-enquiry.txt', summaryText(data));
    });
    q('enqAsk').addEventListener('click', () => {
      const chat = window.LG.chat;
      const msg = q('enqMessage').value.trim();
      if (chat) { chat.open(); chat.ask(msg || t('enq.form_title')); }
    });
    q('enqReset').addEventListener('click', () => { renderForm(); refreshPreview(); });
    ['enqName', 'enqCompany', 'enqEmail', 'enqPhone', 'enqMessage'].forEach(id => {
      const el = q(id);
      if (el) el.addEventListener('input', refreshPreview);
    });
    document.querySelectorAll('#enqInterests input').forEach(cb => cb.addEventListener('change', refreshPreview));
    ['enqRole', 'enqMarket', 'enqDevice', 'enqBudget', 'enqTimeline', 'enqChannel'].forEach(id => {
      const el = q(id);
      if (el) el.addEventListener('change', refreshPreview);
    });
    applyUrlPreset();
    refreshPreview();
  }

  /* Deep links into the form: ?interest=a,b pre-selects interests, and any
   * known value in ?device / ?market is honoured too. */
  function applyUrlPreset() {
    const params = new URLSearchParams(location.search || '');
    const wants = (params.get('interest') || '').split(',').map(s => s.trim()).filter(Boolean);
    const device = params.get('device');
    if (device) {
      const dev = q('enqDevice');
      if (dev && Array.from(dev.options).some(o => o.value === device)) dev.value = device;
    }
    if (!wants.length) return;
    wants.forEach(w => {
      const cb = document.querySelector('#enqInterests input[value="' + w + '"]');
      if (cb) cb.checked = true;
    });
    A().toast(t('enq.interest_' + wants[0]), 'info');
  }

  /* --- data ---------------------------------------------------------------- */
  function collect() {
    const interests = Array.from(document.querySelectorAll('#enqInterests input:checked')).map(c => c.value);
    return {
      name: (q('enqName').value || '').trim(),
      company: (q('enqCompany').value || '').trim(),
      email: (q('enqEmail').value || '').trim(),
      phone: (q('enqPhone').value || '').trim(),
      role: q('enqRole').value,
      market: q('enqMarket').value,
      interests,
      device: q('enqDevice').value,
      budget: q('enqBudget').value,
      timeline: q('enqTimeline').value,
      channel: q('enqChannel').value,
      message: (q('enqMessage').value || '').trim(),
      consent: q('enqConsent').checked,
      lang: A().lang,
      when: new Date().toISOString(),
      ref: ''
    };
  }

  function validate(d) {
    const errs = [];
    if (!d.name) errs.push('enq.err_name');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) errs.push('enq.err_email');
    if (!d.interests.length) errs.push('enq.err_interest');
    if (d.message.length < 10) errs.push('enq.err_message');
    if (!d.consent) errs.push('enq.err_consent');
    return errs;
  }

  function showErrors(errs) {
    const box = q('enqErrors');
    if (!box) return;
    if (!errs.length) { box.hidden = true; box.innerHTML = ''; return; }
    box.hidden = false;
    box.className = 'note note--warn';
    box.innerHTML = `<strong>${A().esc(t('enq.err_fix'))}</strong><ul>${errs.map(e => `<li>${A().esc(t(e))}</li>`).join('')}</ul>`;
  }

  const humanInterests = d => d.interests.map(i => t('enq.interest_' + i)).join(', ');
  const humanList = d => [
    t('enq.name') + ': ' + d.name,
    t('enq.company') + ': ' + (d.company || '—'),
    t('enq.email') + ': ' + d.email,
    t('enq.phone') + ': ' + (d.phone || '—'),
    t('enq.role') + ': ' + t('enq.role_' + d.role),
    t('enq.market') + ': ' + t('enq.market_' + d.market),
    t('enq.interests') + ': ' + humanInterests(d),
    t('enq.devices') + ': ' + (d.device ? deviceLabel(d.device) : '—'),
    t('enq.budget') + ': ' + (d.budget ? t('enq.budget_' + d.budget) : '—'),
    t('enq.timeline') + ': ' + (d.timeline ? t('enq.timeline_' + d.timeline) : '—'),
    t('enq.channel') + ': ' + t('enq.channel_' + d.channel),
    d.ref ? t('enq.ref') + ': ' + d.ref : ''
  ].filter(Boolean).join('\n');

  const summaryText = d => [
    '3dNakedEye — ' + t('enq.form_title'),
    d.ref ? (t('enq.ref') + ': ' + d.ref) : '',
    new Date().toLocaleString(),
    '',
    humanList(d),
    '',
    t('enq.message') + ':',
    d.message,
    '',
    'WhatsApp: ' + (A().contact().whatsappDisplay || ''),
    'Email: ' + (A().contact().email || '')
  ].filter(x => x !== '').join('\n');

  function refreshPreview() {
    const d = collect();
    const mail = q('enqMail');
    if (mail) mail.href = A().mailLink('3dNakedEye — ' + t('enq.form_title') + (d.name ? ' — ' + d.name : ''), summaryText(d));
    const wa = q('enqWhatsApp');
    if (wa) wa.dataset.ready = '1';
  }

  /* --- submit -------------------------------------------------------------- */
  function submit(viaWhatsApp) {
    const d = collect();
    const errs = validate(d);
    showErrors(errs);
    const chat = window.LG.chat;
    if (errs.length) {
      A().toast(t('enq.err_fix'), 'warn');
      if (chat) { /* leave the form as the source of truth */ }
      return;
    }
    const rec = S.addEnquiry(d);
    d.ref = rec.ref;
    refreshPreview();

    if (viaWhatsApp) {
      window.open(A().waLink(summaryText(d)), '_blank', 'noopener');
      S.markEnquirySent(rec.id, 'whatsapp');
    } else {
      /* Queue to the server when it is running; the local record already
       * exists either way, and the notification rules fired in addEnquiry. */
      postToServer(d, rec);
    }
    renderSuccess(rec, viaWhatsApp);
    A().toast(viaWhatsApp ? t('enq.sent_ok') : t('enq.success_title'), 'ok');
  }

  function postToServer(d, rec) {
    if (typeof fetch !== 'function') return;
    const endpoint = (window.LG_CONFIG.server && window.LG_CONFIG.server.enquiryUrl) || '/api/enquiry';
    fetch(endpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({}, d, { ref: rec.ref, notificationIds: rec.messages || [] }))
    }).then(r => (r.ok ? r.json() : null))
      .then(res => {
        if (res && res.ok) {
          S.markEnquirySent(rec.id, res.emailed === 'smtp' ? 'sent' : 'queued');
          const badge = q('enqServerState');
          if (badge) badge.textContent = res.note || '';
        }
      })
      .catch(() => { /* the browser record and the email queue already exist */ });
  }

  function renderSuccess(rec, viaWhatsApp) {
    const host = q('enqSuccess');
    if (!host) return;
    host.hidden = false;
    host.innerHTML = `
      <div class="card card--ok">
        <div class="row" style="justify-content:space-between;align-items:flex-start">
          <div>
            <h3>${A().esc(t('enq.success_title'))}</h3>
            <p>${A().esc(t('enq.success_lede', { ref: rec.ref }))}</p>
            <p class="tiny muted" id="enqServerState">${A().esc(t('enq.stored_note', { to: A().contact().email || '' }))}</p>
          </div>
          <span class="pill pill--ok">${A().esc(rec.ref)}</span>
        </div>
        <ol class="steps">
          <li>${A().esc(t('enq.next_1'))}</li>
          <li>${A().esc(t('enq.next_2'))}</li>
          <li>${A().esc(t('enq.next_3'))}</li>
        </ol>
        <div class="row row--wrap">
          <a class="btn btn--primary btn--sm" target="_blank" rel="noopener" href="${A().waLink(summaryText(collect()))}">${A().esc(t('faq.whatsapp'))} · ${A().esc(A().contact().whatsappDisplay || '')}</a>
          <a class="btn btn--ghost btn--sm" href="${A().mailLink('3dNakedEye — ' + rec.ref, summaryText(collect()))}">${A().esc(t('enq.email_draft'))}</a>
          <button class="btn btn--quiet btn--sm" type="button" id="enqAgain">${A().esc(t('enq.again'))}</button>
          <a class="btn btn--quiet btn--sm" href="faq.html">${A().esc(t('enq.faq_link'))}</a>
          ${viaWhatsApp ? '' : `<span class="pill pill--info">${A().esc(t('enq.sent_ok'))}</span>`}
        </div>
      </div>`;
    const again = q('enqAgain');
    if (again) again.addEventListener('click', () => {
      host.hidden = true;
      renderForm();
      window.scrollTo({ top: (q('enqForm') || {}).offsetTop || 0, behavior: 'smooth' });
    });
    host.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* --- channels card ------------------------------------------------------- */
  function renderChannels() {
    const c = A().contact();
    const wa = q('ctWa');
    if (wa) wa.href = A().waLink(t('contact.title'));
    const num = q('ctNumber');
    if (num) num.textContent = c.whatsappDisplay || '';

    /* LINE: real add-friend link plus a copy button. */
    const lineUrl = c.lineUrl || A().lineLink(c.line);
    const lineId = q('ctLineId');
    if (lineId) lineId.textContent = c.line || '';
    const lineLink = q('ctLine');
    if (lineLink) lineLink.href = lineUrl;
    const lineOpen = q('ctLineOpen');
    if (lineOpen) lineOpen.href = lineUrl;
    const lineCopy = q('ctLineCopy');
    if (lineCopy && !lineCopy.dataset.bound) {
      lineCopy.dataset.bound = '1';
      lineCopy.addEventListener('click', () => A().copyText(c.line || ''));
    }

    /* WeChat: no public link exists, so the ID is copied. */
    const wx = q('ctWechatId');
    if (wx) wx.textContent = c.wechatId || '';
    const wxCopy = q('ctWechatCopy');
    if (wxCopy && !wxCopy.dataset.bound) {
      wxCopy.dataset.bound = '1';
      wxCopy.addEventListener('click', () => A().copyText(c.wechatId || ''));
    }

    const mail = q('ctEmail');
    if (mail) { mail.href = A().mailLink(); mail.textContent = c.email || ''; }
    const hours = q('ctHours');
    if (hours) hours.textContent = c.hours || '';
    const sla = q('ctSla');
    if (sla) sla.textContent = c.responseSla || '';
    const langs = q('ctLangs');
    if (langs) langs.textContent = (c.languages || []).join(' · ');
    /* WhatsApp Cloud API state */
    const api = q('ctApiState');
    if (api && typeof fetch === 'function') {
      const base = (window.LG_CONFIG.server && window.LG_CONFIG.server.base) || '';
      const health = (window.LG_CONFIG.server && window.LG_CONFIG.server.healthUrl) || (base + '/api/health');
      fetch(health)
        .then(r => (r.ok ? r.json() : null))
        .then(res => {
          const v = (c.whatsappApi && c.whatsappApi.version) || 'v21.0';
          if (res && res.whatsapp && res.whatsapp !== 'simulated') {
            api.textContent = t('contact.api_on', { v });
            api.className = 'pill pill--ok';
          } else {
            api.textContent = t('contact.api_sim', { v });
            api.className = 'pill pill--warn';
          }
        })
        .catch(() => {
          const v = (c.whatsappApi && c.whatsappApi.version) || 'v21.0';
          api.textContent = t('contact.api_sim', { v });
          api.className = 'pill pill--warn';
        });
    }
  }

  function renderRecent() {
    const host = q('enqRecent');
    if (!host) return;
    const rows = S.enquiries();
    if (!rows.length) { host.innerHTML = `<p class="tiny muted">${A().esc(t('enq.recent_none'))}</p>`; return; }
    host.innerHTML = `<div class="table-wrap"><table class="data data--compact">
      <thead><tr><th>${A().esc(t('enq.ref'))}</th><th>${A().esc(t('enq.name'))}</th>
        <th>${A().esc(t('enq.interests'))}</th><th>${A().esc(t('enq.timeline'))}</th><th>${A().esc(t('auto.status'))}</th></tr></thead>
      <tbody>${rows.slice(0, 8).map(r => `<tr>
        <td><code>${A().esc(r.ref)}</code></td>
        <td>${A().esc(r.name)}<div class="tiny muted">${A().esc(r.company || '')}</div></td>
        <td class="tiny">${A().esc(r.interests.map(i => t('enq.interest_' + i)).join(', '))}</td>
        <td class="tiny">${A().esc(r.timeline ? t('enq.timeline_' + r.timeline) : '—')}</td>
        <td><span class="pill pill--muted">${A().esc(r.status)}</span></td></tr>`).join('')}</tbody></table></div>`;
  }

  function download(name, text) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 400);
  }

  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => A().toast(t('enq.copied'), 'ok'))
        .catch(() => A().toast(t('enq.copied'), 'warn'));
    } else { A().toast(t('enq.copied'), 'warn'); }
  }

  function renderAll() {
    if (!q('enqForm')) return;
    renderForm();
    renderChannels();
    renderRecent();
  }

  document.addEventListener('DOMContentLoaded', renderAll);
  A().onLangChange(renderAll);
  /* a signed-in visitor gets their details filled from the account */
  document.addEventListener('lg:auth', renderAll);
})();
