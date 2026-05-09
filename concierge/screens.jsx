// Concierge onboarding screens — each is a self-contained scene that takes a `tone`.
// Tones come from window.CONCIERGE_TONES.
const { useState, useEffect, useRef } = React;

/* ── Shared chrome ── */

// Tone-aware background — each tone gets a unique atmosphere via gradient + grain.
function ToneBackground({ tone }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      background: `radial-gradient(ellipse at 50% 0%, ${tone.bg2} 0%, ${tone.bg} 60%)`,
    }}>
      {/* Faint atmospheric gradient — different per tone */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 80% 90%, ${tone.accent}18 0%, transparent 50%)`,
        mixBlendMode: 'screen',
      }}/>
      {/* Grain */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.5, mixBlendMode: 'overlay',
        backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'120\' height=\'120\'><filter id=\'n\'><feTurbulence baseFrequency=\'0.85\' numOctaves=\'2\' seed=\'4\'/><feColorMatrix values=\'0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.6 0\'/></filter><rect width=\'120\' height=\'120\' filter=\'url(%23n)\'/></svg>")',
      }}/>
    </div>
  );
}

// Status bar text aligned to tone — tap left side to go back when AppState available
function StatusEcho({ tone, showBack = false }) {
  return (
    <div style={{
      position: 'absolute', top: 56, left: 0, right: 0,
      display: 'flex', justifyContent: 'space-between',
      padding: '0 28px',
      fontFamily: tone.mono, fontSize: 13, letterSpacing: '0.18em',
      color: tone.mute, textTransform: 'uppercase',
      zIndex: 10,
    }}>
      <span
        onClick={showBack ? () => window.AppState?.goBack() : undefined}
        style={{ cursor: showBack ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 6 }}>
        {showBack && <span style={{ fontSize: 14, lineHeight: 1, marginTop: -1 }}>‹</span>}
        Concierge · {tone.name}
      </span>
      <span style={{ fontSize: 14 }}>{tone.glyph}</span>
    </div>
  );
}

/* ── Screen 1: Welcome / first impression ── */
function ScreenWelcome({ tone, label }) {
  const canvasRef = useRef(null);
  const vortexRef = useRef(null);
  const isExploring = tone.id === 'exploring';

  // Three.js intro plays only on Exploring tone — the first impression.
  useEffect(() => {
    if (!isExploring || !canvasRef.current) return;
    if (!window.ExploringOrbScene) return;
    const s = window.ExploringOrbScene(canvasRef.current, {
      accent: tone.accent, accent2: tone.accent2, bg: tone.bg,
    });
    return () => s.destroy();
  }, [isExploring, tone.accent, tone.accent2, tone.bg]);

  // For non-exploring tones, render an ambient PhantomShield-style particle
  // funnel as a low-opacity backdrop — flowing upward, color-tinted to the
  // current tone. Sits behind the UI; never obstructs interaction.
  useEffect(() => {
    if (isExploring || !vortexRef.current) return;
    if (!window.PhantomStreamScene) return;
    const s = window.PhantomStreamScene(vortexRef.current, {
      accent: tone.accent, accent2: tone.accent2,
      density: 0.85, flow: 'funnel',
    });
    return () => s.destroy();
  }, [isExploring, tone.accent, tone.accent2]);

  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%',
      color: tone.ink, overflow: 'hidden',
    }}>
      <ToneBackground tone={tone}/>

      {/* Subtle vortex/meridian for non-exploring tones — same visual
         language as the chat thread, but small and ambient. Bottom-right,
         small footprint, low opacity — feels like a quiet system pulse. */}
      {!isExploring && (
        <canvas ref={vortexRef} style={{
          position: 'absolute',
          inset: 0,
          width: '100%', height: '100%',
          opacity: 0.5, pointerEvents: 'none', zIndex: 1,
          mixBlendMode: 'screen',
        }}/>
      )}
      {isExploring && (
        <>
          <canvas ref={canvasRef} style={{
            position: 'absolute',
            top: 130, right: -40,
            width: 240, height: 240,
            opacity: 0.78, pointerEvents: 'none', zIndex: 1,
          }}/>

          {/* MazeHQ-style ambient hotspots — dotted concentric rings,
              scattered, low opacity. Tighter / fewer than before. */}
          <svg style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            zIndex: 1, pointerEvents: 'none', mixBlendMode: 'screen',
          }} viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
            {[
              { cx: 70,  cy: 350, r: 36, op: 0.30, delay: 0 },
              { cx: 330, cy: 420, r: 28, op: 0.34, delay: 1.4 },
              { cx: 60,  cy: 610, r: 44, op: 0.26, delay: 0.7 },
              { cx: 300, cy: 680, r: 32, op: 0.32, delay: 2.1 },
            ].map((h, i) => (
              <g key={i} style={{
                animation: `psPulse 4s ease-in-out ${h.delay}s infinite`,
                transformOrigin: `${h.cx}px ${h.cy}px`,
              }}>
                <circle cx={h.cx} cy={h.cy} r={h.r}
                  fill="none" stroke={tone.accent}
                  strokeOpacity={h.op}
                  strokeWidth="0.6" strokeDasharray="1.26 1.89"/>
                <circle cx={h.cx} cy={h.cy} r={h.r * 0.55}
                  fill="none" stroke={tone.accent}
                  strokeOpacity={h.op * 0.7}
                  strokeWidth="0.5" strokeDasharray="1.26 1.89"/>
                <circle cx={h.cx} cy={h.cy} r="1.2" fill={tone.accent} fillOpacity={h.op + 0.3}/>
              </g>
            ))}
            <line x1="0" y1="60%" x2="100%" y2="60%"
              stroke={tone.accent} strokeOpacity="0.14"
              strokeWidth="0.5" strokeDasharray="1.26 1.89"/>
          </svg>

          {/* MazeHQ event chips — Panama metadata floating like CVE events on PhantomShield.
              Each chip taggs a place with the qualities we'd surface for it. */}
          {[
            { top: 350, left: 18,  delay: '0s',   text: 'BOQUETE · 1,200m',
              tags: [['Climate', 'gold'], ['Cloud forest', 'gold']] },
            { top: 510, right: 16, delay: '1.4s', text: 'CASCO ANTIGUO · 1673',
              tags: [['Patrimonio', 'blue'], ['Walkable', 'gold']] },
            { top: 705, left: 22,  delay: '0.6s', text: 'PEARL ISLANDS · 30nm',
              tags: [['Charter', 'blue'], ['Private cay', 'gold']] },
          ].map((c, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: c.top, left: c.left, right: c.right,
              zIndex: 3, pointerEvents: 'none',
              animation: `psFloat 6s ease-in-out ${c.delay} infinite, psFadeIn 1s ease-out ${c.delay} both`,
            }}>
              <div style={{
                fontFamily: tone.mono, fontSize: 11, letterSpacing: '0.18em',
                color: tone.ink, opacity: 0.78,
                background: 'rgba(20,28,46,0.55)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: `0.5px dashed ${tone.accent}66`,
                padding: '6px 10px',
                marginBottom: 5,
                whiteSpace: 'nowrap',
              }}>{c.text}</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 180 }}>
                {c.tags.map((t, j) => (
                  <span key={j} style={{
                    fontFamily: tone.mono, fontSize: 10, letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: t[1] === 'gold' ? tone.accent : tone.accent2,
                    border: `0.5px solid ${(t[1] === 'gold' ? tone.accent : tone.accent2)}80`,
                    background: (t[1] === 'gold' ? tone.accent : tone.accent2) + '14',
                    padding: '3px 7px',
                  }}>{t[0]}</span>
                ))}
              </div>
            </div>
          ))}

          <style>{`
            @keyframes psPulse {
              0%,100% { opacity: 0.55; transform: scale(1); }
              50%     { opacity: 1;    transform: scale(1.08); }
            }
            @keyframes psFloat {
              0%,100% { transform: translateY(0); }
              50%     { transform: translateY(-6px); }
            }
            @keyframes psFadeIn {
              from { opacity: 0; transform: translateY(8px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </>
      )}

      <StatusEcho tone={tone}/>

      <div style={{
        position: 'absolute', inset: 0, padding: '120px 32px 60px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        zIndex: 2,
      }}>
        {/* Wordmark */}
        <div>
          <div style={{
            fontFamily: tone.mono, fontSize: 13, letterSpacing: '0.32em',
            color: tone.mute, textTransform: 'uppercase', marginBottom: 22,
          }}>
            Panama · Private Concierge
          </div>
          <div style={{
            fontFamily: tone.serif, fontWeight: 300, fontSize: 54,
            lineHeight: 1.05, letterSpacing: '-0.02em',
            color: tone.ink,
          }}>
            {tone.id === 'exploring' && (
              <>The country,<br/><em style={{ color: tone.accent, fontStyle: 'italic' }}>before</em><br/>you arrive.</>
            )}
            {tone.id === 'arriving' && (
              <>You're <em style={{ color: tone.accent, fontStyle: 'italic' }}>almost</em><br/>here.</>
            )}
            {tone.id === 'settling' && (
              <>Welcome.<br/>Let's <em style={{ color: tone.accent, fontStyle: 'italic' }}>sort</em><br/>the basics.</>
            )}
            {tone.id === 'living' && (
              <>Today, <em style={{ color: tone.accent, fontStyle: 'italic' }}>what</em><br/>can we<br/>arrange?</>
            )}
            {tone.id === 'thriving' && (
              <>The room<br/>behind <em style={{ color: tone.accent, fontStyle: 'italic' }}>the room</em>.</>
            )}
          </div>
        </div>

        {/* Decorative element */}
        <div style={{
          alignSelf: 'center', fontSize: 78, color: tone.accent, opacity: 0.55,
          letterSpacing: '0.2em',
        }}>
          {tone.glyph}
        </div>

        {/* CTA */}
        <div>
          <div style={{
            fontFamily: tone.serif, fontStyle: 'italic', fontSize: 21,
            color: tone.mute, marginBottom: 22, lineHeight: 1.5,
          }}>
            {tone.id === 'exploring' && '— a written introduction, no commitment.'}
            {tone.id === 'arriving' && '— we have your dates. Let\'s prepare.'}
            {tone.id === 'settling' && '— one step at a time. We\'ll guide.'}
            {tone.id === 'living' && '— your usual, or something new today?'}
            {tone.id === 'thriving' && '— quietly. As we always have.'}
          </div>
          <button
            onClick={() => window.AppState?.navigate('picker')}
            style={{
              width: '100%', padding: '28px', borderRadius: 0,
              background: tone.accent, color: tone.bg, border: 'none',
              fontFamily: tone.sans, fontSize: 17, fontWeight: 700,
              letterSpacing: '0.26em', textTransform: 'uppercase',
              cursor: 'pointer',
            }}>
            {tone.id === 'exploring' && 'Begin'}
            {tone.id === 'arriving' && 'Continue planning'}
            {tone.id === 'settling' && "What's first?"}
            {tone.id === 'living' && 'Open the desk'}
            {tone.id === 'thriving' && 'Enter'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Screen 2: "Where are you in the journey?" picker ── */
function ScreenStagePicker({ tone, label }) {
  const stages = window.CONCIERGE_STAGES;
  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%',
      color: tone.ink, overflow: 'hidden',
    }}>
      <ToneBackground tone={tone}/>
      <StatusEcho tone={tone} showBack={true}/>

      <div style={{ position: 'absolute', inset: 0, padding: '110px 24px 40px',
        display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div>
          <div style={{
            fontFamily: tone.mono, fontSize: 13, letterSpacing: '0.28em',
            color: tone.mute, textTransform: 'uppercase', marginBottom: 16,
          }}>
            Step 01 · The Question
          </div>
          <div style={{
            fontFamily: tone.serif, fontWeight: 300, fontSize: 42,
            lineHeight: 1.15, letterSpacing: '-0.015em',
          }}>
            Where are you<br/>
            <em style={{ color: tone.accent, fontStyle: 'italic' }}>in the journey?</em>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
          {stages.map((s, i) => {
            const active = s.id === tone.id;
            return (
              <div key={s.id}
                onClick={() => { window.AppState?.selectStage(s.id); window.AppState?.confirmStage(); }}
                style={{
                  padding: '22px 22px',
                  background: active ? `${tone.accent}14` : tone.surface,
                  border: `1px solid ${active ? tone.accent : tone.line}`,
                  display: 'flex', alignItems: 'flex-start', gap: 16,
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}>
                <div style={{
                  fontSize: 20, color: active ? tone.accent : tone.mute,
                  marginTop: 1, width: 22,
                }}>{s.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: tone.serif, fontStyle: 'italic',
                    fontSize: 24, fontWeight: 400,
                    color: active ? tone.ink : tone.ink, lineHeight: 1.2,
                  }}>{s.label}</div>
                  <div style={{
                    fontFamily: tone.sans, fontSize: 15, color: tone.mute,
                    marginTop: 4, letterSpacing: '0.04em',
                  }}>{s.sub}</div>
                </div>
                {active && (
                  <div style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    fontFamily: tone.mono, fontSize: 13, color: tone.accent,
                    letterSpacing: '0.22em', fontWeight: 600,
                  }}>YOU</div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{
          marginTop: 'auto', fontFamily: tone.serif, fontStyle: 'italic',
          fontSize: 18, color: tone.mute, lineHeight: 1.5,
        }}>
          The app shifts to match where you stand. Move when you're ready.
        </div>
      </div>
    </div>
  );
}

/* ── Screen 3: Service desk / dashboard ── */
function ScreenDesk({ tone, label }) {
  const services = {
    exploring: [
      { l: 'Neighborhood letters', t: 'weekly' },
      { l: 'Market reports', t: 'monthly' },
      { l: 'Virtual property tours', t: 'on demand' },
      { l: 'Schedule a discovery trip', t: '' },
    ],
    arriving: [
      { l: 'Moving company brief', t: 'in progress' },
      { l: 'Visa & customs liaison', t: 'pending' },
      { l: 'Airport welcome', t: 'Apr 18 · 14:30' },
      { l: 'First-week itinerary', t: 'draft ready' },
    ],
    settling: [
      { l: 'Bank account opening', t: 'Wed 10:00' },
      { l: 'School visits', t: '3 scheduled' },
      { l: 'Doctor introductions', t: 'await reply' },
      { l: 'Household help interviews', t: 'Thu' },
    ],
    living: [
      { l: 'Yacht — Las Perlas Saturday', t: 'confirmed' },
      { l: 'Private chef Friday', t: 'menu ready' },
      { l: 'Tennis at Club Unión', t: 'Tue 07:00' },
      { l: 'Spa booking — Casco', t: 'Fri 16:00' },
    ],
    thriving: [
      { l: 'Off-market viewing — Coronado', t: 'private' },
      { l: 'Dinner with the Ambassador', t: 'Apr 24' },
      { l: 'Founder mentor session', t: 'monthly' },
      { l: 'Estate planning review', t: 'Q2' },
    ],
  };
  const items = services[tone.id];

  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%',
      color: tone.ink, overflow: 'hidden',
    }}>
      <ToneBackground tone={tone}/>
      <StatusEcho tone={tone} showBack={true}/>

      <div style={{ position: 'absolute', inset: 0, padding: '110px 24px 30px',
        display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{
              fontFamily: tone.mono, fontSize: 13, letterSpacing: '0.3em',
              color: tone.mute, textTransform: 'uppercase',
            }}>The Desk</div>
            <div style={{
              fontFamily: tone.serif, fontWeight: 300, fontSize: 40,
              lineHeight: 1.05, letterSpacing: '-0.015em', marginTop: 6,
            }}>
              {tone.id === 'exploring' && <>Reading <em style={{ color: tone.accent, fontStyle: 'italic' }}>the country</em></>}
              {tone.id === 'arriving' && <>Final <em style={{ color: tone.accent, fontStyle: 'italic' }}>preparations</em></>}
              {tone.id === 'settling' && <>This <em style={{ color: tone.accent, fontStyle: 'italic' }}>week</em></>}
              {tone.id === 'living' && <>Today's <em style={{ color: tone.accent, fontStyle: 'italic' }}>rhythm</em></>}
              {tone.id === 'thriving' && <>Among <em style={{ color: tone.accent, fontStyle: 'italic' }}>the few</em></>}
            </div>
          </div>
          <div
            onClick={() => window.AppState?.navigate('pricing')}
            style={{
              width: 44, height: 44, borderRadius: '50%',
              border: `1px solid ${tone.line}`, background: tone.surface,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: tone.serif, fontStyle: 'italic', fontSize: 21,
              color: tone.accent,
              cursor: 'pointer',
            }}>
            {tone.id === 'exploring' ? 'E' :
             tone.id === 'arriving' ? 'S' :
             tone.id === 'settling' ? 'L' :
             tone.id === 'living' ? 'R' : 'D'}
          </div>
        </div>

        {/* List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1,
          background: tone.line, padding: 1 }}>
          {items.map((s, i) => (
            <div key={i} style={{
              padding: '22px 18px',
              background: tone.bg2,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              gap: 10,
            }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'baseline', flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: tone.mono, fontSize: 13, color: tone.accent,
                  letterSpacing: '0.15em', fontWeight: 500,
                }}>0{i+1}</div>
                <div style={{
                  fontFamily: tone.serif, fontSize: 21, color: tone.ink,
                  letterSpacing: '-0.005em', overflow: 'hidden', textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap', lineHeight: 1.3,
                }}>{s.l}</div>
              </div>
              {s.t && (
                <div style={{
                  fontFamily: tone.mono, fontSize: 12, color: tone.mute,
                  letterSpacing: '0.12em', textTransform: 'uppercase', flexShrink: 0,
                }}>{s.t}</div>
              )}
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div
          onClick={() => window.AppState?.navigate('chat')}
          style={{
            marginTop: 'auto', padding: '12px 0',
            borderTop: `1px solid ${tone.line}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            cursor: 'pointer',
          }}>
          <div style={{
            fontFamily: tone.serif, fontStyle: 'italic', fontSize: 18,
            color: tone.mute,
          }}>
            {tone.id === 'exploring' && 'Eduardo is reading replies.'}
            {tone.id === 'arriving' && 'Sofia is on the line with customs.'}
            {tone.id === 'settling' && 'Luis is checking in tonight.'}
            {tone.id === 'living' && 'The captain texted at 11:04.'}
            {tone.id === 'thriving' && 'A note from the Director.'}
          </div>
          <div style={{
            fontFamily: tone.mono, fontSize: 18, color: tone.accent,
            letterSpacing: '0.18em',
          }}>›</div>
        </div>
      </div>
    </div>
  );
}

/* ── Screen 4: Concierge chat / message ── */
function ScreenChat({ tone, label }) {
  const canvasRef = useRef(null);
  const isExploring = tone.id === 'exploring';
  const [inputText, setInputText] = useState('');
  const [liveHistory, setLiveHistory] = useState(null);
  const scrollRef = useRef(null);

  // Seed chatHistory with static thread on first mount (if empty),
  // then subscribe so new messages append to it.
  useEffect(() => {
    if (!window.AppState) return;
    // Convert static seed thread to chatHistory format and seed if empty
    const seedMessages = thread.map((m, i) => ({
      id: Date.now() + i,
      role: m.from === 'me' ? 'user' : 'maria',
      text: m.t,
      ts: new Date(),
    }));
    window.AppState.seedChat(seedMessages);
    // Now subscribe to live history
    const unsub = window.AppState.subscribe(s => {
      if (s.chatHistory && s.chatHistory.length > 0) {
        setLiveHistory(s.chatHistory);
      }
    });
    return () => unsub && unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tone.id]); // re-seed when stage changes

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [liveHistory]);

  // Three.js: when an Exploring client first opens the chat, particles vortex
  // inward to a pulsing meridian — the concierge "tuning in" to their questions.
  useEffect(() => {
    if (!isExploring || !canvasRef.current) return;
    if (!window.ExploringQuestionsScene) return;
    const s = window.ExploringQuestionsScene(canvasRef.current, {
      accent: tone.accent, accent2: tone.accent2,
    });
    return () => s.destroy();
  }, [isExploring, tone.accent, tone.accent2]);

  const msgs = {
    exploring: [
      { from: 'them', t: 'A note before you decide anything.' },
      { from: 'them', t: 'I\'ve put together three neighborhood letters — Casco Antiguo, Punta Pacifica, Coronado — based on what you mentioned about light, walkability, and beach access.' },
      { from: 'me',   t: 'Wonderful. No rush.' },
      { from: 'them', t: 'They\'re yours. Read when you\'re ready.' },
    ],
    arriving: [
      { from: 'them', t: 'Three weeks out. Let\'s confirm a few things.' },
      { from: 'them', t: 'Movers picking up Mar 28. Customs paperwork is filed.' },
      { from: 'me',   t: 'And the dog?' },
      { from: 'them', t: 'She has a vet appointment Thursday for the import certificate. I\'ll be there.' },
    ],
    settling: [
      { from: 'them', t: 'Wed 10:00 at Banistmo with Mariela. She\'s expecting you.' },
      { from: 'me',   t: 'Anything I should bring beyond the documents you sent?' },
      { from: 'them', t: 'Just yourself. I\'ve already sent her the file.' },
      { from: 'them', t: 'Coffee at La Forêt after, if you have an hour?' },
    ],
    living: [
      { from: 'them', t: 'The forecast for Saturday is glass — Las Perlas is still on.' },
      { from: 'them', t: 'Captain Roque suggests leaving the marina at 08:30 to catch the morning light at Contadora.' },
      { from: 'me',   t: 'Perfect. Same provisioning as last time.' },
      { from: 'them', t: 'Already done. Champagne is on ice.' },
    ],
    thriving: [
      { from: 'them', t: 'Quiet word — the property in Coronado we discussed last spring is coming available. Owner is private. Wants discretion.' },
      { from: 'me',   t: 'How private?' },
      { from: 'them', t: 'No listing. No agents. A walkthrough Friday afternoon if you can be there.' },
    ],
  };
  const thread = msgs[tone.id];

  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%',
      color: tone.ink, overflow: 'hidden',
    }}>
      <ToneBackground tone={tone}/>
      {isExploring && (
        <canvas ref={canvasRef} style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          opacity: 0.42, pointerEvents: 'none', zIndex: 1,
        }}/>
      )}
      <StatusEcho tone={tone} showBack={true}/>

      <div style={{ position: 'absolute', inset: 0, padding: '108px 20px 80px',
        display: 'flex', flexDirection: 'column', gap: 14, zIndex: 2 }}>
        {/* Concierge header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          paddingBottom: 12, borderBottom: `1px solid ${tone.line}`,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: `linear-gradient(135deg, ${tone.accent}, ${tone.accent2})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: tone.serif, fontStyle: 'italic', fontSize: 21,
            color: tone.bg, fontWeight: 500,
          }}>
            {tone.id === 'exploring' && 'E'}
            {tone.id === 'arriving' && 'S'}
            {tone.id === 'settling' && 'L'}
            {tone.id === 'living' && 'R'}
            {tone.id === 'thriving' && 'D'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: tone.serif, fontSize: 21, color: tone.ink,
              letterSpacing: '-0.005em',
            }}>
              {tone.id === 'exploring' && 'Eduardo Mendoza'}
              {tone.id === 'arriving' && 'Sofia Arosemena'}
              {tone.id === 'settling' && 'Luis Castillo'}
              {tone.id === 'living' && 'Captain Roque'}
              {tone.id === 'thriving' && 'D. (Director)'}
            </div>
            <div style={{
              fontFamily: tone.mono, fontSize: 13, color: tone.mute,
              letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 3,
            }}>
              {tone.id === 'exploring' && 'Country Curator · 14 yrs'}
              {tone.id === 'arriving' && 'Move Manager · Replied 2m'}
              {tone.id === 'settling' && 'Settlement Lead · Online'}
              {tone.id === 'living' && 'Marina · Saturday'}
              {tone.id === 'thriving' && 'Members\' Office'}
            </div>
          </div>
          <div style={{
            fontSize: 22, color: tone.accent, opacity: 0.7,
          }}>{tone.glyph}</div>
        </div>

        {/* Messages — live from AppState or static seed */}
        <div ref={scrollRef} style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, overflowY: 'auto' }}>
          {(liveHistory
            ? liveHistory.map((m, i) => {
                const me = m.role === 'user';
                return (
                  <div key={m.id || i} style={{
                    display: 'flex', justifyContent: me ? 'flex-end' : 'flex-start',
                  }}>
                    <div style={{
                      maxWidth: '82%', padding: '15px 19px',
                      background: me ? `${tone.accent}26` : tone.surface,
                      border: me ? `1px solid ${tone.accent}40` : `1px solid ${tone.line}`,
                      fontFamily: me ? tone.sans : tone.serif,
                      fontSize: me ? 16 : 18,
                      color: tone.ink, lineHeight: 1.45,
                      letterSpacing: me ? '0' : '-0.005em',
                    }}>
                      {m.text}
                    </div>
                  </div>
                );
              })
            : thread.map((m, i) => {
                const me = m.from === 'me';
                return (
                  <div key={i} style={{
                    display: 'flex', justifyContent: me ? 'flex-end' : 'flex-start',
                  }}>
                    <div style={{
                      maxWidth: '82%', padding: '15px 19px',
                      background: me ? `${tone.accent}26` : tone.surface,
                      border: me ? `1px solid ${tone.accent}40` : `1px solid ${tone.line}`,
                      fontFamily: me ? tone.sans : tone.serif,
                      fontSize: me ? 16 : 18,
                      color: tone.ink, lineHeight: 1.45,
                      letterSpacing: me ? '0' : '-0.005em',
                    }}>
                      {m.t}
                    </div>
                  </div>
                );
              })
          )}
        </div>

        {/* Composer */}
        <div style={{
          position: 'absolute', left: 20, right: 20, bottom: 30,
          padding: '16px 22px', background: tone.surface,
          border: `1px solid ${tone.line}`,
          display: 'flex', gap: 12, alignItems: 'center',
        }}>
          <input
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && inputText.trim()) {
                window.AppState?.sendMessage(inputText.trim());
                setInputText('');
              }
            }}
            placeholder="Write a note…"
            style={{
              flex: 1, border: 'none', background: 'transparent', outline: 'none',
              fontFamily: tone.serif, fontStyle: 'italic',
              fontSize: 18, color: tone.ink,
            }}
          />
          <div
            onClick={() => {
              if (inputText.trim()) {
                window.AppState?.sendMessage(inputText.trim());
                setInputText('');
              }
            }}
            style={{
              fontFamily: tone.mono, fontSize: 14, color: tone.accent,
              letterSpacing: '0.22em', cursor: 'pointer', fontWeight: 600,
            }}>SEND</div>
        </div>
      </div>
    </div>
  );
}

window.ConciergeScreens = { ScreenWelcome, ScreenStagePicker, ScreenDesk, ScreenChat, ScreenPricing };

/* ── Screen 5: Pricing — tiered services, tone-aware copy ── */
function ScreenPricing({ tone, label }) {
  // Pricing structure varies by stage — features and emphasis adapt
  const tiers = {
    exploring: {
      title: 'For those still reading the country',
      lede: 'No commitment. Information first.',
      tiers: [
        { name: 'Letters', price: 'Complimentary', period: '',
          features: ['Quarterly market briefings', 'Three neighborhood letters', 'A curated reading list', 'No call required'],
          cta: 'Begin reading', highlighted: false },
        { name: 'Discovery', price: '$1,800', period: 'one trip',
          features: ['4-day private itinerary', 'Concierge introductions', 'Three neighborhood walkthroughs', 'Refunded if you join'],
          cta: 'Plan a visit', highlighted: true },
      ],
    },
    arriving: {
      title: 'Move-in coordination',
      lede: 'A single point of contact through arrival.',
      tiers: [
        { name: 'Essential', price: '$3,500', period: 'one-time',
          features: ['Movers + customs liaison', 'Visa coordination', 'First-week itinerary', 'Airport welcome'],
          cta: 'Coordinate move', highlighted: false },
        { name: 'Concierge', price: '$8,400', period: 'one-time',
          features: ['Everything in Essential', 'Pre-arrival apartment setup', 'Pet & vehicle import', 'On-the-ground manager · 30 days'],
          cta: 'Full coordination', highlighted: true },
      ],
    },
    settling: {
      title: 'First weeks support',
      lede: 'Banking, schools, doctors — at your pace.',
      tiers: [
        { name: 'Per-task', price: 'From $250', period: 'per service',
          features: ['Bank account opening', 'School visits', 'Doctor introductions', 'Service provider vetting'],
          cta: 'Pick a service', highlighted: false },
        { name: 'Settlement', price: '$2,400', period: '/ month · 3 mo min',
          features: ['Unlimited tasks', 'Weekly check-in', 'Household help interviews', 'Bilingual paperwork'],
          cta: 'Start settlement', highlighted: true },
      ],
    },
    living: {
      title: 'Membership · Living',
      lede: 'Your standing desk in Panama.',
      tiers: [
        { name: 'À la carte', price: 'Service + 18%', period: '',
          features: ['Yacht & charter', 'Private chef', 'Last-minute reservations', 'Wellness & spa'],
          cta: 'Book a service', highlighted: false },
        { name: 'Annual', price: '$14,000', period: '/ year',
          features: ['Unlimited bookings', 'Concierge on call', 'Priority access', 'Service + 8%'],
          cta: 'Become a member', highlighted: true },
      ],
    },
    thriving: {
      title: 'The Director\'s Office',
      lede: 'By introduction. Annual fee waived for residents of 7+ years.',
      tiers: [
        { name: 'Standard', price: '$24,000', period: '/ year',
          features: ['Off-market property access', 'Members\' events', 'Estate planning review', 'Quiet introductions'],
          cta: 'Request introduction', highlighted: false },
        { name: 'Founder', price: 'On request', period: '',
          features: ['Everything in Standard', 'Government & banking liaison', 'Founder mentor circle', 'Family-office services'],
          cta: 'Speak with the Director', highlighted: true },
      ],
    },
  };
  const data = tiers[tone.id];

  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%',
      color: tone.ink, overflow: 'hidden',
    }}>
      <ToneBackground tone={tone}/>
      <StatusEcho tone={tone} showBack={true}/>

      <div style={{ position: 'absolute', inset: 0, padding: '108px 22px 30px',
        display: 'flex', flexDirection: 'column', gap: 18, overflow: 'auto' }}>
        {/* Header */}
        <div>
          <div style={{
            fontFamily: tone.mono, fontSize: 13, letterSpacing: '0.3em',
            color: tone.mute, textTransform: 'uppercase',
          }}>Established prices</div>
          <div style={{
            fontFamily: tone.serif, fontWeight: 300, fontSize: 34,
            lineHeight: 1.15, letterSpacing: '-0.015em', marginTop: 8,
            color: tone.ink,
          }}>
            {data.title.split(' ').slice(0, -2).join(' ')}{' '}
            <em style={{ color: tone.accent, fontStyle: 'italic' }}>
              {data.title.split(' ').slice(-2).join(' ')}
            </em>
          </div>
          <div style={{
            fontFamily: tone.serif, fontStyle: 'italic', fontSize: 18,
            color: tone.mute, marginTop: 10, lineHeight: 1.4,
          }}>{data.lede}</div>
        </div>

        {/* Tiers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.tiers.map((tier, i) => (
            <div key={i} style={{
              padding: '16px 16px',
              background: tier.highlighted ? `${tone.accent}10` : tone.surface,
              border: `1px solid ${tier.highlighted ? tone.accent + '60' : tone.line}`,
              position: 'relative',
            }}>
              {tier.highlighted && (
                <div style={{
                  position: 'absolute', top: -10, right: 14,
                  padding: '4px 10px', background: tone.accent,
                  fontFamily: tone.mono, fontSize: 12, color: tone.bg,
                  letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600,
                }}>Most chosen</div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between',
                alignItems: 'baseline', gap: 8 }}>
                <div style={{
                  fontFamily: tone.serif, fontStyle: 'italic',
                  fontSize: 26, color: tone.ink, fontWeight: 400,
                }}>{tier.name}</div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    fontFamily: tone.serif, fontSize: 30, color: tone.accent,
                    fontWeight: 400, letterSpacing: '-0.01em',
                  }}>{tier.price}</span>
                  {tier.period && (
                    <span style={{
                      fontFamily: tone.mono, fontSize: 13, color: tone.mute,
                      letterSpacing: '0.12em', marginLeft: 5,
                    }}>{tier.period}</span>
                  )}
                </div>
              </div>

              <div style={{
                display: 'flex', flexDirection: 'column', gap: 6,
                marginTop: 14, paddingTop: 12, borderTop: `1px solid ${tone.line}`,
              }}>
                {tier.features.map((f, j) => (
                  <div key={j} style={{
                    display: 'flex', gap: 10, alignItems: 'flex-start',
                    fontFamily: tone.sans, fontSize: 16, color: tone.ink,
                    lineHeight: 1.4,
                  }}>
                    <span style={{
                      color: tone.accent, fontSize: 13, marginTop: 4, flexShrink: 0,
                    }}>—</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  window.AppState?.selectTier(tier.name);
                  window.AppState?.navigate('chat');
                }}
                style={{
                  marginTop: 18, width: '100%', padding: '22px',
                  background: tier.highlighted ? tone.accent : 'transparent',
                  color: tier.highlighted ? tone.bg : tone.ink,
                  border: tier.highlighted ? 'none' : `1px solid ${tone.line}`,
                  fontFamily: tone.sans, fontSize: 16, fontWeight: 700,
                  letterSpacing: '0.24em', textTransform: 'uppercase',
                  cursor: 'pointer',
                }}>
                {tier.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div style={{
          marginTop: 'auto', paddingTop: 16, borderTop: `1px solid ${tone.line}`,
          fontFamily: tone.serif, fontStyle: 'italic', fontSize: 16,
          color: tone.mute, lineHeight: 1.5,
        }}>
          Prices in USD. Adjustable to your circumstances — speak to your concierge.
        </div>
      </div>
    </div>
  );
}
