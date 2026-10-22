// Panel de propiedades del elemento seleccionado. Todo dato del usuario se muestra con textContent/value (nunca innerHTML).
import {
  COLORES_USUARIO, bo, es, esActividad, esCarril, esCompuerta, esConexion, esEvento, esPool, limpiarTexto, nombreTipo, tipoEvento
} from '../modeler/tipos.js';
import { leerNombre } from '../modeler/modeling/comandos.js';
import { icono } from '../iconos.js';
import { contarDiagrama, revisarDiagrama } from '../modeler/revision.js';

const VARIANTES_TAREA = [['bpmn:Task', 'Tarea'], ['bpmn:UserTask', 'Tarea de usuario'], ['bpmn:ServiceTask', 'Tarea automática'], ['bpmn:ManualTask', 'Tarea manual']];
const VARIANTES_COMPUERTA = [['bpmn:ExclusiveGateway', 'Decisión (un camino)'], ['bpmn:ParallelGateway', 'Paralelo (todos)'], ['bpmn:InclusiveGateway', 'Decisión inclusiva (uno o varios)']];

function el(tag, attrs = {}, ...hijos) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'texto') n.textContent = v;
    else if (k === 'html') n.innerHTML = v; // solo con contenido fijo del código (íconos)
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v);
  }
  for (const h of hijos) if (h) n.appendChild(h);
  return n;
}

function carrilDe(elemento) {
  if (esPool(elemento) || esCarril(elemento)) return null; // un carril no es responsable de sí mismo
  const pool = esPool(elemento.parent) ? elemento.parent : null;
  if (!pool || esConexion(elemento)) return null;
  const cx = elemento.x + elemento.width / 2, cy = elemento.y + elemento.height / 2;
  return (pool.children || []).find((c) => esCarril(c) && cx >= c.x && cx <= c.x + c.width && cy >= c.y && cy <= c.y + c.height) || null;
}

// Textos de ayuda según lo que se edita.
function textos(e) {
  if (esPool(e)) return { nombre: 'Nombre del proceso', descripcion: 'De qué trata este proceso, dónde empieza y dónde termina…' };
  if (esCarril(e)) return { nombre: 'Rol o área', descripcion: 'Qué rol o área es y qué le toca hacer en el proceso…' };
  if (es(e, 'bpmn:ParallelGateway')) return { nombre: 'Nombre (opcional)', descripcion: 'Qué se hace en paralelo desde aquí, o qué se espera para seguir…' };
  if (esCompuerta(e)) return { nombre: 'Pregunta (ej. "¿Está aprobado?")', descripcion: 'Qué se decide aquí y con qué criterio…' };
  if (esEvento(e)) return { nombre: 'Nombre', descripcion: 'Qué ocurre en este momento del proceso…' };
  if (es(e, 'bpmn:MessageFlow')) return { nombre: 'Qué se envía (ej. "Factura")' };
  if (esConexion(e)) return { nombre: 'Etiqueta (ej. "Sí", "No")' };
  return { nombre: 'Nombre', descripcion: 'Qué se hace en este paso, quién y con qué…' };
}

export function crearPropiedades(contenedor, modeler, { alPlay } = {}) {
  const modeling = modeler.get('modeling');
  const factory = modeler.get('elementFactory');
  const selection = modeler.get('selection');
  const moddle = modeler.moddle;
  let actual = null;

  const campo = (etiqueta, control, ayuda) => el('label', { class: 'form-group' }, el('span', { class: 'form-label', texto: etiqueta }), control, ayuda ? el('small', { class: 'fl-ayuda', texto: ayuda }) : null);

  // Cambia el tipo (ej. tarea → tarea automática) en el mismo lugar: mismo tamaño, nombre, descripción, color y conexiones.
  function reemplazar(elemento, tipo) {
    if (bo(elemento).$type === tipo) return;
    const viejo = bo(elemento);
    const nueva = factory.crear(tipo, { nombre: viejo.name, evento: tipoEvento(elemento) || undefined, width: elemento.width, height: elemento.height });
    if (viejo.documentation && viejo.documentation.length) bo(nueva).documentation = viejo.documentation;
    nueva.colores = elemento.colores;
    nueva.marcadorVisible = elemento.marcadorVisible;
    // diagram-js ubica la figura nueva por su centro (x, y del reemplazo = centro de la original).
    nueva.x = elemento.x + elemento.width / 2;
    nueva.y = elemento.y + elemento.height / 2;
    const resultado = modeling.replaceShape(elemento, nueva);
    selection.select(resultado);
  }

  function documentacion(elemento) {
    const docs = bo(elemento).documentation || [];
    return docs.length ? docs[0].text || '' : '';
  }

  function render() {
    contenedor.replaceChildren();
    const sel = selection.get();
    if (sel.length > 1) {
      actual = null;
      contenedor.appendChild(el('div', { class: 'fl-prop-vacio' },
        el('div', { class: 'fl-prop-vacio-icono', html: icono('puntero', 28, 1.6) }),
        el('p', { texto: `${sel.length} elementos seleccionados` }),
        el('p', { class: 'text-muted', texto: 'Puedes moverlos juntos o borrarlos con Supr.' })));
      return;
    }
    if (!sel.length) {
      actual = null;
      resumen();
      return;
    }
    const e = actual = sel[0];
    const ayuda = textos(e);
    const encabezado = el('div', { class: 'fl-prop-encabezado' }, el('span', { class: 'fl-prop-tipo', texto: nombreTipo(e) }));
    encabezado.title = bo(e).id; // el identificador técnico solo al pasar el mouse
    contenedor.appendChild(encabezado);

    // Las flechas punteadas (hacia notas y documentos) no llevan nombre en BPMN: no se guardaría.
    if (esConexion(e) && !es(e, 'bpmn:SequenceFlow', 'bpmn:MessageFlow')) {
      contenedor.appendChild(el('p', { class: 'text-muted fl-resumen-pista', texto: 'Une un documento o una nota con un paso. Este tipo de flecha no lleva nombre.' }));
    } else {
      const nombre = el('input', { class: 'form-input', type: 'text', placeholder: 'Sin nombre', spellcheck: 'true' });
      nombre.value = leerNombre(e);
      nombre.addEventListener('change', () => modeling.renombrar(e, nombre.value.trim()));
      nombre.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); nombre.blur(); } });
      contenedor.appendChild(campo(ayuda.nombre, nombre));
    }

    if (esActividad(e) && !es(e, 'bpmn:SubProcess', 'bpmn:CallActivity')) {
      const s = el('select', { class: 'form-input' });
      const variantes = VARIANTES_TAREA.some(([t]) => t === bo(e).$type) ? VARIANTES_TAREA : [...VARIANTES_TAREA, [bo(e).$type, nombreTipo(e)]];
      for (const [t, n] of variantes) { const o = el('option', { value: t, texto: n }); if (bo(e).$type === t) o.selected = true; s.appendChild(o); }
      s.addEventListener('change', () => reemplazar(e, s.value));
      contenedor.appendChild(campo('Tipo de tarea', s));
    }
    if (esCompuerta(e) && VARIANTES_COMPUERTA.some(([t]) => t === bo(e).$type)) {
      const s = el('select', { class: 'form-input' });
      for (const [t, n] of VARIANTES_COMPUERTA) { const o = el('option', { value: t, texto: n }); if (bo(e).$type === t) o.selected = true; s.appendChild(o); }
      s.addEventListener('change', () => reemplazar(e, s.value));
      contenedor.appendChild(campo('Tipo (decisión o paralelo)', s));
      if (es(e, 'bpmn:ExclusiveGateway')) {
        const chk = el('input', { type: 'checkbox' });
        chk.checked = !!e.marcadorVisible;
        chk.addEventListener('change', () => modeling.cambiarPropiedades(e, null, { marcadorVisible: chk.checked }));
        contenedor.appendChild(el('label', { class: 'fl-check' }, chk, el('span', { texto: 'Mostrar la X dentro del rombo' })));
      }
    }

    if (!esConexion(e)) {
      const desc = el('textarea', { class: 'form-input', rows: '5', placeholder: ayuda.descripcion, spellcheck: 'true' });
      desc.value = documentacion(e);
      desc.addEventListener('change', () => {
        const texto = limpiarTexto(desc.value).trim();
        modeling.cambiarPropiedades(e, { documentation: texto ? [moddle.create('bpmn:Documentation', { text: texto })] : [] });
      });
      contenedor.appendChild(campo('Descripción', desc, 'Sale en la documentación en Word.'));
    }

    const carril = carrilDe(e);
    if (carril && !esEvento(e)) contenedor.appendChild(campo('Responsable', el('div', { class: 'fl-prop-dato', texto: leerNombre(carril) || '(carril sin nombre)' })));

    if (!esConexion(e)) {
      const fila = el('div', { class: 'fl-prop-colores' });
      COLORES_USUARIO.forEach((c) => {
        const b = el('button', { type: 'button', title: c.nombre, class: 'fl-swatch' });
        b.style.setProperty('--relleno', c.fill || '#fff');
        b.style.setProperty('--borde', c.stroke || '#94a3b8');
        if (!c.fill) b.textContent = 'A';
        const activo = c.fill ? e.colores && e.colores.fill === c.fill : !e.colores;
        if (activo) b.classList.add('activo');
        b.addEventListener('click', () => modeling.cambiarPropiedades(e, null, { colores: c.fill ? { fill: c.fill, stroke: c.stroke } : undefined }));
        fila.appendChild(b);
      });
      contenedor.appendChild(campo('Color', fila));
    }

    contenedor.appendChild(el('button', { type: 'button', class: 'btn btn-secondary btn-sm fl-prop-borrar', html: `${icono('borrar', 15)}<span>Borrar</span>`, onclick: () => modeling.removeElements([e]) }));
  }

  // Resumen del proceso abierto + revisión rápida (se actualiza mientras se modela).
  function resumen() {
    const elementos = modeler.get('elementRegistry').getAll();
    const n = contarDiagrama(elementos);
    const obs = revisarDiagrama(elementos);
    const caja = el('div', { class: 'fl-resumen' });
    caja.appendChild(el('div', { class: 'fl-prop-encabezado' },
      el('span', { class: 'fl-prop-tipo', texto: n.pools[0] || 'Proceso' }),
      el('span', { class: 'fl-resumen-bajada', texto: n.pools.length > 1 ? `Junto a ${n.pools.slice(1).join(', ')}` : 'Resumen del diagrama abierto' })));
    const cifras = el('div', { class: 'fl-resumen-cifras' });
    const cifra = (valor, uno, varios) => el('div', { class: 'fl-resumen-cifra' }, el('strong', { texto: String(valor) }), el('span', { texto: valor === 1 ? uno : varios }));
    cifras.append(cifra(n.pasos, 'paso', 'pasos'), cifra(n.decisiones, 'decisión', 'decisiones'), cifra(n.responsables, 'responsable', 'responsables'));
    caja.appendChild(cifras);

    const revision = el('div', { class: `fl-revision ${obs.length ? 'con-observaciones' : 'en-orden'}` });
    revision.appendChild(el('div', { class: 'fl-revision-titulo', html: icono(obs.length ? 'alerta' : 'ok', 16) }, el('span', { texto: obs.length ? `Para revisar (${obs.length})` : 'Todo en orden' })));
    if (!obs.length) revision.appendChild(el('p', { class: 'fl-revision-texto', texto: 'Cada paso tiene entrada y salida, y las decisiones tienen su pregunta y sus caminos con nombre.' }));
    const lista = el('ul', { class: 'fl-revision-lista' });
    for (const o of obs.slice(0, 12)) {
      const item = el('li');
      if (o.elemento) {
        const b = el('button', { type: 'button', class: 'fl-revision-item', texto: o.texto, title: 'Ir a este elemento' });
        b.addEventListener('click', () => {
          modeler.get('canvas').scrollToElement(o.elemento, { top: 120, bottom: 120, left: 160, right: 160 });
          selection.select(o.elemento);
        });
        item.appendChild(b);
      } else item.appendChild(el('span', { class: 'fl-revision-item', texto: o.texto }));
      lista.appendChild(item);
    }
    if (obs.length > 12) lista.appendChild(el('li', { class: 'fl-revision-mas', texto: `y ${obs.length - 12} más` }));
    if (obs.length) revision.appendChild(lista);
    caja.appendChild(revision);
    if (alPlay) caja.appendChild(el('button', { type: 'button', class: 'btn btn-primary btn-sm fl-resumen-play', html: `${icono('play', 15)}<span>Recorrer con el Play</span>`, onclick: alPlay }));
    caja.appendChild(el('p', { class: 'text-muted fl-resumen-pista', texto: 'Selecciona un elemento para editar sus datos. Doble clic sobre él cambia su nombre.' }));
    contenedor.appendChild(caja);
  }

  // Sin selección, el resumen se recalcula con cada cambio (una sola vez aunque lleguen varios juntos).
  let pendiente = false;
  modeler.on('commandStack.changed', () => {
    if (selection.get().length || pendiente) return;
    pendiente = true;
    queueMicrotask(() => { pendiente = false; if (!selection.get().length) render(); });
  });

  modeler.on('selection.changed', render);
  modeler.on('elements.changed', ({ elements }) => {
    const activo = document.activeElement;
    const editando = activo && contenedor.contains(activo) && /INPUT|TEXTAREA|SELECT/.test(activo.tagName);
    if (actual && elements.includes(actual) && !editando) render();
  });
  modeler.on('fluye.abierto', render);
  render();
}
