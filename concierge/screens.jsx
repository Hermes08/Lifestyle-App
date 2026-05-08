/**
 * screens.jsx — Five tone-responsive Concierge screens
 * Panama Lifestyle OS spec v1.0
 * Exported as: window.ConciergeScreens
 */
(function(){
'use strict';
const {useState,useRef,useEffect,useCallback}=React;

function TierPill({tier,accent,accentSoft}){
  const label={explorer:'Explorer',settler:'Settler',resident:'Resident',insider:'Insider',legend:'Legend'}[tier]||'Explorer';
  return <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'3px 9px',borderRadius:20,background:accentSoft,border:`1px solid ${accent}44`,fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:'0.18em',textTransform:'uppercase',color:accent}}>✦ {label}</span>;
}

function PassportBar({points,nextAt,tier,tone}){
  const pct=Math.min(100,Math.round((points/nextAt)*100));
  return(
    <div style={{padding:'10px 20px 0'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
        <TierPill tier={tier} accent={tone.accent} accentSoft={tone.accentSoft}/>
        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8.5,color:tone.inkMuted,letterSpacing:'0.08em'}}>{points} / {nextAt} pts</span>
      </div>
      <div style={{height:3,borderRadius:100,background:tone.cardBorder,overflow:'hidden'}}>
        <div style={{height:'100%',width:pct+'%',borderRadius:100,background:tone.accent,transition:'width 0.6s ease'}}/>
      </div>
    </div>
  );
}

const MODE_TABS=[
  {id:'practical',icon:'⚙️',label:'Practical',color:'#5BA3C8'},
  {id:'family',   icon:'🏡',label:'Family',   color:'#68B86A'},
  {id:'luxury',   icon:'✦', label:'Luxury',   color:'#C6553A'},
  {id:'business', icon:'💼',label:'Business', color:'#9B70D8'},
  {id:'kids',     icon:'🌈',label:'Kids',     color:'#E060E0'},
];

function ModeTabs({active,tone,onSwitch}){
  return(
    <div style={{display:'flex',height:56,borderTop:`1px solid ${tone.cardBorder}`}}>
      {MODE_TABS.map(tab=>{
        const isActive=active===tab.id;
        return(
          <button key={tab.id} onClick={()=>onSwitch(tab.id)} style={{flex:1,height:'100%',border:'none',background:isActive?`${tab.color}18`:'transparent',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:3,cursor:'pointer',borderTop:isActive?`2px solid ${tab.color}`:'2px solid transparent'}}>
            <span style={{fontSize:14,lineHeight:1}}>{tab.icon}</span>
            <span style={{fontFamily:"'Manrope',sans-serif",fontSize:8,fontWeight:isActive?700:400,color:isActive?tab.color:tone.inkMuted,letterSpacing:'0.02em'}}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function VoiceOrb({tone}){
  return(
    <div style={{position:'absolute',bottom:70,left:'50%',transform:'translateX(-50%)',zIndex:20,display:'flex',flexDirection:'column',alignItems:'center',gap:5}}>
      <div style={{width:80,height:80,borderRadius:'50%',background:`radial-gradient(circle at 38% 38%,${tone.orb}cc,${tone.orb}55)`,boxShadow:`0 0 0 8px ${tone.orb}18,0 0 0 16px ${tone.orb}08`,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
        <span style={{fontSize:22}}>𝄞</span>
      </div>
      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:'0.2em',textTransform:'uppercase',color:tone.inkMuted,opacity:0.7}}>Hey Panama</span>
    </div>
  );
}

const WELCOME_COPY={
  exploring:{pre:'panamarealestateguide.com/concierge',hed:'Panama\ncalls.',sub:'A different life is closer than you think.',cta:'Start my journey →'},
  arriving: {pre:'You\'re almost here.',hed:'Let\'s get you\nready.',sub:'Your concierge is standing by for landing day.',cta:'Set up arrival →'},
  settling:  {pre:'Welcome home.',hed:'Making Panama\nyours.',sub:'From lease to cook to school — we handle every first.',cta:'Open the Desk →'},
  living:    {pre:'Good morning, David.',hed:'Three updates\non your desk.',sub:'Your daily brief is ready.',cta:'Open the Desk →'},
  thriving:  {pre:'Portfolio · May 2026',hed:'Your Panama.\nFully yours.',sub:'From first question to property and passport.',cta:'View portfolio →'},
};

function OrbCanvas({tone,size=136}){
  const ref=useRef(null);
  useEffect(()=>{
    if(!ref.current||!window.WebGLExploring)return;
    return window.WebGLExploring.createOrb(ref.current,{color:tone.orb||tone.accent,accent:tone.accent,size});
  },[tone.id]);
  return <div ref={ref} style={{width:size,height:size}}/>;
}

function ScreenWelcome({tone}){
  const copy=WELCOME_COPY[tone.id]||WELCOME_COPY.exploring;
  const dark=['exploring','settling','thriving'].includes(tone.id);
  return(
    <div style={{width:'100%',height:'100%',background:tone.gradient||tone.bg,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'44px 26px 36px',boxSizing:'border-box',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',width:320,height:320,borderRadius:'50%',background:`radial-gradient(circle,${tone.orb||tone.accent}28 0%,transparent 68%)`,top:'8%',left:'50%',transform:'translateX(-50%)',pointerEvents:'none'}}/>
      <div style={{position:'absolute',top:54,left:0,right:0,textAlign:'center'}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8.5,letterSpacing:'0.26em',textTransform:'uppercase',color:tone.accent}}>{copy.pre}</div>
      </div>
      <div style={{marginBottom:28,marginTop:12}}><OrbCanvas tone={tone} size={136}/></div>
      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:46,fontWeight:300,lineHeight:1.03,color:tone.ink,textAlign:'center',whiteSpace:'pre-line',letterSpacing:'-0.025em',marginBottom:14}}>{copy.hed}</div>
      <div style={{fontFamily:"'Manrope',sans-serif",fontSize:12.5,fontWeight:400,lineHeight:1.55,color:tone.inkMuted,textAlign:'center',marginBottom:40,maxWidth:230}}>{copy.sub}</div>
      <button style={{width:'100%',height:72,borderRadius:16,background:tone.accent,color:dark?'#0a0b10':'#ffffff',border:'none',cursor:'pointer',fontFamily:"'Manrope',sans-serif",fontSize:14,fontWeight:700}}>{copy.cta}</button>
      <div style={{position:'absolute',bottom:16,fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:'0.2em',textTransform:'uppercase',color:tone.inkMuted,opacity:0.55}}>Panama Lifestyle OS · {tone.name}</div>
    </div>
  );
}

const STAGES=[
  {id:'exploring',icon:'○',hed:'Exploring',sub:'Researching Panama from abroad',pts:'Earn Explorer stamp immediately'},
  {id:'arriving', icon:'◑',hed:'Arriving', sub:'Move planned or in progress',   pts:'+5 pts · Landed stamp'},
  {id:'settling', icon:'●',hed:'Settling', sub:'Arrived, building daily life',   pts:'+8 pts · Bank stamp pending'},
  {id:'living',   icon:'◉',hed:'Living',   sub:'Panama is home now',             pts:'Resident tier eligible'},
  {id:'thriving', icon:'✦',hed:'Thriving', sub:'Investing & growing my network', pts:'Legend tier track'},
];

function ScreenStagePicker({tone}){
  const [sel,setSel]=useState(tone.id);
  const dark=['exploring','settling','thriving'].includes(tone.id);
  return(
    <div style={{width:'100%',height:'100%',background:tone.bg,boxSizing:'border-box',display:'flex',flexDirection:'column',padding:'60px 0 16px',overflow:'hidden'}}>
      <div style={{padding:'0 22px',marginBottom:20}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:27,fontWeight:300,color:tone.ink,lineHeight:1.12,letterSpacing:'-0.015em'}}>Where are you in your<br/>Panama journey?</div>
        <div style={{fontFamily:"'Manrope',sans-serif",fontSize:12,color:tone.inkMuted,marginTop:7,lineHeight:1.5}}>Your answer unlocks the right tools, services, and support.</div>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'0 18px',display:'flex',flexDirection:'column',gap:9}}>
        {STAGES.map(stage=>{
          const active=sel===stage.id;
          return(
            <button key={stage.id} onClick={()=>setSel(stage.id)} style={{display:'flex',alignItems:'center',gap:14,padding:'13px 15px',borderRadius:16,border:active?`2px solid ${tone.accent}`:`1.5px solid ${tone.cardBorder}`,background:active?tone.accentSoft:tone.card,cursor:'pointer',textAlign:'left',flexShrink:0}}>
              <div style={{width:38,height:38,borderRadius:12,flexShrink:0,background:active?tone.accent:tone.cardBorder,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,color:active?(dark?'#0a0b10':'#fff'):tone.inkMuted,fontWeight:700}}>{stage.icon}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:"'Manrope',sans-serif",fontSize:13,fontWeight:600,color:active?tone.accent:tone.ink}}>{stage.hed}</div>
                <div style={{fontFamily:"'Manrope',sans-serif",fontSize:11,color:tone.inkMuted,marginTop:2}}>{stage.sub}</div>
              </div>
              {active&&<div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7.5,letterSpacing:'0.12em',textTransform:'uppercase',color:tone.accent,whiteSpace:'nowrap',background:tone.accentSoft,padding:'3px 6px',borderRadius:8}}>{stage.pts}</div>}
            </button>
          );
        })}
      </div>
      <div style={{padding:'12px 18px 0'}}>
        <button style={{width:'100%',height:72,borderRadius:16,background:tone.accent,color:dark?'#0a0b10':'#fff',border:'none',cursor:'pointer',fontFamily:"'Manrope',sans-serif",fontSize:14,fontWeight:700}}>Begin my journey →</button>
      </div>
    </div>
  );
}

const DESK={
  exploring:{greeting:'Start exploring Panama',sub:'No commitment — just clarity.',passport:{tier:'explorer',points:4,nextAt:25},mode:'practical',services:[{icon:'📋',label:'Residency Guide',tag:'Gestiones',note:'Free'},{icon:'💰',label:'Cost of Living',tag:'Research',note:'Calculator'},{icon:'🗺️',label:'Area Explorer',tag:'Guides',note:'14 zones'},{icon:'📞',label:'Book Intro Call',tag:'Concierge',note:'30 min'}],tasks:[]},
  arriving: {greeting:'Arrival in 4 days',sub:'Everything ready for landing day.',passport:{tier:'explorer',points:16,nextAt:25},mode:'practical',services:[{icon:'✈️',label:'Airport Pickup',tag:'Transporte',note:'$45'},{icon:'📦',label:'Moving Help',tag:'Mandados',note:'Container'},{icon:'🏠',label:'Find Housing',tag:'Research',note:'Casco / Altos'},{icon:'📱',label:'SIM + Banking',tag:'Setup',note:'Day 1 kit'}],tasks:[{label:'Carlos — airport pickup confirmed',status:'Confirmed ✓',dot:'#68B86A'},{label:'Casco apartment — keys ready',status:'Tomorrow',dot:'#5BA3C8'}]},
  settling:  {greeting:'Week 3 in Panama',sub:'Making it home, one task at a time.',passport:{tier:'settler',points:38,nextAt:60},mode:'family',services:[{icon:'🏦',label:'Open Bank Account',tag:'Gestiones',note:'Banco Nac.'},{icon:'👩‍🍳',label:'Hire a Cook',tag:'Staff',note:'From $30/day'},{icon:'🧹',label:'Find a Cleaner',tag:'Staff',note:'Vetted ✓'},{icon:'🎓',label:'School Search',tag:'Family',note:'Ages 4–16'},{icon:'📝',label:'Residency Gestor',tag:'Gestiones',note:'Stamp +8'},{icon:'🔧',label:'Fix & Repair',tag:'Fixes',note:'On call'}],tasks:[{label:'Residency application — submitted',status:'Processing',dot:'#68B86A'},{label:"King's College tour — Friday 9 AM",status:'Confirmed',dot:'#5BA3C8'}]},
  living:    {greeting:'Good morning, David',sub:'3 updates on your desk.',passport:{tier:'resident',points:82,nextAt:100},mode:'practical',services:[{icon:'🏃',label:'Run a Mandado',tag:'Mandados',note:'From $8'},{icon:'👩‍🍳',label:'María — Cook',tag:'My Team',note:'Thu + Fri'},{icon:'🌙',label:'VIP Night',tag:'Luxury',note:'Book table'},{icon:'🚗',label:'Private Driver',tag:'Transporte',note:'$20/hr'},{icon:'📊',label:'Tax Filing',tag:'Gestiones',note:'Mar 31'},{icon:'🤝',label:'Community',tag:'Network',note:'28 members'}],tasks:[{label:'Pool maintenance — tomorrow 8 AM',status:'Scheduled',dot:'#5BA3C8'},{label:'Ricardo — tax draft ready to review',status:'Action',dot:'#C6553A'}]},
  thriving:  {greeting:'Portfolio · May 2026',sub:'Your Panama is an asset now.',passport:{tier:'legend',points:168,nextAt:999},mode:'business',services:[{icon:'🏢',label:'Property Deal',tag:'Investment',note:'Casco unit'},{icon:'📈',label:'Tax Strategy',tag:'Business',note:'Territorial'},{icon:'🌟',label:'Citizenship Track',tag:'Gestiones',note:'Year 3 of 5'},{icon:'🍽️',label:'Private Dining',tag:'Luxury',note:'Invite only'},{icon:'🤝',label:'Insider Network',tag:'Community',note:'12 members'},{icon:'📝',label:'Refer a Friend',tag:'Referral',note:'+8 pts'}],tasks:[{label:'Casco closing — Thursday',status:'This week',dot:'#d4a840'},{label:'Citizenship renewal — October',status:'Upcoming',dot:'#9B70D8'}]},
};

function ServiceCard({svc,tone}){
  return(
    <div style={{minWidth:140,padding:'14px 14px 12px',borderRadius:16,flexShrink:0,background:tone.card,border:`1px solid ${tone.cardBorder}`,display:'flex',flexDirection:'column',gap:8,cursor:'pointer'}}>
      <span style={{fontSize:24}}>{svc.icon}</span>
      <div>
        <div style={{fontFamily:"'Manrope',sans-serif",fontSize:12,fontWeight:600,color:tone.ink,lineHeight:1.25}}>{svc.label}</div>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:'0.12em',textTransform:'uppercase',color:tone.inkMuted,marginTop:3}}>{svc.tag}</div>
      </div>
      <div style={{fontFamily:"'Manrope',sans-serif",fontSize:11,fontWeight:600,color:tone.accent}}>{svc.note}</div>
    </div>
  );
}

function ScreenDesk({tone}){
  const d=DESK[tone.id]||DESK.exploring;
  const [mode,setMode]=useState(d.mode);
  return(
    <div style={{width:'100%',height:'100%',background:tone.bg,display:'flex',flexDirection:'column',position:'relative',overflow:'hidden'}}>
      <div style={{paddingTop:52}}><PassportBar points={d.passport.points} nextAt={d.passport.nextAt} tier={d.passport.tier} tone={tone}/></div>
      <div style={{padding:'14px 20px 4px'}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:300,color:tone.ink,letterSpacing:'-0.015em',lineHeight:1.1}}>{d.greeting}</div>
        <div style={{fontFamily:"'Manrope',sans-serif",fontSize:11.5,color:tone.inkMuted,marginTop:4}}>{d.sub}</div>
      </div>
      {d.tasks.length>0&&<div style={{padding:'10px 20px 0'}}>{d.tasks.map((t,i)=>(
        <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 13px',marginBottom:6,borderRadius:12,background:tone.card,border:`1px solid ${tone.cardBorder}`}}>
          <div style={{width:8,height:8,borderRadius:'50%',background:t.dot,flexShrink:0}}/>
          <div style={{flex:1,fontFamily:"'Manrope',sans-serif",fontSize:11.5,color:tone.ink,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{t.label}</div>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8.5,color:tone.inkMuted,letterSpacing:'0.06em',flexShrink:0}}>{t.status}</span>
        </div>
      ))}</div>}
      <div style={{padding:'14px 20px 10px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8.5,letterSpacing:'0.2em',textTransform:'uppercase',color:tone.inkMuted}}>Services</span>
        <span style={{fontFamily:"'Manrope',sans-serif",fontSize:11,color:tone.accent}}>See all →</span>
      </div>
      <div style={{display:'flex',gap:10,overflowX:'auto',padding:'0 20px',scrollbarWidth:'none'}}>
        {d.services.map((svc,i)=><ServiceCard key={i} svc={svc} tone={tone}/>)}
      </div>
      <div style={{flex:1}}/>
      <VoiceOrb tone={tone}/>
      <ModeTabs active={mode} tone={tone} onSwitch={setMode}/>
    </div>
  );
}

const CHAT={
  exploring:{name:'María',role:'Panama Concierge',msgs:[{from:'user',text:'Hola! I\'m thinking about moving to Panama. Where do I start?'},{from:'agent',text:'Welcome. You\'re in the right place. Panama has four main residency pathways — the most popular for US and EU citizens is the Friendly Nations Visa. May I ask about your nationality and rough timeline?'},{from:'user',text:'I\'m American. Open timeline — maybe 12–18 months.'},{from:'agent',text:'Perfect. With a US passport and 18 months you have every option open. I\'d suggest a 30-min discovery call — no commitment, just clarity. Sending you a calendar link now.'}]},
  arriving: {name:'María',role:'Panama Concierge',msgs:[{from:'user',text:'I land Tuesday at 4 PM at Tocumen. Is Carlos confirmed for pickup?'},{from:'agent',text:'Yes! Carlos will be at arrivals with your name on a sign. Straight to the Casco apartment — keys are ready. Building code: 4821.'},{from:'user',text:'Awesome. What about a SIM card?'},{from:'agent',text:'Claro kiosk right after customs. $15 tourist plan — 10 GB, works everywhere. Or I can have one waiting at the apartment. Just say the word.'}]},
  settling:  {name:'María',role:'Panama Concierge',msgs:[{from:'user',text:'The lease says I need apostilled docs. Is that it, or do I need Spanish translations too?'},{from:'agent',text:'For the lease: apostilled originals + notarized Spanish translation of each. I have a great translator — 24-hour turnaround, $80/doc. Send it to her today?'},{from:'user',text:'Yes please. And the King\'s College tour — still Friday 9 AM?'},{from:'agent',text:'Confirmed. King\'s at 9, Oxford International at 11. I\'ll send addresses tonight. Bring apostilled birth certificates for both kids.'}]},
  living:    {name:'María',role:'Panama Concierge',msgs:[{from:'agent',text:'Hey David — pool being serviced tomorrow 8–11 AM. Building access normal, just no pool.'},{from:'user',text:'Thanks. Any news on the tax filing with Ricardo?'},{from:'agent',text:'Ricardo sent the draft yesterday — looks clean. Territorial income system means your US income is untouched. He needs 2025 Panama bank statements by the 28th.'},{from:'user',text:'I\'ll get those to him. See you at the expat dinner Saturday?'},{from:'agent',text:'🌴 Wouldn\'t miss it. Miramar rooftop at 7. See you there!'}]},
  thriving:  {name:'María',role:'Panama Concierge',msgs:[{from:'user',text:'Closing on the Casco unit Thursday. Anything to double-check before signing?'},{from:'agent',text:'Two things: confirm the HOA transfer doc is ready (administrator: Fernanda Cruz), and make sure the notary has the original Escritura. Attorney Patricia should have both.'},{from:'user',text:'On it. And the citizenship calendar — where are we exactly?'},{from:'agent',text:'Year 3, month 4. On track for 2028. Annual renewal flagged for October — I\'ll remind you in September so we\'re never late.'}]},
};

function MeridianCanvas({tone,width=234,height=72}){
  const ref=useRef(null);
  useEffect(()=>{
    if(!ref.current||!window.WebGLExploring)return;
    return window.WebGLExploring.createMeridian(ref.current,{color:tone.orb||tone.accent,width,height});
  },[tone.id]);
  return <div ref={ref} style={{width,height}}/>;
}

function ScreenChat({tone}){
  const d=CHAT[tone.id]||CHAT.exploring;
  const dark=['exploring','settling','thriving'].includes(tone.id);
  return(
    <div style={{width:'100%',height:'100%',background:tone.bg,boxSizing:'border-box',display:'flex',flexDirection:'column'}}>
      <div style={{padding:'52px 18px 14px',borderBottom:`1px solid ${tone.cardBorder}`,display:'flex',alignItems:'center',gap:12}}>
        <div style={{width:40,height:40,borderRadius:'50%',flexShrink:0,background:`linear-gradient(135deg,${tone.accent},${tone.orb||tone.accent})`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:500,color:dark?'#0a0b10':'#fff'}}>M</div>
        <div>
          <div style={{fontFamily:"'Manrope',sans-serif",fontSize:14,fontWeight:600,color:tone.ink}}>{d.name}</div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8.5,letterSpacing:'0.18em',textTransform:'uppercase',color:tone.accent,marginTop:1}}>{d.role} · Panama OS</div>
        </div>
        <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:14}}>
          <span style={{color:tone.inkMuted,fontSize:17,cursor:'pointer'}}>📞</span>
          <span style={{color:tone.inkMuted,fontSize:17,cursor:'pointer'}}>⋯</span>
        </div>
      </div>
      {tone.id==='exploring'&&<div style={{display:'flex',justifyContent:'center',alignItems:'center',padding:'10px 0 6px',background:tone.bgGlass,borderBottom:`1px solid ${tone.cardBorder}`}}><MeridianCanvas tone={tone} width={234} height={72}/></div>}
      <div style={{flex:1,overflowY:'auto',padding:'14px 14px 8px',display:'flex',flexDirection:'column',gap:10}}>
        {d.msgs.map((msg,i)=>{
          const user=msg.from==='user';
          return(<div key={i} style={{display:'flex',justifyContent:user?'flex-end':'flex-start'}}>
            <div style={{maxWidth:'82%',padding:'10px 13px',borderRadius:user?'18px 18px 5px 18px':'18px 18px 18px 5px',background:user?tone.accent:tone.card,border:user?'none':`1px solid ${tone.cardBorder}`,color:user?(dark?'#0a0b10':'#fff'):tone.ink,fontFamily:"'Manrope',sans-serif",fontSize:12,lineHeight:1.52}}>{msg.text}</div>
          </div>);
        })}
      </div>
      <div style={{padding:'4px 14px 6px',display:'flex',gap:7}}>
        {['Visa info','Cost guide','Book a call'].map(chip=>(
          <button key={chip} style={{padding:'6px 10px',borderRadius:20,background:tone.accentSoft,border:`1px solid ${tone.accent}44`,fontFamily:"'Manrope',sans-serif",fontSize:10,fontWeight:500,color:tone.accent,cursor:'pointer',flexShrink:0}}>{chip}</button>
        ))}
      </div>
      <div style={{padding:'8px 14px 22px',display:'flex',gap:10,alignItems:'center'}}>
        <div style={{width:38,height:38,borderRadius:'50%',background:`${tone.orb||tone.accent}22`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,cursor:'pointer',flexShrink:0}}>🎙️</div>
        <div style={{flex:1,padding:'10px 14px',borderRadius:100,background:tone.card,border:`1px solid ${tone.cardBorder}`,fontFamily:"'Manrope',sans-serif",fontSize:12,color:tone.inkMuted}}>Message…</div>
        <div style={{width:38,height:38,borderRadius:'50%',background:tone.accent,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,color:dark?'#0a0b10':'#fff',cursor:'pointer',flexShrink:0}}>↑</div>
      </div>
    </div>
  );
}

const PRICING_TIERS=[
  {id:'explorer',name:'Explorer',       price:'Free',   period:'',    features:['Residency guides','Cost calculator','Area maps','1 intro call']},
  {id:'arriving', name:'Arrival Pack',   price:'$1,200',period:'/mo', features:['Airport pickup','Temp housing','SIM + banking setup','Daily check-ins']},
  {id:'settling', name:'Settlement',     price:'$800',  period:'/mo', features:['Residency filing','Lease negotiation','School search','Domestic staff hire']},
  {id:'living',   name:'Living Retainer',price:'$350',  period:'/mo', features:['Tax filings','Annual renewals','On-call mandados','Priority matching']},
  {id:'thriving', name:'Mastery',        price:'$500',  period:'/mo', features:['Investment advisory','Citizenship track','Elite network','White-glove events']},
];
const PRICING_ACTIVE={exploring:'explorer',arriving:'arriving',settling:'settling',living:'living',thriving:'thriving'};

function ScreenPricing({tone}){
  const activeId=PRICING_ACTIVE[tone.id]||'explorer';
  const [sel,setSel]=useState(activeId);
  const dark=['exploring','settling','thriving'].includes(tone.id);
  const selTier=PRICING_TIERS.find(t=>t.id===sel)||PRICING_TIERS[0];
  return(
    <div style={{width:'100%',height:'100%',background:tone.bg,boxSizing:'border-box',display:'flex',flexDirection:'column',padding:'60px 0 16px',overflow:'hidden'}}>
      <div style={{padding:'0 22px',marginBottom:18}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8.5,letterSpacing:'0.24em',textTransform:'uppercase',color:tone.accent,marginBottom:8}}>Concierge · Pricing</div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:300,color:tone.ink,lineHeight:1.1,letterSpacing:'-0.015em'}}>One journey.<br/>Five phases of support.</div>
        <div style={{fontFamily:"'Manrope',sans-serif",fontSize:11.5,color:tone.inkMuted,marginTop:7}}>Pay only for the help you need, when you need it.</div>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'0 18px',display:'flex',flexDirection:'column',gap:8}}>
        {PRICING_TIERS.map(tier=>{
          const active=sel===tier.id, curr=tier.id===activeId;
          return(
            <div key={tier.id} onClick={()=>setSel(tier.id)} style={{padding:active?'14px 15px':'11px 15px',borderRadius:16,cursor:'pointer',border:active?`2px solid ${tone.accent}`:`1px solid ${tone.cardBorder}`,background:active?tone.accentSoft:tone.card,opacity:(!active&&!curr)?0.65:1,transition:'all 0.15s'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
                <div>
                  <span style={{fontFamily:"'Manrope',sans-serif",fontSize:active?13:12,fontWeight:active?700:500,color:active?tone.accent:tone.ink}}>{tier.name}</span>
                  {curr&&<span style={{marginLeft:6,fontFamily:"'JetBrains Mono',monospace",fontSize:7.5,letterSpacing:'0.12em',textTransform:'uppercase',background:tone.accent,color:dark?'#0a0b10':'#fff',padding:'2px 6px',borderRadius:8}}>Your stage</span>}
                </div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:active?22:17,fontWeight:300,color:active?tone.ink:tone.inkMuted,letterSpacing:'-0.02em',flexShrink:0}}>
                  {tier.price}<span style={{fontSize:'0.55em',fontFamily:"'Manrope',sans-serif",fontWeight:400}}>{tier.period}</span>
                </div>
              </div>
              {active&&<div style={{marginTop:10,display:'flex',flexDirection:'column',gap:4}}>
                {tier.features.map((f,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:8,fontFamily:"'Manrope',sans-serif",fontSize:11.5,color:tone.inkMuted}}>
                    <span style={{color:tone.accent,fontSize:10}}>✓</span>{f}
                  </div>
                ))}
              </div>}
            </div>
          );
        })}
      </div>
      <div style={{padding:'12px 18px 0'}}>
        <button style={{width:'100%',height:72,borderRadius:16,background:tone.accent,color:dark?'#0a0b10':'#fff',border:'none',cursor:'pointer',fontFamily:"'Manrope',sans-serif",fontSize:14,fontWeight:700}}>Start with {selTier.name} →</button>
      </div>
    </div>
  );
}

window.ConciergeScreens={ScreenWelcome,ScreenStagePicker,ScreenDesk,ScreenChat,ScreenPricing};
}());
