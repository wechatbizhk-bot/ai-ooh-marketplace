/* ============================================================================
 * 3dNakedEye — page-membership.js
 * Membership tiers from CFG.membership, the comparison table, and the
 * activation flow: signed-in members switch tier immediately (and are emailed
 * a welcome), visitors are sent to sign-up with the plan remembered.
 * ==========================================================================*/
(function () {
  'use strict';

  const S = window.LG.store;
  const A = () => window.LG.app;
  const t = (k, v) => A().t(k, v);
  const q = id => document.getElementById(id);
  const CFG = window.LG_CONFIG;

  const tiers = () => (CFG.membership && CFG.membership.tiers) || [];

  function price(tier) {
    if (tier.priceHkd == null) return t('mem.on_request');
    if (tier.priceHkd === 0) return t('mem.free');
    return A().money(tier.priceHkd) + ' <span class="tiny muted">/ ' + A().esc(t('mem.per_month')) + '</span>';
  }

  function renderCards() {
    const host = q('memCards');
    if (!host) return;
    const sess = S.session();
    const current = sess ? sess.tier : null;
    host.innerHTML = tiers().map(tier => `
      <article class="card plan${tier.highlight ? ' plan--highlight' : ''}">
        ${tier.highlight ? `<span class="pill pill--info plan__flag">${A().esc(t('mem.popular'))}</span>` : ''}
        <h3>${A().esc(t('mem.tier_' + tier.id + '.name'))}</h3>
        <p class="plan__tag">${A().esc(t('mem.tier_' + tier.id + '.tagline'))}</p>
        <p class="plan__price">${price(tier)}</p>
        <ul class="plan__list">
          ${(tier.id === 'free' ? [1, 2, 3, 4, 5] : [1, 2, 3, 4, 5, 6])
            .map(i => `<li>${A().esc(t(tier.id === 'free' ? 'mem.free_' + i : 'mem.paid_' + i))}</li>`).join('')}
        </ul>
        ${current === tier.id
          ? `<span class="pill pill--ok">${A().esc(t('mem.current_plan'))}</span>`
          : `<button class="btn ${tier.highlight ? 'btn--primary' : 'btn--ghost'}" type="button" data-tier="${tier.id}">
               ${A().esc(t(sess ? 'mem.switch_to' : 'mem.choose', { tier: t('mem.tier_' + tier.id + '.name') }))}
             </button>`}
      </article>`).join('');

    host.querySelectorAll('[data-tier]').forEach(b => b.addEventListener('click', () => choose(b.getAttribute('data-tier'))));
  }

  function renderTable() {
    const host = q('memTable');
    if (!host) return;
    const cols = tiers();
    host.innerHTML = `<thead><tr><th>${A().esc(t('mem.feature'))}</th>
      ${cols.map(c => `<th>${A().esc(t('mem.tier_' + c.id + '.name'))}</th>`).join('')}</tr></thead>
      <tbody>
        ${[1, 2, 3, 4, 5, 6].map(i => `<tr>
          <td>${A().esc(t('mem.paid_' + i))}</td>
          ${cols.map(c => `<td>${c.id === 'free' ? '<span class="muted">—</span>' : '<span class="tick">✓</span>'}</td>`).join('')}
        </tr>`).join('')}
        ${[1, 2, 3, 4, 5].map(i => `<tr>
          <td>${A().esc(t('mem.free_' + i))}</td>
          ${cols.map(() => '<td><span class="tick">✓</span></td>').join('')}
        </tr>`).join('')}
      </tbody>`;
  }

  function choose(tierId) {
    const sess = S.session();
    if (!sess) {
      A().toast(t('mem.need_login'), 'info');
      location.href = 'login.html?tab=signup&plan=' + encodeURIComponent(tierId);
      return;
    }
    const res = S.setTier(tierId);
    if (!res.ok) return;
    A().toast(res.previous === 'free' || tierId === 'free'
      ? (tierId === 'free' ? t('mem.downgraded', { tier: t('mem.tier_free.name') }) : t('mem.activated', { tier: t('mem.tier_' + tierId + '.name') }))
      : t('mem.activated', { tier: t('mem.tier_' + tierId + '.name') }), 'ok');
    renderAll();
    document.dispatchEvent(new CustomEvent('lg:auth', { detail: { session: S.session() } }));
  }

  function renderAccount() {
    const host = q('memAccount');
    if (!host) return;
    const sess = S.session();
    if (!sess) {
      host.innerHTML = `<div class="card">
        <h3>${A().esc(t('auth.guest_actions'))}</h3>
        <p class="muted">${A().esc(t('mem.need_login'))}</p>
        <div class="row" style="margin-top:10px">
          <a class="btn btn--primary btn--sm" href="login.html?tab=signup">${A().esc(t('auth.signup'))}</a>
          <a class="btn btn--ghost btn--sm" href="login.html">${A().esc(t('auth.signin'))}</a>
        </div></div>`;
      return;
    }
    const tier = S.tier();
    host.innerHTML = `<div class="card">
      <div class="row" style="justify-content:space-between;align-items:center">
        <div>
          <h3>${A().esc(sess.name)}</h3>
          <p class="muted">${A().esc(sess.email)} · ${A().esc(t('auth.role_' + sess.role))}</p>
        </div>
        <div class="row">
          ${tier ? `<span class="pill pill--info">${A().esc(t('mem.tier_' + tier.id + '.name'))}</span>` : ''}
          <a class="btn btn--quiet btn--sm" href="${sess.role === 'landlord' ? 'landlord.html' : 'advertiser.html'}">${A().esc(t('nav.dashboard'))}</a>
        </div>
      </div>
      <p class="tiny muted" style="margin-top:8px">${A().esc(t('auth.member_since', { date: A().date(sess.since) }))}</p>
    </div>`;
  }

  function renderAll() {
    if (!q('memCards')) return;
    renderCards(); renderTable(); renderAccount();
    const trial = q('memTrial');
    if (trial) trial.textContent = t('mem.trial_note', { days: (CFG.membership && CFG.membership.trialDays) || 14 });
  }

  document.addEventListener('DOMContentLoaded', renderAll);
  A().onLangChange(renderAll);
  document.addEventListener('lg:auth', () => { renderCards(); renderAccount(); });
})();
