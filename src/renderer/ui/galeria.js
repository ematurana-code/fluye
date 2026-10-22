// Galería de plantillas (Nuevo → Desde plantilla): procesos prearmados para partir de una base.
// Se filtra por nivel y por área; cada nivel se reconoce por un dibujo de su estructura (un pool, carriles,
// varios pools que se comunican). Elegir una plantilla la abre como proceso nuevo sin guardar.
// Textos del catálogo siempre con textContent; los dibujos y vistas previas son contenido fijo de Fluye.
import { icono } from '../iconos.js';
import { modal } from './dialogos.js';

export const NIVELES = [
  { id: 'simple', nombre: 'Simple', detalle: 'Un pool, pocos pasos y una decisión' },
  { id: 'intermedia', nombre: 'Intermedia', detalle: 'Varios carriles, vueltas atrás y paralelos' },
  { id: 'avanzada', nombre: 'Avanzada', detalle: 'Varios pools que se mandan mensajes' }
];

// Dibujo de cada nivel: la forma que tienen sus diagramas.
const GLIFOS = {
  todos: '<rect x="2" y="3" width="10" height="6" rx="1"/><rect x="16" y="3" width="10" height="6" rx="1"/><rect x="2" y="12" width="10" height="6" rx="1"/><rect x="16" y="12" width="10" height="6" rx="1"/>',
  simple: '<rect x="1.5" y="3" width="25" height="15" rx="1.5"/><path d="M6 3v15"/>',
  intermedia: '<rect x="1.5" y="3" width="25" height="15" rx="1.5"/><path d="M6 3v15M6 8h20.5M6 13h20.5"/>',
  avanzada: '<rect x="1.5" y="1.5" width="25" height="6.5" rx="1.2"/><path d="M6 1.5V8"/><rect x="1.5" y="13" width="25" height="6.5" rx="1.2"/><path d="M6 13v6.5"/><path d="M18 8.6v3.6" stroke-dasharray="1.6 1.4"/><path d="m16.6 10.9 1.4 1.5 1.4-1.5"/>'
};
const glifo = (id) => `<svg class="fl-glifo-nivel" viewBox="0 0 28 21" width="28" height="21" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${GLIFOS[id]}</svg>`;

const el = (tag, clase, texto) => {
  const n = document.createElement(tag);
  if (clase) n.className = clase;
  if (texto !== undefined) n.textContent = texto;
  return n;
};

/**
 * @param {{ id, nombre, categoria, nivel, descripcion, incluye, vista }[]} plantillas
 * @param {(p, destino: 'proyecto' | 'pestana') => void} alElegir
 */
export function abrirGaleria(plantillas, alElegir) {
  if (document.querySelector('.fl-galeria')) return; // ya está abierta
  const filtro = { nivel: 'todos', area: 'todas' };
  let destino = 'proyecto'; // abrir como proyecto nuevo o agregar como pestaña del proyecto abierto
  // Áreas en orden alfabético y, dentro de cada una, de la más simple a la más avanzada.
  const nivelDe = (p) => NIVELES.findIndex((n) => n.id === p.nivel);
  const ordenadas = [...plantillas].sort((a, b) => a.categoria.localeCompare(b.categoria, 'es') || nivelDe(a) - nivelDe(b));
  const areas = [...new Set(ordenadas.map((p) => p.categoria))];

  const fondo = el('div', 'modal-overlay fl-galeria-fondo');
  const caja = el('div', 'fl-galeria');
  caja.setAttribute('role', 'dialog');
  caja.setAttribute('aria-modal', 'true');
  caja.setAttribute('aria-labelledby', 'fl-galeria-titulo');

  const cabecera = el('header', 'fl-galeria-cabecera');
  const titulos = el('div');
  const h = el('h2', 'fl-galeria-titulo', 'Empezar desde una plantilla');
  h.id = 'fl-galeria-titulo';
  titulos.append(h, el('p', 'fl-galeria-bajada', 'Elige un proceso armado y ajústalo a tu forma de trabajar. La plantilla original no cambia.'));
  const selector = el('div', 'fl-galeria-destino');
  const opciones = el('div', 'fl-galeria-destino-opciones');
  opciones.setAttribute('role', 'radiogroup');
  opciones.setAttribute('aria-label', 'Abrir como');
  const botonesDestino = [['proyecto', 'Proyecto nuevo'], ['pestana', 'Pestaña en este proyecto']].map(([id, texto]) => {
    const b = el('button', '', texto);
    b.type = 'button';
    b.setAttribute('role', 'radio');
    b.addEventListener('click', () => { destino = id; pintarDestino(); });
    opciones.append(b);
    return [id, b];
  });
  const pintarDestino = () => {
    for (const [id, b] of botonesDestino) { b.classList.toggle('activo', id === destino); b.setAttribute('aria-checked', String(id === destino)); }
  };
  pintarDestino();
  selector.append(el('span', 'fl-galeria-destino-titulo', 'Abrir como'), opciones);
  titulos.append(selector);
  const cerrarBtn = el('button', 'fl-btn fl-btn-icono fl-galeria-cerrar');
  cerrarBtn.type = 'button';
  cerrarBtn.setAttribute('aria-label', 'Cerrar');
  cerrarBtn.innerHTML = icono('cerrar', 18); // ícono fijo del código
  cabecera.append(titulos, cerrarBtn);

  // Filtros: nivel (con su dibujo) y área.
  const filtros = el('nav', 'fl-galeria-filtros');
  filtros.setAttribute('aria-label', 'Filtros');
  const grupo = (titulo, opciones, clave) => {
    const g = el('div', 'fl-galeria-grupo');
    g.setAttribute('role', 'radiogroup');
    g.setAttribute('aria-label', titulo);
    g.append(el('div', 'fl-galeria-grupo-titulo', titulo));
    for (const o of opciones) {
      const b = el('button', 'fl-galeria-filtro');
      b.type = 'button';
      b.setAttribute('role', 'radio');
      b.dataset.valor = o.id;
      if (o.glifo) b.insertAdjacentHTML('afterbegin', glifo(o.glifo)); // dibujo fijo del código
      const textos = el('span', 'fl-galeria-filtro-texto');
      textos.append(el('span', 'fl-galeria-filtro-nombre', o.nombre));
      if (o.detalle) textos.append(el('small', '', o.detalle));
      b.append(textos);
      b.addEventListener('click', () => { filtro[clave] = o.id; pintar(); });
      g.append(b);
    }
    return g;
  };
  filtros.append(
    grupo('Nivel', [{ id: 'todos', nombre: 'Todos los niveles', glifo: 'todos' }, ...NIVELES.map((n) => ({ ...n, glifo: n.id }))], 'nivel'),
    grupo('Área', [{ id: 'todas', nombre: 'Todas las áreas' }, ...areas.map((a) => ({ id: a, nombre: a }))], 'area')
  );

  const lista = el('div', 'fl-galeria-lista');
  const cuerpo = el('div', 'fl-galeria-cuerpo');
  cuerpo.append(filtros, lista);
  caja.append(cabecera, cuerpo);
  fondo.append(caja);

  const tarjetas = ordenadas.map((p) => {
    const nivel = NIVELES.find((n) => n.id === p.nivel) || NIVELES[0];
    const t = el('button', 'fl-plantilla');
    t.type = 'button';
    t.setAttribute('aria-label', `${p.nombre}. ${nivel.nombre}, ${p.categoria}. ${p.descripcion}`);
    const vista = el('div', 'fl-plantilla-vista');
    const img = el('img');
    img.alt = '';
    img.decoding = 'async';
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(p.vista)}`;
    vista.append(img);
    const texto = el('div', 'fl-plantilla-texto');
    texto.append(el('strong', 'fl-plantilla-nombre', p.nombre), el('p', 'fl-plantilla-descripcion', p.descripcion));
    const pie = el('div', 'fl-plantilla-pie');
    const etiquetaNivel = el('span', `fl-plantilla-nivel nivel-${nivel.id}`);
    etiquetaNivel.insertAdjacentHTML('afterbegin', glifo(nivel.id)); // dibujo fijo del código
    etiquetaNivel.append(el('span', '', nivel.nombre));
    pie.append(etiquetaNivel, el('span', 'fl-plantilla-area', p.categoria));
    t.append(vista, texto, el('small', 'fl-plantilla-incluye', `Trae ${p.incluye}.`), pie);
    t.addEventListener('click', () => { cerrar(); alElegir(p, destino); });
    return { p, t };
  });

  function pintar() {
    for (const b of filtros.querySelectorAll('.fl-galeria-filtro')) {
      const g = b.parentElement.getAttribute('aria-label') === 'Nivel' ? 'nivel' : 'area';
      const activo = filtro[g] === b.dataset.valor;
      b.classList.toggle('activo', activo);
      b.setAttribute('aria-checked', String(activo));
    }
    const visibles = tarjetas.filter(({ p }) => (filtro.nivel === 'todos' || p.nivel === filtro.nivel) && (filtro.area === 'todas' || p.categoria === filtro.area));
    lista.replaceChildren(...visibles.map(({ t }) => t));
    if (!visibles.length) lista.append(el('p', 'fl-galeria-vacio', 'No hay plantillas con ese nivel en esa área todavía. Prueba con otro filtro.'));
  }

  const tecla = (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); cerrar(); }
  };
  let soltar = null;
  function cerrar() {
    document.removeEventListener('keydown', tecla, true);
    soltar();
  }
  cerrarBtn.addEventListener('click', cerrar);
  fondo.addEventListener('mousedown', (e) => { if (e.target === fondo) cerrar(); });
  document.addEventListener('keydown', tecla, true);

  pintar();
  document.body.append(fondo);
  soltar = modal(fondo, caja, h);
  const primera = lista.querySelector('.fl-plantilla');
  if (primera) primera.focus();
}
