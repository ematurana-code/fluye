// Imagen del diagrama: SVG independiente (con la letra Inter incrustada) y PNG a partir de ese SVG.
import inter400 from '@fontsource/inter/files/inter-latin-400-normal.woff2?base64';
import inter600 from '@fontsource/inter/files/inter-latin-600-normal.woff2?base64';

const MARGEN = 24;
const QUITAR = '.djs-hit, .djs-outline, .djs-selection-outline, .djs-bendpoint, .djs-segment-dragger, .djs-dragger, .djs-visual-dragger';

export const FUENTES =`@font-face{font-family:Inter;font-weight:400;src:url(data:font/woff2;base64,${inter400}) format('woff2')}` +
  `@font-face{font-family:Inter;font-weight:600;src:url(data:font/woff2;base64,${inter600}) format('woff2')}`;

/** Devuelve { svg, ancho, alto } con todo el diagrama, fondo blanco y fuentes incrustadas. */
export function svgDelDiagrama(modeler) {
  const canvas = modeler.get('canvas');
  const raizSvg = canvas._svg;
  const capa = canvas.getActiveLayer();
  const caja = capa.getBBox();
  if (!caja.width || !caja.height) throw new Error('El diagrama está vacío.');
  const x = Math.floor(caja.x - MARGEN), y = Math.floor(caja.y - MARGEN);
  const ancho = Math.ceil(caja.width + MARGEN * 2), alto = Math.ceil(caja.height + MARGEN * 2);

  const copia = capa.cloneNode(true);
  copia.removeAttribute('class');
  copia.querySelectorAll(QUITAR).forEach((n) => n.remove());
  // Las marcas de selección o del Play viven en CSS de la app: en la copia no deben influir.
  copia.querySelectorAll('[class]').forEach((n) => {
    const c = n.getAttribute('class');
    if (/djs-element|djs-shape|djs-connection|djs-group/.test(c)) n.setAttribute('class', c.replace(/\b(selected|hover|fl-[\w-]+|drop-\w+|connect-\w+)\b/g, '').trim());
  });

  const defs = [...raizSvg.querySelectorAll(':scope > defs')].map((d) => d.outerHTML).join('');
  const serial = new XMLSerializer().serializeToString(copia);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${ancho}" height="${alto}" viewBox="${x} ${y} ${ancho} ${alto}">` +
    `<style>${FUENTES}</style>${defs}<rect x="${x}" y="${y}" width="${ancho}" height="${alto}" fill="#ffffff"/>${serial}</svg>`;
  return { svg, ancho, alto };
}

/** PNG del diagrama (escala 2 = nítido para documentos). Devuelve { bytes, ancho, alto } en píxeles reales. */
export async function pngDelDiagrama(modeler, escala = 2) {
  const { svg, ancho, alto } = svgDelDiagrama(modeler);
  const maximo = 12000;
  const k = Math.min(escala, maximo / ancho, maximo / alto);
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    img.decoding = 'sync';
    await new Promise((ok, mal) => { img.onload = ok; img.onerror = () => mal(new Error('No se pudo dibujar la imagen.')); img.src = url; });
    const lienzo = document.createElement('canvas');
    lienzo.width = Math.round(ancho * k);
    lienzo.height = Math.round(alto * k);
    const ctx = lienzo.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, lienzo.width, lienzo.height);
    ctx.drawImage(img, 0, 0, lienzo.width, lienzo.height);
    const blob = await new Promise((r) => lienzo.toBlob(r, 'image/png'));
    return { bytes: new Uint8Array(await blob.arrayBuffer()), ancho: lienzo.width, alto: lienzo.height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Página HTML lista para imprimir a PDF: título, fecha y el diagrama ajustado a una hoja A4.
export function htmlParaPdf(modeler, titulo) {
  const { svg, ancho, alto } = svgDelDiagrama(modeler);
  const horizontal = ancho >= alto;
  const fecha = new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' });
  const escapar = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const datos = btoa(unescape(encodeURIComponent(svg)));
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${escapar(titulo)}</title><style>
${FUENTES}
@page { size: A4 ${horizontal ? 'landscape' : 'portrait'}; margin: 12mm; }
html, body { margin: 0; font-family: Inter, "Segoe UI", sans-serif; color: #0f172a; }
.hoja { display: flex; flex-direction: column; height: calc(${horizontal ? '210mm' : '297mm'} - 24mm); }
header { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid #1e3a8a; padding-bottom: 6px; margin-bottom: 10px; }
h1 { font-size: 18px; margin: 0; color: #1e3a8a; font-weight: 600; }
small { color: #64748b; font-size: 11px; }
.diagrama { flex: 1; display: flex; align-items: center; justify-content: center; min-height: 0; }
.diagrama img { max-width: 100%; max-height: 100%; }
</style></head><body><div class="hoja"><header><h1>${escapar(titulo)}</h1><small>${escapar(fecha)} · Fluye</small></header>
<div class="diagrama"><img src="data:image/svg+xml;base64,${datos}" alt=""></div></div></body></html>`;
}
