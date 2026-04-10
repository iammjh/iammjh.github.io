'use strict';
// ─── UTILS ────────────────────────────────────────
const q=s=>document.querySelector(s);
const qq=s=>[...document.querySelectorAll(s)];
const pref=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
q('#yr').textContent=new Date().getFullYear();

// ─── CUSTOM CURSOR ────────────────────────────────
(function(){
  if('ontouchstart' in window) return;
  const dot=q('#cd'),ring=q('#cr');
  let mx=0,my=0,rx=0,ry=0;
  document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;});
  (function loop(){
    rx+=(mx-rx)*.15;ry+=(my-ry)*.15;
    dot.style.cssText=`left:${mx}px;top:${my}px`;
    ring.style.cssText=`left:${rx}px;top:${ry}px`;
    requestAnimationFrame(loop);
  })();
  qq('a,button').forEach(el=>{
    el.addEventListener('mouseenter',()=>document.body.classList.add('cur-link'));
    el.addEventListener('mouseleave',()=>document.body.classList.remove('cur-link'));
  });
  qq('input,textarea').forEach(el=>{
    el.addEventListener('mouseenter',()=>document.body.classList.add('cur-hover'));
    el.addEventListener('mouseleave',()=>document.body.classList.remove('cur-hover'));
  });
})();

// ─── NAV + BTT ────────────────────────────────────
const nav=q('#nav'),btt=q('#btt'),footer=q('.footer');
window.addEventListener('scroll',()=>{
  nav.classList.toggle('stuck',scrollY>40);
  
  // Hide BTT when footer is in view to prevent overlap
  const footerInView = footer.getBoundingClientRect().top < window.innerHeight - 80;
  btt.classList.toggle('show', scrollY>500 && !footerInView);
},{passive:true});
btt.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));

// ─── HAMBURGER ────────────────────────────────────
const ham=q('#ham'),mob=q('#mob');
ham.addEventListener('click',()=>{ham.classList.toggle('open');mob.classList.toggle('open');document.body.style.overflow=mob.classList.contains('open')?'hidden':'';});
qq('[data-close]').forEach(el=>el.addEventListener('click',()=>{ham.classList.remove('open');mob.classList.remove('open');document.body.style.overflow='';}));

// ─── HERO ANIMATIONS ──────────────────────────────
if(!pref){
  setTimeout(()=>{
    q('#heroRule')&&q('#heroRule').classList.add('in');
    q('#heroEye') && setTimeout(()=>q('#heroEye').classList.add('in'),200);
    q('#nl1') && setTimeout(()=>q('#nl1').classList.add('in'),300);
    q('#nl2') && setTimeout(()=>q('#nl2').classList.add('in'),450);
    q('#heroDesc') && setTimeout(()=>q('#heroDesc').classList.add('in'),650);
    q('#heroStats') && setTimeout(()=>q('#heroStats').classList.add('in'),750);
    q('#heroCtas') && setTimeout(()=>q('#heroCtas').classList.add('in'),850);
    q('#heroTicker') && setTimeout(()=>q('#heroTicker').classList.add('in'),1000);
  },80);
} else {
  ['heroRule','heroEye','heroDesc','heroStats','heroCtas','heroTicker'].forEach(id=>{const el=q('#'+id);if(el)el.classList.add('in');});
  q('#nl1')&&q('#nl1').classList.add('in');
  q('#nl2')&&q('#nl2').classList.add('in');
}

// ─── SCROLL REVEAL ────────────────────────────────
const ro=new IntersectionObserver(ents=>{
  ents.forEach(e=>{
    if(!e.isIntersecting)return;
    e.target.classList.add('visible');
    ro.unobserve(e.target);
  });
},{threshold:.07,rootMargin:'0px 0px -48px 0px'});
qq('[data-reveal]').forEach(el=>ro.observe(el));

// ─── COUNTER ──────────────────────────────────────
function countUp(el,n){
  const dur=1800,step=16;
  const isYr=n>2000,from=isYr?1990:0;
  let t=0;
  const ti=setInterval(()=>{
    t+=step;
    const v=Math.round(from+(n-from)*Math.min(t/dur,1));
    el.textContent=isYr?v:(n>999?v.toLocaleString():v);
    if(t>=dur){el.textContent=isYr?n:(n>999?n.toLocaleString():n);clearInterval(ti);}
  },step);
}
const co=new IntersectionObserver(ents=>{
  ents.forEach(e=>{
    if(!e.isIntersecting)return;
    countUp(e.target,+e.target.dataset.n);
    co.unobserve(e.target);
  });
},{threshold:.6});
qq('.cnt').forEach(el=>co.observe(el));

// --- SHOWCASE SCROLL DRIVER ---
(function(){
  const isMob = window.matchMedia('(max-width:960px)').matches;
  if(isMob){
    const mobs = qq('#projMobile .pmob-card');
    const mo = new IntersectionObserver(ents=>{
      ents.forEach((e,i)=>{ if(e.isIntersecting){setTimeout(()=>e.target.classList.add('in'),i*90); mo.unobserve(e.target);} });
    },{threshold:.1});
    mobs.forEach(c=>mo.observe(c));
    return;
  }
  const triggers  = qq('#projTriggers .proj-trigger');
  const navItems  = qq('#projNav .proj-nav-item');
  const imgs      = qq('#ppImg img');
  const slots     = qq('#ppInfo .pp-slot');
  const numEl     = q('#ppNum');
  let current     = -1;

  function activate(idx){
    if(idx === current) return;
    current = idx;
    if(numEl) numEl.textContent = String(idx+1).padStart(2,'0');
    imgs.forEach((img,i)=>img.classList.toggle('active', i===idx));
    slots.forEach((s,i)=>s.classList.toggle('active', i===idx));
    navItems.forEach((n,i)=>n.classList.toggle('active', i===idx));
    triggers.forEach((t,i)=>t.classList.toggle('active', i===idx));
  }

  const obs = new IntersectionObserver(ents=>{
    ents.forEach(e=>{
      if(!e.isIntersecting) return;
      activate(+e.target.dataset.pi);
    });
  },{threshold:0.55, rootMargin:'-10% 0px -10% 0px'});
  triggers.forEach(t=>obs.observe(t));

  navItems.forEach(item=>{
    item.addEventListener('click',()=>{
      triggers[+item.dataset.pi].scrollIntoView({behavior:'smooth', block:'center'});
    });
  });
  activate(0);
})();

// --- ACTIVITY EXPAND ---
(function(){
  const btn = q('#actMoreBtn');
  if(!btn) return;
  const extras = qq('.ac-extra');
  let open = false;
  btn.addEventListener('click',()=>{
    open = !open;
    btn.classList.toggle('open', open);
    btn.querySelector('span').textContent = open ? 'Show less' : 'Show more';
    extras.forEach((el,i)=>{
      if(open){
        el.classList.add('revealed');
        void el.offsetWidth;
        setTimeout(()=>el.classList.add('visible'), i*80+30);
      } else {
        el.classList.remove('visible');
        setTimeout(()=>el.classList.remove('revealed'), 400);
      }
    });
  });
})();


// --- SLIDER ---
(function(){
  const slider  = document.getElementById('projSlider');
  const track   = document.getElementById('projTrack');
  const prevBtn = document.getElementById('projPrev');
  const nextBtn = document.getElementById('projNext');
  const countEl = document.getElementById('projCount');
  const dotsEl  = document.getElementById('projDots');
  if(!slider||!track) return;

  const TOTAL   = 12;
  let current   = 0;

  // build dots
  for(let i=0;i<TOTAL;i++){
    const d=document.createElement('span');
    d.className='ps-dot'+(i===0?' on':'');
    d.addEventListener('click',()=>goTo(i));
    dotsEl.appendChild(d);
  }

  function update(){
    // translate track
    track.style.transform = 'translateX('+(-current*100)+'%)';
    // update prev/next buttons
    prevBtn.disabled = current===0;
    nextBtn.disabled = current===TOTAL-1;
    // update count
    countEl.innerHTML = '<strong>'+(current+1)+'</strong> / 12';
    // update dots
    document.querySelectorAll('#projDots .ps-dot').forEach((d,i)=>d.classList.toggle('on',i===current));
  }

  function goTo(n){
    current=Math.max(0,Math.min(TOTAL-1,n));
    update();
  }

  prevBtn.addEventListener('click',()=>goTo(current-1));
  nextBtn.addEventListener('click',()=>goTo(current+1));

  // keyboard
  document.addEventListener('keydown',e=>{
    const rect = slider.closest('section').getBoundingClientRect();
    if(rect.bottom < 0 || rect.top > window.innerHeight) return;
    if(e.key==='ArrowLeft') goTo(current-1);
    if(e.key==='ArrowRight') goTo(current+1);
  });

  // drag/swipe
  let startX=0,startY=0,dragging=false;
  slider.addEventListener('pointerdown',e=>{
    startX=e.clientX; startY=e.clientY; dragging=true;
    slider.classList.add('dragging');
    slider.setPointerCapture(e.pointerId);
  });
  slider.addEventListener('pointerup',e=>{
    if(!dragging) return;
    dragging=false;
    slider.classList.remove('dragging');
    const dx=e.clientX-startX;
    const dy=Math.abs(e.clientY-startY);
    if(Math.abs(dx)>40 && dy<60){
      if(dx<0) goTo(current+1);
      else goTo(current-1);
    }
  });

  update();
})();

// --- FORM ---
(function(){
  const form = q('#cf');
  if(!form) return;
  form.addEventListener('submit', e => {
    const btn = form.querySelector('.fs');
    const orig = btn.textContent;
    btn.textContent = 'Sending...';
    btn.style.opacity = '.7';
    btn.disabled = true;
  });
})();
