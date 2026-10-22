// Genera las plantillas de la galería (plantillas/*.bpmn, su vista previa .svg y catalogo.json) desde
// plantillas/fuentes.mjs, usando la propia app: Fluye abre cada diagrama, traza todas las flechas y guarda.
// Uso: node scripts/crear-plantillas.mjs   (después: node scripts/build.mjs para que entren a la app)
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CDP, sleep } from './cdp.mjs';
import { PLANTILLAS, resumenPlantilla, xmlPlantilla } from '../plantillas/fuentes.mjs';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const destino = join(raiz, 'plantillas');
const temporal = mkdtempSync(join(tmpdir(), 'fluye-plantillas-'));
const PUERTO = 9339;

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

  const catalogo = [];
  for (const p of PLANTILLAS) {
    const r = await c.eval(`(async () => {
      let xml = ${JSON.stringify(xmlPlantilla(p))};
      for (let i = 0; i < ${p.diagramas.length}; i++) {
        await fluye.abrir(xml, { diagrama: i });
        const modeling = fluye.get('modeling');
        for (const conexion of fluye.get('elementRegistry').filter((e) => e.waypoints)) modeling.layoutConnection(conexion);
        xml = await fluye.guardarXml();
      }
      await fluye.abrir(xml, { diagrama: 0 });
      fluye.ajustarVista();
      const svg = window.fluyeExportar.svgDelDiagrama(fluye).svg;
      return { xml, svg, figuras: fluye.get('elementRegistry').getAll().length };
    })()`, { esperar: true });
    // Vista previa liviana: sin la letra incrustada (en miniatura no se lee el texto).
    const vista = r.svg.replace(/^<\?xml[^>]*>\s*/, '').replace(/<style>[\s\S]*?<\/style>/, '');
    writeFileSync(join(destino, `${p.id}.bpmn`), r.xml, 'utf8');
    writeFileSync(join(destino, `${p.id}.svg`), vista, 'utf8');
    catalogo.push({ id: p.id, nombre: p.nombre, categoria: p.categoria, nivel: p.nivel, descripcion: p.descripcion, incluye: resumenPlantilla(p) });
    console.log(`${p.id}: ${r.figuras} figuras, ${Math.round(r.xml.length / 1024)} KB, vista ${Math.round(vista.length / 1024)} KB`);
  }
  writeFileSync(join(destino, 'catalogo.json'), JSON.stringify(catalogo, null, 1), 'utf8');
  c.cerrar();
} finally {
  proc.kill();
  await sleep(800);
  rmSync(temporal, { recursive: true, force: true });
}
