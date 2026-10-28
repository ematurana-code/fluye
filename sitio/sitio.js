// Sitio de Fluye: el visor de la portada con su selector, el reproductor que abre el Play a pantalla completa, la
// lista de plantillas con su vista, las preguntas frecuentes, el filtro por nivel y la entrada de las piezas al aparecer.
document.documentElement.classList.add('sitio-listo');
const quieto = window.matchMedia('(prefers-reduced-motion: reduce)');

// ---------- reproductor: el visor de Fluye a pantalla completa, encima de la página ----------
// Los enlaces con data-play llevan al visor en su propia página; aquí se abren en un diálogo que ocupa toda la
// ventana, con botón de pantalla completa, enlace a otra pestaña y cierre con el botón o con Esc.
let reproductor = null;
function crearReproductor() {
  const dialogo = document.createElement('dialog');
  dialogo.className = 'reproductor';
  dialogo.setAttribute('aria-labelledby', 'reproductor-titulo');
  const ingles = document.documentElement.lang === 'en';
  const [pantallaTxt, pestanaTxt, cerrarTxt, visorTxt] = ingles
    ? ['Full screen', 'Open in a new tab', 'Close', 'Fluye viewer']
    : ['Pantalla completa', 'Abrir en otra pestaña', 'Cerrar', 'Visor de Fluye'];
  dialogo.innerHTML = `
    <div class="reproductor-barra">
      <p class="reproductor-titulo" id="reproductor-titulo"></p>
      <button type="button" class="boton boton-tarea reproductor-pantalla">${pantallaTxt}</button>
      <a class="boton boton-claro reproductor-pestana" target="_blank" rel="noopener">${pestanaTxt}</a>
      <button type="button" class="boton reproductor-cerrar">${cerrarTxt}</button>
    </div>
    <iframe title="${visorTxt}" allow="fullscreen" allowfullscreen></iframe>`;
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

// ---------- portada: el Play andando, con sus pestañas de procesos ----------
const prueba = document.querySelector('[data-prueba]');
if (prueba) {
  const marco = prueba.querySelector('iframe');
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
    marco.title = `${document.documentElement.lang === 'en' ? 'Fluye viewer' : 'Visor de Fluye'}: ${enlace.dataset.titulo}`;
  });
}

// ---------- plantillas: la vista del diagrama sigue al nombre activo ----------
for (const catalogo of document.querySelectorAll('[data-catalogo]')) {
  const imagen = catalogo.querySelector('[data-catalogo-imagen]');
  const nombre = catalogo.querySelector('[data-catalogo-nombre]');
  const texto = catalogo.querySelector('[data-catalogo-texto]');
  const abrir = catalogo.querySelector('[data-catalogo-abrir]');
  let activa = null, espera = null;
  const activar = (enlace) => {
    if (!enlace || enlace === activa) return;
    activa?.classList.remove('activa');
    activa = enlace;
    enlace.classList.add('activa');
    nombre.textContent = enlace.dataset.nombre;
    texto.textContent = enlace.dataset.texto;
    if (abrir && enlace.dataset.abrir) abrir.href = enlace.dataset.abrir;
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
