// Puntos de conexión en el borde: al pasar el mouse por un elemento aparecen 4 puntos; se arrastra desde uno hasta otro elemento.
import { esAnotacion, esDato, esNodo } from '../tipos.js';

const TIPO = 'fl-borde';
const conectable = (el) => el && !el.waypoints && (esNodo(el) || esDato(el) || esAnotacion(el));

export default class ConectarDesdeBorde {
  static $inject = ['eventBus', 'overlays', 'connect', 'directEditing'];

  constructor(eventBus, overlays, connect, directEditing) {
    this._overlays = overlays;
    this._actual = null;
    this._timer = null;
    this._arrastrando = false;
    this._bloqueado = false;

    eventBus.on('element.hover', (e) => {
      if (this._arrastrando || this._bloqueado || directEditing.isActive()) return;
      if (conectable(e.element)) this._mostrar(e.element);
    });
    eventBus.on('element.out', (e) => { if (e.element === this._actual) this._ocultarLuego(); });
    eventBus.on(['drag.init', 'connect.start', 'create.start', 'shape.move.start'], () => { this._arrastrando = true; this._ocultar(); });
    eventBus.on(['drag.cleanup'], () => { this._arrastrando = false; });
    eventBus.on(['shape.removed', 'commandStack.changed', 'directEditing.activate'], () => this._ocultar());

    this._conectar = (evento, el) => {
      evento.preventDefault();
      evento.stopPropagation();
      this._ocultar();
      connect.start(evento, el, null, true);
    };
  }

  // Modo solo lectura (Play): no mostrar puntos.
  bloquear(valor) {
    this._bloqueado = !!valor;
    if (valor) this._ocultar();
  }

  _mostrar(el) {
    clearTimeout(this._timer);
    if (this._actual === el) return;
    this._ocultar();
    this._actual = el;
    const w = el.width, h = el.height;
    const puntos = [[w / 2, 0], [w, h / 2], [w / 2, h], [0, h / 2]];
    for (const [x, y] of puntos) {
      const nodo = document.createElement('div');
      nodo.className = 'fl-borde-punto';
      nodo.title = 'Arrastra para conectar';
      nodo.addEventListener('mouseenter', () => clearTimeout(this._timer));
      nodo.addEventListener('mouseleave', () => this._ocultarLuego());
      nodo.addEventListener('mousedown', (e) => { if (e.button === 0) this._conectar(e, el); });
      this._overlays.add(el, TIPO, { position: { left: x - 7, top: y - 7 }, html: nodo });
    }
  }

  _ocultarLuego() {
    clearTimeout(this._timer);
    this._timer = setTimeout(() => this._ocultar(), 350);
  }

  _ocultar() {
    clearTimeout(this._timer);
    if (this._actual) this._overlays.remove({ type: TIPO });
    this._actual = null;
  }
}
