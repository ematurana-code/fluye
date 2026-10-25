// Portada: un tablero que dice qué es Fluye y muestra sus pantallas; el proceso de trabajar con Fluye dibujado como
// diagrama de carriles (con una ficha que avanza al bajar); el visor real para probar el Play; lo que trae; las 33
// plantillas; código abierto; guías; preguntas frecuentes y la descarga.
import { DESCARGA, FLECHA, PESO, REPO, SITIO, VERSION, escapar, urlVisor } from './comun.mjs';
import { catalogo } from './plantillas.mjs';
import { SIMBOLOS } from './guias.mjs';

const PREGUNTAS = [
  ['¿Qué programa uso para hacer diagramas BPMN gratis?', 'Fluye es un programa gratis y de código abierto para hacer diagramas BPMN 2.0 en Windows, en español. Dibuja pools, carriles, tareas, decisiones y eventos, revisa que el diagrama esté completo y lo recorre paso a paso con un Play. También puedes probarlo sin instalar, en el navegador.'],
  ['¿Fluye es gratis?', 'Sí. Es gratis para siempre y de código abierto con licencia MIT: puedes usarlo en tu casa, en tu empresa o en clases, sin cuenta, sin anuncios y sin límite de diagramas.'],
  ['¿Funciona sin internet?', 'Sí. Fluye se instala en Windows y trabaja sin conexión: los diagramas quedan en tu computador como archivos .bpmn. Incluso el corrector ortográfico en español funciona sin internet.'],
  ['¿Qué es BPMN?', 'Es el estándar internacional para dibujar procesos (Business Process Model and Notation, de la OMG). Usa pocas figuras: círculos para el inicio y el fin, rectángulos para las tareas, rombos para las decisiones y franjas para los responsables.'],
  ['¿Sirve para diagramas de flujo comunes?', 'Sí. Un diagrama de flujo con inicio, pasos, decisiones y fin se dibuja con las mismas figuras de BPMN. Si además quieres mostrar quién hace cada paso, le agregas carriles.'],
  ['¿Abre archivos de otros programas de procesos?', 'Sí. Fluye abre y guarda archivos .bpmn estándar, también los que exportan otras herramientas de modelado (con sus colores), y puede juntar varios archivos en un proyecto con pestañas.'],
  ['¿Cómo comparto un diagrama con alguien que no tiene Fluye?', 'Exporta una página web interactiva: es un solo archivo .html que se abre en cualquier navegador, incluso en el celular, y trae el Play adentro. También puedes exportar a PDF, Word, PNG o SVG.'],
  ['¿Hay versión para Mac o Linux?', 'Por ahora el programa es para Windows 10 y 11. Desde cualquier sistema puedes probarlo en el navegador y abrir las páginas web interactivas que exporta.']
];

// Las plantillas que se pueden cargar en el visor de la portada.
const PARA_PROBAR = ['solicitud-de-compra', 'ticket-de-mesa-de-ayuda', 'inicio-de-sesion-con-bloqueo-por-intentos', 'gestion-de-reclamos', 'despacho-de-importacion', 'seleccion-de-personal'];

export function portada({ plantillas, areas }) {
  const r = '';
  const probar = PARA_PROBAR.map((ruta) => plantillas.find((p) => p.ruta === ruta)).filter(Boolean);
  const archivo = (p) => `plantillas/${p.ruta}/${p.ruta}.bpmn`;
  const primera = probar[0];

  const cuerpo = `
<section class="tablero portada" aria-labelledby="titulo">
  <div class="pieza portada-nombre entra">
    <div>
      <h1 id="titulo">Diagramas BPMN y de flujo, gratis</h1>
      <p class="bajada">Fluye es un programa en español para Windows que dibuja procesos con el estándar BPMN 2.0 y los recorre paso a paso con un Play. Funciona sin internet, no pide cuenta y es de código abierto.</p>
    </div>
    <p class="nombre" translate="no">Fluye</p>
  </div>
  <figure class="pieza pieza-foto portada-editor obturador">
    <img src="imagenes/editor.png" width="1440" height="860" alt="El editor de Fluye con un proceso de compras en dos carriles y el panel que resume el diagrama: 5 pasos, 1 decisión, todo en orden.">
  </figure>
  <figure class="pieza pieza-foto portada-play entra" style="--i:1">
    <img src="imagenes/play.png" width="1440" height="860" alt="El Play detenido en la decisión ¿Se aprueba?, que pregunta por qué camino sigue el proceso.">
  </figure>
  <a class="pieza pieza-azul portada-descargar entra" style="--i:2" href="${DESCARGA}"><span><span class="camino-titulo">Descargar gratis</span><span class="camino-nota">Para Windows 10 y 11. Pesa ${PESO} y no pide cuenta.</span></span>${FLECHA}</a>
  <a class="pieza pieza-tarea portada-probar entra" style="--i:3" href="demo/"><span><span class="camino-titulo">Probar sin instalar</span><span class="camino-nota">Abre el editor en el navegador.</span></span>${FLECHA}</a>
</section>

<section class="proceso" aria-labelledby="proceso-titulo">
  <div class="cabeza entra">
    <h2 id="proceso-titulo">Así se trabaja con Fluye</h2>
    <p>Un proceso con tres responsables: tú, el programa y quienes reciben el resultado. Está dibujado con los mismos símbolos que usa Fluye; al bajar, la ficha lo recorre como en el Play.</p>
  </div>
  <div class="pieza entra" data-ui>
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
  </div>
</section>

<section class="prueba" aria-labelledby="prueba-titulo">
  <div class="cabeza entra">
    <h2 id="prueba-titulo">Pruébalo aquí: dale Play</h2>
    <p>Este es el visor real de Fluye. Pulsa Play arriba a la derecha y, en cada decisión, elige por dónde sigue el proceso. Puedes arrastrar el diagrama y acercarlo con la rueda.</p>
  </div>
  <div class="tablero prueba-panel" data-prueba>
    <div class="pieza prueba-visor" data-ui>
      <iframe src="${escapar(urlVisor(r, archivo(primera), primera.nombre, false))}" title="Visor de Fluye: ${escapar(primera.nombre)}" loading="lazy" allow="fullscreen" allowfullscreen></iframe>
    </div>
    <div class="pieza prueba-mando">
      <h3 id="prueba-elige">Elige un proceso</h3>
      <ul class="prueba-lista" aria-labelledby="prueba-elige">
        ${probar.map((p, i) => `<li><a href="${escapar(urlVisor(r, archivo(p), p.nombre, false))}" data-visor data-titulo="${escapar(p.nombre)}"${i === 0 ? ' aria-current="true"' : ''}>${escapar(p.nombre)}<span>${escapar(p.categoria)}, nivel ${escapar(p.nivelNombre.toLowerCase())}</span></a></li>`).join('\n        ')}
      </ul>
      <div class="prueba-botones">
        <button type="button" class="boton" data-pantalla-completa hidden><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Pantalla completa</button>
        <a class="boton boton-tarea" href="${escapar(urlVisor(r, archivo(primera), primera.nombre, false))}" target="_blank" rel="noopener" data-pestana>Abrir en otra pestaña</a>
      </div>
    </div>
  </div>
  <p class="prueba-pie">¿Te sirve uno? Cada plantilla tiene su página para abrirla en el editor o descargarla, y el <a href="demo/">editor completo</a> también funciona en el navegador.</p>
</section>

<section class="tablero trae" aria-labelledby="trae-titulo">
  <figure class="pieza pieza-foto trae-foto entra">
    <img src="imagenes/galeria.png" width="1440" height="860" loading="lazy" alt="La galería de plantillas de Fluye, con filtros por nivel y por área y una vista de cada proceso.">
  </figure>
  <div class="pieza trae-titulo entra" style="--i:1">
    <h2 id="trae-titulo">Todo BPMN, sin curso previo</h2>
    <p>Fluye trae las figuras del estándar BPMN 2.0 en una paleta ordenada, traza las flechas solo y te dice qué falta mientras dibujas. Abres, dibujas, pruebas y compartes.</p>
  </div>
  <div class="pieza pieza-tarea trae-cifra entra" style="--i:2">
    <span class="cifra">6</span>
    <div><p class="frase">formatos para compartir</p><p>BPMN, PNG, SVG, PDF, Word y una página web con el Play.</p></div>
  </div>
  <div class="pieza pieza-hondo trae-lista entra" style="--i:3">
    <p class="frase lista-bpmn-titulo">Con todas las figuras</p>
    <ul class="lista-bpmn"><li>Pools y carriles</li><li>Decisiones y paralelos</li><li>Eventos, plazos y mensajes</li><li>Subprocesos en pestañas</li></ul>
  </div>
  <div class="pieza pieza-tarea trae-abre entra">
    <p class="frase">Abre los .bpmn de otras herramientas, con sus colores.</p>
  </div>
  <div class="pieza trae-revisa entra" style="--i:1">
    <p class="frase lista-bpmn-titulo">Te avisa si falta</p>
    <ul class="lista-bpmn"><li>Un inicio o un fin</li><li>La salida de un paso</li><li>La pregunta de una decisión</li></ul>
  </div>
  <div class="pieza pieza-2 trae-corrige entra" style="--i:2">
    <p class="frase">Corrige la ortografía en español sin internet, mientras escribes.</p>
  </div>
</section>

<section class="plantillas-portada" aria-labelledby="plantillas-titulo">
  <div class="cabeza entra">
    <h2 id="plantillas-titulo">33 plantillas para empezar</h2>
    <p>Procesos armados de ${areas.length} áreas, en tres niveles: simple, intermedia y avanzada. Pasa por cada nombre para ver su diagrama y ábrelo para recorrerlo con el Play.</p>
  </div>
  ${catalogo(r, plantillas, areas)}
</section>

<section class="abierto" aria-labelledby="abierto-titulo">
  <div class="cabeza entra">
    <h2 id="abierto-titulo">Gratis y de código abierto</h2>
    <p>Sin planes de pago, sin anuncios y sin cuenta. El código está publicado con licencia MIT: cualquiera puede revisarlo, usarlo y mejorarlo.</p>
  </div>
  <div class="tablero">
    <div class="pieza abierto-datos entra">
      <table>
        <caption class="oculto">Fluye en pocas palabras</caption>
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
    </div>
    <div class="pieza pieza-hondo abierto-codigo entra" style="--i:1">
      <div>
        <h3>Hecho en Chile, abierto para todos</h3>
        <p>Fluye lo creó Esteban Maturana y lo publica en GitHub para que cualquier persona u organización lo use gratis.</p>
        <p>Si encuentras un error o quieres proponer una mejora, abre un reporte en el repositorio.</p>
      </div>
      <div class="cierre-botones"><a class="boton boton-claro" href="${REPO}">Ver el código en GitHub</a></div>
    </div>
  </div>
</section>

<section class="guias-portada" aria-labelledby="guias-titulo">
  <div class="cabeza entra">
    <h2 id="guias-titulo">Aprende a dibujar procesos</h2>
    <p>Guías cortas en español para entender BPMN y hacer diagramas que se lean a la primera, con ejemplos que puedes recorrer con el Play.</p>
  </div>
  <div class="tablero guias-tablero">
    <a class="pieza pieza-tarea guia-bpmn entra" href="guias/que-es-bpmn/"><span class="guia-dibujo">${SIMBOLOS.inicio}${SIMBOLOS.secuencia}${SIMBOLOS.tarea}${SIMBOLOS.secuencia}${SIMBOLOS.exclusiva}${SIMBOLOS.secuencia}${SIMBOLOS.fin}</span><span class="guia-texto"><span class="camino-titulo">Qué es BPMN</span><p>El estándar para dibujar procesos: de dónde viene, sus figuras y cuándo conviene usarlo.</p></span>${FLECHA}</a>
    <a class="pieza guia-flujo entra" style="--i:1" href="guias/diagrama-de-flujo/"><span class="guia-dibujo">${SIMBOLOS.inicio}${SIMBOLOS.secuencia}${SIMBOLOS.usuario}${SIMBOLOS.secuencia}${SIMBOLOS.fin}</span><span class="guia-texto"><span class="camino-titulo">Cómo hacer un diagrama de flujo</span><p>Siete pasos, del primer borrador al proceso que se entiende a la primera.</p></span>${FLECHA}</a>
    <a class="pieza guia-simbolos entra" href="guias/simbolos-bpmn/"><span class="guia-dibujo">${SIMBOLOS.mensaje}${SIMBOLOS.plazo}${SIMBOLOS.paralela}${SIMBOLOS.documento}</span><span class="guia-texto"><span class="camino-titulo">Símbolos BPMN</span><p>Qué significa cada figura, con su dibujo.</p></span>${FLECHA}</a>
    <a class="pieza pieza-2 guia-carriles entra" style="--i:1" href="guias/diagrama-de-carriles/"><span class="guia-dibujo">${SIMBOLOS.carril}${SIMBOLOS.pool}</span><span class="guia-texto"><span class="camino-titulo">Diagrama de carriles</span><p>Cómo mostrar quién hace cada paso y dónde el trabajo cambia de manos.</p></span>${FLECHA}</a>
  </div>
</section>

<section class="preguntas" aria-labelledby="preguntas-titulo">
  <div class="cabeza entra">
    <h2 id="preguntas-titulo">Preguntas frecuentes</h2>
    <p>Lo que más se pregunta antes de instalar. Si te queda otra duda, escríbela en el <a href="${REPO}/issues">repositorio de GitHub</a>.</p>
  </div>
  <div class="tablero preguntas-tablero" data-preguntas>
    <div class="pieza preguntas-indice">
      ${PREGUNTAS.map(([p, rta], i) => `<div class="pregunta${i === 0 ? ' abierta' : ''}"><h3><button type="button" class="pregunta-boton" id="pregunta-${i}" aria-expanded="${i === 0}" aria-controls="respuesta-${i}">${escapar(p)}</button></h3><div class="respuesta" id="respuesta-${i}" role="region" aria-labelledby="pregunta-${i}"><p>${escapar(rta)}</p></div></div>`).join('\n      ')}
    </div>
    <div class="pieza pieza-tarea preguntas-panel" aria-live="polite">
      <p class="pregunta-titulo">${escapar(PREGUNTAS[0][0])}</p>
      <p class="pregunta-texto">${escapar(PREGUNTAS[0][1])}</p>
    </div>
  </div>
</section>

<section class="tablero" lang="en" aria-labelledby="ingles-titulo">
  <div class="pieza ingles-texto entra">
    <h2 id="ingles-titulo" class="frase">Fluye in English</h2>
    <p><strong>Fluye</strong> is a free, open-source BPMN 2.0 process modeler and flowchart maker for Windows. Draw pools, lanes, tasks and gateways, then press Play to walk through the process token by token. It works offline, exports to BPMN, PNG, SVG, PDF, Word and a single-file interactive web page, and its interface is in Spanish.</p>
  </div>
  <div class="pieza pieza-tarea ingles-enlaces entra" style="--i:1">
    <a href="${DESCARGA}">Download for Windows</a>
    <a href="demo/">Try it in your browser</a>
    <a href="${REPO}">Source code on GitHub</a>
  </div>
</section>

<section class="tablero cierre" aria-labelledby="cierre-titulo">
  <div class="pieza cierre-flanco">
    <img src="imagenes/celular.png" width="780" height="1688" loading="lazy" alt="La página web que exporta Fluye, abierta en un celular con el Play detenido en una decisión.">
  </div>
  <div class="pieza pieza-azul cierre-centro entra">
    <h2 id="cierre-titulo">Ordena tu próximo proceso</h2>
    <p>Descárgalo gratis para Windows o pruébalo ahora en el navegador. Cuando lo termines, compártelo como una página web que se abre hasta en el celular.</p>
    <div class="cierre-botones">
      <a class="boton boton-claro" href="${DESCARGA}">Descargar gratis</a>
      <a class="boton boton-tarea" href="demo/">Probar sin instalar</a>
    </div>
  </div>
  <div class="pieza cierre-flanco" aria-hidden="true"></div>
</section>`;

  const esquema = [
    {
      '@context': 'https://schema.org', '@type': 'SoftwareApplication',
      name: 'Fluye', alternateName: ['Fluye BPMN', 'Fluye, modelador BPMN'], url: SITIO,
      applicationCategory: 'BusinessApplication', applicationSubCategory: 'Modelado de procesos BPMN y diagramas de flujo',
      operatingSystem: 'Windows 10, Windows 11', softwareVersion: VERSION, inLanguage: 'es', isAccessibleForFree: true,
      license: 'https://opensource.org/licenses/MIT', downloadUrl: DESCARGA, fileSize: PESO,
      screenshot: [`${SITIO}imagenes/editor.png`, `${SITIO}imagenes/play.png`], codeRepository: REPO,
      description: 'Programa gratis y de código abierto para hacer diagramas BPMN 2.0 y diagramas de flujo en Windows, en español, con un Play que recorre el proceso paso a paso.',
      keywords: 'diagramas BPMN, BPMN 2.0, modelador BPMN, programa para diagramas de flujo, diagrama de carriles, modelado de procesos, gratis, español',
      featureList: 'Diagramas BPMN 2.0, diagramas de flujo, diagramas de carriles, Play paso a paso, revisión del diagrama, 33 plantillas, exportar a PDF, Word, PNG, SVG y página web interactiva, corrector en español, sin internet',
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
    titulo: 'Fluye: programa gratis para hacer diagramas BPMN y de flujo',
    descripcion: 'Programa gratis y en español para hacer diagramas BPMN y de flujo en Windows. Recórrelos paso a paso con el Play, usa 33 plantillas y exporta a PDF o Word.',
    cuerpo, esquema, clase: 'es-portada'
  };
}
