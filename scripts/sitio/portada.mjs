// Portada: lo primero es usar Fluye (abrirlo en el navegador o descargarlo); después, probar el Play en el visor real,
// las guías, las preguntas frecuentes y el cierre. Las plantillas se descubren dentro de Fluye, no aquí (así lo pidió el
// usuario); sus páginas siguen para quien las busca en Google. Mismo diseño en los dos idiomas (TX).
import { DESCARGA, FLECHA, PESO, REPO, RUTAS, SITIO, VERSION, escapar, urlVisor } from './comun.mjs';
import { SIMBOLOS, medidas } from './guias.mjs';

// Logo de Windows (cuatro cuadros) para el botón de descarga.
const WINDOWS = '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 5.5 10.5 4.5v7H3zM12 4.3 21 3v8.5h-9zM3 12.5h7.5v7L3 18.5zM12 12.5h9V21l-9-1.3z" fill="currentColor"/></svg>';
// Flecha de "abrir" para el botón principal.
const ABRIR = '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// Color y lugar de cada tarjeta de guía (los mismos del índice de guías).
const CLASES_GUIA = [' pieza-tarea guia-bpmn', ' guia-flujo', ' guia-simbolos', ' pieza-2 guia-carriles'];

// Las plantillas que se pueden cargar en el visor de la portada (por id, valen en los dos idiomas).
const PARA_PROBAR = ['compras-simple', 'ti-intermedia', 'web-intermedia', 'atencion-intermedia', 'aduana-intermedia', 'rrhh-avanzada'];

const TX = {
  es: {
    preguntas: [
      ['¿Qué programa uso para hacer diagramas BPMN gratis?', 'Fluye es un programa gratis y de código abierto para hacer diagramas BPMN 2.0, en español. Dibuja pools, carriles, tareas, decisiones y eventos, revisa que el diagrama esté completo y lo recorre paso a paso con un Play. Se usa en el navegador, sin instalar, o como programa para Windows.'],
      ['¿Fluye es gratis?', 'Sí. Es gratis para siempre y de código abierto con licencia MIT: puedes usarlo en tu casa, en tu empresa o en clases, sin cuenta, sin anuncios y sin límite de diagramas.'],
      ['¿Dónde quedan mis diagramas si lo uso en el navegador?', 'En tu computador. Guardas archivos .bpmn donde quieras y Fluye no los sube a ningún servidor. En Chrome y Edge, Guardar escribe sobre el mismo archivo; mientras trabajas, Fluye deja además una copia de respaldo en el navegador por si cierras la pestaña sin guardar.'],
      ['¿Funciona sin internet?', 'Sí. El programa para Windows trabaja sin conexión, y la versión web, una vez abierta, también: se puede instalar desde Chrome o Edge como una app más. Incluso el corrector ortográfico en español funciona sin internet.'],
      ['¿Funciona en Mac o Linux?', 'Sí, en el navegador: Fluye funciona en Chrome, Edge, Firefox o Safari en cualquier sistema. El programa que se instala es para Windows 10 y 11.'],
      ['¿Qué es BPMN?', 'Es el estándar internacional para dibujar procesos (Business Process Model and Notation, de la OMG). Usa pocas figuras: círculos para el inicio y el fin, rectángulos para las tareas, rombos para las decisiones y franjas para los responsables.'],
      ['¿Sirve para diagramas de flujo comunes?', 'Sí. Un diagrama de flujo con inicio, pasos, decisiones y fin se dibuja con las mismas figuras de BPMN. Si además quieres mostrar quién hace cada paso, le agregas carriles.'],
      ['¿Abre archivos de otros programas de procesos?', 'Sí. Fluye abre y guarda archivos .bpmn estándar, también los que exportan otras herramientas de modelado (con sus colores), y puede juntar varios archivos en un proyecto con pestañas.'],
      ['¿Cómo comparto un diagrama con alguien que no tiene Fluye?', 'Exporta una página web interactiva: es un solo archivo .html que se abre en cualquier navegador, incluso en el celular, y trae el Play adentro. También puedes exportar a PDF, Word, PNG o SVG.']
    ],
    h1: 'Diagramas BPMN y de flujo, gratis',
    bajada: 'Dibuja procesos con el estándar BPMN 2.0 y recórrelos paso a paso con el Play. Úsalo ahora en el navegador o instálalo en Windows.',
    playAlt: 'El Play detenido en la decisión ¿Se aprueba?, que pregunta por qué camino sigue el proceso.',
    abrir: 'Abrir Fluye', descargar: 'Descargar para Windows',
    nota: `Sin cuenta y sin anuncios. Tus archivos quedan en tu computador. El programa para Windows 10 y 11 pesa ${PESO}.`,
    hechosEtiqueta: 'Fluye en cuatro datos',
    hechos: [
      ['Gratis y de código abierto', 'Licencia MIT, sin planes de pago ni anuncios.', 'inicio'],
      ['En el navegador o en Windows', 'El mismo editor, con o sin instalar.', 'tarea'],
      ['Estándar BPMN 2.0', 'Archivos .bpmn que abren otros programas.', 'exclusiva'],
      ['Play paso a paso', 'Recorre el proceso y avisa dónde se atasca.', 'fin']
    ],
    pruebaTitulo: 'Pruébalo aquí: dale Play',
    pruebaTexto: 'El visor real de Fluye. Pulsa Play y, en cada decisión, elige por dónde sigue el proceso.',
    visorDe: (n) => `Visor de Fluye: ${n}`, elige: 'Elige un proceso', nivelDe: (p) => `${p.categoria}, nivel ${p.nivelNombre.toLowerCase()}`,
    pantalla: 'Pantalla completa', pestana: 'Abrir en otra pestaña',
    guiasTitulo: 'Aprende a dibujar procesos',
    guiasTexto: 'Guías cortas en español, con ejemplos que puedes recorrer con el Play.',
    // Cada guía con el diagrama de su ejemplo (la misma vista que en el índice de guías).
    guias: [['que-es-bpmn/', 'Qué es BPMN', 'El estándar para dibujar procesos: de dónde viene, sus figuras y cuándo conviene usarlo.', 'solicitud-de-vacaciones'],
      ['diagrama-de-flujo/', 'Cómo hacer un diagrama de flujo', 'Siete pasos, del primer borrador al proceso que se entiende a la primera.', 'solicitud-de-compra'],
      ['simbolos-bpmn/', 'Símbolos BPMN', 'Qué significa cada figura, con su dibujo.', 'inicio-de-sesion-con-bloqueo-por-intentos'],
      ['diagrama-de-carriles/', 'Diagrama de carriles', 'Cómo mostrar quién hace cada paso y dónde el trabajo cambia de manos.', 'ticket-de-mesa-de-ayuda']],
    ejemploDe: (g) => `Diagrama de ejemplo de la guía: ${g}`,
    preguntasTitulo: 'Preguntas frecuentes',
    preguntasTexto: `Si te queda otra duda, escríbela en el <a href="${REPO}/issues">repositorio de GitHub</a>.`,
    celularNota: 'Así se ve en un celular la página que exporta Fluye, con el Play.',
    celularAlt: 'La página web que exporta Fluye, abierta en un celular con el Play detenido en una decisión.',
    cierreTitulo: 'Ordena tu próximo proceso',
    cierreTexto: 'Ábrelo ahora en el navegador o descárgalo para Windows. Cuando lo termines, compártelo como una página web que se abre hasta en el celular.',
    codigo: `Fluye es de código abierto, con licencia MIT, y lo hace Esteban Maturana en Chile. <a href="${REPO}">Ver el código en GitHub</a>.`,
    app: {
      alternateName: ['Fluye BPMN', 'Fluye, modelador BPMN'], sub: 'Modelado de procesos BPMN y diagramas de flujo',
      descripcion: 'Programa gratis y de código abierto para hacer diagramas BPMN 2.0 y diagramas de flujo en el navegador o en Windows, en español, con un Play que recorre el proceso paso a paso.',
      keywords: 'diagramas BPMN, BPMN 2.0, modelador BPMN, BPMN online, programa para diagramas de flujo, diagrama de carriles, modelado de procesos, gratis, español',
      features: 'Diagramas BPMN 2.0, diagramas de flujo, diagramas de carriles, Play paso a paso, revisión del diagrama, 33 plantillas, exportar a PDF, Word, PNG, SVG y página web interactiva, corrector en español, versión web instalable, sin internet'
    },
    titulo: 'Fluye: programa gratis para hacer diagramas BPMN y de flujo',
    descripcion: 'Programa gratis para hacer diagramas BPMN y de flujo, en el navegador o en Windows. Recórrelos con el Play, usa 33 plantillas y exporta a PDF o Word.'
  },
  en: {
    preguntas: [
      ['What free software can I use to make BPMN diagrams?', 'Fluye is free, open-source software for BPMN 2.0 diagrams. It draws pools, lanes, tasks, gateways and events, checks that the diagram is complete and walks through it step by step with Play. Use it in your browser with nothing to install, or as a Windows program.'],
      ['Is Fluye really free?', 'Yes. It is free forever and open source under the MIT license: use it at home, at work or in class, with no account, no ads and no diagram limits.'],
      ['Where are my diagrams stored when I use it in the browser?', 'On your computer. You save .bpmn files wherever you like and Fluye never uploads them to a server. In Chrome and Edge, Save writes over the same file; while you work, Fluye also keeps a backup copy in the browser in case you close the tab without saving.'],
      ['Is the program in English?', 'The website, guides and templates are in English, but the program interface is in Spanish for now. The BPMN shapes are the same in every language, and the .bpmn files you create open in any BPMN tool.'],
      ['Does it work offline?', 'Yes. The Windows program works without a connection, and so does the web version once it has loaded: Chrome and Edge can install it as an app.'],
      ['Does it work on Mac or Linux?', 'Yes, in the browser: Fluye runs in Chrome, Edge, Firefox or Safari on any system. The installable program is for Windows 10 and 11.'],
      ['What is BPMN?', 'Business Process Model and Notation, the international standard for drawing processes, maintained by the OMG. It uses a few shapes: circles for start and end events, rounded rectangles for tasks, diamonds for decisions and lanes for roles.'],
      ['Can I use it for simple flowcharts?', 'Yes. A flowchart with a start, steps, decisions and an end is drawn with the same BPMN shapes. Add lanes when you also want to show who does each step.'],
      ['How do I share a diagram with someone who does not have Fluye?', 'Export an interactive web page: a single .html file that opens in any browser, even on a phone, with Play built in. You can also export to PDF, Word, PNG or SVG.']
    ],
    h1: 'Free BPMN and flowchart software',
    bajada: 'Draw processes with the BPMN 2.0 standard and walk through them step by step with Play. Use it now in your browser or install it on Windows. The interface is in Spanish.',
    playAlt: 'Play stopped at a decision, asking which way the process goes next.',
    abrir: 'Open Fluye', descargar: 'Download for Windows',
    nota: `No account, no ads. Your files stay on your computer. The Windows 10 and 11 program is ${PESO}.`,
    hechosEtiqueta: 'Fluye in four facts',
    hechos: [
      ['Free and open source', 'MIT license, no paid plans, no ads.', 'inicio'],
      ['In your browser or on Windows', 'The same editor, installed or not.', 'tarea'],
      ['BPMN 2.0 standard', '.bpmn files that open in other tools.', 'exclusiva'],
      ['Step-by-step Play', 'Walks through the process and flags where it gets stuck.', 'fin']
    ],
    pruebaTitulo: 'Try it here: press Play',
    pruebaTexto: 'The real Fluye viewer. Press Play and choose the path at each decision. The viewer labels are in Spanish.',
    visorDe: (n) => `Fluye viewer: ${n}`, elige: 'Choose a process', nivelDe: (p) => `${p.categoria}, ${p.nivelNombre.toLowerCase()}`,
    pantalla: 'Full screen', pestana: 'Open in a new tab',
    guiasTitulo: 'Learn to draw processes',
    guiasTexto: 'Short guides with examples you can walk through with Play.',
    guias: [['what-is-bpmn/', 'What is BPMN', 'The standard for drawing processes: where it comes from, its shapes and when to use it.', 'vacation-request'],
      ['how-to-make-a-flowchart/', 'How to make a flowchart', 'Seven steps from first draft to a process people understand at first glance.', 'purchase-request'],
      ['bpmn-symbols/', 'BPMN symbols', 'What every shape means, with its drawing.', 'login-with-lockout-after-failed-attempts'],
      ['swimlane-diagram/', 'Swimlane diagram', 'How to show who does each step and where work changes hands.', 'help-desk-ticket']],
    ejemploDe: (g) => `Example diagram for the guide: ${g}`,
    preguntasTitulo: 'Frequently asked questions',
    preguntasTexto: `Still have a question? Ask it in the <a href="${REPO}/issues">GitHub repository</a>.`,
    celularNota: 'The page Fluye exports, open on a phone with Play.',
    celularAlt: 'The web page exported by Fluye, open on a phone with Play stopped at a decision.',
    cierreTitulo: 'Map your next process',
    cierreTexto: 'Open it now in your browser or download it for Windows. When you are done, share it as a web page that opens even on a phone.',
    codigo: `Fluye is open source under the MIT license, made by Esteban Maturana in Chile. <a href="${REPO}">View the code on GitHub</a>.`,
    app: {
      alternateName: ['Fluye BPMN', 'Fluye BPMN modeler'], sub: 'BPMN process modeling and flowcharts',
      descripcion: 'Free, open-source software for BPMN 2.0 diagrams and flowcharts, in your browser or on Windows, with a Play button that walks through the process step by step. Interface in Spanish.',
      keywords: 'BPMN software, free BPMN modeler, online BPMN editor, BPMN 2.0, flowchart maker, swimlane diagram, process modeling, open source',
      features: 'BPMN 2.0 diagrams, flowcharts, swimlane diagrams, step-by-step Play, diagram checks, 33 templates, export to PDF, Word, PNG, SVG and interactive web page, installable web app, offline'
    },
    titulo: 'Fluye: free BPMN modeler and flowchart software',
    descripcion: 'Free, open-source BPMN and flowchart software, in your browser or on Windows. Walk through processes with Play, start from 33 templates, export to PDF or Word.'
  }
};

export function portada({ plantillas, idioma = 'es' }) {
  const t = TX[idioma], rutas = RUTAS[idioma];
  const ruta = rutas.raiz;
  const r = '../'.repeat(ruta.split('/').filter(Boolean).length);
  const probar = PARA_PROBAR.map((id) => plantillas.find((p) => p.id === id)).filter(Boolean);
  const archivo = (p) => `${rutas.plantillas}${p.ruta}/${p.ruta}.bpmn`;
  const primera = probar[0];

  const cuerpo = `
<section class="tablero portada" aria-labelledby="titulo">
  <div class="pieza portada-texto entra">
    <div>
      <h1 id="titulo">${t.h1}</h1>
      <p class="bajada">${t.bajada}</p>
    </div>
    <div class="portada-acciones">
      <div class="portada-botones">
        <a class="boton boton-grande" href="${r}app/">${ABRIR}${t.abrir}</a>
        <a class="boton boton-grande boton-tarea" href="${DESCARGA}">${WINDOWS}${t.descargar}</a>
      </div>
      <p class="chico suave">${t.nota}</p>
    </div>
  </div>
  <figure class="pieza pieza-foto portada-foto obturador">
    <img src="${r}imagenes/play.webp" width="2880" height="1800" alt="${escapar(t.playAlt)}" fetchpriority="high">
  </figure>
</section>

<section class="pieza franja-datos entra" aria-label="${t.hechosEtiqueta}">
  ${t.hechos.map(([titulo, texto, simbolo]) => `<p class="dato-clave">${SIMBOLOS[simbolo]}<span><strong>${titulo}</strong>${texto}</span></p>`).join('\n  ')}
</section>

<section class="prueba" aria-labelledby="prueba-titulo">
  <div class="cabeza entra">
    <h2 id="prueba-titulo">${t.pruebaTitulo}</h2>
    <p>${t.pruebaTexto}</p>
  </div>
  <div class="tablero prueba-panel" data-prueba>
    <div class="pieza prueba-visor" data-ui>
      <iframe src="${escapar(urlVisor(r, archivo(primera), primera.nombre, false))}" title="${escapar(t.visorDe(primera.nombre))}" loading="lazy" allow="fullscreen" allowfullscreen></iframe>
    </div>
    <div class="pieza prueba-mando">
      <h3 id="prueba-elige">${t.elige}</h3>
      <ul class="prueba-lista" aria-labelledby="prueba-elige">
        ${probar.map((p, i) => `<li><a href="${escapar(urlVisor(r, archivo(p), p.nombre, false))}" data-visor data-titulo="${escapar(p.nombre)}"${i === 0 ? ' aria-current="true"' : ''}>${escapar(p.nombre)}<span>${escapar(t.nivelDe(p))}</span></a></li>`).join('\n        ')}
      </ul>
      <div class="prueba-botones">
        <button type="button" class="boton" data-pantalla-completa hidden><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>${t.pantalla}</button>
        <a class="boton boton-tarea" href="${escapar(urlVisor(r, archivo(primera), primera.nombre, false))}" target="_blank" rel="noopener" data-pestana>${t.pestana}</a>
      </div>
    </div>
  </div>
</section>

<section class="guias-portada" aria-labelledby="guias-titulo">
  <div class="cabeza entra">
    <h2 id="guias-titulo">${t.guiasTitulo}</h2>
    <p>${t.guiasTexto}</p>
  </div>
  <div class="tablero guias-tablero">
    ${t.guias.map(([destino, titulo, texto, ejemplo], i) => `<a class="pieza${CLASES_GUIA[i]} entra"${i % 2 ? ' style="--i:1"' : ''} href="${r}${rutas.guias}${destino}"><span class="guia-imagen"><img src="${r}${rutas.plantillas}${ejemplo}/vista.png" ${medidas(ejemplo, idioma)} loading="lazy" alt="${escapar(t.ejemploDe(titulo))}"></span><span class="guia-texto"><span class="camino-titulo">${titulo}</span><p>${texto}</p></span>${FLECHA}</a>`).join('\n    ')}
  </div>
</section>

<section class="preguntas" aria-labelledby="preguntas-titulo">
  <div class="cabeza entra">
    <h2 id="preguntas-titulo">${t.preguntasTitulo}</h2>
    <p>${t.preguntasTexto}</p>
  </div>
  <div class="tablero preguntas-tablero" data-preguntas>
    <div class="pieza preguntas-indice">
      ${t.preguntas.map(([p, rta], i) => `<div class="pregunta${i === 0 ? ' abierta' : ''}"><h3><button type="button" class="pregunta-boton" id="pregunta-${i}" aria-expanded="${i === 0}" aria-controls="respuesta-${i}">${escapar(p)}</button></h3><div class="respuesta" id="respuesta-${i}" role="region" aria-labelledby="pregunta-${i}"><p>${escapar(rta)}</p></div></div>`).join('\n      ')}
    </div>
    <div class="pieza pieza-tarea preguntas-panel" aria-live="polite">
      <p class="pregunta-titulo">${escapar(t.preguntas[0][0])}</p>
      <p class="pregunta-texto">${escapar(t.preguntas[0][1])}</p>
    </div>
  </div>
</section>

<section class="tablero cierre" aria-labelledby="cierre-titulo">
  <div class="pieza pieza-azul cierre-centro entra">
    <h2 id="cierre-titulo">${t.cierreTitulo}</h2>
    <p>${t.cierreTexto}</p>
    <div class="cierre-botones">
      <a class="boton boton-claro" href="${r}app/">${ABRIR}${t.abrir}</a>
      <a class="boton boton-tarea" href="${DESCARGA}">${WINDOWS}${t.descargar}</a>
    </div>
    <p class="chico cierre-codigo">${t.codigo}</p>
  </div>
  <figure class="pieza pieza-decision cierre-celular entra" style="--i:1">
    <figcaption>${t.celularNota}</figcaption>
    <img src="${r}imagenes/celular.png" width="780" height="1688" loading="lazy" alt="${escapar(t.celularAlt)}">
  </figure>
</section>`;

  const url = SITIO + ruta;
  const esquema = [
    {
      '@context': 'https://schema.org', '@type': 'SoftwareApplication',
      name: 'Fluye', alternateName: t.app.alternateName, url,
      applicationCategory: 'BusinessApplication', applicationSubCategory: t.app.sub,
      operatingSystem: 'Windows 10, Windows 11, Web', browserRequirements: 'Chrome, Edge, Firefox o Safari recientes',
      softwareVersion: VERSION, inLanguage: 'es', isAccessibleForFree: true,
      license: 'https://opensource.org/licenses/MIT', downloadUrl: DESCARGA, installUrl: `${SITIO}app/`, fileSize: PESO,
      screenshot: [`${SITIO}imagenes/editor.webp`, `${SITIO}imagenes/play.webp`], codeRepository: REPO,
      image: `${SITIO}imagenes/icono.png`, sameAs: [REPO], datePublished: '2026-10-22', releaseNotes: `${REPO}/releases`,
      description: t.app.descripcion, keywords: t.app.keywords, featureList: t.app.features,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      author: { '@type': 'Person', name: 'Esteban Maturana', url: 'https://github.com/ematurana-code' }
    },
    {
      '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: idioma,
      mainEntity: t.preguntas.map(([p, rta]) => ({ '@type': 'Question', name: p, acceptedAnswer: { '@type': 'Answer', text: rta } }))
    },
    { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Fluye', url, inLanguage: idioma, publisher: { '@type': 'Person', name: 'Esteban Maturana', url: 'https://github.com/ematurana-code' } }
  ];

  return {
    ruta, idioma, alternas: { es: RUTAS.es.raiz, en: RUTAS.en.raiz },
    titulo: t.titulo, descripcion: t.descripcion,
    cuerpo, esquema, clase: 'es-portada'
  };
}
