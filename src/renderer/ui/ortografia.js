// Menú de clic derecho del corrector ortográfico, con el estilo de Fluye (no el de Windows): sugerencias y
// "Agregar al diccionario". Los botones no toman el foco, así el texto que se está escribiendo no se cierra
// y Electron reemplaza la palabra marcada. Textos siempre con textContent.
const escritorio = window.fluyeEscritorio || null;
let menu = null;

export function cerrarMenuOrtografia() {
  if (menu) menu.remove();
  menu = null;
}

export function mostrarMenuOrtografia({ x, y, palabra, sugerencias }) {
  if (!escritorio || !palabra) return;
  cerrarMenuOrtografia();
  menu = Object.assign(document.createElement('div'), { className: 'fl-menu fl-menu-ortografia' });
  menu.setAttribute('role', 'menu');
  const opcion = (texto, clase, accion) => {
    const b = Object.assign(document.createElement('button'), { type: 'button', className: `fl-menu-item ${clase}` });
    b.setAttribute('role', 'menuitem');
    b.append(Object.assign(document.createElement('strong'), { textContent: texto }));
    b.addEventListener('click', () => { accion(); cerrarMenuOrtografia(); });
    menu.append(b);
  };
  if (sugerencias && sugerencias.length) for (const s of sugerencias) opcion(s, 'fl-ortografia-sugerencia', () => escritorio.reemplazarPalabra(s));
  else menu.append(Object.assign(document.createElement('div'), { className: 'fl-menu-vacio', textContent: 'Sin sugerencias' }));
  menu.append(Object.assign(document.createElement('div'), { className: 'fl-menu-separador' }));
  opcion(`Agregar “${palabra}” al diccionario`, 'fl-ortografia-agregar', () => escritorio.agregarAlDiccionario(palabra));
  menu.addEventListener('mousedown', (e) => e.preventDefault()); // no quitarle el foco al texto
  document.body.append(menu);
  const r = menu.getBoundingClientRect();
  menu.style.left = `${Math.max(8, Math.min(x, innerWidth - r.width - 8))}px`;
  menu.style.top = `${y + r.height + 8 > innerHeight ? Math.max(8, y - r.height) : y}px`;
}

document.addEventListener('mousedown', (e) => { if (menu && !menu.contains(e.target)) cerrarMenuOrtografia(); }, true);
window.addEventListener('keydown', (e) => {
  if (menu && e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); cerrarMenuOrtografia(); }
}, true);
window.addEventListener('blur', cerrarMenuOrtografia);
window.addEventListener('wheel', cerrarMenuOrtografia, { passive: true });
