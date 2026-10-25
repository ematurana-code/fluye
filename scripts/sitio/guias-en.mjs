// Guides in English: what is BPMN, how to make a flowchart, BPMN symbols and swimlane diagrams. Same layout as the
// Spanish guides (articulo() in guias.mjs), with their own text written for English searches, not a word-for-word copy.
import { FLECHA, RUTAS, decision, enFluye, migas } from './comun.mjs';
import { PLANTILLAS, articulo, ejemplo, item, medidas, secuencia } from './guias.mjs';

const R = '../../../';
const P = (ruta) => `${R}${RUTAS.en.guias}${ruta}`;

function guiaBpmn() {
  const pasos = [
    ['Open Fluye', 'Download it free for Windows or try it in your browser without installing. No account needed.'],
    ['Start from a template', 'Pick the one closest to your process, or a blank page if you prefer to draw from scratch.'],
    ['Change lanes and steps', 'Type your organization\'s roles or departments into the lanes and adjust the tasks. Arrows route themselves.'],
    ['Walk through it with Play', 'The token moves step by step and stops at each decision so you choose the path. If something has no way out, Fluye flags it.'],
    ['Share it', 'Save it as .bpmn to open in other tools, or export it to PDF, Word, an image or a web page with Play inside.']
  ];
  const preguntas = [
    ['What does BPMN stand for?', 'BPMN stands for Business Process Model and Notation. It is the international standard for drawing business processes, maintained by the OMG.'],
    ['Does BPMN cost money?', 'No. The BPMN specification is public and anyone can use the notation for free. There is free software to draw it, such as Fluye, which is also open source.'],
    ['What software can I use to make BPMN diagrams?', 'Any modeler that saves .bpmn files. Fluye is a free option for Windows that you can also try in your browser, and it walks through the process step by step with Play.']
  ];
  return articulo({
    idioma: 'en', ruta: 'what-is-bpmn/', alterna: 'guias/que-es-bpmn/', ejemplo: ['vacation-request', 'Vacation request'],
    titulo: 'What is BPMN? Meaning, symbols and an example | Fluye',
    h1: 'What is BPMN and what is it for',
    bajada: 'BPMN is the international standard for drawing processes. What it stands for, where it comes from, its basic shapes, how it differs from a flowchart and how to get started for free.',
    descripcion: 'What BPMN is and stands for, its basic shapes, how it differs from a flowchart and how to get started for free, with an example.',
    cuerpo: `
  <section class="bloque" aria-labelledby="meaning">
    <h2 id="meaning">What BPMN stands for</h2>
    <p>BPMN stands for <em>Business Process Model and Notation</em>. It is a standard from the OMG (Object Management Group) that defines how to draw a process: which shape to use for each thing and what each one means.</p>
    <p>Because the rules are public and precise, a BPMN diagram reads the same in any organization, and a .bpmn file opens in different tools without losing what was drawn.</p>
  </section>

  <section class="bloque" aria-labelledby="history">
    <h2 id="history">Where it comes from</h2>
    <p>The Business Process Management Initiative (BPMI) published the first version in 2004. In 2005 BPMI merged with the OMG, which has maintained the notation ever since.</p>
    <p>Version 2.0, released in 2011, added a common file format for exchanging diagrams between tools, and in 2013 it also became an international standard, ISO/IEC 19510. It is the version used by Fluye and most current modelers.</p>
  </section>

  <section class="bloque" aria-labelledby="uses">
    <h2 id="uses">What it is used for</h2>
    <dl class="consejos">
      <div><dt>Documenting how work is done</dt><dd>The process stops living in one person's head and is drawn for everyone to see.</dd></div>
      <div><dt>Improving a process</dt><dd>Repeated steps, loops back and handoffs between departments become visible, which is where delays usually hide.</dd></div>
      <div><dt>Training</dt><dd>Newcomers see what their job is, who they hand work to and what happens in each case.</dd></div>
      <div><dt>Automation</dt><dd>Many process management systems read BPMN directly to run the workflow.</dd></div>
    </dl>
  </section>

  <section class="bloque" aria-labelledby="shapes">
    <h2 id="shapes">The basic shapes</h2>
    <p>These six cover most processes. The rest are in the <a href="${P('bpmn-symbols/')}">BPMN symbols guide</a>.</p>
    <dl class="simbolos">
      ${item('inicio', 'Start event', 'A thin circle: whatever triggers the process.')}
      ${item('tarea', 'Task', 'A rounded rectangle: an action done by a person or a system.')}
      ${item('exclusiva', 'Decision', 'A diamond: a question with several answers and one path for each.')}
      ${item('secuencia', 'Sequence flow', 'An arrow: the order in which steps happen.')}
      ${item('fin', 'End event', 'A thick circle: one outcome of the process.')}
      ${item('carril', 'Pool and lane', 'Bands that show who does each step: the participant and its roles.')}
    </dl>
  </section>

  <section class="bloque" aria-labelledby="flowchart">
    <h2 id="flowchart">BPMN or flowchart</h2>
    <p>A <a href="${P('how-to-make-a-flowchart/')}">flowchart</a> is any drawing of a process; BPMN is a standardized way to draw one. Every BPMN diagram is a flowchart, but not the other way around.</p>
    <p>BPMN adds what a simple flowchart lacks: roles in <a href="${P('swimlane-diagram/')}">swimlanes</a>, messages between participants, timers and waits, sub-processes and a file format other tools understand.</p>
  </section>

  <section class="bloque" aria-labelledby="example">
    <h2 id="example">An example to walk through</h2>
    <p>This is a real BPMN process: a vacation request with two roles and one decision. Open it with Play and choose what the manager answers.</p>
    ${ejemplo(R, 'vacation-request', 'Vacation request', 'en')}
  </section>

  <section class="bloque" aria-labelledby="start">
    <h2 id="start">How to start drawing in BPMN</h2>
    ${secuencia(pasos)}
  </section>`,
    esquemaExtra: [{
      '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: 'en',
      mainEntity: preguntas.map(([p, rta]) => ({ '@type': 'Question', name: p, acceptedAnswer: { '@type': 'Answer', text: rta } }))
    }]
  });
}

function guiaFlujo() {
  const pasos = [
    ['Define where it starts and ends', 'Write in one line what triggers the process (a request arrives, a customer complains) and what the outcome is (purchase approved, complaint closed). Anything outside those two points is another process.'],
    ['List the steps in order', 'Write each action as a verb and an object: "Review the request", "Send to purchasing". If one step hides five actions, it is probably five steps or a sub-process.'],
    ['Mark the decisions', 'Where the path splits, write the question ("Approved?") and name each way out ("Yes", "No"). Every way out must lead to a step or an end.'],
    ['Assign roles', 'Group the steps by who does them: each role is a lane. That shows where work passes from one person or department to another, which is where delays usually appear.'],
    ['Draw it', 'In Fluye you pick a template or a blank page, drag steps from the palette and connect them with arrows. The panel on the right tells you if anything is left loose.'],
    ['Test it with Play', 'Walk through the process as if it were real: choose a path at each decision and check that every path reaches an end. If the run gets stuck, Fluye shows where.'],
    ['Share it', 'Export to PDF or Word for the manual, to an image for a presentation, or to a web page with Play so others can walk through it.']
  ];
  return articulo({
    idioma: 'en', ruta: 'how-to-make-a-flowchart/', alterna: 'guias/diagrama-de-flujo/', ejemplo: ['purchase-request', 'Purchase request'],
    titulo: 'How to make a flowchart step by step (with an example) | Fluye',
    h1: 'How to make a flowchart',
    bajada: 'What a flowchart is, which symbols it uses and seven steps to make one people understand at first glance, with an example you can walk through right here.',
    cuerpo: `
  <section class="bloque" aria-labelledby="what">
    <h2 id="what">What a flowchart is</h2>
    <p>A flowchart is a drawing of a process: it shows the steps in order, the decisions that split the path and where everything starts and ends. It helps explain how something is done, spot steps that are redundant or repeated, and let a new person understand their job without asking ten times.</p>
    <p>When it also shows who does each step, it is called a <a href="${P('swimlane-diagram/')}">swimlane diagram</a>. And when it follows the rules of the international standard, it is a BPMN diagram, which is what Fluye uses so the file opens in other tools.</p>
  </section>

  <section class="bloque" aria-labelledby="symbols">
    <h2 id="symbols">The symbols you need</h2>
    <p>Five shapes cover most processes. The rest are in the <a href="${P('bpmn-symbols/')}">BPMN symbols guide</a>.</p>
    <dl class="simbolos">
      ${item('inicio', 'Start', 'A thin circle: whatever sets the process in motion.')}
      ${item('tarea', 'Task', 'A rounded rectangle: an action done by someone or by a system.')}
      ${item('exclusiva', 'Decision', 'A diamond: a question with two or more answers, and one path for each.')}
      ${item('secuencia', 'Arrow', 'Connects the steps in the order they happen.')}
      ${item('fin', 'End', 'A thick circle: the outcome of the process. There can be more than one.')}
    </dl>
  </section>

  <section class="bloque" aria-labelledby="steps">
    <h2 id="steps">Seven steps to make a flowchart</h2>
    ${secuencia(pasos)}
  </section>

  <section class="bloque" aria-labelledby="example">
    <h2 id="example">Example: a purchase request</h2>
    <p>This is a purchase request with two roles, the requester and the manager, and one decision. Press Play and choose "No" at the decision to see how it loops back to the request.</p>
    ${ejemplo(R, 'purchase-request', 'Purchase request', 'en')}
    <p>Want to start from it? <a href="${R}${RUTAS.en.plantillas}purchase-request/">Open the template</a> or browse all <a href="${R}${RUTAS.en.plantillas}">33 flowchart templates</a>.</p>
  </section>

  <section class="bloque" aria-labelledby="mistakes">
    <h2 id="mistakes">Common mistakes and how to avoid them</h2>
    <dl class="consejos">
      <div><dt>Steps that lead nowhere</dt><dd>Every task needs an outgoing arrow. Fluye flags it in the review panel as you draw.</dd></div>
      <div><dt>Decisions without a question</dt><dd>An empty diamond forces people to guess. Write the question and name each path.</dd></div>
      <div><dt>Too much detail</dt><dd>If the drawing does not fit on one screen, move the detail into a sub-process in another tab.</dd></div>
      <div><dt>Mixed-up roles</dt><dd>If it is unclear who does a step, that is exactly the problem the diagram should solve: use lanes.</dd></div>
      <div><dt>Paths that never meet</dt><dd>If you open two parallel paths and then wait for both, join them with another parallel gateway. Play warns you when a join waits forever.</dd></div>
    </dl>
  </section>`,
    esquemaExtra: [{
      '@context': 'https://schema.org', '@type': 'HowTo', name: 'How to make a flowchart', inLanguage: 'en',
      tool: [{ '@type': 'HowToTool', name: 'Fluye (free, for Windows)' }],
      step: pasos.map(([t, d], i) => ({ '@type': 'HowToStep', position: i + 1, name: t, text: d }))
    }]
  });
}

function guiaSimbolos() {
  return articulo({
    idioma: 'en', ruta: 'bpmn-symbols/', alterna: 'guias/simbolos-bpmn/', ejemplo: ['login-with-lockout-after-failed-attempts', 'Login with lockout after failed attempts'],
    titulo: 'BPMN symbols: what each shape means | Fluye',
    h1: 'BPMN symbols and what they mean',
    bajada: 'The BPMN 2.0 symbols explained in plain English: events, tasks, gateways, flows, pools, lanes and artifacts, with a drawing of each one.',
    cuerpo: `
  <section class="bloque" aria-labelledby="intro">
    <h2 id="intro">BPMN in one sentence</h2>
    <p>BPMN (Business Process Model and Notation) is the OMG's international standard for drawing processes. It uses a few shapes with a precise meaning, so anyone who knows the notation reads your diagram the way you do, and the .bpmn file opens in other tools. These are the shapes Fluye uses.</p>
  </section>

  <section class="bloque" aria-labelledby="events">
    <h2 id="events">Events: things that happen</h2>
    <p>Events are circles. They mark something that occurs: the start, a wait halfway through or the end.</p>
    <dl class="simbolos">
      ${item('inicio', 'Start event', 'What triggers the process: a request arrives, a date is reached, a customer calls. Thin border.')}
      ${item('intermedio', 'Intermediate event', 'Something that happens halfway. Double border.')}
      ${item('mensaje', 'Message event', 'The process sends or waits for a message from another participant (another pool). In Play, the token waits until the message arrives.')}
      ${item('plazo', 'Timer event', 'A wait or a deadline: "wait 3 days", "every Monday", "if no reply within 48 hours".')}
      ${item('fin', 'End event', 'One outcome of the process. Thick border. A process can end in several ways.')}
      ${item('terminar', 'Terminate end event', 'Reaching it cuts every path still open in the process, for example when a request is cancelled.')}
    </dl>
  </section>

  <section class="bloque" aria-labelledby="activities">
    <h2 id="activities">Activities: work that gets done</h2>
    <p>Activities are rounded rectangles. A small icon at the top left says what kind they are.</p>
    <dl class="simbolos">
      ${item('tarea', 'Task', 'One concrete action. Its name starts with a verb: "Review the request".')}
      ${item('usuario', 'User task', 'Done by a person with the help of a system, such as filling in a form.')}
      ${item('servicio', 'Service task', 'Done by a system without human input, such as sending an email or calculating a total.')}
      ${item('manual', 'Manual task', 'Done by a person without a system, such as signing a document or moving a box.')}
      ${item('subproceso', 'Sub-process', 'A group of steps with its own detail. In Fluye its inside can live in another tab.')}
    </dl>
  </section>

  <section class="bloque" aria-labelledby="gateways">
    <h2 id="gateways">Gateways: where the path splits</h2>
    <p>Gateways are diamonds. They decide which way the process goes, or join paths that were apart.</p>
    <dl class="simbolos">
      ${item('exclusiva', 'Exclusive gateway (decision)', 'A question with several answers; <strong>only one</strong> path is taken. The most common: "Approved? Yes / No".')}
      ${item('paralela', 'Parallel gateway', 'Opens paths that run <strong>at the same time</strong>, or joins them by waiting for all to finish.')}
      ${item('inclusiva', 'Inclusive gateway', 'Takes <strong>one or more</strong> paths depending on what applies; when joining, it waits only for the paths that were opened.')}
    </dl>
  </section>

  <section class="bloque" aria-labelledby="flows">
    <h2 id="flows">Flows: how everything connects</h2>
    <dl class="simbolos">
      ${item('secuencia', 'Sequence flow', 'Solid line with an arrow: the order of steps within one process.')}
      ${item('flujoMensaje', 'Message flow', 'Dashed line with a circle and an open arrow: a message between two pools, such as an email between the company and the customer.')}
      ${item('asociacion', 'Association', 'Dotted line: links a document or a note to a step. It does not imply order.')}
    </dl>
  </section>

  <section class="bloque" aria-labelledby="participants">
    <h2 id="participants">Participants: who does what</h2>
    <dl class="simbolos">
      ${item('pool', 'Pool', 'A participant with its own process: a company, a customer, an external system. Pools talk to each other only through messages.')}
      ${item('carril', 'Lane', `A role within a pool: a job title, a department or a system. More in the <a href="${P('swimlane-diagram/')}">swimlane diagram guide</a>.`)}
    </dl>
  </section>

  <section class="bloque" aria-labelledby="artifacts">
    <h2 id="artifacts">Artifacts: extra information</h2>
    <dl class="simbolos">
      ${item('documento', 'Data object', 'Information a step uses or produces: an invoice, a contract, a form.')}
      ${item('baseDatos', 'Data store', 'Where information is kept and stays available after the process.')}
      ${item('anotacion', 'Text annotation', 'A text note to clarify something in the diagram.')}
      ${item('grupo', 'Group', 'A dashed box to mark related steps without changing the flow.')}
    </dl>
  </section>

  <section class="bloque" aria-labelledby="example">
    <h2 id="example">All together in a real process</h2>
    <p>This login process with lockout after failed attempts uses user and service tasks, two decisions, a parallel gateway, two ends and three lanes. Press Play to walk through it.</p>
    ${ejemplo(R, 'login-with-lockout-after-failed-attempts', 'Login with lockout after failed attempts', 'en')}
  </section>`
  });
}

function guiaCarriles() {
  const pasos = [
    ['Name the pool', 'The pool is a participant\'s whole process, for example "Company". In Fluye every new project already has one.'],
    ['Create one lane per role', 'Use job titles or departments, not people\'s names: "Manager", "Warehouse", "Web system". That way the diagram stays useful when the team changes.'],
    ['Put each step in the lane of whoever does it', 'If two roles do the same step, decide who is accountable for it; if you cannot, it is two steps.'],
    ['Connect the steps with arrows', 'Every arrow crossing from one lane to another is a handoff: work changes hands. That is where to look most carefully.'],
    ['Use another pool for outsiders', 'A customer, a supplier or a government agency has its own process: draw it as another pool and connect it with messages.'],
    ['Walk through it with Play', 'As the token moves, Fluye highlights the active lane: you see at a glance who has the work at each moment.']
  ];
  return articulo({
    idioma: 'en', ruta: 'swimlane-diagram/', alterna: 'guias/diagrama-de-carriles/', ejemplo: ['help-desk-ticket', 'Help desk ticket'],
    titulo: 'Swimlane diagram: what it is and how to make one | Fluye',
    h1: 'What is a swimlane diagram',
    bajada: 'A swimlane diagram shows who does each step of a process. What it is, when to use it, the difference between pool and lane, and how to make one in six steps.',
    cuerpo: `
  <section class="bloque" aria-labelledby="what">
    <h2 id="what">What a swimlane diagram is</h2>
    <p>It is a <a href="${P('how-to-make-a-flowchart/')}">flowchart</a> split into bands, like the lanes of a swimming pool: each band is a role and each step goes in the band of whoever does it. It is also called a cross-functional flowchart.</p>
    <p>Its value is in the arrows that cross from one band to another: each one is a handoff between people or departments. Many delays and errors in a process live right there, and a swimlane diagram makes them visible.</p>
  </section>

  <section class="bloque" aria-labelledby="pool-lane">
    <h2 id="pool-lane">Pool and lane: the difference</h2>
    <dl class="simbolos">
      ${item('pool', 'Pool', 'A whole participant with its own process: your company, a customer, a supplier. Pools do not connect with regular arrows, only with messages.')}
      ${item('carril', 'Lane', 'A role within a pool: a job title, a department or a system. Within the same pool, the flow between lanes is direct.')}
    </dl>
    <p>Rule of thumb: if the other side does not follow your rules or your system (a customer, the bank, customs), it goes in another pool. If it is part of your organization, it goes in a lane.</p>
  </section>

  <section class="bloque" aria-labelledby="steps">
    <h2 id="steps">How to make a swimlane diagram in six steps</h2>
    ${secuencia(pasos)}
  </section>

  <section class="bloque" aria-labelledby="example">
    <h2 id="example">Example: a help desk ticket</h2>
    <p>Three lanes: the user who reports, the level 1 help desk and the level 2 specialist. Press Play and watch how the work moves from one lane to another.</p>
    ${ejemplo(R, 'help-desk-ticket', 'Help desk ticket', 'en')}
    <p>More swimlane examples in the <a href="${R}${RUTAS.en.plantillas}">flowchart templates</a>, from purchasing processes to recruitment.</p>
  </section>

  <section class="bloque" aria-labelledby="when">
    <h2 id="when">When a swimlane diagram helps</h2>
    <dl class="consejos">
      <div><dt>Several departments are involved</dt><dd>If the process passes through more than one person or department, lanes show the handoffs.</dd></div>
      <div><dt>Responsibilities need sorting out</dt><dd>Putting each step in a lane reveals the steps nobody owned.</dd></div>
      <div><dt>You want to improve a process</dt><dd>Lots of back and forth between two lanes usually signals a delay you can remove.</dd></div>
      <div><dt>You are training someone</dt><dd>The newcomer sees right away what is theirs and who they hand work to.</dd></div>
    </dl>
  </section>`,
    esquemaExtra: [{
      '@context': 'https://schema.org', '@type': 'HowTo', name: 'How to make a swimlane diagram', inLanguage: 'en',
      tool: [{ '@type': 'HowToTool', name: 'Fluye (free, for Windows)' }],
      step: pasos.map(([t, d], i) => ({ '@type': 'HowToStep', position: i + 1, name: t, text: d }))
    }]
  });
}

export function guiasEn(plantillas) {
  PLANTILLAS.en = plantillas;
  return [guiaBpmn(), guiaFlujo(), guiaSimbolos(), guiaCarriles()];
}

export function indiceGuiasEn() {
  const ruta = RUTAS.en.guias, r = '../../';
  const imagen = (plantilla, titulo) => `<span class="guia-imagen"><img src="${r}${RUTAS.en.plantillas}${plantilla}/vista.png" ${medidas(plantilla, 'en')} loading="lazy" alt="Example diagram for the guide: ${titulo}"></span>`;
  const { html, esquema } = migas(r, [{ nombre: 'Home', ruta: RUTAS.en.raiz }, { nombre: 'Guides', ruta }], 'en');
  return {
    ruta, idioma: 'en', alternas: { es: RUTAS.es.guias, en: ruta },
    titulo: 'Guides to BPMN and flowcharts | Fluye',
    descripcion: 'Plain-English guides to understand BPMN, make flowcharts, learn the BPMN symbols and build swimlane diagrams, with interactive examples.',
    cuerpo: `
<div class="pila">
  <header class="tablero titular titular-grande">
    <div class="pieza titular-texto entra">
      <h1>Guides to drawing processes</h1>
      <p class="bajada">Everything you need to make diagrams people understand, explained in plain English with examples you can walk through with Play.</p>
      ${html}
    </div>
    <figure class="pieza pieza-foto titular-lado titular-foto obturador">
      <img src="${r}imagenes/play.webp" width="2880" height="1800" alt="Fluye's Play stopped at a decision, with the run log on the side.">
    </figure>
  </header>
  <div class="tablero guias-tablero">
    <a class="pieza pieza-tarea guia-bpmn entra" href="what-is-bpmn/">${imagen('vacation-request', 'Vacation request')}<span class="guia-texto"><span class="camino-titulo">What is BPMN and what is it for</span><p>What it stands for, where it comes from, its six basic shapes and how it differs from a flowchart.</p></span>${FLECHA}</a>
    <a class="pieza guia-flujo entra" style="--i:1" href="how-to-make-a-flowchart/">${imagen('purchase-request', 'Purchase request')}<span class="guia-texto"><span class="camino-titulo">How to make a flowchart, step by step</span><p>What it is, the five symbols you need, seven steps and the most common mistakes.</p></span>${FLECHA}</a>
    <a class="pieza guia-simbolos entra" href="bpmn-symbols/">${imagen('login-with-lockout-after-failed-attempts', 'Login with lockout after failed attempts')}<span class="guia-texto"><span class="camino-titulo">BPMN symbols: what each shape means</span><p>Events, tasks, gateways, flows, pools, lanes and artifacts, with a drawing of each.</p></span>${FLECHA}</a>
    <a class="pieza pieza-2 guia-carriles entra" style="--i:1" href="swimlane-diagram/">${imagen('help-desk-ticket', 'Help desk ticket')}<span class="guia-texto"><span class="camino-titulo">Swimlane diagram: what it is and how to make one</span><p>Pool and lane, when to use each, and how to show who does each step.</p></span>${FLECHA}</a>
  </div>
</div>

<section aria-labelledby="en-fluye-titulo">
  <div class="cabeza entra">
    <h2 id="en-fluye-titulo">How it's done in Fluye</h2>
    <p>What you learn in the guides is drawn the same way in the program: BPMN shapes, Play to test and several ways to share.</p>
  </div>
  ${enFluye(r, 'en')}
</section>

<section aria-labelledby="empezar-titulo">
  <div class="cabeza entra">
    <h2 id="empezar-titulo">Make your diagram in Fluye</h2>
    <p>Free, open source and no account needed.</p>
  </div>
  ${decision(r, 'How do you want to start?', 'en')}
</section>`,
    esquema: [esquema]
  };
}
