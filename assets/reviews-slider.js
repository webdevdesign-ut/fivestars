
/*!
 * WDD UIkit-style Slider (standalone, no dependencies)
 * Features: 1-per-view slides, arrows, dots, autoplay (pause on hover/focus), swipe, infinite wrap.
 * Usage:
 *   <div class="uk-slider">
 *     <div class="uk-slider-container">
 *       <ul class="uk-slider-items"> <li>…</li> … </ul>
 *     </div>
 *     <button class="uk-slidenav prev">‹</button>
 *     <button class="uk-slidenav next">›</button>
 *     <ul class="uk-dotnav"></ul>
 *   </div>
 * Options (optional via data-attrs on .uk-slider):
 *   data-autoplay="6000"   (ms, default 6000)
 *   data-loop="true|false" (default true)
 */
(function(){
  function initSlider(root){
    const track   = root.querySelector('.uk-slider-items');
    const slides  = track ? Array.from(track.children) : [];
    const prevBtn = root.querySelector('.uk-slidenav.prev');
    const nextBtn = root.querySelector('.uk-slidenav.next');
    const dotsEl  = root.querySelector('.uk-dotnav');
    if (!track || !slides.length) return;

    // Options
    const autoplayMs = parseInt(root.getAttribute('data-autoplay') || '6000', 10);
    const loop = String(root.getAttribute('data-loop') || 'true') !== 'false';
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Build dots dynamically (if container exists)
    let dots = [];
    if (dotsEl) {
      dotsEl.innerHTML = '';
      dots = slides.map((_, i)=>{
        const li = document.createElement('li');
        li.setAttribute('role','tab');
        li.setAttribute('aria-label', 'Go to slide ' + (i+1));
        li.addEventListener('click', ()=> go(i, true));
        dotsEl.appendChild(li);
        return li;
      });
    }

    let index = 0;
    let timer = null;

    function wrap(i){
      const n = slides.length;
      return ((i % n) + n) % n;
    }

    function render(){
      index = wrap(index);
      track.style.transform = 'translateX(' + (-index * 100) + '%)';
      if (dots.length) dots.forEach((d,k)=> d.classList.toggle('active', k===index));
    }

    function go(i, user=false){
      index = i;
      render();
      if (user) restart();
    }
    function next(){ index++; if (!loop && index>=slides.length) index = slides.length-1; render(); }
    function prev(){ index--; if (!loop && index<0) index = 0; render(); }

    // Buttons
    if (prevBtn) prevBtn.addEventListener('click', ()=> go(index-1, true));
    if (nextBtn) nextBtn.addEventListener('click', ()=> go(index+1, true));

    // Autoplay
    function start(){
      stop();
      if (prefersReduced || autoplayMs <= 0) return;
      timer = setInterval(()=> { if (loop) index++; else if (index < slides.length-1) index++; render(); }, autoplayMs);
    }
    function stop(){ if (timer) { clearInterval(timer); timer = null; } }
    function restart(){ start(); }

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', start);
    document.addEventListener('visibilitychange', ()=> { if (document.hidden) stop(); else start(); });

    // Swipe / drag
    let down = false, startX = 0, curX = 0;
    const thresholdPx = ()=> Math.min(140, root.clientWidth * 0.22);
    track.addEventListener('pointerdown', (e)=> {
      down = true; startX = curX = e.clientX;
      track.style.transition = 'none'; track.setPointerCapture(e.pointerId);
    });
    track.addEventListener('pointermove', (e)=> {
      if (!down) return;
      curX = e.clientX;
      const dx = curX - startX;
      track.style.transform = 'translateX(calc(' + (-index * 100) + '% + ' + dx + 'px))';
    });
    function endDrag(){
      if (!down) return;
      down = false;
      track.style.transition = 'transform .5s ease';
      const dx = curX - startX;
      const t = thresholdPx();
      if (dx > t) go(index-1, true);
      else if (dx < -t) go(index+1, true);
      else render();
    }
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);

    // Initial
    track.style.transition = 'transform .5s ease';
    render();
    start();

    // Re-snap on resize (in case of layout shifts)
    window.addEventListener('resize', render);
  }

  document.addEventListener('DOMContentLoaded', function(){
    document.querySelectorAll('.uk-slider').forEach(initSlider);
  });
})();
