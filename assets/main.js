/* Kwiaty Lewandowscy - skrypt strony. Każdy blok działa osobno:
   awaria jednego nie wyłącza pozostałych, a bez JS strona wygląda normalnie. */

/* menu na telefonie + cień paska po przewinięciu */
(function () {
  try {
    var body = document.body;
    var nav = document.querySelector('.site-nav');
    var btn = document.querySelector('.nav-toggle');
    if (btn && nav) {
      var ustawGore = function () {
        var r = nav.getBoundingClientRect();
        document.documentElement.style.setProperty('--nav-top', Math.max(0, r.bottom) + 'px');
      };
      btn.addEventListener('click', function () {
        ustawGore();
        var otwarte = body.classList.toggle('nav-open');
        btn.setAttribute('aria-expanded', otwarte ? 'true' : 'false');
      });
      document.querySelectorAll('.nav-links a').forEach(function (a) {
        a.addEventListener('click', function () {
          body.classList.remove('nav-open');
          btn.setAttribute('aria-expanded', 'false');
        });
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && body.classList.contains('nav-open')) {
          body.classList.remove('nav-open');
          btn.setAttribute('aria-expanded', 'false');
          btn.focus();
        }
      });
    }
    if (nav) {
      var tik = false;
      var stan = function () { nav.classList.toggle('is-scrolled', (window.scrollY || 0) > 8); tik = false; };
      window.addEventListener('scroll', function () { if (!tik) { tik = true; requestAnimationFrame(stan); } }, { passive: true });
      stan();
    }
  } catch (e) {}
})();

/* łagodne wejście sekcji; bezpieczniki: sekcje już miniete odsłaniamy przy przewijaniu,
   a po 3,5 s odsłaniamy wszystko (uśpiony obserwator w karcie w tle nie zostawi pustej strony) */
(function () {
  var el = document.querySelectorAll('.rv');
  var pokaz = function (x) { x.classList.add('is-in'); };
  try {
    if (!el.length) return;
    if (!('IntersectionObserver' in window) ||
        (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
      el.forEach(pokaz);
      return;
    }
    var io = new IntersectionObserver(function (wpisy) {
      wpisy.forEach(function (w) {
        if (w.isIntersecting) { pokaz(w.target); io.unobserve(w.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    // stany początkowe włączamy dopiero tutaj: gdy skrypt się nie wczyta, nic nie znika
    document.documentElement.classList.add('js');
    el.forEach(function (x) { io.observe(x); });
    var tik = false;
    var miniete = function () {
      el.forEach(function (x) {
        if (!x.classList.contains('is-in') && x.getBoundingClientRect().top < window.innerHeight) pokaz(x);
      });
      tik = false;
    };
    window.addEventListener('scroll', function () { if (!tik) { tik = true; requestAnimationFrame(miniete); } }, { passive: true });
    setTimeout(function () { el.forEach(pokaz); }, 3500);
  } catch (e) {
    el.forEach(pokaz);
  }
})();

/* okno na nieruchome zdjęcie: warstwa tła istnieje tylko wtedy, gdy okno jest blisko ekranu */
(function () {
  try {
    var okna = document.querySelectorAll('.stopklatka');
    if (!okna.length || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (wpisy) {
      wpisy.forEach(function (w) { w.target.classList.toggle('stk-off', !w.isIntersecting); });
    }, { rootMargin: '50% 0px 50% 0px' });
    okna.forEach(function (o) { io.observe(o); });
  } catch (e) {}
})();

/* poradnik: podświetlenie bieżącego rozdziału w spisie treści */
(function () {
  try {
    var linki = document.querySelectorAll('.article-nav a[href^="#"]');
    if (!linki.length || !('IntersectionObserver' in window)) return;
    var mapa = {};
    linki.forEach(function (a) { mapa[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (wpisy) {
      wpisy.forEach(function (w) {
        if (w.isIntersecting && mapa[w.target.id]) {
          linki.forEach(function (a) { a.classList.remove('is-active'); });
          mapa[w.target.id].classList.add('is-active');
        }
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    Object.keys(mapa).forEach(function (id) {
      var s = document.getElementById(id);
      if (s) io.observe(s);
    });
  } catch (e) {}
})();

/* LICZNIK WAŻNOŚCI DEMA - wjeżdża po zejściu z pierwszego ekranu */
(function () {
  var el = document.querySelector('.demo-wazne');
  if (!el || !el.getAttribute('data-do')) return;
  var koniec = new Date(el.getAttribute('data-do') + 'T23:59:59');
  if (isNaN(koniec)) return;
  var txt = el.querySelector('.dw-txt') || el;
  var dwa = function (n) { return (n < 10 ? '0' : '') + n; };
  var cykl = parseInt(el.getAttribute('data-cykl') || '0', 10);
  function tyka() {
    var teraz = new Date(), ms = koniec - teraz;
    while (ms <= 0 && cykl > 0) {
      koniec = new Date(koniec.getTime() + cykl * 86400000);
      ms = koniec - teraz;
    }
    if (ms <= 0) { txt.innerHTML = 'Wersja pokazowa wygasła'; el.classList.add('is-koniec'); return false; }
    var s = Math.floor(ms / 1000), d = Math.floor(s / 86400);
    var g = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sek = s % 60;
    var zegar = dwa(g) + ':' + dwa(m) + ':' + dwa(sek);
    txt.innerHTML = d > 0
      ? 'Wersja pokazowa · <b>' + d + ' dni</b> <span class="dw-zeg">' + zegar + '</span>'
      : 'Wersja pokazowa · <b class="dw-pilne">' + zegar + '</b>';
    el.classList.toggle('is-pilne', d === 0);
    return true;
  }
  if (tyka() !== false) setInterval(tyka, 1000);
  el.hidden = false;
  var tick = false;
  function stan() {
    el.classList.toggle('is-on', (window.scrollY || 0) > window.innerHeight * 0.55);
    tick = false;
  }
  window.addEventListener('scroll', function () {
    if (tick) return; tick = true; requestAnimationFrame(stan);
  }, { passive: true });
  stan();
})();

/* dolny pasek na telefonie chowa się, gdy widać stopkę albo pas z tymi samymi przyciskami */
(function () {
  try {
    var pasek = document.querySelector('.sticky-reserve');
    if (!pasek || !('IntersectionObserver' in window)) return;
    var cele = document.querySelectorAll('footer, .cta');
    if (!cele.length) return;
    var widoczne = 0;
    var io = new IntersectionObserver(function (wpisy) {
      wpisy.forEach(function (w) { widoczne += w.isIntersecting ? 1 : -1; });
      if (widoczne < 0) widoczne = 0;
      pasek.classList.toggle('schowany', widoczne > 0);
    }, { threshold: 0.01 });
    cele.forEach(function (el) { io.observe(el); });
  } catch (e) {}
})();

/* licznik otwarć dema */
(function(){try{if(String(location.protocol).indexOf('http')!==0)return;try{if(/[?&#]team=1/.test(location.search+location.hash)){localStorage.setItem('nb_team','1');}}catch(e){}try{if(localStorage.getItem('nb_team')==='1')return;}catch(e){}if(/crm-newbeginning|crm\.impulseo\.pl/.test(document.referrer||''))return;try{if(navigator.webdriver)return;}catch(e){}try{if(/^https?:\/\/(kris20032|impulseo-pl)\.github\.io\/?$/i.test(document.referrer||''))return;}catch(e){}if(sessionStorage.getItem('_dv'))return;sessionStorage.setItem('_dv','1');var seg=(location.pathname.split('/').filter(Boolean)[0])||'';var base=location.origin+(seg?('/'+seg):'');var ua='';try{ua=(navigator.userAgent||'').slice(0,300);}catch(e){}var EP='https://zngfubfinbojfgaxdrbf.supabase.co/functions/v1/demo-view';try{fetch(EP,{method:'POST',keepalive:true,headers:{'Content-Type':'text/plain'},body:JSON.stringify({demo_url:base,page:location.pathname,referrer:(document.referrer||null),user_agent:(ua||null)})}).catch(function(){});}catch(e){}}catch(e){}})();
