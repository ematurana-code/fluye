// Diagrama inicial: un pool con dos carriles y un evento de inicio, listo para modelar.
import { nuevoId } from '../tipos.js';

export function plantillaNueva(nombre = 'Proceso 1') {
  const id = (t) => nuevoId(t);
  const [defs, col, part, proc, ls, l1, l2, ini] = ['Definitions', 'Collaboration', 'Participant', 'Process', 'LaneSet', 'Lane', 'Lane', 'StartEvent'].map(id);
  const x = 80, y = 60, w = 960, hCarril = 160, cab = 30;
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="${defs}" targetNamespace="http://fluye.app/bpmn" exporter="Fluye" exporterVersion="0.1.0">
  <bpmn:collaboration id="${col}">
    <bpmn:participant id="${part}" name="${esc(nombre)}" processRef="${proc}" />
  </bpmn:collaboration>
  <bpmn:process id="${proc}" isExecutable="false">
    <bpmn:laneSet id="${ls}">
      <bpmn:lane id="${l1}" name="Carril 1"><bpmn:flowNodeRef>${ini}</bpmn:flowNodeRef></bpmn:lane>
      <bpmn:lane id="${l2}" name="Carril 2" />
    </bpmn:laneSet>
    <bpmn:startEvent id="${ini}" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="${col}">
      <bpmndi:BPMNShape id="DI_${part}" bpmnElement="${part}" isHorizontal="true"><dc:Bounds x="${x}" y="${y}" width="${w}" height="${hCarril * 2}" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="DI_${l1}" bpmnElement="${l1}" isHorizontal="true"><dc:Bounds x="${x + cab}" y="${y}" width="${w - cab}" height="${hCarril}" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="DI_${l2}" bpmnElement="${l2}" isHorizontal="true"><dc:Bounds x="${x + cab}" y="${y + hCarril}" width="${w - cab}" height="${hCarril}" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="DI_${ini}" bpmnElement="${ini}"><dc:Bounds x="${x + cab + 50}" y="${y + hCarril / 2 - 18}" width="36" height="36" /></bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
}
