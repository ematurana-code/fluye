// Plantillas de Fluye: procesos prearmados para partir de una base (Nuevo → Desde plantilla).
// Cada plantilla se describe aquí (pools, carriles, pasos en una grilla y flechas) y `scripts/crear-plantillas.mjs`
// la convierte en .bpmn con la propia app: Fluye traza las flechas y guarda, igual que al modelar a mano.
//
// Niveles: simple = un pool, pocos pasos y una decisión · intermedia = un pool con varios carriles, decisiones,
// vueltas atrás y paralelos · avanzada = varios pools que se mandan mensajes, plazos y subprocesos en otra pestaña.

// Nodo: [clave, tipo, nombre, carril, columna, fila dentro del carril, descripción]
const n = (clave, tipo, nombre, carril, col, fila = 0, doc = '') => ({ clave, tipo, nombre, carril, col, fila, doc });

export const PLANTILLAS = [
  // ---------------------------------------------------------------- Comercio exterior
  // Procesos de importación como se hacen en cualquier país: nada de siglas ni organismos de uno en particular.
  {
    id: 'aduana-simple', categoria: 'Comercio exterior', nivel: 'simple',
    nombre: 'Revisión de documentos de embarque',
    descripcion: 'Antes de declarar una importación, se revisa que el proveedor envió todos los documentos y se pide lo que falta.',
    diagramas: [{
      nombre: 'Revisión de documentos',
      pools: [{ id: 'empresa', nombre: 'Empresa importadora', carriles: [{ id: 'ejec', nombre: 'Comercio exterior' }] }],
      nodos: [
        n('ini', 'inicio', 'Llegan los documentos del proveedor', 'ejec', 0),
        n('rev', 'usuario', 'Revisar factura, documento de transporte y certificado de origen', 'ejec', 1, 0, 'Se revisa que la factura comercial, el documento de transporte y el certificado de origen estén y coincidan entre sí.'),
        n('dec', 'decision', '¿Están completos y correctos?', 'ejec', 2),
        n('abr', 'usuario', 'Armar la carpeta de la importación', 'ejec', 3, 0, 'Se arma la carpeta de la importación con los documentos revisados.'),
        n('fin', 'fin', 'Listo para declarar', 'ejec', 4),
        n('ped', 'usuario', 'Pedir correcciones al proveedor', 'ejec', 2, 1, 'Se envía al proveedor la lista de lo que falta o hay que corregir.')
      ],
      flujos: [['ini', 'rev'], ['rev', 'dec'], ['dec', 'abr', 'Sí'], ['abr', 'fin'], ['dec', 'ped', 'No'], ['ped', 'rev']]
    }]
  },
  {
    id: 'aduana-intermedia', categoria: 'Comercio exterior', nivel: 'intermedia',
    nombre: 'Despacho de importación',
    descripcion: 'Una importación de principio a fin: documentos, declaración, revisión de la aduana, pago de impuestos y retiro de la carga.',
    diagramas: [{
      nombre: 'Despacho de importación',
      pools: [{
        id: 'empresa', nombre: 'Empresa importadora',
        carriles: [{ id: 'ejec', nombre: 'Comercio exterior' }, { id: 'docu', nombre: 'Documentación' }, { id: 'finz', nombre: 'Finanzas' }, { id: 'oper', nombre: 'Logística' }]
      }],
      nodos: [
        n('ini', 'inicio', 'El proveedor avisa que viene un embarque', 'ejec', 0),
        n('rev', 'usuario', 'Revisar los documentos del embarque', 'docu', 1),
        n('dc1', 'decision', '¿Documentos completos?', 'docu', 2),
        n('fal', 'usuario', 'Pedir los documentos que faltan', 'ejec', 2),
        n('din', 'usuario', 'Preparar la declaración de importación', 'docu', 3, 0, 'Se completa la declaración aduanera con los datos de la factura y del transporte.'),
        n('env', 'servicio', 'Presentar la declaración a la aduana', 'docu', 4),
        n('can', 'decision', '¿Qué revisión asignó la aduana?', 'docu', 5),
        n('afo', 'manual', 'Presentar la carga a la revisión física', 'oper', 6, 0, 'Si la aduana pide revisión física, un inspector revisa la mercadería en el depósito.'),
        n('uni', 'decision', '', 'docu', 7),
        n('par', 'paralelo', '', 'docu', 8),
        n('pag', 'usuario', 'Pagar aranceles e impuestos', 'finz', 9),
        n('tra', 'usuario', 'Coordinar el retiro y el transporte', 'oper', 9),
        n('jun', 'paralelo', '', 'oper', 10),
        n('ret', 'manual', 'Retirar la carga del depósito', 'oper', 11),
        n('ent', 'usuario', 'Recibir en bodega y cerrar la carpeta', 'ejec', 12),
        n('fin', 'fin', 'Importación terminada', 'ejec', 13)
      ],
      flujos: [
        ['ini', 'rev'], ['rev', 'dc1'], ['dc1', 'din', 'Sí'], ['dc1', 'fal', 'No'], ['fal', 'rev'], ['din', 'env'], ['env', 'can'],
        ['can', 'afo', 'Física'], ['can', 'uni', 'Documental'], ['afo', 'uni'], ['uni', 'par'], ['par', 'pag'], ['par', 'tra'],
        ['pag', 'jun'], ['tra', 'jun'], ['jun', 'ret'], ['ret', 'ent'], ['ent', 'fin']
      ]
    }]
  },
  {
    id: 'aduana-avanzada', categoria: 'Comercio exterior', nivel: 'avanzada',
    nombre: 'Importación completa: cliente, agente y aduana',
    descripcion: 'El importador, su agente de aduana y la autoridad aduanera intercambian documentos y avisos; la revisión física va en su propia pestaña.',
    diagramas: [{
      nombre: 'Importación',
      pools: [
        { id: 'importador', nombre: 'Importador (cliente)', carriles: [{ id: 'cli', nombre: 'Importador' }] },
        { id: 'agencia', nombre: 'Agente de aduana', carriles: [{ id: 'ejec', nombre: 'Ejecutivo de cuenta' }, { id: 'docu', nombre: 'Documentación' }, { id: 'oper', nombre: 'Operaciones' }] },
        { id: 'aduana', nombre: 'Autoridad aduanera', carriles: [{ id: 'sna', nombre: 'Aduana' }] }
      ],
      nodos: [
        n('c_ini', 'inicio', 'Compra mercadería en el extranjero', 'cli', 0),
        n('c_env', 'usuario', 'Enviar los documentos al agente', 'cli', 1),
        n('c_esp', 'espera', 'Esperar la llegada del embarque', 'cli', 2),
        n('c_avi', 'recibir', 'Recibe el aviso de carga lista', 'cli', 11),
        n('c_rec', 'manual', 'Recibir la mercadería en bodega', 'cli', 12),
        n('c_fin', 'fin', 'Mercadería en bodega', 'cli', 13),

        n('a_ini', 'inicioMensaje', 'Llegan los documentos', 'ejec', 1),
        n('a_rev', 'usuario', 'Revisar los documentos', 'ejec', 2),
        n('a_din', 'usuario', 'Preparar y presentar la declaración', 'docu', 3),
        n('a_can', 'recibir', 'Llega el tipo de revisión', 'docu', 4),
        n('a_dec', 'decision', '¿Qué revisión?', 'docu', 5),
        n('a_afo', 'subproceso', 'Revisión física', 'oper', 6, 0, 'El detalle está en la pestaña "Revisión física".'),
        n('a_uni', 'decision', '', 'docu', 7),
        n('a_pag', 'usuario', 'Pagar aranceles e impuestos', 'docu', 8),
        n('a_aut', 'recibir', 'Llega la autorización de retiro', 'docu', 9),
        n('a_ret', 'manual', 'Retirar la carga del depósito', 'oper', 10),
        n('a_avi', 'enviar', 'Avisar al cliente', 'ejec', 11),
        n('a_fin', 'fin', 'Despacho terminado', 'ejec', 12),

        n('s_ini', 'inicioMensaje', 'Recibe la declaración', 'sna', 3),
        n('s_val', 'servicio', 'Validar la declaración y asignar revisión', 'sna', 4),
        n('s_pag', 'recibir', 'Recibe el pago', 'sna', 8),
        n('s_aut', 'servicio', 'Autorizar el retiro', 'sna', 9),
        n('s_fin', 'fin', 'Trámite cerrado', 'sna', 10)
      ],
      flujos: [
        ['c_ini', 'c_env'], ['c_env', 'c_esp'], ['c_esp', 'c_avi'], ['c_avi', 'c_rec'], ['c_rec', 'c_fin'],
        ['a_ini', 'a_rev'], ['a_rev', 'a_din'], ['a_din', 'a_can'], ['a_can', 'a_dec'], ['a_dec', 'a_afo', 'Física'], ['a_dec', 'a_uni', 'Documental'],
        ['a_afo', 'a_uni'], ['a_uni', 'a_pag'], ['a_pag', 'a_aut'], ['a_aut', 'a_ret'], ['a_ret', 'a_avi'], ['a_avi', 'a_fin'],
        ['s_ini', 's_val'], ['s_val', 's_pag'], ['s_pag', 's_aut'], ['s_aut', 's_fin']
      ],
      mensajes: [
        ['c_env', 'a_ini', 'Documentos'], ['a_din', 's_ini', 'Declaración'], ['s_val', 'a_can', 'Revisión'],
        ['a_pag', 's_pag', 'Pago'], ['s_aut', 'a_aut', 'Autorización'], ['a_avi', 'c_avi', 'Aviso']
      ]
    }, {
      nombre: 'Revisión física',
      pools: [{ id: 'aforo', nombre: 'Revisión física', carriles: [{ id: 'f_ope', nombre: 'Operaciones (agente)' }, { id: 'f_fis', nombre: 'Inspector de aduana' }] }],
      nodos: [
        n('f_ini', 'inicio', 'La aduana pide revisión física', 'f_ope', 0),
        n('f_coo', 'usuario', 'Coordinar hora y lugar con el depósito', 'f_ope', 1),
        n('f_rev', 'manual', 'Revisar la mercadería', 'f_fis', 2),
        n('f_dec', 'decision', '¿Coincide con la declaración?', 'f_fis', 3),
        n('f_ok', 'fin', 'Revisión conforme', 'f_fis', 4),
        n('f_acl', 'usuario', 'Presentar una aclaración', 'f_ope', 4),
        n('f_apr', 'usuario', 'Revisar y aprobar la aclaración', 'f_fis', 5),
        n('f_obs', 'fin', 'Revisión con observación', 'f_fis', 6)
      ],
      flujos: [['f_ini', 'f_coo'], ['f_coo', 'f_rev'], ['f_rev', 'f_dec'], ['f_dec', 'f_ok', 'Sí'], ['f_dec', 'f_acl', 'No'], ['f_acl', 'f_apr'], ['f_apr', 'f_obs']]
    }]
  },

  // ---------------------------------------------------------------- Soporte TI
  {
    id: 'ti-simple', categoria: 'Soporte TI', nivel: 'simple',
    nombre: 'Restablecer contraseña',
    descripcion: 'La mesa de ayuda confirma quién pide el cambio y entrega una clave temporal.',
    diagramas: [{
      nombre: 'Restablecer contraseña',
      pools: [{ id: 'soporte', nombre: 'Soporte TI', carriles: [{ id: 'usu', nombre: 'Usuario' }, { id: 'mesa', nombre: 'Mesa de ayuda' }] }],
      nodos: [
        n('ini', 'inicio', 'Olvidó su contraseña', 'usu', 0),
        n('pid', 'usuario', 'Pedir el cambio de clave', 'usu', 1),
        n('ver', 'usuario', 'Verificar la identidad del usuario', 'mesa', 2, 0, 'Se confirma con datos que solo la persona conoce o con su jefatura.'),
        n('dec', 'decision', '¿Identidad confirmada?', 'mesa', 3),
        n('gen', 'servicio', 'Generar una clave temporal', 'mesa', 4),
        n('cam', 'usuario', 'Entrar y cambiar la clave', 'usu', 5),
        n('fin', 'fin', 'Acceso recuperado', 'usu', 6),
        n('exp', 'usuario', 'Explicar por qué no se puede', 'mesa', 4, 1),
        n('rec', 'fin', 'Solicitud rechazada', 'mesa', 5, 1)
      ],
      flujos: [['ini', 'pid'], ['pid', 'ver'], ['ver', 'dec'], ['dec', 'gen', 'Sí'], ['gen', 'cam'], ['cam', 'fin'], ['dec', 'exp', 'No'], ['exp', 'rec']]
    }]
  },
  {
    id: 'ti-intermedia', categoria: 'Soporte TI', nivel: 'intermedia',
    nombre: 'Ticket de mesa de ayuda',
    descripcion: 'Del reporte al cierre: nivel 1, escalamiento a nivel 2 y confirmación del usuario antes de cerrar.',
    diagramas: [{
      nombre: 'Ticket de mesa de ayuda',
      pools: [{ id: 'soporte', nombre: 'Soporte TI', carriles: [{ id: 'usu', nombre: 'Usuario' }, { id: 'n1', nombre: 'Mesa de ayuda (nivel 1)' }, { id: 'n2', nombre: 'Especialista (nivel 2)' }] }],
      nodos: [
        n('ini', 'inicio', 'Tiene un problema', 'usu', 0),
        n('cre', 'usuario', 'Crear el ticket', 'usu', 1),
        n('cla', 'usuario', 'Clasificar y asignar prioridad', 'n1', 2),
        n('int', 'usuario', 'Intentar la solución', 'n1', 3),
        n('re1', 'decision', '¿Se resolvió?', 'n1', 4),
        n('dia', 'usuario', 'Diagnosticar y resolver', 'n2', 5),
        n('uni', 'decision', '', 'n1', 6),
        n('par', 'paralelo', '', 'n1', 7),
        n('avi', 'usuario', 'Avisar al usuario', 'n1', 8),
        n('doc', 'usuario', 'Documentar la solución', 'n2', 8, 0, 'Queda en la base de conocimiento para resolver más rápido la próxima vez.'),
        n('jun', 'paralelo', '', 'n1', 9),
        n('pro', 'usuario', 'Probar la solución', 'usu', 10),
        n('fun', 'decision', '¿El usuario confirma que funciona?', 'n1', 11),
        n('rea', 'usuario', 'Reabrir el ticket', 'n1', 11, 1),
        n('cer', 'usuario', 'Cerrar el ticket', 'n1', 12),
        n('fin', 'fin', 'Ticket cerrado', 'n1', 13)
      ],
      flujos: [
        ['ini', 'cre'], ['cre', 'cla'], ['cla', 'int'], ['int', 're1'], ['re1', 'uni', 'Sí'], ['re1', 'dia', 'No'], ['dia', 'uni'],
        ['uni', 'par'], ['par', 'avi'], ['par', 'doc'], ['avi', 'jun'], ['doc', 'jun'], ['jun', 'pro'], ['pro', 'fun'],
        ['fun', 'cer', 'Sí'], ['fun', 'rea', 'No'], ['rea', 'int'], ['cer', 'fin']
      ]
    }]
  },
  {
    id: 'ti-avanzada', categoria: 'Soporte TI', nivel: 'avanzada',
    nombre: 'Incidente con proveedor externo',
    descripcion: 'El área usuaria, TI y el proveedor se coordinan con avisos y un plazo de respuesta (SLA); el diagnóstico va en su propia pestaña.',
    diagramas: [{
      nombre: 'Incidente',
      pools: [
        { id: 'area', nombre: 'Área usuaria', carriles: [{ id: 'usu', nombre: 'Usuario' }] },
        { id: 'ti', nombre: 'TI de la agencia', carriles: [{ id: 'mesa', nombre: 'Mesa de ayuda' }, { id: 'infra', nombre: 'Infraestructura' }] },
        { id: 'proveedor', nombre: 'Proveedor', carriles: [{ id: 'prov', nombre: 'Soporte del proveedor' }] }
      ],
      nodos: [
        n('u_ini', 'inicio', 'Se cae un servicio', 'usu', 0),
        n('u_rep', 'usuario', 'Reportar el incidente', 'usu', 1),
        n('u_avi', 'recibir', 'Recibe el aviso de servicio restablecido', 'usu', 11),
        n('u_con', 'usuario', 'Confirmar que todo funciona', 'usu', 12),
        n('u_fin', 'fin', 'Trabajo normal', 'usu', 13),

        n('t_ini', 'inicioMensaje', 'Llega el reporte', 'mesa', 1),
        n('t_reg', 'usuario', 'Registrar incidente crítico', 'mesa', 2),
        n('t_dia', 'subproceso', 'Diagnóstico', 'infra', 3, 0, 'El detalle está en la pestaña "Diagnóstico".'),
        n('t_dec', 'decision', '¿Falla del proveedor?', 'infra', 4),
        n('t_cas', 'usuario', 'Abrir un caso con el proveedor', 'infra', 5),
        n('t_int', 'usuario', 'Corregir internamente', 'infra', 6, 1),
        n('t_esp', 'espera', 'Esperar respuesta (SLA 4 horas)', 'infra', 6),
        n('t_tie', 'decision', '¿Respondió a tiempo?', 'infra', 7),
        n('t_esc', 'usuario', 'Escalar con el ejecutivo del proveedor', 'mesa', 7),
        n('t_sol', 'recibir', 'Llega la solución del proveedor', 'infra', 8),
        n('t_uni', 'decision', '', 'infra', 9),
        n('t_ver', 'usuario', 'Verificar el servicio', 'infra', 10),
        n('t_avi', 'enviar', 'Avisar al usuario', 'mesa', 11),
        n('t_fin', 'fin', 'Incidente cerrado', 'mesa', 12),

        n('p_ini', 'inicioMensaje', 'Recibe el caso', 'prov', 5),
        n('p_ana', 'usuario', 'Analizar y aplicar la solución', 'prov', 6),
        n('p_env', 'usuario', 'Enviar la solución', 'prov', 8),
        n('p_fin', 'fin', 'Caso resuelto', 'prov', 9)
      ],
      flujos: [
        ['u_ini', 'u_rep'], ['u_rep', 'u_avi'], ['u_avi', 'u_con'], ['u_con', 'u_fin'],
        ['t_ini', 't_reg'], ['t_reg', 't_dia'], ['t_dia', 't_dec'], ['t_dec', 't_cas', 'Sí'], ['t_dec', 't_int', 'No'],
        ['t_cas', 't_esp'], ['t_esp', 't_tie'], ['t_tie', 't_sol', 'Sí'], ['t_tie', 't_esc', 'No'], ['t_esc', 't_esp'],
        ['t_sol', 't_uni'], ['t_int', 't_uni'], ['t_uni', 't_ver'], ['t_ver', 't_avi'], ['t_avi', 't_fin'],
        ['p_ini', 'p_ana'], ['p_ana', 'p_env'], ['p_env', 'p_fin']
      ],
      mensajes: [['u_rep', 't_ini', 'Reporte'], ['t_cas', 'p_ini', 'Caso'], ['p_env', 't_sol', 'Solución'], ['t_avi', 'u_avi', 'Aviso']]
    }, {
      nombre: 'Diagnóstico',
      pools: [{ id: 'diagnostico', nombre: 'Diagnóstico', carriles: [{ id: 'd_inf', nombre: 'Infraestructura' }] }],
      nodos: [
        n('d_ini', 'inicio', 'Comienza el diagnóstico', 'd_inf', 0),
        n('d_par', 'paralelo', '', 'd_inf', 1),
        n('d_mon', 'servicio', 'Revisar el monitoreo', 'd_inf', 2),
        n('d_reg', 'usuario', 'Revisar registros y cambios recientes', 'd_inf', 2, 1),
        n('d_jun', 'paralelo', '', 'd_inf', 3),
        n('d_cau', 'usuario', 'Identificar la causa', 'd_inf', 4),
        n('d_fin', 'fin', 'Causa identificada', 'd_inf', 5)
      ],
      flujos: [['d_ini', 'd_par'], ['d_par', 'd_mon'], ['d_par', 'd_reg'], ['d_mon', 'd_jun'], ['d_reg', 'd_jun'], ['d_jun', 'd_cau'], ['d_cau', 'd_fin']]
    }]
  },

  // ---------------------------------------------------------------- Recursos Humanos
  {
    id: 'rrhh-simple', categoria: 'Recursos Humanos', nivel: 'simple',
    nombre: 'Solicitud de vacaciones',
    descripcion: 'El colaborador pide sus días y la jefatura aprueba o le propone otras fechas.',
    diagramas: [{
      nombre: 'Solicitud de vacaciones',
      pools: [{ id: 'agencia', nombre: 'Agencia', carriles: [{ id: 'col', nombre: 'Colaborador' }, { id: 'jef', nombre: 'Jefatura' }] }],
      nodos: [
        n('ini', 'inicio', 'Quiere tomar vacaciones', 'col', 0),
        n('sol', 'usuario', 'Solicitar los días', 'col', 1, 0, 'Indica fechas de inicio y término.'),
        n('rev', 'usuario', 'Revisar la solicitud', 'jef', 2),
        n('apr', 'decision', '¿Aprueba?', 'jef', 3),
        n('reg', 'servicio', 'Registrar las vacaciones', 'jef', 4),
        n('fin', 'fin', 'Vacaciones aprobadas', 'col', 5),
        n('otr', 'usuario', 'Proponer otras fechas', 'col', 3, 1)
      ],
      flujos: [['ini', 'sol'], ['sol', 'rev'], ['rev', 'apr'], ['apr', 'reg', 'Sí'], ['reg', 'fin'], ['apr', 'otr', 'No'], ['otr', 'sol']]
    }]
  },
  {
    id: 'rrhh-intermedia', categoria: 'Recursos Humanos', nivel: 'intermedia',
    nombre: 'Ingreso de personal nuevo',
    descripcion: 'Contrato, afiliaciones, equipo y plan de inducción en paralelo, y revisión de que tenga todo para trabajar.',
    diagramas: [{
      nombre: 'Ingreso de personal',
      pools: [{ id: 'agencia', nombre: 'Agencia', carriles: [{ id: 'rh', nombre: 'Recursos Humanos' }, { id: 'jef', nombre: 'Jefatura' }, { id: 'ti', nombre: 'Soporte TI' }] }],
      nodos: [
        n('ini', 'inicio', 'Se contrata a una persona', 'rh', 0),
        n('con', 'usuario', 'Firmar contrato y recibir documentos', 'rh', 1),
        n('par', 'paralelo', '', 'rh', 2),
        n('afi', 'usuario', 'Afiliar a AFP, salud y seguro', 'rh', 3),
        n('pla', 'usuario', 'Preparar el plan de inducción', 'jef', 3),
        n('equ', 'usuario', 'Preparar computador y cuentas', 'ti', 3),
        n('jun', 'paralelo', '', 'rh', 4),
        n('ind', 'usuario', 'Recibir y hacer la inducción', 'jef', 5),
        n('uni', 'decision', '', 'jef', 6),
        n('tod', 'decision', '¿Tiene todo para trabajar?', 'jef', 7),
        n('com', 'usuario', 'Completar lo que falta', 'ti', 7),
        n('cer', 'usuario', 'Cerrar el ingreso', 'rh', 9),
        n('fin', 'fin', 'Persona incorporada', 'rh', 10)
      ],
      flujos: [
        ['ini', 'con'], ['con', 'par'], ['par', 'afi'], ['par', 'pla'], ['par', 'equ'], ['afi', 'jun'], ['pla', 'jun'], ['equ', 'jun'],
        ['jun', 'ind'], ['ind', 'uni'], ['uni', 'tod'], ['tod', 'cer', 'Sí'], ['tod', 'com', 'No'], ['com', 'uni'], ['cer', 'fin']
      ]
    }]
  },
  {
    id: 'rrhh-avanzada', categoria: 'Recursos Humanos', nivel: 'avanzada',
    nombre: 'Selección de personal',
    descripcion: 'La agencia, una consultora y el postulante se mandan pedidos, ternas y ofertas; las entrevistas van en su propia pestaña.',
    diagramas: [{
      nombre: 'Selección',
      pools: [
        { id: 'agencia', nombre: 'Agencia', carriles: [{ id: 'rh', nombre: 'Recursos Humanos' }, { id: 'jef', nombre: 'Jefatura' }] },
        { id: 'consultora', nombre: 'Consultora de selección', carriles: [{ id: 'con', nombre: 'Consultora' }] },
        { id: 'postulante', nombre: 'Postulante', carriles: [{ id: 'pos', nombre: 'Postulante elegido' }] }
      ],
      nodos: [
        n('a_ini', 'inicio', 'Se necesita cubrir un cargo', 'jef', 0),
        n('a_per', 'usuario', 'Definir el perfil del cargo', 'jef', 1),
        n('a_ped', 'usuario', 'Pedir candidatos a la consultora', 'rh', 2),
        n('a_ter', 'recibir', 'Llega la terna de candidatos', 'rh', 4),
        n('a_ent', 'subproceso', 'Entrevistas', 'jef', 5, 0, 'El detalle está en la pestaña "Entrevistas".'),
        n('a_ele', 'decision', '¿Hay candidato elegido?', 'jef', 6),
        n('a_aju', 'usuario', 'Revisar qué faltó en los candidatos', 'jef', 6, 1),
        n('a_ofe', 'usuario', 'Enviar la oferta', 'rh', 7),
        n('a_esp', 'espera', 'Esperar la respuesta (3 días)', 'rh', 8),
        n('a_res', 'recibir', 'Llega la respuesta', 'rh', 9),
        n('a_ace', 'decision', '¿Aceptó?', 'rh', 10),
        n('a_ing', 'usuario', 'Iniciar el ingreso', 'rh', 11),
        n('a_fin', 'fin', 'Cargo cubierto', 'rh', 12),
        n('a_sin', 'fin', 'Cargo sin cubrir', 'rh', 11, 1),

        n('c_ini', 'inicioMensaje', 'Recibe el pedido', 'con', 2),
        n('c_bus', 'usuario', 'Buscar y evaluar candidatos', 'con', 3),
        n('c_env', 'usuario', 'Enviar la terna', 'con', 4),
        n('c_fin', 'fin', 'Terna enviada', 'con', 5),

        n('p_ini', 'inicioMensaje', 'Recibe la oferta', 'pos', 7),
        n('p_rev', 'usuario', 'Revisar la oferta', 'pos', 8),
        n('p_res', 'usuario', 'Responder a la agencia', 'pos', 9),
        n('p_fin', 'fin', 'Respuesta enviada', 'pos', 10)
      ],
      flujos: [
        ['a_ini', 'a_per'], ['a_per', 'a_ped'], ['a_ped', 'a_ter'], ['a_ter', 'a_ent'], ['a_ent', 'a_ele'], ['a_ele', 'a_ofe', 'Sí'],
        ['a_ele', 'a_aju', 'No'], ['a_aju', 'a_per'], ['a_ofe', 'a_esp'], ['a_esp', 'a_res'], ['a_res', 'a_ace'],
        ['a_ace', 'a_ing', 'Sí'], ['a_ace', 'a_sin', 'No'], ['a_ing', 'a_fin'],
        ['c_ini', 'c_bus'], ['c_bus', 'c_env'], ['c_env', 'c_fin'],
        ['p_ini', 'p_rev'], ['p_rev', 'p_res'], ['p_res', 'p_fin']
      ],
      mensajes: [['a_ped', 'c_ini', 'Pedido'], ['c_env', 'a_ter', 'Terna'], ['a_ofe', 'p_ini', 'Oferta'], ['p_res', 'a_res', 'Respuesta']]
    }, {
      nombre: 'Entrevistas',
      pools: [{ id: 'entrevistas', nombre: 'Entrevistas', carriles: [{ id: 'e_rh', nombre: 'Recursos Humanos' }, { id: 'e_jef', nombre: 'Jefatura' }] }],
      nodos: [
        n('e_ini', 'inicio', 'Llega la terna', 'e_rh', 0),
        n('e_age', 'usuario', 'Agendar entrevistas', 'e_rh', 1),
        n('e_par', 'paralelo', '', 'e_rh', 2),
        n('e_psi', 'usuario', 'Evaluación psicolaboral', 'e_rh', 3),
        n('e_tec', 'usuario', 'Entrevista técnica', 'e_jef', 3),
        n('e_jun', 'paralelo', '', 'e_rh', 4),
        n('e_com', 'usuario', 'Comparar candidatos y elegir', 'e_jef', 5),
        n('e_fin', 'fin', 'Candidato elegido', 'e_jef', 6)
      ],
      flujos: [['e_ini', 'e_age'], ['e_age', 'e_par'], ['e_par', 'e_psi'], ['e_par', 'e_tec'], ['e_psi', 'e_jun'], ['e_tec', 'e_jun'], ['e_jun', 'e_com'], ['e_com', 'e_fin']]
    }]
  },

  // ---------------------------------------------------------------- Compras
  {
    id: 'compras-simple', categoria: 'Compras', nivel: 'simple',
    nombre: 'Solicitud de compra',
    descripcion: 'Alguien pide comprar algo y su jefatura aprueba o le pide ajustar la solicitud.',
    diagramas: [{
      nombre: 'Solicitud de compra',
      pools: [{ id: 'empresa', nombre: 'Empresa', carriles: [{ id: 'sol', nombre: 'Solicitante' }, { id: 'jef', nombre: 'Jefatura' }] }],
      nodos: [
        n('ini', 'inicio', 'Necesita comprar algo', 'sol', 0),
        n('com', 'usuario', 'Completar la solicitud de compra', 'sol', 1, 0, 'Qué se necesita, cuánto y para cuándo.'),
        n('rev', 'usuario', 'Revisar la solicitud', 'jef', 2),
        n('apr', 'decision', '¿Se aprueba?', 'jef', 3),
        n('env', 'servicio', 'Enviar a compras', 'jef', 4),
        n('fin', 'fin', 'Solicitud aprobada', 'jef', 5),
        n('aju', 'usuario', 'Ajustar la solicitud', 'sol', 3, 1)
      ],
      flujos: [['ini', 'com'], ['com', 'rev'], ['rev', 'apr'], ['apr', 'env', 'Sí'], ['env', 'fin'], ['apr', 'aju', 'No'], ['aju', 'com']]
    }]
  },
  {
    id: 'compras-intermedia', categoria: 'Compras', nivel: 'intermedia',
    nombre: 'Compra con cotizaciones',
    descripcion: 'Tres cotizaciones, autorización si supera el monto límite, orden de compra y recepción conforme.',
    diagramas: [{
      nombre: 'Compra con cotizaciones',
      pools: [{
        id: 'empresa', nombre: 'Empresa',
        carriles: [{ id: 'sol', nombre: 'Solicitante' }, { id: 'cmp', nombre: 'Compras' }, { id: 'jef', nombre: 'Jefatura' }, { id: 'bod', nombre: 'Bodega' }]
      }],
      nodos: [
        n('ini', 'inicio', 'Solicitud aprobada', 'sol', 0),
        n('cot', 'usuario', 'Pedir tres cotizaciones', 'cmp', 1),
        n('cmpa', 'usuario', 'Comparar las cotizaciones', 'cmp', 2, 0, 'Precio, plazo de entrega y condiciones de pago.'),
        n('lim', 'decision', '¿Supera el monto límite?', 'cmp', 3),
        n('aut', 'usuario', 'Autorizar la compra', 'jef', 4),
        n('uni', 'decision', '', 'cmp', 5),
        n('oc', 'usuario', 'Emitir la orden de compra', 'cmp', 6),
        n('par', 'paralelo', '', 'cmp', 7),
        n('fac', 'usuario', 'Registrar la factura', 'cmp', 8),
        n('rec', 'manual', 'Recibir y revisar la mercadería', 'bod', 8),
        n('con', 'decision', '¿Llegó conforme?', 'bod', 9),
        n('rcl', 'usuario', 'Reclamar al proveedor', 'bod', 9, 1),
        n('jun', 'paralelo', '', 'cmp', 10),
        n('cer', 'usuario', 'Cerrar la orden de compra', 'cmp', 11),
        n('fin', 'fin', 'Compra cerrada', 'sol', 12)
      ],
      flujos: [
        ['ini', 'cot'], ['cot', 'cmpa'], ['cmpa', 'lim'], ['lim', 'uni', 'No'], ['lim', 'aut', 'Sí'], ['aut', 'uni'], ['uni', 'oc'],
        ['oc', 'par'], ['par', 'fac'], ['par', 'rec'], ['fac', 'jun'], ['rec', 'con'], ['con', 'jun', 'Sí'], ['con', 'rcl', 'No'],
        ['rcl', 'rec'], ['jun', 'cer'], ['cer', 'fin']
      ]
    }]
  },
  {
    id: 'compras-avanzada', categoria: 'Compras', nivel: 'avanzada',
    nombre: 'Compra a proveedor externo',
    descripcion: 'La empresa y el proveedor se mandan la orden, la mercadería, la factura y el pago; la licitación va en su propia pestaña.',
    diagramas: [{
      nombre: 'Compra',
      pools: [
        { id: 'empresa', nombre: 'Empresa', carriles: [{ id: 'cmp', nombre: 'Compras' }, { id: 'bod', nombre: 'Bodega' }, { id: 'fnz', nombre: 'Finanzas' }] },
        { id: 'proveedor', nombre: 'Proveedor', carriles: [{ id: 'prv', nombre: 'Proveedor' }] }
      ],
      nodos: [
        n('e_ini', 'inicio', 'Compra aprobada', 'cmp', 0),
        n('e_lic', 'subproceso', 'Licitación', 'cmp', 1, 0, 'El detalle está en la pestaña "Licitación".'),
        n('e_oc', 'usuario', 'Enviar la orden de compra', 'cmp', 2),
        n('e_esp', 'espera', 'Esperar el despacho (plazo pactado)', 'cmp', 3),
        n('e_lle', 'recibir', 'Llega la mercadería y la guía', 'bod', 5),
        n('e_rev', 'manual', 'Revisar la mercadería', 'bod', 6),
        n('e_con', 'decision', '¿Llegó conforme?', 'bod', 7),
        n('e_dif', 'usuario', 'Registrar la diferencia', 'cmp', 7),
        n('e_uni', 'decision', '', 'bod', 8),
        n('e_fac', 'recibir', 'Llega la factura', 'fnz', 9),
        n('e_pag', 'usuario', 'Pagar la factura', 'fnz', 10),
        n('e_fin', 'fin', 'Compra pagada', 'fnz', 11),

        n('p_ini', 'inicioMensaje', 'Recibe la orden de compra', 'prv', 2),
        n('p_pre', 'usuario', 'Preparar el pedido', 'prv', 3),
        n('p_des', 'usuario', 'Despachar con guía', 'prv', 5),
        n('p_fac', 'usuario', 'Emitir la factura', 'prv', 9),
        n('p_cob', 'recibir', 'Recibe el pago', 'prv', 10),
        n('p_fin', 'fin', 'Venta cobrada', 'prv', 11)
      ],
      flujos: [
        ['e_ini', 'e_lic'], ['e_lic', 'e_oc'], ['e_oc', 'e_esp'], ['e_esp', 'e_lle'], ['e_lle', 'e_rev'], ['e_rev', 'e_con'],
        ['e_con', 'e_uni', 'Sí'], ['e_con', 'e_dif', 'No'], ['e_dif', 'e_uni'], ['e_uni', 'e_fac'], ['e_fac', 'e_pag'], ['e_pag', 'e_fin'],
        ['p_ini', 'p_pre'], ['p_pre', 'p_des'], ['p_des', 'p_fac'], ['p_fac', 'p_cob'], ['p_cob', 'p_fin']
      ],
      mensajes: [['e_oc', 'p_ini', 'Orden de compra'], ['p_des', 'e_lle', 'Mercadería y guía'], ['p_fac', 'e_fac', 'Factura'], ['e_pag', 'p_cob', 'Pago']]
    }, {
      nombre: 'Licitación',
      pools: [{ id: 'licitacion', nombre: 'Licitación', carriles: [{ id: 'l_cmp', nombre: 'Compras' }, { id: 'l_jef', nombre: 'Jefatura' }] }],
      nodos: [
        n('l_ini', 'inicio', 'Se necesita un proveedor', 'l_cmp', 0),
        n('l_inv', 'usuario', 'Invitar a proveedores', 'l_cmp', 1),
        n('l_esp', 'espera', 'Plazo para recibir ofertas (5 días)', 'l_cmp', 2),
        n('l_eva', 'usuario', 'Evaluar las ofertas', 'l_jef', 3),
        n('l_dec', 'decision', '¿Hay una oferta válida?', 'l_jef', 4),
        n('l_ok', 'fin', 'Proveedor elegido', 'l_jef', 5),
        n('l_amp', 'usuario', 'Ampliar la invitación', 'l_cmp', 4, 1)
      ],
      flujos: [['l_ini', 'l_inv'], ['l_inv', 'l_esp'], ['l_esp', 'l_eva'], ['l_eva', 'l_dec'], ['l_dec', 'l_ok', 'Sí'], ['l_dec', 'l_amp', 'No'], ['l_amp', 'l_inv']]
    }]
  },

  // ---------------------------------------------------------------- Finanzas
  {
    id: 'finanzas-simple', categoria: 'Finanzas', nivel: 'simple',
    nombre: 'Rendición de gastos',
    descripcion: 'El colaborador rinde un gasto con su boleta y Finanzas lo reembolsa o le pide corregir.',
    diagramas: [{
      nombre: 'Rendición de gastos',
      pools: [{ id: 'empresa', nombre: 'Empresa', carriles: [{ id: 'col', nombre: 'Colaborador' }, { id: 'fnz', nombre: 'Finanzas' }] }],
      nodos: [
        n('ini', 'inicio', 'Hizo un gasto de la empresa', 'col', 0),
        n('ren', 'usuario', 'Rendir el gasto con su boleta', 'col', 1),
        n('rev', 'usuario', 'Revisar la rendición', 'fnz', 2),
        n('dec', 'decision', '¿Está correcta?', 'fnz', 3),
        n('pag', 'servicio', 'Reembolsar al colaborador', 'fnz', 4),
        n('fin', 'fin', 'Gasto reembolsado', 'fnz', 5),
        n('cor', 'usuario', 'Corregir la rendición', 'col', 3, 1)
      ],
      flujos: [['ini', 'ren'], ['ren', 'rev'], ['rev', 'dec'], ['dec', 'pag', 'Sí'], ['pag', 'fin'], ['dec', 'cor', 'No'], ['cor', 'ren']]
    }]
  },
  {
    id: 'finanzas-intermedia', categoria: 'Finanzas', nivel: 'intermedia',
    nombre: 'Pago de facturas a proveedores',
    descripcion: 'La factura se valida contra la orden de compra, se contabiliza y aprueba en paralelo y Tesorería la paga.',
    diagramas: [{
      nombre: 'Pago de facturas',
      pools: [{
        id: 'empresa', nombre: 'Empresa',
        carriles: [{ id: 'cnt', nombre: 'Contabilidad' }, { id: 'are', nombre: 'Área que compró' }, { id: 'tes', nombre: 'Tesorería' }]
      }],
      nodos: [
        n('ini', 'inicio', 'Llega una factura', 'cnt', 0),
        n('reg', 'usuario', 'Registrar la factura', 'cnt', 1),
        n('val', 'usuario', 'Validar con la orden de compra', 'cnt', 2),
        n('coi', 'decision', '¿Coincide con la orden?', 'cnt', 3),
        n('acl', 'usuario', 'Pedir aclaración o nota de crédito', 'are', 3),
        n('par', 'paralelo', '', 'cnt', 4),
        n('cbz', 'usuario', 'Contabilizar la factura', 'cnt', 5),
        n('apr', 'usuario', 'Aprobar el pago', 'are', 5),
        n('jun', 'paralelo', '', 'are', 6),
        n('pro', 'usuario', 'Programar el pago', 'tes', 7),
        n('pag', 'servicio', 'Pagar por transferencia', 'tes', 8),
        n('com', 'servicio', 'Enviar el comprobante al proveedor', 'tes', 9),
        n('fin', 'fin', 'Factura pagada', 'tes', 10)
      ],
      flujos: [
        ['ini', 'reg'], ['reg', 'val'], ['val', 'coi'], ['coi', 'par', 'Sí'], ['coi', 'acl', 'No'], ['acl', 'val'],
        ['par', 'cbz'], ['par', 'apr'], ['cbz', 'jun'], ['apr', 'jun'], ['jun', 'pro'], ['pro', 'pag'], ['pag', 'com'], ['com', 'fin']
      ]
    }]
  },
  {
    id: 'finanzas-avanzada', categoria: 'Finanzas', nivel: 'avanzada',
    nombre: 'Cobranza a clientes',
    descripcion: 'La empresa factura, espera el vencimiento y concilia el abono que avisa el banco; la gestión de cobranza va en su propia pestaña.',
    diagramas: [{
      nombre: 'Cobranza',
      pools: [
        { id: 'cliente', nombre: 'Cliente', carriles: [{ id: 'cli', nombre: 'Cliente' }] },
        { id: 'empresa', nombre: 'Empresa', carriles: [{ id: 'fac', nombre: 'Facturación' }, { id: 'cob', nombre: 'Cobranza' }] },
        { id: 'banco', nombre: 'Banco', carriles: [{ id: 'ban', nombre: 'Banco' }] }
      ],
      nodos: [
        n('c_ini', 'inicioMensaje', 'Recibe la factura', 'cli', 1),
        n('c_rev', 'usuario', 'Revisar la factura', 'cli', 2),
        n('c_pag', 'usuario', 'Pagar por transferencia', 'cli', 7),
        n('c_fin', 'fin', 'Factura pagada', 'cli', 8),

        n('f_ini', 'inicio', 'Se entrega un servicio', 'fac', 0),
        n('f_emi', 'usuario', 'Emitir y enviar la factura', 'fac', 1),
        n('f_esp', 'espera', 'Esperar el vencimiento (30 días)', 'cob', 2),
        n('f_dec', 'decision', '¿Pagó a tiempo?', 'cob', 3),
        n('f_ges', 'subproceso', 'Gestión de cobranza', 'cob', 3, 1, 'El detalle está en la pestaña "Gestión de cobranza".'),
        n('f_uni', 'decision', '', 'cob', 5),
        n('f_abo', 'recibir', 'Llega el aviso de abono', 'cob', 8),
        n('f_con', 'usuario', 'Conciliar el pago', 'cob', 9),
        n('f_fin', 'fin', 'Cobro cerrado', 'cob', 10),

        n('b_ini', 'inicioMensaje', 'Recibe la transferencia', 'ban', 7),
        n('b_avi', 'servicio', 'Avisar el abono a la empresa', 'ban', 8),
        n('b_fin', 'fin', 'Transferencia hecha', 'ban', 9)
      ],
      flujos: [
        ['c_ini', 'c_rev'], ['c_rev', 'c_pag'], ['c_pag', 'c_fin'],
        ['f_ini', 'f_emi'], ['f_emi', 'f_esp'], ['f_esp', 'f_dec'], ['f_dec', 'f_uni', 'Sí'], ['f_dec', 'f_ges', 'No'], ['f_ges', 'f_uni'],
        ['f_uni', 'f_abo'], ['f_abo', 'f_con'], ['f_con', 'f_fin'],
        ['b_ini', 'b_avi'], ['b_avi', 'b_fin']
      ],
      mensajes: [['f_emi', 'c_ini', 'Factura'], ['c_pag', 'b_ini', 'Transferencia'], ['b_avi', 'f_abo', 'Aviso de abono']]
    }, {
      nombre: 'Gestión de cobranza',
      pools: [{ id: 'gestion', nombre: 'Gestión de cobranza', carriles: [{ id: 'g_cob', nombre: 'Cobranza' }, { id: 'g_jef', nombre: 'Jefatura de finanzas' }] }],
      nodos: [
        n('g_ini', 'inicio', 'Factura vencida', 'g_cob', 0),
        n('g_lla', 'usuario', 'Llamar y enviar recordatorio', 'g_cob', 1),
        n('g_esp', 'espera', 'Esperar 7 días', 'g_cob', 2),
        n('g_dec', 'decision', '¿Pagó?', 'g_cob', 3),
        n('g_ok', 'fin', 'Pago comprometido', 'g_cob', 4),
        n('g_esc', 'usuario', 'Escalar a la jefatura', 'g_jef', 3),
        n('g_acu', 'usuario', 'Acordar un plan de pago', 'g_jef', 4),
        n('g_fin', 'fin', 'Plan de pago acordado', 'g_jef', 5)
      ],
      flujos: [['g_ini', 'g_lla'], ['g_lla', 'g_esp'], ['g_esp', 'g_dec'], ['g_dec', 'g_ok', 'Sí'], ['g_dec', 'g_esc', 'No'], ['g_esc', 'g_acu'], ['g_acu', 'g_fin']]
    }]
  },

  // ---------------------------------------------------------------- Ventas
  {
    id: 'ventas-simple', categoria: 'Ventas', nivel: 'simple',
    nombre: 'Cotización a un cliente',
    descripcion: 'El ejecutivo entiende la necesidad, prepara la cotización y pide aprobación si lleva descuento especial.',
    diagramas: [{
      nombre: 'Cotización',
      pools: [{ id: 'empresa', nombre: 'Empresa', carriles: [{ id: 'eje', nombre: 'Ejecutivo comercial' }, { id: 'jef', nombre: 'Jefatura comercial' }] }],
      nodos: [
        n('ini', 'inicio', 'Llega una consulta', 'eje', 0),
        n('ent', 'usuario', 'Entender la necesidad del cliente', 'eje', 1),
        n('pre', 'usuario', 'Preparar la cotización', 'eje', 2),
        n('des', 'decision', '¿Lleva descuento especial?', 'eje', 3),
        n('apr', 'usuario', 'Aprobar el descuento', 'jef', 3),
        n('uni', 'decision', '', 'eje', 4),
        n('env', 'usuario', 'Enviar la cotización', 'eje', 5),
        n('fin', 'fin', 'Cotización enviada', 'eje', 6)
      ],
      flujos: [['ini', 'ent'], ['ent', 'pre'], ['pre', 'des'], ['des', 'uni', 'No'], ['des', 'apr', 'Sí'], ['apr', 'uni'], ['uni', 'env'], ['env', 'fin']]
    }]
  },
  {
    id: 'ventas-intermedia', categoria: 'Ventas', nivel: 'intermedia',
    nombre: 'De la oportunidad al cierre',
    descripcion: 'Cotización, negociación hasta que el cliente acepta, contrato aprobado y entrega con factura en paralelo.',
    diagramas: [{
      nombre: 'Oportunidad de venta',
      pools: [{
        id: 'empresa', nombre: 'Empresa',
        carriles: [{ id: 'eje', nombre: 'Ejecutivo comercial' }, { id: 'jef', nombre: 'Jefatura comercial' }, { id: 'ope', nombre: 'Operaciones' }, { id: 'fct', nombre: 'Facturación' }]
      }],
      nodos: [
        n('ini', 'inicio', 'Cliente interesado', 'eje', 0),
        n('cot', 'usuario', 'Preparar y enviar la cotización', 'eje', 1),
        n('neg', 'usuario', 'Negociar condiciones', 'eje', 2),
        n('ace', 'decision', '¿El cliente acepta?', 'eje', 3),
        n('aju', 'usuario', 'Ajustar la propuesta', 'eje', 3, 1),
        n('fir', 'usuario', 'Firmar el contrato', 'eje', 4),
        n('apb', 'usuario', 'Aprobar el contrato', 'jef', 5),
        n('par', 'paralelo', '', 'jef', 6),
        n('ent', 'usuario', 'Programar la entrega', 'ope', 7),
        n('fac', 'usuario', 'Emitir la factura', 'fct', 7),
        n('jun', 'paralelo', '', 'jef', 8),
        n('seg', 'usuario', 'Hacer seguimiento al cliente', 'eje', 9),
        n('fin', 'fin', 'Venta cerrada', 'eje', 10)
      ],
      flujos: [
        ['ini', 'cot'], ['cot', 'neg'], ['neg', 'ace'], ['ace', 'fir', 'Sí'], ['ace', 'aju', 'No'], ['aju', 'neg'], ['fir', 'apb'],
        ['apb', 'par'], ['par', 'ent'], ['par', 'fac'], ['ent', 'jun'], ['fac', 'jun'], ['jun', 'seg'], ['seg', 'fin']
      ]
    }]
  },
  {
    id: 'ventas-avanzada', categoria: 'Ventas', nivel: 'avanzada',
    nombre: 'Venta con despacho al cliente',
    descripcion: 'El cliente, la empresa y el transporte se mandan cotización, respuesta y entrega; la preparación del pedido va en su propia pestaña.',
    diagramas: [{
      nombre: 'Venta',
      pools: [
        { id: 'cliente', nombre: 'Cliente', carriles: [{ id: 'cli', nombre: 'Cliente' }] },
        { id: 'empresa', nombre: 'Empresa', carriles: [{ id: 'ven', nombre: 'Ventas' }, { id: 'bod', nombre: 'Bodega' }, { id: 'fct', nombre: 'Facturación' }] },
        { id: 'transporte', nombre: 'Transporte', carriles: [{ id: 'tra', nombre: 'Transporte' }] }
      ],
      nodos: [
        n('c_ini', 'inicio', 'Necesita un producto', 'cli', 0),
        n('c_sol', 'usuario', 'Pedir una cotización', 'cli', 1),
        n('c_rec', 'recibir', 'Recibe la cotización', 'cli', 3),
        n('c_res', 'usuario', 'Responder si acepta', 'cli', 4),
        n('c_fin', 'fin', 'Respuesta enviada', 'cli', 5),
        n('c_ped', 'inicioMensaje', 'Recibe el pedido', 'cli', 9),
        n('c_gui', 'usuario', 'Firmar la guía de recepción', 'cli', 10),
        n('c_fi2', 'fin', 'Pedido recibido', 'cli', 11),

        n('e_ini', 'inicioMensaje', 'Llega la solicitud', 'ven', 1),
        n('e_cot', 'usuario', 'Cotizar y enviar', 'ven', 3),
        n('e_res', 'recibir', 'Llega la respuesta', 'ven', 4),
        n('e_dec', 'decision', '¿Aceptó?', 'ven', 5),
        n('e_per', 'fin', 'Venta perdida', 'ven', 6),
        n('e_pre', 'subproceso', 'Preparar el pedido', 'bod', 6, 0, 'El detalle está en la pestaña "Preparar el pedido".'),
        n('e_fac', 'usuario', 'Emitir la factura y la guía', 'fct', 7),
        n('e_des', 'usuario', 'Entregar al transporte', 'bod', 8),
        n('e_esp', 'espera', 'Esperar la entrega (48 horas)', 'bod', 10),
        n('e_con', 'recibir', 'Llega la confirmación de entrega', 'bod', 11),
        n('e_fin', 'fin', 'Venta cerrada', 'bod', 12),

        n('t_ini', 'inicioMensaje', 'Recibe la carga', 'tra', 8),
        n('t_ent', 'usuario', 'Llevar y entregar al cliente', 'tra', 9),
        n('t_con', 'servicio', 'Confirmar la entrega', 'tra', 11),
        n('t_fin', 'fin', 'Entrega hecha', 'tra', 12)
      ],
      flujos: [
        ['c_ini', 'c_sol'], ['c_sol', 'c_rec'], ['c_rec', 'c_res'], ['c_res', 'c_fin'], ['c_ped', 'c_gui'], ['c_gui', 'c_fi2'],
        ['e_ini', 'e_cot'], ['e_cot', 'e_res'], ['e_res', 'e_dec'], ['e_dec', 'e_per', 'No'], ['e_dec', 'e_pre', 'Sí'], ['e_pre', 'e_fac'],
        ['e_fac', 'e_des'], ['e_des', 'e_esp'], ['e_esp', 'e_con'], ['e_con', 'e_fin'],
        ['t_ini', 't_ent'], ['t_ent', 't_con'], ['t_con', 't_fin']
      ],
      mensajes: [
        ['c_sol', 'e_ini', 'Solicitud'], ['e_cot', 'c_rec', 'Cotización'], ['c_res', 'e_res', 'Respuesta'],
        ['e_des', 't_ini', 'Carga'], ['t_ent', 'c_ped', 'Pedido'], ['t_con', 'e_con', 'Confirmación']
      ]
    }, {
      nombre: 'Preparar el pedido',
      pools: [{ id: 'preparacion', nombre: 'Preparar el pedido', carriles: [{ id: 'p_bod', nombre: 'Bodega' }] }],
      nodos: [
        n('p_ini', 'inicio', 'Venta confirmada', 'p_bod', 0),
        n('p_bus', 'usuario', 'Buscar los productos', 'p_bod', 1),
        n('p_dec', 'decision', '¿Hay stock?', 'p_bod', 2),
        n('p_emb', 'manual', 'Embalar y etiquetar', 'p_bod', 3),
        n('p_fin', 'fin', 'Pedido listo', 'p_bod', 4),
        n('p_rep', 'usuario', 'Pedir reposición urgente', 'p_bod', 2, 1)
      ],
      flujos: [['p_ini', 'p_bus'], ['p_bus', 'p_dec'], ['p_dec', 'p_emb', 'Sí'], ['p_dec', 'p_rep', 'No'], ['p_rep', 'p_bus'], ['p_emb', 'p_fin']]
    }]
  },

  // ---------------------------------------------------------------- Atención al cliente
  {
    id: 'atencion-simple', categoria: 'Atención al cliente', nivel: 'simple',
    nombre: 'Consulta de un cliente',
    descripcion: 'Se registra la consulta y se responde de inmediato o se deriva al área que corresponde.',
    diagramas: [{
      nombre: 'Consulta',
      pools: [{ id: 'empresa', nombre: 'Empresa', carriles: [{ id: 'eje', nombre: 'Ejecutivo de atención' }] }],
      nodos: [
        n('ini', 'inicio', 'Llega una consulta', 'eje', 0),
        n('reg', 'usuario', 'Registrar la consulta', 'eje', 1),
        n('dec', 'decision', '¿Se puede responder de inmediato?', 'eje', 2),
        n('res', 'usuario', 'Responder al cliente', 'eje', 3),
        n('fin', 'fin', 'Consulta resuelta', 'eje', 4),
        n('der', 'usuario', 'Derivar al área que corresponde', 'eje', 2, 1),
        n('fi2', 'fin', 'Consulta derivada', 'eje', 3, 1)
      ],
      flujos: [['ini', 'reg'], ['reg', 'dec'], ['dec', 'res', 'Sí'], ['res', 'fin'], ['dec', 'der', 'No'], ['der', 'fi2']]
    }]
  },
  {
    id: 'atencion-intermedia', categoria: 'Atención al cliente', nivel: 'intermedia',
    nombre: 'Gestión de reclamos',
    descripcion: 'Se clasifica el reclamo, se investiga la causa mientras Calidad lo registra y se propone una solución hasta que el cliente queda conforme.',
    diagramas: [{
      nombre: 'Gestión de reclamos',
      pools: [{
        id: 'empresa', nombre: 'Empresa',
        carriles: [{ id: 'ate', nombre: 'Atención al cliente' }, { id: 'are', nombre: 'Área responsable' }, { id: 'cal', nombre: 'Calidad' }]
      }],
      nodos: [
        n('ini', 'inicio', 'Llega un reclamo', 'ate', 0),
        n('reg', 'usuario', 'Registrar y clasificar el reclamo', 'ate', 1),
        n('val', 'decision', '¿Es un reclamo válido?', 'ate', 2),
        n('exp', 'usuario', 'Explicar al cliente por qué no procede', 'ate', 2, 1),
        n('fi2', 'fin', 'Reclamo cerrado sin solución', 'ate', 3, 1),
        n('par', 'paralelo', '', 'ate', 4),
        n('inv', 'usuario', 'Investigar la causa', 'are', 5),
        n('rca', 'usuario', 'Registrar en el informe de calidad', 'cal', 5),
        n('jun', 'paralelo', '', 'ate', 6),
        n('sol', 'usuario', 'Proponer una solución', 'are', 7),
        n('res', 'usuario', 'Responder al cliente', 'ate', 8),
        n('con', 'decision', '¿El cliente queda conforme?', 'ate', 9),
        n('rev', 'usuario', 'Revisar la solución', 'ate', 9, 1),
        n('fin', 'fin', 'Reclamo resuelto', 'ate', 10)
      ],
      flujos: [
        ['ini', 'reg'], ['reg', 'val'], ['val', 'par', 'Sí'], ['val', 'exp', 'No'], ['exp', 'fi2'], ['par', 'inv'], ['par', 'rca'],
        ['inv', 'jun'], ['rca', 'jun'], ['jun', 'sol'], ['sol', 'res'], ['res', 'con'], ['con', 'fin', 'Sí'], ['con', 'rev', 'No'], ['rev', 'sol']
      ]
    }]
  },
  {
    id: 'atencion-avanzada', categoria: 'Atención al cliente', nivel: 'avanzada',
    nombre: 'Garantía con servicio técnico',
    descripcion: 'El cliente reclama la garantía, la empresa envía el producto a un servicio técnico externo y avisa el resultado; el diagnóstico va en su propia pestaña.',
    diagramas: [{
      nombre: 'Garantía',
      pools: [
        { id: 'cliente', nombre: 'Cliente', carriles: [{ id: 'cli', nombre: 'Cliente' }] },
        { id: 'empresa', nombre: 'Empresa', carriles: [{ id: 'ate', nombre: 'Atención al cliente' }, { id: 'log', nombre: 'Logística' }] },
        { id: 'tecnico', nombre: 'Servicio técnico externo', carriles: [{ id: 'tec', nombre: 'Servicio técnico' }] }
      ],
      nodos: [
        n('c_ini', 'inicio', 'El producto falla', 'cli', 0),
        n('c_rec', 'usuario', 'Hacer el reclamo de garantía', 'cli', 1),
        n('c_res', 'recibir', 'Recibe la respuesta', 'cli', 9),
        n('c_fin', 'fin', 'Caso cerrado', 'cli', 10),

        n('e_ini', 'inicioMensaje', 'Llega el reclamo', 'ate', 1),
        n('e_rev', 'usuario', 'Revisar la garantía', 'ate', 2),
        n('e_dec', 'decision', '¿Está en garantía?', 'ate', 3),
        n('e_cot', 'usuario', 'Cotizar la reparación', 'ate', 4),
        n('e_ret', 'usuario', 'Retirar el producto', 'log', 4),
        n('e_env', 'usuario', 'Enviar al servicio técnico', 'log', 5),
        n('e_esp', 'espera', 'Esperar el diagnóstico (5 días)', 'log', 6),
        n('e_inf', 'recibir', 'Llega el informe técnico', 'log', 7),
        n('e_uni', 'decision', '', 'ate', 8),
        n('e_avi', 'enviar', 'Avisar al cliente', 'ate', 9),
        n('e_fin', 'fin', 'Garantía cerrada', 'ate', 10),

        n('s_ini', 'inicioMensaje', 'Recibe el producto', 'tec', 5),
        n('s_dia', 'subproceso', 'Diagnóstico y reparación', 'tec', 6, 0, 'El detalle está en la pestaña "Diagnóstico y reparación".'),
        n('s_inf', 'usuario', 'Enviar el informe técnico', 'tec', 7),
        n('s_fin', 'fin', 'Caso técnico cerrado', 'tec', 8)
      ],
      flujos: [
        ['c_ini', 'c_rec'], ['c_rec', 'c_res'], ['c_res', 'c_fin'],
        ['e_ini', 'e_rev'], ['e_rev', 'e_dec'], ['e_dec', 'e_cot', 'No'], ['e_dec', 'e_ret', 'Sí'], ['e_ret', 'e_env'], ['e_env', 'e_esp'],
        ['e_esp', 'e_inf'], ['e_inf', 'e_uni'], ['e_cot', 'e_uni'], ['e_uni', 'e_avi'], ['e_avi', 'e_fin'],
        ['s_ini', 's_dia'], ['s_dia', 's_inf'], ['s_inf', 's_fin']
      ],
      mensajes: [['c_rec', 'e_ini', 'Reclamo'], ['e_env', 's_ini', 'Producto'], ['s_inf', 'e_inf', 'Informe'], ['e_avi', 'c_res', 'Respuesta']]
    }, {
      nombre: 'Diagnóstico y reparación',
      pools: [{ id: 'diagnostico', nombre: 'Servicio técnico', carriles: [{ id: 'd_tec', nombre: 'Técnico' }] }],
      nodos: [
        n('d_ini', 'inicio', 'Llega el producto', 'd_tec', 0),
        n('d_dia', 'usuario', 'Diagnosticar la falla', 'd_tec', 1),
        n('d_dec', 'decision', '¿Se puede reparar?', 'd_tec', 2),
        n('d_rep', 'manual', 'Reparar y probar', 'd_tec', 3),
        n('d_ok', 'fin', 'Producto reparado', 'd_tec', 4),
        n('d_cam', 'usuario', 'Recomendar el reemplazo', 'd_tec', 2, 1),
        n('d_no', 'fin', 'Se recomienda reemplazo', 'd_tec', 3, 1)
      ],
      flujos: [['d_ini', 'd_dia'], ['d_dia', 'd_dec'], ['d_dec', 'd_rep', 'Sí'], ['d_rep', 'd_ok'], ['d_dec', 'd_cam', 'No'], ['d_cam', 'd_no']]
    }]
  },

  // ---------------------------------------------------------------- Logística y bodega
  {
    id: 'logistica-simple', categoria: 'Logística y bodega', nivel: 'simple',
    nombre: 'Recepción de mercadería',
    descripcion: 'La bodega cuenta lo que llega contra la guía, anota diferencias y guarda la mercadería.',
    diagramas: [{
      nombre: 'Recepción de mercadería',
      pools: [{ id: 'empresa', nombre: 'Empresa', carriles: [{ id: 'bod', nombre: 'Bodega' }] }],
      nodos: [
        n('ini', 'inicio', 'Llega un camión', 'bod', 0),
        n('rev', 'manual', 'Contar y revisar contra la guía', 'bod', 1),
        n('dec', 'decision', '¿Coincide con la guía?', 'bod', 2),
        n('uni', 'decision', '', 'bod', 3),
        n('alm', 'manual', 'Guardar en su ubicación', 'bod', 4),
        n('fin', 'fin', 'Mercadería almacenada', 'bod', 5),
        n('dif', 'usuario', 'Anotar la diferencia en la guía', 'bod', 2, 1)
      ],
      flujos: [['ini', 'rev'], ['rev', 'dec'], ['dec', 'uni', 'Sí'], ['dec', 'dif', 'No'], ['dif', 'uni'], ['uni', 'alm'], ['alm', 'fin']]
    }]
  },
  {
    id: 'logistica-intermedia', categoria: 'Logística y bodega', nivel: 'intermedia',
    nombre: 'Preparación y despacho de pedidos',
    descripcion: 'Se buscan los productos (con reposición si falta stock), se embala y se emite la guía en paralelo, y se despacha.',
    diagramas: [{
      nombre: 'Despacho de pedidos',
      pools: [{ id: 'empresa', nombre: 'Empresa', carriles: [{ id: 'ven', nombre: 'Ventas' }, { id: 'bod', nombre: 'Bodega' }, { id: 'des', nombre: 'Despacho' }] }],
      nodos: [
        n('ini', 'inicio', 'Llega un pedido', 'ven', 0),
        n('val', 'usuario', 'Validar el pedido', 'ven', 1),
        n('bus', 'usuario', 'Buscar los productos', 'bod', 2),
        n('sto', 'decision', '¿Está todo en stock?', 'bod', 3),
        n('rep', 'usuario', 'Pedir reposición', 'bod', 3, 1),
        n('esp', 'espera', 'Esperar la reposición (2 días)', 'bod', 2, 1),
        n('par', 'paralelo', '', 'bod', 4),
        n('emb', 'manual', 'Embalar y etiquetar', 'bod', 5),
        n('gui', 'usuario', 'Emitir la guía de despacho', 'des', 5),
        n('jun', 'paralelo', '', 'des', 6),
        n('car', 'manual', 'Cargar el camión', 'des', 7),
        n('ent', 'manual', 'Entregar al cliente', 'des', 8),
        n('fin', 'fin', 'Pedido entregado', 'des', 9)
      ],
      flujos: [
        ['ini', 'val'], ['val', 'bus'], ['bus', 'sto'], ['sto', 'par', 'Sí'], ['sto', 'rep', 'No'], ['rep', 'esp'], ['esp', 'bus'],
        ['par', 'emb'], ['par', 'gui'], ['emb', 'jun'], ['gui', 'jun'], ['jun', 'car'], ['car', 'ent'], ['ent', 'fin']
      ]
    }]
  },
  {
    id: 'logistica-avanzada', categoria: 'Logística y bodega', nivel: 'avanzada',
    nombre: 'Devolución de productos',
    descripcion: 'El cliente devuelve un producto por transporte, la bodega lo revisa y la empresa avisa el resultado; la revisión va en su propia pestaña.',
    diagramas: [{
      nombre: 'Devolución',
      pools: [
        { id: 'cliente', nombre: 'Cliente', carriles: [{ id: 'cli', nombre: 'Cliente' }] },
        { id: 'empresa', nombre: 'Empresa', carriles: [{ id: 'ate', nombre: 'Atención al cliente' }, { id: 'bod', nombre: 'Bodega' }] },
        { id: 'transporte', nombre: 'Transporte', carriles: [{ id: 'tra', nombre: 'Transporte' }] }
      ],
      nodos: [
        n('c_ini', 'inicio', 'Quiere devolver un producto', 'cli', 0),
        n('c_sol', 'usuario', 'Solicitar la devolución', 'cli', 1),
        n('c_eti', 'recibir', 'Recibe la etiqueta de envío', 'cli', 3),
        n('c_ent', 'manual', 'Entregar el paquete al transporte', 'cli', 4),
        n('c_res', 'recibir', 'Recibe el resultado', 'cli', 11),
        n('c_fin', 'fin', 'Devolución cerrada', 'cli', 12),

        n('e_ini', 'inicioMensaje', 'Llega la solicitud', 'ate', 1),
        n('e_eti', 'usuario', 'Aprobar y enviar la etiqueta', 'ate', 3),
        n('e_lle', 'recibir', 'Llega el paquete', 'bod', 6),
        n('e_rev', 'subproceso', 'Revisar el producto devuelto', 'bod', 7, 0, 'El detalle está en la pestaña "Revisión".'),
        n('e_dec', 'decision', '¿Procede la devolución?', 'bod', 8),
        n('e_nc', 'usuario', 'Emitir la nota de crédito', 'ate', 9),
        n('e_dev', 'usuario', 'Preparar el reenvío al cliente', 'bod', 8, 1),
        n('e_uni', 'decision', '', 'ate', 10),
        n('e_avi', 'enviar', 'Avisar el resultado al cliente', 'ate', 11),
        n('e_fin', 'fin', 'Devolución resuelta', 'ate', 12),

        n('t_ini', 'inicioMensaje', 'Recibe el paquete', 'tra', 4),
        n('t_esp', 'espera', 'Esperar la ruta de retiro (24 h)', 'tra', 5),
        n('t_ent', 'usuario', 'Entregar en la bodega', 'tra', 6),
        n('t_fin', 'fin', 'Paquete entregado', 'tra', 7)
      ],
      flujos: [
        ['c_ini', 'c_sol'], ['c_sol', 'c_eti'], ['c_eti', 'c_ent'], ['c_ent', 'c_res'], ['c_res', 'c_fin'],
        ['e_ini', 'e_eti'], ['e_eti', 'e_lle'], ['e_lle', 'e_rev'], ['e_rev', 'e_dec'], ['e_dec', 'e_nc', 'Sí'], ['e_dec', 'e_dev', 'No'],
        ['e_nc', 'e_uni'], ['e_dev', 'e_uni'], ['e_uni', 'e_avi'], ['e_avi', 'e_fin'],
        ['t_ini', 't_esp'], ['t_esp', 't_ent'], ['t_ent', 't_fin']
      ],
      mensajes: [
        ['c_sol', 'e_ini', 'Solicitud'], ['e_eti', 'c_eti', 'Etiqueta'], ['c_ent', 't_ini', 'Paquete'], ['t_ent', 'e_lle', 'Paquete'], ['e_avi', 'c_res', 'Resultado']
      ]
    }, {
      nombre: 'Revisión',
      pools: [{ id: 'revision', nombre: 'Revisión del producto devuelto', carriles: [{ id: 'r_bod', nombre: 'Bodega' }, { id: 'r_cal', nombre: 'Calidad' }] }],
      nodos: [
        n('r_ini', 'inicio', 'Llega el producto', 'r_bod', 0),
        n('r_ins', 'manual', 'Inspeccionar el estado', 'r_bod', 1),
        n('r_par', 'paralelo', '', 'r_bod', 2),
        n('r_fot', 'usuario', 'Registrar con fotos', 'r_bod', 3),
        n('r_uso', 'usuario', 'Revisar si tiene uso o daño', 'r_cal', 3),
        n('r_jun', 'paralelo', '', 'r_bod', 4),
        n('r_inf', 'usuario', 'Emitir el informe de revisión', 'r_cal', 5),
        n('r_fin', 'fin', 'Revisión terminada', 'r_cal', 6)
      ],
      flujos: [['r_ini', 'r_ins'], ['r_ins', 'r_par'], ['r_par', 'r_fot'], ['r_par', 'r_uso'], ['r_fot', 'r_jun'], ['r_uso', 'r_jun'], ['r_jun', 'r_inf'], ['r_inf', 'r_fin']]
    }]
  },

  // ---------------------------------------------------------------- Legal y contratos
  {
    id: 'legal-simple', categoria: 'Legal y contratos', nivel: 'simple',
    nombre: 'Revisión de un contrato',
    descripcion: 'El área envía el borrador, Legal revisa cláusulas y riesgos y lo visa o pide corregirlo.',
    diagramas: [{
      nombre: 'Revisión de contrato',
      pools: [{ id: 'empresa', nombre: 'Empresa', carriles: [{ id: 'are', nombre: 'Área solicitante' }, { id: 'leg', nombre: 'Legal' }] }],
      nodos: [
        n('ini', 'inicio', 'Se necesita un contrato', 'are', 0),
        n('env', 'usuario', 'Enviar el borrador a Legal', 'are', 1),
        n('rev', 'usuario', 'Revisar cláusulas y riesgos', 'leg', 2),
        n('dec', 'decision', '¿Está conforme?', 'leg', 3),
        n('vis', 'usuario', 'Visar el contrato', 'leg', 4),
        n('fin', 'fin', 'Contrato visado', 'leg', 5),
        n('cor', 'usuario', 'Corregir el borrador', 'are', 3, 1)
      ],
      flujos: [['ini', 'env'], ['env', 'rev'], ['rev', 'dec'], ['dec', 'vis', 'Sí'], ['vis', 'fin'], ['dec', 'cor', 'No'], ['cor', 'env']]
    }]
  },
  {
    id: 'legal-intermedia', categoria: 'Legal y contratos', nivel: 'intermedia',
    nombre: 'Contrato con proveedor',
    descripcion: 'Legal redacta y negocia hasta llegar a acuerdo; la gerencia firma mientras se arma la carpeta y Administración lo registra.',
    diagramas: [{
      nombre: 'Contrato con proveedor',
      pools: [{
        id: 'empresa', nombre: 'Empresa',
        carriles: [{ id: 'are', nombre: 'Área solicitante' }, { id: 'leg', nombre: 'Legal' }, { id: 'ger', nombre: 'Gerencia' }, { id: 'adm', nombre: 'Administración' }]
      }],
      nodos: [
        n('ini', 'inicio', 'Se elige un proveedor', 'are', 0),
        n('sol', 'usuario', 'Pedir el contrato a Legal', 'are', 1),
        n('red', 'usuario', 'Redactar el contrato', 'leg', 2),
        n('neg', 'usuario', 'Negociar con el proveedor', 'leg', 3),
        n('acu', 'decision', '¿Hay acuerdo?', 'leg', 4),
        n('aju', 'usuario', 'Ajustar las condiciones', 'leg', 4, 1),
        n('par', 'paralelo', '', 'leg', 5),
        n('car', 'usuario', 'Preparar la carpeta del contrato', 'leg', 6),
        n('fir', 'usuario', 'Firmar por la empresa', 'ger', 6),
        n('jun', 'paralelo', '', 'ger', 7),
        n('reg', 'servicio', 'Registrar en el sistema de contratos', 'adm', 8),
        n('avi', 'usuario', 'Avisar al área solicitante', 'are', 9),
        n('fin', 'fin', 'Contrato vigente', 'are', 10)
      ],
      flujos: [
        ['ini', 'sol'], ['sol', 'red'], ['red', 'neg'], ['neg', 'acu'], ['acu', 'par', 'Sí'], ['acu', 'aju', 'No'], ['aju', 'neg'],
        ['par', 'car'], ['par', 'fir'], ['car', 'jun'], ['fir', 'jun'], ['jun', 'reg'], ['reg', 'avi'], ['avi', 'fin']
      ]
    }]
  },
  {
    id: 'legal-avanzada', categoria: 'Legal y contratos', nivel: 'avanzada',
    nombre: 'Firma de contrato con contraparte y notaría',
    descripcion: 'La empresa, la contraparte y la notaría se mandan el contrato, la respuesta y la escritura; la negociación de cambios va en su propia pestaña.',
    diagramas: [{
      nombre: 'Firma de contrato',
      pools: [
        { id: 'empresa', nombre: 'Empresa', carriles: [{ id: 'leg', nombre: 'Legal' }, { id: 'ger', nombre: 'Gerencia' }] },
        { id: 'contraparte', nombre: 'Contraparte', carriles: [{ id: 'con', nombre: 'Contraparte' }] },
        { id: 'notaria', nombre: 'Notaría', carriles: [{ id: 'not', nombre: 'Notaría' }] }
      ],
      nodos: [
        n('e_ini', 'inicio', 'Contrato aprobado internamente', 'leg', 0),
        n('e_env', 'usuario', 'Enviar el contrato a la contraparte', 'leg', 1),
        n('e_esp', 'espera', 'Plazo de respuesta (10 días)', 'leg', 2),
        n('e_res', 'recibir', 'Llega la respuesta', 'leg', 4),
        n('e_dec', 'decision', '¿Pide cambios?', 'leg', 5),
        n('e_neg', 'subproceso', 'Negociar cambios', 'leg', 5, 1, 'El detalle está en la pestaña "Negociar cambios".'),
        n('e_uni', 'decision', '', 'leg', 6),
        n('e_lis', 'usuario', 'Dejar el contrato listo para firma', 'leg', 7),
        n('e_fir', 'usuario', 'Firmar por la empresa', 'ger', 8),
        n('e_not', 'usuario', 'Enviar a la notaría', 'ger', 9),
        n('e_ret', 'recibir', 'Llega la escritura', 'ger', 11),
        n('e_arc', 'usuario', 'Archivar y avisar a las áreas', 'leg', 12),
        n('e_fin', 'fin', 'Contrato vigente', 'leg', 13),

        n('k_ini', 'inicioMensaje', 'Recibe el contrato', 'con', 1),
        n('k_rev', 'usuario', 'Revisar con su abogado', 'con', 2),
        n('k_res', 'usuario', 'Responder a la empresa', 'con', 4),
        n('k_fin', 'fin', 'Respuesta enviada', 'con', 5),

        n('n_ini', 'inicioMensaje', 'Recibe el contrato firmado', 'not', 9),
        n('n_cit', 'usuario', 'Citar a la contraparte a firmar', 'not', 10),
        n('n_dev', 'usuario', 'Protocolizar y devolver', 'not', 11),
        n('n_fin', 'fin', 'Escritura lista', 'not', 12)
      ],
      flujos: [
        ['e_ini', 'e_env'], ['e_env', 'e_esp'], ['e_esp', 'e_res'], ['e_res', 'e_dec'], ['e_dec', 'e_uni', 'No'], ['e_dec', 'e_neg', 'Sí'],
        ['e_neg', 'e_uni'], ['e_uni', 'e_lis'], ['e_lis', 'e_fir'], ['e_fir', 'e_not'], ['e_not', 'e_ret'], ['e_ret', 'e_arc'], ['e_arc', 'e_fin'],
        ['k_ini', 'k_rev'], ['k_rev', 'k_res'], ['k_res', 'k_fin'],
        ['n_ini', 'n_cit'], ['n_cit', 'n_dev'], ['n_dev', 'n_fin']
      ],
      mensajes: [['e_env', 'k_ini', 'Contrato'], ['k_res', 'e_res', 'Respuesta'], ['e_not', 'n_ini', 'Contrato firmado'], ['n_dev', 'e_ret', 'Escritura']]
    }, {
      nombre: 'Negociar cambios',
      pools: [{ id: 'negociacion', nombre: 'Negociación', carriles: [{ id: 'g_leg', nombre: 'Legal' }, { id: 'g_ger', nombre: 'Gerencia' }] }],
      nodos: [
        n('g_ini', 'inicio', 'La contraparte pide cambios', 'g_leg', 0),
        n('g_ana', 'usuario', 'Analizar los cambios pedidos', 'g_leg', 1),
        n('g_dec', 'decision', '¿Se aceptan?', 'g_leg', 2),
        n('g_inc', 'usuario', 'Incorporar los cambios', 'g_leg', 3),
        n('g_alt', 'usuario', 'Proponer una alternativa', 'g_ger', 2),
        n('g_apr', 'usuario', 'Aprobar la propuesta', 'g_ger', 3),
        n('g_uni', 'decision', '', 'g_leg', 4),
        n('g_fin', 'fin', 'Contrato ajustado', 'g_leg', 5)
      ],
      flujos: [['g_ini', 'g_ana'], ['g_ana', 'g_dec'], ['g_dec', 'g_inc', 'Sí'], ['g_dec', 'g_alt', 'No'], ['g_alt', 'g_apr'], ['g_apr', 'g_uni'], ['g_inc', 'g_uni'], ['g_uni', 'g_fin']]
    }]
  },

  // ---------------------------------------------------------------- Calidad
  {
    id: 'calidad-simple', categoria: 'Calidad', nivel: 'simple',
    nombre: 'Reporte de una no conformidad',
    descripcion: 'Un trabajador reporta un problema y Calidad lo registra con un responsable o lo descarta con explicación.',
    diagramas: [{
      nombre: 'No conformidad',
      pools: [{ id: 'empresa', nombre: 'Empresa', carriles: [{ id: 'tra', nombre: 'Trabajador' }, { id: 'cal', nombre: 'Calidad' }] }],
      nodos: [
        n('ini', 'inicio', 'Detecta un problema', 'tra', 0),
        n('rep', 'usuario', 'Reportar la no conformidad', 'tra', 1),
        n('rev', 'usuario', 'Revisar el reporte', 'cal', 2),
        n('dec', 'decision', '¿Es una no conformidad real?', 'cal', 3),
        n('reg', 'servicio', 'Registrar y asignar un responsable', 'cal', 4),
        n('fin', 'fin', 'No conformidad registrada', 'cal', 5),
        n('cer', 'usuario', 'Cerrar con una explicación', 'cal', 3, 1),
        n('fi2', 'fin', 'Reporte descartado', 'cal', 4, 1)
      ],
      flujos: [['ini', 'rep'], ['rep', 'rev'], ['rev', 'dec'], ['dec', 'reg', 'Sí'], ['reg', 'fin'], ['dec', 'cer', 'No'], ['cer', 'fi2']]
    }]
  },
  {
    id: 'calidad-intermedia', categoria: 'Calidad', nivel: 'intermedia',
    nombre: 'Acción correctiva',
    descripcion: 'Se analiza la causa raíz, se aprueba un plan, se corrige y capacita en paralelo y se verifica que el problema no vuelva.',
    diagramas: [{
      nombre: 'Acción correctiva',
      pools: [{ id: 'empresa', nombre: 'Empresa', carriles: [{ id: 'cal', nombre: 'Calidad' }, { id: 'res', nombre: 'Área responsable' }, { id: 'ger', nombre: 'Gerencia' }] }],
      nodos: [
        n('ini', 'inicio', 'No conformidad registrada', 'cal', 0),
        n('ana', 'usuario', 'Analizar la causa raíz', 'res', 1, 0, 'Por ejemplo con los 5 porqués o un diagrama de Ishikawa.'),
        n('pla', 'usuario', 'Definir el plan de acción', 'res', 2),
        n('apr', 'usuario', 'Aprobar el plan', 'ger', 3),
        n('par', 'paralelo', '', 'ger', 4),
        n('cor', 'usuario', 'Aplicar la corrección', 'res', 5),
        n('cap', 'usuario', 'Capacitar al equipo', 'ger', 5),
        n('jun', 'paralelo', '', 'res', 6),
        n('ver', 'usuario', 'Verificar la eficacia', 'cal', 7),
        n('efi', 'decision', '¿Se eliminó el problema?', 'cal', 8),
        n('rev', 'usuario', 'Revisar el análisis', 'cal', 8, 1),
        n('cer', 'usuario', 'Cerrar la acción correctiva', 'cal', 9),
        n('fin', 'fin', 'Acción cerrada', 'cal', 10)
      ],
      flujos: [
        ['ini', 'ana'], ['ana', 'pla'], ['pla', 'apr'], ['apr', 'par'], ['par', 'cor'], ['par', 'cap'], ['cor', 'jun'], ['cap', 'jun'],
        ['jun', 'ver'], ['ver', 'efi'], ['efi', 'cer', 'Sí'], ['efi', 'rev', 'No'], ['rev', 'ana'], ['cer', 'fin']
      ]
    }]
  },
  {
    id: 'calidad-avanzada', categoria: 'Calidad', nivel: 'avanzada',
    nombre: 'Auditoría externa de calidad',
    descripcion: 'La empresa pide la auditoría, la auditora visita, informa hallazgos y certifica tras el plazo de corrección; la preparación va en su propia pestaña.',
    diagramas: [{
      nombre: 'Auditoría',
      pools: [
        { id: 'empresa', nombre: 'Empresa', carriles: [{ id: 'cal', nombre: 'Calidad' }, { id: 'are', nombre: 'Áreas auditadas' }] },
        { id: 'auditora', nombre: 'Empresa auditora', carriles: [{ id: 'aud', nombre: 'Auditor' }] }
      ],
      nodos: [
        n('e_ini', 'inicio', 'Se acerca la auditoría anual', 'cal', 0),
        n('e_sol', 'usuario', 'Solicitar la auditoría', 'cal', 1),
        n('e_pre', 'subproceso', 'Preparar la auditoría', 'cal', 2, 0, 'El detalle está en la pestaña "Preparar la auditoría".'),
        n('e_esp', 'espera', 'Esperar la fecha de auditoría', 'cal', 3),
        n('e_atn', 'manual', 'Atender a los auditores', 'are', 4),
        n('e_inf', 'recibir', 'Llega el informe de auditoría', 'cal', 6),
        n('e_hal', 'decision', '¿Hay hallazgos?', 'cal', 7),
        n('e_cor', 'usuario', 'Corregir los hallazgos', 'are', 8),
        n('e_uni', 'decision', '', 'cal', 9),
        n('e_cer', 'recibir', 'Llega el certificado', 'cal', 10),
        n('e_fin', 'fin', 'Empresa certificada', 'cal', 11),

        n('a_ini', 'inicioMensaje', 'Recibe la solicitud', 'aud', 1),
        n('a_pla', 'usuario', 'Planificar la auditoría', 'aud', 2),
        n('a_aud', 'manual', 'Auditar en terreno', 'aud', 4),
        n('a_inf', 'usuario', 'Enviar el informe', 'aud', 6),
        n('a_esp', 'espera', 'Plazo para cerrar hallazgos (30 días)', 'aud', 8),
        n('a_cer', 'usuario', 'Emitir el certificado', 'aud', 10),
        n('a_fin', 'fin', 'Auditoría cerrada', 'aud', 11)
      ],
      flujos: [
        ['e_ini', 'e_sol'], ['e_sol', 'e_pre'], ['e_pre', 'e_esp'], ['e_esp', 'e_atn'], ['e_atn', 'e_inf'], ['e_inf', 'e_hal'],
        ['e_hal', 'e_uni', 'No'], ['e_hal', 'e_cor', 'Sí'], ['e_cor', 'e_uni'], ['e_uni', 'e_cer'], ['e_cer', 'e_fin'],
        ['a_ini', 'a_pla'], ['a_pla', 'a_aud'], ['a_aud', 'a_inf'], ['a_inf', 'a_esp'], ['a_esp', 'a_cer'], ['a_cer', 'a_fin']
      ],
      mensajes: [['e_sol', 'a_ini', 'Solicitud'], ['a_inf', 'e_inf', 'Informe'], ['a_cer', 'e_cer', 'Certificado']]
    }, {
      nombre: 'Preparar la auditoría',
      pools: [{ id: 'preparacion', nombre: 'Preparación', carriles: [{ id: 'p_cal', nombre: 'Calidad' }, { id: 'p_are', nombre: 'Áreas' }] }],
      nodos: [
        n('p_ini', 'inicio', 'Se agenda la auditoría', 'p_cal', 0),
        n('p_par', 'paralelo', '', 'p_cal', 1),
        n('p_doc', 'usuario', 'Actualizar procedimientos y registros', 'p_cal', 2),
        n('p_aut', 'usuario', 'Hacer una autoevaluación', 'p_are', 2),
        n('p_jun', 'paralelo', '', 'p_cal', 3),
        n('p_dec', 'decision', '¿Está todo listo?', 'p_cal', 4),
        n('p_ok', 'fin', 'Listos para la auditoría', 'p_cal', 5),
        n('p_com', 'usuario', 'Completar lo pendiente', 'p_are', 4),
        n('p_fi2', 'fin', 'Listos con pendientes menores', 'p_are', 5)
      ],
      flujos: [['p_ini', 'p_par'], ['p_par', 'p_doc'], ['p_par', 'p_aut'], ['p_doc', 'p_jun'], ['p_aut', 'p_jun'], ['p_jun', 'p_dec'], ['p_dec', 'p_ok', 'Sí'], ['p_dec', 'p_com', 'No'], ['p_com', 'p_fi2']]
    }]
  },

  // ---------------------------------------------------------------- Sistemas web
  {
    id: 'web-simple', categoria: 'Sistemas web', nivel: 'simple',
    nombre: 'Inicio de sesión',
    descripcion: 'El usuario entra con su usuario y contraseña; si no son correctos, ve un mensaje y vuelve a intentarlo.',
    diagramas: [{
      nombre: 'Inicio de sesión',
      pools: [{ id: 'sistema', nombre: 'Sistema web', carriles: [{ id: 'usu', nombre: 'Usuario' }, { id: 'web', nombre: 'Sistema web' }] }],
      nodos: [
        n('ini', 'inicio', 'Quiere ingresar', 'usu', 0),
        n('ing', 'usuario', 'Ingresar usuario y contraseña', 'usu', 1),
        n('val', 'servicio', 'Validar las credenciales', 'web', 2, 0, 'Se comparan con las registradas (la contraseña se guarda cifrada).'),
        n('dec', 'decision', '¿Son correctas?', 'web', 3),
        n('pan', 'servicio', 'Mostrar el panel principal', 'web', 4),
        n('fin', 'fin', 'Sesión iniciada', 'web', 5),
        n('err', 'servicio', 'Mostrar mensaje de error', 'usu', 3, 1)
      ],
      flujos: [['ini', 'ing'], ['ing', 'val'], ['val', 'dec'], ['dec', 'pan', 'Sí'], ['pan', 'fin'], ['dec', 'err', 'No'], ['err', 'ing']]
    }]
  },
  {
    id: 'web-intermedia', categoria: 'Sistemas web', nivel: 'intermedia',
    nombre: 'Inicio de sesión con bloqueo por intentos',
    descripcion: 'Valida las credenciales, crea la sesión mientras registra el acceso y bloquea la cuenta después de 3 intentos fallidos.',
    diagramas: [{
      nombre: 'Inicio de sesión',
      pools: [{
        id: 'sistema', nombre: 'Sistema web',
        carriles: [{ id: 'usu', nombre: 'Usuario' }, { id: 'web', nombre: 'Sistema web' }, { id: 'seg', nombre: 'Seguridad' }]
      }],
      nodos: [
        n('ini', 'inicio', 'Quiere ingresar', 'usu', 0),
        n('ing', 'usuario', 'Ingresar usuario y contraseña', 'usu', 1),
        n('val', 'servicio', 'Validar las credenciales', 'web', 2),
        n('dec', 'decision', '¿Son correctas?', 'web', 3),
        n('err', 'servicio', 'Mostrar mensaje de error', 'web', 4, 1),
        n('par', 'paralelo', '', 'web', 5),
        n('ses', 'servicio', 'Crear la sesión segura', 'web', 6),
        n('bit', 'servicio', 'Registrar el acceso en la bitácora', 'seg', 6, 0, 'Fecha, hora, IP y navegador del ingreso.'),
        n('jun', 'paralelo', '', 'web', 7),
        n('pan', 'usuario', 'Ver el panel principal', 'usu', 8),
        n('fin', 'fin', 'Sesión iniciada', 'usu', 9),
        n('sum', 'servicio', 'Sumar un intento fallido', 'seg', 3, 1),
        n('int', 'decision', '¿Superó 3 intentos?', 'seg', 4, 1),
        n('blo', 'servicio', 'Bloquear la cuenta 15 minutos', 'seg', 5, 1, 'Protege la cuenta si alguien intenta adivinar la contraseña.'),
        n('fbl', 'fin', 'Cuenta bloqueada', 'seg', 6, 1)
      ],
      flujos: [
        ['ini', 'ing'], ['ing', 'val'], ['val', 'dec'], ['dec', 'par', 'Sí'], ['dec', 'sum', 'No'], ['par', 'ses'], ['par', 'bit'],
        ['ses', 'jun'], ['bit', 'jun'], ['jun', 'pan'], ['pan', 'fin'], ['sum', 'int'], ['int', 'blo', 'Sí'], ['int', 'err', 'No'],
        ['blo', 'fbl'], ['err', 'ing']
      ]
    }]
  },
  {
    id: 'web-avanzada', categoria: 'Sistemas web', nivel: 'avanzada',
    nombre: 'Compra en una tienda web',
    descripcion: 'El cliente, la tienda y la pasarela de pago se comunican para pagar en línea; el inicio de sesión va en su propia pestaña.',
    diagramas: [{
      nombre: 'Compra en línea',
      pools: [
        { id: 'cliente', nombre: 'Cliente', carriles: [{ id: 'cli', nombre: 'Cliente' }] },
        { id: 'tienda', nombre: 'Tienda web', carriles: [{ id: 'web', nombre: 'Sitio web' }, { id: 'bod', nombre: 'Bodega' }] },
        { id: 'pasarela', nombre: 'Pasarela de pago', carriles: [{ id: 'pas', nombre: 'Pasarela de pago' }] }
      ],
      nodos: [
        n('c_ini', 'inicio', 'Quiere comprar en línea', 'cli', 0),
        n('c_log', 'subproceso', 'Iniciar sesión', 'cli', 1, 0, 'El detalle está en la pestaña "Iniciar sesión".'),
        n('c_car', 'usuario', 'Armar el carro y confirmar la compra', 'cli', 2),
        n('c_red', 'recibir', 'Llega a la página de pago', 'cli', 3),
        n('c_pag', 'usuario', 'Ingresar los datos de la tarjeta', 'cli', 5),
        n('c_res', 'recibir', 'Recibe el resultado de la compra', 'cli', 11),
        n('c_fin', 'fin', 'Compra terminada', 'cli', 12),

        n('w_ini', 'inicioMensaje', 'Recibe el pedido', 'web', 2),
        n('w_red', 'servicio', 'Redirigir a la pasarela de pago', 'web', 3),
        n('w_esp', 'espera', 'Plazo para pagar (15 minutos)', 'web', 4),
        n('w_res', 'recibir', 'Llega el resultado del pago', 'web', 7),
        n('w_dec', 'decision', '¿Pago aprobado?', 'web', 8),
        n('w_anu', 'servicio', 'Anular el pedido y liberar el stock', 'web', 9),
        n('w_pre', 'usuario', 'Preparar el despacho', 'bod', 9),
        n('w_uni', 'decision', '', 'web', 10),
        n('w_avi', 'enviar', 'Avisar el resultado al cliente', 'web', 11),
        n('w_fin', 'fin', 'Pedido procesado', 'web', 12),

        n('p_ini', 'inicioMensaje', 'Recibe los datos de la tarjeta', 'pas', 5),
        n('p_val', 'servicio', 'Validar con el banco emisor', 'pas', 6),
        n('p_res', 'servicio', 'Informar el resultado a la tienda', 'pas', 7),
        n('p_fin', 'fin', 'Pago procesado', 'pas', 8)
      ],
      flujos: [
        ['c_ini', 'c_log'], ['c_log', 'c_car'], ['c_car', 'c_red'], ['c_red', 'c_pag'], ['c_pag', 'c_res'], ['c_res', 'c_fin'],
        ['w_ini', 'w_red'], ['w_red', 'w_esp'], ['w_esp', 'w_res'], ['w_res', 'w_dec'], ['w_dec', 'w_pre', 'Sí'], ['w_dec', 'w_anu', 'No'],
        ['w_anu', 'w_uni'], ['w_pre', 'w_uni'], ['w_uni', 'w_avi'], ['w_avi', 'w_fin'],
        ['p_ini', 'p_val'], ['p_val', 'p_res'], ['p_res', 'p_fin']
      ],
      mensajes: [
        ['c_car', 'w_ini', 'Pedido'], ['w_red', 'c_red', 'Página de pago'], ['c_pag', 'p_ini', 'Datos de la tarjeta'],
        ['p_res', 'w_res', 'Resultado del pago'], ['w_avi', 'c_res', 'Resultado']
      ]
    }, {
      nombre: 'Iniciar sesión',
      pools: [{ id: 'login', nombre: 'Inicio de sesión', carriles: [{ id: 'l_usu', nombre: 'Cliente' }, { id: 'l_web', nombre: 'Sitio web' }] }],
      nodos: [
        n('l_ini', 'inicio', 'Entra a la tienda', 'l_usu', 0),
        n('l_ing', 'usuario', 'Ingresar correo y contraseña', 'l_usu', 1),
        n('l_val', 'servicio', 'Validar las credenciales', 'l_web', 2),
        n('l_dec', 'decision', '¿Son correctas?', 'l_web', 3),
        n('l_ok', 'fin', 'Sesión iniciada', 'l_web', 4),
        n('l_err', 'servicio', 'Mostrar mensaje de error', 'l_usu', 3, 1)
      ],
      flujos: [['l_ini', 'l_ing'], ['l_ing', 'l_val'], ['l_val', 'l_dec'], ['l_dec', 'l_ok', 'Sí'], ['l_dec', 'l_err', 'No'], ['l_err', 'l_ing']]
    }]
  }
];

// ---------------------------------------------------------------- de la descripción al .bpmn

const TIPOS = {
  inicio: ['startEvent'], inicioMensaje: ['startEvent', 'message'], espera: ['intermediateCatchEvent', 'timer'],
  recibir: ['intermediateCatchEvent', 'message'], enviar: ['intermediateThrowEvent', 'message'], fin: ['endEvent'],
  tarea: ['task'], usuario: ['userTask'], servicio: ['serviceTask'], manual: ['manualTask'], subproceso: ['subProcess'],
  decision: ['exclusiveGateway'], paralelo: ['parallelGateway']
};
const TAMANO = (tipo) => (/Event$/.test(TIPOS[tipo][0]) ? [36, 36] : /Gateway$/.test(TIPOS[tipo][0]) ? [46, 46] : [120, 64]);
const X0 = 80, Y0 = 60, CAB = 30, MARGEN = 70, COLUMNA = 170, FILA = 120, ENTRE_POOLS = 90, FIN = 110;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** Convierte una plantilla en .bpmn (las flechas van rectas: Fluye las traza al crear las plantillas). */
export function xmlPlantilla(p) {
  const pre = p.id.replace(/[^a-z0-9]/gi, '_');
  const id = (k) => `${pre}_${k}`;
  const vistos = new Set();
  let raices = '', planos = '';
  p.diagramas.forEach((d, i) => {
    const carrilDe = new Map(), poolDeCarril = new Map(), nodo = new Map();
    for (const pool of d.pools) for (const c of pool.carriles) { carrilDe.set(c.id, c); poolDeCarril.set(c.id, pool); }
    for (const x of d.nodos) {
      if (vistos.has(x.clave)) throw new Error(`${p.id}: clave repetida ${x.clave}`);
      if (!carrilDe.has(x.carril)) throw new Error(`${p.id}: carril ${x.carril} no existe`);
      vistos.add(x.clave);
      nodo.set(x.clave, x);
    }
    // Geometría: filas por carril, alto de carriles y pools, ancho común.
    const maxCol = Math.max(...d.nodos.map((x) => x.col));
    const ancho = 2 * CAB + MARGEN + maxCol * COLUMNA + FIN;
    let y = Y0;
    const caja = new Map();
    for (const pool of d.pools) {
      const y0 = y;
      for (const c of pool.carriles) {
        const filas = Math.max(1, ...d.nodos.filter((x) => x.carril === c.id).map((x) => x.fila + 1));
        const alto = FILA * filas + 30;
        caja.set(c.id, { x: X0 + CAB, y, width: ancho - CAB, height: alto });
        y += alto;
      }
      caja.set('pool:' + pool.id, { x: X0, y: y0, width: ancho, height: y - y0 });
      y += ENTRE_POOLS;
    }
    const centro = (x) => {
      const c = caja.get(x.carril);
      return { cx: X0 + 2 * CAB + MARGEN + x.col * COLUMNA, cy: c.y + 15 + FILA / 2 + x.fila * FILA };
    };
    const poolDe = (k) => {
      const x = nodo.get(k);
      if (!x) throw new Error(`${p.id}: no existe el nodo ${k}`);
      return poolDeCarril.get(x.carril);
    };

    // Semántica
    const colab = id(`colab${i}`);
    raices += `<bpmn:collaboration id="${colab}">`;
    for (const pool of d.pools) raices += `<bpmn:participant id="${id('pool_' + pool.id)}" name="${esc(pool.nombre)}" processRef="${id('proceso_' + pool.id)}"/>`;
    (d.mensajes || []).forEach(([a, b, nombre], k) => {
      poolDe(a); poolDe(b);
      raices += `<bpmn:messageFlow id="${id(`m${i}_${k}`)}" sourceRef="${id(a)}" targetRef="${id(b)}"${nombre ? ` name="${esc(nombre)}"` : ''}/>`;
    });
    raices += '</bpmn:collaboration>';
    const flujos = d.flujos.map(([a, b, nombre], k) => {
      if (poolDe(a) !== poolDe(b)) throw new Error(`${p.id}: la flecha ${a}→${b} cruza pools (usa un mensaje)`);
      return { id: id(`f${i}_${k}`), a, b, nombre, pool: poolDe(a) };
    });
    for (const pool of d.pools) {
      raices += `<bpmn:process id="${id('proceso_' + pool.id)}" isExecutable="false"><bpmn:laneSet id="${id('carriles_' + pool.id)}">`;
      for (const c of pool.carriles) {
        raices += `<bpmn:lane id="${id('carril_' + c.id)}" name="${esc(c.nombre)}">`;
        for (const x of d.nodos.filter((x) => x.carril === c.id)) raices += `<bpmn:flowNodeRef>${id(x.clave)}</bpmn:flowNodeRef>`;
        raices += '</bpmn:lane>';
      }
      raices += '</bpmn:laneSet>';
      for (const x of d.nodos.filter((x) => poolDeCarril.get(x.carril) === pool)) {
        const [tag, def] = TIPOS[x.tipo];
        raices += `<bpmn:${tag} id="${id(x.clave)}"${x.nombre ? ` name="${esc(x.nombre)}"` : ''}>`;
        if (x.doc) raices += `<bpmn:documentation>${esc(x.doc)}</bpmn:documentation>`;
        if (def) raices += `<bpmn:${def}EventDefinition id="${id(x.clave + '_def')}"/>`;
        raices += `</bpmn:${tag}>`;
      }
      for (const f of flujos.filter((f) => f.pool === pool)) {
        raices += `<bpmn:sequenceFlow id="${f.id}" sourceRef="${id(f.a)}" targetRef="${id(f.b)}"${f.nombre ? ` name="${esc(f.nombre)}"` : ''}/>`;
      }
      raices += '</bpmn:process>';
    }

    // Parte gráfica
    const forma = (ref, b, extra = '') => `<bpmndi:BPMNShape id="DI_${ref}" bpmnElement="${ref}"${extra}><dc:Bounds x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}"/></bpmndi:BPMNShape>`;
    let di = '';
    for (const pool of d.pools) {
      di += forma(id('pool_' + pool.id), caja.get('pool:' + pool.id), ' isHorizontal="true"');
      for (const c of pool.carriles) di += forma(id('carril_' + c.id), caja.get(c.id), ' isHorizontal="true"');
    }
    for (const x of d.nodos) {
      const { cx, cy } = centro(x), [w, h] = TAMANO(x.tipo);
      di += forma(id(x.clave), { x: cx - w / 2, y: cy - h / 2, width: w, height: h }, x.tipo === 'subproceso' ? ' isExpanded="false"' : '');
    }
    const linea = (ref, a, b) => {
      const pa = centro(nodo.get(a)), pb = centro(nodo.get(b));
      return `<bpmndi:BPMNEdge id="DI_${ref}" bpmnElement="${ref}"><di:waypoint x="${pa.cx}" y="${pa.cy}"/><di:waypoint x="${pb.cx}" y="${pb.cy}"/></bpmndi:BPMNEdge>`;
    };
    for (const f of flujos) di += linea(f.id, f.a, f.b);
    (d.mensajes || []).forEach(([a, b], k) => { di += linea(id(`m${i}_${k}`), a, b); });
    planos += `<bpmndi:BPMNDiagram id="${id(`diagrama${i}`)}" name="${esc(d.nombre)}"><bpmndi:BPMNPlane id="${id(`plano${i}`)}" bpmnElement="${colab}">${di}</bpmndi:BPMNPlane></bpmndi:BPMNDiagram>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="${id('definiciones')}" targetNamespace="http://fluye.app/bpmn" exporter="Fluye" exporterVersion="0.1.0">${raices}${planos}</bpmn:definitions>`;
}

/** "Qué trae" la plantilla, en palabras, para la galería. */
export function resumenPlantilla(p) {
  const todos = p.diagramas.flatMap((d) => d.nodos);
  const pools = p.diagramas[0].pools.length;
  const carriles = p.diagramas[0].pools.reduce((s, x) => s + x.carriles.length, 0);
  const decisiones = p.diagramas.reduce((s, d) => s + d.nodos.filter((x) => x.tipo === 'decision' && d.flujos.filter(([a]) => a === x.clave).length > 1).length, 0);
  const paralelos = todos.filter((x) => x.tipo === 'paralelo').length / 2;
  const plazos = todos.filter((x) => x.tipo === 'espera').length;
  const mensajes = p.diagramas.reduce((s, d) => s + (d.mensajes || []).length, 0);
  const plural = (k, uno, varios, art) => (k === 1 ? `${art} ${uno}` : `${k} ${varios}`);
  const partes = [];
  partes.push(pools > 1 ? `${pools} pools que se comunican` : plural(carriles, 'carril', 'carriles', 'un'));
  partes.push(plural(decisiones, 'decisión', 'decisiones', 'una'));
  if (paralelos) partes.push(plural(paralelos, 'paralelo', 'paralelos', 'un'));
  if (plazos) partes.push(plural(plazos, 'plazo', 'plazos', 'un'));
  if (mensajes && pools === 1) partes.push(plural(mensajes, 'mensaje', 'mensajes', 'un'));
  if (p.diagramas.length > 1) partes.push(plural(p.diagramas.length, 'pestaña', 'pestañas', 'una'));
  return partes.slice(0, -1).join(', ') + (partes.length > 1 ? ' y ' : '') + partes[partes.length - 1];
}
