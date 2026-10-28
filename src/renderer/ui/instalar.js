// Instalar la versión web como app. Chrome y Edge avisan con "beforeinstallprompt" que se puede: entonces aparece el
// botón Instalar de la barra. Ya instalada, en la app de escritorio, o en Firefox y Safari (que no tienen ese aviso),
// el botón no aparece. La página del proyecto enlaza a app/?instalar=1: ahí se ofrece apenas el navegador lo permite o,
// si no lo permite, se explica cómo instalarlo en ese navegador.
import { aviso, preguntar } from './dialogos.js';

let pedido = null;
let alPoder = () => {};
const boton = () => document.getElementById('btn-instalar');

// Se escucha desde que se carga el módulo: el navegador puede avisar antes de que la app termine de partir.
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  pedido = e;
  if (boton()) boton().hidden = false;
  alPoder();
});
window.addEventListener('appinstalled', () => {
  pedido = null;
  if (boton()) boton().hidden = true;
  aviso('Fluye quedó instalado: lo encuentras en el escritorio y en el menú Inicio, y funciona sin internet.', 'ok', 7000);
});

const instalada = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

async function instalar() {
  if (!pedido) return;
  const p = pedido;
  pedido = null;
  boton().hidden = true;
  await p.prompt();
  const { outcome } = await p.userChoice;
  // Si la persona no quiso, el aviso del navegador ya no sirve; vuelve a llegar uno nuevo al recargar.
  if (outcome !== 'accepted') aviso('Cuando quieras instalarlo, recarga la página y pulsa Instalar.', 'info', 5000);
}

function comoInstalar() {
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (ios) return 'En Safari, toca el botón Compartir y elige "Agregar a inicio". Fluye queda con su ícono y se abre a pantalla completa.';
  if (/Firefox\//.test(ua)) return 'Firefox no instala apps web. Para instalarlo, abre esta página en Chrome o Edge. También puedes usarlo aquí mismo sin instalar: funciona igual.';
  if (/Safari\//.test(ua) && !/Chrome\/|Chromium\/|Edg\//.test(ua)) return 'En Safari, abre el menú Archivo y elige "Agregar al Dock". Fluye queda con su ícono y se abre en su propia ventana.';
  return 'Si ya lo instalaste, ábrelo desde el escritorio o el menú Inicio. Si no, pulsa el ícono de instalar que aparece a la derecha de la barra de direcciones.';
}

// Botón de la barra y, si se llegó con ?instalar=1, la pregunta (después de que la app partió y sin otro diálogo encima).
export function iniciarInstalar({ hayDialogoAbierto }) {
  boton().addEventListener('click', instalar);
  if (pedido) boton().hidden = false;
  const parametros = new URLSearchParams(location.search);
  if (!parametros.has('instalar')) return;
  parametros.delete('instalar');
  history.replaceState(null, '', `${location.pathname}${parametros.size ? `?${parametros}` : ''}${location.hash}`);
  if (instalada()) return;
  // El aviso del navegador llega en uno o dos segundos; si no llega, este navegador no lo permite (o ya está instalado).
  const listo = new Promise((resolver) => {
    if (pedido) { resolver(); return; }
    alPoder = resolver;
    setTimeout(resolver, 3000);
  });
  listo.then(async () => {
    while (hayDialogoAbierto()) await new Promise((r) => setTimeout(r, 400));
    if (pedido) {
      const r = await preguntar('Instalar Fluye', 'Queda con su ícono en el escritorio y en el menú Inicio, se abre en su propia ventana y funciona sin internet. Tus archivos siguen donde los guardes.', [
        { id: 'cancelar', texto: 'Ahora no' }, { id: 'instalar', texto: 'Instalar', clase: 'btn-primary' }
      ]);
      if (r === 'instalar') instalar();
    } else {
      await preguntar('Instalar Fluye', comoInstalar(), [{ id: 'ok', texto: 'Entendido', clase: 'btn-primary' }]);
    }
  });
}
