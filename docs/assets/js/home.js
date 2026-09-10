/* home page ---------------------------------------------------------------- */
(function () {
  'use strict';
  var C = window.CELICA, el = C.el, $ = C.$;
  var car = C.car, man = C.manual;

  /* headline figures ------------------------------------------------------ */
  var stats = $('#stats');
  if (stats && car) {
    car.facts.forEach(function (f) {
      var v = parseFloat(String(f.v).replace(/,/g, ''));
      stats.appendChild(el('div', { class: 'stat', 'data-reveal': '' }, [
        el('div', { class: 'readout' }, [
          el('div', { class: 'v' }, [
            el('span', { 'data-count': v, 'data-dp': 0, text: '0' }),
            el('small', { text: f.u })
          ]),
          el('div', { class: 'k', text: f.k })
        ]),
        el('p', { class: 'faint', text: f.note })
      ]));
    });
    var m = C.mods || [];
    stats.appendChild(el('div', { class: 'stat', 'data-reveal': '' }, [
      el('div', { class: 'readout hot' }, [
        el('div', { class: 'v' }, [
          el('span', { 'data-count': m.length, text: '0' })
        ]),
        el('div', { class: 'k', text: 'Modifications' })
      ]),
      el('p', { class: 'faint', text: 'Logged with manual references' })
    ]));
  }

  /* figure count in the manual tile --------------------------------------- */
  if (man) {
    var fc = $('#figCount');
    if (fc) {
      fc.textContent = C.fmt(man.figures) + ' curated figures from the service manual, ' +
        'plus full-text search across all ' + C.fmt(man.total) + ' pages.';
    }

    /* source breakdown table ------------------------------------------- */
    var tb = $('#srcTbl');
    if (tb) {
      var rows = [
        ['Pages in the manual', C.fmt(man.total)],
        ['Figures rendered here', C.fmt(man.figures)],
        ['Sections indexed', String(man.tree.length)],
        ['Wiring diagrams', 'None — separate EWD'],
        ['Market', 'US, 2000 model year'],
        ['This car', '2003 UK facelift']
      ];
      rows.forEach(function (r) {
        tb.appendChild(el('tr', null, [
          el('td', { text: r[0] }),
          el('td', { class: 'n', text: r[1] })
        ]));
      });
    }
  }

  /* model3d.js is deferred, so queue the viewer and it picks this up */
  (C.model3dQueue = C.model3dQueue || []).push({
    sel: '#model3d',
    views: '#modelViews',
    hidden: '#modelHidden',
    spin: '#modelSpin',
    stat: '#modelStat'
  });

  C.initReveal();
  C.initGlow();
  /* counters were added after boot, so run the observer again */
  (function () {
    var nodes = C.$$('[data-count]');
    nodes.forEach(function (n) {
      if (n.dataset.done) return;
      n.dataset.done = '1';
      if (!('IntersectionObserver' in window)) {
        C.countUp(n, parseFloat(n.getAttribute('data-count')), 0, '');
        return;
      }
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          if (!en.isIntersecting) return;
          C.countUp(en.target, parseFloat(en.target.getAttribute('data-count')), 0, '');
          io.unobserve(en.target);
        });
      }, { threshold: 0.4 });
      io.observe(n);
    });
  })();
})();
