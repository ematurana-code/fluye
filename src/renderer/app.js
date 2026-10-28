// Arranque de la interfaz de Fluye.
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import './styles.css';

import Modeler from './modeler/Modeler.js';
import { CABECERA, cabeceraDe, es, esCarril, esCompuerta, esConexion, esPool } from './modeler/tipos.js';
import { icono } from './iconos.js';
import { crearPaleta } from './ui/paleta.js';
import { crearHerramientas } from './ui/herramientas.js';
import { crearPestanas } from './ui/pestanas.js';
import { abrirGaleria } from './ui/galeria.js';
import { revisarDiagrama } from './modeler/revision.js';
import PLANTILLAS from 'fluye:plantillas';
import { crearPropiedades } from './ui/propiedades.js';
import * as archivo from './ui/archivo.js';
import { aviso, elegirOpcion, preguntar } from './ui/dialogos.js';
import { mostrarMenuOrtografia } from './ui/ortografia.js';
import Play from './play/Play.js';
import { htmlParaPdf, pngDelDiagrama, svgDelDiagrama } from './exportar/imagen.js';
import { wordDelDiagrama } from './exportar/word.js';
import { htmlInteractivo } from './exportar/web.js';

const $ = (s) => document.querySelector(s);

// Íconos de la barra (contenido fijo del código).
document.querySelectorAll('[data-icono]').forEach((n) => { n.insertAdjacentHTML('afterbegin', icono(n.dataset.icono, Number(n.dataset.tamano) || 18)); });

await Promise.all(['400', '600'].map((p) => document.fonts.load(`${p} 12px Inter`))).catch(() => {});

const modeler = new Modeler({ contenedor: $('#lienzo') });
window.fluye = modeler; // acceso para pruebas desde la consola
const commandStack = modeler.get('commandStack');
const canvas = modeler.get('canvas');

// sucio: hubo cambios en otra pestaña o en las pestañas mismas (al cambiar de pestaña el historial de deshacer parte de cero).
const estado = { ruta: null, nombre: 'Proceso sin título', guardadoEn: null, sucio: false };
const vistas = new Map(); // zoom y posición de cada pestaña, para volver a verla igual
let relojRespaldo = null; // versión web: respaldo en el navegador poco después del último cambio
let respaldoActivo = false; // recién al terminar de partir: antes, el respaldo anterior todavía puede recuperarse

// Se recuerda la última acción del historial al guardar (no su posición): después de deshacer, una acción nueva ocupa
// la misma posición que la guardada y se perdería la marca de cambios sin guardar.
const puntoPila = () => commandStack._stack[commandStack._stackIdx] || null;
const hayCambios = () => estado.sucio || puntoPila() !== estado.guardadoEn;

function actualizarTitulo() {
  const cambios = hayCambios();
  $('#nombre-archivo').textContent = estado.nombre.replace(/\.(bpmn|xml)$/i, '');
  $('#marca-cambios').hidden = !cambios;
  $('#btn-deshacer').disabled = !commandStack.canUndo();
  $('#btn-rehacer').disabled = !commandStack.canRedo();
  archivo.marcarCambios(cambios, `${cambios ? '• ' : ''}${estado.nombre.replace(/\.(bpmn|xml)$/i, '')} — Fluye`);
  if (!archivo.esEscritorio) programarRespaldo();
}

function actualizarZoom() {
  $('#zoom-valor').textContent = `${Math.round(canvas.zoom() * 100)}%`;
}

// Lo que se está escribiendo (un nombre en el lienzo o un campo del panel) se confirma antes de guardar,
// cambiar de pestaña, abrir otra cosa o cerrar; si no, se perdería.
function confirmarEdiciones() {
  modeler.terminarEdicion();
  const activo = document.activeElement;
  if (activo && /INPUT|TEXTAREA|SELECT/.test(activo.tagName) && activo.blur) activo.blur();
}

const hayDialogoAbierto = () => !!document.querySelector('.modal-overlay');

async function cargar(xml, nombre, ruta) {
  try {
    const { avisos } = await modeler.abrirSinPerder(() => modeler.abrir(xml));
    Object.assign(estado, { ruta, nombre, guardadoEn: puntoPila(), sucio: false });
    vistas.clear();
    pestanas.actualizar();
    modeler.ajustarVista();
    actualizarTitulo();
    actualizarZoom();
    if (avisos.length) aviso(`Se abrió con ${avisos.length} observación(es): ${avisos[0]}`, 'alerta', 6000);
    return true;
  } catch (e) {
    console.error(e);
    aviso(`No se pudo abrir: ${e.message}`, 'error', 7000);
    return false;
  }
}

async function confirmarDescarte() {
  confirmarEdiciones();
  if (!hayCambios()) return true;
  const r = await preguntar('Hay cambios sin guardar', `¿Quieres guardar "${estado.nombre.replace(/\.(bpmn|xml)$/i, '')}" antes de continuar?`, [
    { id: 'cancelar', texto: 'Cancelar' }, { id: 'descartar', texto: 'No guardar' }, { id: 'guardar', texto: 'Guardar', clase: 'btn-primary' }
  ]);
  if (r === 'guardar') return guardar();
  return r === 'descartar';
}

async function nuevo() {
  if (!(await confirmarDescarte())) return;
  await modeler.nuevo('Proceso 1');
  Object.assign(estado, { ruta: null, nombre: 'Proceso sin título', guardadoEn: puntoPila(), sucio: false });
  vistas.clear();
  pestanas.actualizar();
  modeler.ajustarVista();
  actualizarTitulo();
  actualizarZoom();
}

async function abrir(ruta) {
  if (!(await confirmarDescarte())) return;
  const r = ruta ? await archivo.abrirRuta(ruta) : await archivo.abrirDialogo();
  if (ruta && !r) aviso('No se encontró ese archivo: puede que se haya movido o borrado.', 'alerta', 6000);
  if (r && r.error) aviso(r.error, 'error', 6000);
  else if (r && r.varios) await combinar(r.varios, r.carpeta);
  else if (r) await cargar(r.contenido, r.nombre, r.ruta);
}

// Varios archivos a la vez: un proyecto nuevo, sin guardar, con cada diagrama en su pestaña.
async function combinar(varios, carpeta) {
  try {
    const { avisos } = await modeler.abrirSinPerder(() => modeler.combinar(varios.map((a) => ({ nombre: a.nombre, xml: a.contenido }))));
    const nombre = `${carpeta || varios[0].nombre.replace(/\.(bpmn|xml|html?)$/i, '')}.bpmn`;
    Object.assign(estado, { ruta: null, nombre, guardadoEn: puntoPila(), sucio: true });
    vistas.clear();
    pestanas.actualizar();
    modeler.ajustarVista();
    actualizarTitulo();
    actualizarZoom();
    aviso(`Se juntaron ${varios.length} archivos en ${modeler.diagramas().length} pestañas. Guarda para dejarlos en un solo archivo.`, 'ok', 6000);
    if (avisos.length) aviso(avisos[0], 'alerta', 6000);
  } catch (e) {
    console.error(e);
    aviso(`No se pudieron juntar los archivos: ${e.message}`, 'error', 7000);
  }
}

async function guardar(como = false) {
  confirmarEdiciones();
  try {
    const xml = await modeler.guardarXml();
    const base = estado.nombre.replace(/\.(bpmn|xml)$/i, '');
    const r = como || !estado.ruta ? await archivo.guardarComo(xml, base) : await archivo.guardar(estado.ruta, xml, base);
    if (!r) return false;
    if (r.error) { aviso(r.error, 'error', 7000); return false; }
    Object.assign(estado, { ruta: r.ruta || estado.ruta, nombre: r.nombre || estado.nombre, guardadoEn: puntoPila(), sucio: false });
    actualizarTitulo();
    aviso('Guardado', 'ok');
    return true;
  } catch (e) {
    console.error(e);
    aviso(`No se pudo guardar: ${e.message}`, 'error', 7000);
    return false;
  }
}

// ----- título editable: clic sobre el nombre -----
const tituloEl = $('#nombre-archivo');
tituloEl.title = 'Clic para cambiar el nombre';
tituloEl.addEventListener('click', () => {
  if ($('#titulo-input')) return;
  const base = estado.nombre.replace(/\.(bpmn|xml)$/i, '');
  const input = Object.assign(document.createElement('input'), {
    id: 'titulo-input', className: 'fl-titulo-input', value: base, maxLength: 120, placeholder: 'Nombre del proceso', spellcheck: true
  });
  input.setAttribute('aria-label', 'Nombre del archivo');
  tituloEl.hidden = true;
  tituloEl.after(input);
  input.focus();
  input.select();
  let hecho = false;
  const terminar = async (aplicar) => {
    if (hecho) return;
    hecho = true;
    const nuevo = input.value.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '').replace(/[. ]+$/, '').trim();
    input.remove();
    tituloEl.hidden = false;
    if (!aplicar || !nuevo || nuevo === base) return;
    const r = await archivo.renombrar(estado.ruta, nuevo);
    if (!r || r.error) { aviso((r && r.error) || 'No se pudo cambiar el nombre.', 'error', 6000); return; }
    Object.assign(estado, { nombre: r.nombre, ruta: r.ruta || estado.ruta });
    actualizarTitulo();
    aviso(estado.ruta ? 'Archivo renombrado' : 'Nombre cambiado (se usará al guardar)', 'ok');
  };
  input.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') { e.preventDefault(); terminar(true); }
    else if (e.key === 'Escape') { e.preventDefault(); terminar(false); }
  });
  input.addEventListener('blur', () => terminar(true));
});

// ----- barra superior -----
// Nuevo: pregunta si se quiere un proyecto nuevo (otro archivo), una pestaña en este proyecto o partir de una plantilla.
// Atajos directos: Ctrl+N proyecto, Ctrl+T pestaña, Ctrl+Mayús+N plantilla.
async function elegirNuevo() {
  const r = await elegirOpcion('¿Qué quieres crear?', 'Un proyecto es otro archivo; una pestaña es otro diagrama dentro de este mismo proyecto.', [
    { valor: 'proyecto', texto: 'Proyecto nuevo' },
    { valor: 'pestana', texto: 'Pestaña nueva en este proyecto' },
    { valor: 'plantilla', texto: 'Desde una plantilla…' }
  ]);
  if (r === 'proyecto') nuevo();
  else if (r === 'pestana') pestanaNueva();
  else if (r === 'plantilla') desdePlantilla();
}
$('#btn-nuevo').addEventListener('click', elegirNuevo);

// Otro diagrama en el mismo proyecto (lo mismo que el "+" de las pestañas).
function pestanaNueva() {
  return operarDiagrama(() => modeler.agregarDiagrama());
}

// Galería de plantillas: la elegida se abre como proyecto nuevo sin guardar, o se agrega como pestaña
// del proyecto abierto (la plantilla nunca se modifica).
function desdePlantilla() {
  abrirGaleria(PLANTILLAS, async (p, destino) => {
    if (destino === 'pestana') {
      if (await operarDiagrama(() => modeler.agregarDesde(p.bpmn, p.nombre))) aviso(`Se agregó “${p.nombre}” como pestaña.`, 'ok', 4000);
      return;
    }
    if (!(await confirmarDescarte())) return;
    if (await cargar(p.bpmn, `${p.nombre}.bpmn`, null)) aviso('Plantilla lista: ajústala y guárdala con tu nombre.', 'ok', 4500);
  });
}
$('#btn-abrir').addEventListener('click', () => abrir());
$('#btn-guardar').addEventListener('click', () => guardar());
$('#btn-deshacer').addEventListener('click', () => commandStack.undo());
$('#btn-rehacer').addEventListener('click', () => commandStack.redo());
$('#btn-panel').addEventListener('click', () => {
  document.body.classList.toggle('sin-panel');
  setTimeout(() => canvas.resized(), 220);
});

const menuExportar = $('#menu-exportar');
$('#btn-exportar').addEventListener('click', (e) => { e.stopPropagation(); menuRecientes.hidden = true; menuExportar.hidden = !menuExportar.hidden; });
menuExportar.addEventListener('click', async (e) => {
  const item = e.target.closest('[data-formato]');
  if (!item || item.disabled) return;
  menuExportar.hidden = true;
  const formato = item.dataset.formato;
  modeler.terminarEdicion(); // un nombre a medio escribir también sale en la imagen, el PDF o el Word
  if (formato === 'bpmn') return guardar(true);
  // Imagen, PDF y Word son de la pestaña abierta: con varias, el archivo lleva también el nombre del diagrama.
  const pestanasArchivo = modeler.diagramas();
  const nombreArchivo = estado.nombre.replace(/\.(bpmn|xml)$/i, '');
  const nombre = pestanasArchivo.length > 1 && formato !== 'html' ? `${nombreArchivo} - ${pestanasArchivo[modeler.indiceDiagrama].nombre}` : nombreArchivo;
  const base = { nombre, rutaActual: estado.ruta };
  try {
    document.body.classList.add('ocupado');
    let r;
    if (formato === 'svg') r = await archivo.exportar({ ...base, datos: svgDelDiagrama(modeler).svg, extension: 'svg', descripcion: 'Imagen SVG', tipoMime: 'image/svg+xml' });
    else if (formato === 'png') r = await archivo.exportar({ ...base, datos: (await pngDelDiagrama(modeler, 2)).bytes, extension: 'png', descripcion: 'Imagen PNG', tipoMime: 'image/png' });
    else if (formato === 'pdf') {
      if (!archivo.esEscritorio) aviso('En la ventana de impresión, elige «Guardar como PDF» como destino.', 'ok', 7000);
      r = await archivo.exportarPdf({ ...base, html: htmlParaPdf(modeler, nombre) });
    }
    else if (formato === 'word') r = await archivo.exportar({ ...base, datos: await wordDelDiagrama(modeler, nombre), extension: 'docx', descripcion: 'Documento de Word', tipoMime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    else if (formato === 'html') r = await archivo.exportar({ ...base, datos: await htmlInteractivo(modeler, nombre), extension: 'html', descripcion: 'Página web interactiva', tipoMime: 'text/html' });
    if (r && r.error) aviso(r.error, 'alerta', 5000);
    else if (r) aviso(`Exportado: ${r.nombre}`, 'ok', 3500);
  } catch (err) {
    console.error(err);
    aviso(`No se pudo exportar: ${err.message}`, 'error', 7000);
  } finally {
    document.body.classList.remove('ocupado');
  }
});

// ----- pestañas (varios diagramas en un mismo archivo, como en Bizagi) -----
let operando = false;
async function operarDiagrama(accion, { cambia = true, olvidarVistas = false } = {}) {
  if (play.activo || operando) return false;
  operando = true;
  confirmarEdiciones();
  let ok = true;
  const habia = hayCambios();
  if (olvidarVistas) vistas.clear();
  else {
    const { x, y, width, height } = canvas.viewbox();
    vistas.set(modeler.indiceDiagrama, { x, y, width, height });
  }
  document.body.classList.add('ocupado');
  try {
    await accion();
  } catch (e) {
    console.error(e);
    ok = false;
    aviso(`No se pudo cambiar de diagrama: ${e.message}`, 'error', 7000);
  } finally {
    document.body.classList.remove('ocupado');
    operando = false;
  }
  Object.assign(estado, { sucio: habia || cambia, guardadoEn: puntoPila() });
  const vista = vistas.get(modeler.indiceDiagrama);
  if (vista) { canvas.resized(); canvas.viewbox(vista); } else modeler.ajustarVista();
  pestanas.actualizar();
  actualizarTitulo();
  actualizarZoom();
  return ok;
}

// ----- Play -----
const play = new Play(modeler, {
  bitacora: $('#bitacora'),
  barra: $('#play-barra'),
  alCambiar: (activo) => {
    for (const id of ['#btn-nuevo', '#btn-abrir', '#btn-recientes', '#btn-guardar', '#btn-deshacer', '#btn-rehacer', '#btn-exportar']) $(id).disabled = activo;
    const b = $('#btn-play');
    b.replaceChildren();
    b.insertAdjacentHTML('afterbegin', icono(activo ? 'cerrar' : 'play', 18)); // ícono fijo del código
    b.append(Object.assign(document.createElement('span'), { textContent: activo ? 'Salir del Play' : 'Play' }));
    b.classList.toggle('activo', activo);
    if (!activo) actualizarTitulo();
    actualizarAyuda();
    actualizarPista();
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }
});
window.fluyePlay = play; // acceso para pruebas desde la consola
window.fluyeExportar = { svgDelDiagrama, pngDelDiagrama, htmlParaPdf, wordDelDiagrama, htmlInteractivo };
$('#btn-play').addEventListener('click', async () => {
  if (play.activo) return play.salir();
  const r = await play.iniciar((opciones) => elegirOpcion('¿Desde qué inicio?', 'El diagrama tiene varios eventos de inicio. Elige por dónde empezar el recorrido.', opciones.map((o) => ({ valor: o.elemento, texto: o.texto }))));
  if (r.error) aviso(r.error, 'alerta', 5000);
});
// Durante el Play el diagrama no recibe clics: la rueda del mouse sigue moviendo y acercando la vista.
$('#lienzo').addEventListener('wheel', (e) => {
  if (!play.activo) return;
  e.preventDefault();
  if (e.ctrlKey) {
    const r = canvas.getContainer().getBoundingClientRect();
    canvas.zoom(Math.min(4, Math.max(0.2, canvas.zoom() * (e.deltaY < 0 ? 1.1 : 0.9))), { x: e.clientX - r.left, y: e.clientY - r.top });
  } else {
    canvas.scroll({ dx: -e.deltaX, dy: -e.deltaY });
  }
}, { passive: false });

const menuRecientes = $('#menu-recientes');
$('#btn-recientes').addEventListener('click', async (e) => {
  e.stopPropagation();
  menuExportar.hidden = true;
  const lista = await archivo.recientes();
  menuRecientes.replaceChildren();
  const vacio = archivo.esEscritorio || archivo.conAcceso ? 'Sin archivos recientes' : 'Este navegador no recuerda archivos: usa Chrome o Edge, o Fluye para Windows';
  if (!lista.length) menuRecientes.appendChild(Object.assign(document.createElement('div'), { className: 'fl-menu-vacio', textContent: vacio }));
  for (const r of lista) {
    const b = Object.assign(document.createElement('button'), { type: 'button', className: 'fl-menu-item', title: r.detalle || r.ruta });
    b.append(Object.assign(document.createElement('strong'), { textContent: r.nombre }), Object.assign(document.createElement('small'), { textContent: r.detalle || r.ruta }));
    b.addEventListener('click', () => { menuRecientes.hidden = true; abrir(r.ruta); });
    menuRecientes.appendChild(b);
  }
  menuRecientes.hidden = false;
});
document.addEventListener('click', () => { menuExportar.hidden = true; menuRecientes.hidden = true; });

// ----- zoom -----
$('#zoom-alejar').addEventListener('click', () => { canvas.zoom(Math.max(0.2, canvas.zoom() - 0.1)); actualizarZoom(); });
$('#zoom-acercar').addEventListener('click', () => { canvas.zoom(Math.min(4, canvas.zoom() + 0.1)); actualizarZoom(); });
$('#zoom-ajustar').addEventListener('click', () => { modeler.ajustarVista(); actualizarZoom(); });
$('#zoom-valor').addEventListener('click', () => { canvas.zoom(1); actualizarZoom(); });
modeler.on('canvas.viewbox.changed', actualizarZoom);

// ----- atajos -----
window.addEventListener('keydown', (e) => {
  if (!e.ctrlKey || document.body.classList.contains('en-play') || hayDialogoAbierto()) return;
  const k = e.key.toLowerCase();
  const t = document.activeElement;
  const escribiendo = t && (/INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable);
  if ((k === 'z' || k === 'y') && !escribiendo) {
    e.preventDefault();
    e.stopPropagation(); // así el teclado del lienzo no lo repite
    if (k === 'y' || e.shiftKey) commandStack.redo(); else commandStack.undo();
    return;
  }
  if (k === 's') { e.preventDefault(); guardar(e.shiftKey); }
  else if (k === 'o') { e.preventDefault(); abrir(); }
  else if (k === 'n') { e.preventDefault(); if (e.shiftKey) desdePlantilla(); else nuevo(); }
  else if (k === 't') { e.preventDefault(); pestanaNueva(); }
}, true);

// Arrastrar en un espacio vacío = seleccionar varios; espacio + arrastrar o botón del medio = desplazar.
// Dentro de un pool o carril también: arrastrar sobre su fondo selecciona; el pool se mueve tomándolo por su franja.
const lasso = modeler.get('lassoTool');
const handTool = modeler.get('handTool');
const seleccion = modeler.get('selection');
// Encerrar con el lazo un carril junto con sus pasos deja seleccionados solo los pasos: un carril no se mueve suelto
// (arrastrar o usar las flechas no haría nada) y Supr lo borraría sin querer.
modeler.on('selection.changed', ({ newSelection }) => {
  if (newSelection.length < 2 || newSelection.every(esCarril)) return;
  const sobran = newSelection.filter((e) => esCarril(e) && !newSelection.includes(e.parent));
  if (sobran.length) queueMicrotask(() => sobran.forEach((l) => seleccion.deselect(l)));
});
let pulsado = null;
const puntoDiagrama = (ev) => {
  const vb = canvas.viewbox(), r = canvas.getContainer().getBoundingClientRect();
  return { x: vb.x + (ev.clientX - r.left) / vb.scale, y: vb.y + (ev.clientY - r.top) / vb.scale };
};
modeler.on('element.mousedown', 1500, (e) => {
  const ev = e.originalEvent, el = e.element;
  if (!ev || ev.button !== 0 || handTool.isActive() || ev.ctrlKey) return;
  const raizCanvas = el === canvas.getRootElement();
  const contenedor = esPool(el) || esCarril(el);
  if (!raizCanvas && !(contenedor && puntoDiagrama(ev).x > el.x + (esPool(el) ? cabeceraDe(el) : CABECERA))) return;
  if (!ev.shiftKey) seleccion.select(null);
  pulsado = { x: ev.clientX, y: ev.clientY, el: contenedor ? el : null };
  lasso.activateLasso(ev, true);
  return false;
});
window.addEventListener('mouseup', (ev) => {
  if (!pulsado) return;
  const clic = Math.abs(ev.clientX - pulsado.x) < 4 && Math.abs(ev.clientY - pulsado.y) < 4;
  if (clic && pulsado.el) setTimeout(() => seleccion.select(pulsado.el), 0);
  setTimeout(() => { pulsado = null; }, 0);
}, true);
// Atajos de herramienta: H = mano (mover la vista), V = seleccionar.
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && (!menuExportar.hidden || !menuRecientes.hidden)) { menuExportar.hidden = true; menuRecientes.hidden = true; return; }
  if (e.ctrlKey || e.altKey || e.metaKey || document.body.classList.contains('en-play') || hayDialogoAbierto()) return;
  const t = document.activeElement;
  if (t && (/INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable)) return;
  const k = e.key.toLowerCase();
  if (k === 'h') { e.preventDefault(); herramientas.mano.poner(true); }
  else if ((k === 'v' || k === 'escape') && herramientas.mano.activa) { e.preventDefault(); herramientas.mano.poner(false); }
});

// Mover la vista arrastrando: botón del medio siempre; botón izquierdo también durante el Play (no hay nada que editar).
let paneo = null;
$('#lienzo').addEventListener('mousedown', (e) => {
  const enPlay = document.body.classList.contains('en-play') && e.button === 0 && !e.target.closest('.fl-decision, .fl-play-barra, .fl-play-insignia');
  if (e.button !== 1 && !enPlay) return;
  e.preventDefault();
  if (e.button === 1) e.stopPropagation(); // el botón del medio lo mueve solo Fluye (diagram-js también lo haría y se movería al doble)
  paneo = { x: e.clientX, y: e.clientY };
}, true);
window.addEventListener('mousemove', (e) => {
  if (!paneo) return;
  canvas.scroll({ dx: e.clientX - paneo.x, dy: e.clientY - paneo.y });
  paneo = { x: e.clientX, y: e.clientY };
});
window.addEventListener('mouseup', () => { paneo = null; });

modeler.on('commandStack.changed', actualizarTitulo);

// ----- revisión rápida en la barra de abajo: "Todo en orden" o "N por revisar" (clic = ver la lista en el panel) -----
const botonRevision = $('#estado-revision');
let revisionPendiente = false;
function actualizarRevision() {
  if (revisionPendiente) return;
  revisionPendiente = true;
  queueMicrotask(() => {
    revisionPendiente = false;
    const obs = revisarDiagrama(modeler.get('elementRegistry').getAll());
    botonRevision.hidden = false;
    botonRevision.classList.toggle('con-observaciones', obs.length > 0);
    botonRevision.replaceChildren();
    botonRevision.insertAdjacentHTML('afterbegin', icono(obs.length ? 'alerta' : 'ok', 14)); // ícono fijo del código
    botonRevision.append(Object.assign(document.createElement('span'), { textContent: obs.length ? `${obs.length} por revisar` : 'Todo en orden' }));
    botonRevision.title = obs.length ? 'Ver qué revisar en el panel derecho' : 'Cada paso tiene entrada y salida, y las decisiones su pregunta y caminos con nombre';
  });
}
botonRevision.addEventListener('click', () => {
  document.body.classList.remove('sin-panel');
  modeler.get('selection').select(null);
});
modeler.on('commandStack.changed', actualizarRevision);

// ----- pista para empezar: en un diagrama que solo tiene el inicio, una nota al lado explica cómo seguir -----
const overlays = modeler.get('overlays');
function actualizarPista() {
  overlays.remove({ type: 'fl-pista' });
  if (document.body.classList.contains('en-play')) return;
  const nodos = modeler.get('elementRegistry').filter((e) => !e.waypoints && !e.labelTarget && e.businessObject && e.businessObject.$instanceOf && e.businessObject.$instanceOf('bpmn:FlowNode'));
  if (nodos.length !== 1 || nodos[0].type !== 'bpmn:StartEvent') return;
  const nota = document.createElement('div');
  nota.className = 'fl-pista';
  nota.append(
    Object.assign(document.createElement('strong'), { textContent: 'Empieza aquí' }),
    Object.assign(document.createElement('span'), { textContent: 'Selecciona el inicio y usa el menú rápido para agregar el primer paso, o arrastra uno desde la paleta.' }),
    Object.assign(document.createElement('span'), { className: 'fl-pista-otra', textContent: '¿Prefieres partir de un ejemplo? Nuevo, Desde una plantilla.' })
  );
  overlays.add(nodos[0], 'fl-pista', { position: { top: -6, left: nodos[0].width + 16 }, html: nota, scale: { min: 0.8, max: 1 } });
}
modeler.on('commandStack.changed', () => queueMicrotask(actualizarPista));
modeler.on('fluye.abierto', () => queueMicrotask(actualizarPista));
modeler.on('fluye.abierto', actualizarRevision);

// ----- subprocesos: el detalle de un subproceso cerrado va en su propia pestaña (se crea la primera vez) -----
// Se abre desde el menú rápido de la figura o con un clic en su marcador "+".
function abrirSubproceso(el) {
  if (!el || !es(el, 'bpmn:SubProcess') || el.collapsed === false) return;
  const existe = modeler.indiceSubproceso(el.businessObject.id) >= 0;
  operarDiagrama(() => modeler.abrirSubproceso(el.businessObject.id), { cambia: !existe });
}
modeler.on('fluye.subproceso.abrir', ({ elemento }) => abrirSubproceso(elemento));
modeler.on('element.click', ({ element: el, originalEvent: ev }) => {
  if (!ev || !el || !es(el, 'bpmn:SubProcess') || el.collapsed === false) return;
  const caja = canvas.getContainer().getBoundingClientRect(), vb = canvas.viewbox();
  const x = vb.x + (ev.clientX - caja.left) / vb.scale, y = vb.y + (ev.clientY - caja.top) / vb.scale;
  const fondo = el.y + el.height;
  if (Math.abs(x - (el.x + el.width / 2)) <= 12 && fondo - y >= 0 && fondo - y <= 22) abrirSubproceso(el);
});

// ----- ayuda de la barra de abajo según lo seleccionado -----
const AYUDAS = {
  nada: 'Arrastra desde la paleta · Selecciona un elemento para agregar el siguiente · Arrastra desde un punto azul para conectar · Espacio + arrastrar para moverte',
  paso: 'Doble clic: cambiar el nombre · Menú rápido: agregar el paso siguiente · Punto azul: conectar · Supr: borrar',
  decision: 'Una decisión necesita su pregunta y dos o más caminos con nombre (Sí / No) · Doble clic: escribir la pregunta',
  paralelo: 'Un paralelo abre caminos que van al mismo tiempo, o los junta y espera a todos · No lleva pregunta · Supr: borrar',
  flecha: 'Doble clic: ponerle nombre (Sí / No) · Arrastra sus puntos para cambiar el recorrido · Supr: borrar',
  mensaje: 'Un mensaje une dos pools · Doble clic: escribir qué se envía · Supr: borrar',
  punteada: 'Une un documento o una nota con un paso · Arrastra sus puntos para cambiar el recorrido · Supr: borrar',
  carril: 'Menú rápido: agregar un carril debajo · Arrastra los bordes para cambiar el tamaño · Doble clic: cambiar el nombre',
  varios: 'Arrastra para mover todo junto · Flechas del teclado: mover de a poco · Supr: borrar la selección',
  play: 'Arrastra para mover la vista · Espacio: pausa o sigue · Flecha derecha: paso siguiente · Esc: salir del Play'
};
function actualizarAyuda() {
  const sel = modeler.get('selection').get();
  let clave = 'nada';
  if (document.body.classList.contains('en-play')) clave = 'play';
  else if (sel.length > 1) clave = 'varios';
  else if (sel.length === 1) {
    const e = sel[0];
    clave = es(e, 'bpmn:SequenceFlow') ? 'flecha' : es(e, 'bpmn:MessageFlow') ? 'mensaje' : esConexion(e) ? 'punteada'
      : es(e, 'bpmn:ParallelGateway') ? 'paralelo' : esCompuerta(e) ? 'decision' : (esPool(e) || esCarril(e)) ? 'carril' : 'paso';
  }
  $('#ayuda-estado').textContent = AYUDAS[clave];
}
modeler.on('selection.changed', actualizarAyuda);

// ----- grilla de puntos del lienzo: sigue el zoom y el desplazamiento (ayuda a alinear; la grilla de ajuste es de 10) -----
const lienzoGrilla = $('#lienzo');
function actualizarGrilla() {
  const vb = canvas.viewbox();
  let paso = 20;
  while (paso * vb.scale < 12) paso *= 2; // alejado, se ralea para no ensuciar
  const tam = paso * vb.scale;
  lienzoGrilla.style.setProperty('--grilla', `${tam}px`);
  lienzoGrilla.style.setProperty('--grilla-x', `${-vb.x * vb.scale}px`);
  lienzoGrilla.style.setProperty('--grilla-y', `${-vb.y * vb.scale}px`);
}
modeler.on('canvas.viewbox.changed', actualizarGrilla);
lienzoGrilla.classList.add('con-grilla');

// ----- versión web: respaldo en el navegador y aviso al cerrar la pestaña -----
// Lo que tiene cambios sin guardar se copia al navegador (IndexedDB) un momento después de cada cambio; al volver,
// Fluye ofrece recuperarlo. Sin cambios, el respaldo se borra. No se respalda mientras se escribe un nombre en el
// lienzo, se cambia de pestaña o corre el Play: se intenta de nuevo un poco después.
function programarRespaldo() {
  clearTimeout(relojRespaldo);
  if (!respaldoActivo) return;
  relojRespaldo = setTimeout(async () => {
    if (!hayCambios()) { archivo.borrarRespaldo(); return; }
    const edicion = modeler.get('directEditing', false);
    if (operando || play.activo || (edicion && edicion.isActive())) { programarRespaldo(); return; }
    try {
      await archivo.respaldar({ xml: await modeler.guardarXml(), nombre: estado.nombre, ruta: estado.ruta });
    } catch (e) {
      console.warn('No se pudo respaldar en el navegador:', e);
    }
  }, 1500);
}

async function ofrecerRespaldo() {
  const r = await archivo.leerRespaldo();
  if (!r || !r.xml) return false;
  const cuando = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(r.fecha);
  const eleccion = await preguntar('Trabajo sin guardar', `“${r.nombre.replace(/\.(bpmn|xml)$/i, '')}” tenía cambios sin guardar (${cuando}). Fluye los guardó en este navegador. ¿Quieres recuperarlos?`, [
    { id: 'descartar', texto: 'Descartar' }, { id: 'recuperar', texto: 'Recuperar', clase: 'btn-primary' }
  ]);
  if (eleccion !== 'recuperar' || !(await cargar(r.xml, r.nombre, r.ruta || null))) { await archivo.borrarRespaldo(); return false; }
  estado.sucio = true;
  actualizarTitulo();
  aviso('Recuperado. Guarda para dejarlo en un archivo.', 'ok', 5000);
  return true;
}

// En una pantalla angosta (celular) el lienzo va primero: el panel parte cerrado y se avisa una vez que dibujar es más
// cómodo en un computador o una tablet. Ver y recorrer procesos con el Play funciona igual.
const angosta = window.matchMedia('(max-width: 760px)').matches;
if (angosta) document.body.classList.add('sin-panel');

if (!archivo.esEscritorio) {
  window.addEventListener('beforeunload', (e) => {
    confirmarEdiciones();
    if (hayCambios()) { e.preventDefault(); e.returnValue = ''; }
  });
  // Instalable y sin internet: el service worker guarda la app en el navegador (no aplica a la app de escritorio ni a
  // la página abierta como archivo).
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    // Cuando se publica una versión nueva, el service worker la toma y pasa a controlar la página: sin cambios sin
    // guardar se recarga sola; con cambios, se avisa para guardar primero (la primera instalación no recarga).
    const habia = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!habia) return;
      if (hayCambios()) aviso('Hay una versión nueva de Fluye. Guarda tu trabajo y recarga la página para usarla.', 'ok', 10000);
      else location.reload();
    });
    navigator.serviceWorker.register('sw.js').catch((e) => console.warn('Sin modo sin internet:', e));
  }
}

// Pedidos de la ventana de escritorio (cerrar con cambios, abrir por doble clic en un .bpmn).
let preguntandoCierre = false;
archivo.alPedir(async (accion, dato) => {
  if (accion === 'confirmar-cierre') {
    if (preguntandoCierre) return;
    if (play.activo) play.salir();
    confirmarEdiciones();
    if (!hayCambios()) { archivo.cerrarVentana(); return; }
    preguntandoCierre = true;
    const r = await preguntar('Hay cambios sin guardar', `¿Quieres guardar "${estado.nombre.replace(/\.(bpmn|xml)$/i, '')}" antes de cerrar?`, [
      { id: 'cancelar', texto: 'Cancelar' }, { id: 'descartar', texto: 'No guardar' }, { id: 'guardar', texto: 'Guardar', clase: 'btn-primary' }
    ]);
    preguntandoCierre = false;
    if (r === 'descartar' || (r === 'guardar' && await guardar())) archivo.cerrarVentana();
  }
  if (accion === 'abrir-ruta') {
    if (hayDialogoAbierto()) { aviso('Termina lo que tienes abierto y vuelve a abrir el archivo.', 'alerta', 5000); return; }
    if (play.activo) play.salir();
    abrir(dato);
  }
  if (accion === 'menu-ortografia') mostrarMenuOrtografia(dato);
});

window.addEventListener('resize', () => canvas.resized());

crearPaleta($('#paleta'), modeler);
const pestanas = crearPestanas($('#pestanas'), {
  lista: () => modeler.diagramas(),
  actual: () => modeler.indiceDiagrama,
  ir: (i) => operarDiagrama(() => modeler.irADiagrama(i), { cambia: false }),
  agregar: pestanaNueva,
  renombrar: (i, nombre) => {
    modeler.renombrarDiagrama(i, nombre);
    estado.sucio = true;
    pestanas.actualizar();
    actualizarTitulo();
  },
  borrar: async (i, nombre) => {
    if (hayDialogoAbierto()) return;
    const id = modeler.definiciones.diagrams[i] && modeler.definiciones.diagrams[i].id;
    const r = await preguntar('Borrar diagrama', `¿Borrar “${nombre}” con todo lo que tiene dibujado? No se puede deshacer.`, [
      { id: 'cancelar', texto: 'Cancelar' }, { id: 'borrar', texto: 'Borrar', clase: 'btn-danger' }
    ]);
    const indice = modeler.definiciones.diagrams.findIndex((d) => d.id === id);
    if (r === 'borrar' && indice >= 0) operarDiagrama(() => modeler.borrarDiagrama(indice), { olvidarVistas: true });
  }
});
const herramientas = crearHerramientas($('#herramientas'), modeler);
crearPropiedades($('#propiedades'), modeler, { alPlay: () => $('#btn-play').click() });

const primero = await archivo.inicial();
// En la versión web, ?plantilla=<id> abre esa plantilla de la galería.
const parametros = new URLSearchParams(location.search);
const pedida = !window.fluyeEscritorio && PLANTILLAS.find((p) => p.id === parametros.get('plantilla'));
// ?archivo=<.bpmn del mismo sitio> abre ese archivo (lo usan las páginas en inglés, cuyas plantillas no vienen en la app).
// Solo se aceptan archivos .bpmn del mismo sitio: la dirección se resuelve primero y se revisa su origen y su ruta.
const archivoPedido = !window.fluyeEscritorio && !pedida && parametros.get('archivo');
const urlPedida = archivoPedido ? (() => { try { return new URL(archivoPedido, location.href); } catch { return null; } })() : null;
const xmlPedido = urlPedida && urlPedida.origin === location.origin && /^\/[\w./-]+\.bpmn$/.test(urlPedida.pathname)
  ? await fetch(urlPedida, { credentials: 'same-origin', redirect: 'error' }).then((r) => (r.ok ? r.text() : null)).catch(() => null)
  : null;
// Primero un proyecto vacío, para que la pregunta de recuperar (versión web) aparezca sobre la app ya armada.
async function partirVacio() {
  await modeler.nuevo('Proceso 1');
  estado.guardadoEn = puntoPila();
  pestanas.actualizar();
  actualizarTitulo();
}
const avisoPlantilla = 'Plantilla lista: ajústala, pulsa Play y guárdala con tu nombre.';
if (primero && await cargar(primero.contenido, primero.nombre, primero.ruta)) {
  // Abierto desde el explorador de archivos (escritorio o web instalada).
} else {
  // Lo que no se alcanzó a guardar en la web se ofrece antes de abrir otra cosa (si no, el respaldo se perdería).
  const respaldoPendiente = !archivo.esEscritorio && !!(await archivo.leerRespaldo());
  if (respaldoPendiente || !(pedida || xmlPedido)) await partirVacio();
  document.body.classList.add('listo');
  if (!(respaldoPendiente && await ofrecerRespaldo())) {
    if (pedida && await cargar(pedida.bpmn, `${pedida.nombre}.bpmn`, null)) aviso(avisoPlantilla, 'ok', 5000);
    else if (xmlPedido && await cargar(xmlPedido, archivoPedido.split('/').pop(), null)) aviso(avisoPlantilla, 'ok', 5000);
    else if (!modeler.definiciones) await partirVacio();
  }
}
document.body.classList.add('listo');
respaldoActivo = true;
if (angosta) {
  let visto = false;
  try { visto = localStorage.getItem('fluye.aviso-celular') === '1'; localStorage.setItem('fluye.aviso-celular', '1'); } catch { /* sin almacenamiento: se avisa igual */ }
  if (!visto) aviso('En el celular puedes ver y recorrer procesos con el Play. Para dibujar con comodidad, usa un computador o una tablet.', 'ok', 8000);
}
if (!archivo.esEscritorio) programarRespaldo();
requestAnimationFrame(() => { modeler.ajustarVista(); actualizarZoom(); });
