// Arma la página del proyecto para GitHub Pages en _sitio/ (uso: npm run sitio; antes compila con npm run build):
// - portada, guías y una página por plantilla (scripts/sitio/*.mjs), con datos estructurados para buscadores;
// - visor/: el visor interactivo de Fluye (el de la página web exportada) que carga cada plantilla por su dirección;
// - demo/: la app completa en el navegador (dist/renderer);
// - sitemap.xml y 404.html. Los recursos fijos (estilos, letra, imágenes) vienen de sitio/.
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { analizar, ruta } from './sitio/datos.mjs';
import { SITIO, pagina } from './sitio/comun.mjs';
import { portada } from './sitio/portada.mjs';
import { NIVELES, indicePlantillas, paginaPlantilla } from './sitio/plantillas.mjs';
import { guias, indiceGuias } from './sitio/guias.mjs';

const raiz = join(import.meta.dirname, '..');
const salida = join(raiz, '_sitio');
const web = join(raiz, 'dist', 'renderer');
const plantillaVisor = join(raiz, 'dist', 'visor', 'plantilla.html');
if (!existsSync(join(web, 'index.html')) || !existsSync(plantillaVisor)) throw new Error('Falta compilar la app: ejecuta primero npm run build.');

const escribir = (rel, texto) => {
  const destino = join(salida, rel);
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(destino, texto);
};
const sinIndexar = (html) => html.replace('<head>', '<head>\n<meta name="robots" content="noindex">');

rmSync(salida, { recursive: true, force: true });
cpSync(join(raiz, 'sitio'), salida, { recursive: true });

// La demo: la app completa, con el ícono de Fluye y fuera de los buscadores (es una herramienta, no una página).
cpSync(web, join(salida, 'demo'), { recursive: true, filter: (r) => !r.endsWith('.map') });
const demo = join(salida, 'demo', 'index.html');
writeFileSync(demo, sinIndexar(readFileSync(demo, 'utf8')).replace('<head>', '<head>\n<link rel="icon" href="../imagenes/icono.png" type="image/png">'));

// El visor: la misma página interactiva que exporta Fluye, sin proceso adentro; lo trae del sitio con ?archivo=.
escribir('visor/index.html', sinIndexar(readFileSync(plantillaVisor, 'utf8'))
  .replace("default-src 'none';", "default-src 'none'; connect-src 'self';")
  .replace('__FLUYE_TITULO__', () => 'Fluye')
  .replace('__FLUYE_DATOS__', () => ''));

// Plantillas: datos del catálogo + lo que dice cada proceso.
const catalogo = JSON.parse(readFileSync(join(raiz, 'plantillas', 'catalogo.json'), 'utf8'));
const plantillas = [];
for (const p of catalogo) {
  const xml = readFileSync(join(raiz, 'plantillas', `${p.id}.bpmn`), 'utf8');
  const item = { ...p, ruta: ruta(p.nombre), nivelNombre: NIVELES[p.nivel].nombre, analisis: await analizar(xml) };
  escribir(`plantillas/${item.ruta}/${item.ruta}.bpmn`, xml);
  escribir(`plantillas/${item.ruta}/vista.svg`, readFileSync(join(raiz, 'plantillas', `${p.id}.svg`), 'utf8'));
  plantillas.push(item);
}
const areas = [...new Set(plantillas.map((p) => p.categoria))].sort((a, b) => a.localeCompare(b, 'es')).map((nombre) => ({ nombre, ruta: ruta(nombre) }));
const ordenadas = areas.flatMap((a) => plantillas.filter((p) => p.categoria === a.nombre)
  .sort((x, y) => Object.keys(NIVELES).indexOf(x.nivel) - Object.keys(NIVELES).indexOf(y.nivel)));

const paginas = [
  portada({ plantillas: ordenadas, areas }),
  indicePlantillas(ordenadas, areas),
  ...ordenadas.map((p) => paginaPlantilla(p, ordenadas)),
  indiceGuias(),
  ...guias()
];
for (const p of paginas) escribir(`${p.ruta}index.html`, pagina({ ...p, areas }));

// Página de error de GitHub Pages: se sirve en cualquier dirección, por eso usa <base> para sus enlaces.
escribir('404.html', pagina({
  ruta: '', titulo: 'Página no encontrada | Fluye', descripcion: 'Esta dirección no existe en el sitio de Fluye.', indexar: false, areas, base: '/fluye/',
  cuerpo: `
<div class="ancho">
  <header class="cabeza-pagina">
    <h1>Esta página no existe</h1>
    <p class="bajada">Puede que la dirección esté mal escrita o que la página haya cambiado de lugar. Prueba con la <a href="./">portada</a>, las <a href="plantillas/">plantillas</a> o las <a href="guias/">guías</a>.</p>
  </header>
</div>`
}));

const hoy = new Date().toISOString().slice(0, 10);
escribir('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paginas.map((p) => `  <url><loc>${SITIO}${p.ruta}</loc><lastmod>${hoy}</lastmod></url>`).join('\n')}
</urlset>
`);

console.log(`Sitio listo en ${salida}: ${paginas.length} páginas, ${plantillas.length} plantillas.`);
