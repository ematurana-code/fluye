// Sirve _sitio/ en http://127.0.0.1:8096/fluye/, la misma ruta que en GitHub Pages, para revisar la página antes de
// publicarla. Uso: node scripts/servir-sitio.mjs [puerto] (primero npm run sitio). Las rutas que terminan en / sirven
// su index.html y lo que no existe responde el 404.html del sitio, igual que Pages.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';

const sitio = join(import.meta.dirname, '..', '_sitio');
const puerto = Number(process.argv[2]) || 8096;
const tipos = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.bpmn': 'application/xml', '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json' };

createServer(async (req, res) => {
  const ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (ruta === '/') { res.writeHead(302, { Location: '/fluye/' }).end(); return; }
  if (!ruta.startsWith('/fluye/')) { res.writeHead(404).end(); return; }
  let archivo = normalize(join(sitio, ruta.slice('/fluye/'.length)));
  if (archivo !== sitio && !archivo.startsWith(sitio + sep)) { res.writeHead(403).end(); return; }
  try {
    if ((await stat(archivo)).isDirectory()) archivo = join(archivo, 'index.html');
    const datos = await readFile(archivo);
    res.writeHead(200, { 'Content-Type': tipos[extname(archivo)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }).end(datos);
  } catch {
    const pagina = await readFile(join(sitio, '404.html')).catch(() => 'No existe');
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }).end(pagina);
  }
}).listen(puerto, '127.0.0.1', () => console.log(`Sitio en http://127.0.0.1:${puerto}/fluye/`));
