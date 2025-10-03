// Lightweight analytics hooks (no PII). Replace with GA4/CF Analytics as needed.
document.addEventListener('DOMContentLoaded', () => {
  const qs = (s)=>document.querySelector(s);
  document.querySelectorAll('[data-cta]').forEach(btn=>{
    btn.addEventListener('click',()=>console.log('CTA_CLICK', btn.dataset.cta));

    (() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Items we animate, and groups that stagger their children
  const items  = document.querySelectorAll('.ok-anim');
  const groups = document.querySelectorAll('.ok-stagger-group');

  if (reduce) {
    items.forEach(el => el.classList.add('visible'));
    return;
  }

  // Helper: reveal with optional delay already in CSS variable
  const reveal = (el) => {
    el.classList.add('visible');
  };

  // Observe both individual items and groups
  const io = new IntersectionObserver((entries, obs) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;

      const el = entry.target;

      // If it's a stagger group, reveal its children with stepped delays
      if (el.classList.contains('ok-stagger-group')) {
        const step = getComputedStyle(el).getPropertyValue('--ok-stagger-step').trim() || '.08s';
        const children = el.querySelectorAll('.ok-anim');
        children.forEach((child, i) => {
          child.style.setProperty('--ok-delay', `calc(${step} * ${i})`);
          reveal(child);
        });
      } else {
        // Single item
        reveal(el);
      }

      obs.unobserve(el);
    }
  }, {
    root: null,
    rootMargin: '0px 0px -8% 0px',
    threshold: 0.12
  });

  // Start observing
  items.forEach(el => io.observe(el));
  groups.forEach(el => io.observe(el));
})();
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

const slider = document.querySelector(".uk-slider");
  const track = slider.querySelector(".uk-slider-items");
  const slides = slider.querySelectorAll("li");
  const dots = slider.querySelectorAll(".uk-dotnav li");
  let index = 0;

  function updateSlider() {
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((d,i)=> d.classList.toggle("active", i === index));
  }

  // Prev/Next
  slider.querySelector(".uk-slidenav.prev").addEventListener("click", () => {
    index = (index > 0) ? index - 1 : slides.length - 1;
    updateSlider();
  });
  slider.querySelector(".uk-slidenav.next").addEventListener("click", () => {
    index = (index < slides.length - 1) ? index + 1 : 0;
    updateSlider();
  });

  // Dots
  dots.forEach((dot,i) => {
    dot.addEventListener("click", ()=> {
      index = i;
      updateSlider();
    });
  });

  // Autoplay
  setInterval(() => {
    index = (index < slides.length - 1) ? index + 1 : 0;
    updateSlider();
  }, 6000);

  updateSlider();

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

