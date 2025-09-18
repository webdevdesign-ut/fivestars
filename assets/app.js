// Lightweight analytics hooks (no PII). Replace with GA4/CF Analytics as needed.
document.addEventListener('DOMContentLoaded', () => {
  const qs = (s)=>document.querySelector(s);
  document.querySelectorAll('[data-cta]').forEach(btn=>{
    btn.addEventListener('click',()=>console.log('CTA_CLICK', btn.dataset.cta));
  });
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
