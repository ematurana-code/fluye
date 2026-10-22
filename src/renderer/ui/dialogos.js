// Avisos breves (toast) y una pregunta modal con botones. Textos siempre con textContent.

export function aviso(texto, tipo = 'info', ms = 2600) {
  let zona = document.getElementById('fl-avisos');
  if (!zona) {
    zona = Object.assign(document.createElement('div'), { id: 'fl-avisos' });
    document.body.appendChild(zona);
  }
  const n = document.createElement('div');
  n.className = `fl-aviso fl-aviso-${tipo}`;
  n.textContent = texto;
  zona.appendChild(n);
  setTimeout(() => n.classList.add('salir'), ms);
  setTimeout(() => n.remove(), ms + 400);
}

let abiertos = 0;
let serie = 0;
const ENFOCABLES = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Deja un diálogo modal de verdad: el resto de la ventana no recibe foco ni clics (inert), Tab recorre solo el
 * diálogo y al cerrar el foco vuelve a donde estaba. Devuelve la función que lo cierra.
 */
export function modal(fondo, caja, titulo) {
  const anterior = document.activeElement;
  caja.setAttribute('role', 'dialog');
  caja.setAttribute('aria-modal', 'true');
  if (titulo) {
    if (!titulo.id) titulo.id = `fl-dialogo-${++serie}`;
    caja.setAttribute('aria-labelledby', titulo.id);
  }
  const app = document.querySelector('.fl-app');
  if (app && abiertos++ === 0) app.inert = true;
  const tab = (e) => {
    if (e.key !== 'Tab' || [...document.querySelectorAll('.modal-overlay')].pop() !== fondo) return;
    const lista = [...caja.querySelectorAll(ENFOCABLES)].filter((n) => n.offsetParent !== null);
    if (!lista.length) return;
    const primero = lista[0], ultimo = lista[lista.length - 1], activo = document.activeElement;
    if (!caja.contains(activo)) { e.preventDefault(); primero.focus(); }
    else if (e.shiftKey && activo === primero) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && activo === ultimo) { e.preventDefault(); primero.focus(); }
  };
  document.addEventListener('keydown', tab, true);
  let cerrado = false;
  return () => {
    if (cerrado) return;
    cerrado = true;
    document.removeEventListener('keydown', tab, true);
    fondo.remove();
    if (app && --abiertos === 0) app.inert = false;
    if (anterior && anterior.isConnected && anterior.focus) anterior.focus();
  };
}

/** Elegir una opción de una lista: opciones [{ valor, texto }] -> resuelve con el valor elegido (o null). */
export function elegirOpcion(titulo, mensaje, opciones) {
  return new Promise((resolver) => {
    const fondo = Object.assign(document.createElement('div'), { className: 'modal-overlay fl-modal' });
    const caja = Object.assign(document.createElement('div'), { className: 'modal' });
    const h = Object.assign(document.createElement('h3'), { className: 'modal-title', textContent: titulo });
    caja.append(h, Object.assign(document.createElement('p'), { className: 'modal-body', textContent: mensaje }));
    const lista = Object.assign(document.createElement('div'), { className: 'fl-modal-opciones' });
    let soltar = null;
    const cerrar = (v) => { document.removeEventListener('keydown', tecla, true); soltar(); resolver(v); };
    const tecla = (e) => { if (e.key === 'Escape') { e.stopPropagation(); cerrar(null); } };
    for (const o of opciones) {
      const b = Object.assign(document.createElement('button'), { type: 'button', className: 'fl-modal-opcion', textContent: o.texto });
      b.addEventListener('click', () => cerrar(o.valor));
      lista.appendChild(b);
    }
    const pie = Object.assign(document.createElement('div'), { className: 'modal-footer' });
    const cancelar = Object.assign(document.createElement('button'), { type: 'button', className: 'btn btn-secondary', textContent: 'Cancelar' });
    cancelar.addEventListener('click', () => cerrar(null));
    pie.appendChild(cancelar);
    caja.append(lista, pie);
    fondo.appendChild(caja);
    document.body.appendChild(fondo);
    soltar = modal(fondo, caja, h);
    document.addEventListener('keydown', tecla, true);
    lista.querySelector('button')?.focus();
  });
}

/** botones: [{ id, texto, clase }] -> resuelve con el id elegido (o 'cancelar' con Esc). */
export function preguntar(titulo, mensaje, botones) {
  return new Promise((resolver) => {
    const fondo = document.createElement('div');
    fondo.className = 'modal-overlay fl-modal';
    const caja = document.createElement('div');
    caja.className = 'modal';
    const h = Object.assign(document.createElement('h3'), { className: 'modal-title', textContent: titulo });
    const p = Object.assign(document.createElement('p'), { className: 'modal-body', textContent: mensaje });
    const pie = Object.assign(document.createElement('div'), { className: 'modal-footer' });
    let soltar = null;
    const cerrar = (id) => { document.removeEventListener('keydown', tecla, true); soltar(); resolver(id); };
    const tecla = (e) => { if (e.key === 'Escape') { e.stopPropagation(); cerrar('cancelar'); } };
    for (const b of botones) {
      const btn = Object.assign(document.createElement('button'), { type: 'button', className: `btn ${b.clase || 'btn-secondary'}`, textContent: b.texto });
      btn.addEventListener('click', () => cerrar(b.id));
      pie.appendChild(btn);
    }
    caja.append(h, p, pie);
    fondo.appendChild(caja);
    document.body.appendChild(fondo);
    soltar = modal(fondo, caja, h);
    document.addEventListener('keydown', tecla, true);
    // Enter confirma lo recomendado; si la pregunta es para borrar algo, el foco queda en el botón que no borra.
    (pie.querySelector('.btn-primary') || pie.querySelector('.btn:not(.btn-danger)'))?.focus();
  });
}
