// Paleta de elementos a la izquierda: clic o arrastrar para crear; los que tienen variantes muestran un menú al lado.
import { GLIFOS } from './glifos.js';
import { elegirImagen, misFiguras, nuevaFigura, quitarFigura, tamanoEnDiagrama } from './figuras.js';
import { esPool } from '../modeler/tipos.js';

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
      { glifo: 'intermedioEnvio', titulo: 'Enviar mensaje', tipo: 'bpmn:IntermediateThrowEvent', opciones: { evento: 'mensaje' } },
      // Se suelta sobre la línea del borde de una tarea (o desde el menú rápido de la tarea).
      { glifo: 'borde', titulo: 'En el borde de una tarea (plazo)', tipo: 'bpmn:BoundaryEvent', opciones: { evento: 'temporizador' } }] },
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
    { id: 'carril', titulo: 'Carril (responsable)', variantes: [{ glifo: 'carril', titulo: 'Carril (responsable)', tipo: 'bpmn:Lane' }] },
    { id: 'fase', titulo: 'Fase (etapa del proceso): suéltala sobre un pool', variantes: [{ glifo: 'fase', titulo: 'Fase (etapa del proceso)', tipo: 'fluye:fase' }] }
  ] },
  { nombre: 'Datos y notas', items: [
    { id: 'dato', titulo: 'Documento', variantes: [{ glifo: 'dato', titulo: 'Documento', tipo: 'bpmn:DataObjectReference' }] },
    { id: 'deposito', titulo: 'Base de datos', variantes: [{ glifo: 'deposito', titulo: 'Base de datos', tipo: 'bpmn:DataStoreReference' }] },
    { id: 'anotacion', titulo: 'Anotación', variantes: [{ glifo: 'anotacion', titulo: 'Anotación', tipo: 'bpmn:TextAnnotation' }] },
    { id: 'grupo', titulo: 'Grupo', variantes: [{ glifo: 'grupo', titulo: 'Grupo', tipo: 'bpmn:Group' }] }
  ] },
  { nombre: 'Presentación', items: [
    { id: 'texto', titulo: 'Texto libre (con formato)', variantes: [{ glifo: 'texto', titulo: 'Texto libre', tipo: 'fluye:texto', opciones: { datos: { name: 'Texto' } } }] },
    { id: 'encabezado', titulo: 'Encabezado: título, autor, versión y fecha', variantes: [{ glifo: 'encabezado', titulo: 'Encabezado', tipo: 'fluye:encabezado' }] },
    { id: 'imagen', titulo: 'Imagen del equipo', variantes: [{ glifo: 'imagen', titulo: 'Imagen', accion: 'imagen' }] },
    { id: 'figura', titulo: 'Mis figuras', dinamico: true, variantes: [{ glifo: 'figura', titulo: 'Nueva figura…', accion: 'figura' }] }
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

  // Imagen y figura nueva: primero se elige el archivo; la figura aparece al centro de la vista (en el pool que esté ahí).
  const ponerAlCentro = (forma) => {
    const canvas = modeler.get('canvas'), vb = canvas.viewbox();
    const c = { x: Math.round(vb.x + vb.width / 2), y: Math.round(vb.y + vb.height / 2) };
    const pool = modeler.get('elementRegistry').find((e) => esPool(e) && c.x >= e.x && c.x <= e.x + e.width && c.y >= e.y && c.y <= e.y + e.height);
    const creada = modeler.get('modeling').createShape(forma, c, pool || canvas.getRootElement());
    modeler.get('selection').select(creada);
  };
  const formaFigura = (f) => factory.crear('fluye:imagen', { datos: { name: f.nombre, href: f.href }, ...tamanoEnDiagrama(f.ancho || 64, f.alto || 64, 64) });
  const acciones = {
    imagen: async () => {
      const r = await elegirImagen(1200);
      if (r) ponerAlCentro(factory.crear('fluye:imagen', { datos: { href: r.href }, ...tamanoEnDiagrama(r.ancho, r.alto) }));
    },
    figura: async () => {
      const f = await nuevaFigura();
      if (f) ponerAlCentro(formaFigura(f));
    }
  };

  const boton = (variante, clase, conEtiqueta = false) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = clase;
    b.title = conEtiqueta ? '' : variante.titulo;
    // Glifos fijos del código; las figuras propias, con su imagen como <img> y su nombre como texto.
    if (variante.figura) b.appendChild(Object.assign(document.createElement('img'), { className: 'fl-paleta-figura', alt: '', src: variante.figura.href }));
    else b.innerHTML = GLIFOS[variante.glifo];
    if (conEtiqueta) b.appendChild(Object.assign(document.createElement('span'), { textContent: variante.titulo }));
    if (variante.accion) {
      b.addEventListener('click', () => { cerrarFlotante(); acciones[variante.accion](); });
      return b;
    }
    b.draggable = true;
    const crear = (e) => (variante.figura ? (cerrarFlotante(), create.start(e, formaFigura(variante.figura))) : iniciar(e, variante));
    b.addEventListener('click', crear);
    b.addEventListener('dragstart', crear);
    return b;
  };

  function cerrarFlotante() {
    clearTimeout(timer);
    if (flotante) flotante.remove();
    flotante = null;
  }

  // Variantes de "Mis figuras": las guardadas (para arrastrar) y "Nueva figura…".
  const variantesDe = (item) => {
    if (!item.dinamico) return item.variantes;
    const guardadas = misFiguras().map((f) => ({ figura: f, titulo: f.nombre }));
    return [...guardadas, ...item.variantes];
  };

  function abrirFlotante(item, ancla) {
    cerrarFlotante();
    flotante = document.createElement('div');
    flotante.className = 'fl-paleta-flotante';
    const titulo = Object.assign(document.createElement('div'), { className: 'fl-paleta-flotante-titulo', textContent: item.dinamico ? 'Mis figuras' : item.titulo });
    flotante.appendChild(titulo);
    for (const v of variantesDe(item)) {
      const b = boton(v, 'fl-paleta-variante', true);
      if (v.figura) {
        const fila = Object.assign(document.createElement('div'), { className: 'fl-paleta-fila' });
        const quitar = Object.assign(document.createElement('button'), { type: 'button', className: 'fl-paleta-quitar', title: 'Quitar de mis figuras', textContent: '×' });
        quitar.addEventListener('click', async (e) => {
          e.stopPropagation();
          cerrarFlotante();
          await quitarFigura(v.figura.id);
        });
        fila.append(b, quitar);
        flotante.appendChild(fila);
      } else flotante.appendChild(b);
    }
    const r = ancla.getBoundingClientRect();
    flotante.style.left = `${r.right + 6}px`;
    flotante.style.top = `${Math.max(8, Math.min(r.top - 8, innerHeight - 40 - 34 * variantesDe(item).length))}px`;
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
      const conMenu = item.variantes.length > 1 || item.dinamico;
      b.title = item.dinamico ? 'Mis figuras: clic para crear una nueva; pasa el mouse para ver las guardadas'
        : item.variantes.length > 1 ? `${item.titulo} — pasa el mouse para ver variantes` : item.titulo;
      envoltura.appendChild(b);
      if (conMenu) {
        envoltura.classList.add('con-variantes');
        envoltura.addEventListener('mouseenter', () => {
          clearTimeout(timer);
          timer = setTimeout(() => { if (variantesDe(item).length > 1) abrirFlotante(item, envoltura); }, 280);
        });
        envoltura.addEventListener('mouseleave', () => { clearTimeout(timer); timer = setTimeout(cerrarFlotante, 250); });
      }
      contenedor.appendChild(envoltura);
    }
  });

  modeler.on('create.start', cerrarFlotante);
}
