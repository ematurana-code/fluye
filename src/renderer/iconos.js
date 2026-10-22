// Íconos Lucide (ISC) incluidos en la app: para la interfaz (HTML) y como marcadores dentro del diagrama (SVG).
import {
  User, Settings, Hand, FileCode, Send, Mail, Table, Plus, Trash2, Palette, ArrowRight, FilePlus, FolderOpen,
  Save, Undo2, Redo2, Download, Play, ZoomIn, ZoomOut, Maximize, CircleCheck, TriangleAlert, ChevronDown,
  PanelRight, X, Rows3, Spline, MousePointer2, Clock3, MessageSquare, Database, File, StickyNote, Group, Square,
  Circle, Diamond, LayoutTemplate, Copy, ClipboardPaste, History, Pencil, Info, Pause, SkipForward, RotateCcw,
  FileImage, FileType, FileText
} from 'lucide';

export const ICONOS = {
  usuario: User, engranaje: Settings, mano: Hand, script: FileCode, enviar: Send, correo: Mail, tabla: Table,
  mas: Plus, borrar: Trash2, color: Palette, conectar: ArrowRight, nuevo: FilePlus, abrir: FolderOpen, guardar: Save,
  deshacer: Undo2, rehacer: Redo2, exportar: Download, play: Play, acercar: ZoomIn, alejar: ZoomOut, ajustar: Maximize,
  ok: CircleCheck, alerta: TriangleAlert, flechaAbajo: ChevronDown, panel: PanelRight, cerrar: X, carril: Rows3,
  flujo: Spline, puntero: MousePointer2, reloj: Clock3, mensaje: MessageSquare, baseDatos: Database, archivo: File,
  nota: StickyNote, grupo: Group, cuadrado: Square, circulo: Circle, rombo: Diamond, plantilla: LayoutTemplate,
  copiar: Copy, pegar: ClipboardPaste, recientes: History, editar: Pencil, info: Info,
  pausa: Pause, pasoSiguiente: SkipForward, reiniciar: RotateCcw, imagen: FileImage, pdf: FileType, word: FileText
};

const ATRIBUTOS = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"';

function nodosHtml(nodos) {
  return nodos.map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ')}/>`).join('');
}

// HTML de un ícono para la interfaz.
export function icono(nombre, tamano = 18, grosor = 2) {
  const nodos = ICONOS[nombre];
  if (!nodos) return '';
  return `<svg ${ATRIBUTOS} width="${tamano}" height="${tamano}" stroke-width="${grosor}" aria-hidden="true">${nodosHtml(nodos)}</svg>`;
}

// Dibuja un ícono dentro del diagrama (SVG) en (x, y) con el tamaño dado.
export function iconoEnSvg(padre, nombre, x, y, tamano, color, grosor = 2) {
  const nodos = ICONOS[nombre];
  if (!nodos) return null;
  const ns = 'http://www.w3.org/2000/svg';
  const g = document.createElementNS(ns, 'g');
  const k = tamano / 24;
  g.setAttribute('transform', `translate(${x} ${y}) scale(${k})`);
  g.setAttribute('fill', 'none');
  g.setAttribute('stroke', color);
  g.setAttribute('stroke-width', String(grosor));
  g.setAttribute('stroke-linecap', 'round');
  g.setAttribute('stroke-linejoin', 'round');
  for (const [tag, attrs] of nodos) {
    const el = document.createElementNS(ns, tag);
    for (const [k2, v] of Object.entries(attrs)) el.setAttribute(k2, String(v));
    g.appendChild(el);
  }
  padre.appendChild(g);
  return g;
}
