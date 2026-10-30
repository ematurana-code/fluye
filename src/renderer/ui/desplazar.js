// Como scrollIntoView({ block / inline: 'nearest' }), pero mueve solo la caja con barra de desplazamiento que contiene
// al nodo, en un eje ('y' vertical, 'x' horizontal). Dentro de un iframe, scrollIntoView desplaza también la página
// que lo muestra: en la portada del sitio, el Play de la demostración (que no se detiene) la devolvía arriba a cada paso.
export function mostrarEnCaja(nodo, eje = 'y') {
  const caja = cajaQueDesplaza(nodo, eje);
  if (!caja) {
    // Sin caja propia se desplaza la página, y solo si no está incrustada en otra.
    if (window === window.top) nodo.scrollIntoView(eje === 'y' ? { block: 'nearest' } : { block: 'nearest', inline: 'nearest' });
    return;
  }
  const r = nodo.getBoundingClientRect(), c = caja.getBoundingClientRect();
  if (eje === 'y') {
    if (r.bottom > c.bottom) caja.scrollTop += r.bottom - c.bottom;
    else if (r.top < c.top) caja.scrollTop -= c.top - r.top;
  } else if (r.right > c.right) caja.scrollLeft += r.right - c.right;
  else if (r.left < c.left) caja.scrollLeft -= c.left - r.left;
}

function cajaQueDesplaza(nodo, eje) {
  for (let caja = nodo.parentElement; caja && caja !== document.body; caja = caja.parentElement) {
    const estilo = getComputedStyle(caja)[eje === 'y' ? 'overflowY' : 'overflowX'];
    const sobra = eje === 'y' ? caja.scrollHeight > caja.clientHeight : caja.scrollWidth > caja.clientWidth;
    if (sobra && /auto|scroll|hidden/.test(estilo)) return caja;
  }
  return null;
}
