/* ============================================================================
 * 3dNakedEye — AI OOH Marketplace
 * config.js — single place to change brand, commercial rules and AI backend.
 * Code identifiers keep the internal "LG" prefix (LG_CONFIG, LG.store, LG_*).
 * ==========================================================================*/
window.LG_CONFIG = {
  brand: {
    name: '3dNakedEye',
    product: 'AI OOH Marketplace',
    legalName: '3dNakedEye Media Technology Ltd',
    email: 'commercialisation.ai@gmail.com',
    phone: '+852 9739 8018',
    whatsapp: '+852 9739 8018',
    address: 'Unit 000, 0/F, Kowloon, Hong Kong SAR',
    br: 'BR 00000000-000-00-00-0'
  },

  /* ---------------------------------------------------------------------
   * Contact channels — one source of truth for the footer, the enquiry
   * form, the WhatsApp hand-off, the assistant's escalation buttons and the
   * server-side WhatsApp Cloud API call. Replace the handles below with your
   * own before launch; everything else reads from here.
   * ------------------------------------------------------------------- */
  contact: {
    email: 'commercialisation.ai@gmail.com',
    whatsapp: '85297398018',              // digits only — wa.me format
    whatsappDisplay: '+852 9739 8018',
    /* Messaging IDs. LINE has an add-friend deep link; WeChat IDs cannot be
     * linked, so the UI copies the ID for the visitor to paste in WeChat. */
    line: 'ashealthway',
    lineUrl: 'https://line.me/ti/p/~ashealthway',
    wechatId: 'ZhuangChengHK',
    wechatQrNote: 'Search the ID in WeChat → Contacts → Add contacts',
    whatsappApi: {
      provider: 'WhatsApp Cloud API',
      version: 'v21.0',
      phoneNumberId: '',                  // env WHATSAPP_PHONE_ID on the server
      enabled: true                       // server reports "simulated" without a token
    },
    hours: 'Mon–Sat 10:00–19:00 (HKT / ICT)',
    languages: ['English', '繁體中文（粵語）', '简体中文', 'ไทย'],
    responseSla: 'within 1 business day',
    salesName: '3dNakedEye commercialisation team'
  },

  /* ---------------------------------------------------------------------
   * No third-party IP is bundled with the site: the platform brands itself,
   * and creative work comes from the advertiser or the AI Studio.
   * ------------------------------------------------------------------- */

  /* Social accounts shown in the footer and on contact.html.
   * kind 'url'    — normal link
   * kind 'account'— no public URL (WeChat official account): the UI shows the
   *                 account name with a copy button instead of inventing a link. */
  social: [
    { id: 'x',           label: 'X',            handle: '@3dnakedeye',                  kind: 'url', url: 'https://x.com/3dnakedeye' },
    { id: 'facebook',    label: 'Facebook',     handle: '3dnakedeye',                   kind: 'url', url: 'https://www.facebook.com/3dnakedeye' },
    { id: 'instagram',   label: 'Instagram',    handle: '@3dnakedeye',                  kind: 'url', url: 'https://www.instagram.com/3dnakedeye' },
    { id: 'youtube',     label: 'YouTube',      handle: '@3dnakedeye',                  kind: 'url', url: 'https://www.youtube.com/@3dnakedeye' },
    { id: 'xiaohongshu', label: '小紅書',        handle: '3dnakedeye',                   kind: 'url', url: 'https://www.xiaohongshu.com/user/profile/3dnakedeye' },
    { id: 'tiktok',      label: 'TikTok',       handle: '@3dnakedeye',                  kind: 'url', url: 'https://www.tiktok.com/@3dnakedeye' },
    { id: 'douyin',      label: '抖音',          handle: '3dnakedeye',                   kind: 'url', url: 'https://www.douyin.com/user/3dnakedeye' },
    { id: 'wechat',      label: '微信公眾號',     handle: '3dNakedEye 官方公眾號',         kind: 'account' },
    { id: 'threads',     label: 'Threads',      handle: '@3dnakedeye',                  kind: 'url', url: 'https://www.threads.net/@3dnakedeye' },
    { id: 'github',      label: 'GitHub',       handle: '@3dnakedeye',                  kind: 'url', url: 'https://github.com/3dnakedeye' }
  ],

  /* Instant-reply assistant. The widget always answers from the built-in
   * knowledge base (LG_CHAT_KB in data.js), so replies are instant and work
   * offline; when the bundled server holds a DeepSeek key it upgrades the
   * answer with the model, using the knowledge base as grounding. */
  chat: {
    enabled: true,
    endpoint: 'http://localhost:8787/api/chat',
    useServer: true,
    timeoutMs: 7000,
    name: '3dNakedEye Assistant',
    transcriptLimit: 60
  },

  /* Membership tiers. Prices are monthly and quoted in HKD; plan copy lives in
   * i18n (mem.<id>.name / mem.<id>.price / mem.<id>.f1…f6). */
  membership: {
    enabled: true,
    billing: 'monthly',
    trialDays: 14,
    tiers: [
      { id: 'free',        priceHkd: 0,    role: 'both',       highlight: false },
      { id: 'advertiser',  priceHkd: 880,  role: 'advertiser', highlight: true },
      { id: 'landlord',    priceHkd: 480,  role: 'landlord',   highlight: false },
      { id: 'partner',     priceHkd: null, role: 'both',       highlight: false }
    ]
  },

  /* Demo accounts for the advertiser / landlord dashboards.
   * Passwords are demo-only and checked in the browser; the real product
   * authenticates on the server (see docs.html §14). */
  auth: {
    enabled: true,
    storageKey: '3dnakedeye.session.v1',
    accountsKey: '3dnakedeye.accounts.v1',
    demoAccounts: [
      { role: 'advertiser', name: 'Wing Fat Bakery',                  email: 'advertiser@3dnakedeye.example', password: 'demo1234', tier: 'advertiser' },
      { role: 'landlord',   name: 'Harbour Front Property Management', email: 'landlord@3dnakedeye.example',   password: 'demo1234', tier: 'landlord' },
      { role: 'operator',   name: '3dNakedEye operator',                   email: 'operator@3dnakedeye.example',   password: 'demo1234', tier: 'free' }
    ]
  },

  currency: {
    code: 'HKD', symbol: 'HK$', locale: 'en-HK',
    /* Platform pricing is quoted in HKD; each market's own currency is shown
     * alongside it. Rates are units of the foreign currency per 1 HKD, so a
     * HK$1,000 line reads as ฿4,550 in the Thailand market. */
    rates: { HKD: 1, THB: 4.55 },
    labels: { HKD: 'HK$', THB: '฿' }
  },

  /* Commercial rules — MVP: fixed daily / weekly package + share of voice.
   * Real-time bidding is deliberately out of scope for v1 (see docs.html). */
  pricing: {
    weeklyDiscount: 0.15,   // 7–29 days
    monthlyDiscount: 0.25,  // 30+ days
    minimumDays: 1,
    maxDays: 90,
    shareOfVoice: [100, 50, 25],       // % of the device playback loop
    /* Price factor applied to the list day rate, by share of voice.
     * 100% buys the whole loop (factor 1), 50% costs 45% of the exclusive rate,
     * 25% costs 25% — i.e. sharing the loop is cheaper per point of voice. */
    sovDiscount: { 100: 1, 50: 0.45, 25: 0.25 },
    aiStudioFee: { enabled: true, base: 480, perLanguage: 160, hologramConversion: 380 }
  },

  /* Revenue split defaults (must total 1.00 before processing fees).
   * Editable at runtime on pricing.html. */
  revenueSplit: {
    landlord: 0.35,
    platform: 0.45,
    ai: 0.15,
    sales: 0.05
  },

  payment: {
    processingPct: 0.029,
    processingFlat: 2.35,
    methods: ['card', 'fps', 'payme', 'bank', 'wallet'],
    settlementDays: 30,
    depositPct: 0.5
  },

  /* AI Creative Studio backend.
   * demo   — deterministic local templates, works fully offline (default).
   * proxy  — posts to the bundled Node proxy in /server which holds the
   *          DeepSeek API key server-side (never expose a key in the browser).
   * Model names follow the current DeepSeek platform: deepseek-flash / deepseek-v4-pro. */
  ai: {
    mode: 'demo',
    proxyUrl: 'http://localhost:8787/api/generate',
    model: 'deepseek-flash',
    maxTokens: 1400,
    temperature: 1.0
  },

  hologram: {
    // Device-compatible delivery rules (from the 3DNE-P30S / 3DNE-P65YD FAQ)
    backgroundMustBeBlack: true,
    blackThreshold: 24,        // mean RGB below this counts as "black"
    backgroundCoverageMin: 0.55, // >=55% of pixels near-black
    aspectTarget: 1,           // square 1:1
    aspectTolerance: 0.06,
    durationTarget: [10, 30],  // seconds
    maxFileMb: 60,
    marginSafePct: 0.08,       // keep subjects inside the central 84%
    minRunHours: 9,            // 8–10h run, then 30 min rest
    formats: ['MP4 (H.264)', 'AVI', 'MOV', 'GIF', 'JPG', 'PNG']
  },

  /* ---------------------------------------------------------------------
   * Location-based services (LBS)
   * provider: 'auto'     → try street map tiles, fall back to the offline
   *                        schematic map if the tile CDN is unreachable
   *           'streets'  → OpenStreetMap tiles only
   *           'schematic'→ offline schematic map only
   *
   * Two markets ship today — Hong Kong and Thailand — each with its own
   * bounds, projection area, landmarks and settlement currency. Pricing is
   * quoted in the platform currency (HKD) and shown with the market's own
   * currency alongside it; `currency.rates` holds units per HKD.
   * ------------------------------------------------------------------- */
  geo: {
    provider: 'auto',
    defaultMarket: 'hk',
    radiusOptionsKm: [1, 2, 5, 10, 25],
    defaultRadiusKm: 5,
    tileTimeoutMs: 4500,
    tiles: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    },
    leafletCss: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    leafletJs: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    markets: [
      {
        id: 'hk',
        currency: { code: 'HKD', symbol: 'HK$', locale: 'en-HK' },
        center: { lat: 22.3193, lng: 114.1694 },
        zoom: 11,
        bounds: { minLat: 22.145, maxLat: 22.585, minLng: 113.820, maxLng: 114.460 },
        /* Area of the schematic canvas this market is drawn into, chosen so the
         * horizontal and vertical scales stay close to equal. */
        proj: { x0: 5, x1: 145, y0: 5, y1: 95 },
        radiusOptionsKm: [1, 2, 5, 10, 25],
        landmarks: [
          { id: 'tst', lat: 22.2975, lng: 114.1722 },
          { id: 'central', lat: 22.2819, lng: 114.1582 },
          { id: 'mongkok', lat: 22.3193, lng: 114.1694 },
          { id: 'shatin', lat: 22.3815, lng: 114.1883 },
          { id: 'kwuntong', lat: 22.3125, lng: 114.2190 },
          { id: 'cwb', lat: 22.2799, lng: 114.1850 },
          { id: 'tungchung', lat: 22.2890, lng: 113.9410 },
          { id: 'tuenmun', lat: 22.3910, lng: 113.9770 }
        ],
        /* Simplified coastlines for the offline schematic map. */
        land: [
          [[22.575,114.03],[22.565,114.16],[22.545,114.27],[22.520,114.40],[22.455,114.42],[22.430,114.34],
           [22.445,114.28],[22.400,114.27],[22.360,114.32],[22.325,114.245],[22.300,114.20],[22.292,114.13],
           [22.330,114.10],[22.370,114.06],[22.400,113.99],[22.460,113.94],[22.520,113.92],[22.560,113.95]],
          [[22.290,114.13],[22.283,114.20],[22.265,114.245],[22.240,114.235],[22.205,114.19],[22.215,114.14],
           [22.245,114.115],[22.270,114.12]],
          [[22.330,114.00],[22.300,114.05],[22.270,114.06],[22.230,114.02],[22.215,113.95],[22.240,113.87],
           [22.290,113.85],[22.325,113.92]]
        ]
      },
      {
        id: 'th',
        currency: { code: 'THB', symbol: '฿', locale: 'th-TH' },
        center: { lat: 13.7563, lng: 100.5018 },
        zoom: 11,
        bounds: { minLat: 5.60, maxLat: 20.50, minLng: 97.30, maxLng: 105.70 },
        proj: { x0: 50, x1: 100, y0: 5, y1: 95 },
        radiusOptionsKm: [1, 2, 5, 10, 25],
        landmarks: [
          { id: 'siam', lat: 13.7455, lng: 100.5331 },
          { id: 'sukhumvit', lat: 13.7308, lng: 100.5697 },
          { id: 'silom', lat: 13.7290, lng: 100.5340 },
          { id: 'chatuchak', lat: 13.7999, lng: 100.5505 },
          { id: 'chiangmai', lat: 18.7883, lng: 98.9853 },
          { id: 'phuket', lat: 7.8804, lng: 98.3923 },
          { id: 'pattaya', lat: 12.9236, lng: 100.8825 },
          { id: 'huahin', lat: 12.5684, lng: 99.9577 },
          { id: 'khonkaen', lat: 16.4322, lng: 102.8236 },
          { id: 'hatyai', lat: 7.0084, lng: 100.4767 }
        ],
        land: [
          [[20.42,100.10],[20.35,100.92],[19.80,101.02],[19.40,100.92],[18.80,101.02],[18.40,101.32],
           [18.20,102.10],[17.90,102.52],[18.40,103.02],[18.20,103.92],[17.60,104.80],[17.00,104.62],
           [16.50,104.82],[15.90,105.60],[15.20,105.52],[14.40,105.42],[14.35,104.72],[13.80,104.02],
           [13.50,103.32],[12.70,102.92],[12.60,102.22],[12.20,102.02],[12.60,101.52],[12.90,100.92],
           [12.60,100.32],[12.10,99.92],[11.80,99.52],[12.00,99.22],[11.60,99.02],[10.90,99.22],
           [10.50,99.22],[10.00,99.22],[9.60,99.32],[9.20,99.42],[8.60,99.52],[8.40,99.92],
           [8.00,100.02],[7.90,100.32],[7.40,100.42],[7.20,100.62],[6.90,100.92],[6.50,101.32],
           [6.30,101.82],[5.80,101.92],[5.80,102.32],[6.40,102.32],[6.60,101.62],[7.10,101.32],
           [7.60,101.02],[8.40,100.62],[9.20,100.32],[9.90,100.02],[10.60,100.02],[11.20,100.02],
           [11.90,99.82],[12.40,100.12],[12.90,100.22],[13.40,100.22],[13.40,100.62],[13.10,100.92],
           [13.30,101.32],[12.60,101.82],[13.00,102.42],[13.60,102.92],[14.30,103.42],[14.40,104.22],
           [15.00,104.62],[15.60,105.02],[16.00,105.32],[16.40,104.92],[17.10,104.42],[17.70,104.02],
           [18.30,103.32],[18.60,102.62],[19.10,101.72],[19.60,101.22],[20.00,100.52]]
        ]
      }
    ]
  },

  /* ---------------------------------------------------------------------
   * Payment providers
   * Every provider runs in 'simulated' mode until a key is configured and
   * paymentsUseServer is true; the bundled server then creates real
   * Stripe PaymentIntents / PayPal orders and crypto invoices.
   * Amounts are always charged in HKD; crypto is quoted and settled to HKD.
   * ------------------------------------------------------------------- */
  payments: {
    useServer: false,           // true → ask server/deepseek-proxy.mjs for intents
    serverUrl: 'http://localhost:8787/api/pay',
    processingPct: 0.029,       // fallback used when a method has no own fee
    processingFlat: 2.35,
    cryptoRateLockMinutes: 15,
    providers: {
      stripe: {
        label: 'stripe', enabled: true, mode: 'simulated',
        publishableKey: '', secretKeyEnv: 'STRIPE_SECRET_KEY',
        pct: 0.029, flat: 2.35, currencies: ['HKD'],
        wallets: ['applepay', 'googlepay'], threeDS: true
      },
      paypal: {
        label: 'paypal', enabled: true, mode: 'simulated',
        clientIdEnv: 'PAYPAL_CLIENT_ID', secretEnv: 'PAYPAL_SECRET',
        pct: 0.034, flat: 2.35, currencies: ['HKD', 'USD']
      },
      crypto: {
        label: 'crypto', enabled: true, mode: 'simulated',
        /* Conversion fee charged on top; network fee is paid by the sender. */
        pct: 0.01, flat: 0, settleTo: 'HKD', confirmations: 1,
        volatilityBufferPct: 0.5, walletEnv: 'CRYPTO_WALLET_ADDRESS',
        coins: [
          { code: 'USDT', network: 'TRC20', hkdPerUnit: 7.80, memo: true },
          { code: 'USDT', network: 'ERC20', hkdPerUnit: 7.80, memo: false },
          { code: 'USDC', network: 'ERC20', hkdPerUnit: 7.80, memo: false },
          { code: 'BTC',  network: 'Bitcoin', hkdPerUnit: 610000, memo: false },
          { code: 'ETH',  network: 'ERC20',   hkdPerUnit: 26500, memo: false }
        ]
      },
      local: { label: 'local', enabled: true, mode: 'simulated', pct: 0.0, flat: 0 }
    }
  },

  /* ---------------------------------------------------------------------
   * The Holobox page (holobox.html)
   * The page draws its own optical-stack explainer in the browser. Drop a
   * real film in here and the player uses that instead — no code change:
   *   mode 'src'     → your own MP4/WebM (video.src, optional video.poster)
   *   mode 'youtube' → your own YouTube ID (video.youtubeId), loaded only
   *                    after a click, from youtube-nocookie.com
   * Keep mode 'builtin' to keep the drawn explainer.
   * ------------------------------------------------------------------- */
  holobox: {
    video: {
      mode: 'builtin',
      src: '',                 // e.g. 'assets/video/holobox-demo.mp4'
      youtubeId: '',           // e.g. 'dQw4w9WgXcQ'
      poster: ''
    }
  },

  /* ---------------------------------------------------------------------
   * Explainer video
   * mode 'builtin'  → the animated trilingual explainer in video.html
   * mode 'file'     → your own MP4 (video.src)
   * mode 'youtube'  → your own YouTube ID (video.youtubeId)
   * ------------------------------------------------------------------- */
  video: {
    mode: 'builtin',
    src: '',                 // e.g. 'assets/video/3dNakedEye-explainer.mp4'
    youtubeId: '',           // e.g. 'dQw4w9WgXcQ'
    poster: '',              // e.g. 'assets/img/explainer-poster.jpg'
    durationSec: 146,
    voiceOver: true,         // Web Speech API narration in the current language.
                             // 繁體中文 (zh-HK) is always narrated by a Cantonese voice — see
                             // VOICE_RULES in page-video.js; Mandarin never reads Traditional
                             // Chinese. Without a Cantonese voice installed, playback keeps the
                             // subtitles and tells the viewer what is missing.
    /* ------------------------------------------------------------------
     * Third-party reference videos about DSPs and ad platforms.
     * These are other people's material: the app links out to them and
     * never re-hosts them. Add a youtubeId to any entry to embed that
     * video inline (you are then responsible for it still being correct).
     * A YouTube search deep link is generated from the query for every
     * entry, so the list never rots even if a channel changes.
     * ---------------------------------------------------------------- */
    references: [
      { id: 'dsp',        provider: 'The Trade Desk', channel: 'https://www.youtube.com/@thetradedesk',
        query: 'what is a demand side platform DSP programmatic advertising' },
      { id: 'platform',   provider: 'Google Ads', channel: 'https://www.youtube.com/@GoogleAds',
        query: 'programmatic advertising explained advertiser platform' },
      { id: 'pdooh',      provider: 'Vistar Media', channel: 'https://www.vistarmedia.com/blog/programmatic-dooh-for-media-owners',
        query: 'programmatic digital out of home pDOOH explained' },
      { id: 'openrtb',    provider: 'IAB Tech Lab', channel: 'https://iabtechlab.com/dooh-integrated-into-openrtb/',
        query: 'OpenRTB DOOH digital out of home integration' },
      { id: 'measure',    provider: 'IAB', channel: 'https://www.iab.com/guidelines/dooh-measurement-guide/',
        query: 'DOOH measurement guide impressions audience' },
      { id: 'ttd_dooh',   provider: 'The Trade Desk', channel: 'https://www.thetradedesk.com/our-demand-side-platform/omnichannel-advertising/digital-out-of-home',
        query: 'Trade Desk digital out of home omnichannel advertising' }
    ]
  },

  /* Bundled Node server. The site works entirely without it (the assistant
   * falls back to the knowledge base, enquiries stay in the browser and the
   * email outbox); with it running you also get /api/enquiry, /api/chat and
   * /api/whatsapp/send. */
  server: {
    base: 'http://localhost:8787',
    enquiryUrl: 'http://localhost:8787/api/enquiry',
    whatsappUrl: 'http://localhost:8787/api/whatsapp/send',
    healthUrl: 'http://localhost:8787/api/health'
  },

  /* Google Translate widget (100+ languages on top of the built-in four).
   * quickLanguages get one-click buttons in the header panel; every other
   * language stays available from the dropdown. Codes are Google's. */
  translate: {
    enabled: true,
    scriptUrl: 'https://translate.google.com/translate_a/element.js?cb=lgGoogleTranslateInit',
    includedLanguages: '',   // empty = every language Google offers
    pageLanguage: 'en',
    quickLanguages: [
      { code: 'ja', label: '日本語' },
      { code: 'ko', label: '한국어' },
      { code: 'vi', label: 'Tiếng Việt' },
      { code: 'id', label: 'Bahasa Indonesia' },
      { code: 'fr', label: 'Français' },
      { code: 'de', label: 'Deutsch' },
      { code: 'es', label: 'Español' },
      { code: 'ar', label: 'العربية' }
    ]
  },

  /* ---------------------------------------------------------------------
   * Email automation
   * The engine always writes to the in-app outbox. With useServer on it also
   * asks the bundled server to deliver: SMTP when credentials exist, otherwise
   * the server writes an .eml file you can open in a mail client.
   * ------------------------------------------------------------------- */
  notify: {
    enabled: true,
    useServer: false,
    url: 'http://localhost:8787/api/notify/email',
    fromName: '3dNakedEye',
    replyTo: 'commercialisation.ai@gmail.com',
    digestDay: 'monday',
    /* Recipients default to the market language unless a party has a preference. */
    defaultLangByMarket: { hk: 'en', th: 'th' },
    batchSize: 50,
    /* Where enquiries, chat hand-offs and membership notices go. */
    salesEmail: 'commercialisation.ai@gmail.com',
    whatsapp: '+852 9739 8018'
  },

  /* ---------------------------------------------------------------------
   * Ads Manager benchmarks (used for the "vs. benchmark" columns)
   * ------------------------------------------------------------------- */
  benchmarks: {
    cpmMultiplier: 1.18,     // platform CPM vs. the account's, in the demo
    ctrMultiplier: 0.92,
    cpaMultiplier: 1.24,
    windowDays: 30
  },

  locales: [
    { code: 'en',    label: 'English',   short: 'EN',   htmlLang: 'en',         intl: 'en-HK' },
    { code: 'zh-HK', label: '繁體中文',   short: '繁',   htmlLang: 'zh-Hant-HK', intl: 'zh-HK' },
    { code: 'zh-CN', label: '简体中文',   short: '简',   htmlLang: 'zh-Hans-CN', intl: 'zh-CN' },
    { code: 'th',    label: 'ไทย',       short: 'ไทย',  htmlLang: 'th',         intl: 'th-TH' }
  ],
  defaultLocale: 'en'
};
