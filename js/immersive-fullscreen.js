/* Local static homepage; no shared-page dependencies. */
(() => {
  'use strict';
  const scenes = {
    fox: { name: '九尾狐', place: '青丘之山', quote: '有兽焉，其状如狐而九尾。', source: '《山海经·南山经》', href: 'beast-detail.html' },
    phoenix: { name: '凤凰', place: '丹穴之山', quote: '有鸟焉，其状如鸡，五采而文，名曰凤凰。', source: '《山海经·南山经》', href: 'beast-fenghuang.html' }
  };
  const choices = [...document.querySelectorAll('.scene-choice')];
  const hero = document.querySelector('.scroll-hero');
  const paintings = document.querySelector('.hero-paintings');
  const video = document.getElementById('painting-fox');
  const poster = document.getElementById('fox-poster');
  const phoenix = document.getElementById('painting-phoenix');
  const motionButton = document.querySelector('.motion-toggle');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let currentScene = 'fox';
  let pausedByUser = false;
  let heroVisible = true;
  let videoFailed = false;
  let playRequest = 0;

  const canPlay = () => currentScene === 'fox' && heroVisible && !document.hidden && !reduced.matches && !pausedByUser && !videoFailed;
  const updateMotionButton = () => {
    motionButton.hidden = currentScene !== 'fox' || reduced.matches || videoFailed;
    const label = pausedByUser ? '播放画卷动态' : '暂停画卷动态';
    motionButton.setAttribute('aria-label', label);
    motionButton.setAttribute('title', label);
    motionButton.setAttribute('aria-pressed', String(pausedByUser));
    motionButton.firstElementChild.textContent = pausedByUser ? '▷' : 'Ⅱ';
  };
  // Keep a separate poster visible until a frame has actually started playing.
  const syncVideo = () => {
    const request = ++playRequest;
    updateMotionButton();
    poster.classList.toggle('is-active', currentScene === 'fox');
    phoenix.classList.toggle('is-active', currentScene === 'phoenix');
    if (!canPlay()) {
      video.pause();
      if (currentScene !== 'fox' || reduced.matches || videoFailed) video.classList.remove('is-active');
      return;
    }
    video.play().then(() => {
      if (request === playRequest && canPlay()) video.classList.add('is-active');
    }).catch(() => {
      if (request !== playRequest) return;
      video.classList.remove('is-active');
      pausedByUser = true;
      updateMotionButton();
    });
  };
  const onVideoError = () => {
    videoFailed = true;
    video.classList.remove('is-active');
    syncVideo();
  };
  video.addEventListener('error', onVideoError);
  video.querySelector('source').addEventListener('error', onVideoError);
  motionButton.addEventListener('click', () => { pausedByUser = !pausedByUser; syncVideo(); });
  choices.forEach(button => button.addEventListener('click', () => {
    const scene = scenes[button.dataset.scene];
    if (!scene) return;
    currentScene = button.dataset.scene;
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
    syncVideo();
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
  let ticking = false;
  const updateParallax = () => {
    const distance = Math.min(Math.max(window.scrollY, 0), hero.offsetHeight);
    paintings.style.transform = reduced.matches || narrow.matches ? '' : `translateY(${distance * .09}px)`;
    ticking = false;
  };
  const queueParallax = () => {
    if (!ticking && heroVisible) { ticking = true; requestAnimationFrame(updateParallax); }
  };
  window.addEventListener('scroll', queueParallax, { passive: true });
  window.addEventListener('resize', updateParallax);
  reduced.addEventListener('change', () => { updateParallax(); syncVideo(); });
  document.addEventListener('visibilitychange', syncVideo);
  if ('IntersectionObserver' in window) {
    const heroObserver = new IntersectionObserver(entries => {
      heroVisible = entries[0].isIntersecting;
      updateParallax();
      syncVideo();
    }, { threshold: 0 });
    heroObserver.observe(hero);
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        if (!reduced.matches) entry.target.classList.add('enter-view');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: .12 });
    document.querySelectorAll('.section-heading h2, .section-heading p, .section-heading .text-link, .exhibit, .reading-title, .reading-list h3, .reading-list > a, .footer-closing').forEach(element => revealObserver.observe(element));
  }
  syncVideo();
})();
