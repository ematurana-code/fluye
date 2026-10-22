// Visor de solo lectura (página web exportada): el mismo dibujo y el mismo Play de Fluye, sin herramientas de edición.
// Solo trae lo necesario para dibujar y marcar el diagrama, así la página queda liviana.
import Diagram from 'diagram-js';
import { BpmnModdle } from 'bpmn-moddle';
import OverlaysModule from 'diagram-js/lib/features/overlays/index.js';
import ChangeSupportModule from 'diagram-js/lib/features/change-support/index.js';

import FluyeRenderer from './draw/FluyeRenderer.js';
import FluyeElementFactory from './core/FluyeElementFactory.js';
import { importarXml } from './io/importar.js';
import { normalizarDeclaracion } from './io/codificacion.js';
import { ajustarVista } from './vista.js';
import { nombreDiagrama } from './tipos.js';

import 'diagram-js/assets/diagram-js.css';

const ModuloVisor = {
  __init__: ['fluyeRenderer'],
  fluyeRenderer: ['type', FluyeRenderer],
  elementFactory: ['type', FluyeElementFactory]
};

export default class Visor {
  constructor({ contenedor }) {
    this.moddle = new BpmnModdle();
    this.diagrama = new Diagram({
      canvas: { container: contenedor, deferUpdate: false },
      modules: [{ moddle: ['value', this.moddle] }, OverlaysModule, ChangeSupportModule, ModuloVisor]
    });
  }

  get(servicio, estricto = true) {
    return this.diagrama.get(servicio, estricto);
  }

  on(...args) {
    this.get('eventBus').on(...args);
  }

  // indice: la pestaña (diagrama del archivo) que se muestra.
  async abrir(xml, indice = 0) {
    const servicios = { moddle: this.moddle, canvas: this.get('canvas'), elementFactory: this.get('elementFactory'), diagrama: this.diagrama, eventBus: this.get('eventBus') };
    const r = await importarXml(servicios, normalizarDeclaracion(xml), indice);
    this.definiciones = r.definiciones;
    this.indiceDiagrama = r.indice;
    return r;
  }

  diagramas() {
    return ((this.definiciones && this.definiciones.diagrams) || []).map((d, i) => ({ indice: i, nombre: nombreDiagrama(d, i) }));
  }

  ajustarVista() {
    ajustarVista(this.get('canvas'));
  }
}
