// Puente seguro entre la interfaz y el sistema: solo expone estas funciones.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('fluyeEscritorio', {
  abrir: () => ipcRenderer.invoke('archivo:abrir'),
  abrirRuta: (ruta) => ipcRenderer.invoke('archivo:abrirRuta', ruta),
  guardar: (ruta, contenido, nombre) => ipcRenderer.invoke('archivo:guardar', { ruta, contenido, nombre }),
  guardarComo: (contenido, nombre) => ipcRenderer.invoke('archivo:guardar', { ruta: null, contenido, nombre }),
  renombrar: (ruta, nombre) => ipcRenderer.invoke('archivo:renombrar', { ruta, nombre }),
  exportar: (pedido) => ipcRenderer.invoke('archivo:exportar', pedido),
  exportarPdf: (pedido) => ipcRenderer.invoke('archivo:exportarPdf', pedido),
  inicial: () => ipcRenderer.invoke('archivo:inicial'),
  recientes: () => ipcRenderer.invoke('recientes:lista'),
  marcarCambios: (hay, titulo) => ipcRenderer.send('estado:cambios', { hay, titulo }),
  cerrar: () => ipcRenderer.send('ventana:cerrar'),
  pruebaCerrar: () => ipcRenderer.send('prueba:cerrar'),
  reemplazarPalabra: (texto) => ipcRenderer.send('ortografia:reemplazar', texto),
  agregarAlDiccionario: (palabra) => ipcRenderer.send('ortografia:agregar', palabra),
  alPedir: (fn) => ipcRenderer.on('pedido', (_e, accion, dato) => fn(accion, dato))
});
