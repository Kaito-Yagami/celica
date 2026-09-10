/* specs page --------------------------------------------------------------- */
(function () {
  'use strict';
  var C = window.CELICA, $ = C.$, $$ = C.$$, el = C.el, esc = C.esc, store = C.store;
  var S = C.specs;
  if (!S) return;

  var MM_PER_IN = 25.4;
  function diameter(t) { return t.r * MM_PER_IN + 2 * (t.w * t.p / 100); }

  /* ------------------------------------------------------ wheel calculator */

  var W = S.wheels;
  var oemD = diameter(W.oem);

  function readTyre() {
    return {
      w: +$('#tw').value || W.oem.w,
      p: +$('#tp').value || W.oem.p,
      r: +$('#tr').value || W.oem.r
    };
  }
  function label(t) { return t.w + '/' + t.p + 'R' + t.r; }

  function calc() {
    var t = readTyre();
    var d = diameter(t);
    var c = Math.PI * d;
    var oemC = Math.PI * oemD;
    var pct = (d / oemD - 1) * 100;

    $('#oDia').textContent = d.toFixed(1);
    $('#oDiaSub').textContent = 'standard ' + oemD.toFixed(1) + ' mm';
    $('#oCirc').textContent = c.toFixed(0);
    $('#oCircSub').textContent = 'standard ' + oemC.toFixed(0) + ' mm';
    $('#oPct').textContent = (pct >= 0 ? '+' : '') + pct.toFixed(2);
    $('#oPctSub').textContent = pct > 0
      ? 'taller — speedo now under-reads'
      : pct < 0 ? 'shorter — speedo now over-reads' : 'identical rolling radius';
    $('#oemLine').textContent = label(W.oem) + '  ·  Ø ' + oemD.toFixed(1) + ' mm';

    var ro = $('#oPct').closest('.readout');
    ro.classList.toggle('hot', Math.abs(pct) > 1.5);

    /* indicated -> true. A meter calibrated for the OEM diameter under-reads by
       exactly the diameter ratio once a taller tyre is fitted. */
    var k = d / oemD;
    var tb = $('#spdTbl tbody');
    tb.innerHTML = '';
    [30, 40, 50, 60, 70].forEach(function (mph) {
      var tru = mph * k;
      var tr = el('tr');
      tr.innerHTML =
        '<td class="n">' + mph + ' mph</td>' +
        '<td class="n"><b>' + tru.toFixed(1) + ' mph</b> ' +
        '<span class="faint">· ' + (tru * 1.609).toFixed(0) + ' km/h</span></td>' +
        '<td class="n">' + (tru - mph >= 0 ? '+' : '') + (tru - mph).toFixed(1) + ' mph</td>';
      tb.appendChild(tr);
    });

    /* the manual's own band, applied to this setup */
    var bt = $('#bandTbl tbody');
    bt.innerHTML = '';
    var fails = 0;
    W.band.forEach(function (b) {
      var reads = b.t / k;             // what the meter now shows at that true speed
      var ok = reads >= b.lo && reads <= b.hi;
      if (!ok) fails++;
      var tr = el('tr');
      tr.innerHTML =
        '<td class="n">' + b.t + ' km/h</td>' +
        '<td class="n faint">' + b.lo + ' – ' + b.hi + '</td>' +
        '<td class="n"><b>' + reads.toFixed(1) + '</b></td>' +
        '<td>' + (ok ? '<span class="chip ok">in spec</span>'
                     : '<span class="chip ' + (reads < b.lo ? 'warn' : '') + '">' +
                       (reads < b.lo ? 'reads low' : 'reads high') + '</span>') + '</td>';
      bt.appendChild(tr);
    });

    $('#bandNote').innerHTML = fails === 0
      ? 'This setup stays inside the manual\'s tolerance at every checked speed.'
      : '<b>Outside the manual\'s tolerance at ' + fails + ' of ' + W.band.length +
        ' checked speeds.</b> A meter that reads below true speed is the direction that ' +
        'matters — UK construction and use rules allow a speedometer to over-read but ' +
        'never to under-read. Worth knowing before a custom cluster is calibrated.';

    /* ride height consequence */
    var host = $('#rideNote');
    host.innerHTML =
      '<div class="note ' + (Math.abs(pct) > 3 ? 'red' : 'cool') + '" style="margin-top:14px">' +
      '<div class="hd">And the alignment</div><p>' +
      'The manual quotes camber, caster and toe at a reference ride height of ' +
      '<b>190 mm front, 224 mm rear</b>, measured from the ground to the lower arm bolt ' +
      'centres, on 205/55R15. This car is lowered and on a rolling radius ' +
      (pct >= 0 ? pct.toFixed(1) + ' % larger' : Math.abs(pct).toFixed(1) + ' % smaller') +
      ' than that. The book figures still describe the geometry Toyota wanted, but they ' +
      'are not directly measurable on this car — take them to an alignment as the target ' +
      'shape, and expect the numbers to land differently.</p></div>';
  }

  var sel = $('#preset');
  sel.appendChild(el('option', { value: '', text: 'Choose a size…' }));
  W.presets.forEach(function (p, i) {
    sel.appendChild(el('option', { value: i, text: p.label }));
  });
  sel.addEventListener('change', function () {
    var p = W.presets[+sel.value];
    if (!p) return;
    $('#tw').value = p.w; $('#tp').value = p.p; $('#tr').value = p.r;
    calc(); store.set('tyre', { w: p.w, p: p.p, r: p.r });
  });
  ['tw', 'tp', 'tr'].forEach(function (id) {
    $('#' + id).addEventListener('input', function () {
      calc(); store.set('tyre', readTyre());
    });
  });

  var saved = store.get('tyre', null);
  if (saved) { $('#tw').value = saved.w; $('#tp').value = saved.p; $('#tr').value = saved.r; }
  calc();

  /* ---------------------------------------------------------------- torque */

  var unit = store.get('unit', 'nm');
  var UNITS = [['nm', 'N·m'], ['kgf', 'kgf·cm'], ['ft', 'ft·lbf']];

  function renderUnits() {
    var host = $('#units');
    host.innerHTML = '';
    UNITS.forEach(function (u) {
      host.appendChild(el('button', {
        class: 'btn ghost sm', text: u[1],
        'aria-pressed': unit === u[0] ? 'true' : 'false',
        onclick: function () { unit = u[0]; store.set('unit', unit); renderUnits(); renderTorque(); }
      }));
    });
    $('#uHead').textContent = UNITS.filter(function (u) { return u[0] === unit; })[0][1];
  }

  function renderTorque() {
    var q = ($('#tq').value || '').toLowerCase().trim();
    var tb = $('#tqTbl tbody');
    tb.innerHTML = '';
    var lastGrp = null, shown = 0;

    S.torque.forEach(function (t) {
      if (q && (t.k + ' ' + t.grp).toLowerCase().indexOf(q) < 0) return;
      shown++;
      if (t.grp !== lastGrp) {
        lastGrp = t.grp;
        var g = el('tr', { class: 'grp' });
        g.innerHTML = '<td colspan="3">' + esc(t.grp) + '</td>';
        tb.appendChild(g);
      }
      var val = unit === 'nm' ? t.nm : unit === 'kgf' ? t.kgf : t.ft;
      var txt = val == null ? (t.alt || '—') : C.fmt(val, val % 1 ? 1 : 0);
      var tr = el('tr');
      tr.innerHTML =
        '<td>' + esc(t.k) + '</td>' +
        '<td class="n"><b>' + txt + '</b>' +
        (val == null || !t.alt ? '' : '') + '</td>' +
        '<td><button class="btn ghost sm figbtn" data-fig="' + t.fig + '">p.' + t.fig + '</button></td>';
      tb.appendChild(tr);
    });

    if (!shown) {
      tb.innerHTML = '<tr><td colspan="3"><div class="empty">Nothing matches “' +
        esc(q) + '”.</div></td></tr>';
    }
    wireFigButtons();
  }

  $('#tq').addEventListener('input', renderTorque);

  function wireFigButtons() {
    $$('.figbtn').forEach(function (b) {
      if (b.dataset.wired) return;
      b.dataset.wired = '1';
      b.addEventListener('click', function () { C.lightbox(+b.getAttribute('data-fig')); });
    });
  }

  renderUnits();
  renderTorque();

  /* ---------------------------------------------------------------- fluids */

  var fh = $('#fluids');
  S.fluids.forEach(function (f) {
    var c = el('div', { class: 'card lit', 'data-reveal': '' });
    c.innerHTML =
      '<div class="spread" style="align-items:flex-start;gap:10px">' +
        '<h3 style="margin:0;font-size:15px">' + esc(f.k) + '</h3>' +
        '<button class="btn ghost sm figbtn" data-fig="' + f.fig + '">p.' + f.fig + '</button>' +
      '</div>' +
      '<div class="readout" style="margin:10px 0 4px"><div class="v">' + esc(f.v) +
      '</div>' + (f.v2 ? '<div class="k">' + esc(f.v2) + '</div>' : '') + '</div>' +
      '<p class="muted" style="font-size:13px;margin:10px 0 0">' + esc(f.grade) + '</p>' +
      (f.note ? '<p class="faint" style="font-size:12px;margin:8px 0 0">' + esc(f.note) + '</p>' : '');
    fh.appendChild(c);
  });

  /* ----------------------------------------------------------- spec groups */

  var gh = $('#groups');
  S.groups.forEach(function (g, gi) {
    var d = el('details', { class: 'spec' });
    if (gi === 0) d.setAttribute('open', 'open');
    var sm = el('summary');
    sm.innerHTML =
      '<span class="tcode">' + esc(g.sub) + '</span>' +
      '<span class="tname" style="font-size:15px;font-family:var(--display);font-weight:600">' +
      g.name + '</span>' +
      '<span class="num" style="font-size:11px">' + g.rows.length + ' values</span>';
    d.appendChild(sm);

    var box = el('div', { class: 'spec-body' });
    if (g.note) {
      box.appendChild(el('div', { class: 'note cool', html: '<p>' + esc(g.note) + '</p>' }));
    }
    var wrap = el('div', { class: 'tbl-wrap' });
    var tbl = el('table');
    var rows = g.rows.map(function (r) {
      return '<tr><td>' + esc(r.k) +
        (r.note ? '<p class="faint" style="font-size:11.5px;margin:4px 0 0;max-width:52ch">' +
          esc(r.note) + '</p>' : '') + '</td>' +
        '<td class="n"><b>' + esc(r.v) + '</b>' +
        (r.v2 ? '<br><span class="faint" style="font-size:11px">' + esc(r.v2) + '</span>' : '') +
        '</td>' +
        '<td><button class="btn ghost sm figbtn" data-fig="' + r.fig + '">p.' + r.fig + '</button></td></tr>';
    }).join('');
    tbl.innerHTML = '<thead><tr><th>Item</th><th>Value</th><th>Source</th></tr></thead>' +
      '<tbody>' + rows + '</tbody>';
    wrap.appendChild(tbl);
    box.appendChild(wrap);
    d.appendChild(box);
    gh.appendChild(d);
  });

  wireFigButtons();
  C.initReveal();
  C.initGlow();
})();
