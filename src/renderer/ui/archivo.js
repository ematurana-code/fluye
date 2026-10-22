// Abrir y guardar: en la app de escritorio usa el sistema de archivos; en el navegador (pruebas) usa descarga/subida.
import { decodificarXml, normalizarDeclaracion } from '../modeler/io/codificacion.js';
import { datosDeHtml } from '../exportar/paquete.js';

const escritorio = window.fluyeEscritorio || null;

export const esEscritorio = !!escritorio;

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

export async function abrirDialogo() {
  if (escritorio) {
    const r = await escritorio.abrir();
    return r && r.varios ? variosConTexto(r) : conTexto(r);
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
  return escritorio ? conTexto(await escritorio.abrirRuta(ruta)) : null;
}

export async function guardar(ruta, contenido, nombre) {
  if (escritorio) return escritorio.guardar(ruta, contenido, nombre);
  const blob = new Blob([contenido], { type: 'application/xml' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `${nombre || 'Proceso'}.bpmn` });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  return { ruta: null, nombre: a.download };
}

export async function guardarComo(contenido, nombre) {
  return escritorio ? escritorio.guardarComo(contenido, nombre) : guardar(null, contenido, nombre);
}

// Exportar un archivo (bytes o texto). En el navegador (pruebas) se descarga.
export async function exportar({ datos, nombre, extension, descripcion, rutaActual, tipoMime }) {
  if (escritorio) return escritorio.exportar({ datos, nombre, extension, descripcion, rutaActual });
  const blob = new Blob([datos], { type: tipoMime || 'application/octet-stream' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `${nombre || 'Proceso'}.${extension}` });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  return { ruta: null, nombre: a.download };
}

export async function exportarPdf({ html, nombre, rutaActual }) {
  if (escritorio) return escritorio.exportarPdf({ html, nombre, rutaActual });
  return { error: 'El PDF se genera en la app de escritorio.' };
}

// Renombra el archivo ya guardado. En el navegador (pruebas) no hay archivo en disco: solo cambia el nombre.
export async function renombrar(ruta, nombre) {
  if (escritorio && ruta) return escritorio.renombrar(ruta, nombre);
  return { ruta, nombre: `${nombre}.bpmn` };
}

export async function inicial() {
  return escritorio ? conTexto(await escritorio.inicial()) : null;
}

export async function recientes() {
  return escritorio ? escritorio.recientes() : [];
}

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
