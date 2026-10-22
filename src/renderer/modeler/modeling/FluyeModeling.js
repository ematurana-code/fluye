// Modeling de diagram-js + lo propio de Fluye: conectar con el tipo de flujo correcto, renombrar, propiedades.
import Modeling from 'diagram-js/lib/features/modeling/Modeling.js';
import { PropiedadesHandler, RenombrarHandler } from './comandos.js';

export default class FluyeModeling extends Modeling {
  static $inject = ['eventBus', 'elementFactory', 'commandStack', 'rules', 'canvas'];

  constructor(eventBus, elementFactory, commandStack, rules, canvas) {
    super(eventBus, elementFactory, commandStack);
    this._rules = rules;
    this._canvas = canvas;
  }

  getHandlers() {
    return { ...super.getHandlers(), 'elemento.renombrar': RenombrarHandler, 'elemento.propiedades': PropiedadesHandler };
  }

  connect(origen, destino, attrs, hints) {
    if (!attrs || !attrs.type) {
      const permitido = this._rules.allowed('connection.create', { source: origen, target: destino });
      if (!permitido) return null;
      attrs = { ...(typeof permitido === 'object' ? permitido : { type: 'bpmn:SequenceFlow' }), ...(attrs || {}) };
    }
    const padre = attrs.type === 'bpmn:MessageFlow' ? this._canvas.getRootElement() : origen.parent;
    return this.createConnection(origen, destino, attrs, padre, hints);
  }

  renombrar(elemento, nombre) {
    this._commandStack.execute('elemento.renombrar', { elemento, nombre });
  }

  cambiarPropiedades(elemento, props, visual) {
    this._commandStack.execute('elemento.propiedades', { elemento, props, visual });
  }
}
