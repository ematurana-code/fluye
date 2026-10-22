// Sitio de Fluye: flechas y ficha del diagrama de carriles de la portada, y filtro por nivel de las plantillas.
const quieto = window.matchMedia('(prefers-reduced-motion: reduce)');
const NS = 'http://www.w3.org/2000/svg';

// ---------- "Así se trabaja con Fluye": flechas entre las figuras y una ficha que avanza al bajar ----------
const piscina = document.querySelector('[data-piscina]');
if (piscina) {
  const svg = piscina.querySelector('.flechas');
  const FLUJOS = [['s', 'a'], ['a', 'b'], ['b', 'c'], ['c', 'e'], ['e', 'g'], ['g', 'f', 'Sí'], ['f', 'z'], ['g', 'h', 'No'], ['h', 'b']];
  const CAMINO = ['s', 'a', 'b', 'c', 'e', 'g', 'f', 'z']; // el recorrido de la ficha
  const nodo = (id) => piscina.querySelector(`[data-id="${id}"]`);
  const figura = (id) => nodo(id).querySelector('.evento, .rombo') || nodo(id);
  let recorrido = null, llegadas = [], ficha = null;

  const el = (tag, attrs) => { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); return n; };

  // Caja de una figura respecto de la piscina.
  const caja = (id) => {
    const r = figura(id).getBoundingClientRect(), p = piscina.getBoundingClientRect();
    return { x: r.left - p.left, y: r.top - p.top, w: r.width, h: r.height, cx: r.left - p.left + r.width / 2, cy: r.top - p.top + r.height / 2 };
  };

  // Recorrido en ángulos rectos de una figura a otra, como las flechas de Fluye.
  // Si las figuras se enfrentan (comparten altura o ancho), la flecha va recta por la parte común; si no, en L.
  function ruta(a, b) {
    const arriba = Math.max(a.y, b.y), abajo = Math.min(a.y + a.h, b.y + b.h);
    if (abajo - arriba > 8) {
      const y = (arriba + abajo) / 2, der = b.cx > a.cx;
      return [[der ? a.x + a.w : a.x, y], [der ? b.x : b.x + b.w, y]];
    }
    const izq = Math.max(a.x, b.x), der = Math.min(a.x + a.w, b.x + b.w);
    const baja = b.cy > a.cy;
    const y1 = baja ? a.y + a.h : a.y, y2 = baja ? b.y : b.y + b.h;
    if (der - izq > 8) { const x = (izq + der) / 2; return [[x, y1], [x, y2]]; }
    const medio = (y1 + y2) / 2;
    return [[a.cx, y1], [a.cx, medio], [b.cx, medio], [b.cx, y2]];
  }

  const d = (puntos) => puntos.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  function punta([x1, y1], [x2, y2]) {
    const ang = Math.atan2(y2 - y1, x2 - x1), l = 9, a = 0.45;
    return `M${x2} ${y2}L${x2 - l * Math.cos(ang - a)} ${y2 - l * Math.sin(ang - a)}L${x2 - l * Math.cos(ang + a)} ${y2 - l * Math.sin(ang + a)}Z`;
  }

  function dibujar() {
    svg.replaceChildren();
    const angosto = getComputedStyle(piscina).display === 'flex';
    const flujos = angosto ? CAMINO.slice(1).map((id, i) => [CAMINO[i], id, CAMINO[i] === 'g' ? 'Sí' : '']) : FLUJOS;
    for (const [de, a, etiqueta] of flujos) {
      const puntos = ruta(caja(de), caja(a));
      svg.append(el('path', { d: d(puntos) }));
      svg.append(el('path', { d: punta(puntos[puntos.length - 2], puntos[puntos.length - 1]), style: 'fill:#334155;stroke:none' }));
      if (etiqueta) {
        const [x, y] = puntos[0], vertical = puntos[0][0] === puntos[1][0];
        const t = el('text', { x: vertical ? x + 8 : x + 6, y: vertical ? (puntos[0][1] < puntos[1][1] ? y + 16 : y - 8) : y - 8 });
        t.textContent = etiqueta;
        svg.append(t);
      }
    }
    // Un solo trazo con todo el camino de la ficha, para ubicarla por distancia.
    const tramos = CAMINO.slice(1).map((id, i) => ruta(caja(CAMINO[i]), caja(id)));
    recorrido = el('path', { d: tramos.map(d).join(' '), style: 'stroke:none' });
    svg.append(recorrido);
    let largo = 0;
    llegadas = tramos.map((t, i) => {
      for (let k = 1; k < t.length; k++) largo += Math.hypot(t[k][0] - t[k - 1][0], t[k][1] - t[k - 1][1]);
      return { id: CAMINO[i + 1], en: largo };
    });
    ficha = el('g', { class: 'ficha' });
    ficha.append(el('circle', { r: 12, class: 'ficha-halo' }), el('circle', { r: 7, class: 'ficha-punto' }));
    svg.append(ficha);
    avanzar();
  }

  // La ficha recorre el camino mientras la sección pasa por la pantalla; lo ya recorrido queda en verde, como en el Play.
  function avanzar() {
    if (!recorrido || !ficha) return;
    if (quieto.matches) { ficha.style.display = 'none'; return; }
    const r = piscina.getBoundingClientRect(), alto = window.innerHeight;
    const avance = Math.min(1, Math.max(0, (alto * 0.75 - r.top) / (r.height + alto * 0.25)));
    const total = llegadas.length ? llegadas[llegadas.length - 1].en : 0;
    const p = recorrido.getPointAtLength(avance * total);
    ficha.setAttribute('transform', `translate(${p.x} ${p.y})`);
    for (const { id, en } of llegadas) nodo(id).classList.toggle('hecho', avance * total >= en - 1);
    nodo('s').classList.toggle('hecho', avance > 0);
  }

  let pendiente = false;
  window.addEventListener('scroll', () => {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(() => { pendiente = false; avanzar(); });
  }, { passive: true });
  new ResizeObserver(dibujar).observe(piscina);
  if (document.fonts) document.fonts.ready.then(dibujar);
}

// ---------- plantillas: filtrar por nivel ----------
const niveles = document.querySelector('.niveles');
if (niveles) {
  niveles.addEventListener('click', (e) => {
    const boton = e.target.closest('.nivel');
    if (!boton) return;
    const nivel = boton.dataset.nivel;
    for (const b of niveles.querySelectorAll('.nivel')) {
      const activo = b === boton;
      b.classList.toggle('activo', activo);
      b.setAttribute('aria-pressed', String(activo));
    }
    for (const li of document.querySelectorAll('.area li[data-nivel]')) li.hidden = !!nivel && li.dataset.nivel !== nivel;
    for (const area of document.querySelectorAll('.area')) area.hidden = !area.querySelector('li[data-nivel]:not([hidden])');
  });
}
