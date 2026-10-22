// Página web interactiva que exporta Fluye: muestra el diagrama y permite recorrerlo con el Play, sin instalar nada.
// El proceso viene dentro de la misma página (<script id="fluye-datos">); la página no se conecta a internet.
import '../renderer/styles.css';
import './visor.css';

import Visor from '../renderer/modeler/Visor.js';
import Play from '../renderer/play/Play.js';
import { icono } from '../renderer/iconos.js';
import { aviso, elegirOpcion } from '../renderer/ui/dialogos.js';
import { FUENTES } from '../renderer/exportar/imagen.js';
import { desempaquetar } from '../renderer/exportar/paquete.js';
import { crearPestanas } from '../renderer/ui/pestanas.js';

const $ = (s) => document.querySelector(s);

async function iniciar() {
  document.head.append(Object.assign(document.createElement('style'), { textContent: FUENTES }));
  // Íconos de la barra (contenido fijo del código).
  document.querySelectorAll('[data-icono]').forEach((n) => { n.insertAdjacentHTML('afterbegin', icono(n.dataset.icono, Number(n.dataset.tamano) || 18)); });
  await Promise.all(['400', '600'].map((p) => document.fonts.load(`${p} 12px Inter`))).catch(() => {});

  const datos = desempaquetar($('#fluye-datos').textContent);
  document.body.classList.add('listo');
  if (!datos) return aviso('Esta página no trae un proceso de Fluye.', 'error', 15000);
  $('#nombre-archivo').textContent = datos.titulo || 'Proceso';
  document.title = `${datos.titulo || 'Proceso'} — Fluye`;

  const visor = new Visor({ contenedor: $('#lienzo') });
  window.fluye = visor; // acceso para pruebas desde la consola
  const canvas = visor.get('canvas');
  try {
    await visor.abrir(datos.bpmn);
  } catch (e) {
    console.error(e);
    return aviso(`No se pudo mostrar el diagrama: ${e.message}`, 'error', 15000);
  }

  // ----- zoom -----
  // Mientras la persona no mueva la vista, el diagrama se vuelve a encuadrar si cambia el tamaño de la ventana.
  let tocado = false;
  let tocadoAntesDelPlay = false;
  const actualizarZoom = () => { $('#zoom-valor').textContent = `${Math.round(canvas.zoom() * 100)}%`; };
  const zoomEn = (escala, punto) => { tocado = true; canvas.zoom(Math.min(4, Math.max(0.2, escala)), punto); };
  $('#zoom-alejar').addEventListener('click', () => zoomEn(canvas.zoom() - 0.1));
  $('#zoom-acercar').addEventListener('click', () => zoomEn(canvas.zoom() + 0.1));
  $('#zoom-ajustar').addEventListener('click', () => { tocado = false; visor.ajustarVista(); });
  $('#zoom-valor').addEventListener('click', () => zoomEn(1));
  visor.on('canvas.viewbox.changed', actualizarZoom);

  // ----- mover la vista: arrastrar con el mouse o un dedo; dos dedos acercan o alejan -----
  const lienzo = $('#lienzo');
  const enControl = (t) => t.closest('.fl-decision, .fl-play-barra, .fl-play-insignia');
  const punteros = new Map();
  let previo = null;
  const gesto = () => {
    const p = [...punteros.values()];
    if (!p.length) return null;
    if (p.length === 1) return { x: p[0].x, y: p[0].y, distancia: 0 };
    return { x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2, distancia: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) };
  };
  lienzo.addEventListener('pointerdown', (e) => {
    if ((e.pointerType === 'mouse' && e.button > 1) || enControl(e.target)) return;
    e.preventDefault();
    tocado = true;
    lienzo.setPointerCapture(e.pointerId);
    punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
    previo = gesto();
    lienzo.classList.add('arrastrando');
  });
  lienzo.addEventListener('pointermove', (e) => {
    if (!punteros.has(e.pointerId)) return;
    punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesto();
    if (previo && g) {
      if (g.distancia && previo.distancia) {
        const r = lienzo.getBoundingClientRect();
        zoomEn(canvas.zoom() * (g.distancia / previo.distancia), { x: g.x - r.left, y: g.y - r.top });
      }
      canvas.scroll({ dx: g.x - previo.x, dy: g.y - previo.y });
    }
    previo = g;
  });
  const soltar = (e) => {
    punteros.delete(e.pointerId);
    previo = gesto();
    if (!punteros.size) lienzo.classList.remove('arrastrando');
  };
  lienzo.addEventListener('pointerup', soltar);
  lienzo.addEventListener('pointercancel', soltar);
  lienzo.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const r = lienzo.getBoundingClientRect();
      zoomEn(canvas.zoom() * Math.pow(1.0015, -e.deltaY), { x: e.clientX - r.left, y: e.clientY - r.top });
    } else {
      tocado = true;
      canvas.scroll({ dx: -e.deltaX, dy: -e.deltaY });
    }
  }, { passive: false });

  // ----- Play -----
  const play = new Play(visor, {
    bitacora: $('#bitacora'),
    barra: $('#play-barra'),
    alCambiar: (activo) => {
      const b = $('#btn-play');
      b.replaceChildren();
      b.insertAdjacentHTML('afterbegin', icono(activo ? 'cerrar' : 'play', 18)); // ícono fijo del código
      b.append(Object.assign(document.createElement('span'), { textContent: activo ? 'Salir del Play' : 'Play' }));
      b.classList.toggle('activo', activo);
      // La bitácora toma espacio a la derecha (o abajo en el celular): al entrar se vuelve a encuadrar, salvo que el
      // Play se haya acercado al inicio (diagrama muy alejado); al salir el encuadre queda como estaba.
      if (activo) { tocadoAntesDelPlay = tocado; tocado = !!play._vistaAntes; } else tocado = tocadoAntesDelPlay;
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    }
  });
  window.fluyePlay = play;
  $('#btn-play').addEventListener('click', async () => {
    if (play.activo) return play.salir();
    const r = await play.iniciar((opciones) => elegirOpcion('¿Desde qué inicio?', 'El diagrama tiene varios eventos de inicio. Elige por dónde empezar el recorrido.', opciones.map((o) => ({ valor: o.elemento, texto: o.texto }))));
    if (r.error) aviso(r.error, 'alerta', 5000);
  });

  // ----- pestañas: si el archivo trae varios diagramas se puede pasar de uno a otro (solo mirar) -----
  const vistas = new Map();
  const pestanas = crearPestanas($('#pestanas'), {
    lista: () => visor.diagramas(),
    actual: () => visor.indiceDiagrama,
    ir: async (i) => {
      if (play.activo) return;
      const { x, y, width, height } = canvas.viewbox();
      vistas.set(visor.indiceDiagrama, tocado ? { x, y, width, height } : null);
      await visor.abrir(datos.bpmn, i);
      const vista = vistas.get(i);
      tocado = !!vista;
      if (vista) canvas.viewbox(vista); else visor.ajustarVista();
      pestanas.actualizar();
    }
  });
  $('#pestanas').hidden = visor.diagramas().length < 2;

  new ResizeObserver(() => {
    canvas.resized();
    if (!tocado) visor.ajustarVista();
    actualizarZoom();
  }).observe(lienzo);
}

iniciar();
