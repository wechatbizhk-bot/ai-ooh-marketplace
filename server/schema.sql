-- ============================================================================
-- 3dNakedEye — affiliate share-link programme, relational schema
-- Target: PostgreSQL 14+ (SQLite notes inline; the bundled demo server writes
-- the same shapes into server/affiliate/*.jsonl instead of a database, so the
-- front end can be built and tested without one).
--
-- Design notes
--   * A partner is a person or company; a link is one tracked URL they own.
--     Splitting them means a partner can have many links (one per channel,
--     per campaign, per landing page) without duplicating the partner row.
--   * Clicks are append-only and high volume: they are written once and never
--     updated, which is what makes attribution and fraud review possible later.
--     No raw IP address is stored — only a salted hash (GDPR/PDO-friendly).
--   * Conversions are keyed by the merchant's own order id, with a UNIQUE
--     constraint, so a retried webhook cannot pay twice (idempotency).
--   * Money is stored in minor units (cents) as BIGINT, never as a float.
-- ============================================================================

CREATE TABLE partners (
  id              BIGSERIAL PRIMARY KEY,
  code            TEXT        NOT NULL UNIQUE,          -- the ?ref= value, e.g. 3DNE-4K2
  name            TEXT        NOT NULL,
  email           CITEXT      NOT NULL UNIQUE,
  status          TEXT        NOT NULL DEFAULT 'active'
                    CHECK (status IN ('pending','active','suspended','closed')),
  -- attribution + commercial terms agreed at sign-up, per partner
  window_days     INTEGER     NOT NULL DEFAULT 30 CHECK (window_days BETWEEN 1 AND 365),
  model_kind      TEXT        NOT NULL DEFAULT 'pct' CHECK (model_kind IN ('pct','flat')),
  model_value     NUMERIC(10,4) NOT NULL DEFAULT 0.08,  -- 0.08 = 8 %, or cents when flat
  payout_method   TEXT        NOT NULL DEFAULT 'bank' CHECK (payout_method IN ('bank','payme','fps','paypal','crypto')),
  payout_detail   TEXT,                                  -- tokenised reference, never a full account number
  signup_ip_hash  CHAR(64),                              -- salted SHA-256: used for the self-referral check
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE links (
  id              BIGSERIAL PRIMARY KEY,
  partner_id      BIGINT      NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  cid             TEXT        NOT NULL UNIQUE,           -- the ?cid= value, one per share
  destination     TEXT        NOT NULL,                  -- must be on the allow-list
  channel         TEXT        NOT NULL DEFAULT 'link'
                    CHECK (channel IN ('link','social','content','message','email','qr','offline')),
  campaign        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX links_partner_idx ON links (partner_id, created_at DESC);

CREATE TABLE clicks (
  id              BIGSERIAL PRIMARY KEY,
  partner_id      BIGINT      NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  link_id         BIGINT      REFERENCES links(id) ON DELETE SET NULL,
  cid             TEXT,
  destination     TEXT        NOT NULL,
  channel         TEXT        NOT NULL,
  ip_hash         CHAR(64),                              -- salted; never the address itself
  ua_hash         CHAR(64),
  country         CHAR(2),
  referrer_host   TEXT,
  is_repeat       BOOLEAN     NOT NULL DEFAULT false,    -- same partner + ip inside the dedupe window
  risk_score      SMALLINT    NOT NULL DEFAULT 0,        -- 0–100, set by the rules in the API
  risk_flags      TEXT[]      NOT NULL DEFAULT '{}',     -- e.g. {rapid_repeat,bot_ua,no_ua}
  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- the hot queries: "clicks for this partner in the window" and fraud review
CREATE INDEX clicks_partner_time_idx ON clicks (partner_id, occurred_at DESC);
CREATE INDEX clicks_cid_idx          ON clicks (cid) WHERE cid IS NOT NULL;
CREATE INDEX clicks_risk_idx         ON clicks (risk_score DESC) WHERE risk_score > 0;

CREATE TABLE conversions (
  id              BIGSERIAL PRIMARY KEY,
  partner_id      BIGINT      REFERENCES partners(id) ON DELETE SET NULL,  -- NULL = unattributed
  link_id         BIGINT      REFERENCES links(id) ON DELETE SET NULL,
  cid             TEXT,
  order_ref       TEXT        NOT NULL UNIQUE,           -- idempotency: the merchant's order id
  order_amount    BIGINT      NOT NULL CHECK (order_amount >= 0),  -- minor units
  currency        CHAR(3)     NOT NULL DEFAULT 'HKD',
  model_kind      TEXT        NOT NULL CHECK (model_kind IN ('pct','flat')),
  model_value     NUMERIC(10,4) NOT NULL,
  commission      BIGINT      NOT NULL CHECK (commission >= 0),    -- minor units
  attributed      BOOLEAN     NOT NULL DEFAULT true,
  reason          TEXT,                                  -- why not attributed, when false
  click_id        BIGINT      REFERENCES clicks(id) ON DELETE SET NULL,
  status          TEXT        NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','approved','reversed','paid')),
  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at     TIMESTAMPTZ
);
CREATE INDEX conversions_partner_time_idx ON conversions (partner_id, occurred_at DESC);
CREATE INDEX conversions_status_idx       ON conversions (status) WHERE status <> 'paid';

CREATE TABLE payouts (
  id              BIGSERIAL PRIMARY KEY,
  partner_id      BIGINT      NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  period_start    DATE        NOT NULL,
  period_end      DATE        NOT NULL,
  clicks          INTEGER     NOT NULL DEFAULT 0,
  conversions     INTEGER     NOT NULL DEFAULT 0,
  gross_amount    BIGINT      NOT NULL DEFAULT 0,
  commission      BIGINT      NOT NULL DEFAULT 0,
  adjustments     BIGINT      NOT NULL DEFAULT 0,        -- reversals, fraud clawbacks
  paid_amount     BIGINT,
  method          TEXT,
  paid_at         TIMESTAMPTZ,
  statement_ref   TEXT,
  UNIQUE (partner_id, period_start, period_end)
);

-- One row per security decision the API makes, so a dispute can be answered
-- with evidence rather than an opinion.
CREATE TABLE fraud_events (
  id              BIGSERIAL PRIMARY KEY,
  partner_id      BIGINT      REFERENCES partners(id) ON DELETE SET NULL,
  kind            TEXT        NOT NULL
                    CHECK (kind IN ('self_referral','duplicate_order','click_flood','bot_ua','bad_code',
                                    'bad_destination','rate_limited','out_of_window','no_click')),
  detail          TEXT,
  ip_hash         CHAR(64),
  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX fraud_events_kind_idx ON fraud_events (kind, occurred_at DESC);

-- Optional but recommended: a materialised daily rollup so the partner console
-- never scans the raw click table.
CREATE MATERIALIZED VIEW partner_daily AS
SELECT partner_id,
       date_trunc('day', occurred_at)::date AS day,
       count(*)                              AS clicks,
       count(DISTINCT cid)                   AS shares,
       count(*) FILTER (WHERE is_repeat)      AS repeats
FROM clicks
GROUP BY 1, 2;
CREATE UNIQUE INDEX partner_daily_idx ON partner_daily (partner_id, day);

-- SQLite equivalents, if you would rather keep the demo single-file:
--   * CITEXT            → TEXT COLLATE NOCASE
--   * BIGSERIAL         → INTEGER PRIMARY KEY AUTOINCREMENT
--   * TIMESTAMPTZ       → TEXT (ISO-8601 UTC)
--   * TEXT[]            → TEXT holding JSON
--   * NUMERIC(10,4)     → REAL with a CHECK on the range
--   * materialised view → a table refreshed by a scheduled job
