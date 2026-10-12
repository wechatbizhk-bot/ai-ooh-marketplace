#!/usr/bin/env node
/* ============================================================================
 * 3dNakedEye — DeepSeek proxy + static site server
 *
 *   node server/deepseek-proxy.mjs
 *   → http://localhost:8787/index.html      (static site)
 *   → http://localhost:8787/api/generate    (AI proxy for the AI Studio)
 *
 * Why a proxy: the DeepSeek API key must never be shipped to a browser.
 * The studio posts the creative brief here; this process holds the key,
 * calls https://api.deepseek.com and returns JSON.
 *
 * No dependencies — Node 18+ only (global fetch).
 *
 * Environment:
 *   DEEPSEEK_API_KEY   required for live generation (sk-...)
 *   PORT               default 8787
 *   ALLOW_ORIGIN       default * (restrict to your site origin in production)
 *   DEEPSEEK_MODEL     default deepseek-flash
 *   DEEPSEEK_BASE      default https://api.deepseek.com
 *
 * A server/.env file with KEY=VALUE lines is read automatically if present.
 * ==========================================================================*/

import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createAffiliate } from './affiliate.mjs';
import { createPayments } from './payments.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = path.resolve(HERE, '..');

/* --- tiny .env loader ------------------------------------------------------ */
try {
  const envFile = path.join(HERE, '.env');
  if (fs.existsSync(envFile)) {
    for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
} catch { /* ignore */ }

const PORT = Number(process.env.PORT || 8787);
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || '*';
const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-flash';
const BASE = (process.env.DEEPSEEK_BASE || 'https://api.deepseek.com').replace(/\/+$/, '');
const KEY = process.env.DEEPSEEK_API_KEY || '';

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8',
  '.mp4': 'video/mp4', '.woff2': 'font/woff2'
};

const json = (res, status, body) => {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Access-Control-Allow-Origin': ALLOW_ORIGIN,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Cache-Control': 'no-store'
  });
  res.end(payload);
};

const readBody = req => new Promise((resolve, reject) => {
  let raw = '';
  req.on('data', c => {
    raw += c;
    if (raw.length > 2_000_000) { reject(new Error('payload too large')); req.destroy(); }
  });
  req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch (e) { reject(e); } });
  req.on('error', reject);
});

/* --- payments --------------------------------------------------------------
 * POST /api/pay/intent  { provider, method, amount, currency, ref }
 *
 * Stripe and PayPal are called for real when their keys are present; without
 * keys the endpoint answers in 'simulated' mode so the front end can be
 * developed and demoed end to end. Crypto quotes are priced from a public
 * rate feed when reachable, otherwise from the configured fallback rates.
 * -------------------------------------------------------------------------*/
const PAY = {
  currency: (process.env.PAY_CURRENCY || 'HKD').toUpperCase(),
  stripeKey: process.env.STRIPE_SECRET_KEY || '',
  paypalId: process.env.PAYPAL_CLIENT_ID || '',
  paypalSecret: process.env.PAYPAL_SECRET || '',
  paypalBase: process.env.PAYPAL_BASE || 'https://api-m.sandbox.paypal.com',
  cryptoWallet: process.env.CRYPTO_WALLET_ADDRESS || '',
  fallbackRates: { USDT: 7.8, USDC: 7.8, BTC: 610000, ETH: 26500 }
};

const rid = (p, n = 10) => p + Array.from({ length: n }, () => '0123456789abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 36)]).join('');

async function stripeIntent({ amount, currency, ref }) {
  const minor = Math.round(amount * 100);
  if (!PAY.stripeKey) {
    return { provider: 'stripe', mode: 'simulated', id: rid('pi_sim_'), clientSecret: rid('pi_sim_secret_', 24), amount: minor, currency };
  }
  const body = new URLSearchParams({
    amount: String(minor),
    currency: currency.toLowerCase(),
    'automatic_payment_methods[enabled]': 'true',
    'metadata[ref]': ref || '',
    description: '3dNakedEye campaign booking ' + (ref || '')
  });
  const res = await fetch('https://api.stripe.com/v1/payment_intents', {
    method: 'POST',
    headers: { Authorization: `Bearer ${PAY.stripeKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  const data = await res.json();
  if (!res.ok) { const e = new Error('stripe: ' + (data.error?.message || res.status)); e.status = 502; throw e; }
  return { provider: 'stripe', mode: 'live', id: data.id, clientSecret: data.client_secret, amount: data.amount, currency: data.currency };
}

async function paypalToken() {
  const auth = Buffer.from(`${PAY.paypalId}:${PAY.paypalSecret}`).toString('base64');
  const res = await fetch(`${PAY.paypalBase}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials'
  });
  const data = await res.json();
  if (!res.ok) { const e = new Error('paypal auth: ' + (data.error_description || res.status)); e.status = 502; throw e; }
  return data.access_token;
}

async function paypalOrder({ amount, currency, ref }) {
  if (!PAY.paypalId || !PAY.paypalSecret) {
    return { provider: 'paypal', mode: 'simulated', orderId: rid('PAYPAL-SIM-', 8).toUpperCase(), status: 'CREATED', amount, currency };
  }
  const token = await paypalToken();
  const res = await fetch(`${PAY.paypalBase}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: ref || '3dNakedEye',
        description: '3dNakedEye campaign booking',
        amount: { currency_code: currency, value: amount.toFixed(2) }
      }]
    })
  });
  const data = await res.json();
  if (!res.ok) { const e = new Error('paypal order: ' + (data.message || res.status)); e.status = 502; throw e; }
  return { provider: 'paypal', mode: 'live', orderId: data.id, status: data.status, amount, currency };
}

async function cryptoRates() {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether,usd-coin,bitcoin,ethereum&vs_currencies=hkd', { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error(String(res.status));
    const d = await res.json();
    return {
      source: 'coingecko',
      USDT: d.tether?.hkd || PAY.fallbackRates.USDT,
      USDC: d['usd-coin']?.hkd || PAY.fallbackRates.USDC,
      BTC: d.bitcoin?.hkd || PAY.fallbackRates.BTC,
      ETH: d.ethereum?.hkd || PAY.fallbackRates.ETH
    };
  } catch {
    return Object.assign({ source: 'fallback' }, PAY.fallbackRates);
  }
}

async function cryptoInvoice({ amount, coin, network, ref }) {
  const rates = await cryptoRates();
  const code = (coin || 'USDT').toUpperCase();
  const rate = rates[code] || PAY.fallbackRates[code] || PAY.fallbackRates.USDT;
  const units = Math.round((amount * 1.005 / rate) * 1e6) / 1e6;   /* 0.5% volatility buffer */
  const address = PAY.cryptoWallet || (code === 'BTC'
    ? 'bc1q' + rid('', 38)
    : network === 'TRC20' ? 'T' + rid('', 33) : '0x' + rid('', 40));
  return {
    provider: 'crypto', mode: PAY.cryptoWallet ? 'live' : 'simulated',
    coin: code, network: network || 'TRC20', address, units, rate,
    rateSource: rates.source, currency: PAY.currency, ref: ref || '',
    expiresAt: new Date(Date.now() + 15 * 60000).toISOString()
  };
}

/* --- email automation delivery --------------------------------------------
 * POST /api/notify/email  { messages: [{ to, subject, text, html, eml, lang, trigger }] }
 *
 * With SMTP credentials the messages are sent over SMTP with implicit TLS
 * (port 465). Without credentials — the default for this demo — every message
 * is written to server/outbox as a .eml file and reported as 'queued', so the
 * whole automation flow can be demonstrated offline and audited afterwards.
 * -------------------------------------------------------------------------*/
const OUTBOX = path.join(HERE, 'outbox');
const SMTP = {
  host: process.env.SMTP_HOST || '',
  port: Number(process.env.SMTP_PORT || 465),
  user: process.env.SMTP_USER || '',
  pass: process.env.SMTP_PASS || '',
  from: process.env.NOTIFY_FROM || 'no-reply@3dnakedeye.example'
};

async function writeEml(msg, id) {
  await fsp.mkdir(OUTBOX, { recursive: true });
  const file = path.join(OUTBOX, id + '.eml');
  const raw = msg.eml || `From: ${SMTP.from}\r\nTo: ${msg.to}\r\nSubject: ${msg.subject}\r\n` +
    `MIME-Version: 1.0\r\nContent-Type: text/html; charset=utf-8\r\n\r\n${msg.html || msg.text || ''}`;
  await fsp.writeFile(file, raw, 'utf8');
  return file;
}

/* Minimal SMTP state machine over implicit TLS. */
function smtpSend(msg) {
  return new Promise((resolve, reject) => {
    if (SMTP.port !== 465) {
      return reject(new Error('only implicit TLS port 465 is implemented — set SMTP_PORT=465'));
    }
    const socket = tls.connect({ host: SMTP.host, port: SMTP.port, servername: SMTP.host });
    const body = [
      `From: ${SMTP.from}`, `To: ${msg.to}`, `Subject: ${msg.subject}`,
      'MIME-Version: 1.0', 'Content-Type: text/html; charset=utf-8', '', msg.html || msg.text || ''
    ].join('\r\n');
    let buf = '', stage = 0;
    const send = line => socket.write(line + '\r\n');
    socket.setTimeout(15000, () => { socket.destroy(); reject(new Error('smtp timeout')); });
    socket.on('error', reject);
    socket.on('data', chunk => {
      buf += chunk.toString('utf8');
      if (!buf.endsWith('\r\n')) return;
      const code = buf.slice(0, 3);
      buf = '';
      if (code[0] === '4' || code[0] === '5') { socket.destroy(); return reject(new Error('smtp ' + code)); }
      if (code === '220') return send('EHLO 3dnakedeye.local');
      if (code === '250') {
        if (stage === 0) { stage = 1; return send('AUTH LOGIN'); }
        if (stage === 2) { stage = 3; return send(Buffer.from(SMTP.user).toString('base64')); }
        if (stage === 4) { stage = 5; return send(`MAIL FROM:<${SMTP.from}>`); }
        if (stage === 6) { stage = 7; return send(`RCPT TO:<${msg.to}>`); }
        if (stage === 8) { stage = 9; return send('DATA'); }
        return;
      }
      if (code === '334') {
        if (stage === 1) { stage = 2; return send(Buffer.from(SMTP.user).toString('base64')); }
        if (stage === 3) { stage = 4; return send(Buffer.from(SMTP.pass).toString('base64')); }
        return;
      }
      if (code === '354') { stage = 10; return socket.write(body + '\r\n.\r\n'); }
      if (stage === 10) { socket.end('QUIT'); resolve({ status: 'sent' }); }
    });
  });
}

async function deliverMail(messages) {
  const results = [];
  for (const m of messages) {
    const id = 'MSG-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
    let file = null;
    try { file = await writeEml(m, id); } catch { /* disk is best effort */ }
    if (SMTP.host && SMTP.user) {
      try { await smtpSend(m); results.push({ id, to: m.to, status: 'sent', file }); continue; }
      catch (e) { console.error('[mail] smtp failed:', e.message); }
    }
    console.log(`[mail] queued ${id} → ${m.to} (${m.trigger || 'manual'})${file ? ' → ' + path.basename(file) : ''}`);
    results.push({ id, to: m.to, status: 'queued', file });
  }
  return results;
}

/* --- system prompt: the studio contract ----------------------------------- */
const SYSTEM_PROMPT = [
  'You are the creative engine of 3dNakedEye, an out-of-home (DOOH) advertising marketplace in Hong Kong.',
  'You write for three surfaces: 1:1 rotating LED hologram fans (pure black background, 10-30 s loop, no small text),',
  '9:16 vertical screens in lift lobbies and queue lines, and 16:9 wall screens at entrances and dining areas.',
  'Obey the requested JSON schema exactly. Headlines must be short, concrete and free of unsupported claims.',
  'Never invent prices, medical or financial claims, or regulatory approvals.',
  'Return JSON only — no markdown fences, no commentary.'
].join(' ');

/* --- DeepSeek call -------------------------------------------------------- */
async function generate(payload) {
  if (!KEY) {
    const err = new Error('DEEPSEEK_API_KEY is not set on the server');
    err.status = 503;
    throw err;
  }
  const model = payload.model || MODEL;
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: String(payload.prompt || '') }
  ];
  const body = {
    model,
    messages,
    temperature: typeof payload.temperature === 'number' ? payload.temperature : 1.0,
    max_tokens: payload.max_tokens || 1400,
    stream: false
  };
  if (payload.json !== false) body.response_format = { type: 'json_object' };

  const started = Date.now();
  const res = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  if (!res.ok) {
    const err = new Error(`DeepSeek API ${res.status}: ${text.slice(0, 400)}`);
    err.status = res.status === 401 ? 401 : 502;
    throw err;
  }
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('DeepSeek returned non-JSON'); }
  const content = data.choices?.[0]?.message?.content || '';
  console.log(`[ai] ${model} ${Date.now() - started} ms · prompt ${data.usage?.prompt_tokens ?? '?'} tok · completion ${data.usage?.completion_tokens ?? '?'} tok`);
  return {
    text: content,
    model: data.model || model,
    usage: data.usage || null,
    latencyMs: Date.now() - started
  };
}

/* --- front-of-site: enquiries, assistant, WhatsApp ------------------------ */
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'commercialisation.ai@gmail.com';
const WA = {
  token: process.env.WHATSAPP_TOKEN || '',
  phoneId: process.env.WHATSAPP_PHONE_ID || '',
  to: (process.env.WHATSAPP_TO || '85297398018').replace(/[^\d]/g, ''),
  version: process.env.WHATSAPP_API_VERSION || 'v21.0'
};
const ENQUIRIES = path.join(HERE, 'enquiries.jsonl');

/* Cloud API when a token exists, otherwise an honest simulated result plus the
 * wa.me deep link the browser can open itself. */
async function whatsappSend({ text, to }) {
  const target = String(to || WA.to).replace(/[^\d]/g, '');
  const deepLink = `https://wa.me/${target}?text=${encodeURIComponent(text || '')}`;
  if (!WA.token || !WA.phoneId) {
    console.log(`[wa] simulated → ${target}`);
    return { ok: true, mode: 'simulated', to: target, deepLink, note: 'set WHATSAPP_TOKEN and WHATSAPP_PHONE_ID to send for real' };
  }
  const res = await fetch(`https://graph.facebook.com/${WA.version}/${WA.phoneId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${WA.token}` },
    body: JSON.stringify({ messaging_product: 'whatsapp', to: target, type: 'text', text: { preview_url: false, body: String(text || '') } })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`WhatsApp API ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);
  console.log(`[wa] sent → ${target} (${data.messages?.[0]?.id || 'no id'})`);
  return { ok: true, mode: 'live', to: target, deepLink, messageId: data.messages?.[0]?.id || null };
}

const CHAT_PROMPT = [
  'You are the customer-service assistant for 3dNakedEye, a two-sided marketplace for out-of-home advertising in Hong Kong and Thailand.',
  'advertisers book screens and 3D hologram fans (models 3DNE-P30S 28 cm, 3DNE-P65YD 65 cm), landlords list venues and approve campaigns.',
  'Answer ONLY from the CONTEXT passages supplied by the app; they are the product FAQ.',
  'If the context does not contain the answer, say so in one sentence and offer the WhatsApp number +852 9739 8018 or commercialisation.ai@gmail.com.',
  'Never invent availability, prices, delivery dates or legal terms. Keep answers under 120 words, plain and concrete.',
  'Answer in the language of the question.'
].join(' ');

async function chatAnswer(payload) {
  if (!KEY) return { ok: false, reason: 'no-key', model: null };
  const ctx = (payload.context || []).slice(0, 4)
    .map((c, i) => `[${i + 1}] Q: ${String(c.q || '').slice(0, 300)}\nA: ${String(c.a || '').slice(0, 900)}`).join('\n\n');
  const body = {
    model: MODEL,
    messages: [
      { role: 'system', content: CHAT_PROMPT },
      { role: 'user', content: `CONTEXT:\n${ctx || '(none)'}\n\nVISITOR QUESTION (${payload.lang || 'en'}):\n${String(payload.question || '').slice(0, 800)}` }
    ],
    temperature: 0.3,
    max_tokens: 400,
    stream: false
  };
  const started = Date.now();
  const res = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`DeepSeek API ${res.status}: ${text.slice(0, 300)}`);
  const data = JSON.parse(text);
  const answer = (data.choices?.[0]?.message?.content || '').trim();
  console.log(`[chat] ${MODEL} ${Date.now() - started} ms · ${answer.length} chars`);
  return { ok: Boolean(answer), answer, model: data.model || MODEL, latencyMs: Date.now() - started };
}

/* --- static files --------------------------------------------------------- */
async function serveStatic(req, res, urlPath) {
  const rel = decodeURIComponent(urlPath === '/' ? '/index.html' : urlPath);
  const target = path.resolve(SITE_ROOT, '.' + rel);
  if (!target.startsWith(SITE_ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }
  try {
    const stat = await fsp.stat(target);
    if (stat.isDirectory()) throw new Error('dir');
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(target).toLowerCase()] || 'application/octet-stream',
      'Content-Length': stat.size,
      'Cache-Control': 'no-cache'
    });
    fs.createReadStream(target).pipe(res);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not found: ' + rel);
  }
}

/* --- affiliate share-link programme ---------------------------------------
 * See server/affiliate.mjs for the rules and server/schema.sql for the shape
 * these records take in a real database. Everything here is validated before
 * it is used; the IP address is hashed with a salt and never stored.
 *
 *   POST /api/affiliate/register   { name, email, windowDays?, model?, payout? }
 *   GET  /api/affiliate/link       ?code=&dest=&channel=&campaign=
 *   POST /api/affiliate/click      { ref, cid?, dest, channel?, ua?, referrer? }
 *   POST /api/affiliate/convert    { ref, cid?, orderRef, amount, currency? }
 *   GET  /api/affiliate/stats      ?code=
 *   GET  /api/affiliate/ledger     ?code=&limit=
 *   GET  /api/affiliate/partners
 *   GET  /api/affiliate/destinations
 *   GET  /api/affiliate/health
 * -------------------------------------------------------------------------*/
const AFF = createAffiliate({
  dir: process.env.AFFILIATE_DIR || path.join(HERE, 'affiliate'),
  salt: process.env.AFFILIATE_SALT || '3dnakedeye-affiliate',
  clicksPerMinutePerIp: Number(process.env.AFFILIATE_CLICKS_PER_MIN || 40),
  clicksPerDayPerPartner: Number(process.env.AFFILIATE_CLICKS_PER_DAY || 2000),
  dedupeSeconds: Number(process.env.AFFILIATE_DEDUPE_SECONDS || 30)
});
AFF.load();

/* the caller's address, hashed — the salt makes the hash useless elsewhere */
const clientIpHash = req => {
  const fwd = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const ip = fwd || req.socket.remoteAddress || '';
  return crypto.createHash('sha256').update((process.env.AFFILIATE_SALT || '3dnakedeye-affiliate') + '|ip|' + ip).digest('hex');
};
const affCtx = req => ({ ipHash: clientIpHash(req) });

/* --- payment methods: the registry the checkout and the operator share -----
 *   GET  /api/pay/methods          → what the checkout may offer (no secrets)
 *   GET  /api/pay/methods?admin=1  → the operator view: every rail, masked hints
 *   POST /api/pay/methods          → { method, enabled?, mode?, fee?, settle?,
 *                                      currencies?, credentials? } (operator)
 *   POST /api/pay/quote            → { method, amount, currency } fee and total
 *   POST /api/pay/test             → { method } a connection test, step by step
 *   GET  /api/pay/settings · POST /api/pay/settings
 * -------------------------------------------------------------------------*/
const PMT = createPayments({
  dir: process.env.PAYMENTS_DIR || path.join(HERE, 'payments'),
  currency: (process.env.PAY_CURRENCY || 'HKD').toUpperCase()
});
PMT.load();
/* the operator role is required to change anything. With OPERATOR_TOKEN set,
 * that is the token; without it the server mints one per start-up and prints
 * it, so a demo is runnable but nothing is left with a default password. */
const OPERATOR_TOKEN = process.env.OPERATOR_TOKEN || crypto.randomBytes(9).toString('hex');
const operatorOk = req => {
  const token = String(req.headers['x-operator-token'] || '');
  if (!token || token.length !== OPERATOR_TOKEN.length) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(OPERATOR_TOKEN));
};

/* --- server --------------------------------------------------------------- */
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': ALLOW_ORIGIN,
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
    });
    res.end();
    return;
  }

  if (url.pathname.startsWith('/api/affiliate/')) {
    const route = url.pathname.slice('/api/affiliate/'.length);
    try {
      if (route === 'health' && req.method === 'GET') {
        json(res, 200, { ok: true, schema: AFF.schemaVersion, destinations: AFF.destinations().length, ...AFF.counts() });
        return;
      }
      if (route === 'destinations' && req.method === 'GET') {
        json(res, 200, { ok: true, destinations: AFF.destinations() });
        return;
      }
      if (route === 'partners' && req.method === 'GET') {
        json(res, 200, { ok: true, partners: AFF.partners() });
        return;
      }
      if (route === 'stats' && req.method === 'GET') {
        json(res, 200, { ok: true, stats: AFF.stats({ code: url.searchParams.get('code') }) });
        return;
      }
      if (route === 'ledger' && req.method === 'GET') {
        const l = AFF.ledger({ code: url.searchParams.get('code'), limit: url.searchParams.get('limit') });
        json(res, 200, { ok: true, ...l });
        return;
      }
      if (route === 'link' && req.method === 'GET') {
        const link = AFF.link({
          code: url.searchParams.get('code'),
          dest: url.searchParams.get('dest'),
          channel: url.searchParams.get('channel'),
          campaign: url.searchParams.get('campaign')
        });
        json(res, 200, { ok: true, ...link });
        return;
      }
      if (req.method === 'POST' && (route === 'register' || route === 'click' || route === 'convert')) {
        let body;
        try { body = await readBody(req); }
        catch (e) { json(res, 400, { ok: false, error: 'invalid JSON body' }); return; }
        const ctx = affCtx(req);
        if (route === 'register') {
          json(res, 201, { ok: true, partner: AFF.register(body, ctx) });
          return;
        }
        if (route === 'click') {
          json(res, 200, AFF.click(Object.assign({ ua: req.headers['user-agent'], referrer: req.headers.referer }, body), ctx));
          return;
        }
        json(res, 200, AFF.convert(body, ctx));
        return;
      }
      if (route === 'reset' && req.method === 'POST') {
        await AFF.reset();
        json(res, 200, { ok: true, ...AFF.counts() });
        return;
      }
      json(res, 405, { ok: false, error: 'method or route not allowed' });
    } catch (e) {
      json(res, e.status || 500, { ok: false, error: e.message, kind: e.kind || null });
    }
    return;
  }

  if (url.pathname === '/api/notify/email') {
    if (req.method !== 'POST') { json(res, 405, { error: 'POST only' }); return; }
    try {
      const p = await readBody(req);
      const messages = (p.messages || []).slice(0, 200);
      if (!messages.length) { json(res, 400, { ok: false, error: 'messages required' }); return; }
      const results = await deliverMail(messages);
      const sent = results.filter(r => r.status === 'sent').length;
      console.log(`[mail] batch of ${results.length} → sent ${sent}, queued ${results.length - sent}`);
      json(res, 200, { ok: true, transport: (SMTP.host && SMTP.user) ? 'smtp' : 'file', results });
    } catch (e) {
      console.error('[mail] error:', e.message);
      json(res, 500, { ok: false, error: e.message });
    }
    return;
  }

  if (url.pathname === '/api/notify/outbox' && req.method === 'GET') {
    try {
      await fsp.mkdir(OUTBOX, { recursive: true });
      const files = (await fsp.readdir(OUTBOX)).filter(f => f.endsWith('.eml'));
      json(res, 200, { ok: true, count: files.length, files: files.slice(-50) });
    } catch (e) {
      json(res, 500, { ok: false, error: e.message });
    }
    return;
  }

  if (url.pathname === '/api/pay/intent') {
    if (req.method !== 'POST') { json(res, 405, { error: 'POST only' }); return; }
    try {
      const p = await readBody(req);
      const amount = Number(p.amount);
      if (!amount || amount <= 0) { json(res, 400, { ok: false, error: 'amount required' }); return; }
      const currency = (p.currency || PAY.currency).toUpperCase();
      const ref = p.ref || '';
      let out;
      if (p.provider === 'stripe') out = await stripeIntent({ amount, currency, ref });
      else if (p.provider === 'paypal') out = await paypalOrder({ amount, currency, ref });
      else if (p.provider === 'crypto') out = await cryptoInvoice({ amount, coin: p.coin, network: p.network, ref });
      else out = { provider: p.provider || 'local', mode: 'simulated', amount, currency, ref };
      console.log(`[pay] ${out.provider} ${out.mode} ${currency} ${amount}`);
      json(res, 200, Object.assign({ ok: true }, out));
    } catch (e) {
      console.error('[pay] error:', e.message);
      json(res, e.status || 500, { ok: false, error: e.message });
    }
    return;
  }

  if (url.pathname === '/api/enquiry') {
    if (req.method !== 'POST') { json(res, 405, { error: 'POST only' }); return; }
    try {
      const p = await readBody(req);
      const name = String(p.name || '').trim();
      const email = String(p.email || '').trim();
      const message = String(p.message || '').trim();
      if (!name || !email || !message) { json(res, 400, { ok: false, error: 'name, email and message are required' }); return; }
      const ref = p.ref || 'ENQ-' + new Date().getFullYear() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
      const lines = [
        `New 3dNakedEye enquiry ${ref}`, '',
        `Name:      ${name}`,
        `Company:   ${p.company || '—'}`,
        `Email:     ${email}`,
        `Phone:     ${p.phone || '—'}`,
        `Role:      ${p.role || '—'}`,
        `Market:    ${p.market || '—'}`,
        `Interests: ${(p.interests || []).join(', ') || '—'}`,
        `Device:    ${p.device || '—'}`,
        `Budget:    ${p.budget || '—'}`,
        `Timeline:  ${p.timeline || '—'}`,
        `Channel:   ${p.channel || '—'}`,
        `Language:  ${p.lang || '—'}`, '',
        'Message:', message, '',
        `Received:  ${new Date().toISOString()}`
      ];
      const text = lines.join('\n');
      const subject = `3dNakedEye enquiry ${ref} — ${name}`;
      const html = `<pre style="font:13px/1.6 ui-monospace,Menlo,Consolas,monospace">${text
        .replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}</pre>`;
      const results = await deliverMail([{ to: CONTACT_EMAIL, subject, text, html, trigger: 'enquiry.received' }]);
      /* audit trail on disk, one JSON object per line */
      await fsp.appendFile(ENQUIRIES, JSON.stringify(Object.assign({}, p, { ref, received: new Date().toISOString() })) + '\n', 'utf8')
        .catch(() => { /* best effort */ });
      let wa = { ok: true, mode: 'simulated' };
      try { wa = await whatsappSend({ text: `${subject}\n\n${text}` }); }
      catch (e) { wa = { ok: false, mode: 'error', error: e.message }; }
      const emailed = (SMTP.host && SMTP.user) ? 'smtp' : 'file';
      json(res, 200, {
        ok: true, ref, emailed, mail: results[0] || null, whatsapp: wa.mode,
        note: emailed === 'smtp'
          ? `Emailed to ${CONTACT_EMAIL} and copied to WhatsApp (${wa.mode}).`
          : `No SMTP configured: written to server/outbox as .eml, WhatsApp ${wa.mode}.`
      });
    } catch (e) {
      console.error('[enquiry] error:', e.message);
      json(res, 500, { ok: false, error: e.message });
    }
    return;
  }

  if (url.pathname === '/api/chat') {
    if (req.method !== 'POST') { json(res, 405, { error: 'POST only' }); return; }
    try {
      const p = await readBody(req);
      if (p.probe) { json(res, 200, { ok: Boolean(KEY), model: KEY ? MODEL : null, mode: KEY ? 'ai' : 'knowledge-base' }); return; }
      const out = await chatAnswer(p);
      json(res, 200, out);
    } catch (e) {
      console.error('[chat] error:', e.message);
      json(res, 200, { ok: false, reason: 'error', error: e.message, model: null });
    }
    return;
  }

  if (url.pathname === '/api/whatsapp/send') {
    if (req.method !== 'POST') { json(res, 405, { error: 'POST only' }); return; }
    try {
      const p = await readBody(req);
      if (!p.text) { json(res, 400, { ok: false, error: 'text required' }); return; }
      json(res, 200, await whatsappSend({ text: p.text, to: p.to }));
    } catch (e) {
      console.error('[wa] error:', e.message);
      json(res, 502, { ok: false, mode: 'error', error: e.message });
    }
    return;
  }

  if (url.pathname === '/api/health') {
    json(res, 200, {
      ok: true, hasKey: Boolean(KEY), model: MODEL, base: BASE,
      chat: KEY ? 'live' : 'knowledge-base',
      enquiry: {
        endpoint: '/api/enquiry',
        inbox: CONTACT_EMAIL,
        email: (SMTP.host && SMTP.user) ? 'smtp' : 'outbox-file'
      },
      whatsapp: (WA.token && WA.phoneId) ? 'live' : 'simulated',
      whatsappNumber: '+' + WA.to,
      payments: {
        stripe: PAY.stripeKey ? 'live' : 'simulated',
        paypal: (PAY.paypalId && PAY.paypalSecret) ? 'live' : 'simulated',
        crypto: PAY.cryptoWallet ? 'live' : 'simulated',
        currency: PAY.currency
      }
    });
    return;
  }

  if (url.pathname === '/api/generate') {
    if (req.method !== 'POST') { json(res, 405, { error: 'POST only' }); return; }
    try {
      const payload = await readBody(req);
      const out = await generate(payload);
      json(res, 200, { ok: true, source: 'deepseek', ...out });
    } catch (e) {
      console.error('[ai] error:', e.message);
      json(res, e.status || 500, { ok: false, error: e.message });
    }
    return;
  }

  if (url.pathname.startsWith('/api/pay/') && url.pathname !== '/api/pay/intent') {
    const route = url.pathname.slice('/api/pay/'.length);
    try {
      if (route === 'methods' && req.method === 'GET') {
        if (url.searchParams.get('admin')) {
          if (!operatorOk(req)) { json(res, 401, { ok: false, error: 'operator token required' }); return; }
          json(res, 200, { ok: true, admin: true, settings: PMT.settings(), methods: PMT.adminView() });
          return;
        }
        json(res, 200, { ok: true, currency: PMT.settings().currency, methods: PMT.publicView() });
        return;
      }
      if (route === 'settings') {
        if (!operatorOk(req)) { json(res, 401, { ok: false, error: 'operator token required' }); return; }
        if (req.method === 'GET') { json(res, 200, { ok: true, settings: PMT.settings() }); return; }
        if (req.method === 'POST') {
          let body; try { body = await readBody(req); } catch (e) { json(res, 400, { ok: false, error: 'invalid JSON body' }); return; }
          json(res, 200, { ok: true, settings: PMT.settings(body) });
          return;
        }
      }
      if (route === 'quote' && req.method === 'POST') {
        let body; try { body = await readBody(req); } catch (e) { json(res, 400, { ok: false, error: 'invalid JSON body' }); return; }
        json(res, 200, { ok: true, quote: PMT.quote(body) });
        return;
      }
      if (route === 'test' && req.method === 'POST') {
        if (!operatorOk(req)) { json(res, 401, { ok: false, error: 'operator token required' }); return; }
        let body; try { body = await readBody(req); } catch (e) { json(res, 400, { ok: false, error: 'invalid JSON body' }); return; }
        json(res, 200, { ok: true, result: PMT.test(body.method) });
        return;
      }
      if (route === 'methods' && req.method === 'POST') {
        if (!operatorOk(req)) { json(res, 401, { ok: false, error: 'operator token required' }); return; }
        let body; try { body = await readBody(req); } catch (e) { json(res, 400, { ok: false, error: 'invalid JSON body' }); return; }
        const method = PMT.update(body.method, body);
        json(res, 200, { ok: true, method });
        return;
      }
      if (route === 'reset' && req.method === 'POST') {
        if (!operatorOk(req)) { json(res, 401, { ok: false, error: 'operator token required' }); return; }
        await PMT.reset();
        json(res, 200, { ok: true, methods: Object.keys(PMT.state().methods).length });
        return;
      }
      json(res, 405, { ok: false, error: 'method or route not allowed' });
    } catch (e) {
      json(res, e.status || 500, { ok: false, error: e.message });
    }
    return;
  }

  if (req.method === 'GET' || req.method === 'HEAD') {
    serveStatic(req, res, url.pathname);
    return;
  }
  json(res, 404, { error: 'not found' });
});

server.listen(PORT, () => {
  console.log(`3dNakedEye server → http://localhost:${PORT}/index.html`);
  console.log(`AI proxy        → POST http://localhost:${PORT}/api/generate`);
  console.log(`Assistant       → POST http://localhost:${PORT}/api/chat ${KEY ? '(DeepSeek live)' : '(knowledge base only — set DEEPSEEK_API_KEY)'}`);
  console.log(`Enquiries       → POST http://localhost:${PORT}/api/enquiry → ${CONTACT_EMAIL}`);
  console.log(`WhatsApp        → POST http://localhost:${PORT}/api/whatsapp/send ${(WA.token && WA.phoneId) ? 'Cloud API ' + WA.version : '(simulated — set WHATSAPP_TOKEN + WHATSAPP_PHONE_ID)'} → +${WA.to}`);
  console.log(`Model           → ${MODEL} @ ${BASE}`);
  console.log(KEY
    ? 'DeepSeek key     → loaded (live generation enabled)'
    : 'DeepSeek key     → NOT set; the studio will stay in demo mode (set DEEPSEEK_API_KEY)');
  console.log(SMTP.host && SMTP.user
    ? `Email            → SMTP via ${SMTP.host}:${SMTP.port}`
    : 'Email            → no SMTP configured; messages are written to server/outbox as .eml');
  console.log('Affiliate       → POST /api/affiliate/register|click|convert · GET /api/affiliate/link|stats|ledger · schema v' + AFF.schemaVersion);
  console.log('Payments        → GET /api/pay/methods · POST /api/pay/methods|quote|test|settings · schema v' + PMT.schemaVersion);
  console.log('Operator token  → ' + OPERATOR_TOKEN + (process.env.OPERATOR_TOKEN ? ' (from OPERATOR_TOKEN)' : ' (generated for this run — set OPERATOR_TOKEN in production)'));
  console.log('Reminder: set LG_CONFIG.ai.mode = "proxy" in assets/js/config.js to use live generation.');
});
