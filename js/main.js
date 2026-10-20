/* 全站通用 JS */
document.addEventListener('DOMContentLoaded', () => {
  setActiveNav();
  createBackTop();
  bindSearchTip();
  bindHeroCarousel();
});

/* 激活当前页导航项 */
function setActiveNav() {
  const current = location.pathname.split('/').pop() || 'index.html';
  // 子页面映射到父级导航
  const parentMap = {
    'beast-detail.html': 'beasts.html',
    'beast-taotie.html': 'beasts.html',
    'beast-baize.html': 'beasts.html',
    'beast-fenghuang.html': 'beasts.html',
    'beast-qilin.html': 'beasts.html',
    'beast-xuanwu.html': 'beasts.html',
    'habitat-detail.html': 'map.html'
  };
  const target = parentMap[current] || current;
  document.querySelectorAll('.nav-menu a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === target) link.classList.add('active');
  });
}

/* 动态创建返回顶部按钮 */
function createBackTop() {
  const btn = document.createElement('button');
  btn.className = 'back-top-btn';
  btn.innerHTML = '&#8593;';
  btn.title = '返回顶部';
  btn.setAttribute('aria-label', '返回顶部');
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  document.body.appendChild(btn);

  // 滚动到一定距离后才显示按钮
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  });
}

/* 搜索装饰性提示 */
function bindSearchTip() {
  const pill = document.querySelector('.search-pill');
  if (!pill) return;
  pill.style.cursor = 'pointer';
  pill.addEventListener('click', () => {
    const keyword = prompt('输入要搜索的神兽、典故或地名：');
    if (keyword && keyword.trim()) {
      // 跳转到 beasts.html 并带上搜索参数
      window.location.href = 'beasts.html?search=' + encodeURIComponent(keyword.trim());
    }
  });
}

/* 首页轮播图 */
function bindHeroCarousel() {
  const carousel = document.querySelector('[data-hero-carousel]');
  if (!carousel) return;

  const slides = Array.from(carousel.querySelectorAll('[data-hero-slide]'));
  const dots = Array.from(carousel.querySelectorAll('[data-hero-dot]'));
  const prev = carousel.querySelector('[data-hero-prev]');
  const next = carousel.querySelector('[data-hero-next]');
  if (slides.length < 2) return;

  let activeIndex = slides.findIndex(slide => slide.classList.contains('active'));
  if (activeIndex < 0) activeIndex = 0;
  let timer = null;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const showSlide = index => {
    activeIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === activeIndex;
      slide.classList.toggle('active', active);
      slide.setAttribute('aria-hidden', active ? 'false' : 'true');
    });
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle('active', dotIndex === activeIndex);
      dot.setAttribute('aria-current', dotIndex === activeIndex ? 'true' : 'false');
    });
  };

  const stop = () => {
    if (timer) window.clearInterval(timer);
    timer = null;
  };

  const start = () => {
    stop();
    if (reducedMotion.matches) return;
    timer = window.setInterval(() => showSlide(activeIndex + 1), 5000);
  };

  prev?.addEventListener('click', () => {
    showSlide(activeIndex - 1);
    start();
  });
  next?.addEventListener('click', () => {
    showSlide(activeIndex + 1);
    start();
  });
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      showSlide(index);
      start();
    });
  });

  carousel.addEventListener('mouseenter', stop);
  carousel.addEventListener('mouseleave', start);
  carousel.addEventListener('focusin', stop);
  carousel.addEventListener('focusout', start);

  showSlide(activeIndex);
  start();
}

/* 神兽卡片模板（供动态生成使用） */
function createBeastCard(beast) {
  return `
    <article class="card-shan beast-card" data-category="${beast.category}">
      <div class="beast-thumb"></div>
      <div class="beast-body">
        <div class="d-flex justify-content-center gap-2 mb-2">
          <span class="badge-shan">${beast.categoryName}</span>
          <span class="badge-shan">${beast.nature}</span>
        </div>
        <h3 class="beast-name">${beast.name}</h3>
        <p class="beast-text">${beast.short}</p>
        <a class="btn btn-shan-red btn-sm" href="${beast.link || 'beast-detail.html'}">查看详情</a>
      </div>
    </article>
  `;
}
