// Portada: qué es Fluye, el visor real funcionando, el proceso de trabajar con Fluye dibujado como diagrama de
// carriles (con una ficha que avanza al bajar), plantillas, guías, resumen, preguntas frecuentes y descarga.
import { DESCARGA, PESO, REPO, SITIO, VERSION, decision, escapar, visor } from './comun.mjs';

const PREGUNTAS = [
  ['¿Fluye es gratis?', 'Sí. Es gratis para siempre y de código abierto con licencia MIT: puedes usarlo en tu casa, en tu empresa o en clases, sin cuenta, sin anuncios y sin límite de diagramas.'],
  ['¿Funciona sin internet?', 'Sí. Fluye se instala en Windows y trabaja sin conexión: los diagramas quedan en tu computador como archivos .bpmn. Incluso el corrector ortográfico en español funciona sin internet.'],
  ['¿Qué es BPMN?', 'Es el estándar internacional para dibujar procesos (Business Process Model and Notation, de la OMG). Usa pocas figuras: círculos para el inicio y el fin, rectángulos para las tareas, rombos para las decisiones y franjas para los responsables. La guía de símbolos BPMN las explica una por una.'],
  ['¿Abre archivos de otros programas de procesos?', 'Sí. Fluye abre y guarda archivos .bpmn estándar, también los que exportan otras herramientas de modelado (con sus colores), y puede juntar varios archivos en un proyecto con pestañas.'],
  ['¿Cómo comparto un diagrama con alguien que no tiene Fluye?', 'Exporta una página web interactiva: es un solo archivo .html que se abre en cualquier navegador, incluso en el celular, y trae el Play adentro. También puedes exportar a PDF, Word, PNG o SVG.'],
  ['¿Hay versión para Mac o Linux?', 'Por ahora el programa es para Windows 10 y 11. Desde cualquier sistema puedes probarlo en el navegador y abrir las páginas web interactivas que exporta.']
];

export function portada({ plantillas, areas }) {
  const r = '';
  const destacadas = ['solicitud-de-compra', 'ticket-de-mesa-de-ayuda', 'inicio-de-sesion', 'solicitud-de-vacaciones', 'gestion-de-reclamos', 'despacho-de-importacion']
    .map((ruta) => plantillas.find((p) => p.ruta === ruta)).filter(Boolean);

  const cuerpo = `
<section class="portada" aria-labelledby="titulo">
  <div class="portada-texto">
    <h1 id="titulo">Diagramas de flujo y procesos BPMN, gratis y en español</h1>
    <p class="bajada">Fluye es un programa para Windows que dibuja procesos con el estándar BPMN y los recorre paso a paso con un Play. Funciona sin internet, no pide cuenta y es de código abierto.</p>
    ${decision(r)}
  </div>
  ${visor(r, { archivo: 'plantillas/solicitud-de-compra/solicitud-de-compra.bpmn', titulo: 'Solicitud de compra', alto: 540, perezoso: false })}
</section>

<section class="proceso" aria-labelledby="proceso-titulo">
  <div class="cabeza">
    <h2 id="proceso-titulo">Así se trabaja con Fluye</h2>
    <p>Un proceso con tres responsables: tú, el programa y quienes reciben el resultado. Está dibujado con los mismos símbolos que usa Fluye; al bajar, la ficha lo recorre como en el Play.</p>
  </div>
  <div class="piscina" data-piscina>
    <p class="piscina-nombre" aria-hidden="true">Trabajar con Fluye</p>
    <div class="carril" data-carril="Tú">
      <h3 class="carril-nombre">Tú</h3>
      <div class="nodo inicio" data-id="s" data-carril="Tú" style="--c:1;--orden:1"><span class="evento" aria-hidden="true"></span><span class="nodo-nombre">Quieres ordenar un proceso</span></div>
      <div class="nodo tarea" data-id="a" data-carril="Tú" style="--c:2;--orden:2"><strong>Eliges una plantilla</strong><span>33 procesos armados de 11 áreas, o una hoja en blanco.</span></div>
      <div class="nodo tarea" data-id="b" data-carril="Tú" style="--c:3;--orden:3"><strong>Dibujas el proceso</strong><span>Arrastras pasos, decisiones y carriles; las flechas se trazan solas.</span></div>
      <div class="nodo tarea" data-id="h" data-carril="Tú" style="--c:5;--orden:7"><strong>Corriges lo que se atasca</strong><span>Fluye te lleva al paso con problemas y vuelves a probar.</span></div>
    </div>
    <div class="carril" data-carril="Fluye">
      <h3 class="carril-nombre">Fluye</h3>
      <div class="nodo tarea" data-id="c" data-carril="Fluye" style="--c:3;--orden:4"><strong>Revisa qué falta</strong><span>Pasos sueltos, decisiones sin pregunta, un pool sin fin.</span></div>
      <div class="nodo tarea" data-id="e" data-carril="Fluye" style="--c:4;--orden:5"><strong>Recorre con el Play</strong><span>Tú eliges el camino en cada decisión; él anota cada fase.</span></div>
      <div class="nodo decision" data-id="g" data-carril="Fluye" style="--c:5;--orden:6"><span class="rombo" aria-hidden="true"></span><span class="nodo-nombre">¿Llega al final?</span><span class="nodo-movil">Si no llega, Fluye te muestra dónde se atasca, lo corriges y vuelves a probar.</span></div>
    </div>
    <div class="carril" data-carril="Tu equipo">
      <h3 class="carril-nombre">Tu equipo</h3>
      <div class="nodo tarea" data-id="f" data-carril="Tu equipo" style="--c:5;--orden:8"><strong>Recibe el proceso</strong><span>En Word, PDF, imagen o una página web con el Play adentro.</span></div>
      <div class="nodo fin" data-id="z" data-carril="Tu equipo" style="--c:6;--orden:9"><span class="evento" aria-hidden="true"></span><span class="nodo-nombre">Todos saben qué hacer</span></div>
    </div>
    <svg class="flechas" aria-hidden="true" focusable="false"></svg>
  </div>
</section>

<section class="pantallas" aria-labelledby="pantallas-titulo">
  <div class="cabeza">
    <h2 id="pantallas-titulo">Un programa de diagramas de flujo hecho para entenderse</h2>
    <p>Letra legible, una barra con lo justo y un panel que te dice qué falta. Lo que necesitas para modelar procesos sin un curso previo.</p>
  </div>
  <div class="pantallas-fila">
    <figure class="pantalla-grande">
      <img src="imagenes/editor.png" width="1440" height="860" loading="lazy" alt="El editor de Fluye con un proceso de compras en dos carriles y el panel que resume el diagrama: 5 pasos, 1 decisión, todo en orden.">
      <figcaption>El editor: paleta a la izquierda, diagrama al centro y, a la derecha, el resumen con lo que falta revisar.</figcaption>
    </figure>
    <figure>
      <img src="imagenes/play.png" width="1440" height="860" loading="lazy" alt="El Play detenido en la decisión ¿Se aprueba?, con la bitácora del recorrido a la derecha.">
      <figcaption>El Play se detiene en cada decisión y anota el recorrido.</figcaption>
    </figure>
    <figure>
      <img src="imagenes/celular.png" width="780" height="1688" loading="lazy" alt="Página web exportada por Fluye abierta en un celular, con el Play en una decisión.">
      <figcaption>La página web que exporta funciona en el celular.</figcaption>
    </figure>
  </div>
  <dl class="trae">
    <div><dt>Estándar BPMN 2.0</dt><dd>Pools, carriles, tareas, decisiones, paralelos, eventos, mensajes entre pools, subprocesos, documentos y notas.</dd></div>
    <div><dt>Varios diagramas por archivo</dt><dd>Cada diagrama en su pestaña, como el subproceso detallado de un proceso grande.</dd></div>
    <div><dt>Exporta a seis formatos</dt><dd>BPMN, PNG, SVG, PDF, Word con la ficha de cada paso y una página web interactiva.</dd></div>
    <div><dt>Abre lo que ya tienes</dt><dd>Archivos .bpmn de otras herramientas, con sus colores; también varios a la vez.</dd></div>
    <div><dt>Corrector en español</dt><dd>Revisa nombres y descripciones mientras escribes, sin conexión.</dd></div>
    <div><dt>Sin internet ni cuenta</dt><dd>Todo queda en tu computador. Nada se sube a ningún servidor.</dd></div>
  </dl>
</section>

<section class="muestras" aria-labelledby="muestras-titulo">
  <div class="cabeza">
    <h2 id="muestras-titulo">33 plantillas de diagramas de flujo para empezar</h2>
    <p>Procesos armados de ${areas.length} áreas, en tres niveles: simple, intermedia y avanzada. Ábrelos, recórrelos con el Play y ajústalos a tu forma de trabajar.</p>
  </div>
  <ul class="muestras-lista">
    ${destacadas.map((p) => `
    <li>
      <a href="plantillas/${p.ruta}/">
        <img src="plantillas/${p.ruta}/vista.svg" width="320" height="180" loading="lazy" alt="Vista del diagrama ${escapar(p.nombre)}">
        <strong>${escapar(p.nombre)}</strong>
        <span>${escapar(p.categoria)} · nivel ${escapar(p.nivelNombre.toLowerCase())}</span>
      </a>
    </li>`).join('')}
  </ul>
  <p class="mas"><a class="boton boton-claro" href="plantillas/">Ver las 33 plantillas</a></p>
</section>

<section class="resumen" aria-labelledby="resumen-titulo">
  <h2 id="resumen-titulo">Fluye en pocas palabras</h2>
  <table>
    <tbody>
      <tr><th scope="row">Precio</th><td>Gratis, sin planes de pago</td></tr>
      <tr><th scope="row">Idioma</th><td>Español (programa, plantillas y corrector)</td></tr>
      <tr><th scope="row">Sistema</th><td>Windows 10 y 11 de 64 bits; demo en cualquier navegador</td></tr>
      <tr><th scope="row">Internet</th><td>No lo necesita</td></tr>
      <tr><th scope="row">Notación</th><td>BPMN 2.0, el estándar de la OMG</td></tr>
      <tr><th scope="row">Archivos</th><td>.bpmn estándar; exporta PNG, SVG, PDF, Word y página web</td></tr>
      <tr><th scope="row">Licencia</th><td>MIT, código abierto en <a href="${REPO}">GitHub</a></td></tr>
      <tr><th scope="row">Versión</th><td>${VERSION}</td></tr>
    </tbody>
  </table>
</section>

<section class="guias-portada" aria-labelledby="guias-titulo">
  <h2 id="guias-titulo">Aprende a dibujar procesos</h2>
  <ul class="guias-lista">
    <li><a href="guias/diagrama-de-flujo/"><strong>Cómo hacer un diagrama de flujo</strong><span>Del primer paso al proceso terminado, con un ejemplo que puedes recorrer.</span></a></li>
    <li><a href="guias/simbolos-bpmn/"><strong>Símbolos BPMN</strong><span>Qué significa cada figura: eventos, tareas, decisiones, pools y carriles.</span></a></li>
    <li><a href="guias/diagrama-de-carriles/"><strong>Diagrama de carriles</strong><span>Cómo mostrar quién hace cada paso y dónde se pasa el trabajo de mano.</span></a></li>
  </ul>
</section>

<section class="preguntas" aria-labelledby="preguntas-titulo">
  <h2 id="preguntas-titulo">Preguntas frecuentes</h2>
  ${PREGUNTAS.map(([p, rta]) => `<details><summary>${escapar(p)}</summary><p>${escapar(rta)}</p></details>`).join('\n  ')}
</section>

<section class="final" aria-labelledby="final-titulo">
  <span class="evento-fin" aria-hidden="true"></span>
  <h2 id="final-titulo">Tu proceso, claro y listo para compartir</h2>
  ${decision(r, '¿Cómo quieres empezar?')}
</section>

<section class="ingles" lang="en" aria-labelledby="ingles-titulo">
  <h2 id="ingles-titulo">Fluye in English</h2>
  <p><strong>Fluye</strong> is a free, open-source BPMN 2.0 process modeler and flowchart maker for Windows. Draw pools, lanes, tasks and gateways, then press Play to walk through the process token by token. It works offline, exports to BPMN, PNG, SVG, PDF, Word and a single-file interactive web page, and its interface is in Spanish. <a href="${DESCARGA}">Download for Windows</a> or <a href="demo/">try it in your browser</a>.</p>
</section>`;

  const esquema = [
    {
      '@context': 'https://schema.org', '@type': 'SoftwareApplication',
      name: 'Fluye', url: SITIO, applicationCategory: 'BusinessApplication', applicationSubCategory: 'Diagramas de flujo y modelado BPMN',
      operatingSystem: 'Windows 10, Windows 11', softwareVersion: VERSION, inLanguage: 'es', isAccessibleForFree: true,
      license: 'https://opensource.org/licenses/MIT', downloadUrl: DESCARGA, fileSize: PESO, screenshot: `${SITIO}imagenes/editor.png`,
      description: 'Programa gratis y de código abierto para hacer diagramas de flujo y procesos BPMN 2.0 en Windows, en español, con un Play que recorre el proceso paso a paso.',
      featureList: 'Diagramas de flujo, BPMN 2.0, diagramas de carriles, Play paso a paso, 33 plantillas, exportar a PDF, Word, PNG, SVG y página web interactiva, corrector en español, sin internet',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      author: { '@type': 'Person', name: 'Esteban Maturana', url: 'https://github.com/ematurana-code' }
    },
    {
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: PREGUNTAS.map(([p, rta]) => ({ '@type': 'Question', name: p, acceptedAnswer: { '@type': 'Answer', text: rta } }))
    },
    { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Fluye', url: SITIO, inLanguage: 'es' }
  ];

  return {
    ruta: '',
    titulo: 'Fluye: programa gratis para diagramas de flujo y BPMN',
    descripcion: 'Haz diagramas de flujo y procesos BPMN gratis en Windows, en español y sin internet. Recórrelos paso a paso con el Play, usa 33 plantillas y exporta a PDF, Word o web.',
    cuerpo, esquema, clase: 'es-portada'
  };
}
