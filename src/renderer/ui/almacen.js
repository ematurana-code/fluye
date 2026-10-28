// Lo que la versión web guarda en el navegador (IndexedDB), que el escritorio tiene en disco:
// - archivos: los archivos abiertos o guardados (su "handle", para volver a escribir en ellos y para Recientes);
// - respaldo: el proyecto con cambios sin guardar, para recuperarlo si se cierra la pestaña.
const BASE = 'fluye', VERSION = 1;
let conexion = null;

function abrirBase() {
  if (!conexion) {
    conexion = new Promise((resolver, rechazar) => {
      const pedido = indexedDB.open(BASE, VERSION);
      pedido.onupgradeneeded = () => {
        const db = pedido.result;
        if (!db.objectStoreNames.contains('archivos')) db.createObjectStore('archivos', { keyPath: 'id', autoIncrement: true });
        if (!db.objectStoreNames.contains('respaldo')) db.createObjectStore('respaldo');
      };
      pedido.onsuccess = () => resolver(pedido.result);
      pedido.onerror = () => rechazar(pedido.error);
    }).catch((e) => { conexion = null; throw e; });
  }
  return conexion;
}

async function operar(almacen, modo, accion) {
  const db = await abrirBase();
  return new Promise((resolver, rechazar) => {
    const tx = db.transaction(almacen, modo);
    const pedido = accion(tx.objectStore(almacen));
    tx.oncomplete = () => resolver(pedido && pedido.result);
    tx.onerror = () => rechazar(tx.error);
    tx.onabort = () => rechazar(tx.error);
  });
}

export const archivos = {
  todos: () => operar('archivos', 'readonly', (s) => s.getAll()),
  leer: (id) => operar('archivos', 'readonly', (s) => s.get(id)),
  poner: (registro) => operar('archivos', 'readwrite', (s) => s.put(registro)),
  borrar: (id) => operar('archivos', 'readwrite', (s) => s.delete(id))
};

export const respaldo = {
  leer: () => operar('respaldo', 'readonly', (s) => s.get('actual')),
  poner: (datos) => operar('respaldo', 'readwrite', (s) => s.put(datos, 'actual')),
  borrar: () => operar('respaldo', 'readwrite', (s) => s.delete('actual'))
};
