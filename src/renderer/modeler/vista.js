// Encuadre del diagrama completo en la pantalla, con margen de 40 px alrededor y sin pasar de 100 %.
export function ajustarVista(canvas) {
  canvas.resized();
  const { inner, outer } = canvas.viewbox();
  // Sin diagrama o con el lienzo aún sin tamaño (pestaña oculta, ventana minimizada) no hay nada que encuadrar.
  if (!inner.width || !inner.height || outer.width <= 80 || outer.height <= 80) return;
  const escala = Math.min(1, (outer.width - 80) / inner.width, (outer.height - 80) / inner.height);
  canvas.viewbox({
    x: inner.x + inner.width / 2 - outer.width / escala / 2,
    y: inner.y + inner.height / 2 - outer.height / escala / 2,
    width: outer.width / escala,
    height: outer.height / escala
  });
}
