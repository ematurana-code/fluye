// Portada, dirección "el producto en acción": el Play de verdad recorre un proceso en la primera pantalla, al lado de
// qué es Fluye y los dos caminos (abrirlo en el navegador o descargarlo). Después: así se usa (dibuja, dale Play,
// compártelo, cada paso con su pantalla real), dónde usarlo (navegador o Windows), guías, preguntas y cierre.
// Las plantillas se descubren dentro de Fluye, no aquí (así lo pidió el usuario); sus páginas siguen para quien las
// busca en Google. Mismo diseño en los dos idiomas (TX). Notas de diseño: .taste-skill/notas.md.
import { DESCARGA, FLECHA, LOGO, PESO, REPO, RUTAS, SITIO, VERSION, escapar, urlVisor } from './comun.mjs';
import { medidas } from './guias.mjs';

// Logo de Windows (cuatro cuadros) para el botón de descarga.
const WINDOWS = '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 5.5 10.5 4.5v7H3zM12 4.3 21 3v8.5h-9zM3 12.5h7.5v7L3 18.5zM12 12.5h9V21l-9-1.3z" fill="currentColor"/></svg>';
// Flecha de "abrir" para el botón principal.
const ABRIR = '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// Los procesos que el Play del inicio puede recorrer (por id, valen en los dos idiomas).
const PARA_PROBAR = ['compras-simple', 'ti-intermedia', 'rrhh-avanzada'];

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
    // El título en dos líneas, cada una sube desde su propia línea base al cargar.
    h1: ['Diagramas BPMN', 'que se recorren con Play'],
    bajada: 'Fluye dibuja tus procesos con el estándar BPMN y los recorre paso a paso, para que veas por dónde sigue cada caso antes de ponerlo en marcha.',
    abrir: 'Abrir Fluye', descargar: 'Descargar para Windows',
    nota: 'Gratis y de código abierto. Sin cuenta: tus archivos quedan en tu computador.',
    visorDe: (n) => `Visor de Fluye: ${n}`, procesos: 'Procesos para recorrer', pista: 'Está andando: en cada decisión, elige tú el camino.',
    pantalla: 'Pantalla completa',
    usoTitulo: 'Así se usa Fluye',
    uso: [
      ['Primero, dibuja el proceso.', 'Arrastra pasos, decisiones y responsables desde la paleta. Las flechas se trazan solas y el panel te avisa lo que falta.',
        'El editor de Fluye: la paleta de figuras, un proceso de compras en dos carriles y el panel que resume el diagrama.'],
      ['Luego, dale Play.', 'La ficha recorre el proceso y se detiene en cada decisión para que elijas el camino. Si un camino no llega a un final, te lo muestra.',
        'El Play detenido en la decisión ¿Se aprueba?, con los dos caminos para elegir.'],
      ['Al final, compártelo.', 'Expórtalo como una página web con el Play adentro, que se abre hasta en el celular, o a PDF, Word e imagen.',
        'La página web que exporta Fluye, abierta en un celular con el Play en una decisión.']
    ],
    formatos: [['Página web', 'con el Play, en un solo archivo'], ['PDF', 'una hoja A4 lista para imprimir'], ['Word', 'portada, diagrama y ficha de cada paso'], ['PNG y SVG', 'para presentaciones y documentos'], ['BPMN', 'el estándar que abren otros programas']],
    dondeTitulo: 'Elige dónde usarlo',
    dondeTexto: 'Es el mismo editor y los mismos archivos: lo que empiezas en uno lo terminas en el otro.',
    navegador: ['En el navegador', ['Sin instalar ni crear cuenta.', 'En Chrome y Edge guarda en tus carpetas, sobre el mismo archivo.', 'Se instala como app y funciona sin internet.', 'Si cierras sin guardar, lo recupera.']],
    windows: ['En Windows', [`Programa para Windows 10 y 11 (${PESO}).`, 'Abre tus .bpmn con doble clic.', 'Exporta el PDF directo, sin ventana de impresión.', 'Corrector ortográfico en español sin internet.']],
    guiasTitulo: 'Aprende a dibujar procesos',
    guias: [['que-es-bpmn/', 'Qué es BPMN', 'El estándar para dibujar procesos: de dónde viene, sus figuras y cuándo conviene usarlo.', 'solicitud-de-vacaciones'],
      ['diagrama-de-flujo/', 'Cómo hacer un diagrama de flujo', 'Siete pasos, del primer borrador al proceso que se entiende a la primera.', 'solicitud-de-compra'],
      ['simbolos-bpmn/', 'Símbolos BPMN', 'Qué significa cada figura, con su dibujo.', 'inicio-de-sesion-con-bloqueo-por-intentos'],
      ['diagrama-de-carriles/', 'Diagrama de carriles', 'Cómo mostrar quién hace cada paso y dónde el trabajo cambia de manos.', 'ticket-de-mesa-de-ayuda']],
    ejemploDe: (g) => `Diagrama de ejemplo de la guía: ${g}`,
    preguntasTitulo: 'Preguntas frecuentes',
    preguntasTexto: `Si te queda otra duda, escríbela en el <a href="${REPO}/issues">repositorio de GitHub</a>.`,
    cierreTitulo: 'Tu próximo proceso empieza aquí',
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
    h1: ['BPMN diagrams', 'you can play step by step'],
    bajada: 'Fluye draws your processes with the BPMN standard and walks through them step by step, so you see where each case goes before you put it to work. The interface is in Spanish.',
    abrir: 'Open Fluye', descargar: 'Download for Windows',
    nota: 'Free and open source. No account: your files stay on your computer.',
    visorDe: (n) => `Fluye viewer: ${n}`, procesos: 'Processes to walk through', pista: 'It is running: at each decision, you choose the path.',
    pantalla: 'Full screen',
    usoTitulo: 'How to use Fluye',
    uso: [
      ['First, draw the process.', 'Drag steps, decisions and roles from the palette. Arrows route themselves and the panel tells you what is missing.',
        'The Fluye editor: the shape palette, a two-lane purchasing process and the panel that summarizes the diagram.'],
      ['Then, press Play.', 'A token walks through the process and stops at each decision so you choose the path. If a path never reaches an end, it shows you.',
        'Play stopped at the decision Approved?, with both paths to choose from.'],
      ['Finally, share it.', 'Export it as a web page with Play inside that opens even on a phone, or to PDF, Word and images.',
        'The web page Fluye exports, open on a phone with Play at a decision.']
    ],
    formatos: [['Web page', 'with Play, in a single file'], ['PDF', 'an A4 sheet ready to print'], ['Word', 'cover, diagram and a sheet per step'], ['PNG and SVG', 'for slides and documents'], ['BPMN', 'the standard other tools open']],
    dondeTitulo: 'Choose where to use it',
    dondeTexto: 'Same editor, same files: what you start in one you can finish in the other.',
    navegador: ['In your browser', ['Nothing to install, no account.', 'In Chrome and Edge it saves to your folders, over the same file.', 'Installs as an app and works offline.', 'If you close without saving, it recovers your work.']],
    windows: ['On Windows', [`Program for Windows 10 and 11 (${PESO}).`, 'Opens your .bpmn files with a double click.', 'Exports PDF directly, no print dialog.', 'Spanish spell checker, offline.']],
    guiasTitulo: 'Learn to draw processes',
    guias: [['what-is-bpmn/', 'What is BPMN', 'The standard for drawing processes: where it comes from, its shapes and when to use it.', 'vacation-request'],
      ['how-to-make-a-flowchart/', 'How to make a flowchart', 'Seven steps from first draft to a process people understand at first glance.', 'purchase-request'],
      ['bpmn-symbols/', 'BPMN symbols', 'What every shape means, with its drawing.', 'login-with-lockout-after-failed-attempts'],
      ['swimlane-diagram/', 'Swimlane diagram', 'How to show who does each step and where work changes hands.', 'help-desk-ticket']],
    ejemploDe: (g) => `Example diagram for the guide: ${g}`,
    preguntasTitulo: 'Frequently asked questions',
    preguntasTexto: `Still have a question? Ask it in the <a href="${REPO}/issues">GitHub repository</a>.`,
    cierreTitulo: 'Your next process starts here',
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

// Capturas reales del programa para "Así se usa", cada una recortada en lo que muestra su paso.
const PANTALLAS = [
  { src: 'editor.webp', ancho: 2880, alto: 1800, clase: 'uso-editor' },
  { src: 'play.webp', ancho: 2880, alto: 1800, clase: 'uso-play' },
  { src: 'celular.png', ancho: 780, alto: 1688, clase: 'uso-celular' }
];

export function portada({ plantillas, idioma = 'es' }) {
  const t = TX[idioma], rutas = RUTAS[idioma];
  const ruta = rutas.raiz;
  const r = '../'.repeat(ruta.split('/').filter(Boolean).length);
  const probar = PARA_PROBAR.map((id) => plantillas.find((p) => p.id === id)).filter(Boolean);
  const archivo = (p) => `${rutas.plantillas}${p.ruta}/${p.ruta}.bpmn`;
  const visor = (p) => urlVisor(r, archivo(p), p.nombre, true);
  const primera = probar[0];
  const lista = (items) => `<ul class="lista-hecha">${items.map((x) => `<li>${x}</li>`).join('')}</ul>`;

  const cuerpo = `
<section class="escena" aria-labelledby="titulo" data-prueba>
  <div class="escena-texto">
    <span class="escena-logo">${LOGO(56)}</span>
    <h1 id="titulo" class="titulo-mascara">${t.h1.map((l) => `<span class="linea"><span>${l}</span></span>`).join(' ')}</h1>
    <p class="escena-bajada">${t.bajada}</p>
    <div class="escena-acciones">
      <a class="boton boton-grande boton-claro" href="${r}app/">${ABRIR}${t.abrir}</a>
      <a class="boton boton-grande" href="${DESCARGA}">${WINDOWS}${t.descargar}</a>
    </div>
    <p class="escena-nota">${t.nota}</p>
  </div>
  <div class="escena-visor">
    <div class="visor-marco" data-ui>
      <nav class="visor-pestanas" aria-label="${t.procesos}">
        ${probar.map((p, i) => `<a href="${escapar(visor(p))}" data-visor data-titulo="${escapar(p.nombre)}"${i === 0 ? ' aria-current="true"' : ''}>${escapar(p.nombre)}</a>`).join('\n        ')}
        <button type="button" class="visor-pantalla" data-pantalla-completa hidden aria-label="${t.pantalla}" title="${t.pantalla}"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      </nav>
      <iframe src="${escapar(visor(primera))}" title="${escapar(t.visorDe(primera.nombre))}" allow="fullscreen" allowfullscreen></iframe>
    </div>
    <p class="escena-pista">${t.pista}</p>
  </div>
</section>

<section class="uso" aria-labelledby="uso-titulo">
  <h2 id="uso-titulo" class="entra">${t.usoTitulo}</h2>
  <ol class="uso-pasos">
    ${t.uso.map(([frase, texto, alt], i) => {
      const f = PANTALLAS[i];
      const pantalla = `<figure class="uso-pantalla ${f.clase}" data-ui><img src="${r}imagenes/${f.src}" width="${f.ancho}" height="${f.alto}" loading="lazy" alt="${escapar(alt)}"></figure>`;
      const salida = i === 2
        ? `<div class="uso-salida uso-final">${pantalla}<ul class="uso-formatos">${t.formatos.map(([n, d]) => `<li><strong>${n}</strong><span>${d}</span></li>`).join('')}</ul></div>`
        : `<div class="uso-salida">${pantalla}</div>`;
      return `<li class="uso-paso entra">
      <p class="uso-frase">${frase}</p>
      <p class="uso-llamado">${texto}</p>
      ${salida}
    </li>`;
    }).join('\n    ')}
  </ol>
</section>

<section class="donde" aria-labelledby="donde-titulo">
  <div class="cabeza entra">
    <h2 id="donde-titulo">${t.dondeTitulo}</h2>
    <p>${t.dondeTexto}</p>
  </div>
  <div class="tablero donde-tablero">
    <div class="pieza pieza-hondo donde-opcion entra">
      <h3>${t.navegador[0]}</h3>
      ${lista(t.navegador[1])}
      <a class="boton boton-claro" href="${r}app/">${ABRIR}${t.abrir}</a>
    </div>
    <div class="pieza pieza-tarea donde-opcion entra" style="--i:1">
      <h3>${t.windows[0]}</h3>
      ${lista(t.windows[1])}
      <a class="boton" href="${DESCARGA}">${WINDOWS}${t.descargar}</a>
    </div>
  </div>
</section>

<section class="aprende" aria-labelledby="guias-titulo">
  <h2 id="guias-titulo" class="entra">${t.guiasTitulo}</h2>
  <ul class="aprende-lista">
    ${t.guias.map(([destino, titulo, texto, ejemplo], i) => `<li class="entra" style="--i:${i}"><a href="${r}${rutas.guias}${destino}"><span class="aprende-imagen"><img src="${r}${rutas.plantillas}${ejemplo}/vista.png" ${medidas(ejemplo, idioma)} loading="lazy" alt="${escapar(t.ejemploDe(titulo))}"></span><span class="aprende-texto"><strong>${titulo}</strong><span>${texto}</span></span>${FLECHA}</a></li>`).join('\n    ')}
  </ul>
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

<section class="final" aria-labelledby="final-titulo">
  <h2 id="final-titulo" class="entra">${t.cierreTitulo}</h2>
  <div class="final-acciones entra" style="--i:1">
    <a class="boton boton-grande boton-claro" href="${r}app/">${ABRIR}${t.abrir}</a>
    <a class="boton boton-grande" href="${DESCARGA}">${WINDOWS}${t.descargar}</a>
  </div>
  <p class="final-codigo entra" style="--i:2">${t.codigo}</p>
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
