// Cliente mínimo de Chrome DevTools Protocol (sin dependencias) + lanzador de Chrome aislado.
// Lo usan los scripts de prueba y de generación de Fluye para manejar la app (Electron) o Chrome sin ventana.
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const sleep = ms => new Promise(r => setTimeout(r, ms));

export const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
];

// Lanza un Chrome aislado. Sin ventana por defecto y sin frenar timers ni requestAnimationFrame en segundo plano.
export async function lanzarChrome({ puerto, perfil, headless = true, ancho = 1280, alto = 720 }) {
  const { existsSync } = await import('node:fs');
  const exe = CHROME.find(p => existsSync(p));
  if (!exe) throw new Error('No encontré chrome.exe');
  const args = [
    `--remote-debugging-port=${puerto}`, '--remote-debugging-address=127.0.0.1', `--user-data-dir=${perfil}`,
    '--no-first-run', '--no-default-browser-check', '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
    '--autoplay-policy=no-user-gesture-required', '--mute-audio', `--window-size=${ancho},${alto}`,
  ];
  if (headless) args.push('--headless=new');
  args.push('about:blank');
  const proc = spawn(exe, args, { detached: false, stdio: 'ignore' });
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(`http://127.0.0.1:${puerto}/json/version`); if (r.ok) return { proc, version: await r.json() }; } catch {}
    await sleep(500);
  }
  throw new Error('Chrome no abrió el puerto ' + puerto);
}

export async function paginaPrincipal(puerto) {
  const lista = await (await fetch(`http://127.0.0.1:${puerto}/json/list`)).json();
  const p = lista.find(t => t.type === 'page');
  if (!p) throw new Error('Sin pestaña');
  return p;
}

export class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pend = new Map(); this.handlers = []; }
  static async conectar(wsUrl) {
    const ws = new WebSocket(wsUrl);
    await new Promise((ok, mal) => { ws.onopen = ok; ws.onerror = mal; });
    const c = new CDP(ws);
    ws.onmessage = ev => {
      const m = JSON.parse(ev.data);
      if (m.id && c.pend.has(m.id)) { const { ok, mal } = c.pend.get(m.id); c.pend.delete(m.id); m.error ? mal(new Error(m.error.message)) : ok(m.result); }
      else if (m.method) for (const h of c.handlers) h(m);
    };
    return c;
  }
  send(method, params = {}, timeoutMs = 60000) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((ok, mal) => {
      this.pend.set(id, { ok, mal });
      setTimeout(() => { if (this.pend.has(id)) { this.pend.delete(id); mal(new Error('timeout ' + method)); } }, timeoutMs);
    });
  }
  // Evalúa una expresión en la página aislada (Runtime.evaluate de DevTools) y devuelve su valor (JSON).
  // Solo se usa con código propio de las pruebas, nunca con texto que venga de la página.
  async eval(expr, { esperar = false } = {}) {
    const r = await this.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: esperar });
    if (r.exceptionDetails) throw new Error('JS: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
    return r.result.value;
  }
  async captura(ruta) {
    const r = await this.send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(ruta, Buffer.from(r.data, 'base64'));
  }
  async ir(url) { await this.send('Page.enable'); await this.send('Page.navigate', { url }); }
  cerrar() { try { this.ws.close(); } catch {} }
}

export { sleep };
