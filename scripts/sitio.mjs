// Arma la página del proyecto para GitHub Pages en _sitio/ (uso: npm run sitio; antes compila con npm run build):
// - portada, guías y una página por plantilla (scripts/sitio/*.mjs), con datos estructurados para buscadores;
// - visor/: el visor interactivo de Fluye (el de la página web exportada) que carga cada plantilla por su dirección;
// - app/: Fluye en el navegador (dist/renderer): guarda en el computador, se instala y funciona sin internet; demo/
//   (la dirección anterior) lleva a app/;
// - sitemap.xml, llms.txt (resumen para asistentes de IA) y 404.html. Los recursos fijos (estilos, letra, imágenes) vienen de sitio/.
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { analizar, ruta } from './sitio/datos.mjs';
import { DESCARGA, REPO, RUTAS, SITIO, VERSION, pagina } from './sitio/comun.mjs';
import { portada } from './sitio/portada.mjs';
import { NIVELES, indicePlantillas, paginaPlantilla } from './sitio/plantillas.mjs';
import { PLANTILLAS, guias, indiceGuias } from './sitio/guias.mjs';
import { guiasEn, indiceGuiasEn } from './sitio/guias-en.mjs';
import { privacidad } from './sitio/privacidad.mjs';

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

// La app web, fuera de los buscadores: es una herramienta; la que se busca es la portada.
cpSync(web, join(salida, 'app'), { recursive: true, filter: (r) => !r.endsWith('.map') });
const app = join(salida, 'app', 'index.html');
writeFileSync(app, sinIndexar(readFileSync(app, 'utf8')));
// demo/ era la dirección anterior: lleva a app/ con lo mismo que pedía (?plantilla= o ?archivo=).
escribir('demo/index.html', `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Fluye</title>
<link rel="canonical" href="${SITIO}app/">
<script>location.replace('../app/' + location.search + location.hash);</script>
<meta http-equiv="refresh" content="0; url=../app/">
</head><body><p><a href="../app/">Abrir Fluye</a></p></body></html>
`);

// El visor: la misma página interactiva que exporta Fluye, sin proceso adentro; lo trae del sitio con ?archivo=.
escribir('visor/index.html', sinIndexar(readFileSync(plantillaVisor, 'utf8'))
  .replace("default-src 'none';", "default-src 'none'; connect-src 'self';")
  .replace('__FLUYE_TITULO__', () => 'Fluye')
  .replace('__FLUYE_DATOS__', () => ''));

// Plantillas de un idioma: datos del catálogo + lo que dice cada proceso. Las del español están en plantillas/ y las
// del inglés en plantillas/en/ (mismos id, textos traducidos; las genera crear-plantillas.mjs --en).
async function leerPlantillas(idioma) {
  const carpeta = idioma === 'en' ? join(raiz, 'plantillas', 'en') : join(raiz, 'plantillas');
  const destino = RUTAS[idioma].plantillas;
  const lista = [];
  for (const p of JSON.parse(readFileSync(join(carpeta, 'catalogo.json'), 'utf8'))) {
    const xml = readFileSync(join(carpeta, `${p.id}.bpmn`), 'utf8');
    const item = { ...p, ruta: ruta(p.nombre), nivelNombre: NIVELES[idioma][p.nivel].nombre, analisis: await analizar(xml) };
    escribir(`${destino}${item.ruta}/${item.ruta}.bpmn`, xml);
    escribir(`${destino}${item.ruta}/vista.svg`, readFileSync(join(carpeta, `${p.id}.svg`), 'utf8'));
    cpSync(join(carpeta, `${p.id}.png`), join(salida, destino, item.ruta, 'vista.png'));
    // Medidas reales de la imagen (ancho y alto de la cabecera PNG), para que la página reserve su espacio exacto.
    const png = readFileSync(join(carpeta, `${p.id}.png`));
    Object.assign(item, { vistaAncho: png.readUInt32BE(16), vistaAlto: png.readUInt32BE(20) });
    lista.push(item);
  }
  const areas = [...new Set(lista.map((p) => p.categoria))].sort((a, b) => a.localeCompare(b, idioma)).map((nombre) => ({ nombre, ruta: ruta(nombre) }));
  const ordenadas = areas.flatMap((a) => lista.filter((p) => p.categoria === a.nombre)
    .sort((x, y) => Object.keys(NIVELES[idioma]).indexOf(x.nivel) - Object.keys(NIVELES[idioma]).indexOf(y.nivel)));
  return { ordenadas, areas };
}
const { ordenadas, areas } = await leerPlantillas('es');
const { ordenadas: ordenadasEn, areas: areasEn } = await leerPlantillas('en');
// Cada plantilla conoce la ruta de su par en el otro idioma (hreflang y cambio de idioma).
const porId = (lista) => new Map(lista.map((p) => [p.id, p]));
const es = porId(ordenadas), en = porId(ordenadasEn);
for (const p of ordenadas) p.alterna = `${RUTAS.en.plantillas}${en.get(p.id).ruta}/`;
for (const p of ordenadasEn) p.alterna = `${RUTAS.es.plantillas}${es.get(p.id).ruta}/`;

// Las guías y sus índices sacan de aquí las medidas y el flujo de sus ejemplos.
Object.assign(PLANTILLAS, { es: ordenadas, en: ordenadasEn });
const paginas = [
  portada({ plantillas: ordenadas }),
  indicePlantillas(ordenadas, areas),
  ...ordenadas.map((p) => paginaPlantilla(p, ordenadas)),
  indiceGuias(ordenadas),
  ...guias(ordenadas),
  privacidad('es')
];
const paginasEn = [
  portada({ plantillas: ordenadasEn, idioma: 'en' }),
  indicePlantillas(ordenadasEn, areasEn, 'en'),
  ...ordenadasEn.map((p) => paginaPlantilla(p, ordenadasEn, 'en')),
  indiceGuiasEn(),
  ...guiasEn(ordenadasEn),
  privacidad('en')
];
for (const p of paginas) escribir(`${p.ruta}index.html`, pagina(p));
for (const p of paginasEn) escribir(`${p.ruta}index.html`, pagina(p));

// Página de error de GitHub Pages: se sirve en cualquier dirección, por eso usa <base> para sus enlaces.
escribir('404.html', pagina({
  ruta: '', titulo: 'Página no encontrada | Fluye', descripcion: 'Esta dirección no existe en el sitio de Fluye.', indexar: false, base: '/fluye/',
  cuerpo: `
<div class="pila">
  <header class="tablero titular">
    <div class="pieza titular-texto">
      <h1>Esta página no existe</h1>
      <p class="bajada">Puede que la dirección esté mal escrita o que la página haya cambiado de lugar. Prueba con la <a href="./">portada</a> o las <a href="guias/">guías</a>, o <a href="app/">abre Fluye</a>.</p>
    </div>
    <div class="pieza pieza-fin titular-lado"><p class="frase">Este camino termina aquí, pero los demás siguen abiertos.</p></div>
  </header>
</div>`
}));

const hoy = new Date().toISOString().slice(0, 10);
// Cada página repite en el sitemap su par en el otro idioma (además del hreflang de la página).
const alternasSitemap = (p) => (p.alternas
  ? [...['es', 'en'].map((l) => [l, p.alternas[l]]), ['x-default', p.alternas.es]]
    .map(([l, rel]) => `\n    <xhtml:link rel="alternate" hreflang="${l}" href="${SITIO}${rel}"/>`).join('') + '\n  '
  : '');
escribir('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${[...paginas, ...paginasEn].map((p) => `  <url><loc>${SITIO}${p.ruta}</loc><lastmod>${hoy}</lastmod>${alternasSitemap(p)}</url>`).join('\n')}
</urlset>
`);

// Resumen en Markdown para asistentes de IA (formato llms.txt): qué es Fluye, datos clave y las páginas que importan.
const guiasHechas = paginas.filter((p) => p.ruta.startsWith('guias/') && p.ruta !== 'guias/');
escribir('llms.txt', `# Fluye

> Fluye es un programa gratis y de código abierto (licencia MIT) para hacer diagramas BPMN 2.0 y diagramas de flujo, en español: se usa en el navegador o como programa para Windows 10 y 11. Dibuja pools, carriles, tareas, decisiones y eventos, revisa que el diagrama esté completo y lo recorre paso a paso con un Play. Funciona sin internet y no pide cuenta. Lo creó Esteban Maturana, en Chile.

Datos clave:

- Precio: gratis, sin planes de pago ni anuncios.
- Dónde se usa: en el navegador (sin instalar; Chrome y Edge guardan sobre el mismo archivo, y se puede instalar como app que funciona sin internet) o como programa para Windows 10 y 11 de 64 bits.
- Notación: BPMN 2.0, el estándar de la OMG. Abre y guarda archivos .bpmn estándar, también los que exportan otras herramientas de modelado.
- Exporta a BPMN, PNG, SVG, PDF, Word y una página web interactiva de un solo archivo que trae el Play.
- Trae ${ordenadas.length} plantillas de ${areas.length} áreas en tres niveles, revisión del diagrama mientras se dibuja y corrector ortográfico en español sin internet.
- Versión actual: ${VERSION}.

## Empezar

- [Descargar Fluye para Windows](${DESCARGA}): instalador por usuario, no pide administrador.
- [Usar Fluye en el navegador](${SITIO}app/): el programa completo, sin instalar ni crear cuenta; los archivos quedan en tu computador.
- [Instalar Fluye en el navegador](${SITIO}app/?instalar=1): en Chrome y Edge queda como app, con su ícono y sin internet.

## Guías

${guiasHechas.map((p) => `- [${p.titulo.replace(/ \| Fluye$/, '')}](${SITIO}${p.ruta}): ${p.descripcion}`).join('\n')}

## Plantillas BPMN gratis

- [Todas las plantillas](${SITIO}plantillas/): índice por área y nivel.
${ordenadas.map((p) => `- [${p.nombre}](${SITIO}plantillas/${p.ruta}/): ${p.descripcion} Área ${p.categoria}, nivel ${p.nivelNombre.toLowerCase()}.`).join('\n')}

## English

> Fluye is free, open-source software (MIT license) for BPMN 2.0 diagrams and flowcharts on Windows 10 and 11. It draws pools, lanes, tasks, gateways and events, checks the diagram as you draw and walks through the process step by step with Play. Works offline, no account needed. The website, guides and templates are available in English; the program interface is in Spanish.

- [Fluye in English](${SITIO}${RUTAS.en.raiz}): overview, the web app and FAQ.
- [Free BPMN templates](${SITIO}${RUTAS.en.plantillas}): ${ordenadasEn.length} flowchart templates by area and level.
${paginasEn.filter((p) => p.ruta.startsWith(RUTAS.en.guias) && p.ruta !== RUTAS.en.guias).map((p) => `- [${p.titulo.replace(/ \| Fluye$/, '')}](${SITIO}${p.ruta}): ${p.descripcion}`).join('\n')}
${ordenadasEn.map((p) => `- [${p.nombre}](${SITIO}${RUTAS.en.plantillas}${p.ruta}/): ${p.descripcion}`).join('\n')}

## Optional

- [Guías completas en un solo archivo](${SITIO}llms-full.txt): el texto entero de las guías, en español e inglés.
- [Política de privacidad](${SITIO}privacidad/): sin cuentas ni servidores; Google Drive es opcional y usa solo el permiso drive.file.
- [Código fuente en GitHub](${REPO})
- [Licencia MIT](${REPO}/blob/main/LICENSE)
`);

// llms-full.txt: el texto completo de las guías en Markdown simple, para que un asistente de IA las lea y cite sin
// recorrer el HTML (llms.txt solo trae el índice).
const aTexto = (html) => html
  .replace(/<(script|style|svg|figure|nav)[\s\S]*?<\/\1>/g, '').replace(/<a [^>]*data-play[\s\S]*?<\/a>/g, '')
  .replace(/<(strong|dt)>([\s\S]*?)<\/\1>/g, (_, e, x) => `**${x.replace(/<[^>]+>/g, '').trim()}** `).replace(/<\/(span|dd)>/g, ' ')
  .replace(/<h([1-4])[^>]*>([\s\S]*?)<\/h\1>/g, (_, n, x) => `\n\n${'#'.repeat(+n)} ${x}\n\n`)
  .replace(/<li[^>]*>/g, '\n- ').replace(/<\/(p|ul|ol|div|section|tr)>/g, '\n').replace(/<\/t[dh]>/g, ' | ')
  .replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
  .replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim();
const guiasCompletas = [...guiasHechas, ...paginasEn.filter((p) => p.ruta.startsWith(RUTAS.en.guias) && p.ruta !== RUTAS.en.guias)];
escribir('llms-full.txt', `# Fluye: guías completas

> Texto completo de las guías de Fluye (programa gratis y de código abierto para diagramas BPMN 2.0 y de flujo en Windows). Índice y datos del programa: ${SITIO}llms.txt

${guiasCompletas.map((p) => `---\n\nFuente: ${SITIO}${p.ruta}\n\n${aTexto((p.cuerpo.match(/<article[\s\S]*<\/article>/) || [p.cuerpo])[0])}`).join('\n\n')}
`);

console.log(`Sitio listo en ${salida}: ${paginas.length} páginas en español y ${paginasEn.length} en inglés, ${ordenadas.length} plantillas por idioma.`);
