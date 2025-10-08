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


// FORM HANDLER WITH ERROR CHECKING
function submitLead(e) {
  e.preventDefault();  // Stop form from submitting normally
  const form = e.target;
  const nameField = form.querySelector('[name="contact"], [name="name"]');  // covers both possible name fields
  const phoneField = form.querySelector('[name="phone"]');
  const emailField = form.querySelector('[name="email"]');
  const statusEl = document.getElementById('form-status');
  statusEl.textContent = "";  // clear previous status
  
  // Validate required fields
  if (!nameField.value.trim() || !phoneField.value.trim()) {
    statusEl.textContent = "Please fill in your name and phone number.";
    return;  // stop submission due to validation error
  }
  // Validate email format if email is not empty
  if (emailField && emailField.value && !/^\S+@\S+\.\S+$/.test(emailField.value)) {
    statusEl.textContent = "Please enter a valid email address.";
    return;
  }
  // Validate phone number pattern (ensure it has enough digits)
  const digitsOnly = phoneField.value.replace(/\D/g, "");  // remove non-numeric chars
  if (digitsOnly.length < 7) {  // require at least 7 digits (adjustable based on needs)
    statusEl.textContent = "Please enter a valid phone number.";
    return;
  }
  // If we reach here, all validations passed. Proceed to submit via fetch...
  const formData = new FormData(form);
  fetch(form.action, {
    method: form.method,
    body: formData,
    headers: { 'Accept': 'application/json' }  // request JSON response from Formspree
  }).then(response => {
    if (response.ok) {
      // Success: show confirmation and reset form
      statusEl.style.color = "green";
      statusEl.textContent = "Thank you! We’ll contact you shortly.";
      form.reset();
      // **Trigger Google Ads conversion for form submit here (see next section)**
      gtag('event', 'conversion', {'send_to': 'AW-11388356947/tcMeCIeoyKkbENOSsrYq'});
    } else {
      // Server returned an error status (e.g. validation issue)
      response.json().then(data => {
        if (data.errors && data.errors.length) {
          // Show Formspree validation errors (e.g. invalid email format)
          statusEl.textContent = data.errors.map(err => err.message).join(", ");
        } else {
          statusEl.textContent = "Oops! There was a problem submitting your form.";
        }
      });
    }
  }).catch(() => {
    // Network or CORS error (Formspree not reachable or other issues)
    statusEl.textContent = "Sorry, we could not submit the form. Please call us at (385) 202-7198.";
  });
}

//EVENT TRACKER FOR PHONE CALLS
// Safe gtag shim (works even if gtag.js is late)
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function(){ dataLayer.push(arguments); };

  // Tiny helper that never throws
  function sendAdConversion(sendTo, params) {
    try {
      if (sendTo) gtag('event', 'conversion', Object.assign({ send_to: sendTo }, params || {}));
    } catch (e) { /* keep UI alive */ }
  }

  // Example: track tel: clicks
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('a[href^="tel:"]').forEach(function (link) {
      link.addEventListener('click', function () {
        var href = link.getAttribute('href');
        var done = false;
        function go() { if (!done) { done = true; window.location.href = href; } }
        sendAdConversion('AW-11388356947/rN5UCO7Vx6kbENOSsrYq', { event_callback: go });
        setTimeout(go, 700); // fallback so navigation isn't blocked
      });
    });
  });