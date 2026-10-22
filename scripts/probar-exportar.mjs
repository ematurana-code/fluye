// Prueba de las exportaciones en la app de escritorio: arma un proceso de ejemplo, genera SVG, PNG, Word y la página
// del PDF y la página web interactiva (con el ejemplo del login), y los deja en la carpeta indicada. El PDF se imprime con un Chrome sin ventana (mismo motor que Electron).
// Uso: node scripts/probar-exportar.mjs <carpeta-de-salida>
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CDP, lanzarChrome, paginaPrincipal, sleep } from './cdp.mjs';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const salida = process.argv[2];
if (!salida) throw new Error('Falta la carpeta de salida');
mkdirSync(salida, { recursive: true });
const temporal = mkdtempSync(join(tmpdir(), 'fluye-exportar-'));
const PUERTO = 9335;

const proc = spawn(join(raiz, 'node_modules', 'electron', 'dist', 'electron.exe'), ['.', `--remote-debugging-port=${PUERTO}`],
  { cwd: raiz, env: { ...process.env, FLUYE_OCULTO: '1', FLUYE_DATOS: join(temporal, 'datos') }, stdio: 'ignore' });
let chrome = null;
try {
  let pagina = null;
  for (let i = 0; i < 60 && !pagina; i++) {
    try { pagina = (await (await fetch(`http://127.0.0.1:${PUERTO}/json/list`)).json()).find((t) => t.type === 'page' && /index\.html/.test(t.url)); } catch {}
    if (!pagina) await sleep(500);
  }
  if (!pagina) throw new Error('Electron no abrió');
  const c = await CDP.conectar(pagina.webSocketDebuggerUrl);
  for (let i = 0; i < 40; i++) { if (await c.eval('document.body.classList.contains("listo")').catch(() => false)) break; await sleep(250); }

  const r = await c.eval(`(async () => {
    const reg = fluye.get('elementRegistry'), ap = fluye.get('autoPlace'), f = fluye.get('elementFactory'), de = fluye.get('directEditing'), m = fluye.get('modeling');
    const fin = () => de.isActive() && de.complete();
    const inicio = reg.filter((e) => e.type === 'bpmn:StartEvent')[0];
    m.renombrar(inicio, 'Llega solicitud');
    const t1 = ap.append(inicio, f.crear('bpmn:UserTask')); fin(); m.renombrar(t1, 'Ingresar solicitud de vacaciones');
    m.cambiarPropiedades(t1, { documentation: [fluye.moddle.create('bpmn:Documentation', { text: 'El colaborador completa fechas y motivo en el portal.' })] });
    const g = ap.append(t1, f.crear('bpmn:ExclusiveGateway')); fin(); m.renombrar(g, '¿Aprueba jefatura?');
    const si = ap.append(g, f.crear('bpmn:ServiceTask')); fin(); m.renombrar(si, 'Registrar en sistema');
    const no = ap.append(g, f.crear('bpmn:Task')); fin(); m.renombrar(no, 'Notificar rechazo');
    const f1 = ap.append(si, f.crear('bpmn:EndEvent')); m.renombrar(f1, 'Aprobada');
    const f2 = ap.append(no, f.crear('bpmn:EndEvent')); m.renombrar(f2, 'Rechazada');
    m.renombrar(g.outgoing[0], 'Sí'); m.renombrar(g.outgoing[1], 'No');
    const carriles = reg.filter((e) => e.type === 'bpmn:Lane'); m.renombrar(carriles[0], 'Colaborador'); m.renombrar(carriles[1], 'Jefatura');
    fluye.get('selection').select(null);
    const aB64 = (bytes) => { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); };
    const x = window.fluyeExportar;
    const svg = x.svgDelDiagrama(fluye).svg;
    const png = await x.pngDelDiagrama(fluye, 2);
    const docx = await x.wordDelDiagrama(fluye, 'Solicitud de vacaciones');
    const html = x.htmlParaPdf(fluye, 'Solicitud de vacaciones');
    // Página web interactiva con el ejemplo del login (tiene decisiones, paralelo e iteración para probar el Play).
    await fluye.abrir(${JSON.stringify(readFileSync(join(raiz, 'ejemplos', 'Login página web.bpmn'), 'utf8'))});
    const web = await x.htmlInteractivo(fluye, 'Login página web');
    // Y una con varias pestañas (suite MIWG C.4.0: 4 diagramas) para revisar las pestañas de la página.
    await fluye.abrir(${JSON.stringify(readFileSync(join(raiz, 'pruebas', 'miwg', 'referencia', 'C.4.0.bpmn'), 'utf8'))});
    const webPestanas = await x.htmlInteractivo(fluye, 'Varias pestañas (C.4.0)');
    return { svg, png: aB64(png.bytes), pngTam: png.ancho + 'x' + png.alto, docx: aB64(docx), html, web, webPestanas };
  })()`, { esperar: true });
  c.cerrar();
  writeFileSync(join(salida, 'Login página web.html'), r.web, 'utf8');
  writeFileSync(join(salida, 'Varias pestañas.html'), r.webPestanas, 'utf8');

  writeFileSync(join(salida, 'diagrama.svg'), r.svg, 'utf8');
  writeFileSync(join(salida, 'diagrama.png'), Buffer.from(r.png, 'base64'));
  writeFileSync(join(salida, 'documentacion.docx'), Buffer.from(r.docx, 'base64'));
  const paginaHtml = join(salida, 'pagina-pdf.html');
  writeFileSync(paginaHtml, r.html, 'utf8');

  chrome = await lanzarChrome({ puerto: 9336, perfil: join(temporal, 'chrome') });
  const cc = await CDP.conectar((await paginaPrincipal(9336)).webSocketDebuggerUrl);
  await cc.ir(pathToFileURL(paginaHtml).href);
  await sleep(1500);
  const pdf = await cc.send('Page.printToPDF', { printBackground: true, preferCSSPageSize: true });
  writeFileSync(join(salida, 'diagrama.pdf'), Buffer.from(pdf.data, 'base64'));
  cc.cerrar();
  console.log(JSON.stringify({ png: r.pngTam, svgKB: Math.round(r.svg.length / 1024), docxKB: Math.round(Buffer.from(r.docx, 'base64').length / 1024), pdfKB: Math.round(Buffer.from(pdf.data, 'base64').length / 1024) }));
} finally {
  proc.kill();
  if (chrome) chrome.proc.kill();
  await sleep(800);
  rmSync(temporal, { recursive: true, force: true });
}
