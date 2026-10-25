// Menú rápido al seleccionar un elemento: agregar el siguiente ya conectado, conectar, color, carriles y borrar.
import { icono } from '../../iconos.js';
import { COLORES, COLORES_USUARIO, es, esAnotacion, esCarril, esConexion, esDato, esGrupo, esNodo, esPool } from '../tipos.js';

const GLIFOS = {
  tarea: `<svg viewBox="0 0 24 24" width="20" height="20"><rect x="2.5" y="5.5" width="19" height="13" rx="3" fill="${COLORES.tarea.fill}" stroke="${COLORES.tarea.stroke}" stroke-width="1.6"/></svg>`,
  compuerta: `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 2.5 21.5 12 12 21.5 2.5 12z" fill="${COLORES.compuerta.fill}" stroke="${COLORES.compuerta.stroke}" stroke-width="1.6" stroke-linejoin="round"/></svg>`,
  intermedio: `<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="9" fill="${COLORES.intermedio.fill}" stroke="${COLORES.intermedio.stroke}" stroke-width="1.5"/><circle cx="12" cy="12" r="6.3" fill="none" stroke="${COLORES.intermedio.stroke}" stroke-width="1.2"/></svg>`,
  fin: `<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="8.5" fill="${COLORES.fin.fill}" stroke="${COLORES.fin.stroke}" stroke-width="3"/></svg>`,
  pool: `<svg viewBox="0 0 24 24" width="20" height="20"><rect x="2.5" y="5" width="19" height="14" rx="1.5" fill="#fff" stroke="${COLORES.tarea.stroke}" stroke-width="1.6"/><path d="M7 5v14" stroke="${COLORES.tarea.stroke}" stroke-width="1.6"/></svg>`,
  subproceso: `<svg viewBox="0 0 24 24" width="20" height="20"><rect x="2.5" y="4.5" width="19" height="15" rx="3" fill="${COLORES.tarea.fill}" stroke="${COLORES.tarea.stroke}" stroke-width="1.6"/><path d="M12 9v6M9 12h6" stroke="${COLORES.tarea.stroke}" stroke-width="1.8" stroke-linecap="round"/></svg>`
};

const boton = (html, clase = '') => `<div class="entry fl-pad ${clase}" draggable="true">${html}</div>`;

export default class MenuRapido {
  static $inject = ['contextPad', 'elementFactory', 'autoPlace', 'create', 'connect', 'modeling', 'commandStack', 'canvas', 'eventBus'];

  constructor(contextPad, elementFactory, autoPlace, create, connect, modeling, commandStack, canvas, eventBus) {
    Object.assign(this, { _factory: elementFactory, _autoPlace: autoPlace, _create: create, _connect: connect, _modeling: modeling, _commandStack: commandStack, _canvas: canvas, _eventBus: eventBus });
    contextPad.registerProvider(this);
    this._popover = null;

    // Si el menú no cabe a la derecha del elemento (ej. un pool ancho), se muestra dentro, arriba a la izquierda.
    const posicionOriginal = contextPad._getPosition.bind(contextPad);
    contextPad._getPosition = (objetivo) => {
      const pos = posicionOriginal(objetivo);
      if (Array.isArray(objetivo) || objetivo.waypoints) return pos;
      const caja = canvas.getContainer().getBoundingClientRect();
      const ANCHO_MENU = 84;
      if (pos.left + ANCHO_MENU <= caja.width - 8) return pos;
      const b = contextPad._getTargetBounds(objetivo);
      return {
        left: Math.max(8, Math.min(caja.width - ANCHO_MENU - 8, b.left - caja.left + 44)),
        top: Math.max(8, b.top - caja.top + 8)
      };
    };
    document.addEventListener('mousedown', (e) => { if (this._popover && !this._popover.contains(e.target)) this._cerrarPopover(); }, true);
  }

  _agregar(tipo, opciones = {}) {
    return {
      click: (_e, el) => this._autoPlace.append(el, this._factory.crear(tipo, opciones)),
      dragstart: (e, el) => this._create.start(e, this._factory.crear(tipo, opciones), { source: el })
    };
  }

  getContextPadEntries(el) {
    const entradas = {};
    const conectar = { click: (e, x) => this._connect.start(e, x, null, true), dragstart: (e, x) => this._connect.start(e, x) };

    if (esNodo(el) && !es(el, 'bpmn:EndEvent')) {
      entradas['agregar.tarea'] = { group: 'agregar', html: boton(GLIFOS.tarea), title: 'Agregar tarea (clic) o arrastrar', action: this._agregar('bpmn:Task') };
      entradas['agregar.compuerta'] = { group: 'agregar', html: boton(GLIFOS.compuerta), title: 'Agregar decisión', action: this._agregar('bpmn:ExclusiveGateway') };
      entradas['agregar.intermedio'] = { group: 'agregar', html: boton(GLIFOS.intermedio), title: 'Agregar evento intermedio', action: this._agregar('bpmn:IntermediateThrowEvent') };
      entradas['agregar.fin'] = { group: 'agregar', html: boton(GLIFOS.fin), title: 'Agregar fin', action: this._agregar('bpmn:EndEvent') };
    }
    // Subproceso cerrado: lo que pasa adentro se dibuja en su propia pestaña (la app la abre o la crea).
    if (es(el, 'bpmn:SubProcess') && el.collapsed !== false) {
      entradas['subproceso.abrir'] = {
        group: 'editar', html: boton(GLIFOS.subproceso), title: 'Abrir el subproceso: dibujar lo que pasa adentro, en su propia pestaña',
        action: { click: (_e, x) => this._eventBus.fire('fluye.subproceso.abrir', { elemento: x }) }
      };
    }
    if (esNodo(el) || esDato(el) || esAnotacion(el)) {
      entradas.conectar = { group: 'editar', html: boton(icono('flujo', 18)), title: 'Conectar con otro elemento (arrastrar)', action: conectar };
    }
    if (esPool(el) || esCarril(el)) {
      entradas['carril.agregar'] = {
        group: 'editar', html: boton(icono('carril', 18)), title: esPool(el) ? 'Agregar carril' : 'Agregar carril debajo',
        action: { click: (_e, x) => this._commandStack.execute('carril.agregar', { elemento: x }) }
      };
    }
    if (esPool(el)) {
      entradas['pool.agregar'] = {
        group: 'editar', html: boton(GLIFOS.pool), title: 'Agregar pool debajo',
        action: { click: (_e, x) => this._commandStack.execute('pool.agregar', { elemento: x }) }
      };
    }
    if (!esConexion(el) && !esGrupo(el) && !esAnotacion(el)) {
      entradas.color = { group: 'editar', html: boton(icono('color', 18)), title: 'Color', action: { click: (e, x) => this._abrirColores(e, x) } };
    }
    entradas.borrar = { group: 'editar', html: boton(icono('borrar', 18), 'fl-pad-borrar'), title: 'Borrar (Supr)', action: { click: (_e, x) => this._modeling.removeElements([x]) } };
    return entradas;
  }

  _abrirColores(evento, el) {
    this._cerrarPopover();
    const caja = evento.delegateTarget ? evento.delegateTarget.getBoundingClientRect() : evento.target.getBoundingClientRect();
    const pop = document.createElement('div');
    pop.className = 'fl-popover fl-colores';
    pop.innerHTML = COLORES_USUARIO.map((c, i) => `<button type="button" data-i="${i}" title="${c.nombre}" style="--relleno:${c.fill || '#fff'};--borde:${c.stroke || '#94a3b8'}">${c.fill ? '' : 'A'}</button>`).join('');
    pop.style.left = `${caja.left}px`;
    pop.style.top = `${caja.bottom + 6}px`;
    pop.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      const c = COLORES_USUARIO[Number(b.dataset.i)];
      this._modeling.cambiarPropiedades(el, null, { colores: c.fill ? { fill: c.fill, stroke: c.stroke } : undefined });
      this._cerrarPopover();
    });
    document.body.appendChild(pop);
    // Con el elemento abajo o a la derecha de la pantalla, la paleta se abre hacia arriba o se corre (no queda cortada).
    const r = pop.getBoundingClientRect();
    if (r.bottom > innerHeight - 8) pop.style.top = `${Math.max(8, caja.top - r.height - 6)}px`;
    if (r.right > innerWidth - 8) pop.style.left = `${Math.max(8, innerWidth - r.width - 8)}px`;
    this._popover = pop;
  }

  _cerrarPopover() {
    if (this._popover) this._popover.remove();
    this._popover = null;
  }
}
