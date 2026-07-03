(function () {
  var html = document.documentElement;
  var stored = localStorage.getItem('pina-lang');
  if (stored) html.setAttribute('data-lang', stored);

  function applyI18nAttrs() {
    var lang = html.getAttribute('data-lang') === 'es' ? 'es' : 'en';
    document.querySelectorAll('[data-i18n-en]').forEach(function (el) {
      var text = lang === 'es' ? el.getAttribute('data-i18n-es') : el.getAttribute('data-i18n-en');
      if (!text) return;
      if (el.tagName === 'OPTION') { el.textContent = text; }
      else if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') { el.setAttribute('placeholder', text); }
    });
  }
  applyI18nAttrs();

  document.querySelectorAll('.lang-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var next = html.getAttribute('data-lang') === 'es' ? 'en' : 'es';
      html.setAttribute('data-lang', next);
      localStorage.setItem('pina-lang', next);
      document.querySelectorAll('.lang-toggle').forEach(function (b) {
        b.textContent = next === 'es' ? 'EN' : 'ES';
      });
      applyI18nAttrs();
    });
    btn.textContent = html.getAttribute('data-lang') === 'es' ? 'EN' : 'ES';
  });

  var navToggle = document.querySelector('.nav-toggle');
  var navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      navLinks.classList.toggle('open');
    });
    navLinks.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { navLinks.classList.remove('open'); });
    });
  }

  // Scroll-spy: highlight the nav link for whichever section is in view,
  // so the menu tracks normal page scroll — clicking a link still jumps
  // straight to that section via native #anchor + smooth-scroll.
  var sections = Array.prototype.slice.call(document.querySelectorAll('section[id], header[id]'));
  var navAnchors = Array.prototype.slice.call(document.querySelectorAll('a[data-nav]'));
  if (sections.length && navAnchors.length && 'IntersectionObserver' in window) {
    var setActive = function (id) {
      navAnchors.forEach(function (a) {
        a.classList.toggle('active', a.getAttribute('href') === '#' + id);
      });
    };
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
    sections.forEach(function (s) { observer.observe(s); });
  }
})();
