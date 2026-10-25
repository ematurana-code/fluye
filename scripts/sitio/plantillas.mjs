// Páginas de plantillas: el índice por área y una página por plantilla con la vista y el Play, quién hace qué (los
// carriles con los pasos en orden), las decisiones, cómo empieza y termina, y plantillas parecidas. Cada página tiene
// su propio texto, sacado del proceso.
import { DESCARGA, FLECHA, SITIO, enFluye, escapar, migas, vistaPlay } from './comun.mjs';

export const NIVELES = {
  simple: { nombre: 'Simple', detalle: 'un pool, pocos pasos y una decisión' },
  intermedia: { nombre: 'Intermedia', detalle: 'varios carriles, vueltas atrás y caminos en paralelo' },
  avanzada: { nombre: 'Avanzada', detalle: 'varios pools que se mandan mensajes, plazos y un subproceso en otra pestaña' }
};

const lista = (cosas) => cosas.length > 1 ? `${cosas.slice(0, -1).join(', ')} y ${cosas[cosas.length - 1]}` : (cosas[0] || '');
const corto = (texto, max = 158) => (texto.length <= max ? texto : `${texto.slice(0, max - 1).replace(/\s+\S*$/, '')}…`);

// La lista de plantillas por área con la vista del diagrama fija al lado (la cambia sitio.js al pasar por cada nombre).
export function catalogo(r, plantillas, areas, { titulo = 'h3' } = {}) {
  const p = plantillas.find((x) => x.ruta === 'solicitud-de-compra') || plantillas[0];
  return `
  <div class="tablero catalogo" data-catalogo>
    <div class="catalogo-vista">
      <div class="pieza catalogo-imagen"><img src="${r}plantillas/${p.ruta}/vista.png" width="1200" height="700" loading="lazy" alt="Vista del diagrama ${escapar(p.nombre)}" data-catalogo-imagen></div>
      <div class="pieza pieza-2 catalogo-ficha"><p class="frase" data-catalogo-nombre>${escapar(p.nombre)}</p><p data-catalogo-texto>${escapar(p.descripcion)}</p></div>
    </div>
    <div class="pieza catalogo-listas">${areas.map((a) => `
      <section class="catalogo-area entra" id="${a.ruta}" aria-labelledby="area-${a.ruta}">
        <${titulo} id="area-${a.ruta}" class="frase">${escapar(a.nombre)}</${titulo}>
        <ul>${plantillas.filter((x) => x.categoria === a.nombre).map((x) => `
          <li data-nivel="${x.nivel}"><a href="${r}plantillas/${x.ruta}/" data-vista="${r}plantillas/${x.ruta}/vista.png" data-nombre="${escapar(x.nombre)}" data-texto="${escapar(x.descripcion)}"><span>${escapar(x.nombre)}</span><span>${escapar(x.nivelNombre)}</span><span class="catalogo-detalle">${escapar(x.descripcion)} Trae ${escapar(x.incluye)}.</span></a></li>`).join('')}
        </ul>
      </section>`).join('')}
    </div>
  </div>`;
}

// "Quién hace qué, paso a paso": una columna por responsable y una fila por momento del diagrama.
const TIPO = { inicio: 'Inicio', fin: 'Fin', decision: 'Decisión', evento: 'Espera', tarea: 'Paso' };
export function carriles({ carriles: cols, figuras, filas }) {
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
        <li class="flujo-celda" style="grid-column:${c.carril + 1};grid-row:${c.fila + 2}">${c.figuras.map((f) => `<span class="paso paso-${f.tipo}">${f.tipo === 'tarea' ? '' : '<span class="paso-figura" aria-hidden="true"></span>'}<span class="paso-quien">${escapar(cols[c.carril].nombre)}<span class="oculto">, ${TIPO[f.tipo]}:</span></span>${escapar(f.nombre)}</span>`).join('')}</li>`).join('')}
      </ol>
    </div>`;
}

// Las decisiones como rombos amarillos y, al lado, el Play detenido en una decisión.
function decisiones(r, a) {
  const todas = a.pools.flatMap((p) => p.decisiones);
  if (!todas.length) return '';
  return `
  <section aria-labelledby="decisiones-titulo">
    <div class="cabeza entra">
      <h2 id="decisiones-titulo">Las decisiones del proceso</h2>
      <p>En cada decisión el proceso se divide. Con el Play eliges el camino y ves a dónde lleva cada respuesta.</p>
    </div>
    <div class="tablero decisiones">
      <div class="decisiones-lista">${todas.map((d, i) => `
        <div class="pieza pieza-decision decision-tarjeta entra" style="--i:${i % 3}">
          <h3>${escapar(d.pregunta)}</h3>
          <ul>${d.caminos.map((c) => `<li><strong>${escapar(c.nombre || 'Camino')}</strong>${c.destino ? `: ${escapar(c.destino)}` : ''}</li>`).join('')}</ul>
        </div>`).join('')}
      </div>
      <figure class="pieza pieza-foto decision-foto entra" style="--i:1">
        <img src="${r}imagenes/play.png" width="1440" height="860" loading="lazy" alt="El Play de Fluye detenido en una decisión, con los dos caminos posibles para elegir.">
      </figure>
    </div>
  </section>`;
}

// Del evento de inicio al de fin: lo que pone en marcha el proceso, lo que pasa entre medio y cómo puede terminar.
function bordes(a) {
  const inicios = a.pools.flatMap((p) => p.inicios), fines = a.pools.flatMap((p) => p.fines);
  const medio = [];
  if (a.mensajes.length) medio.push(['Mensajes entre pools', lista(a.mensajes)]);
  const plazos = a.pools.reduce((n, p) => n + p.plazos, 0);
  if (plazos) medio.push(['Plazos', plazos === 1 ? 'Un evento de tiempo que espera o vence' : `${plazos} eventos de tiempo`]);
  const subprocesos = a.pools.flatMap((p) => p.subprocesos);
  if (subprocesos.length) medio.push(['Subprocesos', lista(subprocesos)]);
  if (a.pestanas.length > 1) medio.push(['Pestañas', lista(a.pestanas)]);
  if (!medio.length) medio.push(['Entre medio', `${a.pasos} pasos y ${a.decisiones === 1 ? 'una decisión' : `${a.decisiones} decisiones`}`]);
  return `<div class="tablero bordes">
      <div class="pieza pieza-inicio bordes-inicio entra"><p class="bordes-titulo">Empieza cuando</p><p class="bordes-texto">${escapar(lista(inicios) || 'Llega lo que pone en marcha el proceso')}</p></div>
      <dl class="pieza bordes-medio entra" style="--i:1">${medio.map(([t, x]) => `<div><dt>${t}</dt><dd>${escapar(x)}</dd></div>`).join('')}</dl>
      <div class="pieza pieza-fin bordes-fin entra" style="--i:2"><p class="bordes-titulo">Termina en</p><p class="bordes-texto">${escapar(lista(fines) || 'Un resultado del proceso')}</p></div>
    </div>`;
}

export function paginaPlantilla(p, todas) {
  const r = '../../';
  const a = p.analisis;
  const area = todas.filter((x) => x.categoria === p.categoria && x !== p);
  const nivel = todas.filter((x) => x.nivel === p.nivel && x.categoria !== p.categoria).slice(0, 4);
  const { html: migasHtml, esquema: migasEsquema } = migas(r, [
    { nombre: 'Inicio', ruta: '' }, { nombre: 'Plantillas', ruta: 'plantillas/' }, { nombre: p.nombre, ruta: `plantillas/${p.ruta}/` }
  ]);
  const cifras = [[a.pasos, 'pasos', 'paso'], [a.decisiones, 'decisiones', 'decisión'], [a.responsables, 'responsables', 'responsable'], [a.pools.length, 'pools', 'pool']];

  const cuerpo = `
<article class="plantilla">
  <header class="tablero titular">
    <div class="pieza titular-texto entra">
      <h1>${escapar(p.nombre)}</h1>
      <p class="bajada">Diagrama de flujo BPMN gratis del área ${escapar(p.categoria)}, nivel ${escapar(p.nivelNombre.toLowerCase())}. ${escapar(p.descripcion)} Trae ${escapar(p.incluye)}.</p>
      ${migasHtml}
    </div>
    <div class="pieza pieza-tarea titular-lado entra" style="--i:1">
      <div class="cifras">${cifras.map(([n, varios, uno]) => `<div><strong>${n}</strong><span>${n === 1 ? uno : varios}</span></div>`).join('')}</div>
    </div>
  </header>

  <div class="tablero plantilla-cuerpo">
    ${vistaPlay(r, { archivo: `plantillas/${p.ruta}/${p.ruta}.bpmn`, titulo: p.nombre, imagen: 'vista.png', alt: `Diagrama BPMN de ${p.nombre}`, clase: 'plantilla-vista entra', nota: 'Se abre a pantalla completa. En cada decisión eliges el camino.', perezosa: false })}
    <div class="plantilla-acciones">
      <a class="pieza pieza-azul entra" style="--i:1" href="${r}demo/?plantilla=${encodeURIComponent(p.id)}"><span><span class="camino-titulo">Abrir y editar en el navegador</span><span class="camino-nota">Sin instalar nada.</span></span>${FLECHA}</a>
      <a class="pieza entra" style="--i:2" href="${p.ruta}.bpmn" download><span><span class="camino-titulo">Descargar el archivo .bpmn</span><span class="camino-nota suave">Se abre en Fluye y en otros programas BPMN.</span></span>${FLECHA}</a>
      <div class="pieza pieza-tarea entra" style="--i:3"><p><strong>Úsala sin internet.</strong></p><p class="chico">Descarga <a href="${DESCARGA}">Fluye para Windows</a> y ábrela desde Nuevo, Desde una plantilla.</p></div>
    </div>
  </div>

  <section aria-labelledby="quien-titulo">
    <div class="cabeza entra">
      <h2 id="quien-titulo">Quién hace qué, paso a paso</h2>
      <p>Cada columna es un responsable y cada fila, un momento del proceso, en el mismo orden del diagrama. Así se ve dónde el trabajo cambia de manos.</p>
    </div>
    <div class="pieza carriles entra">${carriles(a.flujo)}</div>
  </section>

  ${decisiones(r, a)}

  <section aria-labelledby="bordes-titulo">
    <div class="cabeza entra">
      <h2 id="bordes-titulo">Cómo empieza y cómo termina</h2>
      <p>Lo que pone en marcha el proceso, sus resultados posibles y lo que pasa entre medio.</p>
    </div>
    ${bordes(a)}
  </section>

  <section aria-labelledby="usar-titulo">
    <div class="cabeza entra">
      <h2 id="usar-titulo">Cómo adaptar esta plantilla</h2>
      <p>Así pasa de ser un ejemplo a ser el proceso de tu organización.</p>
    </div>
    <div class="tablero">
      <div class="pieza pieza-tarea adaptar-pasos entra">
        <ol class="secuencia">
          <li><strong>Ábrela en Fluye</strong><span>En el programa: Nuevo, Desde una plantilla, ${escapar(p.categoria)}. En el navegador: con el botón Abrir y editar.</span></li>
          <li><strong>Cambia los responsables</strong><span>Haz doble clic en cada carril y escribe el cargo o el área que hace esos pasos en tu organización.</span></li>
          <li><strong>Ajusta los pasos</strong><span>Renombra, agrega o borra tareas; las flechas se vuelven a trazar solas y el panel te avisa si algo queda suelto.</span></li>
          <li><strong>Pruébala con el Play</strong><span>Recorre cada camino de cada decisión y revisa que todos lleguen a un fin.</span></li>
          <li><strong>Compártela</strong><span>Expórtala a PDF, Word o a una página web con el Play adentro.</span></li>
        </ol>
      </div>
      <div class="adaptar-fotos">
        <figure class="pieza pieza-foto entra" style="--i:1">
          <img src="${r}imagenes/galeria.png" width="1440" height="860" loading="lazy" alt="La galería de plantillas de Fluye, que se abre desde Nuevo, Desde una plantilla.">
        </figure>
        <figure class="pieza pieza-foto entra" style="--i:2">
          <img src="${r}imagenes/editor.png" width="1440" height="860" loading="lazy" alt="El editor de Fluye: la paleta de figuras a la izquierda, el diagrama al centro y el panel de revisión a la derecha.">
        </figure>
      </div>
    </div>
  </section>

  <section aria-labelledby="parecidas-titulo">
    <div class="cabeza entra">
      <h2 id="parecidas-titulo">Plantillas parecidas</h2>
      <p>${area.length ? `Otras del área ${escapar(p.categoria)} y otras` : 'Otras plantillas'} de nivel ${escapar(p.nivelNombre.toLowerCase())}. También puedes <a href="${r}plantillas/">ver las 33</a> o leer <a href="${r}guias/simbolos-bpmn/">qué significa cada símbolo</a>.</p>
    </div>
    <div class="pieza entra">
      <ul class="parecidas">${[...area, ...nivel].map((x) => `
        <li><a href="${r}plantillas/${x.ruta}/"><strong>${escapar(x.nombre)}</strong><span>${escapar(x.categoria)}, nivel ${escapar(x.nivelNombre.toLowerCase())}</span></a></li>`).join('')}
      </ul>    </div>
  </section>
</article>`;

  return {
    ruta: `plantillas/${p.ruta}/`,
    titulo: `Diagrama de flujo: ${p.nombre} | Plantilla BPMN gratis`,
    imagen: `plantillas/${p.ruta}/vista.png`,
    descripcion: corto(`${p.descripcion} Plantilla BPMN gratis (${p.categoria}): ${p.incluye}. Ábrela en el navegador o descárgala para Fluye.`),
    cuerpo,
    esquema: [migasEsquema, {
      '@context': 'https://schema.org', '@type': 'CreativeWork', name: `Diagrama de flujo: ${p.nombre}`, description: p.descripcion,
      inLanguage: 'es', isAccessibleForFree: true, license: 'https://opensource.org/licenses/MIT', url: `${SITIO}plantillas/${p.ruta}/`,
      about: ['Diagrama de flujo', 'BPMN', p.categoria], encodingFormat: 'application/bpmn+xml',
      image: `${SITIO}plantillas/${p.ruta}/vista.png`
    }]
  };
}

export function indicePlantillas(todas, areas) {
  const r = '../';
  const { html: migasHtml, esquema: migasEsquema } = migas(r, [{ nombre: 'Inicio', ruta: '' }, { nombre: 'Plantillas', ruta: 'plantillas/' }]);
  const cuerpo = `
<div class="pila">
  <header class="tablero titular titular-grande">
    <div class="pieza titular-texto entra">
      <h1>Plantillas de diagramas de flujo</h1>
      <p class="bajada">${todas.length} procesos armados con el estándar BPMN, de ${areas.length} áreas de una organización. Cada uno se puede recorrer con el Play, abrir en el navegador para editarlo o descargar como archivo .bpmn.</p>
      ${migasHtml}
    </div>
    <figure class="pieza pieza-foto titular-lado titular-foto obturador">
      <img src="${r}imagenes/galeria.png" width="1440" height="860" alt="La galería de plantillas dentro de Fluye, con filtros por nivel y por área.">
    </figure>
  </header>
  <div class="niveles entra" role="group" aria-label="Filtrar por nivel">
    <button type="button" class="nivel activo" data-nivel="" aria-pressed="true"><strong>Todos los niveles</strong><span>las ${todas.length} plantillas, de la más simple a la más completa</span></button>
    ${Object.entries(NIVELES).map(([id, n]) => `<button type="button" class="nivel" data-nivel="${id}" aria-pressed="false"><strong>${n.nombre}</strong><span>${n.detalle}</span></button>`).join('')}
  </div>
  ${catalogo(r, todas, areas, { titulo: 'h2' })}
</div>

<section aria-labelledby="usar-titulo">
  <div class="cabeza entra">
    <h2 id="usar-titulo">Cómo se usa una plantilla</h2>
    <p>La abres en Fluye desde Nuevo, Desde una plantilla, o en el navegador desde su página. Después es tuya: la cambias, la pruebas y la compartes.</p>
  </div>
  ${enFluye(r)}
</section>`;
  return {
    ruta: 'plantillas/',
    titulo: 'Plantillas de diagramas de flujo gratis (BPMN) | Fluye',
    descripcion: `${todas.length} plantillas de diagramas de flujo y procesos BPMN gratis: compras, ventas, recursos humanos, finanzas, soporte TI, logística, calidad y más. Recórrelas con el Play.`,
    cuerpo,
    esquema: [migasEsquema, {
      '@context': 'https://schema.org', '@type': 'ItemList', name: 'Plantillas de diagramas de flujo de Fluye',
      itemListElement: todas.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITIO}plantillas/${p.ruta}/`, name: p.nombre }))
    }]
  };
}
