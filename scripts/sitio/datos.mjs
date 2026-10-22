// Lee cada plantilla (.bpmn) y saca lo que cuenta su página: pools, responsables con sus pasos, decisiones,
// eventos, mensajes y pestañas. Así cada página de plantilla tiene su propio texto, sacado del proceso real.
import { BpmnModdle } from 'bpmn-moddle';

const es = (el, tipo) => !!el && typeof el.$instanceOf === 'function' && el.$instanceOf(tipo);
const nombre = (el) => (el && el.name ? String(el.name).replace(/\s+/g, ' ').trim() : '');

// Todo lo que vive dentro de un proceso, incluido lo que está dentro de sus subprocesos.
function elementos(contenedor, lista = []) {
  for (const fe of contenedor.flowElements || []) {
    lista.push(fe);
    if (es(fe, 'bpmn:SubProcess')) elementos(fe, lista);
  }
  return lista;
}

// A qué pasos lleva un camino: si llega a una compuerta sin nombre (un paralelo, una unión), se nombran los que siguen.
function destinoLegible(flecha) {
  const nombrados = [], vistos = new Set(), pila = [flecha.targetRef];
  while (pila.length && nombrados.length < 3) {
    const el = pila.shift();
    if (!el || vistos.has(el)) continue;
    vistos.add(el);
    if (nombre(el) || !es(el, 'bpmn:Gateway')) { if (nombre(el)) nombrados.push(nombre(el)); continue; }
    for (const s of el.outgoing || []) pila.push(s.targetRef);
  }
  return nombrados.length > 1 ? `${nombrados.slice(0, -1).join(', ')} y ${nombrados[nombrados.length - 1]}` : (nombrados[0] || '');
}

export async function analizar(xml) {
  const { rootElement: defs } = await new BpmnModdle().fromXML(xml, 'bpmn:Definitions');
  const colaboracion = (defs.rootElements || []).find((r) => es(r, 'bpmn:Collaboration'));
  const participantes = (colaboracion?.participants || []).filter((p) => p.processRef);
  const procesos = participantes.length
    ? participantes.map((p) => ({ nombre: nombre(p), proceso: p.processRef }))
    : (defs.rootElements || []).filter((r) => es(r, 'bpmn:Process')).map((p) => ({ nombre: nombre(p), proceso: p }));

  const pools = procesos.map(({ nombre: n, proceso }) => {
    const todo = elementos(proceso);
    const carriles = (proceso.laneSets?.[0]?.lanes || []).map((l) => ({
      nombre: nombre(l),
      pasos: (l.flowNodeRef || []).filter((f) => es(f, 'bpmn:Activity') && nombre(f)).map(nombre)
    }));
    const enCarril = new Set(carriles.flatMap((c) => c.pasos));
    const sueltos = todo.filter((f) => es(f, 'bpmn:Activity') && nombre(f) && !enCarril.has(nombre(f))).map(nombre);
    return {
      nombre: n,
      carriles: carriles.length ? carriles : [{ nombre: '', pasos: sueltos }],
      pasos: todo.filter((f) => es(f, 'bpmn:Activity') && !es(f, 'bpmn:SubProcess')).length,
      decisiones: todo
        .filter((f) => es(f, 'bpmn:ExclusiveGateway') || es(f, 'bpmn:InclusiveGateway'))
        .filter((g) => (g.outgoing || []).length > 1 && nombre(g))
        .map((g) => ({ pregunta: nombre(g), caminos: g.outgoing.map((c) => ({ nombre: nombre(c), destino: destinoLegible(c) })) })),
      paralelos: todo.filter((f) => es(f, 'bpmn:ParallelGateway') && (f.outgoing || []).length > 1).length,
      inicios: todo.filter((f) => es(f, 'bpmn:StartEvent') && nombre(f) && !es(f.$parent, 'bpmn:SubProcess')).map(nombre),
      fines: todo.filter((f) => es(f, 'bpmn:EndEvent') && nombre(f) && !es(f.$parent, 'bpmn:SubProcess')).map(nombre),
      plazos: todo.filter((f) => (f.eventDefinitions || []).some((d) => es(d, 'bpmn:TimerEventDefinition'))).length,
      subprocesos: todo.filter((f) => es(f, 'bpmn:SubProcess')).map(nombre).filter(Boolean)
    };
  });

  return {
    pools,
    mensajes: (colaboracion?.messageFlows || []).map(nombre).filter(Boolean),
    pestanas: (defs.diagrams || []).map((d) => nombre(d)).filter(Boolean),
    responsables: pools.reduce((n, p) => n + p.carriles.filter((c) => c.nombre).length, 0),
    pasos: pools.reduce((n, p) => n + p.pasos, 0),
    decisiones: pools.reduce((n, p) => n + p.decisiones.length, 0)
  };
}

// Dirección amigable a partir del nombre: "Solicitud de compra" -> "solicitud-de-compra".
export const ruta = (texto) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
