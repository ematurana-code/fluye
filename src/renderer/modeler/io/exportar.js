// Convierte el diagrama del lienzo a .bpmn (BPMN 2.0 estándar + DI), rearmando la estructura desde lo dibujado.
import { bo as boDe, es, esAnotacion, esCarril, esDato, esGrupo, esNodo, esPool, esSubprocesoExpandido, nuevoId } from '../tipos.js';
import { NS_COLOR, escribirColores } from './colores.js';

export const VERSION_EXPORTADOR = '0.1.0';
const NS_FLUYE = 'http://fluye.app/schema/1.0';

// ocultos: participantes sin figura visible (ej. el "Proceso principal" de tamaño cero que agrega Bizagi); se conservan tal cual.
// procesosVisibles: procesos que mostraba el diagrama al abrir; los que no estén ahí (otros diagramas) no se tocan.
// vistosAlAbrir: objetos BPMN que tenían figura al abrir. Lo que NO tenía figura (asociaciones o datos sin dibujo)
//   no se puede haber editado en Fluye, así que se devuelve a su lista original al guardar.
// indice: qué diagrama del archivo es el del lienzo (la pestaña abierta); los demás diagramas no se tocan.
export async function exportarXml({ moddle, canvas, elementRegistry }, definiciones, ocultos = [], procesosVisibles = new Set(), vistosAlAbrir = new Set(), indice = 0) {
  const raiz = canvas.getRootElement();
  const raizBo = boDe(raiz);
  const defs = definiciones || moddle.create('bpmn:Definitions', { id: nuevoId('Definitions'), targetNamespace: 'http://fluye.app/bpmn' });
  Object.assign(defs, { exporter: 'Fluye', exporterVersion: VERSION_EXPORTADOR });
  defs.targetNamespace = defs.targetNamespace || 'http://fluye.app/bpmn';
  defs.$attrs['xmlns:color'] = NS_COLOR;
  defs.$attrs['xmlns:fluye'] = NS_FLUYE;

  // La raíz del diagrama es un proceso o, en archivos de bpmn.io/Camunda, un subproceso detallado en su propia pestaña.
  const raizProceso = es(raizBo, 'bpmn:Process', 'bpmn:SubProcess');
  const todos = elementRegistry.getAll().filter((e) => e !== raiz && !e.labelTarget);
  const formas = todos.filter((e) => !e.waypoints);
  const conexiones = todos.filter((e) => e.waypoints);
  const procesos = new Set();

  // Contenedor semántico de una figura: subproceso abierto, proceso del pool o proceso raíz.
  const procesoPorDefecto = () => {
    if (raizProceso) return raizBo;
    const p = [...procesos][0] || moddle.create('bpmn:Process', { id: nuevoId('bpmn:Process'), isExecutable: false });
    procesos.add(p);
    return p;
  };
  const contenedor = (el) => {
    let p = el.parent;
    while (p && p !== raiz) {
      if (esSubprocesoExpandido(p)) return boDe(p);
      if (esPool(p)) {
        const part = boDe(p);
        if (!part.processRef) part.processRef = moddle.create('bpmn:Process', { id: nuevoId('bpmn:Process'), isExecutable: false });
        return part.processRef;
      }
      p = p.parent;
    }
    return raizProceso ? raizBo : null;
  };
  // Proceso o subproceso donde venía el elemento en el archivo (para lo que quedó fuera de todo pool visible).
  const contenedorOriginal = (b) => (b && b.$parent && es(b.$parent, 'bpmn:Process', 'bpmn:SubProcess') ? b.$parent : null);
  const agregar = (lista2, item) => { if (!lista2.includes(item)) lista2.push(item); };

  const previos = [];
  const rearmados = new Set(); // contenedores cuyos elementos se vuelven a armar desde el dibujo
  const lista = (obj, prop) => {
    previos.push([obj, prop, [...(obj.get(prop) || [])]]);
    obj.set(prop, []);
    if (prop === 'flowElements') rearmados.add(obj);
    return obj.get(prop);
  };
  const tiene = (obj, prop) => !!(obj && obj.$descriptor && obj.$descriptor.propertiesByName[prop]);
  // Un elemento que venía en un contenedor que no se rearma (el proceso de una actividad de llamada dibujada abierta,
  // o un subproceso cerrado con su contenido a la vista) se queda ahí: moverlo cambiaría el modelo y agregarlo también
  // al pool lo dejaría repetido con el mismo id.
  const sigueDonde = (b) => { const v = b.$parent; return !!v && !rearmados.has(v) && Array.isArray(v.flowElements) && v.flowElements.includes(b); };
  const ponerEn = (c, b) => { if (!sigueDonde(b)) agregar(c.get('flowElements'), b); };
  // Si algo falla a mitad de camino, el modelo vuelve a como estaba (si no, lo que el archivo traía sin figura se
  // perdería en el siguiente guardado).
  const raicesAntes = defs.rootElements ? [...defs.rootElements] : defs.rootElements;
  const diagramasAntes = defs.diagrams ? [...defs.diagrams] : defs.diagrams;
  const carrilesAntes = [];
  try {
    // 1. Vaciar contenedores para rearmarlos.
    if (es(raizBo, 'bpmn:Collaboration')) { lista(raizBo, 'participants'); lista(raizBo, 'messageFlows'); lista(raizBo, 'artifacts'); }
    if (raizProceso) procesos.add(raizBo);
    for (const f of formas) {
      if (esPool(f) && boDe(f).processRef) procesos.add(boDe(f).processRef);
    }
    const idLaneSet = new Map();
    for (const p of procesos) {
      idLaneSet.set(p, (p.laneSets && p.laneSets[0] && p.laneSets[0].id) || `LaneSet_${p.id}`);
      carrilesAntes.push([p, p.laneSets]);
      lista(p, 'flowElements'); lista(p, 'artifacts'); p.set('laneSets', undefined);
    }
    for (const f of formas) {
      const b = boDe(f);
      if (esSubprocesoExpandido(f)) { lista(b, 'flowElements'); lista(b, 'artifacts'); }
      if (esNodo(f)) { lista(b, 'incoming'); lista(b, 'outgoing'); }
      // Las tareas tienen las dos listas; los eventos que envían, solo entradas; los que reciben, solo salidas.
      if (tiene(b, 'dataInputAssociations')) lista(b, 'dataInputAssociations');
      if (tiene(b, 'dataOutputAssociations')) lista(b, 'dataOutputAssociations');
    }

    // 2. Figuras
    const carrilesPorPool = new Map();
    for (const f of formas) {
      const b = boDe(f);
      if (esPool(f)) { raizBo.get('participants').push(b); continue; }
      if (esCarril(f)) {
        const pool = esPool(f.parent) ? f.parent : null;
        if (!pool && !raizProceso) continue; // carril dibujado sin su pool: queda donde estaba
        if (!carrilesPorPool.has(pool)) carrilesPorPool.set(pool, []);
        carrilesPorPool.get(pool).push(f);
        continue;
      }
      if (esAnotacion(f) || esGrupo(f)) {
        const c = contenedor(f) || contenedorOriginal(b) || (es(raizBo, 'bpmn:Collaboration') ? raizBo : procesoPorDefecto());
        agregar(c.get('artifacts'), b);
        if (esGrupo(f) && b.categoryValueRef) asegurarCategoria(moddle, defs, b.categoryValueRef);
        continue;
      }
      // Entradas/salidas del proceso viven en su ioSpecification: se dejan donde están.
      if (es(f, 'bpmn:DataInput', 'bpmn:DataOutput')) continue;
      const c = contenedor(f) || contenedorOriginal(b) || procesoPorDefecto();
      ponerEn(c, b);
      if (es(f, 'bpmn:DataObjectReference')) {
        if (!b.dataObjectRef) b.dataObjectRef = moddle.create('bpmn:DataObject', { id: nuevoId('bpmn:DataObject') });
        ponerEn(c, b.dataObjectRef);
      }
    }

    // Carriles: cada pool con su laneSet; un nodo pertenece al carril donde cae su centro.
    for (const [pool, carriles] of carrilesPorPool) {
      const proceso = pool ? contenedor({ parent: pool }) : procesoPorDefecto();
      const laneSet = moddle.create('bpmn:LaneSet', { id: idLaneSet.get(proceso) || `LaneSet_${proceso.id}` });
      laneSet.lanes = [];
      const nodos = formas.filter((f) => (esNodo(f) || esDato(f)) && (pool ? dentroDe(f, pool) : true));
      for (const carril of carriles.sort((a, b) => a.y - b.y)) {
        const lb = boDe(carril);
        // Los subcarriles se aplanan; un childLaneSet vacío (Bizagi lo escribe así) se conserva.
        if (lb.childLaneSet && (lb.childLaneSet.lanes || []).length) lb.set('childLaneSet', undefined);
        lb.flowNodeRef = nodos.filter((n) => esNodo(n) && centroDentro(n, carril)).map(boDe);
        laneSet.lanes.push(lb);
      }
      proceso.set('laneSets', [laneSet]);
    }

    // 3. Conexiones
    const omitidas = new Set(); // flechas que el BPMN no permite guardar: no van ni en el modelo ni en el dibujo
    for (const c of conexiones) {
      const b = boDe(c), origen = boDe(c.source), destino = boDe(c.target);
      if (es(c, 'bpmn:SequenceFlow')) {
        Object.assign(b, { sourceRef: origen, targetRef: destino });
        ponerEn(contenedor(c.source) || contenedorOriginal(b) || contenedorOriginal(origen) || procesoPorDefecto(), b);
        origen.get('outgoing').push(b);
        destino.get('incoming').push(b);
      } else if (es(c, 'bpmn:MessageFlow')) {
        Object.assign(b, { sourceRef: origen, targetRef: destino });
        if (es(raizBo, 'bpmn:Collaboration')) raizBo.get('messageFlows').push(b);
      } else if (es(c, 'bpmn:DataInputAssociation')) {
        if (!tiene(destino, 'dataInputAssociations')) { omitidas.add(c); continue; } // un inicio no recibe datos (dibujos de versiones anteriores)
        b.sourceRef = [origen];
        b.targetRef = destinoDeEntrada(moddle, destino, b.targetRef);
        agregar(destino.get('dataInputAssociations'), b);
      } else if (es(c, 'bpmn:DataOutputAssociation')) {
        if (!tiene(origen, 'dataOutputAssociations')) { omitidas.add(c); continue; } // un fin no entrega datos (dibujos de versiones anteriores)
        b.targetRef = destino;
        agregar(origen.get('dataOutputAssociations'), b);
      } else {
        Object.assign(b, { sourceRef: origen, targetRef: destino });
        const sede = esAnotacion(c.source) ? c.target : c.source;
        agregar((contenedor(sede) || contenedorOriginal(b) || (es(raizBo, 'bpmn:Collaboration') ? raizBo : procesoPorDefecto())).get('artifacts'), b);
      }
    }

    // 3b. Lo que no tenía figura al abrir vuelve a su lista, en su lugar.
    for (const [obj, prop, antes] of previos) {
      if (prop === 'participants') continue; // los participantes sin figura van por "ocultos"
      const actual = obj.get(prop);
      for (const it of antes) if (!vistosAlAbrir.has(it) && !actual.includes(it)) actual.push(it);
    }

    // 4. Raíces: colaboración + procesos (se conservan mensajes, errores, señales, etc. que traía el archivo).
    const procesosOcultos = [];
    if (es(raizBo, 'bpmn:Collaboration')) {
      for (const { bo: p } of [...ocultos].reverse()) {
        raizBo.get('participants').unshift(p);
        if (p.processRef && !procesos.has(p.processRef)) procesosOcultos.push(p.processRef);
      }
    }
    // Se respeta el orden original; se quitan solo los procesos de pools borrados y se agregan los nuevos al final.
    const vivos = new Set([raizBo, ...procesos, ...procesosOcultos]);
    const originales = (defs.rootElements || []).filter((r) => vivos.has(r) || !(procesosVisibles.has(r) || r === raizBo));
    const nuevos = [...vivos].filter((r) => (es(r, 'bpmn:Collaboration') || es(r, 'bpmn:Process')) && !originales.includes(r));
    defs.rootElements = [...originales, ...nuevos];
    if (es(raizBo, 'bpmn:Collaboration') && defs.rootElements[0] !== raizBo && !originales.includes(raizBo)) {
      defs.rootElements = [raizBo, ...defs.rootElements.filter((r) => r !== raizBo)];
    }

    // 5. Parte gráfica (DI). Los id de DI no pueden repetirse con los de los otros diagramas del archivo.
    const otros = (defs.diagrams || []).filter((_, i) => i !== indice);
    const ocupados = new Set(otros.flatMap((d) => ((d.plane && d.plane.planeElement) || []).map((p) => p.id)));
    const idDi = (id) => (ocupados.has(`DI_${id}`) ? `DI_${id}_${indice + 1}` : `DI_${id}`);
    const plano = moddle.create('bpmndi:BPMNPlane', { id: nuevoId('BPMNPlane'), bpmnElement: raizBo });
    plano.planeElement = [];
    for (const { bo: p, bounds } of es(raizBo, 'bpmn:Collaboration') ? ocultos : []) {
      if (!bounds) continue;
      plano.planeElement.push(moddle.create('bpmndi:BPMNShape', {
        id: idDi(p.id), bpmnElement: p, isHorizontal: true,
        bounds: moddle.create('dc:Bounds', { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height })
      }));
    }
    const orden = [...formas].sort((a, b) => peso(a) - peso(b));
    for (const f of orden) {
      const d = moddle.create('bpmndi:BPMNShape', {
        id: idDi(f.id), bpmnElement: boDe(f),
        bounds: moddle.create('dc:Bounds', { x: f.x, y: f.y, width: f.width, height: f.height })
      });
      if (esPool(f) || esCarril(f)) d.isHorizontal = true;
      if (es(f, 'bpmn:SubProcess')) d.isExpanded = f.collapsed === false;
      if (es(f, 'bpmn:ExclusiveGateway')) d.isMarkerVisible = !!f.marcadorVisible;
      escribirColores(d, f.colores);
      plano.planeElement.push(d);
    }
    for (const c of conexiones) {
      if (omitidas.has(c)) continue;
      const d = moddle.create('bpmndi:BPMNEdge', {
        id: idDi(c.id), bpmnElement: boDe(c),
        waypoint: c.waypoints.map((p) => moddle.create('dc:Point', { x: Math.round(p.x), y: Math.round(p.y) }))
      });
      escribirColores(d, c.colores);
      if (c.manual) d.$attrs['fluye:manual'] = 'true';
      plano.planeElement.push(d);
    }
    const previo = (defs.diagrams || [])[indice];
    const diagrama = moddle.create('bpmndi:BPMNDiagram', { id: (previo && previo.id) || nuevoId('BPMNDiagram'), name: previo && previo.name, plane: plano });
    if (previo && previo.plane && previo.plane.id) plano.id = previo.plane.id;
    const diagramas = [...(defs.diagrams || [])];
    diagramas[previo ? indice : 0] = diagrama;
    defs.diagrams = diagramas;

    const { xml } = await moddle.toXML(defs, { format: true });
    return xml;
  } catch (e) {
    for (const [obj, prop, antes] of [...previos].reverse()) obj.set(prop, antes);
    for (const [p, ls] of carrilesAntes) p.set('laneSets', ls);
    defs.rootElements = raicesAntes;
    defs.diagrams = diagramasAntes;
    throw e;
  }
}

function peso(f) {
  if (esPool(f)) return 0;
  if (esCarril(f)) return 1;
  if (esGrupo(f)) return 2;
  if (esSubprocesoExpandido(f)) return 3;
  return 4;
}

function centroDentro(f, c) {
  const x = f.x + f.width / 2, y = f.y + f.height / 2;
  return x >= c.x && x <= c.x + c.width && y >= c.y && y <= c.y + c.height;
}

function dentroDe(f, pool) {
  let p = f.parent;
  while (p) { if (p === pool) return true; p = p.parent; }
  return false;
}

// A qué apunta una entrada de datos: se conserva lo que traía el archivo si es del mismo destino (una entrada de la
// tarea o del evento); si no, una tarea usa la propiedad de marcador habitual y un evento una entrada propia.
function destinoDeEntrada(moddle, destino, actual) {
  let p = actual;
  for (let i = 0; p && i < 3; i++, p = p.$parent) if (p.$parent === destino) return actual;
  if (es(destino, 'bpmn:Activity')) {
    const props = destino.get('properties');
    let prop = props.find((x) => x.name === '__targetRef_placeholder');
    if (!prop) {
      prop = moddle.create('bpmn:Property', { id: nuevoId('Property'), name: '__targetRef_placeholder' });
      props.push(prop);
    }
    return prop;
  }
  const entrada = moddle.create('bpmn:DataInput', { id: nuevoId('DataInput') });
  entrada.$parent = destino;
  destino.get('dataInputs').push(entrada);
  return entrada;
}

function asegurarCategoria(moddle, defs, valor) {
  if (valor.$parent && (defs.rootElements || []).includes(valor.$parent)) return;
  const cat = moddle.create('bpmn:Category', { id: nuevoId('bpmn:Category') });
  cat.categoryValue = [valor];
  valor.$parent = cat;
  defs.rootElements = [...(defs.rootElements || []), cat];
}
