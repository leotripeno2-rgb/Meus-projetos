/* JS leve, sem bibliotecas além do Lenis. Sem JS a home continua legível.
   Toda animação de rolagem passa por um único requestAnimationFrame e mexe só em transform, opacity e clip-path. */
(function () {
  'use strict';
  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var raf = window.requestAnimationFrame.bind(window);
  var pad = function (n) { return ('0' + n).slice(-2); };
  var lite = root.classList.contains('lite');
  var fine = root.classList.contains('fine');
  var hasIO = 'IntersectionObserver' in window;
  var weak = root.classList.contains('weak');
  var page = document.body.dataset.page;
  var DATA = window.IMOVEIS || [];
  var WA = 'https://wa.me/5500000000000?text=';

  /* foto responsiva: versão de 1200 px para telas pequenas, a grande para as demais */
  var pic = function (name, sizes, alt, extra) {
    return '<img src="assets/foto/' + name + '.webp" srcset="assets/foto/' + name + '-s.webp 1200w, assets/foto/' + name + '.webp 2400w" sizes="' + sizes + '" alt="' + (alt || '') + '"' + (extra || ' loading="lazy" decoding="async"') + '>';
  };
  /* vídeo: só carrega quando precisa; celular e economia de dados recebem a versão leve */
  var conn = navigator.connection || {};
  var small = matchMedia('(max-width:900px)').matches || !!conn.saveData;
  var vtag = function (name, extra) { return '<video ' + (extra || '') + ' muted loop playsinline preload="none" aria-hidden="true" tabindex="-1" data-src="assets/video/' + name + '.mp4" data-s="assets/video/' + name + '-s.mp4"></video>'; };
  var vplay = function (v) {
    if (!v) return;
    v.muted = true;
    if (!v.getAttribute('src')) { v.addEventListener('playing', function () { v.classList.add('rdy'); }, { once: true }); v.src = (small && v.dataset.s) || v.dataset.src; }
    var pr = v.play(); if (pr && pr.catch) pr.catch(function () {});
  };
  var vpause = function (v) { if (v && v.getAttribute('src')) v.pause(); };
  var href = function (x) { return 'imovel.html?p=' + x.slug; };
  /* "Casa Vento Sul" → "Casa <it>Vento Sul</it>"; "*trecho*" → itálico */
  var nameH = function (n) { var a = n.split(' '); return a[0] + ' <span class="it">' + a.slice(1).join(' ') + '</span>'; };
  var ital = function (s) { return String(s).replace(/\*([^*]+)\*/g, '<span class="it">$1</span>'); };
  /* "R$ 3,2 mi" → "3.200.000" */
  var fullPrice = function (s) { var m = /([\d.,]+)\s*mi/.exec(s); return m ? Math.round(parseFloat(m[1].replace(',', '.')) * 1e6).toLocaleString('pt-BR') : s.replace('R$', '').trim(); };
  /* "380 m²" → número que conta + unidade */
  var stat = function (v) {
    var m = /^(\d+)\s*(.*)$/.exec(String(v));
    return m ? '<span data-count="' + m[1] + '">' + m[1] + '</span>' + (m[2] ? '<small>' + m[2] + '</small>' : '') : null;
  };
  var PERFIL = {
    'Alto da Figueira': 'Casas em condomínio, ruas arborizadas',
    'Centro Velho': 'Apartamentos, metrô a 400 m',
    'Vila das Pedras': 'Casas novas, ruas sem saída',
    'Jardim das Acácias': 'Lotes amplos, escolas e praças',
    'Beira-Rio': 'À margem do rio, ciclovia de 6 km'
  };

  /* ================= página do imóvel ================= */
  if (page === 'imovel') {
    var slug = new URLSearchParams(location.search).get('p');
    var idx = Math.max(0, DATA.findIndex(function (x) { return x.slug === slug; }));
    var p = DATA[idx], nx = DATA[(idx + 1) % DATA.length], f = p.fotos;
    var hasLot = p.terreno.indexOf('m²') > -1;
    document.title = p.n + ' · ' + p.loc + ' · Helena Aragão';
    var md = $('meta[name=description]'); if (md) md.setAttribute('content', p.resumo);
    var mi = $('#menu-img'); if (mi) mi.src = 'assets/foto/' + f.capa + '-s.webp';
    var row = function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>'; };

    /* galeria: cada foto uma vez, na ordem em que a visita acontece */
    var used = {}; used[f.abertura] = 1;
    var capOf = function (img) {
      var it = (f.interiores || []).filter(function (x) { return x[1] === img; })[0];
      if (it) return it[0];
      if (img === f.galeria[0]) return p.ambientes[1];
      if (img === f.galeria[1]) return p.ambientes[2];
      if (img === f.detalhe) return 'Detalhe';
      return p.ambientes[3] || p.ambientes[0];
    };
    var G = [];
    [f.amplo || f.galeria[0], f.detalhe, (f.interiores[0] || [])[1], f.galeria[1], (f.interiores[1] || [])[1], (f.interiores[2] || [])[1], f.galeria[0], f.capa]
      .forEach(function (img) { if (img && !used[img]) { used[img] = 1; G.push(img); } });
    var fig = function (cls, k, sizes) {
      var img = G[k]; if (!img) return '';
      var c = capOf(img);
      return '<figure class="fig ' + cls + '" data-cursor="' + c + '"><div class="fr rimg"><div class="par">' + pic(img, sizes, p.n + ': ' + c) + '</div></div><figcaption><b>Fig. ' + pad(k + 2) + '</b>' + c + '</figcaption></figure>';
    };

    /* recortes de detalhe para cada material */
    var crops = [f.detalhe, f.galeria[0], f.galeria[1], f.abertura];
    var cropPos = ['30% 30%', '75% 25%', '60% 75%', '15% 70%'];

    var IC = function (d) { return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + d + '</svg>'; };
    var ICON = [IC('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'), IC('<path d="M3 18V8M3 14h18v4M21 18v-4a3 3 0 0 0-3-3h-7v3"/><circle cx="7" cy="11" r="1.6"/>'), IC('<path d="M5 16l1.5-5a2 2 0 0 1 2-1.5h7a2 2 0 0 1 2 1.5L19 16M4 16h16v3H4zM7 19v1.5M17 19v1.5"/>'), hasLot ? IC('<path d="M3 12l9-8 9 8M5 11v9h14v-9"/>') : IC('<path d="M12 4l2.4 5 5.4.7-4 3.8 1 5.4L12 16.2 7.2 19l1-5.4-4-3.8 5.4-.7z"/>')];
    var st = [
      ['Área privativa', stat(p.area)],
      ['Suítes', stat(p.suites)],
      ['Vagas', stat(p.vagas)],
      [hasLot ? 'Terreno' : 'Destaque', hasLot ? stat(p.terreno) : null]
    ];

    var ln = 0, L = function () { return '(' + pad(++ln) + ')'; };
    var tom = function (h) { return h < 8 ? 'primeira luz' : h < 11 ? 'luz suave' : h < 15 ? 'sol pleno' : h < 17 ? 'luz quente' : h < 19 ? 'luz dourada' : h < 20.2 ? 'hora azul' : 'casa acesa'; };
    var plan = planData(p);
    var casaOu = p.cat === 'Casa' ? 'A casa' : 'O apartamento';
    var h0 = { 'Manhã': 8, 'Tarde': 14, 'Fim de tarde': 18, 'Noite': 20.5 }[p.hora] || 14;

    $('#app').innerHTML =
      /* abertura */
      '<section class="hero p-hero">' +
      '<div class="hero-frame">' + pic(f.abertura, '100vw', p.n + ': ' + p.ambientes[0], ' fetchpriority="high"') + (p.video ? vtag(p.video, 'class="hero-vid" id="hero-vid"') : '') + '</div>' +
      '<div class="hero-in wrap">' +
      '<div class="hero-top cap"><a href="index.html#colecao" style="--k:0">← Coleção</a><span style="--k:1">Nº ' + pad(idx + 1) + ' — ' + pad(DATA.length) + ' · ' + p.cat + '</span><span style="--k:2">' + p.loc + ', ' + p.cidade + '</span><a href="' + href(nx) + '" style="--k:3">Próximo →</a></div>' +
      '<h1 class="hero-h">' + nameH(p.n) + '</h1>' +
      '<div class="hero-foot"><a class="hero-down cap" href="#imovel" style="--k:0"><i aria-hidden="true"></i>Role para visitar</a>' +
      '<p class="hero-feat" style="--k:1"><b>' + p.resumo + '</b><span>' + p.area + ' · ' + p.suites + ' suítes · ' + p.vagas + ' vagas · entrega ' + p.ano + '</span></p>' +
      '<div class="hero-price" style="--k:2"><b>' + p.preco + '</b><a class="ln" href="#agendar">Agendar visita <i aria-hidden="true">→</i></a></div></div>' +
      '</div></section>' +

      /* o imóvel em números */
      '<section class="pi" id="imovel" data-hud="O imóvel"><div class="wrap g">' +
      '<p class="lbl">' + L() + ' O imóvel</p>' +
      '<p class="pi-price split"><small>R$</small>' + fullPrice(p.preco) + '</p>' +
      '<p class="pi-where cap rv">' + p.cidade + '<i></i>' + p.loc + '<i></i>' + p.cat + '</p>' +
      '<dl class="pi-stats">' + st.map(function (s, k) {
        var v = s[1] || p.terreno;
        return '<div class="rv" style="--d:' + (k * .1) + 's">' + ICON[k] + '<dt class="cap">' + s[0] + '</dt><dd' + (s[1] ? '' : ' class="txt"') + '>' + v + '</dd></div>';
      }).join('') + '</dl>' +
      '</div></section>' +

      /* primeira foto, de ponta a ponta */
      '<section class="p-gal1" data-hud="Galeria"><div class="wrap gx">' + fig('s1', 0, '100vw') + '</div></section>' +

      /* narrativa */
      '<section class="sec ps" data-hud="Sobre o imóvel"><div class="wrap g">' +
      '<p class="lbl">' + L() + ' Sobre o imóvel</p>' +
      '<h2 class="ps-h split">' + ital(p.titulo || p.resumo) + '</h2>' +
      '<p class="lead ps-lead rv">' + p.texto + '</p>' +
      '<p class="ps-by rv"><span class="cap">Projeto</span><b>' + p.arq + '</b></p>' +
      '<div class="ps-cols">' + (p.historia || []).map(function (h, k) {
        return '<div class="rv" style="--d:' + (k * .08) + 's"><h3 class="cap"><i>' + pad(k + 1) + '</i>' + h[0] + '</h3><p>' + h[1] + '</p></div>';
      }).join('') + '</div>' +
      '</div></section>' +

      /* filme */
      (p.video ? '<section class="film" data-hud="Filme" aria-label="Filme do imóvel"><div class="cta-bg"><div class="cta-clip">' + pic(f.capa, '100vw', '') + vtag(p.video, 'id="film-vid"') + '</div></div>' +
      '<div class="wrap film-in"><p class="lbl">' + L() + ' Filme · ' + (p.hora || '') + '</p><h2 class="film-h split">' + casaOu + ' <span class="it">em movimento.</span></h2>' +
      '<button class="film-btn" id="film-btn" type="button" aria-label="Pausar o filme"><i aria-hidden="true"></i><span>Pausar</span></button></div></section>' : '') +

      /* galeria editorial */
      '<section class="p-gal" data-hud="Galeria"><div class="wrap gx">' +
      fig('s2', 1, '(max-width: 900px) 100vw, 42vw') + fig('s3', 2, '(max-width: 900px) 100vw, 58vw') +
      '<p class="quote split">' + p.resumo + '</p>' +
      fig('s4', 3, '(max-width: 900px) 100vw, 66vw') + fig('s5', 4, '(max-width: 900px) 100vw, 34vw') + fig('s6', 5, '(max-width: 900px) 100vw, 50vw') + fig('s7', 6, '(max-width: 900px) 100vw, 50vw') +
      '</div></section>' +

      /* por dentro: as fotos se trocam em persianas com a rolagem */
      (function () {
        var it = [[f.galeria[0], 'A fachada', 'que *se anuncia.*']];
        (f.interiores || []).slice(0, 2).forEach(function (x, k) { it.push([x[1], x[0], k ? 'que *acolhe.*' : 'que *reúne.*']); });
        it.push([f.detalhe, 'O detalhe', 'que *fica.*']);
        return '<section class="bl" data-blinds data-hud="Por dentro" data-imgs="' + it.map(function (x) { return x[0]; }).join(',') + '" data-fx="h,grid,v,col" aria-label="Ambientes de ' + p.n + '">' +
          '<div class="bl-pin"><div class="bl-stage"></div><div class="bl-shade" aria-hidden="true"></div><div class="bl-frame" aria-hidden="true"></div>' +
          '<div class="bl-top"><p class="lbl">Por dentro</p><p class="cap bl-n"><b>01</b> / ' + pad(it.length) + '</p></div>' +
          '<div class="bl-txts">' + it.map(function (x) { return '<div class="bl-t"><p class="cap">' + p.n + ' · ' + x[1] + '</p><h3 class="bl-h">' + x[1] + ' <span class="it">' + x[2].replace(/\*/g, '') + '</span></h3></div>'; }).join('') + '</div>' +
          '<div class="bl-bar" aria-hidden="true"></div></div></section>';
      })() +

      /* planta */
      '<section class="plan rule" data-hud="Planta"><div class="wrap g">' +
      '<header class="g sec-head" style="grid-column:1/-1"><p class="lbl">' + L() + ' Planta</p><h2 class="h2 split">Por dentro, <span class="it">cômodo a cômodo.</span></h2></header>' +
      '<div class="plan-w rv" id="plan-w">' + plan.svg + '<p class="plan-note">Planta esquemática, com áreas aproximadas. A planta técnica é entregue na visita.</p></div>' +
      '<div class="plan-side"><p class="plan-big"><span id="plan-m">' + parseInt(p.area, 10) + '</span><small>m²</small></p><p class="cap plan-nm" id="plan-nm">Área privativa</p>' +
      '<ul class="plan-l" id="plan-l">' + plan.rooms.map(function (r, k) { return '<li data-k="' + k + '"><button type="button"><i>' + pad(k + 1) + '</i><b>' + r.name + '</b><span>' + (r.out ? 'externo' : r.m2 + ' m²') + '</span></button></li>'; }).join('') + '</ul></div>' +
      '</div></section>' +

      /* maquete 3D: gira, muda a hora do sol e abre o andar (js/maquete-imovel.js) */
      '<section class="m3" id="maquete3d" data-hud="Maquete 3D" aria-label="Maquete 3D de ' + p.n + '">' +
      '<div class="m3-stage" data-cursor="Arraste" aria-hidden="true"></div><div class="m3-tags" aria-hidden="true"></div>' +
      '<div class="wrap m3-ui"><div class="m3-head"><p class="lbl">' + L() + ' Maquete 3D</p><h2 class="h2">' + (p.cat === 'Apartamento' ? 'O prédio' : 'A casa') + ' <span class="it">em escala.</span></h2>' +
      '<p class="m3-note">Arraste para girar. Mude a hora e veja a sombra andar; à noite, as janelas acendem.</p></div>' +
      '<div class="m3-side"><p class="m3-time"><b id="m3-clock">--:--</b><span id="m3-cap"></span></p>' +
      '<input class="sun-range" id="m3-range" type="range" min="6" max="21" step=".25" value="' + h0 + '" aria-label="Hora do dia"><div class="sun-ticks" aria-hidden="true"><span>06h</span><span>09h</span><span>12h</span><span>15h</span><span>18h</span><span>21h</span></div>' +
      '<div class="m3-btns"><button type="button" class="m3-b" id="m3-open" aria-pressed="false"><span>' + (p.cat === 'Apartamento' ? 'Abrir a torre' : 'Abrir o andar de cima') + '</span></button><button type="button" class="m3-b" id="m3-spin" aria-pressed="true"><span>Girar sozinha</span></button></div></div></div>' +
      '<figure class="m3-fallback">' + pic(f.abertura, '100vw', p.n) + '</figure></section>' +

      /* detalhes arquitetônicos */
      '<section class="sec pdx" data-hud="Detalhes"><div class="wrap g">' +
      '<p class="lbl">' + L() + ' Detalhes</p>' +
      '<h2 class="h2 pd-h split">Matéria <span class="it">e detalhe.</span></h2>' +
      '<div class="pd">' +
      '<figure class="pd-media" aria-hidden="true">' + p.materiais.map(function (m, k) {
        return '<img src="assets/foto/' + crops[k % 4] + '.webp" alt="" loading="lazy" decoding="async" style="object-position:' + cropPos[k % 4] + '"' + (k ? '' : ' class="on"') + '>';
      }).join('') + '<figcaption class="cap">Recorte</figcaption><span class="pd-n">01</span></figure>' +
      '<ol class="pd-list">' + p.materiais.map(function (m, k) {
        return '<li' + (k ? '' : ' class="on"') + '><i>' + pad(k + 1) + '</i><b>' + m + '</b></li>';
      }).join('') + '</ol></div>' +
      '<div class="pd-facts"><p class="lbl">Ficha</p><dl>' +
      [['Entrega', p.ano], ['Arquitetura', p.arq], ['Bairro', p.loc]].map(function (r, k) { return '<div class="rv" style="--d:' + (k * .1) + 's"><dt class="cap">' + r[0] + '</dt><dd>' + r[1] + '</dd></div>'; }).join('') +
      '</dl></div>' +
      '<div class="pd-ficha rv"><dl class="tbl">' + [['Categoria', p.cat], ['Bairro', p.loc], ['Cidade', p.cidade], ['Área privativa', p.area]].map(row).join('') + '</dl>' +
      '<dl class="tbl">' + [[hasLot ? 'Terreno' : 'Destaque', p.terreno], ['Suítes', p.suites], ['Vagas', p.vagas], ['Valor', p.preco]].map(row).join('') + '</dl></div>' +
      '</div></section>' +

      /* localização */
      '<section class="sec where rule" data-hud="Localização"><div class="wrap g">' +
      '<p class="lbl">' + L() + ' Localização</p><h2 class="h2 loc-h split">' + p.loc + '</h2>' +
      '<div class="map" id="map">' + mapSvg(p) + '<span class="map-n">N ↑</span><span class="map-s"><i></i>500 m</span></div>' +
      '<div class="near"><p class="lbl">Perto, a pé ou de carro</p><ul>' + p.perto.map(function (n, k) { return '<li class="rv" style="--d:' + (k * .1) + 's"><span>' + n[0] + '</span><b>' + n[1] + '</b></li>'; }).join('') + '</ul></div>' +
      '</div></section>' +

      /* convite final */
      '<section class="cta" id="agendar" data-hud="Visita">' +
      '<div class="cta-bg"><div class="cta-clip">' + pic(f.abertura, '100vw', '') + '</div></div>' +
      '<div class="wrap cta-in"><p class="lbl">' + L() + ' Visita</p>' +
      '<h2 class="cta-h split">Conheça o espaço <span class="it">pessoalmente.</span></h2>' +
      '<div class="cta-row"><div class="cta-info"><p class="lbl" style="margin:0">Melhor horário para a visita</p>' +
      '<div class="when" id="when" role="group" aria-label="Período da visita">' +
      [['Manhã', 'Luz suave'], ['Tarde', 'Sol pleno'], ['Fim de tarde', 'Luz dourada'], ['Noite', 'Casa acesa']].map(function (w, k) { return '<button type="button" class="' + (k ? '' : 'on') + '" aria-pressed="' + !k + '" data-v="' + w[0].toLowerCase() + '">' + w[0] + '<span>' + w[1] + '</span></button>'; }).join('') +
      '</div><p class="sched-note">Visitas com hora marcada, de segunda a sábado. Respondo no mesmo dia.</p></div>' +
      '<a class="orb cta-orb mag" id="wa" href="#" rel="noopener"><span class="orb-t"><small>WhatsApp</small>Agendar<i aria-hidden="true">→</i></span></a></div>' +
      '</div></section>' +

      /* veja também: os outros imóveis do catálogo */
      '<section data-rail="outros:' + p.slug + '" data-lbl="Veja também" data-title="Outros imóveis <span class=&quot;it&quot;>selecionados.</span>"></section>' +

      /* próximo imóvel */
      '<a class="next" href="' + href(nx) + '" data-cursor="Próximo"><div class="wrap">' +
      '<div class="next-top"><p class="lbl">Próximo imóvel · ' + pad((idx + 1) % DATA.length + 1) + ' / ' + pad(DATA.length) + '</p><p class="cap">' + nx.loc + ' · ' + nx.area + ' · ' + nx.preco + '</p></div>' +
      '<p class="next-n">' + nameH(nx.n) + '</p>' +
      '<div class="next-fig">' + pic(nx.fotos.abertura, '100vw', '') + '</div></div></a>' +
      '<footer class="foot"><div class="wrap g foot-row"><p class="foot-mark">Helena Aragão</p><nav class="foot-nav" aria-label="Rodapé"><a href="index.html#colecao">Coleção</a><a href="index.html#servicos">Comprar e vender</a><a href="index.html#sobre">Sobre</a><a href="index.html#contato">Contato</a></nav>' +
      '<p class="foot-note">© Helena Aragão · CRECI 000000-F (exemplo). Página de demonstração: dados, contatos e registro fictícios. Imagens: quadros de vídeos do Pexels e interiores do Pixabay.</p></div></footer>';

    if (window.HA_rails) HA_rails($('#app'));
    if (window.HA_blinds) HA_blinds();
    var when = $$('#when button'), waA = $('#wa');
    var setWa = function () {
      var per = $('#when .on').dataset.v;
      waA.href = WA + encodeURIComponent('Olá, Helena. Gostaria de visitar ' + p.n + ' (' + p.loc + ') ' + (per === 'noite' ? 'à noite' : per === 'manhã' ? 'pela manhã' : per === 'tarde' ? 'à tarde' : 'no fim de tarde') + '.');
    };
    when.forEach(function (b) { b.addEventListener('click', function () { when.forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); }); setWa(); }); });
    setWa();

    /* barra de visita: aparece depois da abertura e some quando o convite final chega */
    var bk = document.createElement('div'); bk.className = 'book'; bk.setAttribute('aria-hidden', 'false');
    bk.innerHTML = '<div><b>' + p.n + '</b><span>' + p.preco + ' · ' + p.area + ' · ' + p.suites + ' suítes</span></div><a class="btn" href="#agendar">Agendar visita <i aria-hidden="true">→</i></a>';
    document.body.appendChild(bk);
    var bkf = function () { var a = $('#agendar').getBoundingClientRect(); bk.classList.toggle('on', scrollY > innerHeight * .9 && a.top > innerHeight * .95); };
    addEventListener('scroll', bkf, { passive: true }); bkf();

    /* planta: passar o mouse (ou tocar) em um cômodo o acende no desenho e na lista */
    var pw = $('#plan-w'), pm = $('#plan-m'), pnm = $('#plan-nm'), total = parseInt(p.area, 10);
    var rms = $$('#plan-w .rm'), lis = $$('#plan-l li');
    var pick = function (k) {
      rms.forEach(function (g, j) { g.classList.toggle('on', j === k); });
      lis.forEach(function (li, j) { li.classList.toggle('on', j === k); });
      var r = plan.rooms[k];
      pm.textContent = r ? (r.out ? '—' : r.m2) : total;
      pnm.textContent = r ? r.name + (r.out ? ' · área externa' : '') : 'Área privativa';
    };
    rms.forEach(function (g, k) { g.addEventListener('mouseenter', function () { pick(k); }); g.addEventListener('click', function () { pick(k); }); });
    lis.forEach(function (li, k) { var b = $('button', li); b.addEventListener('mouseenter', function () { pick(k); }); b.addEventListener('focus', function () { pick(k); }); b.addEventListener('click', function () { pick(k); }); });
    pw.addEventListener('mouseleave', function () { pick(-1); });
    $('.plan-side').addEventListener('mouseleave', function () { pick(-1); });

    /* a luz: o controle desliza do nascer ao anoitecer */
    var KEYS = [[6, [255, 150, 90, .36], .6], [8, [255, 200, 150, .12], .88], [12, [255, 255, 255, 0], 1.02], [15, [255, 214, 150, .1], .96], [18, [255, 140, 60, .3], .82], [19.5, [110, 60, 120, .48], .6], [21, [10, 18, 48, .7], .4]];
    var mix = function (a, b, t) { return a + (b - a) * t; };
    var rg = $('#sun-range'), stint = $('#sun-tint'), sorb = $('#sun-orb'), stime = $('#sun-time'), scap = $('#sun-cap'), simg = $('#luz .sun-bg img'), sarc = $('#luz .sun-arc');
    var setSun = function () {
      var h = +rg.value, a = KEYS[0], b = KEYS[KEYS.length - 1];
      for (var i = 0; i < KEYS.length - 1; i++) if (h >= KEYS[i][0] && h <= KEYS[i + 1][0]) { a = KEYS[i]; b = KEYS[i + 1]; break; }
      var t = clamp((h - a[0]) / Math.max(.01, b[0] - a[0]), 0, 1);
      var c = [0, 1, 2, 3].map(function (n) { return mix(a[1][n], b[1][n], t); }), br = mix(a[2], b[2], t);
      stint.style.backgroundColor = 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + c[3].toFixed(3) + ')';
      simg.style.filter = 'brightness(' + br.toFixed(3) + ') saturate(' + mix(1.05, .9, Math.abs(h - 12) / 9).toFixed(2) + ')';
      var q = (h - 6) / 15, night = h > 19.8;
      sorb.style.left = (8 + q * 84).toFixed(1) + '%';
      sorb.style.top = (40 - Math.sin(q * Math.PI) * 28).toFixed(1) + '%';
      sorb.style.setProperty('--oc', night ? '#c9d4ff' : h < 9 || h > 16.5 ? '#ff9a55' : '#ffe3a0');
      sorb.style.setProperty('--og', night ? 'rgba(150,170,255,.35)' : h < 9 || h > 16.5 ? 'rgba(255,140,70,.5)' : 'rgba(255,220,140,.45)');
      var hh = Math.floor(h), mm = Math.round((h - hh) * 60);
      stime.innerHTML = pad(hh) + ':' + pad(mm) + '<small>h</small>';
      scap.textContent = tom(h).charAt(0).toUpperCase() + tom(h).slice(1);
    };
    if (rg) { rg.addEventListener('input', setSun); setSun(); }

    /* filme: toca quando está na tela; o botão pausa */
    var fv = $('#film-vid'), fb = $('#film-btn');
    if (fv && fb) {
      var userPaused = false, fvis = false;
      var sync = function () { fb.classList.toggle('off', fv.paused); $('span', fb).textContent = fv.paused ? 'Assistir' : 'Pausar'; fb.setAttribute('aria-label', fv.paused ? 'Assistir ao filme' : 'Pausar o filme'); };
      fb.addEventListener('click', function () { if (fv.paused) { userPaused = false; vplay(fv); } else { userPaused = true; fv.pause(); } setTimeout(sync, 60); });
      if (hasIO) new IntersectionObserver(function (e) {
        fvis = e[0].isIntersecting;
        if (fvis && !userPaused && !lite) vplay(fv); else if (!fvis) vpause(fv);
        setTimeout(sync, 80);
      }, { threshold: .15 }).observe($('.film'));
      if (lite) { fb.classList.add('off'); $('span', fb).textContent = 'Assistir'; }
    }
  }

  /* planta esquemática gerada a partir da área, suítes e vagas do imóvel */
  function planData(p) {
    var tot = parseInt(p.area, 10) || 100, n = Math.max(1, p.suites | 0), v = Math.max(0, p.vagas | 0), casa = p.cat === 'Casa';
    var W = 100, R = [], sw = W / n, i;
    for (i = 0; i < n; i++) R.push({ name: 'Suíte ' + pad(i + 1), x: i * sw, y: 0, w: sw, h: 26 });
    R.push({ name: 'Sala', x: 0, y: 26, w: 44, h: 26 }, { name: 'Cozinha', x: 44, y: 26, w: 26, h: 26 }, { name: casa ? 'Terraço' : 'Varanda', x: 70, y: 26, w: 30, h: 26 });
    var gw = v ? Math.min(W, v * 17) : 0;
    if (v) R.push({ name: v > 1 ? 'Garagem · ' + v + ' vagas' : 'Garagem · 1 vaga', x: 0, y: 52, w: gw, h: 12 });
    if (gw < W) R.push({ name: casa ? 'Jardim' : 'Hall', x: gw, y: 52, w: W - gw, h: 12, out: true });
    var sum = R.reduce(function (a, r) { return a + (r.out ? 0 : r.w * r.h); }, 0), acc = 0, last = null;
    R.forEach(function (r) { if (!r.out) { r.m2 = Math.round(r.w * r.h / sum * tot); acc += r.m2; last = r; } });
    if (last) last.m2 += tot - acc;
    var svg = '<svg viewBox="-1 -1 102 66" role="img" aria-label="Planta esquemática de ' + p.n + '">' + R.map(function (r, k) {
      return '<g class="rm' + (r.out ? ' out' : '') + '" style="--d:' + (k * .06).toFixed(2) + 's"><rect x="' + r.x.toFixed(2) + '" y="' + r.y + '" width="' + r.w.toFixed(2) + '" height="' + r.h + '"/>' +
        '<text class="rn" x="' + (r.x + 2).toFixed(2) + '" y="' + (r.y + 5) + '">' + r.name.split(' · ')[0] + '</text>' +
        '<text class="rm2" x="' + (r.x + 2).toFixed(2) + '" y="' + (r.y + r.h - 2.4) + '">' + (r.out ? 'externo' : r.m2 + ' m²') + '</text></g>';
    }).join('') + '</svg>';
    return { svg: svg, rooms: R };
  }

  /* mapa esquemático: ruas, rio, o imóvel ao centro e os pontos próximos */
  function mapSvg(p) {
    var spots = [[20, 26], [80, 30], [72, 82]], g = '';
    for (var i = 8; i < 100; i += 8) g += 'M' + i + ' 0V100M0 ' + i + 'H100';
    var routes = ['M50 52H34V26H20', 'M50 52V40H80V30', 'M50 52H62V82H72'];
    return '<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g class="gr"><path d="' + g + '"/></g>' +
      '<path class="riv" d="M-4 92C18 84 30 96 52 90S86 70 104 76"/>' +
      '<g class="st"><path d="M0 52H100M50 0V100M0 26H100M34 0V100M62 0V100M0 82L100 64M80 0V100"/></g>' +
      routes.map(function (r) { return '<path class="rt" d="' + r + '"/>'; }).join('') +
      p.perto.map(function (n, k) {
        var s = spots[k % 3], right = s[0] > 50;
        return '<g class="poi"><circle cx="' + s[0] + '" cy="' + s[1] + '" r="1.1"/><text x="' + (s[0] + (right ? -2.4 : 2.4)) + '" y="' + (s[1] - 2.2) + '" text-anchor="' + (right ? 'end' : 'start') + '">' + n[0] + ' · ' + n[1] + '</text></g>';
      }).join('') +
      '<g class="home"><rect x="48.4" y="50.4" width="3.2" height="3.2"/><text x="53.4" y="58">' + p.n + '</text></g></svg>';
  }

  /* troca a imagem ao lado de uma lista (bairros): a nova entra como uma cortina */
  function swapper(items, imgs) {
    var cur = 0;
    var go = function (k) {
      if (k === cur) return;
      imgs.forEach(function (m, j) { m.classList.toggle('was', j === cur); m.classList.toggle('on', j === k); });
      items.forEach(function (b, j) { b.classList.toggle('on', j === k); });
      cur = k;
    };
    items.forEach(function (b, k) { b.addEventListener('focus', function () { go(k); }); b.addEventListener('mouseenter', function () { go(k); }); });
  }

  /* ================= home ================= */
  var props = $('#props');
  if (props) {
    props.innerHTML = DATA.map(function (x, k) {
      var c = k % 5 + 1, intr = x.fotos.interiores && x.fotos.interiores[0];
      return '<article class="pc c' + c + '">' +
        '<a class="pc-fig" href="' + href(x) + '" tabindex="-1" aria-hidden="true" data-cursor="Ver"><div class="rimg"><div class="par">' + pic(x.fotos.capa, c === 4 ? '100vw' : '(max-width: 900px) 100vw, 60vw', '') + '</div></div>' +
        (x.video ? vtag(x.video, 'class="prop-vid"') + '<span class="prop-tag cap">' + (x.hora || 'Filme') + ' · em movimento</span>' : '') +
        (intr && !x.video ? '<img class="prop-in" src="assets/foto/' + intr[1] + '.webp" alt="" loading="lazy" decoding="async"><span class="prop-tag cap">' + intr[0] + '</span>' : '') + '</a>' +
        '<div class="pc-txt"><p class="pc-no rv">' + pad(k + 1) + '</p>' +
        '<p class="pc-meta cap rv">' + x.cat + ' · ' + x.loc + '</p>' +
        '<h3 class="pc-n rv"><a href="' + href(x) + '">' + nameH(x.n) + '</a></h3>' +
        '<p class="pc-r rv">' + x.resumo + '</p>' +
        '<dl class="pc-spec rv"><div><dt>Área</dt><dd>' + x.area + '</dd></div><div><dt>Suítes</dt><dd>' + x.suites + '</dd></div><div><dt>Valor</dt><dd>' + x.preco + '</dd></div></dl>' +
        '<a class="ln rv" href="' + href(x) + '">Ver imóvel <i aria-hidden="true">→</i></a></div></article>';
    }).join('');
  }

  /* cartões da coleção: ao passar o mouse a casa ganha movimento */
  if (fine && !lite) $$('.pc').forEach(function (c) {
    var v = $('.prop-vid', c); if (!v) return;
    c.addEventListener('mouseenter', function () { vplay(v); });
    c.addEventListener('mouseleave', function () { vpause(v); });
  });

  /* filmes: faixa de painéis; o painel ativo se abre e toca */
  var reel = $('#reel');
  if (reel) {
    var RV = DATA.filter(function (x) { return x.video; });
    reel.innerHTML = RV.map(function (x, k) {
      return '<a class="rl-p' + (k ? '' : ' on') + '" href="' + href(x) + '" data-cursor="Ver" aria-label="' + x.n + ', ' + (x.hora || '') + '">' +
        pic(x.fotos.capa, '(max-width:900px) 100vw, 60vw', '') + vtag(x.video) +
        '<span class="rl-hr cap"><span>' + (x.hora || '') + '</span><span>' + pad(k + 1) + ' / ' + pad(RV.length) + '</span></span>' +
        '<span class="rl-v cap"><i>' + pad(k + 1) + '</i>' + (x.hora || '') + ' · ' + x.n + '</span>' +
        '<div class="rl-t"><p class="cap"><span>' + x.cat + '</span><span>' + x.loc + '</span></p><h3>' + nameH(x.n) + '</h3><p>' + x.area + ' · ' + x.suites + ' suítes · ' + x.preco + '</p></div>' +
        '<i class="rl-bar"></i></a>';
    }).join('');
    var rps = $$('.rl-p', reel), rcur = -1, rvis = false, rhold = false, rtimer = 0;
    var DUR = 6500;
    var rgo = function (k) {
      if (k === rcur) return;
      rcur = k;
      rps.forEach(function (el, j) {
        el.classList.toggle('on', j === k);
        var v = $('video', el);
        if (j === k) { if (!lite && rvis) vplay(v); } else vpause(v);
      });
      clearTimeout(rtimer);
      if (!lite && rvis && !rhold) rtimer = setTimeout(function () { rgo((rcur + 1) % rps.length); }, DUR);
    };
    reel.style.setProperty('--dur', (DUR / 1000) + 's');
    rps.forEach(function (el, k) {
      if (fine) el.addEventListener('mouseenter', function () { rhold = true; rgo(k); });
      el.addEventListener('focus', function () { rhold = true; rgo(k); });
      /* no toque: o primeiro toque abre o painel, o segundo entra no imóvel */
      el.addEventListener('click', function (e) { if (!el.classList.contains('on')) { e.preventDefault(); rhold = true; rgo(k); } });
    });
    reel.addEventListener('mouseleave', function () { rhold = false; rcur = -2; rgo(Math.max(0, rps.findIndex(function (e) { return e.classList.contains('on'); }))); });
    var rsec = reel.parentNode;
    if (hasIO) new IntersectionObserver(function (e) {
      rvis = e[0].isIntersecting;
      rsec.classList.toggle('paused', !rvis);
      var k = rcur < 0 ? 0 : rcur; rcur = -2; rgo(k);
      if (!rvis) { clearTimeout(rtimer); rps.forEach(function (el) { vpause($('video', el)); }); }
    }, { threshold: .25 }).observe(reel);
    rcur = 0;
  }

  var hoods = $('#hoods'), hm = $('#hoods-media');
  if (hoods) {
    hoods.innerHTML = DATA.map(function (x, k) {
      return '<li><a class="hood' + (k ? '' : ' on') + '" href="' + href(x) + '"><img src="assets/foto/' + x.fotos.capa + '-s.webp" alt="" loading="lazy" decoding="async"><b>' + x.loc + '</b><span>' + (PERFIL[x.loc] || x.cidade) + '</span><em>' + x.n + '</em></a></li>';
    }).join('');
    hm.innerHTML = DATA.map(function (x, k) { return pic(x.fotos.capa, '25vw', '', ' loading="lazy" decoding="async" class="' + (k ? '' : 'on') + '"'); }).join('');
    swapper($$('.hood', hoods), $$('img', hm));
  }

  /* ================= comum ================= */
  /* títulos revelados palavra por palavra: cada palavra ganha uma janela */
  var esc = function (t) { return t.replace(/&/g, '&amp;').replace(/</g, '&lt;'); };
  var splitEl = function (el) {
    var k = 0;
    var walk = function (node) {
      var out = '';
      Array.prototype.forEach.call(node.childNodes, function (n) {
        if (n.nodeType === 3) out += n.textContent.split(/(\s+)/).map(function (t) { return !t || /^\s+$/.test(t) ? t : '<span class="w"><i style="--i:' + (k++) + '">' + esc(t) + '</i></span>'; }).join('');
        else if (n.nodeName === 'BR') out += '<br>';
        else if (n.nodeType === 1) { var c = n.cloneNode(false); c.innerHTML = walk(n); out += c.outerHTML; }
      });
      return out;
    };
    el.innerHTML = walk(el);
  };
  if (!lite) $$('.hero-h, .split').forEach(splitEl);

  var nav = $('#nav'), navCh = $('#nav-ch'), navN = $('#nav-n'), navT = $('#nav-t');
  var navLinks = $$('.nav-links a[href^="#"]').map(function (a) { return { a: a, el: $(a.getAttribute('href')) }; }).filter(function (x) { return x.el; });
  var heroVid = $('#hero-vid'), heroImg = $('.hero-frame img'), heroBox = heroImg ? heroImg.parentNode : null;
  var lastY = 0, ticking = false;
  var mf = $('#mf'), mfw = [], mfLit = -1;

  /* frase do método: cada palavra escurece conforme a rolagem */
  if (mf) {
    var ws = mf.textContent.trim().split(/\s+/);
    mf.setAttribute('aria-label', ws.join(' '));
    mf.innerHTML = ws.map(function (w) { return '<span aria-hidden="true">' + w + '</span>'; }).join(' ');
    mfw = $$('span', mf);
  }

  /* seções sobre foto (o menu fica claro) e capítulos para o menu */
  var photoSecs = $$('.hero, .cta, .reel, .film, .sun, .arr, .alb, .dawn, .xp, .bl');
  var chSecs = $$('[data-hud]'), chCur = -1;
  var chNames = [];
  chSecs.forEach(function (s) { if (chNames.indexOf(s.dataset.hud) < 0) chNames.push(s.dataset.hud); });
  var pars = $$('.par');
  var ctas = $$('.cta, .film').map(function (s) { var c = $('.cta-clip', s); return { s: s, c: c, img: c && $$('img, video', c) }; });
  var pdItems = $$('.pd-list li'), pdImgs = $$('.pd-media img'), pdN = $('.pd-n'), pdCur = 0;

  /* faixa em movimento: o conteúdo é duplicado para girar sem emenda */
  var marq = $('#marq'), marqX = 0, marqW = 0, marqV = 0;
  if (marq) { marq.innerHTML += marq.innerHTML; marqW = marq.scrollWidth / 2; addEventListener('resize', function () { marqW = marq.scrollWidth / 2; }); }

  var frame = function () {
    ticking = false;
    var y = scrollY, h = innerHeight;
    var over = photoSecs.some(function (s) { var r = s.getBoundingClientRect(); return r.top <= 40 && r.bottom > 40; });
    nav.classList.toggle('scrolled', y > 40);
    nav.classList.toggle('solid', y > 40 && !over);
    nav.classList.toggle('on-photo', over);
    if (y > lastY + 4 && y > h * .8 && !nav.classList.contains('menu-open')) nav.classList.add('hide');
    else if (y < lastY - 4) nav.classList.remove('hide');
    marqV += (y - lastY) * .4;
    lastY = y;
    navLinks.forEach(function (l) { var r = l.el.getBoundingClientRect(); l.a.classList.toggle('cur', r.top <= h * .4 && r.bottom > h * .4); });

    /* capítulo atual, ao lado do logo */
    if (navCh) {
      var ci = -1;
      chSecs.forEach(function (s, k) { var r = s.getBoundingClientRect(); if (r.top <= h * .5 && r.bottom > h * .5) ci = k; });
      navCh.classList.toggle('on', ci >= 0);
      if (ci >= 0 && ci !== chCur) {
        chCur = ci;
        navN.textContent = pad(chNames.indexOf(chSecs[ci].dataset.hud) + 1); navT.textContent = chSecs[ci].dataset.hud;
      }
    }

    /* detalhes: o material no centro da tela troca o recorte */
    if (pdItems.length) {
      var di = 0;
      pdItems.forEach(function (li, k) { if (li.getBoundingClientRect().top < h * .55) di = k; });
      if (di !== pdCur) {
        pdImgs.forEach(function (m, j) { m.classList.toggle('was', j === pdCur); m.classList.toggle('on', j === di); });
        pdItems.forEach(function (li, j) { li.classList.toggle('on', j === di); });
        if (pdN) pdN.textContent = pad(di + 1);
        pdCur = di;
      }
    }
    if (lite) return;

    /* abertura: a câmera se aproxima devagar enquanto a foto sai da tela */
    if (heroBox) {
      var r0 = heroBox.getBoundingClientRect();
      if (r0.bottom > 0 && r0.top < h) {
        var q = clamp(-r0.top / r0.height, 0, 1);
        var ht = 'translate3d(0,' + (q * r0.height * .22).toFixed(1) + 'px,0) scale(' + (1 + q * .1).toFixed(4) + ')';
        heroImg.style.transform = ht; if (heroVid) heroVid.style.transform = ht;
      }
    }
    /* parallax leve: a foto anda um pouco mais devagar que a página */
    pars.forEach(function (el) {
      var r = el.parentNode.getBoundingClientRect();
      if (r.bottom < -100 || r.top > h + 100) return;
      var c = clamp((r.top + r.height / 2 - h / 2) / (h / 2 + r.height / 2), -1, 1);
      el.style.transform = 'translate3d(0,' + (-c * r.height * .055).toFixed(1) + 'px,0)';
    });
    /* convite final: a foto começa emoldurada e se abre até a tela inteira */
    ctas.forEach(function (o) {
      if (!o.c) return;
      var r = o.s.getBoundingClientRect();
      if (r.top > h || r.bottom < 0) return;
      var t = clamp((h - r.top) / (h * .85), 0, 1), e = 1 - Math.pow(1 - t, 3);
      o.c.style.setProperty('--ci', ((1 - e) * 9).toFixed(2) + '%');
      o.c.style.setProperty('--cx', ((1 - e) * 7).toFixed(2) + '%');
      if (o.img) { var ct = 'translate3d(0,' + clamp(r.top * .07, -h * .07, h * .07).toFixed(1) + 'px,0) scale(' + (1.12 - e * .12).toFixed(4) + ')'; o.img.forEach(function (m) { m.style.transform = ct; }); }
    });
    if (mfw.length) {
      var mr = mf.getBoundingClientRect();
      if (mr.top < h && mr.bottom > 0) {
        var lit = Math.round(clamp((h * .85 - mr.top) / (mr.height + h * .3), 0, 1) * (mfw.length + 2));
        if (lit !== mfLit) { mfLit = lit; mfw.forEach(function (s, k) { s.style.color = k < lit ? 'var(--ink)' : ''; }); }
      }
    }
  };
  var kick = function () { if (!ticking) { ticking = true; raf(frame); } };
  addEventListener('scroll', kick, { passive: true });
  addEventListener('resize', kick);
  frame();

  /* rolagem suave no computador (Lenis); no toque do celular a rolagem continua nativa */
  var lenis = null;
  if (window.Lenis && fine && !lite) {
    lenis = new window.Lenis({ lerp: .085, smoothWheel: true, anchors: { offset: -40 } }); window.lenis = lenis;
    var lraf = function (t) { lenis.raf(t); raf(lraf); }; raf(lraf);
    $$('.menu').forEach(function (n) { n.setAttribute('data-lenis-prevent', ''); });
  }

  /* menu do celular */
  var mb = $('#menu-btn'), menu = $('#menu');
  var isOpen = function () { return menu.classList.contains('open'); };
  var setMenu = function (open) {
    menu.classList.toggle('open', open);
    if (open) menu.removeAttribute('inert'); else menu.setAttribute('inert', '');
    mb.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('menu-open', open); nav.classList.remove('hide');
    document.body.style.overflow = open ? 'hidden' : '';
    if (lenis) { if (open) lenis.stop(); else lenis.start(); }
  };
  mb.addEventListener('click', function () { setMenu(!isOpen()); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && isOpen()) { setMenu(false); mb.focus(); } });

  /* revelar */
  var rv = $$('.rv, .rimg, .map, .split');
  if (hasIO && !lite) {
    /* imagens começam recortadas (clip-path) e o navegador as considera invisíveis: observa-se o elemento pai */
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        (e.target.__rv || [e.target]).forEach(function (t) {
          /* a cortina só abre quando a foto já chegou (ou depois de 1,5 s, em rede lenta) */
          var im = t.classList.contains('rimg') && $('img', t);
          if (!im || im.complete) return t.classList.add('in');
          var done = function () { t.classList.add('in'); };
          im.addEventListener('load', done, { once: true }); im.addEventListener('error', done, { once: true });
          setTimeout(done, 1500);
        });
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: .05 });
    rv.forEach(function (t) {
      var o = t.classList.contains('rimg') ? t.parentNode : t;
      (o.__rv = o.__rv || []).push(t);
      io.observe(o);
    });
  } else rv.forEach(function (t) { t.classList.add('in'); });

  /* números que contam até o valor quando aparecem */
  var counts = $$('[data-count]');
  if (counts.length && hasIO && !lite) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        var el = e.target, to = +el.dataset.count, t0 = performance.now(), dur = 1800;
        var step = function (t) {
          var k = clamp((t - t0) / dur, 0, 1), v = 1 - Math.pow(1 - k, 4);
          el.textContent = Math.round(to * v);
          if (k < 1) raf(step);
        };
        raf(step);
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    counts.forEach(function (el) { el.textContent = '0'; cio.observe(el); });
  }

  /* vídeo da abertura: começa depois da entrada e para quando a abertura sai da tela */
  var intro0, heroStarted = false;
  var heroGo = function () {
    if (heroStarted || !heroVid || lite) return;
    heroStarted = true; vplay(heroVid);
    if (hasIO) new IntersectionObserver(function (e) { if (e[0].isIntersecting) vplay(heroVid); else vpause(heroVid); }).observe(heroBox);
  };
  if (!(intro0 = $('#intro')) || !root.classList.contains('intro')) { if (document.readyState === 'complete') setTimeout(heroGo, 300); else addEventListener('load', function () { setTimeout(heroGo, 300); }); }

  /* tela de entrada: conta até 100 enquanto a foto da abertura e as fontes carregam */
  var intro = $('#intro');
  if (intro && root.classList.contains('intro')) {
    if (lenis) lenis.stop();
    var nEl = $('#intro-n'), line = $('#intro-line'), t0 = performance.now(), ready = false, shown = 0;
    var waitImg = heroImg && !heroImg.complete ? new Promise(function (r) { heroImg.addEventListener('load', r, { once: true }); heroImg.addEventListener('error', r, { once: true }); }) : Promise.resolve();
    Promise.all([waitImg, document.fonts ? document.fonts.ready : Promise.resolve()]).then(function () { ready = true; });
    setTimeout(function () { ready = true; }, 6000);
    var tick = function (t) {
      var target = Math.min((t - t0) / 1700, ready ? 1 : .86);
      shown += (target - shown) * .12;
      if (ready && target >= 1 && shown > .995) shown = 1;
      nEl.textContent = ('00' + Math.round(shown * 100)).slice(-3);
      line.style.transform = 'scaleX(' + shown.toFixed(3) + ')';
      if (shown < 1) return raf(tick);
      setTimeout(function () {
        intro.classList.add('out'); root.classList.remove('intro');
        try { sessionStorage.setItem('ha-intro', '1'); } catch (e) {}
        if (lenis) lenis.start();
        setTimeout(heroGo, 700);
        setTimeout(function () { intro.remove(); }, 1400);
      }, 260);
    };
    raf(tick);
  }

  /* cursor contextual: diz o que acontece ao clicar ("Ver", "Arraste", o nome do ambiente) */
  var cur = $('#cursor'), curT = cur && $('span', cur);
  if (cur && fine && !lite) {
    var cx = -200, cy = -200, tx = -200, ty = -200, on = false, moving = false;
    var paint = function () { cur.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0) scale(' + (on ? 1 : 0) + ')'; };
    var step = function () {
      cx += (tx - cx) * .18; cy += (ty - cy) * .18;
      paint();
      if (Math.abs(tx - cx) > .3 || Math.abs(ty - cy) > .3) raf(step); else moving = false;
    };
    var go = function () { if (!moving) { moving = true; raf(step); } };
    document.addEventListener('pointermove', function (e) {
      tx = e.clientX; ty = e.clientY;
      var t = e.target.closest && e.target.closest('[data-cursor]');
      var label = t && !t.closest('.mq-off') ? t.dataset.cursor : '';
      if (label && !on) { cx = tx; cy = ty; }
      if (label && curT.textContent !== label) curT.textContent = label;
      if (!!label !== on) { on = !!label; paint(); }
      if (on) go();
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', function () { on = false; paint(); });
  }

  /* botões magnéticos: acompanham o mouse de leve */
  if (fine && !lite) {
    $$('.mag').forEach(function (m) {
      m.addEventListener('pointermove', function (e) {
        var r = m.getBoundingClientRect();
        m.style.transform = 'translate3d(' + ((e.clientX - r.left - r.width / 2) * .3).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * .3).toFixed(1) + 'px,0)';
      });
      m.addEventListener('pointerleave', function () { m.style.transform = ''; });
    });
  }

  /* faixa: corre sozinha e acelera com a rolagem */
  if (marq && !lite) {
    var mvis = false;
    if (hasIO) new IntersectionObserver(function (e) { mvis = e[0].isIntersecting; if (mvis) raf(mloop); }).observe(marq.parentNode);
    var mloop = function () {
      if (!mvis) return;
      marqV *= .9;
      marqX -= .5 + Math.abs(marqV) * .12;
      if (marqW && marqX <= -marqW) marqX += marqW;
      marq.style.transform = 'translate3d(' + marqX.toFixed(1) + 'px,0,0)';
      raf(mloop);
    };
  }

  /* copiar e-mail */
  $$('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var el = $(btn.dataset.copy); if (!el) return;
      var done = function () { var t = btn.textContent; btn.textContent = 'Copiado'; setTimeout(function () { btn.textContent = t; }, 1600); };
      var sel = function () { var r = document.createRange(); r.selectNodeContents(el); var s = getSelection(); s.removeAllRanges(); s.addRange(r); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(el.textContent).then(done, sel); else sel();
    });
  });

  /* troca de página: uma cortina de papel cobre a tela antes de sair */
  var veil = $('.veil');
  if (veil && !lite) {
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target) return;
      var u = new URL(a.href, location.href);
      if (u.origin !== location.origin || (u.pathname === location.pathname && u.search === location.search)) return;
      e.preventDefault();
      var vb = $('b', veil), sl = /[?&]p=([^&]+)/.exec(u.search), dest = sl && DATA.filter(function (x) { return x.slug === sl[1]; })[0];
      if (vb) vb.innerHTML = dest ? nameH(dest.n) + '<small class="cap">' + dest.loc + ' · ' + dest.area + '</small>' : 'Helena <em>Aragão</em>';
      veil.classList.add('on');
      setTimeout(function () { location.href = u.href; }, 900);
    });
    addEventListener('pageshow', function (e) { if (e.persisted) veil.classList.remove('on'); });
  }

  /* ================= percurso: a rolagem move a câmera ================= */
  var tour = $('#percurso');
  if (tour && !lite) {
    var cv = $('#tour-canvas'), ctx = cv.getContext('2d', { alpha: false });
    var N = +tour.dataset.frames, path = tour.dataset.path;
    var frames = new Array(N), started = false, lastDrawn = -1;
    var chs = $$('#chap li').map(function (el) { return { el: el, w: el.dataset.w.split(',').map(Number) }; });
    var bar = $('#tour-bar'), tn = $('#tour-n');
    var target = 0, cp = 0, busy = false, order = [], seen = {}, qi = 0, active = 0;
    var push = function (n) { if (n >= 0 && n < N && !seen[n]) { seen[n] = 1; order.push(n); } };
    push(0); push(N - 1);
    for (var s = 8; s >= 1; s = s >> 1) for (var k = 0; k < N; k += s) push(k);
    var fmt = function (n) { return path.replace('%03d', ('00' + n).slice(-3)); };
    var pump = function () {
      while (active < 4 && qi < order.length) {
        (function (id) {
          active++;
          var im = new Image(); im.decoding = 'async';
          im.onload = function () {
            frames[id] = im; active--;
            if (!tour.classList.contains('ready')) { cv.width = im.naturalWidth; cv.height = im.naturalHeight; tour.classList.add('ready'); }
            tkick(); pump();
          };
          im.onerror = function () { active--; pump(); };
          im.src = fmt(id + 1);
        })(order[qi++]);
      }
    };
    if (hasIO) new IntersectionObserver(function (e) { if (e[0].isIntersecting && !started) { started = true; pump(); } }, { rootMargin: '1200px 0px' }).observe(tour);
    else { started = true; pump(); }
    var pickFrame = function (q) {
      var fi = Math.round(q * (N - 1));
      if (frames[fi]) return fi;
      for (var d = 1; d < N; d++) { if (frames[fi - d]) return fi - d; if (frames[fi + d]) return fi + d; }
      return -1;
    };
    var loop = function () {
      busy = false;
      var r = tour.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) return;
      target = clamp(-r.top / Math.max(1, r.height - innerHeight), 0, 1);
      cp += (target - cp) * .12; if (Math.abs(target - cp) < .0007) cp = target;
      var fi = pickFrame(cp);
      if (fi >= 0 && fi !== lastDrawn) { lastDrawn = fi; ctx.drawImage(frames[fi], 0, 0, cv.width, cv.height); tn.textContent = pad(fi + 1); }
      chs.forEach(function (c) { c.el.classList.toggle('on', cp >= c.w[0] && cp < c.w[1]); });
      bar.style.transform = 'scaleX(' + cp.toFixed(3) + ')';
      if (cp !== target) tkick();
    };
    var tkick = function () { if (!busy) { busy = true; raf(loop); } };
    addEventListener('scroll', tkick, { passive: true });
    addEventListener('resize', tkick);
    tkick();
  }

  /* ================= animações só de código ================= */
  if (!lite) {
    /* linha de progresso no topo: acompanha a rolagem */
    var prog = document.createElement('div'); prog.className = 'prog'; prog.setAttribute('aria-hidden', 'true'); document.body.appendChild(prog);
    var pf = function () { var m = document.documentElement.scrollHeight - innerHeight; prog.style.transform = 'scaleX(' + (m > 0 ? clamp(scrollY / m, 0, 1) : 0).toFixed(4) + ')'; };
    addEventListener('scroll', pf, { passive: true }); pf();

    /* linhas divisórias que se desenham quando aparecem */
    var rules = $$('.rule, .pc-spec, .nums, .pd-ficha');
    rules.forEach(function (r) { r.classList.add('draw'); });
    if (hasIO) {
      var rio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('drawn'); rio.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
      rules.forEach(function (r) { rio.observe(r); });
    } else rules.forEach(function (r) { r.classList.add('drawn'); });

    /* poeira de luz sobre as fotos grandes: partículas que derivam devagar e se afastam do mouse */
    if (fine) $$('.hero-frame, .film .cta-clip').forEach(function (host) {
      var cv = document.createElement('canvas'); cv.className = 'dust'; cv.setAttribute('aria-hidden', 'true'); host.appendChild(cv);
      var cx2 = cv.getContext('2d'), W = 0, H = 0, N = 70, P = [], mx = -999, my = -999, vis = false, dpr = Math.min(devicePixelRatio || 1, 1.5);
      var size = function () { var r = host.getBoundingClientRect(); W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; cx2.setTransform(dpr, 0, 0, dpr, 0, 0); };
      size(); addEventListener('resize', size);
      for (var i = 0; i < N; i++) P.push({ x: Math.random() * 2000, y: Math.random() * 1200, z: .3 + Math.random() * .9, a: Math.random() * 6.28 });
      host.parentNode.addEventListener('pointermove', function (e) { var r = host.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; }, { passive: true });
      host.parentNode.addEventListener('pointerleave', function () { mx = my = -999; });
      var dl = function (t) {
        if (!vis) return;
        cx2.clearRect(0, 0, W, H);
        P.forEach(function (d) {
          d.a += .004 * d.z; d.x += Math.cos(d.a) * .22 * d.z; d.y -= .12 * d.z;
          if (d.y < -10) { d.y = H + 10; d.x = Math.random() * W; }
          if (d.x < -10) d.x = W + 10; else if (d.x > W + 10) d.x = -10;
          var dx = d.x - mx, dy = d.y - my, q = dx * dx + dy * dy;
          if (q < 14000) { var f = (1 - q / 14000) * 2.2; d.x += dx / Math.sqrt(q + 1) * f; d.y += dy / Math.sqrt(q + 1) * f; }
          var tw = .5 + .5 * Math.sin(t / 700 + d.a * 3);
          cx2.beginPath(); cx2.arc(d.x, d.y, 1 + d.z * 1.6, 0, 6.283);
          cx2.fillStyle = 'rgba(255,240,210,' + (.12 + tw * .4 * d.z).toFixed(3) + ')'; cx2.fill();
        });
        raf(dl);
      };
      if (hasIO) new IntersectionObserver(function (e) { var v = e[0].isIntersecting; if (v && !vis) { vis = true; raf(dl); } vis = v; }).observe(host);
    });
  }

  /* ===== desenho de arquitetura: a fachada se traça sozinha sobre a abertura e some, revelando a foto ===== */
  if (!lite && page !== 'imovel' && heroBox) {
    var NS = 'http://www.w3.org/2000/svg', bp = document.createElementNS(NS, 'svg');
    bp.setAttribute('viewBox', '0 0 160 90'); bp.setAttribute('preserveAspectRatio', 'xMidYMid slice'); bp.setAttribute('class', 'bp'); bp.setAttribute('aria-hidden', 'true');
    var segs = ['M10 74H150', 'M52 74V40L70 22L88 40V74', 'M88 74V50H128V74', 'M44 40H96', 'M88 50L108 36L128 50', 'M60 74V56H72V74', 'M96 74V58H108V74M112 74V58H124V74', 'M55 48H64M76 48H85', 'M10 79H150M30 82H130', 'M4 20V74M2 20H6M2 74H6', 'M52 20H88M52 18V22M88 18V22'];
    bp.innerHTML = segs.map(function (d, i) { return '<path pathLength="1" d="' + d + '" style="--k:' + i + '"/>'; }).join('') + '<text x="52" y="16" class="bpt">ELEVAÇÃO FRONTAL · 1:100</text>';
    heroBox.appendChild(bp);
    var bpGo = function () { bp.classList.add('go'); setTimeout(function () { bp.classList.add('out'); }, 3200); setTimeout(function () { bp.remove(); }, 5200); };
    if (root.classList.contains('intro')) { var wi = setInterval(function () { if (!root.classList.contains('intro')) { clearInterval(wi); setTimeout(bpGo, 500); } }, 200); }
    else setTimeout(bpGo, 600);
  }

  /* ===== linhas que reagem ao mouse no convite final ===== */
  if (!lite && fine) $$('.cta').forEach(function (sec) {
    var host = $('.cta-bg', sec); if (!host) return;
    var cv = document.createElement('canvas'); cv.className = 'wires'; cv.setAttribute('aria-hidden', 'true'); host.appendChild(cv);
    var c2 = cv.getContext('2d'), W = 0, H = 0, mx = .5, my = .5, sx = .5, sy = .5, vis = false, dpr = Math.min(devicePixelRatio || 1, 1.5), ROWS = 26;
    var sz = function () { var r = sec.getBoundingClientRect(); W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; c2.setTransform(dpr, 0, 0, dpr, 0, 0); };
    sz(); addEventListener('resize', sz);
    sec.addEventListener('pointermove', function (e) { var r = sec.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width; my = (e.clientY - r.top) / r.height; }, { passive: true });
    var wl = function (t) {
      if (!vis) return;
      sx += (mx - sx) * .06; sy += (my - sy) * .06;
      c2.clearRect(0, 0, W, H); c2.lineWidth = 1;
      for (var r = 0; r < ROWS; r++) {
        var y0 = (r + .5) / ROWS * H, dy = (y0 / H - sy);
        c2.beginPath();
        for (var x = 0; x <= W; x += 14) {
          var dx = x / W - sx, d = Math.exp(-(dx * dx * 14 + dy * dy * 40));
          var y = y0 + Math.sin(x * .008 + t / 1400 + r * .4) * 3 - dy * d * 70;
          if (x) c2.lineTo(x, y); else c2.moveTo(x, y);
        }
        c2.strokeStyle = 'rgba(244,241,234,' + (.07 + .22 * Math.exp(-dy * dy * 30)).toFixed(3) + ')'; c2.stroke();
      }
      raf(wl);
    };
    if (hasIO) new IntersectionObserver(function (e) { var v = e[0].isIntersecting; if (v && !vis) { vis = true; raf(wl); } vis = v; }).observe(sec);
  });

  /* ===== chegada: a rolagem caminha até a casa (tela cheia, quadro a quadro) ===== */
  var arr = $('#chegada');
  if (arr && !lite) {
    var acv = $('#arr-cv'), actx = acv.getContext('2d', { alpha: false }), AN = +arr.dataset.frames, apath = arr.dataset.path;
    var afr = new Array(AN), astarted = false, alast = -1, aord = [], aseen = {}, aqi = 0, aact = 0, atarget = 0, acp = 0, abusy = false;
    var aw = $$('.arr-w', arr).map(function (el) { return { el: el, w: el.dataset.w.split(',').map(Number) }; });
    var abar = $('#arr-bar'), astill = $('.arr-still', arr);
    var apush = function (n) { if (n >= 0 && n < AN && !aseen[n]) { aseen[n] = 1; aord.push(n); } };
    apush(0); apush(AN - 1);
    for (var st2 = 8; st2 >= 1; st2 = st2 >> 1) for (var kk = 0; kk < AN; kk += st2) apush(kk);
    var apump = function () {
      while (aact < 4 && aqi < aord.length) {
        (function (id) {
          aact++;
          var im = new Image(); im.decoding = 'async';
          im.onload = function () { afr[id] = im; aact--; if (!arr.classList.contains('ready')) { acv.width = im.naturalWidth; acv.height = im.naturalHeight; arr.classList.add('ready'); } akick(); apump(); };
          im.onerror = function () { aact--; apump(); };
          im.src = apath.replace('%03d', ('00' + (id + 1)).slice(-3));
        })(aord[aqi++]);
      }
    };
    if (hasIO) new IntersectionObserver(function (e) { if (e[0].isIntersecting && !astarted) { astarted = true; apump(); } }, { rootMargin: '1500px 0px' }).observe(arr); else { astarted = true; apump(); }
    var apick = function (q) {
      var fi = Math.round(q * (AN - 1));
      if (afr[fi]) return fi;
      for (var d = 1; d < AN; d++) { if (afr[fi - d]) return fi - d; if (afr[fi + d]) return fi + d; }
      return -1;
    };
    var aloop = function () {
      abusy = false;
      var r = arr.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) return;
      atarget = clamp(-r.top / Math.max(1, r.height - innerHeight), 0, 1);
      acp += (atarget - acp) * .14; if (Math.abs(atarget - acp) < .0007) acp = atarget;
      var fi = apick(acp);
      if (fi >= 0 && fi !== alast) { alast = fi; actx.drawImage(afr[fi], 0, 0, acv.width, acv.height); }
      acv.style.transform = astill.style.transform = 'scale(' + (1 + acp * .1).toFixed(4) + ')';
      aw.forEach(function (c) { c.el.classList.toggle('on', acp >= c.w[0] && acp < c.w[1]); });
      abar.style.transform = 'scaleX(' + acp.toFixed(3) + ')';
      if (acp !== atarget) akick();
    };
    var akick = function () { if (!abusy) { abusy = true; raf(aloop); } };
    addEventListener('scroll', akick, { passive: true }); addEventListener('resize', akick); akick();
  }

  /* ===== álbum: a rolagem vertical empurra uma fileira de fotos para o lado ===== */
  var atr = $('#alb-track'), asec = $('#album');
  if (atr && asec) {
    var AL = window.ALBUM || [];
    var bySlug = function (sl) { return DATA.filter(function (x) { return x.slug === sl; })[0] || DATA[0]; };
    atr.innerHTML = '<div class="alb-lead"><p class="lead">Seis recortes de quatro casas. <span class="it">Role para o lado.</span></p></div>' +
      AL.map(function (a, k) {
        var x = bySlug(a.slug);
        return '<a class="alb-i" href="' + href(x) + '" style="--r:' + a.r + '" data-cursor="Ver"><div class="alb-f"><img src="assets/foto/' + a.foto + '-s.webp" srcset="assets/foto/' + a.foto + '-s.webp 900w, assets/foto/' + a.foto + '.webp 1500w" sizes="(max-width:900px) 70vw, 40vw" alt="' + a.leg + ', ' + x.n + '" loading="lazy" decoding="async"></div>' +
          '<p class="alb-c"><i>' + pad(k + 1) + '</i><b>' + a.leg + '</b><span>' + x.n + '</span></p></a>';
      }).join('') + '<a class="alb-end" href="#colecao" data-cursor="Ver"><span class="it">Ver a coleção</span><i aria-hidden="true">→</i></a>';
    if (!lite) {
      var adist = 0;
      var asize = function () { adist = Math.max(0, atr.scrollWidth - innerWidth + parseFloat(getComputedStyle(atr).paddingLeft || 0)); asec.style.height = (adist + innerHeight) + 'px'; };
      asize(); addEventListener('resize', asize); addEventListener('load', asize);
      var aimgs = $$('img', atr); aimgs.forEach(function (im) { im.addEventListener('load', asize); });
      var ascroll = function () {
        var r = asec.getBoundingClientRect();
        if (r.bottom < -100 || r.top > innerHeight + 100) return;
        var q = clamp(-r.top / Math.max(1, r.height - innerHeight), 0, 1);
        atr.style.transform = 'translate3d(' + (-q * adist).toFixed(1) + 'px,0,0)';
        aimgs.forEach(function (im, k) { var b = im.parentNode.getBoundingClientRect(); var c = clamp((b.left + b.width / 2 - innerWidth / 2) / innerWidth, -1, 1); im.style.transform = 'translate3d(' + (c * -6).toFixed(2) + '%,0,0) scale(1.18)'; });
      };
      addEventListener('scroll', ascroll, { passive: true }); addEventListener('resize', ascroll); ascroll();
    }
  }

  /* ===== interação extra: holofote nas seções escuras, inclinação nos cartões, título que segue o mouse ===== */
  if (fine && !lite) {
    $$('.reel, .alb, .arr').forEach(function (sec) {
      sec.addEventListener('pointermove', function (e) { var r = sec.getBoundingClientRect(); sec.style.setProperty('--mx', (e.clientX - r.left) + 'px'); sec.style.setProperty('--my', (e.clientY - r.top) + 'px'); sec.classList.add('lit'); }, { passive: true });
      sec.addEventListener('pointerleave', function () { sec.classList.remove('lit'); });
    });
    $$('.pc-fig, .alb-i, .rl-p').forEach(function (el) {
      var tgt = el.classList.contains('alb-i') ? $('.alb-f', el) : el;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width - .5, ny = (e.clientY - r.top) / r.height - .5;
        tgt.style.transform = 'perspective(1100px) rotateY(' + (nx * 5).toFixed(2) + 'deg) rotateX(' + (-ny * 4).toFixed(2) + 'deg) scale(1.01)';
      }, { passive: true });
      el.addEventListener('pointerleave', function () { tgt.style.transform = ''; });
    });
    var hh = $('.hero-h'), hero0 = $('.hero');
    if (hh && hero0) hero0.addEventListener('pointermove', function (e) {
      var nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5;
      hh.style.setProperty('--tx', (nx * -22).toFixed(1) + 'px'); hh.style.setProperty('--ty', (ny * -14).toFixed(1) + 'px');
      if (heroBox) { heroBox.style.setProperty('--fx', (nx * 14).toFixed(1) + 'px'); heroBox.style.setProperty('--fy', (ny * 10).toFixed(1) + 'px'); }
    }, { passive: true });
  }

  /* ===== amanhecer: a rolagem leva a casa da noite ao dia ===== */
  var ss = function (t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  var rng = function (v, a, b) { return clamp((v - a) / (b - a), 0, 1); };
  var dawn = $('#amanhecer');
  if (dawn && !weak) {
    var dst = $('#dw-st'), dN = $('.dw-n', dawn), dA = $('.dw-a', dawn), dStars = $('.dw-stars', dawn), dSun = $('.dw-sun', dawn), dBeam = $('.dw-beam', dawn);
    var dH = $('#dw-h'), dBar = $('#dw-bar'), dDot = $('#dw-dot');
    var dW = $$('.dw-w', dawn).map(function (el) { return { el: el, w: el.dataset.w.split(',').map(Number) }; });
    var dp = 0, dt = 0, dbusy = false, dmin = -1;
    var dloop = function () {
      dbusy = false;
      var r = dawn.getBoundingClientRect();
      if (r.bottom < -100 || r.top > innerHeight + 100) return;
      dt = clamp(-r.top / Math.max(1, r.height - innerHeight), 0, 1);
      dp += (dt - dp) * .12; if (Math.abs(dt - dp) < .0006) dp = dt;
      var p = dp;
      dN.style.opacity = (1 - ss(rng(p, .14, .48))).toFixed(3);
      dA.style.opacity = (1 - ss(rng(p, .52, .88))).toFixed(3);
      dStars.style.opacity = (1 - ss(rng(p, .04, .32))).toFixed(3);
      dStars.style.transform = 'translate3d(0,' + (p * -40).toFixed(1) + 'px,0)';
      var su = ss(rng(p, .16, .9));
      dSun.style.opacity = (ss(rng(p, .14, .4)) * (1 - .45 * ss(rng(p, .78, 1)))).toFixed(3);
      dSun.style.transform = 'translate3d(0,' + (70 - su * 50).toFixed(2) + 'vh,0) scale(' + (.7 + su * .45).toFixed(3) + ')';
      dBeam.style.opacity = (.9 * ss(rng(p, .26, .38)) * (1 - ss(rng(p, .7, .86)))).toFixed(3);
      dBeam.style.transform = 'translate3d(' + (-55 + ss(rng(p, .24, .84)) * 110).toFixed(1) + '%,0,0)';
      dst.style.transform = 'scale(' + (1.12 - ss(p) * .12).toFixed(4) + ') translate3d(0,' + (ss(p) * -1.2).toFixed(2) + '%,0)';
      var mins = Math.round(310 + p * 150);
      if (mins !== dmin) { dmin = mins; dH.textContent = pad(Math.floor(mins / 60)) + ':' + pad(mins % 60); }
      dBar.style.transform = 'scaleX(' + p.toFixed(3) + ')';
      dDot.style.left = (p * 100).toFixed(2) + '%';
      dW.forEach(function (c) { c.el.classList.toggle('on', p >= c.w[0] && p < c.w[1]); });
      if (dp !== dt) dkick();
    };
    var dkick = function () { if (!dbusy) { dbusy = true; raf(dloop); } };
    addEventListener('scroll', dkick, { passive: true }); addEventListener('resize', dkick); dkick();
  } else if (dawn) $$('.dw-w', dawn).forEach(function (el) { el.classList.add('on'); });

  /* ===== do alto: o filme começa como uma janela e se abre até a tela inteira ===== */
  var xp = $('#do-alto');
  if (xp && !weak) {
    var xm = $('#xp-m'), xfr = $('#xp-fr'), xbg = $('.xp-bg', xp), xa = $('.xp-a', xp), xb = $('.xp-b', xp), xka = $('.xp-ka', xp), xkb = $('.xp-kb', xp), xc = $('.xp-c', xp), xv = $('.xp-v', xp);
    var xpP = 0, xpT = 0, xbusy = false, xplaying = false;
    var xloop = function () {
      xbusy = false;
      var r = xp.getBoundingClientRect(), W = innerWidth, H = innerHeight;
      var vis = r.bottom > 0 && r.top < H;
      if (!vis) { if (xplaying) { vpause(xv); xplaying = false; } if (r.bottom < -100 || r.top > H + 100) return; }
      xpT = clamp(-r.top / Math.max(1, r.height - H), 0, 1);
      xpP += (xpT - xpP) * .14; if (Math.abs(xpT - xpP) < .0006) xpP = xpT;
      var e = ss(rng(xpP, 0, .78)), mob = W < 760;
      var w0 = mob ? W * .72 : Math.min(W * .3, 460), h0 = mob ? H * .44 : Math.min(H * .52, 560);
      var it = ((H - h0) / 2) * (1 - e), il = ((W - w0) / 2) * (1 - e);
      xm.style.clipPath = 'inset(' + it.toFixed(1) + 'px ' + il.toFixed(1) + 'px)';
      xfr.style.inset = it.toFixed(1) + 'px ' + il.toFixed(1) + 'px';
      xfr.style.opacity = (1 - ss(rng(xpP, .62, .8))).toFixed(3);
      xbg.style.opacity = (1 - e).toFixed(3);
      var tx = e * (mob ? 110 : 80);
      xa.style.opacity = xb.style.opacity = (1 - ss(rng(xpP, .5, .76))).toFixed(3);
      xka.style.top = xkb.style.top = (H / 2 + h0 / 2 + 18) + 'px';
      xa.style.transform = 'translate3d(' + (-tx).toFixed(2) + 'vw,0,0)';
      xb.style.transform = 'translate3d(' + tx.toFixed(2) + 'vw,0,0)';
      xka.style.transform = 'translate3d(calc(-100% - ' + (tx * .8).toFixed(2) + 'vw),0,0)';
      xkb.style.transform = 'translate3d(' + (tx * .8).toFixed(2) + 'vw,0,0)';
      xka.style.opacity = xkb.style.opacity = (.85 * (1 - ss(rng(xpP, .2, .55)))).toFixed(3);
      xc.classList.toggle('on', xpP > .8);
      if (vis && !xplaying) { vplay(xv); xplaying = true; }
      if (xpP !== xpT) xkick();
    };
    var xkick = function () { if (!xbusy) { xbusy = true; raf(xloop); } };
    addEventListener('scroll', xkick, { passive: true }); addEventListener('resize', xkick); xkick();
  }
})();
