// Convierte la vista previa de cada plantilla (plantillas/<id>.svg) en una imagen PNG de 1600 px de ancho, con el
// alto que pide el diagrama (sin franjas blancas arriba y abajo) y fondo blanco (plantillas/<id>.png). La usa la página del proyecto: imagen de cada plantilla, vista previa al compartir el
// enlace en redes (que no aceptan SVG) y Google Imágenes. Se corre con Electron:
//   node_modules/electron/dist/electron.exe scripts/vistas-png.mjs [--en]
import { app, BrowserWindow } from 'electron';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Con --en convierte las plantillas en inglés (plantillas/en).
const carpeta = join(import.meta.dirname, '..', 'plantillas', ...(process.argv.includes('--en') ? ['en'] : []));
const ANCHO = 1600, MARGEN = 24, ALTO_MIN = 420, ALTO_MAX = 1000;

app.disableHardwareAcceleration();
// Cada imagen cierra su ventana; sin esto Electron se cerraría al cerrar la primera.
app.on('window-all-closed', () => {});
app.whenReady().then(async () => {
  const svgs = readdirSync(carpeta).filter((f) => f.endsWith('.svg'));
  for (const archivo of svgs) {
    const svg = readFileSync(join(carpeta, archivo), 'utf8');
    // Proporción del diagrama según el ancho y alto del SVG; el alto de la imagen la sigue, dentro de un rango.
    const raiz = svg.match(/<svg[^>]*>/)[0];
    const medida = (n) => Number((raiz.match(new RegExp(`\\s${n}="([\\d.]+)`)) || [])[1]) || 0;
    const proporcion = medida('width') && medida('height') ? medida('width') / medida('height') : 1600 / 840;
    const alto = Math.round(Math.min(ALTO_MAX, Math.max(ALTO_MIN, (ANCHO - 2 * MARGEN) / proporcion + 2 * MARGEN)));
    // Una ventana del tamaño justo por imagen: la ventana fuera de pantalla no se deja redimensionar.
    const ventana = new BrowserWindow({ show: false, width: ANCHO, height: alto, useContentSize: true, webPreferences: { offscreen: true } });
    const html = `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;width:${ANCHO}px;height:${alto}px;background:#fff}
      img{display:block;box-sizing:border-box;width:100%;height:100%;padding:${MARGEN}px;object-fit:contain}</style>
      <img src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}">`;
    await ventana.loadURL(`data:text/html;base64,${Buffer.from(html).toString('base64')}`);
    await ventana.webContents.executeJavaScript('document.querySelector("img").decode().then(() => true)');
    const imagen = await ventana.webContents.capturePage({ x: 0, y: 0, width: ANCHO, height: alto });
    writeFileSync(join(carpeta, archivo.replace(/\.svg$/, '.png')), imagen.resize({ width: ANCHO, height: alto }).toPNG());
    ventana.destroy();
  }
  console.log(`${svgs.length} vistas PNG en ${carpeta}`);
  app.quit();
});
