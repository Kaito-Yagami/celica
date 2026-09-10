/* manual browser + search --------------------------------------------------
   Search is a linear scan over the whole 1.8 MB corpus rather than a prebuilt
   index. At this size indexOf across 1,972 strings runs in a few milliseconds,
   it gives exact substring matching and free snippets, and it keeps the data
   file half the size an inverted index would have been.
   -------------------------------------------------------------------------- */
(function () {
  'use strict';
  var C = window.CELICA, $ = C.$, $$ = C.$$, el = C.el, esc = C.esc;
  var M = C.manual;
  if (!M) return;

  var pages = M.pages;
  var lower = null;              // built lazily on first search
  var figOnly = false;
  var current = null;

  $('#manLede').innerHTML =
    C.fmt(M.figures) + ' pages rendered as figures, out of ' + C.fmt(M.total) +
    '. Search covers every page — including the ones without a figure, which come ' +
    'back as a locator so you can find them in the original PDF. ' +
    '<b>The text layer is damaged and words are frequently mangled</b>; use it to ' +
    'find a page, then read the figure.';
  $('#ftrNote').textContent = M.source;

  /* ------------------------------------------------------------------ tree */

  function renderTree() {
    var host = $('#tree');
    host.innerHTML = '';
    M.tree.forEach(function (sec) {
      var d = el('details', { class: 'tsec' });
      var sm = el('summary', null, [
        el('span', { class: 'tcode', text: sec.code }),
        el('span', { class: 'tname', text: sec.name }),
        el('span', { class: 'tfig num', text: sec.f ? sec.f : '' })
      ]);
      d.appendChild(sm);
      var ul = el('ul', { class: 'tsub' });
      sec.subs.forEach(function (s) {
        var li = el('li');
        var a = el('a', {
          href: '#p=' + s.a,
          class: s.f ? '' : 'nofig',
          onclick: function (e) { e.preventDefault(); go(s.a); }
        }, [
          el('span', { text: s.t }),
          el('span', { class: 'num', text: s.f ? s.f + ' fig' : '—' })
        ]);
        li.appendChild(a);
        ul.appendChild(li);
      });
      d.appendChild(ul);
      host.appendChild(d);
    });
  }

  /* ------------------------------------------------------------ page view */

  function sectionOf(p) {
    for (var i = 0; i < M.tree.length; i++) {
      if (p >= M.tree[i].a && p <= M.tree[i].b) return M.tree[i];
    }
    return null;
  }

  function nearestWithFig(p, dir) {
    for (var i = p + dir; i >= 0 && i < pages.length; i += dir) {
      if (pages[i].f) return i;
    }
    return null;
  }

  function go(p, q) {
    p = Math.max(0, Math.min(pages.length - 1, p | 0));
    current = p;
    var pg = pages[p];
    var sec = sectionOf(p);
    var host = $('#body');
    host.innerHTML = '';

    var head = el('div', { class: 'pg-head' });
    head.innerHTML =
      '<div><p class="eyebrow" style="margin-bottom:6px">' +
      esc(sec ? sec.code + ' — ' + sec.name : 'Manual') + '</p>' +
      '<h2>' + esc(pg.h || (sec ? sec.name : 'Page ' + p)) + '</h2></div>' +
      '<div class="chips">' +
        (pg.c
          ? '<span class="chip src"><b>' + esc(pg.c) + '</b></span>'
          : pg.ci
            ? '<span class="chip" title="Not printed on this page. Inferred by counting ' +
              'forward from the nearest numbered page, so treat it as approximate.">≈ ' +
              esc(pg.ci) + '</span>'
            : '') +
        '<span class="chip">PDF p.' + p + '</span>' +
      '</div>';
    host.appendChild(head);

    var nav = el('div', { class: 'pg-nav' });
    var prev = nearestWithFig(p, -1), next = nearestWithFig(p, 1);
    nav.appendChild(el('button', {
      class: 'btn sm', text: '← Previous figure', disabled: prev == null ? 'disabled' : null,
      onclick: function () { if (prev != null) go(prev); }
    }));
    nav.appendChild(el('button', {
      class: 'btn sm', text: 'Next figure →', disabled: next == null ? 'disabled' : null,
      onclick: function () { if (next != null) go(next); }
    }));
    host.appendChild(nav);

    if (pg.f) {
      host.appendChild(C.figure(p, pg.h || ''));
    } else {
      var box = el('div', { class: 'card' });
      box.innerHTML =
        '<div class="note amber" style="margin:0"><div class="hd">No figure for this page</div>' +
        '<p>This page is outside the curated set, so it was not rendered. It is still ' +
        'searchable, and you can open it in the original PDF at <b>page ' + (p + 1) +
        '</b>' + (pg.c ? ' (manual reference <b>' + esc(pg.c) + '</b>)'
                        : pg.ci ? ' (roughly <b>' + esc(pg.ci) + '</b>)' : '') + '.</p></div>';
      host.appendChild(box);
    }

    if (pg.t) {
      var det = el('details', { class: 'ocr' });
      det.appendChild(el('summary', { text: 'Page text  ·  damaged character map, expect mangled words' }));
      var pre = el('pre');
      pre.textContent = pg.t;
      det.appendChild(pre);
      host.appendChild(det);
    }

    if (history.replaceState) history.replaceState(null, '', '#p=' + p);
    window.scrollTo({ top: 0, behavior: C.reduced ? 'auto' : 'smooth' });
  }

  /* --------------------------------------------------------------- search */

  function buildLower() {
    if (lower) return;
    lower = new Array(pages.length);
    for (var i = 0; i < pages.length; i++) {
      lower[i] = (pages[i].t + ' ' + pages[i].h + ' ' +
                  pages[i].c + ' ' + (pages[i].ci || '')).toLowerCase();
    }
  }

  function snippet(text, lo, term, at) {
    var start = Math.max(0, at - 80);
    var end = Math.min(text.length, at + term.length + 110);
    var s = (start > 0 ? '…' : '') + text.slice(start, end).replace(/\s+/g, ' ') +
            (end < text.length ? '…' : '');
    var rx = new RegExp('(' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
    return esc(s).replace(new RegExp('(' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'),
      '<mark>$1</mark>');
  }

  function search(term) {
    buildLower();
    var t = term.toLowerCase().trim();
    var hits = [];
    if (t.length < 2) return hits;
    for (var i = 0; i < lower.length; i++) {
      if (figOnly && !pages[i].f) continue;
      var at = lower[i].indexOf(t);
      if (at < 0) continue;
      var n = 0, k = at;
      while (k >= 0) { n++; k = lower[i].indexOf(t, k + t.length); }
      var score = n +
        (pages[i].f ? 3 : 0) +
        (pages[i].h && pages[i].h.toLowerCase().indexOf(t) >= 0 ? 12 : 0) +
        (pages[i].c && pages[i].c.toLowerCase().indexOf(t) >= 0 ? 8 : 0);
      hits.push({ p: i, at: at, n: n, score: score });
    }
    hits.sort(function (a, b) { return b.score - a.score || a.p - b.p; });
    return hits;
  }

  function renderResults(term) {
    var hits = search(term);
    var host = $('#body');
    $('#qcount').textContent = hits.length
      ? hits.length + (hits.length === 1 ? ' page' : ' pages')
      : 'nothing';
    host.innerHTML = '';

    if (!hits.length) {
      host.innerHTML =
        '<div class="empty">Nothing for “' + esc(term) + '”.<br><br>' +
        'Remember the text layer is corrupted — “thickness” is stored as “thk:kfless” on ' +
        'some pages. Try a shorter fragment, a number, or a section code like BE-25.</div>';
      return;
    }

    var head = el('div', { class: 'pg-head' });
    head.innerHTML = '<div><p class="eyebrow" style="margin-bottom:6px">Search</p>' +
      '<h2>' + hits.length + ' pages match “' + esc(term) + '”</h2></div>';
    host.appendChild(head);

    var list = el('div', { class: 'res' });
    hits.slice(0, 120).forEach(function (h) {
      var pg = pages[h.p];
      var sec = sectionOf(h.p);
      var a = el('a', {
        class: 'rescard card lit' + (pg.f ? '' : ' nofig'),
        href: '#p=' + h.p,
        onclick: function (e) { e.preventDefault(); go(h.p); }
      });
      a.innerHTML =
        '<div class="spread" style="align-items:flex-start;gap:10px">' +
          '<div style="min-width:0"><h3>' + esc(pg.h || (sec ? sec.name : 'Page ' + h.p)) + '</h3>' +
          '<p class="faint mono" style="margin:3px 0 0;font-size:11px">' +
          esc(sec ? sec.code + ' · ' : '') +
          esc(pg.c || (pg.ci ? '≈' + pg.ci : '')) + ' · p.' + h.p +
          (h.n > 1 ? ' · ' + h.n + ' hits' : '') + '</p></div>' +
          (pg.f ? '<span class="chip src">figure</span>'
                : '<span class="chip warn">text only</span>') +
        '</div>' +
        '<p class="snip">' + snippet(pg.t, null, term, h.at) + '</p>';
      list.appendChild(a);
    });
    host.appendChild(list);
    if (hits.length > 120) {
      host.appendChild(el('p', { class: 'empty',
        text: 'Showing the first 120 of ' + hits.length + '. Narrow the search.' }));
    }
    C.initGlow();
  }

  /* ------------------------------------------------------------------ wire */

  var q = $('#q');
  var timer = null;
  q.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(function () {
      var v = q.value.trim();
      if (!v) {
        $('#qcount').textContent = '—';
        if (history.replaceState) history.replaceState(null, '', '#');
        go(current == null ? 4 : current);
        return;
      }
      if (history.replaceState) history.replaceState(null, '', '#q=' + encodeURIComponent(v));
      renderResults(v);
    }, 130);
  });

  $('#figOnly').addEventListener('click', function () {
    figOnly = !figOnly;
    this.setAttribute('aria-pressed', figOnly ? 'true' : 'false');
    if (q.value.trim()) renderResults(q.value.trim());
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && document.activeElement !== q &&
        !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) {
      e.preventDefault(); q.focus(); q.select();
    }
    if (e.key === 'Escape' && document.activeElement === q) q.blur();
    if (current != null && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) {
      if (e.key === 'ArrowLeft') { var p = nearestWithFig(current, -1); if (p != null) go(p); }
      if (e.key === 'ArrowRight') { var n = nearestWithFig(current, 1); if (n != null) go(n); }
    }
  });

  function fromHash() {
    var h = location.hash.slice(1);
    var m = /^p=(\d+)$/.exec(h);
    if (m) { go(+m[1]); return; }
    m = /^q=(.*)$/.exec(h);
    if (m) { q.value = decodeURIComponent(m[1]); renderResults(q.value); return; }
    /* a reload can restore a value into the search box before we boot */
    if (q.value.trim()) { renderResults(q.value.trim()); return; }
    go(4);
  }

  renderTree();
  fromHash();
  window.addEventListener('hashchange', fromHash);
})();
