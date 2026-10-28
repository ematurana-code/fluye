// Genera build/icono.png (256 px), build/icono.ico (16 a 256 px) y los íconos de la versión web instalable
// y de la extensión (build/icono-16, 32, 48, 128, 192 y 512.png) desde un SVG, dibujándolo con un Chrome sin ventana.
// Uso: node scripts/generar-icono.mjs [build/icono.svg]
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CDP, lanzarChrome, paginaPrincipal, sleep } from './cdp.mjs';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const origen = process.argv[2] || join(raiz, 'build', 'icono.svg');
const TAMANOS = [16, 24, 32, 48, 64, 128, 256];
const WEB = [16, 32, 48, 128, 192, 512];
const svg64 = readFileSync(origen).toString('base64');
const temporal = mkdtempSync(join(tmpdir(), 'fluye-icono-'));

const { proc } = await lanzarChrome({ puerto: 9337, perfil: join(temporal, 'chrome') });
try {
  const c = await CDP.conectar((await paginaPrincipal(9337)).webSocketDebuggerUrl);
  await c.send('Page.enable');
  await c.send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
  const pngs = [];
  for (const t of [...TAMANOS, ...WEB]) {
    await c.send('Emulation.setDeviceMetricsOverride', { width: t, height: t, deviceScaleFactor: 1, mobile: false });
    const html = `<html><body style="margin:0;background:transparent"><img src="data:image/svg+xml;base64,${svg64}" width="${t}" height="${t}" style="display:block"></body></html>`;
    await c.ir(`data:text/html;base64,${Buffer.from(html).toString('base64')}`);
    await sleep(250);
    const r = await c.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: t, height: t, scale: 1 } });
    pngs.push({ t, datos: Buffer.from(r.data, 'base64') });
  }
  c.cerrar();
  for (const t of WEB) writeFileSync(join(raiz, 'build', `icono-${t}.png`), pngs.find((p) => p.t === t).datos);
  pngs.splice(TAMANOS.length);

  // ICO con imágenes PNG adentro (formato válido desde Windows Vista).
  const cabecera = Buffer.alloc(6 + 16 * pngs.length);
  cabecera.writeUInt16LE(0, 0); cabecera.writeUInt16LE(1, 2); cabecera.writeUInt16LE(pngs.length, 4);
  let desplazamiento = cabecera.length;
  pngs.forEach(({ t, datos }, i) => {
    const o = 6 + 16 * i;
    cabecera.writeUInt8(t >= 256 ? 0 : t, o); cabecera.writeUInt8(t >= 256 ? 0 : t, o + 1);
    cabecera.writeUInt8(0, o + 2); cabecera.writeUInt8(0, o + 3);
    cabecera.writeUInt16LE(1, o + 4); cabecera.writeUInt16LE(32, o + 6);
    cabecera.writeUInt32LE(datos.length, o + 8); cabecera.writeUInt32LE(desplazamiento, o + 12);
    desplazamiento += datos.length;
  });
  writeFileSync(join(raiz, 'build', 'icono.ico'), Buffer.concat([cabecera, ...pngs.map((p) => p.datos)]));
  writeFileSync(join(raiz, 'build', 'icono.png'), pngs[pngs.length - 1].datos);
  console.log(`icono.ico (${TAMANOS.join(', ')} px) e icono.png (256 px) generados desde ${origen}`);
} finally {
  proc.kill();
  await sleep(600);
  rmSync(temporal, { recursive: true, force: true });
}
