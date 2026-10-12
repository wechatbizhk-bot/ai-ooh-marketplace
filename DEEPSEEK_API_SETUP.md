# DeepSeek API — how to get a key, and do you have to pay?

Short answer: **you can create an account and an API key for free, but the API itself is prepaid pay-as-you-go — a fresh account normally has no usable balance until you top up.** Charges are deducted from your topped-up balance (promotional/granted balance is used first when both exist). There is no permanently free production tier, so budget a small top-up to test.

Everything below reflects the official DeepSeek platform documentation; confirm current figures on the [Models & Pricing page](https://api-docs.deepseek.com/quick_start/pricing) before you commit budget.

---

## 1. Get the key (5 steps)

1. **Register on the API platform** — [platform.deepseek.com](https://platform.deepseek.com). This is the developer platform, not the chat app. Email or phone sign-in.
2. **Complete any verification** the platform asks for on your account.
3. **Open “API keys” and create a key.** It is displayed in full **only once** — copy it immediately. Store it in a password manager or your server's secret store.
4. **Top up the balance** (Billing / Top up). The API is pay-as-you-go against that balance.
5. **Call the API** with the key in an `Authorization: Bearer` header.

> Do not paste the key into front-end code. Anyone who opens the page can read it and spend your balance. In this project the key lives only in the server process (`server/deepseek-proxy.mjs`).

## 2. Endpoints and model names

| Item | Value |
| --- | --- |
| OpenAI-compatible base URL | `https://api.deepseek.com` |
| Anthropic-format base URL | `https://api.deepseek.com/anthropic` |
| Chat completions path | `POST /chat/completions` |
| General model | `deepseek-flash` (DeepSeek-V4.1-Flash — vision, tool calls, JSON output) |
| Higher-end model | `deepseek-v4-pro` (DeepSeek-V4-Pro-0813 — no vision) |
| Context / max output | 1M context, up to 384K output |
| Thinking mode | Supported; on by default, switchable |

Legacy names such as `deepseek-v4-flash` are still accepted but are served by the current Flash model and billed at the Flash price.

## 3. Prices (per 1M tokens, USD) — off-peak / peak

| | deepseek-flash | deepseek-v4-pro |
| --- | --- | --- |
| Input, cache **hit** | $0.003 / $0.006 | $0.022 / $0.044 |
| Input, cache **miss** | $0.15 / $0.30 | $0.66 / $1.32 |
| **Output** | $0.60 / $1.20 | $1.98 / $3.96 |
| Concurrency limit | 2500 | 500 |

- **Off-peak rates are half of peak rates.**
- Peak hours: **01:00–04:00** and **06:00–10:00 UTC, Monday–Friday**, excluding Chinese public holidays. Everything else (weekends, public holidays, other hours) is off-peak.
- Cost formula: `expense = tokens × price`.

### What that means for this platform

A single AI Studio brief (one brand, 2–3 languages, 3 headline variants per language, subtitles, voice-over script and storyboards) typically runs a few thousand tokens in and a similar amount out. With `deepseek-flash` off-peak that is a fraction of one US cent per brief; even the pro model stays in the low single-digit cents. **The commercial AI fee the platform charges (default HK$480 base plus HK$160 per extra language plus HK$380 for hologram conversion) is therefore mostly margin plus human review — which is exactly why the revenue split carries AI production as its own line.**

Practical controls:

- Cap `max_tokens` per brief (this project uses 1400).
- Cache generated variants per (brief, language) pair — agencies re-order the same product with small edits.
- Batch heavy generation into off-peak hours (Hong Kong daytime is largely off-peak: peak ends 18:00 HKT).
- Keep a per-advertiser monthly AI budget and show AI spend beside media spend in the operator console.

## 4. Minimal request

```bash
curl https://api.deepseek.com/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $DEEPSEEK_API_KEY" \
  -d '{
    "model": "deepseek-flash",
    "messages": [
      {"role": "system", "content": "You are a Hong Kong OOH creative director. Reply with JSON only."},
      {"role": "user", "content": "Write 3 headline variants for a mooncake promotion on a 1:1 hologram fan. JSON: {\"variants\":[{\"head\":\"\",\"sub\":\"\",\"cta\":\"\"}]}"}
    ],
    "response_format": {"type": "json_object"},
    "temperature": 1.0,
    "max_tokens": 1400
  }'
```

Errors to expect: `401` (bad or missing key), `402`/insufficient balance, `429` (rate limit), `400` (bad model name or payload).

## 5. Wiring it into this site (live AI Studio)

The AI Studio ships in **demo mode** so the site works with no key and no network. To go live:

```bash
# 1. put the key where only the server can read it
#    server/.env  →  DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx
#    (or export it as an environment variable)

# 2. start the bundled proxy + static server (Node 18+, no dependencies)
node server/deepseek-proxy.mjs
#    → http://localhost:8787/index.html
#    → POST http://localhost:8787/api/generate

# 3. switch the studio to live mode
#    assets/js/config.js →  ai: { mode: 'proxy', proxyUrl: 'http://localhost:8787/api/generate', model: 'deepseek-flash' }
```

Then open `studio.html`, fill the brief and press **Generate**. The mode pill at the top of the page shows `Mode: live · deepseek-flash`. If the proxy is down or the key is missing, the studio automatically falls back to the demo generator and tells you.

Server-side environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `DEEPSEEK_API_KEY` | — | required for live generation |
| `PORT` | `8787` | server port |
| `DEEPSEEK_MODEL` | `deepseek-flash` | model name |
| `DEEPSEEK_BASE` | `https://api.deepseek.com` | API base URL |
| `ALLOW_ORIGIN` | `*` | restrict CORS to your site origin in production |

## 6. The site assistant also uses the key (`/api/chat`)

The customer-service assistant answers from the FAQ knowledge base with no key at all, so the widget always replies. With a key present it upgrades every answer: the visitor's question plus the three best-matching FAQ passages are sent to `POST /api/chat`, and the model is instructed to answer **only** from those passages — it cannot invent a price, a date or availability.

```bash
# probe: says whether the model is reachable, without spending tokens
curl -s -X POST http://localhost:8787/api/chat -H 'Content-Type: application/json' -d '{"probe":true}'
# → {"ok":false,"model":null,"mode":"knowledge-base"}      (no key)
# → {"ok":true,"model":"deepseek-flash","mode":"ai"}       (key loaded)
```

Each answer costs roughly 600–900 prompt tokens (system prompt + retrieved passages) and under 400 completion tokens, so on `deepseek-flash` a thousand visitor questions is a fraction of a dollar. Set `LG_CONFIG.chat.useServer = false` in `assets/js/config.js` to keep the assistant purely local.

## 7. Enquiries, WhatsApp and mail

| Variable | Effect when set | Effect when missing |
| --- | --- | --- |
| `CONTACT_EMAIL` | Enquiries are delivered to this address | defaults to `commercialisation.ai@gmail.com` |
| `WHATSAPP_TOKEN` + `WHATSAPP_PHONE_ID` | `POST /api/whatsapp/send` calls the WhatsApp Cloud API (`graph.facebook.com/<version>/<phone-id>/messages`) | returns `{mode:'simulated'}` plus the `https://wa.me/85297398018?text=…` deep link, which the browser opens itself |
| `WHATSAPP_TO`, `WHATSAPP_API_VERSION` | Forwarding number and API version | `85297398018`, `v21.0` |
| `SMTP_HOST` + `SMTP_USER` + `SMTP_PASS` (port 465, implicit TLS) | Enquiries and automation mail are actually sent | every message is written to `server/outbox/*.eml` and reported as `queued`; `server/enquiries.jsonl` keeps the audit trail |

```bash
# an enquiry end to end, with no credentials configured
curl -s -X POST http://localhost:8787/api/enquiry -H 'Content-Type: application/json' \
  -d '{"name":"Chan Tai Man","email":"chan@bakery.example","message":"Four weeks in Tsim Sha Tsui, P30S on two counters."}'
# → {"ok":true,"ref":"ENQ-…","emailed":"file","whatsapp":"simulated","note":"No SMTP configured: written to server/outbox as .eml, WhatsApp simulated."}
```

## 8. Production checklist

- [ ] Key stored in a secret manager or server environment variable, never in git and never in the browser bundle.
- [ ] Rate limiting and per-advertiser AI quota in front of `/api/generate`.
- [ ] Prompt-injection guard: treat advertiser-supplied text as data, and validate the returned JSON against a schema before rendering.
- [ ] Log `prompt_tokens` / `completion_tokens` per request so AI cost can be attributed to campaigns.
- [ ] Human review before anything reaches a screen: regulated categories, claims, rights clearance.
- [ ] Disclose AI-generated advertising in the operator moderation record.

*Other hosted LLMs can be substituted — the studio only needs a JSON-returning chat endpoint. The bundled proxy shows the pattern; the rest of the platform does not depend on which model answers.*

Sources: [DeepSeek Models & Pricing](https://api-docs.deepseek.com/quick_start/pricing) · [DeepSeek API platform](https://platform.deepseek.com) · [DeepSeek API docs](https://api-docs.deepseek.com/)
