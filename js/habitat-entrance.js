/* Only the map introduction text uses the catalogue's fade-and-rise entrance. */
(() => {
  'use strict';
  const page = document.body;
  if (!page.classList.contains('habitat-page') ||
      !('IntersectionObserver' in window) || typeof Element.prototype.animate !== 'function') return;

  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const enabled = () => !reduced.matches && !document.hidden &&
    (!page.dataset.habitatMotion || page.dataset.habitatMotion === 'on');
  if (!enabled()) return;

  const pending = new Map();
  const running = new Map();
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const target = entry.target, options = pending.get(target);
      if (!options) continue;
      observer.unobserve(target);
      pending.delete(target);
      if (!enabled()) continue;
      const animation = target.animate([
        {opacity:0, transform:`translateY(${options.distance}px)`},
        {opacity:1, transform:'translateY(0)'}
      ], {duration:options.duration, delay:options.delay, easing:'ease-out', fill:'backwards'});
      animation.id = 'habitat-entrance';
      running.set(target, animation);
      animation.onfinish = () => {
        running.delete(target);
        animation.cancel(); // Return text to its normal layout after entering.
      };
    }
  }, {threshold:0, rootMargin:'0px 0px -24px 0px'});

  function watch(selector, delay = 0, distance = 30, duration = 800) {
    document.querySelectorAll(selector).forEach(target => {
      const rect = target.getBoundingClientRect();
      const visible = rect.bottom > 0 && rect.top < innerHeight - 24;
      pending.set(target, {delay:visible ? delay : 0, distance, duration});
      observer.observe(target);
    });
  }

  watch('.habitat-intro .habitat-breadcrumb');
  watch('#atlas-title', 200);
  watch('.intro-copy > p, .intro-note', 400);

  // Content is visible by default. Pausing or leaving the page settles every reveal.
  function settle() {
    observer.disconnect();
    pending.clear();
    for (const animation of running.values()) animation.cancel();
    running.clear();
    stateObserver.disconnect();
  }
  const stateObserver = new MutationObserver(() => { if (!enabled()) settle(); });
  stateObserver.observe(page, {attributes:true, attributeFilter:['data-habitat-motion']});
  reduced.addEventListener('change', () => { if (reduced.matches) settle(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) settle(); });
  window.addEventListener('pagehide', settle, {once:true});

  // A control becomes fully visible as soon as it receives focus or a pointer.
  function revealControl(event) {
    for (const target of pending.keys()) if (target.contains(event.target)) {
      observer.unobserve(target);
      pending.delete(target);
    }
    for (const [target, animation] of running) if (target.contains(event.target)) {
      animation.cancel();
      running.delete(target);
    }
  }
  document.addEventListener('focusin', revealControl);
  document.addEventListener('pointerdown', revealControl, {passive:true});
})();
