/* Second Nature particle-native visual system. Canvas artwork; semantic HTML remains accessible. */
(function () {
  'use strict';
  const canvas = document.getElementById('particle-field');
  const ctx = canvas.getContext('2d', { alpha: false });
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const settings = { mode: 0, scene: 'intro', phase: 0, visible: true };
  const count = Math.min(2300, Math.max(950, Math.floor(window.innerWidth * 4.2)));
  let W = 390, H = 844, DPR = 1, tick = 0, last = 0, raf = 0, nextTargets = [], particles = [], transition = 0, focus=.48, focusTarget=.48;
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
  function setMode(mode){settings.scene='mode';settings.mode=mode;transition=1;focusTarget=.56;createTargets();if(reduce.matches)render(performance.now());}
  function setIntro(){settings.scene='intro';transition=1;focusTarget=.48;createTargets();if(reduce.matches)render(performance.now());}
  function setFocus(step){focusTarget=clamp(.43+step*.11,.43,.78);transition=.55;}
  function react(){focusTarget=clamp(focusTarget+.055,.43,.8);if(reduce.matches)render(performance.now());}
  function drawBackground(color){ctx.fillStyle='#080a0d';ctx.fillRect(0,0,W,H);const cx=W/2,cy=H*.41, r=Math.max(W,H)*.67;const g=ctx.createRadialGradient(cx,cy,10,cx,cy,r);g.addColorStop(0,'rgba('+color.join(',')+',0.055)');g.addColorStop(.42,'rgba('+color.join(',')+',0.014)');g.addColorStop(1,'rgba(8,10,13,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);}
  function render(time){const dt=Math.min(2.3,Math.max(.2,(time-last)/16.6||1));last=time;tick+=dt;focus+=(focusTarget-focus)*(reduce.matches?1:.025*dt);const rgb=palette[settings.scene==='intro'?0:settings.mode];drawBackground(rgb);
    // Sparse remote particles give spatial depth without becoming decorative confetti.
    const t=tick*.008;
    for(let i=0;i<115;i++){const hx=hash(i,39),hy=hash(i,40);ctx.fillStyle='rgba(207,211,211,'+(.025+.055*hash(i,43))+')';const x=hx*W+Math.sin(t+i)*1.1,y=hy*H;ctx.fillRect(x,y,.6,.6)}
    const mobile=W<600, spring=reduce.matches?1:.025*dt, damp=reduce.matches?0:.84;
    ctx.save();ctx.globalCompositeOperation='screen';
    for(let i=0;i<count;i++){
      const p=particles[i], goal=nextTargets[i];if(!goal)continue;
      let gx=goal.x,gy=goal.y;
      if(!reduce.matches){const wave=Math.sin(t*2.15 + p.tw + i*.013);const factor=.7+Math.sin(t*.35+i*.02)*.16;gx+=wave*1.9*factor;gy+=Math.cos(t*1.4+i*.015)*1.5;
        // Ambient motion only: no waves, touch displacement or resonance bursts.
      }
      if(reduce.matches){p.x=gx;p.y=gy;}else{p.vx=(p.vx+(gx-p.x)*spring)*damp;p.vy=(p.vy+(gy-p.y)*spring)*damp;p.x+=p.vx*dt;p.y+=p.vy*dt;}
      const seed=p.seed, sharpness=1-Math.abs(seed-focus)*.35, intensity=clamp((.24+(1-seed)*.55+Math.sin(t*2+p.tw)*.09)*sharpness,.12,.86);
      const sz=p.size*(mobile?.86:1)*(seed>.92?1.5:1);
      ctx.fillStyle='rgba('+rgb[0]+','+rgb[1]+','+rgb[2]+','+intensity.toFixed(3)+')';ctx.fillRect(p.x,p.y,sz,sz);
    }
    ctx.restore();if(transition>0)transition*=.94;
  }
  function loop(t){if(!settings.visible)return;render(t);if(!reduce.matches)raf=requestAnimationFrame(loop);}
  window.addEventListener('resize',resize,{passive:true});document.addEventListener('visibilitychange',()=>{settings.visible=!document.hidden;if(settings.visible){last=0;cancelAnimationFrame(raf);loop(performance.now());}else cancelAnimationFrame(raf)});
  reduce.addEventListener?.('change',()=>{cancelAnimationFrame(raf);loop(performance.now());});
  resize();loop(performance.now());
  window.SecondNatureParticles={setMode,setIntro,setFocus,react,reduced:()=>reduce.matches};
})();
