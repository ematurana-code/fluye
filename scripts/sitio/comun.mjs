// Lo que comparten todas las páginas del sitio: cabecera, pie, metadatos para buscadores y redes, y utilidades.
// El sitio existe en español (raíz) y en inglés (en/): cada pieza compartida recibe el idioma y saca sus textos de TEXTOS.
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

// Dónde vive cada idioma dentro del sitio.
export const RUTAS = {
  es: { raiz: '', plantillas: 'plantillas/', guias: 'guias/' },
  en: { raiz: 'en/', plantillas: 'en/templates/', guias: 'en/guides/' }
};

// Textos de la cabecera, el pie y las piezas compartidas.
export const TEXTOS = {
  es: {
    lang: 'es', locale: 'es_ES', saltar: 'Ir al contenido', inicio: 'Fluye, inicio', principal: 'Principal',
    plantillas: 'Plantillas', guias: 'Guías', abrirApp: 'Abrir Fluye', codigo: 'Código', descargar: 'Descargar', otroIdioma: 'English',
    otroIdiomaTitulo: 'Fluye in English', estasEn: 'Estás en',
    pie: {
      programa: 'Programa', descargarWindows: 'Descargar para Windows', probarNavegador: 'Usar en el navegador', versiones: 'Versiones anteriores',
      proyecto: 'Proyecto', codigoGithub: 'Código en GitHub', licencia: 'Licencia MIT', problema: 'Reportar un problema',
      frase: 'Programa gratis y de código abierto para hacer diagramas BPMN y de flujo en el navegador o en Windows, en español.',
      final: '© 2026 Esteban Maturana. Licencia MIT. Hecho en Chile. BPMN es un estándar de la OMG.', boton: 'Descargar gratis'
    },
    guiasPie: [['que-es-bpmn/', 'Qué es BPMN'], ['diagrama-de-flujo/', 'Cómo hacer un diagrama de flujo'], ['simbolos-bpmn/', 'Símbolos BPMN'], ['diagrama-de-carriles/', 'Diagrama de carriles']],
    decision: {
      pregunta: '¿Dónde lo vas a usar?', descargar: 'Descargar gratis', descargarNota: `Para Windows 10 y 11. Pesa ${PESO} y no pide cuenta.`,
      probar: 'Usar en el navegador', probarNota: 'Sin instalar ni crear cuenta. Tus archivos quedan en tu computador.'
    },
    enFluye: {
      editorAlt: 'El editor de Fluye con un proceso de compras en dos carriles y el panel que resume el diagrama.',
      editor: '<strong>Dibújalo.</strong> Arrastra figuras desde la paleta; las flechas se trazan solas y el panel avisa qué falta.',
      playAlt: 'El Play de Fluye detenido en la decisión ¿Se aprueba?, con la bitácora del recorrido.',
      play: '<strong>Pruébalo.</strong> El Play recorre el proceso y se detiene en cada decisión.',
      celularAlt: 'La página web que exporta Fluye, abierta en un celular.',
      celular: '<strong>Compártelo.</strong> Como página web, PDF o Word.'
    },
    recorrer: 'Recorrer con el Play'
  },
  en: {
    lang: 'en', locale: 'en_US', saltar: 'Skip to content', inicio: 'Fluye, home', principal: 'Main',
    plantillas: 'Templates', guias: 'Guides', abrirApp: 'Open Fluye', codigo: 'Code', descargar: 'Download', otroIdioma: 'Español',
    otroIdiomaTitulo: 'Fluye en español', estasEn: 'You are here',
    pie: {
      programa: 'Software', descargarWindows: 'Download for Windows', probarNavegador: 'Use it in your browser', versiones: 'Previous versions',
      proyecto: 'Project', codigoGithub: 'Source code on GitHub', licencia: 'MIT license', problema: 'Report an issue',
      frase: 'Free, open-source software for BPMN diagrams and flowcharts, in your browser or on Windows. The interface is in Spanish.',
      final: '© 2026 Esteban Maturana. MIT license. Made in Chile. BPMN is an OMG standard.', boton: 'Download free'
    },
    guiasPie: [['what-is-bpmn/', 'What is BPMN'], ['how-to-make-a-flowchart/', 'How to make a flowchart'], ['bpmn-symbols/', 'BPMN symbols'], ['swimlane-diagram/', 'Swimlane diagram']],
    decision: {
      pregunta: 'Where will you use it?', descargar: 'Download free', descargarNota: `For Windows 10 and 11. ${PESO}, no account needed.`,
      probar: 'Use it in your browser', probarNota: 'Nothing to install, no account. Your files stay on your computer.'
    },
    enFluye: {
      editorAlt: 'The Fluye editor with a two-lane purchasing process and the panel that summarizes the diagram.',
      editor: '<strong>Draw it.</strong> Drag shapes from the palette; arrows route themselves and the panel tells you what is missing.',
      playAlt: 'Fluye\'s Play stopped at a decision, with the run log on the side.',
      play: '<strong>Test it.</strong> Play walks through the process and stops at every decision.',
      celularAlt: 'The web page exported by Fluye, open on a phone.',
      celular: '<strong>Share it.</strong> As a web page, PDF or Word file.'
    },
    recorrer: 'Walk through with Play'
  }
};

export const escapar = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// El logo de Fluye (la ola) en línea, para no depender de una imagen.
export const LOGO = (tam = 30) => `<svg viewBox="0 0 32 32" width="${tam}" height="${tam}" aria-hidden="true" focusable="false"><rect width="32" height="32" rx="8" fill="#1e3a8a"/><path d="M6.5 20.5c3.4 0 4.2-9 8.4-9s5 9 8.4 9" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><circle cx="6.5" cy="20.5" r="2.5" fill="#60a5fa"/><path d="M22.4 16.6 27 20.5l-4.6 3.9z" fill="#fff"/></svg>`;

// Íconos chicos que se repiten: la flecha de las piezas que son enlaces y el triángulo del Play.
export const FLECHA = '<svg class="pieza-flecha" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
export const PLAY = '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 4.5v15l12-7.5z" fill="currentColor"/></svg>';

// El nombre del pie, construido con un bloque por letra (alturas y colores fijos).
const BLOQUES = [['F', '100%', '#ffffff'], ['L', '76%', '#dce6fd'], ['U', '62%', '#3b82f6'], ['Y', '88%', '#93b4f7'], ['E', '70%', '#ffffff']];

const enlacesPie = (r, areas, idioma) => {
  const t = TEXTOS[idioma], p = t.pie, rutas = RUTAS[idioma];
  return `
  <div class="pie-columnas">
    <div>
      <h2>${p.programa}</h2>
      <ul>
        <li><a href="${DESCARGA}">${p.descargarWindows}</a></li>
        <li><a href="${r}app/">${p.probarNavegador}</a></li>
        <li><a href="${VERSIONES}">${p.versiones}</a></li>
      </ul>
    </div>
    <div>
      <h2>${t.plantillas}</h2>
      <ul>${areas.map((a) => `<li><a href="${r}${rutas.plantillas}#${a.ruta}">${escapar(a.nombre)}</a></li>`).join('')}</ul>
    </div>
    <div>
      <h2>${t.guias}</h2>
      <ul>${t.guiasPie.map(([ruta, nombre]) => `<li><a href="${r}${rutas.guias}${ruta}">${nombre}</a></li>`).join('')}</ul>
    </div>
    <div>
      <h2>${p.proyecto}</h2>
      <ul>
        <li><a href="${REPO}">${p.codigoGithub}</a></li>
        <li><a href="${REPO}/blob/main/LICENSE">${p.licencia}</a></li>
        <li><a href="${REPO}/issues">${p.problema}</a></li>
      </ul>
    </div>
    <div>
      <h2>Fluye</h2>
      <p class="pie-frase">${p.frase}</p>
    </div>
  </div>`;
};

/**
 * Página completa. ruta: dirección dentro del sitio ('' para la portada, 'plantillas/', 'en/templates/' ...), que da
 * la profundidad. esquema: objetos JSON-LD (datos estructurados para Google). alternas: { es, en } con la ruta de esta
 * misma página en cada idioma (enlaces hreflang y el cambio de idioma de la barra).
 */
export function pagina({ ruta, titulo, descripcion, cuerpo, esquema = [], indexar = true, imagen = 'og.png', areas = [], clase = '', base = '', idioma = 'es', alternas = null }) {
  const r = '../'.repeat(ruta.split('/').filter(Boolean).length);
  const t = TEXTOS[idioma], rutas = RUTAS[idioma];
  const url = SITIO + ruta;
  const otro = idioma === 'es' ? 'en' : 'es';
  const rutaOtra = alternas ? alternas[otro] : RUTAS[otro].raiz;
  const datos = esquema.map((e) => `<script type="application/ld+json">${JSON.stringify(e).replace(/</g, '\\u003c')}</script>`).join('\n');
  const hreflang = indexar && alternas
    ? `<link rel="alternate" hreflang="es" href="${SITIO}${alternas.es}">\n<link rel="alternate" hreflang="en" href="${SITIO}${alternas.en}">\n<link rel="alternate" hreflang="x-default" href="${SITIO}${alternas.es}">`
    : '';
  return `<!doctype html>
<html lang="${t.lang}">
<head>
<meta charset="utf-8">
${base ? `<base href="${base}">` : ''}
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapar(titulo)}</title>
<meta name="description" content="${escapar(descripcion)}">
${indexar ? `<link rel="canonical" href="${url}">` : '<meta name="robots" content="noindex">'}
${hreflang}
${GOOGLE_VERIFICACION && ruta === '' ? `<meta name="google-site-verification" content="${escapar(GOOGLE_VERIFICACION)}">` : ''}
<meta name="theme-color" content="#1e3a8a">
<meta property="og:type" content="website">
<meta property="og:locale" content="${t.locale}">
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
<a class="saltar" href="#contenido">${t.saltar}</a>
<header class="barra">
  <div class="barra-fila">
    <a class="barra-logo" href="${r}${rutas.raiz}" aria-label="${t.inicio}">${LOGO(34)}</a>
    <div class="barra-enlaces">
      <a class="barra-nombre" href="${r}${rutas.raiz}" translate="no">Fluye</a>
      <nav aria-label="${t.principal}">
        <a href="${r}${rutas.plantillas}">${t.plantillas}</a>
        <a href="${r}${rutas.guias}">${t.guias}</a>
        <a href="${DESCARGA}">${t.descargar}</a>
        <a href="${REPO}">${t.codigo}</a>
        <a class="barra-idioma" href="${r}${rutaOtra}" hreflang="${otro}" lang="${otro}" title="${t.otroIdiomaTitulo}">${t.otroIdioma}</a>
      </nav>
    </div>
    <a class="barra-accion" href="${r}app/">${t.abrirApp}</a>
  </div>
</header>
<main id="contenido">
${cuerpo}
</main>
<footer class="pie">
  <div class="pie-bloques" aria-hidden="true">${BLOQUES.map(([l, alto, color]) => `<span style="--alto:${alto};--fondo-letra:${color}">${l}</span>`).join('')}</div>
  ${enlacesPie(r, areas, idioma)}
  <div class="pie-final">
    <p>${t.pie.final}</p>
    <a class="boton" href="${DESCARGA}">${t.pie.boton}</a>
  </div>
</footer>
<script src="${r}sitio.js" defer></script>
</body>
</html>
`;
}

// Migas de pan visibles y su versión para Google.
export function migas(r, pasos, idioma = 'es') {
  const html = `<nav class="migas" aria-label="${TEXTOS[idioma].estasEn}"><ol>${pasos.map((p, i) => i < pasos.length - 1
    ? `<li><a href="${r}${p.ruta}">${escapar(p.nombre)}</a></li>` : `<li aria-current="page">${escapar(p.nombre)}</li>`).join('')}</ol></nav>`;
  const esquema = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: pasos.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.nombre, item: SITIO + p.ruta }))
  };
  return { html, esquema };
}

// La decisión: un rombo con la pregunta y dos caminos, uno por cada forma de usar Fluye.
export const decision = (r, pregunta, idioma = 'es') => {
  const d = TEXTOS[idioma].decision;
  return `
  <div class="tablero decision-fila">
    <div class="pieza pieza-decision decision-pregunta"><span class="decision-rombo" aria-hidden="true"></span><p class="frase">${escapar(pregunta || d.pregunta)}</p></div>
    <a class="pieza pieza-azul" href="${DESCARGA}"><span><span class="camino-titulo">${d.descargar}</span><span class="camino-nota">${d.descargarNota}</span></span>${FLECHA}</a>
    <a class="pieza pieza-tarea" href="${r}app/"><span><span class="camino-titulo">${d.probar}</span><span class="camino-nota">${d.probarNota}</span></span>${FLECHA}</a>
  </div>`;
};

// "Así se hace en Fluye": las tres pantallas de siempre (dibujar, probar, compartir), para guías e índices.
export const enFluye = (r, idioma = 'es') => {
  const e = TEXTOS[idioma].enFluye;
  return `
  <div class="tablero en-fluye">
    <figure class="pieza en-fluye-editor entra"><img src="${r}imagenes/editor.webp" width="2880" height="1800" loading="lazy" alt="${escapar(e.editorAlt)}"><figcaption>${e.editor}</figcaption></figure>
    <figure class="pieza en-fluye-play entra" style="--i:1"><img src="${r}imagenes/play.webp" width="2880" height="1800" loading="lazy" alt="${escapar(e.playAlt)}"><figcaption>${e.play}</figcaption></figure>
    <figure class="pieza en-fluye-celular entra" style="--i:2"><img src="${r}imagenes/celular.png" width="780" height="1688" loading="lazy" alt="${escapar(e.celularAlt)}"><figcaption>${e.celular}</figcaption></figure>
  </div>`;
};

// Dirección del visor de Fluye con una plantilla. archivo: ruta del .bpmn desde la raíz del sitio (el visor está en
// visor/, de ahí el ../). Con play, el recorrido parte solo al abrirlo.
export const urlVisor = (r, archivo, titulo, play = true) =>
  `${r}visor/?archivo=${encodeURIComponent('../' + archivo)}&titulo=${encodeURIComponent(titulo)}${play ? '&play=1' : ''}`;

// La vista de un proceso con el botón del Play. Sin JavaScript lleva al visor en su propia página; con JavaScript
// (sitio.js) lo abre a pantalla completa encima de la página.
// La imagen va en su propio marco, al formato del diagrama, y el botón en una franja debajo, para que nunca tape el
// diagrama.
export const vistaPlay = (r, { archivo, titulo, imagen, alt, clase = '', nota = '', perezosa = true, idioma = 'es', ancho = 1600, alto = 840 }) => `
  <a class="pieza vista-play ${clase}" href="${escapar(urlVisor(r, archivo, titulo))}" data-play data-titulo="${escapar(titulo)}">
    <span class="vista-play-imagen" data-ui><img src="${imagen}" alt="${escapar(alt)}" width="${ancho}" height="${alto}"${perezosa ? ' loading="lazy"' : ''}></span>
    <span class="vista-play-pie">
      <span class="vista-play-boton">${PLAY}${TEXTOS[idioma].recorrer}</span>
      ${nota ? `<span class="vista-play-nota chico">${nota}</span>` : ''}
    </span>
  </a>`;
