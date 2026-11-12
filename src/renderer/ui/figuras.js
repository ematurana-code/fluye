// Imágenes y "Mis figuras" (artefactos personalizados): elegir una imagen del equipo, achicarla para que el .bpmn no
// pese de más, y guardar figuras propias para reutilizarlas desde la paleta (quedan en este navegador o en esta app).
import { modal, preguntar, aviso } from './dialogos.js';

const CLAVE = 'fluye.figuras';
const MAX_BYTES = 8 * 1024 * 1024;
const TIPOS = 'image/png,image/jpeg,image/gif,image/webp,image/svg+xml';

export function misFiguras() {
  try {
    const lista = JSON.parse(localStorage.getItem(CLAVE) || '[]');
    return Array.isArray(lista) ? lista.filter((f) => f && f.href && f.nombre) : [];
  } catch { return []; }
}

function guardarFiguras(lista) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(lista));
    return true;
  } catch {
    aviso('No se pudo guardar la figura: el almacenamiento de este navegador está lleno.', 'error', 4000);
    return false;
  }
}

export async function quitarFigura(id) {
  const f = misFiguras().find((x) => x.id === id);
  if (!f) return false;
  const r = await preguntar('Quitar figura', `¿Quitar “${f.nombre}” de tus figuras? Los diagramas donde ya la usaste no cambian.`, [
    { id: 'cancelar', texto: 'Cancelar' }, { id: 'quitar', texto: 'Quitar', clase: 'btn-danger' }
  ]);
  if (r !== 'quitar') return false;
  return guardarFiguras(misFiguras().filter((x) => x.id !== id));
}

// Abre el selector de archivos y devuelve { href, ancho, alto } (o null si se cancela). lado: tamaño máximo en px.
export function elegirImagen(lado = 1200) {
  return new Promise((resolver) => {
    const entrada = Object.assign(document.createElement('input'), { type: 'file', accept: TIPOS });
    entrada.addEventListener('change', async () => {
      const archivo = entrada.files && entrada.files[0];
      if (!archivo) return resolver(null);
      if (archivo.size > MAX_BYTES) { aviso('La imagen pesa más de 8 MB: usa una más liviana.', 'error', 4000); return resolver(null); }
      try { resolver(await leerImagen(archivo, lado)); } catch { aviso('No se pudo leer esa imagen.', 'error', 3500); resolver(null); }
    });
    entrada.addEventListener('cancel', () => resolver(null));
    entrada.click();
  });
}

function comoDataUrl(archivo) {
  return new Promise((ok, mal) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result));
    r.onerror = () => mal(r.error);
    r.readAsDataURL(archivo);
  });
}

async function leerImagen(archivo, lado) {
  const original = await comoDataUrl(archivo);
  const img = new Image();
  await new Promise((ok, mal) => { img.onload = ok; img.onerror = mal; img.src = original; });
  const w = img.naturalWidth || 200, h = img.naturalHeight || 150;
  // SVG: se deja tal cual (es vectorial y liviano). Lo demás se achica si es grande.
  if (archivo.type === 'image/svg+xml') return { href: original, ancho: w, alto: h };
  const k = Math.min(1, lado / Math.max(w, h));
  if (k === 1 && archivo.size < 400 * 1024) return { href: original, ancho: w, alto: h };
  const lienzo = Object.assign(document.createElement('canvas'), { width: Math.round(w * k), height: Math.round(h * k) });
  lienzo.getContext('2d').drawImage(img, 0, 0, lienzo.width, lienzo.height);
  const href = archivo.type === 'image/jpeg' ? lienzo.toDataURL('image/jpeg', 0.88) : lienzo.toDataURL('image/png');
  return { href, ancho: lienzo.width, alto: lienzo.height };
}

// Tamaño en el diagrama: cabe en máximo x máximo, sin deformar.
export function tamanoEnDiagrama(ancho, alto, maximo = 160) {
  const k = Math.min(maximo / ancho, maximo / alto, 1);
  return { width: Math.max(24, Math.round(ancho * k)), height: Math.max(20, Math.round(alto * k)) };
}

// Diálogo "Nueva figura": nombre + imagen. Devuelve la figura guardada o null.
export function nuevaFigura() {
  return new Promise((resolver) => {
    const fondo = Object.assign(document.createElement('div'), { className: 'modal-overlay fl-modal' });
    const caja = Object.assign(document.createElement('div'), { className: 'modal fl-figura-dialogo' });
    const h = Object.assign(document.createElement('h3'), { className: 'modal-title', textContent: 'Nueva figura' });
    const ayuda = Object.assign(document.createElement('p'), { className: 'modal-body', textContent: 'Elige una imagen (un logo, un sistema, un documento) y ponle nombre. Queda en la paleta, en Mis figuras, para usarla en cualquier diagrama.' });
    const etiqueta = Object.assign(document.createElement('label'), { className: 'form-group' });
    etiqueta.append(Object.assign(document.createElement('span'), { className: 'form-label', textContent: 'Nombre' }));
    const nombre = Object.assign(document.createElement('input'), { className: 'form-input', type: 'text', placeholder: 'Ej.: Sistema contable', maxLength: 60 });
    etiqueta.append(nombre);
    const vista = Object.assign(document.createElement('div'), { className: 'fl-figura-vista', textContent: 'Sin imagen' });
    const elegir = Object.assign(document.createElement('button'), { type: 'button', className: 'btn btn-secondary btn-sm', textContent: 'Elegir imagen…' });
    const pie = Object.assign(document.createElement('div'), { className: 'modal-footer' });
    const cancelar = Object.assign(document.createElement('button'), { type: 'button', className: 'btn btn-secondary', textContent: 'Cancelar' });
    const guardar = Object.assign(document.createElement('button'), { type: 'button', className: 'btn btn-primary', textContent: 'Guardar figura', disabled: true });
    pie.append(cancelar, guardar);
    caja.append(h, ayuda, etiqueta, vista, elegir, pie);
    fondo.appendChild(caja);
    document.body.appendChild(fondo);
    let imagen = null;
    const soltar = modal(fondo, caja, h);
    const cerrar = (v) => { document.removeEventListener('keydown', tecla, true); soltar(); resolver(v); };
    const tecla = (e) => { if (e.key === 'Escape') { e.stopPropagation(); cerrar(null); } };
    document.addEventListener('keydown', tecla, true);
    const revisar = () => { guardar.disabled = !(imagen && nombre.value.trim()); };
    nombre.addEventListener('input', revisar);
    elegir.addEventListener('click', async () => {
      const r = await elegirImagen(256);
      if (!r) return;
      imagen = r;
      const img = Object.assign(document.createElement('img'), { src: r.href, alt: '' });
      vista.replaceChildren(img);
      revisar();
    });
    cancelar.addEventListener('click', () => cerrar(null));
    guardar.addEventListener('click', () => {
      const figura = { id: `f${Date.now().toString(36)}`, nombre: nombre.value.trim(), href: imagen.href, ancho: imagen.ancho, alto: imagen.alto };
      if (!guardarFiguras([...misFiguras(), figura])) return;
      cerrar(figura);
    });
    nombre.focus();
  });
}
