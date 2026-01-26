// Simple interactions: nav toggle, theme toggle, year, project filter, progress load
document.addEventListener('DOMContentLoaded', () => {
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');
  const themeToggle = document.getElementById('themeToggle');
  const yearEl = document.getElementById('year');

  // Year
  yearEl.textContent = new Date().getFullYear();

  // Hide loading screen
  hideLoadingScreen();

  // Create floating particles
  createFloatingParticles();

  // Add scroll-triggered animations
  initScrollAnimations();

  // Add magnetic hover effect to buttons
  initMagneticButtons();

  // Add typing effect to hero name
  addTypingEffect();

  // Initialize back to top button
  initBackToTop();

  // Add lazy loading for images
  initLazyLoading();

  // Mobile nav toggle
  navToggle && navToggle.addEventListener('click', () => {
    nav.classList.toggle('open');
  });

  // Theme toggle (persist in localStorage)
  const themeKey = 'portfolio-theme';
  const saved = localStorage.getItem(themeKey);
  if (saved === 'light') document.body.classList.add('light');

  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light');
    const current = document.body.classList.contains('light') ? 'light' : 'dark';
    localStorage.setItem(themeKey, current);
  });

  // Project filtering
  const filterWrap = document.getElementById('projectFilter');
  const projectsGrid = document.getElementById('projectsGrid');
  if (filterWrap && projectsGrid){
    filterWrap.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-filter]');
      if (!btn) return;
      const allBtns = filterWrap.querySelectorAll('button');
      allBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.getAttribute('data-filter');
      const projects = projectsGrid.querySelectorAll('.project');
      projects.forEach(p => {
        const tags = p.getAttribute('data-tags') || '';
        if (filter === 'all' || tags.includes(filter)) {
          p.style.display = '';
        } else {
          p.style.display = 'none';
        }
      });
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
      }
    });
  });

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

  const particleCount = 25;
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
      // Remove cursor after typing is complete
      setTimeout(() => {
        cursor.style.animation = 'blink 0.7s step-end infinite';
      }, 500);
    }
  }
  
  setTimeout(typeChar, 800);
}

// Hide loading screen with fade effect
function hideLoadingScreen() {
  const loadingScreen = document.getElementById('loading-screen');
  if (!loadingScreen) return;
  
  // Wait for all critical resources to load
  window.addEventListener('load', () => {
    setTimeout(() => {
      loadingScreen.classList.add('hidden');
      // Remove from DOM after transition
      setTimeout(() => {
        loadingScreen.remove();
      }, 500);
    }, 300);
  });
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
