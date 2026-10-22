// Arma el ejemplo "Login a la página web" con el motor de Fluye (mismo trazado y estilo que al modelar a mano).
// Uso (web de prueba abierta): const { crearEjemploLogin } = await import('/pruebas/ejemplo-login.js'); await crearEjemploLogin(window.fluye)
export async function crearEjemploLogin(fluye) {
  await fluye.nuevo('Página web');
  const reg = fluye.get('elementRegistry'), m = fluye.get('modeling'), f = fluye.get('elementFactory'), de = fluye.get('directEditing');
  const listo = () => de.isActive() && de.complete();
  const pool = reg.filter((e) => e.type === 'bpmn:Participant')[0];
  m.renombrar(pool, 'Página web');
  const [usuario, web] = reg.filter((e) => e.type === 'bpmn:Lane').sort((a, b) => a.y - b.y);
  m.renombrar(usuario, 'Usuario');
  m.renombrar(web, 'Web');
  m.resizeShape(usuario, { x: usuario.x, y: usuario.y, width: usuario.width, height: 200 });
  m.resizeShape(web, { x: web.x, y: web.y, width: web.width, height: 360 });
  const doc = (el, t) => m.cambiarPropiedades(el, { documentation: [fluye.moddle.create('bpmn:Documentation', { text: t })] });

  const inicio = reg.filter((e) => e.type === 'bpmn:StartEvent')[0];
  m.moveElements([inicio], { x: 168 - (inicio.x + 18), y: 160 - (inicio.y + 18) }, pool);
  m.renombrar(inicio, 'Quiere ingresar');
  doc(inicio, 'El usuario abre la página y quiere entrar con su cuenta.');

  const n = { inicio };
  const crear = (k, tipo, nombre, cx, cy, texto) => {
    const tam = /Task$/.test(tipo) ? { width: 120, height: 64 } : {};
    n[k] = m.createShape(f.crear(tipo, { nombre, ...tam }), { x: cx, y: cy }, pool);
    listo();
    if (texto) doc(n[k], texto);
  };
  crear('t1', 'bpmn:ServiceTask', 'Mostrar formulario de login', 290, 330, 'La web muestra los campos de usuario y contraseña.');
  crear('t2', 'bpmn:UserTask', 'Ingresar usuario y contraseña', 460, 160, 'El usuario escribe sus datos y presiona Ingresar.');
  crear('t3', 'bpmn:ServiceTask', 'Validar credenciales', 630, 330, 'La web compara los datos con los registrados.');
  crear('g1', 'bpmn:ExclusiveGateway', '¿Credenciales correctas?', 790, 330);
  crear('p1', 'bpmn:ParallelGateway', '', 900, 330);
  crear('t4', 'bpmn:ServiceTask', 'Crear sesión', 1030, 330, 'Se genera la sesión segura del usuario.');
  crear('t5', 'bpmn:ServiceTask', 'Registrar acceso en bitácora', 1030, 450, 'Se guarda fecha, hora e IP del ingreso.');
  crear('p2', 'bpmn:ParallelGateway', '', 1160, 330);
  crear('t6', 'bpmn:UserTask', 'Ver panel principal', 1290, 160, 'El usuario ya está dentro de la página.');
  crear('e1', 'bpmn:EndEvent', 'Sesión iniciada', 1440, 160);
  crear('t7', 'bpmn:ServiceTask', 'Sumar intento fallido', 790, 450, 'Se cuenta el intento incorrecto.');
  crear('g2', 'bpmn:ExclusiveGateway', '¿Superó 3 intentos?', 630, 450);
  crear('t8', 'bpmn:ServiceTask', 'Mostrar mensaje de error', 460, 450, 'Avisa que el usuario o la contraseña no son correctos.');
  crear('t9', 'bpmn:ServiceTask', 'Bloquear cuenta 15 minutos', 630, 560, 'Protege la cuenta ante intentos repetidos.');
  crear('e2', 'bpmn:EndEvent', 'Cuenta bloqueada', 790, 560);

  const unir = (a, b, nombre) => { const c = m.connect(n[a], n[b]); if (nombre) m.renombrar(c, nombre); return c; };
  unir('inicio', 't1'); unir('t1', 't2'); unir('t2', 't3'); unir('t3', 'g1');
  unir('g1', 'p1', 'Sí'); unir('g1', 't7', 'No');
  unir('p1', 't4'); unir('p1', 't5'); unir('t4', 'p2'); unir('t5', 'p2'); unir('p2', 't6'); unir('t6', 'e1');
  unir('t7', 'g2'); unir('g2', 't8', 'No'); unir('t8', 't2'); unir('g2', 't9', 'Sí'); unir('t9', 'e2');

  fluye.get('selection').select(null);
  fluye.get('commandStack').clear();
  fluye.ajustarVista();
  return n;
}
