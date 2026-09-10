/* ==========================================================================
   Projects — index and detail, driven entirely by data/projects.js.

   Nothing here knows what any project is about. Add an entry to the array and
   it gets a card, a URL at #<id>, a contents rail built from its sections and
   independent checklist state.
   ========================================================================== */
(function () {
  'use strict';
  var C = window.CELICA, $ = C.$, $$ = C.$$, el = C.el, esc = C.esc, store = C.store;
  var P = C.projects || [];

  var STATUS = {
    proposed: { label: 'Proposed', chip: '' },
    planned: { label: 'Planned', chip: 'warn' },
    active: { label: 'In progress', chip: 'src' },
    done: { label: 'Done', chip: 'ok' },
    parked: { label: 'Parked', chip: '' }
  };

  var filter = 'All';

  /* ------------------------------------------------------------ progress */

  function stateKey(proj, list) { return 'proj.' + proj.id + '.' + list.id; }

  function listProgress(proj, list) {
    var st = store.get(stateKey(proj, list), {});
    var done = 0;
    list.items.forEach(function (_, i) { if (st[i]) done++; });
    return { done: done, total: list.items.length, state: st };
  }

  function projProgress(proj) {
    var done = 0, total = 0;
    (proj.checklists || []).forEach(function (l) {
      var p = listProgress(proj, l);
      done += p.done; total += p.total;
    });
    return { done: done, total: total };
  }

  /* --------------------------------------------------------------- index */

  function renderFilters() {
    var host = $('#projFilters');
    if (!host) return;
    var cats = ['All'];
    P.forEach(function (p) { if (cats.indexOf(p.cat) < 0) cats.push(p.cat); });
    host.innerHTML = '';
    cats.forEach(function (c) {
      var n = c === 'All' ? P.length
        : P.filter(function (p) { return p.cat === c; }).length;
      host.appendChild(el('button', {
        class: 'btn ghost sm',
        'aria-pressed': filter === c ? 'true' : 'false',
        html: esc(c) + ' <span class="num" style="opacity:.6">' + n + '</span>',
        onclick: function () { filter = c; renderFilters(); renderCards(); }
      }));
    });
  }

  function renderCards() {
    var host = $('#projCards');
    host.innerHTML = '';
    var shown = P.filter(function (p) { return filter === 'All' || p.cat === filter; });

    if (!shown.length) {
      host.innerHTML = '<div class="empty">Nothing in that category yet.</div>';
      return;
    }

    shown.forEach(function (p) {
      var st = STATUS[p.status] || STATUS.proposed;
      var pr = projProgress(p);
      var pct = pr.total ? Math.round(pr.done / pr.total * 100) : 0;

      var a = el('a', {
        class: 'card lit projcard', href: '#' + p.id,
        onclick: function (e) { e.preventDefault(); open(p.id); }
      });
      a.innerHTML =
        '<div class="spread" style="align-items:flex-start;gap:12px;margin-bottom:10px">' +
          '<div style="min-width:0">' +
            '<span class="k">' + esc(p.cat) + '</span>' +
            '<h3>' + esc(p.title) + '</h3>' +
          '</div>' +
          '<span class="chip ' + st.chip + '">' + esc(st.label) + '</span>' +
        '</div>' +
        '<p class="muted" style="font-size:13.5px;margin:0 0 14px">' + esc(p.blurb) + '</p>' +
        '<div class="pmeta">' +
          (p.meta || []).map(function (m) {
            return '<div><span class="k">' + esc(m.k) + '</span>' +
                   '<b class="num">' + esc(m.v) + '</b></div>';
          }).join('') +
        '</div>' +
        (pr.total
          ? '<div style="margin-top:14px">' +
            '<div class="spread mono faint" style="font-size:10.5px;margin-bottom:5px">' +
              '<span>' + (p.checklists.length > 1
                ? p.checklists.length + ' checklists' : 'checklist') + '</span>' +
              '<span>' + pr.done + ' / ' + pr.total + '</span>' +
            '</div>' +
            '<div class="meter' + (pct === 100 ? ' ok' : '') + '">' +
              '<i style="width:' + pct + '%"></i></div></div>'
          : '') +
        '<span class="go" style="margin-top:14px;display:block">Open →</span>';
      host.appendChild(a);
    });
    C.initGlow();
  }

  /* -------------------------------------------------------------- detail */

  function open(id) {
    var p = P.filter(function (x) { return x.id === id; })[0];
    if (!p) { close(); return; }

    var st = STATUS[p.status] || STATUS.proposed;
    $('#projIndex').hidden = true;
    $('#projDetail').hidden = false;

    $('#projHead').innerHTML =
      '<p class="eyebrow">' + esc(p.cat) + '</p>' +
      '<h1 style="font-size:clamp(24px,3.6vw,34px);margin-bottom:14px">' + esc(p.title) + '</h1>' +
      '<p class="lede">' + esc(p.blurb) + '</p>' +
      '<div class="chips" style="margin-top:18px">' +
        '<span class="chip ' + st.chip + '">' + esc(st.label) + '</span>' +
        (p.meta || []).map(function (m) {
          return '<span class="chip"><span class="faint">' + esc(m.k) + '</span> <b>' +
                 esc(m.v) + '</b></span>';
        }).join('') +
      '</div>';

    /* body ------------------------------------------------------------- */
    var body = $('#projBody');
    body.innerHTML = '';

    (p.sections || []).forEach(function (s) {
      var h = el('h2', { id: 's-' + s.id, text: s.title });
      body.appendChild(h);
      var div = el('div');
      div.innerHTML = s.html;
      body.appendChild(div);
    });

    (p.checklists || []).forEach(function (list) {
      body.appendChild(el('h2', { id: 's-' + list.id, text: list.title }));
      if (list.note) body.appendChild(el('p', { text: list.note }));
      body.appendChild(buildList(p, list));
    });

    if (p.open && p.open.length) {
      body.appendChild(el('h2', { id: 's-open', text: 'Open questions' }));
      var ol = el('ol');
      p.open.forEach(function (q) { ol.appendChild(el('li', { text: q })); });
      body.appendChild(ol);
    }

    if (p.links && p.links.length) {
      body.appendChild(el('h2', { id: 's-sources', text: 'Sources' }));
      var ul = el('ul');
      p.links.forEach(function (l) {
        var li = el('li');
        li.appendChild(el('a', { href: l.u, text: l.t, rel: 'noopener' }));
        ul.appendChild(li);
      });
      body.appendChild(ul);
    }

    buildToc();
    window.scrollTo({ top: 0, behavior: C.reduced ? 'auto' : 'smooth' });
  }

  function buildList(proj, list) {
    var card = el('div', { class: 'card' });
    var pr = listProgress(proj, list);

    var head = el('div', { class: 'spread', style: 'margin-bottom:12px' });
    head.innerHTML =
      '<span class="lbl" style="margin:0">' + esc(list.title) + '</span>' +
      '<span class="chip num" data-count-for="' + list.id + '">' +
      pr.done + ' / ' + pr.total + '</span>';
    card.appendChild(head);

    var meter = el('div', { class: 'meter tall' });
    meter.innerHTML = '<i></i>';
    card.appendChild(meter);

    var wrap = el('div', { style: 'margin-top:14px' });
    list.items.forEach(function (t, i) {
      var lab = el('label', { class: 'check' });
      var cb = el('input', { type: 'checkbox' });
      cb.checked = !!pr.state[i];
      cb.addEventListener('change', function () {
        pr.state[i] = cb.checked;
        store.set(stateKey(proj, list), pr.state);
        sync();
      });
      lab.appendChild(cb);
      lab.appendChild(el('span', { text: t }));
      wrap.appendChild(lab);
    });
    card.appendChild(wrap);

    card.appendChild(el('button', {
      class: 'btn ghost sm', text: 'Clear list', style: 'margin-top:12px',
      onclick: function () {
        store.del(stateKey(proj, list));
        for (var k in pr.state) delete pr.state[k];
        $$('input[type=checkbox]', wrap).forEach(function (i) { i.checked = false; });
        sync();
      }
    }));

    function sync() {
      var done = 0;
      list.items.forEach(function (_, i) { if (pr.state[i]) done++; });
      head.querySelector('.chip').textContent = done + ' / ' + list.items.length;
      var pct = list.items.length ? done / list.items.length * 100 : 0;
      meter.querySelector('i').style.width = pct + '%';
      meter.className = 'meter tall' + (pct === 100 ? ' ok' : '');
    }
    sync();
    return card;
  }

  function buildToc() {
    var toc = $('#projToc');
    toc.innerHTML = '';
    var heads = $$('#projBody h2[id]');
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
      $$('#projToc a').forEach(function (a) { links[a.getAttribute('data-for')] = a; });
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          $$('#projToc a').forEach(function (a) { a.classList.remove('on'); });
          var a = links[en.target.id];
          if (a) a.classList.add('on');
        });
      }, { rootMargin: '-70px 0px -72% 0px' });
      heads.forEach(function (h) { io.observe(h); });
    }
  }

  function close() {
    $('#projDetail').hidden = true;
    $('#projIndex').hidden = false;
    renderCards();          // progress may have moved while the detail was open
  }

  /* ---------------------------------------------------------------- wire */

  $('#projBack').addEventListener('click', function (e) {
    e.preventDefault();
    if (history.replaceState) history.replaceState(null, '', location.pathname);
    close();
  });

  function fromHash() {
    var id = location.hash.slice(1);
    if (id && P.some(function (p) { return p.id === id; })) open(id);
    else close();
  }

  renderFilters();
  renderCards();
  fromHash();
  window.addEventListener('hashchange', fromHash);
})();
