// Medir y dibujar texto multilínea dentro de figuras SVG.
import { create as svgCreate, attr as svgAttr, append as svgAppend } from 'tiny-svg';

export const FUENTE = 'Inter, "Segoe UI", system-ui, sans-serif';
const lienzo = document.createElement('canvas').getContext('2d');

export function medir(texto, tamano = 12, peso = 400) {
  lienzo.font = `${peso} ${tamano}px ${FUENTE}`;
  return lienzo.measureText(texto).width;
}

// Corta el texto en líneas que caben en `ancho`. Las palabras demasiado largas se parten.
export function partirLineas(texto, ancho, tamano = 12, peso = 400) {
  const lineas = [];
  for (const parrafo of String(texto || '').split(/\r?\n/)) {
    let actual = '';
    for (const palabra of parrafo.split(/\s+/).filter(Boolean)) {
      const prueba = actual ? `${actual} ${palabra}` : palabra;
      if (medir(prueba, tamano, peso) <= ancho) { actual = prueba; continue; }
      if (actual) lineas.push(actual);
      if (medir(palabra, tamano, peso) <= ancho) { actual = palabra; continue; }
      let trozo = '';
      for (const c of palabra) {
        if (medir(trozo + c, tamano, peso) > ancho && trozo) { lineas.push(trozo); trozo = c; } else trozo += c;
      }
      actual = trozo;
    }
    lineas.push(actual);
  }
  while (lineas.length > 1 && lineas[lineas.length - 1] === '') lineas.pop();
  return lineas;
}

/**
 * Dibuja texto centrado (o alineado) en una caja.
 * caja: { x, y, ancho, alto } — alto opcional; vertical: 'centro' | 'arriba'.
 */
export function dibujarTexto(padre, texto, caja, opciones = {}) {
  const { tamano = 12, peso = 400, color = '#0F172A', alinear = 'centro', vertical = 'centro', maxLineas = 0, rotar = 0, clase = 'fl-texto', halo = false } = opciones;
  if (!texto) return null;
  let lineas = partirLineas(texto, Math.max(10, caja.ancho), tamano, peso);
  if (maxLineas && lineas.length > maxLineas) {
    lineas = lineas.slice(0, maxLineas);
    lineas[maxLineas - 1] = lineas[maxLineas - 1].replace(/.{0,2}$/, '…');
  }
  const alto = tamano * 1.25;
  const total = lineas.length * alto;
  let y0 = caja.y + tamano * 0.95;
  if (vertical === 'centro' && caja.alto) y0 = caja.y + (caja.alto - total) / 2 + tamano * 0.95;

  const ancla = alinear === 'centro' ? 'middle' : alinear === 'derecha' ? 'end' : 'start';
  const x = alinear === 'centro' ? caja.x + caja.ancho / 2 : alinear === 'derecha' ? caja.x + caja.ancho : caja.x;
  const t = svgCreate('text');
  svgAttr(t, { class: clase, 'font-family': FUENTE, 'font-size': tamano, 'font-weight': peso, fill: color, 'text-anchor': ancla });
  // Borde blanco detrás de las letras: el nombre se lee aunque pase una flecha por debajo.
  if (halo) svgAttr(t, { stroke: '#ffffff', 'stroke-width': 3, 'stroke-linejoin': 'round', 'paint-order': 'stroke' });
  lineas.forEach((linea, i) => {
    const s = svgCreate('tspan');
    svgAttr(s, { x, y: y0 + i * alto });
    s.textContent = linea;
    svgAppend(t, s);
  });
  if (rotar) {
    const cx = caja.x + caja.ancho / 2, cy = caja.y + (caja.alto || 0) / 2;
    svgAttr(t, { transform: `rotate(${rotar} ${cx} ${cy})` });
  }
  svgAppend(padre, t);
  return t;
}
