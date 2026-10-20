(() => {
  'use strict';
  // Decorations use their own layer. The atlas retains ownership of all input and camera state.
  window.ShanhaiHabitatMotion = {
    create(viewport) {
      const page = document.body;
      const bar = document.getElementById('map-motion-bar');
      const toggle = document.getElementById('map-motion-toggle');
      const note = document.getElementById('map-motion-note');
      const reduced = matchMedia('(prefers-reduced-motion:reduce)');
      const preferenceKey = 'shanhai-habitat-motion-paused';
      let paused = false, pending = null, active = null, position = null, phaseTimer = 0;
      try { paused = localStorage.getItem(preferenceKey) === '1'; } catch (_) { /* Optional preference storage. */ }
      const layer = document.createElement('div');
      layer.className = 'habitat-motion-layer';
      layer.setAttribute('aria-hidden', 'true');
      const aura = document.createElement('div');
      aura.className = 'habitat-point-aura';
      aura.hidden = true;
      aura.innerHTML = '<div class="habitat-ink-bloom"></div><div class="habitat-ink-echo"></div><div class="habitat-star-field">' +
        Array.from({length:3}, () => '<div class="habitat-orbit-plane"><div class="habitat-orbit-track"></div><div class="habitat-orbit-traveler"><i class="habitat-orbit-mote"></i></div></div>').join('') +
        '</div><div class="habitat-signal-ring"></div><div class="habitat-spirit-ripple"><span class="habitat-spirit-glow"></span><span class="habitat-spirit-ring"></span><span class="habitat-spirit-ring"></span></div>';
      layer.append(aura);
      viewport.append(layer);

      function enabled() { return !paused && !reduced.matches && !document.hidden; }
      function idleNote() { return enabled() ? '点朱砂，唤醒山海' : '朱砂点选，手札随行'; }
      function paint() {
        const visible = !!active && !!position && enabled();
        aura.hidden = !visible;
        aura.classList.toggle('is-active', visible && active.phase === 'awakening');
        aura.classList.toggle('is-rippling', visible && active.phase === 'ripple');
        aura.dataset.phase = active?.phase || 'idle';
        bar.classList.toggle('is-cued', visible);
        note.textContent = active ? active.name + (visible ? active.phase === 'awakening' ? ' · 唤醒山海' : ' · 灵气涟漪' : ' · 当前所选') : idleNote();
      }
      function settle() {
        clearTimeout(phaseTimer);
        phaseTimer = 0;
        if (active) active.phase = 'ripple';
        paint();
      }
      function clear() {
        clearTimeout(phaseTimer);
        phaseTimer = 0;
        pending = active = null;
        position = null;
        paint();
      }
      function sync() {
        // Keep the selected point's steady state while stopping hidden/disabled animations.
        // Resuming never queues or replays an interrupted awakening.
        if (!enabled()) {
          if (pending) { active = {...pending, phase:'ripple'}; pending = null; }
          settle();
        }
        page.dataset.habitatMotion = reduced.matches ? 'reduced' : paused ? 'paused' : document.hidden ? 'hidden' : 'on';
        toggle.setAttribute('aria-pressed', String(!paused && !reduced.matches));
        toggle.setAttribute('aria-label', reduced.matches ? '地图动态效果，已遵循系统减少动态效果设置' : '地图动态效果');
        toggle.disabled = reduced.matches;
        toggle.querySelector('.motion-toggle-label').textContent = reduced.matches ? '已减少动效' : paused ? '开启动效' : '暂停动效';
        toggle.title = reduced.matches ? '已遵循系统的“减少动态效果”设置' : paused ? '开启入场、路线流光与地点动效' : '暂停入场、路线流光与地点动效';
        paint();
      }
      toggle.addEventListener('click', () => {
        paused = !paused;
        try { localStorage.setItem(preferenceKey, paused ? '1' : '0'); } catch (_) { /* Browsing still works without storage. */ }
        sync();
      });
      reduced.addEventListener('change', sync);
      document.addEventListener('visibilitychange', sync);
      window.addEventListener('pagehide', () => {
        settle();
        aura.hidden = true;
        aura.classList.remove('is-active', 'is-rippling');
        page.dataset.habitatMotion = 'hidden';
      });
      window.addEventListener('pageshow', sync);
      window.addEventListener('storage', event => {
        if (event.key === preferenceKey || event.key === null) {
          paused = event.key === null ? false : event.newValue === '1';
          sync();
        }
      });
      bar.hidden = false;
      sync();

      return {
        clear,
        select(id, name) {
          clear();
          if (!id) return;
          if (enabled()) pending = {id, name};
          else active = {id, name, phase:'ripple'};
        },
        follow(id, anchor) {
          if (!pending && !active) return;
          const cue = pending || active;
          if (cue.id !== id) { clear(); return; }
          // Clustering or leaving the viewport only hides the decoration. It returns
          // as a ripple at the correct point when that point becomes visible again.
          position = anchor;
          if (position) {
            aura.style.left = position.x + 'px';
            aura.style.top = position.y + 'px';
          }
          if (!pending) {
            if (!position && active.phase === 'awakening') settle();
            else paint();
            return;
          }
          active = {...pending, phase:position && enabled() ? 'awakening' : 'ripple'};
          pending = null;
          aura.hidden = !position || !enabled();
          void aura.offsetWidth; // Restart on every deliberate selection, including the same point.
          paint();
          if (active.phase === 'awakening') phaseTimer = setTimeout(settle, 4800);
        }
      };
    }
  };
})();
