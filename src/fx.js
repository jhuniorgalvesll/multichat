'use strict';

// Tipo de cambio del dólar (oficial y gratis): Banco Central de Reserva del Perú (BCRP), tipo de cambio interbancario
// compra (PD04639PD) y venta (PD04640PD) del último día publicado. Se pide con el motor de Chromium (como un
// navegador); si la página no responde, no se muestra nada. Se guarda y se actualiza cada 3 horas.
const { net, BrowserWindow } = require('electron');

const EVERY = 3 * 60 * 60 * 1000;
const fecha = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function url() {
  const hoy = new Date();
  const antes = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
  return `https://estadisticas.bcrp.gob.pe/estadisticas/series/api/PD04639PD-PD04640PD/json/${fecha(antes)}/${fecha(hoy)}`;
}

// {"periods":[{"name":"21.Nov.26","values":["3.367","3.373"]}, ...]} → último día con los dos valores.
function parse(texto) {
  let data;
  try {
    data = JSON.parse(String(texto || '').trim());
  } catch {
    return null;
  }
  const periodos = (data && Array.isArray(data.periods) ? data.periods : [])
    .map((p) => ({ dia: p.name, compra: Number(p.values && p.values[0]), venta: Number(p.values && p.values[1]) }))
    .filter((p) => p.compra > 0 && p.venta > 0);
  const ultimo = periodos[periodos.length - 1];
  return ultimo ? { ...ultimo, at: Date.now() } : null;
}

async function porRed() {
  const res = await net.fetch(url(), { headers: { Accept: 'application/json' } });
  return parse(await res.text());
}

// Si la página pide la verificación de su protección, una ventana oculta (navegador real) la resuelve sola.
function porVentana() {
  return new Promise((resolve) => {
    const win = new BrowserWindow({ show: false, webPreferences: { sandbox: true, contextIsolation: true, partition: 'persist:bcrp' } });
    let hecho = false;
    const fin = (v) => {
      if (hecho) return;
      hecho = true;
      clearInterval(timer);
      if (!win.isDestroyed()) win.destroy();
      resolve(v);
    };
    const timer = setInterval(async () => {
      try {
        const t = await win.webContents.executeJavaScript('document.body ? document.body.innerText : ""', true);
        const r = parse(t);
        if (r) fin(r);
      } catch { /* cargando */ }
    }, 1500);
    setTimeout(() => fin(null), 40000);
    win.loadURL(url()).catch(() => {});
  });
}

let ctx = null;
let timer = null;

async function actualizar() {
  if (!ctx) return;
  let r = null;
  try { r = await porRed(); } catch { r = null; }
  if (!r) r = await porVentana();
  if (r) {
    ctx.store.get().settings.fx = r;
    ctx.store.save();
    ctx.onChange();
  }
}

function start(options) {
  ctx = options;
  clearInterval(timer);
  const actual = ctx.store.get().settings.fx;
  if (!actual || Date.now() - (actual.at || 0) > EVERY) setTimeout(actualizar, 8000);
  timer = setInterval(actualizar, EVERY);
}

module.exports = { start, parse, actualizar };
