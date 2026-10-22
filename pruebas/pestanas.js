// Prueba de pestañas: en cada archivo con varios diagramas pasa por todas las pestañas, guarda y vuelve a abrir.
// Cada diagrama debe conservar todas sus figuras y el archivo la misma cantidad de diagramas.
// Uso (con la web de prueba abierta): const { probarPestanas } = await import('/pruebas/pestanas.js'); await probarPestanas(window.fluye)
const ARCHIVOS = ['/pruebas/miwg/referencia/C.4.0.bpmn', '/pruebas/miwg/referencia/C.5.0.bpmn', '/pruebas/miwg/referencia/C.10.0.bpmn'];

export async function probarPestanas(fluye, rutas = ARCHIVOS) {
  const figurasPorPestana = async (xml) => {
    const { diagramas } = await fluye.abrir(xml);
    const cuenta = [];
    for (let i = 0; i < diagramas; i++) {
      await fluye.abrir(xml, { diagrama: i });
      cuenta.push(fluye.get('elementRegistry').getAll().length);
    }
    return cuenta;
  };
  const casos = [];
  for (const ruta of rutas) {
    const xml = await fetch(ruta).then((r) => r.text());
    const antes = await figurasPorPestana(xml);
    await fluye.abrir(xml);
    for (let i = 1; i < antes.length; i++) await fluye.irADiagrama(i);
    await fluye.irADiagrama(0);
    const despues = await figurasPorPestana(await fluye.guardarXml());
    const ok = antes.join('/') === despues.join('/');
    casos.push(`${ok ? '✓' : '✗'} ${ruta.split('/').pop()}: figuras por pestaña ${antes.join('/')} -> ${despues.join('/')}`);
  }
  const bien = casos.filter((c) => c.startsWith('✓')).length;
  return { resumen: `${bien} de ${casos.length} archivos bien`, casos };
}
