// Lee un .bpmn (BPMN 2.0) y arma el diagrama en el lienzo, sin pasar por el historial de deshacer.
import { es, nombreExterno, nuevoId } from '../tipos.js';
import { leerColores } from './colores.js';

const TIPOS_FIGURA = /^bpmn:(.*Event|.*Task|Task|SubProcess|CallActivity|.*Gateway|Participant|Lane|DataObjectReference|DataStoreReference|DataInput|DataOutput|TextAnnotation|Group)$/;
const TIPOS_CONEXION = /^bpmn:(SequenceFlow|MessageFlow|Association|DataInputAssociation|DataOutputAssociation)$/;

// indice: cuál de los diagramas del archivo se muestra (cada uno es una pestaña); los demás se conservan tal cual.
export async function importarXml({ moddle, canvas, elementFactory, diagrama, eventBus }, xml, indice = 0) {
  const { rootElement: defs, warnings } = await moddle.fromXML(xml, 'bpmn:Definitions');
  // Pestañas cuyo diagrama ya no existe (el detalle de un subproceso que se borró) se quitan, y el índice pedido se
  // corre para seguir apuntando al mismo diagrama.
  if ((defs.diagrams || []).length > 1) {
    const vivo = (d) => !!(d.plane && d.plane.bpmnElement);
    indice -= defs.diagrams.slice(0, indice).filter((d) => !vivo(d)).length;
    defs.diagrams = defs.diagrams.filter(vivo);
  }
  if (!defs.diagrams || !defs.diagrams[indice]) indice = 0;
  const plano = defs.diagrams && defs.diagrams[indice] && defs.diagrams[indice].plane;
  if (!plano || !plano.bpmnElement) throw new Error('El archivo no trae un diagrama (le falta la parte gráfica BPMN DI).');
  // Diagramas sin id (el estándar lo permite): sin esto, al guardar dos quedarían con el mismo y se perdería uno.
  for (const d of defs.diagrams) {
    if (!d.id) d.id = nuevoId('BPMNDiagram');
    if (d.plane && !d.plane.id) d.plane.id = nuevoId('BPMNPlane');
  }

  diagrama.clear();
  const raizBo = plano.bpmnElement;
  const raiz = elementFactory.createRoot({ id: `__raiz_${raizBo.id}`, type: raizBo.$type, businessObject: raizBo });
  canvas.setRootElement(raiz);

  const di = new Map();
  for (const d of plano.planeElement || []) if (d.bpmnElement) di.set(d.bpmnElement.id, d);
  const formas = new Map();
  const avisos = warnings.map((w) => w.message);
  let omitidos = 0;

  // Subproceso abierto: lo dice isExpanded; Bizagi no lo escribe, así que también cuenta como abierto si su contenido
  // está dibujado en este mismo plano (si no, sus pasos quedarían sueltos en el pool y repetidos al guardar).
  const expandido = (fe) => {
    const d = di.get(fe.id);
    if (!d || d.isExpanded === false) return false;
    return d.isExpanded === true || (fe.flowElements || []).some((h) => di.get(h.id)?.bounds);
  };

  const ocultos = [];
  const crearForma = (bo, padre, extra = {}) => {
    const d = di.get(bo.id);
    if (!d || !d.bounds || formas.has(bo.id) || !TIPOS_FIGURA.test(bo.$type)) return null;
    if (d.bounds.width < 1 || d.bounds.height < 1) return null;
    const attrs = {
      type: bo.$type, businessObject: bo, id: bo.id,
      x: Math.round(d.bounds.x), y: Math.round(d.bounds.y), width: Math.round(d.bounds.width), height: Math.round(d.bounds.height),
      colores: leerColores(d, bo) || undefined, ...extra
    };
    if (es(bo, 'bpmn:SubProcess')) attrs.collapsed = !expandido(bo);
    if (es(bo, 'bpmn:ExclusiveGateway')) attrs.marcadorVisible = d.isMarkerVisible === true;
    const forma = elementFactory.createShape(attrs);
    canvas.addShape(forma, padre);
    formas.set(bo.id, forma);
    return forma;
  };

  const carrilesPlanos = (laneSets, lista = []) => {
    for (const ls of laneSets || []) for (const l of ls.lanes || []) { lista.push(l); carrilesPlanos([l.childLaneSet].filter(Boolean), lista); }
    return lista;
  };

  const llenarContenedor = (contenedor, padre) => {
    if (!contenedor) return;
    const carriles = carrilesPlanos(contenedor.laneSets).sort((a, b) => (di.get(a.id)?.bounds?.y ?? 0) - (di.get(b.id)?.bounds?.y ?? 0));
    for (const l of carriles) crearForma(l, padre);
    const elementos = contenedor.flowElements || [];
    const artefactos = contenedor.artifacts || [];
    for (const g of artefactos.filter((a) => es(a, 'bpmn:Group'))) crearForma(g, padre);
    for (const fe of elementos) {
      if (es(fe, 'bpmn:SubProcess') && expandido(fe)) {
        const sub = crearForma(fe, padre);
        llenarContenedor(fe, sub || padre);
      } else if (!es(fe, 'bpmn:BoundaryEvent')) {
        crearForma(fe, padre);
      }
    }
    for (const fe of elementos.filter((x) => es(x, 'bpmn:BoundaryEvent'))) crearForma(fe, padre);
    for (const a of artefactos.filter((x) => es(x, 'bpmn:TextAnnotation'))) crearForma(a, padre);
  };

  if (es(raizBo, 'bpmn:Collaboration')) {
    const participantes = [...(raizBo.participants || [])].sort((a, b) => (di.get(a.id)?.bounds?.y ?? 0) - (di.get(b.id)?.bounds?.y ?? 0));
    for (const p of participantes) {
      // Ancho de la franja del pool según dónde empiezan sus carriles (Bizagi usa 20 px).
      const xs = carrilesPlanos(p.processRef && p.processRef.laneSets).map((l) => di.get(l.id)?.bounds?.x).filter((x) => x !== undefined);
      const pd = di.get(p.id);
      const cab = xs.length && pd && pd.bounds ? Math.round(Math.min(...xs) - pd.bounds.x) : 0;
      const pool = crearForma(p, raiz, cab >= 10 && cab <= 60 ? { cabecera: cab } : {});
      if (pool) llenarContenedor(p.processRef, pool);
    }
    for (const a of raizBo.artifacts || []) crearForma(a, raiz);
    // Participantes sin figura visible (Bizagi agrega un "Proceso principal" de tamaño cero): se conservan al guardar.
    for (const p of raizBo.participants || []) {
      if (!formas.has(p.id)) ocultos.push({ bo: p, bounds: di.get(p.id)?.bounds || null });
    }
  } else {
    llenarContenedor(raizBo, raiz);
  }

  // Figuras del plano que no aparecieron recorriendo los procesos (modelos poco ordenados).
  for (const d of plano.planeElement || []) {
    const bo = d.bpmnElement;
    if (bo && d.bounds && !formas.has(bo.id) && TIPOS_FIGURA.test(bo.$type) && !ocultos.some((o) => o.bo === bo)) {
      const pool = [...formas.values()].find((f) => es(f, 'bpmn:Participant') && dentro(d.bounds, f));
      if (!crearForma(bo, pool || raiz)) omitidos++;
    }
  }

  // Conexiones
  const conexionesVistas = [];
  const deFluye = defs.exporter === 'Fluye';
  for (const d of plano.planeElement || []) {
    const bo = d.bpmnElement;
    if (!bo || !TIPOS_CONEXION.test(bo.$type)) continue;
    const [origenBo, destinoBo] = extremos(bo);
    const origen = origenBo && formas.get(origenBo.id), destino = destinoBo && formas.get(destinoBo.id);
    if (!origen || !destino) { omitidos++; continue; }
    const puntos = (d.waypoint || []).map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) }));
    // "Ajustada a mano": marcada así por Fluye, o con quiebres hechos en otra herramienta (se respeta su recorrido).
    const manual = (d.$attrs && d.$attrs['fluye:manual'] === 'true') || (!deFluye && puntos.length > 2);
    const conexion = elementFactory.createConnection({
      type: bo.$type, businessObject: bo, id: bo.id, source: origen, target: destino, manual: manual || undefined,
      waypoints: puntos.length >= 2 ? puntos : [centro(origen), centro(destino)], colores: leerColores(d, bo) || undefined
    });
    const padre = es(bo, 'bpmn:MessageFlow') ? raiz : origen.parent || raiz;
    canvas.addConnection(conexion, padre);
    conexionesVistas.push(bo);
  }

  // Las figuras se dibujaron antes que sus flechas: se redibujan las que llevan el nombre afuera
  // (decisiones, eventos, datos) para que lo pongan arriba si una flecha sale por abajo.
  const redibujar = [...formas.values()].filter((f) => nombreExterno(f) && ((f.incoming || []).length || (f.outgoing || []).length));
  if (eventBus && redibujar.length) eventBus.fire('elements.changed', { elements: redibujar });

  if (omitidos) avisos.push(`${omitidos} elemento(s) sin parte gráfica no se mostraron.`);
  // Procesos que este diagrama muestra (los demás, de otros diagramas del archivo, se conservan tal cual al guardar).
  const visibles = new Set();
  if (es(raizBo, 'bpmn:Process')) visibles.add(raizBo);
  for (const f of formas.values()) if (es(f, 'bpmn:Participant') && f.businessObject.processRef) visibles.add(f.businessObject.processRef);

  // Objetos BPMN con figura en este diagrama (lo demás se conserva tal cual al guardar).
  const vistos = new Set([...[...formas.values()].map((f) => f.businessObject), ...conexionesVistas]);
  // El DataObject de cada documento dibujado también cuenta como visto: si no, al mover el documento a otro pool
  // quedaría en los dos procesos.
  for (const f of formas.values()) if (f.businessObject.dataObjectRef) vistos.add(f.businessObject.dataObjectRef);

  return { definiciones: defs, avisos, ocultos, procesosVisibles: visibles, vistos, diagramas: defs.diagrams.length, indice };
}

function extremos(bo) {
  if (es(bo, 'bpmn:DataInputAssociation')) return [[].concat(bo.sourceRef || [])[0], bo.$parent];
  if (es(bo, 'bpmn:DataOutputAssociation')) return [bo.$parent, bo.targetRef];
  return [bo.sourceRef, bo.targetRef];
}

const centro = (f) => ({ x: Math.round(f.x + f.width / 2), y: Math.round(f.y + f.height / 2) });
const dentro = (b, f) => b.x + b.width / 2 >= f.x && b.x + b.width / 2 <= f.x + f.width && b.y + b.height / 2 >= f.y && b.y + b.height / 2 <= f.y + f.height;
