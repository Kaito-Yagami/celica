/* mods page ---------------------------------------------------------------- */
(function () {
  'use strict';
  var C = window.CELICA, $ = C.$, $$ = C.$$, el = C.el, esc = C.esc;
  var mods = C.mods || [];
  var F = C.fuses;
  var filter = 'All';

  function fuseName(n) {
    if (!F || n == null) return null;
    var s = F.slots.filter(function (x) { return x.n === n; })[0];
    return s ? s.n + ' · ' + s.name + ' ' + s.amp + ' A' : null;
  }

  function render() {
    var host = $('#mods');
    host.innerHTML = '';

    mods.filter(function (m) { return filter === 'All' || m.cat === filter; })
      .forEach(function (m, i) {
      var d = el('details', { class: 'mod', id: m.id });
      if (i === 0) d.setAttribute('open', 'open');

      var sm = el('summary');
      sm.innerHTML =
        '<span class="mcat">' + esc(m.cat) + '</span>' +
        '<span class="mtitle"><b>' + esc(m.name) + '</b>' +
        '<span>' + esc(m.blurb) + '</span></span>' +
        (m.danger ? '<span class="chip warn">SRS</span>' : '') +
        (m.elec && m.elec.draw[1] > 0
          ? '<span class="chip num">' + m.elec.draw[0] + '–' + m.elec.draw[1] + ' A</span>'
          : '') +
        '<span class="chev">›</span>';
      d.appendChild(sm);

      var box = el('div', { class: 'mod-body' });

      if (m.danger) {
        box.appendChild(el('div', {
          class: 'note red',
          html: '<div class="hd">Read before you touch it</div><p>' + esc(m.danger) + '</p>'
        }));
      }

      box.appendChild(el('p', { text: m.body }));

      if (m.watch && m.watch.length) {
        box.appendChild(el('span', { class: 'lbl', style: 'margin-top:18px', text: 'Worth knowing' }));
        var ul = el('ul', { class: 'watch' });
        m.watch.forEach(function (w) { ul.appendChild(el('li', { text: w })); });
        box.appendChild(ul);
      }

      if (m.elec) {
        var best = fuseName(m.elec.best);
        var e = el('div', { class: 'card', style: 'margin-top:18px' });
        e.innerHTML =
          '<div class="spread" style="align-items:flex-start;gap:14px">' +
            '<div><span class="lbl">Electrical</span>' +
            '<div class="readout"><div class="v" style="font-size:24px">' +
              (m.elec.draw[1] > 0
                ? m.elec.draw[0] + '–' + m.elec.draw[1] + '<small>A</small>'
                : 'none<small></small>') +
            '</div><div class="k">estimated draw</div></div></div>' +
            (best ? '<div style="text-align:right"><span class="lbl">Belongs on</span>' +
              '<p class="mono num" style="margin:0;font-size:13px">' + esc(best) + '</p></div>' : '') +
          '</div>' +
          '<p class="muted" style="font-size:13px;margin:14px 0 0">' + esc(m.elec.why) + '</p>' +
          '<a class="btn ghost sm" href="electrical.html" style="margin-top:12px">Open the load budget →</a>';
        box.appendChild(e);
      }

      if (m.figs && m.figs.length) {
        box.appendChild(el('span', { class: 'lbl', style: 'margin-top:20px', text: 'In the manual' }));
        var g = el('div', { class: 'grid g3', style: 'margin-top:4px' });
        m.figs.forEach(function (f) {
          var wrap = el('div');
          wrap.appendChild(C.figure(f.p, f.c));
          g.appendChild(wrap);
        });
        box.appendChild(g);
      }

      d.appendChild(box);
      host.appendChild(d);
    });

    C.initGlow();
  }

  /* category filter -------------------------------------------------- */
  var cats = ['All'];
  mods.forEach(function (m) { if (cats.indexOf(m.cat) < 0) cats.push(m.cat); });

  function renderCats() {
    var host = $('#cats');
    host.innerHTML = '';
    cats.forEach(function (c) {
      var n = c === 'All' ? mods.length
        : mods.filter(function (m) { return m.cat === c; }).length;
      host.appendChild(el('button', {
        class: 'btn ghost sm',
        'aria-pressed': filter === c ? 'true' : 'false',
        html: esc(c) + ' <span class="num" style="opacity:.6">' + n + '</span>',
        onclick: function () { filter = c; renderCats(); render(); }
      }));
    });
  }

  renderCats();
  render();

  /* open a mod straight from a hash ---------------------------------- */
  if (location.hash) {
    var t = document.getElementById(location.hash.slice(1));
    if (t) {
      $$('details.mod').forEach(function (d) { d.removeAttribute('open'); });
      t.setAttribute('open', 'open');
      setTimeout(function () {
        t.scrollIntoView({ behavior: C.reduced ? 'auto' : 'smooth', block: 'start' });
      }, 60);
    }
  }
})();
