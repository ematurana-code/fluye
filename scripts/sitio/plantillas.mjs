// Páginas de plantillas: el índice por área y una página por plantilla con la vista y el Play, quién hace qué (los
// carriles con los pasos en orden), las decisiones, cómo empieza y termina, y plantillas parecidas. Cada página tiene
// su propio texto, sacado del proceso. Sirve para los dos idiomas: los textos fijos salen de T.
import { DESCARGA, FLECHA, PLAY, RUTAS, SITIO, enFluye, escapar, migas, urlVisor, vistaPlay } from './comun.mjs';

const queCabe = (opciones) => opciones.find((x) => x.length <= 62) || opciones.at(-1);

export const NIVELES = {
  es: {
    simple: { nombre: 'Simple', detalle: 'un pool, pocos pasos y una decisión' },
    intermedia: { nombre: 'Intermedia', detalle: 'varios carriles, vueltas atrás y caminos en paralelo' },
    avanzada: { nombre: 'Avanzada', detalle: 'varios pools que se mandan mensajes, plazos y un subproceso en otra pestaña' }
  },
  en: {
    simple: { nombre: 'Simple', detalle: 'one pool, a few steps and one decision' },
    intermedia: { nombre: 'Intermediate', detalle: 'several lanes, loops back and parallel paths' },
    avanzada: { nombre: 'Advanced', detalle: 'several pools exchanging messages, timers and a sub-process in another tab' }
  }
};

const T = {
  es: {
    y: 'y', trae: 'Trae', inicio: 'Inicio', camino: 'Camino',
    tipo: { inicio: 'Inicio', fin: 'Fin', decision: 'Decisión', evento: 'Espera', tarea: 'Paso' },
    decisionesTitulo: 'Las decisiones del proceso',
    decisionesTexto: 'En cada decisión el proceso se divide. Con el Play eliges el camino y ves a dónde lleva cada respuesta.',
    probarDecisiones: 'Pruébalas con el Play', recorrer: 'Recorrer con el Play', probarDecisionesTexto: 'El recorrido se detiene en cada decisión y te deja elegir la respuesta. Así ves a dónde lleva cada camino.',
    mensajes: 'Mensajes entre pools', plazos: 'Plazos', plazoUno: 'Un evento de tiempo que espera o vence', plazosN: (n) => `${n} eventos de tiempo`,
    subprocesos: 'Subprocesos', pestanas: 'Pestañas', entreMedio: 'Entre medio',
    entreMedioTexto: (a) => `${a.pasos} pasos y ${a.decisiones === 1 ? 'una decisión' : `${a.decisiones} decisiones`}`,
    empieza: 'Empieza cuando', empiezaVacio: 'Llega lo que pone en marcha el proceso', termina: 'Termina en', terminaVacio: 'Un resultado del proceso',
    cifras: [['pasos', 'paso'], ['decisiones', 'decisión'], ['responsables', 'responsable'], ['pools', 'pool']],
    bajada: (p) => `Diagrama de flujo BPMN gratis del área ${p.categoria}, nivel ${p.nivelNombre.toLowerCase()}. ${p.descripcion} Trae ${p.incluye}.`,
    diagramaAlt: (n) => `Diagrama BPMN de ${n}`, notaPlay: 'Se abre a pantalla completa. En cada decisión eliges el camino.',
    abrir: 'Abrir en Fluye', abrirNota: 'En el navegador, sin instalar: edítala y guárdala con tu nombre.',
    bajar: 'Descargar el archivo .bpmn', bajarNota: 'Se abre en Fluye y en otros programas BPMN.',
    sinInternet: 'Úsala sin internet.', sinInternetTexto: `Descarga <a href="${DESCARGA}">Fluye para Windows</a> y ábrela desde Nuevo, Desde una plantilla.`,
    quienTitulo: 'Quién hace qué, paso a paso',
    quienTexto: 'Cada columna es un responsable y cada fila, un momento del proceso, en el mismo orden del diagrama. Así se ve dónde el trabajo cambia de manos.',
    bordesTitulo: 'Cómo empieza y cómo termina', bordesTexto: 'Lo que pone en marcha el proceso, sus resultados posibles y lo que pasa entre medio.',
    adaptarTitulo: 'Cómo adaptar esta plantilla', adaptarTexto: 'Así pasa de ser un ejemplo a ser el proceso de tu organización.',
    adaptar: (p) => [
      ['Ábrela en Fluye', `En el programa: Nuevo, Desde una plantilla, ${p.categoria}. En el navegador: con el botón Abrir y editar.`],
      ['Cambia los responsables', 'Haz doble clic en cada carril y escribe el cargo o el área que hace esos pasos en tu organización.'],
      ['Ajusta los pasos', 'Renombra, agrega o borra tareas; las flechas se vuelven a trazar solas y el panel te avisa si algo queda suelto.'],
      ['Pruébala con el Play', 'Recorre cada camino de cada decisión y revisa que todos lleguen a un fin.'],
      ['Compártela', 'Expórtala a PDF, Word o a una página web con el Play adentro.']
    ],
    galeriaAlt: 'La galería de plantillas de Fluye, que se abre desde Nuevo, Desde una plantilla.',
    editorAlt: 'El editor de Fluye: la paleta de figuras a la izquierda, el diagrama al centro y el panel de revisión a la derecha.',
    playAlt: 'El Play de Fluye detenido en una decisión: eliges el camino y la bitácora anota cada paso.',
    parecidasTitulo: 'Plantillas parecidas',
    parecidasTexto: (p, hayArea, r, rutas) => `${hayArea ? `Otras del área ${escapar(p.categoria)} y otras` : 'Otras plantillas'} de nivel ${escapar(p.nivelNombre.toLowerCase())}. También puedes <a href="${r}${rutas.plantillas}">ver las 33</a> o leer <a href="${r}${rutas.guias}simbolos-bpmn/">qué significa cada símbolo</a>.`,
    nivelDe: (x) => `${x.categoria}, nivel ${x.nivelNombre.toLowerCase()}`,
    // Google corta cerca de los 60 caracteres: la forma más completa que quepa.
    titulo: (p) => queCabe([`${p.nombre}: diagrama de flujo | Plantilla BPMN gratis`, `${p.nombre}: diagrama de flujo BPMN gratis`, `${p.nombre}: diagrama de flujo BPMN`, `${p.nombre} (diagrama BPMN)`, `${p.nombre} (BPMN)`]),
    descripcion: (p) => `${p.descripcion} Plantilla BPMN gratis (${p.categoria}): ${p.incluye}. Ábrela en el navegador o descárgala para Fluye.`,
    sobre: ['Diagrama de flujo', 'BPMN'], obra: (p) => `Diagrama de flujo: ${p.nombre}`, plantillasMiga: 'Plantillas',
    indiceH1: 'Plantillas de diagramas de flujo',
    indiceBajada: (n, a) => `${n} procesos armados con el estándar BPMN, de ${a} áreas de una organización. Cada uno se puede recorrer con el Play, abrir en el navegador para editarlo o descargar como archivo .bpmn.`,
    galeriaIndiceAlt: 'La galería de plantillas dentro de Fluye, con filtros por nivel y por área.',
    filtrar: 'Filtrar por nivel', todos: 'Todos los niveles', todosDetalle: (n) => `las ${n} plantillas, de la más simple a la más completa`,
    usarTitulo: 'Cómo se usa una plantilla',
    usarTexto: 'La abres en Fluye desde Nuevo, Desde una plantilla, o en el navegador desde su página. Después es tuya: la cambias, la pruebas y la compartes.',
    indiceTitulo: 'Plantillas de diagramas de flujo gratis (BPMN) | Fluye',
    indiceDescripcion: (n) => `${n} plantillas gratis de diagramas de flujo y procesos BPMN: compras, ventas, RR. HH., finanzas, soporte TI, logística y más. Recórrelas con el Play.`,
    lista: 'Plantillas de diagramas de flujo de Fluye', vistaDe: (n) => `Vista del diagrama ${n}`
  },
  en: {
    y: 'and', trae: 'Includes', inicio: 'Home', camino: 'Path',
    tipo: { inicio: 'Start', fin: 'End', decision: 'Decision', evento: 'Wait', tarea: 'Step' },
    decisionesTitulo: 'The decisions in this process',
    decisionesTexto: 'At each decision the process splits. With Play you choose the path and see where each answer leads.',
    probarDecisiones: 'Try them with Play', recorrer: 'Walk through with Play', probarDecisionesTexto: 'The walkthrough stops at each decision and lets you pick the answer, so you can see where every path leads.',
    mensajes: 'Messages between pools', plazos: 'Timers', plazoUno: 'One timer event that waits or expires', plazosN: (n) => `${n} timer events`,
    subprocesos: 'Sub-processes', pestanas: 'Tabs', entreMedio: 'In between',
    entreMedioTexto: (a) => `${a.pasos} steps and ${a.decisiones === 1 ? 'one decision' : `${a.decisiones} decisions`}`,
    empieza: 'Starts when', empiezaVacio: 'Whatever triggers the process arrives', termina: 'Ends in', terminaVacio: 'One process outcome',
    cifras: [['steps', 'step'], ['decisions', 'decision'], ['roles', 'role'], ['pools', 'pool']],
    bajada: (p) => `Free BPMN flowchart template for ${p.categoria.toLowerCase()}, ${p.nivelNombre.toLowerCase()} level. ${p.descripcion} Includes ${p.incluye}.`,
    diagramaAlt: (n) => `BPMN diagram: ${n}`, notaPlay: 'Opens full screen. You choose the path at each decision.',
    abrir: 'Open in Fluye', abrirNota: 'In your browser, nothing to install: edit it and save it as yours.',
    bajar: 'Download the .bpmn file', bajarNota: 'Opens in Fluye and in other BPMN tools.',
    sinInternet: 'Use it offline.', sinInternetTexto: `Download <a href="${DESCARGA}">Fluye for Windows</a> and open the file with Open. The interface is in Spanish.`,
    quienTitulo: 'Who does what, step by step',
    quienTexto: 'Each column is a role and each row a moment in the process, in the same order as the diagram. You can see where work changes hands.',
    bordesTitulo: 'How it starts and how it ends', bordesTexto: 'What triggers the process, its possible outcomes and what happens in between.',
    adaptarTitulo: 'How to adapt this template', adaptarTexto: 'This is how an example becomes your organization\'s process.',
    adaptar: () => [
      ['Open it in Fluye', 'Download the .bpmn file and open it in Fluye, or use the Open and edit button to work in your browser.'],
      ['Change the roles', 'Double-click each lane and type the job title or department that does those steps in your organization.'],
      ['Adjust the steps', 'Rename, add or delete tasks; arrows re-route themselves and the panel warns you if anything is left loose.'],
      ['Test it with Play', 'Walk through every path of every decision and check that they all reach an end.'],
      ['Share it', 'Export it to PDF, Word or an interactive web page with Play built in.']
    ],
    galeriaAlt: 'The Fluye template gallery, opened from New, From a template.',
    editorAlt: 'The Fluye editor: shape palette on the left, diagram in the middle and review panel on the right.',
    playAlt: 'Fluye\'s Play stopped at a decision: you pick the path and the log records each step.',
    parecidasTitulo: 'Similar templates',
    parecidasTexto: (p, hayArea, r, rutas) => `${hayArea ? `More ${escapar(p.categoria.toLowerCase())} templates and others` : 'Other templates'} at the ${escapar(p.nivelNombre.toLowerCase())} level. You can also <a href="${r}${rutas.plantillas}">see all 33</a> or read <a href="${r}${rutas.guias}bpmn-symbols/">what each symbol means</a>.`,
    nivelDe: (x) => `${x.categoria}, ${x.nivelNombre.toLowerCase()}`,
    titulo: (p) => queCabe([`${p.nombre} flowchart | Free BPMN template`, `${p.nombre}: free BPMN flowchart`, `${p.nombre} BPMN flowchart`, `${p.nombre} (BPMN)`]),
    descripcion: (p) => `${p.descripcion} Free BPMN template (${p.categoria}): ${p.incluye}. Open it in your browser or download it for Fluye.`,
    sobre: ['Flowchart', 'BPMN'], obra: (p) => `${p.nombre} flowchart`, plantillasMiga: 'Templates',
    indiceH1: 'Free flowchart templates',
    indiceBajada: (n, a) => `${n} ready-made processes drawn with the BPMN standard, across ${a} areas of an organization. Walk through each one with Play, open it in your browser to edit, or download it as a .bpmn file.`,
    galeriaIndiceAlt: 'The template gallery inside Fluye, with filters by level and area.',
    filtrar: 'Filter by level', todos: 'All levels', todosDetalle: (n) => `all ${n} templates, from the simplest to the most complete`,
    usarTitulo: 'How to use a template',
    usarTexto: 'Open it in your browser from its page, or download the .bpmn file and open it in Fluye. Then it is yours: change it, test it and share it.',
    indiceTitulo: 'Free flowchart and BPMN templates | Fluye',
    indiceDescripcion: (n) => `${n} free flowchart and BPMN process templates: purchasing, sales, HR, finance, IT support, logistics, quality and more. Walk through them with Play.`,
    lista: 'Fluye flowchart templates', vistaDe: (n) => `Diagram preview: ${n}`
  }
};

const lista = (cosas, y) => cosas.length > 1 ? `${cosas.slice(0, -1).join(', ')} ${y} ${cosas[cosas.length - 1]}` : (cosas[0] || '');
const corto = (texto, max = 158) => (texto.length <= max ? texto : `${texto.slice(0, max - 1).replace(/\s+\S*$/, '')}…`);

// La lista de plantillas por área con la vista del diagrama fija al lado (la cambia sitio.js al pasar por cada nombre).
// El nivel como tres barras (una, dos o tres llenas), para que la lista quepa en tres columnas; el nombre del nivel
// queda para los lectores de pantalla y en la leyenda de arriba.
const marcaNivel = (nivel, nombre = '') => `<span class="marca-nivel marca-${nivel}"${nombre ? '' : ' aria-hidden="true"'}><i></i><i></i><i></i>${nombre ? `<span class="oculto">${escapar(nombre)}</span>` : ''}</span>`;

// Dirección de la app web con la plantilla abierta: las del español vienen en la app (?plantilla=); las del inglés se
// cargan desde su página (?archivo=, relativo a app/).
export const abrirEnApp = (r, p, idioma) => (idioma === 'es'
  ? `${r}app/?plantilla=${encodeURIComponent(p.id)}`
  : `${r}app/?archivo=${encodeURIComponent(`../${RUTAS[idioma].plantillas}${p.ruta}/${p.ruta}.bpmn`)}`);

export function catalogo(r, plantillas, areas, { titulo = 'h3', idioma = 'es' } = {}) {
  const t = T[idioma], base = `${r}${RUTAS[idioma].plantillas}`;
  const p = plantillas.find((x) => x.id === 'compras-simple') || plantillas[0];
  return `
  <div class="tablero catalogo" data-catalogo>
    <div class="catalogo-vista">
      <div class="pieza catalogo-imagen"><img src="${base}${p.ruta}/vista.png" width="1200" height="700" loading="lazy" alt="${escapar(t.vistaDe(p.nombre))}" data-catalogo-imagen></div>
      <div class="pieza pieza-2 catalogo-ficha"><p class="frase" data-catalogo-nombre>${escapar(p.nombre)}</p><p data-catalogo-texto>${escapar(p.descripcion)}</p><a class="boton catalogo-abrir" href="${escapar(abrirEnApp(r, p, idioma))}" data-catalogo-abrir>${t.abrir}</a></div>
    </div>
    <div class="pieza catalogo-listas">
      <p class="catalogo-leyenda chico">${Object.keys(NIVELES[idioma]).map((k) => `<span>${marcaNivel(k)}${NIVELES[idioma][k].nombre}</span>`).join('')}</p>${areas.map((a) => `
      <section class="catalogo-area entra" id="${a.ruta}" aria-labelledby="area-${a.ruta}">
        <${titulo} id="area-${a.ruta}" class="frase">${escapar(a.nombre)}</${titulo}>
        <ul>${plantillas.filter((x) => x.categoria === a.nombre).map((x) => `
          <li data-nivel="${x.nivel}"><a href="${base}${x.ruta}/" data-vista="${base}${x.ruta}/vista.png" data-nombre="${escapar(x.nombre)}" data-texto="${escapar(x.descripcion)}" data-abrir="${escapar(abrirEnApp(r, x, idioma))}"><span>${escapar(x.nombre)}</span>${marcaNivel(x.nivel, x.nivelNombre)}</a></li>`).join('')}
        </ul>
      </section>`).join('')}
    </div>
  </div>`;
}

// "Quién hace qué, paso a paso": una columna por responsable y una fila por momento del diagrama.
export function carriles({ carriles: cols, figuras, filas }, idioma = 'es') {
  const tipo = T[idioma].tipo;
  const pools = [];
  cols.forEach((c, i) => {
    const ultimo = pools[pools.length - 1];
    if (ultimo && ultimo.nombre === c.pool) ultimo.n++; else pools.push({ nombre: c.pool, desde: i, n: 1 });
  });
  const conPools = pools.length > 1;
  const celdas = new Map();
  for (const f of figuras) {
    const clave = `${f.fila}:${f.carril}`;
    if (!celdas.has(clave)) celdas.set(clave, { fila: f.fila, carril: f.carril, figuras: [] });
    celdas.get(clave).figuras.push(f);
  }
  const orden = [...celdas.values()].sort((a, b) => a.fila - b.fila || a.carril - b.carril);
  return `
    <div class="flujo" style="--carriles:${cols.length};--filas:${filas}">
      ${conPools ? pools.map((p) => `<div class="flujo-pool" style="grid-column:${p.desde + 1} / span ${p.n}">${escapar(p.nombre)}</div>`).join('') : ''}
      ${cols.map((c, i) => `<div class="flujo-carril${conPools ? '' : ' sin-pool'}" style="grid-column:${i + 1}">${escapar(c.nombre)}</div>`).join('')}
      ${cols.map((c, i) => `<span class="flujo-fondo" style="grid-column:${i + 1}" aria-hidden="true"></span>`).join('')}
      <ol class="flujo-pasos">${orden.map((c) => `
        <li class="flujo-celda" style="grid-column:${c.carril + 1};grid-row:${c.fila + 2}">${c.figuras.map((f) => `<span class="paso paso-${f.tipo}">${f.tipo === 'tarea' ? '' : '<span class="paso-figura" aria-hidden="true"></span>'}<span class="paso-quien">${escapar(cols[c.carril].nombre)}<span class="oculto">, ${tipo[f.tipo]}: </span></span>${escapar(f.nombre)}</span>`).join('')}</li>`).join('')}
      </ol>
    </div>`;
}

// Las decisiones como rombos amarillos y, al lado, el botón para recorrerlas con el Play en esta misma plantilla.
function decisiones(r, a, t, archivo, titulo) {
  const todas = a.pools.flatMap((p) => p.decisiones);
  if (!todas.length) return '';
  return `
  <section aria-labelledby="decisiones-titulo">
    <div class="cabeza entra">
      <h2 id="decisiones-titulo">${t.decisionesTitulo}</h2>
      <p>${t.decisionesTexto}</p>
    </div>
    <div class="tablero decisiones">
      <div class="decisiones-lista">${todas.map((d, i) => `
        <div class="pieza pieza-decision decision-tarjeta entra" style="--i:${i % 3}">
          <h3>${escapar(d.pregunta)}</h3>
          <ul>${d.caminos.map((c) => `<li><strong>${escapar(c.nombre || t.camino)}</strong>${c.destino ? `: ${escapar(c.destino)}` : ''}</li>`).join('')}</ul>
        </div>`).join('')}
      </div>
      <a class="pieza pieza-azul decision-play entra" style="--i:1" href="${escapar(urlVisor(r, archivo, titulo))}" data-play data-titulo="${escapar(titulo)}">
        <span class="camino-titulo">${t.probarDecisiones}</span>
        <span class="camino-nota">${t.probarDecisionesTexto}</span>
        <span class="boton boton-claro">${PLAY}${t.recorrer}</span>
      </a>
    </div>
  </section>`;
}

// Del evento de inicio al de fin: lo que pone en marcha el proceso, lo que pasa entre medio y cómo puede terminar.
function bordes(a, t) {
  const inicios = a.pools.flatMap((p) => p.inicios), fines = a.pools.flatMap((p) => p.fines);
  const medio = [];
  if (a.mensajes.length) medio.push([t.mensajes, lista(a.mensajes, t.y)]);
  const plazos = a.pools.reduce((n, p) => n + p.plazos, 0);
  if (plazos) medio.push([t.plazos, plazos === 1 ? t.plazoUno : t.plazosN(plazos)]);
  const subprocesos = a.pools.flatMap((p) => p.subprocesos);
  if (subprocesos.length) medio.push([t.subprocesos, lista(subprocesos, t.y)]);
  if (a.pestanas.length > 1) medio.push([t.pestanas, lista(a.pestanas, t.y)]);
  if (!medio.length) medio.push([t.entreMedio, t.entreMedioTexto(a)]);
  return `<div class="tablero bordes">
      <div class="pieza pieza-inicio bordes-inicio entra"><p class="bordes-titulo">${t.empieza}</p><p class="bordes-texto">${escapar(lista(inicios, t.y) || t.empiezaVacio)}</p></div>
      <dl class="pieza bordes-medio entra" style="--i:1">${medio.map(([x, y]) => `<div><dt>${x}</dt><dd>${escapar(y)}</dd></div>`).join('')}</dl>
      <div class="pieza pieza-fin bordes-fin entra" style="--i:2"><p class="bordes-titulo">${t.termina}</p><p class="bordes-texto">${escapar(lista(fines, t.y) || t.terminaVacio)}</p></div>
    </div>`;
}

// p.alterna: la ruta de esta misma plantilla en el otro idioma (para hreflang y el cambio de idioma).
export function paginaPlantilla(p, todas, idioma = 'es') {
  const t = T[idioma], rutas = RUTAS[idioma];
  const r = '../'.repeat(`${rutas.plantillas}${p.ruta}/`.split('/').filter(Boolean).length);
  const a = p.analisis;
  const area = todas.filter((x) => x.categoria === p.categoria && x !== p);
  const nivel = todas.filter((x) => x.nivel === p.nivel && x.categoria !== p.categoria).slice(0, 4);
  const ruta = `${rutas.plantillas}${p.ruta}/`;
  const { html: migasHtml, esquema: migasEsquema } = migas(r, [
    { nombre: t.inicio, ruta: rutas.raiz }, { nombre: t.plantillasMiga, ruta: rutas.plantillas }, { nombre: p.nombre, ruta }
  ], idioma);
  const cifras = [a.pasos, a.decisiones, a.responsables, a.pools.length];
  const abrir = abrirEnApp(r, p, idioma);

  const cuerpo = `
<article class="plantilla">
  <header class="tablero titular">
    <div class="pieza titular-texto entra">
      <h1>${escapar(p.nombre)}</h1>
      <p class="bajada">${escapar(t.bajada(p))}</p>
      ${migasHtml}
    </div>
    <div class="pieza pieza-tarea titular-lado entra" style="--i:1">
      <div class="cifras">${cifras.map((n, i) => `<div><strong>${n}</strong><span>${n === 1 ? t.cifras[i][1] : t.cifras[i][0]}</span></div>`).join('')}</div>
    </div>
  </header>

  <div class="tablero plantilla-cuerpo">
    ${vistaPlay(r, { archivo: `${ruta}${p.ruta}.bpmn`, titulo: p.nombre, imagen: 'vista.png', alt: t.diagramaAlt(p.nombre), clase: 'plantilla-vista entra', nota: t.notaPlay, perezosa: false, idioma, ancho: p.vistaAncho, alto: p.vistaAlto })}
    <div class="plantilla-acciones">
      <a class="pieza pieza-azul entra" style="--i:1" href="${escapar(abrir)}"><span><span class="camino-titulo">${t.abrir}</span><span class="camino-nota">${t.abrirNota}</span></span>${FLECHA}</a>
      <a class="pieza entra" style="--i:2" href="${p.ruta}.bpmn" download><span><span class="camino-titulo">${t.bajar}</span><span class="camino-nota suave">${t.bajarNota}</span></span>${FLECHA}</a>
      <div class="pieza pieza-tarea entra" style="--i:3"><p><strong>${t.sinInternet}</strong></p><p class="chico">${t.sinInternetTexto}</p></div>
    </div>
  </div>

  <section aria-labelledby="quien-titulo">
    <div class="cabeza entra">
      <h2 id="quien-titulo">${t.quienTitulo}</h2>
      <p>${t.quienTexto}</p>
    </div>
    <div class="pieza carriles entra">${carriles(a.flujo, idioma)}</div>
  </section>

  ${decisiones(r, a, t, `${ruta}${p.ruta}.bpmn`, p.nombre)}

  <section aria-labelledby="bordes-titulo">
    <div class="cabeza entra">
      <h2 id="bordes-titulo">${t.bordesTitulo}</h2>
      <p>${t.bordesTexto}</p>
    </div>
    ${bordes(a, t)}
  </section>

  <section aria-labelledby="usar-titulo">
    <div class="cabeza entra">
      <h2 id="usar-titulo">${t.adaptarTitulo}</h2>
      <p>${t.adaptarTexto}</p>
    </div>
    <div class="tablero">
      <div class="pieza pieza-tarea adaptar-pasos entra">
        <ol class="secuencia">${t.adaptar(p).map(([x, y]) => `
          <li><strong>${x}</strong><span>${escapar(y)}</span></li>`).join('')}
        </ol>
      </div>
      <div class="adaptar-fotos">
        <figure class="pieza pieza-foto entra" style="--i:1">
          <img src="${r}imagenes/galeria.webp" width="2880" height="1800" loading="lazy" alt="${escapar(t.galeriaAlt)}">
        </figure>
        <figure class="pieza pieza-foto entra" style="--i:2">
          <img src="${r}imagenes/editor.webp" width="2880" height="1800" loading="lazy" alt="${escapar(t.editorAlt)}">
        </figure>
        <figure class="pieza pieza-foto entra" style="--i:3">
          <img src="${r}imagenes/play.webp" width="2880" height="1800" loading="lazy" alt="${escapar(t.playAlt)}">
        </figure>
      </div>
    </div>
  </section>

  <section aria-labelledby="parecidas-titulo">
    <div class="cabeza entra">
      <h2 id="parecidas-titulo">${t.parecidasTitulo}</h2>
      <p>${t.parecidasTexto(p, area.length > 0, r, rutas)}</p>
    </div>
    <div class="pieza entra">
      <ul class="parecidas">${[...area, ...nivel].map((x) => `
        <li><a href="${r}${rutas.plantillas}${x.ruta}/"><strong>${escapar(x.nombre)}</strong><span>${escapar(t.nivelDe(x))}</span></a></li>`).join('')}
      </ul>
    </div>
  </section>
</article>`;

  return {
    ruta, idioma, alternas: idioma === 'es' ? { es: ruta, en: p.alterna } : { es: p.alterna, en: ruta },
    titulo: t.titulo(p),
    imagen: `${ruta}vista.png`,
    descripcion: corto(t.descripcion(p)),
    cuerpo,
    esquema: [migasEsquema, {
      '@context': 'https://schema.org', '@type': 'CreativeWork', name: t.obra(p), description: p.descripcion,
      inLanguage: idioma, isAccessibleForFree: true, license: 'https://opensource.org/licenses/MIT', url: `${SITIO}${ruta}`,
      about: [...t.sobre, p.categoria], encodingFormat: 'application/bpmn+xml',
      image: `${SITIO}${ruta}vista.png`
    }]
  };
}

export function indicePlantillas(todas, areas, idioma = 'es') {
  const t = T[idioma], rutas = RUTAS[idioma];
  const ruta = rutas.plantillas;
  const r = '../'.repeat(ruta.split('/').filter(Boolean).length);
  const { html: migasHtml, esquema: migasEsquema } = migas(r, [{ nombre: t.inicio, ruta: rutas.raiz }, { nombre: t.plantillasMiga, ruta }], idioma);
  const cuerpo = `
<div class="pila">
  <header class="tablero titular titular-grande">
    <div class="pieza titular-texto entra">
      <h1>${t.indiceH1}</h1>
      <p class="bajada">${t.indiceBajada(todas.length, areas.length)}</p>
      ${migasHtml}
    </div>
    <figure class="pieza pieza-foto titular-lado titular-foto obturador">
      <img src="${r}imagenes/galeria.webp" width="2880" height="1800" alt="${escapar(t.galeriaIndiceAlt)}">
    </figure>
  </header>
  <div class="niveles entra" role="group" aria-label="${t.filtrar}">
    <button type="button" class="nivel activo" data-nivel="" aria-pressed="true"><strong>${t.todos}</strong><span>${t.todosDetalle(todas.length)}</span></button>
    ${Object.entries(NIVELES[idioma]).map(([id, n]) => `<button type="button" class="nivel" data-nivel="${id}" aria-pressed="false"><strong>${n.nombre}</strong><span>${n.detalle}</span></button>`).join('')}
  </div>
  ${catalogo(r, todas, areas, { titulo: 'h2', idioma })}
</div>

<section aria-labelledby="usar-titulo">
  <div class="cabeza entra">
    <h2 id="usar-titulo">${t.usarTitulo}</h2>
    <p>${t.usarTexto}</p>
  </div>
  ${enFluye(r, idioma)}
</section>`;
  return {
    ruta, idioma, alternas: { es: RUTAS.es.plantillas, en: RUTAS.en.plantillas },
    titulo: t.indiceTitulo,
    descripcion: t.indiceDescripcion(todas.length),
    cuerpo,
    esquema: [migasEsquema, {
      '@context': 'https://schema.org', '@type': 'ItemList', name: t.lista,
      itemListElement: todas.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITIO}${ruta}${p.ruta}/`, name: p.nombre }))
    }]
  };
}
