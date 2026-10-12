/* 3dNakedEye — page-location.js : location detail + instant booking widget */
(function () {
  'use strict';
  const S = window.LG.store, A = window.LG.app;
  const q = id => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const locId = params.get('id') || S.liveLocations()[0].id;
  const loc = S.location(locId);

  const sel = { start: S.util.todayISO(3), days: 7, sov: 100, slot: 'all_day', devices: [] };

  const dayRate = l => Math.round(l.devices.reduce((s, d) => {
    const t = window.LG_DEVICES[d.type]; return s + (t ? t.dailyRate : 0);
  }, 0) * S.venue(l.venue).mult);

  function availability(dateISO) {
    const rnd = S.util.seedFrom(loc.id + dateISO);
    const dow = new Date(dateISO + 'T00:00:00').getDay();
    const weekend = dow === 0 || dow === 6;
    const base = loc.bookedPct / 100;
    let v = Math.min(0.97, Math.max(0.03, base + (rnd() - 0.5) * 0.5 + (weekend ? 0.12 : 0)));
    return { booked: Math.round(v * 100), free: Math.max(0, 100 - Math.round(v * 100)) };
  }

  function renderBody() {
    if (!loc) {
      q('locBody').innerHTML = `<div class="empty"><h3>${A.esc(A.t('loc.not_found'))}</h3>
        <p><a href="marketplace.html">${A.esc(A.t('mkt.title'))}</a></p></div>`;
      return;
    }
    q('crumbName').textContent = A.L(loc.name);
    document.title = A.L(loc.name) + ' — 3dNakedEye';
    const d = S.district(loc.district), v = S.venue(loc.venue);
    const audience = loc.footfallPerDay * loc.visibility;
    const price = dayRate(loc);

    /* --- header block --- */
    const header = `<div class="card card--flush">
      <div style="aspect-ratio:21/9;background:#071426">${A.thumb(loc, 960, 400)}</div>
      <div class="card" style="border:0;background:transparent">
        <div class="row row--between" style="align-items:flex-start">
          <div>
            <div class="row" style="gap:8px;margin-bottom:6px">
              ${loc.verified ? `<span class="pill pill--ok">✓ ${A.esc(A.t('badge.verified'))}</span>` : `<span class="pill pill--warn">${A.esc(A.t('badge.pending'))}</span>`}
              <span class="pill">${A.esc(A.L(v.label))}</span>
              <span class="pill">${A.esc(A.L(d.label))}</span>
              ${loc.rating ? `<span class="pill">★ ${loc.rating} · ${A.num(loc.reviews)} ${A.esc(A.t('loc.reviews'))}</span>` : ''}
            </div>
            <h1 style="font-size:clamp(1.4rem,2.6vw,2rem);margin:0 0 6px">${A.esc(A.L(loc.name))}</h1>
            <p class="muted" style="margin:0">${A.esc(A.L(loc.address))} · <span class="mono tiny">${A.esc(loc.id)}</span></p>
          </div>
          <div style="text-align:right">
            <div class="quote-total">${A.money(price)}</div>
            <span class="tiny muted">${A.esc(A.t('unit.per_day'))} · ${loc.devices.length} ${A.esc(A.t('stat.devices'))}</span>
          </div>
        </div>
      </div>
    </div>`;

    /* --- key facts + devices + restrictions + hours --- */
    const facts = `<div class="stat-grid">
      ${A.stat(A.t('stat.footfall'), A.num(loc.footfallPerDay), A.t('stat.footfall_sub'), 'brand')}
      ${A.stat(A.t('stat.dwell'), A.num(loc.dwellSec) + ' s', A.t('stat.dwell_sub'))}
      ${A.stat(A.t('stat.est_audience'), A.num(audience), A.t('stat.est_audience_sub'))}
      ${A.stat(A.t('stat.visibility'), A.pct(loc.visibility, 0), A.t('stat.visibility_sub'))}
      ${A.stat(A.t('stat.devices'), String(loc.devices.length), loc.devices.filter(x => x.online).length + ' ' + A.t('status.live'))}
    </div>`;

    const devRows = loc.devices.map(dv => {
      const t = window.LG_DEVICES[dv.type];
      return `<tr>
        <td><strong class="mono">${A.esc(dv.id)}</strong><div class="tiny muted">${A.esc(A.L(t.label))}</div></td>
        <td>${A.esc(A.L(dv.position))}</td>
        <td>${dv.online ? `<span class="pill pill--ok">${A.esc(A.t('status.live'))}</span>` : `<span class="pill pill--bad">${A.esc(A.t('status.offline'))}</span>`}
          <div class="tiny muted">${A.num(dv.uptime, 1)}%</div></td>
        <td class="num">${A.money(t.dailyRate)}</td>
        <td class="tiny">${A.esc(A.L(t.contentSpec))}</td>
      </tr>`;
    }).join('');

    const devices = `<div class="card">
      <div class="card__head"><div>
        <h3 class="card__title">${A.esc(A.t('loc.device_inventory'))}</h3>
        <p class="card__sub">${A.esc(A.t('loc.device_inventory_sub'))}</p>
      </div></div>
      <div class="table-wrap"><table class="data">
        <thead><tr>
          <th>${A.esc(A.t('loc.col_device'))}</th><th>${A.esc(A.t('loc.col_position'))}</th>
          <th>${A.esc(A.t('loc.col_status'))}</th><th class="num">${A.esc(A.t('loc.col_dayrate'))}</th>
          <th>${A.esc(A.t('loc.col_spec'))}</th>
        </tr></thead><tbody>${devRows}</tbody></table></div>
      <div class="card__foot">
        <p class="tiny muted" style="margin:0">${A.esc(A.t('loc.spec_note'))}</p>
      </div>
    </div>`;

    const restrictions = `<div class="card">
      <h3 class="card__title">${A.esc(A.t('loc.rules_title'))}</h3>
      <p class="card__sub">${A.esc(A.t('loc.rules_sub'))}</p>
      <div class="row" style="margin:10px 0 14px">
        ${(loc.restrictions || []).length
          ? loc.restrictions.map(c => {
              const cat = window.LG_CATEGORIES.find(x => x.id === c);
              return `<span class="chip chip--off">⛔ ${A.esc(cat ? A.L(cat.label) : c)}</span>`;
            }).join('')
          : `<span class="chip">${A.esc(A.t('loc.no_restrictions'))}</span>`}
      </div>
      <ul class="kpi-list">
        <li><span>${A.esc(A.t('loc.hours'))}</span><b>10:00 – 22:00</b></li>
        <li><span>${A.esc(A.t('loc.power'))}</span><b>${A.esc(A.t('loc.power_v'))}</b></li>
        <li><span>${A.esc(A.t('loc.network'))}</span><b>${A.esc(A.t('loc.network_v'))}</b></li>
        <li><span>${A.esc(A.t('loc.install'))}</span><b>${A.esc(A.t('loc.install_v'))}</b></li>
        <li><span>${A.esc(A.t('loc.min_days'))}</span><b>${loc.minDays} ${A.esc(A.t('unit.days'))}</b></li>
        <li><span>${A.esc(A.t('loc.landlord'))}</span><b>${A.esc(A.L(loc.landlord))}</b></li>
        <li><span>${A.esc(A.t('loc.booked'))}</span><b>${loc.bookedPct}%</b></li>
      </ul>
      <div class="meter ${loc.bookedPct > 70 ? 'meter--warn' : ''}" style="margin-top:12px"><span style="width:${loc.bookedPct}%"></span></div>
      <p class="tiny muted">${A.esc(A.t('loc.booked_note'))}</p>
    </div>`;

    /* --- availability calendar (next 30 days) --- */
    const days = Array.from({ length: 30 }, (_, i) => S.util.todayISO(i));
    const cal = `<div class="card">
      <div class="card__head"><div>
        <h3 class="card__title">${A.esc(A.t('loc.availability'))}</h3>
        <p class="card__sub">${A.esc(A.t('loc.availability_sub'))}</p>
      </div>
      <span class="pill pill--info">${A.esc(A.t('loc.legend_free'))} / ${A.esc(A.t('loc.legend_busy'))}</span></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(74px,1fr));gap:8px" id="calGrid">
        ${days.map(iso => {
          const a = availability(iso);
          const lvl = a.free > 60 ? 'ok' : a.free > 25 ? 'warn' : 'bad';
          const lbl = new Intl.DateTimeFormat(A.locale(), { weekday: 'short' }).format(new Date(iso + 'T00:00:00'));
          return `<button type="button" class="panel" data-day="${iso}" style="padding:8px;text-align:center;cursor:pointer;border-color:var(--line)">
            <div class="tiny muted">${A.esc(lbl)}</div>
            <div style="font-weight:700">${iso.slice(8)}</div>
            <div class="tiny" style="color:var(--${lvl === 'ok' ? 'ok' : lvl === 'warn' ? 'warn' : 'bad'})">${a.free}%</div>
          </button>`;
        }).join('')}
      </div>
      <p class="tiny muted" style="margin-top:10px">${A.esc(A.t('loc.cal_note'))}</p>
    </div>`;

    /* --- audience model + map --- */
    const model = `<div class="grid grid--2">
      <div class="card">
        <h3 class="card__title">${A.esc(A.t('loc.audience_model'))}</h3>
        <p class="card__sub">${A.esc(A.t('loc.audience_sub'))}</p>
        <ul class="kpi-list" style="margin-top:12px">
          <li><span>${A.esc(A.t('stat.footfall'))}</span><b>${A.num(loc.footfallPerDay)}</b></li>
          <li><span>${A.esc(A.t('stat.visibility'))}</span><b>${A.pct(loc.visibility, 0)}</b></li>
          <li><span>${A.esc(A.t('stat.est_audience'))}</span><b>${A.num(audience)}</b></li>
          <li><span>${A.esc(A.t('loc.imp_100'))}</span><b>${A.num(audience * 1)}</b></li>
          <li><span>${A.esc(A.t('loc.imp_sov', { sov: sel.sov }))}</span><b>${A.num(audience * (sel.sov / 100))}</b></li>
        </ul>
        <div class="note" style="margin-top:12px">${A.esc(A.t('loc.audience_note'))}</div>
      </div>
      <div class="map-panel" id="locMap"></div>
    </div>`;

    q('locBody').innerHTML = header + facts + devices + restrictions + cal + model;

    /* calendar click sets start date */
    q('calGrid').querySelectorAll('[data-day]').forEach(b => b.addEventListener('click', () => {
      sel.start = b.getAttribute('data-day');
      q('bStart').value = sel.start;
      q('calGrid').querySelectorAll('[data-day]').forEach(x => x.style.borderColor = 'var(--line)');
      b.style.borderColor = 'var(--brand)';
      renderQuote();
    }));
    A.map(q('locMap'), [loc]);
  }

  function renderDevicesField() {
    q('bDevices').innerHTML = loc.devices.map(dv => {
      const t = window.LG_DEVICES[dv.type];
      return `<label class="check"><input type="checkbox" value="${dv.id}" checked>
        <span><strong>${A.esc(t.sku)}</strong> · ${A.esc(A.L(t.label))}<br>
        <span class="tiny muted">${A.esc(A.L(dv.position))} · ${A.money(t.dailyRate)}/${A.esc(A.t('unit.per_day'))}</span></span></label>`;
    }).join('');
    q('bDevices').querySelectorAll('input').forEach(i => i.addEventListener('change', () => {
      sel.devices = Array.from(q('bDevices').querySelectorAll('input:checked')).map(x => x.value);
      renderQuote();
    }));
  }

  function renderQuote() {
    const line = S.lineQuote({ locationId: loc.id, days: sel.days, sov: sel.sov, deviceIds: sel.devices, slot: sel.slot });
    const end = S.util.addDays(sel.start, sel.days);
    q('bQuote').innerHTML = `
      <ul class="kpi-list">
        <li><span>${A.esc(A.t('loc.q_window'))}</span><b>${A.esc(A.date(sel.start))} → ${A.esc(A.date(end))}</b></li>
        <li><span>${A.esc(A.t('loc.q_rate'))}</span><b>${A.money(line.ratePerDay)}</b></li>
        <li><span>${A.esc(A.t('loc.q_sov'))}</span><b>${line.sov}%</b></li>
        <li><span>${A.esc(A.t('loc.q_discount'))}</span><b>${line.dayDiscount ? '−' + A.pct(line.dayDiscount, 0) : '—'}</b></li>
        <li><span>${A.esc(A.t('loc.q_plays'))}</span><b>${A.num(line.playsPerDay * line.deviceCount)}/${A.esc(A.t('unit.per_day'))}</b></li>
        <li><span>${A.esc(A.t('loc.q_imp'))}</span><b>${A.num(line.estImpressionsPerDay * line.deviceCount)}/${A.esc(A.t('unit.per_day'))}</b></li>
      </ul>
      <div class="row row--between" style="margin-top:12px">
        <span class="muted small">${A.esc(A.t('loc.q_media'))}</span>
        <strong class="quote-total" style="font-size:1.5rem">${A.money(line.media)}</strong>
      </div>`;
  }

  function addToCart(goCheckout) {
    sel.devices = Array.from(q('bDevices').querySelectorAll('input:checked')).map(x => x.value);
    if (!sel.devices.length) { A.toast(A.t('loc.need_device'), 'warn'); return; }
    S.addToCart({ locationId: loc.id, days: sel.days, sov: sel.sov, deviceIds: sel.devices, start: sel.start, slot: sel.slot });
    if (goCheckout) location.href = 'checkout.html?lang=' + A.lang;
    else A.toast(A.t('toast.added_cart', { name: A.L(loc.name) }), 'ok');
  }

  function bind() {
    if (!loc) return;
    sel.devices = loc.devices.map(d => d.id);
    q('bStart').value = sel.start;
    q('bStart').min = S.util.todayISO(0);
    q('bDays').value = sel.days;
    q('bStart').addEventListener('change', e => { sel.start = e.target.value || sel.start; renderQuote(); });
    q('bDays').addEventListener('change', e => { sel.days = Math.max(1, Math.min(90, parseInt(e.target.value, 10) || 1)); renderQuote(); });
    q('bSov').addEventListener('change', e => { sel.sov = parseInt(e.target.value, 10); renderQuote(); });
    q('bSlot').addEventListener('change', e => { sel.slot = e.target.value; renderQuote(); });
    q('bAdd').addEventListener('click', () => addToCart(false));
    q('bBookPay').addEventListener('click', () => addToCart(true));
    renderDevicesField();
    renderQuote();
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderBody();
    bind();
  });
  A.onLangChange(() => {
    renderBody();
    renderDevicesField();
    renderQuote();
  });
})();
