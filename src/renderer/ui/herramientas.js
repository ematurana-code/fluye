// Herramientas de la barra inferior, junto al zoom: seleccionar (V) y mano para mover la vista (H).
// Con la mano activa, presionar y arrastrar en cualquier parte (también sobre un elemento) mueve la vista;
// queda activa hasta V, Esc o la flecha.
import { icono } from '../iconos.js';

export function crearHerramientas(contenedor, modeler) {
  const handTool = modeler.get('handTool');
  const mano = { activa: false };
  mano.poner = (valor) => {
    mano.activa = !!valor;
    marcar();
  };
  modeler.on('element.mousedown', 2000, (e) => {
    const ev = e.originalEvent;
    if (!mano.activa || !ev || ev.button !== 0) return;
    handTool.activateMove(ev, true);
    return false;
  });

  const boton = (id, titulo, nombreIcono, accion) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.id = id;
    b.className = 'fl-btn fl-btn-icono fl-herramienta';
    b.title = titulo;
    b.innerHTML = icono(nombreIcono, 16); // ícono fijo del código
    b.addEventListener('click', accion);
    contenedor.appendChild(b);
    return b;
  };
  contenedor.innerHTML = '';
  const bSeleccion = boton('herramienta-seleccion', 'Seleccionar y mover elementos (V)', 'puntero', () => mano.poner(false));
  const bMano = boton('herramienta-mano', 'Mano: arrastra para mover la vista (H). V o Esc para volver', 'mano', () => mano.poner(!mano.activa));
  function marcar() {
    bMano.classList.toggle('activa', mano.activa);
    bSeleccion.classList.toggle('activa', !mano.activa);
    document.body.classList.toggle('modo-mano', mano.activa);
  }
  marcar();

  modeler.on('create.start', () => mano.poner(false));
  return { mano };
}
