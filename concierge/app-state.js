/**
 * app-state.js — Panama Lifestyle OS · Application State v3
 *
 * Pure-JS event store with localStorage persistence.
 * Adds: follow-up algorithm, completedItems tracking, returnCount.
 *
 * Exposed as: window.AppState
 */
(function () {
  'use strict';

  /* ── Content rating registry ──────────────────────────────────── */
  var AGE_RESTRICTED = new Set([
    'vip_night', 'casino', 'nightlife_vip', 'adult_social',
  ]);
  function isAgeRestricted(tag) { return tag ? AGE_RESTRICTED.has(tag) : false; }

  /* ── localStorage persistence ────────────────────────────────── */
  var _STORE_KEY = 'panama_os_v3';

  function _loadPersisted() {
    try {
      var raw = localStorage.getItem(_STORE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }

  function _savePersisted(s) {
    try {
      localStorage.setItem(_STORE_KEY, JSON.stringify({
        stage:          s.stage,
        mode:           s.mode,
        tier:           s.tier,
        passportPoints: s.passportPoints,
        completedItems: s.completedItems || [],
        returnCount:    s.returnCount    || 0,
        lastVisit:      Date.now(),
      }));
    } catch (e) {}
  }

  /* ── Follow-up algorithm ─────────────────────────────────────── */
  function _computeFollowUp(stage, lastVisit, completedItems, returnCount) {
    var now       = Date.now();
    var daysSince = lastVisit ? Math.floor((now - lastVisit) / 86400000) : 999;
    var isFirst   = !lastVisit || returnCount === 0;
    var done      = completedItems || [];

    var STEPS = {
      exploring: [
        { id: 'welcome_report',
          msg: 'Preparé 3 cartas de barrios — Casco Antiguo, Marbella, Boquete — basadas en tu perfil.',
          ctaLabel: 'Leer ahora', ctaScreen: 'chat',
          cond: function () { return isFirst; } },
        { id: 'followup_call',
          msg: 'Llevas ' + daysSince + ' días explorando. ¿Agendamos 30 min sin compromiso para hablar opciones?',
          ctaLabel: 'Agendar llamada', ctaScreen: 'chat',
          cond: function () { return !isFirst && daysSince >= 3; } },
        { id: 'plan_trip',
          msg: 'Siguiente paso real: un trip de reconocimiento de 4 días. Tengo disponibilidad en junio.',
          ctaLabel: 'Ver el plan', ctaScreen: 'pricing',
          cond: function () { return returnCount >= 3 && daysSince >= 1; } },
      ],
      arriving: [
        { id: 'confirm_movers',
          msg: 'Bienvenido de vuelta. Esta semana: confirma la empresa de mudanza — las fechas se llenan rápido.',
          ctaLabel: 'Coordinar mudanza', ctaScreen: 'chat',
          cond: function () { return isFirst || daysSince >= 1; } },
        { id: 'pet_cert',
          msg: 'El certificado veterinario tiene ventana de exactamente 10 días antes del vuelo. ¿Cuándo viajas?',
          ctaLabel: 'Coordinar mascotas', ctaScreen: 'chat',
          cond: function () { return daysSince >= 2; } },
        { id: 'arrival_kit',
          msg: 'Kit de llegada listo: SIM Claro, llaves del apartamento, itinerario de semana 1.',
          ctaLabel: 'Revisar kit', ctaScreen: 'desk',
          cond: function () { return daysSince >= 5; } },
      ],
      settling: [
        { id: 'bank_appt',
          msg: 'Tu cita en Banistmo es el jueves con Mariela. Yo ya envié el expediente — solo necesitas llegar.',
          ctaLabel: 'Ver los 3 documentos', ctaScreen: 'chat',
          cond: function () { return isFirst || daysSince >= 1; } },
        { id: 'internet_order',
          msg: 'Cable Onda instalación tarda 3–7 días hábiles. Mejor pedirlo hoy antes de que necesites trabajar desde casa.',
          ctaLabel: 'Gestionar internet', ctaScreen: 'chat',
          cond: function () { return daysSince >= 2 && !done.includes('bank_appt'); } },
        { id: 'school_visit',
          msg: 'King\'s College tiene visita abierta este viernes a las 10:00. ¿Confirmo para tus hijos?',
          ctaLabel: 'Confirmar visita', ctaScreen: 'chat',
          cond: function () { return daysSince >= 5; } },
        { id: 'residency_docs',
          msg: 'El gestor tiene las apostillas. El trámite de residencia avanza esta semana — revisa el estado.',
          ctaLabel: 'Ver estado del trámite', ctaScreen: 'chat',
          cond: function () { return daysSince >= 14; } },
      ],
      living: [
        { id: 'tax_review',
          msg: 'Ricardo tiene el borrador fiscal listo. Renta territorial: ingresos del exterior 100% exentos.',
          ctaLabel: 'Revisar con Ricardo', ctaScreen: 'chat',
          cond: function () { return isFirst || daysSince >= 30; } },
        { id: 'weekend_yacht',
          msg: 'Fin de semana en calma — Las Perlas perfecto este sábado. El capitán Roque tiene disponibilidad.',
          ctaLabel: 'Confirmar yate', ctaScreen: 'chat',
          cond: function () { return !isFirst && daysSince >= 4; } },
        { id: 'property_alert',
          msg: 'Dos propiedades nuevas en Marbella que podrían interesarte. ROI estimado 6–8% anual.',
          ctaLabel: 'Ver propiedades', ctaScreen: 'chat',
          cond: function () { return daysSince >= 21; } },
      ],
      thriving: [
        { id: 'citizenship_track',
          msg: 'Residencia continua confirmada. En ruta perfecta para ciudadanía panameña 2028 — pasaporte visa-free en 130+ países.',
          ctaLabel: 'Ver progreso', ctaScreen: 'chat',
          cond: function () { return isFirst || daysSince >= 30; } },
        { id: 'off_market',
          msg: 'Propiedad privada en Coronado — sin listing, sin agentes. El dueño quiere discreción. Walkthrough viernes.',
          ctaLabel: 'Saber más', ctaScreen: 'chat',
          cond: function () { return !isFirst && daysSince >= 7; } },
        { id: 'portfolio_may',
          msg: 'Portfolio Mayo 2026: cierre del Casco es el jueves. Fernanda Cruz confirma el documento de traspaso.',
          ctaLabel: 'Confirmar cierre', ctaScreen: 'chat',
          cond: function () { return daysSince >= 20; } },
      ],
    };

    var steps = STEPS[stage] || STEPS.exploring;
    for (var i = 0; i < steps.length; i++) {
      var step = steps[i];
      if (!done.includes(step.id) && step.cond()) {
        return { id: step.id, msg: step.msg, ctaLabel: step.ctaLabel, ctaScreen: step.ctaScreen };
      }
    }
    return null;
  }

  /* ── Boot: load persisted state + increment returnCount ─────── */
  var _p = _loadPersisted();

  var INITIAL = {
    screen:         'welcome',
    prevScreen:     null,
    stage:          _p.stage          || 'exploring',
    pendingStage:   null,
    mode:           _p.mode           || 'practical',
    tier:           _p.tier           || 'explorer',
    passportPoints: _p.passportPoints || 0,
    chatHistory:    [],
    chatTopic:      null,
    transition:     'forward',
    isLoggedIn:     false,
    isAgeVerified:  false,
    returnCount:    (_p.returnCount || 0) + 1,
    lastVisit:      _p.lastVisit      || null,
    completedItems: _p.completedItems || [],
    followUp:       null,
  };

  INITIAL.followUp = _computeFollowUp(
    INITIAL.stage,
    _p.lastVisit || null,
    INITIAL.completedItems,
    _p.returnCount || 0
  );

  _savePersisted(INITIAL);

  var _state = Object.assign({}, INITIAL);
  var _subs  = [];

  function getState() { return Object.assign({}, _state); }

  function _set(patch) {
    _state = Object.assign({}, _state, patch);
    _savePersisted(_state);
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

  function selectStage(stageId) { _set({ pendingStage: stageId }); }

  function confirmStage() {
    var stage = _state.pendingStage || _state.stage;
    _set({
      stage:          stage,
      pendingStage:   null,
      tier:           _stageTier(stage),
      passportPoints: _stagePoints(stage),
      chatHistory:    [],
      completedItems: [],
      followUp:       _computeFollowUp(stage, null, [], 0),
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

  function setMode(mode) { _set({ mode: mode }); }

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

  function markDone(itemId) {
    if (!itemId || _state.completedItems.includes(itemId)) return;
    var next = _state.completedItems.concat([itemId]);
    var nextFollowUp = _computeFollowUp(
      _state.stage, _state.lastVisit, next, _state.returnCount
    );
    _set({ completedItems: next, followUp: nextFollowUp });
    addPoints(10);
  }

  function dismissFollowUp() {
    if (_state.followUp) {
      markDone(_state.followUp.id);
    } else {
      _set({ followUp: null });
    }
  }

  function openChat(topic) {
    _set({ chatTopic: topic || null, prevScreen: _state.screen, screen: 'chat', transition: 'forward' });
  }

  function seedChat(messages) {
    if (_state.chatHistory.length === 0) {
      _set({ chatHistory: messages });
    }
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

  function selectTier(tierId) { addPoints(15); }

  var _KB = {
    exploring: {
      visa:     'Panama tiene 3 rutas principales: Friendly Nations Visa (la más rápida, para 50+ países), Pensionado ($1,000/mes ingresos pasivos), e Inversionista ($200K en real estate o depósito a plazo). Con pasaporte estadounidense tienes todas las opciones abiertas. ¿Te cuento cuál conviene para tu caso?',
      casa:     'Antes de comprar, recomiendo arrendar 3–6 meses. Cuatro perfiles: Casco Viejo (histórico, bohemio, $1,500+), Marbella/Punta Pacífica (moderno, central, $1,200+), Costa del Este (familiar, tranquilo, $1,400+), Boquete (montañoso, fresco, $600+). ¿Qué tipo de vida buscas?',
      costo:    'El costo de vida está 35–45% por debajo de EE.UU. para calidad comparable. Pareja cómoda en Ciudad de Panamá: $2,500–3,500/mes. Soltero: $1,500–2,500. Boquete: $1,200–2,000. ¿Quieres el desglose completo?',
      banco:    'Para nuevos residentes: Banistmo o Multibank son los más accesibles. Necesitas pasaporte, carta de ingresos y factura de servicios local. El proceso toma 2–8 semanas. Opción digital inmediata: Nequi, sin requisitos de residencia.',
      where:    'Las zonas más populares para expats: Casco Viejo (histórico), Marbella/Punta Pacífica (moderno, central), Costa del Este (familiar), El Cangrejo (económico, céntrico), y Boquete en las montañas. ¿Tienes preferencia de clima o estilo de vida?',
      call:     'Perfecto. Te envío el calendario — 30 min, sin costo, sin compromiso. Solo para entender tu situación y darte las opciones correctas. ¿Mañana por la mañana o la tarde?',
      mascota:  'Sí, es posible traer mascotas a Panamá. Necesitas: certificado de salud del veterinario (dentro de los 10 días exactos antes del vuelo), apostilla o sello del consulado panameño, y certificado USDA para perros/gatos desde EE.UU. Panama Pet Relocation son IPATA-Certified con agentes en 80+ países. ¿Perro o gato?',
      internet: 'La velocidad mediana en Panamá es 185 Mbps en 2026. Cable Onda es el proveedor más confiable — fibra hasta 600 Mbps desde $35/mes. Claro y Tigo también disponibles. La instalación tarda 3–7 días hábiles.',
      mudanza:  'Para el contenedor internacional: IGo Panama, DoPanama, y StartAbroad son los más recomendados para expats. El menaje de casa entra libre de impuestos con visa de residente. Necesitas lista detallada de cada ítem. ¿Ya tienes visa o vas en paralelo?',
      seguro:   'Para salud expat: Cigna Global, Allianz, y AXA son los planes más comunes. Recomiendo contratar antes de salir de tu país — más opciones y mejores precios. Consulta de especialista privado en Panamá: $50–130, versus $200–450 en EE.UU.',
      default:  'Estoy aquí para guiarte. Cuéntame — ¿qué te hizo buscar información sobre Panamá? Eso me ayuda a mostrarte lo más relevante para ti.',
    },
    arriving: {
      mudanza:  'Para el contenedor: IGo Panama, DoPanama, StartAbroad son los más recomendados. El menaje de casa entra libre de impuestos con visa de residente. Necesitas lista detallada de cada ítem. ¿Tienes ya la visa confirmada o va en paralelo?',
      mascota:  'Para la llegada de tu mascota: certificado veterinario USDA/CFIA válido exactamente 10 días antes del vuelo, apostilla o sello del consulado panameño. Coordino con Panama Pet Relocation — IPATA-Certified, agentes en 80+ países. ¿Cuándo es el vuelo?',
      pickup:   '¡Confirmado! El chofer estará en el pasillo de llegadas internacionales con tu nombre. Las llaves del apartamento están listas — código del edificio te lo mando por separado. ¿A qué hora exacta aterrizas?',
      sim:      'Plan recomendado: Claro turista $15 por 10GB, cubre todo el país. Hay kiosco justo al salir de aduana en Tocumen. O puedo tenerte una SIM esperando en el apartamento. ¿Cuál prefieres?',
      banco:    'Para el primer mes, Nequi (digital) funciona sin prueba de residencia — perfecto para empezar. Banistmo y Multibank requieren factura local; en 3–4 semanas ya tendrás eso.',
      internet: 'Cable Onda es el más confiable en Ciudad de Panamá — fibra hasta 600 Mbps desde $35/mes. La instalación tarda 3–7 días hábiles. Pídelo el primer día que llegues para no quedarte sin conexión.',
      seguro:   'Si no contrataste seguro antes de viajar, aún puedes conseguir cobertura. Hospital Paitilla y Pacífica Salud son privados — médicos formados en EE.UU. y Europa. Consulta especialista: $50–130 sin seguro.',
      default:  'Tu llegada está próxima. Tengo coordinado el transporte, las llaves del apartamento y el kit de bienvenida. ¿Qué más quieres revisar antes de llegar?',
    },
    settling: {
      escuela:  'Las dos más recomendadas: King\'s College (currículo Cambridge, Marbella, matrícula $3,000–8,000) y Oxford International (IB, Costa del Este). También: Balboa Academy (WASC-acreditada) e ISP. Tengo la visita al King\'s este viernes a las 10:00. ¿Cuántos años tienen tus hijos?',
      medico:   'Paitilla y Pacífica Salud son los hospitales privados de referencia — médicos formados en EE.UU. y Europa. Para médico de cabecera en inglés, el Dr. Morales en Paitilla tiene citas esta semana. Consulta: $50–130.',
      banco:    'Ya pasaron las semanas necesarias — deberías tener factura local ahora. Banistmo Paitilla tiene cita disponible el jueves. Documentos: pasaporte, carta de ingresos, factura de servicios, foto. ¿Te agendo?',
      internet: 'Para instalar Cable Onda necesitas: cédula o pasaporte y dirección del apartamento. Llamo hoy para la cita — instalación en 3–7 días hábiles. Fibra hasta 600 Mbps desde $35/mes. ¿Confirmo?',
      docs:     'Para la residencia necesitas: pasaporte apostillado, antecedentes penales apostillados del país de origen, certificado médico local, y fotos. El gestor tiene todo en proceso. La apostilla desde EE.UU. tarda 5 días.',
      carro:    'Para importar tu vehículo: libre de impuestos con residencia permanente (un vehículo por persona). Para comprar aquí: concesionarios en Costa del Este y Multiplaza. Seguro SOAT obligatorio. ¿Traes auto o prefieres comprar aquí?',
      seguro:   'Para seguro médico local como residente: Blue Cross Panamá, Mapfre, o ASSA son las principales aseguradoras locales. Con residencia también puedes acceder a la CSS para cobertura básica.',
      mascota:  'Para registrar a tu mascota en Panamá: vacuna antirrábica vigente, desparasitación, y registro en MIDA. El proceso es sencillo — te coordino con un veterinario de confianza en Marbella que atiende en inglés.',
      default:  'Semana 3 en Panamá — ya eres panameño de facto. ¿Hoy toca gestiones, escuela, o conectar con la comunidad de expats?',
    },
    living: {
      impuesto:  'Panama usa el sistema de renta territorial — tus ingresos del exterior están 100% exentos de impuestos. Solo pagas sobre lo que ganas dentro de Panamá. Para ciudadanos US: FATCA aplica pero sin doble imposición. Ricardo tiene el borrador listo.',
      inversion: 'El mercado de Casco está fuerte — ROI de arrendamiento 6–8% anual. Punta Pacífica: 5–7%. Costa del Este para largo plazo y plusvalía. Off-market hay propiedades que nunca llegan a portales. ¿Buscas renta mensual o plusvalía a 5 años?',
      negocio:   'Sociedad Anónima es la estructura más común para extranjeros. Costo total ~$1,200 incluyendo registro, RUC y cuenta empresarial. Si operas solo internacionalmente, una SA sin actividad local puede ser suficiente. ¿Tu actividad es local o internacional?',
      carro:     'Para renovar placa y registro: ATTT, revisión técnica anual obligatoria. Si importaste el auto con residencia permanente hace más de 3 años, ya puedes venderlo libre del impuesto de importación.',
      yate:      'Marina Flamenco tiene disponibilidad este sábado. Opciones: medio día 4h ($380) o día completo 8h ($650). También Balboa Yacht Club para socios. ¿Cuántos van? ¿Catering incluido?',
      golf:      'Tucan Country Club tiene disponibilidad mañana a las 7 AM o 3 PM. Santa María abrió slots este fin de semana. Summit Golf Club en Clayton para una experiencia más exclusiva. ¿Cuántos jugadores?',
      mascota:   'Para viajes regionales con tu mascota: Copa Airlines permite perros y gatos en cabina hasta 8kg. Para retiros en las islas: verificar restricciones de fauna local. ¿A dónde planeas viajar?',
      default:   'Buen día. Tienes 3 cosas en el escritorio: revisión fiscal con Ricardo, mantenimiento de piscina mañana, y el evento de la comunidad el sábado. ¿Por cuál empezamos?',
    },
    thriving: {
      cierre:     'Para el cierre del jueves: confirma que Fernanda Cruz (administradora HOA) tiene el documento de traspaso, y que Patricia tiene la Escritura original. ¿Quieres que coordine la llamada entre ellas hoy?',
      ciudadania: 'Año 3, mes 4 de residencia continua. En ruta perfecta para ciudadanía 2028 — pasaporte panameño, visa-free en 130+ países. Renovación anual marcada en octubre. ¿Revisamos el expediente?',
      golf:       'Tucan Country Club tiene disponibilidad mañana a las 7 AM o 3 PM. Santa María también abrió slots este fin de semana. ¿Cuántos jugadores y qué prefieren?',
      yate:       'Marina Flamenco tiene disponibilidad este sábado. Opciones: medio día (4h, $380) o día completo (8h, $650). ¿Cuántos van? ¿Catering incluido?',
      impuesto:   'Panama: renta territorial desde 1977, ingresos del exterior siempre exentos. Para ciudadanía activa: no ausencias de más de 1 año continuo. Ricardo tiene el historial completo.',
      negocio:    'Para family office en Panamá: SA + Fundación de Interés Privado es la estructura más común. Banca privada: BAC Private Banking, Multibank Private. ¿Quieres que coordine introductions?',
      mascota:    'Con ciudadanía panameña en proceso, tus mascotas viajan con pasaporte panameño de mascotas. Copa Airlines permite cabina hasta 8kg. Para retiros en las islas: verificar restricciones de fauna local.',
      default:    'Portfolio Mayo 2026. Tienes el cierre del Casco el jueves y la renovación de ciudadanía en octubre. ¿Qué orquestamos hoy?',
    },
  };

  var _PATTERNS = [
    [/visa|residencia|residency|permiso|fnv|friendly nations/i,          'visa'      ],
    [/casa|apartamento|vivienda|housing|rent|arrendar|alquil/i,          'casa'      ],
    [/costo|precio|dinero|cost|living|vida|cuánto|budget/i,              'costo'     ],
    [/banco|bank|cuenta|nequi|banistmo|multibank/i,                      'banco'     ],
    [/dond|barrio|zona|where|neighborhood|area|vivir/i,                  'where'     ],
    [/llam|call|reunión|meet|schedule|cita|hablar/i,                     'call'      ],
    [/pickup|aeropuerto|airport|transfer|tocumen|llegada/i,              'pickup'    ],
    [/sim|teléfono|phone|claro|movistar|número|tigo/i,                   'sim'       ],
    [/escuela|school|colegio|niñ|hijo|kids|king|oxford|balboa/i,         'escuela'   ],
    [/médico|doctor|salud|health|hospital|clínica|paitilla/i,            'medico'    ],
    [/doc|apostill|papeles|papers|gestor|trámite/i,                      'docs'      ],
    [/impuesto|tax|fiscal|tributar|renta|fatca|declaraci/i,              'impuesto'  ],
    [/invers|propiedad|property|real estate|comprar|mercado/i,           'inversion' ],
    [/negocio|empresa|business|sociedad|\bsa\b|fundaci/i,                'negocio'   ],
    [/cierr|closing|firma|sign|escritura|notario|traspaso/i,             'cierre'    ],
    [/ciudadan|citizenship|pasaporte|naturaliz/i,                        'ciudadania'],
    [/golf|tucan|santa mar[ií]a|campo|club/i,                            'golf'      ],
    [/yate|yacht|barco|marina|boat|velero|charter|perlas|contadora/i,    'yate'      ],
    [/mascota|perro|gato|dog|cat|pet|animal|veterinario|vet|mida/i,      'mascota'   ],
    [/internet|wifi|cable.?onda|fibra|banda|conectar|cwo/i,              'internet'  ],
    [/mudanza|shipping|contenedor|container|movers?|embalaje/i,          'mudanza'   ],
    [/seguro|insurance|cobertura|allianz|cigna|axa/i,                    'seguro'    ],
    [/carro|auto|vehicle|vehiculo|\bcar\b|conducir|licencia|attt|placa/i,'carro'     ],
  ];

  function _mariaReply(text, stage, mode, topic) {
    var combined = (text + ' ' + (topic || '')).toLowerCase();
    var kb = _KB[stage] || _KB.exploring;

    for (var i = 0; i < _PATTERNS.length; i++) {
      var pat = _PATTERNS[i][0], key = _PATTERNS[i][1];
      if (pat.test(combined) && kb[key]) return kb[key];
    }

    if (mode === 'family')   return 'Con gusto te ayudo con todo lo relacionado a familia — escuelas, mascotas, actividades para niños, o servicios domésticos. ¿Por dónde empezamos?';
    if (mode === 'luxury')   return kb.default + ' En modo Luxury tengo acceso a experiencias exclusivas — ¿quieres que te muestre las opciones de esta semana?';
    if (mode === 'business') return kb.default + ' Estoy revisando las oportunidades de networking y negocios disponibles para ti.';
    if (mode === 'kids')     return '¡Hola! ¿En qué actividades para los chicos puedo ayudarte hoy?';
    return kb.default;
  }

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
    newChat:         newChat,
    markDone:        markDone,
    dismissFollowUp: dismissFollowUp,
  };

}());
