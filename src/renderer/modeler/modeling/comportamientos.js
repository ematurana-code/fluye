// Comportamientos automáticos del editor (todos se deshacen con Ctrl+Z junto con la acción que los provocó).
import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor.js';
import AutoResize from 'diagram-js/lib/features/auto-resize/AutoResize.js';
import AutoResizeProvider from 'diagram-js/lib/features/auto-resize/AutoResizeProvider.js';
import { getMid, asTRBL } from 'diagram-js/lib/layout/LayoutUtil.js';
import { computeChildrenBBox, getMinResizeBounds } from 'diagram-js/lib/features/resize/ResizeUtil.js';
import {
  cabeceraDe, bo, es, esCarril, esConexion, esPool, esSubprocesoExpandido, nuevoId, prefijoNombre
} from '../tipos.js';
import { leerNombre } from './comandos.js';
import { puedeConectar } from '../rules/FluyeRules.js';

const ALTO_CARRIL = 150;

export function carrilesDe(pool) {
  return (pool.children || []).filter(esCarril).sort((a, b) => a.y - b.y);
}

const SEPARACION_POOLS = 40;

// Dónde va un pool nuevo debajo de otro: mismo borde izquierdo y mismo ancho; si ahí ya hay otro pool, más abajo.
export function lugarBajoPool(pool, tamano) {
  const vecinos = ((pool.parent && pool.parent.children) || []).filter((p) => esPool(p) && p !== pool).sort((a, b) => a.y - b.y);
  let y = pool.y + pool.height + SEPARACION_POOLS;
  for (const v of vecinos) {
    const cruza = v.x < pool.x + pool.width && v.x + v.width > pool.x && v.y < y + tamano.height && v.y + v.height > y;
    if (cruza) y = v.y + v.height + SEPARACION_POOLS;
  }
  return { x: pool.x, y, width: pool.width, height: tamano.height };
}

// ---------- Soltar sobre un carril = el elemento queda en el pool ----------

export class PadreCorrecto extends CommandInterceptor {
  static $inject = ['eventBus'];

  constructor(eventBus) {
    super(eventBus);
    const alPool = (p) => (esCarril(p) ? p.parent : p);
    this.preExecute('shape.create', 2000, (e) => { if (!esCarril(e.context.shape)) e.context.parent = alPool(e.context.parent); });
    this.preExecute('elements.create', 2000, (e) => { e.context.parent = alPool(e.context.parent); });
    this.preExecute('elements.move', 2000, (e) => { if (e.context.newParent) e.context.newParent = alPool(e.context.newParent); });
    this.preExecute('shape.append', 2000, (e) => { if (e.context.target) e.context.target = alPool(e.context.target); });
  }
}

// ---------- El pool (y el subproceso abierto) crecen solos ----------

export class CrecimientoAutomatico extends AutoResize {
  static $inject = ['eventBus', 'elementRegistry', 'modeling', 'rules'];

  getOffset(forma) {
    return esPool(forma) ? { top: 40, bottom: 40, left: 60, right: 80 } : { top: 30, bottom: 30, left: 30, right: 30 };
  }

  getPadding(forma) {
    return esPool(forma) ? { top: 15, bottom: 15, left: cabeceraDe(forma) + 15, right: 25 } : { top: 25, bottom: 15, left: 15, right: 15 };
  }
}

export class ReglaCrecimiento extends AutoResizeProvider {
  static $inject = ['eventBus'];

  canResize(elementos, destino) {
    if (!(esPool(destino) || esSubprocesoExpandido(destino))) return false;
    return elementos.every((e) => !esCarril(e) && !esConexion(e));
  }
}

// ---------- Carriles: ocupan todo el ancho del pool y se apilan ----------

export class Carriles extends CommandInterceptor {
  static $inject = ['eventBus', 'modeling', 'elementRegistry'];

  constructor(eventBus, modeling, elementRegistry) {
    super(eventBus);
    this._modeling = modeling;
    this._registry = elementRegistry;

    // Crear un carril: se acomoda a lo ancho y, si ya hay otros, se inserta debajo del que está bajo el cursor.
    this.preExecute('shape.create', 1500, (e) => {
      const ctx = e.context;
      if (!esCarril(ctx.shape) || ctx.shape.pegado) return;
      const pool = esCarril(ctx.parent) ? ctx.parent.parent : ctx.parent;
      ctx.parent = pool;
      const lista = carrilesDe(pool);
      const x = pool.x + cabeceraDe(pool), ancho = pool.width - cabeceraDe(pool);
      let y, alto;
      if (!lista.length) {
        y = pool.y; alto = pool.height;
      } else {
        const ref = lista.find((c) => ctx.position.y >= c.y && ctx.position.y <= c.y + c.height) || lista[lista.length - 1];
        y = ref.y + ref.height; alto = ALTO_CARRIL;
        ctx.insertarEn = { y, alto, pool, ref };
      }
      ctx.shape.width = ancho;
      ctx.shape.height = alto;
      ctx.position = { x: x + ancho / 2, y: y + alto / 2 };
    });

    this.postExecute('shape.create', 1500, (e) => {
      const ctx = e.context;
      if (!esCarril(ctx.shape) || !ctx.insertarEn) return;
      const { y, alto, pool } = ctx.insertarEn;
      this._empujar(pool, y, alto, ctx.shape);
      modeling.resizeShape(pool, { x: pool.x, y: pool.y, width: pool.width, height: pool.height + alto }, null, { carriles: true, autoResize: false });
    });

    // Redimensionar el pool: los carriles lo siguen (el primero absorbe arriba, el último abajo).
    this.postExecute('shape.resize', 1500, (e) => {
      const ctx = e.context, hints = ctx.hints || {};
      if (hints.carriles) return;
      if (esPool(ctx.shape)) this._ajustarAlPool(ctx.shape, ctx.oldBounds);
      else if (esCarril(ctx.shape)) this._carrilRedimensionado(ctx.shape, ctx.oldBounds);
    });

    // Borrar un carril: el vecino ocupa su espacio.
    this.postExecute('shape.delete', 1500, (e) => {
      const ctx = e.context, borrado = ctx.shape, pool = ctx.oldParent;
      if (!esCarril(borrado) || !pool || !esPool(pool) || !this._registry.get(pool.id)) return;
      const lista = carrilesDe(pool);
      if (!lista.length) return;
      const arriba = lista.filter((c) => c.y < borrado.y).pop();
      const vecino = arriba || lista.find((c) => c.y > borrado.y);
      if (!vecino) return;
      const nuevo = arriba
        ? { x: vecino.x, y: vecino.y, width: vecino.width, height: vecino.height + borrado.height }
        : { x: vecino.x, y: borrado.y, width: vecino.width, height: vecino.height + borrado.height };
      modeling.resizeShape(vecino, nuevo, null, { carriles: true, autoResize: false });
    });
  }

  // Mueve hacia abajo (dy) los carriles y elementos del pool que estén desde `desdeY` hacia abajo.
  _empujar(pool, desdeY, dy, excepto) {
    const mover = (pool.children || []).filter((h) => h !== excepto && !esConexion(h) && h.y >= desdeY - 1);
    if (mover.length) this._modeling.moveElements(mover, { x: 0, y: dy }, pool, { carriles: true, autoResize: false });
  }

  _ajustarAlPool(pool, antes) {
    const lista = carrilesDe(pool);
    if (!lista.length || !antes) return;
    const x = pool.x + cabeceraDe(pool), ancho = pool.width - cabeceraDe(pool);
    const dArriba = antes.y - pool.y;
    const dAbajo = pool.y + pool.height - (antes.y + antes.height);
    lista.forEach((c, i) => {
      let y = c.y, alto = c.height;
      if (i === 0) { y = pool.y; alto += dArriba; }
      if (i === lista.length - 1) alto += dAbajo;
      alto = Math.max(40, alto);
      if (c.x !== x || c.width !== ancho || c.y !== y || c.height !== alto) {
        this._modeling.resizeShape(c, { x, y, width: ancho, height: alto }, null, { carriles: true, autoResize: false });
      }
    });
  }

  _carrilRedimensionado(carril, antes) {
    const pool = carril.parent;
    if (!antes || !esPool(pool)) return;
    const dy = carril.height - antes.height;
    if (!dy) return;
    const finAntes = antes.y + antes.height;
    const mover = (pool.children || []).filter((h) => h !== carril && !esConexion(h) && h.y >= finAntes - 1);
    if (mover.length) this._modeling.moveElements(mover, { x: 0, y: dy }, pool, { carriles: true, autoResize: false });
    this._modeling.resizeShape(pool, { x: pool.x, y: pool.y, width: pool.width, height: pool.height + dy }, null, { carriles: true, autoResize: false });
  }
}

// Comando "Agregar carril" (botón del menú rápido del pool o de un carril).
export class AgregarCarrilHandler {
  static $inject = ['modeling', 'elementFactory'];

  constructor(modeling, elementFactory) {
    this._modeling = modeling;
    this._factory = elementFactory;
  }

  preExecute(ctx) {
    const pool = esCarril(ctx.elemento) ? ctx.elemento.parent : ctx.elemento;
    const lista = carrilesDe(pool);
    const nuevo = () => this._factory.createShape({ type: 'bpmn:Lane' });
    if (!lista.length) {
      ctx.creados = [this._modeling.createShape(nuevo(), getMid(pool), pool)];
      const ultimo = ctx.creados[0];
      ctx.creados.push(this._modeling.createShape(nuevo(), { x: getMid(pool).x, y: ultimo.y + ultimo.height - 5 }, pool));
      return;
    }
    const ref = esCarril(ctx.elemento) ? ctx.elemento : lista[lista.length - 1];
    ctx.creados = [this._modeling.createShape(nuevo(), { x: getMid(ref).x, y: ref.y + ref.height - 5 }, pool)];
  }

  execute() { return []; }
  revert() { return []; }
}

// ---------- Un pool soltado sobre otro pool (o sobre un carril) queda en el lienzo, debajo de ese pool ----------
// Así arrastrar "Pool" desde la paleta encima de lo que ya hay lo agrega, en vez de rechazarlo.

export class PoolBajoOtro extends CommandInterceptor {
  static $inject = ['eventBus', 'modeling'];

  constructor(eventBus, modeling) {
    super(eventBus);
    this._modeling = modeling;
    // Corre después de PadreCorrecto (2000), que ya convirtió un carril apuntado en su pool.
    this.preExecute('shape.create', 1900, (e) => {
      const ctx = e.context;
      if (!esPool(ctx.shape) || !ctx.parent) return;
      const sobre = esCarril(ctx.parent) ? ctx.parent.parent : ctx.parent;
      if (!esPool(sobre) || !sobre.parent) return;
      ctx.parent = sobre.parent;
      ctx.position = lugarBajoPool(sobre, ctx.shape);
    });
    // Cuando un pool crece (un carril nuevo, un paso cerca del borde), los pools que quedan debajo se corren.
    this.postExecuted('shape.resize', 500, (e) => {
      const pool = e.context.shape;
      if (esPool(pool) && pool.parent) this._separar(pool);
    });
  }

  _separar(pool) {
    const abajo = ((pool.parent && pool.parent.children) || [])
      .filter((p) => esPool(p) && p !== pool && p.y >= pool.y && p.x < pool.x + pool.width && p.x + p.width > pool.x)
      .sort((a, b) => a.y - b.y);
    let borde = pool.y + pool.height;
    for (const p of abajo) {
      const dy = borde + SEPARACION_POOLS - p.y;
      if (dy > 0) this._modeling.moveElements([p], { x: 0, y: dy }, pool.parent, { autoResize: false });
      borde = p.y + p.height;
    }
  }
}

// Comando "Agregar pool debajo" (botón del menú rápido de un pool).
export class AgregarPoolHandler {
  static $inject = ['modeling', 'elementFactory'];

  constructor(modeling, elementFactory) {
    this._modeling = modeling;
    this._factory = elementFactory;
  }

  preExecute(ctx) {
    const pool = ctx.elemento;
    const nuevo = this._factory.createShape({ type: 'bpmn:Participant' });
    ctx.creados = [this._modeling.createShape(nuevo, lugarBajoPool(pool, nuevo), pool.parent)];
  }

  execute() { return []; }
  revert() { return []; }
}

// ---------- Tamaño mínimo al redimensionar ----------
// Pool con carriles: el mínimo es lo que tiene dibujado adentro (no los carriles, que lo cubren entero y no dejarían
// angostarlo) y que el primer y el último carril sigan midiendo al menos 40. Carril: no puede dejar afuera sus pasos.

export class TamanoMinimo {
  static $inject = ['eventBus'];

  constructor(eventBus) {
    eventBus.on('resize.start', 1500, ({ context }) => {
      const f = context.shape;
      const pasos = (p) => (p.children || []).filter((h) => !esCarril(h) && !h.waypoints && !h.labelTarget);
      if (esPool(f)) {
        const caja = computeChildrenBBox(pasos(f), { top: 15, bottom: 15, left: 15, right: 25 });
        let min = getMinResizeBounds(context.direction, f, { width: 300, height: 80 }, caja);
        const lista = carrilesDe(f);
        if (lista.length > 1) {
          const arriba = Math.min(min.y, lista[0].y + lista[0].height - 40);
          const abajo = Math.max(min.y + min.height, lista[lista.length - 1].y + 40);
          min = { x: min.x, y: arriba, width: min.width, height: abajo - arriba };
        }
        context.minBounds = min;
      } else if (esCarril(f) && esPool(f.parent)) {
        const dentro = pasos(f.parent).filter((h) => { const cy = h.y + h.height / 2; return cy >= f.y && cy <= f.y + f.height; });
        const alto = Math.max(40, ...dentro.map((h) => h.y + h.height + 10 - f.y));
        context.minBounds = { x: f.x, y: f.y, width: f.width, height: alto };
      }
    });
  }
}

// ---------- Al mover pasos a otro pool o dentro/fuera de un subproceso, las flechas siguen siendo válidas ----------
// Una flecha normal entre dos pools pasa a ser mensaje; si ya no puede existir (por ejemplo, entre un subproceso y
// afuera), se quita. Igual que en bpmn.io. Todo se deshace junto con el movimiento.

export class FlechasValidas extends CommandInterceptor {
  static $inject = ['eventBus', 'modeling'];

  constructor(eventBus, modeling) {
    super(eventBus);
    // postExecuted: diagram-js mueve las figuras recién en el postExecute del propio comando.
    this.postExecuted('elements.move', 1000, (e) => {
      const ctx = e.context;
      if ((ctx.hints || {}).carriles) return;
      const formas = ctx.closure ? Object.values(ctx.closure.allShapes) : ctx.shapes;
      const flechas = new Set();
      for (const f of formas) for (const c of [...(f.incoming || []), ...(f.outgoing || [])]) flechas.add(c);
      for (const c of flechas) {
        if (!c.source || !c.target) continue;
        const r = puedeConectar(c.source, c.target, c);
        if (r && r.type === c.type) continue;
        const { source, target } = c;
        const nombre = leerNombre(c);
        modeling.removeConnection(c);
        if (!r) continue;
        const nueva = modeling.connect(source, target, { type: r.type });
        if (nueva && nombre) modeling.renombrar(nueva, nombre);
      }
    });
  }
}

// ---------- Nombres por defecto sin repetir: "Tarea 1", "Tarea 2"... ----------

export class NombresUnicos extends CommandInterceptor {
  static $inject = ['eventBus', 'elementRegistry'];

  constructor(eventBus, elementRegistry) {
    super(eventBus);
    this.preExecute('shape.create', 500, (e) => {
      const forma = e.context.shape, b = bo(forma);
      const prefijo = prefijoNombre(b.$type);
      if (!prefijo || b.name) return;
      let max = 0;
      const patron = new RegExp(`^${prefijo} (\\d+)$`);
      for (const el of elementRegistry.getAll()) {
        const m = patron.exec(bo(el).name || '');
        if (m) max = Math.max(max, Number(m[1]));
      }
      b.name = `${prefijo} ${max + 1}`;
    });
  }
}

// ---------- Ubicación automática al agregar el siguiente elemento ----------

export class UbicacionAutomatica {
  static $inject = ['eventBus', 'elementRegistry'];

  constructor(eventBus, elementRegistry) {
    eventBus.on('autoPlace', 1500, ({ source, shape }) => {
      const o = asTRBL(source), medio = getMid(source);
      const x = o.right + 70 + shape.width / 2;
      const ocupado = (cx, cy) => elementRegistry.filter((el) => el.parent === source.parent && !esConexion(el) && !esCarril(el) && el !== shape)
        .some((el) => cx + shape.width / 2 + 10 > el.x && cx - shape.width / 2 - 10 < el.x + el.width &&
          cy + shape.height / 2 + 10 > el.y && cy - shape.height / 2 - 10 < el.y + el.height);
      // Deja la figura completa dentro del carril donde cae su centro (sin quedar montada en la línea).
      const carriles = esPool(source.parent) ? carrilesDe(source.parent) : [];
      const dentroDeCarril = (cy) => {
        const c = carriles.find((l) => cy >= l.y && cy <= l.y + l.height);
        if (!c || c.height < shape.height + 20) return cy;
        return Math.min(Math.max(cy, c.y + shape.height / 2 + 10), c.y + c.height - shape.height / 2 - 10);
      };
      const paso = shape.height + 50;
      for (const dy of [0, paso, -paso, 2 * paso, -2 * paso, 3 * paso]) {
        const cy = dentroDeCarril(medio.y + dy);
        if (!ocupado(x, cy)) return { x, y: cy };
      }
      return { x, y: dentroDeCarril(medio.y) };
    });
  }
}

// ---------- Copiar y pegar: cada copia lleva su propio objeto BPMN ----------

export class CopiarPegar {
  static $inject = ['eventBus', 'moddle'];

  constructor(eventBus, moddle) {
    eventBus.on('copyPaste.copyElement', 1500, ({ descriptor, element }) => {
      const b = bo(element);
      descriptor.type = element.type;
      descriptor.colores = element.colores;
      descriptor.marcadorVisible = element.marcadorVisible;
      descriptor.datos = {
        name: es(b, 'bpmn:Group') ? leerNombre(element) : b.name, text: b.text, documentacion: (b.documentation || []).map((d) => d.text),
        eventos: (b.eventDefinitions || []).map((d) => d.$type), cancelActivity: b.cancelActivity
      };
    });
    eventBus.on('copyPaste.pasteElement', 1500, ({ descriptor }) => {
      const d = descriptor.datos || {};
      const nuevo = moddle.create(descriptor.type, { id: nuevoId(descriptor.type) });
      // El nombre de un grupo vive en su categoría: la copia lleva una propia.
      if (descriptor.type === 'bpmn:Group') nuevo.categoryValueRef = moddle.create('bpmn:CategoryValue', { id: nuevoId('CategoryValue'), value: d.name || '' });
      else if (d.name) nuevo.name = d.name;
      descriptor.pegado = true;
      if (d.text) nuevo.text = d.text;
      if (d.documentacion && d.documentacion.length) nuevo.documentation = d.documentacion.map((t) => moddle.create('bpmn:Documentation', { text: t }));
      if (d.eventos && d.eventos.length) nuevo.eventDefinitions = d.eventos.map((t) => moddle.create(t, { id: nuevoId('EventDefinition') }));
      if (descriptor.type === 'bpmn:Participant') nuevo.processRef = moddle.create('bpmn:Process', { id: nuevoId('bpmn:Process'), isExecutable: false });
      if (descriptor.type === 'bpmn:DataObjectReference') nuevo.dataObjectRef = moddle.create('bpmn:DataObject', { id: nuevoId('bpmn:DataObject') });
      descriptor.businessObject = nuevo;
      descriptor.id = nuevo.id;
      delete descriptor.datos;
    });
    eventBus.on('copyPaste.canCopyElements', ({ elements }) => elements.filter((e) => !esCarril(e)));
  }
}
