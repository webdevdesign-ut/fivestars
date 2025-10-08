/* reviews-slider.js — UIkit-like behavior, zero dependencies
   Supports your existing markup & CSS:
     .uk-slider
       .uk-slider-container
         .uk-slider-items > li
       .uk-slidenav.prev / .uk-slidenav.next  (or .uk-slider-prev / .uk-slider-next / [data-slider="prev|next"])
       .uk-dotnav (optional; will be created if missing)

   Per-slider options (data-attrs on .uk-slider):
     data-autoplay="false"  // default true
     data-interval="6500"   // ms, default 5500
     data-pause-on-hover="true" // default true
*/

(function () {
  'use strict';

  // Small helpers
  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }
  function toMs(v, fallback) {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  }
  function qsAll(root, sel) {
    return Array.from(root.querySelectorAll(sel));
  }

  class Slider {
    constructor(root) {
      this.root = root;
      this.container = root.querySelector('.uk-slider-container');
      this.track = root.querySelector('.uk-slider-items');
      this.slides = this.track ? Array.from(this.track.children) : [];
      this.count = this.slides.length;

      if (!this.container || !this.track || !this.count) return;

      // Read data-attributes
      const ds = root.dataset || {};
      this.autoplay = (ds.autoplay == null) ? true : ds.autoplay !== 'false';
      this.interval = toMs(ds.interval, 5500);
      this.pauseOnHover = (ds.pauseOnHover == null) ? true : ds.pauseOnHover !== 'false';

      // State
      this.index = 0;
      this.timer = null;

      // Prepare layout — your CSS already sets flex & min-width:100% on li
      this.track.style.willChange = 'transform';

      // Build / bind UI
      this.buildDots();
      this.bindArrows();
      this.bindDots();
      this.bindSwipe();
      this.bindHover();
      this.bindVisibility();

      // Initial render
      this.goTo(0, { jump: true });

      // Auto
      if (this.autoplay) this.start();

      // Resize handling
      this.onResize = this.goTo.bind(this, this.index, { jump: true });
      window.addEventListener('resize', this.onResize, { passive: true });
    }

    // ----- UI building -----
    buildDots() {
      // Use existing .uk-dotnav if present; else create
      this.dotnav = this.root.querySelector('.uk-dotnav');
      if (!this.dotnav) {
        this.dotnav = document.createElement('ul');
        this.dotnav.className = 'uk-dotnav';
        this.root.appendChild(this.dotnav);
      }
      // Clear and rebuild
      this.dotnav.innerHTML = '';
      const frag = document.createDocumentFragment();
      for (let i = 0; i < this.count; i++) {
        const li = document.createElement('li');
        li.setAttribute('role', 'tab');
        li.setAttribute('aria-label', `Slide ${i + 1}`);
        li.dataset.index = i;
        frag.appendChild(li);
      }
      this.dotnav.appendChild(frag);
      this.dots = Array.from(this.dotnav.children);
    }

    bindArrows() {
      const prevBtns = qsAll(this.root, '[data-slider="prev"], .uk-slider-prev, .uk-slidenav.prev');
      const nextBtns = qsAll(this.root, '[data-slider="next"], .uk-slider-next, .uk-slidenav.next');

      prevBtns.forEach(btn => btn.addEventListener('click', e => {
        e.preventDefault();
        this.prev();
      }));
      nextBtns.forEach(btn => btn.addEventListener('click', e => {
        e.preventDefault();
        this.next();
      }));
    }

    bindDots() {
      if (!this.dots) return;
      this.dots.forEach(dot => {
        dot.addEventListener('click', (e) => {
          e.preventDefault();
          const i = Number(dot.dataset.index);
          if (Number.isFinite(i)) this.goTo(i);
        });
      });
    }

    bindHover() {
      if (!this.pauseOnHover) return;
      this.root.addEventListener('mouseenter', () => this.stop());
      this.root.addEventListener('mouseleave', () => this.start());
    }

    bindVisibility() {
      // Pause autoplay when tab is hidden; resume on visible
      this._onVis = () => {
        if (document.hidden) this.stop();
        else if (this.autoplay) this.start();
      };
      document.addEventListener('visibilitychange', this._onVis);
    }

    bindSwipe() {
      let startX = 0, startY = 0, dx = 0, dy = 0, dragging = false;
      const threshold = 50;

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
          const W = this.root.clientWidth;
          const base = -this.index * W;
          this.track.style.transform = `translateX(${base + dx}px)`;
        }
      };
      const onUp = () => {
        if (!dragging) return;
        dragging = false;
        this.track.style.transition = 'transform 500ms ease';
        if (Math.abs(dx) > threshold) {
          dx < 0 ? this.next() : this.prev();
        } else {
          this.goTo(this.index); // snap back
        }
      };

      this.root.addEventListener('mousedown', onDown);
      this.root.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);

      this.root.addEventListener('touchstart', onDown, { passive: false });
      this.root.addEventListener('touchmove', onMove,   { passive: false });
      this.root.addEventListener('touchend', onUp);
    }

    // ----- core nav -----
    start() {
      if (!this.autoplay || this.timer) return;
      this.timer = setInterval(() => this.next(), this.interval);
    }
    stop() {
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
    }

    next() { this.goTo(this.index + 1); }
    prev() { this.goTo(this.index - 1); }

    goTo(i, opts = {}) {
      if (!this.count) return;
      const jump = !!opts.jump;

      // Wrap like UIkit (infinite)
      const next = (i % this.count + this.count) % this.count;
      this.index = next;

      const pct = -(next * 100);
      if (jump) {
        const old = this.track.style.transition;
        this.track.style.transition = 'none';
        this.track.style.transform = `translateX(${pct}%)`;
        void this.track.offsetHeight; // reflow
        this.track.style.transition = old || 'transform 500ms ease';
      } else {
        this.track.style.transform = `translateX(${pct}%)`;
      }

      // Update dots
      if (this.dots) {
        this.dots.forEach((d, n) => d.classList.toggle('active', n === next));
      }

      // (Optional) aria-current / aria-hidden for slides
      this.slides.forEach((li, n) => {
        li.setAttribute('aria-hidden', String(n !== next));
        if (n === next) li.setAttribute('aria-current', 'true'); else li.removeAttribute('aria-current');
      });
    }

    // ----- cleanup (not used now, but handy) -----
    destroy() {
      this.stop();
      window.removeEventListener('resize', this.onResize);
      document.removeEventListener('visibilitychange', this._onVis);
    }
  }

  // ----- Init all sliders on the page -----
  ready(function () {
    document.querySelectorAll('.uk-slider').forEach((root) => {
      // Only init if it actually has items
      if (root.querySelector('.uk-slider-items > *')) {
        new Slider(root);
      }
    });
  });

})();