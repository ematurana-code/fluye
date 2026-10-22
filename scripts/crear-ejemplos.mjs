// Genera los procesos de ejemplo en ejemplos/ usando la propia app (mismo motor y estilo que al modelar a mano).
// Uso: node scripts/crear-ejemplos.mjs
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CDP, sleep } from './cdp.mjs';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const EJEMPLOS = [{ script: 'pruebas/ejemplo-login.js', funcion: 'crearEjemploLogin', archivo: 'Login página web.bpmn' }];
const temporal = mkdtempSync(join(tmpdir(), 'fluye-ejemplos-'));
const PUERTO = 9338;
mkdirSync(join(raiz, 'ejemplos'), { recursive: true });

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
  for (const e of EJEMPLOS) {
    // El script de ejemplo es código propio del proyecto; se carga como función en la página de prueba.
    const fuente = readFileSync(join(raiz, e.script), 'utf8').replace(/^export\s+/m, '');
    const xml = await c.eval(`(async () => { ${fuente}; await ${e.funcion}(window.fluye); return window.fluye.guardarXml(); })()`, { esperar: true });
    writeFileSync(join(raiz, 'ejemplos', e.archivo), xml, 'utf8');
    console.log(`ejemplos/${e.archivo}: ${Math.round(xml.length / 1024)} KB`);
  }
  c.cerrar();
} finally {
  proc.kill();
  await sleep(800);
  rmSync(temporal, { recursive: true, force: true });
}
