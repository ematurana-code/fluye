// Miniaturas SVG de cada elemento BPMN para la paleta y los menús.
import { COLORES } from '../modeler/tipos.js';
import { ICONOS } from '../iconos.js';

const C = COLORES;
const svg = (contenido, t = 26) => `<svg viewBox="0 0 26 26" width="${t}" height="${t}" aria-hidden="true">${contenido}</svg>`;
const circulo = (fill, stroke, w) => `<circle cx="13" cy="13" r="10" fill="${fill}" stroke="${stroke}" stroke-width="${w}"/>`;

function icono(nombre, x, y, escala, color) {
  const nodos = (ICONOS[nombre] || []).map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ')}/>`).join('');
  return `<g transform="translate(${x} ${y}) scale(${escala})" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${nodos}</g>`;
}

const sobre = (color, lleno) => `<path d="M8 9.5h10v7H8z" fill="${lleno ? color : '#fff'}" stroke="${color}" stroke-width="1.2"/><path d="M8 9.5l5 3.6 5-3.6" fill="none" stroke="${lleno ? '#fff' : color}" stroke-width="1.2"/>`;
const reloj = (color) => `<circle cx="13" cy="13" r="5.6" fill="#fff" stroke="${color}" stroke-width="1.3"/><path d="M13 9.4V13l2.6 1.2" fill="none" stroke="${color}" stroke-width="1.3" stroke-linecap="round"/>`;
const tarea = (extra = '', borde = 1.6) => `<rect x="2.5" y="5" width="21" height="16" rx="3.5" fill="${C.tarea.fill}" stroke="${C.tarea.stroke}" stroke-width="${borde}"/>${extra}`;
const rombo = (extra = '') => `<path d="M13 2.5 23.5 13 13 23.5 2.5 13z" fill="${C.compuerta.fill}" stroke="${C.compuerta.stroke}" stroke-width="1.5" stroke-linejoin="round"/>${extra}`;

export const GLIFOS = {
  inicio: svg(circulo(C.inicio.fill, C.inicio.stroke, 1.8)),
  inicioMensaje: svg(circulo(C.inicio.fill, C.inicio.stroke, 1.8) + sobre(C.inicio.stroke)),
  inicioTemporizador: svg(circulo(C.inicio.fill, C.inicio.stroke, 1.8) + reloj(C.inicio.stroke)),
  intermedio: svg(circulo(C.intermedio.fill, C.intermedio.stroke, 1.4) + `<circle cx="13" cy="13" r="7.6" fill="none" stroke="${C.intermedio.stroke}" stroke-width="1.1"/>`),
  intermedioTemporizador: svg(circulo(C.intermedio.fill, C.intermedio.stroke, 1.4) + `<circle cx="13" cy="13" r="7.6" fill="none" stroke="${C.intermedio.stroke}" stroke-width="1.1"/>` + reloj(C.intermedio.stroke)),
  intermedioMensaje: svg(circulo(C.intermedio.fill, C.intermedio.stroke, 1.4) + `<circle cx="13" cy="13" r="7.6" fill="none" stroke="${C.intermedio.stroke}" stroke-width="1.1"/>` + sobre(C.intermedio.stroke)),
  intermedioEnvio: svg(circulo(C.intermedio.fill, C.intermedio.stroke, 1.4) + `<circle cx="13" cy="13" r="7.6" fill="none" stroke="${C.intermedio.stroke}" stroke-width="1.1"/>` + sobre(C.intermedio.stroke, true)),
  fin: svg(circulo(C.fin.fill, C.fin.stroke, 3)),
  finTerminacion: svg(circulo(C.fin.fill, C.fin.stroke, 3) + `<circle cx="13" cy="13" r="5.5" fill="${C.fin.stroke}"/>`),
  finMensaje: svg(circulo(C.fin.fill, C.fin.stroke, 3) + sobre(C.fin.stroke, true)),
  tarea: svg(tarea()),
  tareaUsuario: svg(tarea(icono('usuario', 4.5, 6.5, 0.36, C.tarea.stroke))),
  tareaServicio: svg(tarea(icono('engranaje', 4.5, 6.5, 0.36, C.tarea.stroke))),
  tareaManual: svg(tarea(icono('mano', 4.5, 6.5, 0.36, C.tarea.stroke))),
  subproceso: svg(tarea(`<path d="M10.5 14.5h5v5h-5z M13 15.6v2.8 M11.6 17h2.8" fill="#fff" stroke="${C.tarea.stroke}" stroke-width="1"/>`)),
  exclusiva: svg(rombo()),
  paralela: svg(rombo(`<path d="M13 8.5v9M8.5 13h9" stroke="${C.compuerta.stroke}" stroke-width="2.4" stroke-linecap="round"/>`)),
  inclusiva: svg(rombo(`<circle cx="13" cy="13" r="4.4" fill="none" stroke="${C.compuerta.stroke}" stroke-width="2"/>`)),
  pool: svg(`<rect x="2" y="5" width="22" height="16" fill="#fff" stroke="#64748B" stroke-width="1.4"/><path d="M6.5 5v16" stroke="#64748B" stroke-width="1.4"/>`),
  carril: svg(`<rect x="2" y="5" width="22" height="16" fill="#fff" stroke="#64748B" stroke-width="1.4"/><path d="M6.5 5v16M6.5 13H24" stroke="#64748B" stroke-width="1.4"/>`),
  dato: svg(`<path d="M7 3.5h8.5L20 8v14.5H7z" fill="#fff" stroke="#475569" stroke-width="1.4" stroke-linejoin="round"/><path d="M15.5 3.5V8H20" fill="none" stroke="#475569" stroke-width="1.2"/>`),
  deposito: svg(`<path d="M4.5 7.5a8.5 3 0 0 1 17 0v11a8.5 3 0 0 1-17 0z" fill="#fff" stroke="#475569" stroke-width="1.4"/><path d="M4.5 7.5a8.5 3 0 0 0 17 0M4.5 10.5a8.5 3 0 0 0 17 0" fill="none" stroke="#475569" stroke-width="1.2"/>`),
  anotacion: svg(`<path d="M9 4H4v18h5" fill="none" stroke="#64748B" stroke-width="1.6"/><path d="M11 9h11M11 13h9M11 17h7" stroke="#94A3B8" stroke-width="1.6" stroke-linecap="round"/>`),
  grupo: svg(`<rect x="3" y="4" width="20" height="18" rx="4" fill="none" stroke="#64748B" stroke-width="1.5" stroke-dasharray="4 2.5 1 2.5"/>`)
};
