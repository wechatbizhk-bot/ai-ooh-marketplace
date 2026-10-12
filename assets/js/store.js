/* ============================================================================
 * 3dNakedEye — store.js
 * Client-side domain layer: inventory, cart/booking, pricing engine, revenue
 * split, proof-of-play derivation and persistence.
 * In production these functions become calls to the platform API; the shapes
 * are kept identical so the UI does not change.
 * ==========================================================================*/
(function () {
  'use strict';

  const CFG = window.LG_CONFIG;
  const KEY = '3dnakedeye.v1';
  const LS = (() => {
    try {
      const probe = '__lg_probe__';
      window.localStorage.setItem(probe, '1');
      window.localStorage.removeItem(probe);
      return window.localStorage;
    } catch (e) {
      const mem = {};
      return {
        getItem: k => (k in mem ? mem[k] : null),
        setItem: (k, v) => { mem[k] = String(v); },
        removeItem: k => { delete mem[k]; }
      };
    }
  })();

  /* --- utilities ---------------------------------------------------------- */
  const clone = o => JSON.parse(JSON.stringify(o));
  const uid = p => p + '-' + Math.random().toString(36).slice(2, 8).toUpperCase();
  const todayISO = (offsetDays = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
  };
  const addDays = (iso, n) => {
    const d = new Date(iso + 'T00:00:00');
    d.setDate(d.getDate() + n - 1);
    return d.toISOString().slice(0, 10);
  };
  const daysBetween = (a, b) => {
    if (!a || !b) return 0;
    return Math.max(0, Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000) + 1);
  };
  /* Deterministic PRNG so seeded reports stay stable across reloads. */
  const seedFrom = str => {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return () => {
      h += 0x6D2B79F5; let t = h;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  /* --- state -------------------------------------------------------------- */
  const defaults = () => ({
    lang: null,
    market: null,
    split: clone(CFG.revenueSplit),
    locations: clone(window.LG_SEED_LOCATIONS),
    campaigns: clone(window.LG_SEED_CAMPAIGNS),
    ledger: clone(window.LG_SEED_LEDGER),
    maintenance: clone(window.LG_SEED_MAINTENANCE),
    cart: [],
    bookings: [],
    approvals: clone(window.LG_SEED_APPROVALS || []),
    notices: [],
    aiDrafts: [],
    inquiries: [],
    /* accounts / session / front-of-site records */
    accounts: [],
    session: null,
    pendingTier: null,
    enquiries: [],
    chatLog: [],
    /* affiliate share-link tracking: the last attributed click, and its log */
    share: null,
    shareLog: []
  });

  let state;
  try {
    const raw = LS.getItem(KEY);
    state = raw ? Object.assign(defaults(), JSON.parse(raw)) : defaults();
  } catch (e) { state = defaults(); }

  const listeners = new Set();
  const save = () => {
    try { LS.setItem(KEY, JSON.stringify(state)); } catch (e) { /* quota — ignore */ }
    listeners.forEach(fn => { try { fn(state); } catch (e) { console.error(e); } });
  };

  /* --- email automation hooks -------------------------------------------
   * The store stays independent of the notification engine: if notify.js is
   * not loaded (or is disabled) these calls are no-ops.
   *
   * Two shapes are supported:
   *   notifyFire('enquiry.received', payload)   — a named trigger + payload
   *   notifyFire(booking, quote)                — the booking shortcut below  */
  function notifyFire(trigger, payload) {
    const nt = window.LG.notify;
    if (!nt) return [];
    if (payload && payload.lines) return notifyBooking(trigger, payload);
    try { return nt.fire(trigger, payload || {}); } catch (e) { return []; }
  }

  function notifyBooking(booking, quote) {
    const nt = window.LG.notify;
    if (!nt) return [];
    const first = (quote.lines || [])[0] || {};
    const loc = state.locations.find(l => l.id === first.locationId);
    const advName = (booking.advertiser && (booking.advertiser.en || booking.advertiser)) || 'Advertiser';
    const base = {
      market: loc ? marketOf(loc) : (CFG.geo && CFG.geo.defaultMarket) || 'hk',
      advertiser: { name: advName, email: (booking.contact && booking.contact.email) || 'advertiser@example.com' },
      landlord: loc ? { name: loc.landlord && loc.landlord.en, email: 'landlord@example.com' } : null,
      operator: { name: CFG.brand.name, email: CFG.brand.email }
    };
    const vars = {
      id: booking.id, campaign: (state.campaigns[0] && state.campaigns[0].id) || booking.id,
      name: advName, advertiser: advName,
      location: loc ? loc.name.en : '', locations: (quote.lines || []).map(l => {
        const l2 = state.locations.find(x => x.id === l.locationId); return l2 ? l2.name.en : l.locationId;
      }).join(', '),
      amount: CFG.currency.symbol + Math.round(quote.total).toLocaleString('en-US'),
      date: (quote.lines[0] && quote.lines[0].start) || todayISO(3),
      days: first.days || 7, sov: first.sov || 100,
      share: CFG.currency.symbol + Math.round(quote.media * state.split.landlord).toLocaleString('en-US'),
      fee: CFG.currency.symbol + Math.round(quote.media * state.split.platform).toLocaleString('en-US'),
      method: booking.method || 'card',
      devices: String((loc ? loc.devices.length : 1))
    };
    const sent = [];
    try {
      sent.push(...nt.fire('booking.created', Object.assign({}, base, { vars })));
      sent.push(...nt.fire('payment.received', Object.assign({}, base, { vars })));
      sent.push(...nt.fire('approval.requested', Object.assign({}, base, { vars })));
    } catch (e) { /* notifications must never break a booking */ }
    return sent;
  }

  /* --- account helpers ---------------------------------------------------- */
  /* Salted FNV-1a digest. Not a substitute for server-side hashing — it just
   * stops a casual look at localStorage from reading a password back. */
  function hashPassword(pw, salt) {
    const s = String(salt || '') + '::' + String(pw);
    let h1 = 2166136261, h2 = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i);
      h1 ^= c; h1 = Math.imul(h1, 16777619);
      h2 = Math.imul(h2 ^ c, 2246822519);
    }
    const hex = n => (n >>> 0).toString(16).padStart(8, '0');
    return 'fnv1a$' + hex(h1) + hex(h2) + '$' + s.length.toString(16);
  }

  /* Plain-language benefit list per tier, used in the welcome email. */
  function tierBenefits(tierId) {
    const vals = tierId === 'free' ? [1, 2, 3, 4, 5].map(i => 'mem.free_' + i)
      : [1, 2, 3, 4, 5, 6].map(i => 'mem.paid_' + i);
    return vals.map(k => i18nText(k)).filter(Boolean).join('; ');
  }

  /* Read a key straight out of the dictionary without depending on app.js.
   * Used where the store has to produce human text (emails, notifications). */
  function i18nText(key, lang) {
    const entry = (window.LG_I18N || {})[key];
    if (!entry) return '';
    const field = { en: 'en', 'zh-HK': 'zhHant', 'zh-CN': 'zhHans', th: 'th' }[lang] || 'en';
    return entry[field] || entry.en || '';
  }

  /* --- reference lookups -------------------------------------------------- */
  const deviceType = id => window.LG_DEVICES[id] || null;
  const venue = id => window.LG_VENUES.find(v => v.id === id) || { id, mult: 1, label: { en: id, zhHant: id, zhHans: id } };
  const GEO = () => window.LG_GEO || { centers: {}, locations: {} };
  const district = id => {
    const d = window.LG_DISTRICTS.find(x => x.id === id) || { id, label: { en: id, zhHant: id, zhHans: id }, x: 50, y: 50 };
    const dm = (GEO().districtMarket) || {};
    return Object.assign({}, d, (GEO().centers || {})[d.id] || {},
      { market: d.market || dm[d.id] || (CFG.geo && CFG.geo.defaultMarket) || 'hk' });
  };

  /* --- location-based services ------------------------------------------- */
  const toRad = d => (d * Math.PI) / 180;
  function distanceKm(a, b) {
    if (!a || !b || a.lat == null || b.lat == null) return null;
    const R = 6371;
    const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
    const s = Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  }
  /* Coordinates for any location: explicit point, else district centre plus a
   * small deterministic offset so landlord-added sites still appear on the map. */
  function locationGeo(id) {
    const fixed = (GEO().locations || {})[id];
    if (fixed) return fixed;
    const loc = state.locations.find(l => l.id === id);
    if (!loc) return null;
    const c = district(loc.district);
    const rnd = seedFrom(id + 'geo');
    return {
      lat: Math.round((c.lat + (rnd() - 0.5) * 0.012) * 1e5) / 1e5,
      lng: Math.round((c.lng + (rnd() - 0.5) * 0.016) * 1e5) / 1e5
    };
  }
  const landmarks = marketId => {
    const mkts = (CFG.geo && CFG.geo.markets) || [];
    const m = mkts.find(x => x.id === (marketId || state.market)) || mkts[0];
    return (m && m.landmarks) || [];
  };

  /* --- markets ------------------------------------------------------------ */
  const markets = () => (CFG.geo && CFG.geo.markets) || [];
  const marketOf = loc => {
    if (loc && loc.market) return loc.market;
    const dm = (GEO().districtMarket) || {};
    return (loc && dm[loc.district]) || (CFG.geo && CFG.geo.defaultMarket) || 'hk';
  };
  const locationsByMarket = (marketId, opts) => {
    const o = opts || {};
    return state.locations.filter(l => marketOf(l) === marketId &&
      (o.includePending ? true : (l.status === 'live' && l.verified)));
  };

  /* --- availability: what is free, partly sold, or occupied --------------
   * Combines the location's rolling occupancy with anything already
   * committed in this session (basket and campaigns), so booking a site
   * visibly moves it towards "occupied". */
  function availability(locationId, fromISO, days, opts) {
    const loc = state.locations.find(l => l.id === locationId);
    if (!loc) return null;
    const o = opts || {};
    const span = Math.max(1, days || 7);
    const start = fromISO || todayISO(0);
    const rnd = seedFrom(loc.id + 'avail' + start);
    const base = Math.min(0.95, (loc.bookedPct || 0) / 100);
    let sum = 0, freeDays = 0;
    for (let i = 0; i < span; i++) {
      const iso = addDays(start, i);
      const dow = new Date(iso + 'T00:00:00').getDay();
      const weekend = dow === 0 || dow === 6;
      const v = Math.min(0.98, Math.max(0.02, base + (rnd() - 0.5) * 0.4 + (weekend ? 0.1 : 0)));
      sum += v;
      if (v < 0.6) freeDays++;
    }
    let booked = sum / span;
    /* Committed demand in this session only counts when it overlaps the
     * requested window and is still going to play. */
    const winStart = start, winEnd = addDays(start, span);
    const overlaps = (a, b) => a && b && a <= winEnd && b >= winStart;
    state.campaigns
      .filter(c => ['live', 'scheduled', 'in_review'].indexOf(c.status) !== -1)
      .filter(c => (c.locationIds || []).indexOf(loc.id) !== -1)
      .filter(c => overlaps(c.start, c.end || addDays(c.start, c.days)))
      .forEach(c => { booked = Math.min(0.99, booked + ((c.sov || 100) / 100) * 0.3); });
    state.cart
      .filter(l => l.locationId === loc.id)
      .forEach(l => { booked = Math.min(0.99, booked + ((l.sov || 100) / 100) * 0.3); });

    const freePct = Math.round((1 - booked) * 100);
    const restricted = !!(o.category && (loc.restrictions || []).includes(o.category));
    let st = freePct >= 40 ? 'available' : freePct >= 12 ? 'partial' : 'occupied';
    if (loc.status !== 'live' || !loc.verified) st = 'pending';
    return {
      locationId: loc.id, from: start, to: addDays(start, span), days: span,
      bookedPct: Math.round(booked * 100), freePct,
      freeDays, state: restricted ? 'restricted' : st, restricted,
      label: restricted ? 'restricted' : st
    };
  }

  /* --- payments ---------------------------------------------------------- */
  function providerFor(methodKey) {
    const p = (CFG.payments && CFG.payments.providers) || {};
    if (methodKey === 'card' || methodKey === 'wallet' || methodKey === 'stripe') return p.stripe;
    if (methodKey === 'paypal') return p.paypal;
    if (methodKey === 'crypto') return p.crypto;
    return p.local || { label: 'local', pct: CFG.payment.processingPct, flat: CFG.payment.processingFlat };
  }
  function paymentQuote(methodKey, gross) {
    const p = providerFor(methodKey) || {};
    const pct = p.pct != null ? p.pct : CFG.payment.processingPct;
    const flat = p.flat != null ? p.flat : CFG.payment.processingFlat;
    const fee = Math.round((gross * pct + flat) * 100) / 100;
    return {
      key: methodKey, provider: p.label || methodKey, mode: p.mode || 'simulated',
      pct, flat, fee, total: Math.round((gross + fee) * 100) / 100
    };
  }
  /* Crypto invoice: amount in coin units, rate lock and a demo address. */
  function cryptoQuote(coinIndex, hkdTotal, ref) {
    const cfg = (CFG.payments && CFG.payments.providers && CFG.payments.providers.crypto) || { coins: [] };
    const coins = cfg.coins || [];
    const coin = coins[coinIndex] || coins[0] || { code: 'USDT', network: 'TRC20', hkdPerUnit: 7.8, memo: true };
    const buffer = 1 + (cfg.volatilityBufferPct || 0) / 100;
    const lockMs = (CFG.payments.cryptoRateLockMinutes || 15) * 60000;
    const rnd = seedFrom((ref || 'bk') + coin.code + coin.network);
    const hex = n => Array.from({ length: n }, () => '0123456789abcdef'[Math.floor(rnd() * 16)]).join('');
    const address = /^0x/.test(coin.network) || coin.network === 'ERC20'
      ? '0x' + hex(40)
      : coin.code === 'BTC' ? 'bc1q' + hex(38)
      : coin.code === 'USDT' && coin.network === 'TRC20' ? 'T' + hex(33)
      : hex(34);
    return {
      coin: coin.code, network: coin.network, hkdPerUnit: coin.hkdPerUnit,
      units: Math.round((hkdTotal * buffer / coin.hkdPerUnit) * 1e6) / 1e6,
      address, memo: coin.memo ? 'LG-' + hex(6).toUpperCase() : null,
      expiresAt: new Date(Date.now() + lockMs).toISOString(),
      lockMinutes: CFG.payments.cryptoRateLockMinutes || 15,
      confirmations: cfg.confirmations || 1, mode: cfg.mode || 'simulated'
    };
  }


  /* --- pricing engine ----------------------------------------------------- */
  function deviceDailyRate(location, deviceIds) {
    const ids = deviceIds && deviceIds.length ? deviceIds : location.devices.map(d => d.id);
    return location.devices
      .filter(d => ids.includes(d.id))
      .reduce((sum, d) => {
        const t = deviceType(d.type);
        return sum + (t ? t.dailyRate : 0);
      }, 0);
  }

  function lineQuote(line) {
    const loc = state.locations.find(l => l.id === line.locationId);
    if (!loc) return null;
    const days = Math.max(CFG.pricing.minimumDays, Math.min(CFG.pricing.maxDays, line.days || 1));
    const sov = CFG.pricing.shareOfVoice.includes(line.sov) ? line.sov : 100;
    const dIds = line.deviceIds && line.deviceIds.length ? line.deviceIds : loc.devices.map(d => d.id);
    const ratePerDay = deviceDailyRate(loc, dIds);
    const venueMult = venue(loc.venue).mult;
    const listPerDay = ratePerDay * venueMult;
    const sovFactor = CFG.pricing.sovDiscount[sov] !== undefined ? CFG.pricing.sovDiscount[sov] : 1;
    const dayDiscount = days >= 30 ? CFG.pricing.monthlyDiscount : days >= 7 ? CFG.pricing.weeklyDiscount : 0;
    const perDay = listPerDay * sovFactor * (1 - dayDiscount);
    const media = Math.round(perDay * days);
    return {
      locationId: loc.id, locationName: loc.name, devices: dIds, deviceCount: dIds.length,
      days, sov, ratePerDay: Math.round(listPerDay), sovFactor, dayDiscount,
      perDay: Math.round(perDay), media,
      start: line.start || todayISO(3),
      playsPerDay: Math.round(480 * (sov / 100)),
      estImpressionsPerDay: Math.round(loc.footfallPerDay * loc.visibility * (sov / 100)),
      slot: line.slot || 'all_day'
    };
  }

  function aiFee(opts) {
    if (!opts || !opts.enabled) return 0;
    const p = CFG.pricing.aiStudioFee;
    const langs = Math.max(1, opts.languages || 1);
    return p.base + p.perLanguage * (langs - 1) + (opts.hologram ? p.hologramConversion : 0);
  }

  function quote(cart, ai, methodKey) {
    const lines = (cart || state.cart).map(lineQuote).filter(Boolean);
    const media = lines.reduce((s, l) => s + l.media, 0);
    const fee = aiFee(ai);
    const gross = media + fee;
    const split = state.split;
    const pay = CFG.payment;
    const pq = paymentQuote(methodKey || 'card', gross);
    const processing = pq.fee;
    const total = pq.total;
    const shares = {
      landlord: Math.round(media * split.landlord),
      platform: Math.round(media * split.platform + fee * 0.5),
      ai: Math.round(media * split.ai + fee * 0.5),
      sales: Math.round(media * split.sales)
    };
    return {
      lines, media, aiFee: fee, gross, processing, total,
      deposit: Math.round(total * pay.depositPct * 100) / 100,
      balance: Math.round(total * (1 - pay.depositPct) * 100) / 100,
      shares, split: clone(split),
      playsPerDay: lines.reduce((s, l) => s + l.playsPerDay * l.deviceCount, 0),
      estImpressionsPerDay: lines.reduce((s, l) => s + l.estImpressionsPerDay * l.deviceCount, 0),
      days: lines.reduce((s, l) => Math.max(s, l.days), 0)
    };
  }

  /* --- proof of play ------------------------------------------------------ */
  function proofOfPlay(campaign) {
    const rnd = seedFrom(campaign.id);
    const rows = [];
    let plays = 0, impressions = 0;
    (campaign.locationIds || []).forEach(lid => {
      const loc = state.locations.find(l => l.id === lid);
      if (!loc) return;
      (campaign.deviceIds && campaign.deviceIds.length ? loc.devices.filter(d => campaign.deviceIds.includes(d.id)) : loc.devices)
        .forEach(dev => {
          const scheduled = Math.round(480 * ((campaign.sov || 100) / 100) * campaign.days);
          const uptime = Math.min(0.999, 0.93 + rnd() * 0.07);
          const completion = 0.965 + rnd() * 0.034;
          const actual = Math.round(scheduled * uptime * completion);
          const perPlay = (loc.footfallPerDay / 480) * loc.visibility;
          const imp = Math.round(actual * perPlay);
          plays += actual; impressions += imp;
          rows.push({
            deviceId: dev.id, locationId: loc.id, type: dev.type,
            scheduled, actual, uptime, completion,
            impressions: imp,
            screenshots: Math.max(1, Math.round(campaign.days / 3)),
            errors: rnd() < 0.25 ? 1 : 0
          });
        });
    });
    const footfall = (campaign.locationIds || []).reduce((s, lid) => {
      const loc = state.locations.find(l => l.id === lid);
      return s + (loc ? loc.footfallPerDay * campaign.days : 0);
    }, 0);
    const scans = Math.round(plays * (0.0035 + rnd() * 0.003));
    const claims = Math.round(scans * (0.42 + rnd() * 0.18));
    const redemptions = Math.round(claims * (0.55 + rnd() * 0.25));
    const nfc = Math.round(scans * 0.08);
    const pageViews = Math.round(scans * (1.6 + rnd() * 0.9));
    const leads = Math.round(claims * (0.12 + rnd() * 0.1));
    return {
      rows,
      verified: {
        plays, scheduledPlays: rows.reduce((s, r) => s + r.scheduled, 0),
        completionPct: rows.length ? rows.reduce((s, r) => s + r.completion, 0) / rows.length : 0,
        uptimePct: rows.length ? rows.reduce((s, r) => s + r.uptime, 0) / rows.length : 0,
        activeDevices: rows.filter(r => r.uptime > 0.9).length, devices: rows.length,
        playSeconds: plays * 20
      },
      exposure: {
        footfall, impressions,
        avgFrequency: impressions && footfall ? impressions / footfall : 0,
        visibilityMult: campaign.locationIds.reduce((s, lid) => {
          const loc = state.locations.find(l => l.id === lid); return s + (loc ? loc.visibility : 0);
        }, 0) / Math.max(1, campaign.locationIds.length)
      },
      engagement: { scans, nfc, pageViews, claims, redemptions, leads, revenuePerPlay: plays ? (campaign.spend / plays) : 0 }
    };
  }

  /* --- CRUD --------------------------------------------------------------- */
  const api = {
    CFG, state, save, subscribe: fn => { listeners.add(fn); return () => listeners.delete(fn); },
    reset() { state = defaults(); save(); },

    /* --- affiliate share links --------------------------------------------
     * The demo of the model described on affiliate.html: a unique code arrives
     * in the query string, a "cookie" is dropped (a stored click with an expiry
     * = the cookie window), and a later order inside that window is attributed
     * to the partner. Everything here is browser-local, like the rest of the
     * demonstration data. */
    share: {
      WINDOW_DAYS: 30,
      /* codes are short, upper-case and readable aloud on a phone call */
      makeCode(seed) {
        const s = String(seed || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6) || 'PARTNER';
        let n = 0;
        for (const ch of s) n = (n * 31 + ch.charCodeAt(0)) % 46656;
        return s + '-' + n.toString(36).toUpperCase().padStart(3, '0');
      },
      /* a click: ref is the partner code, cid identifies the individual link */
      click(ref, opts) {
        const o = opts || {};
        if (!ref) return null;
        const now = Date.now();
        const windowDays = Number(o.windowDays || api.share.WINDOW_DAYS);
        const rec = {
          ref: String(ref).toUpperCase(),
          cid: o.cid || api.share.makeCode(String(ref) + now),
          page: o.page || (window.location ? window.location.pathname.split('/').pop() || 'index.html' : 'index.html'),
          channel: o.channel || 'link',
          market: o.market || state.market || 'hk',
          at: now,
          expires: now + windowDays * 86400000,
          windowDays
        };
        /* one click per partner per page per session: keep the log readable */
        state.shareLog = (state.shareLog || []).filter(x => !(x.ref === rec.ref && x.page === rec.page));
        state.shareLog.unshift(rec);
        state.shareLog = state.shareLog.slice(0, 50);
        state.share = rec;
        save();
        return rec;
      },
      /* the click that is still inside its window, if any */
      current(now) {
        const s = state.share;
        if (!s) return null;
        return (now || Date.now()) < s.expires ? s : null;
      },
      /* attribute an order: percentage of the order, or a flat fee */
      attribute(amount, model) {
        const s = api.share.current();
        if (!s) return { attributed: false };
        const m = model || { kind: 'pct', value: 0.08 };
        const commission = m.kind === 'flat' ? Number(m.value) : Math.round(Number(amount || 0) * Number(m.value));
        return {
          attributed: true, ref: s.ref, cid: s.cid, amount: Number(amount || 0),
          model: m.kind, rate: m.value, commission: Math.max(0, Math.round(commission)),
          clickAt: s.at, expires: s.expires, windowDays: s.windowDays, page: s.page
        };
      },
      log: () => state.shareLog || [],
      clear() { state.share = null; state.shareLog = []; save(); },
      /* the link a partner would paste, with both tracking parameters */
      link(base, ref, cid, channel) {
        const u = String(base || 'index.html');
        const sep = u.indexOf('?') === -1 ? '?' : '&';
        const parts = ['ref=' + encodeURIComponent(ref)];
        if (cid) parts.push('cid=' + encodeURIComponent(cid));
        if (channel) parts.push('utm_source=' + encodeURIComponent(channel));
        return u + sep + parts.join('&');
      }
    },

    /* lookups */
    locations: () => state.locations,
    liveLocations: () => state.locations.filter(l => l.status === 'live' && l.verified),
    location: id => state.locations.find(l => l.id === id) || null,
    venue, district, deviceType,
    districts: () => window.LG_DISTRICTS,
    devices: () => window.LG_DEVICES,

    /* landlord-side inventory */
    addLocation(loc) {
      const id = loc.id || 'LC-' + Math.floor(1000 + Math.random() * 8999);
      const rec = Object.assign({
        id, verified: false, status: 'pending', rating: 0, reviews: 0, bookedPct: 0,
        minDays: 3, restrictions: [], devices: [], x: 50, y: 50
      }, loc, { id });
      if (!rec.market) rec.market = district(rec.district).market;
      const pt = (loc.lat != null && loc.lng != null) ? { lat: loc.lat, lng: loc.lng } : null;
      state.locations.unshift(rec);
      window.LG_GEO.locations[id] = pt || locationGeo(id) || window.LG_CONFIG.geo.center;
      save(); return rec;
    },
    updateLocation(id, patch) {
      const i = state.locations.findIndex(l => l.id === id);
      if (i >= 0) { state.locations[i] = Object.assign({}, state.locations[i], patch); save(); }
    },
    addDevice(locationId, device) {
      const loc = api.location(locationId); if (!loc) return null;
      const dev = Object.assign({ id: uid('DV'), online: true, uptime: 99.0 }, device);
      loc.devices.push(dev); save(); return dev;
    },

    /* location-based services */
    distanceKm, locationGeo, landmarks, availability, markets,
    marketOfLocation: marketOf,
    locationsByMarket,
    market: id => markets().find(m => m.id === id) || markets()[0],
    setMarket(id) { if (markets().some(m => m.id === id)) { state.market = id; save(); } },
    /* every live location, or just one market when an id is given */
    liveLocationsIn(marketId) {
      return marketId
        ? locationsByMarket(marketId)
        : state.locations.filter(l => l.status === 'live' && l.verified);
    },
    availabilityAll(fromISO, days, opts) {
      return state.locations.map(l => Object.assign({ id: l.id }, availability(l.id, fromISO, days, opts)));
    },

    /* payments */
    providerFor, paymentQuote, cryptoQuote,
    payProviders() { return (CFG.payments && CFG.payments.providers) || {}; },

    /* cart / booking */
    addToCart(line) {
      const rec = Object.assign({ ref: uid('CART'), days: 7, sov: 100, slot: 'all_day' }, line);
      state.cart.push(rec); save(); return rec;
    },
    removeFromCart(ref) { state.cart = state.cart.filter(l => l.ref !== ref); save(); },
    clearCart() { state.cart = []; save(); },
    cart: () => state.cart,
    quote, lineQuote, aiFee,

    checkout(payload) {
      const method = (payload && payload.method) || 'card';
      const q = quote(state.cart, payload && payload.ai, method);
      const booking = {
        id: uid('BK'), created: new Date().toISOString(), status: 'paid',
        lines: q.lines, totals: q, ai: (payload && payload.ai) || null,
        advertiser: (payload && payload.advertiser) || null,
        method,
        payment: Object.assign(paymentQuote(method, q.gross),
          (payload && payload.crypto) ? { crypto: payload.crypto } : {},
          (payload && payload.paypal) ? { paypal: payload.paypal } : {},
          (payload && payload.stripe) ? { stripe: payload.stripe } : {}),
        contact: (payload && payload.contact) || null,
        coupon: !!(payload && payload.coupon),
        landing: (payload && payload.landing) || '',
        invoice: 'INV-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 8999)
      };
      state.bookings.unshift(booking);
      /* turn each booked line into a campaign with a pending landlord approval */
      q.lines.forEach(l => {
        const loc = api.location(l.locationId);
        const camp = {
          id: uid('CMP'), advertiser: booking.advertiser || { en: 'New advertiser', zhHant: '新廣告客戶', zhHans: '新广告客户' },
          objective: (payload && payload.objective) || 'awareness',
          status: 'in_review', locationIds: [l.locationId], deviceIds: l.devices,
          days: l.days, sov: l.sov, start: (payload && payload.start) || todayISO(3),
          end: addDays((payload && payload.start) || todayISO(3), l.days),
          created: todayISO(), spend: l.media, aiUsed: !!(payload && payload.ai && payload.ai.enabled),
          creative: (payload && payload.creative) || (booking.ai && booking.ai.creative) || { name: 'uploaded_creative.mp4', form: 'hologram', languages: ['en'] },
          bookingId: booking.id, approval: 'pending_landlord'
        };
        state.campaigns.unshift(camp);
        state.approvals.unshift({
          id: uid('AP'), campaignId: camp.id, locationId: l.locationId,
          landlord: loc ? loc.landlord : null, status: 'pending', created: todayISO(),
          note: null
        });
      });
      /* landlord ledger accrual */
      q.lines.forEach(l => {
        const loc = api.location(l.locationId);
        const share = Math.round(l.media * state.split.landlord);
        state.ledger.unshift({
          id: uid('ST'), landlord: loc ? loc.landlord : null, landlordId: loc ? loc.id : null,
          period: (payload && payload.start || todayISO()).slice(0, 7),
          gross: l.media, share, plays: l.playsPerDay * l.deviceCount * l.days,
          status: 'accruing', bookingId: booking.id
        });
      });
      state.cart = [];
      save();
      notifyFire(booking, q);
      return booking;
    },

    bookings: () => state.bookings,
    campaigns: () => state.campaigns,
    campaign(id) { return state.campaigns.find(c => c.id === id) || null; },
    addCampaign(c) { state.campaigns.unshift(c); save(); return c; },
    updateCampaign(id, patch) {
      const i = state.campaigns.findIndex(c => c.id === id);
      if (i >= 0) { state.campaigns[i] = Object.assign({}, state.campaigns[i], patch); save(); }
    },
    proofOfPlay,

    approvals: () => state.approvals,
    approvalsFor(landlordId) {
      return state.approvals.filter(a => {
        const loc = api.location(a.locationId);
        return loc && (loc.id === landlordId || (a.landlord && loc.landlord &&
          JSON.stringify(a.landlord) === JSON.stringify(loc.landlord)));
      });
    },
    decideApproval(id, status, note) {
      const a = state.approvals.find(x => x.id === id); if (!a) return;
      a.status = status; a.note = note || null; a.decided = todayISO();
      const camp = api.campaign(a.campaignId);
      if (camp) {
        if (status === 'approved') camp.approval = 'approved';
        if (status === 'rejected') { camp.approval = 'rejected'; camp.status = 'rejected'; }
      }
      /* notify the advertiser of the decision */
      const nt = window.LG.notify;
      if (nt && camp) {
        const loc = state.locations.find(l => l.id === a.locationId);
        nt.fire(status === 'approved' ? 'campaign.approved' : 'campaign.rejected', {
          market: loc ? marketOf(loc) : (CFG.geo && CFG.geo.defaultMarket) || 'hk',
          advertiser: { name: camp.advertiser && camp.advertiser.en, email: 'advertiser@example.com' },
          landlord: loc ? { name: loc.landlord && loc.landlord.en, email: 'landlord@example.com' } : null,
          vars: {
            campaign: camp.id, name: camp.advertiser && camp.advertiser.en,
            location: loc ? loc.name.en : '', date: camp.start,
            reason: note && (note.en || note) ? (note.en || note) : ''
          }
        });
      }
      save();
    },

    ledger: () => state.ledger,
    maintenance: () => state.maintenance,
    addMaintenance(t) {
      const rec = Object.assign({ id: uid('MT'), opened: todayISO(), status: 'open', priority: 'medium' }, t);
      state.maintenance.unshift(rec); save(); return rec;
    },
    updateMaintenance(id, patch) {
      const i = state.maintenance.findIndex(m => m.id === id);
      if (i >= 0) { state.maintenance[i] = Object.assign({}, state.maintenance[i], patch); save(); }
    },
    notices: () => state.notices,
    addNotice(n) { state.notices.unshift(Object.assign({ id: uid('NT'), created: todayISO() }, n)); save(); },

    aiDrafts: () => state.aiDrafts,
    saveDraft(d) { state.aiDrafts.unshift(Object.assign({ id: uid('AI'), created: new Date().toISOString() }, d)); save(); },

    /* --- accounts, session and membership --------------------------------
     * Demonstration only: the account list and the session live in this
     * browser. Passwords are never stored in clear — they are kept as a
     * salted FNV-1a digest so a look at localStorage does not hand them over.
     * The production shape is the same API backed by a server session. */
    accounts() { state.accounts = state.accounts || []; return state.accounts; },
    session() { return state.session || null; },
    signedIn() { return !!(state.session && state.session.email); },
    isRole(role) { return !!(state.session && state.session.role === role); },

    signUp(input) {
      const email = String(input.email || '').trim().toLowerCase();
      const name = String(input.name || '').trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, error: 'auth.err_email' };
      if (String(input.password || '').length < 6) return { ok: false, error: 'auth.err_password' };
      if (input.password !== input.password2) return { ok: false, error: 'auth.err_password2' };
      if (!name) return { ok: false, error: 'auth.err_name' };
      if (api.accountByEmail(email)) return { ok: false, error: 'auth.err_exists' };
      const tier = input.role === 'landlord' ? 'free' : 'free';
      const rec = {
        id: uid('AC'), role: input.role || 'advertiser', name,
        company: String(input.company || '').trim(),
        email, hash: hashPassword(input.password, email), tier,
        since: todayISO(), plan: input.plan || null
      };
      api.accounts().unshift(rec);
      const session = api.setSession(rec);
      notifyFire('membership.joined', {
        market: state.market || 'hk',
        advertiser: { name, email },
        vars: { name, tier: 'Free', price: '0', benefits: tierBenefits('free') }
      });
      return { ok: true, session, account: rec };
    },
    accountByEmail(email) {
      const e = String(email || '').trim().toLowerCase();
      return api.accounts().find(a => a.email === e) || null;
    },
    signIn(input) {
      const email = String(input.email || '').trim().toLowerCase();
      const password = String(input.password || '');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, error: 'auth.err_email' };
      if (!password) return { ok: false, error: 'auth.err_password' };
      const demo = (CFG.auth && CFG.auth.demoAccounts || []).find(a => a.email.toLowerCase() === email);
      const mine = api.accountByEmail(email);
      const account = mine || (demo ? Object.assign({ id: 'DEMO', since: todayISO() }, demo) : null);
      if (!account) return { ok: false, error: 'auth.err_creds' };
      const okPw = mine
        ? mine.hash === hashPassword(password, email)
        : password === (demo && demo.password);
      if (!okPw) return { ok: false, error: 'auth.err_creds' };
      if (input.role && account.role !== input.role) return { ok: false, error: 'auth.err_role', account };
      const session = api.setSession(account);
      return { ok: true, session, account };
    },
    setSession(account) {
      state.session = {
        id: account.id, role: account.role, name: account.name, company: account.company || '',
        email: account.email, tier: account.tier || 'free', since: account.since || todayISO()
      };
      save();
      return state.session;
    },
    signOut() { state.session = null; save(); },
    updateAccount(patch) {
      if (!state.session) return null;
      state.session = Object.assign({}, state.session, patch);
      const mine = api.accountByEmail(state.session.email);
      if (mine) Object.assign(mine, patch);
      save();
      return state.session;
    },
    tiers() { return (CFG.membership && CFG.membership.tiers) || []; },
    tier: id => ((CFG.membership && CFG.membership.tiers) || []).find(t => t.id === (id || (state.session && state.session.tier))) || null,
    setTier(tierId) {
      const t = api.tier(tierId);
      if (!t) return { ok: false };
      /* store.js never depends on app.js: fall back to plain formatting when
       * the shell is not loaded (notifications, tests, server-side reuse). */
      const shell = window.LG.app || {};
      const money = shell.money || (n => CFG.currency.symbol + Number(n || 0).toLocaleString('en-US'));
      const tr = shell.t || (k => {
        const e = (window.LG_I18N || {})[k];
        return e ? (e.en || k) : k;
      });
      const before = (state.session && state.session.tier) || 'free';
      if (state.session) api.updateAccount({ tier: tierId });
      else state.pendingTier = tierId;
      const price = t.priceHkd == null ? '—' : money(t.priceHkd);
      notifyFire('membership.joined', {
        market: state.market || 'hk',
        advertiser: { name: (state.session && state.session.name) || 'Member', email: (state.session && state.session.email) || 'member@example.com' },
        vars: { name: (state.session && state.session.name) || 'Member', tier: tr('mem.tier_' + tierId + '.name'), price, benefits: tierBenefits(tierId) },
        facts: [['Plan', tierId], ['Price', price]]
      });
      save();
      return { ok: true, tier: t, previous: before };
    },

    /* --- enquiries -------------------------------------------------------- */
    enquiries: () => (state.enquiries = state.enquiries || []),
    addEnquiry(input) {
      const e = Object.assign({}, input);
      e.id = 'ENQ-' + new Date().getFullYear() + '-' + String(api.enquiries().length + 1).padStart(4, '0');
      e.ref = e.id;
      e.when = new Date().toISOString();
      e.status = 'queued';
      api.enquiries().unshift(e);
      /* Both sides of the handover are notified from one event: the sales
       * inbox and an acknowledgement to the enquirer, in their language. */
      const sent = notifyFire('enquiry.received', {
        market: e.market === 'th' ? 'th' : 'hk',
        lang: e.lang,
        enquirer: { name: e.name, email: e.email, phone: e.phone, company: e.company },
        sales: { name: CFG.contact.salesName, email: CFG.contact.email },
        vars: {
          name: e.name || '—', company: e.company || '—', email: e.email || '—', phone: e.phone || '—',
          market: i18nText('enq.market_' + (e.market || 'hk'), e.lang) || (e.market || 'hk'),
          role: i18nText('enq.role_' + e.role, e.lang) || e.role,
          interests: e.interests.map(i => i18nText('enq.interest_' + i, e.lang) || i).join(', '),
          device: e.device ? (i18nText('enq.device_' + e.device, e.lang) || e.device) : '—',
          budget: e.budget ? (i18nText('enq.budget_' + e.budget, e.lang) || e.budget) : '—',
          timeline: e.timeline ? (i18nText('enq.timeline_' + e.timeline, e.lang) || e.timeline) : '—',
          channel: e.channel ? (i18nText('enq.channel_' + e.channel, e.lang) || e.channel) : '—',
          message: e.message || '—', ref: e.ref, whatsapp: CFG.contact.whatsappDisplay,
          line: CFG.contact.line, wechat: CFG.contact.wechatId
        },
        facts: [['Reference', e.ref], ['Name', e.name], ['Email', e.email], ['Market', e.market], ['Interests', e.interests.join(', ')]],
        footer: CFG.contact.hours
      });
      e.messages = sent.map(m => m.id);
      save();
      return e;
    },
    markEnquirySent(id, status) {
      const e = api.enquiries().find(x => x.id === id);
      if (e) { e.status = status || 'sent'; save(); }
      return e;
    },

    /* --- assistant transcript -------------------------------------------- */
    chatLog: () => (state.chatLog = state.chatLog || []),
    addChat(entry) {
      const limit = (CFG.chat && CFG.chat.transcriptLimit) || 60;
      state.chatLog = api.chatLog();
      state.chatLog.push(Object.assign({ when: new Date().toISOString() }, entry));
      if (state.chatLog.length > limit) state.chatLog = state.chatLog.slice(-limit);
      save();
      return state.chatLog[state.chatLog.length - 1];
    },
    clearChat() { state.chatLog = []; save(); },
    handOff(payload) {
      const transcript = api.chatLog().map(m => (m.from === 'you' ? 'Visitor: ' : 'Assistant: ') + m.text).join('\n');
      const sent = notifyFire('chat.handoff', {
        market: state.market || 'hk',
        lang: (payload && payload.lang) || 'en',
        enquirer: { name: (payload && payload.name) || 'Website visitor', email: (payload && payload.email) || CFG.contact.email },
        sales: { name: CFG.contact.salesName, email: CFG.contact.email },
        vars: Object.assign({
          topic: (payload && payload.topic) || 'General enquiry',
          question: (payload && payload.question) || '—',
          answer: (payload && payload.answer) || '—',
          transcript: transcript || '—'
        }, payload || {}),
        facts: [['Topic', (payload && payload.topic) || 'General enquiry'], ['Channel', 'Website assistant']]
      });
      return sent;
    },

    /* settings */
    setLang(code) { state.lang = code; save(); },
    setSplit(split) { state.split = Object.assign({}, split); save(); },

    /* helpers reused by pages */
    util: { uid, todayISO, addDays, daysBetween, seedFrom, clone, hashPassword }
  };

  window.LG = window.LG || {};
  window.LG.store = api;
})();
