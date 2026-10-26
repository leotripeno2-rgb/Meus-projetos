/* Maquete 3D interativa da página do imóvel (substitui o antigo controle de luz).
   - arrastar gira a maquete (mouse ou dedo); "Girar sozinha" liga/desliga a volta lenta
   - o controle de hora move o sol de verdade: a sombra anda, o céu muda e à noite as janelas acendem
   - "Abrir o andar" levanta o pavimento de cima (casa) ou os andares acima da unidade (apartamento)
   A forma muda com o tipo do imóvel: casa (dois pavimentos, telhado em duas águas quando o texto fala nisso) ou torre de apartamentos.
   three.js (vendor/three.min.js) só é baixado quando a seção se aproxima. */
(function () {
  'use strict';
  var sec = document.getElementById('maquete3d');
  if (!sec) return;
  var root = document.documentElement;
  var stage = sec.querySelector('.m3-stage'), clock = sec.querySelector('#m3-clock'), capEl = sec.querySelector('#m3-cap');
  var range = sec.querySelector('#m3-range'), btnOpen = sec.querySelector('#m3-open'), btnSpin = sec.querySelector('#m3-spin');
  var tagsBox = sec.querySelector('.m3-tags');
  var slug = new URLSearchParams(location.search).get('p');
  var D = window.IMOVEIS || [], P = D.filter(function (x) { return x.slug === slug; })[0] || D[0];
  if (!P) return;
  var isApt = P.cat === 'Apartamento';
  var txt = (P.resumo + ' ' + P.texto + ' ' + (P.materiais || []).join(' ')).toLowerCase();
  var pitched = /duas águas|telhado/.test(txt);
  var stone = /pedra|arenito/.test(txt), woodSlats = /ripado|madeira|brise/.test(txt);

  if (root.classList.contains('weak') || !window.WebGLRenderingContext) { sec.classList.add('m3-off'); return; }

  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var smooth = function (a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var tom = function (h) { return h < 8 ? 'Primeira luz' : h < 11 ? 'Luz suave' : h < 15 ? 'Sol pleno' : h < 17 ? 'Luz quente' : h < 19 ? 'Luz dourada' : h < 20.2 ? 'Hora azul' : 'Casa acesa'; };

  var started = false;
  var load = function () {
    if (started) return; started = true;
    if (window.THREE) return init();
    var s = document.createElement('script'); s.src = 'vendor/three.min.js'; s.onload = init;
    s.onerror = function () { sec.classList.add('m3-off'); };
    document.head.appendChild(s);
  };
  if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { if (e[0].isIntersecting) load(); }, { rootMargin: '800px 0px' }).observe(sec);
  else load();

  function init() {
    var T = window.THREE, small = innerWidth < 760;
    var renderer;
    try { renderer = new T.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { sec.classList.add('m3-off'); return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, small ? 1.5 : 1.75));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    stage.appendChild(renderer.domElement);

    var scene = new T.Scene(); scene.fog = new T.Fog(0xe5e1d8, 70, 140);
    var cam = new T.PerspectiveCamera(30, 1, .5, 400);
    var M = function (c, r) { return new T.MeshStandardMaterial({ color: c, roughness: r === undefined ? .9 : r, metalness: 0 }); };
    var mat = {
      white: M(0xf3f0ea), white2: M(0xe9e5dd), base: M(0xd9d3c7), paving: M(0xe8e3d9), grass: M(0xbfc3a6),
      wood: M(0xa47a55, .75), woodDark: M(0x6f5038, .8), stone: M(0xc8b79c), frame: M(0x2b2a27, .6), dark: M(0x3a3936, .7),
      crown: M(0xeeeae2, .95), trunk: M(0x9d968a), fabric: M(0xb9b1a2), brass: M(0xb8975f, .5),
      water: new T.MeshStandardMaterial({ color: 0x86b3bf, roughness: .08, transparent: true, opacity: .88 }),
      glass: new T.MeshPhysicalMaterial({ color: 0xcfe0e4, roughness: .05, transparent: true, opacity: .3, side: T.DoubleSide, depthWrite: false }),
      edge: new T.LineBasicMaterial({ color: 0x8f8a80, transparent: true, opacity: .3 })
    };
    var glows = [];
    var world = new T.Group(); scene.add(world);
    var lifted = new T.Group(); world.add(lifted);

    function box(w, h, d, x, y, z, m, parent, opt) {
      var g = new T.BoxGeometry(w, h, d), mesh = new T.Mesh(g, m);
      mesh.position.set(x, y + h / 2, z); mesh.castShadow = !(opt && opt.noCast); mesh.receiveShadow = true;
      (parent || world).add(mesh);
      if (opt && opt.edges) { var e = new T.LineSegments(new T.EdgesGeometry(g), mat.edge); e.position.copy(mesh.position); (parent || world).add(e); }
      return mesh;
    }
    function glass(w, h, x, y, z, rotY, parent, n) {
      var g = new T.Mesh(new T.PlaneGeometry(w, h), mat.glass);
      g.position.set(x, y + h / 2, z); g.rotation.y = rotY || 0; (parent || world).add(g);
      n = n || Math.max(1, Math.round(w / 2.2));
      for (var i = 0; i <= n; i++) {
        var t = -w / 2 + (w / n) * i;
        box(.08, h, .08, x + Math.cos(rotY || 0) * t, y, z - Math.sin(rotY || 0) * t, mat.frame, parent, { noCast: true });
      }
    }
    function glow(w, h, x, y, z, rotY, parent) {
      var m = new T.MeshStandardMaterial({ color: 0xfff1d6, emissive: 0xffb760, emissiveIntensity: 0, roughness: 1 });
      var p = new T.Mesh(new T.PlaneGeometry(w, h), m); p.position.set(x, y + h / 2, z); p.rotation.y = rotY || 0;
      (parent || world).add(p); glows.push(p);
    }
    function tree(x, z, s) {
      var g = new T.Group();
      var tr = new T.Mesh(new T.CylinderGeometry(.08 * s, .12 * s, 2.4 * s, 6), mat.trunk); tr.position.y = 1.2 * s; tr.castShadow = true; g.add(tr);
      var cr = new T.Mesh(new T.IcosahedronGeometry(1.25 * s, 1), mat.crown); cr.position.y = 3 * s; cr.castShadow = true; cr.receiveShadow = true; g.add(cr);
      var c2 = new T.Mesh(new T.IcosahedronGeometry(.85 * s, 1), mat.crown); c2.position.set(.6 * s, 2.4 * s, .3 * s); c2.castShadow = true; g.add(c2);
      g.position.set(x, .45, z); world.add(g);
    }
    var TAGS = [], focusY = 3.5, radius = 40, liftH = 6;

    if (!isApt) {
      /* ===== casa ===== */
      box(30, .45, 21, 0, 0, 0, mat.base, world, { edges: true });
      box(29.4, .02, 7.6, 0, .45, 6.2, mat.grass, world, { noCast: true });
      box(15, .03, 2.2, 0, .45, 3.2, mat.paving, world, { noCast: true });
      box(3.2, .03, 8, 9.6, .45, -4.5, mat.paving, world, { noCast: true });
      if (stone) { box(.9, 2.6, 14, -13.2, .45, -1.5, mat.stone, world, { edges: true }); box(6, 2.6, .9, -10.6, .45, -8.1, mat.stone, world, { edges: true }); }
      var Y0 = .45, H0 = 3.2, Yf = Y0 + .3;
      box(15, .3, 9, 0, Y0, -2.5, mat.white2, world, { edges: true });
      box(15, H0, .3, 0, Yf, -6.85, mat.white, world, { edges: true });
      box(.3, H0, 9, -7.35, Yf, -2.5, mat.white, world, { edges: true });
      box(.3, H0, 9, 7.35, Yf, -2.5, mat.white, world, { edges: true });
      box(3, H0, .3, -5.7, Yf, 1.85, stone ? mat.stone : mat.white, world, { edges: true });
      glass(11.4, H0, 1.5, Yf, 1.9, 0, world, 6);
      glow(14.4, H0 - .2, 0, Yf, -6.65, 0, world);
      box(4.2, .55, 1.1, 2.6, Yf, -4.6, mat.fabric); box(1.1, .55, 2.4, 5.1, Yf, -3.5, mat.fabric);
      box(3, .75, 1.1, -2.2, Yf, -2.4, mat.wood);
      box(4.6, .9, .7, -4.2, Yf, -6.2, mat.white2); box(2.6, .9, 1, -4.6, Yf, -4.4, mat.white2);
      var Y1 = Yf + H0, H1 = 3, Yu = Y1 + .35;
      box(12, .35, 8.4, 2.4, Y1, -3, mat.white2, lifted, { edges: true });
      box(12, H1, .3, 2.4, Yu, -7.05, mat.white, lifted, { edges: true });
      box(.3, H1, 8.4, -3.45, Yu, -3, mat.white, lifted, { edges: true });
      box(.3, H1, 8.4, 8.25, Yu, -3, mat.white, lifted, { edges: true });
      glass(5.4, H1, -.5, Yu, 1.15, 0, lifted, 3);
      if (woodSlats) for (var r = 0; r < 26; r++) box(.12, H1, .16, 2.55 + r * .22, Yu, 1.15, mat.wood, lifted);
      else glass(5.6, H1, 5.3, Yu, 1.15, 0, lifted, 3);
      glow(11.4, H1 - .2, 2.4, Yu, -6.85, 0, lifted);
      box(.15, H1 - .3, 4.6, 1.2, Yu, -4.7, mat.white2, lifted); box(.15, H1 - .3, 4.6, 5, Yu, -4.7, mat.white2, lifted);
      var nb = Math.min(4, Math.max(2, P.suites || 3));
      for (var b = 0; b < nb; b++) box(2, .45, 2.1, -1.4 + b * (9 / nb) + .4, Yu, -5.4, mat.fabric, lifted);
      if (pitched) {
        /* telhado em duas águas, com beiral de madeira */
        var shape = new T.Shape(); shape.moveTo(-6.9, 0); shape.lineTo(0, 2.6); shape.lineTo(6.9, 0); shape.lineTo(-6.9, 0);
        var rg = new T.ExtrudeGeometry(shape, { depth: 9.6, bevelEnabled: false });
        var rf = new T.Mesh(rg, mat.woodDark); rf.position.set(2.4, Yu + H1, -7.8); rf.castShadow = true; rf.receiveShadow = true; lifted.add(rf);
      } else {
        box(12.8, .35, 9.2, 2.4, Yu + H1, -3, mat.white, lifted, { edges: true });
      }
      if (/piscina|pátio|jardim/.test(txt)) { box(10.6, .18, 3.8, -2.2, .45, 7.2, mat.paving, world, { edges: true }); var water = box(9.8, .05, 3, -2.2, .6, 7.2, mat.water, world, { noCast: true }); }
      tree(-9.5, 6.5, 1.1); tree(10.5, 6, 1.25); tree(12, -2.5, .95); tree(-10, -4, 1); tree(7.5, 9.2, .8);
      TAGS = [{ t: 'Sala', p: [3, 1.6, -3.4] }, { t: 'Cozinha', p: [-4.4, 1.6, -5.2] }, { t: (P.suites || 3) + ' suítes', p: [3, 8.6, -5], up: true }, { t: P.area, p: [-7.4, 4.8, 1.8] }];
      focusY = 3.6; radius = 46; liftH = 6.5;
    } else {
      /* ===== torre de apartamentos ===== */
      var floors = 9, FH = 3, unit = 5, Wt = 11, Dt = 9;
      box(26, .45, 22, 0, 0, 0, mat.base, world, { edges: true });
      box(25.4, .02, 6, 0, .45, 7.5, mat.grass, world, { noCast: true });
      box(Wt + 1, 1.2, Dt + 1, 0, .45, 0, stone ? mat.stone : mat.white2, world, { edges: true }); /* base em pedra */
      for (var f = 0; f < floors; f++) {
        var y = 1.65 + f * FH, grp = f > unit ? lifted : world, isU = f === unit;
        box(Wt, .3, Dt, 0, y, 0, isU ? mat.white2 : mat.white, grp, { edges: true });
        box(Wt, FH - .3, .3, 0, y + .3, -Dt / 2 + .15, mat.white, grp);
        box(.3, FH - .3, Dt, -Wt / 2 + .15, y + .3, 0, mat.white, grp);
        box(.3, FH - .3, Dt, Wt / 2 - .15, y + .3, 0, mat.white, grp);
        glass(Wt - .6, FH - .3, 0, y + .3, Dt / 2 - .2, 0, grp, 5);
        glow(Wt - .8, FH - .6, 0, y + .3, -Dt / 2 + .35, 0, grp);
        /* varanda com guarda-corpo de vidro */
        box(Wt * .7, .2, 1.6, -Wt * .15, y, Dt / 2 + .8, isU ? mat.brass : mat.white2, grp, { edges: true });
        var gp = new T.Mesh(new T.PlaneGeometry(Wt * .7, 1), mat.glass); gp.position.set(-Wt * .15, y + .7, Dt / 2 + 1.6); grp.add(gp);
        if (woodSlats) for (var k = 0; k < 5; k++) box(.18, FH - .3, .5, Wt / 2 - .2 - k * .5, y + .3, Dt / 2 + .1, mat.dark, grp);
        if (isU) { box(.12, FH - .6, Dt - 1.2, -1, y + .3, -.3, mat.white2, grp); box(3, .5, 2, -3, y + .3, -2.4, mat.fabric, grp); box(3.6, .5, 1, 2.6, y + .3, -3.2, mat.fabric, grp); }
      }
      box(Wt + .6, .4, Dt + .6, 0, 1.65 + floors * FH, 0, mat.white, lifted, { edges: true });
      tree(-10, 7, 1.1); tree(9.5, 7.5, 1.2); tree(10.5, -6, .9); tree(-10.5, -6, 1);
      TAGS = [{ t: 'Seu andar', p: [-Wt * .15, 1.65 + unit * FH + 2.2, Dt / 2 + 1.6], brass: true }, { t: P.area + ' · ' + (P.suites || 3) + ' suítes', p: [0, 1.65 + unit * FH + 1.6, 0], open: true }, { t: 'Varanda', p: [-Wt * .15, 1.65 + 2 * FH + 1.2, Dt / 2 + 1.6] }];
      focusY = 1.65 + unit * FH - 2; radius = 66; liftH = 7;
    }

    /* luzes */
    var hemi = new T.HemisphereLight(0xfffaf0, 0xcfc6b6, .75); scene.add(hemi);
    var sun = new T.DirectionalLight(0xffffff, 2.2); sun.castShadow = true;
    sun.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
    var sc = sun.shadow.camera; sc.left = -26; sc.right = 26; sc.top = 30; sc.bottom = -26; sc.near = 1; sc.far = 120;
    sun.shadow.bias = -.0004; sun.shadow.normalBias = .02; scene.add(sun); scene.add(sun.target);
    var inner = new T.PointLight(0xffb36b, 0, 26); inner.position.set(0, focusY, -1); scene.add(inner);

    TAGS.forEach(function (g) { var el = document.createElement('span'); el.className = 'm3-tag' + (g.brass ? ' b' : ''); el.textContent = g.t; tagsBox.appendChild(el); g.el = el; g.v = new T.Vector3(); });

    var SKY = [[6, [214, 196, 186]], [8, [229, 225, 216]], [15, [232, 228, 218]], [17.5, [222, 200, 172]], [19, [150, 120, 130]], [20, [58, 60, 78]], [21, [30, 32, 42]]];
    var SUNC = [[6, [255, 170, 110]], [9, [255, 244, 228]], [15, [255, 246, 232]], [17.5, [255, 196, 130]], [19, [255, 130, 80]], [20, [120, 140, 190]], [21, [90, 110, 160]]];
    function grad(st, x) {
      for (var i = 1; i < st.length; i++) if (x <= st[i][0]) { var a = st[i - 1], b = st[i], t = (x - a[0]) / (b[0] - a[0]); return [lerp(a[1][0], b[1][0], t), lerp(a[1][1], b[1][1], t), lerp(a[1][2], b[1][2], t)]; }
      return st[st.length - 1][1];
    }

    var W = 0, H = 0;
    function size() {
      W = stage.clientWidth; H = stage.clientHeight; renderer.setSize(W, H, false);
      cam.aspect = W / H; cam.fov = cam.aspect < 1 ? 30 + (1 - cam.aspect) * 38 : 30; cam.updateProjectionMatrix();
    }
    size(); addEventListener('resize', size);

    /* interação: arrastar gira (mouse e dedo, sem travar a rolagem vertical) */
    var yaw = -.6, yawT = -.6, tilt = .38, tiltT = .38, spin = true, open = 0, openT = 0, hour = +range.value, hourS = hour, drag = null, idle = 0;
    stage.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, y: e.clientY, a: yawT, b: tiltT }; spin = false; btnSpin.setAttribute('aria-pressed', 'false'); stage.classList.add('drag'); });
    addEventListener('pointermove', function (e) {
      if (!drag) return;
      yawT = drag.a + (e.clientX - drag.x) * .008;
      if (e.pointerType === 'mouse') tiltT = clamp(drag.b + (e.clientY - drag.y) * .004, .12, .9);
    });
    var end = function () { drag = null; stage.classList.remove('drag'); idle = 0; };
    addEventListener('pointerup', end); addEventListener('pointercancel', end);
    range.addEventListener('input', function () { hour = +range.value; });
    btnOpen.addEventListener('click', function () { openT = openT ? 0 : 1; btnOpen.setAttribute('aria-pressed', String(!!openT)); btnOpen.querySelector('span').textContent = openT ? (isApt ? 'Fechar a torre' : 'Fechar o telhado') : (isApt ? 'Abrir a torre' : 'Abrir o andar de cima'); });
    btnSpin.addEventListener('click', function () { spin = !spin; btnSpin.setAttribute('aria-pressed', String(spin)); });

    var visible = false, col = new T.Color(), lastMin = -1;
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible) loop(); }, { rootMargin: '100px 0px' }).observe(sec);

    function loop() {
      if (!visible) return;
      requestAnimationFrame(loop);
      if (spin) yawT += .0016;
      yaw += (yawT - yaw) * .08; tilt += (tiltT - tilt) * .08; open += (openT - open) * .07; hourS += (hour - hourS) * .12;
      var portrait = cam.aspect < 1 ? 1 + (1 - cam.aspect) * .5 : 1, rad = radius * portrait;
      cam.position.set(Math.sin(yaw) * Math.cos(tilt) * rad, focusY + Math.sin(tilt) * rad, Math.cos(yaw) * Math.cos(tilt) * rad);
      cam.lookAt(0, focusY + open * 2.2 - (isApt ? 1 : 1.5), -1);
      lifted.position.y = smooth(0, 1, open) * liftH;

      /* sol: nasce a leste (esquerda) às 6h, alto ao meio-dia, se põe a oeste às 18h30 */
      var h = hourS, d = clamp((h - 6) / 12.5, 0, 1);
      var sa = lerp(-1.3, 1.3, d), elev = Math.max(2, Math.sin(d * Math.PI) * 34 + 3);
      sun.position.set(Math.sin(sa) * 40, elev, Math.cos(sa) * 16 + 14);
      var night = smooth(18.8, 20.2, h);
      var c = grad(SUNC, h); col.setRGB(c[0] / 255, c[1] / 255, c[2] / 255); sun.color.copy(col);
      sun.intensity = lerp(2.4, .3, night) * (h < 7 ? .7 : 1);
      hemi.intensity = lerp(.8, .2, night); renderer.toneMappingExposure = lerp(1.05, .9, night);
      var gl = Math.max(smooth(18, 19.6, h), 1 - smooth(6, 7.2, h) * 1);
      glows.forEach(function (m) { m.material.emissiveIntensity = gl * 2.2; });
      inner.intensity = gl * 1.5;
      var sky = grad(SKY, h);
      sec.style.setProperty('--m3-bg', 'rgb(' + (sky[0] | 0) + ',' + (sky[1] | 0) + ',' + (sky[2] | 0) + ')');
      scene.fog.color.setRGB(sky[0] / 255, sky[1] / 255, sky[2] / 255);
      sec.classList.toggle('m3-night', night > .45);
      var mins = Math.round(hour * 60);
      if (mins !== lastMin) { lastMin = mins; clock.textContent = ('0' + Math.floor(mins / 60)).slice(-2) + ':' + ('0' + mins % 60).slice(-2); capEl.textContent = tom(hour); }

      renderer.render(scene, cam);
      TAGS.forEach(function (g) {
        g.v.set(g.p[0], g.p[1] + (g.up ? lifted.position.y : 0), g.p[2]).project(cam);
        var x = (g.v.x * .5 + .5) * W, y = (-g.v.y * .5 + .5) * H;
        g.el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) translate(-50%,-140%)';
        g.el.classList.toggle('on', g.v.z < 1 && (!g.open || open > .6));
      });
    }
    sec.classList.add('m3-ready');
    loop();
  }
})();
