// Pestañas de diagramas (como en Bizagi): un archivo puede tener varios diagramas.
// Clic = cambiar · doble clic = cambiar el nombre · × = borrar · + = diagrama nuevo · ← → recorren las pestañas.
// En la página web exportada solo se cambia de pestaña (sin agregar, renombrar ni borrar). Textos siempre con textContent.
//
// Diseño: la pestaña abierta es la ola del logo de Fluye que sale del lienzo, y la ficha celeste del Play marca
// en qué diagrama estás; al cambiar, la ola y la ficha se deslizan hasta la pestaña elegida (solo con transform).
// Las demás pestañas son texto con un círculo hueco (el inicio de cada proceso) y "+" es un círculo punteado.
import { icono } from '../iconos.js';

const LADERA = 20; // ancho de cada ladera de la ola (px); igual a --pst-ladera en styles.css
const ALTO = 31;
const FICHA = 12; // distancia de la ficha al borde izquierdo de la pestaña (= padding-left de .fl-pestana-boton)
const laderas = {
  izq: `<path class="relleno" d="M0 ${ALTO}V30.5C10 30.5 10 .5 ${LADERA} .5V${ALTO}Z"/><path class="borde" d="M0 30.5C10 30.5 10 .5 ${LADERA} .5"/>`,
  der: `<path class="relleno" d="M0 .5C10 .5 10 30.5 ${LADERA} 30.5V${ALTO}H0Z"/><path class="borde" d="M0 .5C10 .5 10 30.5 ${LADERA} 30.5"/>`
};
const ladera = (lado) => `<svg class="fl-ola-ladera" width="${LADERA}" height="${ALTO}" viewBox="0 0 ${LADERA} ${ALTO}">${laderas[lado]}</svg>`;
const sinMovimiento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * @param {HTMLElement} contenedor
 * @param {{ lista: () => {indice: number, nombre: string}[], actual: () => number, ir: (i: number) => void,
 *           agregar?: () => void, renombrar?: (i: number, nombre: string) => void, borrar?: (i: number, nombre: string) => void }} acciones
 */
export function crearPestanas(contenedor, { lista, actual, ir, agregar, renombrar, borrar }) {
  const fila = Object.assign(document.createElement('div'), { className: 'fl-pestanas-fila' });
  fila.setAttribute('role', 'presentation');
  const ola = Object.assign(document.createElement('div'), { className: 'fl-ola' });
  ola.setAttribute('aria-hidden', 'true');
  ola.innerHTML = `${ladera('izq')}<div class="fl-ola-cuerpo"></div>${ladera('der')}<span class="fl-ola-ficha"></span>`; // dibujo fijo del código
  const [olaIzq, olaCuerpo, olaDer, olaFicha] = ola.children;
  fila.append(ola);
  contenedor.replaceChildren(fila);
  let primera = true;

  // La rueda del mouse recorre las pestañas cuando no caben.
  contenedor.addEventListener('wheel', (e) => {
    if (contenedor.scrollWidth <= contenedor.clientWidth || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    contenedor.scrollLeft += e.deltaY;
    e.preventDefault();
  }, { passive: false });

  function moverOla(pestana) {
    ola.hidden = !pestana;
    if (!pestana) return;
    ola.classList.toggle('animada', !primera && !sinMovimiento());
    const x = pestana.offsetLeft, w = pestana.offsetWidth;
    olaIzq.style.transform = `translateX(${x - LADERA}px)`;
    olaCuerpo.style.transform = `translateX(${x}px) scaleX(${w})`;
    olaDer.style.transform = `translateX(${x + w}px)`;
    olaFicha.style.transform = `translateX(${x + FICHA}px)`;
    primera = false;
  }

  function elegir(caja, indice) {
    if (indice === actual()) return;
    // La ola sale de inmediato hacia la pestaña; el diagrama se abre mientras tanto.
    fila.querySelectorAll('.fl-pestana.activa').forEach((n) => n.classList.remove('activa'));
    caja.classList.add('activa');
    moverOla(caja);
    // Si no se pudo cambiar (por ejemplo, durante el Play), la barra vuelve a mostrar la pestaña real.
    Promise.resolve(ir(indice)).finally(() => { if (actual() !== indice) actualizar(); });
  }

  // ← → mueven el foco entre pestañas; Enter o espacio abren la enfocada; F2 cambia el nombre de la abierta.
  function teclas(e, boton, caja, indice) {
    if (e.target !== boton) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); elegir(caja, indice); return; }
    if (e.key === 'F2' && renombrar && indice === actual()) {
      e.preventDefault();
      editarNombre(caja, boton.querySelector('.fl-pestana-nombre'), indice, boton.querySelector('.fl-pestana-nombre').textContent);
      return;
    }
    const botones = [...fila.querySelectorAll('.fl-pestana-boton')];
    const i = botones.indexOf(boton);
    const destino = { ArrowLeft: i - 1, ArrowRight: i + 1, Home: 0, End: botones.length - 1 }[e.key];
    if (destino === undefined || !botones[destino]) return;
    e.preventDefault();
    botones[destino].focus();
  }

  function actualizar() {
    fila.querySelectorAll('.fl-pestana, .fl-pestana-nueva').forEach((n) => n.remove());
    const items = lista();
    for (const { indice, nombre } of items) {
      const activa = indice === actual();
      // Caja = pestaña completa (la que cubre la ola); adentro, la pestaña en sí y, al lado, el botón de borrar.
      const caja = Object.assign(document.createElement('div'), { className: `fl-pestana${activa ? ' activa' : ''}` });
      caja.setAttribute('role', 'presentation');
      const boton = Object.assign(document.createElement('div'), { className: 'fl-pestana-boton', tabIndex: activa ? 0 : -1 });
      boton.setAttribute('role', 'tab');
      boton.setAttribute('aria-selected', String(activa));
      boton.title = renombrar && activa ? `${nombre} (doble clic o F2 para cambiar el nombre)` : nombre;
      const punto = Object.assign(document.createElement('span'), { className: 'fl-pestana-punto' });
      const texto = Object.assign(document.createElement('span'), { className: 'fl-pestana-nombre', textContent: nombre });
      boton.append(punto, texto);
      boton.addEventListener('click', () => elegir(caja, indice));
      boton.addEventListener('keydown', (e) => teclas(e, boton, caja, indice));
      if (renombrar && activa) boton.addEventListener('dblclick', () => editarNombre(caja, texto, indice, nombre));
      caja.append(boton);
      if (borrar && items.length > 1) {
        const x = Object.assign(document.createElement('button'), { type: 'button', className: 'fl-pestana-borrar', title: `Borrar “${nombre}”` });
        x.setAttribute('aria-label', `Borrar “${nombre}”`);
        x.innerHTML = icono('cerrar', 12); // ícono fijo del código
        x.addEventListener('click', () => borrar(indice, nombre));
        caja.append(x);
      }
      fila.append(caja);
    }
    if (agregar) {
      const mas = Object.assign(document.createElement('button'), { type: 'button', className: 'fl-pestana-nueva', title: 'Diagrama nuevo' });
      mas.setAttribute('aria-label', 'Diagrama nuevo');
      mas.innerHTML = icono('mas', 12); // ícono fijo del código
      mas.addEventListener('click', () => agregar());
      fila.append(mas);
    }
    const viva = fila.querySelector('.fl-pestana.activa');
    moverOla(viva);
    if (viva) viva.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  function editarNombre(caja, texto, indice, nombre) {
    const input = Object.assign(document.createElement('input'), {
      className: 'fl-pestana-input', value: nombre, maxLength: 80, spellcheck: true, autocomplete: 'off'
    });
    input.setAttribute('aria-label', 'Nombre del diagrama');
    texto.replaceWith(input);
    moverOla(fila.querySelector('.fl-pestana.activa'));
    input.focus();
    input.select();
    let hecho = false;
    const terminar = (aplicar) => {
      if (hecho) return;
      hecho = true;
      const nuevo = input.value.trim();
      if (aplicar && nuevo && nuevo !== nombre) renombrar(indice, nuevo);
      else actualizar();
    };
    input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') { e.preventDefault(); terminar(true); }
      else if (e.key === 'Escape') { e.preventDefault(); terminar(false); }
    });
    input.addEventListener('blur', () => terminar(true));
    for (const ev of ['click', 'dblclick']) input.addEventListener(ev, (e) => e.stopPropagation());
  }

  // Si cambia el ancho de la barra (ventana, panel), la ola se reacomoda sin animar.
  new ResizeObserver(() => { primera = true; moverOla(fila.querySelector('.fl-pestana.activa')); }).observe(contenedor);

  actualizar();
  return { actualizar };
}
