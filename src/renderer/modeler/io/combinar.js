// Junta varios .bpmn en un solo modelo: cada diagrama de cada archivo queda como una pestaña.
// Sirve, por ejemplo, para la carpeta que deja Bizagi al exportar (un archivo por diagrama).
// Si dos archivos traen el mismo id (pasa al combinar copias de una misma plantilla), se renombra el repetido;
// las referencias entre objetos no se tocan, así que al guardar quedan apuntando bien.
import { normalizarDeclaracion } from './codificacion.js';

/**
 * @param {import('bpmn-moddle').BpmnModdle} moddle
 * @param {{ nombre: string, xml: string, nombrar?: boolean }[]} archivos
 * @returns {Promise<{ defs: any, avisos: string[] }>}
 */
export async function combinarArchivos(moddle, archivos) {
  const avisos = [];
  let base = null;
  const ids = new Set();
  for (const archivo of archivos) {
    const { rootElement: defs } = await moddle.fromXML(normalizarDeclaracion(archivo.xml), 'bpmn:Definitions');
    const diagramas = defs.diagrams || [];
    if (!diagramas.length) { avisos.push(`"${archivo.nombre}" no trae diagramas: se omitió.`); continue; }
    // Pestañas sin nombre: llevan el del archivo (Bizagi nombra cada archivo como su diagrama).
    // nombrar: false deja tal cual las del proyecto abierto (al agregarle una plantilla como pestaña).
    const sinExtension = archivo.nombre.replace(/\.(bpmn|xml|html?)$/i, '');
    if (archivo.nombrar !== false) diagramas.forEach((d, i) => { if (!(d.name && d.name.trim())) d.name = diagramas.length > 1 ? `${sinExtension} ${i + 1}` : sinExtension; });
    if (!base) {
      base = defs;
      recorrer(defs, (el) => { if (el.id) ids.add(el.id); });
      continue;
    }
    recorrer(defs, (el) => {
      if (!el.id) return;
      if (ids.has(el.id)) {
        let n = 2;
        while (ids.has(`${el.id}_${n}`)) n++;
        el.id = `${el.id}_${n}`;
      }
      ids.add(el.id);
    });
    // Prefijos de atributos propios de cada herramienta (fluye:, camunda:, triso:...): sin su declaración se perderían.
    for (const [k, v] of Object.entries(defs.$attrs || {})) if (k.startsWith('xmlns:') && !(k in base.$attrs)) base.$attrs[k] = v;
    for (const r of defs.rootElements || []) { r.$parent = base; base.get('rootElements').push(r); }
    for (const d of diagramas) { d.$parent = base; base.get('diagrams').push(d); }
  }
  if (!base) throw new Error('Ninguno de los archivos trae un diagrama.');
  return { defs: base, avisos };
}

// Recorre todos los objetos contenidos (no las referencias), una vez cada uno.
function recorrer(el, fn, vistos = new Set()) {
  if (!el || typeof el !== 'object' || vistos.has(el) || !el.$descriptor) return;
  vistos.add(el);
  fn(el);
  for (const p of el.$descriptor.properties || []) {
    if (p.isReference) continue;
    const v = el.get(p.name);
    if (Array.isArray(v)) v.forEach((x) => recorrer(x, fn, vistos));
    else if (v && typeof v === 'object') recorrer(v, fn, vistos);
  }
}
