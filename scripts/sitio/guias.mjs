// Guías para quien busca cómo hacer diagramas: diagrama de flujo, símbolos BPMN y diagrama de carriles.
// Texto propio, figuras dibujadas como en Fluye y un ejemplo interactivo en cada una.
import { DESCARGA, SITIO, decision, escapar, migas, visor } from './comun.mjs';

// Figuras de BPMN con los colores de Fluye (inicio verde, fin rojo, decisión amarilla, tarea azul).
const S = (contenido, w = 72, h = 52) => `<svg class="simbolo" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true" focusable="false">${contenido}</svg>`;
const tarea = (icono = '') => S(`<rect x="4" y="8" width="64" height="36" rx="7" fill="#eef2ff" stroke="#1e3a8a" stroke-width="2"/>${icono}`);
export const SIMBOLOS = {
  inicio: S('<circle cx="36" cy="26" r="16" fill="#ecfccb" stroke="#4d7c0f" stroke-width="2"/>'),
  intermedio: S('<circle cx="36" cy="26" r="16" fill="#fef9c3" stroke="#a16207" stroke-width="2"/><circle cx="36" cy="26" r="12" fill="none" stroke="#a16207" stroke-width="1.6"/>'),
  plazo: S('<circle cx="36" cy="26" r="16" fill="#fef9c3" stroke="#a16207" stroke-width="2"/><circle cx="36" cy="26" r="12" fill="none" stroke="#a16207" stroke-width="1.6"/><circle cx="36" cy="26" r="7" fill="#fff" stroke="#a16207" stroke-width="1.4"/><path d="M36 21v5l3 2" stroke="#a16207" stroke-width="1.4" fill="none"/>'),
  mensaje: S('<circle cx="36" cy="26" r="16" fill="#fef9c3" stroke="#a16207" stroke-width="2"/><circle cx="36" cy="26" r="12" fill="none" stroke="#a16207" stroke-width="1.6"/><rect x="29" y="21" width="14" height="10" fill="#fff" stroke="#a16207" stroke-width="1.4"/><path d="M29 21l7 5 7-5" fill="none" stroke="#a16207" stroke-width="1.4"/>'),
  fin: S('<circle cx="36" cy="26" r="16" fill="#fee2e2" stroke="#991b1b" stroke-width="4"/>'),
  terminar: S('<circle cx="36" cy="26" r="16" fill="#fee2e2" stroke="#991b1b" stroke-width="4"/><circle cx="36" cy="26" r="8" fill="#991b1b"/>'),
  tarea: tarea(),
  usuario: tarea('<circle cx="15" cy="16" r="3" fill="none" stroke="#1e3a8a" stroke-width="1.4"/><path d="M10 24c1-3 3-4 5-4s4 1 5 4" fill="none" stroke="#1e3a8a" stroke-width="1.4"/>'),
  servicio: tarea('<circle cx="15" cy="19" r="5" fill="none" stroke="#1e3a8a" stroke-width="1.4" stroke-dasharray="2 1.6"/><circle cx="15" cy="19" r="2" fill="#1e3a8a"/>'),
  manual: tarea('<path d="M10 23v-6l3-2 2 2h6v2h-5" fill="none" stroke="#1e3a8a" stroke-width="1.4"/>'),
  subproceso: S('<rect x="4" y="8" width="64" height="36" rx="7" fill="#eef2ff" stroke="#1e3a8a" stroke-width="2"/><rect x="30" y="34" width="12" height="9" fill="#fff" stroke="#1e3a8a" stroke-width="1.4"/><path d="M36 36v5M33.5 38.5h5" stroke="#1e3a8a" stroke-width="1.4"/>'),
  exclusiva: S('<path d="M36 6l20 20-20 20-20-20z" fill="#fef9c3" stroke="#a16207" stroke-width="2"/>'),
  paralela: S('<path d="M36 6l20 20-20 20-20-20z" fill="#fef9c3" stroke="#a16207" stroke-width="2"/><path d="M36 16v20M26 26h20" stroke="#a16207" stroke-width="3"/>'),
  inclusiva: S('<path d="M36 6l20 20-20 20-20-20z" fill="#fef9c3" stroke="#a16207" stroke-width="2"/><circle cx="36" cy="26" r="8" fill="none" stroke="#a16207" stroke-width="2.4"/>'),
  secuencia: S('<path d="M6 26h54" stroke="#334155" stroke-width="2"/><path d="M58 20l10 6-10 6z" fill="#334155"/>'),
  flujoMensaje: S('<circle cx="9" cy="26" r="3" fill="#fff" stroke="#334155" stroke-width="1.6"/><path d="M12 26h44" stroke="#334155" stroke-width="1.6" stroke-dasharray="5 4"/><path d="M56 20l10 6-10 6z" fill="#fff" stroke="#334155" stroke-width="1.6"/>'),
  asociacion: S('<path d="M8 26h56" stroke="#334155" stroke-width="1.6" stroke-dasharray="2 4"/>'),
  documento: S('<path d="M24 6h18l8 8v32H24z" fill="#fff" stroke="#334155" stroke-width="2"/><path d="M42 6v8h8" fill="none" stroke="#334155" stroke-width="2"/>'),
  baseDatos: S('<ellipse cx="36" cy="12" rx="14" ry="5" fill="#fff" stroke="#334155" stroke-width="2"/><path d="M22 12v26c0 3 6 5 14 5s14-2 14-5V12" fill="#fff" stroke="#334155" stroke-width="2"/><path d="M22 12c0 3 6 5 14 5s14-2 14-5" fill="none" stroke="#334155" stroke-width="2"/>'),
  anotacion: S('<path d="M28 8h-8v36h8" fill="none" stroke="#334155" stroke-width="2"/><path d="M32 18h22M32 26h18M32 34h20" stroke="#94a3b8" stroke-width="2"/>'),
  grupo: S('<rect x="6" y="6" width="60" height="40" rx="8" fill="none" stroke="#334155" stroke-width="2" stroke-dasharray="8 4 2 4"/>'),
  pool: S('<rect x="2" y="6" width="68" height="40" fill="#fff" stroke="#1e3a8a" stroke-width="2"/><rect x="2" y="6" width="12" height="40" fill="#eef2ff" stroke="#1e3a8a" stroke-width="2"/>', 72, 52),
  carril: S('<rect x="2" y="6" width="68" height="40" fill="#fff" stroke="#1e3a8a" stroke-width="2"/><rect x="2" y="6" width="12" height="40" fill="#eef2ff" stroke="#1e3a8a" stroke-width="2"/><path d="M14 26h56" stroke="#1e3a8a" stroke-width="1.6"/><path d="M14 6v40" stroke="#1e3a8a" stroke-width="1.6"/>', 72, 52)
};

const item = (simbolo, nombre, texto) => `<div><dt>${SIMBOLOS[simbolo]}<span>${escapar(nombre)}</span></dt><dd>${texto}</dd></div>`;

function articulo({ ruta, titulo, h1, bajada, cuerpo, esquemaExtra = [] }) {
  const r = '../../';
  const { html, esquema } = migas(r, [{ nombre: 'Inicio', ruta: '' }, { nombre: 'Guías', ruta: 'guias/' }, { nombre: h1, ruta }]);
  return {
    ruta, titulo, descripcion: bajada,
    cuerpo: `
<article class="guia">
  ${html}
  <header class="cabeza-pagina">
    <h1>${escapar(h1)}</h1>
    <p class="bajada">${escapar(bajada)}</p>
  </header>
  ${cuerpo}
  <section class="final final-guia" aria-label="Descargar Fluye">
    <h2>Haz tu diagrama en Fluye</h2>
    ${decision(r, '¿Cómo quieres empezar?')}
  </section>
</article>`,
    esquema: [esquema, {
      '@context': 'https://schema.org', '@type': 'Article', headline: h1, description: bajada, inLanguage: 'es', url: SITIO + ruta,
      author: { '@type': 'Person', name: 'Esteban Maturana' }, publisher: { '@type': 'Organization', name: 'Fluye' }, dateModified: new Date().toISOString().slice(0, 10)
    }, ...esquemaExtra]
  };
}

function guiaFlujo() {
  const r = '../../';
  const pasos = [
    ['Define dónde empieza y dónde termina', 'Escribe en una línea qué dispara el proceso (llega una solicitud, un cliente reclama) y cuál es el resultado (la compra aprobada, el reclamo cerrado). Todo lo que quede fuera de esos dos puntos es otro proceso.'],
    ['Haz la lista de pasos en orden', 'Anota las acciones con un verbo y un objeto: “Revisar la solicitud”, “Enviar a compras”. Si un paso tiene cinco acciones dentro, probablemente son cinco pasos o un subproceso.'],
    ['Marca las decisiones', 'Donde el camino se divide, escribe la pregunta (“¿Se aprueba?”) y el nombre de cada salida (“Sí”, “No”). Cada salida tiene que llevar a algún paso o a un fin.'],
    ['Asigna responsables', 'Agrupa los pasos por quien los hace: cada responsable es un carril. Así se ve dónde el trabajo pasa de una persona o área a otra, que es donde suelen aparecer las demoras.'],
    ['Dibújalo', 'En Fluye eliges una plantilla o una hoja en blanco, arrastras los pasos desde la paleta y los unes con flechas. El panel de la derecha te avisa si queda algo suelto.'],
    ['Pruébalo con el Play', 'Recorre el proceso como si fuera de verdad: en cada decisión elige un camino y revisa que todos lleguen a un fin. Si el recorrido se atasca, Fluye marca dónde.'],
    ['Compártelo', 'Exporta a PDF o Word para el manual, a imagen para una presentación o a una página web con el Play para que otros lo recorran.']
  ];
  return articulo({
    ruta: 'guias/diagrama-de-flujo/',
    titulo: 'Cómo hacer un diagrama de flujo paso a paso (con ejemplo) | Fluye',
    h1: 'Cómo hacer un diagrama de flujo, paso a paso',
    bajada: 'Qué es un diagrama de flujo, qué símbolos usa y siete pasos para hacer uno que se entienda a la primera, con un ejemplo que puedes recorrer aquí mismo.',
    cuerpo: `
  <section class="bloque" aria-labelledby="que-es">
    <h2 id="que-es">Qué es un diagrama de flujo</h2>
    <p>Un diagrama de flujo es un dibujo de un proceso: muestra los pasos en orden, las decisiones que dividen el camino y dónde empieza y termina todo. Sirve para explicar cómo se hace algo, para encontrar pasos que sobran o se repiten y para que una persona nueva entienda su trabajo sin preguntar diez veces.</p>
    <p>Cuando además muestra quién hace cada paso, se llama <a href="${r}guias/diagrama-de-carriles/">diagrama de carriles</a>. Y cuando se dibuja con las reglas del estándar internacional, se llama diagrama BPMN; es lo que usa Fluye, para que el archivo se pueda abrir en otros programas.</p>
  </section>

  <section class="bloque" aria-labelledby="simbolos">
    <h2 id="simbolos">Los símbolos que necesitas</h2>
    <p>Para la mayoría de los procesos bastan cinco figuras. Las demás están en la <a href="${r}guias/simbolos-bpmn/">guía de símbolos BPMN</a>.</p>
    <dl class="simbolos">
      ${item('inicio', 'Inicio', 'Un círculo de borde delgado: lo que pone en marcha el proceso.')}
      ${item('tarea', 'Tarea', 'Un rectángulo redondeado: una acción que hace alguien o un sistema.')}
      ${item('exclusiva', 'Decisión', 'Un rombo: una pregunta con dos o más respuestas, y un camino por cada una.')}
      ${item('secuencia', 'Flecha', 'Une los pasos en el orden en que ocurren.')}
      ${item('fin', 'Fin', 'Un círculo de borde grueso: el resultado del proceso. Puede haber más de uno.')}
    </dl>
  </section>

  <section class="bloque" aria-labelledby="pasos">
    <h2 id="pasos">Siete pasos para hacer un diagrama de flujo</h2>
    <ol class="pasos-guia">${pasos.map(([t, d]) => `<li><strong>${escapar(t)}.</strong> ${escapar(d)}</li>`).join('')}</ol>
  </section>

  <section class="bloque" aria-labelledby="ejemplo">
    <h2 id="ejemplo">Ejemplo: una solicitud de compra</h2>
    <p>Este es el proceso de una solicitud de compra con dos responsables, el solicitante y la jefatura, y una decisión. Pulsa Play y elige “No” en la decisión para ver cómo vuelve a la solicitud.</p>
    ${visor(r, { archivo: 'plantillas/solicitud-de-compra/solicitud-de-compra.bpmn', titulo: 'Solicitud de compra', alto: 520 })}
    <p>¿Quieres partir de él? <a href="${r}plantillas/solicitud-de-compra/">Abre la plantilla</a> o mira las <a href="${r}plantillas/">33 plantillas de diagramas de flujo</a>.</p>
  </section>

  <section class="bloque" aria-labelledby="errores">
    <h2 id="errores">Errores comunes y cómo evitarlos</h2>
    <dl class="datos">
      <div><dt>Pasos que no llevan a ningún lado</dt><dd>Toda tarea necesita una flecha de salida. Fluye lo marca en el panel de revisión mientras dibujas.</dd></div>
      <div><dt>Decisiones sin pregunta</dt><dd>Un rombo sin texto obliga a adivinar. Escribe la pregunta y el nombre de cada camino.</dd></div>
      <div><dt>Demasiado detalle</dt><dd>Si el dibujo no cabe en una pantalla, pasa el detalle a un subproceso en otra pestaña.</dd></div>
      <div><dt>Responsables mezclados</dt><dd>Si no está claro quién hace un paso, ese es justo el problema que el diagrama debe resolver: usa carriles.</dd></div>
      <div><dt>Caminos que nunca se juntan</dt><dd>Si abres dos caminos en paralelo y luego esperas a ambos, júntalos con otro rombo paralelo. El Play avisa cuando una unión queda esperando para siempre.</dd></div>
    </dl>
  </section>`,
    esquemaExtra: [{
      '@context': 'https://schema.org', '@type': 'HowTo', name: 'Cómo hacer un diagrama de flujo', inLanguage: 'es',
      tool: [{ '@type': 'HowToTool', name: 'Fluye (gratis, para Windows)' }],
      step: pasos.map(([t, d], i) => ({ '@type': 'HowToStep', position: i + 1, name: t, text: d }))
    }]
  });
}

function guiaSimbolos() {
  const r = '../../';
  return articulo({
    ruta: 'guias/simbolos-bpmn/',
    titulo: 'Símbolos BPMN: qué significa cada figura | Fluye',
    h1: 'Símbolos BPMN: qué significa cada figura',
    bajada: 'Los símbolos del estándar BPMN 2.0 explicados en español: eventos, tareas, decisiones, flujos, pools, carriles y artefactos, con el dibujo de cada uno.',
    cuerpo: `
  <section class="bloque" aria-labelledby="intro">
    <h2 id="intro">BPMN en una frase</h2>
    <p>BPMN (Business Process Model and Notation) es el estándar internacional de la OMG para dibujar procesos. Usa pocas figuras con un significado preciso, así que cualquiera que conozca la notación lee tu diagrama igual que tú, y el archivo .bpmn se abre en otros programas. Estas son las figuras que usa Fluye.</p>
  </section>

  <section class="bloque" aria-labelledby="eventos">
    <h2 id="eventos">Eventos: lo que pasa</h2>
    <p>Los eventos son círculos. Marcan algo que ocurre: el inicio, una espera en medio del proceso o el final.</p>
    <dl class="simbolos">
      ${item('inicio', 'Evento de inicio', 'Lo que dispara el proceso: llega una solicitud, se cumple una fecha, un cliente llama. Borde delgado.')}
      ${item('intermedio', 'Evento intermedio', 'Algo que pasa a mitad de camino. Borde doble.')}
      ${item('mensaje', 'Evento de mensaje', 'El proceso envía o espera un mensaje de otro participante (otro pool). En el Play, la ficha espera hasta que el mensaje llega.')}
      ${item('plazo', 'Evento de tiempo', 'Una espera o un plazo: “esperar 3 días”, “cada lunes”, “si no responde en 48 horas”.')}
      ${item('fin', 'Evento de fin', 'Un resultado del proceso. Borde grueso. Un proceso puede terminar de varias maneras.')}
      ${item('terminar', 'Fin que termina todo', 'Al llegar aquí se cortan todos los caminos que seguían abiertos en el proceso, por ejemplo cuando se cancela una solicitud.')}
    </dl>
  </section>

  <section class="bloque" aria-labelledby="actividades">
    <h2 id="actividades">Actividades: lo que se hace</h2>
    <p>Las actividades son rectángulos redondeados. Un pequeño ícono arriba a la izquierda dice de qué tipo son.</p>
    <dl class="simbolos">
      ${item('tarea', 'Tarea', 'Una acción concreta. Su nombre empieza con un verbo: “Revisar la solicitud”.')}
      ${item('usuario', 'Tarea de usuario', 'La hace una persona con ayuda de un sistema, como llenar un formulario.')}
      ${item('servicio', 'Tarea automática', 'La hace un sistema sin intervención, como enviar un correo o calcular un total.')}
      ${item('manual', 'Tarea manual', 'La hace una persona sin sistema, como firmar un documento o mover una caja.')}
      ${item('subproceso', 'Subproceso', 'Un grupo de pasos con su propio detalle. En Fluye su interior puede ir en otra pestaña.')}
    </dl>
  </section>

  <section class="bloque" aria-labelledby="compuertas">
    <h2 id="compuertas">Compuertas: dónde se divide el camino</h2>
    <p>Las compuertas son rombos. Deciden por dónde sigue el proceso, o juntan caminos que venían separados.</p>
    <dl class="simbolos">
      ${item('exclusiva', 'Decisión (exclusiva)', 'Una pregunta con varias respuestas; se sigue <strong>solo un</strong> camino. Es la más común: “¿Se aprueba? Sí / No”.')}
      ${item('paralela', 'Paralelo', 'Abre caminos que van <strong>al mismo tiempo</strong>, o los junta esperando a que terminen todos.')}
      ${item('inclusiva', 'Decisión inclusiva', 'Se sigue <strong>uno o varios</strong> caminos según lo que se cumpla; al juntar, espera solo a los que se abrieron.')}
    </dl>
  </section>

  <section class="bloque" aria-labelledby="flujos">
    <h2 id="flujos">Flujos: cómo se conecta todo</h2>
    <dl class="simbolos">
      ${item('secuencia', 'Flujo de secuencia', 'Línea continua con flecha: el orden de los pasos dentro de un mismo proceso.')}
      ${item('flujoMensaje', 'Flujo de mensaje', 'Línea punteada con círculo y flecha vacía: un mensaje entre dos pools, como un correo entre la empresa y el cliente.')}
      ${item('asociacion', 'Asociación', 'Línea de puntos: une un documento o una nota con un paso. No marca orden.')}
    </dl>
  </section>

  <section class="bloque" aria-labelledby="participantes">
    <h2 id="participantes">Participantes: quién hace qué</h2>
    <dl class="simbolos">
      ${item('pool', 'Pool', 'Un participante con su propio proceso: una empresa, un cliente, un sistema externo. Los pools se comunican solo con mensajes.')}
      ${item('carril', 'Carril', 'Un responsable dentro del pool: un cargo, un área o un sistema. Más en la <a href="' + r + 'guias/diagrama-de-carriles/">guía de diagrama de carriles</a>.')}
    </dl>
  </section>

  <section class="bloque" aria-labelledby="artefactos">
    <h2 id="artefactos">Artefactos: información extra</h2>
    <dl class="simbolos">
      ${item('documento', 'Documento', 'Información que un paso usa o produce: una factura, un contrato, un formulario.')}
      ${item('baseDatos', 'Base de datos', 'Donde se guarda la información y queda disponible después del proceso.')}
      ${item('anotacion', 'Anotación', 'Una nota de texto para aclarar algo del diagrama.')}
      ${item('grupo', 'Grupo', 'Un recuadro punteado para marcar pasos relacionados, sin cambiar el flujo.')}
    </dl>
  </section>

  <section class="bloque" aria-labelledby="ejemplo">
    <h2 id="ejemplo">Todos juntos en un proceso real</h2>
    <p>Este proceso de inicio de sesión con bloqueo por intentos usa tareas de usuario y automáticas, dos decisiones, un paralelo, dos fines y tres carriles. Pulsa Play para recorrerlo.</p>
    ${visor(r, { archivo: 'plantillas/inicio-de-sesion-con-bloqueo-por-intentos/inicio-de-sesion-con-bloqueo-por-intentos.bpmn', titulo: 'Inicio de sesión con bloqueo por intentos', alto: 560 })}
  </section>`
  });
}

function guiaCarriles() {
  const r = '../../';
  const pasos = [
    ['Nombra el pool', 'El pool es el proceso completo de un participante, por ejemplo “Empresa”. En Fluye cada proyecto nuevo ya trae uno.'],
    ['Crea un carril por responsable', 'Usa cargos o áreas, no nombres de personas: “Jefatura”, “Bodega”, “Sistema web”. Así el diagrama sigue sirviendo cuando cambia el equipo.'],
    ['Pon cada paso en el carril de quien lo hace', 'Si dos responsables hacen el mismo paso, decide quién responde por él; si no se puede, son dos pasos.'],
    ['Une los pasos con flechas', 'Cada flecha que cruza de un carril a otro es un traspaso: el trabajo pasa de mano. Ahí es donde conviene mirar con más cuidado.'],
    ['Usa otro pool para quien está afuera', 'Un cliente, un proveedor o una entidad pública tienen su propio proceso: dibújalos como otro pool y comunícalos con mensajes.'],
    ['Recórrelo con el Play', 'Mientras la ficha avanza, Fluye ilumina el carril activo: se ve de un vistazo quién tiene el trabajo en cada momento.']
  ];
  return articulo({
    ruta: 'guias/diagrama-de-carriles/',
    titulo: 'Diagrama de carriles (swimlane): qué es y cómo hacerlo | Fluye',
    h1: 'Diagrama de carriles: qué es y cómo hacerlo',
    bajada: 'El diagrama de carriles (swimlane) muestra quién hace cada paso de un proceso. Qué es, cuándo usarlo, la diferencia entre pool y carril, y cómo hacer uno en seis pasos.',
    cuerpo: `
  <section class="bloque" aria-labelledby="que-es">
    <h2 id="que-es">Qué es un diagrama de carriles</h2>
    <p>Es un <a href="${r}guias/diagrama-de-flujo/">diagrama de flujo</a> dividido en franjas, como las pistas de una piscina: cada franja es un responsable y cada paso va en la franja de quien lo hace. También se le llama diagrama de swimlanes o diagrama multifuncional.</p>
    <p>Su gracia está en las flechas que cruzan de una franja a otra: cada una es un traspaso de trabajo entre personas o áreas. Muchos retrasos y errores de un proceso viven justo en esos traspasos, y el diagrama de carriles los deja a la vista.</p>
  </section>

  <section class="bloque" aria-labelledby="pool-carril">
    <h2 id="pool-carril">Pool y carril: la diferencia</h2>
    <dl class="simbolos">
      ${item('pool', 'Pool', 'Un participante completo con su propio proceso: tu empresa, un cliente, un proveedor. Entre pools no hay flechas normales, solo mensajes.')}
      ${item('carril', 'Carril', 'Un responsable dentro de un pool: un cargo, un área o un sistema. Entre carriles del mismo pool el flujo es directo.')}
    </dl>
    <p>Regla práctica: si el otro lado no sigue tus reglas ni tu sistema (un cliente, el banco, la Aduana), va en otro pool. Si es parte de tu organización, va en un carril.</p>
  </section>

  <section class="bloque" aria-labelledby="pasos">
    <h2 id="pasos">Cómo hacer un diagrama de carriles en seis pasos</h2>
    <ol class="pasos-guia">${pasos.map(([t, d]) => `<li><strong>${escapar(t)}.</strong> ${escapar(d)}</li>`).join('')}</ol>
  </section>

  <section class="bloque" aria-labelledby="ejemplo">
    <h2 id="ejemplo">Ejemplo: un ticket de mesa de ayuda</h2>
    <p>Tres carriles: el usuario que reporta, la mesa de ayuda de nivel 1 y el especialista de nivel 2. Pulsa Play y fíjate cómo el trabajo pasa de un carril a otro.</p>
    ${visor(r, { archivo: 'plantillas/ticket-de-mesa-de-ayuda/ticket-de-mesa-de-ayuda.bpmn', titulo: 'Ticket de mesa de ayuda', alto: 560 })}
    <p>Más ejemplos con carriles en las <a href="${r}plantillas/">plantillas de diagramas de flujo</a>, desde procesos de compras hasta selección de personal.</p>
  </section>

  <section class="bloque" aria-labelledby="cuando">
    <h2 id="cuando">Cuándo conviene un diagrama de carriles</h2>
    <dl class="datos">
      <div><dt>Hay varias áreas involucradas</dt><dd>Si el proceso pasa por más de una persona o área, los carriles muestran los traspasos.</dd></div>
      <div><dt>Hay que repartir responsabilidades</dt><dd>Al poner cada paso en un carril, aparecen los pasos que nadie tenía asignados.</dd></div>
      <div><dt>Se quiere mejorar un proceso</dt><dd>Muchas idas y vueltas entre dos carriles suelen indicar una demora que se puede eliminar.</dd></div>
      <div><dt>Se va a capacitar a alguien</dt><dd>La persona nueva ve de inmediato qué le toca y a quién le entrega su trabajo.</dd></div>
    </dl>
  </section>`,
    esquemaExtra: [{
      '@context': 'https://schema.org', '@type': 'HowTo', name: 'Cómo hacer un diagrama de carriles', inLanguage: 'es',
      tool: [{ '@type': 'HowToTool', name: 'Fluye (gratis, para Windows)' }],
      step: pasos.map(([t, d], i) => ({ '@type': 'HowToStep', position: i + 1, name: t, text: d }))
    }]
  });
}

export function guias() {
  return [guiaFlujo(), guiaSimbolos(), guiaCarriles()];
}

export function indiceGuias() {
  const r = '../';
  const { html, esquema } = migas(r, [{ nombre: 'Inicio', ruta: '' }, { nombre: 'Guías', ruta: 'guias/' }]);
  return {
    ruta: 'guias/',
    titulo: 'Guías para hacer diagramas de flujo y BPMN | Fluye',
    descripcion: 'Guías en español para hacer diagramas de flujo, entender los símbolos BPMN y armar diagramas de carriles, con ejemplos interactivos.',
    cuerpo: `
<div class="ancho">
  ${html}
  <header class="cabeza-pagina">
    <h1>Guías para dibujar procesos</h1>
    <p class="bajada">Todo lo que necesitas para hacer diagramas que se entiendan, explicado en español y con ejemplos que puedes recorrer con el Play.</p>
  </header>
  <ul class="guias-lista">
    <li><a href="diagrama-de-flujo/"><strong>Cómo hacer un diagrama de flujo, paso a paso</strong><span>Qué es, los cinco símbolos que bastan, siete pasos y los errores más comunes.</span></a></li>
    <li><a href="simbolos-bpmn/"><strong>Símbolos BPMN: qué significa cada figura</strong><span>Eventos, tareas, compuertas, flujos, pools, carriles y artefactos, con su dibujo.</span></a></li>
    <li><a href="diagrama-de-carriles/"><strong>Diagrama de carriles: qué es y cómo hacerlo</strong><span>Pool y carril, cuándo usar cada uno y cómo mostrar quién hace cada paso.</span></a></li>
  </ul>
</div>`,
    esquema: [esquema]
  };
}
