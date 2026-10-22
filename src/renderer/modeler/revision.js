// Revisión rápida del diagrama abierto (lo que el Play encontraría como problema, pero antes de recorrerlo):
// pasos sueltos o sin salida, decisiones sin pregunta o con caminos sin nombre, tareas sin nombre, falta inicio o fin.
// Lógica pura: recibe los elementos del lienzo y devuelve observaciones con el elemento a mostrar.
import { bo, es, esActividad, esCompuerta } from './tipos.js';

const secuencia = (c) => es(c, 'bpmn:SequenceFlow');
const entradas = (e) => (e.incoming || []).filter(secuencia);
const salidas = (e) => (e.outgoing || []).filter(secuencia);
const nombre = (e) => ((bo(e).name || '').trim());
const dentroDeSubproceso = (e) => es(e.parent, 'bpmn:SubProcess');
const poolDe = (e) => {
  let p = e.parent;
  while (p && !es(p, 'bpmn:Participant')) p = p.parent;
  return p || null;
};

/** @returns {{ texto: string, elemento?: any }[]} */
export function revisarDiagrama(elementos) {
  const nodos = elementos.filter((e) => !e.waypoints && !e.labelTarget && es(e, 'bpmn:FlowNode') && !es(e, 'bpmn:BoundaryEvent'));
  const obs = [];
  if (!nodos.length) return obs;
  // Inicio y fin por cada pool que tenga pasos (un pool vacío, que solo recibe mensajes, no los necesita).
  const porPool = new Map();
  for (const e of nodos.filter((x) => !dentroDeSubproceso(x))) {
    const p = poolDe(e);
    if (!porPool.has(p)) porPool.set(p, []);
    porPool.get(p).push(e);
  }
  for (const [pool, lista] of porPool) {
    const donde = porPool.size > 1 && pool && nombre(pool) ? ` en “${nombre(pool)}”` : '';
    if (!lista.some((e) => es(e, 'bpmn:StartEvent'))) obs.push({ texto: `Falta un evento de inicio (círculo verde)${donde}: el Play no sabe por dónde partir.`, elemento: pool || undefined });
    if (!lista.some((e) => es(e, 'bpmn:EndEvent'))) obs.push({ texto: `Falta un evento de fin (círculo rojo)${donde}: el proceso nunca termina.`, elemento: pool || undefined });
  }

  for (const e of nodos) {
    const n = nombre(e);
    const quien = n ? `“${n}”` : esCompuerta(e) ? 'Una decisión' : esActividad(e) ? 'Una tarea' : es(e, 'bpmn:StartEvent') ? 'El inicio' : es(e, 'bpmn:EndEvent') ? 'Un fin' : 'Un evento';
    // Solo cuenta una flecha normal: una nota, un documento o un mensaje que llega no hacen que el proceso pase por
    // aquí (el Play solo arranca otro pool cuando el mensaje llega a su inicio). Los inicios y los subprocesos de
    // evento no necesitan flecha de entrada; los fines, de salida.
    if (!es(e, 'bpmn:StartEvent') && !entradas(e).length && !bo(e).triggeredByEvent) obs.push({ texto: `${quien} no tiene flecha de entrada: nunca se llega a este paso.`, elemento: e });
    if (!es(e, 'bpmn:EndEvent') && !salidas(e).length) obs.push({ texto: `${quien} no tiene flecha de salida: el proceso se corta aquí.`, elemento: e });
    if (esActividad(e) && !n) obs.push({ texto: 'Hay una tarea sin nombre.', elemento: e });
    if (es(e, 'bpmn:ExclusiveGateway', 'bpmn:InclusiveGateway') && salidas(e).length > 1) {
      if (!n) obs.push({ texto: 'Una decisión no tiene pregunta (por ejemplo, “¿Está aprobado?”).', elemento: e });
      const sinNombre = salidas(e).filter((c) => !nombre(c)).length;
      if (sinNombre) obs.push({ texto: `${n ? quien : 'Una decisión'} tiene ${sinNombre === 1 ? 'un camino' : `${sinNombre} caminos`} sin nombre (por ejemplo, “Sí” o “No”).`, elemento: e });
    }
  }
  return obs;
}

/** Números del diagrama para el resumen del panel. */
export function contarDiagrama(elementos) {
  const nodos = elementos.filter((e) => !e.waypoints && !e.labelTarget);
  return {
    pasos: nodos.filter(esActividad).length,
    decisiones: nodos.filter((e) => es(e, 'bpmn:ExclusiveGateway', 'bpmn:InclusiveGateway') && salidas(e).length > 1).length,
    responsables: nodos.filter((e) => es(e, 'bpmn:Lane')).length,
    pools: nodos.filter((e) => es(e, 'bpmn:Participant')).map((e) => nombre(e)).filter(Boolean)
  };
}
