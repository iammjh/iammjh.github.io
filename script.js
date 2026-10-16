'use strict';

// Portfolio interactions; service-worker registration is shared with the case-study pages.
(() => {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const desktop = window.matchMedia('(min-width: 900px)');
  const motionToggle = document.getElementById('motion-toggle');
  let motionPausedByUser = false;
  try { motionPausedByUser = localStorage.getItem('portfolio-motion-paused') === 'true'; } catch { /* Motion controls also work without storage. */ }
  const canvas = document.getElementById('ambient-canvas');
  const context = canvas?.getContext('2d', { alpha: true });
  const scrollPercent = document.getElementById('scroll-percent');
  const pointerCards = [...document.querySelectorAll('.tilt-card, .capability, .contact-form')];
  const chapters = [...document.querySelectorAll('section[data-chapter]')];
  const chapterLinks = [...document.querySelectorAll('[data-chapter-link]')];
  const counterElements = [...document.querySelectorAll('[data-count]')];
  const activeCounters = new Map();
  const completedCounters = new WeakSet();
  const particles = [];
  let nodes = [];
  let width = 0;
  let height = 0;
  let frame = 0;
  let ambientTimer = 0;
  let layoutDirty = true;
  let chapterPositions = [];
  let scenePositions = [];
  const scrollScenes = [...document.querySelectorAll('[data-scroll-scene]')];
  const saveData = Boolean(navigator.connection?.saveData);
  let lastPaintTime = 0;
  let scrollDirty = true;
  let canvasDirty = true;
  let activeChapter = '';
  let lastPointer = null;
  let lastTrailTime = 0;

  const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
  const motionAllowed = () => !reducedMotion.matches && !motionPausedByUser;
  const motionRunning = () => motionAllowed() && !document.hidden;
  const ambientRunning = () => motionRunning() && !saveData;
  const pointerMotionAllowed = () => motionRunning() && finePointer.matches && window.innerWidth >= 768;
  const listenToMedia = (query, listener) => {
    if (query.addEventListener) query.addEventListener('change', listener);
    else query.addListener(listener);
  };

  function scheduleFrame() {
    if (!frame && !document.hidden) frame = window.requestAnimationFrame(render);
  }

  function sizeCanvas() {
    if (!context || !canvas) return;
    width = window.innerWidth;
    height = window.innerHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, width < 768 ? 1 : 1.5);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const count = width < 768 ? 10 : 26;
    nodes = Array.from({ length: count }, (_, index) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 0.5) * 5,
      radius: index % 7 === 0 ? 1.5 : 0.85,
      accent: index % 5 === 0
    }));
    particles.length = 0;
    canvasDirty = true;
  }

  function paintAmbient(delta, animate) {
    if (!context) return;
    context.clearRect(0, 0, width, height);
    if (animate) {
      for (const node of nodes) {
        node.x += node.vx * delta;
        node.y += node.vy * delta;
        if (node.x < -10) node.x = width + 10;
        if (node.x > width + 10) node.x = -10;
        if (node.y < -10) node.y = height + 10;
        if (node.y > height + 10) node.y = -10;
      }
    }
    const connectionDistance = width < 768 ? 105 : 145;
    for (let first = 0; first < nodes.length; first += 1) {
      const a = nodes[first];
      for (let second = first + 1; second < nodes.length; second += 1) {
        const b = nodes[second];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (distance >= connectionDistance) continue;
        context.strokeStyle = `rgba(138, 213, 194, ${(1 - distance / connectionDistance) * 0.14})`;
        context.lineWidth = 0.6;
        context.beginPath();
        context.moveTo(a.x, a.y);
        context.lineTo(b.x, b.y);
        context.stroke();
      }
      context.fillStyle = a.accent ? 'rgba(255, 119, 72, 0.42)' : 'rgba(138, 213, 194, 0.25)';
      context.beginPath();
      context.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      context.fill();
    }
    if (!animate) return;
    for (let index = particles.length - 1; index >= 0; index -= 1) {
      const particle = particles[index];
      particle.life -= delta;
      if (particle.life <= 0) {
        particles.splice(index, 1);
        continue;
      }
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      const alpha = particle.life / particle.duration;
      context.strokeStyle = `rgba(255, 119, 72, ${alpha * 0.5})`;
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(particle.x - 2 * alpha, particle.y);
      context.lineTo(particle.x + 2 * alpha, particle.y);
      context.moveTo(particle.x, particle.y - 2 * alpha);
      context.lineTo(particle.x, particle.y + 2 * alpha);
      context.stroke();
    }
  }

  function measureLayout() {
    chapterPositions = chapters.map(element => ({ id: element.id, top: element.getBoundingClientRect().top + window.scrollY }));
    scenePositions = scrollScenes.map(element => {
      const bounds = element.getBoundingClientRect();
      return { element, top: bounds.top + window.scrollY, height: bounds.height,
        milestones: [...element.querySelectorAll('.education-stop')].map(stop => ({ element: stop, top: stop.getBoundingClientRect().top + window.scrollY })) };
    });
    layoutDirty = false;
  }

  function updateScrollScenes(scrollY) {
    const marker = scrollY + window.innerHeight * 0.72;
    for (const scene of scenePositions) {
      if (scene.element.dataset.scrollScene === 'journey') {
        const progress = motionAllowed() ? clamp((marker - scene.top) / Math.max(1, scene.height), 0, 1) : 1;
        scene.element.style.setProperty('--journey-progress', progress.toFixed(4));
        scene.milestones.forEach(stop => stop.element.classList.toggle('is-reached', !motionAllowed() || marker >= stop.top));
      } else {
        const progress = clamp((scrollY + window.innerHeight - scene.top) / (window.innerHeight + scene.height), 0, 1);
        const drift = motionAllowed() && desktop.matches && finePointer.matches ? (progress - 0.5) * -32 : 0;
        scene.element.style.setProperty('--project-drift', `${drift.toFixed(1)}px`);
      }
    }
  }

  function updateScroll() {
    if (layoutDirty) measureLayout();
    const scrollY = Math.max(0, window.scrollY);
    const scrollRange = Math.max(0, root.scrollHeight - window.innerHeight);
    const progress = scrollRange ? clamp(scrollY / scrollRange, 0, 1) : 0;
    root.style.setProperty('--scroll-progress', progress.toFixed(4));
    root.style.setProperty('--scroll-y', `${Math.round(scrollY)}px`);
    root.classList.toggle('is-scrolled', scrollY > 24);
    if (scrollPercent) scrollPercent.textContent = `${Math.round(progress * 100)}%`;
    const marker = window.innerHeight * 0.38;
    let current = chapters[0]?.id || '';
    for (const chapter of chapterPositions) {
      if (chapter.top <= scrollY + marker) current = chapter.id;
    }
    updateScrollScenes(scrollY);
    if (progress > 0.995 && chapters.length) current = chapters[chapters.length - 1].id;
    if (current === activeChapter) return;
    activeChapter = current;
    for (const link of chapterLinks) {
      const selected = link.getAttribute('href') === `#${current}`;
      link.classList.toggle('is-active', selected);
      if (selected) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  }

  function finishCounter(element) {
    const target = Number(element.dataset.count);
    if (!Number.isFinite(target)) return;
    element.textContent = target.toLocaleString('en-US');
    activeCounters.delete(element);
    completedCounters.add(element);
  }

  function startCounter(element) {
    if (completedCounters.has(element) || activeCounters.has(element)) return;
    const target = Number(element.dataset.count);
    if (!Number.isFinite(target)) return;
    if (!motionRunning()) {
      finishCounter(element);
      return;
    }
    activeCounters.set(element, { target, started: performance.now() });
    scheduleFrame();
  }

  function render(now) {
    frame = 0;
    if (document.hidden) return;
    if (scrollDirty) {
      updateScroll();
      scrollDirty = false;
    }
    const running = motionRunning();
    const ambient = ambientRunning();
    const frameInterval = 1000 / (width < 768 ? 12 : 24);
    if (context && (canvasDirty || (ambient && now - lastPaintTime >= frameInterval - 2))) {
      const delta = lastPaintTime ? Math.min((now - lastPaintTime) / 1000, 0.1) : 0;
      paintAmbient(delta, ambient);
      lastPaintTime = now;
      canvasDirty = false;
    }
    for (const [element, counter] of activeCounters) {
      const progress = clamp((now - counter.started) / 1150, 0, 1);
      if (!running || progress === 1) finishCounter(element);
      else element.textContent = Math.round(counter.target * (1 - (1 - progress) ** 3)).toLocaleString('en-US');
    }
    if (activeCounters.size) scheduleFrame();
    // Sleep between ambient frames; scroll and pointer input can still schedule immediately.
    if (ambient && context && !ambientTimer) {
      ambientTimer = window.setTimeout(() => {
        ambientTimer = 0;
        scheduleFrame();
      }, Math.max(8, frameInterval - (performance.now() - lastPaintTime)));
    }
  }

  function resetPointerEffects() {
    lastPointer = null;
    particles.length = 0;
    document.querySelectorAll('.magnetic').forEach(element => {
      element.style.setProperty('--mag-x', '0px');
      element.style.setProperty('--mag-y', '0px');
    });
    pointerCards.forEach(resetPointerCard);
  }

  function resetPointerCard(element) {
    if (element.classList.contains('tilt-card')) {
      element.style.setProperty('--tilt-x', '0deg');
      element.style.setProperty('--tilt-y', '0deg');
    }
    element.style.setProperty('--pointer-x', '50%');
    element.style.setProperty('--pointer-y', '50%');
  }

  function updateMotion() {
    const paused = !motionAllowed();
    root.classList.toggle('motion-paused', paused || document.hidden);
    if (motionToggle) {
      motionToggle.hidden = false;
      motionToggle.disabled = reducedMotion.matches;
      motionToggle.setAttribute('aria-pressed', String(paused));
      motionToggle.title = reducedMotion.matches ? 'Reduced motion is enabled in your device settings' : paused ? 'Resume animations' : 'Pause animations';
      motionToggle.querySelector('[data-motion-label]').textContent = paused ? 'Motion off' : 'Motion on';
    }
    if (!motionRunning()) {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      window.clearTimeout(ambientTimer);
      ambientTimer = 0;
      if (requestIndex >= 0) finishRequest();
      activeCounters.forEach((_, element) => finishCounter(element));
      resetPointerEffects();
    }
    if (paused) {
      document.querySelectorAll('.reveal, [data-heading-enhanced]').forEach(element => element.classList.add('is-visible'));
    }
    lastPaintTime = 0;
    canvasDirty = true;
    scrollDirty = true;
    scheduleFrame();
  }

  motionToggle?.addEventListener('click', () => {
    motionPausedByUser = !motionPausedByUser;
    try { localStorage.setItem('portfolio-motion-paused', String(motionPausedByUser)); } catch { /* The current visit still retains this choice. */ }
    updateMotion();
  });
  window.addEventListener('storage', event => {
    if (event.key !== 'portfolio-motion-paused' && event.key !== null) return;
    motionPausedByUser = event.newValue === 'true';
    updateMotion();
  });

  window.addEventListener('pageshow', () => {
    layoutDirty = true;
    updateMotion();
  });
  listenToMedia(reducedMotion, updateMotion);
  listenToMedia(finePointer, resetPointerEffects);
  document.addEventListener('visibilitychange', () => {
    updateMotion();
    if (!document.hidden) updateLocalTime();
  });
  window.addEventListener('scroll', () => {
    scrollDirty = true;
    scheduleFrame();
  }, { passive: true });
  window.addEventListener('resize', () => {
    sizeCanvas();
    if (!pointerMotionAllowed()) resetPointerEffects();
    layoutDirty = true;
    scrollDirty = true;
    scheduleFrame();
  }, { passive: true });
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => {
      layoutDirty = true;
      scrollDirty = true;
      scheduleFrame();
    }).observe(document.body);
  }

  document.addEventListener('pointermove', event => {
    if (!context || !pointerMotionAllowed() || event.pointerType === 'touch') return;
    const now = performance.now();
    if (now - lastTrailTime < 28) return;
    if (lastPointer && Math.hypot(event.clientX - lastPointer.x, event.clientY - lastPointer.y) < 9) return;
    lastTrailTime = now;
    lastPointer = { x: event.clientX, y: event.clientY };
    const duration = 0.42 + Math.random() * 0.24;
    particles.push({
      x: event.clientX,
      y: event.clientY,
      vx: (Math.random() - 0.5) * 14,
      vy: -8 - Math.random() * 12,
      duration,
      life: duration
    });
    if (particles.length > 22) particles.shift();
    scheduleFrame();
  }, { passive: true });
  document.addEventListener('pointerleave', () => { lastPointer = null; });

  document.querySelectorAll('.magnetic').forEach(element => {
    element.addEventListener('pointermove', event => {
      if (!pointerMotionAllowed() || event.pointerType === 'touch') return;
      const rect = element.getBoundingClientRect();
      element.style.setProperty('--mag-x', `${clamp((event.clientX - rect.left - rect.width / 2) * 0.12, -5, 5).toFixed(1)}px`);
      element.style.setProperty('--mag-y', `${clamp((event.clientY - rect.top - rect.height / 2) * 0.12, -4, 4).toFixed(1)}px`);
    });
    element.addEventListener('pointerleave', () => {
      element.style.setProperty('--mag-x', '0px');
      element.style.setProperty('--mag-y', '0px');
    });
  });
  pointerCards.forEach(element => {
    const tilts = element.classList.contains('tilt-card');
    element.addEventListener('pointermove', event => {
      if (!pointerMotionAllowed() || event.pointerType === 'touch') return;
      const rect = element.getBoundingClientRect();
      const x = clamp((event.clientX - rect.left) / Math.max(1, rect.width), 0, 1);
      const y = clamp((event.clientY - rect.top) / Math.max(1, rect.height), 0, 1);
      if (tilts) {
        element.style.setProperty('--tilt-x', `${((0.5 - y) * 4).toFixed(2)}deg`);
        element.style.setProperty('--tilt-y', `${((x - 0.5) * 4).toFixed(2)}deg`);
      }
      element.style.setProperty('--pointer-x', `${(x * 100).toFixed(1)}%`);
      element.style.setProperty('--pointer-y', `${(y * 100).toFixed(1)}%`);
    });
    element.addEventListener('pointerleave', () => resetPointerCard(element));
    element.addEventListener('pointercancel', () => resetPointerCard(element));
  });

  const navigation = document.getElementById('site-nav');
  const menuButton = document.getElementById('menu-toggle');
  function closeMenu(restoreFocus = false) {
    navigation?.classList.remove('is-open');
    menuButton?.setAttribute('aria-expanded', 'false');
    if (restoreFocus) menuButton?.focus();
  }
  if (navigation && menuButton) {
    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') !== 'true';
      navigation.classList.toggle('is-open', open);
      menuButton.setAttribute('aria-expanded', String(open));
      if (open) navigation.querySelector('a')?.focus();
    });
    navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      const wasOpen = menuButton.getAttribute('aria-expanded') === 'true';
      closeMenu();
      if (!wasOpen) return;
      const target = document.querySelector(link.getAttribute('href'))?.querySelector('h1, h2');
      if (target) {
        // Let native fragment navigation finish before placing reading focus.
        window.requestAnimationFrame(() => {
          target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
          target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
        });
      }
    }));
    document.addEventListener('focusin', event => {
      if (!navigation.contains(event.target) && event.target !== menuButton) closeMenu();
    });
    document.addEventListener('click', event => {
      if (!navigation.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') closeMenu(true);
    });
    listenToMedia(desktop, () => { if (desktop.matches) closeMenu(); });
  }

  const systemNodes = [...document.querySelectorAll('.system-node[data-node]')];
  const systemDescription = document.getElementById('system-description');
  const systemLog = document.getElementById('system-log');
  const systemConsole = document.querySelector('.system-console');
  function showSystemConsole() {
    if (systemConsole) systemConsole.hidden = false;
    layoutDirty = true;
    scrollDirty = true;
    scheduleFrame();
  }
  const nodeDetails = {
    client: {
      description: '01 / Client — the interface where a person starts a request. This explorer illustrates how a typical application fits together.',
      log: '> GET /api/projects  →  request sent from client'
    },
    api: {
      description: '02 / API — validates a request, applies the application logic, and connects the pieces. An illustrative view of backend work.',
      log: '> API /projects  →  validate · process · respond'
    },
    database: {
      description: '03 / Database — keeps information structured and ready to retrieve. Good data design makes the rest of an application simpler.',
      log: '> database.find(projects)  →  results returned'
    },
    service: {
      description: '04 / External service — brings outside capabilities or data into an application through another API. Part of this illustrative system.',
      log: '> external.fetch()  →  data received · response composed'
    }
  };
  function selectSystemNode(node) {
    const details = nodeDetails[node.dataset.node];
    if (!details) return;
    systemNodes.forEach(button => {
      const selected = button === node;
      button.setAttribute('aria-pressed', String(selected));
      button.classList.toggle('is-active', selected);
    });
    if (systemDescription) systemDescription.textContent = details.description;
    if (systemLog) systemLog.textContent = details.log;
  }
  systemNodes.forEach(node => node.addEventListener('click', () => {
    resetRequest();
    selectSystemNode(node);
    showSystemConsole();
    if (requestAnnouncement) requestAnnouncement.textContent = nodeDetails[node.dataset.node].description;
  }));
  const selectedNode = systemNodes.find(node => node.getAttribute('aria-pressed') === 'true') || systemNodes[0];
  if (selectedNode) selectSystemNode(selectedNode);

  // A deterministic local walkthrough; this demo makes no network requests.
  const runRequestButton = document.getElementById('run-request');
  const requestState = document.getElementById('request-state');
  const requestResult = document.getElementById('request-result');
  const requestResultPanel = requestResult?.closest('.request-result');
  const requestAnnouncement = document.getElementById('request-announcement');
  const requestSteps = [...document.querySelectorAll('[data-step]')];
  const requestWires = [...document.querySelectorAll('[data-wire]')];
  let requestTimer = 0;
  let requestIndex = -1;
  const requestStages = [
    { node: 'client', wire: 'client', log: '> GET /api/projects', description: '1 / 5 · The browser asks for the project list. Follow the highlighted connection to the API.' },
    { node: 'api', wire: 'database', log: '> API · validate → read', description: '2 / 5 · The API accepts the request and asks the database for the project records.' },
    { node: 'database', wire: 'database', returning: true, log: '> Database · project records found', description: '3 / 5 · The database returns the records. Here, the sample records come from this page.' },
    { node: 'service', wire: 'service', returning: true, log: '> External API · sample metadata received', description: '4 / 5 · An external service could enrich the records. This step uses a fixed local example.' },
    { node: 'api', wire: 'client', returning: true, log: '> API → client · 200 OK', description: '5 / 5 · The API combines the records and metadata, then sends a JSON response to the browser.' }
  ];
  function resetRequest() {
    window.clearTimeout(requestTimer);
    requestIndex = -1;
    systemNodes.forEach(node => node.classList.remove('is-current', 'is-complete'));
    requestWires.forEach(wire => wire.classList.remove('is-flowing', 'is-returning'));
    requestSteps.forEach(step => { step.classList.remove('is-current', 'is-complete'); step.removeAttribute('aria-current'); });
    if (runRequestButton) { runRequestButton.disabled = false; runRequestButton.querySelector('span').textContent = 'Run a request'; }
    if (requestState) requestState.textContent = 'READY';
    if (requestResult) requestResult.textContent = '// Run a request to see its response.';
    if (requestResultPanel) requestResultPanel.hidden = true;
    layoutDirty = true;
    scrollDirty = true;
    scheduleFrame();
  }
  function finishRequest() {
    window.clearTimeout(requestTimer);
    requestIndex = -1;
    requestWires.forEach(wire => wire.classList.remove('is-flowing', 'is-returning'));
    requestSteps.forEach(step => { step.classList.remove('is-current'); step.classList.add('is-complete'); step.removeAttribute('aria-current'); });
    systemNodes.forEach(node => { node.classList.remove('is-current'); node.classList.add('is-complete'); });
    const client = systemNodes.find(node => node.dataset.node === 'client');
    if (client) selectSystemNode(client);
    if (systemLog) systemLog.textContent = '> 200 OK · response received';
    if (systemDescription) systemDescription.textContent = 'Complete. Client → API → database → external service → API → client. The sample response is ready below.';
    if (requestResult) requestResult.textContent = JSON.stringify({ status: 200, projects: document.querySelectorAll('[data-project-record]').length, metadata: 'local sample' }, null, 2);
    if (requestResultPanel) requestResultPanel.hidden = false;
    layoutDirty = true;
    scrollDirty = true;
    scheduleFrame();
    if (requestState) requestState.textContent = 'COMPLETE';
    if (runRequestButton) { runRequestButton.disabled = false; runRequestButton.querySelector('span').textContent = 'Replay request'; }
    if (requestAnnouncement) requestAnnouncement.textContent = 'Request complete. 200 OK. The local sample response contains 12 projects. Replay the request or select a node to explore.';
  }
  function advanceRequest() {
    if (!motionRunning() || requestIndex >= requestStages.length) { finishRequest(); return; }
    const stage = requestStages[requestIndex];
    const node = systemNodes.find(item => item.dataset.node === stage.node);
    if (node) selectSystemNode(node);
    systemNodes.forEach(item => item.classList.toggle('is-current', item === node));
    if (node) node.classList.add('is-complete');
    requestWires.forEach(wire => {
      wire.classList.toggle('is-flowing', wire.dataset.wire === stage.wire);
      wire.classList.toggle('is-returning', Boolean(stage.returning));
    });
    requestSteps.forEach((step, index) => {
      step.classList.toggle('is-current', index === requestIndex);
      step.classList.toggle('is-complete', index < requestIndex);
      if (index === requestIndex) step.setAttribute('aria-current', 'step');
      else step.removeAttribute('aria-current');
    });
    if (systemLog) systemLog.textContent = stage.log;
    if (systemDescription) systemDescription.textContent = stage.description;
    if (requestState) requestState.textContent = `STEP ${requestIndex + 1} / 5`;
    requestIndex += 1;
    requestTimer = window.setTimeout(advanceRequest, 1100);
  }
  runRequestButton?.addEventListener('click', () => {
    if (requestIndex >= 0) return;
    resetRequest();
    showSystemConsole();
    runRequestButton.disabled = true;
    runRequestButton.querySelector('span').textContent = 'Running…';
    if (requestResult) requestResult.textContent = '// Waiting for the response…';
    if (requestResultPanel) requestResultPanel.hidden = false;
    if (requestAnnouncement) requestAnnouncement.textContent = 'Running a local sample request through the client, API, database, and external service.';
    requestIndex = 0;
    advanceRequest();
  });
  if (runRequestButton) runRequestButton.disabled = false;
  systemNodes.forEach(node => { node.disabled = false; });

  const filterButtons = [...document.querySelectorAll('[data-project-filter]')];
  const projects = [...document.querySelectorAll('[data-project]')];
  const projectCount = document.getElementById('project-count');
  function filterProjects(filter) {
    let count = 0;
    projects.forEach(project => {
      const matches = filter === 'all' || (project.dataset.category || '').split(/\s+/).includes(filter);
      project.hidden = !matches;
      if (matches) count += 1;
    });
    filterButtons.forEach(button => {
      const selected = button.dataset.projectFilter === filter;
      button.setAttribute('aria-pressed', String(selected));
      button.classList.toggle('is-active', selected);
    });
    if (projectCount) projectCount.textContent = `${count} ${count === 1 ? 'project' : 'projects'}`;
    layoutDirty = true;
    scrollDirty = true;
    scheduleFrame();
  }
  filterButtons.forEach(button => button.addEventListener('click', () => filterProjects(button.dataset.projectFilter || 'all')));
  if (projects.length) filterProjects('all');
  document.getElementById('project-archive')?.addEventListener('toggle', () => {
    layoutDirty = true;
    scrollDirty = true;
    scheduleFrame();
  });

  const photoDialog = document.getElementById('photo-dialog');
  const photoImage = document.getElementById('photo-image');
  const photoCaption = document.getElementById('photo-caption');
  let photoTrigger = null;
  if (photoDialog && photoImage && typeof photoDialog.showModal === 'function') {
    document.querySelectorAll('[data-photo]').forEach(button => {
      button.addEventListener('click', event => {
        if (!button.dataset.photo) return;
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        photoTrigger = button;
        photoImage.src = button.dataset.photo;
        photoImage.alt = button.dataset.caption || 'Activity photograph';
        if (photoCaption) photoCaption.textContent = button.dataset.caption || '';
        if (!photoDialog.open) photoDialog.showModal();
        document.body.classList.add('photo-open');
      });
    });
    document.getElementById('photo-close')?.addEventListener('click', () => photoDialog.close());
    photoDialog.addEventListener('close', () => {
      document.body.classList.remove('photo-open');
      photoTrigger?.focus({ preventScroll: true });
    });
    photoDialog.addEventListener('click', event => {
      const bounds = photoDialog.getBoundingClientRect();
      const outside = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
      if (event.target === photoDialog && outside) photoDialog.close();
    });
  }

  // This is the existing portfolio's contact destination; only a user submit sends it.
  const contactForm = document.getElementById('contact-form');
  const formStatus = document.getElementById('form-status');
  let sending = false;
  contactForm?.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending || !contactForm.reportValidity()) return;
    sending = true;
    const submit = contactForm.querySelector('[type="submit"]');
    const submitLabel = submit?.querySelector('[data-submit-label]') || submit;
    const previousLabel = submitLabel?.textContent || 'Send message';
    if (submit) submit.disabled = true;
    if (submitLabel) submitLabel.textContent = 'Sending…';
    contactForm.setAttribute('aria-busy', 'true');
    if (formStatus) {
      formStatus.textContent = 'Sending your message…';
      formStatus.classList.remove('is-error');
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    const submittedData = new FormData(contactForm);
    const submittedSnapshot = JSON.stringify([...submittedData.entries()]);
    try {
      const response = await fetch('https://formsubmit.co/ajax/captainjahid45@gmail.com', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: submittedData,
        signal: controller.signal
      });
      const result = await response.json();
      if (!response.ok || (result.success !== true && result.success !== 'true')) throw new Error('Message not accepted');
      const hasNewEdits = JSON.stringify([...new FormData(contactForm).entries()]) !== submittedSnapshot;
      if (!hasNewEdits) contactForm.reset();
      if (formStatus) formStatus.textContent = hasNewEdits
        ? 'Your submitted message was sent. Your newer edits are still here and have not been sent.'
        : 'Message sent. Thank you for reaching out — I’ll get back to you soon.';
    } catch {
      if (formStatus) {
        formStatus.classList.add('is-error');
        formStatus.textContent = 'Your message could not be sent. Your text is still here — please retry or use the email link.';
      }
    } finally {
      window.clearTimeout(timeout);
      sending = false;
      contactForm.removeAttribute('aria-busy');
      if (submit) submit.disabled = false;
      if (submitLabel) submitLabel.textContent = previousLabel;
    }
  });

  const copyButton = document.getElementById('copy-email');
  const copyStatus = document.getElementById('copy-status');
  copyButton?.addEventListener('click', async () => {
    const email = 'mohammadjahidulhasan@icloud.com';
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(email);
      if (copyStatus) copyStatus.textContent = 'Email address copied.';
    } catch {
      if (copyStatus) copyStatus.textContent = 'Copy unavailable. Opening your email app.';
      window.location.href = `mailto:${email}`;
    }
  });

  const localTime = document.getElementById('local-time');
  function updateLocalTime() {
    if (!localTime) return;
    localTime.textContent = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).format(new Date());
  }
  updateLocalTime();
  window.setInterval(() => { if (!document.hidden) updateLocalTime(); }, 60000);

  // Keep the original inline markup and heading semantics while masking each line.
  const revealHeadings = [...document.querySelectorAll('[data-heading-reveal]')];
  revealHeadings.forEach(heading => {
    if (heading.hasAttribute('data-heading-enhanced')) return;
    const groups = [[]];
    [...heading.childNodes].forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'BR') groups.push([]);
      else groups[groups.length - 1].push(node);
    });
    const fragment = document.createDocumentFragment();
    groups.forEach((nodes, index) => {
      const line = document.createElement('span');
      const inner = document.createElement('span');
      line.className = 'heading-line';
      inner.className = 'heading-line-inner';
      line.style.setProperty('--line-index', String(index));
      inner.style.setProperty('--line-index', String(index));
      inner.append(...nodes);
      line.append(inner);
      // The wrappers provide visual line breaks; text spacing preserves the name
      // exposed to assistive technology and a readable plain-text selection.
      if (index) fragment.append(document.createTextNode(' '));
      fragment.append(line);
    });
    heading.replaceChildren(fragment);
    heading.setAttribute('data-heading-enhanced', '');
  });

  document.querySelectorAll('.capability-grid, .selected-pair, .awards-column, .sports-spread, .impact-strip').forEach(group => {
    [...group.children].filter(element => element.matches('.reveal:not(.award-heading)')).forEach((element, index) => {
      element.style.setProperty('--reveal-delay', `${Math.min(index * 70, 210)}ms`);
    });
  });

  // Register all observers before opting into CSS that hides unrevealed elements.
  // Without JavaScript or IntersectionObserver, the whole page stays readable.
  if (typeof window.IntersectionObserver === 'function') {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        if (entry.target.hasAttribute('data-count')) startCounter(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -28px 0px' });
    const observed = new Set([...document.querySelectorAll('.reveal'), ...revealHeadings, ...counterElements]);
    observed.forEach(element => observer.observe(element));
    // Stop decorative CSS animations when their section is outside the viewport.
    const motionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.target.classList.toggle('motion-offscreen', !entry.isIntersecting));
    }, { rootMargin: '80px' });
    document.querySelectorAll('.hero-identity,.system-explorer,.marquee,.flagship,.project-tile,.capability,.award,.community-visual,.scroll-cue').forEach(element => motionObserver.observe(element));
    root.classList.add('motion-ready');
  } else {
    document.querySelectorAll('.reveal, [data-heading-enhanced]').forEach(element => element.classList.add('is-visible'));
    counterElements.forEach(finishCounter);
  }

  document.fonts?.ready.then(() => { layoutDirty = true; scrollDirty = true; scheduleFrame(); });
  root.classList.add('js-enabled');
  sizeCanvas();
  updateScroll();
  updateMotion();
})();
