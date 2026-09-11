/* model-bench — small, no dependencies */
(function () {
  'use strict';
  var root = document.documentElement;

  /* ── theme ─────────────────────────────────────────────── */
  var THEME_KEY = 'mb-theme';
  function readTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }
  function systemDark() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  function paintTheme() {
    var stored = readTheme();
    var dark = stored ? stored === 'dark' : systemDark();
    if (stored) root.setAttribute('data-theme', stored);
    else root.removeAttribute('data-theme');
    var btn = document.getElementById('themeBtn');
    if (btn) {
      btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
      var sun = btn.querySelector('.i-sun');
      var moon = btn.querySelector('.i-moon');
      if (sun) sun.style.display = dark ? 'block' : 'none';
      if (moon) moon.style.display = dark ? 'none' : 'block';
    }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#0E0E12' : '#FBF6F0');
  }
  paintTheme();
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) mq.addEventListener('change', function () { if (!readTheme()) paintTheme(); });
  }
  window.toggleTheme = function () {
    var stored = readTheme();
    var dark = stored ? stored === 'dark' : systemDark();
    try { localStorage.setItem(THEME_KEY, dark ? 'light' : 'dark'); } catch (e) {}
    paintTheme();
  };

  /* ── language ──────────────────────────────────────────── */
  var LANG_KEY = 'mb-lang';
  function readLang() {
    try { return localStorage.getItem(LANG_KEY); } catch (e) { return null; }
  }
  function guessLang() {
    var stored = readLang();
    if (stored === 'en' || stored === 'hi') return stored;
    var nav = (navigator.language || 'en').toLowerCase();
    return nav.indexOf('hi') === 0 ? 'hi' : 'en';
  }
  function applyLang(lang) {
    root.setAttribute('data-lang', lang);
    root.setAttribute('lang', lang === 'hi' ? 'hi' : 'en');
    var nodes = document.querySelectorAll('[data-en][data-hi]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      el.textContent = lang === 'hi' ? el.getAttribute('data-hi') : el.getAttribute('data-en');
    }
    var label = document.getElementById('langLabel');
    if (label) label.textContent = lang === 'hi' ? 'HI' : 'EN';
    var btn = document.getElementById('langBtn');
    if (btn) btn.setAttribute('aria-label', lang === 'hi' ? 'Switch to English' : 'Hinglish me padho');
  }
  applyLang(guessLang());
  window.toggleLang = function () {
    var next = root.getAttribute('data-lang') === 'hi' ? 'en' : 'hi';
    try { localStorage.setItem(LANG_KEY, next); } catch (e) {}
    applyLang(next);
  };

  /* ── technical-term tooltip ────────────────────────────── */
  var tip = document.getElementById('tooltip');
  var openTerm = null;
  function showTip(el) {
    if (!tip) return;
    var html = el.getAttribute('data-tip') || '';
    tip.innerHTML = html;
    tip.classList.add('show');
    var r = el.getBoundingClientRect();
    var tr = tip.getBoundingClientRect();
    var left = r.left + r.width / 2 - tr.width / 2;
    left = Math.max(10, Math.min(left, window.innerWidth - tr.width - 10));
    var top = r.top - tr.height - 10;
    if (top < 10) top = r.bottom + 10;
    tip.style.left = left + 'px';
    tip.style.top = top + 'px';
    el.setAttribute('aria-expanded', 'true');
    openTerm = el;
  }
  function hideTip() {
    if (tip) tip.classList.remove('show');
    if (openTerm) openTerm.setAttribute('aria-expanded', 'false');
    openTerm = null;
  }
  document.addEventListener('click', function (e) {
    var term = e.target.closest ? e.target.closest('.term') : null;
    if (term) {
      e.preventDefault();
      if (openTerm === term) { hideTip(); return; }
      hideTip();
      showTip(term);
      return;
    }
    if (openTerm && !e.target.closest('#tooltip')) hideTip();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hideTip(); });
  window.addEventListener('resize', hideTip);
  window.addEventListener('scroll', hideTip, { passive: true });

  /* ── share ─────────────────────────────────────────────── */
  window.sharePage = function () {
    var data = { title: document.title, url: location.href };
    if (navigator.share) { navigator.share(data).catch(function () {}); return; }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(location.href).then(function () {
        var b = document.getElementById('shareBtn');
        if (b) { var old = b.getAttribute('data-en'); b.querySelector('.tag').textContent = 'COPIED'; setTimeout(function () { b.querySelector('.tag').textContent = 'SHARE'; }, 1400); }
      }).catch(function () {});
    }
  };
})();
