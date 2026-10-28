// Google Drive en la versión web: abrir y guardar diagramas en una carpeta "Fluye" del Drive de cada persona.
// - Permiso drive.file, el más acotado: Fluye solo ve los archivos que él mismo creó o abrió, nunca el resto del Drive.
// - Sin servidor: el navegador habla directo con Google. El código de Google (Identity Services) se carga recién
//   cuando la persona usa Drive; hasta entonces la app no se conecta a Google.
// - El permiso dura la sesión de la pestaña (una hora, y se renueva solo); no se guarda en ningún lado.
import { DRIVE_CLIENT_ID } from '../config.js';

const ALCANCE = 'https://www.googleapis.com/auth/drive.file';
const API = 'https://www.googleapis.com/drive/v3';
const SUBIDA = 'https://www.googleapis.com/upload/drive/v3';
const CARPETA = 'application/vnd.google-apps.folder';

export const disponible = !!DRIVE_CLIENT_ID && !window.fluyeEscritorio;
// En la extensión de Chrome y Edge no se puede cargar código de internet (Manifest V3): el permiso se pide con
// chrome.identity.launchWebAuthFlow, que abre la misma ventana de Google y devuelve el permiso a la extensión.
// Su dirección de regreso (https://<id de la extensión>.chromiumapp.org/) tiene que estar autorizada en el cliente.
const enExtension = typeof chrome !== 'undefined' && !!chrome.identity?.launchWebAuthFlow;
export const esRutaDrive = (ruta) => typeof ruta === 'string' && ruta.startsWith('drive:');
const idDe = (ruta) => ruta.slice('drive:'.length);

export class Cancelado extends Error {}

let gis = null, token = null, vence = 0, carpeta = null;

// Carga Google Identity Services una sola vez (se llama también al abrir los menús, para que el permiso se pida
// todavía dentro del clic de la persona y el navegador no bloquee la ventana de Google).
export function preparar() {
  if (!disponible || enExtension) return Promise.resolve(null);
  if (window.google?.accounts?.oauth2) gis = Promise.resolve(window.google.accounts.oauth2);
  if (!gis) {
    gis = new Promise((resolver, rechazar) => {
      const s = Object.assign(document.createElement('script'), { src: 'https://accounts.google.com/gsi/client', async: true });
      s.onload = () => resolver(window.google.accounts.oauth2);
      s.onerror = () => { gis = null; rechazar(new Error('No se pudo conectar con Google. Revisa tu conexión a internet.')); };
      document.head.appendChild(s);
    });
  }
  return gis;
}

async function accesoExtension() {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.search = new URLSearchParams({ client_id: DRIVE_CLIENT_ID, response_type: 'token', redirect_uri: chrome.identity.getRedirectURL(), scope: ALCANCE, include_granted_scopes: 'true' });
  let regreso;
  try {
    regreso = await chrome.identity.launchWebAuthFlow({ url: url.href, interactive: true });
  } catch {
    throw new Cancelado();
  }
  const r = new URLSearchParams(new URL(regreso).hash.slice(1));
  if (r.get('error')) throw r.get('error') === 'access_denied' ? new Cancelado() : new Error('Google no dio acceso a tu Drive.');
  token = r.get('access_token');
  vence = Date.now() + Number(r.get('expires_in') || 3600) * 1000;
  return token;
}

async function acceso() {
  if (token && Date.now() < vence - 60000) return token;
  if (enExtension) return accesoExtension();
  const oauth2 = await preparar();
  return new Promise((resolver, rechazar) => {
    const cliente = oauth2.initTokenClient({
      client_id: DRIVE_CLIENT_ID,
      scope: ALCANCE,
      callback: (r) => {
        if (r.error) { rechazar(r.error === 'access_denied' ? new Cancelado() : new Error('Google no dio acceso a tu Drive.')); return; }
        token = r.access_token;
        vence = Date.now() + Number(r.expires_in || 3600) * 1000;
        resolver(token);
      },
      error_callback: (e) => rechazar(e && e.type === 'popup_closed' ? new Cancelado() : new Error('No se pudo abrir la ventana de Google. Revisa si el navegador la bloqueó.'))
    });
    cliente.requestAccessToken({ prompt: '' });
  });
}

// Una llamada a la API de Drive; si el permiso venció, se pide de nuevo una vez.
async function pedir(url, opciones = {}, reintento = true) {
  const r = await fetch(url, { ...opciones, headers: { ...(opciones.headers || {}), Authorization: `Bearer ${await acceso()}` } });
  if (r.status === 401 && reintento) { token = null; return pedir(url, opciones, false); }
  if (!r.ok) throw new Error(r.status === 404 ? 'Ese archivo ya no está en tu Drive.' : `Google Drive respondió con un error (${r.status}).`);
  return r;
}

async function carpetaFluye() {
  if (carpeta) return carpeta;
  const q = encodeURIComponent(`name = 'Fluye' and mimeType = '${CARPETA}' and trashed = false`);
  const { files } = await (await pedir(`${API}/files?q=${q}&fields=files(id)&pageSize=1`)).json();
  if (files.length) return (carpeta = files[0].id);
  const nueva = await (await pedir(`${API}/files?fields=id`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Fluye', mimeType: CARPETA })
  })).json();
  return (carpeta = nueva.id);
}

// Los procesos que Fluye guardó o abrió en este Drive, del más reciente al más antiguo.
export async function listar() {
  const q = encodeURIComponent(`mimeType != '${CARPETA}' and trashed = false`);
  const { files } = await (await pedir(`${API}/files?q=${q}&orderBy=modifiedTime desc&pageSize=100&fields=files(id,name,modifiedTime)`)).json();
  return files.filter((f) => /\.(bpmn|xml)$/i.test(f.name));
}

export async function leer(id) {
  return (await pedir(`${API}/files/${encodeURIComponent(id)}?alt=media`)).text();
}

// Crea el archivo en la carpeta Fluye y devuelve { ruta: 'drive:<id>', nombre }.
export async function crear(nombre, contenido) {
  const limite = `fluye${Math.random().toString(36).slice(2)}`;
  const meta = { name: nombre, mimeType: 'application/xml', parents: [await carpetaFluye()] };
  const cuerpo = `--${limite}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${limite}\r\nContent-Type: application/xml\r\n\r\n${contenido}\r\n--${limite}--`;
  const f = await (await pedir(`${SUBIDA}/files?uploadType=multipart&fields=id,name`, {
    method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${limite}` }, body: cuerpo
  })).json();
  return { ruta: `drive:${f.id}`, nombre: f.name };
}

export async function actualizar(ruta, contenido) {
  const f = await (await pedir(`${SUBIDA}/files/${encodeURIComponent(idDe(ruta))}?uploadType=media&fields=id,name`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/xml' }, body: contenido
  })).json();
  return { ruta, nombre: f.name };
}

export async function renombrar(ruta, nombre) {
  const f = await (await pedir(`${API}/files/${encodeURIComponent(idDe(ruta))}?fields=id,name`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: nombre })
  })).json();
  return { ruta, nombre: f.name };
}
