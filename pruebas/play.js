// Prueba del motor del Play con procesos armados a propósito (una regla por caso).
// Uso (web de prueba abierta): const { probarPlay } = await import('/pruebas/play.js'); await probarPlay(window.fluye, window.fluyePlay)

async function armar(fluye, receta) {
  await fluye.nuevo('Prueba');
  const reg = fluye.get('elementRegistry'), m = fluye.get('modeling'), f = fluye.get('elementFactory');
  const pool = reg.filter((e) => e.type === 'bpmn:Participant')[0];
  const inicio = reg.filter((e) => e.type === 'bpmn:StartEvent')[0];
  const n = { inicio };
  let x = 300;
  const crear = (clave, tipo, opciones = {}, dy = 0) => {
    n[clave] = m.createShape(f.crear(tipo, { nombre: clave, ...opciones }), { x, y: inicio.y + 18 + dy }, opciones.padre || pool);
    x += 140;
    return n[clave];
  };
  const unir = (a, b, nombre) => { const c = m.connect(n[a], n[b]); if (nombre) m.renombrar(c, nombre); return c; };
  receta({ crear, unir, n, m, f, pool });
  return n;
}

function correr(Motor, inicio, elegir) {
  const motor = new Motor({ maxVisitas: 20 });
  const sucesos = [...motor.iniciar(inicio)];
  let vueltas = 0;
  while (!motor.terminado && vueltas++ < 500) {
    if (motor.pendiente) sucesos.push(...motor.elegir(elegir(motor.pendiente)));
    else sucesos.push(...motor.paso());
  }
  const fines = sucesos.filter((s) => s.tipo === 'fin').map((s) => s.elemento.businessObject.name || 'fin');
  const problemas = motor.problemas.map((p) => `${p.clase}@${p.elemento.businessObject.name}`);
  return { fines, problemas, ok: sucesos.some((s) => s.tipo === 'terminado' && s.ok), uniones: sucesos.filter((s) => s.tipo === 'unir').length };
}

export async function probarPlay(fluye, play) {
  const Motor = play.motor.constructor;
  const porNombre = (nombre) => (p) => p.opciones.filter((c) => (c.businessObject.name || '') === nombre || c.target.businessObject.name === nombre);
  const casos = [];
  const caso = async (nombre, receta, elegir, esperado) => {
    const n = await armar(fluye, receta);
    const r = correr(Motor, n.inicio, elegir || ((p) => [p.opciones[0]]));
    const bien = Object.entries(esperado).every(([k, v]) => JSON.stringify(r[k]) === JSON.stringify(v));
    casos.push({ caso: nombre, bien, resultado: r });
  };

  await caso('Decisión: camino No', ({ crear, unir }) => {
    crear('T1', 'bpmn:Task'); crear('G', 'bpmn:ExclusiveGateway'); crear('Si', 'bpmn:Task', {}, -90); crear('No', 'bpmn:Task', {}, 90);
    crear('FinSi', 'bpmn:EndEvent', {}, -90); crear('FinNo', 'bpmn:EndEvent', {}, 90);
    unir('inicio', 'T1'); unir('T1', 'G'); unir('G', 'Si', 'Sí'); unir('G', 'No', 'No'); unir('Si', 'FinSi'); unir('No', 'FinNo');
  }, porNombre('No'), { fines: ['FinNo'], problemas: [], ok: true });

  await caso('Paralelo que se une', ({ crear, unir }) => {
    crear('Abre', 'bpmn:ParallelGateway'); crear('A', 'bpmn:Task', {}, -90); crear('B', 'bpmn:Task', {}, 90);
    crear('Cierra', 'bpmn:ParallelGateway'); crear('Fin', 'bpmn:EndEvent');
    unir('inicio', 'Abre'); unir('Abre', 'A'); unir('Abre', 'B'); unir('A', 'Cierra'); unir('B', 'Cierra'); unir('Cierra', 'Fin');
  }, null, { fines: ['Fin'], problemas: [], ok: true, uniones: 1 });

  await caso('Atasco: exclusiva cerrada con paralela', ({ crear, unir }) => {
    crear('G', 'bpmn:ExclusiveGateway'); crear('A', 'bpmn:Task', {}, -90); crear('B', 'bpmn:Task', {}, 90);
    crear('Cierra', 'bpmn:ParallelGateway'); crear('Fin', 'bpmn:EndEvent');
    unir('inicio', 'G'); unir('G', 'A'); unir('G', 'B'); unir('A', 'Cierra'); unir('B', 'Cierra'); unir('Cierra', 'Fin');
  }, null, { fines: [], problemas: ['atasco@Cierra'], ok: false });

  await caso('Tarea sin salida', ({ crear, unir }) => {
    crear('Sola', 'bpmn:Task'); unir('inicio', 'Sola');
  }, null, { fines: [], problemas: ['sin-salida@Sola'], ok: false });

  await caso('Ciclo infinito', ({ crear, unir }) => {
    crear('Revisar', 'bpmn:Task'); crear('G', 'bpmn:ExclusiveGateway'); crear('Fin', 'bpmn:EndEvent');
    unir('inicio', 'Revisar'); unir('Revisar', 'G'); unir('G', 'Revisar', 'Corregir'); unir('G', 'Fin', 'Listo');
  }, porNombre('Corregir'), { problemas: ['ciclo@Revisar'], ok: false });

  await caso('Ciclo que termina', ({ crear, unir }) => {
    crear('Revisar', 'bpmn:Task'); crear('G', 'bpmn:ExclusiveGateway'); crear('Fin', 'bpmn:EndEvent');
    unir('inicio', 'Revisar'); unir('Revisar', 'G'); unir('G', 'Revisar', 'Corregir'); unir('G', 'Fin', 'Listo');
  }, (() => { let k = 0; return (p) => p.opciones.filter((c) => c.businessObject.name === (k++ < 2 ? 'Corregir' : 'Listo')); })(), { fines: ['Fin'], problemas: [], ok: true });

  await caso('Inclusiva: 2 de 3 caminos', ({ crear, unir }) => {
    crear('Abre', 'bpmn:InclusiveGateway'); crear('A', 'bpmn:Task', {}, -110); crear('B', 'bpmn:Task'); crear('C', 'bpmn:Task', {}, 110);
    crear('Cierra', 'bpmn:InclusiveGateway'); crear('Fin', 'bpmn:EndEvent');
    unir('inicio', 'Abre'); for (const t of ['A', 'B', 'C']) { unir('Abre', t); unir(t, 'Cierra'); } unir('Cierra', 'Fin');
  }, (p) => p.opciones.slice(0, 2), { fines: ['Fin'], problemas: [], ok: true, uniones: 1 });

  await caso('Fin que termina todo', ({ crear, unir }) => {
    crear('Abre', 'bpmn:ParallelGateway'); crear('A', 'bpmn:Task', {}, -90); crear('B', 'bpmn:Task', {}, 90);
    crear('Corta', 'bpmn:EndEvent', { evento: 'terminacion' }, -90); crear('B2', 'bpmn:Task', {}, 90); crear('FinB', 'bpmn:EndEvent', {}, 90);
    unir('inicio', 'Abre'); unir('Abre', 'A'); unir('Abre', 'B'); unir('A', 'Corta'); unir('B', 'B2'); unir('B2', 'FinB');
  }, null, { fines: ['Corta'], problemas: [], ok: true });

  await caso('Subproceso abierto', ({ crear, unir, n, m, f, pool }) => {
    const sub = m.createShape(f.crear('bpmn:SubProcess', { nombre: 'Sub', collapsed: false }), { x: 450, y: n.inicio.y + 18 }, pool);
    n.Sub = sub;
    n.iSub = m.createShape(f.crear('bpmn:StartEvent', { nombre: 'iSub' }), { x: sub.x + 50, y: sub.y + 100 }, sub);
    n.tSub = m.createShape(f.crear('bpmn:Task', { nombre: 'Adentro' }), { x: sub.x + 160, y: sub.y + 100 }, sub);
    n.fSub = m.createShape(f.crear('bpmn:EndEvent', { nombre: 'fSub' }), { x: sub.x + 280, y: sub.y + 100 }, sub);
    n.Fin = m.createShape(f.crear('bpmn:EndEvent', { nombre: 'Fin' }), { x: sub.x + sub.width + 120, y: n.inicio.y + 18 }, pool);
    unir('inicio', 'Sub'); unir('iSub', 'tSub'); unir('tSub', 'fSub'); unir('Sub', 'Fin');
  }, null, { fines: ['fSub', 'Fin'], problemas: [], ok: true });

  // El fin que termina todo corta su pool (Lenta2 no llega a su fin), pero el otro pool, que arrancó con un mensaje, sigue.
  await caso('Fin que termina todo: el otro pool sigue', ({ crear, unir, n, m, f, pool }) => {
    crear('Abre', 'bpmn:ParallelGateway'); crear('Avisa', 'bpmn:Task', {}, -60); crear('Corta', 'bpmn:EndEvent', { evento: 'terminacion' }, -60);
    crear('Lenta1', 'bpmn:Task', {}, 60); crear('Lenta2', 'bpmn:Task', {}, 60); crear('FinLenta', 'bpmn:EndEvent', {}, 60);
    unir('inicio', 'Abre'); unir('Abre', 'Avisa'); unir('Avisa', 'Corta'); unir('Abre', 'Lenta1'); unir('Lenta1', 'Lenta2'); unir('Lenta2', 'FinLenta');
    const otro = m.createShape(f.crear('bpmn:Participant', { nombre: 'Otro' }), { x: pool.x + pool.width / 2, y: pool.y + pool.height + 220 }, pool.parent);
    const y = otro.y + otro.height / 2;
    [['InicioB', 'bpmn:StartEvent'], ['B1', 'bpmn:Task'], ['B2', 'bpmn:Task'], ['FinB', 'bpmn:EndEvent']].forEach(([clave, tipo], i) => {
      n[clave] = m.createShape(f.crear(tipo, { nombre: clave }), { x: otro.x + 150 + i * 150, y }, otro);
    });
    unir('Avisa', 'InicioB'); unir('InicioB', 'B1'); unir('B1', 'B2'); unir('B2', 'FinB');
  }, null, { fines: ['Corta', 'FinB'], problemas: [], ok: true });

  // Una unión inclusiva espera al camino que todavía está dentro de un subproceso (antes se cerraba sin él).
  await caso('Inclusiva que espera a un subproceso', ({ crear, unir, n, m, f, pool }) => {
    crear('Abre', 'bpmn:InclusiveGateway'); crear('Corto', 'bpmn:Task', {}, -120);
    const sub = m.createShape(f.crear('bpmn:SubProcess', { nombre: 'Sub', collapsed: false }), { x: 700, y: n.inicio.y + 160 }, pool);
    n.Sub = sub;
    n.iSub = m.createShape(f.crear('bpmn:StartEvent', { nombre: 'iSub' }), { x: sub.x + 50, y: sub.y + 100 }, sub);
    n.tSub = m.createShape(f.crear('bpmn:Task', { nombre: 'Adentro' }), { x: sub.x + 160, y: sub.y + 100 }, sub);
    n.fSub = m.createShape(f.crear('bpmn:EndEvent', { nombre: 'fSub' }), { x: sub.x + 280, y: sub.y + 100 }, sub);
    n.Cierra = m.createShape(f.crear('bpmn:InclusiveGateway', { nombre: 'Cierra' }), { x: sub.x + sub.width + 120, y: n.inicio.y + 18 }, pool);
    n.Fin = m.createShape(f.crear('bpmn:EndEvent', { nombre: 'Fin' }), { x: n.Cierra.x + 160, y: n.inicio.y + 18 }, pool);
    unir('inicio', 'Abre'); unir('Abre', 'Corto'); unir('Abre', 'Sub'); unir('Corto', 'Cierra'); unir('Sub', 'Cierra');
    unir('iSub', 'tSub'); unir('tSub', 'fSub'); unir('Cierra', 'Fin');
  }, (p) => p.opciones, { fines: ['fSub', 'Fin'], problemas: [], ok: true, uniones: 1 });

  return { resumen: `${casos.filter((c) => c.bien).length} de ${casos.length} casos bien`, casos: casos.map((c) => `${c.bien ? '✓' : '✗'} ${c.caso}: fines=${c.resultado.fines.join(',')} problemas=${c.resultado.problemas.join(',') || '-'} ok=${c.resultado.ok}`) };
}
