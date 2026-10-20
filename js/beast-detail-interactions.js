(() => {
  const art = document.querySelector('#beast-art');
  const artLink = document.querySelector('[data-lightbox]');
  const dialog = document.querySelector('.art-dialog');
  document.querySelectorAll('[data-art]').forEach((option) => {
    option.addEventListener('click', (event) => {
      event.preventDefault();
      art.src = option.href;
      art.alt = option.dataset.alt;
      artLink.href = option.href;
      document.querySelector('#art-caption').textContent = option.dataset.caption;
      document.querySelectorAll('[data-art]').forEach((item) => {
        item.classList.toggle('is-selected', item === option);
        if (item === option) item.setAttribute('aria-current', 'true');
        else item.removeAttribute('aria-current');
      });
    });
  });
  if (dialog && typeof dialog.showModal === 'function') {
    let previousOverflow;
    artLink.addEventListener('click', (event) => {
      event.preventDefault();
      dialog.querySelector('img').src = art.src;
      dialog.querySelector('img').alt = art.alt;
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      dialog.showModal();
    });
    dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
      document.body.style.overflow = previousOverflow || '';
      artLink.focus({ preventScroll: true });
    });
  }
  const tabList = document.querySelector('.culture-tabs');
  const tabs = [...tabList.querySelectorAll('[data-tab]')];
  const panels = [...document.querySelectorAll('[data-panel]')];
  const selectTab = (selected) => {
    tabs.forEach((tab) => {
      const active = tab === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    panels.forEach((panel) => { panel.hidden = panel.dataset.panel !== selected.dataset.tab; });
  };
  tabList.setAttribute('role', 'tablist');
  tabs.forEach((tab, index) => {
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', 'panel-' + tab.dataset.tab);
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', (event) => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault(); selectTab(tabs[next]); tabs[next].focus();
    });
  });
  panels.forEach((panel) => { panel.setAttribute('role', 'tabpanel'); panel.tabIndex = 0; });
  document.body.classList.add('tabs-ready'); selectTab(tabs[0]);
  const chapters = [...document.querySelectorAll('section[id]')].filter((section) => document.querySelector('.reading-nav a[href="#' + section.id + '"]'));
  let scrollPending = false;
  const updateReading = () => {
    let current = chapters[0];
    chapters.forEach((chapter) => { if (chapter.getBoundingClientRect().top <= innerHeight * .35) current = chapter; });
    document.querySelectorAll('.reading-nav a').forEach((link) => {
      if (link.hash === '#' + current.id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    scrollPending = false;
  };
  addEventListener('scroll', () => { if (!scrollPending) { scrollPending = true; requestAnimationFrame(updateReading); } }, { passive: true });
  updateReading();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (!reduced.matches && 'IntersectionObserver' in window && Element.prototype.animate) {
    const entrance = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.animate([{ opacity: .2, transform: 'translateY(20px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 850, easing: 'cubic-bezier(.22,1,.36,1)' });
        entrance.unobserve(entry.target);
      });
    }, { threshold: .08 });
    document.querySelectorAll('[data-reveal]').forEach((element) => entrance.observe(element));
    const drift = art.animate([{ transform: 'scale(1.025)' }, { transform: 'scale(1)' }], { duration: 8000, easing: 'ease-out' });
    reduced.addEventListener('change', () => {
      if (!reduced.matches) return;
      entrance.disconnect(); drift.cancel(); document.getAnimations().forEach((animation) => animation.cancel());
    });
  }
})();
