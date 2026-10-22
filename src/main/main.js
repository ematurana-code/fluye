// Proceso principal de Fluye: ventana, archivos y avisos al cerrar.
import { app, BrowserWindow, dialog, ipcMain, Menu, session, shell } from 'electron';
import { readFile, writeFile, mkdir, rename, stat, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
// Solo pruebas automáticas: datos y caché en una carpeta temporal en vez de AppData.
if (process.env.FLUYE_DATOS) app.setPath('userData', process.env.FLUYE_DATOS);
// Identidad propia en Windows: la barra de tareas muestra el ícono de Fluye y no lo agrupa con Electron.
app.setAppUserModelId('io.github.ematurana-code.fluye'); // igual que build.appId de package.json
const ICONO = join(aqui, '..', '..', 'build', process.platform === 'win32' ? 'icono.ico' : 'icono.png');
const FILTROS = [{ name: 'Procesos BPMN', extensions: ['bpmn', 'xml'] }];
// Al abrir también se acepta la página web interactiva que exporta Fluye (trae el .bpmn adentro).
const FILTROS_ABRIR = [{ name: 'Procesos (BPMN o página web de Fluye)', extensions: ['bpmn', 'xml', 'html', 'htm'] }];
const MAX_RECIENTES = 8;
// Corrector ortográfico: diccionario español que trae Fluye (de hunspell_dictionaries.zip de Electron; licencias al lado).
const DICCIONARIOS = join(aqui, '..', '..', 'recursos', 'diccionarios');
const DICCIONARIO = 'es-ES-3-0.bdic';

let ventana = null;
let cerrarYa = false;
// Archivos .bpmn que Fluye abrió, guardó o renombró en esta sesión: son los únicos que la interfaz puede
// sobrescribir o renombrar sin pasar por el cuadro de Windows.
const conocidos = new Set();
const clave = (ruta) => ruta.toLowerCase();
const esProceso = (ruta) => typeof ruta === 'string' && /\.(bpmn|xml)$/i.test(ruta);
const esConocido = (ruta) => esProceso(ruta) && conocidos.has(clave(ruta));
// Nombre de archivo que Windows acepta (el del proceso puede traer ":" o "/", como "Despacho: cliente y Aduana").
const nombreArchivo = (nombre) => String(nombre || '').replace(/[<>:"/\\|?*\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').replace(/[. ]+$/, '').trim() || 'Proceso';

// Guardar sin riesgo: se escribe al lado y recién después se reemplaza el archivo (si el disco se llena o el pendrive
// se desconecta a mitad de camino, el archivo bueno no se pierde).
async function escribirSeguro(destino, datos, codificacion) {
  const temporal = `${destino}.${process.pid}.tmp`;
  try {
    await writeFile(temporal, datos, codificacion);
    await rename(temporal, destino);
  } catch (e) {
    await unlink(temporal).catch(() => {});
    throw e;
  }
}
let archivoInicial = buscarArchivo(process.argv);

function buscarArchivo(args) {
  return args.slice(1).find((a) => /\.(bpmn|xml)$/i.test(a) && existsSync(a)) || null;
}

const rutaRecientes = () => join(app.getPath('userData'), 'recientes.json');

async function leerRecientesCrudo() {
  try {
    const lista = JSON.parse(await readFile(rutaRecientes(), 'utf8'));
    return Array.isArray(lista) ? lista.filter((r) => typeof r === 'string') : [];
  } catch {
    return [];
  }
}

async function leerRecientes() {
  return (await leerRecientesCrudo()).filter((r) => existsSync(r));
}

async function agregarReciente(ruta) {
  const lista = [ruta, ...(await leerRecientes()).filter((r) => r.toLowerCase() !== ruta.toLowerCase())].slice(0, MAX_RECIENTES);
  await mkdir(app.getPath('userData'), { recursive: true });
  await writeFile(rutaRecientes(), JSON.stringify(lista, null, 1), 'utf8');
}

// Se envían los bytes: la interfaz decodifica según la codificación que declare el XML (UTF-8 o ISO-8859-1).
async function leerArchivo(ruta) {
  const bytes = new Uint8Array(await readFile(ruta));
  if (esProceso(ruta)) { // la página web se abre como copia sin guardar
    await agregarReciente(ruta);
    conocidos.add(clave(ruta));
  }
  return { ruta, nombre: basename(ruta), bytes };
}

// Corrector en español sin internet: Chromium busca el diccionario en <datos>/Dictionaries antes de descargarlo,
// así que se deja ahí la copia de Fluye; la dirección de descarga apunta a la misma carpeta (nunca a internet).
async function prepararOrtografia() {
  const destino = join(app.getPath('userData'), 'Dictionaries');
  try {
    const original = await stat(join(DICCIONARIOS, DICCIONARIO));
    const copia = await stat(join(destino, DICCIONARIO)).catch(() => null);
    if (!copia || copia.size !== original.size) {
      await mkdir(destino, { recursive: true });
      await writeFile(join(destino, DICCIONARIO), await readFile(join(DICCIONARIOS, DICCIONARIO)));
    }
  } catch (e) {
    console.error('No se pudo preparar el diccionario:', e.message);
  }
  const sesion = session.defaultSession;
  sesion.setSpellCheckerDictionaryDownloadURL(pathToFileURL(DICCIONARIOS).href + '/');
  sesion.setSpellCheckerLanguages(['es-ES']);
  sesion.setSpellCheckerEnabled(true);
}

function crearVentana() {
  ventana = new BrowserWindow({
    width: 1440, height: 900, minWidth: 960, minHeight: 600,
    title: 'Fluye', backgroundColor: '#f1f5f9', show: false,
    icon: ICONO,
    webPreferences: { preload: join(aqui, 'preload.cjs'), contextIsolation: true, sandbox: true, nodeIntegration: false, spellcheck: true }
  });
  Menu.setApplicationMenu(null);
  ventana.loadFile(join(aqui, '..', '..', 'dist', 'renderer', 'index.html'));
  // FLUYE_OCULTO=1 solo para pruebas automáticas: la ventana se abre fuera de la pantalla y sin tomar el foco.
  ventana.once('ready-to-show', () => {
    if (process.env.FLUYE_OCULTO === '1') {
      ventana.setBounds({ x: -5000, y: 0, width: 1440, height: 900 });
      ventana.showInactive();
    } else {
      ventana.maximize();
      ventana.show();
    }
  });

  ventana.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\//.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  ventana.webContents.on('will-navigate', (e) => e.preventDefault());
  // Clic derecho sobre una palabra mal escrita: la interfaz muestra las sugerencias con el estilo de Fluye.
  ventana.webContents.on('context-menu', (_e, p) => {
    if (!p.isEditable || !p.misspelledWord) return;
    ventana.webContents.send('pedido', 'menu-ortografia', { x: p.x, y: p.y, palabra: p.misspelledWord, sugerencias: p.dictionarySuggestions.slice(0, 6) });
  });
  ventana.webContents.on('before-input-event', (e, input) => {
    if (input.type === 'keyDown' && input.key === 'F12' && !app.isPackaged) ventana.webContents.toggleDevTools();
  });

  // Al cerrar siempre se consulta a la interfaz: confirma lo que se esté escribiendo y, si hay cambios sin guardar,
  // pregunta con el estilo de Fluye (no un cuadro de Windows). Si la interfaz se cayó, se cierra sin preguntar.
  ventana.on('close', (e) => {
    if (cerrarYa || ventana.webContents.isCrashed()) return;
    e.preventDefault();
    ventana.webContents.send('pedido', 'confirmar-cierre');
  });
}

// Se pueden elegir varios archivos: la interfaz los junta en un proyecto, cada diagrama en su pestaña.
ipcMain.handle('archivo:abrir', async () => {
  const r = await dialog.showOpenDialog(ventana, { title: 'Abrir proceso (puedes elegir varios)', filters: FILTROS_ABRIR, properties: ['openFile', 'multiSelections'] });
  if (r.canceled || !r.filePaths[0]) return null;
  if (r.filePaths.length === 1) return leerArchivo(r.filePaths[0]);
  const carpetas = new Set(r.filePaths.map((p) => dirname(p)));
  const varios = [];
  for (const ruta of r.filePaths) varios.push({ ruta, nombre: basename(ruta), bytes: new Uint8Array(await readFile(ruta)) });
  return { varios, carpeta: carpetas.size === 1 ? basename([...carpetas][0]) : null };
});

ipcMain.handle('archivo:abrirRuta', async (_e, ruta) => {
  if (typeof ruta !== 'string' || !/\.(bpmn|xml)$/i.test(ruta) || !existsSync(ruta)) return null;
  return leerArchivo(ruta);
});

ipcMain.handle('archivo:guardar', async (_e, { ruta, contenido, nombre } = {}) => {
  if (typeof contenido !== 'string') return { error: 'No hay nada que guardar.' };
  let destino = esConocido(ruta) ? ruta : null; // cualquier otra ruta pasa por el cuadro "Guardar como"
  if (!destino) {
    const r = await dialog.showSaveDialog(ventana, {
      title: 'Guardar proceso', filters: FILTROS,
      defaultPath: join(app.getPath('documents'), nombreArchivo(nombre) + '.bpmn')
    });
    if (r.canceled || !r.filePath) return null;
    destino = r.filePath;
  }
  try {
    await escribirSeguro(destino, contenido, 'utf8');
  } catch (e) {
    return { error: `No se pudo guardar en "${basename(destino)}": ${e.code === 'EBUSY' || e.code === 'EPERM' ? 'otro programa lo tiene abierto o la carpeta está protegida' : e.message}.` };
  }
  conocidos.add(clave(destino));
  await agregarReciente(destino);
  return { ruta: destino, nombre: basename(destino) };
});

// Exportar: pide dónde guardar (por defecto, la carpeta del proceso) y escribe los bytes o el texto.
async function guardarExportado({ datos, nombre, extension, descripcion, rutaActual }) {
  const carpeta = rutaActual && existsSync(rutaActual) ? dirname(rutaActual) : app.getPath('documents');
  const r = await dialog.showSaveDialog(ventana, {
    title: `Exportar como ${descripcion}`,
    defaultPath: join(carpeta, `${nombreArchivo(nombre)}.${extension}`),
    filters: [{ name: descripcion, extensions: [extension] }]
  });
  if (r.canceled || !r.filePath) return null;
  try {
    await escribirSeguro(r.filePath, typeof datos === 'string' ? datos : Buffer.from(datos));
  } catch (e) {
    return { error: `No se pudo exportar "${basename(r.filePath)}": ${e.code === 'EBUSY' || e.code === 'EPERM' ? 'otro programa lo tiene abierto' : e.message}.` };
  }
  return { ruta: r.filePath, nombre: basename(r.filePath) };
}

ipcMain.handle('archivo:exportar', (_e, pedido) => guardarExportado(pedido));

// PDF: se imprime la página que arma la interfaz en una ventana oculta y sin JavaScript.
ipcMain.handle('archivo:exportarPdf', async (_e, { html, nombre, rutaActual }) => {
  const oculta = new BrowserWindow({ show: false, webPreferences: { javascript: false, sandbox: true, contextIsolation: true } });
  try {
    await oculta.loadURL(`data:text/html;charset=utf-8;base64,${Buffer.from(html, 'utf8').toString('base64')}`);
    const pdf = await oculta.webContents.printToPDF({ printBackground: true, preferCSSPageSize: true });
    return guardarExportado({ datos: pdf, nombre, extension: 'pdf', descripcion: 'PDF', rutaActual });
  } finally {
    oculta.destroy();
  }
});

// Cambiar el nombre del archivo (desde el título de la barra). No pisa otro archivo existente.
ipcMain.handle('archivo:renombrar', async (_e, { ruta, nombre } = {}) => {
  if (!esConocido(ruta) || !existsSync(ruta)) return { error: 'No se encontró el archivo original.' };
  const limpio = String(nombre || '').replace(/[<>:"/\\|?*\u0000-\u001f]/g, '').replace(/[. ]+$/, '').trim();
  if (!limpio) return { error: 'El nombre no es válido.' };
  const destino = join(dirname(ruta), limpio + extname(ruta));
  try {
    if (destino.toLowerCase() === ruta.toLowerCase()) {
      if (destino !== ruta) await rename(ruta, destino);
    } else {
      if (existsSync(destino)) return { error: `Ya existe un archivo llamado "${basename(destino)}" en esa carpeta.` };
      await rename(ruta, destino);
    }
  } catch (e) {
    return { error: e.code === 'EBUSY' || e.code === 'EPERM' ? 'Windows no dejó cambiar el nombre: puede que otro programa tenga abierto el archivo.' : `No se pudo cambiar el nombre: ${e.message}` };
  }
  conocidos.delete(clave(ruta));
  conocidos.add(clave(destino));
  const lista = (await leerRecientesCrudo()).map((r) => (r.toLowerCase() === ruta.toLowerCase() ? destino : r)).filter((r) => existsSync(r));
  await mkdir(app.getPath('userData'), { recursive: true });
  await writeFile(rutaRecientes(), JSON.stringify(lista, null, 1), 'utf8').catch(() => {});
  return { ruta: destino, nombre: basename(destino) };
});

ipcMain.handle('archivo:inicial', async () => {
  if (!archivoInicial) return null;
  const ruta = archivoInicial;
  archivoInicial = null;
  return leerArchivo(ruta);
});

ipcMain.handle('recientes:lista', async () => (await leerRecientes()).map((ruta) => ({ ruta, nombre: basename(ruta) })));

ipcMain.on('estado:cambios', (_e, datos) => {
  const titulo = datos && datos.titulo;
  if (ventana && typeof titulo === 'string' && titulo.length <= 300) ventana.setTitle(titulo);
});

// Solo en pruebas automáticas: cerrar la ventana como si se hiciera clic en la X.
ipcMain.on('prueba:cerrar', () => {
  if (process.env.FLUYE_OCULTO === '1') ventana?.close();
});

// Corrector: reemplazar la palabra marcada por la sugerencia elegida, o aceptarla para siempre.
const palabraValida = (t) => typeof t === 'string' && t.length > 0 && t.length <= 100;
ipcMain.on('ortografia:reemplazar', (e, texto) => { if (palabraValida(texto)) e.sender.replaceMisspelling(texto); });
ipcMain.on('ortografia:agregar', (e, palabra) => { if (palabraValida(palabra)) e.sender.session.addWordToSpellCheckerDictionary(palabra); });

ipcMain.on('ventana:cerrar', () => {
  cerrarYa = true;
  ventana?.close();
});

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', (_e, args) => {
    if (!ventana) return;
    if (ventana.isMinimized()) ventana.restore();
    ventana.focus();
    const ruta = buscarArchivo(args);
    if (ruta) ventana.webContents.send('pedido', 'abrir-ruta', ruta);
  });
  app.whenReady().then(prepararOrtografia).then(crearVentana);
  app.on('window-all-closed', () => app.quit());
}
