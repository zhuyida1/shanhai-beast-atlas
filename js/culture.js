/* Progressive enhancement for the culture index. Native anchors work without JS. */
(() => {
  const compact = window.matchMedia('(max-width: 1000px)');
  const menu = document.getElementById('culture-menu');
  const toggle = document.querySelector('.menu-toggle');
  const directory = document.querySelector('.category-directory');
  if (menu && toggle) {
    document.documentElement.classList.add('js-menu');
    const closeMenu = (returnFocus = false) => {
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      if (returnFocus) toggle.focus();
    };
    const syncLayout = () => {
      toggle.hidden = !compact.matches;
      closeMenu();
      if (directory) directory.open = !compact.matches;
    };
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      menu.classList.toggle('is-open', open);
      if (open) menu.querySelector('a')?.focus();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') closeMenu(true);
    });
    document.addEventListener('click', event => {
      if (!menu.contains(event.target) && !toggle.contains(event.target)) closeMenu();
    });
    menu.addEventListener('click', event => {
      if (event.target.closest('a')) closeMenu();
    });
    document.addEventListener('focusin', event => {
      if (!menu.contains(event.target) && !toggle.contains(event.target)) closeMenu();
    });
    compact.addEventListener('change', syncLayout);
    syncLayout();
  }

  const categoryLinks = [...document.querySelectorAll('.category-links > a')];
  let selectedCategory = '';
  const setCategory = id => {
    selectedCategory = id;
    categoryLinks.forEach(link => {
      if (link.hash === '#' + id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };
  const sections = categoryLinks.map(link => document.getElementById(link.hash.slice(1))).filter(Boolean);
  categoryLinks.forEach(link => link.addEventListener('click', () => {
    setCategory(link.hash.slice(1));
    if (compact.matches && directory) directory.open = false;
  }));
  if ('IntersectionObserver' in window) {
    const activeSections = new Set();
    const readingObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) activeSections.add(entry.target.id);
        else activeSections.delete(entry.target.id);
      });
      const visible = sections.filter(section => activeSections.has(section.id));
      // Adjacent columns share a reading band; keep the visitor's chosen column.
      const current = visible.find(section => section.id === selectedCategory) || visible[0];
      const nested = visible.find(section => current !== section && current?.contains(section)
        && section.getBoundingClientRect().top < window.innerHeight * .2);
      if (current) setCategory((nested || current).id);
    }, { rootMargin: '-10% 0px -55% 0px', threshold: 0 });
    sections.forEach(section => readingObserver.observe(section));

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const entranceObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in-view');
          entranceObserver.unobserve(entry.target);
        });
      }, { threshold: .08 });
      document.querySelectorAll('.catalog-headline, .article-card, .panel-head, .text-row, .story-row, .footer-finale, .footer-col').forEach(element => entranceObserver.observe(element));
    }
  }
})();
