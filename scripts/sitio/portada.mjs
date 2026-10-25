// Portada: un tablero que dice qué es Fluye y muestra sus pantallas; el proceso de trabajar con Fluye dibujado como
// diagrama de carriles (con una ficha que avanza al bajar); el visor real para probar el Play; lo que trae; las 33
// plantillas; código abierto; guías; preguntas frecuentes y la descarga. Mismo diseño en los dos idiomas (TX).
import { DESCARGA, FLECHA, PESO, REPO, RUTAS, SITIO, VERSION, escapar, urlVisor } from './comun.mjs';
import { catalogo } from './plantillas.mjs';
import { SIMBOLOS } from './guias.mjs';

// Logo de Windows (cuatro cuadros) para el botón de descarga.
const WINDOWS = '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 5.5 10.5 4.5v7H3zM12 4.3 21 3v8.5h-9zM3 12.5h7.5v7L3 18.5zM12 12.5h9V21l-9-1.3z" fill="currentColor"/></svg>';

// Las plantillas que se pueden cargar en el visor de la portada (por id, valen en los dos idiomas).
const PARA_PROBAR = ['compras-simple', 'ti-intermedia', 'web-intermedia', 'atencion-intermedia', 'aduana-intermedia', 'rrhh-avanzada'];

const TX = {
  es: {
    preguntas: [
      ['¿Qué programa uso para hacer diagramas BPMN gratis?', 'Fluye es un programa gratis y de código abierto para hacer diagramas BPMN 2.0 en Windows, en español. Dibuja pools, carriles, tareas, decisiones y eventos, revisa que el diagrama esté completo y lo recorre paso a paso con un Play. También puedes probarlo sin instalar, en el navegador.'],
      ['¿Fluye es gratis?', 'Sí. Es gratis para siempre y de código abierto con licencia MIT: puedes usarlo en tu casa, en tu empresa o en clases, sin cuenta, sin anuncios y sin límite de diagramas.'],
      ['¿Funciona sin internet?', 'Sí. Fluye se instala en Windows y trabaja sin conexión: los diagramas quedan en tu computador como archivos .bpmn. Incluso el corrector ortográfico en español funciona sin internet.'],
      ['¿Qué es BPMN?', 'Es el estándar internacional para dibujar procesos (Business Process Model and Notation, de la OMG). Usa pocas figuras: círculos para el inicio y el fin, rectángulos para las tareas, rombos para las decisiones y franjas para los responsables.'],
      ['¿Sirve para diagramas de flujo comunes?', 'Sí. Un diagrama de flujo con inicio, pasos, decisiones y fin se dibuja con las mismas figuras de BPMN. Si además quieres mostrar quién hace cada paso, le agregas carriles.'],
      ['¿Abre archivos de otros programas de procesos?', 'Sí. Fluye abre y guarda archivos .bpmn estándar, también los que exportan otras herramientas de modelado (con sus colores), y puede juntar varios archivos en un proyecto con pestañas.'],
      ['¿Cómo comparto un diagrama con alguien que no tiene Fluye?', 'Exporta una página web interactiva: es un solo archivo .html que se abre en cualquier navegador, incluso en el celular, y trae el Play adentro. También puedes exportar a PDF, Word, PNG o SVG.'],
      ['¿Hay versión para Mac o Linux?', 'Por ahora el programa es para Windows 10 y 11. Desde cualquier sistema puedes probarlo en el navegador y abrir las páginas web interactivas que exporta.']
    ],
    h1: 'Diagramas BPMN y de flujo, gratis',
    bajada: 'Fluye es un programa en español para Windows que dibuja procesos con el estándar BPMN 2.0 y los recorre paso a paso con un Play. Funciona sin internet, no pide cuenta y es de código abierto.',
    editorAlt: 'El editor de Fluye con un proceso de compras en dos carriles y el panel que resume el diagrama: 5 pasos, 1 decisión, todo en orden.',
    playAlt: 'El Play detenido en la decisión ¿Se aprueba?, que pregunta por qué camino sigue el proceso.',
    descargar: 'Descargar gratis', descargarNota: `Para Windows 10 y 11 (${PESO}). O pruébalo en el navegador, sin instalar ni crear una cuenta.`,
    probar: 'Probar sin instalar', probarNota: 'Abre el editor en el navegador.',
    hechosEtiqueta: 'Fluye en cuatro datos',
    hechos: [
      ['Gratis y de código abierto', 'Licencia MIT, sin planes de pago ni anuncios.', 'inicio'],
      ['Funciona sin internet', 'Tus diagramas quedan en tu computador.', 'tarea'],
      ['Estándar BPMN 2.0', 'Archivos .bpmn que abren otros programas.', 'exclusiva'],
      ['Play paso a paso', 'Recorre el proceso y avisa dónde se atasca.', 'fin']
    ],
    procesoTitulo: 'Así se trabaja con Fluye',
    procesoTexto: 'Un proceso con tres responsables: tú, el programa y quienes reciben el resultado. Está dibujado con los mismos símbolos que usa Fluye; al bajar, la ficha lo recorre como en el Play.',
    piscina: 'Trabajar con Fluye', tu: 'Tú', equipo: 'Tu equipo',
    nodos: {
      s: 'Quieres ordenar un proceso', a: ['Eliges una plantilla', '33 procesos armados de 11 áreas, o una hoja en blanco.'],
      b: ['Dibujas el proceso', 'Arrastras pasos, decisiones y carriles; las flechas se trazan solas.'],
      h: ['Corriges lo que se atasca', 'Fluye te lleva al paso con problemas y vuelves a probar.'],
      c: ['Revisa qué falta', 'Pasos sueltos, decisiones sin pregunta, un pool sin fin.'],
      e: ['Recorre con el Play', 'Tú eliges el camino en cada decisión; él anota cada fase.'],
      g: '¿Llega al final?', gMovil: 'Si no llega, Fluye te muestra dónde se atasca, lo corriges y vuelves a probar.',
      f: ['Recibe el proceso', 'En Word, PDF, imagen o una página web con el Play adentro.'], z: 'Todos saben qué hacer'
    },
    pruebaTitulo: 'Pruébalo aquí: dale Play',
    pruebaTexto: 'Este es el visor real de Fluye. Pulsa Play arriba a la derecha y, en cada decisión, elige por dónde sigue el proceso. Puedes arrastrar el diagrama y acercarlo con la rueda.',
    visorDe: (n) => `Visor de Fluye: ${n}`, elige: 'Elige un proceso', nivelDe: (p) => `${p.categoria}, nivel ${p.nivelNombre.toLowerCase()}`,
    pantalla: 'Pantalla completa', pestana: 'Abrir en otra pestaña',
    pruebaPie: (r) => `¿Te sirve uno? Cada plantilla tiene su página para abrirla en el editor o descargarla, y el <a href="${r}demo/">editor completo</a> también funciona en el navegador.`,
    galeriaAlt: 'La galería de plantillas de Fluye, con filtros por nivel y por área y una vista de cada proceso.',
    traeTitulo: 'Todo BPMN, sin curso previo',
    traeTexto: 'Fluye trae las figuras del estándar BPMN 2.0 en una paleta ordenada, traza las flechas solo y te dice qué falta mientras dibujas. Abres, dibujas, pruebas y compartes.',
    formatos: 'formatos para compartir', formatosLista: 'BPMN, PNG, SVG, PDF, Word y una página web con el Play.',
    figuras: 'Con todas las figuras', figurasLista: ['Pools y carriles', 'Decisiones y paralelos', 'Eventos, plazos y mensajes', 'Subprocesos en pestañas'],
    abre: 'Abre los .bpmn de otras herramientas, con sus colores.',
    avisa: 'Te avisa si falta', avisaLista: ['Un inicio o un fin', 'La salida de un paso', 'La pregunta de una decisión'],
    corrige: 'Corrige la ortografía en español sin internet, mientras escribes.',
    plantillasTitulo: '33 plantillas para empezar',
    plantillasTexto: (n) => `Procesos armados de ${n} áreas, en tres niveles: simple, intermedia y avanzada. Pasa por cada nombre para ver su diagrama y ábrelo para recorrerlo con el Play.`,
    abiertoTitulo: 'Gratis y de código abierto',
    abiertoTexto: 'Sin planes de pago, sin anuncios y sin cuenta. El código está publicado con licencia MIT: cualquiera puede revisarlo, usarlo y mejorarlo.',
    tabla: 'Fluye en pocas palabras',
    filas: [['Precio', 'Gratis, sin planes de pago'], ['Idioma', 'Español (programa, plantillas y corrector)'], ['Sistema', 'Windows 10 y 11 de 64 bits; demo en cualquier navegador'],
      ['Internet', 'No lo necesita'], ['Notación', 'BPMN 2.0, el estándar de la OMG'], ['Archivos', '.bpmn estándar; exporta PNG, SVG, PDF, Word y página web']],
    licencia: 'Licencia', licenciaTexto: `MIT, código abierto en <a href="${REPO}">GitHub</a>`, version: 'Versión',
    hechoTitulo: 'Hecho en Chile, abierto para todos',
    hechoTexto: ['Fluye lo creó Esteban Maturana y lo publica en GitHub para que cualquier persona u organización lo use gratis.', 'Si encuentras un error o quieres proponer una mejora, abre un reporte en el repositorio.'],
    verCodigo: 'Ver el código en GitHub',
    guiasTitulo: 'Aprende a dibujar procesos',
    guiasTexto: 'Guías cortas en español para entender BPMN y hacer diagramas que se lean a la primera, con ejemplos que puedes recorrer con el Play.',
    guias: [['que-es-bpmn/', 'Qué es BPMN', 'El estándar para dibujar procesos: de dónde viene, sus figuras y cuándo conviene usarlo.'],
      ['diagrama-de-flujo/', 'Cómo hacer un diagrama de flujo', 'Siete pasos, del primer borrador al proceso que se entiende a la primera.'],
      ['simbolos-bpmn/', 'Símbolos BPMN', 'Qué significa cada figura, con su dibujo.'],
      ['diagrama-de-carriles/', 'Diagrama de carriles', 'Cómo mostrar quién hace cada paso y dónde el trabajo cambia de manos.']],
    preguntasTitulo: 'Preguntas frecuentes',
    preguntasTexto: `Lo que más se pregunta antes de instalar. Si te queda otra duda, escríbela en el <a href="${REPO}/issues">repositorio de GitHub</a>.`,
    otroLang: 'en', otroTitulo: 'Fluye in English',
    otroTexto: '<strong>Fluye</strong> is a free, open-source BPMN 2.0 process modeler and flowchart maker for Windows. Draw pools, lanes, tasks and gateways, then press Play to walk through the process token by token. The site, guides and templates are also in English; the program itself is in Spanish.',
    otroEnlaces: (r) => [[`${r}${RUTAS.en.raiz}`, 'Read the site in English'], [`${r}${RUTAS.en.plantillas}`, 'Free BPMN templates'], [`${r}${RUTAS.en.guias}what-is-bpmn/`, 'What is BPMN?']],
    celularAlt: 'La página web que exporta Fluye, abierta en un celular con el Play detenido en una decisión.',
    cierreTitulo: 'Ordena tu próximo proceso',
    cierreTexto: 'Descárgalo gratis para Windows o pruébalo ahora en el navegador. Cuando lo termines, compártelo como una página web que se abre hasta en el celular.',
    app: {
      alternateName: ['Fluye BPMN', 'Fluye, modelador BPMN'], sub: 'Modelado de procesos BPMN y diagramas de flujo',
      descripcion: 'Programa gratis y de código abierto para hacer diagramas BPMN 2.0 y diagramas de flujo en Windows, en español, con un Play que recorre el proceso paso a paso.',
      keywords: 'diagramas BPMN, BPMN 2.0, modelador BPMN, programa para diagramas de flujo, diagrama de carriles, modelado de procesos, gratis, español',
      features: 'Diagramas BPMN 2.0, diagramas de flujo, diagramas de carriles, Play paso a paso, revisión del diagrama, 33 plantillas, exportar a PDF, Word, PNG, SVG y página web interactiva, corrector en español, sin internet'
    },
    titulo: 'Fluye: programa gratis para hacer diagramas BPMN y de flujo',
    descripcion: 'Programa gratis y en español para hacer diagramas BPMN y de flujo en Windows. Recórrelos paso a paso con el Play, usa 33 plantillas y exporta a PDF o Word.'
  },
  en: {
    preguntas: [
      ['What free software can I use to make BPMN diagrams?', 'Fluye is free, open-source software for BPMN 2.0 diagrams on Windows. It draws pools, lanes, tasks, gateways and events, checks that the diagram is complete and walks through it step by step with Play. You can also try it in your browser without installing anything.'],
      ['Is Fluye really free?', 'Yes. It is free forever and open source under the MIT license: use it at home, at work or in class, with no account, no ads and no diagram limits.'],
      ['Is the program in English?', 'The website, guides and templates are in English, but the program interface is in Spanish for now. The BPMN shapes are the same in every language, and the .bpmn files you create open in any BPMN tool.'],
      ['Does it work offline?', 'Yes. Fluye installs on Windows and works without an internet connection: your diagrams stay on your computer as .bpmn files.'],
      ['What is BPMN?', 'Business Process Model and Notation, the international standard for drawing processes, maintained by the OMG. It uses a few shapes: circles for start and end events, rounded rectangles for tasks, diamonds for decisions and lanes for roles.'],
      ['Can I use it for simple flowcharts?', 'Yes. A flowchart with a start, steps, decisions and an end is drawn with the same BPMN shapes. Add lanes when you also want to show who does each step.'],
      ['Does it open files from other process tools?', 'Yes. Fluye opens and saves standard .bpmn files, including those exported by other modeling tools (with their colors), and can combine several files into one project with tabs.'],
      ['How do I share a diagram with someone who does not have Fluye?', 'Export an interactive web page: a single .html file that opens in any browser, even on a phone, with Play built in. You can also export to PDF, Word, PNG or SVG.']
    ],
    h1: 'Free BPMN and flowchart software',
    bajada: 'Fluye is a free Windows program that draws processes with the BPMN 2.0 standard and walks through them step by step with Play. It works offline, needs no account and is open source. Its interface is in Spanish.',
    editorAlt: 'The Fluye editor with a two-lane purchasing process and the panel that summarizes the diagram.',
    playAlt: 'Play stopped at a decision, asking which way the process goes next.',
    descargar: 'Download free', descargarNota: `For Windows 10 and 11 (${PESO}). Or try it in your browser, with nothing to install and no account.`,
    probar: 'Try it in your browser', probarNota: 'Opens the editor in your browser.',
    hechosEtiqueta: 'Fluye in four facts',
    hechos: [
      ['Free and open source', 'MIT license, no paid plans, no ads.', 'inicio'],
      ['Works offline', 'Your diagrams stay on your computer.', 'tarea'],
      ['BPMN 2.0 standard', '.bpmn files that open in other tools.', 'exclusiva'],
      ['Step-by-step Play', 'Walks through the process and flags where it gets stuck.', 'fin']
    ],
    procesoTitulo: 'How work flows with Fluye',
    procesoTexto: 'A process with three roles: you, the program and the people who get the result. It is drawn with the same symbols Fluye uses; as you scroll, the token walks through it just like Play.',
    piscina: 'Working with Fluye', tu: 'You', equipo: 'Your team',
    nodos: {
      s: 'You want to map a process', a: ['Pick a template', '33 ready-made processes from 11 areas, or a blank page.'],
      b: ['Draw the process', 'Drag steps, decisions and lanes; arrows route themselves.'],
      h: ['Fix what gets stuck', 'Fluye takes you to the problem step and you test again.'],
      c: ['Checks what is missing', 'Loose steps, unnamed decisions, a pool with no end.'],
      e: ['Walks through with Play', 'You choose the path at each decision; it logs every step.'],
      g: 'Reaches the end?', gMovil: 'If it does not, Fluye shows you where it gets stuck; you fix it and test again.',
      f: ['Receives the process', 'As Word, PDF, an image or a web page with Play inside.'], z: 'Everyone knows what to do'
    },
    pruebaTitulo: 'Try it here: press Play',
    pruebaTexto: 'This is the real Fluye viewer. Press Play at the top right and choose the path at each decision. You can drag the diagram and zoom with the mouse wheel. The viewer labels are in Spanish.',
    visorDe: (n) => `Fluye viewer: ${n}`, elige: 'Choose a process', nivelDe: (p) => `${p.categoria}, ${p.nivelNombre.toLowerCase()}`,
    pantalla: 'Full screen', pestana: 'Open in a new tab',
    pruebaPie: (r) => `Like one? Each template has its own page where you can open it in the editor or download it, and the <a href="${r}demo/">full editor</a> runs in your browser too.`,
    galeriaAlt: 'The Fluye template gallery, with filters by level and area and a preview of each process.',
    traeTitulo: 'All of BPMN, no training needed',
    traeTexto: 'Fluye has the BPMN 2.0 shapes in a tidy palette, routes the arrows for you and tells you what is missing as you draw. Open, draw, test and share.',
    formatos: 'ways to share', formatosLista: 'BPMN, PNG, SVG, PDF, Word and a web page with Play.',
    figuras: 'Every shape you need', figurasLista: ['Pools and lanes', 'Exclusive and parallel gateways', 'Events, timers and messages', 'Sub-processes in tabs'],
    abre: 'Opens .bpmn files from other tools, colors included.',
    avisa: 'Warns you about', avisaLista: ['A missing start or end', 'A step with no way out', 'A decision with no question'],
    corrige: 'Runs fully offline: your diagrams never leave your computer.',
    plantillasTitulo: '33 templates to start from',
    plantillasTexto: (n) => `Ready-made processes from ${n} areas at three levels: simple, intermediate and advanced. Hover each name to preview its diagram, then open it to walk through with Play.`,
    abiertoTitulo: 'Free and open source',
    abiertoTexto: 'No paid plans, no ads, no account. The code is published under the MIT license: anyone can read it, use it and improve it.',
    tabla: 'Fluye at a glance',
    filas: [['Price', 'Free, no paid plans'], ['Language', 'Interface in Spanish; website, guides and templates also in English'], ['System', 'Windows 10 and 11, 64-bit; demo in any browser'],
      ['Internet', 'Not required'], ['Notation', 'BPMN 2.0, the OMG standard'], ['Files', 'Standard .bpmn; exports PNG, SVG, PDF, Word and web page']],
    licencia: 'License', licenciaTexto: `MIT, open source on <a href="${REPO}">GitHub</a>`, version: 'Version',
    hechoTitulo: 'Made in Chile, open to everyone',
    hechoTexto: ['Fluye was created by Esteban Maturana and published on GitHub so any person or organization can use it for free.', 'Found a bug or have an idea? Open an issue in the repository.'],
    verCodigo: 'View the code on GitHub',
    guiasTitulo: 'Learn to draw processes',
    guiasTexto: 'Short guides to understand BPMN and make diagrams people get at first glance, with examples you can walk through with Play.',
    guias: [['what-is-bpmn/', 'What is BPMN', 'The standard for drawing processes: where it comes from, its shapes and when to use it.'],
      ['how-to-make-a-flowchart/', 'How to make a flowchart', 'Seven steps from first draft to a process people understand at first glance.'],
      ['bpmn-symbols/', 'BPMN symbols', 'What every shape means, with its drawing.'],
      ['swimlane-diagram/', 'Swimlane diagram', 'How to show who does each step and where work changes hands.']],
    preguntasTitulo: 'Frequently asked questions',
    preguntasTexto: `What people ask before installing. Still have a question? Ask it in the <a href="${REPO}/issues">GitHub repository</a>.`,
    otroLang: 'es', otroTitulo: 'Fluye en español',
    otroTexto: '<strong>Fluye</strong> es un programa gratis y de código abierto para hacer diagramas BPMN y de flujo en Windows, en español, con un Play que recorre el proceso paso a paso.',
    otroEnlaces: (r) => [[`${r}${RUTAS.es.raiz}`, 'Ver el sitio en español'], [`${r}${RUTAS.es.plantillas}`, 'Plantillas BPMN gratis'], [`${r}${RUTAS.es.guias}que-es-bpmn/`, 'Qué es BPMN']],
    celularAlt: 'The web page exported by Fluye, open on a phone with Play stopped at a decision.',
    cierreTitulo: 'Map your next process',
    cierreTexto: 'Download it free for Windows or try it now in your browser. When you are done, share it as a web page that opens even on a phone.',
    app: {
      alternateName: ['Fluye BPMN', 'Fluye BPMN modeler'], sub: 'BPMN process modeling and flowcharts',
      descripcion: 'Free, open-source software for BPMN 2.0 diagrams and flowcharts on Windows, with a Play button that walks through the process step by step. Interface in Spanish.',
      keywords: 'BPMN software, free BPMN modeler, BPMN 2.0, flowchart maker, swimlane diagram, process modeling, open source',
      features: 'BPMN 2.0 diagrams, flowcharts, swimlane diagrams, step-by-step Play, diagram checks, 33 templates, export to PDF, Word, PNG, SVG and interactive web page, offline'
    },
    titulo: 'Fluye: free BPMN modeler and flowchart software',
    descripcion: 'Free, open-source BPMN and flowchart software for Windows. Walk through your process step by step with Play, start from 33 templates and export to PDF or Word.'
  }
};

export function portada({ plantillas, areas, idioma = 'es' }) {
  const t = TX[idioma], rutas = RUTAS[idioma];
  const ruta = rutas.raiz;
  const r = '../'.repeat(ruta.split('/').filter(Boolean).length);
  const probar = PARA_PROBAR.map((id) => plantillas.find((p) => p.id === id)).filter(Boolean);
  const archivo = (p) => `${rutas.plantillas}${p.ruta}/${p.ruta}.bpmn`;
  const primera = probar[0];
  const n = t.nodos;

  const cuerpo = `
<section class="tablero portada" aria-labelledby="titulo">
  <div class="pieza portada-texto entra">
    <div>
      <h1 id="titulo">${t.h1}</h1>
      <p class="bajada">${t.bajada}</p>
    </div>
    <div class="portada-acciones">
      <div class="portada-botones">
        <a class="boton boton-grande" href="${DESCARGA}">${WINDOWS}${t.descargar}</a>
        <a class="boton boton-grande boton-tarea" href="${r}demo/">${t.probar}</a>
      </div>
      <p class="chico suave">${t.descargarNota}</p>
    </div>
  </div>
  <figure class="pieza pieza-foto portada-foto obturador">
    <img src="${r}imagenes/play.webp" width="2880" height="1800" alt="${escapar(t.playAlt)}" fetchpriority="high">
  </figure>
</section>

<section class="pieza franja-datos entra" aria-label="${t.hechosEtiqueta}">
  ${t.hechos.map(([titulo, texto, simbolo], i) => `<p class="dato-clave">${SIMBOLOS[simbolo]}<span><strong>${titulo}</strong>${texto}</span></p>`).join('\n  ')}
</section>

<section class="proceso" aria-labelledby="proceso-titulo">
  <div class="cabeza entra">
    <h2 id="proceso-titulo">${t.procesoTitulo}</h2>
    <p>${t.procesoTexto}</p>
  </div>
  <div class="pieza entra" data-ui>
    <div class="piscina" data-piscina>
      <p class="piscina-nombre" aria-hidden="true">${t.piscina}</p>
      <div class="carril" data-carril="${t.tu}">
        <h3 class="carril-nombre">${t.tu}</h3>
        <div class="nodo inicio" data-id="s" data-carril="${t.tu}" style="--c:1;--orden:1"><span class="evento" aria-hidden="true"></span><span class="nodo-nombre">${n.s}</span></div>
        <div class="nodo tarea" data-id="a" data-carril="${t.tu}" style="--c:2;--orden:2"><strong>${n.a[0]}</strong><span>${n.a[1]}</span></div>
        <div class="nodo tarea" data-id="b" data-carril="${t.tu}" style="--c:3;--orden:3"><strong>${n.b[0]}</strong><span>${n.b[1]}</span></div>
        <div class="nodo tarea" data-id="h" data-carril="${t.tu}" style="--c:5;--orden:7"><strong>${n.h[0]}</strong><span>${n.h[1]}</span></div>
      </div>
      <div class="carril" data-carril="Fluye">
        <h3 class="carril-nombre">Fluye</h3>
        <div class="nodo tarea" data-id="c" data-carril="Fluye" style="--c:3;--orden:4"><strong>${n.c[0]}</strong><span>${n.c[1]}</span></div>
        <div class="nodo tarea" data-id="e" data-carril="Fluye" style="--c:4;--orden:5"><strong>${n.e[0]}</strong><span>${n.e[1]}</span></div>
        <div class="nodo decision" data-id="g" data-carril="Fluye" style="--c:5;--orden:6"><span class="rombo" aria-hidden="true"></span><span class="nodo-nombre">${n.g}</span><span class="nodo-movil">${n.gMovil}</span></div>
      </div>
      <div class="carril" data-carril="${t.equipo}">
        <h3 class="carril-nombre">${t.equipo}</h3>
        <div class="nodo tarea" data-id="f" data-carril="${t.equipo}" style="--c:5;--orden:8"><strong>${n.f[0]}</strong><span>${n.f[1]}</span></div>
        <div class="nodo fin" data-id="z" data-carril="${t.equipo}" style="--c:6;--orden:9"><span class="evento" aria-hidden="true"></span><span class="nodo-nombre">${n.z}</span></div>
      </div>
      <svg class="flechas" aria-hidden="true" focusable="false"></svg>
    </div>
  </div>
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
  <p class="prueba-pie">${t.pruebaPie(r)}</p>
</section>

<section class="tablero trae" aria-labelledby="trae-titulo">
  <figure class="pieza pieza-foto trae-foto entra">
    <img src="${r}imagenes/galeria.webp" width="2880" height="1800" loading="lazy" alt="${escapar(t.galeriaAlt)}">
  </figure>
  <div class="pieza trae-titulo entra" style="--i:1">
    <h2 id="trae-titulo">${t.traeTitulo}</h2>
    <p>${t.traeTexto}</p>
  </div>
  <div class="pieza pieza-tarea trae-cifra entra" style="--i:2">
    <span class="cifra">6</span>
    <div><p class="frase">${t.formatos}</p><p>${t.formatosLista}</p></div>
  </div>
  <div class="pieza pieza-hondo trae-lista entra" style="--i:3">
    <p class="frase lista-bpmn-titulo">${t.figuras}</p>
    <ul class="lista-bpmn">${t.figurasLista.map((x) => `<li>${x}</li>`).join('')}</ul>
  </div>
  <div class="pieza pieza-tarea trae-abre entra">
    <p class="frase">${t.abre}</p>
  </div>
  <div class="pieza trae-revisa entra" style="--i:1">
    <p class="frase lista-bpmn-titulo">${t.avisa}</p>
    <ul class="lista-bpmn">${t.avisaLista.map((x) => `<li>${x}</li>`).join('')}</ul>
  </div>
  <div class="pieza pieza-2 trae-corrige entra" style="--i:2">
    <p class="frase">${t.corrige}</p>
  </div>
</section>

<section class="plantillas-portada" aria-labelledby="plantillas-titulo">
  <div class="cabeza entra">
    <h2 id="plantillas-titulo">${t.plantillasTitulo}</h2>
    <p>${t.plantillasTexto(areas.length)}</p>
  </div>
  ${catalogo(r, plantillas, areas, { idioma })}
</section>

<section class="abierto" aria-labelledby="abierto-titulo">
  <div class="cabeza entra">
    <h2 id="abierto-titulo">${t.abiertoTitulo}</h2>
    <p>${t.abiertoTexto}</p>
  </div>
  <div class="tablero">
    <div class="pieza abierto-datos entra">
      <table>
        <caption class="oculto">${t.tabla}</caption>
        <tbody>
          ${t.filas.map(([a, b]) => `<tr><th scope="row">${a}</th><td>${b}</td></tr>`).join('\n          ')}
          <tr><th scope="row">${t.licencia}</th><td>${t.licenciaTexto}</td></tr>
          <tr><th scope="row">${t.version}</th><td>${VERSION}</td></tr>
        </tbody>
      </table>
    </div>
    <div class="pieza pieza-hondo abierto-codigo entra" style="--i:1">
      <div>
        <h3>${t.hechoTitulo}</h3>
        ${t.hechoTexto.map((x) => `<p>${x}</p>`).join('\n        ')}
      </div>
      <div class="cierre-botones"><a class="boton boton-claro" href="${REPO}">${t.verCodigo}</a></div>
    </div>
  </div>
</section>

<section class="guias-portada" aria-labelledby="guias-titulo">
  <div class="cabeza entra">
    <h2 id="guias-titulo">${t.guiasTitulo}</h2>
    <p>${t.guiasTexto}</p>
  </div>
  <div class="tablero guias-tablero">
    <a class="pieza pieza-tarea guia-bpmn entra" href="${r}${rutas.guias}${t.guias[0][0]}"><span class="guia-dibujo">${SIMBOLOS.inicio}${SIMBOLOS.secuencia}${SIMBOLOS.tarea}${SIMBOLOS.secuencia}${SIMBOLOS.exclusiva}${SIMBOLOS.secuencia}${SIMBOLOS.fin}</span><span class="guia-texto"><span class="camino-titulo">${t.guias[0][1]}</span><p>${t.guias[0][2]}</p></span>${FLECHA}</a>
    <a class="pieza guia-flujo entra" style="--i:1" href="${r}${rutas.guias}${t.guias[1][0]}"><span class="guia-dibujo">${SIMBOLOS.inicio}${SIMBOLOS.secuencia}${SIMBOLOS.usuario}${SIMBOLOS.secuencia}${SIMBOLOS.fin}</span><span class="guia-texto"><span class="camino-titulo">${t.guias[1][1]}</span><p>${t.guias[1][2]}</p></span>${FLECHA}</a>
    <a class="pieza guia-simbolos entra" href="${r}${rutas.guias}${t.guias[2][0]}"><span class="guia-dibujo">${SIMBOLOS.mensaje}${SIMBOLOS.plazo}${SIMBOLOS.paralela}${SIMBOLOS.documento}</span><span class="guia-texto"><span class="camino-titulo">${t.guias[2][1]}</span><p>${t.guias[2][2]}</p></span>${FLECHA}</a>
    <a class="pieza pieza-2 guia-carriles entra" style="--i:1" href="${r}${rutas.guias}${t.guias[3][0]}"><span class="guia-dibujo">${SIMBOLOS.carril}${SIMBOLOS.pool}</span><span class="guia-texto"><span class="camino-titulo">${t.guias[3][1]}</span><p>${t.guias[3][2]}</p></span>${FLECHA}</a>
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

<section class="tablero" lang="${t.otroLang}" aria-labelledby="ingles-titulo">
  <div class="pieza ingles-texto entra">
    <h2 id="ingles-titulo" class="frase">${t.otroTitulo}</h2>
    <p>${t.otroTexto}</p>
  </div>
  <div class="pieza pieza-tarea ingles-enlaces entra" style="--i:1">
    ${t.otroEnlaces(r).map(([href, texto]) => `<a href="${href}" hreflang="${t.otroLang}">${texto}</a>`).join('\n    ')}
  </div>
</section>

<section class="tablero cierre" aria-labelledby="cierre-titulo">
  <div class="pieza cierre-flanco">
    <img src="${r}imagenes/celular.png" width="780" height="1688" loading="lazy" alt="${escapar(t.celularAlt)}">
  </div>
  <div class="pieza pieza-azul cierre-centro entra">
    <h2 id="cierre-titulo">${t.cierreTitulo}</h2>
    <p>${t.cierreTexto}</p>
    <div class="cierre-botones">
      <a class="boton boton-claro" href="${DESCARGA}">${t.descargar}</a>
      <a class="boton boton-tarea" href="${r}demo/">${t.probar}</a>
    </div>
  </div>
  <div class="pieza cierre-flanco" aria-hidden="true"></div>
</section>`;

  const url = SITIO + ruta;
  const esquema = [
    {
      '@context': 'https://schema.org', '@type': 'SoftwareApplication',
      name: 'Fluye', alternateName: t.app.alternateName, url,
      applicationCategory: 'BusinessApplication', applicationSubCategory: t.app.sub,
      operatingSystem: 'Windows 10, Windows 11', softwareVersion: VERSION, inLanguage: 'es', isAccessibleForFree: true,
      license: 'https://opensource.org/licenses/MIT', downloadUrl: DESCARGA, fileSize: PESO,
      screenshot: [`${SITIO}imagenes/editor.webp`, `${SITIO}imagenes/play.webp`], codeRepository: REPO,
      description: t.app.descripcion, keywords: t.app.keywords, featureList: t.app.features,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      author: { '@type': 'Person', name: 'Esteban Maturana', url: 'https://github.com/ematurana-code' }
    },
    {
      '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: idioma,
      mainEntity: t.preguntas.map(([p, rta]) => ({ '@type': 'Question', name: p, acceptedAnswer: { '@type': 'Answer', text: rta } }))
    },
    { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Fluye', url, inLanguage: idioma }
  ];

  return {
    ruta, idioma, alternas: { es: RUTAS.es.raiz, en: RUTAS.en.raiz },
    titulo: t.titulo, descripcion: t.descripcion,
    cuerpo, esquema, clase: 'es-portada'
  };
}
