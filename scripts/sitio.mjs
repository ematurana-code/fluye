// Arma la página del proyecto para GitHub Pages en _sitio/: la portada (sitio/) y, en demo/, la versión web de
// Fluye (dist/renderer, que deja `npm run build`). Uso: npm run sitio. Para verla: abrir _sitio/index.html.
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const raiz = join(import.meta.dirname, '..');
const salida = join(raiz, '_sitio');
const web = join(raiz, 'dist', 'renderer');
if (!existsSync(join(web, 'index.html'))) throw new Error('Falta compilar la app: ejecuta primero npm run build.');

rmSync(salida, { recursive: true, force: true });
cpSync(join(raiz, 'sitio'), salida, { recursive: true });
cpSync(web, join(salida, 'demo'), { recursive: true, filter: (ruta) => !ruta.endsWith('.map') });
// La demo usa el ícono de Fluye en la pestaña del navegador (la app de escritorio no lo necesita).
const demo = join(salida, 'demo', 'index.html');
writeFileSync(demo, readFileSync(demo, 'utf8').replace('<head>', '<head>\n<link rel="icon" href="../imagenes/icono.png" type="image/png">'));
console.log(`Sitio listo en ${salida}`);
