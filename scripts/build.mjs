// Empaqueta la interfaz (src/renderer) en dist/renderer con esbuild. Uso: node scripts/build.mjs [--watch]
import * as esbuild from 'esbuild';
import { cpSync, mkdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const salida = join(raiz, 'dist', 'renderer');
const vigilar = process.argv.includes('--watch');

mkdirSync(salida, { recursive: true });
const copiarHtml = () => cpSync(join(raiz, 'src', 'renderer', 'index.html'), join(salida, 'index.html'));
copiarHtml();

// import x from 'archivo?base64' -> el contenido del archivo en base64 (fuentes incrustadas en las exportaciones)
const base64 = {
  name: 'base64',
  setup(b) {
    const requerir = createRequire(join(raiz, 'package.json'));
    b.onResolve({ filter: /\?base64$/ }, (a) => ({ path: requerir.resolve(a.path.replace(/\?base64$/, '')), namespace: 'base64' }));
    b.onLoad({ filter: /.*/, namespace: 'base64' }, (a) => ({ contents: `export default ${JSON.stringify(readFileSync(a.path).toString('base64'))};`, loader: 'js' }));
  }
};

// Página web interactiva (Exportar → .html): el visor (src/visor) se empaqueta aparte en un solo HTML con todo adentro.
// Queda con los marcadores __FLUYE_TITULO__ y __FLUYE_DATOS__, que llena la app al exportar.
async function plantillaVisor() {
  const r = await esbuild.build({
    entryPoints: { visor: join(raiz, 'src', 'visor', 'visor.js') },
    bundle: true,
    write: false,
    outdir: join(raiz, 'dist', 'visor'),
    format: 'iife',
    target: ['chrome100', 'edge100', 'firefox100', 'safari15'],
    minify: true,
    legalComments: 'none',
    logLevel: 'warning',
    plugins: [base64]
  });
  const texto = (ext) => (r.outputFiles.find((f) => f.path.endsWith(ext)) || { text: '' }).text;
  const js = texto('.js').replace(/<\/(script)/gi, '<\\/$1');
  const css = texto('.css').replace(/<\/(style)/gi, '<\\/$1');
  // La página solo ejecuta este script (CSP con su huella): no carga nada de internet.
  const huella = createHash('sha256').update(js).digest('base64');
  return readFileSync(join(raiz, 'src', 'visor', 'plantilla.html'), 'utf8')
    .replace('__FLUYE_HASH__', `sha256-${huella}`)
    .replace('/*FLUYE_CSS*/', () => css)
    .replace('/*FLUYE_JS*/', () => js);
}

const opciones = {
  entryPoints: { app: join(raiz, 'src', 'renderer', 'app.js') },
  bundle: true,
  outdir: salida,
  format: 'esm',
  target: 'chrome130',
  sourcemap: true,
  minify: !vigilar,
  loader: { '.woff2': 'file', '.woff': 'file' },
  assetNames: 'fuentes/[name]-[hash]',
  logLevel: 'info',
  plugins: [
    { name: 'html', setup(b) { b.onEnd(copiarHtml); } },
    base64,
    // import plantillas from 'fluye:plantillas' -> la galería de procesos prearmados (plantillas/catalogo.json + .bpmn + .svg)
    {
      name: 'plantillas',
      setup(b) {
        b.onResolve({ filter: /^fluye:plantillas$/ }, () => ({ path: 'plantillas', namespace: 'fluye-plantillas' }));
        b.onLoad({ filter: /.*/, namespace: 'fluye-plantillas' }, () => {
          const carpeta = join(raiz, 'plantillas');
          const catalogo = JSON.parse(readFileSync(join(carpeta, 'catalogo.json'), 'utf8'));
          const lista = catalogo.map((p) => ({
            ...p, bpmn: readFileSync(join(carpeta, `${p.id}.bpmn`), 'utf8'), vista: readFileSync(join(carpeta, `${p.id}.svg`), 'utf8')
          }));
          return { contents: `export default ${JSON.stringify(lista)};`, loader: 'js', watchDirs: [carpeta] };
        });
      }
    },
    // import plantilla from 'fluye:visor' -> la página web interactiva lista para llenar
    {
      name: 'visor',
      setup(b) {
        b.onResolve({ filter: /^fluye:visor$/ }, () => ({ path: 'visor', namespace: 'fluye-visor' }));
        b.onLoad({ filter: /.*/, namespace: 'fluye-visor' }, async () => ({
          contents: `export default ${JSON.stringify(await plantillaVisor())};`, loader: 'js', watchDirs: [join(raiz, 'src', 'visor')]
        }));
      }
    }
  ]
};

if (vigilar) {
  const ctx = await esbuild.context(opciones);
  await ctx.watch();
} else {
  await esbuild.build(opciones);
}
