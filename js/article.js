/* 原典摘读条目页：依据地址中的 ?id=N 读取 data/articles.js 渲染单篇。
 * 页面只做增强：正文全部由脚本填入，脚本不可用时显示 noscript 导航回摘读目录。 */
(() => {
  'use strict';

  const CHAPTER_MARKS = { 南山经: '南', 西山经: '西', 北山经: '北', 东山经: '东', 中山经: '中', 海荒经: '荒' };
  const index = typeof SHANHAI_ARTICLES === 'undefined' ? [] : SHANHAI_ARTICLES;

  let params = new URLSearchParams('');
  try { params = new URLSearchParams(location.search); } catch (error) { params = new URLSearchParams(''); }
  const wanted = Number(params.get('id'));
  const hasId = params.has('id') && String(params.get('id') || '').trim() !== '';
  // 不带 id 时给首条；带了 id 却查不到，说明链接写错了，显示提示而不是换成别的条目
  const article = hasId
    ? (index.find(item => item.id === wanted) || null)
    : (index[0] || null);

  const node = id => document.getElementById(id);
  const make = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined && text !== null) element.textContent = text;
    return element;
  };

  const missingHost = node('article-missing');
  const articleHost = node('read-article');

  if (!article) {
    if (missingHost) missingHost.hidden = false;
    if (articleHost) articleHost.hidden = true;
    const rail = document.querySelector('.read-rail');
    if (rail) rail.hidden = true;
    document.title = '未找到条目｜山海异兽录';
    return;
  }

  const set = (id, text) => {
    const host = node(id);
    if (host) host.textContent = text;
  };

  /* ---------- 题签 ---------- */
  document.title = article.name + '｜原典摘读｜山海异兽录';
  const description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute('content', article.source + '：' + article.subtitle + '。' + article.deck);
  set('art-crumb-name', article.name);
  set('art-kicker', (article.category || '经篇') + ' · ' + (article.place || '山名'));
  set('art-name', article.name);
  set('art-pinyin', article.pinyin || '');
  set('art-subtitle', article.subtitle || '');
  set('art-deck', article.deck || '');
  set('art-place', article.place || '—');
  set('art-source', article.source || '—');
  set('art-seal', CHAPTER_MARKS[article.category] || (article.category || '典').slice(0, 1));
  set('art-original', article.original || '');
  set('art-vernacular', article.vernacular || '');

  /* ---------- 题签图版：图版路径与列表页共用 data/classics.js ---------- */
  const plateBox = node('art-plate');
  const coverImage = node('art-cover');
  const plateSide = node('art-plate-side');
  const classicRecord = (typeof SHANHAI_CLASSICS === 'undefined' ? [] : SHANHAI_CLASSICS)
    .find(item => item.id === article.id);
  const cover = article.cover || (classicRecord ? classicRecord.cover : '');
  if (plateBox && coverImage && cover) {
    coverImage.alt = article.name + ' 的原典插图';
    coverImage.hidden = false;
    // 先挂事件再赋 src，避免缓存命中时错过 error
    coverImage.addEventListener('error', () => {
      coverImage.hidden = true;
      plateBox.classList.remove('has-cover');
    });
    coverImage.src = cover;
    plateBox.classList.add('has-cover');
    if (plateSide) plateSide.textContent = article.category || '';
  }

  /* ---------- 原书注释 ---------- */
  const notesHost = node('art-notes');
  if (notesHost) {
    const notes = article.notes || [];
    if (notes.length) {
      notesHost.append(make('p', 'notes-title', '原书注释'));
      notes.forEach(note => {
        const row = make('p', 'note');
        row.append(make('span', 'note-mark', note.mark || '·'));
        row.append(make('span', null, note.text));
        notesHost.append(row);
      });
    } else {
      notesHost.hidden = true;
    }
  }

  /* ---------- 名物考 ---------- */
  const loreHost = node('art-lore');
  if (loreHost) {
    (article.lore || []).forEach(item => {
      const card = make('article', 'lore-card');
      card.append(make('span', 'lore-label', item.label || '考'));
      card.append(make('p', 'lore-text', item.text || ''));
      loreHost.append(card);
    });
  }

  /* ---------- 义疏 ---------- */
  const glossHost = node('art-gloss');
  if (glossHost) {
    (article.gloss || []).forEach((paragraph, position) => {
      const row = make('p', 'gloss-paragraph', paragraph);
      if (position === 0) row.classList.add('gloss-lead');
      glossHost.append(row);
    });
  }

  /* ---------- 相关条目 ---------- */
  const relatedHost = node('art-related');
  if (relatedHost) {
    const byId = id => index.find(item => item.id === id);
    let picks = (article.related || []).map(byId).filter(Boolean);
    if (picks.length < 3) {
      // 同卷优先，再按卷序补齐，保证任何一条都能横向走到别处
      const sameChapter = index.filter(item => item.id !== article.id && item.category === article.category);
      const others = index.filter(item => item.id !== article.id && item.category !== article.category);
      picks = picks.concat(sameChapter, others).filter((item, position, list) => list.indexOf(item) === position);
    }
    picks.slice(0, 3).forEach(item => {
      const card = make('a', 'related-card');
      card.href = 'article.html?id=' + item.id;
      card.append(make('span', 'related-chapter', item.category || '经篇'));
      card.append(make('strong', 'related-name', item.name));
      card.append(make('span', 'related-sub', item.subtitle || ''));
      relatedHost.append(card);
    });
  }

  /* ---------- 上一条 / 目录 / 下一条 ---------- */
  const pagerHost = node('art-pager');
  if (pagerHost) {
    const position = index.indexOf(article);
    const previous = index[position - 1];
    const next = index[position + 1];
    const buildLink = (item, direction) => {
      const link = make('a', 'pager-link pager-' + direction);
      link.href = 'article.html?id=' + item.id;
      link.append(make('span', 'pager-dir', direction === 'prev' ? '上一条' : '下一条'));
      link.append(make('strong', null, item.name));
      link.append(make('span', 'pager-sub', item.subtitle || ''));
      return link;
    };
    if (previous) pagerHost.append(buildLink(previous, 'prev'));
    else pagerHost.append(make('span', 'pager-empty'));
    const back = make('a', 'pager-back', '摘读目录');
    back.href = 'classics.html';
    pagerHost.append(back);
    if (next) pagerHost.append(buildLink(next, 'next'));
    else pagerHost.append(make('span', 'pager-empty'));
  }

  /* ---------- 阅读方式：对读 / 只读原文 / 只读白话 ---------- */
  const passage = node('passage');
  const switchHost = document.querySelector('.view-switch');
  const passageNote = node('passage-note');
  const NOTE_TEXT = {
    both: '左为原文，右为白话；转行处与原句对应。',
    classic: '只看原文。注释在句下，字号较小。',
    vernacular: '只看白话。译文不添原文没有的情节。'
  };
  if (passage && switchHost) {
    switchHost.addEventListener('click', event => {
      const button = event.target.closest('button[data-view]');
      if (!button) return;
      const view = button.dataset.view;
      passage.dataset.view = view;
      switchHost.querySelectorAll('button').forEach(item => {
        item.setAttribute('aria-pressed', String(item.dataset.view === view));
      });
      if (passageNote) passageNote.textContent = NOTE_TEXT[view] || NOTE_TEXT.both;
    });
  }

  /* ---------- 阅读进度 ---------- */
  const bar = node('read-progress-bar');
  if (bar) {
    let ticking = false;
    const draw = () => {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = height > 0 ? Math.min(Math.max(window.scrollY / height, 0), 1) : 0;
      bar.style.transform = 'scaleX(' + ratio.toFixed(4) + ')';
      ticking = false;
    };
    const request = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(draw);
    };
    draw();
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
  }

  /* ---------- 目录随读高亮 ---------- */
  const railLinks = [...document.querySelectorAll('.rail-index a')];
  if (railLinks.length && 'IntersectionObserver' in window) {
    const byHash = new Map(railLinks.map(link => [link.hash.slice(1), link]));
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        railLinks.forEach(link => link.removeAttribute('aria-current'));
        const link = byHash.get(entry.target.id);
        if (link) link.setAttribute('aria-current', 'location');
      });
    }, { rootMargin: '-12% 0px -62% 0px', threshold: 0 });
    byHash.forEach((_, hash) => {
      const section = document.getElementById(hash);
      if (section) observer.observe(section);
    });
  }

  /* ---------- 移动端目录菜单：与首页一致 ---------- */
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.getElementById('mobile-menu');
  const narrow = matchMedia('(max-width: 760px)');
  if (toggle && menu) {
    const closeMenu = () => {
      toggle.setAttribute('aria-expanded', 'false');
      menu.hidden = true;
    };
    const syncMenu = () => {
      toggle.hidden = !narrow.matches;
      closeMenu();
    };
    syncMenu();
    narrow.addEventListener('change', syncMenu);
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      menu.hidden = !open;
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !menu.hidden) {
        closeMenu();
        toggle.focus();
      }
    });
    document.addEventListener('click', event => {
      if (!menu.hidden && !menu.contains(event.target) && !toggle.contains(event.target)) closeMenu();
    });
    menu.addEventListener('click', event => {
      if (event.target.closest('a')) closeMenu();
    });
  }

  /* ---------- 入场 ---------- */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;
  const entrance = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in-view');
      entrance.unobserve(entry.target);
    });
  }, { threshold: .08 });
  document.querySelectorAll('.read-article > section, .lore-card, .related-card, .article-pager, .home-footer .footer-finale').forEach(element => entrance.observe(element));
})();
