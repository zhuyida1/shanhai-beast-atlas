/* 文化寻踪 · 专题笔记（四篇）交互
   每个模块都先查元素是否存在，缺失时整段跳过，互不影响。 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 入场：滚动到视口内时淡入上移 */
  var revealables = document.querySelectorAll('[data-reveal]');
  if (revealables.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      revealables.forEach(function (el) { el.classList.add('is-in-view'); });
    } else {
      var reveal = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in-view');
          reveal.disconnect && reveal.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
      revealables.forEach(function (el) { reveal.observe(el); });
    }
  }

  /* 一 · 饕餮纹：部位标注切换 */
  var plaque = document.querySelector('.bronze-plate');
  var annoButtons = document.querySelectorAll('[data-anno]');
  var annoNotes = document.querySelectorAll('[data-anno-note]');
  if (plaque && annoButtons.length) {
    annoButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        var key = button.getAttribute('data-anno');
        var alreadyOn = button.getAttribute('aria-pressed') === 'true';
        annoButtons.forEach(function (other) {
          other.setAttribute('aria-pressed', other === button && !alreadyOn ? 'true' : 'false');
        });
        annoNotes.forEach(function (note) {
          note.hidden = !(note.getAttribute('data-anno-note') === key && !alreadyOn);
        });
        if (alreadyOn) {
          plaque.removeAttribute('data-focus');
        } else {
          plaque.setAttribute('data-focus', key);
        }
      });
    });
  }

  /* 二 · 五色：色带展开，一次只展开一条 */
  var bands = document.querySelectorAll('.fband');
  if (bands.length) {
    bands.forEach(function (band) {
      band.addEventListener('click', function () {
        var open = band.classList.contains('is-open');
        bands.forEach(function (other) {
          other.classList.remove('is-open');
          other.setAttribute('aria-expanded', 'false');
        });
        if (!open) {
          band.classList.add('is-open');
          band.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /* 三 · 瑞兽：对照滑杆 */
  var compare = document.querySelector('.compare');
  var range = document.querySelector('.compare-range');
  if (compare && range) {
    var sync = function () {
      compare.style.setProperty('--pct', range.value);
    };
    range.addEventListener('input', sync);
    sync();
  }

  /* 四 · 证据等级：分级切换 */
  var tabs = document.querySelectorAll('[role="tab"][data-grade]');
  var panels = document.querySelectorAll('[data-grade-panel]');
  if (tabs.length && panels.length) {
    var select = function (tab) {
      var grade = tab.getAttribute('data-grade');
      tabs.forEach(function (other) {
        var on = other === tab;
        other.setAttribute('aria-selected', on ? 'true' : 'false');
        other.tabIndex = on ? 0 : -1;
      });
      panels.forEach(function (panel) {
        panel.hidden = panel.getAttribute('data-grade-panel') !== grade;
      });
    };
    tabs.forEach(function (tab, index) {
      tab.addEventListener('click', function () { select(tab); });
      tab.addEventListener('keydown', function (event) {
        var step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1
          : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
        if (!step) return;
        event.preventDefault();
        var next = tabs[(index + step + tabs.length) % tabs.length];
        next.focus();
        select(next);
      });
    });
  }
})();
