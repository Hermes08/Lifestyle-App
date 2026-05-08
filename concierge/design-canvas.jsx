/**
 * design-canvas.jsx — Infinite pan/zoom canvas
 * Exports: window.DesignCanvas, window.DCSection, window.DCArtboard
 */
(function () {
  'use strict';
  const { useState, useRef, useEffect, useCallback, createContext, useContext } = React;
  const CanvasCtx = createContext(null);
  const GAP_X=44, GAP_Y=88, MIN_SCALE=0.06, MAX_SCALE=2.0, FLY_MS=500;

  function loadVP() { try { return JSON.parse(localStorage.getItem('dc-vp:'+location.pathname)||'null'); } catch { return null; } }
  function saveVP(vp) { try { localStorage.setItem('dc-vp:'+location.pathname, JSON.stringify(vp)); } catch {} }

  function DesignCanvas({ children }) {
    const rootRef=useRef(null), worldRef=useRef(null);
    const vpRef=useRef(loadVP()||{x:80,y:120,scale:0.42});
    const applyTf=useCallback(()=>{
      const {x,y,scale}=vpRef.current;
      if(!worldRef.current)return;
      worldRef.current.style.transform=`translate3d(${x}px,${y}px,0) scale(${scale})`;
      worldRef.current.style.setProperty('--dc-inv-zoom',String(1/scale));
      window.parent.postMessage({type:'__dc_zoom',scale},'*');
    },[]);
    useEffect(()=>{applyTf();},[applyTf]);
    const drag=useRef({active:false,sx:0,sy:0,vx:0,vy:0});
    const onDown=useCallback((e)=>{
      if(e.target.closest('.dc-card')||e.target.closest('.dc-section-header'))return;
      drag.current={active:true,sx:e.clientX,sy:e.clientY,vx:vpRef.current.x,vy:vpRef.current.y};
      e.preventDefault();
    },[]);
    const onMove=useCallback((e)=>{
      if(!drag.current.active)return;
      vpRef.current.x=drag.current.vx+(e.clientX-drag.current.sx);
      vpRef.current.y=drag.current.vy+(e.clientY-drag.current.sy);
      applyTf();
    },[applyTf]);
    const onUp=useCallback(()=>{ if(drag.current.active){drag.current.active=false;saveVP(vpRef.current);} },[]);
    const onWheel=useCallback((e)=>{
      e.preventDefault();
      const rect=rootRef.current.getBoundingClientRect();
      const mx=e.clientX-rect.left, my=e.clientY-rect.top;
      const delta=e.deltaY>0?0.90:1.11;
      const ns=Math.max(MIN_SCALE,Math.min(MAX_SCALE,vpRef.current.scale*delta));
      const ratio=ns/vpRef.current.scale;
      vpRef.current.x=mx-ratio*(mx-vpRef.current.x);
      vpRef.current.y=my-ratio*(my-vpRef.current.y);
      vpRef.current.scale=ns;
      applyTf(); saveVP(vpRef.current);
    },[applyTf]);
    useEffect(()=>{
      const el=rootRef.current; if(!el)return;
      el.addEventListener('wheel',onWheel,{passive:false});
      return()=>el.removeEventListener('wheel',onWheel);
    },[onWheel]);
    const focusArtboard=useCallback((id)=>{
      const card=document.querySelector(`[data-artboard-id="${id}"]`);
      if(!card||!rootRef.current)return;
      const vw=rootRef.current.clientWidth, vh=rootRef.current.clientHeight;
      const r=card.getBoundingClientRect();
      const {x,y,scale}=vpRef.current;
      const wcx=(r.left+r.width/2-x)/scale, wcy=(r.top+r.height/2-y)/scale;
      const cardW=r.width/scale, cardH=r.height/scale;
      const ts=Math.min((vw*0.78)/cardW,(vh*0.78)/cardH,MAX_SCALE);
      const tx=vw/2-wcx*ts, ty=vh/2-wcy*ts;
      if(worldRef.current){
        worldRef.current.style.transition=`transform ${FLY_MS}ms cubic-bezier(0.22,1,0.36,1)`;
        vpRef.current={x:tx,y:ty,scale:ts}; applyTf();
        setTimeout(()=>{ if(worldRef.current)worldRef.current.style.transition=''; saveVP(vpRef.current); },FLY_MS+20);
      }
    },[applyTf]);
    const ctx=useRef({focusArtboard}); ctx.current.focusArtboard=focusArtboard;
    return (
      <CanvasCtx.Provider value={ctx}>
        <div ref={rootRef} className="design-canvas" style={{width:'100vw',height:'100vh',overflow:'hidden',position:'relative',cursor:'grab',userSelect:'none',background:'#0a0b10'}}
          onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}>
          <div style={{position:'absolute',inset:0,pointerEvents:'none',backgroundImage:'radial-gradient(circle,rgba(255,255,255,0.06) 1px,transparent 1px)',backgroundSize:'28px 28px'}}/>
          <div ref={worldRef} style={{position:'absolute',transformOrigin:'0 0',willChange:'transform',padding:'100px 120px 240px'}}>{children}</div>
        </div>
      </CanvasCtx.Provider>
    );
  }

  function DCSection({ id, title, subtitle, children }) {
    return (
      <div className="dc-section" id={`section-${id}`} style={{marginBottom:GAP_Y+'px'}}>
        <div className="dc-section-header" style={{marginBottom:28,paddingBottom:14,borderBottom:'1px solid rgba(255,255,255,0.07)',display:'flex',alignItems:'baseline',gap:18}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:300,color:'#eae6dc',letterSpacing:'-0.015em'}}>{title}</div>
          {subtitle&&<div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8.5,letterSpacing:'0.2em',textTransform:'uppercase',color:'#50556a',lineHeight:1}}>{subtitle}</div>}
        </div>
        <div style={{display:'flex',gap:GAP_X+'px',alignItems:'flex-start'}}>{children}</div>
      </div>
    );
  }

  function DCArtboard({ id, label, width, height, children }) {
    const ctx=useContext(CanvasCtx);
    const handleClick=useCallback((e)=>{ e.stopPropagation(); ctx?.current?.focusArtboard(id); },[id,ctx]);
    return (
      <div className="dc-card" data-artboard-id={id} onClick={handleClick} style={{width:width+'px',flexShrink:0,cursor:'pointer'}}>
        <div style={{width:width+'px',height:height+'px',borderRadius:2,overflow:'hidden',position:'relative',boxShadow:'0 0 0 1px rgba(255,255,255,0.06),0 24px 48px rgba(0,0,0,0.5)',transition:'box-shadow 0.2s'}}>{children}</div>
        {label&&<div style={{marginTop:10,fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:'0.2em',textTransform:'uppercase',color:'#3e4255',textAlign:'center',lineHeight:1.4}}>{label}</div>}
      </div>
    );
  }

  window.DesignCanvas=DesignCanvas; window.DCSection=DCSection; window.DCArtboard=DCArtboard;
}());
