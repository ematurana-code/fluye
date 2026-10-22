// Paleta de elementos a la izquierda: clic o arrastrar para crear; los que tienen variantes muestran un menú al lado.
import { GLIFOS } from './glifos.js';

export const GRUPOS = [
  { nombre: 'Eventos', items: [
    { id: 'inicio', titulo: 'Inicio', variantes: [
      { glifo: 'inicio', titulo: 'Inicio', tipo: 'bpmn:StartEvent' },
      { glifo: 'inicioMensaje', titulo: 'Inicio por mensaje', tipo: 'bpmn:StartEvent', opciones: { evento: 'mensaje' } },
      { glifo: 'inicioTemporizador', titulo: 'Inicio programado', tipo: 'bpmn:StartEvent', opciones: { evento: 'temporizador' } }] },
    { id: 'intermedio', titulo: 'Evento intermedio', variantes: [
      { glifo: 'intermedio', titulo: 'Evento intermedio', tipo: 'bpmn:IntermediateThrowEvent' },
      { glifo: 'intermedioTemporizador', titulo: 'Espera (temporizador)', tipo: 'bpmn:IntermediateCatchEvent', opciones: { evento: 'temporizador' } },
      { glifo: 'intermedioMensaje', titulo: 'Recibir mensaje', tipo: 'bpmn:IntermediateCatchEvent', opciones: { evento: 'mensaje' } },
      { glifo: 'intermedioEnvio', titulo: 'Enviar mensaje', tipo: 'bpmn:IntermediateThrowEvent', opciones: { evento: 'mensaje' } }] },
    { id: 'fin', titulo: 'Fin', variantes: [
      { glifo: 'fin', titulo: 'Fin', tipo: 'bpmn:EndEvent' },
      { glifo: 'finTerminacion', titulo: 'Fin que termina todo', tipo: 'bpmn:EndEvent', opciones: { evento: 'terminacion' } },
      { glifo: 'finMensaje', titulo: 'Fin con mensaje', tipo: 'bpmn:EndEvent', opciones: { evento: 'mensaje' } }] }
  ] },
  { nombre: 'Actividades', items: [
    { id: 'tarea', titulo: 'Tarea', variantes: [
      { glifo: 'tarea', titulo: 'Tarea', tipo: 'bpmn:Task' },
      { glifo: 'tareaUsuario', titulo: 'Tarea de usuario', tipo: 'bpmn:UserTask' },
      { glifo: 'tareaServicio', titulo: 'Tarea automática', tipo: 'bpmn:ServiceTask' },
      { glifo: 'tareaManual', titulo: 'Tarea manual', tipo: 'bpmn:ManualTask' }] },
    { id: 'subproceso', titulo: 'Subproceso', variantes: [{ glifo: 'subproceso', titulo: 'Subproceso', tipo: 'bpmn:SubProcess' }] }
  ] },
  { nombre: 'Decisiones', items: [
    { id: 'compuerta', titulo: 'Decisión', variantes: [
      { glifo: 'exclusiva', titulo: 'Decisión (un camino)', tipo: 'bpmn:ExclusiveGateway' },
      { glifo: 'paralela', titulo: 'Paralelo (todos los caminos)', tipo: 'bpmn:ParallelGateway' },
      { glifo: 'inclusiva', titulo: 'Inclusiva (uno o varios)', tipo: 'bpmn:InclusiveGateway' }] }
  ] },
  { nombre: 'Organización', items: [
    { id: 'pool', titulo: 'Pool (proceso)', variantes: [{ glifo: 'pool', titulo: 'Pool (proceso)', tipo: 'bpmn:Participant' }] },
    { id: 'carril', titulo: 'Carril (responsable)', variantes: [{ glifo: 'carril', titulo: 'Carril (responsable)', tipo: 'bpmn:Lane' }] }
  ] },
  { nombre: 'Datos y notas', items: [
    { id: 'dato', titulo: 'Documento', variantes: [{ glifo: 'dato', titulo: 'Documento', tipo: 'bpmn:DataObjectReference' }] },
    { id: 'deposito', titulo: 'Base de datos', variantes: [{ glifo: 'deposito', titulo: 'Base de datos', tipo: 'bpmn:DataStoreReference' }] },
    { id: 'anotacion', titulo: 'Anotación', variantes: [{ glifo: 'anotacion', titulo: 'Anotación', tipo: 'bpmn:TextAnnotation' }] },
    { id: 'grupo', titulo: 'Grupo', variantes: [{ glifo: 'grupo', titulo: 'Grupo', tipo: 'bpmn:Group' }] }
  ] }
];

export function crearPaleta(contenedor, modeler) {
  const factory = modeler.get('elementFactory');
  const create = modeler.get('create');
  let flotante = null, timer = null;

  const iniciar = (evento, variante) => {
    cerrarFlotante();
    create.start(evento, factory.crear(variante.tipo, variante.opciones || {}));
  };

  const boton = (variante, clase, conEtiqueta = false) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = clase;
    b.draggable = true;
    b.title = conEtiqueta ? '' : variante.titulo;
    b.innerHTML = GLIFOS[variante.glifo] + (conEtiqueta ? `<span>${variante.titulo}</span>` : '');
    b.addEventListener('click', (e) => iniciar(e, variante));
    b.addEventListener('dragstart', (e) => iniciar(e, variante));
    return b;
  };

  function cerrarFlotante() {
    clearTimeout(timer);
    if (flotante) flotante.remove();
    flotante = null;
  }

  function abrirFlotante(item, ancla) {
    cerrarFlotante();
    flotante = document.createElement('div');
    flotante.className = 'fl-paleta-flotante';
    flotante.innerHTML = `<div class="fl-paleta-flotante-titulo">${item.titulo}</div>`;
    for (const v of item.variantes) flotante.appendChild(boton(v, 'fl-paleta-variante', true));
    const r = ancla.getBoundingClientRect();
    flotante.style.left = `${r.right + 6}px`;
    flotante.style.top = `${Math.max(8, r.top - 8)}px`;
    flotante.addEventListener('mouseenter', () => clearTimeout(timer));
    flotante.addEventListener('mouseleave', () => { timer = setTimeout(cerrarFlotante, 250); });
    document.body.appendChild(flotante);
  }

  contenedor.innerHTML = '';

  GRUPOS.forEach((grupo, i) => {
    if (i) contenedor.appendChild(Object.assign(document.createElement('div'), { className: 'fl-paleta-separador' }));
    for (const item of grupo.items) {
      const envoltura = document.createElement('div');
      envoltura.className = 'fl-paleta-item';
      const b = boton(item.variantes[0], 'fl-paleta-boton');
      b.title = item.variantes.length > 1 ? `${item.titulo} — pasa el mouse para ver variantes` : item.titulo;
      envoltura.appendChild(b);
      if (item.variantes.length > 1) {
        envoltura.classList.add('con-variantes');
        envoltura.addEventListener('mouseenter', () => { clearTimeout(timer); timer = setTimeout(() => abrirFlotante(item, envoltura), 280); });
        envoltura.addEventListener('mouseleave', () => { clearTimeout(timer); timer = setTimeout(cerrarFlotante, 250); });
      }
      contenedor.appendChild(envoltura);
    }
  });

  modeler.on('create.start', cerrarFlotante);
}
