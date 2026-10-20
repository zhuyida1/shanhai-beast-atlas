/* One continuous gold highlight follows the actual border with a softly fading tail. */
(() => {
  'use strict';
  if (window.ShanhaiNavigationFlow) return;
  const svgNS = 'http://www.w3.org/2000/svg';
  const preferenceKey = 'shanhai-nav-motion-paused';
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const hosts = [...document.querySelectorAll('header nav, header button[aria-controls], [data-nav-flow]')];
  if (!hosts.length) return;
  const frames = [];
  let paused = false, queued = 0, motionTick = 0;
  try { paused = localStorage.getItem(preferenceKey) === '1'; } catch (_) { /* Optional preference. */ }

  function anchor(element) {
    if (getComputedStyle(element).position === 'static') element.classList.add('nav-flow-anchor');
  }

  function mount(host) {
    anchor(host);
    host.classList.add('nav-flow-host');
    const frame = document.createElement('span');
    frame.className = 'nav-flow-frame';
    frame.setAttribute('aria-hidden', 'true');
    const svg = document.createElementNS(svgNS, 'svg');
    svg.classList.add('nav-flow-svg');
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('preserveAspectRatio', 'none');
    // A single continuous stroke avoids joins or beads in the fading tail.
    const defs = document.createElementNS(svgNS, 'defs');
    const gradient = document.createElementNS(svgNS, 'linearGradient');
    gradient.id = 'nav-flow-gradient-' + frames.length;
    gradient.setAttribute('gradientUnits', 'userSpaceOnUse');
    [[0,0],[.12,.06],[.46,.3],[.82,.8],[.96,1],[1,1]].forEach(([offset, opacity]) => {
      const stop = document.createElementNS(svgNS, 'stop');
      stop.setAttribute('offset', offset);
      stop.setAttribute('stop-color', '#c99848');
      stop.setAttribute('stop-opacity', opacity);
      gradient.append(stop);
    });
    defs.append(gradient);
    svg.append(defs);
    const path = document.createElementNS(svgNS, 'path');
    path.classList.add('nav-flow-beam', 'nav-flow-head');
    path.setAttribute('pathLength', '1000');
    path.setAttribute('stroke-width', '1.6');
    path.style.stroke = `url(#${gradient.id})`;
    svg.append(path);
    const paths = [path];
    frame.append(svg);
    host.append(frame);
    frames.push({host, frame, svg, paths, gradient, perimeter:0, duration:8000, tailLength:0, headLength:0});
  }
  hosts.forEach(mount);

  const control = document.createElement('button');
  control.className = 'nav-flow-control';
  control.type = 'button';
  control.setAttribute('aria-label', '导航流光动态效果');
  const footer = document.querySelector('footer');
  (footer?.querySelector('.footer-content, .habitat-shell, .site-shell.copyright, .copyright') || footer || document.body).append(control);

  function permitted() {
    return !paused && !reduced.matches && !document.hidden &&
      !['paused', 'reduced', 'hidden'].includes(document.body.dataset.habitatMotion);
  }
  function sync() {
    const running = permitted();
    for (const {host, frame} of frames) {
      const box = host.getBoundingClientRect();
      frame.dataset.running = String(running && box.width > 0 && box.height > 0 &&
        box.bottom > 0 && box.top < innerHeight && getComputedStyle(host).visibility !== 'hidden');
    }
    const mapPaused = document.body.dataset.habitatMotion === 'paused';
    control.disabled = reduced.matches || mapPaused;
    control.setAttribute('aria-pressed', String(!paused && !reduced.matches && !mapPaused));
    control.textContent = reduced.matches ? '导航流光已减少' : mapPaused ? '导航流光已随地图暂停' : paused ? '开启导航流光' : '暂停导航流光';
    if (frames.some(({frame}) => frame.dataset.running === 'true')) {
      if (!motionTick) followHighlight();
    } else {
      cancelAnimationFrame(motionTick);
      motionTick = 0;
    }
  }

  // Match the fade to the moving stroke, including turns. Only visible, running
  // navigation is updated; native CSS owns timing and pause/resume continuity.
  function followHighlight() {
    motionTick = 0;
    let active = false;
    for (const {frame, paths:[path], gradient, perimeter, duration, tailLength, headLength} of frames) {
      if (frame.dataset.running !== 'true' || !perimeter) continue;
      active = true;
      const time = Number(path.getAnimations()[0]?.currentTime) || 0;
      const head = perimeter * (.18 + time / duration % 1);
      const at = length => path.getPointAtLength((length % perimeter + perimeter) % perimeter);
      const start = at(head - tailLength), end = at(head + headLength);
      gradient.setAttribute('x1', start.x);
      gradient.setAttribute('y1', start.y);
      gradient.setAttribute('x2', end.x);
      gradient.setAttribute('y2', end.y);
    }
    if (active) motionTick = requestAnimationFrame(followHighlight);
  }

  function pathFor(width, height, style) {
    const inset = .75, w = Math.max(1, width - inset * 2), h = Math.max(1, height - inset * 2);
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
    for (const entry of frames) {
      const {host, frame, svg, paths} = entry;
      const {width, height} = host.getBoundingClientRect();
      frame.hidden = !width || !height;
      if (frame.hidden) continue;
      const style = getComputedStyle(host);
      const shape = pathFor(width, height, style);
      // Absolute children start at the padding edge; align the light with the outer border.
      frame.style.left = host.scrollLeft - (parseFloat(style.borderLeftWidth) || 0) + 'px';
      frame.style.top = host.scrollTop - (parseFloat(style.borderTopWidth) || 0) + 'px';
      frame.style.width = width + 'px';
      frame.style.height = height + 'px';
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      paths.forEach(path => path.setAttribute('d', shape));
      const perimeter = paths[0].getTotalLength();
      // Keep the luminous portion slender even on long dropdowns or small buttons.
      entry.perimeter = perimeter;
      entry.tailLength = Math.min(140, perimeter * .17);
      entry.headLength = Math.min(4, perimeter * .015);
      entry.duration = Math.max(5, Math.min(9, perimeter / 145)) * 1000;
      svg.style.setProperty('--nav-flow-duration', entry.duration / 1000 + 's');
      const length = (entry.tailLength + entry.headLength) / perimeter * 1000;
      paths[0].setAttribute('stroke-dasharray', `${length} ${1000 - length}`);
      paths[0].style.setProperty('--nav-flow-offset', -(180 - entry.tailLength / perimeter * 1000) + 'px');
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
    frames.forEach(({frame}) => { frame.dataset.running = 'false'; });
    cancelAnimationFrame(motionTick);
    motionTick = 0;
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
