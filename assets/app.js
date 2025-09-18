// Lightweight analytics hooks (no PII). Replace with GA4/CF Analytics as needed.
document.addEventListener('DOMContentLoaded', () => {
  const qs = (s)=>document.querySelector(s);
  document.querySelectorAll('[data-cta]').forEach(btn=>{
    btn.addEventListener('click',()=>console.log('CTA_CLICK', btn.dataset.cta));
  });

  (function () {
  function initMarquee(root) {
    const track = root.querySelector('.wdd-marquee__track');
    if (!track) return;

    // collect original items
    const items = Array.from(track.children);
    if (items.length === 0) return;

    // Ensure images have loaded before measuring
    const waitForImages = () => Promise.all(
      Array.from(track.querySelectorAll('img'))
        .filter(img => !img.complete)
        .map(img => new Promise(res => {
          img.addEventListener('load', res, { once: true });
          img.addEventListener('error', res, { once: true });
        }))
    );

    const measure = () => {
      // reset clones
      Array.from(track.querySelectorAll('[data-clone="1"]')).forEach(n => n.remove());

      // measure content width
      const containerW = root.clientWidth;
      let contentW = track.scrollWidth;

      // clone until we at least cover 2x container for seamless loop
      let safety = 0;
      while (contentW < containerW * 2 && safety < 10) {
        items.forEach(el => {
          const clone = el.cloneNode(true);
          clone.setAttribute('data-clone', '1');
          track.appendChild(clone);
        });
        contentW = track.scrollWidth;
        safety++;
      }

      // compute animation duration from width & speed
      const speed = Number(getComputedStyle(root).getPropertyValue('--speed')) || 120; // px/s
      // We animate from 0 to -50% since we duplicated; distance = 0.5 * contentW
      const distance = contentW * 0.5;
      const duration = Math.max(10, distance / speed); // seconds, min clamp

      track.style.animationDuration = duration + 's';
      // nudge to start at 0 transform
      track.style.animationName = 'wdd-marquee-linear';
      track.style.animationTimingFunction = 'linear';
      track.style.animationIterationCount = 'infinite';
      track.style.animationPlayState = 'running';
    };

    const start = async () => {
      await waitForImages();
      measure();
    };

    // re-measure on resize (debounced)
    let to = null;
    const onResize = () => {
      clearTimeout(to);
      to = setTimeout(measure, 150);
    };
    window.addEventListener('resize', onResize);

    // clean up if needed (not strictly necessary on WP pages)
    root._wddMarqueeDestroy = () => {
      window.removeEventListener('resize', onResize);
    };

    start();
  }

  // Start only when visible (saves CPU on pages with many sliders)
  const roots = document.querySelectorAll('.wdd-marquee');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target._wddMarqueeStarted) {
          entry.target._wddMarqueeStarted = true;
          initMarquee(entry.target);
        }
      });
    }, { rootMargin: '200px' });
    roots.forEach(el => io.observe(el));
  } else {
    roots.forEach(initMarquee);
  }
})();

(function () {
  function makeCarousel(root) {
    const viewport = root.querySelector('.wdd-reviews__viewport');
    const track = root.querySelector('.wdd-reviews__track');
    const prevBtn = root.querySelector('.wdd-reviews__prev');
    const nextBtn = root.querySelector('.wdd-reviews__next');
    const dotsWrap = root.querySelector('.wdd-reviews__dots');
    if (!viewport || !track) return;

    let slides = Array.from(track.children);
    if (slides.length < 1) return;

    // Build dots
    dotsWrap.innerHTML = '';
    slides.forEach((_, i) => {
      const b = document.createElement('button');
      b.className = 'wdd-reviews__dot';
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', `Go to testimonial ${i + 1}`);
      b.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(b);
    });

    // Infinite: clone first & last
    const firstClone = slides[0].cloneNode(true);
    const lastClone = slides[slides.length - 1].cloneNode(true);
    firstClone.dataset.clone = '1';
    lastClone.dataset.clone = '1';
    track.insertBefore(lastClone, slides[0]);
    track.appendChild(firstClone);

    // Rebuild slide list with clones at ends
    slides = Array.from(track.children);
    let index = 1; // start at first real slide
    let slideW = 0;
    let autoplayId = null;
    let isDragging = false, startX = 0, currentX = 0;

    function measure() {
      // Each slide is 100% width; get actual width including gap by rect of track/slide.
      slideW = viewport.clientWidth + getGap();
      setHeight(slides[index]);
      translateTo(index, false);
    }

    function getGap() {
      const styles = getComputedStyle(track);
      const gap = parseFloat(styles.columnGap || styles.gap || '0');
      return isNaN(gap) ? 0 : gap;
    }

    function setHeight(el) {
      viewport.style.height = el.getBoundingClientRect().height + 'px';
    }

    function translateTo(i, animate = true) {
      if (!animate) root.classList.add('wdd-reviews--dragging');
      const offset = -i * slideW;
      track.style.transform = `translate3d(${offset}px,0,0)`;
      if (!animate) {
        // force reflow then enable transition again
        void track.offsetHeight;
        root.classList.remove('wdd-reviews--dragging');
      }
      updateDots();
    }

    function updateDots() {
      const realCount = slides.length - 2;
      const realIndex = Math.max(0, Math.min(realCount - 1, index - 1));
      dotsWrap.querySelectorAll('.wdd-reviews__dot').forEach((d, i) => {
        d.setAttribute('aria-selected', i === realIndex ? 'true' : 'false');
      });
    }

    function next() { goTo(index + 1); }
    function prev() { goTo(index - 1); }

    function goTo(i) {
      index = i;
      track.style.transition = 'transform .45s ease';
      translateTo(index, true);
    }

    track.addEventListener('transitionend', () => {
      const realCount = slides.length - 2;
      if (slides[index].dataset.clone === '1') {
        // jumped onto a clone → snap to corresponding real slide without animation
        track.style.transition = 'none';
        if (index === slides.length - 1) { // past last clone of first
          index = 1;
        } else if (index === 0) { // before first clone of last
          index = realCount;
        }
        translateTo(index, false);
      }
      setHeight(slides[index]);
    });

    // Autoplay (pause on hover/focus)
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function startAutoplay() {
      if (prefersReduced) return;
      stopAutoplay();
      autoplayId = setInterval(next, 6000);
    }
    function stopAutoplay() {
      if (autoplayId) clearInterval(autoplayId);
      autoplayId = null;
    }
    root.addEventListener('mouseenter', stopAutoplay);
    root.addEventListener('mouseleave', startAutoplay);
    root.addEventListener('focusin', stopAutoplay);
    root.addEventListener('focusout', startAutoplay);

    // Buttons
    if (prevBtn) prevBtn.addEventListener('click', prev);
    if (nextBtn) nextBtn.addEventListener('click', next);

    // Keyboard (when focused inside carousel)
    root.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    });

    // Drag / Swipe
    const onDown = (clientX) => {
      isDragging = true;
      startX = currentX = clientX;
      track.style.transition = 'none';
    };
    const onMove = (clientX) => {
      if (!isDragging) return;
      currentX = clientX;
      const dx = currentX - startX;
      const baseOffset = -index * slideW;
      track.style.transform = `translate3d(${baseOffset + dx}px,0,0)`;
    };
    const onUp = () => {
      if (!isDragging) return;
      const dx = currentX - startX;
      isDragging = false;
      track.style.transition = 'transform .35s ease';
      const threshold = Math.min(140, slideW * 0.25);
      if (dx > threshold) prev();
      else if (dx < -threshold) next();
      else translateTo(index, true);
    };

    // Pointer/touch listeners
    viewport.addEventListener('pointerdown', (e) => { e.preventDefault(); viewport.setPointerCapture(e.pointerId); onDown(e.clientX); });
    viewport.addEventListener('pointermove', (e) => onMove(e.clientX));
    viewport.addEventListener('pointerup', onUp);
    viewport.addEventListener('pointercancel', onUp);
    viewport.addEventListener('touchstart', (e) => onDown(e.touches[0].clientX), { passive: true });
    viewport.addEventListener('touchmove', (e) => onMove(e.touches[0].clientX), { passive: true });
    viewport.addEventListener('touchend', onUp);

    // Resize
    let rto;
    const onResize = () => { clearTimeout(rto); rto = setTimeout(measure, 150); };
    window.addEventListener('resize', onResize);

    // Initial layout
    measure();
    // position to first real slide (index=1) w/o animation
    track.style.transition = 'none';
    translateTo(index, false);
    startAutoplay();

    // Cleanup (optional)
    root._destroyReviews = () => {
      stopAutoplay();
      window.removeEventListener('resize', onResize);
    };
  }

  document.querySelectorAll('.wdd-reviews').forEach(makeCarousel);
})();


});

// Simple form handler (replace action with your backend/Zapier/Forms service)
function submitLead(e){
  e.preventDefault();
  const fd = new FormData(e.target);
  // Example: POST to your endpoint
  fetch('https://formspree.io/f/your-id', {method:'POST', body:fd})
    .then(()=>{ alert('Thanks! We’ll contact you shortly.'); e.target.reset(); })
    .catch(()=>{ alert('Sorry—please call us: (385) 202-7198'); });
}

// ===== Scroll reveal with IntersectionObserver =====
(function(){
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const io = new IntersectionObserver((entries, obs)=>{
    entries.forEach(entry=>{
      if (entry.isIntersecting){
        entry.target.classList.add('in-view');
        obs.unobserve(entry.target);
      }
    });
  }, {root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.15});

  // Single items
  document.querySelectorAll('[data-reveal], .reveal').forEach(el=> io.observe(el));

  // Stagger groups
  document.querySelectorAll('[data-reveal-group]').forEach(group=>{
    const children = group.querySelectorAll(':scope > .reveal, :scope > [data-reveal]');
    children.forEach((el, i)=>{
      el.style.setProperty('--d', (i * 0.08)+'s'); // 80ms stagger
      io.observe(el);
    });
  });
})();