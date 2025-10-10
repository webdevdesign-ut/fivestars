(function () {
  'use strict';
  
    document.querySelectorAll('.faq-item').forEach(function(btn){
    btn.addEventListener('click', function(){
      var expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      var answer = btn.nextElementSibling;
      if (!answer) return;
      answer.hidden = expanded;
    });
  });

  document.addEventListener('DOMContentLoaded', function () {
    initCTA();
    initTelTracking();
  });

})();