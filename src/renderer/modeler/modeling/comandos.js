// Comandos propios con deshacer/rehacer: renombrar y cambiar propiedades de un elemento.
import { bo, esAnotacion, esGrupo, limpiarTexto, nuevoId } from '../tipos.js';

export function leerNombre(elemento) {
  const b = bo(elemento);
  if (esAnotacion(b)) return b.text || '';
  if (esGrupo(b)) return (b.categoryValueRef && b.categoryValueRef.value) || '';
  return b.name || '';
}

function escribirNombre(elemento, valor, moddle) {
  const b = bo(elemento);
  if (esAnotacion(b)) b.text = valor;
  else if (esGrupo(b)) {
    // Un grupo sin categoría (de otra herramienta) recibe una al ponerle nombre; si no, el nombre no se guardaría.
    if (!b.categoryValueRef && moddle && valor) b.categoryValueRef = moddle.create('bpmn:CategoryValue', { id: nuevoId('CategoryValue') });
    if (b.categoryValueRef) b.categoryValueRef.value = valor;
  } else b.name = valor;
}

export class RenombrarHandler {
  static $inject = ['moddle'];

  constructor(moddle) {
    this._moddle = moddle;
  }

  execute(ctx) {
    ctx.anterior = leerNombre(ctx.elemento);
    escribirNombre(ctx.elemento, typeof ctx.nombre === 'string' ? limpiarTexto(ctx.nombre) : ctx.nombre, this._moddle);
    return [ctx.elemento];
  }

  revert(ctx) {
    escribirNombre(ctx.elemento, ctx.anterior);
    return [ctx.elemento];
  }
}

/**
 * Cambia propiedades del objeto BPMN (props) y/o del elemento del diagrama (visual: colores, marcadorVisible...).
 * ctx: { elemento, props?: {}, visual?: {} }
 */
export class PropiedadesHandler {
  execute(ctx) {
    const b = bo(ctx.elemento);
    ctx.antes = { props: {}, visual: {} };
    for (const [k, v] of Object.entries(ctx.props || {})) { ctx.antes.props[k] = b.get(k); b.set(k, v); }
    for (const [k, v] of Object.entries(ctx.visual || {})) { ctx.antes.visual[k] = ctx.elemento[k]; ctx.elemento[k] = v; }
    return this._afectados(ctx);
  }

  revert(ctx) {
    const b = bo(ctx.elemento);
    for (const [k, v] of Object.entries(ctx.antes.props)) b.set(k, v);
    for (const [k, v] of Object.entries(ctx.antes.visual)) ctx.elemento[k] = v;
    return this._afectados(ctx);
  }

  _afectados(ctx) {
    const el = ctx.elemento;
    return [el, ...(el.incoming || []), ...(el.outgoing || [])];
  }
}
