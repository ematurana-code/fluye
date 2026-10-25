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

// "Quién hace qué, paso a paso": las figuras del diagrama principal puestas en el carril de quien las hace y en filas
// según su posición de izquierda a derecha en el dibujo (lo que está a la misma altura del recorrido va en la misma fila).
function flujo(defs, procesos) {
  const formas = new Map();
  for (const f of defs.diagrams?.[0]?.plane?.planeElement || []) if (f.bpmnElement && f.bounds) formas.set(f.bpmnElement, f.bounds);
  const tipo = (el) => {
    if (es(el, 'bpmn:StartEvent')) return 'inicio';
    if (es(el, 'bpmn:EndEvent')) return 'fin';
    if (es(el, 'bpmn:IntermediateCatchEvent') || es(el, 'bpmn:IntermediateThrowEvent')) return 'evento';
    if (es(el, 'bpmn:ExclusiveGateway') || es(el, 'bpmn:InclusiveGateway')) return 'decision';
    if (es(el, 'bpmn:Activity')) return 'tarea';
    return null;
  };
  const carriles = [], figuras = [];
  for (const { nombre: pool, proceso } of procesos) {
    const lanes = proceso.laneSets?.[0]?.lanes || [];
    const base = carriles.length;
    if (lanes.length) lanes.forEach((l) => carriles.push({ nombre: nombre(l) || pool, pool }));
    else carriles.push({ nombre: pool || 'Proceso', pool });
    for (const el of proceso.flowElements || []) {
      const t = tipo(el), b = formas.get(el);
      if (!t || !b || !nombre(el)) continue;
      const i = lanes.findIndex((l) => (l.flowNodeRef || []).includes(el));
      figuras.push({ tipo: t, nombre: nombre(el), carril: base + Math.max(0, i), x: b.x + b.width / 2 });
    }
  }
  // Filas: se agrupan las figuras cuyos centros quedan a menos de 60 px en el dibujo.
  figuras.sort((a, b) => a.x - b.x);
  let fila = 0, inicioFila = -Infinity;
  for (const f of figuras) {
    if (f.x - inicioFila > 60) { fila++; inicioFila = f.x; }
    f.fila = fila;
  }
  return { carriles, figuras: figuras.map(({ x, ...f }) => f), filas: fila };
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
    flujo: flujo(defs, procesos),
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
