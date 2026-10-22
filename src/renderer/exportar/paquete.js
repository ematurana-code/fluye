// Datos que viajan dentro de la página web exportada: el nombre del proceso y el .bpmn completo.
// Así la página se puede volver a abrir en Fluye para seguir editando.

/** Bloque JSON para <script type="application/json" id="fluye-datos">, sin ningún "<" (no puede cerrar su script ni abrir otro). */
export function empaquetar(titulo, bpmn) {
  return JSON.stringify({ formato: 'fluye-web', version: 1, titulo, bpmn }).replace(/</g, '\\u003c');
}

export function desempaquetar(texto) {
  try {
    const d = JSON.parse(texto);
    return d && d.formato === 'fluye-web' && typeof d.bpmn === 'string' ? d : null;
  } catch {
    return null;
  }
}

/** Saca los datos de una página exportada por Fluye (texto HTML). Devuelve null si no es una. */
export function datosDeHtml(html) {
  const m = /<script[^>]*\bid="fluye-datos"[^>]*>([\s\S]*?)<\/script>/i.exec(html);
  return m ? desempaquetar(m[1]) : null;
}
