/**
 * app-state.js v5 — Panama Lifestyle OS · Application State
 *
 * Pure-JS event store. No external dependencies.
 * v4 additions: localStorage persistence, returnCount, per-stage checklist,
 * updateChecklistItem, markDone, dismissFollowUp, _computeFollowUp algorithm.
 * v5 additions: providers directory with CRUD (addProvider, updateProvider,
 * deleteProvider), userName/userEmail in state.
 *
 * Exposed as: window.AppState
 */
(function () {
  'use strict';

  var STORE_KEY = 'panama_os_v4';

  /* ── Content rating registry ─────────────────────────────────── */
  var AGE_RESTRICTED = new Set([
    'vip_night', 'casino', 'nightlife_vip', 'adult_social',
  ]);
  function isAgeRestricted(tag) { return tag ? AGE_RESTRICTED.has(tag) : false; }

  /* ── Per-stage checklist definitions ─────────────────────────── */
  var STAGE_CHECKLIST = {
    exploring: [
      { id: 'e1', label: 'Define your budget & timeline',    category: 'setup',     status: 'not_started' },
      { id: 'e2', label: 'Share your lifestyle priorities',  category: 'setup',     status: 'not_started' },
      { id: 'e3', label: 'Read the neighborhood letters',    category: 'planning',  status: 'not_started' },
      { id: 'e4', label: 'Compare 2–3 target areas',         category: 'planning',  status: 'not_started' },
      { id: 'e5', label: 'Request virtual property tours',   category: 'execution', status: 'not_started' },
      { id: 'e6', label: 'Schedule a discovery trip',        category: 'execution', status: 'not_started' },
      { id: 'e7', label: 'Shortlist your neighborhoods',     category: 'decision',  status: 'not_started' },
      { id: 'e8', label: 'Set a visit timeline',             category: 'decision',  status: 'not_started' },
    ],
    arriving: [
      { id: 'a1', label: 'Confirm arrival date & time',      category: 'setup',     status: 'not_started' },
      { id: 'a2', label: 'Finalize movers & pickup date',    category: 'setup',     status: 'not_started' },
      { id: 'a3', label: 'Confirm pet travel documents',     category: 'setup',     status: 'not_started', optional: true },
      { id: 'a4', label: 'Review first-week itinerary',      category: 'planning',  status: 'not_started' },
      { id: 'a5', label: 'Collect customs documents',        category: 'execution', status: 'not_started' },
      { id: 'a6', label: 'Arrange SIM & connectivity',       category: 'execution', status: 'not_started' },
      { id: 'a7', label: 'Confirm airport welcome',          category: 'execution', status: 'not_started' },
      { id: 'a8', label: 'Sign temporary lease',             category: 'decision',  status: 'not_started' },
    ],
    settling: [
      { id: 's1', label: 'Register local address',           category: 'setup',     status: 'not_started' },
      { id: 's2', label: 'Set up utility accounts',          category: 'setup',     status: 'not_started' },
      { id: 's3', label: 'Open a bank account',              category: 'planning',  status: 'not_started' },
      { id: 's4', label: 'Visit 2–3 schools',                category: 'planning',  status: 'not_started', optional: true },
      { id: 's5', label: 'Find a primary care doctor',       category: 'execution', status: 'not_started' },
      { id: 's6', label: 'Interview household help',         category: 'execution', status: 'not_started', optional: true },
      { id: 's7', label: 'Complete residency paperwork',     category: 'execution', status: 'not_started' },
      { id: 's8', label: 'Enroll in chosen school',          category: 'decision',  status: 'not_started', optional: true },
    ],
    living: [
      { id: 'l1', label: 'File annual taxes with Ricardo',   category: 'setup',     status: 'not_started' },
      { id: 'l2', label: 'Renew residency card',             category: 'setup',     status: 'not_started' },
      { id: 'l3', label: 'Review investment portfolio',      category: 'planning',  status: 'not_started' },
      { id: 'l4', label: 'Plan quarterly experiences',       category: 'planning',  status: 'not_started' },
      { id: 'l5', label: 'Join club & sports memberships',   category: 'execution', status: 'not_started' },
      { id: 'l6', label: 'Standing chef or wellness booking',category: 'execution', status: 'not_started', optional: true },
      { id: 'l7', label: 'Decide on property investment',    category: 'decision',  status: 'not_started' },
      { id: 'l8', label: 'Choose annual membership plan',    category: 'decision',  status: 'not_started' },
    ],
    thriving: [
      { id: 't1', label: 'Annual legal & estate review',     category: 'setup',     status: 'not_started' },
      { id: 't2', label: 'Portfolio performance review',     category: 'setup',     status: 'not_started' },
      { id: 't3', label: 'Shortlist off-market properties',  category: 'planning',  status: 'not_started' },
      { id: 't4', label: 'Map citizenship timeline',         category: 'planning',  status: 'not_started' },
      { id: 't5', label: 'Attend member events',             category: 'execution', status: 'not_started' },
      { id: 't6', label: 'Founder mentor circle session',    category: 'execution', status: 'not_started', optional: true },
      { id: 't7', label: 'Major property decision',          category: 'decision',  status: 'not_started' },
      { id: 't8', label: 'Citizenship application',          category: 'decision',  status: 'not_started' },
    ],
  };

  /* ── Follow-up algorithm ─────────────────────────────────────── */
  function _isCompleted(id, items) {
    var item = (items || []).filter(function (i) { return i.id === id; })[0];
    return item && item.status === 'completed';
  }

  var FOLLOW_UP_STEPS = {
    exploring: [
      { id: 'fu_e1', msg: 'Your neighborhood letters are waiting — Casco, Punta Pacífica, and Coronado.', ctaLabel: 'Read letters', ctaScreen: 'chat', cond: function (c) { return !_isCompleted('e3', c); } },
      { id: 'fu_e2', msg: 'Compare your shortlisted areas and mark the one that speaks to you.', ctaLabel: 'View roadmap', ctaScreen: 'checklist', cond: function (c) { return _isCompleted('e3', c) && !_isCompleted('e4', c); } },
      { id: 'fu_e3', msg: 'Ready to see Panama in person? Eduardo can arrange a private discovery trip.', ctaLabel: 'Schedule trip', ctaScreen: 'chat', cond: function (c) { return _isCompleted('e4', c) && !_isCompleted('e6', c); } },
      { id: 'fu_e4', msg: "You've done the research. Time to shortlist your top 2 neighborhoods.", ctaLabel: 'Update roadmap', ctaScreen: 'checklist', cond: function (c) { return _isCompleted('e6', c) && !_isCompleted('e7', c); } },
    ],
    arriving: [
      { id: 'fu_a1', msg: "A few logistics to confirm before you fly — let's review your arrival plan.", ctaLabel: 'View roadmap', ctaScreen: 'checklist', cond: function (c) { return !_isCompleted('a1', c); } },
      { id: 'fu_a2', msg: 'Customs documents need to be in order 10 days before arrival. Sofia can help.', ctaLabel: 'Message Sofia', ctaScreen: 'chat', cond: function (c) { return _isCompleted('a1', c) && !_isCompleted('a5', c); } },
      { id: 'fu_a3', msg: 'Your first-week itinerary is drafted — review it before you land.', ctaLabel: 'Review plan', ctaScreen: 'checklist', cond: function (c) { return _isCompleted('a5', c) && !_isCompleted('a4', c); } },
    ],
    settling: [
      { id: 'fu_s1', msg: 'Week one priority: open your bank account. Luis has the appointment ready.', ctaLabel: 'Confirm appointment', ctaScreen: 'chat', cond: function (c) { return !_isCompleted('s3', c); } },
      { id: 'fu_s2', msg: 'Schools visited, options shortlisted. Time to decide and enroll.', ctaLabel: 'Update roadmap', ctaScreen: 'checklist', cond: function (c) { return _isCompleted('s4', c) && !_isCompleted('s8', c); } },
      { id: 'fu_s3', msg: 'Residency paperwork is in motion — your completion is closer than you think.', ctaLabel: 'Check progress', ctaScreen: 'checklist', cond: function (c) { return _isCompleted('s3', c) && !_isCompleted('s7', c); } },
    ],
    living: [
      { id: 'fu_l1', msg: 'Ricardo is ready for your annual tax review — best to do this before June.', ctaLabel: 'Message Ricardo', ctaScreen: 'chat', cond: function (c) { return !_isCompleted('l1', c); } },
      { id: 'fu_l2', msg: 'Your portfolio review is overdue — a 30-min call with Ricardo makes it simple.', ctaLabel: 'Schedule call', ctaScreen: 'chat', cond: function (c) { return _isCompleted('l1', c) && !_isCompleted('l3', c); } },
      { id: 'fu_l3', msg: "You're ready for the next level. Review your membership options.", ctaLabel: 'See plans', ctaScreen: 'pricing', cond: function (c) { return _isCompleted('l3', c) && !_isCompleted('l8', c); } },
    ],
    thriving: [
      { id: 'fu_t1', msg: 'Annual estate review — your legal team is standing by.', ctaLabel: 'Arrange meeting', ctaScreen: 'chat', cond: function (c) { return !_isCompleted('t1', c); } },
      { id: 'fu_t2', msg: 'Three off-market properties match your criteria. A private viewing awaits.', ctaLabel: 'See properties', ctaScreen: 'chat', cond: function (c) { return _isCompleted('t1', c) && !_isCompleted('t3', c); } },
      { id: 'fu_t3', msg: "Citizenship is within reach. Let's map your exact timeline.", ctaLabel: 'Plan timeline', ctaScreen: 'checklist', cond: function (c) { return _isCompleted('t3', c) && !_isCompleted('t4', c); } },
    ],
  };

  /* ── Provider directory ──────────────────────────────────────── */
  var INITIAL_PROVIDERS = [
    { id: 'p1',  name: 'Ricardo Alemán',      category: 'legal',      specialty: 'Tax & Corporate Law',        phone: '+507 6123-4567', email: 'r.aleman@lexpty.com',          tier: 'all',      status: 'active', rating: 5, notes: 'Annual tax review before June. Trusted since 2018.' },
    { id: 'p2',  name: 'Eduardo Mendoza',     category: 'realestate', specialty: 'Country Curator · 14 yrs',   phone: '+507 6234-5678', email: 'emendoza@panamalifestyle.com', tier: 'explorer', status: 'active', rating: 5, notes: 'First-contact concierge for all new arrivals.' },
    { id: 'p3',  name: 'Dr. Carlos Morales',  category: 'health',     specialty: 'Family Medicine · Paitilla', phone: '+507 6345-6789', email: 'cmorales@hpaitilla.com',       tier: 'settler',  status: 'active', rating: 4, notes: 'English-speaking. Available Mon–Fri.' },
    { id: 'p4',  name: 'Captain Roque',       category: 'leisure',    specialty: 'Marina Flamenco · Yachts',   phone: '+507 6456-7890', email: 'roque@marinaflamenco.com',     tier: 'resident', status: 'active', rating: 5, notes: 'Half-day $380, full-day $650. Catering available.' },
    { id: 'p5',  name: 'Sofía Herrera',       category: 'lifestyle',  specialty: 'Lifestyle Coordinator',      phone: '+507 6567-8901', email: 'sofia@panamalifestyle.com',    tier: 'all',      status: 'active', rating: 5, notes: 'Primary ops concierge. Speaks EN/ES/PT.' },
    { id: 'p6',  name: 'Luis Pérez',          category: 'finance',    specialty: 'Banking & Account Setup',    phone: '+507 6678-9012', email: 'lperez@banistmo.com',          tier: 'settler',  status: 'active', rating: 4, notes: 'Banistmo Paitilla. Thu appt slots available.' },
    { id: 'p7',  name: 'Carlos Rodríguez',    category: 'transport',  specialty: 'VIP Airport Transfers',      phone: '+507 6789-0123', email: 'carlos@viptransfers.pa',       tier: 'all',      status: 'active', rating: 5, notes: 'Arrives 20 min before flight. Name sign standard.' },
    { id: 'p8',  name: 'Patricia Soto',       category: 'legal',      specialty: 'Real Estate Notary',         phone: '+507 6890-1234', email: 'psoto@notariapty.com',         tier: 'resident', status: 'active', rating: 4, notes: 'Required for all property closings in Casco.' },
    { id: 'p9',  name: 'Dra. Ana Villalobos', category: 'health',     specialty: 'Wellness & Integrative',     phone: '+507 6901-2345', email: 'avillalobos@salud360.pa',      tier: 'resident', status: 'active', rating: 5, notes: 'Nutrition, labs, executive wellness packages.' },
    { id: 'p10', name: 'Marcos Fong',         category: 'realestate', specialty: 'Investment Properties',      phone: '+507 6012-3456', email: 'mfong@propertiespa.com',       tier: 'legend',   status: 'active', rating: 5, notes: 'Off-market specialist. Casco & Punta Pacífica.' },
  ];

  function _computeFollowUp(stage, checklistItems) {
    var steps = FOLLOW_UP_STEPS[stage] || [];
    for (var i = 0; i < steps.length; i++) {
      var step = steps[i];
      if (step.cond && step.cond(checklistItems)) {
        return { id: step.id, msg: step.msg, ctaLabel: step.ctaLabel, ctaScreen: step.ctaScreen };
      }
    }
    return null;
  }

  /* ── localStorage helpers ────────────────────────────────────── */
  function _load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }

  function _persist() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        stage:          _state.stage,
        tier:           _state.tier,
        mode:           _state.mode,
        passportPoints: _state.passportPoints,
        returnCount:    _state.returnCount,
        isLoggedIn:     _state.isLoggedIn,
        checklistItems: _state.checklistItems,
        userName:       _state.userName,
        userEmail:      _state.userEmail,
        providers:      _state.providers,
      }));
    } catch (e) {}
  }

  /* ── Bootstrap from localStorage ────────────────────────────── */
  var _saved = _load();
  var _initStage = _saved.stage || 'exploring';
  var _initChecklist = (function () {
    var fresh = JSON.parse(JSON.stringify(STAGE_CHECKLIST[_initStage] || STAGE_CHECKLIST.exploring));
    if (_saved.checklistItems && _saved.checklistItems.length) {
      var savedMap = {};
      _saved.checklistItems.forEach(function (i) { savedMap[i.id] = i.status; });
      fresh.forEach(function (i) { if (savedMap[i.id]) i.status = savedMap[i.id]; });
    }
    return fresh;
  }());

  /* ── State shape ─────────────────────────────────────────────── */
  var INITIAL = {
    screen:         'welcome',
    prevScreen:     null,
    stage:          _initStage,
    pendingStage:   null,
    mode:           _saved.mode || 'practical',
    tier:           _saved.tier || 'explorer',
    passportPoints: _saved.passportPoints || 0,
    chatHistory:    [],
    chatTopic:      null,
    transition:     'forward',
    isLoggedIn:     _saved.isLoggedIn || false,
    isAgeVerified:  false,
    returnCount:    (_saved.returnCount || 0) + 1,
    checklistItems: _initChecklist,
    followUp:       null,
    userName:       _saved.userName  || 'Guest',
    userEmail:      _saved.userEmail || '',
    providers:      _saved.providers || JSON.parse(JSON.stringify(INITIAL_PROVIDERS)),
  };

  var _state = Object.assign({}, INITIAL);
  _state.followUp = _computeFollowUp(_state.stage, _state.checklistItems);
  _persist();

  var _subs = [];

  function getState() { return Object.assign({}, _state); }

  function _set(patch) {
    _state = Object.assign({}, _state, patch);
    var snap = getState();
    _subs.forEach(function (fn) { fn(snap); });
  }

  function subscribe(fn) {
    _subs.push(fn);
    fn(getState());
    return function () {
      _subs = _subs.filter(function (l) { return l !== fn; });
    };
  }

  /* ── Navigation ──────────────────────────────────────────────── */
  function navigate(screen, params, direction) {
    _set(Object.assign(
      { prevScreen: _state.screen, screen: screen, transition: direction || 'forward' },
      params || {}
    ));
  }

  function goBack() {
    var dest = _state.prevScreen || 'desk';
    _set({ screen: dest, prevScreen: null, transition: 'back' });
  }

  /* ── Stage ───────────────────────────────────────────────────── */
  function selectStage(stageId) { _set({ pendingStage: stageId }); }

  function confirmStage() {
    var stage = _state.pendingStage || _state.stage;
    var freshChecklist = JSON.parse(JSON.stringify(STAGE_CHECKLIST[stage] || STAGE_CHECKLIST.exploring));
    var nextFollowUp   = _computeFollowUp(stage, freshChecklist);
    _set({
      stage:          stage,
      pendingStage:   null,
      tier:           _stageTier(stage),
      passportPoints: _stagePoints(stage),
      chatHistory:    [],
      prevScreen:     _state.screen,
      screen:         'desk',
      transition:     'forward',
      checklistItems: freshChecklist,
      followUp:       nextFollowUp,
    });
    _persist();
  }

  function _stageTier(s) {
    return { exploring: 'explorer', arriving: 'explorer', settling: 'settler',
             living: 'resident', thriving: 'legend' }[s] || 'explorer';
  }
  function _stagePoints(s) {
    return { exploring: 4, arriving: 16, settling: 38, living: 82, thriving: 168 }[s] || 4;
  }

  /* ── Mode ────────────────────────────────────────────────────── */
  function setMode(mode) { _set({ mode: mode }); _persist(); }

  /* ── Passport points ─────────────────────────────────────────── */
  function addPoints(pts) {
    var n = _state.passportPoints + pts;
    _set({ passportPoints: n, tier: _pointsTier(n, _state.stage) });
    _persist();
  }

  function _pointsTier(pts, stage) {
    if (stage === 'thriving') return 'legend';
    if (pts >= 500) return 'legend';
    if (pts >= 200) return 'resident';
    if (pts >= 75)  return 'settler';
    return 'explorer';
  }

  /* ── Checklist ───────────────────────────────────────────────── */
  function updateChecklistItem(id, status) {
    var items = _state.checklistItems.map(function (item) {
      return item.id === id ? Object.assign({}, item, { status: status }) : item;
    });
    var nextFollowUp = _computeFollowUp(_state.stage, items);
    _set({ checklistItems: items, followUp: nextFollowUp });
    _persist();
  }

  function markDone(itemId) {
    var items = _state.checklistItems.map(function (item) {
      if (item.id === itemId) return Object.assign({}, item, { status: 'completed' });
      return item;
    });
    var nextFollowUp = _computeFollowUp(_state.stage, items);
    _set({ checklistItems: items, followUp: nextFollowUp });
    addPoints(10);
    _persist();
  }

  function dismissFollowUp() {
    var current = _state.followUp;
    if (!current) return;
    var steps = FOLLOW_UP_STEPS[_state.stage] || [];
    for (var i = 0; i < steps.length; i++) {
      if (steps[i].id === current.id) {
        var items = _state.checklistItems.map(function (item) {
          if (item.status === 'not_started') return Object.assign({}, item, { status: 'in_progress' });
          return item;
        });
        var nextFollowUp = _computeFollowUp(_state.stage, items);
        _set({ checklistItems: items, followUp: nextFollowUp });
        _persist();
        return;
      }
    }
    _set({ followUp: null });
  }

  /* ── Chat ────────────────────────────────────────────────────── */
  function openChat(topic) {
    _set({ chatTopic: topic || null, prevScreen: _state.screen, screen: 'chat', transition: 'forward' });
  }

  function seedChat(messages) {
    if (_state.chatHistory.length === 0) _set({ chatHistory: messages });
  }

  function newChat() {
    _set({ chatHistory: [], chatTopic: null });
  }

  function sendMessage(text) {
    if (!text || !text.trim()) return;
    var uid   = Date.now();
    var reply = _mariaReply(text.trim(), _state.stage, _state.mode, _state.chatTopic);
    var next  = _state.chatHistory.concat([
      { id: uid,     role: 'user',  text: text.trim(), ts: new Date() },
      { id: uid + 1, role: 'maria', text: reply,       ts: new Date() },
    ]);
    _set({ chatHistory: next });
    addPoints(5);
  }

  /* ── Pricing ─────────────────────────────────────────────────── */
  function selectTier(tierId) {
    addPoints(15);
  }

  /* ── Providers CRUD ──────────────────────────────────────────── */
  function addProvider(data) {
    var id = 'p' + Date.now();
    var providers = _state.providers.concat([
      Object.assign({ id: id, status: 'active', rating: 0 }, data),
    ]);
    _set({ providers: providers });
    _persist();
  }

  function updateProvider(id, patch) {
    var providers = _state.providers.map(function (p) {
      return p.id === id ? Object.assign({}, p, patch) : p;
    });
    _set({ providers: providers });
    _persist();
  }

  function deleteProvider(id) {
    var providers = _state.providers.filter(function (p) { return p.id !== id; });
    _set({ providers: providers });
    _persist();
  }

  /* ── User profile ────────────────────────────────────────────── */
  function setUserProfile(name, email) {
    _set({ userName: name || _state.userName, userEmail: email || _state.userEmail });
    _persist();
  }

  /* ── María response engine ───────────────────────────────────── */
  var _KB = {
    exploring: {
      visa:    'Panama tiene 3 rutas principales: Visa Naciones Amigas (la más rápida), Pensionado, e Inversionista. Con pasaporte estadounidense y 18 meses de margen, tienes todas las opciones abiertas. ¿Quieres que agende una llamada de 30 min sin compromiso?',
      casa:    'Antes de comprar, recomiendo arrendar. Tres perfiles: Casco Viejo (histórico, bohemio), Costa del Este (moderno, familiar), Boquete (fresco, montañoso). ¿Qué tipo de vida buscas?',
      costo:   'El costo de vida está 35–45% por debajo de EE.UU. para calidad comparable. Apartamento 2BR en Marbella: $1,200–2,000/mes. Cena en buen restaurante: $25–40 por persona. ¿Quieres el desglose completo?',
      banco:   'Para nuevos residentes lo más accesible es Banistmo o Multibank. Necesitarás: pasaporte, carta de ingresos y factura de servicios local. El proceso toma 2–4 semanas.',
      where:   'Las 3 zonas más populares para expats: Casco Viejo (histórico, $1,500+/mes), Marbella/Punta Pacífica (moderno, $1,200+), y Boquete en las montañas ($600+). ¿Tienes preferencia de clima?',
      call:    'Perfecto. Te envío el calendario — 30 min, sin costo, sin compromiso. Solo para entender tu situación y darte las opciones correctas. ¿Prefieres mañana por la mañana o la tarde?',
      default: 'Estoy aquí para guiarte. Cuéntame — ¿qué te hizo buscar información sobre Panamá? Eso me ayuda a mostrarte lo más relevante para ti.',
    },
    arriving: {
      pickup:  '¡Confirmado! Carlos estará en el pasillo de llegadas con tu nombre. El apartamento en Casco tiene las llaves listas — código del edificio: 4821. ¿A qué hora aterrizas exactamente?',
      sim:     'El plan recomendado: Claro turista $15, 10 GB, cubre todo el país. Hay kiosco justo después de aduana. O te puedo tener una SIM esperando en el apartamento. ¿Qué prefieres?',
      banco:   'Para el primer mes, Nequi (digital) funciona sin prueba de residencia — perfecto para empezar. Banistmo y Multibank requieren factura local; en 3–4 semanas ya tendrás eso.',
      default: 'Tu llegada está próxima. Tengo coordinado el transporte, las llaves del apartamento y el kit de bienvenida. ¿Qué más quieres revisar antes de llegar?',
    },
    settling: {
      escuela: "Las dos más recomendadas: King's College (Cambridge curriculum, Marbella) y Oxford International (IB, Costa del Este). Ya tengo la visita al King's este viernes. ¿Cuántos años tienen tus hijos?",
      medico:  'Paitilla y Pacífica Salud son los hospitales privados de referencia. Para médico de cabecera, el Dr. Morales en Paitilla habla inglés y tiene citas disponibles esta semana.',
      banco:   'Ya pasaron las 3 semanas — deberías tener factura local ahora. Banistmo Paitilla tiene cita disponible el jueves. ¿Te agendo?',
      docs:    'Para la residencia necesitas: pasaporte apostillado, antecedentes penales apostillados, certificado médico y fotos. El gestor tiene todo en proceso. El sello de apostilla tarda 5 días en EE.UU.',
      default: 'Semana 3 en Panama — ya eres panameño de facto. ¿Hoy toca gestiones, escuela, o conectar con la comunidad de expats?',
    },
    living: {
      impuesto: 'Panama usa el sistema de renta territorial — tus ingresos del exterior están completamente exentos. Solo pagas sobre lo que ganas dentro de Panamá. Ricardo tiene el borrador listo para revisar.',
      inversion: 'El mercado de Casco está fuerte — ROI de arrendamiento 6–8% anual. Para Punta Pacífica, 5–7%. ¿Buscas renta mensual o plusvalía a 5 años?',
      negocio: 'Sociedad Anónima es la estructura más común. Costo total ~$1,200 incluyendo registro, RUC y cuenta empresarial. ¿Tu actividad es local o internacional?',
      default: 'Buen día. Tienes 3 cosas en el escritorio: revisión fiscal con Ricardo, mantenimiento de piscina mañana, y el evento de la comunidad el sábado. ¿Por cuál empezamos?',
    },
    thriving: {
      cierre:     'Para el cierre del jueves: confirma que Fernanda Cruz (administradora del HOA) tiene el documento de traspaso, y que Patricia tiene la Escritura original. ¿Quieres que coordine la llamada entre ellas?',
      ciudadania: 'Año 3, mes 4 de residencia continua. En ruta perfecta para 2028. Tengo marcada la renovación anual en octubre — te recuerdo en septiembre para que nunca estemos tarde.',
      golf:       'Tucan Country Club tiene disponibilidad mañana a las 7 AM o 3 PM. Santa María también abrió slots este fin de semana. ¿Cuántos jugadores y qué prefieren?',
      yate:       'Marina Flamenco tiene disponibilidad este sábado. Opciones: medio día (4h, $380) o día completo (8h, $650). ¿Cuántos van? ¿Catering incluido?',
      default:    'Portfolio mayo 2026. Tienes el cierre del Casco el jueves y la renovación de ciudadanía en octubre. ¿Qué orquestamos hoy?',
    },
  };

  var _PATTERNS = [
    [/visa|residencia|residency|permiso|fnv/i,                    'visa'],
    [/casa|apartamento|vivienda|housing|rent|arrendar|alquil/i,   'casa'],
    [/costo|precio|dinero|cost|living|vida|cuánto/i,              'costo'],
    [/banco|bank|cuenta|nequi|banistmo/i,                         'banco'],
    [/dond|barrio|zona|where|neighborhood|area|vivir/i,           'where'],
    [/llam|call|reunión|meet|schedule|cita|hablar/i,              'call'],
    [/pickup|aeropuerto|airport|carlos|transfer|tocumen/i,        'pickup'],
    [/sim|teléfono|phone|claro|movistar|número/i,                 'sim'],
    [/escuela|school|colegio|niñ|hijo|kids/i,                     'escuela'],
    [/médico|doctor|salud|health|hospital|clínica/i,              'medico'],
    [/doc|apostill|papeles|papers|gestor/i,                       'docs'],
    [/impuesto|tax|fiscal|tributar|renta/i,                       'impuesto'],
    [/invers|propiedad|property|real estate|comprar/i,            'inversion'],
    [/negocio|empresa|business|sociedad/i,                        'negocio'],
    [/cierr|closing|firma|sign|escritura|notario/i,               'cierre'],
    [/ciudadan|citizenship|pasaporte|naturaliz/i,                 'ciudadania'],
    [/golf|tucan|santa mar[ií]a|campo/i,                          'golf'],
    [/yate|yacht|barco|marina|boat|velero/i,                      'yate'],
  ];

  function _mariaReply(text, stage, mode, topic) {
    var combined = (text + ' ' + (topic || '')).toLowerCase();
    var kb = _KB[stage] || _KB.exploring;
    for (var i = 0; i < _PATTERNS.length; i++) {
      var pat = _PATTERNS[i][0], key = _PATTERNS[i][1];
      if (pat.test(combined) && kb[key]) return kb[key];
    }
    if (mode === 'family')   return 'Con gusto te ayudo con todo lo relacionado a familia. ¿Preguntas sobre escuelas, actividades para niños, o servicios domésticos?';
    if (mode === 'luxury')   return kb.default + ' En modo Luxury tengo acceso a experiencias exclusivas — ¿quieres que te muestre las opciones de esta semana?';
    if (mode === 'business') return kb.default + ' Estoy revisando las oportunidades de networking y negocios disponibles para ti.';
    if (mode === 'kids')     return '¡Hola! ¿En qué actividades para los chicos puedo ayudarte hoy?';
    return kb.default;
  }

  /* ── Expose ──────────────────────────────────────────────────── */
  window.AppState = {
    getState:             getState,
    subscribe:            subscribe,
    navigate:             navigate,
    goBack:               goBack,
    selectStage:          selectStage,
    confirmStage:         confirmStage,
    setMode:              setMode,
    addPoints:            addPoints,
    openChat:             openChat,
    seedChat:             seedChat,
    sendMessage:          sendMessage,
    selectTier:           selectTier,
    isAgeRestricted:      isAgeRestricted,
    newChat:              newChat,
    updateChecklistItem:  updateChecklistItem,
    markDone:             markDone,
    dismissFollowUp:      dismissFollowUp,
    addProvider:          addProvider,
    updateProvider:       updateProvider,
    deleteProvider:       deleteProvider,
    setUserProfile:       setUserProfile,
  };

}());
