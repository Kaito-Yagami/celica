/* ==========================================================================
   Issues — dashboard, index and detail, driven by data/issues.js.

   The dashboard marks each issue on the 3D model. model3d.js is deferred, so
   this file queues its config and the viewer picks it up when it loads.
   ========================================================================== */
(function () {
  'use strict';
  var C = window.CELICA, $ = C.$, $$ = C.$$, el = C.el, esc = C.esc, store = C.store;
  var I = C.issues || [];

  var SEV = {
    urgent: { label: 'Urgent', chip: 'warn', tone: 'hot', rank: 0 },
    attention: { label: 'Needs attention', chip: 'warn', tone: '', rank: 1 },
    watch: { label: 'Keep an eye on', chip: '', tone: 'cool', rank: 2 }
  };
  var STATUS = {
    open: { label: 'Open', chip: 'warn' },
    diagnosing: { label: 'Diagnosing', chip: 'src' },
    scheduled: { label: 'Scheduled', chip: 'src' },
    fixed: { label: 'Fixed', chip: 'ok' }
  };

  var filter = 'All';
  var api = null;

  /* status is the one thing the user changes, so it persists */
  var state = store.get('issueState', {});
  function statusOf(iss) { return state[iss.id] || iss.status; }
  function setStatus(iss, s) {
    state[iss.id] = s;
    store.set('issueState', state);
  }
  function live(iss) { return statusOf(iss) !== 'fixed'; }

  function byId(id) { return I.filter(function (x) { return x.id === id; })[0]; }

  /* ------------------------------------------------------------ dashboard */

  function renderStats() {
    var host = $('#issStats');
    if (!host) return;
    var open = I.filter(live);
    var areas = {};
    open.forEach(function (i) { areas[i.area] = (areas[i.area] || 0) + 1; });

    var cells = [
      { v: open.length, k: 'Open', note: I.length - open.length + ' marked fixed', hot: open.length > 0 },
      { v: open.filter(function (i) { return i.severity === 'urgent'; }).length,
        k: 'Urgent', note: 'Stop-and-fix' },
      { v: open.filter(function (i) { return i.severity === 'attention'; }).length,
        k: 'Needs attention', note: 'Booked or budgeted' },
      { v: Object.keys(areas).length, k: 'Areas affected',
        note: Object.keys(areas).join(' · ') || '—' }
    ];

    host.innerHTML = '';
    cells.forEach(function (c) {
      host.appendChild(el('div', { class: 'stat' }, [
        el('div', { class: 'readout' + (c.hot ? ' hot' : '') }, [
          el('div', { class: 'v', text: String(c.v) }),
          el('div', { class: 'k', text: c.k })
        ]),
        el('p', { class: 'faint', text: c.note })
      ]));
    });
  }

  var sideShowing;                 // guards against redundant re-renders
  function renderSide(id) {
    var host = $('#dashSide');
    if (!host) return;
    if (sideShowing === id) return;
    sideShowing = id;
    var iss = id && byId(id);
    if (!iss) {
      var open = I.filter(live);
      host.innerHTML =
        '<span class="lbl">The map</span>' +
        '<p class="muted" style="font-size:13.5px">Each marker is an open issue, placed ' +
        'roughly where it is on the car. Hover one to read it, click to open it. Drag the ' +
        'car to turn it.</p>' +
        '<div class="stack" style="gap:6px;margin-top:14px">' +
        open.map(function (i) {
          var s = SEV[i.severity] || SEV.watch;
          return '<button class="sidebtn" data-go="' + i.id + '">' +
                 '<i class="dot ' + (s.tone || '') + '"></i>' +
                 '<span>' + esc(i.title) + '</span>' +
                 '<em class="mono">' + esc(i.area) + '</em></button>';
        }).join('') +
        '</div>';
    } else {
      var s = SEV[iss.severity] || SEV.watch;
      var st = STATUS[statusOf(iss)] || STATUS.open;
      host.innerHTML =
        '<span class="lbl">' + esc(iss.area) + '</span>' +
        '<h3 style="margin:0 0 8px">' + esc(iss.title) + '</h3>' +
        '<div class="chips" style="margin-bottom:12px">' +
          '<span class="chip ' + s.chip + '">' + esc(s.label) + '</span>' +
          '<span class="chip ' + st.chip + '">' + esc(st.label) + '</span>' +
        '</div>' +
        '<p class="muted" style="font-size:13.5px">' + esc(iss.blurb) + '</p>' +
        '<button class="btn primary sm" data-go="' + iss.id + '">Open →</button>';
    }
    $$('#dashSide [data-go]').forEach(function (b) {
      b.addEventListener('click', function () { open(b.getAttribute('data-go')); });
      b.addEventListener('pointerenter', function () {
        if (api) api.highlight(b.getAttribute('data-go'));
      });
    });
  }

  /* ---------------------------------------------------------------- index */

  function renderFilters() {
    var host = $('#issFilters');
    var areas = ['All'];
    I.forEach(function (i) { if (areas.indexOf(i.area) < 0) areas.push(i.area); });
    host.innerHTML = '';
    areas.forEach(function (a) {
      var n = a === 'All' ? I.length : I.filter(function (i) { return i.area === a; }).length;
      host.appendChild(el('button', {
        class: 'btn ghost sm',
        'aria-pressed': filter === a ? 'true' : 'false',
        html: esc(a) + ' <span class="num" style="opacity:.6">' + n + '</span>',
        onclick: function () { filter = a; renderFilters(); renderCards(); }
      }));
    });
  }

  function renderCards() {
    var host = $('#issCards');
    host.innerHTML = '';
    var shown = I.filter(function (i) { return filter === 'All' || i.area === filter; })
      .sort(function (a, b) {
        var la = live(a) ? 0 : 1, lb = live(b) ? 0 : 1;
        if (la !== lb) return la - lb;
        return (SEV[a.severity] || SEV.watch).rank - (SEV[b.severity] || SEV.watch).rank;
      });

    shown.forEach(function (iss) {
      var s = SEV[iss.severity] || SEV.watch;
      var st = STATUS[statusOf(iss)] || STATUS.open;
      var a = el('a', {
        class: 'card lit projcard' + (live(iss) ? '' : ' done'),
        href: '#' + iss.id,
        onclick: function (e) { e.preventDefault(); open(iss.id); }
      });
      a.innerHTML =
        '<div class="spread" style="align-items:flex-start;gap:12px;margin-bottom:10px">' +
          '<div style="min-width:0">' +
            '<span class="k">' + esc(iss.area) + '</span>' +
            '<h3>' + esc(iss.title) + '</h3>' +
          '</div>' +
          '<div style="display:flex;flex-direction:column;gap:5px;align-items:flex-end">' +
            '<span class="chip ' + st.chip + '">' + esc(st.label) + '</span>' +
            '<span class="chip ' + s.chip + '">' + esc(s.label) + '</span>' +
          '</div>' +
        '</div>' +
        '<p class="muted" style="font-size:13.5px;margin:0 0 14px">' + esc(iss.blurb) + '</p>' +
        '<div class="spread mono faint" style="font-size:10.5px">' +
          '<span>' + (iss.check || []).length + ' checks · ' +
                     (iss.figs || []).length + ' manual pages</span>' +
          '<span>' + esc(iss.since || '') + '</span>' +
        '</div>' +
        '<span class="go" style="margin-top:12px;display:block">Open →</span>';
      a.addEventListener('pointerenter', function () { if (api) api.highlight(iss.id); });
      host.appendChild(a);
    });
    C.initGlow();
  }

  /* --------------------------------------------------------------- detail */

  function open(id) {
    var iss = byId(id);
    if (!iss) { close(); return; }
    var s = SEV[iss.severity] || SEV.watch;

    $('#issIndex').hidden = true;
    $('#issDetail').hidden = false;

    $('#issHead').innerHTML =
      '<p class="eyebrow">' + esc(iss.area) + '</p>' +
      '<h1 style="font-size:clamp(24px,3.6vw,34px);margin-bottom:14px">' + esc(iss.title) + '</h1>' +
      '<p class="lede">' + esc(iss.blurb) + '</p>' +
      '<div class="chips" style="margin-top:18px">' +
        '<span class="chip ' + s.chip + '">' + esc(s.label) + '</span>' +
        '<span class="chip"><span class="faint">Noticed</span> <b>' +
          esc(iss.since || '—') + '</b></span>' +
      '</div>' +
      '<div class="row" style="margin-top:16px">' +
        '<span class="lbl" style="margin:0 4px 0 0">Status</span>' +
        Object.keys(STATUS).map(function (k) {
          return '<button class="btn ghost sm" data-status="' + k + '"' +
                 (statusOf(iss) === k ? ' aria-pressed="true"' : '') + '>' +
                 esc(STATUS[k].label) + '</button>';
        }).join('') +
      '</div>';

    $$('#issHead [data-status]').forEach(function (b) {
      b.addEventListener('click', function () {
        setStatus(iss, b.getAttribute('data-status'));
        open(iss.id);
      });
    });

    var body = $('#issBody');
    body.innerHTML = '';

    function section(sid, title, html) {
      if (!html) return;
      body.appendChild(el('h2', { id: 'i-' + sid, text: title }));
      var d = el('div');
      d.innerHTML = html;
      body.appendChild(d);
    }

    section('symptom', 'What you are seeing', iss.symptom);
    section('cause', 'What usually causes it', iss.cause);

    if (iss.check && iss.check.length) {
      body.appendChild(el('h2', { id: 'i-check', text: 'What to check, in order' }));
      body.appendChild(buildChecks(iss));
    }

    section('fix', 'Putting it right', iss.fix);

    if (iss.figs && iss.figs.length) {
      body.appendChild(el('h2', { id: 'i-manual', text: 'From the manual' }));
      var g = el('div', { class: 'grid g2', style: 'margin-top:4px' });
      iss.figs.forEach(function (f) {
        var w = el('div');
        w.appendChild(C.figure(f.p, f.c));
        g.appendChild(w);
      });
      body.appendChild(g);
    }

    if (iss.related && iss.related.length) {
      body.appendChild(el('h2', { id: 'i-related', text: 'Related' }));
      var rel = el('div', { class: 'stack', style: 'gap:8px' });
      iss.related.forEach(function (rid) {
        var r = byId(rid);
        if (!r) return;
        rel.appendChild(el('button', {
          class: 'sidebtn', html: '<i class="dot"></i><span>' + esc(r.title) +
            '</span><em class="mono">' + esc(r.area) + '</em>',
          onclick: function () { open(rid); }
        }));
      });
      body.appendChild(rel);
    }

    buildToc();
    window.scrollTo({ top: 0, behavior: C.reduced ? 'auto' : 'smooth' });
    if (history.replaceState) history.replaceState(null, '', '#' + id);
  }

  function buildChecks(iss) {
    var key = 'issueChecks.' + iss.id;
    var st = store.get(key, {});
    var card = el('div', { class: 'card' });

    var head = el('div', { class: 'spread', style: 'margin-bottom:12px' });
    head.innerHTML = '<span class="lbl" style="margin:0">Diagnosis</span>' +
      '<span class="chip num"></span>';
    card.appendChild(head);

    var meter = el('div', { class: 'meter tall' });
    meter.innerHTML = '<i></i>';
    card.appendChild(meter);

    var wrap = el('div', { style: 'margin-top:14px' });
    iss.check.forEach(function (c, i) {
      var lab = el('label', { class: 'check' });
      var cb = el('input', { type: 'checkbox' });
      cb.checked = !!st[i];
      cb.addEventListener('change', function () {
        st[i] = cb.checked; store.set(key, st); sync();
      });
      lab.appendChild(cb);
      var sp = el('span');
      sp.innerHTML = esc(c.t) +
        (c.hint ? '<span class="faint" style="display:block;font-size:11.5px;margin-top:3px">' +
          esc(c.hint) + '</span>' : '');
      lab.appendChild(sp);
      wrap.appendChild(lab);
    });
    card.appendChild(wrap);

    card.appendChild(el('button', {
      class: 'btn ghost sm', text: 'Clear', style: 'margin-top:12px',
      onclick: function () {
        store.del(key);
        for (var k in st) delete st[k];
        $$('input[type=checkbox]', wrap).forEach(function (i) { i.checked = false; });
        sync();
      }
    }));

    function sync() {
      var done = 0;
      iss.check.forEach(function (_, i) { if (st[i]) done++; });
      head.querySelector('.chip').textContent = done + ' / ' + iss.check.length;
      var pct = done / iss.check.length * 100;
      meter.querySelector('i').style.width = pct + '%';
      meter.className = 'meter tall' + (pct === 100 ? ' ok' : '');
    }
    sync();
    return card;
  }

  function buildToc() {
    var toc = $('#issToc');
    toc.innerHTML = '';
    var heads = $$('#issBody h2[id]');
    heads.forEach(function (h) {
      toc.appendChild(el('a', {
        href: '#' + h.id, text: h.textContent, 'data-for': h.id,
        onclick: function (e) {
          e.preventDefault();
          h.scrollIntoView({ behavior: C.reduced ? 'auto' : 'smooth', block: 'start' });
        }
      }));
    });
    if ('IntersectionObserver' in window && heads.length) {
      var links = {};
      $$('#issToc a').forEach(function (a) { links[a.getAttribute('data-for')] = a; });
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          if (!en.isIntersecting) return;
          $$('#issToc a').forEach(function (a) { a.classList.remove('on'); });
          var a = links[en.target.id];
          if (a) a.classList.add('on');
        });
      }, { rootMargin: '-70px 0px -72% 0px' });
      heads.forEach(function (h) { io.observe(h); });
    }
  }

  function close() {
    $('#issDetail').hidden = true;
    $('#issIndex').hidden = false;
    renderStats(); renderCards();
    sideShowing = undefined;       // force a rebuild, counts may have moved
    renderSide(null);
  }

  $('#issBack').addEventListener('click', function (e) {
    e.preventDefault();
    if (history.replaceState) history.replaceState(null, '', location.pathname);
    close();
  });

  function fromHash() {
    var id = location.hash.slice(1);
    if (id && byId(id)) open(id); else close();
  }

  /* ----------------------------------------------------- queue the model */

  (C.model3dQueue = C.model3dQueue || []).push({
    sel: '#issModel',
    hidden: '#issHidden',
    spin: '#issSpin',
    dim: true,
    hotspots: I.filter(live).map(function (i) {
      var s = SEV[i.severity] || SEV.watch;
      return {
        id: i.id, x: i.hot.x, y: i.hot.y, z: i.hot.z,
        label: i.hot.label, tone: s.tone
      };
    }),
    onHotspot: function (id) { open(id); },
    onHover: function (id, on) { renderSide(on ? id : null); },
    ready: function (a) { api = a; }
  });

  renderStats();
  renderFilters();
  renderCards();
  renderSide(null);
  fromHash();
  window.addEventListener('hashchange', fromHash);
})();
