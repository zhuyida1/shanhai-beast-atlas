/* Share the original atlas navigation effect without changing page content. */
(() => {
  'use strict';
  if (window.ShanhaiNavigationFlow) return;
  const svgNS = 'http://www.w3.org/2000/svg';
  const preferenceKey = 'shanhai-nav-motion-paused';
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const frames = [];
  let paused = false, queued = 0;
  try { paused = localStorage.getItem(preferenceKey) === '1'; } catch (_) { /* Optional preference. */ }

  function anchor(element) {
    if (getComputedStyle(element).position === 'static') element.classList.add('nav-flow-anchor');
  }

  // Keep the original links and leave existing page-owned menu controllers alone.
  document.querySelectorAll('header .nav-menu, .beasts-header .main-nav').forEach((menu, index) => {
    const header = menu.closest('header');
    const compact = matchMedia('(max-width:1000px)');
    anchor(header);
    menu.classList.add('nav-flow-compact-menu');
    if (!menu.id) menu.id = 'nav-flow-menu-' + index;
    const toggle = document.createElement('button');
    toggle.className = 'nav-flow-menu-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-controls', menu.id);
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<span>目录</span><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 6h18M3 12h18M3 18h18"/></svg>';
    menu.after(toggle);
    const close = (focus = false) => {
      header.classList.remove('nav-flow-menu-open');
      toggle.setAttribute('aria-expanded', 'false');
      if (focus) toggle.focus();
    };
    const layout = () => { toggle.hidden = !compact.matches; close(); };
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      header.classList.toggle('nav-flow-menu-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      if (open) menu.querySelector('a')?.focus();
    });
    menu.addEventListener('click', event => { if (event.target.closest('a')) close(); });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') close(true);
    });
    document.addEventListener('click', event => {
      if (!menu.contains(event.target) && !toggle.contains(event.target)) close();
    });
    document.addEventListener('focusin', event => {
      if (!menu.contains(event.target) && !toggle.contains(event.target)) close();
    });
    compact.addEventListener('change', layout);
    layout();
  });

  const hosts = [...document.querySelectorAll('header nav[aria-label="主导航"], header nav[aria-label="移动端主导航"], header button[aria-controls]')];
  if (!hosts.length) return;
  for (const host of hosts) {
    anchor(host);
    host.classList.add('nav-flow-host');
    const frame = document.createElement('span');
    frame.className = 'nav-flow-frame';
    frame.setAttribute('aria-hidden', 'true');
    const svg = document.createElementNS(svgNS, 'svg');
    svg.classList.add('nav-flow-svg');
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('preserveAspectRatio', 'none');
    for (const name of ['nav-flow-trail', 'nav-flow-tip']) {
      const path = document.createElementNS(svgNS, 'path');
      path.classList.add(name);
      path.setAttribute('pathLength', '100');
      svg.append(path);
    }
    frame.append(svg);
    host.append(frame);
    for (const link of host.querySelectorAll(':scope > a:is([aria-current="page"], .is-current, .active)')) {
      link.classList.add('nav-flow-current');
      const sheen = document.createElement('span');
      sheen.className = 'nav-flow-sheen';
      sheen.setAttribute('aria-hidden', 'true');
      link.append(sheen);
    }
    frames.push({host, frame, svg});
  }

  const control = document.createElement('button');
  control.className = 'nav-flow-control';
  control.type = 'button';
  control.setAttribute('aria-label', '导航金边与扫光动态效果');
  const footer = document.querySelector('footer');
  (footer?.querySelector('.footer-content, .habitat-shell, .site-shell.copyright, .copyright') || footer || document.body).append(control);

  function sync() {
    const mapState = document.body.dataset.habitatMotion;
    const enabled = !paused && !reduced.matches && !document.hidden &&
      !['paused', 'reduced', 'hidden'].includes(mapState);
    for (const {host, frame} of frames) {
      const box = host.getBoundingClientRect();
      const visible = box.width > 0 && box.height > 0 && box.bottom > 0 && box.top < innerHeight &&
        box.right > 0 && box.left < innerWidth && getComputedStyle(host).visibility !== 'hidden';
      frame.dataset.running = String(enabled && visible);
      host.dataset.navFlowRunning = frame.dataset.running;
    }
    const mapPaused = mapState === 'paused';
    control.disabled = reduced.matches || mapPaused;
    control.setAttribute('aria-pressed', String(!paused && !reduced.matches && !mapPaused));
    control.textContent = reduced.matches ? '导航动效已减少' : mapPaused ? '导航动效已随地图暂停' : paused ? '开启导航动效' : '暂停导航动效';
  }

  function pathFor(width, height, style) {
    const inset = 1, w = Math.max(1, width - inset * 2), h = Math.max(1, height - inset * 2);
    const radius = (value, size) => {
      const number = parseFloat(value) || 0;
      return Math.max(0, value.includes('%') ? number / 100 * size - inset : number - inset);
    };
    const corners = ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius'].map(key => {
      const [x, y = x] = style[key].split(' ');
      return [radius(x, width), radius(y, height)];
    });
    const [tl, tr, br, bl] = corners;
    const scale = Math.min(1, w / (tl[0] + tr[0] || 1), w / (bl[0] + br[0] || 1), h / (tl[1] + bl[1] || 1), h / (tr[1] + br[1] || 1));
    corners.forEach(c => { c[0] *= scale; c[1] *= scale; });
    const left = inset, top = inset, right = width - inset, bottom = height - inset;
    const turn = (corner, x, y) => corner[0] && corner[1] ? `A${corner[0]} ${corner[1]} 0 0 1 ${x} ${y}` : `L${x} ${y}`;
    return `M${left + tl[0]} ${top}H${right - tr[0]}${turn(tr, right, top + tr[1])}V${bottom - br[1]}${turn(br, right - br[0], bottom)}H${left + bl[0]}${turn(bl, left, bottom - bl[1])}V${top + tl[1]}${turn(tl, left + tl[0], top)}Z`;
  }
  function update() {
    queued = 0;
    for (const {host, frame, svg} of frames) {
      const {width, height} = host.getBoundingClientRect();
      frame.hidden = !width || !height;
      if (frame.hidden) continue;
      const style = getComputedStyle(host);
      frame.style.left = host.scrollLeft - (parseFloat(style.borderLeftWidth) || 0) + 'px';
      frame.style.top = host.scrollTop - (parseFloat(style.borderTopWidth) || 0) + 'px';
      frame.style.width = width + 'px';
      frame.style.height = height + 'px';
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      const shape = pathFor(width, height, style);
      for (const path of svg.children) path.setAttribute('d', shape);
    }
    sync();
  }
  function schedule() { if (!queued) queued = requestAnimationFrame(update); }
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(schedule);
    frames.forEach(({host}) => observer.observe(host));
  }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(sync);
    frames.forEach(({host}) => observer.observe(host));
  }
  const stateObserver = new MutationObserver(schedule);
  document.querySelectorAll('header, header nav, header button').forEach(host =>
    stateObserver.observe(host, {attributes:true, attributeFilter:['class', 'hidden', 'aria-expanded']}));
  stateObserver.observe(document.body, {attributes:true, attributeFilter:['data-habitat-motion']});
  frames.forEach(({host}) => host.addEventListener('scroll', schedule, {passive:true}));
  window.addEventListener('resize', schedule);
  window.addEventListener('scroll', sync, {passive:true});
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pageshow', schedule);
  window.addEventListener('pagehide', () => {
    for (const {host, frame} of frames) {
      frame.dataset.running = 'false';
      host.dataset.navFlowRunning = 'false';
    }
  });
  reduced.addEventListener('change', sync);
  control.addEventListener('click', () => {
    paused = !paused;
    try { localStorage.setItem(preferenceKey, paused ? '1' : '0'); } catch (_) { /* Optional preference. */ }
    sync();
  });
  window.addEventListener('storage', event => {
    if (event.key !== preferenceKey && event.key !== null) return;
    paused = event.key !== null && event.newValue === '1';
    sync();
  });
  document.fonts?.ready.then(schedule);
  window.ShanhaiNavigationFlow = {refresh:schedule};
  update();
})();
