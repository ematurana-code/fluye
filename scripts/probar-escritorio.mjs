// Prueba de la app de escritorio: abre Electron fuera de la pantalla (sin tomar el foco), revisa que la interfaz
// cargue sin errores, guarda y vuelve a abrir un archivo de verdad por el puente seguro, y deja una captura.
// Usa una carpeta temporal para datos y caché (no toca AppData) y la borra al terminar.
// Uso: node scripts/probar-escritorio.mjs [captura.png]
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CDP, sleep } from './cdp.mjs';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUERTO = 9334;
const captura = process.argv[2];
const electron = join(raiz, 'node_modules', 'electron', 'dist', 'electron.exe');
const temporal = mkdtempSync(join(tmpdir(), 'fluye-prueba-'));
const archivo = join(temporal, 'Prueba ñandú áéíóú.bpmn');

const proc = spawn(electron, ['.', `--remote-debugging-port=${PUERTO}`], {
  cwd: raiz, env: { ...process.env, FLUYE_OCULTO: '1', FLUYE_DATOS: join(temporal, 'datos') }, stdio: 'ignore'
});
let pagina = null;
try {
  for (let i = 0; i < 60 && !pagina; i++) {
    try { pagina = (await (await fetch(`http://127.0.0.1:${PUERTO}/json/list`)).json()).find((t) => t.type === 'page' && /index\.html/.test(t.url)); } catch {}
    if (!pagina) await sleep(500);
  }
  if (!pagina) throw new Error('Electron no abrió la ventana');
  const c = await CDP.conectar(pagina.webSocketDebuggerUrl);
  const errores = [];
  c.handlers.push((m) => {
    if (m.method === 'Runtime.exceptionThrown') errores.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errores.push(m.params.args.map((a) => a.value || a.description).join(' '));
  });
  await c.send('Runtime.enable');
  await c.send('Page.enable');
  await c.send('Page.reload');
  for (let i = 0; i < 40; i++) { if (await c.eval('document.body.classList.contains("listo")').catch(() => false)) break; await sleep(250); }

  const estado = await c.eval(`({
    titulo: document.title,
    puente: typeof window.fluyeEscritorio === 'object' && typeof window.fluyeEscritorio.abrir === 'function',
    nodeExpuesto: typeof window.require !== 'undefined' || typeof window.process !== 'undefined',
    elementos: window.fluye.get('elementRegistry').getAll().length,
    fuenteInter: document.fonts.check('600 12px Inter')
  })`);

  // Guardar y volver a abrir por el puente. La interfaz solo puede sobrescribir un archivo que Fluye abrió o guardó
  // (otra ruta pide el cuadro de Windows y no se puede renombrar): por eso primero se abre uno que deja la prueba.
  writeFileSync(archivo, readFileSync(join(raiz, 'ejemplos', 'Login página web.bpmn')));
  const ruta = JSON.stringify(archivo);
  const ida = await c.eval(`(async () => {
    const f = window.fluye, m = f.get('modeling'), reg = f.get('elementRegistry');
    const inicio = reg.filter((e) => e.type === 'bpmn:StartEvent')[0];
    const t = f.get('autoPlace').append(inicio, f.get('elementFactory').crear('bpmn:UserTask'));
    m.renombrar(t, 'Revisión de pingüino ñandú');
    const xml = await f.guardarXml();
    const desconocida = (await window.fluyeEscritorio.renombrar(${ruta}, 'Intruso')).error || 'lo renombró'; // aún no abierto: se rechaza
    await window.fluyeEscritorio.abrirRuta(${ruta});
    const r = await window.fluyeEscritorio.guardar(${ruta}, xml, 'Prueba');
    const leido = await window.fluyeEscritorio.abrirRuta(${ruta});
    const texto = new TextDecoder().decode(leido.bytes);
    await f.abrir(texto);
    const nombres = reg.getAll().map((e) => e.businessObject && e.businessObject.name).filter(Boolean);
    const renombrado = await window.fluyeEscritorio.renombrar(${ruta}, 'Login de usuarios');
    const recientes = await window.fluyeEscritorio.recientes();
    return { rutaDesconocida: desconocida, guardadoEn: r && r.nombre, mismoXml: texto === xml, nombres, renombrado: renombrado.nombre || renombrado.error, recientes: recientes.map((x) => x.nombre) };
  })()`, { esperar: true });

  await c.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 860, deviceScaleFactor: 1, mobile: false });
  await c.eval('window.fluye.ajustarVista()');
  await sleep(300);
  const nuevo = join(temporal, 'Login de usuarios.bpmn');
  const enDisco = readFileSync(nuevo, 'utf8');
  console.log(JSON.stringify({ ...estado, ...ida, renombradoEnDisco: existsSync(nuevo) && !existsSync(archivo), acentosEnDisco: enDisco.includes('pingüino ñandú'), errores }, null, 1));
  if (captura) await c.captura(captura);

  // Cerrar con cambios sin guardar: debe salir el aviso de Fluye (no un cuadro de Windows) y "No guardar" cierra.
  await c.eval(`fluye.get('modeling').renombrar(fluye.get('elementRegistry').filter((e) => e.type === 'bpmn:StartEvent')[0], 'Cambio sin guardar'); setTimeout(() => window.fluyeEscritorio.pruebaCerrar(), 300); true`);
  await sleep(1500);
  const aviso = await c.eval(`(() => {
    const t = document.querySelector('.fl-modal .modal-title');
    return { titulo: t && t.textContent, botones: [...document.querySelectorAll('.fl-modal .modal-footer button')].map((b) => b.textContent) };
  })()`, { esperar: true });
  console.log(JSON.stringify({ avisoAlCerrar: aviso }));
  await c.eval(`[...document.querySelectorAll('.fl-modal .modal-footer button')].find((b) => b.textContent === 'No guardar').click()`).catch(() => {});
  await sleep(1200);
  console.log(JSON.stringify({ cerroConNoGuardar: proc.exitCode !== null }));
  c.cerrar();
} finally {
  proc.kill();
  await sleep(800);
  rmSync(temporal, { recursive: true, force: true });
}
