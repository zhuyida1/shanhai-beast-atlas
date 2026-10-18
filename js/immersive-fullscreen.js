/* Local static homepage; no shared-page dependencies. */
(() => {
  'use strict';
  const scenes = {
    fox: { name: '九尾狐', place: '青丘之山', quote: '有兽焉，其状如狐而九尾。', source: '《山海经·南山经》', href: 'beast-detail.html' },
    phoenix: { name: '凤凰', place: '丹穴之山', quote: '有鸟焉，其状如鸡，五采而文，名曰凤凰。', source: '《山海经·南山经》', href: 'beast-fenghuang.html' }
  };
  const choices = [...document.querySelectorAll('.scene-choice')];
  choices.forEach(button => button.addEventListener('click', () => {
    const scene = scenes[button.dataset.scene];
    if (!scene) return;
    document.querySelectorAll('.hero-painting').forEach(image => image.classList.toggle('is-active', image.id === `painting-${button.dataset.scene}`));
    choices.forEach(choice => {
      const selected = choice === button;
      choice.classList.toggle('is-selected', selected);
      choice.setAttribute('aria-pressed', String(selected));
    });
    document.getElementById('scene-name').textContent = scene.name;
    document.getElementById('scene-location').textContent = scene.place;
    document.getElementById('scene-quote').textContent = scene.quote;
    document.getElementById('scene-source').textContent = scene.source;
    document.getElementById('scene-link').href = scene.href;
  }));

  const toggle = document.querySelector('.menu-toggle');
  const menu = document.getElementById('mobile-menu');
  const narrow = matchMedia('(max-width: 760px)');
  const closeMenu = () => { toggle.setAttribute('aria-expanded', 'false'); menu.hidden = true; };
  const syncMenu = () => { toggle.hidden = !narrow.matches; closeMenu(); };
  syncMenu();
  narrow.addEventListener('change', syncMenu);
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !menu.hidden) { closeMenu(); toggle.focus(); }
  });
  document.addEventListener('click', event => {
    if (!menu.hidden && !menu.contains(event.target) && !toggle.contains(event.target)) closeMenu();
  });
  // The HTML noscript navigation keeps all destinations reachable without JS.
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        if (!reduced.matches) entry.target.classList.add('enter-view');
        observer.unobserve(entry.target);
      });
    }, { threshold: .12 });
    document.querySelectorAll('.section-heading, .exhibit, .reading-title, .reading-list, .footer-closing').forEach(element => observer.observe(element));
  }
})();
