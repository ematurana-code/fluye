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

// Código de verificación de Google Search Console (etiqueta HTML). Vacío mientras no se registre el sitio.
export const GOOGLE_VERIFICACION = '';

export const escapar = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// El logo de Fluye (la ola) en línea, para no depender de una imagen.
export const LOGO = (tam = 30) => `<svg viewBox="0 0 32 32" width="${tam}" height="${tam}" aria-hidden="true" focusable="false"><rect width="32" height="32" rx="8" fill="#1e3a8a"/><path d="M6.5 20.5c3.4 0 4.2-9 8.4-9s5 9 8.4 9" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><circle cx="6.5" cy="20.5" r="2.5" fill="#60a5fa"/><path d="M22.4 16.6 27 20.5l-4.6 3.9z" fill="#fff"/></svg>`;

// Íconos chicos que se repiten: la flecha de las piezas que son enlaces y el triángulo del Play.
export const FLECHA = '<svg class="pieza-flecha" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
export const PLAY = '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 4.5v15l12-7.5z" fill="currentColor"/></svg>';

// El nombre del pie, construido con un bloque por letra (alturas y colores fijos).
const BLOQUES = [['F', '100%', '#ffffff'], ['L', '76%', '#dce6fd'], ['U', '62%', '#3b82f6'], ['Y', '88%', '#93b4f7'], ['E', '70%', '#ffffff']];

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
        <li><a href="${r}guias/que-es-bpmn/">Qué es BPMN</a></li>
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
    <div>
      <h2>Fluye</h2>
      <p class="pie-frase">Programa gratis y de código abierto para hacer diagramas BPMN y de flujo en Windows, en español.</p>
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
${GOOGLE_VERIFICACION && ruta === '' ? `<meta name="google-site-verification" content="${escapar(GOOGLE_VERIFICACION)}">` : ''}
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
  <div class="barra-fila">
    <a class="barra-logo" href="${r}" aria-label="Fluye, inicio">${LOGO(34)}</a>
    <div class="barra-enlaces">
      <a class="barra-nombre" href="${r}" translate="no">Fluye</a>
      <nav aria-label="Principal">
        <a href="${r}plantillas/">Plantillas</a>
        <a href="${r}guias/">Guías</a>
        <a href="${r}demo/">Probar</a>
        <a href="${REPO}">Código</a>
      </nav>
    </div>
    <a class="barra-accion" href="${DESCARGA}">Descargar</a>
  </div>
</header>
<main id="contenido">
${cuerpo}
</main>
<footer class="pie">
  <div class="pie-bloques" aria-hidden="true">${BLOQUES.map(([l, alto, color]) => `<span style="--alto:${alto};--fondo-letra:${color}">${l}</span>`).join('')}</div>
  ${enlacesPie(r, areas)}
  <div class="pie-final">
    <p>© 2026 Esteban Maturana. Licencia MIT. Hecho en Chile. BPMN es un estándar de la OMG.</p>
    <a class="boton" href="${DESCARGA}">Descargar gratis</a>
  </div>
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

// La decisión: un rombo con la pregunta y dos caminos, uno por cada forma de usar Fluye.
export const decision = (r, pregunta = '¿Dónde lo vas a usar?') => `
  <div class="tablero decision-fila">
    <div class="pieza pieza-decision decision-pregunta"><span class="decision-rombo" aria-hidden="true"></span><p class="frase">${escapar(pregunta)}</p></div>
    <a class="pieza pieza-azul" href="${DESCARGA}"><span><span class="camino-titulo">Descargar gratis</span><span class="camino-nota">Para Windows 10 y 11. Pesa ${PESO} y no pide cuenta.</span></span>${FLECHA}</a>
    <a class="pieza pieza-tarea" href="${r}demo/"><span><span class="camino-titulo">Probar sin instalar</span><span class="camino-nota">Abre el editor aquí mismo, en el navegador.</span></span>${FLECHA}</a>
  </div>`;

// "Así se hace en Fluye": las tres pantallas de siempre (dibujar, probar, compartir), para guías e índices.
export const enFluye = (r) => `
  <div class="tablero en-fluye">
    <figure class="pieza en-fluye-editor entra"><img src="${r}imagenes/editor.png" width="1440" height="860" loading="lazy" alt="El editor de Fluye con un proceso de compras en dos carriles y el panel que resume el diagrama."><figcaption><strong>Dibújalo.</strong> Arrastra figuras desde la paleta; las flechas se trazan solas y el panel avisa qué falta.</figcaption></figure>
    <figure class="pieza en-fluye-play entra" style="--i:1"><img src="${r}imagenes/play.png" width="1440" height="860" loading="lazy" alt="El Play de Fluye detenido en la decisión ¿Se aprueba?, con la bitácora del recorrido."><figcaption><strong>Pruébalo.</strong> El Play recorre el proceso y se detiene en cada decisión.</figcaption></figure>
    <figure class="pieza en-fluye-celular entra" style="--i:2"><img src="${r}imagenes/celular.png" width="780" height="1688" loading="lazy" alt="La página web que exporta Fluye, abierta en un celular."><figcaption><strong>Compártelo.</strong> Como página web, PDF o Word.</figcaption></figure>
  </div>`;

// Dirección del visor de Fluye con una plantilla. archivo: ruta del .bpmn desde la raíz del sitio (el visor está en
// visor/, de ahí el ../). Con play, el recorrido parte solo al abrirlo.
export const urlVisor = (r, archivo, titulo, play = true) =>
  `${r}visor/?archivo=${encodeURIComponent('../' + archivo)}&titulo=${encodeURIComponent(titulo)}${play ? '&play=1' : ''}`;

// La vista de un proceso con el botón del Play. Sin JavaScript lleva al visor en su propia página; con JavaScript
// (sitio.js) lo abre a pantalla completa encima de la página.
export const vistaPlay = (r, { archivo, titulo, imagen, alt, clase = '', nota = '', perezosa = true }) => `
  <a class="pieza vista-play ${clase}" href="${escapar(urlVisor(r, archivo, titulo))}" data-play data-titulo="${escapar(titulo)}">
    <img src="${imagen}" alt="${escapar(alt)}" width="1200" height="700"${perezosa ? ' loading="lazy"' : ''}>
    <span class="vista-play-boton">${PLAY}Recorrer con el Play</span>
    ${nota ? `<span class="vista-play-nota chico">${nota}</span>` : ''}
  </a>`;
