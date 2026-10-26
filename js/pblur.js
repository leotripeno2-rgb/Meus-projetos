/* Desfoque progressivo: as fotos de [data-pb] ficam nítidas no meio da tela e se desfazem perto das bordas de cima e de baixo,
   com um grão de filme leve. Adaptado de "WebGL Progressive Blur" (Jorge Toloza / Codrops, licença MIT), reescrito em WebGL puro
   (sem OGL) e com menos amostras para rodar bem em computador comum. Celular fraco ou sem WebGL: fotos normais. */
(function () {
  var root = document.documentElement;
  if (root.classList.contains('weak') || root.classList.contains('lite')) return;
  var els = [].slice.call(document.querySelectorAll('[data-pb]'));
  if (!els.length) return;
  var cv = document.createElement('canvas'); cv.className = 'pb-cv'; cv.setAttribute('aria-hidden', 'true');
  var gl = cv.getContext('webgl', { premultipliedAlpha: false, antialias: false, alpha: true });
  if (!gl) return;
  document.body.appendChild(cv);

  var VS = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  var FS = [
    'precision mediump float;',
    'uniform sampler2D t;uniform vec2 img;uniform vec2 pl;uniform float vh;uniform float time;uniform float k;',
    'varying vec2 v;',
    'float rnd(vec2 c){return fract(sin(dot(c,vec2(12.9898,78.233)))*43758.5453);}',
    'void main(){',
    '  vec2 r=vec2(min((pl.x/pl.y)/(img.x/img.y),1.),min((pl.y/pl.x)/(img.y/img.x),1.));',
    '  vec2 uv=vec2(v.x*r.x+(1.-r.x)*.5,(1.-v.y)*r.y+(1.-r.y)*.5);',
    '  float y=gl_FragCoord.y/vh;',
    '  float g=smoothstep(.42,.0,y)+smoothstep(.58,1.,y);',
    '  float rad=g*g*k*.055;',
    '  vec3 c=vec3(0.);',
    '  float a0=rnd(gl_FragCoord.xy)*6.2831;',
    '  for(int i=0;i<20;i++){',
    '    float f=float(i);',
    '    float a=a0+f*2.39996;',
    '    float d=sqrt((f+.5)/20.)*rad;',
    '    c+=texture2D(t,uv+vec2(cos(a),sin(a))*d*vec2(pl.y/pl.x,1.)).rgb;',
    '  }',
    '  c/=20.;',
    '  float n=rnd(uv*vec2(913.,577.)+time);',
    '  c-=(n-.5)*.07;',
    '  gl_FragColor=vec4(c,1.);',
    '}'
  ].join('\n');
  var sh = function (type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  var prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { cv.remove(); return; }
  gl.useProgram(prog);
  var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  var U = {}; ['t', 'img', 'pl', 'vh', 'time', 'k'].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
  gl.uniform1i(U.t, 0);

  var dpr = Math.min(devicePixelRatio || 1, 1.5), W = 0, H = 0, time = 0, running = false, visible = 0;
  var items = els.map(function (el) {
    var im = el.querySelector('img'), it = { el: el, img: im, tex: null, w: 1, h: 1, k: 1 };
    var load = function () {
      var src = im.currentSrc || im.src, I = new Image();
      I.onload = function () {
        it.tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, it.tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, I);
        it.w = I.naturalWidth; it.h = I.naturalHeight; el.classList.add('pb-on'); kick();
      };
      I.src = src;
    };
    if (im.complete && im.naturalWidth) load(); else im.addEventListener('load', load, { once: true });
    return it;
  });

  var size = function () {
    W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  };
  var draw = function () {
    running = false;
    if (!visible) { cv.style.visibility = 'hidden'; return; }
    cv.style.visibility = 'visible';
    time += .016;
    gl.viewport(0, 0, cv.width, cv.height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(U.vh, cv.height); gl.uniform1f(U.time, time % 100);
    gl.enable(gl.SCISSOR_TEST);
    items.forEach(function (it) {
      if (!it.tex) return;
      var r = it.el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > H || r.width < 2) return;
      var x = Math.round(r.left * dpr), y = Math.round((H - r.bottom) * dpr), w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
      gl.viewport(x, y, w, h); gl.scissor(Math.max(0, x), Math.max(0, y), w, h);
      gl.bindTexture(gl.TEXTURE_2D, it.tex);
      gl.uniform2f(U.img, it.w, it.h); gl.uniform2f(U.pl, r.width, r.height); gl.uniform1f(U.k, 1);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    });
    gl.disable(gl.SCISSOR_TEST);
    kick();
  };
  var kick = function () { if (!running) { running = true; requestAnimationFrame(draw); } };

  size(); addEventListener('resize', function () { size(); kick(); });
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { e.target.__v = e.isIntersecting; });
    visible = els.some(function (el) { return el.__v; }) ? 1 : 0;
    if (visible) kick();
  });
  els.forEach(function (el) { io.observe(el); });
})();
