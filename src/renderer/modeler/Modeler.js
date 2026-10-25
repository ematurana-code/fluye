// Editor de procesos de Fluye: arma diagram-js con los módulos propios y expone abrir / guardar / nuevo.
import Diagram from 'diagram-js';
import { BpmnModdle } from 'bpmn-moddle';

import SelectionModule from 'diagram-js/lib/features/selection/index.js';
import OverlaysModule from 'diagram-js/lib/features/overlays/index.js';
import ModelingModule from 'diagram-js/lib/features/modeling/index.js';
import MoveModule from 'diagram-js/lib/features/move/index.js';
import CreateModule from 'diagram-js/lib/features/create/index.js';
import ConnectModule from 'diagram-js/lib/features/connect/index.js';
import ResizeModule from 'diagram-js/lib/features/resize/index.js';
import BendpointsModule from 'diagram-js/lib/features/bendpoints/index.js';
import ContextPadModule from 'diagram-js/lib/features/context-pad/index.js';
import LassoToolModule from 'diagram-js/lib/features/lasso-tool/index.js';
import HandToolModule from 'diagram-js/lib/features/hand-tool/index.js';
import KeyboardModule from 'diagram-js/lib/features/keyboard/index.js';
import EditorActionsModule from 'diagram-js/lib/features/editor-actions/index.js';
import KeyboardMoveSelectionModule from 'diagram-js/lib/features/keyboard-move-selection/index.js';
import MoveCanvasModule from 'diagram-js/lib/navigation/movecanvas/index.js';
import ZoomScrollModule from 'diagram-js/lib/navigation/zoomscroll/index.js';
import AutoPlaceModule from 'diagram-js/lib/features/auto-place/index.js';
import AutoScrollModule from 'diagram-js/lib/features/auto-scroll/index.js';
import SnappingModule from 'diagram-js/lib/features/snapping/index.js';
import GridSnappingModule from 'diagram-js/lib/features/grid-snapping/index.js';
import CopyPasteModule from 'diagram-js/lib/features/copy-paste/index.js';
import AlignElementsModule from 'diagram-js/lib/features/align-elements/index.js';
import OutlineModule from 'diagram-js/lib/features/outline/index.js';
import ConnectionPreviewModule from 'diagram-js/lib/features/connection-preview/index.js';
import RulesModule from 'diagram-js/lib/features/rules/index.js';
import DirectEditingModule from 'diagram-js-direct-editing';
import CroppingConnectionDocking from 'diagram-js/lib/layout/CroppingConnectionDocking.js';

import FluyeRenderer from './draw/FluyeRenderer.js';
import FluyeElementFactory from './core/FluyeElementFactory.js';
import FluyeModeling from './modeling/FluyeModeling.js';
import FluyeRules from './rules/FluyeRules.js';
import FluyeLayouter, { RecorteConexiones } from './layout/FluyeLayouter.js';
import {
  AgregarCarrilHandler, Carriles, CopiarPegar, CrecimientoAutomatico, FlechasValidas, NombresUnicos, PadreCorrecto, ReglaCrecimiento,
  TamanoMinimo, UbicacionAutomatica, PoolBajoOtro, AgregarPoolHandler
} from './modeling/comportamientos.js';
import EdicionNombre from './edicion/EdicionNombre.js';
import MenuRapido from './contexto/MenuRapido.js';
import ConectarDesdeBorde from './contexto/ConectarDesdeBorde.js';
import { importarXml } from './io/importar.js';
import { exportarXml } from './io/exportar.js';
import { combinarArchivos } from './io/combinar.js';
import { plantillaNueva } from './io/plantilla.js';
import { normalizarDeclaracion } from './io/codificacion.js';
import { ajustarVista } from './vista.js';
import { es, nombreDiagrama, nuevoId } from './tipos.js';

import 'diagram-js/assets/diagram-js.css';

class RegistroComandos {
  static $inject = ['commandStack'];
  constructor(commandStack) {
    commandStack.registerHandler('carril.agregar', AgregarCarrilHandler);
    commandStack.registerHandler('pool.agregar', AgregarPoolHandler);
  }
}

const ModuloFluye = {
  __init__: [
    'fluyeRenderer', 'fluyeRules', 'recorteConexiones', 'padreCorrecto', 'crecimientoAutomatico', 'reglaCrecimiento',
    'carriles', 'poolBajoOtro', 'tamanoMinimo', 'flechasValidas', 'nombresUnicos', 'ubicacionAutomatica', 'copiarPegar', 'edicionNombre', 'menuRapido', 'conectarDesdeBorde',
    'registroComandos'
  ],
  poolBajoOtro: ['type', PoolBajoOtro],
  fluyeRenderer: ['type', FluyeRenderer],
  elementFactory: ['type', FluyeElementFactory],
  modeling: ['type', FluyeModeling],
  fluyeRules: ['type', FluyeRules],
  layouter: ['type', FluyeLayouter],
  connectionDocking: ['type', CroppingConnectionDocking],
  recorteConexiones: ['type', RecorteConexiones],
  padreCorrecto: ['type', PadreCorrecto],
  crecimientoAutomatico: ['type', CrecimientoAutomatico],
  reglaCrecimiento: ['type', ReglaCrecimiento],
  carriles: ['type', Carriles],
  tamanoMinimo: ['type', TamanoMinimo],
  flechasValidas: ['type', FlechasValidas],
  nombresUnicos: ['type', NombresUnicos],
  ubicacionAutomatica: ['type', UbicacionAutomatica],
  copiarPegar: ['type', CopiarPegar],
  edicionNombre: ['type', EdicionNombre],
  menuRapido: ['type', MenuRapido],
  conectarDesdeBorde: ['type', ConectarDesdeBorde],
  registroComandos: ['type', RegistroComandos]
};

export default class Modeler {
  constructor({ contenedor }) {
    this.moddle = new BpmnModdle();
    this.definiciones = null;
    this.diagrama = new Diagram({
      canvas: { container: contenedor, deferUpdate: false },
      gridSnapping: { active: true },
      modules: [
        { moddle: ['value', this.moddle] },
        SelectionModule, OverlaysModule, RulesModule, ModelingModule, MoveModule, CreateModule, ConnectModule, ResizeModule,
        BendpointsModule, ContextPadModule, LassoToolModule, HandToolModule, KeyboardModule, EditorActionsModule,
        KeyboardMoveSelectionModule, MoveCanvasModule, ZoomScrollModule, AutoPlaceModule, AutoScrollModule, SnappingModule,
        GridSnappingModule, CopyPasteModule, AlignElementsModule, OutlineModule, ConnectionPreviewModule, DirectEditingModule,
        ModuloFluye
      ]
    });
  }

  // get(servicio, false) devuelve null si el servicio no existe (el visor de solo lectura no trae los de edición).
  get(servicio, estricto = true) {
    return this.diagrama.get(servicio, estricto);
  }

  // on(evento, [prioridad], fn)
  on(...args) {
    this.get('eventBus').on(...args);
  }

  // diagrama: índice de la pestaña que se muestra (un archivo puede traer varios diagramas).
  async abrir(xml, { diagrama = 0 } = {}) {
    const servicios = { moddle: this.moddle, canvas: this.get('canvas'), elementFactory: this.get('elementFactory'), diagrama: this.diagrama, eventBus: this.get('eventBus') };
    const r = await importarXml(servicios, normalizarDeclaracion(xml), diagrama);
    this.definiciones = r.definiciones;
    this.indiceDiagrama = r.indice;
    this.ocultos = r.ocultos;
    this.procesosVisibles = r.procesosVisibles;
    this.vistosAlAbrir = r.vistos;
    this.get('commandStack').clear();
    // Avisos que sí le sirven al usuario (las referencias sueltas y contenidos desconocidos se descartan sin pérdida visible).
    const avisos = r.avisos.filter((a) => !/unresolved reference|unparsable content|unknown attribute|encoding/i.test(a));
    const repetidos = r.avisos.filter((a) => /duplicate ID/i.test(a)).length;
    if (repetidos) avisos.push(`El archivo traía ${repetidos === 1 ? 'un elemento' : `${repetidos} elementos`} con el mismo identificador que otro: se abrió solo el primero de cada uno.`);
    this.get('eventBus').fire('fluye.abierto', { avisos });
    return { avisos, diagramas: r.diagramas, indice: r.indice };
  }

  nuevo(nombre) {
    return this.abrir(plantillaNueva(nombre));
  }

  // Si se está escribiendo un nombre en el lienzo, se confirma antes (si no, se perdería al guardar o exportar).
  terminarEdicion() {
    const edicion = this.get('directEditing', false);
    if (edicion && edicion.isActive()) edicion.complete();
  }

  async guardarXml() {
    this.terminarEdicion();
    const servicios = { moddle: this.moddle, canvas: this.get('canvas'), elementRegistry: this.get('elementRegistry') };
    const xml = await exportarXml(servicios, this.definiciones, this.ocultos || [], this.procesosVisibles || new Set(), this.vistosAlAbrir || new Set(), this.indiceDiagrama || 0);
    this._recordarDibujado();
    return xml;
  }

  // Lo dibujado ya quedó escrito en el modelo: desde ahora cuenta como "visto". Si no, algo creado y guardado
  // que después se borra volvería a aparecer en el siguiente guardado (se tomaría como contenido sin figura).
  _recordarDibujado() {
    const raiz = this.get('canvas').getRootElement();
    const vistos = this.vistosAlAbrir || new Set();
    const visibles = this.procesosVisibles || new Set();
    for (const e of this.get('elementRegistry').getAll()) {
      if (e === raiz || e.labelTarget || !e.businessObject) continue;
      vistos.add(e.businessObject);
      if (e.businessObject.dataObjectRef) vistos.add(e.businessObject.dataObjectRef);
      if (es(e, 'bpmn:Participant') && e.businessObject.processRef) visibles.add(e.businessObject.processRef);
    }
    if (raiz && es(raiz, 'bpmn:Process')) visibles.add(raiz.businessObject);
    this.vistosAlAbrir = vistos;
    this.procesosVisibles = visibles;
  }

  // Abre algo nuevo sin arriesgar lo que hay: si falla a mitad de camino, vuelve a dejar el diagrama anterior.
  async abrirSinPerder(abrir) {
    const respaldo = this.definiciones ? await this.guardarXml().catch(() => null) : null;
    const indice = this.indiceDiagrama || 0;
    try {
      return await abrir();
    } catch (e) {
      if (respaldo) await this.abrir(respaldo, { diagrama: indice }).catch(() => {});
      throw e;
    }
  }

  // ----- pestañas: cada diagrama del archivo -----
  // Cambiar de pestaña guarda el lienzo en el modelo (mismo camino que "Guardar") y abre el otro diagrama.

  diagramas() {
    return ((this.definiciones && this.definiciones.diagrams) || []).map((d, i) => ({ indice: i, nombre: nombreDiagrama(d, i) }));
  }

  async irADiagrama(indice) {
    return this.abrir(await this.guardarXml(), { diagrama: indice });
  }

  async agregarDiagrama() {
    const defs = await this._modeloActual();
    const n = defs.diagrams.length + 1;
    const { rootElement: nueva } = await this.moddle.fromXML(plantillaNueva(`Proceso ${n}`), 'bpmn:Definitions');
    for (const r of nueva.rootElements) { r.$parent = defs; defs.rootElements.push(r); }
    const d = nueva.diagrams[0];
    Object.assign(d, { id: nuevoId('BPMNDiagram'), name: `Diagrama ${n}`, $parent: defs });
    d.plane.id = nuevoId('BPMNPlane');
    defs.diagrams.push(d);
    return this._reabrir(defs, defs.diagrams.length - 1);
  }

  renombrarDiagrama(indice, nombre) {
    const d = this.definiciones && this.definiciones.diagrams[indice];
    if (d) d.name = nombre;
  }

  // Pestaña donde está dibujado el detalle de un subproceso (-1 si todavía no tiene).
  indiceSubproceso(id) {
    return ((this.definiciones && this.definiciones.diagrams) || []).findIndex((d) => d.plane && d.plane.bpmnElement && d.plane.bpmnElement.id === id);
  }

  // Abre la pestaña con el detalle de un subproceso cerrado; si no existe, la crea (con un evento de inicio si el
  // subproceso está vacío). Lo que pasa adentro se dibuja ahí y el archivo lo guarda como un diagrama más, igual
  // que los archivos de bpmn.io o Camunda.
  async abrirSubproceso(id) {
    const defs = await this._modeloActual();
    const buscar = (lista) => {
      for (const fe of lista || []) {
        if (fe.id === id) return fe;
        const dentro = es(fe, 'bpmn:SubProcess') && buscar(fe.flowElements);
        if (dentro) return dentro;
      }
      return null;
    };
    let sub = null;
    for (const r of defs.rootElements || []) if (!sub && es(r, 'bpmn:Process')) sub = buscar(r.flowElements);
    if (!sub) throw new Error('El subproceso ya no está en el diagrama.');
    let indice = defs.diagrams.findIndex((d) => d.plane && d.plane.bpmnElement === sub);
    if (indice < 0) {
      const plano = this.moddle.create('bpmndi:BPMNPlane', { id: nuevoId('BPMNPlane'), bpmnElement: sub });
      plano.planeElement = [];
      if (!(sub.flowElements || []).length) {
        const inicio = this.moddle.create('bpmn:StartEvent', { id: nuevoId('bpmn:StartEvent') });
        inicio.$parent = sub;
        sub.get('flowElements').push(inicio);
        const forma = this.moddle.create('bpmndi:BPMNShape', {
          id: `DI_${inicio.id}`, bpmnElement: inicio, bounds: this.moddle.create('dc:Bounds', { x: 160, y: 140, width: 36, height: 36 })
        });
        forma.$parent = plano;
        plano.planeElement.push(forma);
      }
      const d = this.moddle.create('bpmndi:BPMNDiagram', { id: nuevoId('BPMNDiagram'), name: sub.name || 'Subproceso', plane: plano });
      plano.$parent = d;
      d.$parent = defs;
      defs.diagrams.push(d);
      indice = defs.diagrams.length - 1;
    }
    return this._reabrir(defs, indice);
  }

  // Borra el diagrama y los procesos que solo él mostraba. Siempre queda al menos uno.
  async borrarDiagrama(indice) {
    const defs = await this._modeloActual();
    if (defs.diagrams.length < 2) return null;
    const raices = (d) => {
      const b = d.plane && d.plane.bpmnElement;
      const s = new Set(b ? [b] : []);
      if (b && es(b, 'bpmn:Collaboration')) for (const p of b.participants || []) if (p.processRef) s.add(p.processRef);
      return s;
    };
    const quitar = raices(defs.diagrams[indice]);
    defs.diagrams.forEach((d, i) => { if (i !== indice) for (const r of raices(d)) quitar.delete(r); });
    defs.rootElements = defs.rootElements.filter((r) => !quitar.has(r));
    defs.diagrams.splice(indice, 1);
    // Se queda en la pestaña donde estaba; si se borró esa, pasa a la vecina.
    const actual = this.indiceDiagrama || 0;
    const destino = indice < actual ? actual - 1 : indice === actual ? Math.min(indice, defs.diagrams.length - 1) : actual;
    return this._reabrir(defs, destino);
  }

  // Abre varios archivos juntos: cada diagrama queda en su pestaña. archivos: [{ nombre, xml }]
  async combinar(archivos) {
    const { defs, avisos } = await combinarArchivos(this.moddle, archivos);
    const r = await this._reabrir(defs, 0);
    return { ...r, avisos: [...avisos, ...r.avisos] };
  }

  // Agrega los diagramas de otro .bpmn (por ejemplo, una plantilla) como pestañas nuevas y abre la primera.
  async agregarDesde(xml, nombre) {
    const desde = this.definiciones.diagrams.length;
    const { defs } = await combinarArchivos(this.moddle, [
      { nombre: 'actual', xml: await this.guardarXml(), nombrar: false },
      { nombre, xml }
    ]);
    return this._reabrir(defs, desde);
  }

  async _modeloActual() {
    return (await this.moddle.fromXML(await this.guardarXml(), 'bpmn:Definitions')).rootElement;
  }

  async _reabrir(defs, indice) {
    const { xml } = await this.moddle.toXML(defs, { format: true });
    return this.abrir(xml, { diagrama: indice });
  }

  ajustarVista() {
    ajustarVista(this.get('canvas'));
  }
}
