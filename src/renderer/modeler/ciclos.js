// Ciclos sin salida: pasos que se llevan entre ellos en vuelta y desde los que ninguna flecha llega a un fin, así que
// el proceso daría vueltas para siempre. Lógica pura sobre las figuras del lienzo; la usan la revisión rápida y el Play.
// - Salidas de un paso: sus flechas normales y, si es una tarea o un subproceso, los eventos pegados a su borde.
// - Cuenta como final: un evento de fin, un paso sin salida (la revisión ya lo avisa aparte), un evento que lanza un
//   enlace y un subproceso de evento. Los mensajes entre pools no son salidas: el Play solo sigue flechas normales.
import { es } from './tipos.js';

const siguientes = (e) => [
  ...(e.outgoing || []).filter((c) => es(c, 'bpmn:SequenceFlow')).map((c) => c.target),
  ...(e.attachers || []).filter((b) => es(b, 'bpmn:BoundaryEvent'))
].filter(Boolean);

const esFinal = (e) => es(e, 'bpmn:EndEvent') || !siguientes(e).length || !!e.businessObject?.triggeredByEvent
  || (es(e, 'bpmn:IntermediateThrowEvent') && (e.businessObject.eventDefinitions || []).some((d) => d.$type === 'bpmn:LinkEventDefinition'));

/** @returns {any[][]} cada grupo son los pasos de un ciclo sin salida, en el orden en que se recorren */
export function ciclosSinSalida(elementos) {
  const nodos = new Set(elementos.filter((e) => !e.waypoints && !e.labelTarget && es(e, 'bpmn:FlowNode')));
  for (const e of [...nodos]) for (const s of siguientes(e)) nodos.add(s); // los eventos de borde también son pasos

  // Lo que puede llegar a un final: se parte de los finales y se camina hacia atrás.
  const llega = new Set([...nodos].filter(esFinal));
  const previos = new Map();
  for (const e of nodos) for (const s of siguientes(e)) {
    if (!previos.has(s)) previos.set(s, []);
    previos.get(s).push(e);
  }
  const pila = [...llega];
  while (pila.length) {
    for (const p of previos.get(pila.pop()) || []) if (!llega.has(p)) { llega.add(p); pila.push(p); }
  }

  // Entre los que no llegan a ningún final, los grupos que dan vuelta (componentes fuertemente conexas, Tarjan).
  const atrapados = [...nodos].filter((e) => !llega.has(e));
  const dentro = new Set(atrapados);
  const indice = new Map(), bajo = new Map(), enPila = new Set(), camino = [], grupos = [];
  let n = 0;
  const visitar = (v) => {
    indice.set(v, n); bajo.set(v, n); n++;
    camino.push(v); enPila.add(v);
    for (const w of siguientes(v).filter((x) => dentro.has(x))) {
      if (!indice.has(w)) { visitar(w); bajo.set(v, Math.min(bajo.get(v), bajo.get(w))); }
      else if (enPila.has(w)) bajo.set(v, Math.min(bajo.get(v), indice.get(w)));
    }
    if (bajo.get(v) !== indice.get(v)) return;
    const grupo = [];
    let w;
    do { w = camino.pop(); enPila.delete(w); grupo.push(w); } while (w !== v);
    if (grupo.length > 1 || siguientes(v).includes(v)) grupos.push(grupo.reverse());
  };
  for (const v of atrapados) if (!indice.has(v)) visitar(v);
  return grupos;
}
