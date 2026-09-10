/* garage page -------------------------------------------------------------- */
(function () {
  'use strict';
  var C = window.CELICA, $ = C.$, $$ = C.$$, el = C.el, esc = C.esc, store = C.store;
  var M = C.maint;
  if (!M) return;

  $('#lede').textContent = M.note;

  /* --------------------------------------------------------------- log */

  var log = store.get('log', []);

  function fmtDate(s) {
    if (!s) return '—';
    var d = new Date(s + 'T00:00:00');
    if (isNaN(d)) return s;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function renderLog() {
    var host = $('#log');
    host.innerHTML = '';
    if (!log.length) {
      host.innerHTML = '<div class="empty">No entries yet. The first one is the hardest.</div>';
      return;
    }
    log.slice().sort(function (a, b) {
      return (b.date || '').localeCompare(a.date || '');
    }).forEach(function (e) {
      var c = el('div', { class: 'card lit logrow' });
      c.innerHTML =
        '<div class="spread" style="align-items:flex-start;gap:12px">' +
          '<div style="min-width:0">' +
            '<h3 style="margin:0;font-size:15px">' + esc(fmtDate(e.date)) + '</h3>' +
            '<div class="chips" style="margin-top:7px">' +
              (e.miles ? '<span class="chip num">' + C.fmt(+e.miles) + ' mi</span>' : '') +
              (e.cost ? '<span class="chip">' + esc(e.cost) + '</span>' : '') +
              (e.who ? '<span class="chip">' + esc(e.who) + '</span>' : '') +
            '</div>' +
          '</div>' +
          '<button class="btn ghost sm del" aria-label="Delete entry">Delete</button>' +
        '</div>' +
        (e.what ? '<p style="margin:12px 0 0;white-space:pre-wrap">' + esc(e.what) + '</p>' : '');
      c.querySelector('.del').addEventListener('click', function () {
        log = log.filter(function (x) { return x.id !== e.id; });
        store.set('log', log);
        renderLog();
      });
      host.appendChild(c);
    });
    C.initGlow();
  }

  var form = $('#logForm');
  $('#addEntry').addEventListener('click', function () {
    form.hidden = !form.hidden;
    if (!form.hidden) {
      if (!$('#lgDate').value) $('#lgDate').value = new Date().toISOString().slice(0, 10);
      $('#lgDate').focus();
    }
  });
  $('#lgCancel').addEventListener('click', function () { form.hidden = true; });
  $('#lgSave').addEventListener('click', function () {
    var e = {
      id: String(Date.now()),
      date: $('#lgDate').value,
      miles: $('#lgMiles').value,
      cost: $('#lgCost').value,
      who: $('#lgWho').value,
      what: $('#lgWhat').value
    };
    if (!e.date && !e.what) return;
    log.push(e);
    store.set('log', log);
    ['lgMiles', 'lgCost', 'lgWho', 'lgWhat'].forEach(function (id) { $('#' + id).value = ''; });
    form.hidden = true;
    renderLog();
  });

  renderLog();

  /* --------------------------------------------------------- checklists */

  function makeChecklist(hostSel, storeKey, countSel, build) {
    var state = store.get(storeKey, {});
    var host = $(hostSel);

    function save() { store.set(storeKey, state); count(); }
    function count() {
      var total = 0, done = 0;
      $$(hostSel + ' input[type=checkbox]').forEach(function (i) {
        total++; if (i.checked) done++;
      });
      var n = $(countSel);
      if (n) {
        n.textContent = done + ' / ' + total;
        n.className = 'chip' + (total && done === total ? ' ok' : '');
      }
    }
    build(host, state, save);
    count();
    return { state: state, save: save, count: count, host: host };
  }

  /* manual inspection list ------------------------------------------- */
  var ck = makeChecklist('#checks', 'checks', '#ckCount', function (host, state, save) {
    M.groups.forEach(function (g, gi) {
      var d = el('details', { class: 'spec' });
      if (gi === 0) d.setAttribute('open', 'open');
      var sm = el('summary');
      sm.innerHTML =
        '<span class="tcode">' + esc(g.code) + '</span>' +
        '<span class="tname" style="font-size:15px;font-family:var(--display);font-weight:600">' +
        esc(g.name) + '</span>' +
        '<span class="num" style="font-size:11px">' + g.items.length + '</span>';
      d.appendChild(sm);

      var box = el('div', { class: 'spec-body' });
      box.appendChild(el('p', {
        class: 'faint', style: 'font-size:11.5px;margin:12px 0 4px;letter-spacing:.04em',
        text: g.kind
      }));

      g.items.forEach(function (it, i) {
        var key = g.id + ':' + i;
        var lab = el('label', { class: 'check' });
        var cb = el('input', { type: 'checkbox' });
        cb.checked = !!state[key];
        cb.addEventListener('change', function () {
          state[key] = cb.checked; save();
        });
        lab.appendChild(cb);
        var sp = el('span');
        sp.innerHTML = esc(it.t) +
          (it.hint ? '<span class="faint" style="display:block;font-size:11.5px;margin-top:3px">' +
            esc(it.hint) + '</span>' : '');
        lab.appendChild(sp);
        if (it.ref != null) {
          var b = el('button', {
            class: 'btn ghost sm', text: 'p.' + it.ref, style: 'margin-left:auto;flex:0 0 auto',
            onclick: function (e) { e.preventDefault(); C.lightbox(it.ref); }
          });
          lab.appendChild(b);
        }
        box.appendChild(lab);
      });

      var f = el('div', { class: 'row', style: 'margin-top:12px' });
      f.appendChild(el('button', {
        class: 'btn ghost sm', text: 'Open ' + g.code,
        onclick: function () { C.lightbox(g.fig); }
      }));
      box.appendChild(f);

      d.appendChild(box);
      host.appendChild(d);
    });
  });

  $('#ckReset').addEventListener('click', function () {
    store.del('checks');
    $$('#checks input[type=checkbox]').forEach(function (i) { i.checked = false; });
    for (var k in ck.state) delete ck.state[k];
    ck.count();
  });

  /* pre-MOT ------------------------------------------------------------ */
  var mot = makeChecklist('#mot', 'mot', '#motCount', function (host, state, save) {
    M.mot.forEach(function (it, i) {
      var key = 'mot:' + i;
      var c = el('div', { class: 'card lit' });
      var lab = el('label', { class: 'check', style: 'padding:0' });
      var cb = el('input', { type: 'checkbox' });
      cb.checked = !!state[key];
      cb.addEventListener('change', function () { state[key] = cb.checked; save(); });
      lab.appendChild(cb);
      lab.appendChild(el('span', { html: '<b style="font-size:14.5px">' + esc(it.t) + '</b>' }));
      c.appendChild(lab);
      c.appendChild(el('p', {
        class: 'muted', style: 'font-size:13px;margin:10px 0 0', text: it.why
      }));
      c.appendChild(el('button', {
        class: 'btn ghost sm', text: 'p.' + it.fig, style: 'margin-top:12px',
        onclick: function () { C.lightbox(it.fig); }
      }));
      host.appendChild(c);
    });
  });

  $('#motReset').addEventListener('click', function () {
    store.del('mot');
    $$('#mot input[type=checkbox]').forEach(function (i) { i.checked = false; });
    for (var k in mot.state) delete mot.state[k];
    mot.count();
  });

  C.initGlow();
})();
