// Edición del nombre en el lugar: doble clic, o automática al crear un elemento (texto ya seleccionado).
import { es, esActividad, esAnotacion, esCarril, esConexion, esEvento, esGrupo, esPool, esSubprocesoExpandido, nombreExterno } from '../tipos.js';
import { leerNombre } from '../modeling/comandos.js';
import { FUENTE } from '../draw/texto.js';
import { posicionNombreConexion } from '../draw/FluyeRenderer.js';

const EDITAR_AL_CREAR = (el) => esActividad(el) || esPool(el) || esCarril(el) || esAnotacion(el) ||
  el.type === 'bpmn:ExclusiveGateway' || el.type === 'bpmn:InclusiveGateway';

export default class EdicionNombre {
  static $inject = ['eventBus', 'canvas', 'directEditing', 'modeling', 'elementRegistry'];

  constructor(eventBus, canvas, directEditing, modeling, elementRegistry) {
    this._canvas = canvas;
    this._directEditing = directEditing;
    this._modeling = modeling;
    directEditing.registerProvider(this);

    eventBus.on('element.dblclick', (e) => this.editar(e.element));
    eventBus.on(['autoPlace.end', 'create.end'], 500, (e) => {
      const el = e.shape || (e.context && e.context.shape);
      if (el && EDITAR_AL_CREAR(el)) setTimeout(() => this.editar(el), 0);
    });
    eventBus.on(['element.mousedown', 'drag.init', 'canvas.viewbox.changing', 'autoPlace', 'popupMenu.open'], () => {
      if (directEditing.isActive()) directEditing.complete();
    });
    eventBus.on('commandStack.changed', () => {
      const activo = directEditing.isActive() && directEditing._active && directEditing._active.element;
      if (activo && !elementRegistry.get(activo.id)) directEditing.cancel();
    });
  }

  editar(el) {
    if (!el || !el.parent) return;
    if (!this._directEditing.activate(el)) return;
    const caja = this._directEditing._textbox && this._directEditing._textbox.content;
    if (caja) {
      caja.focus();
      const rango = document.createRange();
      rango.selectNodeContents(caja);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(rango);
    }
  }

  activate(el) {
    if (!el.parent || esConexion(el) && !el.waypoints) return null;
    if (!(esActividad(el) || esEvento(el) || nombreExterno(el) || esPool(el) || esCarril(el) || esAnotacion(el) || esGrupo(el) || es(el, 'bpmn:SequenceFlow', 'bpmn:MessageFlow'))) return null;
    const zoom = this._canvas.zoom();
    const caja = this._canvas.getAbsoluteBBox(el);
    const tamano = 12 * zoom;
    const estilo = { fontFamily: FUENTE, fontSize: `${tamano}px`, lineHeight: 1.25, color: '#0F172A', fontWeight: '400', textAlign: 'center' };
    let bounds, opciones = { centerVertically: true };

    if (esConexion(el)) {
      const p = posicionNombreConexion(el, leerNombre(el) || 'Etiqueta'), vb = this._canvas.viewbox();
      bounds = { x: (p.x - vb.x) * zoom - 6, y: (p.y - vb.y) * zoom - 2, width: Math.max(110, p.ancho + 30) * zoom, height: 24 * zoom };
      Object.assign(estilo, { textAlign: 'left', fontSize: `${11 * zoom}px` });
      opciones = { autoResize: true };
    } else if (esPool(el) || esCarril(el)) {
      bounds = { x: caja.x + 2, y: caja.y + caja.height / 2 - 20 * zoom, width: Math.max(150, 180 * zoom), height: 40 * zoom };
      Object.assign(estilo, { fontWeight: '600', backgroundColor: '#fff', border: '1px solid #3b82f6', borderRadius: '6px' });
    } else if (esSubprocesoExpandido(el)) {
      bounds = { x: caja.x + 6, y: caja.y + 4, width: caja.width - 12, height: 22 * zoom };
      Object.assign(estilo, { textAlign: 'left', fontWeight: '600' });
      opciones = {};
    } else if (nombreExterno(el)) {
      const ancho = 140 * zoom;
      bounds = { x: caja.x + caja.width / 2 - ancho / 2, y: caja.y + caja.height + 3, width: ancho, height: 30 * zoom };
      Object.assign(estilo, { fontSize: `${11 * zoom}px` });
      opciones = { autoResize: true };
    } else if (esAnotacion(el) || esGrupo(el)) {
      bounds = { x: caja.x + 4, y: caja.y + 2, width: caja.width - 8, height: Math.max(caja.height - 4, 24 * zoom) };
      Object.assign(estilo, { textAlign: 'left', fontSize: `${11 * zoom}px` });
      opciones = { autoResize: true };
    } else {
      bounds = { x: caja.x + 4, y: caja.y + 4, width: caja.width - 8, height: caja.height - 8 };
    }
    return { bounds, style: estilo, text: leerNombre(el), options: opciones };
  }

  update(el, texto) {
    const nuevo = (texto || '').replace(/ /g, ' ').trim();
    if (nuevo === leerNombre(el)) return;
    this._modeling.renombrar(el, nuevo);
  }
}
