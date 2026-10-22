// Prueba de compatibilidad: abre cada .bpmn de prueba, lo guarda, lo vuelve a abrir y compara.
// Uso (con `node scripts/servidor.mjs` y la app abierta en http://localhost:8095):
//   const { probar } = await import('/pruebas/compatibilidad.js'); await probar(window.fluye)
// "perfecto" = no se pierde ninguna figura ni ningún elemento del modelo, se conservan los diagramas
// guardar dos veces seguidas da exactamente el mismo archivo, y lo guardado no trae más avisos del lector que el original
// (un id repetido no se ve en el índice por id: moddle bota la copia al leer, por eso se cuentan los avisos).

const CLAVES = ['rootElements', 'flowElements', 'artifacts', 'participants', 'messageFlows', 'laneSets', 'lanes', 'childLaneSet',
  'dataInputAssociations', 'dataOutputAssociations', 'ioSpecification', 'dataInputs', 'dataOutputs', 'eventDefinitions'];

function decodificar(buf) {
  const cabecera = new TextDecoder('latin1').decode(buf.slice(0, 200));
  return new TextDecoder(/ISO-8859-1|windows-1252/i.test(cabecera) ? 'windows-1252' : 'utf-8').decode(buf);
}

async function indexar(moddle, xml) {
  const { rootElement: d, warnings } = await moddle.fromXML(xml, 'bpmn:Definitions');
  const m = new Map();
  const rec = (o, prof) => {
    if (!o || prof > 12 || typeof o !== 'object') return;
    if (o.$type && o.id && /^bpmn:/.test(o.$type) && !/Definitions|Documentation/.test(o.$type)) m.set(o.id, o.$type);
    for (const k of CLAVES) {
      const v = o[k];
      if (Array.isArray(v)) v.forEach((x) => rec(x, prof + 1)); else if (v) rec(v, prof + 1);
    }
  };
  rec(d, 0);
  return { m, diagramas: d.diagrams.length, avisos: warnings.length };
}

export async function probar(fluye) {
  const lista = await (await fetch('/pruebas/lista.json')).json();
  const cuenta = () => fluye.get('elementRegistry').getAll().length - 1;
  const resultados = [];
  for (const ruta of lista) {
    const r = { archivo: decodeURI(ruta) };
    try {
      const xml = decodificar(await (await fetch(ruta)).arrayBuffer());
      const s0 = await indexar(fluye.moddle, xml);
      await fluye.abrir(xml);
      const vistos = cuenta();
      const x1 = await fluye.guardarXml();
      const s1 = await indexar(fluye.moddle, x1);
      await fluye.abrir(x1);
      const vistosTras = cuenta();
      const x2 = await fluye.guardarXml();
      const perdidos = [...s0.m].filter(([id]) => !s1.m.has(id)).map(([, t]) => t);
      r.perfecto = vistos === vistosTras && x1 === x2 && !perdidos.length && s0.diagramas === s1.diagramas && s1.avisos <= s0.avisos;
      r.detalle = `figuras ${vistos}->${vistosTras}, modelo ${s0.m.size}->${s1.m.size}, diagramas ${s0.diagramas}->${s1.diagramas}, estable ${x1 === x2}, avisos ${s0.avisos}->${s1.avisos}` +
        (perdidos.length ? `, PERDIDOS: ${perdidos.join(', ')}` : '');
    } catch (e) {
      r.perfecto = false;
      r.detalle = `ERROR: ${e.message || e}`;
    }
    resultados.push(r);
  }
  const ok = resultados.filter((r) => r.perfecto).length;
  return { resumen: `${ok} de ${resultados.length} perfectos`, problemas: resultados.filter((r) => !r.perfecto) };
}
