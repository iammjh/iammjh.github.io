'use strict';

// A decorative follower; the browser draws the actual pointer at its exact hotspot.
(() => {
  const enabled = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) and (forced-colors: none)');
  const reticle = document.createElement('div');
  reticle.className = 'cursor-reticle';
  reticle.setAttribute('aria-hidden', 'true');
  document.body.append(reticle);
  let frame = 0;
  let visible = false;
  let targetDirty = false;
  let target = null;
  let x = 0;
  let y = 0;
  let drawnX = 0;
  let drawnY = 0;
  let lastTime = 0;

  function hide() {
    cancelAnimationFrame(frame);
    frame = 0;
    visible = false;
    target = null;
    reticle.classList.remove('is-visible', 'is-link', 'is-pressed');
  }

  function render(now) {
    frame = 0;
    if (!enabled.matches || document.hidden) { hide(); return; }
    if (targetDirty) {
      targetDirty = false;
      target = document.elementFromPoint(x, y);
      const cursor = target ? getComputedStyle(target).cursor : '';
      // Text entry, resizing, disabled controls, and dialogs need no trailing brackets.
      const isLink = cursor.includes('cursor-link.svg');
      if ((!isLink && !cursor.includes('cursor-precision.svg')) || target.closest('dialog[open]')) { hide(); return; }
      reticle.classList.toggle('is-link', isLink);
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
    lastTime = now;
    // Stop scheduling as soon as the follower catches up.
    if (!settled) schedule();
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(render);
  }

  function move(event) {
    if (event.pointerType !== 'mouse' || !enabled.matches || document.hidden) { hide(); return; }
    x = event.clientX;
    y = event.clientY;
    if (event.target !== target || !visible) targetDirty = true;
    schedule();
  }

  document.addEventListener('pointermove', move, { passive: true });
  document.addEventListener('pointerover', move, { passive: true });
  document.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse') { hide(); return; }
    reticle.classList.toggle('is-pressed', event.button === 0 && visible);
  }, { passive: true });
  document.addEventListener('pointerup', () => reticle.classList.remove('is-pressed'), { passive: true });
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
})();
