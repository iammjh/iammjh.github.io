'use strict';

// A decorative follower; the browser draws the actual pointer at its exact hotspot.
(() => {
  const enabled = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) and (forced-colors: none)');
  const root = document.documentElement;
  const reticle = document.createElement('div');
  reticle.className = 'cursor-reticle';
  reticle.setAttribute('aria-hidden', 'true');
  document.body.append(reticle);
  let frame = 0;
  let visible = false;
  let targetDirty = false;
  let target = null;
  let pointerButtons = 0;
  let pressed = false;
  let selecting = false;
  let x = 0;
  let y = 0;
  let drawnX = 0;
  let drawnY = 0;
  let lastTime = 0;

  function canAnimate() {
    return enabled.matches && !document.hidden && !root.classList.contains('motion-paused');
  }

  function hide() {
    cancelAnimationFrame(frame);
    frame = 0;
    visible = false;
    target = null;
    targetDirty = false;
    pressed = false;
    reticle.classList.remove('is-visible', 'is-link', 'is-pressed');
  }

  function cursorRole(element) {
    if (!element || element.closest('input, textarea, select, option, video, iframe, dialog, [role="dialog"], [role="alertdialog"], :disabled, [aria-disabled="true"], [inert], [contenteditable]:not([contenteditable="false"])')) return null;
    const cursor = getComputedStyle(element).cursor;
    const fallback = cursor.slice(cursor.lastIndexOf(',') + 1).trim();
    // Keep the browser's I-beam, resize handles, and other native cursors unobstructed.
    if (cursor.includes('cursor-text.svg') || fallback === 'text' || fallback === 'vertical-text' || fallback.endsWith('resize')) return null;
    if (cursor.includes('cursor-link.svg')) return 'link';
    if (cursor.includes('cursor-precision.svg')) return 'default';
    return null;
  }

  function render(now) {
    frame = 0;
    if (!canAnimate() || (pointerButtons !== 0 && selecting)) { hide(); return; }
    if (targetDirty) {
      targetDirty = false;
      target = document.elementFromPoint(x, y);
      const role = cursorRole(target);
      if (!role) { hide(); return; }
      reticle.classList.toggle('is-link', role === 'link');
    }
    if (!visible) {
      drawnX = x;
      drawnY = y;
      visible = true;
    } else {
      const ease = 1 - Math.exp(-Math.min(now - lastTime, 64) / 45);
      drawnX += (x - drawnX) * ease;
      drawnY += (y - drawnY) * ease;
    }
    const settled = Math.hypot(x - drawnX, y - drawnY) < .1;
    if (settled) { drawnX = x; drawnY = y; }
    reticle.style.transform = `translate3d(${drawnX.toFixed(2)}px, ${drawnY.toFixed(2)}px, 0)`;
    reticle.classList.add('is-visible');
    reticle.classList.toggle('is-pressed', pressed);
    lastTime = now;
    // Stop scheduling as soon as the follower catches up.
    if (!settled) schedule();
  }

  function schedule() {
    if (!canAnimate()) { hide(); return; }
    if (!frame) frame = requestAnimationFrame(render);
  }

  function move(event) {
    if (event.pointerType !== 'mouse' || !canAnimate()) { hide(); return; }
    pointerButtons = event.buttons;
    // A completed selection may stay highlighted; normal pointer movement resumes the halo.
    if (pointerButtons === 0) selecting = false;
    if (selecting) { hide(); return; }
    x = event.clientX;
    y = event.clientY;
    // Recheck computed cursors even when a control changes without changing DOM targets.
    targetDirty = true;
    schedule();
  }

  document.addEventListener('pointermove', move, { passive: true });
  document.addEventListener('pointerover', move, { passive: true });
  document.addEventListener('pointerdown', event => {
    move(event);
    pressed = event.button === 0 && event.pointerType === 'mouse' && canAnimate();
    reticle.classList.toggle('is-pressed', pressed && visible);
  }, { passive: true });
  document.addEventListener('pointerup', event => {
    pointerButtons = event.buttons;
    pressed = false;
    reticle.classList.remove('is-pressed');
  }, { passive: true });
  document.addEventListener('selectionchange', () => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      selecting = true;
      hide();
    }
  });
  document.addEventListener('pointerleave', hide);
  document.addEventListener('pointercancel', hide);
  document.addEventListener('dragstart', hide);
  document.addEventListener('keydown', hide);
  document.addEventListener('visibilitychange', hide);
  window.addEventListener('blur', hide);
  window.addEventListener('pagehide', hide);
  window.addEventListener('resize', hide, { passive: true });
  window.addEventListener('scroll', () => {
    if (!visible) return;
    targetDirty = true;
    schedule();
  }, { passive: true, capture: true });
  // A click can disable a control or open a photo dialog without moving the mouse.
  document.addEventListener('click', () => {
    if (!visible) return;
    targetDirty = true;
    schedule();
  });
  if (enabled.addEventListener) enabled.addEventListener('change', hide);
  else enabled.addListener(hide);
  // The manual motion control must also stop a follower that has already settled.
  new MutationObserver(() => {
    if (!canAnimate()) hide();
  }).observe(root, { attributes: true, attributeFilter: ['class'] });
})();
