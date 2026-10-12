/* ============================================================================
 * 3dNakedEye — notify.js
 * Email automation engine.
 *
 *   LG.notify.fire(trigger, payload)   queue messages for every enabled rule
 *   LG.notify.outbox()                 queued/sent messages
 *   LG.notify.rules()                  automation rules
 *   LG.notify.template(id, lang)       rendered subject + body
 *   LG.notify.eml(entry)               raw MIME message for download
 *   LG.notify.runDigest('daily'|'weekly')
 *
 * Delivery: always written to the in-app outbox; additionally POSTed to the
 * server when LG_CONFIG.notify.useServer is true (SMTP if configured, else an
 * .eml file on disk). Nothing here throws into the calling flow.
 * ==========================================================================*/
(function () {
  'use strict';
  const CFG = window.LG_CONFIG;
  const S = window.LG.store;
  const A = () => window.LG.app;

  /* ---------- rules ------------------------------------------------------ */
  const RULES = [
    { id: 'booking_created', trigger: 'booking.created', audience: 'both', timing: 'instant', enabled: true },
    { id: 'approval_requested', trigger: 'approval.requested', audience: 'landlord', timing: 'instant', enabled: true },
    { id: 'campaign_approved', trigger: 'campaign.approved', audience: 'advertiser', timing: 'instant', enabled: true },
    { id: 'campaign_rejected', trigger: 'campaign.rejected', audience: 'advertiser', timing: 'instant', enabled: true },
    { id: 'payment_received', trigger: 'payment.received', audience: 'advertiser', timing: 'instant', enabled: true },
    { id: 'campaign_live', trigger: 'campaign.live', audience: 'both', timing: 'instant', enabled: true },
    { id: 'campaign_ending', trigger: 'campaign.ending', audience: 'advertiser', timing: 'daily', enabled: true },
    { id: 'weekly_report', trigger: 'report.weekly', audience: 'advertiser', timing: 'weekly', enabled: true },
    { id: 'statement_ready', trigger: 'statement.ready', audience: 'landlord', timing: 'daily', enabled: true },
    { id: 'device_offline', trigger: 'device.offline', audience: 'both', timing: 'instant', enabled: true },
    { id: 'occupancy_low', trigger: 'occupancy.low', audience: 'landlord', timing: 'weekly', enabled: false },
    { id: 'plan_summary', trigger: 'plan.summary', audience: 'advertiser', timing: 'instant', enabled: true },
    /* front-of-site: enquiries, membership and the assistant */
    { id: 'enquiry_received', trigger: 'enquiry.received', audience: 'sales', timing: 'instant', enabled: true },
    { id: 'enquiry_ack', trigger: 'enquiry.received', audience: 'enquirer', timing: 'instant', enabled: true },
    { id: 'membership_welcome', trigger: 'membership.joined', audience: 'advertiser', timing: 'instant', enabled: true },
    { id: 'chat_handoff', trigger: 'chat.handoff', audience: 'sales', timing: 'instant', enabled: true }
  ];
  /* The twelve triggers, in the order the automation page lists them. */
  const TRIGGERS = RULES.map(r => r.trigger).concat(['payment.received']).filter((v, i, a) => a.indexOf(v) === i);

  /* ---------- state ------------------------------------------------------ */
  const outbox = () => (S.state.notifications = S.state.notifications || []);
  const ruleState = id => {
    S.state.notifyRules = S.state.notifyRules || {};
    return S.state.notifyRules[id];
  };
  const rules = () => RULES.map(r => {
    const st = ruleState(r.id) || {};
    return Object.assign({}, r, { enabled: st.enabled === undefined ? r.enabled : !!st.enabled, lastRun: st.lastRun || null });
  });
  const setRule = (id, patch) => {
    S.state.notifyRules = S.state.notifyRules || {};
    S.state.notifyRules[id] = Object.assign({ enabled: true }, S.state.notifyRules[id] || {}, patch);
    S.save();
  };

  /* ---------- settings --------------------------------------------------- */
  const settings = () => {
    S.state.notifySettings = Object.assign({
      fromName: CFG.notify.fromName, replyTo: CFG.notify.replyTo,
      advertiserOptIn: true, landlordOptIn: true, digest: 'weekly'
    }, S.state.notifySettings || {});
    return S.state.notifySettings;
  };
  const saveSettings = patch => { S.state.notifySettings = Object.assign(settings(), patch); S.save(); };

  /* ---------- templating ------------------------------------------------- */
  const fill = (str, vars) => {
    let out = String(str == null ? '' : str);
    Object.keys(vars || {}).forEach(k => { out = out.split('{' + k + '}').join(vars[k] == null ? '' : String(vars[k])); });
    return out.replace(/\{[a-zA-Z_]+\}/g, '—');
  };

  /* Returns the RAW template for a rule: placeholders stay intact so the
   * caller (or the template browser) can see what the message needs. The
   * values are substituted in fire() once the payload is known — filling here
   * would blank every {token} before it ever saw the data. */
  function template(id, lang) {
    const L = lang || (A() && A().lang) || 'en';
    const field = { en: 'en', 'zh-HK': 'zhHant', 'zh-CN': 'zhHans', th: 'th' }[L] || 'en';
    const raw = key => {
      const entry = (window.LG_I18N || {})[key];
      if (!entry) return key;
      return entry[field] || entry.en || '';
    };
    return {
      id,
      subject: raw('email.' + id + '.subject'),
      body: raw('email.' + id + '.body')
    };
  }

  /* ---------- email rendering ------------------------------------------- */
  function html(entry) {
    const rows = (entry.facts || []).map(f =>
      `<tr><td style="padding:6px 12px;color:#7288a5;font-size:12px">${esc(f[0])}</td>
        <td style="padding:6px 12px;color:#0b1a2c;font-size:13px;font-weight:600">${esc(f[1])}</td></tr>`).join('');
    return `<!DOCTYPE html><html><body style="margin:0;background:#f4f6fb;font-family:Inter,Segoe UI,Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto;background:#ffffff">
    <div style="background:#050b16;padding:20px 24px">
      <span style="color:#35d0ff;font-size:16px;font-weight:800;letter-spacing:-.02em">${esc(CFG.brand.name)}</span>
      <span style="color:#7288a5;font-size:11px;letter-spacing:.16em;text-transform:uppercase;margin-left:10px">${esc(CFG.brand.product)}</span>
    </div>
    <div style="padding:24px">
      <h1 style="font-size:18px;color:#0b1a2c;margin:0 0 14px">${esc(entry.subject)}</h1>
      <p style="font-size:14px;color:#33475b;line-height:1.6;margin:0 0 16px">${esc(entry.body)}</p>
      ${rows ? `<table style="border-collapse:collapse;background:#f7f9fd;border-radius:8px;width:100%">${rows}</table>` : ''}
      <p style="font-size:12px;color:#7288a5;margin:20px 0 0">
        ${esc(entry.footer || '')}<br>${esc(settings().fromName)} · ${esc(CFG.brand.email)}
      </p>
    </div>
    <div style="padding:14px 24px;background:#eef2f8;color:#7288a5;font-size:11px">
      ${esc(CFG.brand.legalName)} · ${esc(CFG.brand.address)} · ${esc(CFG.brand.br)}
    </div>
  </div></body></html>`;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  /* RFC-822-ish message you can open in a mail client. */
  function eml(entry) {
    const boundary = '3dNakedEye-' + entry.id;
    const lines = [
      `From: ${settings().fromName} <${CFG.brand.email}>`,
      `Reply-To: ${settings().replyTo}`,
      `To: ${entry.toName ? entry.toName + ' <' + entry.to + '>' : entry.to}`,
      `Subject: ${entry.subject}`,
      `Date: ${new Date(entry.when).toUTCString()}`,
      `Message-ID: <${entry.id}@3dnakedeye.example>`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      entry.body,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=utf-8',
      '',
      html(entry),
      '',
      `--${boundary}--`
    ];
    return lines.join('\r\n');
  }

  /* ---------- recipient resolution -------------------------------------- */
  function langFor(role, marketId) {
    const prefs = (S.state.notifySettings || {}).langPrefs || {};
    if (prefs[role]) return prefs[role];
    const map = CFG.notify.defaultLangByMarket || {};
    return map[marketId] || CFG.defaultLocale;
  }

  /* ---------- fire ------------------------------------------------------- */
  function fire(trigger, payload) {
    try {
      if (!CFG.notify.enabled) return [];
      const p = payload || {};
      const matched = rules().filter(r => r.enabled && r.trigger === trigger);
      const sent = [];
      matched.forEach(rule => {
        const recipients = recipientsFor(rule, p);
        recipients.forEach(rc => {
          if (rc.role === 'advertiser' && !settings().advertiserOptIn) return;
          if (rc.role === 'landlord' && !settings().landlordOptIn) return;
          const lang = rc.lang || langFor(rc.role, p.market);
          const tpl = template(rule.id, lang);
          const entry = {
            id: 'MSG-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
            ruleId: rule.id, trigger, to: rc.email, toName: rc.name, role: rc.role, lang,
            subject: fill(tpl.subject, p.vars || {}),
            body: fill(tpl.body, p.vars || {}),
            footer: p.footer || '',
            facts: p.facts || [],
            when: new Date().toISOString(), status: 'queued'
          };
          outbox().unshift(entry);
          sent.push(entry);
        });
        setRule(rule.id, { lastRun: new Date().toISOString() });
      });
      if (sent.length) {
        S.save();
        deliver(sent);
      }
      return sent;
    } catch (e) {
      console.error('notify.fire failed', e);
      return [];
    }
  }

  function recipientsFor(rule, p) {
    const out = [];
    const adv = p.advertiser || {};
    const ll = p.landlord || {};
    const op = p.operator || {};
    const sp = p.sales || {};
    const en = p.enquirer || {};
    const push = (role, name, email, lang) => { if (email) out.push({ role, name: name || role, email, lang }); };
    if (rule.audience === 'advertiser' || rule.audience === 'both') push('advertiser', adv.name, adv.email || 'advertiser@example.com');
    if (rule.audience === 'landlord' || rule.audience === 'both') push('landlord', ll.name, ll.email || 'landlord@example.com');
    if (rule.audience === 'operator') push('operator', op.name, op.email || CFG.brand.email);
    /* Sales inbox: always English so the team can triage one queue. */
    if (rule.audience === 'sales') push('sales', sp.name || CFG.contact.salesName, sp.email || CFG.contact.email, 'en');
    /* The enquirer hears back in the language they were browsing in. */
    if (rule.audience === 'enquirer') push('enquirer', en.name || 'Website visitor', en.email, p.lang || 'en');
    return out;
  }

  /* Hand the queue to the server when configured; otherwise it stays local. */
  function deliver(entries) {
    if (!CFG.notify.useServer || typeof fetch !== 'function') {
      entries.forEach(e => { e.status = 'queued'; });
      S.save();
      return;
    }
    fetch(CFG.notify.url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: entries.map(e => ({ to: e.to, subject: e.subject, html: html(e), text: e.body, eml: eml(e), lang: e.lang, trigger: e.trigger })) })
    }).then(r => r.ok ? r.json() : null)
      .then(res => {
        (res && res.results ? res.results : []).forEach((r, i) => {
          if (entries[i]) entries[i].status = r.status === 'sent' ? 'sent' : 'queued';
        });
        S.save();
      })
      .catch(() => { entries.forEach(e => { e.status = 'queued'; }); S.save(); });
  }

  /* ---------- digests ---------------------------------------------------- */
  function runDigest(kind) {
    const camps = S.campaigns().filter(c => c.status !== 'rejected');
    let count = 0;
    camps.forEach(c => {
      const p = S.proofOfPlay(c);
      const loc = S.location((c.locationIds || [])[0]);
      const vars = {
        campaign: c.id, name: A().L(c.advertiser), plays: A().num(p.verified.plays),
        impressions: A().num(p.exposure.impressions), clicks: A().num(p.engagement.scans),
        conversions: A().num(p.engagement.redemptions), amount: A().money(c.spend),
        locations: (c.locationIds || []).map(id => { const l = S.location(id); return l ? A().L(l.name) : id; }).join(', '),
        date: A().date(c.start), days: c.days, share: A().money(Math.round((c.spend || 0) * S.state.split.landlord))
      };
      const res = fire(kind === 'daily' ? 'campaign.ending' : 'report.weekly', {
        market: loc ? S.marketOfLocation(loc) : 'hk',
        advertiser: { name: A().L(c.advertiser), email: 'advertiser@example.com' },
        vars, facts: [['Campaign', c.id], ['Plays', vars.plays], ['Impressions', vars.impressions], ['Spend', vars.amount]]
      });
      count += res.length;
    });
    return count;
  }

  window.LG = window.LG || {};
  window.LG.notify = {
    TRIGGERS, RULES, rules, setRule, settings, saveSettings, template, html, eml,
    fire, runDigest, outbox,
    markSent(id) {
      const e = outbox().find(x => x.id === id);
      if (e) { e.status = 'sent'; S.save(); }
    },
    clearOutbox() { S.state.notifications = []; S.save(); }
  };
})();
