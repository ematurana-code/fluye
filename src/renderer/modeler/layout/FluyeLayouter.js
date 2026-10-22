// Traza las conexiones en ángulo recto (como Bizagi) y las recorta en el borde de cada figura.
import BaseLayouter from 'diagram-js/lib/layout/BaseLayouter.js';
import { connectRectangles, repairConnection, withoutRedundantPoints } from 'diagram-js/lib/layout/ManhattanLayout.js';
import { getMid, asTRBL } from 'diagram-js/lib/layout/LayoutUtil.js';
import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor.js';
import { esCompuerta, es } from '../tipos.js';

function preferidos(origen, destino) {
  const o = asTRBL(origen), d = asTRBL(destino);
  const solapaX = d.left < o.right && d.right > o.left;
  if (solapaX) return ['v:v'];
  const aLaDerecha = d.left >= o.right - 5;
  const distinto = Math.abs(getMid(origen).y - getMid(destino).y) > 20;
  if (esCompuerta(origen) && aLaDerecha && distinto) return ['v:h'];
  if (esCompuerta(destino) && aLaDerecha && distinto) return ['h:v'];
  // Flujo "hacia atrás" a otra altura: entra por arriba/abajo del destino, sin chocar con su salida por la derecha.
  if (!aLaDerecha && distinto) return ['h:v'];
  return ['h:h'];
}

export default class FluyeLayouter extends BaseLayouter {
  layoutConnection(conexion, hints = {}) {
    const origen = hints.source || conexion.source;
    const destino = hints.target || conexion.target;

    if (es(conexion, 'bpmn:SequenceFlow') || es(conexion, 'bpmn:MessageFlow')) {
      const opciones = { preferredLayouts: es(conexion, 'bpmn:MessageFlow') ? ['v:v'] : preferidos(origen, destino) };

      // Conexión ajustada a mano (se movieron sus quiebres): se conserva y solo se repara el extremo que cambió.
      if (conexion.manual && conexion.waypoints && conexion.waypoints.length > 2) {
        const inicio = hints.connectionStart || getMid(origen);
        const fin = hints.connectionEnd || getMid(destino);
        return withoutRedundantPoints(repairConnection(origen, destino, inicio, fin, conexion.waypoints, {
          ...opciones, connectionStart: !!hints.connectionStart, connectionEnd: !!hints.connectionEnd
        }));
      }

      // Lo normal: se vuelve a trazar completa entre los centros, así siempre queda unida al mover.
      return withoutRedundantPoints(connectRectangles(origen, destino, getMid(origen), getMid(destino), opciones));
    }
    return [getMid(origen), getMid(destino)];
  }
}

// Recorta los extremos de cada conexión creada o retrazada para que toquen el borde de la figura,
// y recuerda las conexiones que el usuario ajustó a mano (moviendo sus quiebres).
export class RecorteConexiones extends CommandInterceptor {
  static $inject = ['eventBus', 'connectionDocking', 'commandStack'];

  constructor(eventBus, connectionDocking, commandStack) {
    super(eventBus);
    // Al cambiar una flecha se redibujan sus extremos: el nombre de una decisión se acomoda arriba o abajo según por dónde salen.
    const redibujarExtremos = (e) => {
      const c = e.context.connection;
      if (c) commandStack._markDirty([c.source, c.target].filter(Boolean));
    };
    this.postExecuted(['connection.create', 'connection.layout', 'connection.delete', 'connection.reconnect', 'connection.updateWaypoints'], redibujarExtremos);
    this.reverted(['connection.create', 'connection.layout', 'connection.delete', 'connection.reconnect', 'connection.updateWaypoints'], redibujarExtremos);
    const recortar = (e) => {
      const ctx = e.context;
      if (ctx.recortada) return;
      ctx.connection.waypoints = connectionDocking.getCroppedWaypoints(ctx.connection);
      ctx.recortada = true;
    };
    this.executed(['connection.layout', 'connection.create'], recortar);
    this.reverted(['connection.layout'], (e) => { delete e.context.recortada; });

    this.executed('connection.updateWaypoints', (e) => {
      const ctx = e.context;
      if (ctx.hints && ctx.hints.automatico) return;
      ctx.manualAntes = ctx.connection.manual;
      ctx.connection.manual = true;
    });
    this.reverted('connection.updateWaypoints', (e) => {
      if ('manualAntes' in e.context) e.context.connection.manual = e.context.manualAntes;
    });
  }
}
