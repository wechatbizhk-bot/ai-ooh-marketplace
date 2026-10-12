/* 3dNakedEye — page-home.js */
(function () {
  'use strict';
  const S = window.LG.store, A = window.LG.app;

  const FLOW = ['s1', 's2', 's3', 's4', 's5', 's6', 's7'];
  const HOLO_RULES = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6'];
  const PHASES = [
    { key: 'p1', items: ['p1a', 'p1b', 'p1c', 'p1d', 'p1e', 'p1f'] },
    { key: 'p2', items: ['p2a', 'p2b', 'p2c', 'p2d', 'p2e', 'p2f', 'p2g'] },
    { key: 'p3', items: ['p3a', 'p3b', 'p3c', 'p3d', 'p3e', 'p3f'] }
  ];

  /* Poster art for the explainer teaser — a 16:9 hologram-fan frame. */
  function posterSvg() {
    return `<svg viewBox="0 0 640 360" class="video-teaser__art" role="img"
      aria-label="${A.esc(A.t('video.eyebrow'))}" translate="no">
      <defs>
        <linearGradient id="tp1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#0a2540"/><stop offset="1" stop-color="#050b16"/></linearGradient>
        <radialGradient id="tp2"><stop offset="0" stop-color="#35d0ff" stop-opacity=".55"/>
          <stop offset="1" stop-color="#6b4dff" stop-opacity="0"/></radialGradient>
        <linearGradient id="tp3" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#35d0ff"/><stop offset=".55" stop-color="#0b5fff"/><stop offset="1" stop-color="#6b4dff"/></linearGradient>
        <linearGradient id="tp4" x1="430" y1="70" x2="510" y2="140">
          <stop offset="0" stop-color="#e8f7ff"/><stop offset="1" stop-color="#9fe8ff"/></linearGradient>
      </defs>
      <rect width="640" height="360" fill="url(#tp1)"/>
      <g opacity=".14" stroke="#7ab2ff" stroke-width="1">
        ${Array.from({ length: 9 }, (_, i) => `<line x1="0" y1="${40 * (i + 1)}" x2="640" y2="${40 * (i + 1)}"/>`).join('')}
        ${Array.from({ length: 15 }, (_, i) => `<line x1="${45 * (i + 1)}" y1="0" x2="${45 * (i + 1)}" y2="360"/>`).join('')}
      </g>
      <circle cx="470" cy="150" r="150" fill="url(#tp2)"/>
      <!-- 3dNakedEye motif: an eye with an isometric cube floating in the iris -->
      <path d="M384 150c16-24 34-35 86-35s70 11 86 35c-16 24-34 35-86 35s-70-11-86-35Z"
            fill="none" stroke="url(#tp3)" stroke-width="3.4" stroke-linejoin="round"/>
      <circle cx="470" cy="150" r="30" fill="url(#tp3)" opacity=".16"/>
      <circle cx="470" cy="150" r="30" fill="none" stroke="url(#tp3)" stroke-width="1.8" opacity=".55"/>
      <path d="M470 124 491 136 470 148 449 136Z" fill="url(#tp4)"/>
      <path d="M449 136 470 148v25l-21-12Z" fill="#0b5fff"/>
      <path d="M491 136v25l-21 12v-25Z" fill="#6b4dff"/>
      <path d="M505 113a38 38 0 0 1 10 22" fill="none" stroke="#ff5470" stroke-width="3.2" stroke-linecap="round" opacity=".9"/>
      <text x="40" y="74" fill="#8fd8ff" font-size="15" letter-spacing="4">3dNakedEye</text>
      <text x="40" y="126" fill="#ffffff" font-size="34" font-weight="800">${A.esc(A.t('video.teaser_title'))}</text>
      <text x="40" y="160" fill="#a9bed8" font-size="15">${A.esc(A.t('video.meta_languages_short'))}</text>
      <g font-size="13" fill="#cfe0f5">
        <rect x="40" y="196" width="168" height="34" rx="17" fill="rgba(53,208,255,.12)" stroke="rgba(53,208,255,.4)"/>
        <text x="58" y="218">◎ 480 slots / day</text>
        <rect x="222" y="196" width="196" height="34" rx="17" fill="rgba(52,211,153,.12)" stroke="rgba(52,211,153,.42)"/>
        <text x="240" y="218">✓ proof of play logged</text>
      </g>
      <text x="40" y="286" fill="#7288a5" font-size="13">${A.esc(A.t('video.meta_length'))} · ${A.esc(A.t('video.meta_chapters'))}</text>
    </svg>`;
  }

  function render() {
    /* --- hero stats --- */
    const live = S.liveLocations();
    const devices = live.reduce((s, l) => s + l.devices.length, 0);
    const online = live.reduce((s, l) => s + l.devices.filter(d => d.online).length, 0);
    const plays = S.campaigns().reduce((s, c) => s + (c.days * 480 * (c.sov / 100) * c.locationIds.length * 0.97), 0);
    const set = (k, v) => { const el = document.querySelector('[data-stat="' + k + '"]'); if (el) el.textContent = v; };
    set('locations', A.num(live.length));
    set('devices', A.num(online) + '/' + A.num(devices));
    set('plays', A.num(plays));
    set('districts', A.num(new Set(live.map(l => l.district)).size));

    /* --- explainer teaser poster --- */
    const art = document.getElementById('teaserArt');
    if (art) art.innerHTML = posterSvg();

    /* --- workflow strip --- */
    const flow = document.getElementById('flowStrip');
    if (flow) flow.innerHTML = FLOW.map(k =>
      `<div class="flow__node">${A.esc(A.t('flow.' + k))}<span>${A.esc(A.t('flow.' + k + '_d'))}</span></div>`).join('');

    /* --- AI checklist --- */
    const cl = document.getElementById('homeChecklist');
    if (cl) cl.innerHTML = [
      { k: 'c1', s: 'pass' }, { k: 'c2', s: 'pass' }, { k: 'c3', s: 'warn' }, { k: 'c4', s: 'pass' }
    ].map(x => `<li><span class="mark mark--${x.s}">${x.s === 'pass' ? '✓' : '!'}</span>
      <span>${A.esc(A.t('studio.check_' + x.k))}</span>
      <span class="tiny muted">${A.esc(A.t('studio.check_' + x.k + '_v'))}</span></li>`).join('');

    /* --- hologram rules --- */
    const hr = document.getElementById('holoRules');
    if (hr) hr.innerHTML = HOLO_RULES.map(k =>
      `<li><span class="mark mark--pass">✓</span><span><b>${A.esc(A.t('holo.' + k))}</b> — ${A.esc(A.t('holo.' + k + '_d'))}</span><span></span></li>`).join('');

    /* --- roadmap --- */
    const rm = document.getElementById('roadmap');
    if (rm) rm.innerHTML = PHASES.map(p => `<li>
      <time>${A.esc(A.t('road.' + p.key + '_when'))}</time>
      <h4>${A.esc(A.t('road.' + p.key))}</h4>
      <p>${A.esc(A.t('road.' + p.key + '_d'))}</p>
      <ul class="tag-list" style="margin-top:8px">${p.items.map(i => `<li class="chip">${A.esc(A.t('road.' + i))}</li>`).join('')}</ul>
    </li>`).join('');

    /* --- featured locations + availability, for the active market --- */
    const grid = document.getElementById('featuredGrid');
    const from = S.util.todayISO(3), days = 7;
    const mkt = A.market;
    const inMarket = S.locationsByMarket(mkt);
    const featured = inMarket.filter(l => l.featured).concat(inMarket.filter(l => !l.featured)).slice(0, 4);
    if (grid) {
      grid.innerHTML = featured.map(l => A.locationCard(l, {
        avail: S.availability(l.id, from, days)
      })).join('');
      grid.querySelectorAll('[data-add]').forEach(b => b.addEventListener('click', () => {
        const loc = S.location(b.getAttribute('data-add'));
        S.addToCart({ locationId: loc.id, days: 7, sov: 100, start: from });
        A.toast(A.t('toast.added_cart', { name: A.L(loc.name) }), 'ok');
      }));
    }

    /* --- market tabs --------------------------------------------------- */
    const tabs = document.getElementById('homeMarketTabs');
    if (tabs) {
      tabs.innerHTML = A.markets().map(m =>
        `<button type="button" data-market="${m.id}" class="${m.id === mkt ? 'is-active' : ''}">${A.esc(A.t('market.' + m.id))}</button>`).join('');
      tabs.querySelectorAll('[data-market]').forEach(b => b.addEventListener('click', () => {
        A.setMarket(b.getAttribute('data-market'));
        render();
      }));
    }

    /* --- LBS availability section --- */
    const stats = document.getElementById('homeAvailStats');
    if (stats) {
      const counts = { available: 0, partial: 0, occupied: 0, restricted: 0, pending: 0 };
      let freeSlots = 0, totalSlots = 0;
      inMarket.forEach(l => {
        const a = S.availability(l.id, from, days);
        counts[a.state] = (counts[a.state] || 0) + 1;
        freeSlots += a.freeDays; totalSlots += days;
      });
      const occupancy = Math.round((1 - freeSlots / Math.max(1, totalSlots)) * 100);
      stats.innerHTML =
        A.stat(A.t('avail.available'), A.num(counts.available), A.t('avail.window', { days }), 'ok') +
        A.stat(A.t('avail.partial'), A.num(counts.partial), A.t('avail.partial_sub'), 'warn') +
        A.stat(A.t('avail.occupied'), A.num(counts.occupied), A.t('avail.occupied_sub'), 'bad') +
        A.stat(A.t('avail.occupancy'), occupancy + '%', A.t('avail.occupancy_sub', { days }));
    }
    const host = document.getElementById('homeLbs');
    if (host) {
      A.lbsMap(host, inMarket, {
        market: mkt, from, days,
        radiusKm: (A.marketById(mkt).radiusOptionsKm || [5])[2] || 5,
        showLabels: false, height: 470,
        onPin: id => { location.href = 'location.html?id=' + encodeURIComponent(id); }
      });
    }

    /* --- revenue donut --- */
    const donutHost = document.getElementById('shareDonut');
    if (donutHost) {
      const sample = 10000, sp = S.state.split;
      const segs = [
        { label: A.t('share.platform'), value: sample * sp.platform, color: '#35d0ff' },
        { label: A.t('share.landlord'), value: sample * sp.landlord, color: '#7a6bff' },
        { label: A.t('share.ai'), value: sample * sp.ai, color: '#ff5fa2' },
        { label: A.t('share.sales'), value: sample * sp.sales, color: '#34d399' }
      ];
      donutHost.innerHTML = `<h3 class="card__title" style="margin-bottom:14px">${A.esc(A.t('share.donut_title'))}</h3>` +
        A.donut(segs, { center: A.money(sample), centerSub: A.t('share.donut_sub'), label: A.t('share.donut_title') }) +
        `<p class="tiny muted" style="margin-top:12px">${A.esc(A.t('share.donut_note'))}</p>`;
    }

    /* --- industry reference platforms ----------------------------------- */
    const refsHost = document.getElementById('homeRefs');
    if (refsHost) {
      const refs = [
        { id: 'ttd', name: 'The Trade Desk', url: 'https://www.thetradedesk.com/', video: 'https://www.youtube.com/@thetradedesk' },
        { id: 'amazon', name: 'Amazon DSP', url: 'https://advertising.amazon.com/solutions/products/amazon-dsp' },
        { id: 'adobe', name: 'Adobe Advertising Cloud', url: 'https://business.adobe.com/products/advertising.html' },
        { id: 'stackadapt', name: 'StackAdapt', url: 'https://www.stackadapt.com/' },
        { id: 'mediamath', name: 'MediaMath', url: 'https://infillion.com/' }
      ];
      refsHost.innerHTML = refs.map(r => `
        <article class="card ref-card">
          <div class="row row--between" style="align-items:flex-start">
            <div>
              <span class="badge">${A.esc(A.t('home.refs_eyebrow'))}</span>
              <h3 class="card__title" style="font-size:1rem;margin:6px 0 4px">${A.esc(r.id === 'ttd' ? A.t('home.ref_ttd') : r.name)}</h3>
              <p class="tiny muted" style="margin:0">${A.esc(A.t('home.ref_' + r.id + '_d'))}</p>
            </div>
          </div>
          <div class="row" style="margin-top:12px;gap:8px">
            <a class="btn btn--ghost btn--sm" href="${A.esc(r.url)}" target="_blank" rel="noopener">${A.esc(r.name)} ↗</a>
            ${r.video ? `<a class="btn btn--quiet btn--sm" href="${A.esc(r.video)}" target="_blank" rel="noopener">▶ ${A.esc(A.t('home.refs_video'))}</a>` : ''}
          </div>
        </article>`).join('');
    }

    /* --- two-market comparison ------------------------------------------ */
    const marketsHost = document.getElementById('homeMarkets');
    if (marketsHost) {
      marketsHost.innerHTML = A.markets().map(m => {
        const sites = S.locationsByMarket(m.id);
        const districts = Array.from(new Set(sites.map(l => l.district)));
        const devices = sites.reduce((s, l) => s + l.devices.length, 0);
        const avg = sites.length ? sites.reduce((s, l) => s + A.dayRate(l), 0) / sites.length : 0;
        return `<article class="card${m.id === mkt ? ' card--glow' : ''}">
          <div class="row row--between" style="align-items:flex-start">
            <div>
              <span class="pill pill--info">${A.esc(A.t('market.' + m.id))}</span>
              <h3 class="card__title" style="margin:12px 0 6px">${A.esc(A.t('market.' + m.id))} · ${A.esc(m.currency.code)}</h3>
              <p class="card__sub">${A.esc(A.t(m.id === 'th' ? 'home.market_th_desc' : 'home.market_hk_desc'))}</p>
            </div>
            <div style="text-align:right">
              <strong>${A.num(sites.length)}</strong>
              <div class="tiny muted">${A.esc(A.t('hero.trust_locations'))}</div>
            </div>
          </div>
          <ul class="kpi-list" style="margin-top:14px">
            <li><span>${A.esc(A.t('mkt.district'))}</span><b>${A.num(districts.length)}</b></li>
            <li><span>${A.esc(A.t('stat.devices'))}</span><b>${A.num(devices)}</b></li>
            <li><span>${A.esc(A.t('mkt.col_price'))}</span><b>${A.esc(A.priceWithLocal(Math.round(avg), m.id))}</b></li>
            <li><span>${A.esc(A.t('docs.col_currency'))}</span><b>${A.esc(m.currency.code)}</b></li>
          </ul>
          <div class="row" style="margin-top:14px">
            <button class="btn btn--primary btn--sm" type="button" data-goto-market="${m.id}">${A.esc(A.t('home.market_cta'))}</button>
          </div>
        </article>`;
      }).join('');
      marketsHost.querySelectorAll('[data-goto-market]').forEach(b => b.addEventListener('click', () => {
        const id = b.getAttribute('data-goto-market');
        A.setMarket(id);
        location.href = 'marketplace.html?market=' + id + '&lang=' + A.lang;
      }));
    }
  }

  document.addEventListener('DOMContentLoaded', render);
  A.onLangChange(render);
})();
