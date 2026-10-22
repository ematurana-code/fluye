// Dibuja cada elemento BPMN con el estilo de Fluye.
import BaseRenderer from 'diagram-js/lib/draw/BaseRenderer.js';
import { create as svgCreate, attr as svgAttr, append as svgAppend } from 'tiny-svg';
import { componentsToPath, createLine } from 'diagram-js/lib/util/RenderUtil.js';
import { getConnectionMid } from 'diagram-js/lib/layout/LayoutUtil.js';
import { dibujarTexto, medir } from './texto.js';
import { iconoEnSvg } from '../../iconos.js';
import {
  cabeceraDe, COLORES, bo, colores, es, esActividad, esAnotacion, esCarril, esCompuerta, esDato, esEvento, esGrupo,
  esPool, nombreExterno, tipoEvento
} from '../tipos.js';

const PRIORIDAD = 1500;
let idMarcadores = 0;

export default class FluyeRenderer extends BaseRenderer {
  static $inject = ['eventBus', 'canvas'];

  constructor(eventBus, canvas) {
    super(eventBus, PRIORIDAD);
    this._canvas = canvas;
    this._marcadores = null;
  }

  canRender(elemento) {
    return /^bpmn:/.test(elemento.type) && !elemento.labelTarget;
  }

  // ---------- figuras ----------

  drawShape(padre, el) {
    const c = colores(el);
    if (esPool(el) || esCarril(el)) return this._contenedor(padre, el, c);
    if (esEvento(el)) return this._evento(padre, el, c);
    if (esCompuerta(el)) return this._compuerta(padre, el, c);
    if (esActividad(el)) return this._actividad(padre, el, c);
    if (es(el, 'bpmn:DataObjectReference', 'bpmn:DataInput', 'bpmn:DataOutput')) return this._objetoDatos(padre, el, c);
    if (es(el, 'bpmn:DataStoreReference')) return this._deposito(padre, el, c);
    if (esAnotacion(el)) return this._anotacion(padre, el, c);
    if (esGrupo(el)) return this._grupo(padre, el, c);
    return this._rect(padre, el.width, el.height, 4, c.fill, c.stroke, 1.5);
  }

  _rect(padre, ancho, alto, radio, fill, stroke, grosor, extra = {}) {
    const r = svgCreate('rect');
    svgAttr(r, { x: 0, y: 0, width: ancho, height: alto, rx: radio, ry: radio, fill, stroke, 'stroke-width': grosor, ...extra });
    svgAppend(padre, r);
    return r;
  }

  _circulo(padre, cx, cy, radio, fill, stroke, grosor, extra = {}) {
    const c = svgCreate('circle');
    svgAttr(c, { cx, cy, r: radio, fill, stroke, 'stroke-width': grosor, ...extra });
    svgAppend(padre, c);
    return c;
  }

  _ruta(padre, d, attrs) {
    const p = svgCreate('path');
    svgAttr(p, { d, ...attrs });
    svgAppend(padre, p);
    return p;
  }

  _nombreDebajo(padre, el) {
    const nombre = bo(el).name;
    if (!nombre) return;
    const ancho = Math.max(90, Math.min(140, medir(nombre, 11) + 8));
    const opciones = { tamano: 11, color: COLORES.texto, maxLineas: 4, clase: 'fl-texto fl-texto-externo', halo: true };
    // Si una flecha sale o entra por abajo, el nombre va arriba para no quedar cruzado por la línea;
    // si hay flechas arriba y abajo, va arriba a la izquierda, sin tocar la línea vertical del centro.
    const abajo = usaBordeInferior(el), arriba = usaBordeSuperior(el);
    if (abajo) {
      const lineas = Math.min(4, Math.ceil((medir(nombre, 11) + 8) / ancho));
      const x = arriba ? el.width / 2 - 8 - ancho : el.width / 2 - ancho / 2;
      dibujarTexto(padre, nombre, { x, y: -6 - lineas * 13.75, ancho }, arriba ? { ...opciones, alinear: 'derecha' } : opciones);
      return;
    }
    dibujarTexto(padre, nombre, { x: el.width / 2 - ancho / 2, y: el.height + 4, ancho }, opciones);
  }

  _evento(padre, el, c) {
    const r = el.width / 2, cx = r, cy = el.height / 2;
    const fin = es(el, 'bpmn:EndEvent'), inicio = es(el, 'bpmn:StartEvent');
    const forma = this._circulo(padre, cx, cy, r, c.fill, c.stroke, fin ? 3.5 : inicio ? 2 : 1.5);
    if (!inicio && !fin) this._circulo(padre, cx, cy, r - 3.5, 'none', c.stroke, 1.2);
    if (es(el, 'bpmn:BoundaryEvent') && bo(el).cancelActivity === false) svgAttr(forma, { 'stroke-dasharray': '5 3' });
    this._marcadorEvento(padre, el, cx, cy, r, c);
    this._nombreDebajo(padre, el);
    return forma;
  }

  _marcadorEvento(padre, el, cx, cy, r, c) {
    const tipo = tipoEvento(el);
    const lanza = es(el, 'bpmn:EndEvent', 'bpmn:IntermediateThrowEvent');
    const tinta = c.stroke;
    if (tipo === 'mensaje') {
      const w = r * 1.0, h = r * 0.7, x = cx - w / 2, y = cy - h / 2;
      this._ruta(padre, `M${x},${y} h${w} v${h} h${-w} z`, { fill: lanza ? tinta : '#fff', stroke: tinta, 'stroke-width': 1.3 });
      this._ruta(padre, `M${x},${y} L${cx},${cy + h * 0.1} L${x + w},${y}`, { fill: 'none', stroke: lanza ? '#fff' : tinta, 'stroke-width': 1.3 });
    } else if (tipo === 'temporizador') {
      this._circulo(padre, cx, cy, r * 0.6, '#fff', tinta, 1.4);
      this._ruta(padre, `M${cx},${cy - r * 0.42} L${cx},${cy} L${cx + r * 0.3},${cy + r * 0.12}`, { fill: 'none', stroke: tinta, 'stroke-width': 1.4, 'stroke-linecap': 'round' });
    } else if (tipo === 'terminacion') {
      this._circulo(padre, cx, cy, r * 0.55, tinta, 'none', 0);
    } else if (tipo === 'error') {
      const k = r / 18;
      this._ruta(padre, `M${cx - 9 * k},${cy + 9 * k} L${cx - 4 * k},${cy - 8 * k} L${cx + 2 * k},${cy + 2 * k} L${cx + 9 * k},${cy - 9 * k} L${cx + 4 * k},${cy + 8 * k} L${cx - 2 * k},${cy - 2 * k} z`,
        { fill: lanza ? tinta : 'none', stroke: tinta, 'stroke-width': 1.3, 'stroke-linejoin': 'round' });
    } else if (tipo === 'senal') {
      const k = r * 0.62;
      this._ruta(padre, `M${cx},${cy - k} L${cx + k * 0.9},${cy + k * 0.6} L${cx - k * 0.9},${cy + k * 0.6} z`, { fill: lanza ? tinta : 'none', stroke: tinta, 'stroke-width': 1.3 });
    } else if (tipo === 'condicional') {
      const w = r * 0.8, h = r * 1.0;
      this._ruta(padre, `M${cx - w / 2},${cy - h / 2} h${w} v${h} h${-w} z M${cx - w / 3},${cy - h / 4} h${w * 0.66} M${cx - w / 3},${cy} h${w * 0.66} M${cx - w / 3},${cy + h / 4} h${w * 0.66}`, { fill: '#fff', stroke: tinta, 'stroke-width': 1.2 });
    } else if (tipo === 'enlace') {
      const k = r * 0.55;
      this._ruta(padre, `M${cx - k},${cy - k * 0.35} h${k} v${-k * 0.4} l${k},${k * 0.75} l${-k},${k * 0.75} v${-k * 0.4} h${-k} z`, { fill: lanza ? tinta : 'none', stroke: tinta, 'stroke-width': 1.3 });
    }
  }

  _compuerta(padre, el, c) {
    const w = el.width, h = el.height, mx = w / 2, my = h / 2;
    const forma = this._ruta(padre, `M${mx},0 L${w},${my} L${mx},${h} L0,${my} z`, { fill: c.fill, stroke: c.stroke, 'stroke-width': 1.6, 'stroke-linejoin': 'round' });
    const tinta = c.stroke, k = w / 46;
    if (es(el, 'bpmn:ParallelGateway')) {
      this._ruta(padre, `M${mx},${my - 11 * k} V${my + 11 * k} M${mx - 11 * k},${my} H${mx + 11 * k}`, { stroke: tinta, 'stroke-width': 3.2, 'stroke-linecap': 'round', fill: 'none' });
    } else if (es(el, 'bpmn:InclusiveGateway')) {
      this._circulo(padre, mx, my, 9 * k, 'none', tinta, 2.6);
    } else if (es(el, 'bpmn:ExclusiveGateway') && el.marcadorVisible) {
      this._ruta(padre, `M${mx - 8 * k},${my - 8 * k} L${mx + 8 * k},${my + 8 * k} M${mx + 8 * k},${my - 8 * k} L${mx - 8 * k},${my + 8 * k}`, { stroke: tinta, 'stroke-width': 3.2, 'stroke-linecap': 'round', fill: 'none' });
    } else if (es(el, 'bpmn:EventBasedGateway')) {
      this._circulo(padre, mx, my, 11 * k, 'none', tinta, 1.2);
      this._circulo(padre, mx, my, 8.5 * k, 'none', tinta, 1.2);
      const p = 5.5 * k;
      this._ruta(padre, `M${mx},${my - p} L${mx + p},${my - p * 0.2} L${mx + p * 0.6},${my + p} L${mx - p * 0.6},${my + p} L${mx - p},${my - p * 0.2} z`, { fill: 'none', stroke: tinta, 'stroke-width': 1.3 });
    } else if (es(el, 'bpmn:ComplexGateway')) {
      const d = 10 * k, e = d * 0.7;
      this._ruta(padre, `M${mx},${my - d} V${my + d} M${mx - d},${my} H${mx + d} M${mx - e},${my - e} L${mx + e},${my + e} M${mx + e},${my - e} L${mx - e},${my + e}`, { stroke: tinta, 'stroke-width': 2.6, 'stroke-linecap': 'round', fill: 'none' });
    }
    this._nombreDebajo(padre, el);
    return forma;
  }

  _actividad(padre, el, c) {
    const w = el.width, h = el.height;
    if (es(el, 'bpmn:SubProcess') && el.collapsed === false) {
      const forma = this._rect(padre, w, h, 10, c.fill === COLORES.tarea.fill ? '#FBFCFF' : c.fill, c.stroke, 1.5);
      dibujarTexto(padre, bo(el).name, { x: 10, y: 8, ancho: w - 20 }, { tamano: 12, peso: 600, alinear: 'inicio', vertical: 'arriba', color: COLORES.texto });
      return forma;
    }
    const llamada = es(el, 'bpmn:CallActivity');
    const forma = this._rect(padre, w, h, 8, c.fill, c.stroke, llamada ? 3.5 : 1.6);
    const icono = {
      'bpmn:UserTask': 'usuario', 'bpmn:ServiceTask': 'engranaje', 'bpmn:ManualTask': 'mano', 'bpmn:ScriptTask': 'script',
      'bpmn:SendTask': 'enviar', 'bpmn:ReceiveTask': 'correo', 'bpmn:BusinessRuleTask': 'tabla'
    }[bo(el).$type];
    if (icono) iconoEnSvg(padre, icono, 6, 5, 14, c.stroke, 2);
    const margenArriba = icono ? 14 : 4;
    const subproceso = es(el, 'bpmn:SubProcess') || llamada;
    dibujarTexto(padre, bo(el).name, { x: 6, y: margenArriba, ancho: w - 12, alto: h - margenArriba - (subproceso ? 16 : 4) },
      { tamano: 12, color: COLORES.texto, maxLineas: Math.max(1, Math.floor((h - margenArriba - (subproceso ? 14 : 1)) / 15)) });
    if (subproceso) {
      const s = 12, x = w / 2 - s / 2, y = h - s - 3;
      this._ruta(padre, `M${x},${y} h${s} v${s} h${-s} z M${x + 3},${y + s / 2} h${s - 6} M${x + s / 2},${y + 3} v${s - 6}`, { fill: '#fff', stroke: c.stroke, 'stroke-width': 1.2 });
    }
    this._marcadorCiclo(padre, el, c);
    return forma;
  }

  _marcadorCiclo(padre, el, c) {
    const lc = bo(el).loopCharacteristics;
    if (!lc) return;
    const x = el.width / 2 + (es(el, 'bpmn:SubProcess', 'bpmn:CallActivity') ? 14 : 0), y = el.height - 9;
    if (lc.$type === 'bpmn:MultiInstanceLoopCharacteristics') {
      const d = lc.isSequential ? `M${x - 5},${y - 4} h10 M${x - 5},${y} h10 M${x - 5},${y + 4} h10` : `M${x - 4},${y - 5} v10 M${x},${y - 5} v10 M${x + 4},${y - 5} v10`;
      this._ruta(padre, d, { stroke: c.stroke, 'stroke-width': 1.5, fill: 'none' });
    } else {
      this._ruta(padre, `M${x - 4},${y + 4} A5.5,5.5 0 1 1 ${x + 4},${y + 4} M${x + 4},${y + 4} l0,-3.5 M${x + 4},${y + 4} l-3.5,0`, { stroke: c.stroke, 'stroke-width': 1.4, fill: 'none' });
    }
  }

  _objetoDatos(padre, el, c) {
    const w = el.width, h = el.height, d = Math.min(12, w / 3);
    const forma = this._ruta(padre, `M0,0 H${w - d} L${w},${d} V${h} H0 z`, { fill: c.fill, stroke: c.stroke, 'stroke-width': 1.4, 'stroke-linejoin': 'round' });
    this._ruta(padre, `M${w - d},0 V${d} H${w}`, { fill: 'none', stroke: c.stroke, 'stroke-width': 1.2 });
    if (es(el, 'bpmn:DataInput', 'bpmn:DataOutput')) {
      const lleno = es(el, 'bpmn:DataOutput');
      this._ruta(padre, 'M4,5 h6 v-3 l6,5 l-6,5 v-3 h-6 z', { fill: lleno ? c.stroke : '#fff', stroke: c.stroke, 'stroke-width': 1.1, 'stroke-linejoin': 'round' });
    }
    if (bo(el).isCollection || (bo(el).dataObjectRef && bo(el).dataObjectRef.isCollection)) {
      this._ruta(padre, `M${w / 2 - 5},${h - 12} v8 M${w / 2},${h - 12} v8 M${w / 2 + 5},${h - 12} v8`, { stroke: c.stroke, 'stroke-width': 1.3, fill: 'none' });
    }
    this._nombreDebajo(padre, el);
    return forma;
  }

  _deposito(padre, el, c) {
    const w = el.width, h = el.height, ry = Math.min(8, h / 5);
    const forma = this._ruta(padre, `M0,${ry} A${w / 2},${ry} 0 0 1 ${w},${ry} V${h - ry} A${w / 2},${ry} 0 0 1 0,${h - ry} z`, { fill: c.fill, stroke: c.stroke, 'stroke-width': 1.4 });
    this._ruta(padre, `M0,${ry} A${w / 2},${ry} 0 0 0 ${w},${ry} M0,${ry * 2} A${w / 2},${ry} 0 0 0 ${w},${ry * 2}`, { fill: 'none', stroke: c.stroke, 'stroke-width': 1.2 });
    this._nombreDebajo(padre, el);
    return forma;
  }

  _anotacion(padre, el, c) {
    const w = el.width, h = el.height;
    const forma = this._rect(padre, w, h, 0, 'transparent', 'none', 0);
    this._ruta(padre, `M12,0 H0 V${h} H12`, { fill: 'none', stroke: c.stroke, 'stroke-width': 1.5 });
    dibujarTexto(padre, bo(el).text, { x: 6, y: 4, ancho: w - 10, alto: h - 8 }, { tamano: 11, alinear: 'inicio', vertical: 'centro', color: '#334155' });
    return forma;
  }

  _grupo(padre, el, c) {
    const forma = this._rect(padre, el.width, el.height, 10, 'none', c.stroke, 1.4, { 'stroke-dasharray': '8 4 2 4' });
    const nombre = bo(el).categoryValueRef && bo(el).categoryValueRef.value;
    if (nombre) dibujarTexto(padre, nombre, { x: 8, y: 6, ancho: el.width - 16 }, { tamano: 11, peso: 600, alinear: 'inicio', vertical: 'arriba', color: '#334155' });
    return forma;
  }

  _contenedor(padre, el, c) {
    const w = el.width, h = el.height;
    const pool = esPool(el);
    const CABECERA = cabeceraDe(pool ? el : el.parent);
    const forma = this._rect(padre, w, h, 0, pool ? c.fill : 'none', c.stroke, pool ? 1.6 : 1.1);
    if (pool && !el.sinCabecera) {
      const cab = svgCreate('rect');
      svgAttr(cab, { x: 0, y: 0, width: CABECERA, height: h, fill: c.cabecera || COLORES.contenedor.cabecera, stroke: c.stroke, 'stroke-width': 1.6 });
      svgAppend(padre, cab);
    } else if (!pool) {
      this._ruta(padre, `M${CABECERA},0 V${h}`, { stroke: c.stroke, 'stroke-width': 1.1, fill: 'none' });
      if (el.colores && el.colores.fill) {
        const fondo = svgCreate('rect');
        svgAttr(fondo, { x: 0, y: 0, width: CABECERA, height: h, fill: el.colores.fill, stroke: 'none' });
        padre.insertBefore(fondo, forma.nextSibling);
      }
    }
    const nombre = bo(el).name;
    if (nombre && !el.sinCabecera) {
      dibujarTexto(padre, nombre, { x: CABECERA / 2 - h / 2, y: h / 2 - CABECERA / 2 + 2, ancho: h - 12, alto: CABECERA - 4 },
        { tamano: pool ? 13 : 12, peso: 600, color: COLORES.texto, maxLineas: CABECERA - 4 >= (pool ? 33 : 30) ? 2 : 1, rotar: -90 });
    }
    return forma;
  }

  getShapePath(el) {
    const { x, y, width: w, height: h } = el;
    if (esEvento(el)) {
      const r = w / 2, cx = x + r, cy = y + h / 2;
      return componentsToPath([['M', cx, cy], ['m', 0, -r], ['a', r, r, 0, 1, 1, 0, 2 * r], ['a', r, r, 0, 1, 1, 0, -2 * r], ['z']]);
    }
    if (esCompuerta(el)) {
      return componentsToPath([['M', x + w / 2, y], ['l', w / 2, h / 2], ['l', -w / 2, h / 2], ['l', -w / 2, -h / 2], ['z']]);
    }
    return componentsToPath([['M', x, y], ['l', w, 0], ['l', 0, h], ['l', -w, 0], ['z']]);
  }

  // ---------- conexiones ----------

  _asegurarMarcadores(padre) {
    const svg = padre.ownerSVGElement || this._canvas._svg;
    if (this._marcadores && svg.contains(this._marcadores.defs)) return this._marcadores;
    const n = ++idMarcadores;
    const defs = svgCreate('defs');
    const marca = (id, d, attrs, ref = { x: 11, y: 5 }) => {
      const m = svgCreate('marker');
      svgAttr(m, { id, viewBox: '0 0 12 10', refX: ref.x, refY: ref.y, markerWidth: 12, markerHeight: 10, orient: 'auto-start-reverse', markerUnits: 'userSpaceOnUse' });
      const p = svgCreate('path');
      svgAttr(p, { d, ...attrs });
      svgAppend(m, p);
      svgAppend(defs, m);
      return `url(#${id})`;
    };
    this._marcadores = {
      defs,
      flecha: marca(`fl-flecha-${n}`, 'M1,1 L11,5 L1,9 z', { fill: COLORES.flujo, stroke: COLORES.flujo, 'stroke-width': 1, 'stroke-linejoin': 'round' }),
      flechaAbierta: marca(`fl-abierta-${n}`, 'M1,1 L11,5 L1,9 z', { fill: '#fff', stroke: COLORES.flujo, 'stroke-width': 1.2, 'stroke-linejoin': 'round' }),
      flechaLinea: marca(`fl-linea-${n}`, 'M1,1 L11,5 L1,9', { fill: 'none', stroke: COLORES.flujo, 'stroke-width': 1.2 }),
      circulo: marca(`fl-circulo-${n}`, 'M6,2 a3,3 0 1 1 0,6 a3,3 0 1 1 0,-6', { fill: '#fff', stroke: COLORES.flujo, 'stroke-width': 1.2 }, { x: 6, y: 5 }),
      defecto: marca(`fl-defecto-${n}`, 'M2,1 L8,9', { fill: 'none', stroke: COLORES.flujo, 'stroke-width': 1.4 }, { x: -6, y: 5 })
    };
    svg.insertBefore(defs, svg.firstChild);
    return this._marcadores;
  }

  drawConnection(padre, conexion) {
    const m = this._asegurarMarcadores(padre);
    const tinta = (conexion.colores && conexion.colores.stroke) || COLORES.flujo;
    const attrs = { stroke: tinta, 'stroke-width': 1.5, fill: 'none', 'stroke-linejoin': 'round' };
    if (es(conexion, 'bpmn:SequenceFlow')) {
      Object.assign(attrs, { 'marker-end': m.flecha });
      const b = bo(conexion), origen = conexion.source && bo(conexion.source);
      if (origen && origen.default === b) attrs['marker-start'] = m.defecto;
    } else if (es(conexion, 'bpmn:MessageFlow')) {
      Object.assign(attrs, { 'stroke-dasharray': '7 5', 'marker-start': m.circulo, 'marker-end': m.flechaAbierta, 'stroke-width': 1.3 });
    } else if (es(conexion, 'bpmn:DataAssociation')) {
      Object.assign(attrs, { 'stroke-dasharray': '2 4', 'marker-end': m.flechaLinea, 'stroke-width': 1.3, 'stroke-linecap': 'round' });
    } else {
      Object.assign(attrs, { 'stroke-dasharray': '2 4', 'stroke-width': 1.3, 'stroke-linecap': 'round' });
    }
    const linea = createLine(conexion.waypoints, attrs, 6);
    svgAppend(padre, linea);
    this._nombreConexion(padre, conexion);
    return linea;
  }

  _nombreConexion(padre, conexion) {
    const nombre = bo(conexion).name;
    if (!nombre || !conexion.waypoints || conexion.waypoints.length < 2) return;
    const caja = posicionNombreConexion(conexion, nombre);
    const fondo = svgCreate('rect');
    svgAttr(fondo, { x: caja.x, y: caja.y, width: caja.ancho, height: caja.alto, rx: 4, fill: '#fff', opacity: 0.92 });
    svgAppend(padre, fondo);
    dibujarTexto(padre, nombre, { x: caja.x, y: caja.y + 1, ancho: caja.ancho, alto: caja.alto }, { tamano: 11, color: '#1E293B', maxLineas: 3 });
  }

  getConnectionPath(conexion) {
    const [primero, ...resto] = conexion.waypoints;
    return componentsToPath([['M', primero.x, primero.y], ...resto.map((p) => ['L', p.x, p.y])]);
  }
}

export { nombreExterno };

// ¿Alguna flecha llega o sale por el borde de abajo (o de arriba) de la figura?
function tocaBorde(el, abajo) {
  const borde = abajo ? el.y + el.height : el.y;
  const cx = el.x + el.width / 2;
  const toca = (p) => p && Math.abs(p.y - borde) <= 3 && Math.abs(p.x - cx) <= el.width / 2;
  return [...(el.outgoing || []).map((c) => c.waypoints && c.waypoints[0]), ...(el.incoming || []).map((c) => c.waypoints && c.waypoints[c.waypoints.length - 1])].some(toca);
}
export const usaBordeInferior = (el) => tocaBorde(el, true);
export const usaBordeSuperior = (el) => tocaBorde(el, false);

/**
 * Dónde va el nombre de una flecha ("Sí", "No"): junto a la salida, al costado de la línea (como Bizagi).
 * Si el primer tramo es muy corto, al medio de la flecha.
 */
export function posicionNombreConexion(conexion, nombre) {
  const w = conexion.waypoints;
  const ancho = Math.min(130, medir(nombre || '', 11) + 10);
  const lineas = Math.max(1, Math.ceil((medir(nombre || '', 11) + 10) / 130));
  const alto = lineas * 14 + 4;
  const [a, b] = w;
  const largo = Math.hypot(b.x - a.x, b.y - a.y);
  if (largo < 34) {
    const mid = getConnectionMid(conexion);
    return { x: mid.x - ancho / 2, y: mid.y - alto - 2, ancho, alto };
  }
  if (Math.abs(b.x - a.x) >= Math.abs(b.y - a.y)) {
    const derecha = b.x >= a.x;
    return { x: derecha ? a.x + 8 : a.x - 8 - ancho, y: a.y - alto - 3, ancho, alto };
  }
  const abajo = b.y >= a.y;
  return { x: a.x + 6, y: abajo ? a.y + 6 : a.y - 6 - alto, ancho, alto };
}
