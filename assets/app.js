/* app.js — Five Stars Cleaning
   - Scroll reveal for .reveal / [data-reveal-group]
   - Form validation + Formspree JSON handling
   - Google Ads conversions: form submit + tel: clicks
   - Safe gtag shim; no duplicate slider code (use reviews-slider.js)
*/

(function () {
  'use strict';

  // ----- Safe gtag shim (never throws even if gtag.js is late) -----
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { dataLayer.push(arguments); };

  function sendAdConversion(sendTo, params) {
    try {
      if (sendTo) gtag('event', 'conversion', Object.assign({ send_to: sendTo }, params || {}));
    } catch (e) { /* keep UI alive */ }
  }

  // ===== CTA click debug (optional) =====
  function initCTA() {
    document.querySelectorAll('[data-cta]').forEach(btn => {
      btn.addEventListener('click', () => console.log('CTA_CLICK', btn.dataset.cta));
    });
  }

  // ===== Form validation + submit (Formspree JSON) =====
  // Use this function from HTML: onsubmit="submitLead(event)"
  window.submitLead = function submitLead(e) {
    e.preventDefault();
    const form = e.target;

    // Find or create a status element for messages
    let statusEl = form.querySelector('[data-form-status]') || form.querySelector('#form-status');
    if (!statusEl) {
      statusEl = document.createElement('p');
      statusEl.setAttribute('data-form-status', '1');
      statusEl.style.marginTop = '8px';
      form.appendChild(statusEl);
    }
    statusEl.style.color = '#b91c1c'; // red by default (errors)
    statusEl.textContent = '';

    const nameField  = form.querySelector('[name="contact"], [name="name"]');
    const phoneField = form.querySelector('[name="phone"]');
    const emailField = form.querySelector('[name="email"]');

    const name  = nameField ? String(nameField.value || '').trim() : '';
    const phone = phoneField ? String(phoneField.value || '').trim() : '';
    const email = emailField ? String(emailField.value || '').trim() : '';

    // Basic validation
    if (!name || !phone) {
      statusEl.textContent = 'Please fill in your name and phone number.';
      return;
    }
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 7) {
      statusEl.textContent = 'Please enter a valid phone number.';
      return;
    }
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      statusEl.textContent = 'Please enter a valid email address.';
      return;
    }

    // Submit to Formspree with JSON response (prevents redirect)
    const formData = new FormData(form);
    fetch(form.action, {
      method: form.method || 'POST',
      body: formData,
      headers: { 'Accept': 'application/json' }
    }).then(response => {
      if (response.ok) {
        // Success UI
        statusEl.style.color = 'green';
        statusEl.textContent = "Thank you! We’ll contact you shortly.";
        form.reset();

        // Google Ads conversion: FORM SUBMIT
        // Your label: tcMeCIeoyKkbENOSsrYq
        sendAdConversion('AW-11388356947/tcMeCIeoyKkbENOSsrYq');
      } else {
        // Try to surface Formspree errors
        response.json().then(data => {
          if (data && Array.isArray(data.errors) && data.errors.length) {
            statusEl.textContent = data.errors.map(err => err.message).join(', ');
          } else {
            statusEl.textContent = 'Oops! There was a problem submitting your form.';
          }
        }).catch(() => {
          statusEl.textContent = 'Oops! There was a problem submitting your form.';
        });
      }
    }).catch(() => {
      statusEl.textContent = 'Sorry, we could not submit the form. Please call us at (385) 202-7198.';
    });
  };

  // ===== Track tel: clicks as Google Ads conversions =====
  function initTelTracking() {
    const links = document.querySelectorAll('a[href^="tel:"]');
    if (!links.length) return;

    links.forEach(link => {
      link.addEventListener('click', function (evt) {
        // Let’s not block default unless necessary; on some devices
        // immediate navigation can cancel the hit, so we do a guarded delay.
        evt.preventDefault();
        const href = link.getAttribute('href');
        let done = false;
        function go() { if (!done) { done = true; window.location.href = href; } }

        // Google Ads conversion: CLICK TO CALL
        // Your label: rN5UCO7Vx6kbENOSsrYq
        sendAdConversion('AW-11388356947/rN5UCO7Vx6kbENOSsrYq', { event_callback: go });

        // Fallback to ensure the dialer opens even if tracking is slow
        setTimeout(go, 700);
      });
    });
  }

  // ===== Init on DOM ready =====
  document.addEventListener('DOMContentLoaded', function () {
    initCTA();
    initTelTracking();
  });

})();