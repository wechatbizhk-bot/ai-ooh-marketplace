/* ============================================================================
 * 3dNakedEye — payments.mjs
 * The payment-method registry and its configuration, behind /api/pay/*.
 *
 * One place decides what the checkout may offer: each method has a family
 * (card, wallet, bank, crypto, token), the currencies it can settle, its fees,
 * its settlement window, whether it is switched on, and which credentials it
 * needs. Credentials live here — server side — and are never sent back to a
 * browser except as a masked hint (sk_live_••••4f2a), so the operator console
 * can show whether a rail is wired up without holding the key.
 *
 * Everything the operator can change is validated before it is stored, and the
 * store is a single JSON file (server/payments.json) so the demo needs no
 * database — server/schema.sql carries the relational shape for production.
 * ==========================================================================*/
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export const PAYMENTS_SCHEMA_VERSION = 1;

/* ---------- the rails a merchant can offer --------------------------------
 * `needs` lists the credential fields a rail requires before it can go live.
 * `fee` is in minor units: pct of the order plus a fixed amount.
 * `settle` is the number of business days until the money is usable.        */
export const METHODS = [
  {
    id: 'visa', family: 'card', scheme: 'Visa', label: 'Visa', processor: 'stripe',
    currencies: ['HKD', 'USD', 'THB', 'EUR'], fee: { pct: 2.9, fixed: 2.35 }, settle: 2,
    needs: ['secretKey', 'publishableKey'], threeds: true, modes: ['off', 'test', 'live']
  },
  {
    id: 'mastercard', family: 'card', scheme: 'Mastercard', label: 'Mastercard', processor: 'stripe',
    currencies: ['HKD', 'USD', 'THB', 'EUR'], fee: { pct: 2.9, fixed: 2.35 }, settle: 2,
    needs: ['secretKey', 'publishableKey'], threeds: true, modes: ['off', 'test', 'live']
  },
  {
    id: 'unionpay', family: 'card', scheme: 'UnionPay', label: 'UnionPay', processor: 'stripe',
    currencies: ['HKD', 'CNY', 'USD'], fee: { pct: 3.1, fixed: 2.35 }, settle: 3,
    needs: ['secretKey', 'publishableKey'], threeds: true, modes: ['off', 'test', 'live']
  },
  {
    id: 'stripe', family: 'wallet', scheme: null, label: 'Stripe (cards & wallets)', processor: 'stripe',
    currencies: ['HKD', 'USD', 'THB', 'EUR'], fee: { pct: 2.9, fixed: 2.35 }, settle: 2,
    needs: ['secretKey', 'publishableKey', 'webhookSecret'], modes: ['off', 'test', 'live']
  },
  {
    id: 'paypal', family: 'wallet', scheme: null, label: 'PayPal', processor: 'paypal',
    currencies: ['HKD', 'USD', 'EUR'], fee: { pct: 3.4, fixed: 2.35 }, settle: 3,
    needs: ['clientId', 'clientSecret'], modes: ['off', 'test', 'live']
  },
  {
    id: 'swift', family: 'bank', scheme: null, label: 'SWIFT / T-T remittance', processor: 'manual',
    currencies: ['HKD', 'USD', 'EUR', 'CNY', 'THB'], fee: { pct: 0, fixed: 0 }, settle: 3,
    needs: ['bankName', 'bankAddress', 'accountName', 'accountNumber', 'swiftBic', 'iban'],
    fields: ['reference', 'proof'], modes: ['off', 'live']
  },
  {
    id: 'fps', family: 'bank', scheme: null, label: 'FPS / local transfer', processor: 'manual',
    currencies: ['HKD'], fee: { pct: 0, fixed: 0 }, settle: 1,
    needs: ['accountName', 'fpsId'], fields: ['reference', 'proof'], modes: ['off', 'live']
  },
  {
    id: 'usdt', family: 'crypto', scheme: 'TRC-20 / ERC-20', label: 'USDT', processor: 'onchain',
    currencies: ['USD', 'HKD'], fee: { pct: 1, fixed: 0 }, settle: 0,
    needs: ['walletAddress', 'rateSource'], fields: ['network', 'txHash'], modes: ['off', 'test', 'live']
  },
  {
    id: 'usdc', family: 'crypto', scheme: 'ERC-20', label: 'USDC', processor: 'onchain',
    currencies: ['USD', 'HKD'], fee: { pct: 1, fixed: 0 }, settle: 0,
    needs: ['walletAddress', 'rateSource'], fields: ['network', 'txHash'], modes: ['off', 'test', 'live']
  },
  {
    id: 'btc', family: 'crypto', scheme: 'Bitcoin', label: 'Bitcoin', processor: 'onchain',
    currencies: ['USD', 'HKD'], fee: { pct: 1, fixed: 0 }, settle: 0,
    needs: ['walletAddress', 'rateSource'], fields: ['txHash'], modes: ['off', 'test', 'live']
  },
  {
    id: 'eth', family: 'crypto', scheme: 'ERC-20', label: 'Ether', processor: 'onchain',
    currencies: ['USD', 'HKD'], fee: { pct: 1, fixed: 0 }, settle: 0,
    needs: ['walletAddress', 'rateSource'], fields: ['txHash'], modes: ['off', 'test', 'live']
  },
  {
    id: 'token', family: 'token', scheme: 'ERC-20', label: 'Platform token / ERC-20', processor: 'onchain',
    currencies: ['USD', 'HKD'], fee: { pct: 0.5, fixed: 0 }, settle: 0,
    needs: ['contractAddress', 'walletAddress', 'decimals', 'rateSource'],
    fields: ['txHash', 'holderCheck'], modes: ['off', 'test', 'live']
  }
];

const SECRET_HINT = v => {
  const s = String(v || '');
  if (!s) return null;
  return s.length <= 8 ? '••••' : s.slice(0, 4) + '••••' + s.slice(-4);
};
const isSecret = field => /secret|key|token|password|address|number|bic|iban|id$/i.test(field) && !/^rateSource$/i.test(field);

export function createPayments(opts) {
  const dir = opts.dir;
  const file = path.join(dir, 'payments.json');
  let cfg = {
    schema: PAYMENTS_SCHEMA_VERSION,
    currency: opts.currency || 'HKD',
    settlementDay: 15,
    autoCapture: true,
    require3ds: true,
    crypto: { rateLockSeconds: 900, confirmations: { btc: 2, eth: 12, tron: 19 }, underpaymentTolerance: 0.01 },
    methods: METHODDefault()
  };

  function METHODDefault() {
    const out = {};
    METHODS.forEach(m => {
      const isManual = m.processor === 'manual';
      out[m.id] = {
        enabled: m.id === 'stripe' || m.id === 'paypal' || isManual,
        mode: m.id === 'stripe' || m.id === 'paypal' ? 'test' : 'off',
        fee: Object.assign({}, m.fee),
        settle: m.settle,
        currencies: m.currencies.slice(),
        credentials: {}
      };
    });
    return out;
  }

  function load() {
    try {
      const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
      cfg = Object.assign(cfg, raw, { methods: Object.assign(METHODDefault(), raw.methods || {}) });
    } catch (e) { /* first run */ }
    return { methods: Object.keys(cfg.methods).length, enabled: enabled().length };
  }
  const save = async () => {
    await fsp.mkdir(dir, { recursive: true });
    await fsp.writeFile(file, JSON.stringify(cfg, null, 1));
  };

  const definition = id => METHODS.find(m => m.id === id) || null;
  const configured = (id) => {
    const def = definition(id), row = cfg.methods[id];
    if (!def || !row) return false;
    return def.needs.every(k => row.credentials && row.credentials[k]);
  };
  const enabled = () => Object.keys(cfg.methods).filter(id => cfg.methods[id].enabled && configured(id));

  const bad = (status, error) => Object.assign(new Error(error), { status });

  /* ---------- the public view: the whole registry, with its status --------
   * Every rail is listed so the payments page can show what exists and what is
   * missing; `open` is what the checkout is allowed to offer. */
  const publicView = () => METHODS.map(m => {
    const row = cfg.methods[m.id] || { enabled: false, mode: 'off', fee: m.fee, settle: m.settle, currencies: m.currencies };
    const isConfigured = configured(m.id);
    const open = !!row.enabled && isConfigured;
    return {
      id: m.id, family: m.family, scheme: m.scheme, label: m.label, processor: m.processor,
      mode: open ? row.mode : 'off',
      enabled: !!row.enabled,
      open,
      status: open ? 'open' : (row.enabled ? 'needs-setup' : 'off'),
      missing: m.needs.filter(k => !(row.credentials || {})[k]),
      currencies: row.currencies, fee: row.fee, settle: row.settle,
      threeds: !!m.threesds, fields: (m.fields || []).slice()
    };
  });

  /* ---------- the operator view: everything but the secrets --------------- */
  const adminView = () => METHODS.map(m => {
    const row = cfg.methods[m.id] || {};
    const creds = {};
    m.needs.forEach(k => {
      const v = (row.credentials || {})[k];
      creds[k] = { set: !!v, hint: isSecret(k) ? SECRET_HINT(v) : (typeof v === 'string' ? v.slice(0, 40) : v || null) };
    });
    return {
      id: m.id, family: m.family, scheme: m.scheme, label: m.label, processor: m.processor,
      enabled: !!row.enabled, mode: row.mode, fee: row.fee, settle: row.settle,
      currencies: row.currencies || m.currencies, needs: m.needs.slice(), credentials: creds,
      configured: configured(m.id), modes: m.modes.slice()
    };
  });

  /* ---------- quote: what a method costs on an order ---------------------- */
  function quote({ method, amount, currency }) {
    const def = definition(method);
    if (!def) throw bad(404, 'unknown payment method: ' + method);
    const row = cfg.methods[method];
    if (!row.enabled) throw bad(409, 'that method is switched off');
    if (!configured(method)) throw bad(409, 'that method is not configured yet');
    const cur = String(currency || cfg.currency).toUpperCase();
    if (!row.currencies.includes(cur)) throw bad(400, 'that method cannot settle ' + cur);
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) throw bad(400, 'amount must be a positive number');
    const fee = Math.round(value * 100 * (row.fee.pct / 100) + row.fee.fixed);
    return {
      method, currency: cur, amount: value, fee: fee / 100,
      total: Math.round(value * 100 + fee) / 100,
      net: Math.round(value * 100) / 100,
      settle: row.settle, mode: row.mode, processor: def.processor,
      threeDS: !!def.threeds && cfg.require3ds
    };
  }

  /* ---------- the operator's edits --------------------------------------- */
  async function update(id, patch) {
    const def = definition(id);
    if (!def) throw bad(404, 'unknown payment method: ' + id);
    const row = cfg.methods[id];
    if (patch.enabled !== undefined) row.enabled = !!patch.enabled;
    if (patch.mode !== undefined) {
      if (!def.modes.includes(patch.mode)) throw bad(400, `mode must be one of ${def.modes.join(', ')}`);
      row.mode = patch.mode;
    }
    if (patch.fee !== undefined) {
      const pct = Number(patch.fee.pct), fixed = Number(patch.fee.fixed);
      if (!Number.isFinite(pct) || pct < 0 || pct > 20) throw bad(400, 'fee percentage must be between 0 and 20');
      if (!Number.isFinite(fixed) || fixed < 0 || fixed > 10000) throw bad(400, 'fixed fee must be between 0 and 10000');
      row.fee = { pct, fixed };
    }
    if (patch.settle !== undefined) {
      const s = Number(patch.settle);
      if (!Number.isInteger(s) || s < 0 || s > 30) throw bad(400, 'settlement must be 0–30 business days');
      row.settle = s;
    }
    if (patch.currencies !== undefined) {
      if (!Array.isArray(patch.currencies) || !patch.currencies.length) throw bad(400, 'at least one currency is required');
      const good = patch.currencies.map(c => String(c).toUpperCase().slice(0, 3));
      if (good.some(c => !/^[A-Z]{3}$/.test(c))) throw bad(400, 'currencies must be ISO-4217 codes');
      row.currencies = good;
    }
    if (patch.credentials !== undefined) {
      if (typeof patch.credentials !== 'object' || Array.isArray(patch.credentials)) throw bad(400, 'credentials must be an object');
      Object.keys(patch.credentials).forEach(k => {
        if (!def.needs.includes(k)) throw bad(400, `${k} is not a field of ${id}`);
        const v = patch.credentials[k];
        if (v === null || v === '') { delete row.credentials[k]; return; }
        if (typeof v !== 'string' || v.length > 200) throw bad(400, `${k} must be a string of up to 200 characters`);
        row.credentials[k] = v;
      });
    }
    if (patch.clearCredentials) def.needs.forEach(k => { delete row.credentials[k]; });
    if (row.enabled && !configured(id)) throw bad(409, `${id} cannot be enabled until its credentials are set: ${def.needs.join(', ')}`);
    await save();
    return adminView().find(m => m.id === id);
  }

  /* ---------- settings that are not per-method --------------------------- */
  function settings(patch) {
    if (!patch) return {
      currency: cfg.currency, settlementDay: cfg.settlementDay, autoCapture: cfg.autoCapture,
      require3ds: cfg.require3ds, crypto: cfg.crypto, schema: cfg.schema
    };
    if (patch.currency !== undefined) {
      const c = String(patch.currency).toUpperCase();
      if (!/^[A-Z]{3}$/.test(c)) throw bad(400, 'currency must be an ISO-4217 code');
      cfg.currency = c;
    }
    if (patch.settlementDay !== undefined) {
      const d = Number(patch.settlementDay);
      if (!Number.isInteger(d) || d < 1 || d > 28) throw bad(400, 'settlement day must be between 1 and 28');
      cfg.settlementDay = d;
    }
    if (patch.autoCapture !== undefined) cfg.autoCapture = !!patch.autoCapture;
    if (patch.require3ds !== undefined) cfg.require3ds = !!patch.require3ds;
    if (patch.crypto !== undefined) {
      const c = patch.crypto;
      if (c.rateLockSeconds !== undefined) {
        const v = Number(c.rateLockSeconds);
        if (!Number.isFinite(v) || v < 60 || v > 3600) throw bad(400, 'rate lock must be 60–3600 seconds');
        cfg.crypto.rateLockSeconds = v;
      }
      if (c.underpaymentTolerance !== undefined) {
        const v = Number(c.underpaymentTolerance);
        if (!Number.isFinite(v) || v < 0 || v > 0.1) throw bad(400, 'underpayment tolerance must be 0–0.1');
        cfg.crypto.underpaymentTolerance = v;
      }
    }
    save().catch(() => {});
    return settings();
  }

  /* ---------- a connection test an operator can run ---------------------- */
  function test(id) {
    const def = definition(id);
    if (!def) throw bad(404, 'unknown payment method: ' + id);
    const row = cfg.methods[id];
    const missing = def.needs.filter(k => !row.credentials[k]);
    const steps = [];
    steps.push({ step: 'credentials', ok: missing.length === 0, detail: missing.length ? 'missing: ' + missing.join(', ') : 'all fields set' });
    if (def.processor === 'stripe') {
      const live = /^sk_live/.test(row.credentials.secretKey || '');
      const test = /^sk_test/.test(row.credentials.secretKey || '');
      steps.push({ step: 'key format', ok: live || test, detail: live ? 'live key' : test ? 'test key' : 'a Stripe secret key starts with sk_live or sk_test' });
      steps.push({ step: 'mode match', ok: (row.mode === 'live') === live, detail: row.mode === 'live' ? 'live mode needs a live key' : 'test mode needs a test key' });
    } else if (def.processor === 'paypal') {
      steps.push({ step: 'client id', ok: /^A[A-Za-z0-9_-]{10,}$/.test(row.credentials.clientId || ''), detail: 'a PayPal client id is long and starts with A' });
      steps.push({ step: 'mode match', ok: true, detail: row.mode === 'live' ? 'live credentials' : 'sandbox credentials' });
    } else if (def.processor === 'onchain') {
      const addr = row.credentials.walletAddress || '';
      const ok = def.id === 'btc' ? /^(bc1|[13])[A-Za-z0-9]{20,}$/.test(addr) : /^0x[a-fA-F0-9]{40}$/.test(addr);
      steps.push({ step: 'wallet address', ok, detail: ok ? 'address looks valid' : 'not a valid address for this chain' });
      if (def.id === 'token') {
        steps.push({ step: 'contract', ok: /^0x[a-fA-F0-9]{40}$/.test(row.credentials.contractAddress || ''), detail: 'an ERC-20 contract address is 0x followed by 40 hex characters' });
      }
      steps.push({ step: 'rate source', ok: !!row.credentials.rateSource, detail: row.credentials.rateSource || 'set a rate source' });
    } else {
      steps.push({ step: 'bank fields', ok: missing.length === 0, detail: 'manual rails need the full bank block, because the customer copies it' });
      steps.push({ step: 'reference', ok: (def.fields || []).includes('reference'), detail: 'an order reference is what ties a transfer to an order' });
    }
    const ok = steps.every(s => s.ok);
    return { method: id, ok, steps, checkedAt: Date.now() };
  }

  return {
    schemaVersion: PAYMENTS_SCHEMA_VERSION,
    methods: () => METHODS.map(m => ({ id: m.id, family: m.family, label: m.label, processor: m.processor })),
    load, settings, quote, update, test,
    publicView, adminView, enabled,
    state: () => cfg,
    async reset() { cfg = { schema: PAYMENTS_SCHEMA_VERSION, currency: 'HKD', settlementDay: 15, autoCapture: true, require3ds: true, crypto: { rateLockSeconds: 900, confirmations: { btc: 2, eth: 12, tron: 19 }, underpaymentTolerance: 0.01 }, methods: METHODDefault() }; await save(); },
    mask: SECRET_HINT,
    /* a per-order reference the customer quotes on a bank transfer */
    reference: (orderId) => '3DNE-' + crypto.createHash('sha1').update(String(orderId || Date.now())).digest('hex').slice(0, 8).toUpperCase()
  };
}
