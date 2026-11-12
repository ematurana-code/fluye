// Catálogo de elementos BPMN que maneja Fluye: tamaños, colores por defecto, nombres y clasificación.

export const CABECERA = 30; // ancho de la franja con el nombre de pools y carriles

// Ancho real de la franja del pool (los archivos de Bizagi usan 20 px).
export function cabeceraDe(pool) {
  return (pool && pool.cabecera) || CABECERA;
}

export const COLORES = {
  inicio: { fill: '#E6FF97', stroke: '#62A716' },
  intermedio: { fill: '#FFF6D5', stroke: '#B08A1E' },
  fin: { fill: '#EEAAAA', stroke: '#990000' },
  tarea: { fill: '#ECEFFF', stroke: '#03689A' },
  compuerta: { fill: '#FFFFCC', stroke: '#A6A61D' },
  dato: { fill: '#FFFFFF', stroke: '#475569' },
  contenedor: { fill: '#FFFFFF', stroke: '#64748B', cabecera: '#F8FAFC' },
  anotacion: { fill: 'none', stroke: '#64748B' },
  grupo: { fill: 'none', stroke: '#64748B' },
  flujo: '#334155',
  texto: '#0F172A'
};

// Paleta de colores que el usuario puede asignar (relleno / borde).
export const COLORES_USUARIO = [
  { nombre: 'Por defecto', fill: null, stroke: null },
  { nombre: 'Azul', fill: '#DBEAFE', stroke: '#1E3A8A' },
  { nombre: 'Verde', fill: '#D1FAE5', stroke: '#059669' },
  { nombre: 'Amarillo', fill: '#FEF3C7', stroke: '#D97706' },
  { nombre: 'Rojo', fill: '#FEE2E2', stroke: '#DC2626' },
  { nombre: 'Morado', fill: '#EDE9FE', stroke: '#6D28D9' },
  { nombre: 'Gris', fill: '#F1F5F9', stroke: '#475569' }
];

const TAMANOS = {
  evento: { width: 36, height: 36 },
  actividad: { width: 100, height: 64 },
  compuerta: { width: 46, height: 46 },
  objetoDatos: { width: 36, height: 48 },
  deposito: { width: 50, height: 46 },
  anotacion: { width: 120, height: 44 },
  grupo: { width: 280, height: 180 },
  pool: { width: 960, height: 300 },
  carril: { width: 930, height: 150 },
  subprocesoExpandido: { width: 360, height: 200 },
  texto: { width: 180, height: 40 },
  encabezado: { width: 320, height: 140 },
  imagen: { width: 120, height: 90 }
};

// Elementos propios de Fluye que no existen en BPMN (como en Bizagi): fases del pool, texto con formato, encabezado e
// imagen. Se guardan en la parte gráfica del diagrama (extensión "fluye:" del BPMNPlane): otras herramientas los ignoran
// sin perder nada del proceso. Su objeto es un elemento genérico de moddle (createAny) con el mismo $type.
export const NS_FLUYE = 'http://fluye.app/schema/1.0';
export const TIPOS_FLUYE = ['fluye:fase', 'fluye:texto', 'fluye:encabezado', 'fluye:imagen'];
export const ALTO_CABECERA_FASE = 24;
// Datos que guarda cada uno (además de id, posición, tamaño, pool donde está y color).
export const DATOS_FLUYE = {
  'fluye:fase': ['name'],
  'fluye:texto': ['name', 'tamano', 'negrita', 'cursiva', 'subrayado', 'color', 'alinear', 'fondo', 'borde'],
  'fluye:encabezado': ['titulo', 'autor', 'version', 'descripcion', 'fecha'],
  'fluye:imagen': ['name', 'href']
};
export function datosFluye(objeto, tipo) {
  const datos = {};
  for (const k of DATOS_FLUYE[tipo] || []) {
    const v = objeto && objeto[k];
    if (v !== undefined && v !== null && v !== '') datos[k] = typeof v === 'string' ? limpiarTexto(v) : String(v);
  }
  return datos;
}

const NOMBRES = {
  'bpmn:Task': 'Tarea', 'bpmn:UserTask': 'Tarea de usuario', 'bpmn:ServiceTask': 'Tarea automática',
  'bpmn:ManualTask': 'Tarea manual', 'bpmn:ScriptTask': 'Tarea de script', 'bpmn:SendTask': 'Tarea de envío',
  'bpmn:ReceiveTask': 'Tarea de recepción', 'bpmn:BusinessRuleTask': 'Tarea de regla de negocio',
  'bpmn:SubProcess': 'Subproceso', 'bpmn:CallActivity': 'Subproceso reutilizable',
  'bpmn:ExclusiveGateway': 'Decisión', 'bpmn:ParallelGateway': 'Paralelo',
  'bpmn:InclusiveGateway': 'Decisión inclusiva (uno o varios)', 'bpmn:EventBasedGateway': 'Decisión por evento',
  'bpmn:ComplexGateway': 'Decisión compleja',
  'bpmn:StartEvent': 'Inicio', 'bpmn:EndEvent': 'Fin', 'bpmn:IntermediateCatchEvent': 'Evento intermedio',
  'bpmn:IntermediateThrowEvent': 'Evento intermedio', 'bpmn:BoundaryEvent': 'Evento de borde',
  'bpmn:Participant': 'Pool (proceso)', 'bpmn:Lane': 'Carril',
  'bpmn:DataObjectReference': 'Documento', 'bpmn:DataStoreReference': 'Base de datos',
  'bpmn:TextAnnotation': 'Anotación', 'bpmn:Group': 'Grupo',
  'bpmn:SequenceFlow': 'Flujo', 'bpmn:MessageFlow': 'Flujo de mensaje', 'bpmn:Association': 'Asociación',
  'bpmn:DataInputAssociation': 'Asociación de datos', 'bpmn:DataOutputAssociation': 'Asociación de datos',
  'fluye:fase': 'Fase', 'fluye:texto': 'Texto', 'fluye:encabezado': 'Encabezado', 'fluye:imagen': 'Imagen'
};

// Prefijo para numerar nombres por defecto sin repetir ("Tarea 1", "Tarea 2"...).
const PREFIJO_NOMBRE = {
  'bpmn:Task': 'Tarea', 'bpmn:UserTask': 'Tarea', 'bpmn:ServiceTask': 'Tarea', 'bpmn:ManualTask': 'Tarea',
  'bpmn:SubProcess': 'Subproceso', 'bpmn:Participant': 'Proceso', 'bpmn:Lane': 'Carril', 'fluye:fase': 'Fase'
};

export const DEFINICIONES_EVENTO = {
  mensaje: 'bpmn:MessageEventDefinition',
  temporizador: 'bpmn:TimerEventDefinition',
  terminacion: 'bpmn:TerminateEventDefinition',
  error: 'bpmn:ErrorEventDefinition',
  senal: 'bpmn:SignalEventDefinition',
  condicional: 'bpmn:ConditionalEventDefinition',
  escalamiento: 'bpmn:EscalationEventDefinition',
  enlace: 'bpmn:LinkEventDefinition',
  compensacion: 'bpmn:CompensateEventDefinition',
  cancelacion: 'bpmn:CancelEventDefinition'
};

// Nombre de una pestaña: el del diagrama en el archivo o "Diagrama N".
export const nombreDiagrama = (d, i) => (d && d.name && d.name.trim()) || `Diagrama ${i + 1}`;

export function bo(elemento) {
  return (elemento && elemento.businessObject) || elemento;
}

export function es(elemento, ...tipos) {
  const b = bo(elemento);
  return !!b && typeof b.$instanceOf === 'function' && tipos.some((t) => b.$instanceOf(t));
}

export const esEvento = (e) => es(e, 'bpmn:Event');
export const esActividad = (e) => es(e, 'bpmn:Activity');
export const esCompuerta = (e) => es(e, 'bpmn:Gateway');
export const esNodo = (e) => es(e, 'bpmn:FlowNode');
export const esPool = (e) => es(e, 'bpmn:Participant');
export const esCarril = (e) => es(e, 'bpmn:Lane');
export const esDato = (e) => es(e, 'bpmn:DataObjectReference', 'bpmn:DataStoreReference', 'bpmn:DataInput', 'bpmn:DataOutput');
export const esAnotacion = (e) => es(e, 'bpmn:TextAnnotation');
export const esGrupo = (e) => es(e, 'bpmn:Group');
export const esSubprocesoExpandido = (e) => es(e, 'bpmn:SubProcess') && e.collapsed === false;
export const esConexion = (e) => es(e, 'bpmn:SequenceFlow', 'bpmn:MessageFlow', 'bpmn:Association', 'bpmn:DataAssociation');
export const esFase = (e) => es(e, 'fluye:fase');
export const esTexto = (e) => es(e, 'fluye:texto');
export const esEncabezado = (e) => es(e, 'fluye:encabezado');
export const esImagen = (e) => es(e, 'fluye:imagen');
export const esArtefactoFluye = (e) => TIPOS_FLUYE.some((t) => es(e, t));
export const esBorde = (e) => es(e, 'bpmn:BoundaryEvent');

// Fases de un pool, de izquierda a derecha.
export function fasesDe(pool) {
  return ((pool && pool.children) || []).filter(esFase).sort((a, b) => a.x - b.x);
}

// Fase donde cae el centro de un elemento (para el panel, el Word y el Play).
export function faseDe(elemento) {
  let pool = elemento && elemento.parent;
  while (pool && !esPool(pool)) pool = pool.parent;
  if (!pool || esFase(elemento)) return null;
  const cx = elemento.x + elemento.width / 2;
  return fasesDe(pool).find((f) => cx >= f.x && cx <= f.x + f.width) || null;
}

// Título que muestra un encabezado: el propio o, si no tiene, el nombre de la pestaña (se actualiza solo).
export function tituloEncabezado(elemento) {
  const propio = (bo(elemento).titulo || '').trim();
  if (propio) return propio;
  let raiz = elemento;
  while (raiz && raiz.parent) raiz = raiz.parent;
  return (raiz && raiz.nombreDiagrama) || 'Diagrama';
}

export function tipoEvento(elemento) {
  const def = (bo(elemento).eventDefinitions || [])[0];
  if (!def) return null;
  return Object.keys(DEFINICIONES_EVENTO).find((k) => DEFINICIONES_EVENTO[k] === def.$type) || 'otro';
}

export function tamanoPorDefecto(tipo, opciones = {}) {
  const t = (x) => tipo === x;
  if (/Event$/.test(tipo)) return TAMANOS.evento;
  if (/Gateway$/.test(tipo)) return TAMANOS.compuerta;
  if (t('bpmn:SubProcess') && opciones.expandido) return TAMANOS.subprocesoExpandido;
  if (/Task$/.test(tipo) || t('bpmn:SubProcess') || t('bpmn:CallActivity')) return TAMANOS.actividad;
  if (t('bpmn:DataObjectReference')) return TAMANOS.objetoDatos;
  if (t('bpmn:DataStoreReference')) return TAMANOS.deposito;
  if (t('bpmn:TextAnnotation')) return TAMANOS.anotacion;
  if (t('bpmn:Group')) return TAMANOS.grupo;
  if (t('bpmn:Participant')) return TAMANOS.pool;
  if (t('bpmn:Lane')) return TAMANOS.carril;
  if (t('fluye:texto')) return TAMANOS.texto;
  if (t('fluye:encabezado')) return TAMANOS.encabezado;
  if (t('fluye:imagen')) return TAMANOS.imagen;
  return { width: 100, height: 80 };
}

export function nombreTipo(elemento) {
  const b = bo(elemento);
  const tipo = b.$type;
  if (esEvento(b)) {
    const ev = tipoEvento(b);
    const base = NOMBRES[tipo] || 'Evento';
    const sufijo = { mensaje: 'de mensaje', temporizador: 'de temporizador', terminacion: 'de terminación', error: 'de error', senal: 'de señal' }[ev];
    return sufijo ? `${base} ${sufijo}` : base;
  }
  return NOMBRES[tipo] || tipo.replace('bpmn:', '');
}

export function prefijoNombre(tipo) {
  return PREFIJO_NOMBRE[tipo] || null;
}

// Colores por defecto de un elemento según su tipo.
export function coloresBase(elemento) {
  if (es(elemento, 'bpmn:StartEvent')) return COLORES.inicio;
  if (es(elemento, 'bpmn:EndEvent')) return COLORES.fin;
  if (esEvento(elemento)) return COLORES.intermedio;
  if (esActividad(elemento)) return COLORES.tarea;
  if (esCompuerta(elemento)) return COLORES.compuerta;
  if (esDato(elemento)) return COLORES.dato;
  if (esPool(elemento) || esCarril(elemento) || esFase(elemento) || esEncabezado(elemento)) return COLORES.contenedor;
  if (esAnotacion(elemento)) return COLORES.anotacion;
  return COLORES.grupo;
}

export function colores(elemento) {
  const base = coloresBase(elemento);
  const propios = elemento.colores || {};
  return { ...base, fill: propios.fill || base.fill, stroke: propios.stroke || base.stroke };
}

// ¿El elemento lleva el nombre debajo de la figura (y no dentro)?
export function nombreExterno(elemento) {
  return esEvento(elemento) || esCompuerta(elemento) || esDato(elemento);
}

let contador = 0;
// Caracteres de control que un XML no admite (por ejemplo, el salto suave de un texto pegado desde Word o PowerPoint):
// los saltos de página o de línea suaves pasan a ser saltos de línea normales y el resto se quita.
export const limpiarTexto = (t) => String(t ?? '').replace(/[\u000B\u000C]/g, '\n').replace(/[\u0000-\u0008\u000E-\u001F]/g, '');

export function nuevoId(tipo) {
  const local = String(tipo || 'Elemento').replace(/^bpmn:/, '');
  contador = (contador + 1) % 1296;
  return `${local}_${Date.now().toString(36).slice(-5)}${contador.toString(36).padStart(2, '0')}${Math.random().toString(36).slice(2, 5)}`;
}
