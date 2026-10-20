document.addEventListener("DOMContentLoaded", () => {
  const state = {
    chapter: "all",
    category: "all",
    keyword: "",
    strictOnly: false,
    showLabels: true,
    showRoute: true,
    showGrid: true,
    activeId: "qingqiu-jiuweihu",
    zoom: 1,
    cx: 50,
    cy: 40,
    dragging: false,
    dragStart: null
  };

  const els = {
    svg: document.querySelector("#mapSvg"),
    routeLayer: document.querySelector("#routeLayer"),
    pointLayer: document.querySelector("#pointLayer"),
    gridLayer: document.querySelector("#gridLayer"),
    list: document.querySelector("#pointList"),
    count: document.querySelector("#activeCount"),
    mapMode: document.querySelector("#mapMode"),
    detail: {
      mountain: document.querySelector("#detailMountain"),
      beast: document.querySelector("#detailBeast"),
      chapter: document.querySelector("#detailChapter"),
      route: document.querySelector("#detailRoute"),
      confidence: document.querySelector("#detailConfidence"),
      direction: document.querySelector("#detailDirection"),
      source: document.querySelector("#detailSource"),
      original: document.querySelector("#detailOriginal"),
      translation: document.querySelector("#detailTranslation"),
      tags: document.querySelector("#detailTags"),
      danger: document.querySelector("#dangerMeter")
    },
    search: document.querySelector("#mapSearch"),
    clearSearch: document.querySelector("#clearSearch"),
    resetView: document.querySelector("#resetView"),
    zoomIn: document.querySelector("#zoomIn"),
    zoomOut: document.querySelector("#zoomOut"),
    focusActive: document.querySelector("#focusActive"),
    sourceNotes: document.querySelector("#sourceNotes, #source-method")
  };

  function chapterName(key) {
    return ({
      all: "全图考据层",
      south: "南山经",
      west: "西山经",
      north: "北山经",
      east: "东山经",
      central: "中山经",
      haihuang: "海荒经"
    })[key] || "全图考据层";
  }

  function dangerLevelText(level) {
    return ["", "低", "较低", "中", "较高", "高"][level] || "未知";
  }

  function evidenceText(evidence) {
    if (evidence === 3) return "原文明确";
    if (evidence === 2) return "资料整理";
    return "设计拓展";
  }

  function detailLink(item) {
    const beastLinks = {
      "九尾狐": "beast-detail.html",
      "凤凰": "beast-fenghuang.html",
      "白泽": "beast-baize.html",
      "饕餮": "beast-taotie.html",
      "麒麟": "beast-qilin.html",
      "玄武": "beast-xuanwu.html",
      "穷奇": "beast-qiongqi.html",
      "天狗": "beast-tiangou.html",
      "狰": "beast-zheng.html",
      "旋龟": "beast-xuangui.html",
      "应龙": "beast-yinglong.html",
      "精卫": "beast-jingwei.html",
      "重明鸟": "beast-chongming.html",
      "蠃鱼": "beast-luoyu.html",
      "化蛇": "beast-huashe.html",
      "蛊雕": "beast-gudiao.html"
    };
    return item.detailLink || beastLinks[item.beast] || "habitat-detail.html";
  }

  function getFilteredPoints() {
    return SHANHAI_MAP_POINTS.filter(item => {
      const chapterMatch = state.chapter === "all" || item.chapterKey === state.chapter;
      const categoryMatch = state.category === "all" || item.category === state.category;
      const strictMatch = !state.strictOnly || item.evidence >= 3;
      const text = [
        item.chapter, item.routeGroup, item.mountain, item.beast, item.beastType,
        item.original, item.translation, item.source, item.tags.join(" ")
      ].join(" ");
      const keywordMatch = !state.keyword || text.includes(state.keyword);
      return chapterMatch && categoryMatch && strictMatch && keywordMatch;
    });
  }

  function groupedByRoute(points) {
    const map = new Map();
    points.forEach(point => {
      const key = `${point.chapterKey}-${point.routeGroup}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(point);
    });
    return [...map.values()].map(group => group.sort((a, b) => a.order - b.order));
  }

  function setViewBox() {
    const width = 100 / state.zoom;
    const height = 80 / state.zoom;
    const minCx = width / 2;
    const maxCx = 100 - width / 2;
    const minCy = height / 2;
    const maxCy = 80 - height / 2;
    state.cx = Math.max(minCx, Math.min(maxCx, state.cx));
    state.cy = Math.max(minCy, Math.min(maxCy, state.cy));
    els.svg.setAttribute("viewBox", `${state.cx - width / 2} ${state.cy - height / 2} ${width} ${height}`);
  }

  function renderGrid() {
    els.gridLayer.innerHTML = "";
    els.gridLayer.style.display = state.showGrid ? "" : "none";
    if (!state.showGrid) return;

    for (let x = 10; x < 100; x += 10) {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", x);
      line.setAttribute("y1", 0);
      line.setAttribute("x2", x);
      line.setAttribute("y2", 80);
      line.setAttribute("class", "grid-line");
      els.gridLayer.appendChild(line);
    }
    for (let y = 10; y < 80; y += 10) {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", 0);
      line.setAttribute("y1", y);
      line.setAttribute("x2", 100);
      line.setAttribute("y2", y);
      line.setAttribute("class", "grid-line");
      els.gridLayer.appendChild(line);
    }
  }

  function renderRoutes(points) {
    els.routeLayer.innerHTML = "";
    els.routeLayer.style.display = state.showRoute ? "" : "none";
    if (!state.showRoute) return;

    groupedByRoute(points).forEach((group, index) => {
      if (group.length < 2) return;
      const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
      polyline.setAttribute("points", group.map(p => `${p.x},${p.y}`).join(" "));
      polyline.setAttribute("class", `route-line route-${index % 4}`);
      els.routeLayer.appendChild(polyline);
    });
  }

  function renderPoints(points) {
    els.pointLayer.innerHTML = "";
    points.forEach(item => {
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("class", `map-point ${item.id === state.activeId ? "active" : ""} evidence-${item.evidence}`);
      g.setAttribute("tabindex", "0");
      g.setAttribute("role", "button");
      g.setAttribute("aria-label", `${item.chapter} ${item.mountain} ${item.beast}`);
      g.dataset.id = item.id;

      const halo = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      halo.setAttribute("cx", item.x);
      halo.setAttribute("cy", item.y);
      halo.setAttribute("r", "4.6");
      halo.setAttribute("class", "point-halo");

      const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      dot.setAttribute("cx", item.x);
      dot.setAttribute("cy", item.y);
      dot.setAttribute("r", "2.1");
      dot.setAttribute("class", `point-dot category-${item.category}`);

      const order = document.createElementNS("http://www.w3.org/2000/svg", "text");
      order.setAttribute("x", item.x);
      order.setAttribute("y", item.y + 1.15);
      order.setAttribute("class", "point-order");
      order.textContent = String(item.order).padStart(2, "0");

      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", item.x + 3.1);
      label.setAttribute("y", item.y - 2.4);
      label.setAttribute("class", `point-label ${state.showLabels ? "" : "hide-label"}`);
      label.textContent = `${item.mountain} · ${item.beast}`;

      g.append(halo, dot, order, label);
      g.addEventListener("click", () => setActive(item.id, true));
      g.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setActive(item.id, true);
        }
      });
      els.pointLayer.appendChild(g);
    });
  }

  function renderList(points) {
    els.list.innerHTML = "";
    if (!points.length) {
      els.list.innerHTML = `<div class="empty">暂无匹配点位。请减少筛选条件。</div>`;
      return;
    }

    points.forEach(item => {
      const card = document.createElement("article");
      card.className = `point-card ${item.id === state.activeId ? "active" : ""}`;
      card.setAttribute("tabindex", "0");
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", `定位到${item.mountain}${item.beast}`);
      card.innerHTML = `
        <span class="card-line top">
          <strong>${String(item.order).padStart(2, "0")}　${item.mountain}</strong>
          <em>${item.chapter}</em>
        </span>
        <span class="card-line">
          <b>${item.beast}</b>
          <small>${item.beastType}</small>
        </span>
        <span class="card-line note">
          <span>${evidenceText(item.evidence)}</span>
          <span>危险度：${dangerLevelText(item.danger)}</span>
        </span>
        <span class="point-actions">
          <button class="point-locate" type="button">定位点位</button>
          <a class="point-link" href="${detailLink(item)}">查看详情</a>
        </span>
      `;
      card.addEventListener("click", event => {
        if (event.target.closest("a")) return;
        setActive(item.id, true);
      });
      card.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setActive(item.id, true);
        }
      });
      els.list.appendChild(card);
    });
  }

  function renderDetail(item) {
    if (!item) return;
    els.detail.mountain.textContent = item.mountain;
    els.detail.beast.textContent = item.beast;
    els.detail.chapter.textContent = item.chapter;
    els.detail.route.textContent = `${item.routeGroup} · 第 ${String(item.order).padStart(2, "0")} 节点`;
    els.detail.confidence.textContent = `${item.confidence} / ${evidenceText(item.evidence)}`;
    els.detail.direction.textContent = item.directionNote;
    els.detail.source.textContent = item.source;
    els.detail.original.textContent = item.original;
    els.detail.translation.textContent = item.translation;
    els.detail.tags.innerHTML = item.tags.map(tag => `<span>${tag}</span>`).join("");
    els.detail.danger.innerHTML = Array.from({ length: 5 }, (_, index) => (
      `<i class="${index < item.danger ? "on" : ""}"></i>`
    )).join("");
  }

  function renderSourceNotes() {
    els.sourceNotes.innerHTML = SHANHAI_SOURCE_NOTES.map(note => `
      <article>
        <h3>${note.title}</h3>
        <p>${note.text}</p>
      </article>
    `).join("");
  }

  function render() {
    const points = getFilteredPoints();
    els.count.textContent = points.length;
    els.mapMode.textContent = chapterName(state.chapter);
    if (!points.some(p => p.id === state.activeId) && points[0]) {
      state.activeId = points[0].id;
    }
    renderGrid();
    renderRoutes(points);
    renderPoints(points);
    renderList(points);
    renderDetail(SHANHAI_MAP_POINTS.find(p => p.id === state.activeId));
    setViewBox();
  }

  function setActive(id, focus = false) {
    state.activeId = id;
    const item = SHANHAI_MAP_POINTS.find(p => p.id === id);
    if (item) {
      renderDetail(item);
      if (focus) focusOn(item);
    }
    render();
  }

  function focusOn(item) {
    state.cx = item.x;
    state.cy = item.y;
    state.zoom = Math.max(state.zoom, 1.65);
    setViewBox();
  }

  document.querySelectorAll("[data-chapter]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.chapter = btn.dataset.chapter;
      document.querySelectorAll("[data-chapter]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const first = getFilteredPoints()[0];
      if (first) {
        state.activeId = first.id;
        focusOn(first);
      }
      render();
    });
  });

  document.querySelectorAll("[data-category]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.category = btn.dataset.category;
      document.querySelectorAll("[data-category]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      render();
    });
  });

  document.querySelector("#strictOnly").addEventListener("change", e => {
    state.strictOnly = e.target.checked;
    render();
  });
  document.querySelector("#showLabels").addEventListener("change", e => {
    state.showLabels = e.target.checked;
    render();
  });
  document.querySelector("#showRoute").addEventListener("change", e => {
    state.showRoute = e.target.checked;
    render();
  });
  document.querySelector("#showGrid").addEventListener("change", e => {
    state.showGrid = e.target.checked;
    render();
  });

  els.search.addEventListener("input", e => {
    state.keyword = e.target.value.trim();
    render();
  });

  els.clearSearch.addEventListener("click", () => {
    state.keyword = "";
    els.search.value = "";
    render();
  });

  els.resetView.addEventListener("click", () => {
    state.zoom = 1;
    state.cx = 50;
    state.cy = 40;
    render();
  });

  els.zoomIn.addEventListener("click", () => {
    state.zoom = Math.min(3, state.zoom + 0.25);
    render();
  });

  els.zoomOut.addEventListener("click", () => {
    state.zoom = Math.max(1, state.zoom - 0.25);
    render();
  });

  els.focusActive.addEventListener("click", () => {
    const item = SHANHAI_MAP_POINTS.find(p => p.id === state.activeId);
    if (item) focusOn(item);
    render();
  });

  els.svg.addEventListener("wheel", e => {
    e.preventDefault();
    state.zoom = Math.max(1, Math.min(3, state.zoom + (e.deltaY < 0 ? 0.15 : -0.15)));
    render();
  }, { passive: false });

  els.svg.addEventListener("pointerdown", e => {
    state.dragging = true;
    state.dragStart = { x: e.clientX, y: e.clientY, cx: state.cx, cy: state.cy };
    els.svg.setPointerCapture(e.pointerId);
  });

  els.svg.addEventListener("pointermove", e => {
    if (!state.dragging || !state.dragStart) return;
    const viewW = 100 / state.zoom;
    const viewH = 80 / state.zoom;
    const rect = els.svg.getBoundingClientRect();
    const dx = (e.clientX - state.dragStart.x) / rect.width * viewW;
    const dy = (e.clientY - state.dragStart.y) / rect.height * viewH;
    state.cx = state.dragStart.cx - dx;
    state.cy = state.dragStart.cy - dy;
    setViewBox();
  });

  els.svg.addEventListener("pointerup", () => {
    state.dragging = false;
    state.dragStart = null;
  });

  renderSourceNotes();
  render();
});
