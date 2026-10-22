// Arma el instalador de Windows (Fluye-Instalar-<versión>.exe) con electron-builder y la configuración "build" de
// package.json: por usuario, sin pedir administrador, con accesos directos y los .bpmn asociados a Fluye.
// Uso: npm run instalador (primero compila la interfaz). Usa el Electron que ya está en node_modules (no lo descarga).
// Dónde queda: FLUYE_SALIDA si está definida; si no, la carpeta "instalador" del proyecto.
// FLUYE_CACHE_INSTALADOR: dónde guarda electron-builder lo que descarga (NSIS); por defecto, su caché habitual.
import { mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const salida = resolve(process.env.FLUYE_SALIDA || 'instalador');
mkdirSync(salida, { recursive: true });
if (process.env.FLUYE_CACHE_INSTALADOR) {
  mkdirSync(process.env.FLUYE_CACHE_INSTALADOR, { recursive: true });
  process.env.ELECTRON_BUILDER_CACHE = process.env.FLUYE_CACHE_INSTALADOR;
}

const { Arch, build, Platform } = await import('electron-builder');
const archivos = await build({
  targets: Platform.WINDOWS.createTarget('nsis', Arch.x64),
  config: { directories: { output: salida } },
  publish: 'never'
});
rmSync(resolve(salida, 'builder-debug.yml'), { force: true }); // registro interno de electron-builder
console.log(archivos.filter((a) => /\.exe$/i.test(a)).join('\n'));
