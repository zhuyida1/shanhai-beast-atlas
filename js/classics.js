/* 原典摘读列表页：读取 data/classics.js 渲染按经篇编排的摘读目录，
 * 并提供客户端检索（关键词检字 + 经篇筛选）。
 * 脚本只做增强：即使脚本不可用，classics.html 里也保留了 noscript 纯链接目录。 */
(() => {
  'use strict';

  const ALL = '全部';
  const CHAPTER_ORDER = ['南山经', '西山经', '北山经', '东山经', '中山经', '海荒经'];
  const CHAPTER_NOTES = {
    南山经: '青丘、丹穴、杻阳、鹿吴：形与声写得最完整的几处。',
    西山经: '章莪写怪，阴山写御凶，邽山写凶兽：三种笔法。',
    北山经: '钩吾狍鸮：全书拼合得最不讲道理的一只兽。',
    东山经: '东山经诸篇：水旱之兆与怪鱼杂记。',
    中山经: '中山经诸篇：苦山、骄山一带的杂记与药效。',
    海荒经: '凶犁土丘与流波山：进入大荒层的神话叙事。'
  };
  // 卷印与图版水印用同一个篇目首字
  const CHAPTER_MARKS = { 南山经: '南', 西山经: '西', 北山经: '北', 东山经: '东', 中山经: '中', 海荒经: '荒' };
  const DIGITS = '零一二三四五六七八九';

  // 条目番号用汉字，条目增加时自动续排，不受固定数目限制
  const hanzi = number => {
    if (!Number.isInteger(number) || number < 1) return String(number);
    if (number < 11) return number === 10 ? '十' : DIGITS[number];
    if (number < 20) return '十' + DIGITS[number - 10];
    if (number < 100) return DIGITS[Math.floor(number / 10)] + '十' + (number % 10 ? DIGITS[number % 10] : '');
    return String(number);
  };

  const data = typeof SHANHAI_CLASSICS === 'undefined' ? [] : SHANHAI_CLASSICS;
  const listHost = document.getElementById('classic-groups');
  const toolbar = document.getElementById('reading-toolbar');
  const filterHost = document.getElementById('chapter-filter');
  const searchInput = document.getElementById('classic-search');
  const clearButton = document.querySelector('.search-clear');
  const statusHost = document.getElementById('search-status');
  const emptyHost = document.getElementById('search-empty');
  const emptyReset = emptyHost ? emptyHost.querySelector('.empty-reset') : null;

  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  };

  const groupEntries = () => {
    const groups = new Map();
    data.forEach(item => {
      const key = item.category || '其他';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    });
    const orderOf = key => {
      const position = CHAPTER_ORDER.indexOf(key);
      return position === -1 ? CHAPTER_ORDER.length : position;
    };
    return [...groups.entries()].sort((a, b) => orderOf(a[0]) - orderOf(b[0]));
  };

  const createPlate = item => {
    const plate = make('span', 'entry-plate');
    const chapter = item.category || '原典';
    const sealChar = CHAPTER_MARKS[chapter] || chapter.slice(0, 1);

    // 缺图时用的是水印占位：篇目首字 + 竖排「插图待补」
    const mark = make('span', 'plate-mark', sealChar);
    mark.setAttribute('aria-hidden', 'true');
    plate.append(mark);

    if (item.cover) {
      const image = make('img');
      image.alt = (item.title || '原典') + ' 的原典插图';
      image.loading = 'lazy';
      image.decoding = 'async';
      // 先挂事件再赋 src，避免缓存命中时错过 load/error
      image.addEventListener('error', () => {
        image.remove();
        plate.classList.remove('has-cover');
      });
      image.addEventListener('load', () => plate.classList.add('is-loaded'));
      image.src = item.cover;

      // 有图时加两处小装饰：右下朱印（篇目首字）与右侧竖排经篇签
      const side = make('span', 'plate-side', chapter);
      side.setAttribute('aria-hidden', 'true');
      const seal = make('span', 'plate-seal', sealChar);
      seal.setAttribute('aria-hidden', 'true');

      plate.classList.add('has-cover');
      plate.append(image, side, seal);
    }
    plate.append(make('span', 'plate-label', '插图待补'));
    return plate;
  };

  const createEntry = (item, ordinal, isLead, delay) => {
    const entry = make('li', 'entry');
    entry.style.setProperty('--enter-delay', delay + 'ms');
    const link = make('a', 'entry-link');
    if (isLead) link.classList.add('is-lead');
    link.href = item.link || '#classic-groups';

    const copy = make('div', 'entry-copy');
    const kicker = make('p', 'entry-kicker');
    kicker.append(make('span', 'entry-index', hanzi(ordinal)));
    kicker.append(make('span', 'entry-chapter', item.category || '原典'));
    if (isLead) kicker.append(make('span', 'entry-flag', '开卷'));
    copy.append(kicker);

    const titleEl = make('h4', 'entry-title', item.title);
    const summaryEl = make('p', 'entry-summary', item.summary);
    copy.append(titleEl, summaryEl);

    const action = make('span', 'entry-action');
    action.append(document.createTextNode('读此条 '));
    const arrow = make('span', null, '↗');
    arrow.setAttribute('aria-hidden', 'true');
    action.append(arrow);
    copy.append(action);

    link.append(copy, createPlate(item));
    entry.append(link);

    return {
      el: entry,
      titleEl: titleEl,
      summaryEl: summaryEl,
      category: item.category || '原典',
      rawTitle: item.title || '',
      rawSummary: item.summary || '',
      haystack: [item.title, item.summary, item.category].join(' ').toLowerCase()
    };
  };

  const createChapter = ([category, items], index, startOrdinal) => {
    const id = 'chapter-' + (index + 1);
    const block = make('section', 'chapter-block');
    block.id = id;
    block.setAttribute('aria-labelledby', id + '-title');

    const seal = make('span', 'chapter-seal', CHAPTER_MARKS[category] || category.slice(0, 1));
    seal.setAttribute('aria-hidden', 'true');

    const head = make('div', 'chapter-head');
    const titleBox = make('div', 'chapter-title');
    titleBox.append(make('p', 'chapter-kicker', '卷' + hanzi(index + 1)));
    const heading = make('h3', null, category);
    heading.id = id + '-title';
    titleBox.append(heading);
    head.append(titleBox, make('p', 'chapter-note', CHAPTER_NOTES[category] || '按原典篇目顺序摘读。'));

    const list = make('ol', 'entry-list');
    const entries = [];
    items.forEach((item, position) => {
      // 整页第一条做“开卷”处理：字号与图版都加大
      const isLead = startOrdinal === 0 && position === 0;
      const entry = createEntry(item, startOrdinal + position + 1, isLead, position * 60);
      entries.push(entry);
      list.append(entry.el);
    });

    block.append(seal, head, list);
    return { el: block, name: category, entries };
  };

  const chapters = [];
  const groups = groupEntries();
  if (listHost) {
    if (groups.length) {
      let ordinal = 0;
      groups.forEach((group, index) => {
        const chapter = createChapter(group, index, ordinal);
        ordinal += group[1].length;
        chapters.push(chapter);
        listHost.append(chapter.el);
      });
    } else {
      listHost.append(make('p', 'entry-empty', '条目数据未加载，请刷新页面；也可以先用下方的纯文字目录进入。'));
    }
  }

  /* ---------- 检字与经篇筛选 ---------- */
  // 检字框和篇目印签都靠脚本工作；没有脚本时整条工具栏不出现，退回 noscript 目录
  if (toolbar) toolbar.hidden = false;
  const state = { term: '', chapter: ALL };
  const chapterNames = chapters.map(chapter => chapter.name);

  // 命中词加朱线，不改变正文：每次都从原始文本重画
  const paint = (node, text, term) => {
    node.replaceChildren();
    if (!term) {
      node.append(document.createTextNode(text));
      return;
    }
    const haystack = text.toLowerCase();
    const needle = term.toLowerCase();
    let from = 0;
    let at = haystack.indexOf(needle);
    while (at !== -1) {
      if (at > from) node.append(document.createTextNode(text.slice(from, at)));
      const mark = make('mark', null, text.slice(at, at + needle.length));
      node.append(mark);
      from = at + needle.length;
      at = haystack.indexOf(needle, from);
    }
    if (from < text.length) node.append(document.createTextNode(text.slice(from)));
  };

  const applyFilters = () => {
    const term = state.term.trim();
    let shown = 0;
    chapters.forEach(chapter => {
      let chapterShown = 0;
      const chapterHit = state.chapter === ALL || state.chapter === chapter.name;
      chapter.entries.forEach(entry => {
        const visible = chapterHit && (!term || entry.haystack.includes(term.toLowerCase()));
        entry.el.hidden = !visible;
        if (visible) chapterShown += 1;
        paint(entry.titleEl, entry.rawTitle, term);
        paint(entry.summaryEl, entry.rawSummary, term);
      });
      chapter.el.hidden = chapterShown === 0;
      shown += chapterShown;
    });

    const active = Boolean(term) || state.chapter !== ALL;
    if (statusHost) {
      statusHost.textContent = active ? (shown ? '检得 ' + shown + ' 条' : '没有匹配的条目') : '';
    }
    if (emptyHost) emptyHost.hidden = !(active && shown === 0);
    if (listHost) listHost.hidden = active && shown === 0;
    if (clearButton) clearButton.hidden = !term;
  };

  const syncChips = () => {
    if (!filterHost) return;
    filterHost.querySelectorAll('button').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.chapter === state.chapter));
    });
  };

  const setChapter = name => {
    state.chapter = name;
    syncChips();
    applyFilters();
  };

  const setTerm = value => {
    state.term = value;
    applyFilters();
  };

  const resetFilters = () => {
    if (searchInput) searchInput.value = '';
    state.term = '';
    setChapter(ALL);
    if (searchInput) searchInput.focus();
  };

  if (filterHost && chapterNames.length) {
    const defs = [{ name: ALL, label: '全部' }].concat(chapterNames.map(name => ({ name, label: name })));
    defs.forEach(def => {
      const button = make('button', null, def.label);
      button.type = 'button';
      button.dataset.chapter = def.name;
      button.setAttribute('aria-pressed', String(def.name === ALL));
      button.addEventListener('click', () => {
        // 再点一次当前篇目即退回全部
        setChapter(def.name === state.chapter && def.name !== ALL ? ALL : def.name);
      });
      filterHost.append(button);
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => setTerm(searchInput.value));
    searchInput.addEventListener('keydown', event => {
      if (event.key === 'Escape' && searchInput.value) {
        event.preventDefault();
        resetFilters();
      }
    });
    // 窄屏放不下长提示，换成短一点的例子
    const phone = matchMedia('(max-width: 760px)');
    const setPlaceholder = () => {
      searchInput.placeholder = phone.matches
        ? '搜山名、兽名或原文说法'
        : '搜山名、兽名或原文里的说法：九尾 / 讹火 / 天下大穰';
    };
    setPlaceholder();
    phone.addEventListener('change', setPlaceholder);
  }
  if (clearButton) clearButton.addEventListener('click', resetFilters);
  if (emptyReset) emptyReset.addEventListener('click', resetFilters);

  // 支持带参数进来：classics.html?q=九尾 或 ?chapter=西山经（其他页面可以直接链到某个检索）
  let params = new URLSearchParams('');
  try { params = new URLSearchParams(location.search); } catch (error) { params = new URLSearchParams(''); }
  const initialTerm = (params.get('q') || params.get('search') || '').trim();
  const initialChapter = params.get('chapter') || '';
  if (initialTerm) {
    state.term = initialTerm;
    if (searchInput) searchInput.value = initialTerm;
  }
  if (initialChapter && chapterNames.includes(initialChapter)) state.chapter = initialChapter;
  syncChips();
  applyFilters();

  // 键盘：按 / 直接聚焦检字框
  document.addEventListener('keydown', event => {
    if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
    const target = event.target;
    const typing = target instanceof HTMLElement
      && (target.closest('input, textarea, select, [contenteditable="true"]'));
    if (typing || !searchInput) return;
    event.preventDefault();
    searchInput.focus();
    searchInput.select();
  });

  // 移动端目录菜单：与首页一致，仅在窄屏显示“目录”按钮
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

  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const entranceObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in-view');
      entranceObserver.unobserve(entry.target);
    });
  }, { threshold: .08 });
  document.querySelectorAll('.chapter-head, .entry, .source-note, .nojs-list, .home-footer .footer-finale').forEach(element => entranceObserver.observe(element));
})();
