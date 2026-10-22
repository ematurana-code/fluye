// Prueba del corrector ortográfico en la app de escritorio: abre Fluye fuera de la pantalla (datos en una carpeta
// temporal, no toca AppData), escribe con faltas el nombre de una tarea, hace clic derecho sobre la palabra y elige
// la sugerencia. Uso: node scripts/probar-ortografia.mjs [captura.png]
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CDP, sleep } from './cdp.mjs';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const captura = process.argv[2];
const temporal = mkdtempSync(join(tmpdir(), 'fluye-ortografia-'));
const PUERTO = 9337;
const resultado = {};

const proc = spawn(join(raiz, 'node_modules', 'electron', 'dist', 'electron.exe'), ['.', `--remote-debugging-port=${PUERTO}`],
  { cwd: raiz, env: { ...process.env, FLUYE_OCULTO: '1', FLUYE_DATOS: join(temporal, 'datos') }, stdio: 'ignore' });
try {
  let pagina = null;
  for (let i = 0; i < 60 && !pagina; i++) {
    try { pagina = (await (await fetch(`http://127.0.0.1:${PUERTO}/json/list`)).json()).find((t) => t.type === 'page' && /index\.html/.test(t.url)); } catch {}
    if (!pagina) await sleep(500);
  }
  if (!pagina) throw new Error('Electron no abrió');
  const c = await CDP.conectar(pagina.webSocketDebuggerUrl);
  for (let i = 0; i < 40; i++) { if (await c.eval('document.body.classList.contains("listo")').catch(() => false)) break; await sleep(250); }
  resultado.diccionarioCopiado = existsSync(join(temporal, 'datos', 'Dictionaries', 'es-ES-3-0.bdic'));
  // La ventana de prueba se abre sin foco (para no quitárselo al usuario) y Chromium solo revisa ortografía con foco.
  await c.send('Emulation.setFocusEmulationEnabled', { enabled: true });

  // Tarea nueva y su nombre escrito con faltas, tecla por tecla como una persona (pegado de una vez, Chromium no lo revisa).
  await c.eval(`(() => {
    const reg = fluye.get('elementRegistry'), ap = fluye.get('autoPlace'), f = fluye.get('elementFactory'), de = fluye.get('directEditing');
    const inicio = reg.filter((e) => e.type === 'bpmn:StartEvent')[0];
    const t = ap.append(inicio, f.crear('bpmn:Task'));
    if (!de.isActive()) de.activate(t);
    window.__tarea = t;
    const caja = document.querySelector('.djs-direct-editing-content');
    caja.focus();
    document.execCommand('selectAll');
  })()`);
  for (const letra of 'Validar contrasena en Bizagi ') await c.send('Input.dispatchKeyEvent', { type: 'keyDown', text: letra, unmodifiedText: letra, key: letra });
  await sleep(1500);

  const clicDerecho = async (palabra) => {
    const p = await c.eval(`(() => {
      const caja = document.querySelector('.djs-direct-editing-content');
      const nodo = [...caja.childNodes].find((n) => n.nodeType === 3 && n.textContent.includes(${JSON.stringify(palabra)})) || caja.firstChild;
      const i = nodo.textContent.indexOf(${JSON.stringify(palabra)});
      const r = document.createRange(); r.setStart(nodo, i + 2); r.setEnd(nodo, i + 3);
      const b = r.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    })()`);
    for (const type of ['mousePressed', 'mouseReleased']) await c.send('Input.dispatchMouseEvent', { type, x: p.x, y: p.y, button: 'right', clickCount: 1 });
    await sleep(700);
    return c.eval(`[...document.querySelectorAll('.fl-menu-ortografia .fl-menu-item')].map((b) => b.textContent)`);
  };
  const clicEn = async (selector) => {
    const p = await c.eval(`(() => { const b = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; })()`);
    for (const type of ['mousePressed', 'mouseReleased']) await c.send('Input.dispatchMouseEvent', { type, x: p.x, y: p.y, button: 'left', clickCount: 1 });
    await sleep(500);
  };

  resultado.menuContrasena = await clicDerecho('contrasena');
  if (captura) await c.captura(captura);
  if (resultado.menuContrasena.length) await clicEn('.fl-ortografia-sugerencia');
  resultado.textoTrasCorregir = await c.eval(`document.querySelector('.djs-direct-editing-content').textContent`);

  // "Agregar al diccionario" no se pincha: en Windows Electron también lo escribe en el diccionario personal de Windows
  // (%APPDATA%\Microsoft\Spelling), que es del usuario. Solo se revisa que la opción aparezca y que Esc cierre el menú.
  resultado.menuBizagi = await clicDerecho('Bizagi');
  await c.eval(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`);
  resultado.menuCerradoConEsc = await c.eval(`!document.querySelector('.fl-menu-ortografia')`);
  resultado.nombreGuardado = await c.eval(`(() => { fluye.get('directEditing').complete(); return window.__tarea.businessObject.name; })()`);
  c.cerrar();
  console.log(JSON.stringify(resultado, null, 1));
} finally {
  proc.kill();
  await sleep(800);
  rmSync(temporal, { recursive: true, force: true });
}
