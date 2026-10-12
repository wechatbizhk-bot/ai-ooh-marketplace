/* ============================================================================
 * 3dNakedEye — page-auth.js
 * Two jobs:
 *   1. login.html — role tabs, sign in, create account, demo accounts,
 *      simulated password reset. All state lives in LG.store.
 *   2. Every page carrying <body data-requires-role="advertiser|landlord|
 *      operator"> gets a real gate: the dashboard below it is hidden until a
 *      session with the right role exists. The demo button signs the visitor
 *      in with the seeded account so the dashboard can still be reviewed.
 *
 * The gate is a demonstration of the production flow (docs.html §13): the
 * role check belongs on the server, and here it runs on every load.
 * ==========================================================================*/
(function () {
  'use strict';

  const S = window.LG.store;
  const A = () => window.LG.app;
  const t = (k, v) => A().t(k, v);
  const q = id => document.getElementById(id);
  const CFG = window.LG_CONFIG;

  /* ---------------------------------------------------------------- gate */
  function gate() {
    const role = document.body.getAttribute('data-requires-role');
    if (!role) return;
    const main = document.querySelector('main');
    if (!main) return;

    const demo = ((CFG.auth && CFG.auth.demoAccounts) || []).find(a => a.role === role) || null;
    const store = q('dashGate') || document.createElement('section');
    if (!store.id) { store.id = 'dashGate'; main.insertBefore(store, main.firstChild); }

    const session = S.session();
    const allowed = session && session.role === role;
    /* Locking by class, not by the hidden attribute: author CSS sets display
     * on these containers, which beats the user-agent [hidden] rule. */
    main.classList.toggle('is-locked', !allowed);
    Array.from(main.children).forEach(child => { if (child !== store) child.removeAttribute('hidden'); });

    if (allowed) { store.hidden = true; store.innerHTML = ''; renderAccountBar(role); return; }
    store.hidden = false;
    store.innerHTML = `
      <div class="card gate">
        <div class="gate__lock" aria-hidden="true">🔒</div>
        <h1>${A().esc(t('auth.gate_title'))}</h1>
        <p>${A().esc(t('auth.gate_lede', { role: t('auth.role_' + role) }))}</p>
        <div class="row row--wrap" style="margin-top:14px">
          <a class="btn btn--primary" href="login.html?role=${A().esc(role)}">${A().esc(t('auth.gate_signin'))}</a>
          ${demo ? `<button class="btn btn--ghost" type="button" id="gateDemo">${A().esc(t('auth.gate_demo', { role: t('auth.role_' + role) }))}</button>` : ''}
          <a class="btn btn--quiet" href="login.html?tab=signup&role=${A().esc(role)}">${A().esc(t('auth.gate_signup'))}</a>
          <a class="btn btn--quiet" href="membership.html">${A().esc(t('nav.membership'))}</a>
        </div>
        <p class="tiny muted" style="margin-top:10px">${A().esc(t('auth.secure_note'))}</p>
      </div>`;
    const btn = q('gateDemo');
    if (btn) btn.addEventListener('click', () => {
      const res = S.signIn({ email: demo.email, password: demo.password, role });
      if (res.ok) {
        A().toast(t('auth.welcome', { name: res.session.name, role: t('auth.role_' + role) }), 'ok');
        gate();
        A().injectAccountChip();
      }
    });
  }

  function renderAccountBar(role) {
    const main = document.querySelector('main');
    if (!main || q('dashAccountBar')) return;
    const sess = S.session();
    const tier = S.tier();
    const bar = document.createElement('div');
    bar.id = 'dashAccountBar';
    bar.className = 'account-bar';
    bar.innerHTML = `
      <span class="avatar avatar--sm">${A().esc(A().initials(sess.name))}</span>
      <strong>${A().esc(sess.name)}</strong>
      <span class="pill pill--info">${A().esc(t('auth.role_' + sess.role))}</span>
      ${tier ? `<span class="pill pill--muted">${A().esc(t('mem.tier_' + tier.id + '.name'))}</span>` : ''}
      <span class="tiny muted">${A().esc(sess.email)}</span>
      <span class="spacer"></span>
      <a class="btn btn--quiet btn--sm" href="membership.html">${A().esc(t('auth.upgrade'))}</a>
      <button class="btn btn--quiet btn--sm" type="button" id="dashSignOut">${A().esc(t('nav.signout'))}</button>`;
    main.insertBefore(bar, main.firstChild);
    const out = q('dashSignOut');
    if (out) out.addEventListener('click', () => {
      S.signOut();
      A().injectAccountChip();
      location.href = 'login.html';
    });
  }

  /* ------------------------------------------------------------- sign-in */
  const TABS = ['advertiser', 'landlord', 'operator'];

  function loginPage() {
    const host = q('authCard');
    if (!host) return;
    const params = new URLSearchParams(location.search);
    let tab = params.get('role') || 'advertiser';
    if (!TABS.includes(tab)) tab = 'advertiser';
    let mode = params.get('tab') === 'signup' ? 'signup' : 'signin';
    const plan = params.get('plan') || '';

    function paint() {
      const demo = ((CFG.auth && CFG.auth.demoAccounts) || []).find(a => a.role === tab);
      host.innerHTML = `
        <div class="seg" id="authTabs">
          ${TABS.map(x => `<button type="button" data-role="${x}" class="${x === tab ? 'is-active' : ''}">${A().esc(t('auth.tab_' + x))}</button>`).join('')}
        </div>
        <div class="seg" id="authMode" style="margin-top:10px">
          <button type="button" data-mode="signin" class="${mode === 'signin' ? 'is-active' : ''}">${A().esc(t('auth.signin'))}</button>
          <button type="button" data-mode="signup" class="${mode === 'signup' ? 'is-active' : ''}">${A().esc(t('auth.signup'))}</button>
        </div>
        ${plan ? `<p class="note">${A().esc(t('mem.need_login'))} <span class="pill pill--info">${A().esc(t('mem.tier_' + plan + '.name'))}</span></p>` : ''}
        <form class="form" id="authForm" autocomplete="on">
          ${mode === 'signup' ? `
            <div class="form-row"><label for="auName">${A().esc(t('auth.name'))}</label><input type="text" id="auName" autocomplete="name" required></div>
            <div class="form-row"><label for="auCompany">${A().esc(t('auth.company'))}</label><input type="text" id="auCompany" autocomplete="organization"></div>` : ''}
          <div class="form-row"><label for="auEmail">${A().esc(t('auth.email'))}</label>
            <input type="email" id="auEmail" autocomplete="email" required></div>
          <div class="form-row"><label for="auPass">${A().esc(t('auth.password'))}</label>
            <input type="password" id="auPass" autocomplete="${mode === 'signup' ? 'new-password' : 'current-password'}" required></div>
          ${mode === 'signup' ? `<div class="form-row"><label for="auPass2">${A().esc(t('auth.password2'))}</label>
            <input type="password" id="auPass2" autocomplete="new-password" required></div>` : ''}
          ${mode === 'signin' ? `<label class="check"><input type="checkbox" id="auRemember" checked> <span>${A().esc(t('auth.remember'))}</span></label>` : ''}
          <p class="note" id="auErr" hidden></p>
          <button class="btn btn--primary" type="submit" id="auGo">${A().esc(t(mode === 'signup' ? 'auth.signup' : 'auth.signin'))}</button>
        </form>
        <div class="auth-side">
          ${mode === 'signin'
            ? `<button class="btn btn--quiet btn--sm" type="button" id="auForgot">${A().esc(t('auth.forgot'))}</button>
               <span class="tiny muted">${A().esc(t('auth.forgot_note'))}</span>`
            : `<span class="tiny muted">${A().esc(t('auth.terms'))}</span>`}
        </div>
        ${demo && mode === 'signin' ? `
          <div class="demo-box">
            <h4>${A().esc(t('auth.demo_title'))}</h4>
            <p class="tiny muted">${A().esc(t('auth.demo_note'))}</p>
            <div class="row row--wrap" style="margin-top:8px">
              <button class="btn btn--ghost btn--sm" type="button" id="auDemoUse">${A().esc(t('auth.use_demo', { role: t('auth.tab_' + tab) }))}</button>
              <code class="tiny">${A().esc(demo.email)} / ${A().esc(demo.password)}</code>
            </div>
          </div>` : ''}
        <p class="tiny muted" style="margin-top:12px">${A().esc(t('auth.secure_note'))}</p>
        <p class="tiny"><a href="faq.html#faq-acc_login">${A().esc(t('faq.acc_login.q'))}</a></p>`;

      host.querySelectorAll('#authTabs [data-role]').forEach(b => b.addEventListener('click', () => {
        tab = b.getAttribute('data-role'); paint();
      }));
      host.querySelectorAll('#authMode [data-mode]').forEach(b => b.addEventListener('click', () => {
        mode = b.getAttribute('data-mode'); paint();
      }));
      const form = q('authForm');
      if (form) form.addEventListener('submit', e => { e.preventDefault(); go(); });
      const forgot = q('auForgot');
      if (forgot) forgot.addEventListener('click', () => {
        const email = (q('auEmail').value || '').trim() || 'your account email';
        err(t('auth.reset_sent', { email }), 'ok');
      });
      const demoUse = q('auDemoUse');
      if (demoUse) demoUse.addEventListener('click', () => {
        q('auEmail').value = demo.email;
        q('auPass').value = demo.password;
        go();
      });
    }

    function err(msg, kind) {
      const box = q('auErr');
      if (!box) return;
      box.hidden = false;
      box.className = 'note ' + (kind === 'ok' ? 'note--ok' : 'note--warn');
      box.textContent = msg;
    }

    function go() {
      if (mode === 'signup') {
        const res = S.signUp({
          role: tab, name: q('auName').value, company: q('auCompany').value,
          email: q('auEmail').value, password: q('auPass').value, password2: q('auPass2').value,
          plan: plan || null
        });
        if (!res.ok) { err(t(res.error)); return; }
        if (plan) S.setTier(plan);
        A().toast(t('auth.created', { name: res.session.name }), 'ok');
        after(res);
        return;
      }
      const res = S.signIn({ role: tab, email: q('auEmail').value, password: q('auPass').value });
      if (!res.ok) { err(t(res.error)); return; }
      A().toast(t('auth.welcome', { name: res.session.name, role: t('auth.role_' + res.session.role) }), 'ok');
      after(res);
    }

    function after(res) {
      A().injectAccountChip();
      document.dispatchEvent(new CustomEvent('lg:auth', { detail: { session: res.session } }));
      location.href = res.session.role === 'landlord' ? 'landlord.html'
        : (res.session.role === 'operator' ? 'operator.html' : 'advertiser.html');
    }

    paint();
  }

  document.addEventListener('DOMContentLoaded', () => { gate(); loginPage(); });
  A().onLangChange(() => { gate(); loginPage(); });
})();
