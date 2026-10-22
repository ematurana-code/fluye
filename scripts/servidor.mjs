// Servidor local solo para probar la interfaz en un navegador (sin Electron). Uso: node scripts/servidor.mjs [puerto]
// /           -> dist/renderer
// /pruebas/   -> pruebas/ (modelos MIWG)
// /plantillas/ -> plantillas/ (procesos prearmados de la galería)
// /bizagi/    -> ../evidencia/bizagi (exportaciones reales de Bizagi)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { dirname, extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const puerto = Number(process.argv[2]) || 8095;
const rutas = [
  ['/pruebas/', join(raiz, 'pruebas')],
  ['/ejemplos/', join(raiz, 'ejemplos')],
  ['/plantillas/', join(raiz, 'plantillas')],
  ['/bizagi/', join(raiz, '..', 'evidencia', 'bizagi')],
  ['/', join(raiz, 'dist', 'renderer')]
];
const tipos = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.map': 'application/json',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.svg': 'image/svg+xml', '.png': 'image/png', '.bpmn': 'application/xml', '.json': 'application/json' };

async function listarBpmn(dir, prefijo) {
  const { readdir } = await import('node:fs/promises');
  const salida = [];
  for (const e of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
    if (e.isDirectory()) salida.push(...await listarBpmn(join(dir, e.name), `${prefijo}${e.name}/`));
    else if (/\.bpmn$/i.test(e.name)) salida.push(`${prefijo}${e.name}`);
  }
  return salida;
}

createServer(async (req, res) => {
  try {
    const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (url === '/pruebas/lista.json') {
      const lista = [...await listarBpmn(join(raiz, '..', 'evidencia', 'bizagi'), '/bizagi/'), ...await listarBpmn(join(raiz, 'pruebas'), '/pruebas/')];
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      return res.end(JSON.stringify(lista.map(encodeURI)));
    }
    const [prefijo, base] = rutas.find(([p]) => url.startsWith(p));
    let archivo = normalize(join(base, url.slice(prefijo.length)));
    if (!archivo.startsWith(base + sep) && archivo !== base) throw new Error('fuera');
    if ((await stat(archivo)).isDirectory()) archivo = join(archivo, 'index.html');
    res.writeHead(200, { 'Content-Type': tipos[extname(archivo).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(await readFile(archivo));
  } catch {
    res.writeHead(404).end('no encontrado');
  }
}).listen(puerto, '127.0.0.1', () => console.log(`Fluye (web de prueba) en http://localhost:${puerto}`));
