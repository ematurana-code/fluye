// Panel de propiedades del elemento seleccionado. Todo dato del usuario se muestra con textContent/value (nunca innerHTML).
import {
  COLORES_USUARIO, DEFINICIONES_EVENTO, bo, es, esActividad, esArtefactoFluye, esBorde, esCarril, esCompuerta, esConexion, esEncabezado,
  esEvento, esFase, esImagen, esPool, esTexto, faseDe, limpiarTexto, nombreTipo, nuevoId, tipoEvento
} from '../modeler/tipos.js';
import { leerNombre } from '../modeler/modeling/comandos.js';
import { formatoTexto } from '../modeler/draw/FluyeRenderer.js';
import { icono } from '../iconos.js';
import { contarDiagrama, revisarDiagrama } from '../modeler/revision.js';
import { elegirImagen, misFiguras, tamanoEnDiagrama } from './figuras.js';
import { aviso } from './dialogos.js';

// Qué puede disparar un evento de borde (el orden es el del selector).
const EVENTOS_BORDE = [['temporizador', 'Plazo o tiempo (temporizador)'], ['mensaje', 'Llega un mensaje'], ['error', 'Error'],
  ['senal', 'Señal'], ['condicional', 'Se cumple una condición'], ['escalamiento', 'Escalamiento']];
const TAMANOS_TEXTO = [10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48];
const COLORES_TEXTO = ['#0F172A', '#475569', '#1E3A8A', '#059669', '#D97706', '#DC2626', '#6D28D9'];

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
    const encabezado = el('div', { class: 'fl-prop-encabezado' }, el('span', { class: 'fl-prop-tipo', texto: esBorde(e) ? 'Evento en el borde' : nombreTipo(e) }));
    encabezado.title = bo(e).id; // el identificador técnico solo al pasar el mouse
    contenedor.appendChild(encabezado);
    if (esArtefactoFluye(e)) {
      propio(e);
      contenedor.appendChild(el('button', { type: 'button', class: 'btn btn-secondary btn-sm fl-prop-borrar', html: `${icono('borrar', 15)}<span>Borrar</span>`, onclick: () => modeling.removeElements([e]) }));
      return;
    }

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

    // Evento de borde: qué lo dispara y si detiene la tarea o corre en paralelo con ella.
    if (esBorde(e)) {
      const s = el('select', { class: 'form-input' });
      const actualTipo = tipoEvento(e);
      for (const [t, n] of EVENTOS_BORDE) { const o = el('option', { value: t, texto: n }); if (actualTipo === t) o.selected = true; s.appendChild(o); }
      s.addEventListener('change', () => modeling.cambiarPropiedades(e, { eventDefinitions: [moddle.create(DEFINICIONES_EVENTO[s.value], { id: nuevoId('EventDefinition') })] }));
      contenedor.appendChild(campo('Qué ocurre', s));
      const chk = el('input', { type: 'checkbox' });
      chk.checked = bo(e).cancelActivity !== false;
      chk.addEventListener('change', () => modeling.cambiarPropiedades(e, { cancelActivity: chk.checked }));
      contenedor.appendChild(el('label', { class: 'fl-check' }, chk, el('span', { texto: 'Detiene la tarea (si no, la tarea sigue y este camino corre en paralelo)' })));
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
    const fase = !esConexion(e) && faseDe(e);
    if (fase) contenedor.appendChild(campo('Fase', el('div', { class: 'fl-prop-dato', texto: leerNombre(fase) || '(fase sin nombre)' })));

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

  // ---------- fase, texto, encabezado e imagen ----------

  const texto = (valor, alCambiar, opciones = {}) => {
    const n = el(opciones.area ? 'textarea' : 'input', { class: 'form-input', spellcheck: 'true', placeholder: opciones.placeholder || '', ...(opciones.area ? { rows: String(opciones.area) } : { type: 'text' }) });
    n.value = valor || '';
    n.addEventListener('change', () => alCambiar(limpiarTexto(n.value).trim()));
    if (!opciones.area) n.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); n.blur(); } });
    return n;
  };
  const prop = (e, k) => (v) => modeling.cambiarPropiedades(e, { [k]: v || undefined });

  function colores(e, alElegir, activo, lista) {
    const fila = el('div', { class: 'fl-prop-colores' });
    for (const c of lista) {
      const b = el('button', { type: 'button', title: c.nombre, class: 'fl-swatch' });
      b.style.setProperty('--relleno', c.relleno);
      b.style.setProperty('--borde', c.borde);
      if (c.letra) b.textContent = c.letra;
      if (activo(c)) b.classList.add('activo');
      b.addEventListener('click', () => alElegir(c));
      fila.appendChild(b);
    }
    return fila;
  }

  function propio(e) {
    const b = bo(e);
    if (esFase(e)) {
      contenedor.appendChild(campo('Nombre de la fase', texto(leerNombre(e), (v) => modeling.renombrar(e, v), { placeholder: 'Ej.: Solicitud, Revisión, Entrega' })));
      const lista = COLORES_USUARIO.map((c) => ({ nombre: c.nombre, relleno: c.fill || '#F8FAFC', borde: c.stroke || '#94a3b8', letra: c.fill ? '' : 'A', valor: c }));
      contenedor.appendChild(campo('Color de la franja', colores(e, (c) => modeling.cambiarPropiedades(e, null, { colores: c.valor.fill ? { fill: c.valor.fill } : undefined }),
        (c) => (c.valor.fill ? e.colores && e.colores.fill === c.valor.fill : !e.colores), lista)));
      contenedor.appendChild(el('p', { class: 'text-muted fl-resumen-pista', texto: 'Arrastra el borde derecho de la fase para cambiar su ancho. Suelta otra fase encima de esta para dividirla.' }));
      return;
    }
    if (esTexto(e)) {
      contenedor.appendChild(campo('Texto', texto(leerNombre(e), (v) => modeling.renombrar(e, v), { area: 4 })));
      const f = formatoTexto(e);
      const barra = el('div', { class: 'fl-formato' });
      const tam = el('select', { class: 'form-input', title: 'Tamaño de la letra' });
      for (const t of TAMANOS_TEXTO) { const o = el('option', { value: String(t), texto: `${t}` }); if (t === f.tamano) o.selected = true; tam.appendChild(o); }
      if (!TAMANOS_TEXTO.includes(f.tamano)) tam.prepend(Object.assign(el('option', { value: String(f.tamano), texto: `${f.tamano}` }), { selected: true }));
      tam.addEventListener('change', () => modeling.cambiarPropiedades(e, { tamano: tam.value }));
      barra.appendChild(tam);
      const alternar = (k, etiqueta, titulo, estilo, activo) => {
        const btn = el('button', { type: 'button', title: titulo, texto: etiqueta, style: estilo });
        if (activo) btn.classList.add('activo');
        btn.setAttribute('aria-pressed', String(!!activo));
        btn.addEventListener('click', () => modeling.cambiarPropiedades(e, { [k]: activo ? undefined : 'true' }));
        barra.appendChild(btn);
      };
      alternar('negrita', 'N', 'Negrita', 'font-weight:700', f.peso === 700);
      alternar('cursiva', 'K', 'Cursiva', 'font-style:italic', f.cursiva);
      alternar('subrayado', 'S', 'Subrayado', 'text-decoration:underline', f.subrayado);
      for (const [valor, etiqueta, titulo] of [['inicio', '⇤', 'Alinear a la izquierda'], ['centro', '↔', 'Centrar'], ['derecha', '⇥', 'Alinear a la derecha']]) {
        const btn = el('button', { type: 'button', title: titulo, texto: etiqueta });
        if (f.alinear === valor) btn.classList.add('activo');
        btn.addEventListener('click', () => modeling.cambiarPropiedades(e, { alinear: valor === 'inicio' ? undefined : valor }));
        barra.appendChild(btn);
      }
      contenedor.appendChild(campo('Formato', barra));
      const letras = COLORES_TEXTO.map((c) => ({ nombre: c, relleno: c, borde: c, valor: c }));
      contenedor.appendChild(campo('Color de la letra', colores(e, (c) => modeling.cambiarPropiedades(e, { color: c.valor === '#0F172A' ? undefined : c.valor }), (c) => f.color === c.valor, letras)));
      const fondos = [{ nombre: 'Sin fondo', relleno: '#fff', borde: '#94a3b8', letra: '∅', valor: null }, ...COLORES_USUARIO.filter((c) => c.fill).map((c) => ({ nombre: c.nombre, relleno: c.fill, borde: c.stroke, valor: c.fill }))];
      contenedor.appendChild(campo('Fondo', colores(e, (c) => modeling.cambiarPropiedades(e, { fondo: c.valor || undefined }), (c) => f.fondo === c.valor, fondos)));
      const chk = el('input', { type: 'checkbox' });
      chk.checked = f.borde;
      chk.addEventListener('change', () => modeling.cambiarPropiedades(e, { borde: chk.checked ? 'true' : undefined }));
      contenedor.appendChild(el('label', { class: 'fl-check' }, chk, el('span', { texto: 'Con borde' })));
      return;
    }
    if (esEncabezado(e)) {
      let raiz = e;
      while (raiz.parent) raiz = raiz.parent;
      contenedor.appendChild(campo('Título', texto(b.titulo, prop(e, 'titulo'), { placeholder: raiz.nombreDiagrama || 'Nombre de la pestaña' }), 'Vacío: usa el nombre de la pestaña y cambia solo si la renombras.'));
      contenedor.appendChild(campo('Autor', texto(b.autor, prop(e, 'autor'), { placeholder: 'Quién hizo el diagrama' })));
      contenedor.appendChild(campo('Versión', texto(b.version, prop(e, 'version'), { placeholder: 'Ej.: 1.0' })));
      contenedor.appendChild(campo('Descripción', texto(b.descripcion, prop(e, 'descripcion'), { area: 3, placeholder: 'Para qué es este diagrama…' }), 'La fecha de “Actualizado” se pone sola al guardar.'));
      return;
    }
    if (esImagen(e)) {
      contenedor.appendChild(campo('Nombre (va debajo)', texto(leerNombre(e), (v) => modeling.renombrar(e, v), { placeholder: 'Opcional' })));
      const cambiar = el('button', { type: 'button', class: 'btn btn-secondary btn-sm', texto: 'Cambiar imagen…' });
      cambiar.addEventListener('click', async () => {
        const r = await elegirImagen(1200);
        if (r) modeling.cambiarPropiedades(e, { href: r.href });
      });
      const acciones = el('div', { class: 'fl-formato' }, cambiar);
      const yaGuardada = misFiguras().some((f) => f.href === b.href);
      if (b.href && !yaGuardada) {
        const guardar = el('button', { type: 'button', class: 'btn btn-secondary btn-sm', texto: 'Guardar en Mis figuras' });
        guardar.addEventListener('click', () => {
          const nombre = leerNombre(e) || 'Figura';
          try {
            const lista = misFiguras();
            const t = tamanoEnDiagrama(e.width, e.height, 256);
            lista.push({ id: `f${Date.now().toString(36)}`, nombre, href: b.href, ancho: t.width, alto: t.height });
            localStorage.setItem('fluye.figuras', JSON.stringify(lista));
            aviso(`“${nombre}” quedó en Mis figuras (en la paleta).`, 'ok');
            render();
          } catch { aviso('No se pudo guardar: el almacenamiento de este navegador está lleno.', 'error', 4000); }
        });
        acciones.appendChild(guardar);
      }
      contenedor.appendChild(campo('Imagen', acciones));
    }
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
