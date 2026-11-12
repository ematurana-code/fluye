// Comportamientos de los elementos que agregan fases, eventos de borde y textos (todo se deshace con Ctrl+Z junto
// con la acción que lo provocó).
import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor.js';
import {
  ALTO_CABECERA_FASE, bo, cabeceraDe, esActividad, esBorde, esFase, esPool, esTexto, fasesDe, nuevoId
} from '../tipos.js';
import { partirLineas } from '../draw/texto.js';
import { formatoTexto } from '../draw/FluyeRenderer.js';

export const ANCHO_MIN_FASE = 80;
const ANCHO_FASE_NUEVA = 220;

function poolDe(el) {
  let p = el;
  while (p && !esPool(p)) p = p.parent;
  return p || null;
}

// ---------- Fases: columnas que cubren el pool de lado a lado, una tras otra ----------
// Soltar una fase sobre otra la divide donde se soltó; si no cabe, se agrega a la derecha y el pool se alarga.
// Al cambiar el pool de tamaño, la primera y la última fase lo siguen; al angostar o ensanchar una fase, se corre
// el borde de la vecina; al borrar una, la vecina ocupa su lugar.

export class Fases extends CommandInterceptor {
  static $inject = ['eventBus', 'modeling', 'elementRegistry', 'injector'];

  constructor(eventBus, modeling, elementRegistry, injector) {
    super(eventBus);
    this._modeling = modeling;
    const redimensionar = (f, caja) => {
      const nb = { x: Math.round(caja.x), y: Math.round(caja.y), width: Math.round(caja.width), height: Math.round(caja.height) };
      if (nb.x !== f.x || nb.y !== f.y || nb.width !== f.width || nb.height !== f.height) modeling.resizeShape(f, nb, null, { fases: true, autoResize: false });
    };
    this._redimensionar = redimensionar;

    this.preExecute('shape.create', 1500, (e) => {
      const ctx = e.context;
      if (!esFase(ctx.shape)) return;
      const pool = poolDe(ctx.parent);
      if (!pool) return;
      ctx.parent = pool;
      ctx.parentIndex = 0; // al fondo del pool: debajo de carriles y pasos
      const x0 = pool.x + cabeceraDe(pool), fin = pool.x + pool.width;
      const lista = fasesDe(pool);
      let x, ancho;
      if (!lista.length) {
        x = x0; ancho = fin - x0;
      } else {
        const px = Math.round(ctx.position.x);
        const sobre = lista.find((f) => px >= f.x && px <= f.x + f.width);
        if (sobre && px - sobre.x >= ANCHO_MIN_FASE && sobre.x + sobre.width - px >= ANCHO_MIN_FASE) {
          x = px; ancho = sobre.x + sobre.width - px;
          ctx.dividir = { fase: sobre, ancho: px - sobre.x };
        } else {
          x = fin; ancho = ANCHO_FASE_NUEVA;
          ctx.agrandar = { pool, ancho };
        }
      }
      ctx.shape.width = ancho;
      ctx.shape.height = pool.height;
      ctx.position = { x: x + ancho / 2, y: pool.y + pool.height / 2 };
    });

    this.postExecute('shape.create', 1500, (e) => {
      const ctx = e.context;
      if (ctx.dividir) {
        const f = ctx.dividir.fase;
        redimensionar(f, { x: f.x, y: f.y, width: ctx.dividir.ancho, height: f.height });
      }
      if (ctx.agrandar) {
        const { pool, ancho } = ctx.agrandar;
        modeling.resizeShape(pool, { x: pool.x, y: pool.y, width: pool.width + ancho, height: pool.height }, null, { fases: true, autoResize: false });
      }
    });

    this.postExecute('shape.resize', 1500, (e) => {
      const ctx = e.context, hints = ctx.hints || {};
      if (hints.fases) return;
      if (esPool(ctx.shape)) this._ajustarAlPool(ctx.shape);
      else if (esFase(ctx.shape)) this._faseRedimensionada(ctx.shape, ctx.oldBounds);
    });

    this.postExecute('shape.delete', 1500, (e) => {
      const ctx = e.context, borrada = ctx.shape, pool = ctx.oldParent;
      if (!esFase(borrada) || !pool || !elementRegistry.get(pool.id)) return;
      const lista = fasesDe(pool);
      if (!lista.length) return;
      const izquierda = lista.filter((f) => f.x < borrada.x).pop();
      if (izquierda) redimensionar(izquierda, { x: izquierda.x, y: pool.y, width: borrada.x + borrada.width - izquierda.x, height: pool.height });
      else {
        const derecha = lista[0];
        redimensionar(derecha, { x: borrada.x, y: pool.y, width: derecha.x + derecha.width - borrada.x, height: pool.height });
      }
    });

    // Una fase solo recibe clics en su franja con el nombre y en su línea punteada: el resto del pool sigue siendo
    // de los carriles y los pasos.
    const interaccion = injector.get('interactionEvents', false);
    if (interaccion) {
      eventBus.on(['interactionEvents.createHit', 'interactionEvents.updateHit'], 1500, ({ element, gfx }) => {
        if (!esFase(element) || !gfx) return;
        interaccion.removeHits(gfx);
        interaccion.createBoxHit(gfx, 'all', { width: element.width, height: ALTO_CABECERA_FASE });
        interaccion.createWaypointsHit(gfx, [{ x: element.width, y: ALTO_CABECERA_FASE }, { x: element.width, y: element.height }]);
        return false; // sin la zona de clic por defecto
      });
    }
  }

  // La primera fase empieza donde termina la franja del nombre del pool; la última llega a su borde derecho; todas
  // tienen el alto del pool.
  _ajustarAlPool(pool) {
    const lista = fasesDe(pool);
    if (!lista.length) return;
    const x0 = pool.x + cabeceraDe(pool), fin = pool.x + pool.width;
    lista.forEach((f, i) => {
      const x = i === 0 ? x0 : f.x;
      const derecha = i === lista.length - 1 ? fin : f.x + f.width;
      this._redimensionar(f, { x, y: pool.y, width: Math.max(ANCHO_MIN_FASE, derecha - x), height: pool.height });
    });
  }

  _faseRedimensionada(fase, antes) {
    const pool = fase.parent;
    if (!esPool(pool) || !antes) return;
    const lista = fasesDe(pool);
    const i = lista.indexOf(fase);
    const derecha = fase.x + fase.width, derechaAntes = antes.x + antes.width;
    if (derecha !== derechaAntes) {
      const siguiente = lista[i + 1];
      if (siguiente) this._redimensionar(siguiente, { x: derecha, y: pool.y, width: siguiente.x + siguiente.width - derecha, height: pool.height });
      else this._modeling.resizeShape(pool, { x: pool.x, y: pool.y, width: derecha - pool.x, height: pool.height }, null, { fases: true, autoResize: false });
    }
    if (fase.x !== antes.x) {
      const anterior = lista[i - 1];
      if (anterior) this._redimensionar(anterior, { x: anterior.x, y: pool.y, width: fase.x - anterior.x, height: pool.height });
    }
    if (fase.y !== pool.y || fase.height !== pool.height) this._redimensionar(fase, { x: fase.x, y: pool.y, width: fase.width, height: pool.height });
  }
}

// ---------- Eventos de borde ----------
// Un evento intermedio soltado en el borde de una tarea queda pegado a ella (se mueve con ella). Si se suelta un evento
// sin tipo, pasa a ser un plazo (temporizador): un evento de borde siempre necesita qué lo dispara.

const DISTANCIA_BORDE = 16;

// Punto del borde de la figura más cercano a `p`.
export function puntoEnBorde(f, p) {
  const x = Math.min(Math.max(p.x, f.x), f.x + f.width), y = Math.min(Math.max(p.y, f.y), f.y + f.height);
  const d = [[Math.abs(x - f.x), 'izq'], [Math.abs(f.x + f.width - x), 'der'], [Math.abs(y - f.y), 'arr'], [Math.abs(f.y + f.height - y), 'aba']]
    .sort((a, b) => a[0] - b[0])[0][1];
  if (d === 'izq') return { x: f.x, y: Math.round(y) };
  if (d === 'der') return { x: f.x + f.width, y: Math.round(y) };
  if (d === 'arr') return { x: Math.round(x), y: f.y };
  return { x: Math.round(x), y: f.y + f.height };
}

// ¿Se puede pegar este evento a esta figura soltándolo en `posicion`? (Sin posición: al cambiar el tipo de la tarea.)
export function puedeAnclar(forma, destino, posicion) {
  if (!forma || !destino || !esActividad(destino) || forma === destino) return false;
  const evento = esBorde(forma) || forma.type === 'bpmn:IntermediateCatchEvent' || forma.type === 'bpmn:IntermediateThrowEvent';
  if (!evento) return false;
  if (!posicion) return true;
  const { x, y } = posicion, d = DISTANCIA_BORDE;
  const dentroAmpliado = x >= destino.x - d && x <= destino.x + destino.width + d && y >= destino.y - d && y <= destino.y + destino.height + d;
  const dentroAchicado = x > destino.x + d && x < destino.x + destino.width - d && y > destino.y + d && y < destino.y + destino.height - d;
  return dentroAmpliado && !dentroAchicado;
}

export class EventosDeBorde extends CommandInterceptor {
  static $inject = ['eventBus', 'moddle'];

  constructor(eventBus, moddle) {
    super(eventBus);
    // Al crear pegado a una tarea: el evento pasa a ser de borde y se centra sobre la línea.
    this.preExecute('shape.create', 1600, (e) => {
      const ctx = e.context, forma = ctx.shape, host = ctx.host;
      if (!host) return;
      if (!esBorde(forma)) {
        const viejo = bo(forma);
        const nuevo = moddle.create('bpmn:BoundaryEvent', { id: nuevoId('bpmn:BoundaryEvent'), cancelActivity: true });
        if (viejo.name) nuevo.name = viejo.name;
        nuevo.eventDefinitions = (viejo.eventDefinitions || []).length ? viejo.eventDefinitions : [moddle.create('bpmn:TimerEventDefinition', { id: nuevoId('EventDefinition') })];
        Object.assign(forma, { businessObject: nuevo, type: 'bpmn:BoundaryEvent', id: nuevo.id });
      } else if (!(bo(forma).eventDefinitions || []).length) {
        bo(forma).eventDefinitions = [moddle.create('bpmn:TimerEventDefinition', { id: nuevoId('EventDefinition') })];
      }
      bo(forma).attachedToRef = bo(host);
      ctx.position = puntoEnBorde(host, ctx.position);
    });
    // Al moverlo por el borde (o a otra tarea): queda centrado sobre la línea.
    this.preExecute('elements.move', 1600, (e) => {
      const ctx = e.context, hints = ctx.hints || {};
      if (!hints.attach || !ctx.newHost || ctx.shapes.length !== 1 || !esBorde(ctx.shapes[0])) return;
      const f = ctx.shapes[0], cx = f.x + f.width / 2, cy = f.y + f.height / 2;
      const destino = puntoEnBorde(ctx.newHost, { x: cx + ctx.delta.x, y: cy + ctx.delta.y });
      ctx.delta = { x: destino.x - cx, y: destino.y - cy };
    });
    this.postExecuted('elements.move', 1600, (e) => {
      for (const f of e.context.shapes || []) if (esBorde(f) && f.host) bo(f).attachedToRef = bo(f.host);
    });
    // Al cambiar el tipo de la tarea (tarea → tarea de usuario), sus eventos pasan a la nueva.
    this.executed('element.updateAttachment', (e) => {
      const f = e.context.shape;
      if (esBorde(f) && f.host) bo(f).attachedToRef = bo(f.host);
    });
    this.reverted('element.updateAttachment', (e) => {
      const f = e.context.shape;
      if (esBorde(f) && f.host) bo(f).attachedToRef = bo(f.host);
    });
  }
}

// ---------- Texto libre: crece hacia abajo si lo escrito no cabe ----------

export class TextoAjustable extends CommandInterceptor {
  static $inject = ['eventBus', 'modeling'];

  constructor(eventBus, modeling) {
    super(eventBus);
    const ajustar = (e) => {
      const el = e.context.elemento;
      if (!esTexto(el)) return;
      const f = formatoTexto(el);
      const lineas = partirLineas(bo(el).name || '', Math.max(10, el.width - 12), f.tamano, f.peso).length;
      const alto = Math.ceil(lineas * f.tamano * 1.25 + 10);
      if (alto > el.height) modeling.resizeShape(el, { x: el.x, y: el.y, width: el.width, height: alto }, null, { autoResize: false });
    };
    this.postExecute('elemento.renombrar', ajustar);
    this.postExecute('elemento.propiedades', ajustar);
  }
}
