/* ==========================================================================
   The car as a turnable line drawing — reusable.

   Not a rendered model: a wireframe of feature edges only, precomputed in
   tools/model.py at a 22° dihedral threshold. That is deliberately the same
   thing the manual's illustrations are — creases and silhouettes, no shading.
   A solid mesh painted the colour of the page sits behind the lines writing
   depth, so far-side edges are hidden and it reads as a drawing rather than a
   wire cage.

   The mesh arrives base64'd inside model.js rather than as a file, because the
   site runs from file:// where fetch and XHR are blocked for local resources.
   three.js is vendored for the same reason.

   Pages ask for a viewer by pushing onto CELICA.model3dQueue before this file
   runs — it is deferred, so ordinary page scripts get there first:

       (CELICA.model3dQueue = CELICA.model3dQueue || []).push({
         sel: '#model3d',
         views: '#modelViews',      // optional preset-view button host
         hidden: '#modelHidden',    // optional toggles
         spin: '#modelSpin',
         stat: '#modelStat',
         hotspots: [{ id, x, y, z, label, tone }],
         onHotspot: function (id) { ... },
         ready: function (api) { ... }
       });

   Hotspot coordinates are in the model's own space after centring: X runs from
   about -33 at the tail to +33 at the nose, Y from 0 at the ground to ~20 at
   the roof, Z from -15 to +15 across the car.
   ========================================================================== */
(function () {
  'use strict';
  var C = (window.CELICA = window.CELICA || {});

  var VIEWS = [
    { k: 'Three-quarter', az: 0.80, el: 0.26 },
    { k: 'Side', az: 0, el: 0.02 },
    { k: 'Front', az: 1.5708, el: 0.06 },
    { k: 'Rear', az: -1.5708, el: 0.06 },
    { k: 'Top', az: 0.0001, el: 1.47 }
  ];

  function b64bytes(s) {
    var bin = atob(s), n = bin.length, out = new Uint8Array(n);
    for (var i = 0; i < n; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  /* decoded once and shared between every viewer on the page */
  var shared = null;
  function geometry() {
    if (shared) return shared;
    var M = C.model;
    var qpos = new Uint16Array(b64bytes(M.pos).buffer);
    var faces = new Uint16Array(b64bytes(M.idx).buffer);
    var edg = new Uint16Array(b64bytes(M.edg).buffer);

    var nv = qpos.length / 3;
    var pos = new Float32Array(qpos.length);
    for (var i = 0; i < nv; i++) {
      for (var a = 0; a < 3; a++) {
        pos[i * 3 + a] = M.min[a] + (qpos[i * 3 + a] / 65535) * M.span[a];
      }
    }

    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.rotateX(-Math.PI / 2);                  // STL is Z-up, three.js is Y-up
    g.computeBoundingBox();
    var bb0 = g.boundingBox;
    var c0 = new THREE.Vector3();
    bb0.getCenter(c0);
    g.translate(-c0.x, -bb0.min.y, -c0.z);    // sit it on the ground plane
    g.computeBoundingBox();

    shared = {
      posAttr: g.getAttribute('position'),
      faces: faces, edges: edg,
      bb: g.boundingBox.clone(),
      height: g.boundingBox.max.y - g.boundingBox.min.y
    };
    return shared;
  }

  function buildGeo(posAttr, index) {
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', posAttr);
    g.setIndex(new THREE.BufferAttribute(index, 1));
    return g;
  }

  function init(cfg) {
    var host = typeof cfg.sel === 'string' ? document.querySelector(cfg.sel) : cfg.sel;
    if (!host) return null;
    var wrap = host.closest('.model-wrap') || host.parentElement;
    function fail() { if (wrap) wrap.classList.add('fallback'); }

    if (!C.model || typeof THREE === 'undefined') { fail(); return null; }

    var raf = null, visible = true;
    var az = VIEWS[0].az, el = VIEWS[0].el, targetAz = az, targetEl = el;
    var spin = !C.reduced;
    var dragging = false, lastX = 0, lastY = 0, vAz = 0;

    try {
      var G = geometry();

      var occluder = new THREE.Mesh(
        buildGeo(G.posAttr, G.faces),
        new THREE.MeshBasicMaterial({
          color: 0x0e0d0f,
          polygonOffset: true, polygonOffsetFactor: 1.4, polygonOffsetUnits: 1.4
        })
      );
      var lines = new THREE.LineSegments(
        buildGeo(G.posAttr, G.edges),
        new THREE.LineBasicMaterial({
          color: 0xe6e1de, transparent: true, opacity: cfg.dim ? 0.6 : 0.92
        })
      );

      var scene = new THREE.Scene();
      scene.add(occluder);
      scene.add(lines);

      var camera = new THREE.PerspectiveCamera(30, 16 / 9, 0.1, 1000);
      var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0x000000, 0);
      host.appendChild(renderer.domElement);

      var dom = renderer.domElement;
      dom.setAttribute('aria-label', 'Wireframe model of the car. Drag to rotate.');
      dom.style.touchAction = 'pan-y';        // the page must still scroll

      /* --------------------------------------------------------- hotspots */
      /* Callouts in the manual's own idiom: a dot on the part, a grey leader
         that kinks once, and the label held clear of the bodywork. The label
         is pushed away from the centre of the frame so it never sits on top of
         the car, and the leader is redrawn each frame as the model turns. */
      var pins = [], lineSvg = null, SVGNS = 'http://www.w3.org/2000/svg';
      if (cfg.hotspots && cfg.hotspots.length) {
        var layer = document.createElement('div');
        layer.className = 'pins';
        lineSvg = document.createElementNS(SVGNS, 'svg');
        lineSvg.setAttribute('class', 'pin-lines');
        layer.appendChild(lineSvg);
        host.appendChild(layer);

        cfg.hotspots.forEach(function (h) {
          var tone = h.tone ? ' ' + h.tone : '';

          var path = document.createElementNS(SVGNS, 'path');
          path.setAttribute('class', 'pin-leader');
          lineSvg.appendChild(path);

          var dot = document.createElement('i');
          dot.className = 'pin-dot' + tone;
          layer.appendChild(dot);

          var lab = document.createElement('button');
          lab.className = 'pin-label' + tone;
          lab.type = 'button';
          lab.textContent = h.label || '';
          lab.setAttribute('aria-label', h.label || h.id);
          layer.appendChild(lab);

          function enter() { if (cfg.onHover) cfg.onHover(h.id, true); }
          function leave() { if (cfg.onHover) cfg.onHover(h.id, false); }
          [dot, lab].forEach(function (n) {
            n.addEventListener('pointerenter', enter);
            n.addEventListener('pointerleave', leave);
          });
          lab.addEventListener('click', function (e) {
            e.preventDefault();
            if (cfg.onHotspot) cfg.onHotspot(h.id);
          });

          pins.push({
            h: h, dot: dot, label: lab, path: path,
            v: new THREE.Vector3(h.x, h.y, h.z)
          });
        });
      }

      /* ------------------------------------------------------ interaction */
      dom.addEventListener('pointerdown', function (e) {
        dragging = true; setSpin(false); vAz = 0;
        lastX = e.clientX; lastY = e.clientY;
        if (dom.setPointerCapture) dom.setPointerCapture(e.pointerId);
        host.classList.add('grabbing');
      });
      dom.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        var dx = e.clientX - lastX, dy = e.clientY - lastY;
        lastX = e.clientX; lastY = e.clientY;
        /* Drag moves the car, not the camera: pull right and the car turns to
           the right, which means the camera goes the other way. */
        targetAz -= dx * 0.008;
        vAz = -dx * 0.008;
        targetEl = Math.max(-0.15, Math.min(1.5, targetEl - dy * 0.005));
      });
      function endDrag() {
        if (!dragging) return;
        dragging = false;
        host.classList.remove('grabbing');
      }
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
        dom.addEventListener(ev, endDrag);
      });

      /* --------------------------------------------------------- controls */
      function setView(v) {
        var d = v.az - (targetAz % (Math.PI * 2));
        while (d > Math.PI) d -= Math.PI * 2;         // shortest way round
        while (d < -Math.PI) d += Math.PI * 2;
        targetAz += d;
        targetEl = v.el;
        vAz = 0;
        setSpin(false);
        dirty = true;
      }

      var viewHost = cfg.views && document.querySelector(cfg.views);
      if (viewHost) {
        VIEWS.forEach(function (v, i) {
          var b = document.createElement('button');
          b.className = 'btn ghost sm';
          b.type = 'button';
          b.textContent = v.k;
          if (i === 0) b.setAttribute('aria-pressed', 'true');
          b.addEventListener('click', function () {
            setView(v);
            Array.prototype.forEach.call(viewHost.children, function (o) {
              o.setAttribute('aria-pressed', o === b ? 'true' : 'false');
            });
          });
          viewHost.appendChild(b);
        });
      }

      var hiddenBtn = cfg.hidden && document.querySelector(cfg.hidden);
      if (hiddenBtn) {
        hiddenBtn.addEventListener('click', function () {
          occluder.visible = !occluder.visible;
          hiddenBtn.setAttribute('aria-pressed', occluder.visible ? 'true' : 'false');
          dirty = true;
        });
      }

      var spinBtn = cfg.spin && document.querySelector(cfg.spin);
      function setSpin(on) {
        spin = on && !C.reduced;
        if (spinBtn) spinBtn.setAttribute('aria-pressed', spin ? 'true' : 'false');
      }
      if (spinBtn) spinBtn.addEventListener('click', function () { setSpin(!spin); });
      setSpin(cfg.spin !== false && !C.reduced);

      var statNode = cfg.stat && document.querySelector(cfg.stat);
      if (statNode) {
        statNode.textContent = C.fmt(C.model.edges) + ' edges · ' +
                               C.fmt(C.model.tris) + ' faces';
      }

      /* ---------------------------------------------------------- fitting */
      /* Pulled in a little: the extreme corners of a car's bounding box are
         empty air, so fitting them exactly leaves it looking small. */
      var K = 0.9, bb = G.bb;
      var corners = [];
      for (var cx = 0; cx < 2; cx++) {
        for (var cy = 0; cy < 2; cy++) {
          for (var cz = 0; cz < 2; cz++) {
            corners.push(new THREE.Vector3(
              (cx ? bb.max.x : bb.min.x) * K,
              cy ? bb.max.y * K : 0,
              (cz ? bb.max.z : bb.min.z) * K
            ));
          }
        }
      }
      var target = new THREE.Vector3(0, G.height * 0.45, 0);
      var dir = new THREE.Vector3(), right = new THREE.Vector3(),
          up = new THREE.Vector3(), rel = new THREE.Vector3();
      var WORLD_UP = new THREE.Vector3(0, 1, 0);

      /* One distance, fixed. Re-fitting every frame makes the car breathe in
         and out as it turns, because a long low shape needs far less room
         head-on than broadside. So sweep the whole range of angles once and
         take the worst case: nothing ever crops, and nothing ever zooms. */
      var fixedDist = 0;
      function computeFixedDistance() {
        var ty = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
        var tx = ty * camera.aspect;
        var worst = 0;
        for (var ai = 0; ai < 36; ai++) {
          var a = ai / 36 * Math.PI * 2;
          for (var ei = 0; ei <= 8; ei++) {
            var e = -0.15 + (1.5 + 0.15) * (ei / 8);
            dir.set(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e))
               .normalize();
            right.crossVectors(WORLD_UP, dir);
            if (right.lengthSq() < 1e-8) right.set(1, 0, 0);
            right.normalize();
            up.crossVectors(dir, right).normalize();
            for (var i = 0; i < corners.length; i++) {
              rel.copy(corners[i]).sub(target);
              var depth = rel.dot(dir);
              worst = Math.max(worst,
                Math.abs(rel.dot(right)) / tx + depth,
                Math.abs(rel.dot(up)) / ty + depth);
            }
          }
        }
        fixedDist = worst * 1.02;
      }

      var dirty = true;
      function size() {
        var w = host.clientWidth, h = host.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        computeFixedDistance();
        if (lineSvg) {
          lineSvg.setAttribute('width', w);
          lineSvg.setAttribute('height', h);
          lineSvg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
        }
        dirty = true;
      }

      /* ------------------------------------------------------------- loop */
      var proj = new THREE.Vector3(), toPin = new THREE.Vector3();
      function frame() {
        raf = requestAnimationFrame(frame);
        if (!visible) return;

        if (spin && !dragging) targetAz += 0.0024;
        if (!dragging && Math.abs(vAz) > 0.0001) {           // inertia
          targetAz += vAz;
          vAz *= 0.94;
        }

        /* Nothing moving means nothing to draw. Without this the loop repaints
           a static image forever, which flattens a phone battery and stops the
           page ever going idle. */
        var moving = spin || dragging || Math.abs(vAz) > 0.0001 ||
          Math.abs(targetAz - az) > 1e-4 || Math.abs(targetEl - el) > 1e-4;
        if (!moving && !dirty) return;
        dirty = false;

        az += (targetAz - az) * 0.1;
        el += (targetEl - el) * 0.1;

        dir.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el))
           .normalize();
        camera.position.copy(dir).multiplyScalar(fixedDist).add(target);
        camera.lookAt(target);
        renderer.render(scene, camera);

        if (pins.length) {
          var w = host.clientWidth, h = host.clientHeight;
          for (var i = 0; i < pins.length; i++) {
            var p = pins[i];
            proj.copy(p.v).project(camera);
            var ax = (proj.x * 0.5 + 0.5) * w;
            var ay = (-proj.y * 0.5 + 0.5) * h;

            /* kink away from the middle of the frame, so labels sit off the car */
            var vx = ax < w / 2 ? -1 : 1;
            var vy = ay < h / 2 ? -1 : 1;
            var kx = ax + vx * 20, ky = ay + vy * 20;
            var ex = kx + vx * 30;

            p.path.setAttribute('d',
              'M' + ax.toFixed(1) + ',' + ay.toFixed(1) +
              'L' + kx.toFixed(1) + ',' + ky.toFixed(1) +
              'L' + ex.toFixed(1) + ',' + ky.toFixed(1));

            p.dot.style.transform = 'translate(-50%,-50%) translate(' +
              ax.toFixed(1) + 'px,' + ay.toFixed(1) + 'px)';
            p.label.style.transform =
              'translate(' + (vx > 0 ? '4px' : '-100%') + ',-50%) translate(' +
              ex.toFixed(1) + 'px,' + ky.toFixed(1) + 'px)';
            if (vx < 0) p.label.style.marginLeft = '-4px';
            else p.label.style.marginLeft = '';

            /* dim the whole callout when its point is behind the bodywork */
            var behind = toPin.copy(p.v).sub(camera.position).normalize().dot(dir) < 0;
            p.dot.classList.toggle('far', behind);
            p.label.classList.toggle('far', behind);
            p.path.classList.toggle('far', behind);
          }
        }
      }

      size();
      window.addEventListener('resize', size);
      if ('ResizeObserver' in window) new ResizeObserver(size).observe(host);
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) {
          visible = es[0].isIntersecting;        // stop drawing when off-screen
        }, { threshold: 0.01 }).observe(host);
      }

      if (wrap) wrap.classList.add('live');
      frame();

      return {
        setView: setView,
        focus: function (id) {
          var p = pins.filter(function (x) { return x.h.id === id; })[0];
          if (!p) return;
          var a = Math.atan2(p.v.x, p.v.z);        // swing the marker to face us
          var d = a - (targetAz % (Math.PI * 2));
          while (d > Math.PI) d -= Math.PI * 2;
          while (d < -Math.PI) d += Math.PI * 2;
          targetAz += d;
          targetEl = 0.34;
          setSpin(false);
          dirty = true;
        },
        highlight: function (id) {
          pins.forEach(function (p) {
            var on = p.h.id === id;
            p.dot.classList.toggle('on', on);
            p.label.classList.toggle('on', on);
            p.path.classList.toggle('on', on);
          });
        },
        redraw: function () { dirty = true; }
      };
    } catch (err) {
      if (window.console) console.warn('model unavailable:', err);
      if (raf) cancelAnimationFrame(raf);
      fail();
      return null;
    }
  }

  C.model3d = init;
  (C.model3dQueue || []).forEach(function (cfg) {
    var api = init(cfg);
    if (cfg.ready) cfg.ready(api);
  });
})();
