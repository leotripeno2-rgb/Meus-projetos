/* Persianas: a rolagem troca as fotos em tela cheia abrindo "máscaras" (faixas horizontais, grade aleatória,
   faixas verticais ou colunas). Adaptado de "SVG Mask Transitions on Scroll" (Hiroki Watanabe / Codrops, licença MIT),
   reescrito sem GSAP para ficar leve.
   Uso: <section class="bl" data-blinds data-imgs="foto1,foto2,foto3" data-fx="h,grid,v"> … <div class="bl-t"> por foto … </section>
   fx de cada troca: h (faixas horizontais), v (faixas verticais), grid (grade aleatória), col (colunas, da esquerda para a direita). */
(function () {
  var root = document.documentElement, weak = root.classList.contains('weak');
  var NS = 'http://www.w3.org/2000/svg';
  var small = matchMedia('(max-width:900px)').matches || !!(navigator.connection || {}).saveData;
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var ease = function (t) { return 1 - Math.pow(1 - t, 3); };
  var src = function (n) { return 'assets/foto/' + n + (small ? '-s' : '') + '.webp'; };
  var shuffle = function (a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
  var uid = 0;

  function init(sec) {
    if (sec.dataset.done) return; sec.dataset.done = 1;
    var imgs = sec.dataset.imgs.split(','), fx = (sec.dataset.fx || 'h,grid,v').split(','), N = imgs.length;
    var stage = sec.querySelector('.bl-stage'), txts = [].slice.call(sec.querySelectorAll('.bl-t')), num = sec.querySelector('.bl-n b');
    var bar = sec.querySelector('.bl-bar');
    bar.innerHTML = imgs.map(function () { return '<i><b></b></i>'; }).join('');
    var fills = [].slice.call(bar.querySelectorAll('b'));

    /* celular fraco: só as fotos, uma abaixo da outra, com os textos */
    if (weak) {
      stage.innerHTML = imgs.map(function (n) { return '<img src="' + src(n) + '" alt="" loading="lazy" decoding="async">'; }).join('');
      txts.forEach(function (t) { t.classList.add('on'); });
      return;
    }

    var layers = [], W, H, VW, VH, cur = -1, tp = 0, cp = 0, busy = false, started = false;
    imgs.forEach(function (n, i) {
      var id = 'blm' + (++uid);
      var svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('class', 'bl-l'); svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('aria-hidden', 'true');
      svg.innerHTML = (i ? '<defs><mask id="' + id + '" maskUnits="userSpaceOnUse"><rect class="bl-bg" x="0" y="0" fill="black"/><g class="bl-g"></g></mask></defs>' : '') +
        '<image x="0" y="0" preserveAspectRatio="xMidYMid slice"' + (i ? ' mask="url(#' + id + ')"' : '') + '/>';
      stage.appendChild(svg);
      layers.push({ svg: svg, img: svg.querySelector('image'), g: svg.querySelector('.bl-g'), bg: svg.querySelector('.bl-bg'), name: n, fx: fx[(i - 1) % fx.length], parts: [], last: -1 });
    });

    var build = function () {
      W = innerWidth; H = innerHeight; VW = 100; VH = H / W * 100;
      var cols = W <= 599 ? 6 : W <= 1024 ? 10 : 14, rows = Math.max(1, Math.round(cols * VH / VW));
      layers.forEach(function (L, i) {
        L.svg.setAttribute('viewBox', '0 0 ' + VW + ' ' + VH);
        L.img.setAttribute('width', VW); L.img.setAttribute('height', VH);
        L.last = -1;
        if (!i) return;
        L.bg.setAttribute('width', VW); L.bg.setAttribute('height', VH);
        L.g.innerHTML = ''; L.parts = [];
        var r, k;
        if (L.fx === 'h' || L.fx === 'v') {
          var B = L.fx === 'h' ? (W <= 599 ? 16 : 26) : (W <= 599 ? 6 : 12);
          var size = (L.fx === 'h' ? VH : VW) / B;
          for (k = 0; k < B; k++) {
            var c = L.fx === 'h' ? VH - (k * size + size / 2) : k * size + size / 2;
            var a = document.createElementNS(NS, 'rect'), b = document.createElementNS(NS, 'rect');
            [a, b].forEach(function (x) { x.setAttribute('fill', 'white'); x.setAttribute('shape-rendering', 'crispEdges'); L.g.appendChild(x); });
            if (L.fx === 'h') { a.setAttribute('x', 0); b.setAttribute('x', 0); a.setAttribute('width', VW); b.setAttribute('width', VW); }
            else { a.setAttribute('y', 0); b.setAttribute('y', 0); a.setAttribute('height', VH); b.setAttribute('height', VH); }
            L.parts.push({ a: a, b: b, c: c, h: size / 2, o: k / B });
          }
        } else {
          var cw = VW / cols, ch = VH / rows, order = [];
          for (var y = 0; y < rows; y++) for (var x = 0; x < cols; x++) {
            r = document.createElementNS(NS, 'rect');
            r.setAttribute('x', x * cw); r.setAttribute('y', y * ch); r.setAttribute('width', cw + .02); r.setAttribute('height', ch + .02);
            r.setAttribute('fill', 'white'); r.setAttribute('opacity', 0); r.setAttribute('shape-rendering', 'crispEdges');
            L.g.appendChild(r); order.push({ r: r, x: x, y: y });
          }
          if (L.fx === 'col') {
            var byCol = [];
            for (x = 0; x < cols; x++) byCol = byCol.concat(shuffle(order.filter(function (o) { return o.x === x; })));
            order = byCol;
          } else order = shuffle(order);
          order.forEach(function (o, j) { L.parts.push({ r: o.r, o: j / order.length }); });
        }
      });
    };

    /* aplica a abertura u (0 fechado, 1 aberto) numa camada */
    var paint = function (L, u) {
      u = Math.round(u * 400) / 400;
      if (u === L.last) return; L.last = u;
      var spread = .45;
      L.parts.forEach(function (p) {
        var q = ease(clamp((u - p.o * spread) / (1 - spread), 0, 1));
        if (p.r) { p.r.setAttribute('opacity', q.toFixed(3)); return; }
        var s = p.h * q + (q > 0 ? .02 : 0);
        if (L.fx === 'h') { p.a.setAttribute('y', p.c - s); p.a.setAttribute('height', s); p.b.setAttribute('y', p.c); p.b.setAttribute('height', s); }
        else { p.a.setAttribute('x', p.c - s); p.a.setAttribute('width', s); p.b.setAttribute('x', p.c); p.b.setAttribute('width', s); }
      });
    };

    var load = function () {
      if (started) return; started = true;
      layers.forEach(function (L) { L.img.setAttribute('href', src(L.name)); });
    };

    var loop = function () {
      busy = false;
      var r = sec.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) return;
      tp = clamp(-r.top / Math.max(1, r.height - innerHeight), 0, 1);
      cp += (tp - cp) * .12; if (Math.abs(tp - cp) < .0005) cp = tp;
      /* cada troca ocupa um trecho da rolagem, com uma pausa para ler o texto entre elas */
      var seg = 1 / N, at = 0;
      for (var i = 1; i < N; i++) {
        var a0 = seg * (i - .62), a1 = seg * (i + .08);
        var u = clamp((cp - a0) / (a1 - a0), 0, 1);
        paint(layers[i], u);
        /* a foto que entra chega com um leve zoom, e a de baixo recua */
        var z = 1.18 - .18 * ease(u);
        if (layers[i].z !== z) { layers[i].z = z; layers[i].svg.style.transform = 'scale(' + z.toFixed(4) + ')'; }
        if (u > .55) at = i;
      }
      if (at !== cur) {
        cur = at;
        txts.forEach(function (t, j) { t.classList.toggle('on', j === at); });
        if (num) num.textContent = (at < 9 ? '0' : '') + (at + 1);
      }
      fills.forEach(function (f, j) { f.style.transform = 'scaleX(' + clamp((cp - j * seg) / seg, 0, 1).toFixed(3) + ')'; });
      if (cp !== tp) kick();
    };
    var kick = function () { if (!busy) { busy = true; requestAnimationFrame(loop); } };

    build();
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { if (e[0].isIntersecting) load(); }, { rootMargin: '1200px 0px' }).observe(sec); else load();
    addEventListener('scroll', kick, { passive: true });
    var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { build(); kick(); }, 250); });
    kick();
  }

  window.HA_blinds = function () { [].forEach.call(document.querySelectorAll('[data-blinds]'), init); };
  window.HA_blinds();
})();
