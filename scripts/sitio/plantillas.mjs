// Páginas de plantillas: el índice por área y una página por plantilla con el visor real, quién hace qué, las
// decisiones, cómo empieza y termina, y plantillas parecidas. Cada página tiene su propio texto, sacado del proceso.
import { DESCARGA, SITIO, escapar, migas, visor } from './comun.mjs';

export const NIVELES = {
  simple: { nombre: 'Simple', detalle: 'un pool, pocos pasos y una decisión' },
  intermedia: { nombre: 'Intermedia', detalle: 'varios carriles, vueltas atrás y caminos en paralelo' },
  avanzada: { nombre: 'Avanzada', detalle: 'varios pools que se mandan mensajes, plazos y un subproceso en otra pestaña' }
};

const lista = (cosas) => cosas.length > 1 ? `${cosas.slice(0, -1).join(', ')} y ${cosas[cosas.length - 1]}` : (cosas[0] || '');
const corto = (texto, max = 158) => (texto.length <= max ? texto : `${texto.slice(0, max - 1).replace(/\s+\S*$/, '')}…`);

function quienHaceQue(a) {
  const variosPools = a.pools.length > 1;
  return a.pools.map((pool) => `
    ${variosPools ? `<h3>${escapar(pool.nombre)}</h3>` : ''}
    <dl class="responsables">
      ${pool.carriles.filter((c) => c.pasos.length).map((c) => `
      <div>
        <dt>${escapar(c.nombre || pool.nombre || 'Proceso')}</dt>
        <dd><ul>${c.pasos.map((p) => `<li>${escapar(p)}</li>`).join('')}</ul></dd>
      </div>`).join('')}
    </dl>`).join('');
}

function decisiones(a) {
  const todas = a.pools.flatMap((p) => p.decisiones);
  if (!todas.length) return '';
  return `
  <section class="bloque" aria-labelledby="decisiones-titulo">
    <h2 id="decisiones-titulo">Las decisiones del proceso</h2>
    <p>En cada decisión el proceso se divide. Con el Play eliges el camino y ves a dónde lleva cada respuesta.</p>
    <dl class="decisiones">
      ${todas.map((d) => `
      <div>
        <dt><span class="rombo-chico" aria-hidden="true"></span>${escapar(d.pregunta)}</dt>
        <dd><ul>${d.caminos.map((c) => `<li><strong>${escapar(c.nombre || 'Camino')}</strong>${c.destino ? `: ${escapar(c.destino)}` : ''}</li>`).join('')}</ul></dd>
      </div>`).join('')}
    </dl>
  </section>`;
}

function bordes(a) {
  const inicios = a.pools.flatMap((p) => p.inicios), fines = a.pools.flatMap((p) => p.fines);
  const datos = [];
  if (inicios.length) datos.push(`<div><dt>Empieza cuando</dt><dd>${escapar(lista(inicios))}</dd></div>`);
  if (fines.length) datos.push(`<div><dt>Termina en</dt><dd>${escapar(lista(fines))}</dd></div>`);
  if (a.mensajes.length) datos.push(`<div><dt>Mensajes entre pools</dt><dd>${escapar(lista(a.mensajes))}</dd></div>`);
  const plazos = a.pools.reduce((n, p) => n + p.plazos, 0);
  if (plazos) datos.push(`<div><dt>Plazos</dt><dd>${plazos === 1 ? 'Un evento de tiempo que espera o vence' : `${plazos} eventos de tiempo`}</dd></div>`);
  const subprocesos = a.pools.flatMap((p) => p.subprocesos);
  if (subprocesos.length) datos.push(`<div><dt>Subprocesos</dt><dd>${escapar(lista(subprocesos))}</dd></div>`);
  if (a.pestanas.length > 1) datos.push(`<div><dt>Pestañas</dt><dd>${escapar(lista(a.pestanas))}</dd></div>`);
  return `<dl class="datos">${datos.join('')}</dl>`;
}

function tarjeta(p) {
  return `
    <li>
      <a href="${p.raizRel}plantillas/${p.ruta}/">
        <img src="${p.raizRel}plantillas/${p.ruta}/vista.svg" width="320" height="180" loading="lazy" alt="Vista del diagrama ${escapar(p.nombre)}">
        <strong>${escapar(p.nombre)}</strong>
        <span>${escapar(p.categoria)} · nivel ${escapar(p.nivelNombre.toLowerCase())}</span>
      </a>
    </li>`;
}

export function paginaPlantilla(p, todas) {
  const r = '../../';
  const a = p.analisis;
  const area = todas.filter((x) => x.categoria === p.categoria && x !== p);
  const nivel = todas.filter((x) => x.nivel === p.nivel && x.categoria !== p.categoria).slice(0, 3);
  const { html: migasHtml, esquema: migasEsquema } = migas(r, [
    { nombre: 'Inicio', ruta: '' }, { nombre: 'Plantillas', ruta: 'plantillas/' }, { nombre: p.nombre, ruta: `plantillas/${p.ruta}/` }
  ]);
  const cifras = [`${a.pasos} pasos`, `${a.decisiones} ${a.decisiones === 1 ? 'decisión' : 'decisiones'}`];
  if (a.responsables) cifras.push(`${a.responsables} ${a.responsables === 1 ? 'responsable' : 'responsables'}`);
  if (a.pools.length > 1) cifras.push(`${a.pools.length} pools`);
  const relacion = (x) => ({ ...x, raizRel: r });

  const cuerpo = `
<article class="plantilla">
  ${migasHtml}
  <header class="plantilla-cabeza">
    <h1>Diagrama de flujo: ${escapar(p.nombre)}</h1>
    <p class="bajada">${escapar(p.descripcion)} Plantilla BPMN gratis del área ${escapar(p.categoria)}, nivel ${escapar(p.nivelNombre.toLowerCase())}: trae ${escapar(p.incluye)}.</p>
    <p class="cifras">${cifras.map(escapar).join(' · ')}</p>
    <div class="acciones">
      <a class="boton" href="${r}demo/?plantilla=${encodeURIComponent(p.id)}">Abrir y editar en el navegador</a>
      <a class="boton boton-claro" href="${p.ruta}.bpmn" download>Descargar el archivo .bpmn</a>
    </div>
    <p class="nota">Para guardarla en tu computador y usarla sin internet, <a href="${DESCARGA}">descarga Fluye para Windows</a> y ábrela desde Nuevo → Desde una plantilla.</p>
  </header>

  ${visor(r, { archivo: `plantillas/${p.ruta}/${p.ruta}.bpmn`, titulo: p.nombre, alto: 600, perezoso: false })}

  <section class="bloque" aria-labelledby="quien-titulo">
    <h2 id="quien-titulo">Quién hace qué</h2>
    <p>Cada carril es un responsable. Estos son los pasos que le tocan a cada uno en el proceso “${escapar(p.nombre)}”.</p>
    ${quienHaceQue(a)}
  </section>

  ${decisiones(a)}

  <section class="bloque" aria-labelledby="bordes-titulo">
    <h2 id="bordes-titulo">Cómo empieza y cómo termina</h2>
    ${bordes(a)}
  </section>

  <section class="bloque" aria-labelledby="usar-titulo">
    <h2 id="usar-titulo">Cómo adaptar esta plantilla</h2>
    <ol class="pasos-guia">
      <li><strong>Ábrela en Fluye.</strong> En el programa: Nuevo → Desde una plantilla → ${escapar(p.categoria)}. En el navegador: con el botón de arriba.</li>
      <li><strong>Cambia los responsables.</strong> Haz doble clic en cada carril y escribe el cargo o el área que hace esos pasos en tu organización.</li>
      <li><strong>Ajusta los pasos.</strong> Renombra, agrega o borra tareas; las flechas se vuelven a trazar solas y el panel te avisa si algo queda suelto.</li>
      <li><strong>Pruébala con el Play.</strong> Recorre cada camino de cada decisión y revisa que todos lleguen a un fin.</li>
      <li><strong>Compártela.</strong> Expórtala a PDF, Word o a una página web con el Play adentro.</li>
    </ol>
  </section>

  ${area.length ? `
  <section class="bloque" aria-labelledby="area-titulo">
    <h2 id="area-titulo">Otras plantillas de ${escapar(p.categoria)}</h2>
    <ul class="muestras-lista">${area.map((x) => tarjeta(relacion(x))).join('')}</ul>
  </section>` : ''}

  <section class="bloque" aria-labelledby="nivel-titulo">
    <h2 id="nivel-titulo">Más plantillas de nivel ${escapar(p.nivelNombre.toLowerCase())}</h2>
    <ul class="muestras-lista">${nivel.map((x) => tarjeta(relacion(x))).join('')}</ul>
    <p class="mas"><a href="${r}plantillas/">Ver las 33 plantillas</a> · <a href="${r}guias/simbolos-bpmn/">Qué significa cada símbolo</a></p>
  </section>
</article>`;

  return {
    ruta: `plantillas/${p.ruta}/`,
    titulo: `Diagrama de flujo: ${p.nombre} | Plantilla BPMN gratis`,
    descripcion: corto(`${p.descripcion} Plantilla BPMN gratis (${p.categoria}): ${p.incluye}. Ábrela en el navegador o descárgala para Fluye.`),
    cuerpo,
    esquema: [migasEsquema, {
      '@context': 'https://schema.org', '@type': 'CreativeWork', name: `Diagrama de flujo: ${p.nombre}`, description: p.descripcion,
      inLanguage: 'es', isAccessibleForFree: true, license: 'https://opensource.org/licenses/MIT', url: `${SITIO}plantillas/${p.ruta}/`,
      about: ['Diagrama de flujo', 'BPMN', p.categoria], encodingFormat: 'application/bpmn+xml'
    }]
  };
}

export function indicePlantillas(todas, areas) {
  const r = '../';
  const { html: migasHtml, esquema: migasEsquema } = migas(r, [{ nombre: 'Inicio', ruta: '' }, { nombre: 'Plantillas', ruta: 'plantillas/' }]);
  const cuerpo = `
<div class="ancho">
  ${migasHtml}
  <header class="cabeza-pagina">
    <h1>Plantillas de diagramas de flujo gratis</h1>
    <p class="bajada">33 procesos armados con el estándar BPMN, de ${areas.length} áreas de una organización. Cada uno se puede recorrer aquí mismo con el Play, abrir en el navegador para editarlo o descargar como archivo .bpmn.</p>
  </header>
  <div class="niveles" role="group" aria-label="Filtrar por nivel">
    <button type="button" class="nivel activo" data-nivel="" aria-pressed="true"><strong>Todos los niveles</strong><span>las 33 plantillas, de la más simple a la más completa</span></button>
    ${Object.entries(NIVELES).map(([id, n]) => `<button type="button" class="nivel" data-nivel="${id}" aria-pressed="false"><strong>${n.nombre}</strong><span>${n.detalle}</span></button>`).join('')}
  </div>
  ${areas.map((a) => `
  <section class="area" id="${a.ruta}" aria-labelledby="area-${a.ruta}">
    <h2 id="area-${a.ruta}">${escapar(a.nombre)}</h2>
    <ul class="muestras-lista">${todas.filter((p) => p.categoria === a.nombre).map((p) => `
      <li data-nivel="${p.nivel}">
        <a href="${p.ruta}/">
          <img src="${p.ruta}/vista.svg" width="320" height="180" loading="lazy" alt="Vista del diagrama ${escapar(p.nombre)}">
          <strong>${escapar(p.nombre)}</strong>
          <span>Nivel ${escapar(p.nivelNombre.toLowerCase())} · ${escapar(p.incluye)}</span>
        </a>
      </li>`).join('')}
    </ul>
  </section>`).join('')}
</div>`;
  return {
    ruta: 'plantillas/',
    titulo: 'Plantillas de diagramas de flujo gratis (BPMN) | Fluye',
    descripcion: `33 plantillas de diagramas de flujo y procesos BPMN gratis: compras, ventas, recursos humanos, finanzas, soporte TI, logística, calidad y más. Recórrelas con el Play.`,
    cuerpo,
    esquema: [migasEsquema, {
      '@context': 'https://schema.org', '@type': 'ItemList', name: 'Plantillas de diagramas de flujo de Fluye',
      itemListElement: todas.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITIO}plantillas/${p.ruta}/`, name: p.nombre }))
    }]
  };
}
