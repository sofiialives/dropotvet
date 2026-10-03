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
    initScrollTop();
  });
})();
