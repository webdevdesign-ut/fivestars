// ===== Scroll Reveal =====
  function initReveal() {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const singles = document.querySelectorAll('.reveal');
    const groups  = document.querySelectorAll('[data-reveal-group]');

    // If user prefers reduced motion, just show everything
    if (prefersReduced) {
      singles.forEach(el => el.classList.add('in-view'));
      groups.forEach(group => group.querySelectorAll('.reveal').forEach(el => el.classList.add('in-view')));
      return;
    }

    const io = new IntersectionObserver((entries, obs) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target;

        // Group: stagger children that have .reveal
        if (el.hasAttribute('data-reveal-group')) {
          const step = parseFloat(el.getAttribute('data-reveal-step')) || 0.08; // seconds
          const kids = el.querySelectorAll('.reveal');
          kids.forEach((kid, i) => {
            kid.style.setProperty('--d', `${(i * step).toFixed(2)}s`);
            kid.classList.add('in-view');
          });
        } else {
          // Single item
          el.classList.add('in-view');
        }

        obs.unobserve(el);
      }
    }, { root: null, rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    // Observe
    singles.forEach(el => io.observe(el));
    groups.forEach(el => io.observe(el));
  }