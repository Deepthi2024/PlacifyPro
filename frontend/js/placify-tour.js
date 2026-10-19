/**
 * Placify Product Tour — automatic, game-style visual navigation guide.
 *
 * - Fully automatic: each tip shows ~3.6s, then moves on. No Next/Back/Skip.
 * - Never clicks, selects or submits anything. Overlay is pointer-events:none.
 * - Only explains elements that are visible right now; watches the DOM so
 *   newly revealed content (e.g. Level Selection Step 2/3) gets explained
 *   after the user's own action.
 * - Runs automatically only for newly registered users (onboarding journey).
 *   Returning users never see it unless they press "Guide me".
 *
 * Configure tips in PAGES below. See TOUR_README.md.
 */
(function () {
  'use strict';

  var STEP_MS = 3600;          // time each tip stays visible
  var MOVE_MS = 700;           // hand travel time
  var SETTLE_MS = 450;         // wait for DOM to settle before (re)evaluating

  /* ------------------------------------------------------------------ *
   * Step configuration                                                  *
   * page: logical page id. groups: conditional sub-states of a page.    *
   * target: CSS selector list (first visible match is used).            *
   * ------------------------------------------------------------------ */
  var PAGES = [
    { page: 'choice', match: function () { return vis('#placify-choice-screen'); }, groups: [
      { id: 'choice', steps: [
        { id: 'choice.welcome', target: '#placify-choice-screen .choice-title', title: 'Welcome to Placify', text: 'Pick what you want to do today. You can switch anytime.' },
        { id: 'choice.news', target: '#placify-choice-screen [data-choice="news"]', title: 'Read Tech News', text: 'Catch up on the latest tech headlines.' },
        { id: 'choice.interview', target: '#placify-choice-screen [data-choice="interview"]', title: 'Interview Preparation', text: 'Practice questions tailored to your domain.' },
        { id: 'choice.study', target: '#placify-choice-screen [data-choice="study"]', title: 'Resume Your Study', text: 'Jump back into your personal roadmap.' }
      ] }
    ] },
    { page: 'nav', match: function () { return vis('#main-navbar') && !vis('#placify-choice-screen'); }, groups: [
      { id: 'nav', steps: [
        { id: 'nav.roadmap', target: '#nav-btn-roadmap', title: 'Roadmap', text: 'Your month-by-month learning plan.' },
        { id: 'nav.daily', target: '#nav-btn-daily-hub', title: 'Daily Hub', text: "Today's tasks and resources live here." },
        { id: 'nav.interview', target: '#nav-btn-interview-questions', title: 'Interview Prep', text: 'Practice interview questions.' },
        { id: 'nav.news', target: '#nav-btn-tech-news', title: 'Tech News', text: 'Fresh news from the tech world.' },
        { id: 'nav.internships', target: '#nav-btn-internships', title: 'Internships', text: 'Openings matched to your domain.' },
        { id: 'nav.applications', target: '#nav-btn-my-applications', title: 'My Applications', text: 'Track every application you send.' },
        { id: 'nav.analytics', target: '#nav-btn-analytics', title: 'Analytics', text: 'Charts, stats and your study heatmap.' },
        { id: 'nav.streak', target: '#header-streak-pill', title: 'Day Streak', text: 'Study daily to keep the flame alive.' },
        { id: 'nav.help', target: '#open-help-guide-btn', title: 'Help', text: 'Open the full how-to guide anytime.' }
      ] }
    ] },
    { page: 'domainSelection', view: 'view-domain-selection', groups: [
      { id: 'domain', steps: [
        { id: 'domain.cards', target: '#domain-selection-grid .domain-card', title: 'Choose a domain', text: 'Each card is a career track. Read it and tap the one you want.' },
        { id: 'domain.grid', target: '#domain-selection-grid', title: 'All domains', text: 'Scroll to compare every available track.' },
        { id: 'domain.confirm', target: '#confirm-domain-btn', title: 'Confirm', text: 'When you have picked one, confirm it here.' },
        { id: 'domain.lang', target: '#confirm-dsa-language-btn', title: 'Pick a language', text: 'Choose your coding language, then confirm.' }
      ] }
    ] },
    // Level selection: one group per wizard step; only the visible step is explained.
    { page: 'diagnostic', view: 'view-diagnostic', groups: [
      { id: 'level.step1', when: function () { return vis('#setup-step-1'); }, steps: [
        { id: 'level.s1.cards', target: '#setup-step-1 .manual-level-card', title: 'Step 1 · Your level', text: 'Pick the level that matches you today.' },
        { id: 'level.s1.pill', target: '#selected-level-pill', title: 'Your selection', text: 'Your chosen starting level shows here.' }
      ] },
      { id: 'level.step2', when: function () { return vis('#setup-step-2'); }, steps: [
        { id: 'level.s2.cards', target: '#setup-step-2 .target-goal-card:not(.disabled)', title: 'Step 2 · Your goal', text: 'Choose the level you want to reach.' },
        { id: 'level.s2.timeline', target: '#recommended-study-timeline-section', title: 'Study timeline', text: 'How long your plan will take, based on your picks.' }
      ] },
      { id: 'level.step3', when: function () { return vis('#setup-step-3'); }, steps: [
        { id: 'level.s3.count', target: '#quiz-question-count-pills', title: 'Step 3 · Quiz length', text: 'Choose how many questions you want.' },
        { id: 'level.s3.custom', target: '#custom-quiz-question-count', title: 'Custom count', text: 'Or type your own number of questions.' },
        { id: 'level.s3.quiz', target: '#start-diagnostic-quiz-btn', title: 'Take the quiz', text: 'Validate your level with a quick AI quiz.' },
        { id: 'level.s3.skip', target: '#submit-self-assessment-btn', title: 'Or skip it', text: 'Proceed with your declared level, no quiz.' }
      ] }
    ] },
    { page: 'diagnosticQuiz', view: 'view-diagnostic-quiz', groups: [
      { id: 'dq', steps: [
        { id: 'dq.palette', target: '#diagnostic-palette-container', title: 'Question map', text: 'Jump to any question from here.' },
        { id: 'dq.questions', target: '#diagnostic-questions-container', title: 'Questions', text: 'Read and choose your answer.' },
        { id: 'dq.next', target: '#quiz-next-btn', title: 'Next', text: 'Move to the next question.' },
        { id: 'dq.submit', target: '#quiz-submit-btn', title: 'Submit', text: 'Finish to see your report.' }
      ] }
    ] },
    { page: 'report', view: 'view-assessment-report', groups: [
      { id: 'report', steps: [
        { id: 'report.gaps', target: '#gaps-list-container', title: 'Gaps', text: 'Topics to focus on first.' },
        { id: 'report.mastered', target: '#mastered-list-container', title: 'Mastered', text: 'Topics you already know well.' },
        { id: 'report.table', target: '#topic-proficiency-table-container', title: 'Proficiency', text: 'Your score for every topic.' },
        { id: 'report.build', target: '#build-roadmap-btn', title: 'Build roadmap', text: 'Create your personalized plan from these results.' }
      ] }
    ] },
    { page: 'roadmap', view: 'view-roadmap', groups: [
      { id: 'roadmap.base', steps: [
        { id: 'rm.summary', target: '#roadmap-profile-summary-bar', title: 'Plan summary', text: 'Domain, timeline, hours and score at a glance.' },
        { id: 'rm.levels', target: '#nav-level-months', title: 'Months · Weeks · Days', text: 'Switch how detailed your roadmap view is.' },
        { id: 'rm.start', target: '#start-journey-btn', title: 'Start', text: 'Begin your learning journey here.' },
        { id: 'rm.daily', target: '#enter-daily-hub-btn', title: 'Daily Hub', text: "Go straight to today's tasks." }
      ] },
      { id: 'roadmap.months', when: function () { return vis('#roadmap-nodes-container .month-card'); }, steps: [
        { id: 'rm.month', target: '#roadmap-nodes-container .month-card', title: 'Month card', text: 'One month of your plan. Tap to see its weeks.' }
      ] },
      { id: 'roadmap.weeks', when: function () { return vis('#roadmap-nodes-container .week-card'); }, steps: [
        { id: 'rm.week', target: '#roadmap-nodes-container .week-card', title: 'Week card', text: 'Each week groups a learning phase.' },
        { id: 'rm.phase', target: '.open-phase-hub-btn, .launch-day-hub-btn', title: 'Open phase', text: 'Open the daily tasks for this phase.' },
        { id: 'rm.phaseQuiz', target: '.take-phase-assessment-btn', title: 'Phase assessment', text: 'Test yourself once the phase is done.' }
      ] },
      { id: 'roadmap.tasks', when: function () { return vis('#view-roadmap .pl-task-card'); }, steps: [
        { id: 'rm.task', target: '#view-roadmap .pl-task-card', title: 'Daily task', text: 'A task for the day. Ticked ones are complete.' }
      ] }
    ] },
    { page: 'dailyHub', view: 'view-daily-hub', groups: [
      { id: 'daily', steps: [
        { id: 'dh.progress', target: '#day-progress-bar-container', title: 'Day progress', text: "How much of today's work is done." },
        { id: 'dh.task', target: '#view-daily-hub .pl-task-card', title: 'Tasks', text: 'Mark tasks complete as you finish them.' },
        { id: 'dh.resources', target: '#suggested-resources-list', title: 'Resources', text: 'Hand-picked links to learn from.' },
        { id: 'dh.quiz', target: '#start-concept-quiz-btn', title: 'Concept quiz', text: 'Check what you learned today.' },
        { id: 'dh.skip', target: '#skip-day-assessment-btn', title: 'Skip quiz', text: 'Move on without the quiz.' },
        { id: 'dh.back', target: '#top-back-to-weekly-roadmap-btn, #view-all-roadmap-btn', title: 'Back to roadmap', text: 'Return to your full roadmap.' }
      ] }
    ] },
    { page: 'conceptQuiz', view: 'view-concept-quiz', groups: [
      { id: 'cq', steps: [
        { id: 'cq.q', target: '#concept-quiz-questions-container', title: 'Concept quiz', text: "Answer questions on today's topics." },
        { id: 'cq.skip', target: '#skip-assessment-from-quiz-btn', title: 'Skip', text: 'Leave the quiz if you need to.' }
      ] }
    ] },
    { page: 'evaluation', view: 'view-assessment-evaluation', groups: [
      { id: 'ev', steps: [
        { id: 'ev.review', target: '#eval-bottom-review-phase-btn', title: 'Review', text: 'Revisit this phase to revise.' },
        { id: 'ev.retake', target: '#eval-bottom-retake-btn', title: 'Retake', text: 'Try the assessment again.' },
        { id: 'ev.back', target: '#eval-bottom-back-roadmap-btn', title: 'Roadmap', text: 'Continue with your plan.' }
      ] }
    ] },
    { page: 'interview', view: 'view-interview-questions', groups: [
      { id: 'iv.hub', when: function () { return vis('#interview-landing-hub'); }, steps: [
        { id: 'iv.domain', target: '#interview-domain-badge-container', title: 'Your domain', text: 'Questions are tailored to this domain.' },
        { id: 'iv.placify', target: '#select-option-placify-btn', title: 'Placify practice', text: 'Practice AI-generated interview questions.' },
        { id: 'iv.external', target: '#select-option-external-btn', title: 'External resources', text: 'Browse curated outside resources.' },
        { id: 'iv.history', target: '#interview-history-list', title: 'History', text: 'Your past practice sessions.' }
      ] },
      { id: 'iv.qa', when: function () { return vis('#interview-qa-container'); }, steps: [
        { id: 'iv.qa.list', target: '#interview-qa-container', title: 'Questions', text: 'Read each question and its answer.' },
        { id: 'iv.qa.more', target: '#btn-generate-more-questions, #btn-generate-more-questions-bottom', title: 'More questions', text: 'Generate a fresh set.' }
      ] },
      { id: 'iv.ext', when: function () { return vis('#interview-external-workflow'); }, steps: [
        { id: 'iv.ext.type', target: '#interview-ext-resource-type', title: 'Resource type', text: 'Choose what kind of resource you want.' },
        { id: 'iv.ext.fetch', target: '#interview-ext-fetch-resources-btn', title: 'Fetch', text: 'Load matching resources.' }
      ] }
    ] },
    { page: 'techNews', view: 'view-tech-news', groups: [
      { id: 'news', steps: [
        { id: 'news.feed', target: '#view-tech-news #tech-news-feed-container', title: 'News feed', text: 'Latest stories. Tap one to read it.' },
        { id: 'news.card', target: '#view-tech-news #tech-news-feed-container a, #view-tech-news .news-card', title: 'Article', text: 'Opens the full article.' }
      ] }
    ] },
    { page: 'internships', view: 'view-internships', groups: [
      { id: 'intern', steps: [
        { id: 'in.filter', target: '#internship-domain-select', title: 'Filter by domain', text: 'Narrow listings to your field.' },
        { id: 'in.apply', target: '#apply-internship-filter-btn', title: 'Apply filter', text: 'Show results for your filter.' },
        { id: 'in.refresh', target: '#refresh-internships-btn', title: 'Refresh', text: 'Fetch the latest listings.' },
        { id: 'in.card', target: '#internships-cards-container .internship-card', title: 'Internship', text: 'Role, company and details. Apply from the card.' },
        { id: 'in.pages', target: '#internship-pagination-container', title: 'More pages', text: 'Browse more openings.' }
      ] }
    ] },
    { page: 'applications', view: 'view-my-applications', groups: [
      { id: 'apps', steps: [
        { id: 'ap.refresh', target: '#refresh-ats-btn', title: 'Refresh status', text: 'Update every application status.' },
        { id: 'ap.card', target: '#my-applications-grid .application-card', title: 'Application', text: 'Status and actions for one application.' },
        { id: 'ap.grid', target: '#my-applications-grid', title: 'All applications', text: 'Everything you are tracking.' }
      ] }
    ] },
    { page: 'analytics', view: 'view-progress-analytics', groups: [
      { id: 'an', steps: [
        { id: 'an.streak', target: '#analytics-streak-num', title: 'Study streak', text: 'Days in a row you studied.' },
        { id: 'an.summary', target: '#assessment-result-summary', title: 'Results', text: 'Your assessment performance.' },
        { id: 'an.chart', target: '#view-progress-analytics canvas, #view-progress-analytics svg', title: 'Progress chart', text: 'How your learning is trending.' },
        { id: 'an.heatmap', target: '#placify-heatmap', title: 'Activity heatmap', text: 'Greener squares mean more study that day.' },
        { id: 'an.interview', target: '#take-interview-btn', title: 'Mock interview', text: 'Test yourself with an interview.' },
        { id: 'an.continue', target: '#continue-learning-btn', title: 'Keep going', text: 'Back to learning.' }
      ] }
    ] }
  ];
  // Pages that must be finished before the onboarding journey is complete.
  var REQUIRED_PAGES = ['nav', 'domainSelection', 'diagnostic', 'roadmap'];

  /* ------------------------------------------------------------------ */
  var $$ = function (s, r) { try { return Array.prototype.slice.call((r || document).querySelectorAll(s)); } catch (e) { return []; } };
  function isVisible(el) {
    if (!el || !el.isConnected) return false;
    var r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    for (var n = el; n && n.nodeType === 1; n = n.parentElement) {
      var cs = getComputedStyle(n);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
      if (n.hasAttribute('hidden') || n.getAttribute('aria-hidden') === 'true') return false;
    }
    return !el.closest('[data-tour-ignore]');
  }
  function vis(sel) { return $$(sel).some(isVisible); }
  function firstVisible(sel) { var l = $$(sel); for (var i = 0; i < l.length; i++) if (isVisible(l[i])) return l[i]; return null; }
  function reduced() { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }

  function session() {
    try { var s = window.placifySupervisor && window.placifySupervisor.authAgent.getActiveSession(); return s || null; } catch (e) { return null; }
  }
  function uid() { var s = session(); return s && s.user_id ? String(s.user_id) : null; }

  /* ---------------- Journey persistence (per account) ---------------- */
  function jKey(id) { return 'placify_tour_journey_' + id; }
  function loadJourney(id) {
    try { return JSON.parse(store(jKey(id)) || 'null'); } catch (e) { return null; }
  }
  function saveJourney(id, j) { store(jKey(id), JSON.stringify(j)); syncServer(id, j); }
  // Server persistence hook: if the backend exposes an endpoint, use it.
  function syncServer(id, j) {
    if (!window.getPlacifyApiUrl || !window.fetch) return;
    try {
      fetch(window.getPlacifyApiUrl('/api/users/' + encodeURIComponent(id) + '/onboarding-tour'), {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !!j.completed, pages: j.pages })
      }).catch(function () {});
    } catch (e) {}
  }
  function startJourneyFor(id) {
    if (!id) return;
    var j = loadJourney(id);
    if (j && j.completed) return;
    saveJourney(id, j || { active: true, completed: false, steps: {}, pages: {}, started: Date.now() });
    schedule();
  }
  function journey() { var id = uid(); if (!id) return null; var j = loadJourney(id); return j && j.active && !j.completed ? j : null; }

  // Hook registration: only brand-new accounts get the onboarding journey.
  var pendingNewUser = false;
  function hookRegistration() {
    var sup = window.placifySupervisor;
    if (!sup || sup.__tourHooked || typeof sup.registerUser !== 'function') return;
    sup.__tourHooked = true;
    var orig = sup.registerUser;
    sup.registerUser = function () {
      var p = orig.apply(this, arguments);
      Promise.resolve(p).then(function (profile) {
        var id = profile && profile.user_id ? String(profile.user_id) : uid();
        if (id) startJourneyFor(id); else pendingNewUser = true;
      }).catch(function () {});
      return p;
    };
  }

  /* ----------------------------- UI --------------------------------- */
  var ui = null;
  function buildUI() {
    if (ui) return ui;
    var root = document.createElement('div');
    root.className = 'pt-root';
    root.setAttribute('aria-hidden', 'false');
    root.innerHTML =
      '<div class="pt-spot"></div>' +
      '<div class="pt-hand"><svg viewBox="0 0 24 24" width="44" height="44" aria-hidden="true"><path fill="currentColor" d="M9 2.5a1.5 1.5 0 0 1 3 0V9l.1-.03a1.5 1.5 0 0 1 2.9.53v.2a1.5 1.5 0 0 1 2.9.6v.4a1.5 1.5 0 0 1 2.6 1V16a6 6 0 0 1-6 6h-1.3a6 6 0 0 1-4.6-2.15L4.3 15a1.6 1.6 0 0 1 2.4-2.1L9 15V2.5Z" stroke="#0b1020" stroke-width="1"/></svg><span class="pt-ripple"></span></div>' +
      '<div class="pt-tip" role="status" aria-live="polite"><div class="pt-tip-top"><span class="pt-badge"></span><span class="pt-bar"><i></i></span></div><strong class="pt-title"></strong><p class="pt-text"></p></div>';
    document.body.appendChild(root);
    ui = { root: root, spot: root.querySelector('.pt-spot'), hand: root.querySelector('.pt-hand'), tip: root.querySelector('.pt-tip') };
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return ui;
  }
  function destroyUI() {
    if (!ui) return;
    var u = ui; ui = null;
    window.removeEventListener('scroll', place, true);
    window.removeEventListener('resize', place);
    u.root.classList.add('pt-out');
    setTimeout(function () { u.root.remove(); }, 450);
  }

  /* --------------------------- Engine ------------------------------- */
  var state = { running: false, step: null, target: null, timer: null, mode: null, replayPage: null, replayDone: {} };

  function currentPage() {
    for (var i = 0; i < PAGES.length; i++) {
      var p = PAGES[i];
      if (p.page === 'nav') continue;
      if (p.match ? p.match() : (p.view && document.getElementById(p.view) && document.getElementById(p.view).classList.contains('active'))) return p;
    }
    return null;
  }
  function pageById(id) { for (var i = 0; i < PAGES.length; i++) if (PAGES[i].page === id) return PAGES[i]; return null; }

  // Next step to explain: visible target, active group, not already explained.
  function nextStep(done) {
    var pages = [];
    var nav = pageById('nav');
    if (state.mode === 'replay') pages = [pageById(state.replayPage)].filter(Boolean);
    else { var cp = currentPage(); if (cp && cp.page === 'choice') pages = [cp]; else { if (nav.match()) pages.push(nav); if (cp) pages.push(cp); } }
    for (var i = 0; i < pages.length; i++) {
      var p = pages[i];
      if (state.mode === 'replay' && p.view && !document.getElementById(p.view).classList.contains('active')) return null;
      for (var g = 0; g < p.groups.length; g++) {
        var grp = p.groups[g];
        try { if (grp.when && !grp.when()) continue; } catch (e) { continue; }
        for (var s = 0; s < grp.steps.length; s++) {
          var st = grp.steps[s];
          if (done[st.id]) continue;
          var el = firstVisible(st.target);
          if (el) return { step: st, el: el, page: p, group: grp };
        }
      }
    }
    return null;
  }
  function doneMap() { if (state.mode === 'replay') return state.replayDone; var j = journey(); return j ? j.steps : null; }

  function markPagesComplete() {
    var id = uid(); var j = id && loadJourney(id); if (!j || j.completed) return;
    PAGES.forEach(function (p) {
      var all = true;
      p.groups.forEach(function (g) { g.steps.forEach(function (s) { if (!j.steps[s.id]) all = false; }); });
      // A page counts as complete once the visitor has seen every tip that was available.
      if (all || j.pages[p.page] === 'seen') j.pages[p.page] = 'complete';
    });
    if (REQUIRED_PAGES.every(function (p) { return j.pages[p] === 'complete'; })) { j.completed = true; j.active = false; j.completedAt = Date.now(); }
    saveJourney(id, j);
  }

  function evaluate() {
    var done = doneMap();
    if (!done) { stop(); return; }
    if (state.running && state.target && isVisible(state.target)) return; // keep showing current tip
    var nx = nextStep(done);
    if (!nx) {
      if (state.running) finishBatch();
      return;
    }
    show(nx);
  }

  function show(nx) {
    var u = buildUI();
    state.running = true; state.step = nx.step; state.target = nx.el; state.page = nx.page.page;
    var total = 0, idx = 0;
    nx.group.steps.forEach(function (s, k) { if (firstVisible(s.target)) { total++; if (k <= nx.group.steps.indexOf(nx.step)) idx++; } });
    u.tip.querySelector('.pt-badge').textContent = (idx || 1) + ' / ' + (total || 1);
    u.tip.querySelector('.pt-title').textContent = nx.step.title;
    u.tip.querySelector('.pt-text').textContent = nx.step.text;
    var bar = u.tip.querySelector('.pt-bar i'); bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = '';
    bar.style.animationDuration = STEP_MS + 'ms';
    u.tip.classList.remove('pt-pop'); void u.tip.offsetWidth; u.tip.classList.add('pt-pop');
    var r = nx.el.getBoundingClientRect();
    if (r.top < 64 || r.bottom > window.innerHeight - 16) nx.el.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' });
    place();
    u.hand.classList.remove('pt-tap');
    setTimeout(function () { if (ui) ui.hand.classList.add('pt-tap'); }, reduced() ? 0 : MOVE_MS);
    clearTimeout(state.timer);
    state.timer = setTimeout(function () { complete(nx.step, nx.page.page); }, STEP_MS);
  }

  function complete(step, page) {
    var done = doneMap();
    if (done) {
      done[step.id] = Date.now();
      if (state.mode !== 'replay') { var id = uid(), j = loadJourney(id); if (j) { j.steps = done; j.pages[page] = j.pages[page] || 'seen'; saveJourney(id, j); } }
    }
    state.target = null;
    evaluate();
  }

  function finishBatch() {
    clearTimeout(state.timer);
    state.running = false; state.step = null; state.target = null;
    if (state.mode === 'replay') state.mode = null; else markPagesComplete();
    destroyUI();
  }
  function stop() { if (state.running || ui) finishBatch(); }

  function place() {
    if (!ui || !state.target) return;
    var el = state.target;
    if (!isVisible(el)) { ui.root.classList.add('pt-hidden'); schedule(); return; }
    ui.root.classList.remove('pt-hidden');
    var vw = window.innerWidth, vh = window.innerHeight, pad = 8;
    var r = el.getBoundingClientRect();
    var L = Math.max(4, r.left - pad), T = Math.max(4, r.top - pad);
    var W = Math.min(vw - 8, r.right + pad) - L, H = Math.min(vh - 8, r.bottom + pad) - T;
    ui.spot.style.transform = 'translate(' + L + 'px,' + T + 'px)';
    ui.spot.style.width = W + 'px'; ui.spot.style.height = H + 'px';
    var hx = Math.min(vw - 52, r.left + Math.min(r.width * 0.6, r.width - 12));
    var hy = Math.min(vh - 52, r.top + Math.min(r.height * 0.6, r.height - 4));
    ui.hand.style.transform = 'translate(' + hx + 'px,' + hy + 'px)';
    var tw = ui.tip.offsetWidth, th = ui.tip.offsetHeight, gap = 18, mobile = vw < 640;
    var tx, ty;
    var pref = state.step && state.step.placement;
    if (mobile) {
      tx = (vw - tw) / 2;
      ty = (r.top + r.height / 2 > vh / 2) ? 12 : vh - th - 12;
    } else {
      tx = Math.min(Math.max(12, r.left + r.width / 2 - tw / 2), vw - tw - 12);
      ty = r.bottom + gap + 36;
      if (pref === 'top' || ty + th > vh - 12) ty = r.top - th - gap;
      if (ty < 12) {
        ty = Math.min(Math.max(12, r.top), vh - th - 12);
        tx = r.right + gap + tw < vw ? r.right + gap : Math.max(12, r.left - tw - gap);
      }
    }
    ui.tip.style.transform = 'translate(' + Math.round(tx) + 'px,' + Math.round(ty) + 'px)';
  }

  /* --------------------------- Watching ----------------------------- */
  var settle = null;
  function schedule() { clearTimeout(settle); settle = setTimeout(function () { try { tick(); } catch (e) { console.warn('[PlacifyTour]', e); stop(); } }, SETTLE_MS); }
  function tick() {
    hookRegistration();
    if (pendingNewUser && uid()) { pendingNewUser = false; startJourneyFor(uid()); }
    if (state.mode === 'replay') {
      var rp = pageById(state.replayPage);
      if (rp && rp.view && !document.getElementById(rp.view).classList.contains('active')) { finishBatch(); return; }
      evaluate(); return;
    }
    if (!journey()) { stop(); return; }
    // Page changed underneath the current tip → drop it and re-evaluate.
    if (state.running && state.target && !isVisible(state.target)) { clearTimeout(state.timer); state.target = null; }
    evaluate();
  }
  var mo = new MutationObserver(function (muts) {
    for (var i = 0; i < muts.length; i++) { if (ui && ui.root.contains(muts[i].target)) continue; schedule(); return; }
  });
  function boot() {
    hookRegistration();
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
    window.addEventListener('hashchange', schedule);
    window.addEventListener('popstate', schedule);
    schedule();
  }

  /* ---------------------------- API --------------------------------- */
  window.PlacifyTour = {
    PAGES: PAGES,
    // Replay the guide for the page currently on screen (used by "Guide me").
    replay: function () {
      var cp = currentPage(); if (!cp) return;
      clearTimeout(state.timer); state.target = null;
      state.mode = 'replay'; state.replayPage = cp.page; state.replayDone = {};
      evaluate();
    },
    startOnboarding: function () { startJourneyFor(uid()); },
    resetOnboarding: function () { var id = uid(); if (id) store(jKey(id), null); stop(); },
    status: function () { var id = uid(); return id ? loadJourney(id) : null; },
    isActive: function () { return state.running; }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
