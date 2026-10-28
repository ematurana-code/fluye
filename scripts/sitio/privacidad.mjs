// Política de privacidad (español en privacidad/, inglés en en/privacy/). Google la exige para verificar la conexión
// con Google Drive y también le sirve a cualquiera que quiera saber qué hace Fluye con sus datos: casi nada, y lo dice.
import { REPO, RUTAS, escapar, migas } from './comun.mjs';

export const RUTA_PRIVACIDAD = { es: 'privacidad/', en: 'en/privacy/' };
const VIGENTE = '28 de octubre de 2026', VIGENTE_EN = 'October 28, 2026';

const TX = {
  es: {
    titulo: 'Política de privacidad | Fluye', h1: 'Política de privacidad',
    descripcion: 'Qué datos usa Fluye: tus diagramas quedan en tu computador o en tu Google Drive, sin cuentas, servidores, cookies ni analítica.',
    bajada: `Fluye no tiene servidores ni cuentas de usuario: tus diagramas quedan en tu computador o en tu Google Drive. Vigente desde el ${VIGENTE}.`,
    inicio: 'Inicio',
    secciones: [
      ['Quién es responsable', [`Fluye es un programa gratis y de código abierto (licencia MIT) que desarrolla Esteban Maturana, en Chile. El código completo es público en <a href="${REPO}">GitHub</a>, así que cualquiera puede revisar lo que hace.`]],
      ['Qué datos guarda Fluye', [
        'Ninguno en servidores propios: Fluye no tiene cuentas, base de datos ni servidor que reciba tus diagramas.',
        'Tus procesos se guardan como archivos .bpmn donde tú elijas: en tu computador o, si usas la opción de Google Drive, en tu propio Drive.',
        'La versión web guarda en tu navegador, solo en tu equipo, una copia de respaldo del proceso que tiene cambios sin guardar y la lista de archivos recientes. Puedes borrarlas cuando quieras borrando los datos del sitio en tu navegador.'
      ]],
      ['Google Drive (opcional)', [
        'Si usas "Guardar en Google Drive" o "Abrir desde Google Drive", Google te pide permiso para que Fluye acceda a tu Drive. Fluye usa el permiso más acotado que existe (drive.file): solo puede ver, crear y modificar los archivos que tú creas o abres con Fluye. No puede ver el resto de tu Drive.',
        'Fluye usa ese acceso únicamente para abrir y guardar tus diagramas, en una carpeta llamada "Fluye". No lee tu correo ni tus datos de perfil, no copia tus archivos a otro lugar y no comparte nada con terceros.',
        'El permiso dura la sesión (una hora, y se renueva mientras usas Fluye) y solo vive en la memoria de la pestaña: no se guarda en el navegador ni en ningún servidor. Puedes quitarlo cuando quieras en <a href="https://myaccount.google.com/permissions">myaccount.google.com/permissions</a>.',
        'El uso y la transferencia de la información recibida de las API de Google se ajustan a la <a href="https://developers.google.com/terms/api-services-user-data-policy">Política de Datos del Usuario de los Servicios de las API de Google</a>, incluidos los requisitos de uso limitado.'
      ]],
      ['El programa para Windows', ['No envía datos a ningún lado: funciona sin internet y tus archivos quedan donde los guardes. Solo se conecta a internet si tú abres un enlace.']],
      ['Este sitio web', ['No usa cookies, analítica ni publicidad, y las letras se cargan desde el propio sitio. Lo aloja GitHub Pages, que puede registrar datos técnicos de las visitas (como la dirección IP) según su propia política de privacidad.']],
      ['Cambios y contacto', [`Si esta política cambia, se actualiza aquí con su nueva fecha. Para preguntas o reclamos, abre un reporte en el <a href="${REPO}/issues">repositorio de GitHub</a>.`]]
    ]
  },
  en: {
    titulo: 'Privacy policy | Fluye', h1: 'Privacy policy',
    descripcion: 'What data Fluye uses: your diagrams stay on your computer or in your Google Drive, with no accounts, servers, cookies or analytics.',
    bajada: `Fluye has no servers and no user accounts: your diagrams stay on your computer or in your Google Drive. Effective ${VIGENTE_EN}.`,
    inicio: 'Home',
    secciones: [
      ['Who is responsible', [`Fluye is free, open-source software (MIT license) developed by Esteban Maturana in Chile. Its full source code is public on <a href="${REPO}">GitHub</a>, so anyone can check what it does.`]],
      ['What data Fluye keeps', [
        'None on servers of its own: Fluye has no accounts, no database and no server that receives your diagrams.',
        'Your processes are saved as .bpmn files wherever you choose: on your computer or, if you use the Google Drive option, in your own Drive.',
        'The web version keeps, in your browser and only on your device, a backup of a process with unsaved changes and the list of recent files. You can remove them anytime by clearing this site\'s data in your browser.'
      ]],
      ['Google Drive (optional)', [
        'If you use "Save to Google Drive" or "Open from Google Drive", Google asks for your permission to let Fluye access your Drive. Fluye uses the narrowest permission available (drive.file): it can only see, create and change the files you create or open with Fluye. It cannot see the rest of your Drive.',
        'Fluye uses that access only to open and save your diagrams, in a folder named "Fluye". It does not read your email or profile data, does not copy your files elsewhere and shares nothing with third parties.',
        'The permission lasts for the session (one hour, renewed while you use Fluye) and lives only in the tab\'s memory: it is not stored in the browser or on any server. You can revoke it anytime at <a href="https://myaccount.google.com/permissions">myaccount.google.com/permissions</a>.',
        'Fluye\'s use and transfer of information received from Google APIs adheres to the <a href="https://developers.google.com/terms/api-services-user-data-policy">Google API Services User Data Policy</a>, including the Limited Use requirements.'
      ]],
      ['The Windows program', ['It sends no data anywhere: it works offline and your files stay where you save them. It only goes online if you open a link.']],
      ['This website', ['It uses no cookies, analytics or ads, and its fonts are served from the site itself. It is hosted on GitHub Pages, which may log technical data about visits (such as IP addresses) under its own privacy policy.']],
      ['Changes and contact', [`If this policy changes, it is updated here with its new date. For questions or complaints, open an issue in the <a href="${REPO}/issues">GitHub repository</a>.`]]
    ]
  }
};

export function privacidad(idioma = 'es') {
  const t = TX[idioma], ruta = RUTA_PRIVACIDAD[idioma];
  const r = '../'.repeat(ruta.split('/').filter(Boolean).length);
  const { html, esquema } = migas(r, [{ nombre: t.inicio, ruta: RUTAS[idioma].raiz }, { nombre: t.h1, ruta }], idioma);
  const cuerpo = `
<article class="privacidad">
  <header class="tablero titular">
    <div class="pieza titular-texto">
      <h1>${t.h1}</h1>
      <p class="bajada">${escapar(t.bajada)}</p>
      ${html}
    </div>
  </header>
  <div class="tablero">
    <div class="pieza articulo-texto privacidad-texto">
      ${t.secciones.map(([h, ps]) => `<section><h2>${h}</h2>${ps.map((p) => `<p>${p}</p>`).join('')}</section>`).join('\n      ')}
    </div>
  </div>
</article>`;
  return { ruta, idioma, alternas: RUTA_PRIVACIDAD, titulo: t.titulo, descripcion: t.descripcion, cuerpo, esquema: [esquema] };
}
