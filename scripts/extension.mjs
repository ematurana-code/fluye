// Arma la extensión de Fluye para Chrome y Edge (Manifest V3): el mismo programa de la versión web, completo y sin
// internet, que se abre en una pestaña al pulsar su ícono. Google Drive funciona con chrome.identity (ver ui/drive.js).
// Uso: node scripts/extension.mjs (primero npm run build). Deja <salida>/extension/ (para "Cargar descomprimida") y
// <salida>/Fluye-extension-<versión>.zip (para subir a Chrome Web Store y Edge Add-ons).
// Dónde queda: FLUYE_SALIDA si está definida; si no, la carpeta "instalador" del proyecto.
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';

const raiz = join(import.meta.dirname, '..');
const web = join(raiz, 'dist', 'renderer');
if (!existsSync(join(web, 'index.html'))) throw new Error('Falta compilar la app: ejecuta primero npm run build.');
const { version } = JSON.parse(readFileSync(join(raiz, 'package.json'), 'utf8'));
const salida = resolve(process.env.FLUYE_SALIDA || join(raiz, 'instalador'));
const carpeta = join(salida, 'extension');

rmSync(carpeta, { recursive: true, force: true });
mkdirSync(carpeta, { recursive: true });
// La app sin mapas de código ni lo propio de la versión web instalable (en una extensión no hay service worker
// de página ni manifiesto web: la extensión ya funciona sin internet).
cpSync(web, carpeta, { recursive: true, filter: (r) => !/\.map$|sw\.js$|manifest\.webmanifest$/.test(r) });
const indice = join(carpeta, 'index.html');
writeFileSync(indice, readFileSync(indice, 'utf8').replace(/\n<link rel="manifest" href="manifest.webmanifest">/, ''));

const iconos = {};
for (const t of [16, 32, 48, 128]) {
  cpSync(join(raiz, 'build', `icono-${t}.png`), join(carpeta, `icono-${t}.png`));
  iconos[t] = `icono-${t}.png`;
}
writeFileSync(join(carpeta, 'manifest.json'), JSON.stringify({
  manifest_version: 3,
  name: 'Fluye: diagramas BPMN y de flujo',
  short_name: 'Fluye',
  version,
  description: 'Dibuja procesos BPMN y de flujo y recórrelos paso a paso con un Play. Gratis, de código abierto y sin internet.',
  homepage_url: 'https://ematurana-code.github.io/fluye/',
  // Clave pública fija: el ID queda siempre jlkmoecmeldboapiaepbpgljlmmmpfpn (también al cargarla descomprimida) y su
  // dirección de regreso de Google, https://jlkmoecmeldboapiaepbpgljlmmmpfpn.chromiumapp.org/, está autorizada en el
  // cliente de Drive. La clave privada no se publica (F:\Fluye\fluye-extension-clave-privada.pem).
  key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAynPUdf9uz9lfne49bteM+RdffqGT0P9HCOx9F0UH7nUCNQv566qCDtjOq4N8OyCSObG/crcOh63+mbpFhWYeIpjqsq4PN1LPZUPZzt62JPxx+9LEVd9Pvi1C+XH4zQjVYMdRBu/MF1OvPrU5xym0RcDT4sfgix9yK/cQXynxa4oTVwMO19ZuHPLEA9TNfMYwoatVPqHzGstXVBLlYiCHUKK9RtWwCpehu2Xen20t1oM67XFYvbIzppyf3MYcsWw0vHiAeVrvNONOAedgiHzuKRuzdUtT90EtAxWiocCiP7mCEWxT02ua6A4ZCQ2eHe6sOUIEMFMk92ULQFSYmq3JvQIDAQAB',
  icons: iconos,
  action: { default_title: 'Abrir Fluye', default_icon: iconos },
  background: { service_worker: 'fondo.js' },
  // identity: para conectar Google Drive con el permiso drive.file. No pide acceso a ninguna página web.
  permissions: ['identity']
}, null, 2));
writeFileSync(join(carpeta, 'fondo.js'), `// Al pulsar el ícono de Fluye en la barra del navegador, se abre el programa en una pestaña nueva.
chrome.action.onClicked.addListener(() => chrome.tabs.create({ url: chrome.runtime.getURL('index.html') }));
`);

const zip = join(salida, `Fluye-extension-${version}.zip`);
rmSync(zip, { force: true });
// tar de Windows (bsdtar, en System32) arma .zip con -a; el manifest.json queda en la raíz del zip, como piden las
// tiendas. Se llama por su ruta: el tar de Git Bash es otro y no entiende las rutas con letra de unidad.
const tar = process.platform === 'win32' ? join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe') : 'tar';
// Se nombran los archivos (no '.'), para que en el zip no lleven el prefijo ./ que algunas tiendas rechazan.
execFileSync(tar, ['-a', '-c', '-f', zip, '-C', carpeta, ...readdirSync(carpeta)], { stdio: 'inherit' });
console.log(`Extensión lista: ${carpeta} y ${zip}`);
