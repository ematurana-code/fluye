// Leer y escribir colores de figuras en el .bpmn (BPMN in Color, bpmn.io/bioc y extensiones de Bizagi).
export const NS_COLOR = 'http://www.omg.org/spec/BPMN/non-normative/color/1.0';

const BIZAGI_POR_DEFECTO = new Set(['#E6FF97/#62A716', '#ECEFFF/#03689A', '#FFFFCC/#A6A61D', '#EEAAAA/#990000']);

function* recorrer(nodo, profundidad = 0) {
  if (!nodo || profundidad > 6) return;
  yield nodo;
  for (const hijo of [...(nodo.$children || []), ...(nodo.values || [])]) yield* recorrer(hijo, profundidad + 1);
}

function normalizar(c) {
  if (!c) return null;
  const v = String(c).trim();
  if (/^white$/i.test(v)) return '#FFFFFF';
  if (/^black$/i.test(v)) return '#000000';
  return /^#[0-9a-f]{3,8}$/i.test(v) ? v.toUpperCase() : null;
}

function deBizagi(bo) {
  const props = {};
  for (const n of recorrer(bo.extensionElements)) {
    if (!/BizagiProperty$/.test(n.$type || '')) continue;
    const nombre = n.name || (n.$attrs && n.$attrs.name), valor = n.value || (n.$attrs && n.$attrs.value);
    if (nombre) props[nombre] = valor;
  }
  const fill = normalizar(props.bgColor), stroke = normalizar(props.borderColor);
  if (!fill && !stroke) return null;
  if (BIZAGI_POR_DEFECTO.has(`${fill}/${stroke}`)) return null;
  if (fill === '#FFFFFF' && stroke === '#000000') return null;
  return { fill, stroke };
}

export function leerColores(di, bo) {
  const a = (di && di.$attrs) || {};
  const fill = normalizar(a['color:background-color'] || a['bioc:fill'] || di?.get?.('color:background-color'));
  const stroke = normalizar(a['color:border-color'] || a['bioc:stroke'] || di?.get?.('color:border-color'));
  if (fill || stroke) return { fill, stroke };
  return deBizagi(bo);
}

export function escribirColores(di, colores) {
  if (!colores) return;
  if (colores.fill) di.$attrs['color:background-color'] = colores.fill;
  if (colores.stroke) di.$attrs['color:border-color'] = colores.stroke;
}
