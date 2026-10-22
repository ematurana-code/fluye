// Interfaz del Play: anima las fichas del motor sobre el diagrama, pregunta en las decisiones y lleva la bitácora.
// Durante el Play el diagrama queda en solo lectura. Todo texto que viene del modelo se muestra con textContent.
import { create as svgCreate, attr as svgAttr, append as svgAppend, remove as svgRemove } from 'tiny-svg';
import MotorPlay from './motor.js';
import { bo, es, esCarril, esCompuerta, esPool, nombreTipo } from '../modeler/tipos.js';
import { icono } from '../iconos.js';

const MARCAS = ['fl-activo', 'fl-hecho', 'fl-problema', 'fl-esperando', 'fl-recorrida', 'fl-carril-activo', 'fl-opcion'];
const VELOCIDADES = [0.5, 1, 2, 4];
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

function el(tag, clase, texto) {
  const n = document.createElement(tag);
  if (clase) n.className = clase;
  if (texto !== undefined) n.textContent = texto;
  return n;
}

const nombreDe = (e) => (e && bo(e).name) || nombreTipo(e);

export default class Play {
  constructor(modeler, { bitacora, barra, alCambiar }) {
    this.modeler = modeler;
    this.canvas = modeler.get('canvas');
    this.overlays = modeler.get('overlays');
    this.registro = modeler.get('elementRegistry');
    this.$bitacora = bitacora;
    this.$barra = barra;
    this.alCambiar = alCambiar || (() => {});
    this.motor = new MotorPlay();
    this.activo = false;
    this.corriendo = false;
    this.velocidad = 1;
    this.azar = false;
    this.marcados = new Set();
    this.fichas = new Map();
    this.fase = 0;
    this._resolverDecision = null;
    // corrida cambia al empezar o salir: lo que estaba animándose de antes ya no se aplica.
    // bucle cambia al reproducir, pausar o salir: así nunca quedan dos bucles avanzando a la vez.
    this.corrida = 0;
    this.bucle = 0;
    this._pasoEnCurso = null;
    this._armarBarra();
  }

  // ---------- entrar / salir ----------

  async iniciar(elegirInicio) {
    const inicios = MotorPlay.inicios(this.registro.getAll());
    if (!inicios.length) return { error: 'Agrega un evento de inicio (círculo verde) para poder recorrer el proceso.' };
    const inicio = inicios.length === 1 ? inicios[0] : await elegirInicio(inicios.map((i) => ({ elemento: i, texto: `${nombreDe(i)} · ${nombreDe(this._poolDe(i)) || 'Proceso'}` })));
    if (!inicio) return { cancelado: true };
    this.inicio = inicio;
    this.activo = true;
    // Servicios de edición: en el visor de la página web no existen.
    this.modeler.get('selection', false)?.select(null);
    this.modeler.get('contextPad', false)?.close();
    const edicion = this.modeler.get('directEditing', false);
    if (edicion?.isActive()) edicion.complete();
    this.modeler.get('conectarDesdeBorde', false)?.bloquear(true);
    this.modeler.get('keyboard', false)?.unbind(); // Supr, Ctrl+A y compañía no tocan el diagrama durante el Play
    this.capa = this.canvas.getLayer('fl-play', 1000);
    // Con el diagrama muy alejado no se leen los nombres: el Play se acerca al inicio y al salir vuelve la vista de antes.
    const vb = this.canvas.viewbox();
    if (vb.scale < 0.6 && vb.outer) {
      this._vistaAntes = { x: vb.x, y: vb.y, width: vb.width, height: vb.height };
      const ancho = vb.outer.width / 0.85, alto = vb.outer.height / 0.85;
      // Se muestra el pool desde arriba si el inicio igual queda a la vista; si no, el inicio al centro.
      const pool = this._poolDe(inicio);
      let y = inicio.y + inicio.height / 2 - alto / 2;
      if (pool && pool.y - 40 < y && inicio.y + inicio.height + 80 <= pool.y - 40 + alto) y = pool.y - 40;
      this.canvas.viewbox({ x: inicio.x - 140, y, width: ancho, height: alto });
    }
    document.body.classList.add('en-play');
    this.$barra.hidden = false;
    this.alCambiar(true);
    this._comenzar();
    this.reproducir();
    return { ok: true };
  }

  salir() {
    if (!this.activo) return;
    this.corriendo = false;
    this.activo = false;
    this.corrida++;
    this.bucle++;
    this._limpiar();
    this.$barra.hidden = true;
    document.body.classList.remove('en-play');
    this.modeler.get('conectarDesdeBorde', false)?.bloquear(false);
    this.modeler.get('keyboard', false)?.bind();
    if (this._vistaAntes) { this.canvas.viewbox(this._vistaAntes); this._vistaAntes = null; }
    this.alCambiar(false);
  }

  _comenzar() {
    this.corrida++;
    this._pasoEnCurso = null;
    this._limpiar();
    this.fase = 0;
    this.$bitacora.replaceChildren();
    const cab = el('div', 'fl-bit-cabecera');
    cab.append(el('strong', '', 'Recorrido del proceso'), el('small', '', 'Cada paso aparece aquí. En las decisiones eliges el camino.'));
    this.$lista = el('ol', 'fl-bit-lista');
    this.$bitacora.append(cab, this.$lista);
    this._aplicar(this.motor.iniciar(this.inicio));
    this._actualizarBarra();
  }

  _limpiar() {
    for (const e of this.marcados) for (const m of MARCAS) this.canvas.removeMarker(e, m);
    this.marcados.clear();
    this.overlays.remove({ type: 'fl-play' });
    for (const f of this.fichas.values()) svgRemove(f.nodo);
    this.fichas.clear();
    this._resolverDecision = null;
  }

  // ---------- controles ----------

  async reproducir() {
    if (!this.activo || this.corriendo) return;
    const bucle = ++this.bucle;
    const vigente = () => this.bucle === bucle && this.corriendo && this.activo && !this.motor.terminado;
    this.corriendo = true;
    this._actualizarBarra();
    while (vigente()) {
      if (this.motor.pendiente) {
        if (this.azar) await this._decidirAlAzar();
        else await new Promise((r) => { this._resolverDecision = r; });
        continue;
      }
      await this._unPaso();
      await dormir(650 / this.velocidad);
    }
    if (this.bucle !== bucle) return; // lo reemplazó otro bucle (pausa y seguir, reiniciar o salir)
    this.corriendo = false;
    this._actualizarBarra();
  }

  pausar() {
    this.bucle++;
    this.corriendo = false;
    this._actualizarBarra();
  }

  async pasoSiguiente() {
    if (this.motor.terminado) return;
    const enCurso = this._pasoEnCurso;
    this.pausar();
    if (enCurso) { await enCurso; this._actualizarBarra(); return; } // el paso que se estaba animando cuenta como este
    if (this.motor.pendiente) {
      if (this.azar) { await this._decidirAlAzar(); this._actualizarBarra(); } else this._resaltarDecision();
      return;
    }
    await this._unPaso();
    this._actualizarBarra();
  }

  reiniciar() {
    this.corriendo = false;
    this._comenzar();
    this.reproducir();
  }

  _unPaso() {
    if (this._pasoEnCurso) return this._pasoEnCurso;
    const paso = this._aplicar(this.motor.paso()).finally(() => { if (this._pasoEnCurso === paso) this._pasoEnCurso = null; });
    this._pasoEnCurso = paso;
    return paso;
  }

  async _decidirAlAzar() {
    const p = this.motor.pendiente;
    let elegidas;
    if (p.multiple) {
      elegidas = p.opciones.filter(() => Math.random() < 0.5);
      if (!elegidas.length) elegidas = [p.opciones[Math.floor(Math.random() * p.opciones.length)]];
    } else elegidas = [p.opciones[Math.floor(Math.random() * p.opciones.length)]];
    this.overlays.remove({ element: p.compuerta, type: 'fl-play' });
    await this._aplicar(this.motor.elegir(elegidas));
  }

  async _elegir(conexiones) {
    const p = this.motor.pendiente;
    if (!p) return;
    this.overlays.remove({ element: p.compuerta, type: 'fl-play' });
    for (const c of p.opciones) this.canvas.removeMarker(c, 'fl-opcion');
    await this._aplicar(this.motor.elegir(conexiones));
    this._actualizarBarra();
    const r = this._resolverDecision;
    this._resolverDecision = null;
    if (r) r(); else if (!this.corriendo) this.reproducir();
  }

  // ---------- aplicar sucesos ----------

  async _aplicar(sucesos) {
    const corrida = this.corrida;
    const movimientos = sucesos.filter((s) => s.tipo === 'mover');
    for (const s of movimientos) this._marcarSalida(s.desde, s.ficha);
    await Promise.all(movimientos.map((s) => this._animar(s.ficha, s.conexion)));
    if (this.corrida !== corrida) return; // se reinició o se salió mientras se animaba
    for (const s of sucesos) this._suceso(s);
    this._actualizarCarriles();
  }

  _suceso(s) {
    switch (s.tipo) {
      case 'llegar': {
        this._marcar(s.elemento, 'fl-activo');
        if (!this.fichas.has(s.ficha.id)) this._ponerFicha(s.ficha, this._puntoLlegada(s.elemento, s.por));
        this._verSiHaceFalta(s.elemento);
        if (!esCompuerta(s.elemento) && !es(s.elemento, 'bpmn:EndEvent')) {
          this.fase++;
          const extra = s.vez > 1 ? ` (vez ${s.vez})` : '';
          this._log(`${this.fase}`, nombreDe(s.elemento) + extra, this._carrilDe(s.elemento), es(s.elemento, 'bpmn:StartEvent') ? 'inicio' : '');
        }
        break;
      }
      case 'dividir':
        this._log('⇉', `Se divide en ${s.cantidad} caminos en paralelo`, nombreDe(s.elemento), 'info');
        break;
      case 'esperar': {
        this._marcar(s.elemento, 'fl-esperando');
        this._insignia(s.elemento, `Esperando ${s.llegaron} de ${s.total}`, 'espera');
        this._log('⧗', `Espera en "${nombreDe(s.elemento)}": llegó ${s.llegaron} de ${s.total} caminos`, '', 'info');
        break;
      }
      case 'unir': {
        for (const f of s.unidas.slice(1)) this._quitarFicha(f);
        this.overlays.remove({ element: s.elemento, type: 'fl-play' });
        this.canvas.removeMarker(s.elemento, 'fl-esperando');
        this._marcar(s.elemento, 'fl-activo');
        this._log('⇇', `Se juntan ${s.cantidad} caminos`, nombreDe(s.elemento), 'info');
        break;
      }
      case 'decidir':
        this._marcar(s.compuerta, 'fl-activo');
        this._verSiHaceFalta(s.compuerta);
        if (!this.azar) this._mostrarDecision(s);
        setTimeout(() => this._actualizarBarra(), 0);
        break;
      case 'elegido': {
        const nombres = s.conexiones.map((c) => this._textoOpcion(c)).join(' + ');
        this._log('◆', `${nombreDe(s.compuerta)} → ${nombres}`, '', 'decision');
        for (const c of s.conexiones) this._marcar(c, 'fl-recorrida');
        break;
      }
      case 'entrar':
        this._marcar(s.elemento, 'fl-activo');
        this._log('↘', `Entra al subproceso "${nombreDe(s.elemento)}"`, '', 'info');
        break;
      case 'salir':
        this._log('↗', `Sale del subproceso "${nombreDe(s.elemento)}"`, '', 'info');
        this._ponerFicha(s.ficha, this._centro(s.elemento));
        break;
      case 'mensaje':
        this._marcar(s.conexion, 'fl-recorrida');
        this._log('✉', `Envía un mensaje a "${nombreDe(s.hasta)}"`, '', 'info');
        break;
      case 'aguardar':
        this._marcar(s.elemento, 'fl-esperando');
        this._insignia(s.elemento, 'Esperando mensaje', 'espera');
        this._log('⧗', `"${nombreDe(s.elemento)}" espera el mensaje del otro pool`, this._carrilDe(s.elemento), 'info');
        break;
      case 'recibido':
        this.overlays.remove({ element: s.elemento, type: 'fl-play' });
        this.canvas.removeMarker(s.elemento, 'fl-esperando');
        this._marcar(s.elemento, 'fl-activo');
        this._log('✉', `Llegó el mensaje: sigue "${nombreDe(s.elemento)}"`, this._carrilDe(s.elemento), 'info');
        break;
      case 'fin':
        this._desmarcarActivo(s.elemento);
        this._marcar(s.elemento, 'fl-hecho');
        this._quitarFicha(s.ficha);
        this.fase++;
        this._log(`${this.fase}`, s.terminacion ? `Fin que termina todo: ${nombreDe(s.elemento)}` : `Fin: ${nombreDe(s.elemento)}`, this._carrilDe(s.elemento), 'fin');
        break;
      case 'cortar':
        for (const f of s.fichas) this._quitarFicha(f);
        for (const e of s.elementos || []) {
          this.overlays.remove({ element: e, type: 'fl-play' });
          this.canvas.removeMarker(e, 'fl-esperando');
        }
        break;
      case 'problema':
        this._marcar(s.elemento, 'fl-problema');
        this._insignia(s.elemento, s.mensaje, 'problema');
        this._log('!', s.mensaje, nombreDe(s.elemento), 'problema');
        this.corriendo = false;
        break;
      case 'terminado':
        this._resumen(s.ok);
        break;
      default:
    }
  }

  // ---------- dibujo ----------

  _marcar(e, marca) {
    this.canvas.addMarker(e, marca);
    this.marcados.add(e);
  }

  _desmarcarActivo(e) {
    this.canvas.removeMarker(e, 'fl-activo');
  }

  _marcarSalida(desde, ficha) {
    const otras = [...this.motor.activas, ...[...this.motor.esperando.values()].flat().map((x) => x.ficha)].some((f) => f !== ficha && f.en === desde);
    if (!otras) this._desmarcarActivo(desde);
    this._marcar(desde, 'fl-hecho');
  }

  _centro(e) {
    return { x: e.x + e.width / 2, y: e.y + e.height / 2 };
  }

  _puntoLlegada(e, por) {
    if (por && por.waypoints && por.waypoints.length) return por.waypoints[por.waypoints.length - 1];
    return this._centro(e);
  }

  _ponerFicha(ficha, punto) {
    let f = this.fichas.get(ficha.id);
    if (!f) {
      const g = svgCreate('g');
      svgAttr(g, { class: 'fl-ficha' });
      const halo = svgCreate('circle');
      svgAttr(halo, { r: 13, class: 'fl-ficha-halo' });
      const c = svgCreate('circle');
      svgAttr(c, { r: 8, class: 'fl-ficha-punto' });
      svgAppend(g, halo);
      svgAppend(g, c);
      svgAppend(this.capa, g);
      f = { nodo: g };
      this.fichas.set(ficha.id, f);
    }
    svgAttr(f.nodo, { transform: `translate(${punto.x} ${punto.y})` });
    f.punto = punto;
  }

  _quitarFicha(ficha) {
    const f = this.fichas.get(ficha.id);
    if (!f) return;
    svgRemove(f.nodo);
    this.fichas.delete(ficha.id);
  }

  _animar(ficha, conexion) {
    const puntos = conexion.waypoints || [];
    if (!this.fichas.has(ficha.id)) this._ponerFicha(ficha, puntos[0] || this._centro(conexion.source));
    this._marcar(conexion, 'fl-recorrida');
    const tramos = [];
    let total = 0;
    for (let i = 1; i < puntos.length; i++) {
      const d = Math.hypot(puntos[i].x - puntos[i - 1].x, puntos[i].y - puntos[i - 1].y);
      tramos.push(d);
      total += d;
    }
    const duracion = Math.max(260, Math.min(1400, total / 0.32)) / this.velocidad;
    const corrida = this.corrida;
    return new Promise((resolver) => {
      const t0 = performance.now();
      const cuadro = (t) => {
        if (this.corrida !== corrida) return resolver(); // no volver a dibujar una ficha de un recorrido ya limpiado
        const k = Math.min(1, (t - t0) / duracion);
        const suave = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        let falta = suave * total, i = 0;
        while (i < tramos.length - 1 && falta > tramos[i]) { falta -= tramos[i]; i++; }
        const a = puntos[i], b = puntos[i + 1] || a, r = tramos[i] ? falta / tramos[i] : 1;
        this._ponerFicha(ficha, { x: a.x + (b.x - a.x) * r, y: a.y + (b.y - a.y) * r });
        if (k < 1 && this.activo) requestAnimationFrame(cuadro); else resolver();
      };
      requestAnimationFrame(cuadro);
    });
  }

  _insignia(e, texto, clase) {
    const n = el('div', `fl-play-insignia fl-play-${clase}`, clase === 'problema' ? '!' : '');
    if (clase === 'problema') n.title = texto; else n.textContent = texto;
    this.overlays.add(e, 'fl-play', { position: { top: -12, right: clase === 'problema' ? 10 : 0 }, html: n, scale: { min: 1 } });
  }

  _actualizarCarriles() {
    const activos = this.motor.activas.map((f) => f.en);
    for (const l of this.registro.filter(esCarril)) {
      const tiene = activos.some((e) => this._dentro(e, l));
      if (tiene) this._marcar(l, 'fl-carril-activo'); else this.canvas.removeMarker(l, 'fl-carril-activo');
    }
  }

  _dentro(e, carril) {
    if (!e || e.waypoints) return false;
    const c = this._centro(e);
    return c.x >= carril.x && c.x <= carril.x + carril.width && c.y >= carril.y && c.y <= carril.y + carril.height;
  }

  _carrilDe(e) {
    const carril = this.registro.filter(esCarril).find((l) => this._dentro(e, l));
    return carril ? nombreDe(carril) : '';
  }

  _poolDe(e) {
    let p = e && e.parent;
    while (p && !esPool(p)) p = p.parent;
    return p;
  }

  _verSiHaceFalta(e) {
    const vb = this.canvas.viewbox();
    const dentro = e.x >= vb.x && e.y >= vb.y && e.x + e.width <= vb.x + vb.width && e.y + e.height <= vb.y + vb.height;
    if (!dentro) this.canvas.scrollToElement(e, { top: 120, bottom: 160, left: 160, right: 160 });
  }

  // ---------- decisiones ----------

  _textoOpcion(c) {
    const n = bo(c).name;
    return n ? n : `ir a "${this._destinoLegible(c)}"`;
  }

  // A qué pasos lleva un camino: si llega a una compuerta sin nombre (un paralelo, una unión), se nombran
  // los pasos que vienen después, para que la tarjeta no diga solo "Paralelo".
  _destinoLegible(c) {
    const nombrados = [];
    const vistos = new Set();
    const pila = [c.target];
    while (pila.length && nombrados.length < 3) {
      const e = pila.shift();
      if (!e || vistos.has(e)) continue;
      vistos.add(e);
      if (bo(e).name || !esCompuerta(e)) { nombrados.push(nombreDe(e)); continue; }
      for (const s of (e.outgoing || []).filter((x) => es(x, 'bpmn:SequenceFlow'))) pila.push(s.target);
    }
    if (!nombrados.length) return nombreDe(c.target);
    return nombrados.length === 1 ? nombrados[0] : `${nombrados.slice(0, -1).join(', ')} y ${nombrados[nombrados.length - 1]}`;
  }

  _mostrarDecision({ compuerta, opciones, multiple }) {
    const tarjeta = el('div', 'fl-decision');
    tarjeta.append(el('div', 'fl-decision-titulo', bo(compuerta).name || '¿Qué camino sigue?'));
    tarjeta.append(el('div', 'fl-decision-ayuda', multiple ? 'Marca uno o varios caminos' : 'Elige el camino'));
    const marcadas = new Set();
    for (const c of opciones) {
      const b = el('button', 'fl-decision-opcion');
      b.type = 'button';
      const texto = el('span', '', this._textoOpcion(c));
      const destino = el('small', '', bo(c).name ? `→ ${this._destinoLegible(c)}` : '');
      b.append(texto, destino);
      b.addEventListener('mouseenter', () => this._marcar(c, 'fl-opcion'));
      b.addEventListener('mouseleave', () => this.canvas.removeMarker(c, 'fl-opcion'));
      b.addEventListener('click', () => {
        if (!multiple) return this._elegir([c]);
        if (marcadas.has(c)) { marcadas.delete(c); b.classList.remove('marcada'); } else { marcadas.add(c); b.classList.add('marcada'); }
        continuar.disabled = !marcadas.size;
      });
      tarjeta.append(b);
    }
    let continuar = null;
    if (multiple) {
      continuar = el('button', 'btn btn-primary btn-sm fl-decision-continuar', 'Continuar');
      continuar.type = 'button';
      continuar.disabled = true;
      continuar.addEventListener('click', () => this._elegir([...marcadas]));
      tarjeta.append(continuar);
    }
    // scale.min 1: con el diagrama alejado la tarjeta no se achica (sigue legible).
    this.overlays.add(compuerta, 'fl-play', { position: { top: -8, left: compuerta.width + 14 }, html: tarjeta, scale: { min: 1 } });
    requestAnimationFrame(() => this._mostrarEntera(tarjeta));
    this._log('?', `Decisión: ${bo(compuerta).name || 'elige el camino'}`, this._carrilDe(compuerta), 'pregunta');
  }

  // Si la tarjeta queda cortada por un borde (o tapada por la barra del Play), se corre la vista lo justo.
  _mostrarEntera(nodo) {
    if (!nodo.isConnected) return;
    const r = nodo.getBoundingClientRect(), c = this.canvas.getContainer().getBoundingClientRect();
    const m = 12, abajo = this.$barra.offsetHeight + 30;
    let dx = 0, dy = 0;
    if (r.right > c.right - m) dx = c.right - m - r.right;
    if (r.left + dx < c.left + m) dx = c.left + m - r.left;
    if (r.bottom > c.bottom - abajo) dy = c.bottom - abajo - r.bottom;
    if (r.top + dy < c.top + m) dy = c.top + m - r.top;
    if (dx || dy) this.canvas.scroll({ dx, dy });
  }

  _resaltarDecision() {
    const t = document.querySelector('.fl-decision');
    if (!t) return;
    t.classList.remove('llamar');
    void t.offsetWidth;
    t.classList.add('llamar');
  }

  // ---------- bitácora ----------

  _log(numero, texto, detalle, clase = '') {
    const li = el('li', `fl-bit-item ${clase}`);
    li.append(el('span', 'fl-bit-num', numero));
    const cuerpo = el('div', 'fl-bit-texto');
    cuerpo.append(el('span', '', texto));
    if (detalle) cuerpo.append(el('small', '', detalle));
    li.append(cuerpo);
    this.$lista.append(li);
    li.scrollIntoView({ block: 'nearest' });
  }

  _resumen(ok) {
    const nodos = this.registro.filter((e) => !e.waypoints && es(e, 'bpmn:FlowNode') && !es(e, 'bpmn:BoundaryEvent'));
    const sinPasar = nodos.filter((n) => !this.motor.visitas.has(n));
    const caja = el('div', `fl-bit-resumen ${ok ? 'ok' : 'mal'}`);
    caja.append(el('strong', '', ok ? '✓ El proceso llegó al final' : '✗ El recorrido encontró problemas'));
    const datos = el('ul');
    const plural = (k, uno, varios) => `${k} ${k === 1 ? uno : varios}`;
    datos.append(el('li', '', plural(this.fase, 'fase recorrida', 'fases recorridas')), el('li', '', plural(this.motor.decisiones, 'decisión tomada', 'decisiones tomadas')));
    if (this.motor.problemas.length) datos.append(el('li', '', `${this.motor.problemas.length} problema(s) marcados en rojo`));
    if (sinPasar.length) {
      const nombres = sinPasar.slice(0, 4).map(nombreDe).join(', ') + (sinPasar.length > 4 ? '…' : '');
      datos.append(el('li', '', `Sin recorrer: ${nombres}. Prueba otro camino con "Reiniciar".`));
    }
    caja.append(datos);
    this.$bitacora.append(caja);
    caja.scrollIntoView({ block: 'nearest' });
  }

  // ---------- barra de controles ----------

  _armarBarra() {
    const b = this.$barra;
    b.className = 'fl-play-barra';
    b.hidden = true;
    const boton = (id, titulo, iconoNombre, texto) => {
      const x = el('button', 'fl-play-btn');
      x.type = 'button';
      x.id = id;
      x.title = titulo;
      x.innerHTML = icono(iconoNombre, 17); // ícono fijo del código
      if (texto) x.append(el('span', '', texto));
      return x;
    };
    this.$play = boton('play-reproducir', 'Reproducir / pausar (Espacio)', 'play', 'Reproducir');
    this.$paso = boton('play-paso', 'Paso siguiente (→)', 'pasoSiguiente', 'Paso');
    this.$reiniciar = boton('play-reiniciar', 'Volver a empezar', 'reiniciar', 'Reiniciar');
    this.$vel = el('button', 'fl-play-btn fl-play-vel', '1×');
    this.$vel.type = 'button';
    this.$vel.title = 'Velocidad';
    this.$azar = el('button', 'fl-play-btn fl-play-modo', 'Decisiones: preguntar');
    this.$azar.type = 'button';
    this.$azar.title = 'Preguntar en cada decisión o decidir al azar';
    this.$salir = boton('play-salir', 'Salir del Play (Esc)', 'cerrar', 'Salir');
    this.$estado = el('span', 'fl-play-estado', '');
    b.append(this.$play, this.$paso, this.$reiniciar, el('span', 'fl-play-sep'), this.$vel, this.$azar, el('span', 'fl-play-sep'), this.$estado, this.$salir);

    this.$play.addEventListener('click', () => (this.corriendo ? this.pausar() : this.reproducir()));
    this.$paso.addEventListener('click', () => this.pasoSiguiente());
    this.$reiniciar.addEventListener('click', () => this.reiniciar());
    this.$vel.addEventListener('click', () => {
      this.velocidad = VELOCIDADES[(VELOCIDADES.indexOf(this.velocidad) + 1) % VELOCIDADES.length];
      this._actualizarBarra();
    });
    this.$azar.addEventListener('click', () => {
      this.azar = !this.azar;
      if (this.azar && this.motor.pendiente) {
        this.overlays.remove({ element: this.motor.pendiente.compuerta, type: 'fl-play' });
        this._decidirAlAzar().then(() => { const r = this._resolverDecision; this._resolverDecision = null; if (r) r(); });
      }
      this._actualizarBarra();
    });
    this.$salir.addEventListener('click', () => this.salir());
    window.addEventListener('keydown', (e) => {
      if (!this.activo || /INPUT|TEXTAREA/.test(document.activeElement?.tagName || '') || document.querySelector('.modal-overlay')) return;
      if (e.key === 'Escape') { e.preventDefault(); this.salir(); }
      else if (e.key === ' ') {
        if (document.activeElement?.closest?.('.fl-decision')) return; // Espacio sobre un camino de la decisión lo elige
        e.preventDefault();
        this.corriendo ? this.pausar() : this.reproducir();
      }
      else if (e.key === 'ArrowRight') { e.preventDefault(); this.pasoSiguiente(); }
    }, true);
  }

  _actualizarBarra() {
    if (!this.$play) return;
    const fin = this.motor.terminado;
    this.$play.innerHTML = icono(this.corriendo ? 'pausa' : 'play', 17);
    this.$play.append(el('span', '', this.corriendo ? 'Pausa' : fin ? 'Terminado' : 'Reproducir'));
    this.$play.disabled = fin;
    this.$paso.disabled = fin;
    this.$vel.textContent = `${this.velocidad}×`;
    // "Decisiones:" va aparte para que la página web lo pueda ocultar en pantallas angostas.
    this.$azar.replaceChildren(el('span', 'fl-play-modo-etiqueta', 'Decisiones: '), this.azar ? 'al azar' : 'preguntar');
    this.$azar.classList.toggle('activo', this.azar);
    this.$estado.textContent = fin ? (this.motor.problemas.length ? 'Con problemas' : 'Llegó al final') : this.motor.pendiente && !this.azar ? 'Esperando tu decisión' : this.corriendo ? 'Recorriendo…' : 'En pausa';
  }
}
