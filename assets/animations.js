/* animations.js
   - Scroll reveal for .reveal / [data-reveal-group]
   - Seamless marquee for .wdd-marquee (duplicates logos, measures width, sets duration)
*/

(function () {
  'use strict';

  // ===== Scroll Reveal =====
  function initReveal() {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const singles = document.querySelectorAll('.reveal');
    const groups  = document.querySelectorAll('[data-reveal-group]');

    if (prefersReduced) {
      singles.forEach(el => el.classList.add('in-view'));
      groups.forEach(g => g.querySelectorAll('.reveal').forEach(el => el.classList.add('in-view')));
      return;
    }

    const io = new IntersectionObserver((entries, obs) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target;
        if (el.hasAttribute('data-reveal-group')) {
          const step = parseFloat(el.getAttribute('data-reveal-step')) || 0.08;
          const kids = el.querySelectorAll('.reveal');
          kids.forEach((kid, i) => {
            kid.style.setProperty('--d', `${(i * step).toFixed(2)}s`);
            kid.classList.add('in-view');
          });
        } else {
          el.classList.add('in-view');
        }
        obs.unobserve(el);
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    singles.forEach(el => io.observe(el));
    groups.forEach(el => io.observe(el));
  }

  // ===== Seamless Logo Marquee =====
  function initMarquees() {
    const marquees = document.querySelectorAll('.wdd-marquee');
    marquees.forEach(marquee => {
      const track = marquee.querySelector('.wdd-marquee__track');
      if (!track) return;

      // Avoid double-init
      if (track.dataset.marqueeInit) return;
      track.dataset.marqueeInit = '1';

      // Duplicate content to avoid gap (A + B)
      const original = Array.from(track.children);
      if (!original.length) return;
      const clone = document.createDocumentFragment();
      original.forEach(node => clone.appendChild(node.cloneNode(true)));
      track.appendChild(clone);

      function compute() {
        // Reset any animation to measure clean width
        track.style.animation = 'none';

        // Width of the first set (half of total after dup)
        const imgs = track.querySelectorAll('img');
        // Ensure layout has accurate sizes
        const firstSetWidth = Math.round(track.scrollWidth / 2);

        // Speed from CSS var (pixels per second). Fallback to 140.
        const cs = getComputedStyle(marquee);
        const speed = parseFloat(cs.getPropertyValue('--speed')) || 140;
        const duration = Math.max(10, firstSetWidth / speed); // seconds, min 10

        track.style.setProperty('--marquee-distance', firstSetWidth + 'px');
        track.style.animation = `wdd-marquee-move ${duration}s linear infinite`;
      }

      // Recompute after images load and on resize
      let raf;
      const recalc = () => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(compute);
      };

      // If images are present, wait for them
      const imgs = track.querySelectorAll('img');
      let pending = imgs.length;
      if (pending) {
        imgs.forEach(img => {
          if (img.complete) { if (--pending === 0) recalc(); }
          else img.addEventListener('load', () => { if (--pending === 0) recalc(); }, { once: true });
        });
      } else {
        recalc();
      }

      window.addEventListener('resize', recalc);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initReveal();
    initMarquees();
  });
})();