// Sitio de Fluye: el diagrama de carriles de la portada con su ficha, el visor de la portada con su selector, el
// reproductor que abre el Play a pantalla completa, la lista de plantillas con su vista, las preguntas frecuentes,
// el filtro por nivel y la entrada de las piezas al aparecer.
document.documentElement.classList.add('sitio-listo');
const quieto = window.matchMedia('(prefers-reduced-motion: reduce)');
const NS = 'http://www.w3.org/2000/svg';

// ---------- "Así se trabaja con Fluye": flechas entre las figuras y una ficha que avanza al bajar ----------
const piscina = document.querySelector('[data-piscina]');
if (piscina) {
  const svg = piscina.querySelector('.flechas');
  const FLUJOS = [['s', 'a'], ['a', 'b'], ['b', 'c'], ['c', 'e'], ['e', 'g'], ['g', 'f', 'Sí'], ['f', 'z'], ['g', 'h', 'No'], ['h', 'b']];
  const CAMINO = ['s', 'a', 'b', 'c', 'e', 'g', 'f', 'z']; // el recorrido de la ficha
  const nodo = (id) => piscina.querySelector(`[data-id="${id}"]`);
  const figura = (id) => nodo(id).querySelector('.evento, .rombo') || nodo(id);
  let recorrido = null, llegadas = [], ficha = null;

  const el = (tag, attrs) => { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); return n; };

  // Caja de una figura respecto de la piscina.
  const caja = (id) => {
    const r = figura(id).getBoundingClientRect(), p = piscina.getBoundingClientRect();
    return { x: r.left - p.left, y: r.top - p.top, w: r.width, h: r.height, cx: r.left - p.left + r.width / 2, cy: r.top - p.top + r.height / 2 };
  };

  // Recorrido en ángulos rectos de una figura a otra, como las flechas de Fluye.
  // Si las figuras se enfrentan (comparten altura o ancho), la flecha va recta por la parte común; si no, en L.
  function ruta(a, b) {
    const arriba = Math.max(a.y, b.y), abajo = Math.min(a.y + a.h, b.y + b.h);
    if (abajo - arriba > 8) {
      const y = (arriba + abajo) / 2, der = b.cx > a.cx;
      return [[der ? a.x + a.w : a.x, y], [der ? b.x : b.x + b.w, y]];
    }
    const izq = Math.max(a.x, b.x), der = Math.min(a.x + a.w, b.x + b.w);
    const baja = b.cy > a.cy;
    const y1 = baja ? a.y + a.h : a.y, y2 = baja ? b.y : b.y + b.h;
    if (der - izq > 8) { const x = (izq + der) / 2; return [[x, y1], [x, y2]]; }
    const medio = (y1 + y2) / 2;
    return [[a.cx, y1], [a.cx, medio], [b.cx, medio], [b.cx, y2]];
  }

  const d = (puntos) => puntos.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  function punta([x1, y1], [x2, y2]) {
    const ang = Math.atan2(y2 - y1, x2 - x1), l = 9, a = 0.45;
    return `M${x2} ${y2}L${x2 - l * Math.cos(ang - a)} ${y2 - l * Math.sin(ang - a)}L${x2 - l * Math.cos(ang + a)} ${y2 - l * Math.sin(ang + a)}Z`;
  }

  function dibujar() {
    svg.replaceChildren();
    const angosto = getComputedStyle(piscina).display === 'flex';
    const flujos = angosto ? CAMINO.slice(1).map((id, i) => [CAMINO[i], id, CAMINO[i] === 'g' ? 'Sí' : '']) : FLUJOS;
    for (const [de, a, etiqueta] of flujos) {
      const puntos = ruta(caja(de), caja(a));
      svg.append(el('path', { d: d(puntos) }));
      svg.append(el('path', { d: punta(puntos[puntos.length - 2], puntos[puntos.length - 1]), style: 'fill:#334155;stroke:none' }));
      if (etiqueta) {
        const [x, y] = puntos[0], vertical = puntos[0][0] === puntos[1][0];
        const t = el('text', { x: vertical ? x + 8 : x + 6, y: vertical ? (puntos[0][1] < puntos[1][1] ? y + 16 : y - 8) : y - 8 });
        t.textContent = etiqueta;
        svg.append(t);
      }
    }
    // Un solo trazo con todo el camino de la ficha, para ubicarla por distancia.
    const tramos = CAMINO.slice(1).map((id, i) => ruta(caja(CAMINO[i]), caja(id)));
    recorrido = el('path', { d: tramos.map(d).join(' '), style: 'stroke:none' });
    svg.append(recorrido);
    let largo = 0;
    llegadas = tramos.map((t, i) => {
      for (let k = 1; k < t.length; k++) largo += Math.hypot(t[k][0] - t[k - 1][0], t[k][1] - t[k - 1][1]);
      return { id: CAMINO[i + 1], en: largo };
    });
    ficha = el('g', { class: 'ficha' });
    ficha.append(el('circle', { r: 12, class: 'ficha-halo' }), el('circle', { r: 7, class: 'ficha-punto' }));
    svg.append(ficha);
    avanzar();
  }

  // La ficha recorre el camino mientras la sección pasa por la pantalla; lo ya recorrido queda en verde, como en el Play.
  function avanzar() {
    if (!recorrido || !ficha) return;
    if (quieto.matches) { ficha.style.display = 'none'; return; }
    const r = piscina.getBoundingClientRect(), alto = window.innerHeight;
    const avance = Math.min(1, Math.max(0, (alto * 0.75 - r.top) / (r.height + alto * 0.25)));
    const total = llegadas.length ? llegadas[llegadas.length - 1].en : 0;
    const p = recorrido.getPointAtLength(avance * total);
    ficha.setAttribute('transform', `translate(${p.x} ${p.y})`);
    for (const { id, en } of llegadas) nodo(id).classList.toggle('hecho', avance * total >= en - 1);
    nodo('s').classList.toggle('hecho', avance > 0);
  }

  let pendiente = false;
  window.addEventListener('scroll', () => {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(() => { pendiente = false; avanzar(); });
  }, { passive: true });
  new ResizeObserver(dibujar).observe(piscina);
  if (document.fonts) document.fonts.ready.then(dibujar);
}

// ---------- reproductor: el visor de Fluye a pantalla completa, encima de la página ----------
// Los enlaces con data-play llevan al visor en su propia página; aquí se abren en un diálogo que ocupa toda la
// ventana, con botón de pantalla completa, enlace a otra pestaña y cierre con el botón o con Esc.
let reproductor = null;
function crearReproductor() {
  const dialogo = document.createElement('dialog');
  dialogo.className = 'reproductor';
  dialogo.setAttribute('aria-labelledby', 'reproductor-titulo');
  dialogo.innerHTML = `
    <div class="reproductor-barra">
      <p class="reproductor-titulo" id="reproductor-titulo"></p>
      <button type="button" class="boton boton-tarea reproductor-pantalla">Pantalla completa</button>
      <a class="boton boton-claro reproductor-pestana" target="_blank" rel="noopener">Abrir en otra pestaña</a>
      <button type="button" class="boton reproductor-cerrar">Cerrar</button>
    </div>
    <iframe title="Visor de Fluye" allow="fullscreen" allowfullscreen></iframe>`;
  document.body.append(dialogo);
  const marco = dialogo.querySelector('iframe');
  const pantalla = dialogo.querySelector('.reproductor-pantalla');
  if (!document.fullscreenEnabled) pantalla.hidden = true;
  pantalla.addEventListener('click', () => marco.requestFullscreen?.().catch(() => {}));
  dialogo.querySelector('.reproductor-cerrar').addEventListener('click', () => dialogo.close());
  dialogo.addEventListener('close', () => {
    marco.src = 'about:blank';
    document.documentElement.classList.remove('reproductor-abierto');
    reproductor.origen?.focus();
  });
  // Esc dentro del visor: primero sale del Play (lo maneja el visor); si el Play no está andando, cierra.
  marco.addEventListener('load', () => {
    try {
      marco.contentWindow.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !e.defaultPrevented) dialogo.close(); });
    } catch { /* otra página: sin atajo */ }
  });
  return { dialogo, marco, titulo: dialogo.querySelector('.reproductor-titulo'), pestana: dialogo.querySelector('.reproductor-pestana'), origen: null };
}

document.addEventListener('click', (e) => {
  const enlace = e.target.closest('a[data-play]');
  if (!enlace || e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0 || typeof HTMLDialogElement !== 'function') return;
  e.preventDefault();
  reproductor ||= crearReproductor();
  reproductor.origen = enlace;
  reproductor.titulo.textContent = enlace.dataset.titulo || 'Proceso';
  reproductor.pestana.href = enlace.href;
  reproductor.marco.src = enlace.href;
  document.documentElement.classList.add('reproductor-abierto');
  reproductor.dialogo.showModal();
  reproductor.dialogo.querySelector('.reproductor-cerrar').focus();
});

// ---------- portada: el visor con su selector de procesos ----------
const prueba = document.querySelector('[data-prueba]');
if (prueba) {
  const marco = prueba.querySelector('iframe');
  const pestana = prueba.querySelector('[data-pestana]');
  const pantalla = prueba.querySelector('[data-pantalla-completa]');
  if (document.fullscreenEnabled) {
    pantalla.hidden = false;
    pantalla.addEventListener('click', () => marco.requestFullscreen?.().catch(() => {}));
  }
  prueba.addEventListener('click', (e) => {
    const enlace = e.target.closest('a[data-visor]');
    if (!enlace || e.ctrlKey || e.metaKey || e.shiftKey) return;
    e.preventDefault();
    for (const a of prueba.querySelectorAll('a[data-visor]')) a.toggleAttribute('aria-current', a === enlace);
    enlace.setAttribute('aria-current', 'true');
    marco.src = enlace.href;
    marco.title = `Visor de Fluye: ${enlace.dataset.titulo}`;
    pestana.href = enlace.href;
  });
}

// ---------- plantillas: la vista del diagrama sigue al nombre activo ----------
for (const catalogo of document.querySelectorAll('[data-catalogo]')) {
  const imagen = catalogo.querySelector('[data-catalogo-imagen]');
  const nombre = catalogo.querySelector('[data-catalogo-nombre]');
  const texto = catalogo.querySelector('[data-catalogo-texto]');
  let activa = null, espera = null;
  const activar = (enlace) => {
    if (!enlace || enlace === activa) return;
    activa?.classList.remove('activa');
    activa = enlace;
    enlace.classList.add('activa');
    nombre.textContent = enlace.dataset.nombre;
    texto.textContent = enlace.dataset.texto;
    imagen.alt = `Vista del diagrama ${enlace.dataset.nombre}`;
    if (quieto.matches) { imagen.src = enlace.dataset.vista; return; }
    imagen.classList.add('cambiando');
    clearTimeout(espera);
    espera = setTimeout(() => {
      imagen.src = enlace.dataset.vista;
      imagen.decode?.().catch(() => {}).finally(() => imagen.classList.remove('cambiando'));
    }, 150);
  };
  catalogo.addEventListener('pointerover', (e) => activar(e.target.closest('a[data-vista]')));
  catalogo.addEventListener('focusin', (e) => activar(e.target.closest('a[data-vista]')));
  // Al bajar con el dedo, se activa el nombre que pasa por el centro de la pantalla.
  if (window.matchMedia('(hover: none)').matches && 'IntersectionObserver' in window) {
    const centro = new IntersectionObserver((entradas) => {
      for (const en of entradas) if (en.isIntersecting) activar(en.target);
    }, { rootMargin: '-45% 0px -45% 0px' });
    for (const a of catalogo.querySelectorAll('a[data-vista]')) centro.observe(a);
  }
}

// ---------- plantillas: filtrar por nivel ----------
const niveles = document.querySelector('.niveles');
if (niveles) {
  niveles.addEventListener('click', (e) => {
    const boton = e.target.closest('.nivel');
    if (!boton) return;
    const nivel = boton.dataset.nivel;
    for (const b of niveles.querySelectorAll('.nivel')) {
      const activo = b === boton;
      b.classList.toggle('activo', activo);
      b.setAttribute('aria-pressed', String(activo));
    }
    for (const li of document.querySelectorAll('.catalogo-area li[data-nivel]')) li.hidden = !!nivel && li.dataset.nivel !== nivel;
    for (const area of document.querySelectorAll('.catalogo-area')) area.hidden = !area.querySelector('li[data-nivel]:not([hidden])');
  });
}

// ---------- preguntas: un índice y la respuesta en grande al lado (en el celular, se abre debajo) ----------
const preguntas = document.querySelector('[data-preguntas]');
if (preguntas) {
  const panel = preguntas.querySelector('.preguntas-panel');
  const panelTitulo = panel.querySelector('.pregunta-titulo');
  const panelTexto = panel.querySelector('.pregunta-texto');
  const elegir = (boton, alternar) => {
    const item = boton.closest('.pregunta');
    const abrir = alternar ? !item.classList.contains('abierta') : true;
    for (const otro of preguntas.querySelectorAll('.pregunta')) {
      const este = otro === item && abrir;
      otro.classList.toggle('abierta', este);
      otro.querySelector('.pregunta-boton').setAttribute('aria-expanded', String(este));
    }
    if (!abrir) return;
    panelTitulo.textContent = boton.textContent;
    panelTexto.textContent = item.querySelector('.respuesta').textContent.trim();
  };
  preguntas.addEventListener('click', (e) => {
    const boton = e.target.closest('.pregunta-boton');
    if (boton) elegir(boton, getComputedStyle(panel).display === 'none');
  });
  preguntas.addEventListener('pointerover', (e) => {
    const boton = e.target.closest('.pregunta-boton');
    if (boton && e.pointerType === 'mouse' && getComputedStyle(panel).display !== 'none') elegir(boton, false);
  });
  preguntas.addEventListener('focusin', (e) => {
    const boton = e.target.closest('.pregunta-boton');
    if (boton && getComputedStyle(panel).display !== 'none') elegir(boton, false);
  });
}

// ---------- las piezas entran al aparecer (una vez); la foto principal se abre como un obturador ----------
const piezas = document.querySelectorAll('.entra, .obturador');
if (!('IntersectionObserver' in window) || quieto.matches) {
  for (const p of piezas) p.classList.add('visto');
} else {
  const vista = new IntersectionObserver((entradas) => {
    for (const en of entradas) {
      if (!en.isIntersecting) continue;
      en.target.classList.add('visto');
      vista.unobserve(en.target);
    }
  }, { rootMargin: '0px 0px -8% 0px' });
  for (const p of piezas) vista.observe(p);
}
