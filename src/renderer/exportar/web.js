// Página web interactiva: un solo .html con el diagrama, el Play y el .bpmn adentro.
// Se abre en cualquier navegador sin instalar nada y sin conexión; Fluye la puede volver a abrir para editar.
import plantilla from 'fluye:visor';
import { empaquetar } from './paquete.js';

const escapar = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export async function htmlInteractivo(modeler, titulo) {
  const xml = await modeler.guardarXml();
  return plantilla
    .replace('__FLUYE_TITULO__', () => `${escapar(titulo)} — Fluye`)
    .replace('__FLUYE_DATOS__', () => empaquetar(titulo, xml));
}
