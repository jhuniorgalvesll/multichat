'use strict';

// Agencias de Shalom por lugar (departamento, provincia o distrito), desde la página oficial
// https://shalom.com.pe/agencias. Se abre la página en una ventana oculta, se escribe el lugar en su buscador
// (como lo haría una persona) y se lee la lista que la página muestra: nombre, dirección con referencia y tamaño.
// No se usa ni se descifra ningún dato interno de la página. Una búsqueda a la vez; cada lugar se recuerda 1 día.
const { BrowserWindow } = require('electron');

const URL_AGENCIAS = process.env.MULTICHAT_SHALOM_AGENCIAS_URL || 'https://shalom.com.pe/agencias';
const CACHE_MS = 24 * 60 * 60 * 1000;
const cache = new Map();
let busy = Promise.resolve();

const conLimite = (promesa, ms) => Promise.race([promesa, new Promise((_, rej) => setTimeout(() => rej(new Error('tiempo')), ms))]);

function pageScript(lugar) {
  return `(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    let caja = null;
    for (let i = 0; i < 60 && !caja; i++) {
      caja = [...document.querySelectorAll('input')].find((el) => /departamento|provincia|distrito/i.test(el.placeholder || ''));
      if (!caja) await sleep(250);
    }
    if (!caja) return { estado: 'sin_buscador' };
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    caja.focus();
    setter.call(caja, ${JSON.stringify(lugar)});
    caja.dispatchEvent(new Event('input', { bubbles: true }));
    caja.dispatchEvent(new Event('change', { bubbles: true }));
    const leer = () => [...document.querySelectorAll('div.divide-y > *')]
      .map((el) => String(el.innerText || '').split('\\n').map((s) => s.replace(/\\s+/g, ' ').trim()).filter(Boolean))
      .filter((l) => l.length >= 2)
      .map((l) => ({ nombre: l[0], direccion: l[1], tipo: l[2] || '' }));
    // Espera a que la lista se actualice (o quede vacía) y abre "Ver todo" para traer todas.
    // Shalom a veces tarda en filtrar: se espera hasta 10 s a que aparezcan agencias y a que la lista deje de cambiar.
    let anterior = -1;
    let estable = 0;
    for (let i = 0; i < 25; i++) {
      await sleep(400);
      const n = leer().length;
      if (n === anterior) estable += 1; else estable = 0;
      anterior = n;
      if (n > 0 && estable >= 3) break;
    }
    const ver = [...document.querySelectorAll('button, a, span, div')].find((el) => el.children.length === 0 && /^ver todo$/i.test((el.textContent || '').trim()));
    if (ver) { ver.click(); await sleep(1200); }
    return { estado: 'ok', agencias: leer() };
  })()`;
}

async function consultar(lugar) {
  const win = new BrowserWindow({
    show: false,
    width: 1366,
    height: 900,
    webPreferences: { partition: 'persist:shalom-agencias', sandbox: true, contextIsolation: true, backgroundThrottling: false },
  });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  try {
    await conLimite(win.loadURL(URL_AGENCIAS), 40000);
    return await conLimite(win.webContents.executeJavaScript(pageScript(lugar), true), 40000);
  } catch {
    return { estado: 'sin_respuesta' };
  } finally {
    if (!win.isDestroyed()) win.destroy();
  }
}

// { ok: true, lugar, agencias: [{ nombre, direccion, tipo }] } o { ok: false, error }.
function buscar(lugarIn) {
  const lugar = String(lugarIn || '').replace(/\s+/g, ' ').trim().slice(0, 60);
  if (lugar.length < 3) return Promise.resolve({ ok: false, error: 'corto' });
  const key = lugar.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return Promise.resolve(hit.result);
  const run = busy.then(async () => {
    const r = await consultar(lugar);
    const vistas = new Set();
    const agencias = (r.agencias || []).filter((a) => {
      const k = `${a.nombre}|${a.direccion}`.toLowerCase();
      if (vistas.has(k)) return false;
      vistas.add(k);
      return true;
    }).slice(0, 60);
    const result = r.estado === 'ok' ? { ok: true, lugar, agencias } : { ok: false, error: r.estado === 'sin_buscador' ? 'pagina_cambio' : 'sin_respuesta' };
    if (result.ok) cache.set(key, { at: Date.now(), result });
    return result;
  });
  busy = run.catch(() => {});
  return run;
}

// Mensaje para el cliente con las agencias elegidas (para que elija dónde recoger).
function mensaje(lugar, agencias) {
  const nums = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
  const lineas = [`📦 *Agencias Shalom en ${lugar}*`, ''];
  agencias.forEach((a, i) => {
    lineas.push(`${nums[i] || `${i + 1}.`} *${a.nombre}*`);
    lineas.push(`📍 ${a.direccion}`);
    lineas.push('');
  });
  lineas.push('¿En cuál agencia prefieres recoger tu pedido? 😊');
  return lineas.join('\n');
}

// Lugar y dirección dentro del mensaje del cliente ("Av. San Juan Mz A, Santiago de Surco 15058."):
// el distrito es lo que va después de la última coma de la línea de la dirección (sin código postal ni números).
const DIRECCION = /\b(av\.?|avenida|jr\.?|jir[oó]n|calle|ca\.|psje\.?|pasaje|mz\.?|manzana|lote|lt\.?|urb\.?|aa\.?hh|asoc\.?|prolong|carretera|km)\b/i;
function lugarDeTexto(texto) {
  const lineas = String(texto || '').split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const linea = lineas.find((l) => DIRECCION.test(l) && l.includes(',')) || lineas.find((l) => l.includes(',') && /[a-záéíóúñ]{4,}/i.test(l)) || '';
  if (!linea) {
    // "Quiero envío a Ayacucho", "para Huancayo", "agencia en Ica"
    const m = String(texto || '').match(/\b(?:env[ií]o|enviar|env[ií]a|m[aá]ndalo|mandar|agencia|recojo|recoger|vivo|estoy)\s+(?:a|para|en|de)\s+([a-záéíóúñ][a-záéíóúñ ]{2,30}?)(?=[.,!?\n]|$)/i);
    if (!m) return null;
    const lugar = m[1].replace(/\s+(por favor|porfa|gracias|please|pls|nomas|nom[aá]s|amigo|amiga)\b.*$/i, '').trim();
    return lugar.length >= 3 ? { lugar: lugar.slice(0, 60), direccion: '' } : null;
  }
  const partes = linea.split(',');
  const limpiar = (s) => s.replace(/\b\d+\b/g, ' ').replace(/[.#°º]/g, ' ').replace(/\b(per[uú]|lima metropolitana)\b/gi, ' ').replace(/\s+/g, ' ').trim();
  let lugar = '';
  for (let i = partes.length - 1; i >= 1 && !lugar; i--) {
    const c = limpiar(partes[i]);
    if (/[a-záéíóúñ]{3,}/i.test(c) && !DIRECCION.test(c)) lugar = c;
  }
  if (!lugar) return null;
  return { lugar: lugar.slice(0, 60), direccion: partes[0].trim().slice(0, 200) };
}

module.exports = { buscar, mensaje, lugarDeTexto };
