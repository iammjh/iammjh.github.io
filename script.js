// Simple interactions: nav toggle, theme toggle, year, project filter, progress load
document.addEventListener('DOMContentLoaded', () => {
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');
  const themeToggle = document.getElementById('themeToggle');
  const yearEl = document.getElementById('year');

  // Year
  yearEl.textContent = new Date().getFullYear();

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
