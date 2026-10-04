/* ==========================================================================
   WOW EXTRAS — DropOtvet KP
   Прогресс-бар скролла, навигация по секциям, анимированные счётчики,
   магнитная подсветка карточки цены, кнопка "наверх".
   Отдельный файл — не трогает основной script.js.
   ========================================================================== */
(function () {
  'use strict';
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- 1. Прогресс-бар скролла ---- */
  function initProgressBar() {
    var bar = document.getElementById('progressBar');
    if (!bar) return;
    function update() {
      var h = document.documentElement;
      var scrollable = h.scrollHeight - h.clientHeight;
      var pct = scrollable > 0 ? (h.scrollTop / scrollable) * 100 : 0;
      bar.style.width = pct + '%';
    }
    document.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ---- 2. Точки-навигация по секциям (desktop) + текстовый индикатор (mobile) ---- */
  function initSectionDots() {
    var nav = document.getElementById('sectionDots');
    var indicator = document.getElementById('mobileSectionIndicator');
    var sections = Array.prototype.slice.call(document.querySelectorAll('section[data-dot], footer[data-dot]'));
    if ((!nav && !indicator) || !sections.length) return;

    var buttons = [];
    if (nav) {
      buttons = sections.map(function (sec) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'section-dots__item';
        btn.setAttribute('aria-label', sec.getAttribute('data-dot'));
        btn.innerHTML = '<span class="section-dots__label">' + sec.getAttribute('data-dot') + '</span><span class="section-dots__dot"></span>';
        btn.addEventListener('click', function () {
          sec.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
        });
        nav.appendChild(btn);
        return btn;
      });
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var idx = sections.indexOf(entry.target);
        if (idx === -1) return;
        if (entry.isIntersecting) {
          if (buttons.length) {
            buttons.forEach(function (b) { b.classList.remove('is-active'); });
            buttons[idx].classList.add('is-active');
          }
          if (indicator) {
            indicator.innerHTML = '<span class="dot"></span>' + entry.target.getAttribute('data-dot');
            indicator.classList.add('is-visible');
          }
        }
      });
    }, { threshold: 0, rootMargin: '-45% 0px -45% 0px' });

    sections.forEach(function (sec) { observer.observe(sec); });

    if (indicator) {
      window.addEventListener('scroll', function () {
        if (window.scrollY < 80) indicator.classList.remove('is-visible');
      }, { passive: true });
    }
  }

  /* ---- 3. Анимированные счётчики ---- */
  function initCounters() {
    var items = document.querySelectorAll('.counter');
    if (!items.length) return;
    if (prefersReducedMotion) {
      items.forEach(function (el) { el.textContent = el.getAttribute('data-count'); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseInt(el.getAttribute('data-count'), 10) || 0;
        var duration = 900;
        var start = null;
        function step(ts) {
          if (!start) start = ts;
          var progress = Math.min((ts - start) / duration, 1);
          var eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.round(eased * target);
          if (progress < 1) requestAnimationFrame(step);
          else el.textContent = target;
        }
        requestAnimationFrame(step);
        observer.unobserve(el);
      });
    }, { threshold: 0.6 });
    items.forEach(function (el) { observer.observe(el); });
  }

  /* ---- 4. Магнитная подсветка карточки цены (мышь, перо и палец) ---- */
  function initMagneticCard() {
    var card = document.getElementById('magneticCard');
    if (!card || prefersReducedMotion) return;
    card.addEventListener('pointermove', function (e) {
      var rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
      card.style.setProperty('--my', (e.clientY - rect.top) + 'px');
    });
  }

  /* ---- 4b. Тап-свечение на карточках: desktop (hover/move) и mobile (тап) ---- */
  function initTapGlow() {
    if (prefersReducedMotion) return;
    var selector = '.feature-panel, .rubric-item, .about__callout, .quote-card, .pricing-card';
    var cards = Array.prototype.slice.call(document.querySelectorAll(selector));
    if (!cards.length) return;

    cards.forEach(function (card) {
      card.classList.add('tap-glow');
      var hideTimer = null;

      function setPos(x, y) {
        var rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', (x - rect.left) + 'px');
        card.style.setProperty('--my', (y - rect.top) + 'px');
      }

      card.addEventListener('pointermove', function (e) {
        if (e.pointerType === 'mouse') {
          setPos(e.clientX, e.clientY);
          card.classList.add('is-glowing');
        }
      });
      card.addEventListener('pointerleave', function (e) {
        if (e.pointerType === 'mouse') card.classList.remove('is-glowing');
      });
      /* тач/перо: показать мягкое свечение в точке касания и погасить через паузу */
      card.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'mouse') return;
        setPos(e.clientX, e.clientY);
        card.classList.add('is-glowing');
        if (hideTimer) clearTimeout(hideTimer);
        hideTimer = setTimeout(function () { card.classList.remove('is-glowing'); }, 900);
      });
    });
  }

  /* ---- 4c. Карусели кейсов: стрелки + точки + нативный свайп ---- */
  function initCaseCarousels() {
    var carousels = Array.prototype.slice.call(document.querySelectorAll('.case-carousel'));
    if (!carousels.length) return;

    carousels.forEach(function (carousel) {
      var track = carousel.querySelector('.case-carousel__track');
      var slides = Array.prototype.slice.call(carousel.querySelectorAll('.case-carousel__slide'));
      var prevBtn = carousel.querySelector('.case-carousel__arrow--prev');
      var nextBtn = carousel.querySelector('.case-carousel__arrow--next');
      var dotsWrap = carousel.querySelector('.case-carousel__dots');
      if (!track || !slides.length) return;

      var dots = slides.map(function (_, i) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'case-carousel__dot';
        dot.setAttribute('aria-label', 'Слайд ' + (i + 1));
        dot.addEventListener('click', function () { scrollToSlide(i); });
        if (dotsWrap) dotsWrap.appendChild(dot);
        return dot;
      });

      /* offsetLeft is relative to the nearest positioned ancestor, not
         necessarily the scrolling track — use getBoundingClientRect() so
         this works regardless of what sits between slide and track. */
      function slideLeft(i) {
        return slides[i].getBoundingClientRect().left - track.getBoundingClientRect().left + track.scrollLeft;
      }

      function scrollToSlide(i) {
        i = Math.max(0, Math.min(slides.length - 1, i));
        var target = slideLeft(i);
        var startLeft = track.scrollLeft;
        track.scrollTo({ left: target, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        /* Safety net: some browser/automation combinations silently drop a
           smooth-scroll animation on its first call. If nothing moved after
           a beat, force it instantly so the controls never feel dead. */
        setTimeout(function () {
          if (Math.abs(track.scrollLeft - startLeft) < 2 && Math.abs(target - startLeft) > 2) {
            track.scrollTo({ left: target, behavior: 'auto' });
          }
        }, 260);
      }

      function currentIndex() {
        /* nearest slide to the current scroll position reads more reliably
           than a fixed threshold, especially near the last slide where less
           than a full slide-width of scroll range remains. */
        var pos = track.scrollLeft;
        var best = 0, bestDist = Infinity;
        slides.forEach(function (s, i) {
          var dist = Math.abs(slideLeft(i) - pos);
          if (dist < bestDist) { bestDist = dist; best = i; }
        });
        return best;
      }

      function setActive(idx) {
        dots.forEach(function (d, i) { d.classList.toggle('is-active', i === idx); });
        if (prevBtn) prevBtn.toggleAttribute('disabled', idx <= 0);
        if (nextBtn) nextBtn.toggleAttribute('disabled', idx >= slides.length - 1);
      }

      function updateUI() { setActive(currentIndex()); }

      /* Clicking an arrow already tells us exactly which slide we're headed
         to, so mark it active immediately rather than waiting on the scroll
         event — the debounced scroll handler can otherwise race a fast
         double-click and leave the dots a step behind. */
      if (prevBtn) prevBtn.addEventListener('click', function () {
        var idx = Math.max(0, currentIndex() - 1);
        scrollToSlide(idx);
        setActive(idx);
      });
      if (nextBtn) nextBtn.addEventListener('click', function () {
        var idx = Math.min(slides.length - 1, currentIndex() + 1);
        scrollToSlide(idx);
        setActive(idx);
      });

      var scrollTimer = null;
      track.addEventListener('scroll', function () {
        if (scrollTimer) clearTimeout(scrollTimer);
        scrollTimer = setTimeout(updateUI, 80);
      }, { passive: true });

      window.addEventListener('resize', updateUI);
      updateUI();
    });
  }

  /* ---- 5b. Аккордеон блоков работы + мини-навигация по ним ---- */
  function initFeaturePanels() {
    var panels = Array.prototype.slice.call(document.querySelectorAll('.feature-panel'));
    if (!panels.length) return;

    function setOpen(panel, open) {
      panel.classList.toggle('is-open', open);
      var head = panel.querySelector('.feature-panel__head');
      if (head) head.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    panels.forEach(function (panel) {
      var head = panel.querySelector('.feature-panel__head');
      if (!head) return;
      head.addEventListener('click', function () {
        setOpen(panel, !panel.classList.contains('is-open'));
      });
    });

    /* мини-навигация: пилюли 01..07, клик — раскрыть и проскроллить к блоку */
    var nav = document.getElementById('scopeNav');
    if (nav) {
      panels.forEach(function (panel, i) {
        var num = (i + 1 < 10 ? '0' : '') + (i + 1);
        var label = panel.getAttribute('data-dot-label') || num;
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'scope-nav__btn';
        btn.innerHTML = '<span class="scope-nav__num">' + num + '</span>' + label;
        btn.addEventListener('click', function () {
          setOpen(panel, true);
          panel.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
        });
        nav.appendChild(btn);
      });

      var navButtons = Array.prototype.slice.call(nav.children);
      var navObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var idx = panels.indexOf(entry.target);
          if (idx === -1) return;
          if (entry.isIntersecting) {
            navButtons.forEach(function (b) { b.classList.remove('is-active'); });
            navButtons[idx].classList.add('is-active');
          }
        });
      }, { threshold: 0, rootMargin: '-20% 0px -65% 0px' });
      panels.forEach(function (p) { navObserver.observe(p); });
    }
  }

  /* ---- 5. Кнопка "наверх" ---- */
  function initScrollTop() {
    var btn = document.getElementById('scrollTopBtn');
    if (!btn) return;
    function update() {
      if (window.scrollY > 800) btn.classList.add('is-visible');
      else btn.classList.remove('is-visible');
    }
    document.addEventListener('scroll', update, { passive: true });
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
    update();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initProgressBar();
    initSectionDots();
    initCounters();
    initMagneticCard();
    initTapGlow();
    initFeaturePanels();
    initCaseCarousels();
    initScrollTop();
  });
})();
