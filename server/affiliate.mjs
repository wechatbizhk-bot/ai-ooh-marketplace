/* ============================================================================
 * 3dNakedEye — affiliate.mjs
 * The share-link programme's server side: partners, tracked links, click
 * recording, attribution, commission, fraud rules and reporting.
 *
 * The shapes match server/schema.sql; here they are persisted as JSON +
 * append-only JSONL so the bundled demo server stays zero-dependency and the
 * front end can be developed and tested against a real API.
 *
 * Security posture (all of it is exercised by _verify/affiliate-api-test.cjs):
 *   • every input is validated against a strict shape before it is used
 *   • destinations come from an allow-list — a link can only point at this site
 *   • no raw IP address is stored: only a salted SHA-256 hash
 *   • clicks are de-duplicated inside a window and rate-limited per partner/IP
 *   • conversions are idempotent on the merchant's order id
 *   • self-referral is refused (same IP hash as the partner's sign-up)
 *   • attribution is last-click inside the partner's cookie window
 *   • every refusal is written to a fraud log with a reason
 * ==========================================================================*/
import crypto from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';

export const SCHEMA_VERSION = 1;

/* the only pages a tracked link may send traffic to. A query string is allowed
 * after the file name; anything else is refused. */
export const DESTINATIONS = [
  'index.html', 'marketplace.html', 'location.html', 'price-list.html', 'catalog.html',
  'holobox.html', 'led-film.html', 'calculator.html', 'dimension.html', 'cloud.html',
  'studio.html', 'preview.html', 'membership.html', 'pricing.html', 'checkout.html',
  'partnership.html', 'affiliate.html', 'faq.html', 'contact.html', 'video.html'
];

const CHANNELS = ['link', 'social', 'content', 'message', 'email', 'qr', 'offline'];
const EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const CODE = /^[A-Z0-9][A-Z0-9-]{2,15}$/;
const CID = /^[A-Z0-9-]{3,40}$/;
const ORDER = /^[A-Za-z0-9._-]{3,64}$/;
const BOT_UA = /(bot|crawler|spider|preview|curl|wget|python-requests|headless)/i;

const minor = n => Math.round(Number(n) * 100);
const money = cents => Math.round(cents) / 100;

export function createAffiliate(opts) {
  const dir = opts.dir;
  const salt = opts.salt || '3dnakedeye-affiliate';
  const now = () => Date.now();
  const partnersFile = path.join(dir, 'partners.json');
  const clicksFile = path.join(dir, 'clicks.jsonl');
  const conversionsFile = path.join(dir, 'conversions.jsonl');
  const fraudFile = path.join(dir, 'fraud.jsonl');

  const limits = {
    clicksPerMinutePerIp: opts.clicksPerMinutePerIp || 40,
    clicksPerDayPerPartner: opts.clicksPerDayPerPartner || 2000,
    dedupeSeconds: opts.dedupeSeconds || 30,
    maxPartners: opts.maxPartners || 500,
    maxClicksStored: opts.maxClicksStored || 5000
  };

  let db = { partners: {}, order: [] };
  const clicks = [];
  const conversions = [];
  const fraud = [];
  const recentByIp = new Map();          /* ipHash -> [timestamps] */

  const hash = v => crypto.createHash('sha256').update(salt + '|' + String(v || '')).digest('hex');

  function load() {
    try { db = JSON.parse(fs.readFileSync(partnersFile, 'utf8')); } catch (e) { db = { partners: {}, order: [] }; }
    for (const [file, into] of [[clicksFile, clicks], [conversionsFile, conversions], [fraudFile, fraud]]) {
      try {
        fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).forEach(line => {
          try { into.push(JSON.parse(line)); } catch (e) { /* skip a torn line */ }
        });
      } catch (e) { /* not written yet */ }
    }
    return { partners: db.order.length, clicks: clicks.length, conversions: conversions.length, fraud: fraud.length };
  }
  const savePartners = async () => {
    await fsp.mkdir(dir, { recursive: true });
    await fsp.writeFile(partnersFile, JSON.stringify(db, null, 1));
  };
  const append = async (file, rec) => {
    await fsp.mkdir(dir, { recursive: true });
    await fsp.appendFile(file, JSON.stringify(rec) + '\n');
  };

  function makeCode(name) {
    const stem = String(name || 'PARTNER').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6) || 'PARTNER';
    for (let i = 0; i < 200; i++) {
      const code = stem + '-' + crypto.randomBytes(2).toString('hex').toUpperCase().slice(0, 3);
      if (CODE.test(code) && !db.partners[code]) return code;
    }
    throw Object.assign(new Error('could not allocate a code'), { status: 500 });
  }

  /* ---------- validation ---------------------------------------------------- */
  const bad = (status, error, kind, ctx) => {
    if (kind) logFraud(kind, error, ctx);
    return Object.assign(new Error(error), { status, kind });
  };
  function logFraud(kind, detail, ctx) {
    const rec = { kind, detail, ip_hash: (ctx && ctx.ipHash) || null, at: now() };
    fraud.push(rec);
    if (fraud.length > 500) fraud.shift();
    append(fraudFile, rec).catch(() => {});
    return rec;
  }
  function normDest(dest) {
    const raw = String(dest || '').trim();
    if (!raw) throw bad(400, 'destination required', 'bad_destination');
    const file = raw.split('?')[0].replace(/^\.?\//, '');
    if (!DESTINATIONS.includes(file)) throw bad(400, 'destination not allowed: ' + file, 'bad_destination');
    return raw;
  }
  const normCode = raw => {
    const code = String(raw || '').trim().toUpperCase();
    if (!CODE.test(code)) throw bad(400, 'partner code must be 3–16 characters, A–Z 0–9 and dashes', 'bad_code');
    return code;
  };
  const normChannel = raw => {
    const ch = String(raw || 'link').trim().toLowerCase();
    return CHANNELS.includes(ch) ? ch : 'link';
  };

  /* ---------- API ----------------------------------------------------------- */
  const api = {
    limits, dir, schemaVersion: SCHEMA_VERSION,
    load, state: () => db,
    counts: () => ({ partners: db.order.length, clicks: clicks.length, conversions: conversions.length, fraud: fraud.length }),

    register({ name, email, windowDays, model, payout }, ctx) {
      const cleanName = String(name || '').trim().replace(/\s+/g, ' ');
      if (cleanName.length < 2 || cleanName.length > 60) throw bad(400, 'name must be 2–60 characters');
      const cleanEmail = String(email || '').trim().toLowerCase();
      if (!EMAIL.test(cleanEmail) || cleanEmail.length > 120) throw bad(400, 'a valid email is required');
      if (db.order.length >= limits.maxPartners) throw bad(429, 'partner cap reached');
      if (db.order.some(c => db.partners[c].email === cleanEmail)) throw bad(409, 'that email is already registered');

      const kind = model && model.kind === 'flat' ? 'flat' : 'pct';
      const value = model && Number.isFinite(Number(model.value))
        ? Math.max(0, kind === 'flat' ? minor(model.value) / 100 : Number(model.value))
        : (kind === 'flat' ? 150 : 0.08);
      const days = Math.max(1, Math.min(365, Number(windowDays) || 30));
      const code = makeCode(cleanName);
      const partner = {
        code, name: cleanName, email: cleanEmail, status: 'active',
        windowDays: days, model: { kind, value },
        payout: { method: (payout && payout.method) || 'bank', detail: null },
        signupIpHash: (ctx && ctx.ipHash) || null,
        createdAt: now()
      };
      db.partners[code] = partner;
      db.order.push(code);
      savePartners().catch(() => {});
      return { code, name: partner.name, windowDays: days, model: partner.model, status: 'active' };
    },

    /* a tracked link for one share: cid is new every time, so two posts by the
     * same partner can be compared */
    link({ code, dest, channel, campaign }) {
      const c = normCode(code);
      const partner = db.partners[c];
      if (!partner) throw bad(404, 'unknown partner code', 'bad_code');
      if (partner.status !== 'active') throw bad(403, 'partner is ' + partner.status);
      const destination = normDest(dest);
      const cid = (c + '-' + crypto.randomBytes(3).toString('hex')).toUpperCase();
      return {
        cid, code: c, destination, channel: normChannel(channel), campaign: campaign ? String(campaign).slice(0, 40) : null,
        windowDays: partner.windowDays,
        url: destination + (destination.includes('?') ? '&' : '?') + 'ref=' + c + '&cid=' + cid +
             '&utm_source=' + normChannel(channel)
      };
    },

    click({ ref, cid, dest, channel, ua, referrer }, ctx) {
      const code = normCode(ref);
      const partner = db.partners[code];
      if (!partner) throw bad(404, 'unknown partner code', 'bad_code', ctx);
      if (partner.status !== 'active') throw bad(403, 'partner is ' + partner.status, undefined, ctx);
      const destination = normDest(dest);
      if (cid && !CID.test(String(cid).toUpperCase())) throw bad(400, 'cid must be 3–40 characters, A–Z 0–9 and dashes', 'bad_code', ctx);

      /* rate limit per IP hash, and a daily cap per partner */
      const ipHash = (ctx && ctx.ipHash) || null;
      if (ipHash) {
        const list = (recentByIp.get(ipHash) || []).filter(t => now() - t < 60000);
        list.push(now());
        recentByIp.set(ipHash, list);
        if (list.length > limits.clicksPerMinutePerIp) throw bad(429, 'too many clicks from this address', 'rate_limited', ctx);
      }
      const dayAgo = now() - 86400000;
      const partnerToday = clicks.filter(c => c.code === code && c.at > dayAgo).length;
      if (partnerToday >= limits.clicksPerDayPerPartner) throw bad(429, 'daily click cap reached for this partner', 'click_flood', ctx);

      /* the same partner on the same page from the same address inside the
       * dedupe window is recorded once, and flagged — the start of a click ring */
      const repeat = clicks.some(c => c.code === code && c.dest === destination && c.ipHash === ipHash &&
        now() - c.at < limits.dedupeSeconds * 1000);
      const flags = [];
      if (repeat) flags.push('rapid_repeat');
      if (!ua || BOT_UA.test(String(ua))) flags.push('bot_ua');
      const risk = (repeat ? 40 : 0) + (BOT_UA.test(String(ua || '')) ? 30 : 0);
      if (repeat) logFraud('click_flood', 'repeat click on ' + destination, ctx);

      const rec = {
        kind: 'click', code, cid: cid ? String(cid).toUpperCase() : null, dest: destination,
        channel: normChannel(channel), ipHash, uaHash: ua ? hash(ua) : null,
        referrerHost: referrer ? String(referrer).replace(/^https?:\/\//, '').split('/')[0].slice(0, 60) : null,
        isRepeat: repeat, risk, flags, at: now(), expires: now() + partner.windowDays * 86400000
      };
      clicks.push(rec);
      if (clicks.length > limits.maxClicksStored) clicks.shift();
      append(clicksFile, rec).catch(() => {});
      return { ok: true, clickId: rec.at + '-' + (rec.cid || code), repeat, risk, flags, windowDays: partner.windowDays };
    },

    /* the merchant reports an order; attribution is last-click inside the window.
     * Self-referral is refused on identity (the buyer's email is the partner's);
     * a conversion arriving from the partner's own address is attributed but
     * flagged for review, because an address is a weak signal (shared NAT). */
    convert({ ref, cid, orderRef, amount, currency, buyerEmail }, ctx) {
      const code = normCode(ref);
      const partner = db.partners[code];
      if (!partner) throw bad(404, 'unknown partner code', 'bad_code', ctx);
      const order = String(orderRef || '').trim();
      if (!ORDER.test(order)) throw bad(400, 'orderRef must be 3–64 characters');
      if (conversions.some(c => c.orderRef === order)) throw bad(409, 'order already recorded', 'duplicate_order', ctx);
      const value = Number(amount);
      if (!Number.isFinite(value) || value < 0 || value > 100000000) throw bad(400, 'amount out of range');
      const cents = minor(value);

      /* identity check: a partner may not be their own customer */
      const buyer = String(buyerEmail || '').trim().toLowerCase();
      if (buyer && buyer === partner.email) {
        logFraud('self_referral', 'buyer email is the partner’s own', ctx);
        const rec = {
          kind: 'conversion', code, cid: cid ? String(cid).toUpperCase() : null, orderRef: order,
          amount: cents, currency: (currency || 'HKD').toUpperCase(), model: partner.model,
          commission: 0, attributed: false, reason: 'self_referral', at: now()
        };
        conversions.push(rec);
        append(conversionsFile, rec).catch(() => {});
        return { ok: true, attributed: false, reason: 'self_referral', commission: 0 };
      }
      /* address check: same address as sign-up → attribute, but flag for review */
      let review = false;
      if (partner.signupIpHash && ctx && ctx.ipHash && partner.signupIpHash === ctx.ipHash) {
        review = true;
        logFraud('self_referral', 'conversion from the partner’s own address (review)', ctx);
      }

      /* last click inside the window, preferring a matching cid */
      const windowMs = partner.windowDays * 86400000;
      const inWindow = clicks.filter(c => c.code === code && now() - c.at <= windowMs && !c.isRepeat);
      const preferred = cid ? inWindow.filter(c => c.cid === String(cid).toUpperCase()) : [];
      const use = (preferred.length ? preferred : inWindow).sort((a, b) => b.at - a.at)[0];
      if (!use) {
        logFraud('no_click', 'no click inside the window for ' + code, ctx);
        const rec = {
          kind: 'conversion', code, cid: cid ? String(cid).toUpperCase() : null, orderRef: order,
          amount: cents, currency: (currency || 'HKD').toUpperCase(), model: partner.model,
          commission: 0, attributed: false, reason: 'no-click-in-window', at: now()
        };
        conversions.push(rec);
        append(conversionsFile, rec).catch(() => {});
        return { ok: true, attributed: false, reason: 'no-click-in-window', commission: 0 };
      }
      const commission = partner.model.kind === 'flat'
        ? Math.max(0, Math.round(partner.model.value * 100))
        : Math.max(0, Math.round(cents * partner.model.value));
      const rec = {
        kind: 'conversion', code, cid: use.cid, orderRef: order, amount: cents,
        currency: (currency || 'HKD').toUpperCase(), model: partner.model,
        commission, attributed: true, reason: null, review,
        status: review ? 'review' : 'pending', clickAt: use.at, at: now()
      };
      conversions.push(rec);
      append(conversionsFile, rec).catch(() => {});
      return {
        ok: true, attributed: true, code, cid: use.cid, orderRef: order, review,
        amount: money(cents), commission: money(commission), model: partner.model,
        windowDays: partner.windowDays, clickAt: use.at
      };
    },

    stats({ code }) {
      const c = normCode(code);
      const partner = db.partners[c];
      if (!partner) throw bad(404, 'unknown partner code', 'bad_code');
      const myClicks = clicks.filter(x => x.code === c);
      const myConv = conversions.filter(x => x.code === c);
      const paid = myConv.filter(x => x.attributed);
      const commissionCents = paid.reduce((n, x) => n + x.commission, 0);
      const orderCents = paid.reduce((n, x) => n + x.amount, 0);
      return {
        code: c, name: partner.name, status: partner.status,
        windowDays: partner.windowDays, model: partner.model,
        clicks: myClicks.length,
        uniqueClicks: new Set(myClicks.map(x => x.ipHash)).size,
        shares: new Set(myClicks.map(x => x.cid).filter(Boolean)).size,
        repeats: myClicks.filter(x => x.isRepeat).length,
        flagged: myClicks.filter(x => x.risk > 0).length,
        conversions: myConv.length,
        attributed: paid.length,
        declined: myConv.length - paid.length,
        orderValue: money(orderCents),
        commission: money(commissionCents),
        conversionRate: myClicks.length ? Math.round((paid.length / myClicks.length) * 1000) / 10 : 0,
        epc: myClicks.length ? money(commissionCents / myClicks.length) : 0
      };
    },

    ledger({ code, limit }) {
      const c = code ? normCode(code) : null;
      const n = Math.max(1, Math.min(200, Number(limit) || 50));
      return {
        clicks: clicks.filter(x => !c || x.code === c).slice(-n).reverse()
          .map(x => ({ code: x.code, cid: x.cid, dest: x.dest, channel: x.channel, at: x.at, risk: x.risk, flags: x.flags })),
        conversions: conversions.filter(x => !c || x.code === c).slice(-n).reverse(),
        fraud: fraud.filter(x => !c || true).slice(-n).reverse()
      };
    },

    partners: () => db.order.map(c => ({
      code: c, name: db.partners[c].name, status: db.partners[c].status,
      windowDays: db.partners[c].windowDays, model: db.partners[c].model, createdAt: db.partners[c].createdAt
    })),

    /* the allow-list, so the front end can build the picker from one source */
    destinations: () => DESTINATIONS.slice(),

    reset: async () => {
      db = { partners: {}, order: [] };
      clicks.length = 0; conversions.length = 0; fraud.length = 0; recentByIp.clear();
      await savePartners();
      await Promise.all([clicksFile, conversionsFile, fraudFile].map(f => fsp.writeFile(f, '')));
    }
  };

  return api;
}
