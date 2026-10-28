// Abrir y guardar. En la app de escritorio usa el sistema de archivos (por el puente de Electron). En la versión web:
// - Chrome y Edge (File System Access): abre y guarda sobre el mismo archivo y recuerda los recientes; la "ruta" es
//   la clave del archivo en el navegador ("web:<n>", ver almacen.js);
// - los demás navegadores: abrir sube el archivo y guardar lo descarga.
import { decodificarXml, normalizarDeclaracion } from '../modeler/io/codificacion.js';
import { datosDeHtml } from '../exportar/paquete.js';
import * as almacen from './almacen.js';

const escritorio = window.fluyeEscritorio || null;

export const esEscritorio = !!escritorio;
// Guardar sobre el mismo archivo y recientes en el navegador (Chrome y Edge).
export const conAcceso = !escritorio && typeof window.showOpenFilePicker === 'function';

const TIPO_BPMN = { description: 'Proceso BPMN', accept: { 'application/xml': ['.bpmn', '.xml'] } };
const MAX_RECIENTES = 10;

function conTexto(r) {
  if (!r || !r.bytes) return r;
  if (!/\.html?$/i.test(r.nombre)) return { ruta: r.ruta, nombre: r.nombre, contenido: decodificarXml(r.bytes) };
  // Página web exportada por Fluye: se abre el proceso que trae adentro como uno sin guardar,
  // para que "Guardar" pida dónde dejar el .bpmn y no escriba encima de la página.
  const datos = datosDeHtml(new TextDecoder('utf-8').decode(r.bytes));
  if (!datos) return { error: 'Esta página no fue exportada por Fluye: no trae un proceso para abrir.' };
  return { ruta: null, nombre: r.nombre.replace(/\.html?$/i, '.bpmn'), contenido: normalizarDeclaracion(datos.bpmn) };
}

// Varios archivos elegidos a la vez: { varios: [{ nombre, contenido }], carpeta } (o { error }).
function variosConTexto(r) {
  const varios = [];
  for (const a of r.varios) {
    const t = conTexto(a);
    if (t.error) return { error: `${a.nombre}: ${t.error}` };
    varios.push({ nombre: a.nombre, contenido: t.contenido });
  }
  return { varios, carpeta: r.carpeta || null };
}

// ----- versión web: archivos del navegador -----
const cancelado = (e) => e && e.name === 'AbortError';

async function leerArchivo(handle) {
  const f = await handle.getFile();
  return { nombre: f.name, bytes: new Uint8Array(await f.arrayBuffer()) };
}

async function escribir(handle, datos) {
  const w = await handle.createWritable();
  try {
    await w.write(datos);
    await w.close();
  } catch (e) {
    await w.abort().catch(() => {});
    throw e;
  }
}

// Pide permiso para leer o escribir (el navegador lo pregunta una vez por archivo y sesión).
async function permiso(handle, escribirTambien) {
  const modo = { mode: escribirTambien ? 'readwrite' : 'read' };
  if ((await handle.queryPermission(modo)) === 'granted') return true;
  return (await handle.requestPermission(modo)) === 'granted';
}

// Guarda el archivo entre los recientes (el mismo archivo no se repite) y devuelve su "ruta".
async function registrar(handle) {
  const lista = await almacen.archivos.todos();
  let igual = null;
  for (const r of lista) if (await r.handle.isSameEntry(handle).catch(() => false)) { igual = r; break; }
  const registro = { ...(igual || {}), handle, nombre: handle.name, fecha: Date.now() };
  const id = await almacen.archivos.poner(registro);
  // Solo los últimos MAX_RECIENTES.
  const viejos = (await almacen.archivos.todos()).sort((a, b) => b.fecha - a.fecha).slice(MAX_RECIENTES);
  for (const v of viejos) await almacen.archivos.borrar(v.id);
  return `web:${igual ? igual.id : id}`;
}

async function handleDe(ruta) {
  const id = Number(String(ruta || '').replace(/^web:/, ''));
  if (!id) return null;
  const r = await almacen.archivos.leer(id).catch(() => null);
  return r ? r.handle : null;
}

function descargar(datos, nombreArchivo, tipo) {
  const blob = new Blob([datos], { type: tipo });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: nombreArchivo });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  return { ruta: null, nombre: a.download };
}

// ----- lo que usa la app -----
export async function abrirDialogo() {
  if (escritorio) {
    const r = await escritorio.abrir();
    return r && r.varios ? variosConTexto(r) : conTexto(r);
  }
  if (conAcceso) {
    let handles;
    try {
      handles = await window.showOpenFilePicker({
        multiple: true,
        types: [{ description: 'Procesos BPMN o páginas de Fluye', accept: { 'application/xml': ['.bpmn', '.xml'], 'text/html': ['.html', '.htm'] } }]
      });
    } catch (e) {
      if (cancelado(e)) return null;
      throw e;
    }
    const leidos = await Promise.all(handles.map(async (h) => ({
      ...(await leerArchivo(h)),
      // Un solo .bpmn queda "abierto": Guardar escribe sobre él. Una página exportada o varios juntos se abren sin guardar.
      ruta: handles.length === 1 && !/\.html?$/i.test(h.name) ? await registrar(h) : null
    })));
    return leidos.length === 1 ? conTexto(leidos[0]) : variosConTexto({ varios: leidos });
  }
  return new Promise((resolver) => {
    const input = Object.assign(document.createElement('input'), { type: 'file', accept: '.bpmn,.xml,.html,.htm', multiple: true });
    input.addEventListener('change', async () => {
      const archivos = [...(input.files || [])];
      const leidos = await Promise.all(archivos.map(async (f) => ({ ruta: null, nombre: f.name, bytes: new Uint8Array(await f.arrayBuffer()) })));
      if (!leidos.length) resolver(null);
      else if (leidos.length === 1) resolver(conTexto(leidos[0]));
      else resolver(variosConTexto({ varios: leidos }));
    });
    input.click();
  });
}

export async function abrirRuta(ruta) {
  if (escritorio) return conTexto(await escritorio.abrirRuta(ruta));
  const handle = await handleDe(ruta);
  if (!handle) return null;
  try {
    if (!(await permiso(handle, false))) return { error: 'Sin permiso para abrir ese archivo: vuelve a elegirlo con Abrir.' };
    const leido = await leerArchivo(handle);
    await registrar(handle);
    return conTexto({ ...leido, ruta });
  } catch (e) {
    if (e && e.name === 'NotFoundError') return null;
    throw e;
  }
}

export async function guardar(ruta, contenido, nombre) {
  if (escritorio) return escritorio.guardar(ruta, contenido, nombre);
  const handle = conAcceso ? await handleDe(ruta) : null;
  if (!handle) return conAcceso ? guardarComo(contenido, nombre) : descargar(contenido, `${nombre || 'Proceso'}.bpmn`, 'application/xml');
  if (!(await permiso(handle, true))) return { error: 'El navegador no dio permiso para escribir en el archivo. Usa Exportar → BPMN para guardarlo en otro lugar.' };
  await escribir(handle, contenido);
  await registrar(handle);
  return { ruta, nombre: handle.name };
}

export async function guardarComo(contenido, nombre) {
  if (escritorio) return escritorio.guardarComo(contenido, nombre);
  if (!conAcceso) return descargar(contenido, `${nombre || 'Proceso'}.bpmn`, 'application/xml');
  let handle;
  try {
    handle = await window.showSaveFilePicker({ suggestedName: `${nombre || 'Proceso'}.bpmn`, types: [TIPO_BPMN] });
  } catch (e) {
    if (cancelado(e)) return null;
    throw e;
  }
  await escribir(handle, contenido);
  return { ruta: await registrar(handle), nombre: handle.name };
}

// Exportar un archivo (bytes o texto). En el navegador: se elige dónde dejarlo o, si no se puede, se descarga.
export async function exportar({ datos, nombre, extension, descripcion, rutaActual, tipoMime }) {
  if (escritorio) return escritorio.exportar({ datos, nombre, extension, descripcion, rutaActual });
  const nombreArchivo = `${nombre || 'Proceso'}.${extension}`;
  const tipo = tipoMime || 'application/octet-stream';
  if (!conAcceso) return descargar(datos, nombreArchivo, tipo);
  let handle;
  try {
    handle = await window.showSaveFilePicker({ suggestedName: nombreArchivo, types: [{ description: descripcion, accept: { [tipo]: [`.${extension}`] } }] });
  } catch (e) {
    if (cancelado(e)) return null;
    throw e;
  }
  await escribir(handle, datos);
  return { ruta: null, nombre: handle.name };
}

// PDF: el escritorio lo genera directo. En el navegador se abre la ventana de impresión con la hoja ya armada
// (A4, el mismo diseño) y se elige "Guardar como PDF"; así el diagrama queda vectorial. Devuelve null: el navegador
// no avisa si se guardó o se canceló.
export async function exportarPdf({ html, nombre, rutaActual }) {
  if (escritorio) return escritorio.exportarPdf({ html, nombre, rutaActual });
  await new Promise((resolver) => {
    const marco = Object.assign(document.createElement('iframe'), { title: `${nombre || 'Proceso'}.pdf`, srcdoc: html });
    marco.setAttribute('aria-hidden', 'true');
    marco.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
    marco.addEventListener('load', () => {
      const ventana = marco.contentWindow;
      // Las fuentes van incrustadas: se espera que estén listas para que no salgan con otra letra.
      ventana.document.fonts.ready.then(() => {
        ventana.focus();
        ventana.print();
        setTimeout(() => { marco.remove(); resolver(); }, 500);
      });
    }, { once: true });
    document.body.appendChild(marco);
  });
  return null;
}

// Renombra el archivo ya guardado. En el navegador se intenta renombrar el archivo (Chrome y Edge recientes); si no se
// puede, solo cambia el nombre y el próximo Guardar pregunta dónde dejarlo.
export async function renombrar(ruta, nombre) {
  if (escritorio && ruta) return escritorio.renombrar(ruta, nombre);
  const handle = conAcceso ? await handleDe(ruta) : null;
  if (handle && typeof handle.move === 'function') {
    try {
      if (await permiso(handle, true)) {
        await handle.move(`${nombre}.bpmn`);
        await registrar(handle);
        return { ruta, nombre: handle.name };
      }
    } catch (e) {
      console.warn('No se pudo renombrar el archivo en el navegador:', e);
    }
  }
  return { ruta: null, nombre: `${nombre}.bpmn` };
}

// Archivo con que parte la app: el de la línea de comandos en el escritorio; en la web instalada, el .bpmn con que
// se abrió Fluye desde el explorador de archivos (launchQueue, ver file_handlers del manifest).
export async function inicial() {
  if (escritorio) return conTexto(await escritorio.inicial());
  if (!('launchQueue' in window)) return null;
  const handle = await new Promise((resolver) => {
    window.launchQueue.setConsumer((p) => resolver((p.files && p.files[0]) || null));
    setTimeout(() => resolver(null), 300);
  });
  if (!handle) return null;
  return conTexto({ ...(await leerArchivo(handle)), ruta: await registrar(handle) });
}

export async function recientes() {
  if (escritorio) return escritorio.recientes();
  if (!conAcceso) return [];
  const fecha = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  return (await almacen.archivos.todos().catch(() => []))
    .sort((a, b) => b.fecha - a.fecha)
    .map((r) => ({ nombre: r.nombre, ruta: `web:${r.id}`, detalle: `Usado el ${fecha.format(r.fecha)}` }));
}

// ----- respaldo automático de la versión web (lo que no se alcanzó a guardar) -----
export const respaldar = (datos) => almacen.respaldo.poner({ ...datos, fecha: Date.now() });
export const leerRespaldo = () => almacen.respaldo.leer().catch(() => null);
export const borrarRespaldo = () => almacen.respaldo.borrar().catch(() => {});

export function marcarCambios(hay, titulo) {
  document.title = titulo;
  if (escritorio) escritorio.marcarCambios(hay, titulo);
}

export function cerrarVentana() {
  if (escritorio) escritorio.cerrar();
}

export function alPedir(fn) {
  if (escritorio) escritorio.alPedir(fn);
}
