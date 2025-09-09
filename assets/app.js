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
