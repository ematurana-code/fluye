// Prueba de las plantillas de la galería: en cada pestaña de cada plantilla recorre el Play muchas veces eligiendo
// caminos al azar (debe llegar siempre al final, sin problemas) y revisa que guardar y volver a abrir no pierda nada.
// Uso (web de prueba abierta): const { probarPlantillas } = await import('/pruebas/plantillas.js'); await probarPlantillas(window.fluye, window.fluyePlay)
export async function probarPlantillas(fluye, play, { vueltas = 25 } = {}) {
  const Motor = play.motor.constructor;
  const catalogo = await fetch('/plantillas/catalogo.json').then((r) => r.json());
  const casos = [];
  for (const p of catalogo) {
    const xml = await fetch(`/plantillas/${p.id}.bpmn`).then((r) => r.text());
    const { diagramas } = await fluye.abrir(xml);
    const fallas = [];
    const figuras = [];
    for (let i = 0; i < diagramas; i++) {
      await fluye.abrir(xml, { diagrama: i });
      const elementos = fluye.get('elementRegistry').getAll();
      figuras.push(elementos.length);
      const inicios = Motor.inicios(elementos);
      if (inicios.length !== 1) fallas.push(`pestaña ${i + 1}: ${inicios.length} inicios libres`);
      const fines = new Set();
      for (let v = 0; v < vueltas; v++) {
        const motor = new Motor({ maxVisitas: 20 });
        const sucesos = [...motor.iniciar(inicios[0])];
        let pasos = 0;
        while (!motor.terminado && pasos++ < 2000) {
          if (motor.pendiente) {
            const o = motor.pendiente.opciones;
            sucesos.push(...motor.elegir([o[Math.floor(Math.random() * o.length)]]));
          } else sucesos.push(...motor.paso());
        }
        for (const s of sucesos) if (s.tipo === 'fin') fines.add(s.elemento.businessObject.name);
        // Un evento que recibe un mensaje no deja pasar la ficha antes de que el otro pool lo envíe.
        sucesos.forEach((s, k) => {
          if (s.tipo !== 'mover' || !(s.desde.incoming || []).some((c) => c.type === 'bpmn:MessageFlow') || s.desde.type === 'bpmn:StartEvent') return;
          const enviado = sucesos.findIndex((x) => x.tipo === 'mensaje' && x.hasta === s.desde);
          if (enviado < 0 || enviado > k) fallas.push(`pestaña ${i + 1}: "${s.desde.businessObject.name}" siguió sin recibir su mensaje`);
        });
        if (!motor.terminado) fallas.push(`pestaña ${i + 1}: no terminó`);
        for (const q of motor.problemas) fallas.push(`pestaña ${i + 1}: ${q.clase} en "${q.elemento.businessObject.name || q.elemento.type}"`);
      }
      fallas.push(...revisarDibujo(elementos).map((f) => `pestaña ${i + 1}: ${f}`));
      // Con suficientes vueltas al azar se alcanza cada fin de la pestaña.
      const todos = elementos.filter((e) => e.type === 'bpmn:EndEvent').map((e) => e.businessObject.name);
      const nunca = todos.filter((n) => !fines.has(n));
      if (nunca.length) fallas.push(`pestaña ${i + 1}: nunca llegó a ${nunca.join(', ')}`);
    }
    // Guardar y volver a abrir: mismas figuras en cada pestaña.
    await fluye.abrir(xml);
    const guardado = await fluye.guardarXml();
    for (let i = 0; i < diagramas; i++) {
      await fluye.abrir(guardado, { diagrama: i });
      const n = fluye.get('elementRegistry').getAll().length;
      if (n !== figuras[i]) fallas.push(`pestaña ${i + 1}: ${figuras[i]} figuras -> ${n} al guardar`);
    }
    const unicas = [...new Set(fallas)];
    casos.push(`${unicas.length ? '✗' : '✓'} ${p.id} (${diagramas} pestaña${diagramas > 1 ? 's' : ''})${unicas.length ? ': ' + unicas.slice(0, 8).join(' · ') : ''}`);
  }
  const bien = casos.filter((c) => c.startsWith('✓')).length;
  return { resumen: `${bien} de ${casos.length} plantillas bien`, casos };
}

// Dibujo prolijo: ninguna flecha pasa por encima de otra figura y dos flechas no salen ni llegan montadas
// por el mismo punto de una figura (salvo en las compuertas paralelas, donde se juntan a propósito).
function revisarDibujo(elementos) {
  const fallas = [];
  const nombre = (e) => (e.businessObject && e.businessObject.name) || e.type.replace('bpmn:', '');
  const figuras = elementos.filter((e) => !e.waypoints && !e.labelTarget && e.width && !/Participant|Lane/.test(e.type) && e.parent);
  const conexiones = elementos.filter((e) => e.waypoints);
  const cruza = (a, b, f) => {
    const m = 3, x1 = f.x + m, x2 = f.x + f.width - m, y1 = f.y + m, y2 = f.y + f.height - m;
    if (Math.abs(a.x - b.x) < 1) return a.x > x1 && a.x < x2 && Math.max(a.y, b.y) > y1 && Math.min(a.y, b.y) < y2;
    if (Math.abs(a.y - b.y) < 1) return a.y > y1 && a.y < y2 && Math.max(a.x, b.x) > x1 && Math.min(a.x, b.x) < x2;
    return false;
  };
  for (const c of conexiones) {
    for (let k = 1; k < c.waypoints.length; k++) {
      for (const f of figuras) {
        if (f === c.source || f === c.target) continue;
        if (cruza(c.waypoints[k - 1], c.waypoints[k], f)) fallas.push(`la flecha "${nombre(c.source)}" → "${nombre(c.target)}" pasa sobre "${nombre(f)}"`);
      }
    }
  }
  for (const f of figuras) {
    if (f.type === 'bpmn:ParallelGateway') continue;
    const puntas = [
      ...(f.outgoing || []).map((c) => [c.waypoints[0], c.waypoints[1], c]),
      ...(f.incoming || []).map((c) => [c.waypoints[c.waypoints.length - 1], c.waypoints[c.waypoints.length - 2], c])
    ];
    for (let a = 0; a < puntas.length; a++) {
      for (let b = a + 1; b < puntas.length; b++) {
        const [p, p2, c1] = puntas[a], [q, q2, c2] = puntas[b];
        const mismoPunto = Math.hypot(p.x - q.x, p.y - q.y) < 2;
        const mismaDireccion = Math.sign(Math.round(p2.x - p.x)) === Math.sign(Math.round(q2.x - q.x)) && Math.sign(Math.round(p2.y - p.y)) === Math.sign(Math.round(q2.y - q.y));
        if (mismoPunto && mismaDireccion) fallas.push(`en "${nombre(f)}" se montan las flechas hacia "${nombre(c1.target === f ? c1.source : c1.target)}" y "${nombre(c2.target === f ? c2.source : c2.target)}"`);
      }
    }
  }
  return fallas;
}
