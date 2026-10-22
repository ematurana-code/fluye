// Motor del Play: mueve "fichas" por el diagrama siguiendo las reglas básicas de BPMN.
// No dibuja nada: devuelve "sucesos" que la interfaz anima y anota en la bitácora.
//
// Reglas:
//  - Tarea / evento / subproceso cerrado: la ficha entra y sale por sus flechas (si hay varias, sigue por todas).
//  - Decisión exclusiva (o basada en eventos) con 2+ salidas: se pregunta el camino (uno).
//  - Decisión inclusiva con 2+ salidas: se eligen uno o varios caminos.
//  - Paralela con 2+ salidas: la ficha se divide. Unión (2+ entradas): espera una ficha por cada entrada.
//  - Unión inclusiva: espera mientras otra ficha todavía pueda llegar.
//  - Subproceso abierto con inicio adentro: se recorre por dentro y luego sigue.
//  - Fin: la ficha termina; "fin que termina todo" corta las demás fichas de su proceso (su pool o su subproceso,
//    con lo que esté corriendo dentro de sus subprocesos). Los otros pools siguen.
//  - Mensajes entre pools: cada mensaje que llega a un inicio arranca ese proceso; un evento que recibe un mensaje
//    (o una tarea de recepción) espera hasta que el otro pool lo envíe.
//  - Problemas: elemento sin salida, unión que nunca se completa (atasco), mensaje que nunca llega y ciclo que se repite demasiado.
import { es } from '../modeler/tipos.js';

export const salidas = (el) => (el.outgoing || []).filter((c) => es(c, 'bpmn:SequenceFlow'));
export const entradas = (el) => (el.incoming || []).filter((c) => es(c, 'bpmn:SequenceFlow'));
const mensajesSalientes = (el) => (el.outgoing || []).filter((c) => es(c, 'bpmn:MessageFlow'));
const esUnion = (el) => es(el, 'bpmn:ParallelGateway', 'bpmn:InclusiveGateway', 'bpmn:ComplexGateway') && entradas(el).length > 1;
const esTerminacion = (el) => (el.businessObject.eventDefinitions || []).some((d) => d.$type === 'bpmn:TerminateEventDefinition');
const esperaMensaje = (el) => es(el, 'bpmn:IntermediateCatchEvent', 'bpmn:ReceiveTask') && (el.incoming || []).some((c) => es(c, 'bpmn:MessageFlow'));

const poolDe = (el) => {
  let p = el && el.parent;
  while (p && !es(p, 'bpmn:Participant')) p = p.parent;
  return p || null;
};

export function inicioInterno(sub) {
  return (sub.children || []).find((h) => es(h, 'bpmn:StartEvent'));
}

export default class MotorPlay {
  constructor({ maxVisitas = 20 } = {}) {
    this.maxVisitas = maxVisitas;
    this.reiniciar();
  }

  reiniciar() {
    this.fila = [];                 // fichas listas para avanzar (en orden)
    this.esperando = new Map();     // unión -> [{ ficha, por }]
    this.visitas = new Map();       // elemento -> veces
    this.ambitos = new Map();       // subproceso -> { padre, activas }
    this.buzon = new Map();         // elemento que recibe mensajes -> mensajes llegados que nadie usó todavía
    this.aguardando = new Map();    // elemento que recibe mensajes -> [fichas esperando que llegue uno]
    this.pendiente = null;          // decisión pendiente
    this.terminado = false;
    this.problemas = [];
    this.decisiones = 0;
    this._id = 0;
  }

  // Elementos de inicio posibles: inicios de primer nivel que no esperan un mensaje de otro pool.
  static inicios(elementos) {
    const raiz = elementos.filter((e) => es(e, 'bpmn:StartEvent') && !es(e.parent, 'bpmn:SubProcess'));
    const libres = raiz.filter((e) => !(e.incoming || []).some((c) => es(c, 'bpmn:MessageFlow')));
    return libres.length ? libres : raiz;
  }

  iniciar(inicio) {
    this.reiniciar();
    const ficha = this._nueva(inicio, null);
    this.fila.push(ficha);
    this._visitar(inicio);
    return [{ tipo: 'llegar', ficha, elemento: inicio, vez: 1 }];
  }

  get activas() {
    return [...this.fila, ...(this.pendiente ? [this.pendiente.ficha] : [])];
  }

  // Avanza la primera ficha de la fila. Devuelve los sucesos de ese paso.
  paso() {
    if (this.terminado || this.pendiente) return [];
    const ficha = this.fila.shift();
    if (!ficha) return this._cerrar();
    const sucesos = this._avanzar(ficha);
    sucesos.push(...this._revisarUniones());
    if (!this.fila.length && !this.pendiente && !this.terminado) sucesos.push(...this._cerrar());
    return sucesos;
  }

  // Respuesta a una decisión pendiente (una o varias conexiones de salida).
  elegir(conexiones) {
    const p = this.pendiente;
    if (!p || !conexiones || !conexiones.length) return [];
    this.pendiente = null;
    this.decisiones++;
    const sucesos = [{ tipo: 'elegido', compuerta: p.compuerta, conexiones }, ...this._salir(p.ficha, conexiones)];
    sucesos.push(...this._revisarUniones());
    if (!this.fila.length && !this.pendiente && !this.terminado) sucesos.push(...this._cerrar());
    return sucesos;
  }

  // ---------- internos ----------

  _nueva(en, ambito) {
    const ficha = { id: ++this._id, en, ambito };
    if (ambito) this.ambitos.get(ambito).activas++;
    return ficha;
  }

  _visitar(el) {
    const n = (this.visitas.get(el) || 0) + 1;
    this.visitas.set(el, n);
    return n;
  }

  _problema(tipo, elemento, mensaje) {
    const p = { tipo: 'problema', clase: tipo, elemento, mensaje };
    this.problemas.push(p);
    return p;
  }

  _avanzar(ficha) {
    const el = ficha.en;
    const sucesos = [];

    // Recibe un mensaje de otro pool: si todavía no llega, la ficha espera aquí.
    if (esperaMensaje(el) && !ficha.conMensaje) {
      const llegados = this.buzon.get(el) || 0;
      if (llegados) this.buzon.set(el, llegados - 1);
      else {
        this.aguardando.set(el, [...(this.aguardando.get(el) || []), ficha]);
        return [{ tipo: 'aguardar', ficha, elemento: el }];
      }
    }
    ficha.conMensaje = false;

    // Mensajes hacia otro pool: cada uno que llega a un inicio arranca ese proceso;
    // si llega a un evento que lo está esperando, esa ficha sigue. Un subproceso abierto los envía al terminar.
    const entraASubproceso = es(el, 'bpmn:SubProcess') && !ficha.saliendo && inicioInterno(el);
    for (const m of entraASubproceso ? [] : mensajesSalientes(el)) {
      const destino = m.target;
      sucesos.push({ tipo: 'mensaje', conexion: m, desde: el, hasta: destino });
      if (es(destino, 'bpmn:StartEvent')) {
        const vez = this._visitar(destino);
        if (vez > this.maxVisitas) {
          sucesos.push(this._problema('ciclo', destino, `Llegaron ${vez} mensajes a este inicio: parece un ciclo que nunca termina.`));
          continue;
        }
        const otra = this._nueva(destino, null);
        this.fila.push(otra);
        sucesos.push({ tipo: 'llegar', ficha: otra, elemento: destino, vez, porMensaje: m });
      } else if (esperaMensaje(destino)) {
        const [quien, ...resto] = this.aguardando.get(destino) || [];
        if (resto.length) this.aguardando.set(destino, resto); else this.aguardando.delete(destino);
        if (quien) {
          quien.conMensaje = true;
          this.fila.push(quien);
          sucesos.push({ tipo: 'recibido', ficha: quien, elemento: destino, conexion: m });
        } else {
          this.buzon.set(destino, (this.buzon.get(destino) || 0) + 1);
        }
      }
    }

    if (es(el, 'bpmn:EndEvent')) return [...sucesos, ...this._finalizar(ficha)];

    // Subproceso abierto: se recorre por dentro antes de seguir.
    if (es(el, 'bpmn:SubProcess') && !ficha.saliendo) {
      const inicio = inicioInterno(el);
      if (inicio) {
        this.ambitos.set(el, { padre: ficha, activas: 0 });
        const dentro = this._nueva(inicio, el);
        this.fila.push(dentro);
        this._visitar(inicio);
        return [...sucesos, { tipo: 'entrar', elemento: el, ficha: dentro }, { tipo: 'llegar', ficha: dentro, elemento: inicio, vez: 1 }];
      }
    }
    ficha.saliendo = false;

    const s = salidas(el);
    if (!s.length) {
      this._consumir(ficha);
      return [...sucesos, this._problema('sin-salida', el, 'Este elemento no tiene flecha de salida: el flujo se corta aquí. ¿Falta conectarlo o un evento de fin?')];
    }

    const exclusiva = es(el, 'bpmn:ExclusiveGateway', 'bpmn:EventBasedGateway', 'bpmn:ComplexGateway');
    if ((exclusiva || es(el, 'bpmn:InclusiveGateway')) && s.length > 1) {
      this.pendiente = { ficha, compuerta: el, opciones: s, multiple: es(el, 'bpmn:InclusiveGateway') };
      return [...sucesos, { tipo: 'decidir', ...this.pendiente }];
    }
    return [...sucesos, ...this._salir(ficha, s)];
  }

  _salir(ficha, conexiones) {
    const sucesos = [];
    const desde = ficha.en;
    if (conexiones.length > 1) sucesos.push({ tipo: 'dividir', elemento: desde, cantidad: conexiones.length });
    conexiones.forEach((c, i) => {
      const f = i === 0 ? ficha : this._nueva(desde, ficha.ambito);
      sucesos.push({ tipo: 'mover', ficha: f, conexion: c, desde, hasta: c.target });
      sucesos.push(...this._llegar(f, c.target, c));
    });
    return sucesos;
  }

  _llegar(ficha, destino, por) {
    ficha.en = destino;
    if (esUnion(destino)) {
      const lista = this.esperando.get(destino) || [];
      lista.push({ ficha, por });
      this.esperando.set(destino, lista);
      if (!this.visitas.has(destino)) this.visitas.set(destino, 0); // llegó alguien, aunque todavía no se une
      return [{ tipo: 'esperar', ficha, elemento: destino, llegaron: lista.length, total: entradas(destino).length }];
    }
    this.fila.push(ficha);
    const vez = this._visitar(destino);
    const sucesos = [{ tipo: 'llegar', ficha, elemento: destino, por, vez }];
    if (vez > this.maxVisitas) {
      this.fila = this.fila.filter((f) => f !== ficha);
      this._consumir(ficha);
      sucesos.push(this._problema('ciclo', destino, `Se pasó ${vez} veces por aquí: parece un ciclo que nunca termina.`));
    }
    return sucesos;
  }

  // Une las fichas que esperan en una compuerta cuando ya no falta ninguna.
  _revisarUniones() {
    const sucesos = [];
    for (const [union, lista] of [...this.esperando]) {
      let usados = null;
      if (es(union, 'bpmn:ParallelGateway')) {
        const ent = entradas(union);
        if (ent.every((c) => lista.some((x) => x.por === c))) usados = ent.map((c) => lista.find((x) => x.por === c));
      } else if (!this._alguienPuedeLlegar(union)) {
        usados = [...lista];
      }
      if (!usados) continue;
      const restantes = lista.filter((x) => !usados.includes(x));
      if (restantes.length) this.esperando.set(union, restantes); else this.esperando.delete(union);
      const ficha = usados[0].ficha;
      for (const x of usados.slice(1)) this._consumir(x.ficha);
      ficha.en = union;
      this.fila.push(ficha);
      this._visitar(union);
      sucesos.push({ tipo: 'unir', ficha, elemento: union, cantidad: usados.length, unidas: usados.map((x) => x.ficha) });
    }
    return sucesos;
  }

  // ¿Alguna ficha activa (o esperando en otra unión) todavía puede llegar a este elemento?
  _alguienPuedeLlegar(destino) {
    const origenes = [...this.activas.map((f) => f.en)];
    for (const [union, lista] of this.esperando) if (union !== destino && lista.length) origenes.push(union);
    for (const [el, lista] of this.aguardando) if (lista.length) origenes.push(el);
    for (const [sub] of this.ambitos) origenes.push(sub); // quien está dentro de un subproceso sigue desde él al salir
    const vistos = new Set();
    const pila = [...origenes];
    while (pila.length) {
      const el = pila.pop();
      if (el === destino) return true;
      if (vistos.has(el)) continue;
      vistos.add(el);
      for (const c of salidas(el)) pila.push(c.target);
    }
    return false;
  }

  // ¿La ficha está en el proceso que termina (mismo subproceso, o mismo pool si es el primer nivel), o dentro de un
  // subproceso de ese proceso?
  _alcanza(f, ambito, pool) {
    let x = f;
    while (x.ambito) {
      if (x.ambito === ambito) return true;
      const a = this.ambitos.get(x.ambito);
      if (!a) return false;
      x = a.padre;
    }
    return !ambito && poolDe(x.en) === pool;
  }

  _consumir(ficha) {
    if (!ficha.ambito) return [];
    const a = this.ambitos.get(ficha.ambito);
    if (!a) return [];
    a.activas--;
    if (a.activas > 0) return [];
    // Terminó todo lo de adentro del subproceso: la ficha de afuera sigue.
    this.ambitos.delete(ficha.ambito);
    a.padre.saliendo = true;
    a.padre.en = ficha.ambito;
    this.fila.push(a.padre);
    return [{ tipo: 'salir', elemento: ficha.ambito, ficha: a.padre }];
  }

  _finalizar(ficha) {
    const el = ficha.en;
    const sucesos = [{ tipo: 'fin', ficha, elemento: el, terminacion: esTerminacion(el) }];
    if (esTerminacion(el)) {
      const ambito = ficha.ambito, pool = poolDe(el);
      const mismo = (f) => f !== ficha && this._alcanza(f, ambito, pool);
      const cortadas = this.fila.filter(mismo);
      const limpiar = []; // uniones y eventos que quedan sin nadie esperando: se les quita la insignia
      this.fila = this.fila.filter((f) => !mismo(f));
      for (const [u, lista] of [...this.esperando]) {
        const quedan = lista.filter((x) => !mismo(x.ficha));
        cortadas.push(...lista.filter((x) => mismo(x.ficha)).map((x) => x.ficha));
        if (quedan.length) this.esperando.set(u, quedan); else { this.esperando.delete(u); limpiar.push(u); }
      }
      for (const [e, lista] of [...this.aguardando]) {
        const quedan = lista.filter((x) => !mismo(x));
        cortadas.push(...lista.filter(mismo));
        if (quedan.length) this.aguardando.set(e, quedan); else { this.aguardando.delete(e); limpiar.push(e); }
      }
      // Los subprocesos de este proceso que estaban corriendo se terminan también (la ficha de afuera no sigue).
      for (const [sub, a] of [...this.ambitos]) {
        if (sub !== ambito && mismo(a.padre)) { this.ambitos.delete(sub); cortadas.push(a.padre); }
      }
      if (this.pendiente && mismo(this.pendiente.ficha)) { limpiar.push(this.pendiente.compuerta); this.pendiente = null; }
      if (cortadas.length || limpiar.length) sucesos.push({ tipo: 'cortar', fichas: cortadas, elementos: limpiar, elemento: el });
      if (ficha.ambito) {
        const a = this.ambitos.get(ficha.ambito);
        if (a) a.activas = 1;
      }
    }
    sucesos.push(...this._consumir(ficha));
    return sucesos;
  }

  _cerrar() {
    if (this.terminado) return [];
    this.terminado = true;
    const sucesos = [];
    for (const [union, lista] of this.esperando) {
      const total = entradas(union).length;
      sucesos.push(this._problema('atasco', union,
        `Atasco: esta unión espera ${total} caminos y solo llegaron ${lista.length}. Los demás nunca llegan (¿se abrió con una decisión exclusiva en vez de paralela?).`));
    }
    for (const [el] of this.aguardando) {
      sucesos.push(this._problema('sin-mensaje', el, 'Aquí se espera un mensaje que nunca llega: revisa que el otro pool lo envíe en este camino.'));
    }
    sucesos.push({ tipo: 'terminado', ok: !this.problemas.length });
    return sucesos;
  }
}
