/* 沉浸式全屏首页交互 */

document.addEventListener('DOMContentLoaded', () => {
  initFullscreenCanvas();
});

function initFullscreenCanvas() {
  const canvas = document.querySelector('.fullscreen-canvas');
  if (!canvas) return;

  const backdrop = canvas.querySelector('.canvas-backdrop');
  const hotspots = canvas.querySelectorAll('.hotspot');
  const scrollEntry = canvas.querySelector('.scroll-entry');

  // 检查动画偏好
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 鼠标视差效果(背景轻微跟随)
  if (!reducedMotion && backdrop) {
    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    });

    function animateBackdrop() {
      currentX += (mouseX - currentX) * 0.05;
      currentY += (mouseY - currentY) * 0.05;

      const moveX = currentX * 15;
      const moveY = currentY * 15;

      backdrop.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.05)`;

      requestAnimationFrame(animateBackdrop);
    }

    animateBackdrop();
  }

  // 热区点击跳转
  hotspots.forEach(hotspot => {
    const target = hotspot.dataset.target;
    if (!target) return;

    hotspot.style.cursor = 'pointer';

    hotspot.addEventListener('click', (e) => {
      e.preventDefault();

      // 添加点击动画
      hotspot.style.transform = 'scale(0.95)';
      setTimeout(() => {
        hotspot.style.transform = '';
      }, 150);

      // 短暂延迟后跳转
      setTimeout(() => {
        window.location.href = target;
      }, 200);
    });

    // 键盘可访问性
    hotspot.setAttribute('role', 'link');
    hotspot.setAttribute('tabindex', '0');
    hotspot.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        hotspot.click();
      }
    });
  });

  // 滚动入口点击
  if (scrollEntry) {
    scrollEntry.addEventListener('click', () => {
      const contentBelow = document.querySelector('.content-below');
      if (contentBelow) {
        contentBelow.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // 磁吸效果:鼠标接近热区时轻微吸附
  if (!reducedMotion) {
    const magneticRange = 80; // 吸附范围(像素)
    const magneticStrength = 0.3; // 吸附强度

    canvas.addEventListener('mousemove', (e) => {
      const mousePos = { x: e.clientX, y: e.clientY };

      hotspots.forEach(hotspot => {
        const rect = hotspot.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const distanceX = mousePos.x - centerX;
        const distanceY = mousePos.y - centerY;
        const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

        if (distance < magneticRange) {
          const pullX = distanceX * magneticStrength * (1 - distance / magneticRange);
          const pullY = distanceY * magneticStrength * (1 - distance / magneticRange);

          hotspot.style.transform = `translate(${pullX}px, ${pullY}px)`;
        } else {
          hotspot.style.transform = '';
        }
      });
    });

    canvas.addEventListener('mouseleave', () => {
      hotspots.forEach(hotspot => {
        hotspot.style.transform = '';
      });
    });
  }

  // 粒子漂浮效果(可选,性能允许时)
  createFloatingParticles(canvas);
}

// 创建漂浮粒子
function createFloatingParticles(container) {
  const particleCount = 12;
  const particleLayer = document.createElement('div');
  particleLayer.className = 'particle-layer';
  particleLayer.style.cssText = `
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
  `;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'floating-particle';

    const size = Math.random() * 4 + 2;
    const startX = Math.random() * 100;
    const startY = Math.random() * 100;
    const duration = Math.random() * 20 + 25;
    const delay = Math.random() * -15;
    const drift = Math.random() * 60 - 30;

    particle.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${startX}%;
      top: ${startY}%;
      background: radial-gradient(circle, rgba(196, 154, 74, 0.25) 0%, transparent 70%);
      border-radius: 50%;
      opacity: 0;
      animation: particleFloat ${duration}s ease-in-out infinite;
      animation-delay: ${delay}s;
    `;

    particle.style.setProperty('--drift', `${drift}px`);

    particleLayer.appendChild(particle);
  }

  // 添加粒子动画样式
  const style = document.createElement('style');
  style.textContent = `
    @keyframes particleFloat {
      0%, 100% {
        opacity: 0;
        transform: translateY(0) translateX(0);
      }
      10% {
        opacity: 0.4;
      }
      50% {
        opacity: 0.6;
        transform: translateY(-100px) translateX(var(--drift, 0));
      }
      90% {
        opacity: 0.4;
      }
    }
  `;
  document.head.appendChild(style);

  container.appendChild(particleLayer);
}
