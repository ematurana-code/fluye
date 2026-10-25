// Reglas de modelado: qué se conecta con qué, dónde se suelta cada elemento y qué se redimensiona.
import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider.js';
import {
  es, esActividad, esAnotacion, esCarril, esCompuerta, esConexion, esDato, esGrupo, esNodo, esPool,
  esSubprocesoExpandido
} from '../tipos.js';

export function poolDe(el) {
  let p = el;
  while (p) {
    if (esPool(p)) return p;
    p = p.parent;
  }
  return null;
}

// Contenedor que define a qué proceso/subproceso pertenece un elemento.
export function contenedorDe(el) {
  let p = el && el.parent;
  while (p) {
    if (esPool(p) || esSubprocesoExpandido(p) || !p.parent) return p;
    p = p.parent;
  }
  return null;
}

const esRaiz = (el) => el && !el.parent;
// La raíz del lienzo puede ser un proceso o un subproceso detallado en su propia pestaña: los dos reciben figuras.
const raizEsProceso = (el) => esRaiz(el) && es(el, 'bpmn:Process', 'bpmn:SubProcess');

// ignorar: la flecha que se está reconectando (si no, al mover su punta en la misma figura se encontraría a sí misma).
function existeConexion(origen, destino, tipo, ignorar) {
  return (origen.outgoing || []).some((c) => c !== ignorar && c.target === destino && c.type === tipo);
}

export function puedeConectar(origen, destino, ignorar) {
  if (!origen || !destino || origen === destino) return false;
  if (esConexion(origen) || esConexion(destino) || esRaiz(origen) || esRaiz(destino)) return false;
  if (esCarril(origen) || esCarril(destino) || esGrupo(origen) || esGrupo(destino)) return false;

  if (esAnotacion(origen) || esAnotacion(destino)) {
    return esAnotacion(origen) && esAnotacion(destino) ? false : { type: 'bpmn:Association' };
  }

  // Un dato entra a una tarea o a un evento que envía (fin, intermedio de envío) y sale de una tarea o de un evento
  // que recibe (inicio, intermedio de recepción). Al revés el BPMN no tiene dónde guardarlo.
  if (esDato(origen) || esDato(destino)) {
    if (esDato(origen) && esDato(destino)) return false;
    if (esDato(origen)) return esActividad(destino) || es(destino, 'bpmn:ThrowEvent') ? { type: 'bpmn:DataInputAssociation' } : false;
    return esActividad(origen) || es(origen, 'bpmn:CatchEvent') ? { type: 'bpmn:DataOutputAssociation' } : false;
  }

  const poolOrigen = poolDe(origen), poolDestino = poolDe(destino);
  if (esPool(origen) || esPool(destino) || (poolOrigen && poolDestino && poolOrigen !== poolDestino)) {
    if (poolOrigen === poolDestino) return false;
    if (esCompuerta(origen) || esCompuerta(destino)) return false;
    if (existeConexion(origen, destino, 'bpmn:MessageFlow', ignorar)) return false;
    return { type: 'bpmn:MessageFlow' };
  }

  if (!esNodo(origen) || !esNodo(destino)) return false;
  if (contenedorDe(origen) !== contenedorDe(destino)) return false;
  if (es(origen, 'bpmn:EndEvent') || es(destino, 'bpmn:StartEvent')) return false;
  if (es(destino, 'bpmn:BoundaryEvent')) return false;
  if (existeConexion(origen, destino, 'bpmn:SequenceFlow', ignorar)) return false;
  return { type: 'bpmn:SequenceFlow' };
}

export function puedeSoltar(forma, destino) {
  if (!destino) return false;
  if (esPool(forma)) return esRaiz(destino) && !raizEsProceso(destino);
  if (esCarril(forma)) return esPool(destino) || esCarril(destino);
  if (esGrupo(forma)) return esRaiz(destino) || esPool(destino) || esCarril(destino) || esSubprocesoExpandido(destino);
  if (esNodo(forma) || esDato(forma) || esAnotacion(forma)) {
    return esPool(destino) || esCarril(destino) || esSubprocesoExpandido(destino) || raizEsProceso(destino) ||
      (esAnotacion(forma) && esRaiz(destino));
  }
  return false;
}

// Al crear desde la paleta, un pool también se puede soltar encima de otro pool o de un carril: el comportamiento
// PoolBajoOtro lo deja en el lienzo, debajo del pool apuntado. (Mover un pool ya dibujado sobre otro sigue sin permitirse.)
export function puedeCrear(forma, destino) {
  if (esPool(forma) && (esPool(destino) || esCarril(destino))) {
    let raiz = destino;
    while (raiz.parent) raiz = raiz.parent;
    return es(raiz, 'bpmn:Collaboration');
  }
  return puedeSoltar(forma, destino);
}

export default class FluyeRules extends RuleProvider {
  static $inject = ['eventBus'];

  init() {
    this.addRule('connection.create', (ctx) => puedeConectar(ctx.source, ctx.target));

    this.addRule('connection.reconnect', (ctx) => {
      const r = puedeConectar(ctx.source, ctx.target, ctx.connection);
      return !!r && r.type === ctx.connection.type;
    });

    this.addRule('connection.updateWaypoints', () => true);

    this.addRule('shape.create', (ctx) => puedeCrear(ctx.shape, ctx.target));

    this.addRule('elements.create', (ctx) => {
      const formas = ctx.elements.filter((e) => !e.waypoints);
      return formas.every((f) => (f.parent ? true : puedeCrear(f, ctx.target)));
    });

    this.addRule('elements.move', (ctx) => {
      const formas = ctx.shapes;
      if (formas.some((f) => esCarril(f))) return false;
      if (!ctx.target) return true;
      return formas.every((f) => f.parent === ctx.target || puedeSoltar(f, ctx.target) ||
        (esCarril(ctx.target) && f.parent === ctx.target.parent));
    });

    this.addRule('shape.resize', (ctx) => {
      const { shape: f, newBounds: nb, direction } = ctx;
      if (esCarril(f)) return !direction || direction === 's';
      const redimensionable = esPool(f) || esActividad(f) || esAnotacion(f) || esGrupo(f) || es(f, 'bpmn:DataStoreReference');
      if (!redimensionable) return false;
      if (!nb) return true;
      const min = esPool(f) ? { w: 300, h: 80 } : esSubprocesoExpandido(f) ? { w: 140, h: 90 } : { w: 50, h: 30 };
      return nb.width >= min.w && nb.height >= min.h;
    });

    this.addRule('element.copy', () => true);
  }
}
