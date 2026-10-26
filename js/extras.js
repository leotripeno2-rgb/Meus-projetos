/* Detalhes de acabamento (todas as páginas):
   1. botão flutuante: WhatsApp + anel que mostra quanto da página já foi lido (clique volta ao topo)
   2. contorno de latão que acompanha o mouse em cartões e caixas (só computador)
   3. brilho de latão que passa de tempos em tempos nos botões principais (só CSS, em style.css) */
(function () {
  var root = document.documentElement, weak = root.classList.contains('weak'), fine = root.classList.contains('fine');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* 1. botão flutuante */
  var fab = document.createElement('div');
  fab.className = 'fab';
  fab.innerHTML =
    '<a class="fab-wa" href="https://wa.me/5500000000000?text=' + encodeURIComponent('Olá, Helena. Vi seu site e gostaria de conversar.') + '" rel="noopener" aria-label="Conversar com a Helena pelo WhatsApp">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M9 9.5c.3 2 2 3.8 4.2 4.4l1-1 1.6.8-.4 1.3c-3.3.2-6.7-3-6.6-6.3L10.1 8l.8 1.6z" fill="currentColor"/></svg>' +
      '<span>Fale com a Helena</span></a>' +
    '<button type="button" class="fab-top" aria-label="Voltar ao topo">' +
      '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="22" class="fab-bg"/><circle cx="24" cy="24" r="22" class="fab-ring" id="fab-ring"/></svg><i aria-hidden="true">↑</i></button>';
  document.body.appendChild(fab);
  var ring = $('#fab-ring'), L = 2 * Math.PI * 22, busy = false;
  ring.style.strokeDasharray = L; ring.style.strokeDashoffset = L;
  var upd = function () {
    busy = false;
    var max = Math.max(1, document.documentElement.scrollHeight - innerHeight), p = Math.min(1, scrollY / max);
    ring.style.strokeDashoffset = (L * (1 - p)).toFixed(1);
    fab.classList.toggle('on', scrollY > innerHeight * .7);
    var bk = $('.book.on'); fab.classList.toggle('up', !!bk);
  };
  addEventListener('scroll', function () { if (!busy) { busy = true; requestAnimationFrame(upd); } }, { passive: true });
  addEventListener('resize', upd); upd();
  $('.fab-top', fab).addEventListener('click', function () {
    if (window.lenis && window.lenis.scrollTo) window.lenis.scrollTo(0, { duration: 1.6 }); else scrollTo({ top: 0, behavior: weak ? 'auto' : 'smooth' });
  });

  /* 2. contorno de latão que segue o mouse */
  if (fine && !weak) {
    var bind = function (el) {
      if (el.dataset.glow) return; el.dataset.glow = 1; el.classList.add('glow');
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--gx', (e.clientX - r.left) + 'px'); el.style.setProperty('--gy', (e.clientY - r.top) + 'px');
      }, { passive: true });
    };
    var scan = function () { $$('.vz figure, .pil-box, .btn-pdf, .faq details, .cc, .rc, .tbl').forEach(bind); };
    scan();
    var grid = $('#cat-grid');
    if (grid && 'MutationObserver' in window) new MutationObserver(scan).observe(grid, { childList: true });
    if ($('#app') && 'MutationObserver' in window) new MutationObserver(scan).observe($('#app'), { childList: true });
  }
})();

/* botões no estilo "círculo que se expande": o texto rola para cima e a seta sai e volta */
(function () {
  Array.prototype.forEach.call(document.querySelectorAll('.btn'), function (b) {
    if (b.dataset.bt) return; b.dataset.bt = 1;
    var t = '', i = b.querySelector('i');
    Array.prototype.slice.call(b.childNodes).forEach(function (n) { if (n.nodeType === 3 && n.textContent.trim()) { t += n.textContent.trim(); b.removeChild(n); } });
    if (!t) return;
    var s = document.createElement('span'); s.className = 'bt-t'; s.setAttribute('data-t', t); s.innerHTML = '<span>' + t + '</span>';
    b.insertBefore(s, b.firstChild);
    if (i && !i.querySelector('span')) i.innerHTML = '<span>' + i.textContent + '</span>';
  });
})();

/* troca de página em pixels: uma grade de quadrados cobre a tela antes de sair e se desfaz ao chegar.
   Adaptado de "Pixel Transition" (Codrops, licença MIT), sem GSAP. */
(function () {
  var root = document.documentElement, veil = document.querySelector('.veil');
  if (!veil || root.classList.contains('lite')) return;
  var cols = innerWidth < 700 ? 7 : 14, rows = innerWidth < 700 ? 12 : 8;
  var px = document.createElement('div'); px.className = 'px'; px.setAttribute('aria-hidden', 'true');
  px.style.setProperty('--c', cols); px.style.setProperty('--r', rows);
  var cells = [];
  for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
    var i = document.createElement('i');
    if (Math.random() < .07) i.className = 'b';
    px.appendChild(i); cells.push({ el: i, r: r });
  }
  veil.insertBefore(px, veil.firstChild);
  var stagger = function (rev) {
    cells.forEach(function (k) {
      var row = rev ? rows - 1 - k.r : k.r;
      k.el.style.transitionDelay = (0.03 * (row + Math.random() * 5)).toFixed(3) + 's';
    });
  };
  /* ao chegar: a página começa coberta e os quadrados se desfazem de baixo para cima */
  root.classList.add('px-on'); veil.classList.add('px-ready');
  stagger(true);
  requestAnimationFrame(function () { requestAnimationFrame(function () { veil.classList.add('px-out'); }); });
  /* ao sair (main.js põe .on no véu): os quadrados cobrem a tela de cima para baixo */
  new MutationObserver(function () {
    if (veil.classList.contains('on')) { stagger(false); veil.classList.remove('px-out'); }
  }).observe(veil, { attributes: true, attributeFilter: ['class'] });
  addEventListener('pageshow', function (e) { if (e.persisted) { stagger(true); veil.classList.add('px-out'); } });
})();
