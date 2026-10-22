// Página de Fluye: entradas al hacer scroll, capturas que se van alternando y un Play de verdad en miniatura.
const quieto = window.matchMedia('(prefers-reduced-motion: reduce)');

// ---------- entradas: cada parte de una sección aparece un poco después de la anterior ----------
const partes = [...document.querySelectorAll('[data-entra]')];
const porSeccion = new Map();
for (const p of partes) {
  const s = p.closest('section, footer, main');
  const n = porSeccion.get(s) || 0;
  p.style.setProperty('--i', n);
  porSeccion.set(s, n + 1);
}
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entradas) => {
    for (const e of entradas) if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -8% 0px' });
  partes.forEach((p) => io.observe(p));
} else partes.forEach((p) => p.classList.add('visto'));

// ---------- portada: el editor, el Play y la galería se alternan despacio ----------
const pantallas = [...document.querySelectorAll('.pantalla')];
let actual = 0;
setInterval(() => {
  if (document.hidden || quieto.matches || pantallas.length < 2) return;
  pantallas[actual].classList.remove('activa');
  actual = (actual + 1) % pantallas.length;
  pantallas[actual].classList.add('activa');
}, 5600);

// ---------- el Play en miniatura: el mismo proceso de la captura, con decisión ----------
const NS = 'http://www.w3.org/2000/svg';
const NODOS = {
  inicio: { tipo: 'inicio', texto: 'Necesita comprar algo' },
  completar: { tipo: 'tarea', texto: 'Completar la solicitud' },
  revisar: { tipo: 'tarea', texto: 'Revisar la solicitud' },
  decision: { tipo: 'decision', texto: '¿Se aprueba?' },
  enviar: { tipo: 'tarea', texto: 'Enviar a compras' },
  fin: { tipo: 'fin', texto: 'Solicitud aprobada' },
  ajustar: { tipo: 'tarea', texto: 'Ajustar la solicitud' }
};
const SIGUIENTE = { inicio: 'completar', completar: 'revisar', revisar: 'decision', enviar: 'fin', ajustar: 'completar' };
// Dos dibujos del mismo proceso: a lo ancho en pantallas grandes y hacia abajo en el celular.
const DIBUJOS = {
  ancho: {
    caja: [900, 290],
    lugar: { inicio: [40, 100], completar: [175, 100], revisar: [345, 100], decision: [505, 100], enviar: [655, 100], fin: [820, 100], ajustar: [505, 232] },
    flechas: {
      'inicio>completar': [[58, 100], [120, 100]], 'completar>revisar': [[230, 100], [290, 100]], 'revisar>decision': [[400, 100], [481, 100]],
      'decision>enviar': [[529, 100], [600, 100]], 'enviar>fin': [[710, 100], [802, 100]], 'decision>ajustar': [[505, 124], [505, 210]],
      'ajustar>completar': [[450, 232], [175, 232], [175, 122]]
    },
    nombres: { 'decision>enviar': [548, 90], 'decision>ajustar': [515, 160] },
    etiquetaDecision: [505, 62]
  },
  alto: {
    caja: [340, 690],
    lugar: { inicio: [110, 40], completar: [110, 140], revisar: [110, 260], decision: [110, 380], enviar: [110, 500], fin: [110, 620], ajustar: [262, 380] },
    flechas: {
      'inicio>completar': [[110, 58], [110, 118]], 'completar>revisar': [[110, 162], [110, 238]], 'revisar>decision': [[110, 282], [110, 356]],
      'decision>enviar': [[110, 404], [110, 478]], 'enviar>fin': [[110, 522], [110, 602]], 'decision>ajustar': [[134, 380], [207, 380]],
      'ajustar>completar': [[262, 358], [262, 140], [165, 140]]
    },
    nombres: { 'decision>enviar': [120, 432], 'decision>ajustar': [150, 370] },
    etiquetaDecision: [80, 384]
  }
};

const seccion = document.querySelector('#play');
const svg = document.querySelector('#mini');
const boton = document.querySelector('.play-boton');
const palabra = document.querySelector('.play-palabra');
const lista = document.querySelector('.bitacora ol');
const eleccion = document.querySelector('.eleccion');
const celular = window.matchMedia('(max-width: 640px)');

let dibujo, figuras = {}, flechas = {}, ficha;
let estado = 'pausa', donde = 'inicio', fase = 0, corriendo = false, turno = 0;

function el(tag, attrs, padre) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (padre) padre.appendChild(n);
  return n;
}

// Texto en una o dos líneas (corta en el espacio más cercano a la mitad).
function texto(padre, x, y, contenido, opciones = {}) {
  const t = el('text', { x, y, 'text-anchor': opciones.ancla || 'middle', 'font-size': opciones.tamano || 13, fill: '#0f172a', 'font-weight': opciones.peso || 400 }, padre);
  const palabras = contenido.split(' ');
  let lineas = [contenido];
  if (opciones.partir && contenido.length > 13 && palabras.length > 1) {
    let mejor = 1, dif = Infinity;
    for (let i = 1; i < palabras.length; i++) { const d = Math.abs(palabras.slice(0, i).join(' ').length - contenido.length / 2); if (d < dif) { dif = d; mejor = i; } }
    lineas = [palabras.slice(0, mejor).join(' '), palabras.slice(mejor).join(' ')];
  }
  lineas.forEach((l, i) => { const s = el('tspan', { x, dy: i === 0 ? (lineas.length > 1 ? '-0.35em' : '0.35em') : '1.25em' }, t); s.textContent = l; });
  return t;
}

function dibujar() {
  dibujo = celular.matches ? DIBUJOS.alto : DIBUJOS.ancho;
  const [w, h] = dibujo.caja;
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.replaceChildren();
  figuras = {}; flechas = {};
  const defs = el('defs', {}, svg);
  // Tamaño fijo (no crece con el grosor de la flecha recorrida).
  const punta = el('marker', { id: 'punta', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 10, markerHeight: 10, markerUnits: 'userSpaceOnUse', orient: 'auto-start-reverse' }, defs);
  el('path', { d: 'M0 0L10 5L0 10z', fill: '#334155' }, punta);
  for (const [clave, puntos] of Object.entries(dibujo.flechas)) {
    flechas[clave] = el('polyline', { points: puntos.map((p) => p.join(',')).join(' '), fill: 'none', stroke: '#334155', 'stroke-width': 1.6, 'marker-end': 'url(#punta)' }, svg);
  }
  for (const [clave, [x, y]] of Object.entries(dibujo.nombres)) texto(svg, x, y, clave.endsWith('enviar') ? 'Sí' : 'No', { tamano: 12, ancla: 'start' });
  for (const [id, nodo] of Object.entries(NODOS)) {
    const [x, y] = dibujo.lugar[id];
    const g = el('g', { class: 'nodo' }, svg);
    if (nodo.tipo === 'tarea') {
      el('rect', { x: x - 55, y: y - 22, width: 110, height: 44, rx: 7, fill: '#eef2ff', stroke: '#1e3a8a', 'stroke-width': 1.6 }, g);
      texto(g, x, y, nodo.texto, { partir: true, tamano: 12 });
    } else if (nodo.tipo === 'decision') {
      el('path', { d: `M${x} ${y - 24}L${x + 24} ${y}L${x} ${y + 24}L${x - 24} ${y}Z`, fill: '#fef9c3', stroke: '#a16207', 'stroke-width': 1.6 }, g);
      const [lx, ly] = dibujo.etiquetaDecision;
      texto(svg, lx, ly, nodo.texto, { tamano: 12, ancla: celular.matches ? 'end' : 'middle' });
    } else {
      el('circle', { cx: x, cy: y, r: 18, fill: nodo.tipo === 'inicio' ? '#ecfccb' : '#fecaca', stroke: nodo.tipo === 'inicio' ? '#4d7c0f' : '#991b1b', 'stroke-width': nodo.tipo === 'inicio' ? 1.8 : 3 }, g);
      if (celular.matches) texto(svg, x + 30, y, nodo.texto, { tamano: 12, ancla: 'start' });
      else texto(svg, x, y + 36, nodo.texto, { partir: true, tamano: 12 });
    }
    figuras[id] = g;
  }
  ficha = el('g', { class: 'ficha' }, svg);
  el('circle', { r: 12, fill: '#60a5fa', opacity: 0.35 }, ficha);
  el('circle', { r: 7, fill: '#1e3a8a' }, ficha);
  ponerFicha(dibujo.lugar[donde]);
}

function ponerFicha([x, y]) { ficha.setAttribute('transform', `translate(${x} ${y})`); }

function marcar(id, color) {
  const forma = figuras[id] && figuras[id].firstChild;
  if (!forma) return;
  forma.setAttribute('stroke', color);
  forma.setAttribute('stroke-width', 3);
}

function anotar(numero, textoNota, clase = '') {
  const li = document.createElement('li');
  if (clase) li.className = clase;
  const b = document.createElement('b');
  b.textContent = numero;
  li.append(b, document.createTextNode(textoNota));
  lista.appendChild(li);
  lista.scrollTop = lista.scrollHeight;
}

function cambiarEstado(nuevo) {
  estado = nuevo;
  seccion.dataset.estado = nuevo;
  const textos = { pausa: ['Pulsa', 'Reproducir'], corriendo: ['Así fluye el', 'Pausa'], decision: ['Tú decides en el', 'Pausa'], fin: ['Llegó al final del', 'Otra vez'] };
  palabra.textContent = textos[nuevo][0];
  boton.querySelector('span').textContent = textos[nuevo][1];
  boton.setAttribute('aria-pressed', String(nuevo === 'corriendo' || nuevo === 'decision'));
  boton.setAttribute('aria-label', `${textos[nuevo][1]} el recorrido`);
}

// Mueve la ficha por la flecha; con movimiento reducido, salta al final.
function recorrer(clave, miTurno) {
  const puntos = dibujo.flechas[clave];
  flechas[clave].setAttribute('stroke', '#1e3a8a');
  flechas[clave].setAttribute('stroke-width', 3);
  if (quieto.matches) { ponerFicha(puntos[puntos.length - 1]); return Promise.resolve(); }
  const tramos = puntos.slice(1).map((p, i) => Math.hypot(p[0] - puntos[i][0], p[1] - puntos[i][1]));
  const total = tramos.reduce((a, b) => a + b, 0);
  const duracion = Math.max(380, total / 0.32);
  return new Promise((listo) => {
    const t0 = performance.now();
    const cuadro = (t) => {
      if (miTurno !== turno) return listo();
      let falta = Math.min(1, (t - t0) / duracion) * total, i = 0;
      while (i < tramos.length - 1 && falta > tramos[i]) { falta -= tramos[i]; i++; }
      const a = puntos[i], b = puntos[i + 1], r = tramos[i] ? falta / tramos[i] : 1;
      ponerFicha([a[0] + (b[0] - a[0]) * r, a[1] + (b[1] - a[1]) * r]);
      if (t - t0 < duracion) requestAnimationFrame(cuadro); else listo();
    };
    requestAnimationFrame(cuadro);
  });
}

const esperar = (ms) => new Promise((r) => setTimeout(r, quieto.matches ? 0 : ms));

function llegar(id) {
  donde = id;
  const nodo = NODOS[id];
  if (nodo.tipo === 'decision') { anotar('?', `Decisión: ${nodo.texto}`, 'decision'); marcar(id, '#f59e0b'); return; }
  fase++;
  if (nodo.tipo === 'fin') { anotar(fase, `Fin: ${nodo.texto}`, 'fin'); marcar(id, '#dc2626'); return; }
  anotar(fase, nodo.texto, nodo.tipo === 'inicio' ? 'inicio' : '');
  marcar(id, '#16a34a');
}

async function avanzar() {
  if (corriendo) return;
  corriendo = true;
  const miTurno = turno;
  while (estado === 'corriendo' && miTurno === turno) {
    if (donde === 'decision') { mostrarEleccion(); cambiarEstado('decision'); break; }
    if (donde === 'fin') { cambiarEstado('fin'); break; }
    const destino = SIGUIENTE[donde];
    await recorrer(`${donde}>${destino}`, miTurno);
    if (miTurno !== turno) break;
    llegar(destino);
    await esperar(420);
  }
  corriendo = false;
}

function mostrarEleccion() {
  const [x, y] = dibujo.lugar.decision;
  const caja = svg.getBoundingClientRect(), panel = svg.parentElement.getBoundingClientRect();
  const escala = caja.width / dibujo.caja[0];
  let izquierda = caja.left - panel.left + (x + 40) * escala;
  let arriba = caja.top - panel.top + (y - 14) * escala;
  izquierda = Math.max(10, Math.min(izquierda, panel.width - 246));
  eleccion.style.left = `${izquierda}px`;
  eleccion.style.top = `${arriba}px`;
  eleccion.hidden = false;
  eleccion.querySelector('button').focus({ preventScroll: true });
}

function elegir(camino) {
  if (estado !== 'decision') return;
  eleccion.hidden = true;
  const destino = camino === 'si' ? 'enviar' : 'ajustar';
  anotar('◆', `¿Se aprueba? → ${camino === 'si' ? 'Sí' : 'No'}`, 'decision');
  cambiarEstado('corriendo');
  const miTurno = turno;
  corriendo = true;
  recorrer(`decision>${destino}`, miTurno).then(async () => {
    corriendo = false;
    if (miTurno !== turno) return;
    llegar(destino);
    await esperar(420);
    avanzar();
  });
}

function reiniciar() {
  turno++;
  corriendo = false;
  donde = 'inicio';
  fase = 0;
  eleccion.hidden = true;
  lista.replaceChildren();
  dibujar();
  llegar('inicio');
  cambiarEstado('pausa');
}

boton.addEventListener('click', () => {
  if (estado === 'fin') { reiniciar(); cambiarEstado('corriendo'); avanzar(); return; }
  if (estado === 'corriendo') { turno++; corriendo = false; cambiarEstado('pausa'); return; }
  if (estado === 'decision') { eleccion.querySelector('button').focus(); return; }
  cambiarEstado('corriendo');
  avanzar();
});
eleccion.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) elegir(b.dataset.camino); });
document.querySelector('.reiniciar').addEventListener('click', reiniciar);
celular.addEventListener('change', reiniciar);

dibujar();
llegar('inicio');
cambiarEstado('pausa');
