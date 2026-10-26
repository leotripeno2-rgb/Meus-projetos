/* Catálogo: página com filtros (catalogo.html) e faixas de imóveis espalhadas pelo site ([data-rail]).
   Lê os imóveis de js/data.js. Para mudar o que cada faixa mostra, edite o atributo data-rail no HTML:
   data-rail="todos" | "cat:Casa" | "cat:Apartamento" | "outros:<slug>" */
(function () {
  var DATA = window.IMOVEIS || [];
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var href = function (x) { return 'imovel.html?p=' + x.slug; };
  var nameH = function (n) { var a = n.split(' '); return a[0] + ' <span class="it">' + a.slice(1).join(' ') + '</span>'; };
  var money = function (s) { var m = /([\d.,]+)\s*mi/.exec(s); return m ? parseFloat(m[1].replace(',', '.')) : 0; };
  var num = function (s) { return parseInt(String(s), 10) || 0; };
  var img = function (x, sz) {
    var n = x.fotos.capa;
    return '<img src="assets/foto/' + n + '-s.webp" srcset="assets/foto/' + n + '-s.webp 1200w, assets/foto/' + n + '.webp 2400w" sizes="' + sz + '" alt="" loading="lazy" decoding="async">';
  };

  /* ao passar o mouse, a foto de um ambiente interno sobe por cima da fachada */
  var alt = function (x) {
    var i = x.fotos.interiores && x.fotos.interiores[0];
    return i ? '<span class="alt" aria-hidden="true"><img src="assets/foto/' + i[1] + '-s.webp" alt="" loading="lazy" decoding="async"><em class="cap">' + i[0] + '</em></span>' : '';
  };

  /* cartão compacto, usado nas faixas e no catálogo */
  var card = function (x, k) {
    return '<a class="rc rv" style="--d:' + (k % 4 * 70) + 'ms" href="' + href(x) + '" data-cursor="Ver">' +
      '<figure class="rc-f">' + img(x, '(max-width:700px) 80vw, 33vw') + alt(x) + (x.video ? '<span class="rc-tag cap">Com filme</span>' : '') + '</figure>' +
      '<p class="cap rc-m">' + x.cat + ' · ' + x.loc + '</p>' +
      '<h4 class="rc-n">' + nameH(x.n) + '</h4>' +
      '<p class="rc-s"><b>' + x.preco + '</b><span>' + x.area + '</span><span>' + x.suites + ' suítes</span></p></a>';
  };

  /* ===== faixas ===== */
  window.HA_rails = function (root) {
    $$('[data-rail]', root || document).forEach(function (el) {
      if (el.dataset.done) return; el.dataset.done = 1;
      var r = el.dataset.rail, list = DATA.slice();
      if (r.indexOf('cat:') === 0) list = DATA.filter(function (x) { return x.cat === r.slice(4); });
      else if (r.indexOf('outros:') === 0) list = DATA.filter(function (x) { return x.slug !== r.slice(7); });
      if (!list.length) { el.hidden = true; return; }
      el.classList.add('rail');
      el.innerHTML = '<div class="wrap"><header class="rail-h"><div><p class="lbl">' + (el.dataset.lbl || 'Catálogo') + '</p><h3 class="rail-t">' + (el.dataset.title || 'Imóveis') + '</h3></div>' +
        '<a class="ln" href="catalogo.html">Ver catálogo completo <i aria-hidden="true">→</i></a></header>' +
        '<div class="rail-l">' + list.map(card).join('') + '</div></div>';
    });
  };
  window.HA_rails();

  /* ===== página do catálogo ===== */
  var grid = $('#cat-grid');
  if (!grid) return;
  var F = { tipo: 'todos', valor: 'todos', suites: 0, ord: 'padrao' };
  var count = $('#cat-n'), empty = $('#cat-empty');
  var faixa = { todos: [0, 99], ate2: [0, 2], '2a3': [2, 3.0001], '3mais': [3.0001, 99] };

  var draw = function () {
    var f = faixa[F.valor];
    var list = DATA.filter(function (x) {
      var v = money(x.preco);
      return (F.tipo === 'todos' || x.cat === F.tipo) && v >= f[0] && v < f[1] && x.suites >= F.suites;
    });
    if (F.ord === 'menor') list.sort(function (a, b) { return money(a.preco) - money(b.preco); });
    if (F.ord === 'maior') list.sort(function (a, b) { return money(b.preco) - money(a.preco); });
    if (F.ord === 'area') list.sort(function (a, b) { return num(b.area) - num(a.area); });
    grid.classList.add('swap');
    setTimeout(function () {
      grid.innerHTML = list.map(function (x, k) {
        return '<article class="cc"><a class="cc-f" href="' + href(x) + '" data-cursor="Ver"><figure>' + img(x, '(max-width:700px) 100vw, 33vw') + alt(x) +
          (x.video ? '<span class="rc-tag cap">Com filme</span>' : '') + '</figure></a>' +
          '<div class="cc-b"><p class="cap">' + x.cat + ' · ' + x.loc + ', ' + x.cidade + '</p>' +
          '<h3 class="cc-n"><a href="' + href(x) + '">' + nameH(x.n) + '</a></h3>' +
          '<p class="cc-r">' + x.resumo + '</p>' +
          '<dl class="cc-d"><div><dt>Área</dt><dd>' + x.area + '</dd></div><div><dt>Suítes</dt><dd>' + x.suites + '</dd></div><div><dt>Vagas</dt><dd>' + x.vagas + '</dd></div><div><dt>Valor</dt><dd>' + x.preco + '</dd></div></dl>' +
          '<a class="ln" href="' + href(x) + '">Ver imóvel <i aria-hidden="true">→</i></a></div></article>';
      }).join('');
      count.textContent = list.length + (list.length === 1 ? ' imóvel' : ' imóveis');
      empty.hidden = list.length > 0;
      grid.classList.remove('swap');
    }, grid.dataset.ready ? 220 : 0);
    grid.dataset.ready = 1;
  };

  $$('.flt').forEach(function (g) {
    g.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      $$('button', g).forEach(function (o) { o.setAttribute('aria-pressed', o === b); });
      var k = g.dataset.k, v = b.dataset.v;
      F[k] = k === 'suites' ? parseInt(v, 10) : v;
      draw();
    });
  });
  var clear = $('#cat-clear');
  if (clear) clear.addEventListener('click', function () {
    F = { tipo: 'todos', valor: 'todos', suites: 0, ord: 'padrao' };
    $$('.flt').forEach(function (g) { $$('button', g).forEach(function (o, i) { o.setAttribute('aria-pressed', i === 0); }); });
    draw();
  });
  draw();
})();
