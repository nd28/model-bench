/* model-bench — OS-inspired behaviour (no dependencies) */
(function () {
  'use strict';
  var root = document.documentElement;

  /* ── error boundary: one failing subsystem must not sink the rest ── */
  function guard(name, fn) {
    try { return fn(); }
    catch (err) {
      if (window.console && console.warn) console.warn('[model-bench] ' + name + ' failed:', err);
      return undefined;
    }
  }

  /* ── theme: auto → light → dark ────────────────────────── */
  var THEME_KEY = 'mb-theme';
  var MODES = ['auto', 'light', 'dark'];
  var GLYPH = { auto: '◐', light: '☀', dark: '☾' };
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function readTheme() { try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; } }
  function themeMode() { var m = readTheme(); return MODES.indexOf(m) >= 0 ? m : 'auto'; }
  function applyTheme() {
    var mode = themeMode();
    var resolved = mode === 'auto' ? (mq && mq.matches ? 'dark' : 'light') : mode;
    root.setAttribute('data-theme', resolved);
    var btn = document.getElementById('themeBtn');
    if (btn) { btn.textContent = GLYPH[mode]; btn.setAttribute('aria-label', 'Theme: ' + mode); btn.title = 'Theme: ' + mode; }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', resolved === 'dark' ? '#0B0B0F' : '#F6F3FA');
    if (typeof ACCENTS !== 'undefined' && ACCENTS && ACCENTS.length) applyAccent(readAccent());
  }
  guard('theme', applyTheme);
  guard('theme-media', function () {
    if (mq && mq.addEventListener) mq.addEventListener('change', function () { if (themeMode() === 'auto') applyTheme(); });
  });
  window.toggleTheme = function () {
    guard('toggleTheme', function () {
      var i = MODES.indexOf(themeMode());
      var next = MODES[(i + 1) % MODES.length];
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
      applyTheme();
      bbSay('theme — ' + next);
    });
  };

  /* ── accent: one variable repaints the UI ──────────────── */
  var ACCENTS = [
    { a: '#F06FA3', b: '#5FD3C4', soft: 'rgba(240,111,163,0.16)' },
    { a: '#5FD3C4', b: '#F06FA3', soft: 'rgba(95,211,196,0.16)' },
    { a: '#0A84FF', b: '#BF5AF2', soft: 'rgba(10,132,255,0.18)' },
    { a: '#BF5AF2', b: '#FF9F0A', soft: 'rgba(191,90,242,0.18)' },
    { a: '#30D158', b: '#0A84FF', soft: 'rgba(48,209,88,0.18)' },
    { a: '#F5F5F7', b: '#98989D', soft: 'rgba(245,245,247,0.16)', light: { a: '#14121B', b: '#6E6E73', soft: 'rgba(20,18,27,0.10)' } }
  ];
  var ACCENT_KEY = 'mb-accent';
  var DARK_INK = '#14121B';
  function chan(c) {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }
  function luminance(hex) {
    var h = hex.replace('#', '');
    return 0.2126 * chan(parseInt(h.slice(0, 2), 16)) + 0.7152 * chan(parseInt(h.slice(2, 4), 16)) + 0.0722 * chan(parseInt(h.slice(4, 6), 16));
  }
  function readableInk(hex) {
    var l = luminance(hex);
    return (1.05 / (l + 0.05)) >= ((l + 0.05) / (luminance(DARK_INK) + 0.05)) ? '#fff' : DARK_INK;
  }
  function readAccent() { try { var v = parseInt(localStorage.getItem(ACCENT_KEY), 10); return isNaN(v) ? 0 : (v % ACCENTS.length); } catch (e) { return 0; } }
  function applyAccent(i) {
    var p = ACCENTS[i];
    var alt = root.getAttribute('data-theme') === 'light' && p.light ? p.light : null;
    var a = alt ? alt.a : p.a;
    var b = alt ? alt.b : p.b;
    var soft = alt ? alt.soft : p.soft;
    root.style.setProperty('--accent', a);
    root.style.setProperty('--accent-2', b);
    root.style.setProperty('--accent-soft', soft);
    root.style.setProperty('--accent-ring', soft.replace(/0?\.\d+\)/, '0.30)'));
    root.style.setProperty('--on-accent', readableInk(a));
  }
  guard('accent', function () { applyAccent(readAccent()); });
  window.cycleAccent = function () {
    guard('cycleAccent', function () {
      var i = (readAccent() + 1) % ACCENTS.length;
      try { localStorage.setItem(ACCENT_KEY, String(i)); } catch (e) {}
      applyAccent(i);
      bbSay('accent — ' + (i + 1) + '/' + ACCENTS.length);
    });
  };

  /* ── language ──────────────────────────────────────────── */
  var LANG_KEY = 'mb-lang';
  function readLang() { try { return localStorage.getItem(LANG_KEY); } catch (e) { return null; } }
  function guessLang() {
    var s = readLang();
    if (s === 'en' || s === 'hi') return s;
    return (navigator.language || 'en').toLowerCase().indexOf('hi') === 0 ? 'hi' : 'en';
  }
  function applyLang(lang) {
    root.setAttribute('data-lang', lang);
    root.setAttribute('lang', lang === 'hi' ? 'hi' : 'en');
    var nodes = document.querySelectorAll('[data-en][data-hi]');
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].textContent = lang === 'hi' ? nodes[i].getAttribute('data-hi') : nodes[i].getAttribute('data-en');
    }
    var l = document.getElementById('langLabel');
    if (l) l.textContent = lang === 'hi' ? 'HI' : 'EN';
    var btn = document.getElementById('langBtn');
    if (btn) btn.setAttribute('aria-label', lang === 'hi' ? 'Switch to English' : 'Hinglish me padho');
    if (typeof bbRevert === 'function') bbRevert();
    if (typeof bbRender === 'function') bbRender();
  }
  guard('lang', function () { applyLang(guessLang()); });
  window.toggleLang = function () {
    guard('toggleLang', function () {
      var next = root.getAttribute('data-lang') === 'hi' ? 'en' : 'hi';
      try { localStorage.setItem(LANG_KEY, next); } catch (e) {}
      applyLang(next);
      bbSay(next === 'hi' ? 'ab Hinglish' : 'now English');
      renderAll(currentMetric());
    });
  };

  /* ── the bench bar: one slot, three jobs ───────────────── */
  var bar, bbLabel, bbText, bbAction, bbProg, bbTrack;
  var bbDragging = false;
  var base = { labelEn: '', labelHi: '', textEn: '', textHi: '', actionEn: '', actionHi: '', href: '' };
  var termTimer = null;
  function pick(en, hi) { return root.getAttribute('data-lang') === 'hi' ? (hi || en) : (en || hi); }

  function bbRender() {
    if (!bar || !bbLabel) return;
    bbLabel.textContent = pick(base.labelEn, base.labelHi);
    bbText.innerHTML = pick(base.textEn, base.textHi);
    bbAction.textContent = pick(base.actionEn, base.actionHi);
    bbAction.classList.toggle('ghost', !base.href);
  }
  function bbSay(msg, hi) {
    if (!bar) return;
    clearTimeout(termTimer);
    bar.classList.add('term-mode');
    bar.classList.remove('no-prog');
    bbLabel.textContent = 'note';
    bbText.textContent = pick(msg, hi);
    bbAction.textContent = 'ok';
    bbAction.classList.add('ghost');
    bbAction.dataset.mode = 'revert';
    termTimer = setTimeout(bbRevert, 2600);
  }
  function bbExplain(el) {
    if (!bar) return;
    clearTimeout(termTimer);
    var prevOpen = document.querySelector('.term[aria-expanded="true"]');
    if (prevOpen) prevOpen.setAttribute('aria-expanded', 'false');
    el.setAttribute('aria-expanded', 'true');
    bar.classList.add('term-mode');
    bar.classList.remove('no-prog');
    bbLabel.textContent = 'term';
    bbText.innerHTML = el.getAttribute('data-tip') || '';
    bbAction.textContent = 'got it';
    bbAction.classList.add('ghost');
    bbAction.dataset.mode = 'revert';
    termTimer = setTimeout(bbRevert, 9000);
  }
  function bbRevert() {
    clearTimeout(termTimer);
    if (!bar) return;
    bar.classList.remove('term-mode');
    if (!bar.dataset.prog) bar.classList.add('no-prog');
    var open = document.querySelector('.term[aria-expanded="true"]');
    if (open) open.setAttribute('aria-expanded', 'false');
    bbAction.dataset.mode = '';
    bbRender();
  }
  function bbScroll() {
    if (!bar || !bar.dataset.prog) return;
    var h = document.documentElement;
    var max = (h.scrollHeight - h.clientHeight) || 1;
    var pct = Math.max(0, Math.min(100, (h.scrollTop || document.body.scrollTop) / max * 100));
    if (bbProg) bbProg.style.width = pct + '%';
    if (bbTrack) bbTrack.setAttribute('aria-valuenow', String(Math.round(pct)));
  }

  /* ── seek: click / drag / keyboard on the progress hairline ─ */
  function bbSeekPct(pct) {
    if (!bar || !bar.dataset.prog) return;
    pct = Math.max(0, Math.min(1, pct));
    var h = document.documentElement;
    var max = (h.scrollHeight - h.clientHeight) || 0;
    var prev = h.style.scrollBehavior;
    h.style.scrollBehavior = 'auto';   /* seeking is immediate, never smooth */
    window.scrollTo(0, pct * max);
    h.style.scrollBehavior = prev || '';
    bbScroll();
  }
  function bbSeekEvent(e) {
    if (!bbTrack) return;
    var rect = bbTrack.getBoundingClientRect();
    if (!rect.width) return;
    bbSeekPct((e.clientX - rect.left) / rect.width);
  }
  function bbScrubStart(e) {
    if (!bar || !bar.dataset.prog || !bbTrack) return;
    e.preventDefault();                /* stop text selection while scrubbing */
    bbDragging = true;
    bar.classList.add('scrubbing');
    try { bbTrack.setPointerCapture(e.pointerId); } catch (err) {}
    bbSeekEvent(e);
  }
  function bbScrubMove(e) {
    if (!bbDragging) return;
    e.preventDefault();
    bbSeekEvent(e);
  }
  function bbScrubEnd(e) {
    if (!bbDragging) return;
    bbDragging = false;
    bar.classList.remove('scrubbing');
    try { bbTrack.releasePointerCapture(e.pointerId); } catch (err) {}
  }
  function bbSeekKey(e) {
    if (!bar || !bar.dataset.prog) return;
    var h = document.documentElement;
    var max = (h.scrollHeight - h.clientHeight) || 0;
    var pct = max > 0 ? (h.scrollTop || document.body.scrollTop) / max : 0;
    if (e.key === 'ArrowLeft') pct -= 0.05;
    else if (e.key === 'ArrowRight') pct += 0.05;
    else if (e.key === 'Home') pct = 0;
    else if (e.key === 'End') pct = 1;
    else return;
    e.preventDefault();
    bbSeekPct(pct);
  }
  function bbInitSeek() {
    if (!bbTrack) return;
    bbTrack.setAttribute('role', 'slider');
    bbTrack.setAttribute('tabindex', '0');
    bbTrack.setAttribute('aria-label', 'Reading position');
    bbTrack.setAttribute('aria-valuemin', '0');
    bbTrack.setAttribute('aria-valuemax', '100');
    bbTrack.setAttribute('aria-valuenow', '0');
    bbTrack.addEventListener('pointerdown', bbScrubStart);
    bbTrack.addEventListener('pointermove', bbScrubMove);
    bbTrack.addEventListener('pointerup', bbScrubEnd);
    bbTrack.addEventListener('pointercancel', bbScrubEnd);
    bbTrack.addEventListener('keydown', bbSeekKey);
  }

  document.addEventListener('click', function (e) {
    guard('click', function () {
      var term = e.target.closest ? e.target.closest('.term') : null;
      if (term) { e.preventDefault(); bbExplain(term); return; }
      var act = e.target.closest ? e.target.closest('#bbAction') : null;
      if (act) {
        if (act.dataset.mode === 'revert') { bbRevert(); return; }
        if (base.href) location.href = base.href;
        else if (typeof window.sharePage === 'function') window.sharePage();
      }
    });
  });
  document.addEventListener('keydown', function (e) {
    guard('keydown', function () { if (e.key === 'Escape') bbRevert(); });
  });

  /* ── share ─────────────────────────────────────────────── */
  window.sharePage = function () {
    guard('sharePage', function () {
      var data = { title: document.title, url: location.href };
      if (navigator.share) { navigator.share(data).catch(function () {}); return; }
      if (navigator.clipboard) {
        navigator.clipboard.writeText(location.href).then(function () {
          var b = document.getElementById('shareBtn');
          var t = b ? b.querySelector('.tag') : null;
          if (!t) { bbSay('link copied', 'link copy ho gaya'); return; }
          var old = t.textContent;
          t.textContent = 'COPIED';
          setTimeout(function () { t.textContent = old; }, 1400);
        }).catch(function () {});
      }
    });
  };

  /* ── comparison bars ───────────────────────────────────── */
  var METRICS = {
    out: { best: 'min', fmt: function (v) { return '$' + v.toFixed(2); }, hintEn: 'shorter = cheaper · per million output tokens', hintHi: 'chhota = sasta · per million output token' },
    in:  { best: 'min', fmt: function (v) { return '$' + v.toFixed(2); }, hintEn: 'shorter = cheaper · per million input tokens', hintHi: 'chhota = sasta · per million input token' },
    ctx: { best: 'max', fmt: function (v) { return v.toFixed(2) + 'M'; }, hintEn: 'longer = bigger context', hintHi: 'lamba = bada context' },
    max: { best: 'max', fmt: function (v) { return Math.round(v) + 'k'; }, hintEn: 'longer = bigger reply', hintHi: 'lamba = bada jawab' }
  };
  var METRIC_KEY = 'mb-metric';
  function currentMetric() {
    try {
      var m = localStorage.getItem(METRIC_KEY);
      return (typeof METRICS !== 'undefined' && METRICS && METRICS[m]) ? m : 'out';
    } catch (e) { return 'out'; }
  }
  function renderCompare(rootEl, metric) {
    if (!rootEl) return;
    if (typeof METRICS === 'undefined' || !METRICS) return;
    var spec = METRICS[metric];
    if (!spec) return;
    var rows = rootEl.querySelectorAll('.crow');
    if (!rows.length) return;
    var vals = [], known = [];
    var max = -Infinity, min = Infinity;
    for (var i = 0; i < rows.length; i++) {
      var raw = parseFloat(rows[i].getAttribute('data-' + metric));
      var ok = isFinite(raw);
      vals.push(raw);
      known.push(ok);
      if (!ok) continue;
      if (raw > max) max = raw;
      if (raw < min) min = raw;
    }
    if (max === -Infinity) max = 0;
    if (min === Infinity) min = 0;
    for (var j = 0; j < rows.length; j++) {
      var has = known[j], v = vals[j];
      var fill = rows[j].querySelector('.cfill');
      var val = rows[j].querySelector('.val');
      if (fill) fill.style.width = (has && max > 0 ? (v / max) * 100 : 0) + '%';
      if (val) val.textContent = has ? spec.fmt(v) : '—';
      var isBest = has && (spec.best === 'min' ? (v === min) : (v === max));
      rows[j].classList.toggle('best', isBest);
    }
    var hint = rootEl.querySelector('.chint');
    if (hint) hint.textContent = (root.getAttribute('data-lang') === 'hi') ? spec.hintHi : spec.hintEn;
    var tabs = rootEl.querySelectorAll('.ctab');
    for (var k = 0; k < tabs.length; k++) tabs[k].classList.toggle('on', tabs[k].getAttribute('data-metric') === metric);
  }
  function renderAll(metric) {
    if (typeof METRICS === 'undefined' || !METRICS || !METRICS[metric]) return;
    var cs = document.querySelectorAll('.compare');
    if (!cs.length) return;
    for (var i = 0; i < cs.length; i++) renderCompare(cs[i], metric);
  }
  document.addEventListener('click', function (e) {
    guard('metric-tab', function () {
      var tab = e.target.closest ? e.target.closest('.ctab') : null;
      if (!tab) return;
      var m = tab.getAttribute('data-metric');
      if (!METRICS[m]) return;
      try { localStorage.setItem(METRIC_KEY, m); } catch (err) {}
      renderAll(m);
    });
  });

  /* ── full-screen comparison overlay ────────────────────── */
  var cmpOverlay = null, cmpTrigger = null;
  function ensureOverlay() {
    if (cmpOverlay) return cmpOverlay;
    var ov = document.createElement('div');
    ov.className = 'cmp-overlay';
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-modal', 'true');
    ov.setAttribute('aria-label', 'Models comparison, full screen');
    ov.setAttribute('aria-hidden', 'true');
    var panel = document.createElement('div');
    panel.className = 'panel';
    var head = document.createElement('div');
    head.className = 'ov-head';
    var title = document.createElement('div');
    title.className = 'ov-title';
    title.textContent = 'Models';
    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'ov-close';
    close.setAttribute('aria-label', 'Close full screen');
    close.title = 'Close';
    close.textContent = '×';
    head.appendChild(title);
    head.appendChild(close);
    panel.appendChild(head);
    ov.appendChild(panel);
    document.body.appendChild(ov);
    cmpOverlay = ov;
    return ov;
  }
  function cmpSetInert(on) {
    var nodes = document.querySelectorAll('.topbar, main, #benchbar');
    for (var i = 0; i < nodes.length; i++) {
      if (on) nodes[i].setAttribute('inert', '');
      else nodes[i].removeAttribute('inert');
    }
  }
  function closeCompare() {
    if (!cmpOverlay) return;
    var panel = cmpOverlay.querySelector('.panel');
    if (panel) {
      var c = panel.querySelector('.compare');
      if (c && c.parentNode) c.parentNode.removeChild(c);
    }
    cmpOverlay.classList.remove('open');
    cmpOverlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('cmp-lock');
    cmpSetInert(false);
    if (cmpTrigger) {
      cmpTrigger.setAttribute('aria-expanded', 'false');
      try { if (cmpTrigger.focus) cmpTrigger.focus(); } catch (err) {}
    }
    cmpTrigger = null;
  }
  function openCompare(btn) {
    var src = btn.closest ? btn.closest('.compare') : null;
    if (!src) return;
    var ov = ensureOverlay();
    var panel = ov.querySelector('.panel');
    if (!panel) return;
    var old = panel.querySelector('.compare');
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var clone = src.cloneNode(true);
    var extras = clone.querySelectorAll('.cmp-full');
    for (var i = 0; i < extras.length; i++) {
      if (extras[i].parentNode) extras[i].parentNode.removeChild(extras[i]);
    }
    var ids = clone.querySelectorAll('[id]');
    for (var j = 0; j < ids.length; j++) ids[j].removeAttribute('id');
    if (clone.id) clone.removeAttribute('id');
    panel.appendChild(clone);
    cmpTrigger = btn;
    btn.setAttribute('aria-expanded', 'true');
    ov.setAttribute('aria-hidden', 'false');
    ov.classList.add('open');
    document.body.classList.add('cmp-lock');
    cmpSetInert(true);
    renderAll(currentMetric());
    var close = ov.querySelector('.ov-close');
    if (close && close.focus) close.focus();
  }
  function injectFullButtons() {
    var cs = document.querySelectorAll('.compare');
    for (var i = 0; i < cs.length; i++) {
      var tabs = cs[i].querySelector('.ctabs');
      if (!tabs || tabs.querySelector('.cmp-full')) continue;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cmp-full';
      btn.setAttribute('aria-label', 'Open full screen');
      btn.setAttribute('aria-haspopup', 'dialog');
      btn.setAttribute('aria-expanded', 'false');
      btn.title = 'Full screen';
      btn.textContent = '⤢';
      tabs.appendChild(btn);
    }
  }
  document.addEventListener('click', function (e) {
    guard('cmp-full', function () {
      if (!e.target.closest) return;
      var full = e.target.closest('.cmp-full');
      if (full) { e.preventDefault(); openCompare(full); return; }
      if (!cmpOverlay) return;
      if (e.target.closest('.ov-close')) { closeCompare(); return; }
      if (e.target === cmpOverlay) closeCompare();
    });
  });
  document.addEventListener('keydown', function (e) {
    guard('cmp-full', function () {
      if (e.key === 'Escape' && cmpOverlay && cmpOverlay.classList.contains('open')) closeCompare();
    });
  });

  /* ── boot ──────────────────────────────────────────────── */
  function boot() {
    bar = document.getElementById('benchbar');
    if (bar) {
      bbLabel = document.getElementById('bbLabel');
      bbText = document.getElementById('bbText');
      bbAction = document.getElementById('bbAction');
      bbProg = document.getElementById('bbProg');
      bbTrack = bbProg ? bbProg.parentNode : null;
      base.labelEn = bar.getAttribute('data-label-en') || 'today';
      base.labelHi = bar.getAttribute('data-label-hi') || base.labelEn;
      base.textEn = bar.getAttribute('data-status-en') || '';
      base.textHi = bar.getAttribute('data-status-hi') || base.textEn;
      base.actionEn = bar.getAttribute('data-action-en') || '';
      base.actionHi = bar.getAttribute('data-action-hi') || base.actionEn;
      base.href = bar.getAttribute('data-href') || '';
      if (bar.getAttribute('data-prog')) { bar.dataset.prog = '1'; bar.classList.remove('no-prog'); bbInitSeek(); }
      bbRender();
      requestAnimationFrame(function () { bar.classList.add('enter'); });
      window.addEventListener('scroll', bbScroll, { passive: true });
      bbScroll();
    }
  }
  function bootBars() {
    renderAll(currentMetric());
  }
  function bootAll() {
    guard('bench-bar', boot);
    guard('compare', bootBars);
    guard('cmp-full', injectFullButtons);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootAll);
  else bootAll();
})();
