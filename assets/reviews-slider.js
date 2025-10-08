
/* reviews-slider.js
   Lightweight, dependency-free carousel for .uk-slider blocks:
   - Supports multiple sliders per page
   - Prev/Next arrows (data-slider="prev"/"next", .uk-slider-prev/.uk-slider-next)
   - Autoplay with configurable interval via data-interval (ms), data-autoplay="false" to disable
   - Touch-swipe on mobile
*/

(function () {
  'use strict';

  function toMs(v, fallback) {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  }

  function Slider(root) {
    this.root = root;
    this.track = root.querySelector('.uk-slider-items');
    if (!this.track) return;

    // Slides
    this.slides = Array.from(this.track.children);
    this.total = this.slides.length;
    if (!this.total) return;

    // Settings
    const ds = root.dataset || {};
    this.autoplay = (ds.autoplay ?? 'true') !== 'false';
    this.interval = toMs(ds.interval, 5500);
    this.index = 0;
    this.timer = null;
    this.animating = false;

    // Ensure layout via CSS-friendly constraints
    this.track.style.display = 'flex';
    this.track.style.willChange = 'transform';
    this.track.style.transition = 'transform 500ms ease';
    this.slides.forEach(li => { li.style.minWidth = '100%'; li.style.flex = '0 0 100%'; });

    // Bind controls
    this.bindControls();

    // Swipe
    this.bindSwipe();

    // Auto
    if (this.autoplay) this.start();

    // Keyboard (optional)
    this.root.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') this.next();
      if (e.key === 'ArrowLeft') this.prev();
    });
  }

  Slider.prototype.goto = function (i, {jump} = {}) {
    if (!this.total) return;
    const next = (i + this.total) % this.total;
    this.index = next;
    // immediate jump (no transition) for setup/resize
    if (jump) {
      const old = this.track.style.transition;
      this.track.style.transition = 'none';
      this.track.style.transform = `translateX(-${next * 100}%)`;
      // force reflow then restore transition
      void this.track.offsetHeight;
      this.track.style.transition = old;
      return;
    }
    this.track.style.transform = `translateX(-${next * 100}%)`;
  };

  Slider.prototype.next = function () {
    this.stop(); this.goto(this.index + 1); this.start();
  };

  Slider.prototype.prev = function () {
    this.stop(); this.goto(this.index - 1); this.start();
  };

  Slider.prototype.start = function () {
    if (!this.autoplay || this.timer) return;
    this.timer = setInterval(() => this.goto(this.index + 1), this.interval);
  };

  Slider.prototype.stop = function () {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  };

  Slider.prototype.bindControls = function () {
    const within = (sel) => Array.from(this.root.querySelectorAll(sel));
    const prevBtns = within('[data-slider="prev"], .uk-slider-prev');
    const nextBtns = within('[data-slider="next"], .uk-slider-next');

    prevBtns.forEach(btn => btn.addEventListener('click', (e) => { e.preventDefault(); this.prev(); }));
    nextBtns.forEach(btn => btn.addEventListener('click', (e) => { e.preventDefault(); this.next(); }));
  };

  Slider.prototype.bindSwipe = function () {
    let startX = 0, startY = 0, dx = 0, dy = 0, dragging = false;
    const threshold = 50; // px

    const onDown = (e) => {
      this.stop();
      const t = e.touches ? e.touches[0] : e;
      startX = t.clientX; startY = t.clientY; dragging = true; dx = dy = 0;
      this.track.style.transition = 'none';
    };
    const onMove = (e) => {
      if (!dragging) return;
      const t = e.touches ? e.touches[0] : e;
      dx = t.clientX - startX; dy = t.clientY - startY;
      if (Math.abs(dx) > Math.abs(dy)) {
        e.preventDefault();
        const base = -this.index * this.root.clientWidth;
        this.track.style.transform = `translateX(${base + dx}px)`;
      }
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      this.track.style.transition = 'transform 500ms ease';
      if (Math.abs(dx) > threshold) {
        dx < 0 ? this.goto(this.index + 1) : this.goto(this.index - 1);
      } else {
        this.goto(this.index); // snap back
      }
      this.start();
    };

    this.root.addEventListener('mousedown', onDown);
    this.root.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    this.root.addEventListener('touchstart', onDown, {passive: false});
    this.root.addEventListener('touchmove', onMove, {passive: false});
    this.root.addEventListener('touchend', onUp);
  };

  // Init all sliders
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.uk-slider').forEach(el => {
      // Only init sliders that actually have items
      if (el.querySelector('.uk-slider-items > *')) {
        const s = new Slider(el);
        // initial jump (no animation flash)
        s.goto(0, {jump: true});
        // responsive recalc
        window.addEventListener('resize', () => s.goto(s.index, {jump: true}));
      }
    });
  });
})();