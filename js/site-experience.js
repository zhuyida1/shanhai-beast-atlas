/* Progressive enhancements shared by the public pages. No network dependencies. */
(() => {
  'use strict';
  const main = document.querySelector('main');
  if (!main) return;
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const storage = {
    get(key) { try { return JSON.parse(sessionStorage.getItem(key)); } catch (_) { return null; } },
    set(key,value) { try { sessionStorage.setItem(key,JSON.stringify(value)); } catch (_) { /* Optional browsing memory. */ } }
  };
  if (!document.querySelector('.skip-link,.habitat-skip,.site-skip')) {
    if (!main.id) main.id = 'main';
    const skip = document.createElement('a');
    skip.className = 'site-skip'; skip.href = '#' + main.id; skip.textContent = '跳至主要内容';
    document.body.prepend(skip);
  }
  document.querySelectorAll('img').forEach(image => {
    if (!image.hasAttribute('decoding')) image.decoding = 'async';
  });
  const top = document.createElement('button');
  top.className = 'site-top'; top.type = 'button'; top.textContent = '↑'; top.hidden = true;
  top.setAttribute('aria-label','返回页面顶部'); top.title = '返回顶部';
  document.body.append(top);
  top.addEventListener('click',() => {
    const target = document.querySelector('h1') || main;
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex','-1');
    target.focus({preventScroll:true});
    window.scrollTo({top:0,behavior:reduced.matches?'instant':'smooth'});
  });
  let progress;
  if (!document.querySelector('.read-progress') && document.querySelector('.reading-content,.note-article')) {
    const track = document.createElement('div'); track.className = 'site-progress'; track.setAttribute('aria-hidden','true');
    progress = document.createElement('span'); track.append(progress); document.body.append(track);
  }
  let frame = 0;
  const draw = () => {
    frame = 0; top.hidden = scrollY < 600;
    if (progress) { const height = document.documentElement.scrollHeight-innerHeight; progress.style.transform = `scaleX(${height>0?Math.min(1,Math.max(0,scrollY/height)):0})`; }
  };
  const schedule = () => { if (!frame) frame=requestAnimationFrame(draw); };
  addEventListener('scroll',schedule,{passive:true}); addEventListener('resize',schedule); addEventListener('pageshow',schedule); draw();

  const file = location.pathname.split('/').pop() || 'index.html';
  const listPage = ['beasts.html','classics.html'].includes(file);
  const key = 'shanhai-list:' + file;
  if (listPage) {
    const save = () => storage.set(key,{url:file+location.search,y:scrollY});
    addEventListener('pagehide',save);
    const saved = storage.get(key);
    const returning = storage.get('shanhai-return:'+file);
    storage.set('shanhai-return:'+file,false);
    const navigation = performance.getEntriesByType('navigation')[0];
    if (saved && saved.url === file+location.search && (returning || navigation?.type === 'back_forward' || document.referrer.includes('beast-') || document.referrer.includes('article.html'))) {
      const restore = () => requestAnimationFrame(()=>requestAnimationFrame(()=>window.scrollTo({top:saved.y,behavior:'instant'})));
      // Restore after load so browser navigation and image layout cannot reset it.
      if (document.readyState === 'complete') restore();
      else addEventListener('pageshow',restore,{once:true});
    }
  } else {
    for (const list of ['beasts.html','classics.html']) {
      const saved = storage.get('shanhai-list:'+list);
      if (!saved || typeof saved.url !== 'string' || !saved.url.startsWith(list+'?')) continue;
      document.querySelectorAll(`main a[href="${list}"],footer .back-link[href="${list}"]`).forEach(link => {
        link.href = saved.url;
        if (link.classList.contains('back-link')) link.setAttribute('aria-label','返回此前的筛选结果');
      });
    }
  }
  document.addEventListener('click',event => {
    const link=event.target.closest('a[href]');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || link.target==='_blank') return;
    const target=new URL(link.href);
    const list=target.pathname.split('/').pop();
    if (target.origin===location.origin && ['beasts.html','classics.html'].includes(list)) storage.set('shanhai-return:'+list,true);
  });
})();
