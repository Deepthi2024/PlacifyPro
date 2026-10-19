/**
 * Placify UI Enhancements
 * 1. Post-login choice screen   2. Left side navigation
 * 3. Three-step setup wizard    4. Roadmap grid (CSS)
 * 5. Streak heatmap             6. Game-style tutorial
 * Loaded after app.js. Works on top of existing logic without replacing it.
 */
(function () {
  'use strict';

  const APP_VIEWS = ['view-roadmap', 'view-daily-hub', 'view-tech-news', 'view-interview-questions',
    'view-progress-analytics', 'view-internships', 'view-my-applications'];

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  function getSession() {
    try {
      const sup = window.placifySupervisor;
      return sup && sup.authAgent ? sup.authAgent.getActiveSession() : null;
    } catch (e) { return null; }
  }
  function uid() { const s = getSession(); return s ? s.user_id : null; }
  function activeViewId() { const v = $('.view-section.active'); return v ? v.id : null; }
  function isVisible(el) {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.display !== 'none';
  }
  function store(key, val) { try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); } catch (e) { return null; } }

  /* ====================================================================
     2. SIDE NAVIGATION — toggles layout class when the nav is visible
     ==================================================================== */
  const navbar = $('#main-navbar');
  function syncSidenav() {
    const header = $('.app-header');
    if (header) document.documentElement.style.setProperty('--header-h', header.offsetHeight + 'px');
    const show = navbar && navbar.style.display !== 'none' && !document.body.classList.contains('onboarding-active') && !!getSession();
    document.body.classList.toggle('has-sidenav', !!show);
  }
  if (navbar) new MutationObserver(syncSidenav).observe(navbar, { attributes: true, attributeFilter: ['style'] });
  new MutationObserver(syncSidenav).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  window.addEventListener('resize', syncSidenav);

  /* ====================================================================
     1. POST-LOGIN CHOICE SCREEN
     ==================================================================== */
  function choiceKey() { return 'placify_choice_shown_' + (uid() || 'anon'); }

  function showChoiceScreen() {
    if ($('#placify-choice-screen')) return;
    const s = getSession();
    const name = s && s.name ? String(s.name).split(' ')[0] : '';
    const el = document.createElement('div');
    el.id = 'placify-choice-screen';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Choose what to do');
    el.innerHTML = `
      <div class="choice-inner">
        <span class="choice-kicker">WELCOME BACK${name ? ', ' + name.replace(/[<>&"]/g, '').toUpperCase() : ''}</span>
        <h1 class="choice-title">What would you like to do today?</h1>
        <p class="choice-sub">Pick a path to jump right in. You can always switch from the menu.</p>
        <div class="choice-grid">
          <button type="button" class="choice-card news" data-choice="news">
            <div class="choice-icon"><i class="ph-duotone ph-newspaper"></i></div>
            <h3>Read Tech News</h3>
            <p>Catch up on the latest stories and trends shaping your domain.</p>
            <span class="choice-go">Open news <i class="ph ph-arrow-right"></i></span>
          </button>
          <button type="button" class="choice-card interview" data-choice="interview">
            <div class="choice-icon"><i class="ph-duotone ph-chats-circle"></i></div>
            <h3>Interview Preparation</h3>
            <p>Practise questions, explore resources and sharpen your answers.</p>
            <span class="choice-go">Start practising <i class="ph ph-arrow-right"></i></span>
          </button>
          <button type="button" class="choice-card study" data-choice="study">
            <div class="choice-icon"><i class="ph-duotone ph-book-open-text"></i></div>
            <h3>Resume Your Study</h3>
            <p>Continue today's tasks and keep your streak burning.</p>
            <span class="choice-go">Continue learning <i class="ph ph-arrow-right"></i></span>
          </button>
        </div>
      </div>`;
    document.body.appendChild(el);
    el.querySelectorAll('.choice-card').forEach(card => {
      card.addEventListener('click', () => {
        const c = card.dataset.choice;
        let btn = null;
        if (c === 'news') btn = $('#nav-btn-tech-news');
        else if (c === 'interview') btn = $('#nav-btn-interview-questions');
        else {
          btn = $('#nav-btn-daily-hub');
          if (!btn || btn.disabled || btn.classList.contains('disabled') || btn.getAttribute('aria-disabled') === 'true') btn = $('#nav-btn-roadmap');
        }
        closeChoiceScreen(() => {
          if (btn) btn.click();
          setTimeout(maybeStartWelcomeGuide, 650);
        });
      });
    });
    setTimeout(() => { const f = el.querySelector('.choice-card'); if (f) f.focus({ preventScroll: true }); }, 400);
  }
  function closeChoiceScreen(cb) {
    const el = $('#placify-choice-screen');
    if (!el) { if (cb) cb(); return; }
    el.classList.add('closing');
    setTimeout(() => { el.remove(); if (cb) cb(); }, 280);
  }
  window.showPlacifyChoiceScreen = showChoiceScreen;

  const brandLogo = $('.brand-logo-img');
  if (brandLogo) brandLogo.addEventListener('click', () => {
    if (document.body.classList.contains('has-sidenav')) showChoiceScreen();
  });
  const logoutBtn = $('#logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => {
    try { sessionStorage.removeItem(choiceKey()); } catch (e) {}
    closeChoiceScreen();
    endGame(false);
  }, true);

  /* ====================================================================
     VIEW CHANGE WATCHER
     ==================================================================== */
  let lastView = activeViewId();
  function onViewChange() {
    const v = activeViewId();
    if (v === lastView) return;
    const prev = lastView;
    lastView = v;

    if (v === 'view-diagnostic') resetWizard();
    if (v === 'view-progress-analytics') setTimeout(injectHeatmap, 50);

    if (APP_VIEWS.includes(v) && getSession()) {
      let shown = null;
      try { shown = sessionStorage.getItem(choiceKey()); } catch (e) {}
      if (!shown && (prev === 'view-onboarding' || prev === null || prev === undefined)) {
        try { sessionStorage.setItem(choiceKey(), '1'); } catch (e) {}
        setTimeout(showChoiceScreen, 250);
      } else if (!$('#placify-choice-screen')) {
        setTimeout(maybeStartWelcomeGuide, 700);
      }
    }
  }
  $$('.view-section').forEach(sec => new MutationObserver(onViewChange).observe(sec, { attributes: true, attributeFilter: ['class'] }));
  // Handle a session restored on page load
  setTimeout(() => { lastView = '__init__'; onViewChange(); }, 900);

  /* ====================================================================
     3. THREE-STEP SETUP WIZARD
     ==================================================================== */
  const diag = $('#view-diagnostic');
  const steps = [1, 2, 3].map(n => $('#setup-step-' + n));
  let wizStep = 1;
  if (diag && steps.every(Boolean)) {
    const stepper = document.createElement('div');
    stepper.className = 'setup-stepper';
    stepper.innerHTML = `
      <div class="st-dot" data-dot="1">1</div><div class="st-line" data-line="1"><span></span></div>
      <div class="st-dot" data-dot="2">2</div><div class="st-line" data-line="2"><span></span></div>
      <div class="st-dot" data-dot="3">3</div>`;
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'setup-back-btn';
    back.innerHTML = '<i class="ph ph-arrow-left"></i> Previous step';
    back.addEventListener('click', () => setWizard(Math.max(1, wizStep - 1)));
    steps[0].parentNode.insertBefore(stepper, steps[0]);
    steps[0].parentNode.insertBefore(back, steps[0]);
    diag.classList.add('wizard-ready');

    // Advance after the existing selection handlers have run
    steps[0].addEventListener('click', (e) => {
      if (e.target.closest('.manual-level-card')) setTimeout(() => setWizard(2), 260);
    });
    steps[0].addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('.manual-level-card')) setTimeout(() => setWizard(2), 260);
    });
    steps[1].addEventListener('click', (e) => {
      const c = e.target.closest('.target-goal-card');
      if (c && !c.classList.contains('disabled')) setTimeout(() => setWizard(3), 260);
    });
    steps[1].addEventListener('keydown', (e) => {
      const c = e.target.closest('.target-goal-card');
      if (c && !c.classList.contains('disabled') && (e.key === 'Enter' || e.key === ' ')) setTimeout(() => setWizard(3), 260);
    });

    // Validation errors should send the user back to the step they relate to
    const alertBox = $('#onboarding-validation-alert');
    if (alertBox) new MutationObserver(() => {
      if (alertBox.style.display !== 'none' && /goal/i.test(alertBox.textContent) && wizStep === 3) setWizard(2);
    }).observe(alertBox, { attributes: true, childList: true, subtree: true });

    setWizard(1);
  }
  function setWizard(n) {
    wizStep = n;
    steps.forEach((s, i) => s && s.classList.toggle('is-current', i + 1 === n));
    $$('.setup-stepper .st-dot').forEach(d => {
      const k = +d.dataset.dot;
      d.classList.toggle('current', k === n);
      d.classList.toggle('done', k < n);
      d.innerHTML = k < n ? '<i class="ph-bold ph-check"></i>' : String(k);
    });
    $$('.setup-stepper .st-line').forEach(l => l.classList.toggle('filled', +l.dataset.line < n));
    const back = $('.setup-back-btn');
    if (back) back.classList.toggle('visible', n > 1);
    if (diag && diag.classList.contains('active')) {
      const st = $('.setup-stepper');
      if (st && n > 1) st.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
  function resetWizard() { if (steps.every(Boolean)) setWizard(1); }

  /* ====================================================================
     5. STREAK HEATMAP
     ==================================================================== */
  function dayKey(d) {
    const x = new Date(d);
    if (isNaN(x)) return null;
    return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
  }
  const DATE_KEYS = /^(completed_at|completedAt|completed_date|completedDate|submitted_at|submittedAt|attempted_at|attemptedAt)$/;
  function scanDates(obj, out, depth, seen) {
    if (!obj || typeof obj !== 'object' || depth > 12 || seen.has(obj)) return;
    seen.add(obj);
    if (Array.isArray(obj)) { obj.forEach(o => scanDates(o, out, depth + 1, seen)); return; }
    for (const k in obj) {
      const v = obj[k];
      if (DATE_KEYS.test(k) && v && (typeof v === 'string' || typeof v === 'number')) {
        const key = dayKey(v);
        if (key && !(k === 'completedAt' && obj.completed_at)) {
          const sig = (obj.id || obj._id || obj.task_id || obj.taskId || obj.title || '') + '|' + v;
          if (!out.__sigs) Object.defineProperty(out, '__sigs', { value: new Set(), enumerable: false });
          if (!out.__sigs.has(sig)) { out.__sigs.add(sig); out[key] = (out[key] || 0) + 1; }
        }
      } else if (v && typeof v === 'object') scanDates(v, out, depth + 1, seen);
    }
  }
  function collectActivity() {
    const id = uid();
    const counts = {};
    try {
      const sup = window.placifySupervisor;
      const state = sup && sup.progressTracker ? sup.progressTracker.getUserState(id) : null;
      scanDates(window.activePersonalizedRoadmap, counts, 0, new Set());
      if (state) scanDates(state, counts, 0, new Set());
    } catch (e) {}
    // Merge with previously recorded activity for this account
    const logKey = 'placify_activity_log_' + (id || 'anon');
    let log = {};
    try { log = JSON.parse(store(logKey) || '{}') || {}; } catch (e) {}
    Object.keys(counts).forEach(k => { log[k] = Math.max(log[k] || 0, counts[k]); });
    // Ensure current streak days are reflected
    const streak = parseInt(($('#user-streak-val') || {}).textContent, 10) || 0;
    for (let i = 0; i < streak; i++) {
      const k = dayKey(Date.now() - i * 86400000);
      if (!log[k]) log[k] = 1;
    }
    store(logKey, JSON.stringify(log));
    return { log, streak };
  }
  function level(c) { return c <= 0 ? 0 : c === 1 ? 1 : c <= 3 ? 2 : c <= 6 ? 3 : 4; }

  function injectHeatmap() {
    const view = $('#view-progress-analytics');
    if (!view || !view.classList.contains('active')) return;
    const { log, streak } = collectActivity();
    let box = $('#placify-heatmap');
    if (!box) {
      box = document.createElement('div');
      box.id = 'placify-heatmap';
      const streakNum = $('#analytics-streak-num', view);
      const card = streakNum ? streakNum.closest('.glass-card') : null;
      const anchor = card && card.parentElement && card.parentElement !== view ? card.parentElement : null;
      if (anchor && anchor.parentElement) anchor.parentElement.insertBefore(box, anchor.nextSibling);
      else {
        const host = $('.glass-card', view) || view;
        host.appendChild(box);
      }
    }
    const WEEKS = 26;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(start.getDate() - (WEEKS - 1) * 7 - today.getDay());
    let cells = '', months = '', lastMonth = -1, active = 0, total = 0;
    for (let w = 0; w < WEEKS; w++) {
      const wd = new Date(start); wd.setDate(start.getDate() + w * 7);
      if (wd.getMonth() !== lastMonth) {
        lastMonth = wd.getMonth();
        months += `<span style="grid-column:${w + 1}">${wd.toLocaleString('en', { month: 'short' })}</span>`;
      }
      for (let d = 0; d < 7; d++) {
        const day = new Date(start); day.setDate(start.getDate() + w * 7 + d);
        const k = dayKey(day);
        const c = log[k] || 0;
        const future = day > today;
        if (!future && c > 0) { active++; total += c; }
        const label = `${day.toDateString()}: ${c ? c + ' activit' + (c === 1 ? 'y' : 'ies') : 'No activity'}`;
        cells += `<div class="hm-cell l${future ? 0 : level(c)}${k === dayKey(today) ? ' today' : ''}${future ? ' future' : ''}" title="${label}" aria-label="${label}" style="animation-delay:${(w * 7 + d) * 3}ms"></div>`;
      }
    }
    box.innerHTML = `
      <div class="hm-head">
        <h4><i class="ph ph-calendar-dots" style="color: var(--accent-emerald);"></i> Study Activity Heatmap</h4>
        <div class="hm-stats">
          <span class="hm-stat">🔥 ${streak} day streak</span>
          <span class="hm-stat">${active} active days</span>
          <span class="hm-stat">${total} activities</span>
        </div>
      </div>
      <div class="hm-scroll">
        <div class="hm-wrap">
          <div class="hm-days"><span></span><span>Mon</span><span></span><span>Wed</span><span></span><span>Fri</span><span></span></div>
          <div>
            <div class="hm-months">${months}</div>
            <div class="hm-grid">${cells}</div>
          </div>
        </div>
      </div>
      <div class="hm-legend">Less <span class="hm-cell"></span><span class="hm-cell l1"></span><span class="hm-cell l2"></span><span class="hm-cell l3"></span><span class="hm-cell l4"></span> More</div>`;
  }
  const analyticsView = $('#view-progress-analytics');
  if (analyticsView) {
    let t = null;
    new MutationObserver(() => {
      if (!$('#placify-heatmap')) { clearTimeout(t); t = setTimeout(injectHeatmap, 120); }
    }).observe(analyticsView, { childList: true, subtree: true });
  }
  window.renderPlacifyHeatmap = injectHeatmap;

  /* ====================================================================
     6. GUIDE ME — replays the automatic tour (js/placify-tour.js)
     ==================================================================== */
  $$('.page-context-help-btn').forEach(btn => {
    // Opening (sign in / sign up) screen: remove the button entirely per request.
    if (btn.dataset.pageHelp === 'onboarding') { btn.remove(); return; }
    const clone = btn.cloneNode(true);
    clone.classList.add('gg-btn');
    clone.innerHTML = '<i class="ph-fill ph-game-controller"></i> Guide me';
    clone.title = 'Play the visual guide for this page';
    clone.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      if (window.PlacifyTour) window.PlacifyTour.replay();
    });
    btn.replaceWith(clone);
  });
  function maybeStartWelcomeGuide() { /* handled by PlacifyTour */ }
  window.startPlacifyGameGuide = () => window.PlacifyTour && window.PlacifyTour.replay();

  // Suppress the legacy auto-launched tour (keeps the "How to Use" modal working)
  let lastGuideModalUse = 0;
  const guideModal = $('#placify-guide-modal');
  if (guideModal) guideModal.addEventListener('click', () => { lastGuideModalUse = Date.now(); }, true);
  setInterval(() => {
    const id = uid();
    if (id) {
      store('placify_tour_completed_' + id, 'true');
      store('placify_welcome_tour_seen_' + id, 'true');
    }
    if (typeof window.isPlacifyTourActive === 'function' && window.isPlacifyTourActive() &&
        Date.now() - lastGuideModalUse > 4000 && typeof window.endGuidedTour === 'function') {
      window.endGuidedTour(false);
    }
  }, 300);

  syncSidenav();
})();
