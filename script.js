// Simple interactions: nav toggle, theme toggle, year, project filter, progress load

// Note: light theme feature removed — site uses single dark theme.

document.addEventListener('DOMContentLoaded', () => {
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');
  const yearEl = document.getElementById('year');

  // Year
  yearEl.textContent = new Date().getFullYear();

  // Mark theme as loaded (prevents FOUC)
  document.body.classList.add('theme-loaded');

  // Hide loading screen
  hideLoadingScreen();

  // Only create particles and heavy animations on desktop
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if (!isMobile && !prefersReduce) {
    initHeroParallax();
  }

  // Add scroll-triggered animations (lightweight)
  initScrollAnimations();

  // Add magnetic hover effect to buttons (desktop only)
  if (!isMobile) {
    initMagneticButtons();
  }

  // Initialize back to top button
  initBackToTop();

  // Add lazy loading for images
  initLazyLoading();

  // Initialize custom cursor
  initCustomCursor();

  // Mobile nav toggle
  navToggle && navToggle.addEventListener('click', () => {
    nav.classList.toggle('open');
    navToggle.classList.toggle('open');
  });

  // Light/dark toggle removed; site uses single dark theme.

  // Project image tap handler (mobile overlay interaction)
  const projectsGrid = document.getElementById('projectsGrid');
  if (projectsGrid) {
    // Close all overlays when clicking outside
    const closeAllOverlays = () => {
      projectsGrid.querySelectorAll('.project.active').forEach(p => {
        p.classList.remove('active');
      });
    };

    // Handle image clicks to show/hide overlay
    projectsGrid.addEventListener('click', (e) => {
      const imgWrap = e.target.closest('.proj-img-wrap');
      if (!imgWrap) return;
      
      const project = imgWrap.closest('.project');
      if (!project) return;

      // On mobile, toggle active state; on desktop, let hover handle it
      const isMobile = window.matchMedia('(max-width: 768px)').matches;
      if (isMobile) {
        // Close others, toggle current
        projectsGrid.querySelectorAll('.project.active').forEach(p => {
          if (p !== project) p.classList.remove('active');
        });
        project.classList.toggle('active');
      }
    });

    // Close overlay when clicking action buttons or outside
    document.addEventListener('click', (e) => {
      // Don't close if clicking on a proj-action button (let it navigate)
      if (e.target.closest('.proj-action')) return;
      // Close if clicking outside projectsGrid
      if (!e.target.closest('.project *')) {
        closeAllOverlays();
      }
    });
  }

  // Project filtering
  const filterWrap = document.getElementById('projectFilter');
  if (filterWrap && projectsGrid){
    const applyProjectFilter = (filter) => {
      const allBtns = filterWrap.querySelectorAll('button[data-filter]');
      allBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-filter') === filter));

      const projects = projectsGrid.querySelectorAll('.project');
      projects.forEach(p => {
        const tags = p.getAttribute('data-tags') || '';
        let show = false;
        if (filter === 'all') show = true;
        else if (filter === 'featured') show = p.classList.contains('featured');
        else show = tags.includes(filter);

        p.style.display = show ? '' : 'none';
      });
    };

    // Click handler for filter buttons
    filterWrap.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-filter]');
      if (!btn) return;
      const filter = btn.getAttribute('data-filter');
      applyProjectFilter(filter);
    });

    // Default: show featured projects on page load
    applyProjectFilter('featured');
  }

  // Style 2 — Tabbed Panel tab switching
  const skp2Shell = document.querySelector('.skp2-shell');
  if (skp2Shell) {
    skp2Shell.addEventListener('click', (e) => {
      const tab = e.target.closest('.skp2-tab');
      if (!tab) return;
      const key = tab.getAttribute('data-tab');
      skp2Shell.querySelectorAll('.skp2-tab').forEach(t => t.classList.toggle('active', t === tab));
      skp2Shell.querySelectorAll('.skp2-panel').forEach(p => p.classList.toggle('active', p.getAttribute('data-panel') === key));
    });
  }

  // Animate skill bars (appear on scroll)
  const bars = document.querySelectorAll('.skill .bar div');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        // if style width set inline in HTML, preserve it; else default to 60%
        const w = el.style.width || '60%';
        el.style.width = '0%';
        // small delay for animation
        // add shimmer while animating, then switch to a subtle looping shimmer
        const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!prefersReduce) {
          el.classList.add('shimmer');
        }

        setTimeout(() => {
          el.style.width = w;

          // animate numeric percent indicator
          try {
            const parent = el.closest('.bar');
            if (parent) {
              let pct = parent.querySelector('.percent');
              if (!pct) {
                pct = document.createElement('div');
                pct.className = 'percent';
                parent.appendChild(pct);
              }
              const target = parseInt((w+'').replace(/[^0-9]/g, '')) || 60;
              if (prefersReduce) {
                pct.textContent = target + '%';
              } else {
                // animate number from 0 to target over same duration as CSS transition
                const duration = 800; // ms (matches CSS transition)
                const start = performance.now();
                function tick(now){
                  const t = Math.min(1, (now - start) / duration);
                  const current = Math.round(t * target);
                  pct.textContent = current + '%';
                  if (t < 1) requestAnimationFrame(tick);
                }
                requestAnimationFrame(tick);
                // after initial fill, switch shimmer into a looping subtle animation
                setTimeout(() => {
                  el.classList.remove('shimmer');
                  el.classList.add('shimmer-loop');
                }, duration + 60);
              }
            }
          } catch (err) { /* ignore */ }
        }, 60);
        observer.unobserve(el);
      }
    });
  }, {threshold: 0.25});
  bars.forEach(b => observer.observe(b));

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({behavior:'smooth', block:'start'});
        // close mobile nav after click
        nav.classList.remove('open');
        navToggle && navToggle.classList.remove('open');
        // mark clicked nav link active immediately
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        a.classList.add('active');
      }
    });
  });

  // Scrollspy: observe sections and highlight corresponding nav link
  (function initScrollSpy(){
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('main section[id]');
    if (!sections.length || !navLinks.length) return;

    const headerHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 64;

    // use the static .nav-pill element as the sliding highlight
    const indicator = nav.querySelector('.nav-pill');
    if (indicator) indicator.style.opacity = '1';

    function moveIndicatorToLink(link){
      if (!link || !indicator) return;
      const rect = link.getBoundingClientRect();
      const navRect = nav.getBoundingClientRect();
      const left = rect.left - navRect.left;
      const top  = rect.top  - navRect.top;
      indicator.style.left   = Math.round(left) + 'px';
      indicator.style.top    = Math.round(top)  + 'px';
      indicator.style.width  = Math.round(rect.width)  + 'px';
      indicator.style.height = Math.round(rect.height) + 'px';
      indicator.style.opacity = '1';
    }

    function setActive(id){
      let activeLink = null;
      navLinks.forEach(a => {
        const href = a.getAttribute('href');
        if (href === '#' + id) { a.classList.add('active'); activeLink = a; } else a.classList.remove('active');
      });
      // move indicator to active link
      if (activeLink) moveIndicatorToLink(activeLink);
    }

    // reposition indicator on resize
    window.addEventListener('resize', () => {
      const current = document.querySelector('.nav-link.active');
      if (current) moveIndicatorToLink(current);
    });

    const spy = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActive(entry.target.id);
        }
      });
    }, {
      root: null,
      // offset by header height so section becomes active when it appears under header
      rootMargin: `-${headerHeight}px 0px -40% 0px`,
      threshold: 0
    });

    sections.forEach(s => spy.observe(s));
    // ensure indicator positioned on initial load
    setTimeout(() => {
      const current = document.querySelector('.nav-link.active') || document.querySelector('.nav-link[href="#home"]');
      if (current) moveIndicatorToLink(current);
    }, 120);
  })();

  // Contact form: AJAX submit — keeps user on page, shows inline success/error
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalHTML = submitBtn ? submitBtn.innerHTML : '';
      const errorEl = contactForm.querySelector('.ct-form-error');

      // Reset error state
      if (errorEl) errorEl.hidden = true;

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Sending...';
      }

      try {
        const res = await fetch('https://formsubmit.co/ajax/captainjahid45@gmail.com', {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: new FormData(contactForm)
        });
        if (!res.ok) throw new Error('Server error');
        // Reset button & form, show success modal
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = originalHTML; }
        contactForm.reset();
        const modal = document.getElementById('ct-success-modal');
        if (modal) modal.hidden = false;
      } catch (err) {
        // Re-enable button and show inline error
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalHTML;
        }
        if (errorEl) errorEl.hidden = false;
      }
    });
  }

  // Success modal: close on × button, backdrop click, or Escape key
  const successModal = document.getElementById('ct-success-modal');
  if (successModal) {
    const closeModal = () => { successModal.hidden = true; };
    document.getElementById('ct-modal-close') && document.getElementById('ct-modal-close').addEventListener('click', closeModal);
    successModal.querySelector('.ct-modal-backdrop') && successModal.querySelector('.ct-modal-backdrop').addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !successModal.hidden) closeModal(); });
  }

  // Entrance animations: add class after small delay unless user prefers reduced motion
  try {
    const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReduce) {
      window.setTimeout(() => document.body.classList.add('is-loaded'), 120);
    }
  } catch (err) {
    // ignore
  }

  // Leadership cards: expand/collapse details
  const leadToggleButtons = document.querySelectorAll('.lc-toggle');
  leadToggleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.lc');
      if (!card) return;
      const details = card.querySelector('.lc-details');
      const txtEl = btn.querySelector('.lc-toggle-txt');
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      if (details) {
        if (expanded) {
          details.hidden = true;
          if (txtEl) txtEl.textContent = 'Show details';
          btn.setAttribute('aria-expanded', 'false');
          card.dataset.expanded = 'false';
        } else {
          details.hidden = false;
          if (txtEl) txtEl.textContent = 'Hide details';
          btn.setAttribute('aria-expanded', 'true');
          card.dataset.expanded = 'true';
        }
      }
    });
  });

  // Leadership "View all" toggle: move controls and animate extra items
  (function initLeadToggle(){
    const toggle = document.getElementById('lead-toggle');
    const extraContainer = document.getElementById('lead-extra-container');
    const controls = document.querySelector('.lead-controls');
    const mainList = document.querySelector('.lead-list:not(#lead-extra-container)');
    if (!toggle || !extraContainer || !controls) return;

    toggle.addEventListener('click', function(){
      const expanded = this.getAttribute('aria-expanded') === 'true';

      if (expanded){
        // collapsing: remove visible class to trigger hide animation,
        // then set hidden after transition and move controls back above.
        extraContainer.classList.remove('is-visible');
        if (mainList) mainList.classList.remove('lead-list-bridge');
        const onTransitionEnd = function(e){
          if (e.target !== extraContainer) return;
          extraContainer.setAttribute('hidden','');
          extraContainer.removeEventListener('transitionend', onTransitionEnd);
          // move controls back above the extra container
          extraContainer.parentNode.insertBefore(controls, extraContainer);
        };
        extraContainer.addEventListener('transitionend', onTransitionEnd);

        this.textContent = 'View all activity';
        this.setAttribute('aria-expanded','false');
        this.scrollIntoView({behavior:'smooth', block:'nearest'});
      } else {
        // expanding: move the controls below the extra container,
        // un-hide the container then add the visible class to animate in.
        extraContainer.parentNode.insertBefore(controls, extraContainer.nextSibling);
        extraContainer.removeAttribute('hidden');
        // allow layout to update before adding class
        requestAnimationFrame(function(){
          extraContainer.classList.add('is-visible');
          if (mainList) mainList.classList.add('lead-list-bridge');
        });

        this.textContent = 'Show less';
        this.setAttribute('aria-expanded','true');
      }
    });
  })();
});

// Mouse parallax on hero orbs
function initHeroParallax() {
  const orbs = document.querySelectorAll('.hero-orb');
  const hero = document.getElementById('home');
  const heroBg = document.querySelector('.hero-bg');
  const hp3Right = document.querySelector('.hp3-right');
  
  if (!orbs.length || !hero) return;
  
  const factors = [0.022, -0.016, 0.012];
  let rafId = null;
  let tx = 0, ty = 0;
  let isHovering = false;

  // Create mouse shadow element - append to hero-bg so it's clipped
  let mouseShadow = document.querySelector('.mouse-shadow');
  if (!mouseShadow) {
    mouseShadow = document.createElement('div');
    mouseShadow.className = 'mouse-shadow';
    mouseShadow.style.cssText = `
      position: absolute;
      pointer-events: none;
      width: 400px;
      height: 400px;
      border-radius: 50%;
      background: radial-gradient(circle at center, rgba(122,252,255,0.8) 0%, rgba(255,95,109,0.4) 40%, rgba(255,95,109,0.05) 100%);
      filter: blur(100px);
      opacity: 0;
      z-index: 0.5;
      mix-blend-mode: screen;
      transition: opacity 0.3s ease;
      top: 0;
      left: 0;
    `;
    // Append to hero-bg so it respects hero's overflow:hidden
    heroBg.appendChild(mouseShadow);
  }

  // Track mouse only over hero
  hero.addEventListener('mouseenter', () => {
    isHovering = true;
    mouseShadow.style.opacity = '1';
  });

  hero.addEventListener('mouseleave', () => {
    isHovering = false;
    mouseShadow.style.opacity = '0';
    // Reset photo tilt
    if (hp3Right) {
      hp3Right.style.transform = 'translateZ(0) rotateX(0deg) rotateY(0deg)';
    }
  });

  document.addEventListener('mousemove', (e) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    tx = e.clientX - cx;
    ty = e.clientY - cy;
    
    if (isHovering) {
      // Get hero position relative to viewport
      const heroRect = hero.getBoundingClientRect();
      const heroBgRect = heroBg.getBoundingClientRect();
      
      // Position shadow relative to hero-bg
      const shadowX = e.clientX - heroBgRect.left - 200;
      const shadowY = e.clientY - heroBgRect.top - 200;
      
      mouseShadow.style.left = `${shadowX}px`;
      mouseShadow.style.top = `${shadowY}px`;
      
      if (!rafId) rafId = requestAnimationFrame(() => moveOrbs(e.clientX, e.clientY));
    }
  });

  function moveOrbs(clientX, clientY) {
    // Update orbs parallax
    orbs.forEach((orb, i) => {
      const f = factors[i] ?? 0.01;
      orb.style.transform = `translate(${tx * f}px, ${ty * f}px)`;
    });
    
    // Apply 3D tilt to photo - MUCH more pronounced
    if (hp3Right) {
      const heroRect = hero.getBoundingClientRect();
      const heroCenterX = heroRect.left + heroRect.width / 2;
      const heroCenterY = heroRect.top + heroRect.height / 2;
      
      const dx = clientX - heroCenterX;
      const dy = clientY - heroCenterY;
      
      // Calculate rotation based on mouse position relative to hero center
      const rotX = -(dy / heroRect.height) * 25; // Vertical mouse = X rotation
      const rotY = (dx / heroRect.width) * 30;   // Horizontal mouse = Y rotation
      
      hp3Right.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.02)`;
    }
    
    rafId = null;
  }
}


// Scroll-triggered fade-in animations
function initScrollAnimations() {
  const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduce) return;

  const sections = document.querySelectorAll('.section');
  sections.forEach(section => section.classList.add('fade-in'));

  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, observerOptions);

  sections.forEach(section => observer.observe(section));
}

// Magnetic hover effect for buttons
function initMagneticButtons() {
  const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduce) return;

  const buttons = document.querySelectorAll('.btn.primary');
  
  buttons.forEach(btn => {
    btn.classList.add('magnetic');
    
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      const moveX = x * 0.3;
      const moveY = y * 0.3;
      
      btn.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });
    
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translate(0, 0)';
    });
  });
}


// Hide loading screen with fade effect
function hideLoadingScreen() {
  const loadingScreen = document.getElementById('loading-screen');
  if (!loadingScreen) return;

  // Animate percentage counter
  const pct = loadingScreen.querySelector('.ls-pct');
  if (pct) {
    let val = 0;
    const duration = 1400; // matches ls-fill animation
    const start = performance.now();
    const tick = (now) => {
      const elapsed = now - start;
      val = Math.min(100, Math.round((elapsed / duration) * 100));
      pct.textContent = val + '%';
      if (val < 100) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // Hide loading screen after bar fills
  setTimeout(() => {
    loadingScreen.classList.add('hidden');
    setTimeout(() => loadingScreen.remove(), 620);
  }, 1750);
}

// Back to top button functionality
function initBackToTop() {
  const backToTopBtn = document.getElementById('backToTop');
  if (!backToTopBtn) return;

  // Show/hide button based on scroll position
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  });

  // Scroll to top on click
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

// Lazy loading for images
function initLazyLoading() {
  const images = document.querySelectorAll('img[loading=\"lazy\"]');
  
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src || img.src;
          img.classList.add('loaded');
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  } else {
    // Fallback for older browsers
    images.forEach(img => {
      img.src = img.dataset.src || img.src;
    });
  }
}

// Custom Cursor System
function initCustomCursor() {
  // Only initialize on desktop devices with pointer support
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    return;
  }

  const cursor = document.getElementById('cursor');
  const trail = document.getElementById('cursor-trail');
  
  if (!cursor || !trail) return;

  let mouseX = 0;
  let mouseY = 0;
  let trailX = 0;
  let trailY = 0;
  let isScaled = false;

  // Track mouse position
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Main cursor follows immediately
    cursor.style.left = mouseX + 'px';
    cursor.style.top = mouseY + 'px';
  });

  // Smooth trail animation using requestAnimationFrame
  function animateTrail() {
    // Lag factor for smooth trailing (0.15 = 15% of distance per frame)
    const lagFactor = 0.15;
    
    trailX += (mouseX - trailX) * lagFactor;
    trailY += (mouseY - trailY) * lagFactor;
    
    trail.style.left = trailX + 'px';
    trail.style.top = trailY + 'px';
    
    requestAnimationFrame(animateTrail);
  }
  animateTrail();

  // Parallax effect on hero section (subtle background shift)
  document.addEventListener('mousemove', (e) => {
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
      const px = (e.clientX / window.innerWidth - 0.5) * 2;
      const py = (e.clientY / window.innerHeight - 0.5) * 2;
      // ±14px horizontal, ±9px vertical
      heroSection.style.backgroundPosition = `${50 + px * 2}% ${50 + py * 1.3}%`;
    }
  });

  // Scale cursor on interactive element hover
  const interactiveElements = document.querySelectorAll(
    'button, a, [role="button"], input[type="submit"], input[type="button"], ' +
    'input[type="text"], input[type="email"], input[type="password"], input[type="search"], ' +
    'textarea, select, .nav-link, .filter-btn, .proj-action, .btn, .lc-toggle, [onclick]'
  );

  interactiveElements.forEach((el) => {
    el.addEventListener('mouseenter', () => {
      isScaled = true;
      cursor.style.transform = 'translate(-50%, -50%) scale(2.4)';
      trail.style.transform = 'translate(-50%, -50%) scale(1.5)';
    });

    el.addEventListener('mouseleave', () => {
      isScaled = false;
      cursor.style.transform = 'translate(-50%, -50%) scale(1)';
      trail.style.transform = 'translate(-50%, -50%) scale(1)';
    });

    // Add focus listeners for form inputs (keyboard navigation)
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
      el.addEventListener('focus', () => {
        isScaled = true;
        cursor.style.transform = 'translate(-50%, -50%) scale(2.4)';
        trail.style.transform = 'translate(-50%, -50%) scale(1.5)';
      });

      el.addEventListener('blur', () => {
        isScaled = false;
        cursor.style.transform = 'translate(-50%, -50%) scale(1)';
        trail.style.transform = 'translate(-50%, -50%) scale(1)';
      });
    }
  });

  // Hide cursor when leaving window
  document.addEventListener('mouseleave', () => {
    cursor.style.opacity = '0';
    trail.style.opacity = '0';
  });

  document.addEventListener('mouseenter', () => {
    cursor.style.opacity = '1';
    trail.style.opacity = '0.6';
  });
}