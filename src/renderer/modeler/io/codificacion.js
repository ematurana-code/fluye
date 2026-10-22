// Decodifica un .bpmn respetando la codificación que declara (algunos vienen en ISO-8859-1 / Windows-1252).
export function decodificarXml(bytes) {
  const datos = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const cabecera = new TextDecoder('latin1').decode(datos.slice(0, 200));
  const m = /encoding\s*=\s*["']([^"']+)["']/i.exec(cabecera);
  const declarada = m ? m[1].toLowerCase() : 'utf-8';
  const latina = /^(iso-8859-1|latin-?1|windows-1252|cp1252)$/.test(declarada);
  const texto = new TextDecoder(latina ? 'windows-1252' : 'utf-8').decode(datos);
  return normalizarDeclaracion(texto);
}

// Ya decodificado a texto: la declaración pasa a UTF-8 (es lo que se escribe al guardar).
export function normalizarDeclaracion(texto) {
  return texto.replace(/^﻿/, '').replace(/^(<\?xml[^>]*?encoding\s*=\s*)["'][^"']*["']/i, '$1"UTF-8"');
}
