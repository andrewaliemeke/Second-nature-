/* Second Nature particle-native visual system. Canvas artwork; semantic HTML remains accessible. */
(function () {
  'use strict';
  const canvas = document.getElementById('particle-field');
  const ctx = canvas.getContext('2d', { alpha: false });
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const settings = { mode: 0, scene: 'intro', phase: 0, visible: true };
  const count = Math.min(2300, Math.max(950, Math.floor(window.innerWidth * 4.2)));
  // A single, persistent field: depth changes continuously rather than emitting tap ripples.
  let focus=.48,focusTarget=.48,baseFocus=.48,ambientShift=0,shiftTarget=0;
  let W=390,H=844,DPR=1,tick=0,last=0,raf=0,nextTargets=[],particles=[];
  let focusPoint={x:-9999,y:-9999,strength:0},lastIntent=0,scrollDepth=0;
  let transition=0;
  const palette = [[205,175,132],[166,204,198],[171,180,214]];
  function hash(i, seed) { let n = (i * 374761393 + seed * 668265263) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967295; }
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function resize() { W = Math.max(200, window.innerWidth); H = Math.max(300, window.innerHeight); DPR = Math.min(2, window.devicePixelRatio || 1); canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR); canvas.style.width = W + 'px'; canvas.style.height = H + 'px'; ctx.setTransform(DPR,0,0,DPR,0,0); createTargets(); }
  function mapPos(x,y){ const radius = Math.min(W*.475,H*.34,330); const cx=W/2, cy=H*(settings.scene==='intro'?.48:.395); return {x:cx+x*radius,y:cy+y*radius}; }
  function buildModePoint(i,mode) {
    const r = hash(i,1), a = hash(i,2) * Math.PI * 2, band = Math.floor(hash(i,3)*15), ring = .13 + band*.057 + (hash(i,31)-.5)*.007;
    const wav = tick * .008;
    if(mode === 0){ // concentric resonances: alternating elliptical ripples
      const rhythmic = .012*Math.sin(a*10 + ring*12);
      return {x:Math.cos(a)*(ring+rhythmic)*.95,y:Math.sin(a)*(ring+rhythmic)*.67};
    }
    if(mode === 1){ // doubled interferometric lens; perspective reorients
      const side = i%2 ? 1:-1, t=(hash(i,4)-.5)*2.1, rr=.15+Math.floor(hash(i,5)*10)*.076+(hash(i,32)-.5)*.01;
      const angle = t*Math.PI;
      const x=side*.19 + Math.cos(angle)*rr*.68;
      const y=Math.sin(angle)*rr*.65 + Math.sin(x*7)*.07;
      return {x,y};
    }
    // Discover: braided, expanding interference waves / possibilities
    const branch=i%3, theta=a*1.2+branch*Math.PI*2/3;
    const k=.18+Math.floor(hash(i,8)*13)*.058+(hash(i,33)-.5)*.01;
    return {x:Math.cos(theta)*k*.87+Math.sin(theta*5)*.05*k,y:Math.sin(theta)*k*.7+Math.cos(theta*5)*.07*k};
  }
  function buildIntroPoint(i){
    const a=hash(i,2)*Math.PI*2, rr=.18+Math.floor(hash(i,3)*13)*.055+(hash(i,34)-.5)*.008;
    return {x:Math.cos(a)*(rr+.04*Math.sin(a*6))*1.02,y:Math.sin(a)*(rr+.04*Math.sin(a*6))*.77};
  }
  function createTargets(){nextTargets=[];for(let i=0;i<count;i++){const norm=settings.scene==='intro'?buildIntroPoint(i):buildModePoint(i,settings.mode);nextTargets.push(mapPos(norm.x,norm.y)); if(!particles[i]){const angle=hash(i,13)*6.28; particles[i]={x:W/2+Math.cos(angle)*Math.min(W,H)*hash(i,15),y:H/2+Math.sin(angle)*Math.min(W,H)*hash(i,16),vx:0,vy:0,tw:hash(i,20)*6.283,size:.35+hash(i,22)*1.15,seed:hash(i,23)}}}}
  function setMode(mode){
    settings.scene='mode';settings.mode=mode;transition=1;
    baseFocus=[.45,.61,.68][mode];focusTarget=baseFocus;
    scrollDepth=0;shiftTarget=0;createTargets();
    if(reduce.matches)render(performance.now());
  }
  function setIntro(){
    settings.scene='intro';transition=1;baseFocus=.51;focusTarget=baseFocus;
    scrollDepth=0;shiftTarget=0;createTargets();
    if(reduce.matches)render(performance.now());
  }
  function setFocus(step){
    // Practice steps and opened sheets refocus the *existing* particle structure.
    focusTarget=clamp(baseFocus+(step||0)*.085,.24,.86);
    shiftTarget=clamp((step||0)*.08,-.3,.34);
    lastIntent=performance.now();transition=.55;
    if(reduce.matches)render(performance.now());
  }
  function react(x,y){
    const rect=canvas.getBoundingClientRect();
    focusPoint.x=typeof x==='number'?x:rect.width/2;
    focusPoint.y=typeof y==='number'?y:rect.height*.4;
    focusPoint.strength=.78;
    focusTarget=clamp(baseFocus+.12,.18,.86);
    lastIntent=performance.now();
    // Deliberately no ring, shockwave, or radial particle push.
    if(reduce.matches)render(performance.now());
  }
  function onScroll(progress){
    scrollDepth=clamp(progress,0,1);
    focusTarget=clamp(baseFocus+(scrollDepth-.4)*.22,.2,.87);
    shiftTarget=(scrollDepth-.5)*.23;
    lastIntent=performance.now();
    if(reduce.matches)render(performance.now());
  }
  function drawBackground(color){ctx.fillStyle='#080a0d';ctx.fillRect(0,0,W,H);const cx=W/2,cy=H*.41, r=Math.max(W,H)*.67;const g=ctx.createRadialGradient(cx,cy,10,cx,cy,r);g.addColorStop(0,'rgba('+color.join(',')+',0.055)');g.addColorStop(.42,'rgba('+color.join(',')+',0.014)');g.addColorStop(1,'rgba(8,10,13,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);}
  function render(time){const dt=Math.min(2.3,Math.max(.2,(time-last)/16.6||1));last=time;tick+=dt;const rgb=palette[settings.scene==='intro'?0:settings.mode];drawBackground(rgb);
    // Sparse remote particles give spatial depth without becoming decorative confetti.
    const t=tick*.008;
    // Far-field particles remain present even while the main formation is soft or obscured by a sheet.
    for(let i=0;i<155;i++){
      const hx=hash(i,39),hy=hash(i,40),phase=hash(i,44)*6.283;
      const shimmer=.68+.32*Math.sin(t*.44+phase);
      ctx.fillStyle='rgba(207,211,211,'+((.02+.052*hash(i,43))*shimmer).toFixed(3)+')';
      const x=hx*W+Math.sin(t*.3+phase)*2.5,y=hy*H+Math.cos(t*.25+phase)*2;
      ctx.fillRect(x,y,.6,.6);
    }
    // At rest the focal plane quietly breathes. Gestures temporarily steer it.
    if(performance.now()-lastIntent>1900){
      focusTarget+=(baseFocus+.085*Math.sin(t*.21)-focusTarget)*.014;
      shiftTarget*=.985;
    }
    focus+=(focusTarget-focus)*.028;
    ambientShift+=(shiftTarget-ambientShift)*.024;
    focusPoint.strength*=reduce.matches?0:.977;
    const mobile=W<600,spring=reduce.matches?1:.025*dt,damp=reduce.matches?0:.84;
    ctx.save();ctx.globalCompositeOperation='screen';
    for(let i=0;i<count;i++){
      const p=particles[i], goal=nextTargets[i];if(!goal)continue;
      let gx=goal.x,gy=goal.y;
      if(!reduce.matches){
        // The original concentric / interference geometry stays intact.
        // Motion is a slow shared drift, never an expanding circle from touch.
        const wave=Math.sin(t*1.28+p.tw+i*.013);
        const factor=.68+Math.sin(t*.19+i*.02)*.14;
        gx+=wave*1.55*factor+ambientShift*8;
        gy+=Math.cos(t*.83+i*.015)*1.28+ambientShift*11;
      }
      if(reduce.matches){p.x=gx;p.y=gy;}else{p.vx=(p.vx+(gx-p.x)*spring)*damp;p.vy=(p.vy+(gy-p.y)*spring)*damp;p.x+=p.vx*dt;p.y+=p.vy*dt;}
      const seed=p.seed,proximity=Math.abs(seed-focus);
      const dx=p.x-focusPoint.x,dy=p.y-focusPoint.y;
      const nearby=focusPoint.strength*Math.max(0,1-Math.hypot(dx,dy)/170);
      const clarity=clamp(1-proximity*1.05+nearby*.35,.2,1);
      const soft=clamp(proximity*1.2-nearby*.24,0,1);
      const intensity=clamp((.24+(1-seed)*.55+Math.sin(t*1.4+p.tw)*.075)*clarity,.055,.84);
      const sz=p.size*(mobile?.86:1)*(seed>.92?1.35:1);
      // Only a few out-of-focus particles get a soft halo; crisp grains remain precise.
      if(!reduce.matches&&soft>.4&&i%17===0){
        ctx.fillStyle='rgba('+rgb[0]+','+rgb[1]+','+rgb[2]+','+(intensity*.13).toFixed(3)+')';
        ctx.beginPath();ctx.arc(p.x,p.y,1.9+soft*1.6,0,Math.PI*2);ctx.fill();
      }
      ctx.fillStyle='rgba('+rgb[0]+','+rgb[1]+','+rgb[2]+','+intensity.toFixed(3)+')';
      ctx.fillRect(p.x,p.y,sz,sz);
    }
    ctx.restore();if(transition>0)transition*=.94;
  }
  function loop(t){if(!settings.visible)return;render(t);if(!reduce.matches)raf=requestAnimationFrame(loop);}
  window.addEventListener('resize',resize,{passive:true});document.addEventListener('visibilitychange',()=>{settings.visible=!document.hidden;if(settings.visible){last=0;cancelAnimationFrame(raf);loop(performance.now());}else cancelAnimationFrame(raf)});
  reduce.addEventListener?.('change',()=>{cancelAnimationFrame(raf);loop(performance.now());});
  resize();loop(performance.now());
  function glide(x,y){
    if(x<0){
      focusPoint.strength*=.3;
      focusTarget=baseFocus;
    }else{
      focusPoint={x,y,strength:.48};
      focusTarget=clamp(baseFocus+(x/W-.5)*.23,.2,.86);
      shiftTarget=clamp((y/H-.4)*.16,-.3,.3);
      lastIntent=performance.now();
    }
    if(reduce.matches)render(performance.now());
  }
  window.SecondNatureParticles={setMode,setIntro,setFocus,react,glide,onScroll,reduced:()=>reduce.matches};
})();
