'use strict';
// ─── UTILS ────────────────────────────────────────
const q=s=>document.querySelector(s);
const qq=s=>[...document.querySelectorAll(s)];
const pref=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
if(pref) document.documentElement.classList.add('reduce-motion');
q('#yr').textContent=new Date().getFullYear();

// ─── CUSTOM CURSOR ────────────────────────────────
(function(){
  if('ontouchstart' in window || pref) return;
  const dot=q('#cd'),ring=q('#cr');
  if(!dot||!ring) return;
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

// ─── NAV + BTT + SCROLL SPY ───────────────────────
const nav=q('#nav'),btt=q('#btt'),footer=q('.footer');
const navLinks=qq('.nav-links .nl, .mob-drawer .nl');
const sections=qq('main section[id]');
let activeSection='home';

function setActiveNav(id){
  if(!id||id===activeSection) return;
  activeSection=id;
  navLinks.forEach(link=>{
    link.classList.toggle('active', link.getAttribute('href')==='#'+id);
  });
}

if(sections.length){
  const spy=new IntersectionObserver(ents=>{
    ents.forEach(e=>{
      if(e.isIntersecting) setActiveNav(e.target.id);
    });
  },{rootMargin:'-42% 0px -52% 0px',threshold:0});
  sections.forEach(sec=>spy.observe(sec));
  setActiveNav(sections[0].id);
}

window.addEventListener('scroll',()=>{
  nav.classList.toggle('stuck',scrollY>40);
  const footerInView=footer&&footer.getBoundingClientRect().top<window.innerHeight-80;
  btt.classList.toggle('show', scrollY>500&&!footerInView);
},{passive:true});
btt.addEventListener('click',()=>window.scrollTo({top:0,behavior:pref?'auto':'smooth'}));

// ─── HAMBURGER ────────────────────────────────────
const ham=q('#ham'),mob=q('#mob');
function closeMob(){
  ham.classList.remove('open');
  mob.classList.remove('open');
  document.body.style.overflow='';
}
ham.addEventListener('click',()=>{
  ham.classList.toggle('open');
  mob.classList.toggle('open');
  document.body.style.overflow=mob.classList.contains('open')?'hidden':'';
});
qq('[data-close]').forEach(el=>el.addEventListener('click',closeMob));

// ─── HERO ANIMATIONS ──────────────────────────────
const nl2=q('#nl2');
if(!pref){
  setTimeout(()=>{
    q('#heroRule')&&q('#heroRule').classList.add('in');
    q('#heroEye') && setTimeout(()=>q('#heroEye').classList.add('in'),200);
    q('#nl1') && setTimeout(()=>q('#nl1').classList.add('in'),300);
    nl2 && setTimeout(()=>{
      nl2.classList.add('in');
      setTimeout(()=>nl2.classList.add('filled'),900);
    },450);
    q('#heroDesc') && setTimeout(()=>q('#heroDesc').classList.add('in'),650);
    q('#heroStats') && setTimeout(()=>q('#heroStats').classList.add('in'),750);
    q('#heroCtas') && setTimeout(()=>q('#heroCtas').classList.add('in'),850);
    q('#heroTicker') && setTimeout(()=>q('#heroTicker').classList.add('in'),1000);
  },80);
} else {
  ['heroRule','heroEye','heroDesc','heroStats','heroCtas','heroTicker'].forEach(id=>{const el=q('#'+id);if(el)el.classList.add('in');});
  q('#nl1')&&q('#nl1').classList.add('in');
  nl2&&nl2.classList.add('in','filled');
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

// ─── MAGNETIC CTAs ────────────────────────────────
(function(){
  if(pref||'ontouchstart' in window) return;
  const max=10;
  qq('.hero-ctas .btn-fill, .nav-hire').forEach(btn=>{
    btn.classList.add('magnetic');
    btn.addEventListener('mousemove',e=>{
      const r=btn.getBoundingClientRect();
      const x=e.clientX-r.left-r.width/2;
      const y=e.clientY-r.top-r.height/2;
      const dx=Math.max(-max,Math.min(max,x*0.22));
      const dy=Math.max(-max,Math.min(max,y*0.22));
      btn.style.setProperty('--mag-x', dx+'px');
      btn.style.setProperty('--mag-y', dy+'px');
    });
    btn.addEventListener('mouseleave',()=>{
      btn.style.setProperty('--mag-x','0px');
      btn.style.setProperty('--mag-y','0px');
    });
  });
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

if('serviceWorker' in navigator){
  navigator.serviceWorker.register('/sw.js');
}

// --- MODALS + POPUP CLOSE ---
(function(){
  const openers = qq('[data-modal-open]');
  const modals = qq('[data-modal]');

  openers.forEach(el=>{
    el.addEventListener('click',()=>{
      const target = q(el.dataset.modalOpen);
      if(target) target.classList.add('active');
    });
  });

  modals.forEach(modal=>{
    modal.addEventListener('click',e=>{
      // Close only when clicking the backdrop, not modal content.
      if(e.target === modal) modal.classList.remove('active');
    });
  });

  qq('[data-modal-close]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const modal = btn.closest('[data-modal]');
      if(modal) modal.classList.remove('active');
    });
  });

  qq('[data-popup-close]').forEach(btn=>{
    btn.addEventListener('click',()=>q('#successPopup')?.classList.remove('show'));
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

  const TOTAL   = track.querySelectorAll('.proj-slide').length;
  if(!TOTAL) return;
  const slides  = [...track.querySelectorAll('.proj-slide')];
  let current   = 0;

  // build dots
  for(let i=0;i<TOTAL;i++){
    const d=document.createElement('span');
    d.className='ps-dot'+(i===0?' on':'');
    d.addEventListener('click',()=>goTo(i));
    dotsEl.appendChild(d);
  }

  function update(){
    track.style.transform='translateX('+(-current*100)+'%)';
    prevBtn.disabled=current===0;
    nextBtn.disabled=current===TOTAL-1;
    countEl.innerHTML='<strong>'+(current+1)+'</strong> / '+TOTAL;
    document.querySelectorAll('#projDots .ps-dot').forEach((d,i)=>d.classList.toggle('on',i===current));
    slides.forEach((slide,i)=>slide.classList.toggle('is-active',i===current));
  }

  function goTo(n){
    const next=Math.max(0,Math.min(TOTAL-1,n));
    if(next===current) return;
    if(!pref){
      track.classList.add('is-fading');
      setTimeout(()=>{
        current=next;
        update();
        track.classList.remove('is-fading');
      },120);
    } else {
      current=next;
      update();
    }
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
    // Let interactive elements (project links/buttons) receive normal click behavior.
    if(e.button !== 0) return;
    if(e.target.closest('a, button, input, textarea, select, label')) return;
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

  slider.addEventListener('pointercancel',()=>{
    dragging=false;
    slider.classList.remove('dragging');
  });

  update();
})();

// --- FORM ---
(function(){
  const form = q('#cf');
  if(!form) return;
  const fields=[...form.querySelectorAll('.fi, .fta')];
  const fieldGroups=[...form.querySelectorAll('.fg')];

  function setFormError(on){
    fields.forEach(f=>f.classList.toggle('is-error', on));
    fieldGroups.forEach(g=>g.classList.toggle('has-error', on));
  }

  fields.forEach(f=>{
    f.addEventListener('input',()=>{
      f.classList.remove('is-error');
      if(!fields.some(el=>el.classList.contains('is-error'))) fieldGroups.forEach(g=>g.classList.remove('has-error'));
    });
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    setFormError(false);
    const btn = form.querySelector('.fs');
    const orig = btn.textContent;
    btn.textContent = 'Sending...';
    btn.style.opacity = '.7';
    btn.disabled = true;
    
    try {
      const formData = new FormData(form);
      const response = await fetch('https://formsubmit.co/ajax/captainjahid45@gmail.com', {
        method: 'POST',
        body: formData
      });
      
      if(response.ok) {
        const popup = q('#successPopup');
        popup.classList.add('show');
        form.reset();
        btn.textContent = orig;
        btn.style.opacity = '1';
        btn.disabled = false;
        setTimeout(() => {
          popup.classList.remove('show');
        }, 5000);
      } else {
        throw new Error('Form submission failed');
      }
    } catch(err) {
      console.error('Error:', err);
      setFormError(true);
      btn.textContent = 'Error! Try again';
      btn.style.opacity = '1';
      btn.disabled = false;
      setTimeout(() => {
        btn.textContent = orig;
      }, 2000);
    }
  });
})();
