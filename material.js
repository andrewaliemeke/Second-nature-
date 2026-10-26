/* Second Nature: particles as a shared, accessible visual material. */
(function () {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const targets = ['mode-title','intro-phrase','sheet-title'];
  const palette = [[222,195,154],[185,215,208],[183,190,228]];
  let activeMode = 0;
  const timers = new WeakMap();
  const layers = new WeakMap();
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function random(seed){const s = Math.sin(seed*127.1+311.7)*43758.5453;return s-Math.floor(s);}
  function color(){return palette[activeMode];}
  function schedule(el){
    if(reduced.matches)return;
    cancelAnimationFrame(timers.get(el));
    timers.set(el,requestAnimationFrame(()=>requestAnimationFrame(()=>form(el))));
  }
  function wrapLines(text,measure,width){
    const raw=text.split(/\n/),out=[];
    for(const rawLine of raw){
      let line='';
      for(const word of rawLine.trim().split(/\s+/)){
        const next=line?line+' '+word:word;
        if(line&&measure.measureText(next).width>width){out.push(line);line=word;}else line=next;
      }
      if(line)out.push(line);
    }
    return out.length?out:[''];
  }
  function form(el){
    if(!el.isConnected || el.getClientRects().length===0)return;
    const text=el.innerText.replace(/\u00a0/g,' ').trim();
    if(!text)return;
    const box=el.getBoundingClientRect(),w=Math.round(box.width),h=Math.round(box.height);
    if(w<35||h<20)return;
    const previous=layers.get(el);
    if(previous){cancelAnimationFrame(previous.raf);previous.canvas.remove();el.classList.remove('material-forming');}
    const computed=getComputedStyle(el),fontSize=parseFloat(computed.fontSize),fontWeight=computed.fontWeight, fontFamily=computed.fontFamily;
    const lineHeight=isNaN(parseFloat(computed.lineHeight))?fontSize*1.15:parseFloat(computed.lineHeight);
    const drawing=document.createElement('canvas');
    drawing.width=w;drawing.height=h;
    const dc=drawing.getContext('2d',{willReadFrequently:true});
    if(!dc)return;
    dc.clearRect(0,0,w,h);
    dc.fillStyle='#ffffff'; dc.font=fontWeight+' '+fontSize+'px '+fontFamily;
    const lines=wrapLines(text,dc,w-8),blockHeight=lines.length*lineHeight;
    const align=el.id==='sheet-title'?'left':'center';
    dc.textAlign=align;dc.textBaseline='middle';
    const firstY=(h-blockHeight)/2+lineHeight/2;
    for(let n=0;n<lines.length;n++)dc.fillText(lines[n],align==='center'?w/2:0,firstY+n*lineHeight,w-4);
    const pixels=dc.getImageData(0,0,w,h).data,step=w>450?3:2.65,points=[];
    for(let y=1;y<h-1;y+=step)for(let x=1;x<w-1;x+=step){
      if(pixels[4*(Math.floor(y)*w+Math.floor(x))+3]>95){
        const id=points.length+1;
        points.push({x,y,seed:random(id+Math.floor(x)*.13),phase:random(id+Math.floor(y)*.17)});
      }
    }
    if(!points.length)return;
    const ratio=Math.min(1.8,devicePixelRatio||1);
    const canvas=document.createElement('canvas');
    canvas.className='type-particles';canvas.setAttribute('aria-hidden','true');
    canvas.width=Math.ceil(w*ratio);canvas.height=Math.ceil(h*ratio);
    canvas.style.width=w+'px';canvas.style.height=h+'px';
    el.append(canvas);el.classList.add('material-forming');
    const ctx=canvas.getContext('2d');ctx.setTransform(ratio,0,0,ratio,0,0);
    const start=performance.now(),duration=960;
    const controller={canvas,raf:0};layers.set(el,controller);
    const [R,G,B]=color();
    function frame(now){
      if(!canvas.isConnected)return;
      const elapsed=now-start;
      ctx.clearRect(0,0,w,h);
      const q=clamp(elapsed/duration,0,1),ease=1-Math.pow(1-q,3.1);
      for(const p of points){
        const delay=p.phase*.23;
        const progress=clamp((q-delay)/(1-delay),0,1);
        if(progress<=0)continue;
        const move=Math.pow(1-progress,2);
        const dx=(p.seed-.5)*95,dy=(p.phase-.5)*68;
        const x=p.x+dx*move,y=p.y+dy*move;
        const alpha=clamp(progress*2.4,0,1)*(1-progress*.17);
        ctx.fillStyle='rgba('+R+','+G+','+B+','+alpha.toFixed(2)+')';
        ctx.fillRect(x,y,progress>.72?1.15:1.5,progress>.72?1.15:1.5);
      }
      if(q<1){controller.raf=requestAnimationFrame(frame)}
      else {
        el.classList.remove('material-forming');
        canvas.animate([{opacity:1},{opacity:0}],{duration:260,easing:'ease-out'}).finished.catch(()=>{}).finally(()=>canvas.remove());
      }
    }
    controller.raf=requestAnimationFrame(frame);
  }
  function shimmer(selector){
    const el=document.querySelector(selector);if(!el)return;
    el.classList.remove('text-reforming');void el.offsetWidth;el.classList.add('text-reforming');
  }
  for(const id of targets){
    const el=document.getElementById(id);if(!el)continue;
    const observer=new MutationObserver(changes=>{
      if(changes.every(change=>{
        const changed=[...change.addedNodes,...change.removedNodes];
        return changed.length && changed.every(node=>node.nodeType===1&&node.classList.contains('type-particles'));
      }))return;
      schedule(el);
      if(id==='mode-title'){
        shimmer('#mode-copy');shimmer('#mode-kicker');
        shimmer('#action-label');shimmer('#mode-extra');
      }
    });
    observer.observe(el,{subtree:true,childList:true,characterData:true});
    if(id!=='sheet-title')schedule(el);
  }
  function setMode(mode){
    activeMode=clamp(mode,0,2);
    document.body.dataset.snMode=String(activeMode);
  }
  function refreshMode(){
    const nodes=[...document.querySelectorAll('.mode-tab')];
    const n=nodes.findIndex(node=>node.classList.contains('active'));
    if(n>=0)setMode(n);
  }
  document.querySelectorAll('.mode-tab').forEach((tab,n)=>{
    tab.addEventListener('click',()=>setMode(n));
    new MutationObserver(refreshMode).observe(tab,{attributes:true,attributeFilter:['class']});
  });
  document.addEventListener('pointerdown',event=>{
    const button=event.target.closest('button');
    if(button){button.classList.remove('particle-pressed');void button.offsetWidth;button.classList.add('particle-pressed');}
    const field=event.target.closest('#field-touch');
    if(field && window.SecondNatureParticles?.glide)window.SecondNatureParticles.glide(event.clientX,event.clientY);
  },{passive:true});
  document.addEventListener('pointermove',event=>{
    if(event.target.closest('#field-touch')&&window.SecondNatureParticles?.glide){
      window.SecondNatureParticles.glide(event.clientX,event.clientY);
    }
  },{passive:true});
  document.querySelector('#field-touch')?.addEventListener('pointerleave',()=>{
    window.SecondNatureParticles?.glide?.(-9999,-9999);
  },{passive:true});
  reduced.addEventListener?.('change',()=>{if(reduced.matches)document.querySelectorAll('.type-particles').forEach(x=>x.remove());});
  refreshMode();
})();