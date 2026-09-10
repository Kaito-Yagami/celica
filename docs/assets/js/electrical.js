/* electrical page ---------------------------------------------------------- */
(function () {
  'use strict';
  var C = window.CELICA, $ = C.$, $$ = C.$$, el = C.el, esc = C.esc, store = C.store;
  var F = C.fuses;
  if (!F) return;

  var SAFE = 0.8;                 // usable fraction of a fuse rating, continuous
  var byN = {};
  F.slots.forEach(function (s) { byN[s.n] = s; });

  /* user overrides, persisted --------------------------------------------- */
  var probed = store.get('probe', {});      // { fuseNumber: 'bat'|'acc'|'ig'|'ill' }
  var budget = store.get('budget', null);   // [{id, fuse, typ, peak, measured}]
  if (!budget) {
    budget = F.loads.map(function (l) {
      return { id: l.id, fuse: l.fuse, typ: l.draw[0], peak: l.draw[1], measured: false };
    });
  }
  function saveBudget() { store.set('budget', budget); flash(); }
  function flash() {
    var n = $('#saveState');
    if (!n) return;
    n.textContent = 'Saved ' + new Date().toLocaleTimeString();
    n.classList.add('ok');
    setTimeout(function () { n.classList.remove('ok'); }, 1200);
  }

  function classOf(s) { return probed[s.n] || s.cls; }
  function isProbed(s) { return !!probed[s.n]; }

  /* ------------------------------------------------------------------ SVG */
  /* Laid out to match the lid label: 17 alone up top, 18-35 in two rows of
     nine, and the 1-16 block down the right in two columns. */

  var W = 48, H = 44, GX = 4, GY = 5;
  var TOPROW = [34, 32, 30, 28, 26, 24, 22, 20, 18];
  var BOTROW = [35, 33, 31, 29, 27, 25, 23, 21, 19];
  var COL_A = [9, 10, 11, 12, 13, 14, 15, 16];
  var COL_B = [1, 2, 3, 4, 5, 6, 7, 8];

  /*
   * Two arrangements of the same box.
   *
   * Wide is the lid exactly: 17 alone up top, 18-35 in two rows of nine, and
   * the 1-16 block standing to the right in two columns.
   *
   * On a phone that block is 130 units past the edge of a 319 px window, so it
   * is invisible unless you happen to swipe, and the tall block leaves the
   * middle of the map empty. Narrow lays 1-16 out underneath instead, as two
   * rows of eight. Each group keeps its own order, the slots stay finger-sized,
   * and the width needed drops from 632 to 486 - the hint says it has moved.
   */
  var narrowQ = window.matchMedia('(max-width: 760px)');
  var L = {};

  function layout() {
    var narrow = narrowQ.matches;
    var gridX = 18;
    var rowsW = 9 * (W + GX);
    var bh = H * 0.78;

    if (narrow) {
      var gridY = H + 22;
      var blockY = gridY + 2 * H + GY + 26;
      L = {
        narrow: true, gridX: gridX, gridY: gridY, blockY: blockY, bh: bh,
        vbw: gridX * 2 + rowsW,
        vbh: blockY + 2 * (bh + GY) + 18,
        dividerY: blockY - 14
      };
    } else {
      var blockX = rowsW + 46;
      L = {
        narrow: false, gridX: gridX, gridY: 150, blockX: blockX, bh: bh,
        vbw: blockX + 2 * (W + GX) + 14,
        vbh: 8 * (bh + GY) + 40,
        dividerX: blockX - 22
      };
    }
  }

  function slotXY(n) {
    var i = TOPROW.indexOf(n);
    if (i >= 0) return { x: L.gridX + i * (W + GX), y: L.gridY, w: W, h: H };
    i = BOTROW.indexOf(n);
    if (i >= 0) return { x: L.gridX + i * (W + GX), y: L.gridY + H + GY, w: W, h: H };
    if (n === 17) {
      return { x: L.gridX + 4 * (W + GX) - 22, y: L.gridY - H - 20, w: W + 44, h: H };
    }

    i = COL_B.indexOf(n);                       // 1-8
    if (i >= 0) {
      return L.narrow
        ? { x: L.gridX + i * (W + GX), y: L.blockY, w: W, h: L.bh }
        : { x: L.blockX + W + GX, y: 22 + i * (L.bh + GY), w: W, h: L.bh };
    }
    i = COL_A.indexOf(n);                       // 9-16
    if (i >= 0) {
      return L.narrow
        ? { x: L.gridX + i * (W + GX), y: L.blockY + L.bh + GY, w: W, h: L.bh }
        : { x: L.blockX, y: 22 + i * (L.bh + GY), w: W, h: L.bh };
    }
    return null;
  }

  function svgEl(tag, attrs) {
    var n = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (var k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    return n;
  }

  var selected = null, filter = 'all';

  function drawBox() {
    layout();
    var host = $('#fbSvg');
    host.innerHTML = '';
    var VBW = L.vbw, VBH = L.vbh;
    var svg = svgEl('svg', {
      viewBox: '0 0 ' + VBW + ' ' + VBH,
      /* explicit dimensions give the element an intrinsic ratio, without which
         width:100% + height:auto collapses in most browsers */
      width: VBW, height: VBH,
      preserveAspectRatio: 'xMidYMid meet',
      class: 'fbsvg', role: 'group', 'aria-label': 'Fuse box map'
    });
    // the CSS backstop reads this, so it has to follow the live layout
    svg.style.setProperty('--fb-ratio', VBW + '/' + VBH);

    /* housing outline */
    svg.appendChild(svgEl('rect', {
      x: 4, y: 6, width: VBW - 8, height: VBH - 12, rx: 6,
      fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 1.5
    }));
    /* the rule separating the 1-16 block from the rest, whichever side it is on */
    svg.appendChild(L.narrow
      ? svgEl('line', {
          x1: 14, y1: L.dividerY, x2: VBW - 14, y2: L.dividerY,
          stroke: 'var(--ink-3)', 'stroke-width': 1, 'stroke-dasharray': '3 4'
        })
      : svgEl('line', {
          x1: L.dividerX, y1: 14, x2: L.dividerX, y2: VBH - 18,
          stroke: 'var(--ink-3)', 'stroke-width': 1, 'stroke-dasharray': '3 4'
        }));

    F.slots.forEach(function (s) {
      var p = slotXY(s.n);
      if (!p) return;
      var cls = classOf(s);
      var tapped = F.taps.indexOf(s.n) >= 0;
      var dim = filter !== 'all' &&
        !(filter === 'tap' ? tapped : cls === filter);

      var g = svgEl('g', {
        class: 'fslot' + (tapped ? ' tap' : '') + (dim ? ' dim' : '') +
               (selected === s.n ? ' sel' : '') + (s.amp == null ? ' blank' : ''),
        tabindex: '0', role: 'button',
        'aria-label': 'Fuse ' + s.n + ', ' + (s.amp ? s.amp + ' amp ' + s.name : 'unused')
      });
      g.appendChild(svgEl('rect', {
        x: p.x, y: p.y, width: p.w, height: p.h, rx: 3,
        class: 'fbody',
        style: s.amp && F.colours[s.amp] ? '--fc:' + F.colours[s.amp].hex : ''
      }));
      var t1 = svgEl('text', {
        x: p.x + p.w / 2, y: p.y + p.h / 2 - 2,
        'text-anchor': 'middle', class: 'fnum'
      });
      t1.textContent = s.n;
      g.appendChild(t1);
      var t2 = svgEl('text', {
        x: p.x + p.w / 2, y: p.y + p.h - 7,
        'text-anchor': 'middle', class: 'famp'
      });
      t2.textContent = s.amp == null ? '—' : s.amp + 'A';
      g.appendChild(t2);

      if (tapped) {
        g.appendChild(svgEl('circle', {
          cx: p.x + p.w - 7, cy: p.y + 7, r: 3.4, class: 'ftap'
        }));
      }
      var pick = function () { select(s.n); };
      g.addEventListener('click', pick);
      g.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); }
      });
      svg.appendChild(g);
    });

    host.appendChild(svg);
    fitSvgHeight(svg);
  }

  /*
   * Pin the SVG's height in pixels rather than letting the browser work it out.
   *
   * Safari resolves width:100% on an SVG fine but will not always derive the
   * height from the viewBox, leaving it zero. The scroll container clips
   * overflow-y, so a zero-height SVG means the entire map vanishes while the
   * card, the hint and the legend all still render - which looks like the map
   * was never drawn. Computing it from the measured width removes the guess.
   */
  function fitSvgHeight(svg) {
    if (!svg) return;
    var w = svg.getBoundingClientRect().width;
    if (!w) {
      var host = $('#fbSvg');
      w = host ? host.clientWidth : 0;
    }
    if (!w) w = L.vbw;                          // nothing measurable yet
    svg.style.height = (w * L.vbh / L.vbw).toFixed(1) + 'px';

    /* viewBox units per rendered pixel. Type multiplies by this so it comes
       out the size it was designed at however far the map has been scaled. */
    var z = L.vbw / w;
    svg.style.setProperty('--fbz', Math.max(1, Math.min(1.7, z)).toFixed(3));
  }

  /* ------------------------------------------------------------- detail */

  function loadsOn(n) {
    return budget.filter(function (b) { return b.fuse === n; });
  }

  function select(n) {
    selected = n;
    drawBox();
    var s = byN[n];
    var d = $('#detail');
    var cls = classOf(s);
    var kc = F.classes[cls];
    var tapped = F.taps.indexOf(n) >= 0;
    var mine = loadsOn(n);
    var added = mine.reduce(function (a, b) { return a + (+b.typ || 0); }, 0);
    var ceiling = s.amp ? s.amp * SAFE : 0;
    var used = (s.load[0] + s.load[1]) / 2 + added;
    var pct = ceiling ? Math.min(100, used / ceiling * 100) : 0;

    var h = '';
    h += '<div class="d-head">';
    h += '<div class="d-no"><span>' + s.n + '</span></div>';
    h += '<div><h3>' + esc(s.name) + '</h3>';
    var col = s.amp ? F.colours[s.amp] : null;
    h += '<p class="mono faint" style="margin:2px 0 0;font-size:11.5px">' +
         (s.amp == null ? 'position unused'
                        : s.amp + ' A' + (col ? ' · ' + col.name + ' body' : '')) +
         '</p></div>';
    if (col) {
      h += '<i class="d-swatch" title="' + esc(col.name) +
           '" style="background:' + col.hex + '"></i>';
    }
    h += '</div>';

    h += '<div class="chips" style="margin:14px 0">';
    if (kc) {
      h += '<span class="chip ' + (cls === 'bat' ? 'warn' : cls === 'ill' ? 'cool' : '') + '"><b>' +
           esc(kc.name) + '</b></span>';
      h += isProbed(s)
        ? '<span class="chip ok">measured</span>'
        : '<span class="chip">' + (s.conf === 'hi' ? 'confident' :
            s.conf === 'med' ? 'likely — verify' : 'unsure — verify') + '</span>';
    }
    if (tapped) h += '<span class="chip src">tap fitted</span>';
    h += '</div>';

    if (kc) h += '<p class="muted" style="font-size:13.5px">' + esc(kc.desc) + '</p>';
    h += '<p>' + esc(s.what) + '</p>';
    if (s.note) h += '<div class="note"><p>' + esc(s.note) + '</p></div>';

    if (s.amp) {
      h += '<span class="lbl" style="margin-top:16px">Capacity</span>';
      h += '<div class="meter tall ' + (pct > 100 ? 'over' : pct > 75 ? 'warn' : 'ok') +
           '"><i style="width:' + pct + '%"></i></div>';
      h += '<div class="spread" style="margin-top:7px;font-size:12px" class="mono">';
      h += '<span class="mono faint">existing ' + s.load[0] + '–' + s.load[1] + ' A' +
           (added ? ' + added ' + added.toFixed(2) + ' A' : '') + '</span>';
      h += '<span class="mono num">ceiling ' + ceiling.toFixed(1) + ' A</span>';
      h += '</div>';
      h += '<p class="faint" style="font-size:11.5px;margin-top:8px">' +
           'Existing load is an estimate from typical bulb and module draw, not a measurement. ' +
           'Ceiling is 80 % of the fuse rating.</p>';
    }

    if (mine.length) {
      h += '<span class="lbl" style="margin-top:14px">On this circuit</span><ul class="d-list">';
      mine.forEach(function (b) {
        var L = F.loads.filter(function (x) { return x.id === b.id; })[0];
        h += '<li><b>' + esc(L ? L.mod : b.id) + '</b> <span class="num">' +
             (+b.typ).toFixed(2) + ' A</span></li>';
      });
      h += '</ul>';
    }

    if (s.amp) {
      h += '<span class="lbl" style="margin-top:16px">Probe this slot</span>';
      h += '<div class="probe-row" data-fuse="' + s.n + '">';
      ['bat', 'acc', 'ig', 'ill'].forEach(function (k) {
        h += '<button class="btn ghost sm" data-set="' + k + '"' +
             (cls === k && isProbed(s) ? ' aria-pressed="true"' : '') + '>' +
             esc(F.classes[k].name) + '</button>';
      });
      h += '<button class="btn ghost sm" data-set="clear">Clear</button></div>';
    }

    d.innerHTML = h;
    $$('#detail [data-set]').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-set');
        if (k === 'clear') delete probed[n]; else probed[n] = k;
        store.set('probe', probed);
        select(n);
        renderLegend();
      });
    });
  }

  /* --------------------------------------------------------- filters */

  function renderFilters() {
    var host = $('#filters');
    var opts = [['all', 'All'], ['tap', 'Tapped'], ['bat', 'Constant'],
                ['acc', 'Accessory'], ['ig', 'Ignition'], ['ill', 'Illumination']];
    host.innerHTML = '';
    opts.forEach(function (o) {
      var b = el('button', {
        class: 'btn ghost sm', text: o[1],
        'aria-pressed': filter === o[0] ? 'true' : 'false',
        onclick: function () {
          filter = o[0];
          renderFilters(); drawBox();
        }
      });
      host.appendChild(b);
    });
  }

  function renderLegend() {
    var host = $('#legend');
    if (!host) return;
    var counts = { bat: 0, acc: 0, ig: 0, ill: 0 };
    var unver = 0;
    F.slots.forEach(function (s) {
      var c = classOf(s);
      if (counts[c] != null) counts[c]++;
      if (s.amp && !isProbed(s) && s.conf !== 'hi') unver++;
    });
    host.innerHTML =
      Object.keys(counts).map(function (k) {
        return '<span class="chip"><b>' + counts[k] + '</b> ' + esc(F.classes[k].name) + '</span>';
      }).join('') +
      '<span class="chip warn">' + unver + ' worth verifying</span>' +
      '<span class="chip src">' + F.taps.length + ' tapped</span>';
  }

  /* ----------------------------------------------------------- probe */

  function renderProbe() {
    var host = $('#probe');
    if (!host) return;
    var h = '<p class="muted" style="margin-top:0;font-size:13.5px">' +
      'Back-probe the slot with the fuse in place. Note whether it is live in each state:</p>' +
      '<ol class="probe-list">';
    F.probe.forEach(function (p) {
      h += '<li><b>' + esc(p.q) + '</b>' +
           (p.hint ? '<span class="faint"> — ' + esc(p.hint) + '</span>' : '') + '</li>';
    });
    h += '</ol>';
    h += '<div class="tbl-wrap" style="margin-top:14px"><table><thead><tr>' +
      '<th>Live at</th><th>Class</th></tr></thead><tbody>' +
      '<tr><td>All four states</td><td><b>Constant</b></td></tr>' +
      '<tr><td>ACC and IG only</td><td><b>Accessory</b></td></tr>' +
      '<tr><td>IG only</td><td><b>Ignition</b></td></tr>' +
      '<tr><td>Sidelights only</td><td><b>Illumination</b></td></tr>' +
      '</tbody></table></div>' +
      '<p class="faint" style="font-size:11.5px;margin:12px 0 0">' +
      'Then set it on the fuse itself in the map above — it is remembered on this device.</p>';
    host.innerHTML = h;
  }

  /* ---------------------------------------------------------- budget */

  function renderLoads() {
    var tb = $('#loadTbl tbody');
    tb.innerHTML = '';
    F.loads.forEach(function (L) {
      var b = budget.filter(function (x) { return x.id === L.id; })[0];
      if (!b) return;
      var tr = el('tr');

      tr.appendChild(el('td', null, [
        el('b', { text: L.mod }),
        el('p', { class: 'faint', style: 'margin:3px 0 0;font-size:11.5px;max-width:34ch',
                  text: L.note })
      ]));

      var sel = el('select');
      sel.appendChild(el('option', { value: '', text: 'Not on a J/B fuse' }));
      F.slots.forEach(function (s) {
        if (!s.amp) return;
        sel.appendChild(el('option', {
          value: s.n, text: s.n + ' · ' + s.name + ' ' + s.amp + 'A',
          selected: b.fuse === s.n ? 'selected' : null
        }));
      });
      sel.addEventListener('change', function () {
        b.fuse = sel.value === '' ? null : +sel.value;
        saveBudget(); renderBudget(); drawBox();
        if (selected != null) select(selected);
      });
      tr.appendChild(el('td', null, [sel]));

      ['typ', 'peak'].forEach(function (k) {
        var inp = el('input', { type: 'number', step: '0.05', min: '0', value: b[k] });
        inp.addEventListener('input', function () {
          b[k] = parseFloat(inp.value) || 0;
          b.measured = true;
          saveBudget(); renderBudget(); renderLoads();
          if (selected != null) select(selected);
        });
        tr.appendChild(el('td', { style: 'width:104px' }, [inp]));
      });

      tr.appendChild(el('td', null, [
        el('span', {
          class: 'chip ' + (b.measured ? 'ok' : 'warn'),
          text: b.measured ? 'entered' : 'estimate'
        })
      ]));
      tb.appendChild(tr);
    });
  }

  function renderBudget() {
    var host = $('#budget');
    host.innerHTML = '';
    var seen = {};
    var nums = [];
    budget.forEach(function (b) { if (b.fuse) seen[b.fuse] = true; });
    F.taps.forEach(function (n) { seen[n] = true; });
    Object.keys(seen).map(Number).sort(function (a, b) { return a - b; })
      .forEach(function (n) { nums.push(n); });

    var totalFree = 0;

    nums.forEach(function (n) {
      var s = byN[n];
      if (!s || !s.amp) return;
      var mine = loadsOn(n);
      var added = mine.reduce(function (a, b) { return a + (+b.typ || 0); }, 0);
      var addedPk = mine.reduce(function (a, b) { return a + (+b.peak || 0); }, 0);
      var existing = (s.load[0] + s.load[1]) / 2;
      var ceiling = s.amp * SAFE;
      var used = existing + added;
      var free = ceiling - used;
      totalFree += Math.max(0, free);
      var pct = Math.min(100, used / ceiling * 100);
      var peakPct = Math.min(100, (existing + addedPk) / s.amp * 100);
      var state = used > ceiling ? 'over' : pct > 75 ? 'warn' : 'ok';

      var card = el('div', { class: 'card', 'data-reveal': '' });
      card.innerHTML =
        '<div class="spread" style="margin-bottom:10px">' +
          '<div><h3 style="margin:0">' + s.n + ' · ' + esc(s.name) + '</h3>' +
          '<p class="faint mono" style="margin:2px 0 0;font-size:11px">' + s.amp +
          ' A · ' + esc((F.classes[classOf(s)] || {}).name || '') + '</p></div>' +
          '<div class="readout" style="text-align:right"><div class="v" style="font-size:22px">' +
          (free >= 0 ? free.toFixed(1) : '−' + Math.abs(free).toFixed(1)) +
          '<small>A free</small></div></div>' +
        '</div>' +
        '<span class="lbl">Continuous, against 80 % ceiling</span>' +
        '<div class="meter tall ' + state + '"><i style="width:' + pct + '%"></i></div>' +
        '<div class="spread mono faint" style="font-size:11px;margin-top:6px">' +
          '<span>existing ~' + existing.toFixed(1) + ' A + added ' + added.toFixed(2) + ' A</span>' +
          '<span>' + used.toFixed(2) + ' / ' + ceiling.toFixed(1) + ' A</span>' +
        '</div>' +
        '<span class="lbl" style="margin-top:12px">Worst case, against full rating</span>' +
        '<div class="meter ' + (peakPct > 95 ? 'over' : peakPct > 80 ? 'warn' : '') +
          '"><i style="width:' + peakPct + '%"></i></div>' +
        '<div class="mono faint" style="font-size:11px;margin-top:6px">' +
          (existing + addedPk).toFixed(1) + ' A peak of ' + s.amp + ' A</div>' +
        (mine.length ? '<ul class="d-list" style="margin-top:12px">' + mine.map(function (b) {
            var L = F.loads.filter(function (x) { return x.id === b.id; })[0];
            return '<li><b>' + esc(L ? L.mod : b.id) + '</b> <span class="num">' +
                   (+b.typ).toFixed(2) + ' A</span>' +
                   (b.measured ? '' : ' <span class="chip warn">est</span>') + '</li>';
          }).join('') + '</ul>'
          : '<p class="faint" style="font-size:12px;margin:12px 0 0">Tap fitted, nothing assigned to it yet.</p>');
      host.appendChild(card);
    });

    var fa = $('#freeA');
    if (fa) fa.textContent = totalFree.toFixed(1);

    /* whole-car note */
    var addedTot = budget.reduce(function (a, b) { return a + (+b.typ || 0); }, 0);
    var peakTot = budget.reduce(function (a, b) { return a + (+b.peak || 0); }, 0);
    var note = $('#altNote');
    if (note) {
      note.innerHTML =
        'Everything logged here adds <b class="num">' + addedTot.toFixed(1) +
        ' A</b> typical and <b class="num">' + peakTot.toFixed(1) +
        ' A</b> if it all peaks together. The generator is rated <b class="num">80 A</b> ' +
        'at 12 V (SS-27), but that is its output at speed — at idle a Toyota 80 A unit ' +
        'realistically delivers around half. The number that matters is not whether 80 A ' +
        'covers it, but whether the car still charges with headlights, blower, heated rear ' +
        'window and heated seats all on in traffic. ' +
        (peakTot > 20
          ? '<b>At ' + peakTot.toFixed(0) + ' A of added peak, check resting voltage at idle with everything on.</b>'
          : 'The current total leaves comfortable margin.');
    }

    C.initReveal();
    C.initGlow();
  }

  /* ------------------------------------------------------- manual figs */

  function renderFigs() {
    var host = $('#manFigs');
    if (!host || !C.manual) return;
    [[1651, 'Body electrical power source — where the feeds originate'],
     [1652, 'Engine room junction block and relay block (2000 US layout)'],
     [1653, 'Instrument panel J/B — 23 fuses. Not this car.']]
      .forEach(function (f) {
        var w = el('div', { 'data-reveal': '' });
        w.appendChild(C.figure(f[0], f[1]));
        host.appendChild(w);
      });
    C.initReveal();
  }

  /* --------------------------------------------------------------- boot */

  /* the map rearranges between the wide and narrow layouts, so rebuild it when
     the viewport crosses that line - rotating a phone, mostly */
  if (narrowQ.addEventListener) {
    narrowQ.addEventListener('change', function () {
      drawBox();
      if (selected != null) select(selected);
    });
  } else if (narrowQ.addListener) {
    narrowQ.addListener(function () { drawBox(); });
  }

  /* Crossing the breakpoint is already handled above by redrawing. This is
     for every other width change - address bar collapsing, rotating inside
     the same breakpoint - where the layout stands but the scale moves. */
  window.addEventListener('resize', function () {
    fitSvgHeight(document.querySelector('.fbsvg'));
  });
  window.addEventListener('orientationchange', function () {
    setTimeout(function () { fitSvgHeight(document.querySelector('.fbsvg')); }, 150);
  });

  renderFilters();
  drawBox();
  renderLegend();
  renderProbe();
  renderLoads();
  renderBudget();
  renderFigs();
  select(18);

  $('#resetBudget').addEventListener('click', function () {
    budget = F.loads.map(function (l) {
      return { id: l.id, fuse: l.fuse, typ: l.draw[0], peak: l.draw[1], measured: false };
    });
    store.set('budget', budget);
    renderLoads(); renderBudget(); drawBox();
    if (selected != null) select(selected);
  });
})();
