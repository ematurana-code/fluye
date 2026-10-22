// Crea las figuras del diagrama junto con su objeto BPMN (businessObject).
import ElementFactory from 'diagram-js/lib/core/ElementFactory.js';
import { DEFINICIONES_EVENTO, nuevoId, tamanoPorDefecto } from '../tipos.js';

export default class FluyeElementFactory extends ElementFactory {
  static $inject = ['moddle'];

  constructor(moddle) {
    super();
    this._moddle = moddle;
  }

  create(tipoElemento, attrs = {}) {
    if (tipoElemento === 'label' || tipoElemento === 'root') return super.create(tipoElemento, attrs);
    attrs = { ...attrs };
    let b = attrs.businessObject;
    if (!b) {
      if (!attrs.type) throw new Error('Falta el tipo del elemento');
      b = this._moddle.create(attrs.type, { id: nuevoId(attrs.type) });
      if (attrs.evento && DEFINICIONES_EVENTO[attrs.evento]) {
        b.eventDefinitions = [this._moddle.create(DEFINICIONES_EVENTO[attrs.evento], { id: nuevoId('EventDefinition') })];
      }
      if (attrs.type === 'bpmn:Participant') {
        b.processRef = this._moddle.create('bpmn:Process', { id: nuevoId('bpmn:Process'), isExecutable: false });
      }
      if (attrs.type === 'bpmn:DataObjectReference') {
        b.dataObjectRef = this._moddle.create('bpmn:DataObject', { id: nuevoId('bpmn:DataObject') });
      }
      if (attrs.type === 'bpmn:Group') {
        b.categoryValueRef = this._moddle.create('bpmn:CategoryValue', { id: nuevoId('bpmn:CategoryValue'), value: attrs.nombre || '' });
      }
      if (attrs.nombre && attrs.type === 'bpmn:TextAnnotation') b.text = attrs.nombre;
      else if (attrs.nombre && attrs.type !== 'bpmn:Group') b.name = attrs.nombre;
    }
    delete attrs.evento;
    delete attrs.nombre;
    attrs.businessObject = b;
    attrs.type = attrs.type || b.$type;
    attrs.id = attrs.id || b.id;

    if (tipoElemento === 'shape') {
      if (attrs.type === 'bpmn:SubProcess' && attrs.collapsed === undefined) attrs.collapsed = true;
      const t = tamanoPorDefecto(attrs.type, { expandido: attrs.collapsed === false });
      if (attrs.width === undefined) attrs.width = t.width;
      if (attrs.height === undefined) attrs.height = t.height;
    }
    return super.create(tipoElemento, attrs);
  }

  // Atajo: crea una figura BPMN con el tipo y opciones dadas.
  crear(tipo, opciones = {}) {
    return this.createShape({ type: tipo, ...opciones });
  }
}
