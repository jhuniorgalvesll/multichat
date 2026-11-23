'use strict';

// Tipo de cambio del dólar (gratis):
// 1) SUNAT: archivo público https://www.sunat.gob.pe/a/txt/tipoCambio.txt → "23/11/2026|3.447|3.453|"
//    (fecha | compra | venta). Es el tipo de cambio oficial que publica SUNAT cada día.
// 2) Si SUNAT no responde: open.er-api.com (referencial, un solo valor; sin compra y venta).
// Se guarda y se actualiza cada 3 horas (si falló, se reintenta a los 15 minutos).
const { net } = require('electron');

const EVERY = 3 * 60 * 60 * 1000;
const RETRY = 15 * 60 * 1000;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';

function parseSunat(texto) {
  const m = String(texto || '').trim().match(/^(\d{2}\/\d{2}\/\d{4})\|(\d+\.\d+)\|(\d+\.\d+)\|?/);
  if (!m) return null;
  const compra = Number(m[2]);
  const venta = Number(m[3]);
  return compra > 0 && venta > 0 ? { fuente: 'SUNAT', dia: m[1], compra, venta, at: Date.now() } : null;
}

function parseReferencial(texto) {
  try {
    const d = JSON.parse(texto);
    const pen = Number(d && d.rates && d.rates.PEN);
    if (!(pen > 0)) return null;
    const dia = new Date((d.time_last_update_unix || Date.now() / 1000) * 1000).toLocaleDateString('es-PE');
    return { fuente: 'referencial', dia, compra: 0, venta: Math.round(pen * 1000) / 1000, at: Date.now() };
  } catch {
    return null;
  }
}

async function pedir(url) {
  const res = await net.fetch(url, { headers: { 'User-Agent': UA, Accept: '*/*' }, cache: 'no-store' });
  if (!res.ok) throw new Error(String(res.status));
  return res.text();
}

let ctx = null;
let timer = null;

async function actualizar() {
  if (!ctx) return;
  let r = null;
  try { r = parseSunat(await pedir('https://www.sunat.gob.pe/a/txt/tipoCambio.txt')); } catch { r = null; }
  if (!r) {
    try { r = parseReferencial(await pedir('https://open.er-api.com/v6/latest/USD')); } catch { r = null; }
  }
  clearTimeout(timer);
  timer = setTimeout(actualizar, r ? EVERY : RETRY);
  if (r) {
    ctx.store.get().settings.fx = r;
    ctx.store.save();
    ctx.onChange();
  }
}

function start(options) {
  ctx = options;
  clearTimeout(timer);
  const actual = ctx.store.get().settings.fx;
  // Al abrir: si no hay dato de SUNAT reciente, se pide enseguida.
  const fresco = actual && actual.fuente === 'SUNAT' && Date.now() - (actual.at || 0) < EVERY;
  timer = setTimeout(actualizar, fresco ? EVERY - (Date.now() - actual.at) : 4000);
}

module.exports = { start, parseSunat, parseReferencial, actualizar };
