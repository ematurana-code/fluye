// Documentación en Word (.docx): portada, diagrama y una ficha por cada paso en el orden del flujo.
import {
  AlignmentType, BorderStyle, Document, HeadingLevel, ImageRun, Packer, PageOrientation, Paragraph, ShadingType, Table,
  TableCell, TableRow, TextRun, WidthType
} from 'docx';
import { pngDelDiagrama } from './imagen.js';
import { bo, es, esCarril, esCompuerta, esPool, limpiarTexto, nombreTipo } from '../modeler/tipos.js';

const AZUL = '1E3A8A';
const GRIS = '64748B';
const salidas = (e) => (e.outgoing || []).filter((c) => es(c, 'bpmn:SequenceFlow'));
const entradas = (e) => (e.incoming || []).filter((c) => es(c, 'bpmn:SequenceFlow'));
// Archivos de otras herramientas pueden traer caracteres de control: Word da por dañado el documento si llegan.
const nombre = (e) => limpiarTexto((e && bo(e).name) || nombreTipo(e));
const descripcion = (e) => limpiarTexto(((bo(e).documentation || [])[0] || {}).text || '');

function carrilDe(registro, e) {
  const cx = e.x + e.width / 2, cy = e.y + e.height / 2;
  const c = registro.filter(esCarril).find((l) => cx >= l.x && cx <= l.x + l.width && cy >= l.y && cy <= l.y + l.height);
  return c ? nombre(c) : '';
}

// Pasos en el orden en que se recorren (desde los inicios), y al final lo que no quedó conectado.
function ordenDelFlujo(registro) {
  const nodos = registro.filter((e) => !e.waypoints && es(e, 'bpmn:FlowNode'));
  const inicios = nodos.filter((n) => es(n, 'bpmn:StartEvent')).sort((a, b) => a.y - b.y || a.x - b.x);
  const vistos = new Set(), orden = [];
  const cola = [...inicios];
  while (cola.length) {
    const n = cola.shift();
    if (vistos.has(n)) continue;
    vistos.add(n);
    orden.push(n);
    for (const c of salidas(n).sort((a, b) => a.target.y - b.target.y)) cola.push(c.target);
    for (const h of (n.children || []).filter((x) => es(x, 'bpmn:StartEvent'))) cola.push(h);
  }
  return [...orden, ...nodos.filter((n) => !vistos.has(n)).sort((a, b) => a.y - b.y || a.x - b.x)];
}

const celda = (texto, opciones = {}) => new TableCell({
  width: { size: opciones.ancho || 50, type: WidthType.PERCENTAGE },
  shading: opciones.fondo ? { type: ShadingType.CLEAR, color: 'auto', fill: opciones.fondo } : undefined,
  margins: { top: 60, bottom: 60, left: 100, right: 100 },
  children: String(texto || '—').split('\n').map((linea) => new Paragraph({ children: [new TextRun({ text: linea, bold: !!opciones.negrita, color: opciones.color, size: 20 })] }))
});

function ficha(registro, e, numero) {
  const filas = [['Tipo', nombreTipo(e)]];
  const carril = carrilDe(registro, e);
  if (carril) filas.push(['Responsable', carril]);
  filas.push(['Descripción', descripcion(e) || '(sin descripción)']);
  const antes = entradas(e).map((c) => nombre(c.source));
  if (antes.length) filas.push(['Viene de', antes.join('\n')]);
  const sal = salidas(e);
  if (esCompuerta(e) && sal.length > 1) {
    filas.push(['Caminos', sal.map((c) => `${bo(c).name ? bo(c).name + ': ' : ''}${nombre(c.target)}`).join('\n')]);
  } else if (sal.length) {
    filas.push(['Sigue a', sal.map((c) => nombre(c.target)).join('\n')]);
  }
  return [
    new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 240, after: 80 }, children: [new TextRun({ text: `${numero}. ${nombre(e)}`, color: AZUL })] }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { top: borde(), bottom: borde(), left: borde(), right: borde(), insideHorizontal: borde(), insideVertical: borde() },
      rows: filas.map(([k, v]) => new TableRow({ children: [celda(k, { ancho: 24, negrita: true, fondo: 'F1F5F9', color: '334155' }), celda(v, { ancho: 76 })] }))
    })
  ];
}

function borde() {
  return { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' };
}

export async function wordDelDiagrama(modeler, titulo) {
  const registro = modeler.get('elementRegistry');
  const fecha = new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' });
  const imagen = await pngDelDiagrama(modeler, 2);
  // Hoja A4 horizontal con márgenes de 2 cm: ~ 25,7 x 17 cm útiles = 970 x 640 px a 96 ppp.
  const k = Math.min(970 / imagen.ancho, 600 / imagen.alto, 1);
  const pools = registro.filter(esPool);
  const pasos = ordenDelFlujo(registro).filter((e) => !es(e, 'bpmn:BoundaryEvent'));

  const portada = [
    new Paragraph({ spacing: { before: 3200 }, children: [new TextRun({ text: titulo, bold: true, size: 56, color: AZUL })] }),
    new Paragraph({ spacing: { before: 160 }, children: [new TextRun({ text: 'Documentación del proceso', size: 30, color: GRIS })] }),
    new Paragraph({ spacing: { before: 600 }, children: [new TextRun({ text: fecha, size: 22, color: GRIS })] }),
    new Paragraph({ children: [new TextRun({ text: 'Generado con Fluye', size: 18, color: '94A3B8' })] }),
    new Paragraph({ spacing: { before: 800 }, children: [new TextRun({ text: 'Contenido', bold: true, size: 24 })] }),
    ...['1. Diagrama del proceso', '2. Participantes y responsables', '3. Detalle de cada paso'].map((t) => new Paragraph({ children: [new TextRun({ text: t, size: 22 })] }))
  ];

  const diagrama = [
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '1. Diagrama del proceso', color: AZUL })] }),
    new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { before: 200 },
      children: [new ImageRun({ type: 'png', data: imagen.bytes, transformation: { width: Math.round(imagen.ancho * k), height: Math.round(imagen.alto * k) } })]
    })
  ];

  const participantes = [new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '2. Participantes y responsables', color: AZUL })] })];
  if (!pools.length) participantes.push(new Paragraph({ children: [new TextRun({ text: 'El diagrama no tiene pools.', color: GRIS })] }));
  for (const p of pools) {
    participantes.push(new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 200 }, children: [new TextRun({ text: nombre(p) })] }));
    if (descripcion(p)) participantes.push(new Paragraph({ children: [new TextRun({ text: descripcion(p) })] }));
    const carriles = (p.children || []).filter(esCarril).sort((a, b) => a.y - b.y);
    for (const c of carriles) participantes.push(new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: nombre(c) + (descripcion(c) ? ` — ${descripcion(c)}` : '') })] }));
  }

  const detalle = [new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, children: [new TextRun({ text: '3. Detalle de cada paso', color: AZUL })] })];
  pasos.forEach((e, i) => detalle.push(...ficha(registro, e, i + 1)));

  const doc = new Document({
    creator: 'Fluye', title: titulo, description: 'Documentación del proceso generada con Fluye',
    styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } },
    sections: [
      { children: portada },
      { properties: { page: { size: { orientation: PageOrientation.LANDSCAPE }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } }, children: diagrama },
      { children: [...participantes, ...detalle] }
    ]
  });
  const blob = await Packer.toBlob(doc);
  return new Uint8Array(await blob.arrayBuffer());
}
