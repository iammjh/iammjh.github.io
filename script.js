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
    createFloatingParticles();
    addTypingEffect();
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

  // Mobile nav toggle
  navToggle && navToggle.addEventListener('click', () => {
    nav.classList.toggle('open');
    // Reposition indicator after menu opens/closes (mobile)
    window.dispatchEvent(new Event('resize'));
  });

  // Light/dark toggle removed; site uses single dark theme.

  // Project filtering
  const filterWrap = document.getElementById('projectFilter');
  const projectsGrid = document.getElementById('projectsGrid');
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

    // create moving indicator
    const indicator = document.createElement('div');
    indicator.className = 'nav-indicator';
    nav.appendChild(indicator);

    function moveIndicatorToLink(link){
      if (!link) {
        indicator.style.width = '0';
        indicator.style.height = '0';
        indicator.style.left = '';
        indicator.style.top = '';
        indicator.style.bottom = '';
        return;
      }
      const rect = link.getBoundingClientRect();
      const navRect = nav.getBoundingClientRect();

      // Keep indicator horizontal: calculate left & top so it sits just below the link
      const indicatorHeight = 3; // px
      const left = rect.left - navRect.left;
      // position the bar a few pixels below the link (rect.height - small offset)
      const top = rect.top - navRect.top + rect.height - (indicatorHeight - 1);

      indicator.style.bottom = '';
      indicator.style.left = Math.round(left) + 'px';
      indicator.style.top = Math.round(top) + 'px';
      indicator.style.width = Math.round(rect.width) + 'px';
      indicator.style.height = indicatorHeight + 'px';
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

  // Optional: intercept contact form to show a quick client-side message
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      // Let formsubmit handle it normally; but show a quick message and disable submit to avoid duplicates
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      submitBtn && (submitBtn.disabled = true);
      submitBtn && (submitBtn.textContent = 'Sending...');
    });
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
  const leadToggleButtons = document.querySelectorAll('.toggle-details');
  leadToggleButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = btn.closest('.lead-card');
      if (!card) return;
      const details = card.querySelector('.lead-details');
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      if (details) {
        if (expanded) {
          details.hidden = true;
          btn.textContent = 'Show more';
          btn.setAttribute('aria-expanded', 'false');
          card.dataset.expanded = 'false';
        } else {
          details.hidden = false;
          btn.textContent = 'Show less';
          btn.setAttribute('aria-expanded', 'true');
          card.dataset.expanded = 'true';
        }
      }
    });
  });
});

// Create floating particles in the background
function createFloatingParticles() {
  const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduce) return;

  const particlesContainer = document.createElement('div');
  particlesContainer.className = 'particles';
  document.body.appendChild(particlesContainer);

  const particleCount = 20; // Reduced from 25 for better performance
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    const size = Math.random() * 4 + 2;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.animationDuration = `${Math.random() * 10 + 15}s`;
    particle.style.animationDelay = `${Math.random() * 5}s`;
    
    particlesContainer.appendChild(particle);
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

// Typing effect for hero name
function addTypingEffect() {
  const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduce) return;

  const nameElement = document.querySelector('.hero-text .name .accent');
  if (!nameElement) return;

  const originalText = nameElement.textContent;
  nameElement.textContent = '';
  
  // Add cursor
  const cursor = document.createElement('span');
  cursor.className = 'typing-cursor';
  nameElement.parentElement.appendChild(cursor);
  
  let charIndex = 0;
  const typingSpeed = 100;
  
  function typeChar() {
    if (charIndex < originalText.length) {
      nameElement.textContent += originalText.charAt(charIndex);
      charIndex++;
      setTimeout(typeChar, typingSpeed);
    } else {
      // Start cursor blinking after typing is complete
      setTimeout(() => {
        cursor.style.animation = 'blink 0.7s step-end infinite';
        // Stop cursor blinking after 2 seconds
        setTimeout(() => {
          cursor.style.opacity = '0';
        }, 2000);
      }, 500);
    }
  }
  
  setTimeout(typeChar, 800);
}

// Hide loading screen with fade effect
function hideLoadingScreen() {
  const loadingScreen = document.getElementById('loading-screen');
  if (!loadingScreen) return;
  
  // Hide loading screen as soon as DOM is ready (faster)
  setTimeout(() => {
    loadingScreen.classList.add('hidden');
    // Remove from DOM after transition
    setTimeout(() => {
      loadingScreen.remove();
    }, 500);
  }, 100);
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