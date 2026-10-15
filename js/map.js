/* 地图页 JS：Step 5 会继续完善为真实交互页面 */
function renderMapPoints(points, boardSelector = '#mapBoard') {
  const board = document.querySelector(boardSelector);
  if (!board || !Array.isArray(points)) return;
  board.innerHTML = '';

  points.forEach((point, index) => {
    const marker = document.createElement('button');
    marker.className = 'map-point';
    marker.style.left = `${point.x}%`;
    marker.style.top = `${point.y}%`;
    marker.setAttribute('aria-label', point.name);
    marker.dataset.index = index;
    marker.addEventListener('click', () => selectMapPoint(point, marker));
    board.appendChild(marker);
  });
}

function selectMapPoint(point, marker) {
  document.querySelectorAll('.map-point').forEach(item => item.classList.remove('active'));
  marker.classList.add('active');

  const panel = document.querySelector('#mapInfoPanel');
  if (!panel) return;
  panel.innerHTML = `
    <h3 class="font-serif mb-3">${point.name}</h3>
    <p class="text-muted mb-2">所属山经：${point.region}</p>
    <p class="mb-2">相关神兽：<strong class="text-red">${point.beast}</strong></p>
    <p class="mb-0">${point.desc}</p>
  `;
}
