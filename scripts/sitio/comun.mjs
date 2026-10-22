// Lo que comparten todas las páginas del sitio: cabecera, pie, metadatos para buscadores y redes, y utilidades.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const raizProyecto = join(import.meta.dirname, '..', '..');
const paquete = JSON.parse(readFileSync(join(raizProyecto, 'package.json'), 'utf8'));

export const VERSION = paquete.version;
export const SITIO = 'https://ematurana-code.github.io/fluye/';
export const REPO = 'https://github.com/ematurana-code/fluye';
export const DESCARGA = `${REPO}/releases/latest/download/Fluye-Instalar-${VERSION}.exe`;
export const VERSIONES = `${REPO}/releases`;
export const PESO = '97 MB';

export const escapar = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// El logo de Fluye (la ola) en línea, para no depender de una imagen.
export const LOGO = (tam = 30) => `<svg viewBox="0 0 32 32" width="${tam}" height="${tam}" aria-hidden="true" focusable="false"><rect width="32" height="32" rx="8" fill="#1e3a8a"/><path d="M6.5 20.5c3.4 0 4.2-9 8.4-9s5 9 8.4 9" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><circle cx="6.5" cy="20.5" r="2.5" fill="#60a5fa"/><path d="M22.4 16.6 27 20.5l-4.6 3.9z" fill="#fff"/></svg>`;

const enlacesPie = (r, areas) => `
  <div class="pie-columnas">
    <div>
      <h2>Programa</h2>
      <ul>
        <li><a href="${DESCARGA}">Descargar para Windows</a></li>
        <li><a href="${r}demo/">Probar en el navegador</a></li>
        <li><a href="${VERSIONES}">Versiones anteriores</a></li>
      </ul>
    </div>
    <div>
      <h2>Plantillas</h2>
      <ul>${areas.map((a) => `<li><a href="${r}plantillas/#${a.ruta}">${escapar(a.nombre)}</a></li>`).join('')}</ul>
    </div>
    <div>
      <h2>Guías</h2>
      <ul>
        <li><a href="${r}guias/diagrama-de-flujo/">Cómo hacer un diagrama de flujo</a></li>
        <li><a href="${r}guias/simbolos-bpmn/">Símbolos BPMN</a></li>
        <li><a href="${r}guias/diagrama-de-carriles/">Diagrama de carriles</a></li>
      </ul>
    </div>
    <div>
      <h2>Proyecto</h2>
      <ul>
        <li><a href="${REPO}">Código en GitHub</a></li>
        <li><a href="${REPO}/blob/main/LICENSE">Licencia MIT</a></li>
        <li><a href="${REPO}/issues">Reportar un problema</a></li>
      </ul>
    </div>
  </div>`;

/**
 * Página completa. ruta: dirección dentro del sitio ('' para la portada, 'plantillas/' ...), que da la profundidad.
 * esquema: objetos JSON-LD (datos estructurados para Google).
 */
export function pagina({ ruta, titulo, descripcion, cuerpo, esquema = [], indexar = true, imagen = 'og.png', areas = [], clase = '', base = '' }) {
  const r = '../'.repeat(ruta.split('/').filter(Boolean).length);
  const url = SITIO + ruta;
  const datos = esquema.map((e) => `<script type="application/ld+json">${JSON.stringify(e).replace(/</g, '\\u003c')}</script>`).join('\n');
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
${base ? `<base href="${base}">` : ''}
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapar(titulo)}</title>
<meta name="description" content="${escapar(descripcion)}">
${indexar ? `<link rel="canonical" href="${url}">` : '<meta name="robots" content="noindex">'}
<meta name="theme-color" content="#1e3a8a">
<meta property="og:type" content="website">
<meta property="og:locale" content="es_ES">
<meta property="og:site_name" content="Fluye">
<meta property="og:title" content="${escapar(titulo)}">
<meta property="og:description" content="${escapar(descripcion)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITIO}${imagen}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${r}imagenes/icono.png" type="image/png">
<link rel="preload" href="${r}fuentes/inter-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${r}fuentes/inter-latin-700-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${r}estilo.css">
<script>document.documentElement.classList.add('js');</script>
${datos}
</head>
<body class="${clase}">
<a class="saltar" href="#contenido">Ir al contenido</a>
<header class="barra">
  <a class="marca" href="${r}" aria-label="Fluye, inicio">${LOGO(30)}<span translate="no">Fluye</span></a>
  <nav aria-label="Principal">
    <a href="${r}plantillas/">Plantillas</a>
    <a href="${r}guias/">Guías</a>
    <a href="${r}demo/">Probar</a>
    <a href="${REPO}">Código</a>
  </nav>
  <a class="boton boton-chico" href="${DESCARGA}">Descargar</a>
</header>
<main id="contenido">
${cuerpo}
</main>
<footer class="pie">
  <a class="pie-marca" href="${r}">${LOGO(40)}<span translate="no">Fluye</span></a>
  <p class="pie-frase">Programa gratis y de código abierto para hacer diagramas de flujo y procesos BPMN en Windows.</p>
  ${enlacesPie(r, areas)}
  <p class="pie-final">© 2026 Esteban Maturana · Licencia MIT · Hecho en Chile · BPMN es un estándar de la OMG.</p>
</footer>
<script src="${r}sitio.js" defer></script>
</body>
</html>
`;
}

// Migas de pan visibles y su versión para Google.
export function migas(r, pasos) {
  const html = `<nav class="migas" aria-label="Estás en"><ol>${pasos.map((p, i) => i < pasos.length - 1
    ? `<li><a href="${r}${p.ruta}">${escapar(p.nombre)}</a></li>` : `<li aria-current="page">${escapar(p.nombre)}</li>`).join('')}</ol></nav>`;
  const esquema = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: pasos.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.nombre, item: SITIO + p.ruta }))
  };
  return { html, esquema };
}

// La decisión de la portada y del final: dos caminos, uno por cada forma de usar Fluye.
export const decision = (r, pregunta = '¿Dónde lo vas a usar?') => `
  <div class="decision">
    <p class="decision-pregunta"><span class="decision-rombo" aria-hidden="true"></span>${escapar(pregunta)}</p>
    <ul class="decision-caminos">
      <li><span class="camino-nombre">En Windows</span><span class="camino-destino"><a class="boton" href="${DESCARGA}">Descargar gratis</a><span class="camino-nota">${PESO} · Windows 10 y 11 · sin cuenta</span></span></li>
      <li><span class="camino-nombre">En el navegador</span><span class="camino-destino"><a class="boton boton-claro" href="${r}demo/">Probar sin instalar</a><span class="camino-nota">Abre el editor aquí mismo</span></span></li>
    </ul>
  </div>`;

// Visor real de Fluye con una plantilla, en un marco. Se carga al acercarse (loading=lazy) salvo en la portada.
// archivo: ruta del .bpmn desde la raíz del sitio (el visor está en visor/, de ahí el ../).
export const visor = (r, { archivo, titulo, alto = 560, perezoso = true }) => `
  <figure class="ventana">
    <iframe src="${r}visor/?archivo=${encodeURIComponent('../' + archivo)}&amp;titulo=${encodeURIComponent(titulo)}" title="Diagrama interactivo: ${escapar(titulo)}" style="height:${alto}px" ${perezoso ? 'loading="lazy"' : ''}></iframe>
    <figcaption>Diagrama interactivo de Fluye: pulsa <strong>Play</strong> para recorrerlo paso a paso.</figcaption>
  </figure>`;
