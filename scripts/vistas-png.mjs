// Convierte la vista previa de cada plantilla (plantillas/<id>.svg) en una imagen PNG de 1600 x 840 con fondo
// blanco (plantillas/<id>.png). La usa la página del proyecto: imagen de cada plantilla, vista previa al compartir el
// enlace en redes (que no aceptan SVG) y Google Imágenes. Se corre con Electron:
//   node_modules/electron/dist/electron.exe scripts/vistas-png.mjs [--en]
import { app, BrowserWindow } from 'electron';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Con --en convierte las plantillas en inglés (plantillas/en).
const carpeta = join(import.meta.dirname, '..', 'plantillas', ...(process.argv.includes('--en') ? ['en'] : []));
const ANCHO = 1600, ALTO = 840;

app.disableHardwareAcceleration();
app.whenReady().then(async () => {
  const ventana = new BrowserWindow({ show: false, width: ANCHO, height: ALTO, useContentSize: true, webPreferences: { offscreen: true } });
  const svgs = readdirSync(carpeta).filter((f) => f.endsWith('.svg'));
  for (const archivo of svgs) {
    const svg = readFileSync(join(carpeta, archivo), 'utf8');
    const html = `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;width:${ANCHO}px;height:${ALTO}px;background:#fff}
      img{display:block;box-sizing:border-box;width:100%;height:100%;padding:28px 32px;object-fit:contain}</style>
      <img src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}">`;
    await ventana.loadURL(`data:text/html;base64,${Buffer.from(html).toString('base64')}`);
    await ventana.webContents.executeJavaScript('document.querySelector("img").decode().then(() => true)');
    const imagen = await ventana.webContents.capturePage({ x: 0, y: 0, width: ANCHO, height: ALTO });
    writeFileSync(join(carpeta, archivo.replace(/\.svg$/, '.png')), imagen.resize({ width: ANCHO, height: ALTO }).toPNG());
  }
  console.log(`${svgs.length} vistas PNG en ${carpeta}`);
  app.quit();
});
