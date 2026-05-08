/**
 * app-state.js — Panama Lifestyle OS · Application State
 *
 * Pure-JS event store. No external dependencies.
 * Scaffolds content age-gate for 18+ material —
 * login/verification system is a future addition.
 *
 * Exposed as: window.AppState
 */
(function () {
  'use strict';

  /* ── Content rating registry ──────────────────────────────────
     Tags that require age verification before access.
     The gate shows a placeholder until login is implemented.   ── */
  var AGE_RESTRICTED = new Set([
    'vip_night', 'casino', 'nightlife_vip', 'adult_social',
  ]);

  function isAgeRestricted(tag) {
    return tag ? AGE_RESTRICTED.has(tag) : false;
  }

  /* ── State shape ──────────────────────────────────────────── */
  var INITIAL = {
    screen:         'welcome',    // welcome|picker|desk|chat|pricing
    prevScreen:     null,
    stage:          'exploring',  // exploring|arriving|settling|living|thriving
    pendingStage:   null,         // selected in picker before confirmed
    mode:           'practical',  // practical|family|luxury|business|kids
    tier:           'explorer',   // explorer|settler|resident|legend
    passportPoints: 0,
    chatHistory:    [],           // {id,role:'user'|'maria',text,ts}
    chatTopic:      null,
    transition:     'forward',    // forward|back → drives slide direction
    // ── Auth scaffolding (login not yet implemented) ──────────
    isLoggedIn:     false,
    isAgeVerified:  false,
  };

  var _state = Object.assign({}, INITIAL);
  var _subs  = [];

  function getState() { return Object.assign({}, _state); }

  function _set(patch) {
    _state = Object.assign({}, _state, patch);
    var snap = getState();
    _subs.forEach(function (fn) { fn(snap); });
  }

  function subscribe(fn) {
    _subs.push(fn);
    fn(getState());                           // immediate with current state
    return function () {
      _subs = _subs.filter(function (l) { return l !== fn; });
    };
  }

  /* ── Navigation ─────────────────────────────────────────── */
  function navigate(screen, params, direction) {
    _set(Object.assign({ prevScreen: _state.screen, screen: screen, transition: direction || 'forward' }, params || {}));
  }

  function goBack() {
    var dest = _state.prevScreen || 'desk';
    _set({ screen: dest, prevScreen: null, transition: 'back' });
  }

  /* ── Stage ──────────────────────────────────────────────── */
  function selectStage(stageId) {
    _set({ pendingStage: stageId });
  }

  function confirmStage() {
    var stage = _state.pendingStage || _state.stage;
    _set({
      stage:          stage,
      pendingStage:   null,
      tier:           _stageTier(stage),
      passportPoints: _stagePoints(stage),
      chatHistory:    [],           // fresh thread for new stage
      prevScreen:     _state.screen,
      screen:         'desk',
      transition:     'forward',
    });
  }

  function _stageTier(s) {
    return { exploring: 'explorer', arriving: 'explorer', settling: 'settler', living: 'resident', thriving: 'legend' }[s] || 'explorer';
  }
  function _stagePoints(s) {
    return { exploring: 4, arriving: 16, settling: 38, living: 82, thriving: 168 }[s] || 4;
  }

  /* ── Mode ───────────────────────────────────────────────── */
  function setMode(mode) { _set({ mode: mode }); }

  /* ── Passport points ────────────────────────────────────── */
  function addPoints(pts) {
    var n = _state.passportPoints + pts;
    _set({ passportPoints: n, tier: _pointsTier(n, _state.stage) });
  }

  function _pointsTier(pts, stage) {
    if (stage === 'thriving') return 'legend';
    if (pts >= 500) return 'legend';
    if (pts >= 200) return 'resident';
    if (pts >= 75)  return 'settler';
    return 'explorer';
  }

  /* ── Chat ───────────────────────────────────────────────── */
  function openChat(topic) {
    _set({ chatTopic: topic || null, prevScreen: _state.screen, screen: 'chat', transition: 'forward' });
  }

  function seedChat(messages) {
    // Only seed when history is empty (called by ScreenChat on mount)
    if (_state.chatHistory.length === 0) {
      _set({ chatHistory: messages });
    }
  }

  function sendMessage(text) {
    if (!text || !text.trim()) return;
    var uid   = Date.now();
    var reply = _mariaReply(text.trim(), _state.stage, _state.mode, _state.chatTopic);
    var next  = _state.chatHistory.concat([
      { id: uid,     role: 'user',  text: text.trim(),  ts: new Date() },
      { id: uid + 1, role: 'maria', text: reply,        ts: new Date() },
    ]);
    _set({ chatHistory: next });
    addPoints(5);
  }

  /* ── Pricing ────────────────────────────────────────────── */
  function selectTier(tierId) {
    addPoints(15);
  }

  /* ── María response engine ──────────────────────────────────
     Keyword-regex matching → stage-specific answers.
     Falls back to mode-aware default.                       ── */

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
      escuela: 'Las dos más recomendadas: King\'s College (Cambridge curriculum, Marbella) y Oxford International (IB, Costa del Este). Ya tengo la visita al King\'s este viernes. ¿Cuántos años tienen tus hijos?',
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
      cierre:     'Para el cierre del jueves: confirma que Fernanda Cruz (administradora del HOA) tiene el documento de traspaso, y que Patricia tiene la Escritura original. ¿Quiero que coordine la llamada entre ellas?',
      ciudadania: 'Año 3, mes 4 de residencia continua. En ruta perfecta para 2028. Tengo marcada la renovación anual en octubre — te recuerdo en septiembre para que nunca estemos tarde.',
      golf:       'Tucan Country Club tiene disponibilidad mañana a las 7 AM o 3 PM. Santa María también abrió slots este fin de semana. ¿Cuántos jugadores y qué prefieren?',
      yate:       'Marina Flamenco tiene disponibilidad este sábado. Opciones: medio día (4h, $380) o día completo (8h, $650). ¿Cuántos van? ¿Catering incluido?',
      default:    'Portfolio mayo 2026. Tienes el cierre del Casco el jueves y la renovación de ciudadanía en octubre. ¿Qué orquestamos hoy?',
    },
  };

  var _PATTERNS = [
    [/visa|residencia|residency|permiso|fnv/i,         'visa'],
    [/casa|apartamento|vivienda|housing|rent|arrendar|alquil/i, 'casa'],
    [/costo|precio|dinero|cost|living|vida|cuánto/i,   'costo'],
    [/banco|bank|cuenta|nequi|banistmo/i,              'banco'],
    [/dond|barrio|zona|where|neighborhood|area|vivir/i,'where'],
    [/llam|call|reunión|meet|schedule|cita|hablar/i,   'call'],
    [/pickup|aeropuerto|airport|carlos|transfer|tocumen/i,'pickup'],
    [/sim|teléfono|phone|claro|movistar|número/i,      'sim'],
    [/escuela|school|colegio|niñ|hijo|kids/i,          'escuela'],
    [/médico|doctor|salud|health|hospital|clínica/i,   'medico'],
    [/doc|apostill|papeles|papers|gestor/i,            'docs'],
    [/impuesto|tax|fiscal|tributar|renta/i,            'impuesto'],
    [/invers|propiedad|property|real estate|comprar/i, 'inversion'],
    [/negocio|empresa|business|sociedad|empresa/i,     'negocio'],
    [/cierr|closing|firma|sign|escritura|notario/i,    'cierre'],
    [/ciudadan|citizenship|pasaporte|naturaliz/i,      'ciudadania'],
    [/golf|tucan|santa mar[ií]a|campo/i,               'golf'],
    [/yate|yacht|barco|marina|boat|velero/i,           'yate'],
  ];

  function _mariaReply(text, stage, mode, topic) {
    var combined = (text + ' ' + (topic || '')).toLowerCase();
    var kb = _KB[stage] || _KB.exploring;

    for (var i = 0; i < _PATTERNS.length; i++) {
      var pat = _PATTERNS[i][0], key = _PATTERNS[i][1];
      if (pat.test(combined) && kb[key]) return kb[key];
    }

    // Mode-aware fallback
    if (mode === 'family')   return 'Con gusto te ayudo con todo lo relacionado a familia. ¿Preguntas sobre escuelas, actividades para niños, o servicios domésticos?';
    if (mode === 'luxury')   return kb.default + ' En modo Luxury tengo acceso a experiencias exclusivas — ¿quieres que te muestre las opciones de esta semana?';
    if (mode === 'business') return kb.default + ' Estoy revisando las oportunidades de networking y negocios disponibles para ti.';
    if (mode === 'kids')     return '¡Hola! ¿En qué actividades para los chicos puedo ayudarte hoy?';
    return kb.default;
  }

  /* ── Expose ──────────────────────────────────────────────── */
  window.AppState = {
    getState:        getState,
    subscribe:       subscribe,
    navigate:        navigate,
    goBack:          goBack,
    selectStage:     selectStage,
    confirmStage:    confirmStage,
    setMode:         setMode,
    addPoints:       addPoints,
    openChat:        openChat,
    seedChat:        seedChat,
    sendMessage:     sendMessage,
    selectTier:      selectTier,
    isAgeRestricted: isAgeRestricted,
  };

}());
