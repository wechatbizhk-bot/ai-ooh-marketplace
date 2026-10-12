/* 3dNakedEye — page-marketplace.js : filters, map, cards, table, add-to-booking */
(function () {
  'use strict';
  const S = window.LG.store, A = window.LG.app;
  const el = id => document.getElementById(id);
  const state = {
    q: '', district: '', venue: '', device: '', category: '',
    maxPrice: 3000, minAudience: 0, start: S.util.todayISO(3), days: 7, sov: 100,
    sort: 'recommended', view: 'grid',
    /* market: 'all' (both markets), 'hk' or 'th' — drives districts and maps */
    market: 'all',
    /* LBS */
    origin: null, radiusKm: (A.CFG.geo && A.CFG.geo.defaultRadiusKm) || 5,
    provider: (A.CFG.geo && A.CFG.geo.provider) || 'auto',
    status: 'all', withinOnly: false
  };
  let sharedAdd = null; /* ?add=... captured before the URL sync rewrites the query */
  let availMap = {};    /* locationId → availability for the current window */

  const dayRate = loc => Math.round(loc.devices.reduce((s, d) => {
    const t = window.LG_DEVICES[d.type]; return s + (t ? t.dailyRate : 0);
  }, 0) * S.venue(loc.venue).mult);

  function readURL() {
    const p = new URLSearchParams(location.search);
    sharedAdd = p.get('add');
    ['q', 'district', 'venue', 'device', 'category', 'sort', 'view', 'status', 'provider', 'market'].forEach(k => {
      if (p.get(k)) state[k] = p.get(k);
    });
    const o = p.get('origin');
    if (o && /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(o)) {
      const parts = o.split(',');
      state.origin = { lat: parseFloat(parts[0]), lng: parseFloat(parts[1]) };
    }
    if (p.get('radius')) state.radiusKm = parseInt(p.get('radius'), 10) || state.radiusKm;
    if (p.get('within') === '1') state.withinOnly = true;
    if (p.get('days')) state.days = Math.max(1, Math.min(90, parseInt(p.get('days'), 10) || 7));
    if (p.get('sov')) state.sov = parseInt(p.get('sov'), 10) || 100;
    if (p.get('maxPrice')) state.maxPrice = parseInt(p.get('maxPrice'), 10) || 3000;
    if (p.get('minAudience')) state.minAudience = parseInt(p.get('minAudience'), 10) || 0;
    if (p.get('start')) state.start = p.get('start');
  }
  function writeURL() {
    const p = new URLSearchParams();
    Object.keys(state).forEach(k => {
      const v = state[k];
      if (v === null || v === '' || v === false) return;
      const def = {
        maxPrice: 3000, minAudience: 0, days: 7, sov: 100, sort: 'recommended',
        view: 'grid', status: 'all', provider: 'auto', market: 'all',
        radiusKm: (A.CFG.geo && A.CFG.geo.defaultRadiusKm) || 5
      }[k];
      if (v !== def) p.set(k, v);
    });
    if (state.origin) p.set('origin', state.origin.lat.toFixed(4) + ',' + state.origin.lng.toFixed(4));
    if (state.withinOnly) p.set('within', '1');
    p.set('lang', A.lang);
    history.replaceState(null, '', location.pathname + '?' + p.toString());
  }

  function populateSelects() {
    /* market + LBS controls (labels are language dependent, so rebuild each render) */
    const mSel = el('mktMarket');
    if (mSel) {
      mSel.innerHTML = A.markets().map(m => `<option value="${m.id}">${A.esc(A.t('market.' + m.id))}</option>`).join('');
      mSel.value = state.market;
    }
    const mk = A.marketById(state.market === 'all' ? A.market : state.market);
    const rSel = el('lbsRadius');
    rSel.innerHTML = (mk.radiusOptionsKm || [1, 5, 10]).map(km =>
      `<option value="${km}">${km} km</option>`).join('');
    if (!(mk.radiusOptionsKm || []).includes(state.radiusKm)) state.radiusKm = (mk.radiusOptionsKm || [5])[2] || 5;
    rSel.value = String(state.radiusKm);
    /* landmarks: grouped by market so both Hong Kong and Thailand origins are available */
    const lSel = el('lbsLandmark');
    const mkts = state.market === 'all' ? A.markets() : [mk];
    lSel.innerHTML = `<option value="">${A.esc(A.t('lbs.landmark'))}</option>` +
      mkts.map(m => `<optgroup label="${A.esc(A.t('market.' + m.id))}">` +
        (m.landmarks || []).map(l => `<option value="${l.id}">${A.esc(A.t('lbs.lm_' + l.id))}</option>`).join('') +
        '</optgroup>').join('');
    el('lbsProvider').value = state.provider;
    const within = el('lbsWithin');
    if (within) within.checked = state.withinOnly;
    el('lbsStatusChips').querySelectorAll('[data-status]').forEach(b =>
      b.classList.toggle('is-active', b.getAttribute('data-status') === state.status));

    const dSel = el('fdistrict');
    /* Districts of every market on show, grouped by market (Hong Kong + Thailand). */
    const shownMarkets = state.market === 'all' ? A.markets().map(m => m.id) : [state.market];
    dSel.innerHTML = `<option value="">${A.esc(A.t('mkt.any'))}</option>` +
      shownMarkets.map(mid => {
        const list = S.districts().filter(d => (d.market || A.CFG.geo.defaultMarket) === mid);
        if (!list.length) return '';
        return `<optgroup label="${A.esc(A.t('market.' + mid))}">` +
          list.map(d => `<option value="${d.id}">${A.esc(A.L(d.label))}</option>`).join('') + '</optgroup>';
      }).join('');
    if (state.district && !Array.from(dSel.options).some(o => o.value === state.district)) state.district = '';
    if (el('fvenue').options.length <= 1) {
      window.LG_VENUES.forEach(v => {
        const o = document.createElement('option');
        o.value = v.id; o.textContent = A.L(v.label); el('fvenue').appendChild(o);
      });
      window.LG_CATEGORIES.forEach(c => {
        const o = document.createElement('option');
        o.value = c.id; o.textContent = A.L(c.label); el('fcat').appendChild(o);
      });
    } else {
      /* refresh labels after a language change */
      Array.from(el('fvenue').options).forEach(o => {
        if (o.value) o.textContent = A.L(S.venue(o.value).label);
        else o.textContent = A.t('mkt.any_venue');
      });
      Array.from(el('fcat').options).forEach(o => {
        if (o.value) o.textContent = A.L(window.LG_CATEGORIES.find(c => c.id === o.value).label);
        else o.textContent = A.t('mkt.cat_none');
      });
    }
    el('fq').value = state.q;
    dSel.value = state.district;
    el('fvenue').value = state.venue;
    el('fdevice').value = state.device;
    el('fcat').value = state.category;
    el('fprice').value = state.maxPrice;
    el('faud').value = state.minAudience;
    el('fstart').value = state.start;
    el('fdays').value = state.days;
    el('fsov').value = state.sov;
    el('sortSel').value = state.sort;
    el('fpriceOut').textContent = A.money(state.maxPrice);
    el('faudOut').textContent = A.num(state.minAudience);
  }

  /* Live locations of the market(s) currently on show. */
  const marketPool = () => (state.market === 'all' ? S.liveLocations() : S.locationsByMarket(state.market));

  function matches(loc) {
    const price = dayRate(loc);
    const audience = loc.footfallPerDay * loc.visibility;
    if (!loc.verified || loc.status !== 'live') return false;
    if (state.market !== 'all' && S.marketOfLocation(loc) !== state.market) return false;
    if (state.district && loc.district !== state.district) return false;
    if (state.venue && loc.venue !== state.venue) return false;
    if (state.category && (loc.restrictions || []).includes(state.category)) return false;
    if (price > state.maxPrice) return false;
    if (audience < state.minAudience) return false;
    if (state.device) {
      const ok = state.device === 'hologram' || state.device === 'screen'
        ? loc.devices.some(d => window.LG_DEVICES[d.type].form === state.device)
        : loc.devices.some(d => d.type === state.device);
      if (!ok) return false;
    }
    if (state.q) {
      const hay = [A.L(loc.name), A.L(loc.address), A.L(S.venue(loc.venue).label), A.L(S.district(loc.district).label), loc.id]
        .join(' ').toLowerCase();
      if (!hay.includes(state.q.toLowerCase())) return false;
    }
    if (state.start && loc.minDays && state.days < loc.minDays) return false;
    /* availability state (computed for the selected booking window) */
    const av = availMap[loc.id];
    if (state.status !== 'all' && av && av.state !== state.status) return false;
    /* proximity */
    if (state.withinOnly && state.origin) {
      const d = S.distanceKm(state.origin, S.locationGeo(loc.id));
      if (d == null || d > state.radiusKm) return false;
    }
    return true;
  }

  const distanceOf = loc => (state.origin ? S.distanceKm(state.origin, S.locationGeo(loc.id)) : null);

  function sort(list) {
    const arr = list.slice();
    const cmp = {
      recommended: (a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || (b.rating - a.rating) || (a.bookedPct - b.bookedPct),
      price_asc: (a, b) => dayRate(a) - dayRate(b),
      price_desc: (a, b) => dayRate(b) - dayRate(a),
      audience_desc: (a, b) => (b.footfallPerDay * b.visibility) - (a.footfallPerDay * a.visibility),
      footfall_desc: (a, b) => b.footfallPerDay - a.footfallPerDay,
      availability_desc: (a, b) => a.bookedPct - b.bookedPct,
      distance_asc: (a, b) => {
        const da = distanceOf(a), db = distanceOf(b);
        if (da == null && db == null) return 0;
        if (da == null) return 1;
        if (db == null) return -1;
        return da - db;
      }
    }[state.sort];
    return arr.sort(cmp || (() => 0));
  }

  /* ---------- LBS push-trigger simulator ---------------------------------
   * Push = the system offers content when a condition is met, as opposed to
   * pull, where the advertiser queries the map. Each trigger names the signal
   * that detects it and the venue types whose creative would switch. */
  const TRIGGERS = [
    { id: 'rain',    match: l => ['mall', 'restaurant', 'cinema', 'supermarket'].includes(l.venue) },
    { id: 'lunch',   match: l => ['restaurant', 'mall', 'office'].includes(l.venue) },
    { id: 'weekend', match: l => ['mall', 'cinema', 'retail', 'exhibition'].includes(l.venue) },
    { id: 'event',   match: l => ['exhibition', 'transport', 'hotel', 'mall'].includes(l.venue) },
    { id: 'beacon',  match: l => ['retail', 'clinic', 'restaurant', 'gym'].includes(l.venue) },
    { id: 'commute', match: l => ['transport', 'office', 'supermarket'].includes(l.venue) }
  ];
  let activeTrigger = null;

  function renderTriggers(results) {
    const chips = el('lbsTriggers');
    const out = el('lbsTriggerOut');
    if (!chips || !out) return;
    chips.innerHTML = TRIGGERS.map(t =>
      `<button type="button" class="trigger-chip${t.id === activeTrigger ? ' is-active' : ''}" data-trigger="${t.id}">
        ${A.esc(A.t('lbs.t_' + t.id))}</button>`).join('') +
      `<button type="button" class="trigger-chip" data-trigger="">${A.esc(A.t('lbs.sim_clear'))}</button>`;

    chips.querySelectorAll('[data-trigger]').forEach(b => b.addEventListener('click', () => {
      activeTrigger = b.getAttribute('data-trigger') || null;
      renderTriggers(results);
    }));

    if (!activeTrigger) {
      out.innerHTML = `<p class="small muted" style="margin:0">${A.esc(A.t('lbs.sim_hint'))}</p>`;
      return;
    }
    const t = TRIGGERS.find(x => x.id === activeTrigger);
    const pool = (results && results.length ? results : marketPool()).filter(t.match);
    const scoped = state.origin ? pool.filter(l => {
      const d = S.distanceKm(state.origin, S.locationGeo(l.id));
      return d != null && (!state.withinOnly || d <= state.radiusKm);
    }) : pool.slice();
    const sorted = scoped.slice().sort((a, b) => {
      if (state.origin) {
        return S.distanceKm(state.origin, S.locationGeo(a.id)) - S.distanceKm(state.origin, S.locationGeo(b.id));
      }
      return (b.footfallPerDay * b.visibility) - (a.footfallPerDay * a.visibility);
    }).slice(0, 4);

    out.innerHTML = `
      <div class="pushed-msg">
        <strong>${A.esc(A.t('lbs.t_' + t.id + '_m'))}</strong>
        <p class="small" style="margin:0 0 8px">${A.esc(A.t('lbs.t_' + t.id + '_d'))}</p>
        <div class="row" style="gap:8px">
          <span class="chip">${A.esc(A.t('lbs.sim_detect'))}: ${A.esc(A.t('lbs.t_' + t.id + '_src'))}</span>
          <span class="chip">${A.esc(A.t('lbs.sim_action'))}: ${A.esc(A.t('lbs.sim_variant'))}</span>
          ${state.origin && state.withinOnly ? `<span class="chip">${A.esc(A.t('lbs.within', { km: state.radiusKm }))}</span>` : ''}
        </div>
      </div>
      ${sorted.length ? `<div class="table-wrap" style="margin-top:12px"><table class="data data--compact">
        <thead><tr>
          <th>${A.esc(A.t('mkt.col_location'))}</th><th>${A.esc(A.t('mkt.col_venue'))}</th>
          <th>${A.esc(A.t('avail.label'))}</th>
          ${state.origin ? `<th class="num">${A.esc(A.t('lbs.distance'))}</th>` : ''}
          <th class="num">${A.esc(A.t('mkt.col_price'))}</th></tr></thead>
        <tbody>${sorted.map(l => {
          const av = availMap[l.id] || S.availability(l.id, state.start, state.days, { category: state.category });
          const d = distanceOf(l);
          return `<tr>
            <td><a href="location.html?id=${encodeURIComponent(l.id)}">${A.esc(A.L(l.name))}</a></td>
            <td class="tiny">${A.esc(A.L(S.venue(l.venue).label))}</td>
            <td>${A.statePill(av.state)}</td>
            ${state.origin ? `<td class="num">${d == null ? '—' : A.num(d, 1) + ' km'}</td>` : ''}
            <td class="num">${A.money(dayRate(l))}</td></tr>`;
        }).join('')}</tbody></table></div>`
        : `<p class="small muted" style="margin:12px 0 0">${A.esc(A.t('lbs.sim_none'))}</p>`}
      <p class="tiny muted" style="margin:10px 0 0">${A.esc(state.origin ? A.t('lbs.sim_scope', { km: state.radiusKm }) : A.t('lbs.sim_no_origin'))}</p>`;
  }

  function render() {
    /* availability for the whole window, per location */
    availMap = {};
    S.locations().forEach(l => {
      availMap[l.id] = S.availability(l.id, state.start, state.days, { category: state.category });
    });

    populateSelects();
    const pool = marketPool();
    const results = sort(pool.filter(matches));
    const grid = el('mktResults');
    const tableWrap = el('mktTableWrap');

    el('resultCount').textContent = A.t('mkt.results', { n: A.num(results.length) });
    const totalMedia = results.reduce((s, l) => s + Math.round(dayRate(l) * (S.CFG.pricing.sovDiscount[state.sov] || 1) * state.days), 0);
    el('filterSummary').innerHTML = A.t('mkt.summary', {
      days: state.days, sov: state.sov, budget: A.money(totalMedia)
    });

    /* LBS summary line */
    const nearest = results.map(l => distanceOf(l)).filter(d => d != null).sort((a, b) => a - b)[0];
    const counts = { available: 0, partial: 0, occupied: 0, restricted: 0, pending: 0 };
    results.forEach(l => { const st = availMap[l.id].state; counts[st] = (counts[st] || 0) + 1; });
    el('lbsSummary').innerHTML = [
      `<strong>${A.esc(state.market === 'all' ? A.t('mkt.all_markets') : A.t('market.' + state.market))}</strong> · ` +
      A.esc(A.t('lbs.summary', {
        from: A.date(state.start), to: A.date(S.util.addDays(state.start, state.days)),
        days: state.days, n: results.length
      })),
      ' · ' + A.esc(A.t('lbs.summary_states', {
        free: counts.available, partial: counts.partial, full: counts.occupied
      })),
      state.origin && nearest != null ? ' · ' + A.esc(A.t('lbs.summary_geo', { km: A.num(nearest, 1) })) : ''
    ].join('');

    if (!results.length) {
      grid.innerHTML = `<div class="empty"><h3>${A.esc(A.t('mkt.no_results'))}</h3>
        <p>${A.esc(A.t('mkt.no_results_body'))}</p></div>`;
    } else {
      grid.innerHTML = results.map(l => A.locationCard(l, {
        avail: availMap[l.id], distanceKm: distanceOf(l)
      })).join('');
      grid.querySelectorAll('[data-add]').forEach(btn => btn.addEventListener('click', () => addOne(btn.getAttribute('data-add'), btn)));
    }

    el('mktTableBody').innerHTML = results.map(l => {
      const av = availMap[l.id], d = distanceOf(l);
      return `<tr>
      <td><a href="location.html?id=${encodeURIComponent(l.id)}">${A.esc(A.L(l.name))}</a>
        <div class="tiny muted mono">${A.esc(l.id)}</div></td>
      <td><span class="chip">${A.esc(A.marketLabel(S.marketOfLocation(l)))}</span></td>
      <td>${A.esc(A.L(S.district(l.district).label))}</td>
      <td>${A.esc(A.L(S.venue(l.venue).label))}</td>
      <td class="num">${l.devices.length}</td>
      <td class="num">${A.num(l.footfallPerDay)}</td>
      <td class="num">${A.num(l.footfallPerDay * l.visibility)}</td>
      <td class="num">${A.money(dayRate(l))}</td>
      <td>${A.statePill(av.state)}<div class="tiny muted">${av.freePct}% ${A.esc(A.t('avail.free'))}</div></td>
      <td class="num">${d == null ? '—' : A.num(d, 1) + ' km'}</td>
      <td><button class="btn btn--primary btn--sm" data-add="${l.id}">${A.esc(A.t('cta.add_short'))}</button></td>
    </tr>`;
    }).join('');
    el('mktTableBody').querySelectorAll('[data-add]').forEach(b =>
      b.addEventListener('click', () => addOne(b.getAttribute('data-add'), b)));

    renderTriggers(results);

    grid.classList.toggle('hide', state.view !== 'grid');
    tableWrap.classList.toggle('hide', state.view !== 'table');
    el('viewSeg').querySelectorAll('button').forEach(b =>
      b.classList.toggle('is-active', b.getAttribute('data-view') === state.view));

    renderMaps(results, grid, tableWrap);
    writeURL();
  }

  /* One map per market on show: Hong Kong and Thailand stacked when both are
   * selected, a single map when the filter narrows to one market. */
  function renderMaps(results, grid, tableWrap) {
    const wrap = el('mktMapWrap');
    const ids = state.market === 'all' ? A.markets().map(m => m.id) : [state.market];
    wrap.className = ids.length > 1 ? 'grid grid--2' : 'stack';
    wrap.style.marginBottom = '20px';
    wrap.innerHTML = ids.map(id =>
      `<div class="map-panel"><span class="chip" style="margin-bottom:8px;display:inline-flex">${A.esc(A.t('market.' + id))}</span>
        <div id="mktMap-${id}"></div></div>`).join('');

    ids.forEach(id => {
      const host = document.getElementById('mktMap-' + id);
      const subset = results.filter(l => S.marketOfLocation(l) === id);
      const pins = subset.length ? subset : S.locationsByMarket(id);
      A.lbsMap(host, pins, {
        market: id,
        origin: state.origin, radiusKm: state.radiusKm, provider: state.provider,
        from: state.start, days: state.days, category: state.category,
        height: ids.length > 1 ? 340 : 460,
        hideControls: true,   /* this page has its own LBS control bar */
        onOrigin: (pt, km) => {
          state.origin = pt || null;
          if (km) state.radiusKm = km;
          if (!pt) state.withinOnly = false;
          render();
        },
        onPin(locId) {
          state.view = 'grid';
          grid.classList.remove('hide'); tableWrap.classList.add('hide');
          const card = grid.querySelector('[data-loc="' + locId + '"]');
          if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.style.borderColor = 'var(--brand-3)';
            setTimeout(() => { card.style.borderColor = ''; }, 1600);
          }
        }
      });
    });
  }

  function addOne(id, btn) {
    const loc = S.location(id);
    S.addToCart({ locationId: id, days: state.days, sov: state.sov, start: state.start });
    A.toast(A.t('toast.added_cart', { name: A.L(loc.name) }), 'ok');
    if (btn) { btn.textContent = A.t('cta.added'); btn.classList.add('btn--ok'); }
  }

  function bind() {
    el('fq').addEventListener('input', e => { state.q = e.target.value; render(); });    el('fdistrict').addEventListener('change', e => { state.district = e.target.value; render(); });
    el('fvenue').addEventListener('change', e => { state.venue = e.target.value; render(); });
    el('fdevice').addEventListener('change', e => { state.device = e.target.value; render(); });
    el('fcat').addEventListener('change', e => { state.category = e.target.value; render(); });
    el('fprice').addEventListener('input', e => {
      state.maxPrice = parseInt(e.target.value, 10); el('fpriceOut').textContent = A.money(state.maxPrice);
    });
    el('fprice').addEventListener('change', render);
    el('faud').addEventListener('input', e => {
      state.minAudience = parseInt(e.target.value, 10); el('faudOut').textContent = A.num(state.minAudience);
    });
    el('faud').addEventListener('change', render);
    el('fstart').addEventListener('change', e => { state.start = e.target.value; render(); });
    el('fdays').addEventListener('change', e => { state.days = Math.max(1, Math.min(90, parseInt(e.target.value, 10) || 1)); render(); });
    el('fsov').addEventListener('change', e => { state.sov = parseInt(e.target.value, 10); render(); });
    el('sortSel').addEventListener('change', e => { state.sort = e.target.value; render(); });
    el('viewSeg').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      state.view = b.getAttribute('data-view'); render();
    });
    el('resetFilters').addEventListener('click', () => {
      Object.assign(state, { q: '', district: '', venue: '', device: '', category: '', maxPrice: 3000, minAudience: 0, days: 7, sov: 100, sort: 'recommended' });
      render();
    });
    el('addAll').addEventListener('click', () => {
      const results = sort(marketPool().filter(matches));
      if (!results.length) { A.toast(A.t('mkt.no_results'), 'warn'); return; }
      results.forEach(l => S.addToCart({ locationId: l.id, days: state.days, sov: state.sov, start: state.start }));
      A.toast(A.t('toast.added_all', { n: results.length }), 'ok');
    });

    /* --- market + LBS --- */
    el('mktMarket').addEventListener('change', e => {
      state.market = e.target.value;
      state.district = '';
      state.origin = null;
      state.withinOnly = false;
      if (state.market !== 'all') A.setMarket(state.market);
      render();
    });
    /* choosing a district from the other market follows it there */
    el('fdistrict').addEventListener('change', () => {
      const d = S.district(state.district);
      if (state.district && d.market && state.market !== 'all' && d.market !== state.market) {
        state.market = d.market;
        A.setMarket(d.market);
      } else if (state.district && d.market && state.market === 'all') {
        /* keep both markets listed, but centre the maps on the chosen one */
        A.setMarket(d.market);
      }
      render();
    });
    el('lbsLocate').addEventListener('click', () => {
      el('lbsLocate').disabled = true;
      A.locate()
        .then(pt => {
          state.origin = pt; state.withinOnly = true; state.sort = 'distance_asc';
          el('sortSel').value = 'distance_asc';
          A.toast(A.t('lbs.located'), 'ok');
          render();
        })
        .catch(err => A.toast(A.t(err && err.code === 1 ? 'lbs.denied' : 'lbs.unavailable'), 'warn'))
        .finally(() => { el('lbsLocate').disabled = false; });
    });
    el('lbsRadius').addEventListener('change', e => { state.radiusKm = parseInt(e.target.value, 10); render(); });
    el('lbsLandmark').addEventListener('change', e => {
      const l = A.landmarks(state.market).find(x => x.id === e.target.value);
      if (!l) return;
      state.origin = { lat: l.lat, lng: l.lng };
      state.sort = 'distance_asc';
      el('sortSel').value = 'distance_asc';
      render();
    });
    el('lbsProvider').addEventListener('change', e => { state.provider = e.target.value; render(); });
    el('lbsWithin').addEventListener('change', e => { state.withinOnly = e.target.checked; render(); });
    el('lbsClear').addEventListener('click', () => {
      state.origin = null; state.withinOnly = false; el('lbsLandmark').value = ''; render();
    });
    el('lbsStatusChips').addEventListener('click', e => {
      const b = e.target.closest('[data-status]'); if (!b) return;
      state.status = b.getAttribute('data-status'); render();
    });
  }

  /* Shareable basket link: marketplace.html?add=LC-1042,LC-5104&days=14&sov=50 */
  function handleSharedBasket() {
    if (!sharedAdd) return;
    let n = 0;
    sharedAdd.split(',').map(s => s.trim()).filter(Boolean).forEach(id => {
      if (S.location(id) && !S.cart().some(l => l.locationId === id)) {
        S.addToCart({ locationId: id, days: state.days, sov: state.sov, start: state.start });
        n++;
      }
    });
    sharedAdd = null;
    if (n) A.toast(A.t('mkt.shared_basket', { n }), 'ok');
  }

  document.addEventListener('DOMContentLoaded', () => {
    readURL();
    bind();
    render();
    handleSharedBasket();
  });
  A.onLangChange(render);
})();
