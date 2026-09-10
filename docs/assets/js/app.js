/* ==========================================================================
   Celica T230 — shared behaviour
   Classic script, no modules, no fetch: this site has to run from file://
   ========================================================================== */
(function () {
  'use strict';

  var C = (window.CELICA = window.CELICA || {});

  /* ---------------------------------------------------------------- utils */

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'html') n.innerHTML = attrs[k];
      else if (k === 'text') n.textContent = attrs[k];
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach(function (c) {
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return n;
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  var reduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* localStorage can throw outright in some contexts — never let it break a page */
  var store = {
    get: function (key, fallback) {
      try {
        var v = localStorage.getItem('celica.' + key);
        return v == null ? fallback : JSON.parse(v);
      } catch (e) { return fallback; }
    },
    set: function (key, val) {
      try { localStorage.setItem('celica.' + key, JSON.stringify(val)); return true; }
      catch (e) { return false; }
    },
    del: function (key) {
      try { localStorage.removeItem('celica.' + key); } catch (e) {}
    }
  };

  function fmt(n, dp) {
    if (n == null || isNaN(n)) return '—';
    var s = Number(n).toFixed(dp == null ? 0 : dp);
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  /* ---------------------------------------------------------------- figures */

  function figSrc(page) {
    return 'assets/fig/p' + String(page).padStart(4, '0') + '.png';
  }

  /**
   * A manual figure with its provenance. `page` is the 0-indexed PDF page,
   * which is what every reference in this site uses.
   */
  function figure(page, caption, opts) {
    opts = opts || {};
    var meta = C.manual && C.manual.pages ? C.manual.pages[page] : null;
    var code = meta && meta.c ? meta.c : '';
    var approx = !code && meta && meta.ci ? meta.ci : '';
    var f = el('figure', { class: 'fig' + (opts.plain ? ' plain' : '') });
    var img = el('img', {
      src: figSrc(page),
      alt: caption || (code ? 'Manual page ' + code : 'Manual page ' + page),
      loading: 'lazy', decoding: 'async'
    });
    img.addEventListener('click', function () { lightbox(page, caption); });
    img.style.cursor = 'zoom-in';
    f.appendChild(img);

    var cap = el('figcaption');
    if (caption) cap.appendChild(el('span', { text: caption }));
    cap.appendChild(el('span', {
      class: 'chip src',
      title: approx
        ? 'This page does not print its own reference. ' + approx +
          ' is inferred by counting forward from the nearest numbered page, so treat it as approximate. The PDF page number is exact.'
        : null,
      text: 'RM744' + (page < 821 ? 'U1' : 'U2') +
            (code ? ' · ' + code : approx ? ' · ≈' + approx : '') + ' · p.' + page
    }));
    f.appendChild(cap);
    return f;
  }

  /* zoomable overlay ------------------------------------------------------ */
  var lb = null;
  function lightbox(page, caption) {
    if (!lb) {
      lb = el('div', { class: 'lb', role: 'dialog', 'aria-modal': 'true' });
      lb.addEventListener('click', function (e) {
        if (e.target === lb || e.target.classList.contains('lb-x')) closeLb();
      });
      document.body.appendChild(lb);
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && lb.classList.contains('on')) closeLb();
      });
    }
    var meta = C.manual && C.manual.pages ? C.manual.pages[page] : null;
    lb.innerHTML =
      '<button class="lb-x btn" aria-label="Close">Close ✕</button>' +
      '<div class="lb-in"><img src="' + figSrc(page) + '" alt="' + esc(caption || '') + '">' +
      '<div class="lb-cap"><span>' + esc(caption || (meta && meta.h) || '') + '</span>' +
      '<span class="chip src">' +
        esc(meta ? (meta.c || (meta.ci ? '≈' + meta.ci : '')) : '') +
      ' · p.' + page + '</span></div></div>';
    lb.classList.add('on');
    document.body.style.overflow = 'hidden';
  }
  function closeLb() {
    if (lb) lb.classList.remove('on');
    document.body.style.overflow = '';
  }

  /* ---------------------------------------------------------------- header */

  function initHeader() {
    var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    $$('nav.main a').forEach(function (a) {
      var href = (a.getAttribute('href') || '').toLowerCase();
      if (href === here) a.setAttribute('aria-current', 'page');
    });
    var b = $('.burger'), nav = $('nav.main');
    if (b && nav) {
      b.addEventListener('click', function () {
        var open = nav.classList.toggle('open');
        b.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      nav.addEventListener('click', function (e) {
        if (e.target.tagName === 'A') nav.classList.remove('open');
      });
    }
  }

  /* ---------------------------------------------------------------- motion */

  function initReveal() {
    var items = $$('[data-reveal]');
    if (!items.length) return;
    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach(function (n) { n.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    items.forEach(function (n, i) {
      // stagger only within a run of siblings, so long lists don't crawl
      if (!n.style.getPropertyValue('--i')) {
        var prev = n.previousElementSibling;
        var idx = prev && prev.hasAttribute('data-reveal')
          ? (parseInt(prev.style.getPropertyValue('--i'), 10) || 0) + 1 : 0;
        n.style.setProperty('--i', Math.min(idx, 6));
      }
      io.observe(n);
    });
  }

  function initGlow() {
    if (reduced) return;
    $$('.card.lit').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
        card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
      });
    });
  }

  function countUp(node, to, dp, suffix) {
    if (reduced) { node.textContent = fmt(to, dp) + (suffix || ''); return; }
    var t0 = null, dur = 850, from = 0;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var k = Math.min(1, (ts - t0) / dur);
      var e = 1 - Math.pow(1 - k, 3);
      node.textContent = fmt(from + (to - from) * e, dp) + (suffix || '');
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function initCounters() {
    var nodes = $$('[data-count]');
    if (!nodes.length) return;
    var run = function (n) {
      countUp(n, parseFloat(n.getAttribute('data-count')),
        parseInt(n.getAttribute('data-dp') || '0', 10),
        n.getAttribute('data-suffix') || '');
    };
    if (!('IntersectionObserver' in window)) { nodes.forEach(run); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        run(en.target); io.unobserve(en.target);
      });
    }, { threshold: 0.4 });
    nodes.forEach(function (n) { io.observe(n); });
  }

  /* ignition sweep — index only, once per session -------------------------- */
  function initIgnition() {
    var ign = $('#ign');
    if (!ign) return;
    if (reduced || store.get('ignited', false) === true ||
        sessionStorage_get('ign') === '1') {
      ign.parentNode.removeChild(ign);
      return;
    }
    try { sessionStorage.setItem('celica.ign', '1'); } catch (e) {}
    var end = function () { ign.classList.add('done'); setTimeout(function () {
      if (ign.parentNode) ign.parentNode.removeChild(ign);
    }, 500); };
    setTimeout(end, 1250);
    ign.addEventListener('click', end);
    document.addEventListener('keydown', function k(e) {
      end(); document.removeEventListener('keydown', k);
    });
  }
  function sessionStorage_get(k) {
    try { return sessionStorage.getItem('celica.' + k); } catch (e) { return null; }
  }

  /* ---------------------------------------------------------------- boot */

  function boot() {
    initHeader();
    initIgnition();
    initReveal();
    initGlow();
    initCounters();
    document.body.classList.add('ready');
  }

  C.$ = $; C.$$ = $$; C.el = el; C.esc = esc; C.store = store;
  C.fmt = fmt; C.figure = figure; C.figSrc = figSrc; C.lightbox = lightbox;
  C.reduced = reduced; C.countUp = countUp; C.initReveal = initReveal;
  C.initGlow = initGlow;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }
})();
