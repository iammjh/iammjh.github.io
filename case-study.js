'use strict';

// Progressive enhancement only: every story, diagram, and link works without JS.
(() => {
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const sections = [...document.querySelectorAll('[data-case-section]')];
  const links = [...document.querySelectorAll('.case-toc a')];
  let frame = 0;
  let positions = [];
  let layoutDirty = true;
  let activeId = '';

  const video = document.querySelector('.case-player video');
  const playButton = document.querySelector('.case-play');
  const videoStatus = document.querySelector('.case-video-status');
  if (video && playButton && videoStatus) {
    // Keep the cover quiet until requested; native controls still work without JavaScript.
    video.controls = false;
    video.tabIndex = -1;
    playButton.hidden = false;
    playButton.addEventListener('click', async () => {
      playButton.hidden = true;
      videoStatus.hidden = true;
      video.controls = true;
      video.tabIndex = 0;
      video.focus({ preventScroll: true });
      try { await video.play(); }
      catch {
        videoStatus.textContent = 'The video could not start. Please retry with the player controls or use the Open video link.';
        videoStatus.hidden = false;
      }
    });
  }

  function documentTop(element) {
    let top = 0;
    // Layout offsets exclude the temporary reveal transform.
    for (let node = element; node; node = node.offsetParent) top += node.offsetTop;
    return top;
  }
  function update() {
    frame = 0;
    if (layoutDirty) {
      positions = sections.map(section => ({ id: section.id, top: documentTop(section) }));
      layoutDirty = false;
    }
    const visibleTop = window.visualViewport?.pageTop ?? window.scrollY;
    const visibleHeight = window.visualViewport?.height ?? window.innerHeight;
    const range = Math.max(1, root.scrollHeight - visibleHeight);
    const progress = range - visibleTop < 2 ? 1 : Math.min(1, Math.max(0, visibleTop / range));
    root.style.setProperty('--case-progress', progress.toFixed(4));
    const marker = visibleTop + Math.min(visibleHeight * 0.35, 220);
    let current = '';
    for (const section of positions) if (section.top <= marker) current = section.id;
    if (progress >= 0.995) current = sections.at(-1)?.id || '';
    if (current === activeId) return;
    activeId = current;
    links.forEach(link => {
      if (link.hash === `#${current}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  function schedule() {
    if (!frame && !document.hidden) frame = window.requestAnimationFrame(update);
  }
  function refreshLayout() { layoutDirty = true; schedule(); }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', refreshLayout, { passive: true });
  window.addEventListener('pageshow', refreshLayout);
  window.visualViewport?.addEventListener('resize', schedule, { passive: true });
  window.visualViewport?.addEventListener('scroll', schedule, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && frame) { window.cancelAnimationFrame(frame); frame = 0; }
    else schedule();
  });
  if ('ResizeObserver' in window) new ResizeObserver(refreshLayout).observe(document.body);
  document.fonts?.ready.then(refreshLayout);

  const revealElements = [...document.querySelectorAll('.case-reveal,.case-architecture')];
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.06 });
    revealElements.forEach(element => observer.observe(element));
    root.classList.add('case-ready');
  }
  function applyMotionPreference() {
    const paused = reduced.matches;
    root.classList.toggle('motion-paused', paused);
    if (paused) revealElements.forEach(element => element.classList.add('is-visible'));
  }
  window.addEventListener('pageshow', applyMotionPreference);
  if (reduced.addEventListener) reduced.addEventListener('change', applyMotionPreference);
  else reduced.addListener(applyMotionPreference);
  applyMotionPreference();
  refreshLayout();
})();
