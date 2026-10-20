/* 关于页增强：返回上一级按钮的兜底行为 + 入场动效。
 * 没脚本时「返回上一级」就是普通链接，直接回首页。 */
(() => {
  'use strict';

  const back = document.getElementById('back-link');
  if (back) {
    back.addEventListener('click', event => {
      // 有历史记录就回上一页；直接打开本页时保留 href 回首页
      if (window.history.length > 1) {
        event.preventDefault();
        window.history.back();
      }
    });
  }

  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in-view');
      observer.unobserve(entry.target);
    });
  }, { threshold: .08 });

  document.querySelectorAll('[data-reveal], .entry-row, .read-steps li, .source-card, .home-footer .footer-finale')
    .forEach(element => observer.observe(element));
})();
