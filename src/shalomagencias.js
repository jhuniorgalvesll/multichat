'use strict';

// Agencias de Shalom por lugar (departamento, provincia o distrito), desde la página oficial
// https://shalom.com.pe/agencias. Se abre la página en una ventana oculta, se escribe el lugar en su buscador
// (como lo haría una persona) y se lee la lista que la página muestra: nombre, dirección con referencia y tamaño.
// No se usa ni se descifra ningún dato interno de la página.
//
// El buscador de Shalom solo entiende el nombre oficial ("Santiago de Surco", no "Surco") y, si el nombre se repite
// en otra región ("Miraflores", "San Miguel"), muestra solo uno. Por eso:
//  1) se traducen nombres cortos y siglas de Lima (Surco, SJL, SJM, SMP, VES, VMT, Chosica…);
//  2) para distritos de Lima y Callao, además se revisa la lista completa de agencias de Lima y Callao y se suman las
//     que tienen ese distrito en su dirección;
//  3) todo se junta sin repetir. Cada lugar se recuerda 1 día; la lista de Lima y Callao, 3 días.
const fs = require('fs');
const path = require('path');
const { app, BrowserWindow } = require('electron');

const URL_AGENCIAS = process.env.MULTICHAT_SHALOM_AGENCIAS_URL || 'https://shalom.com.pe/agencias';
const CACHE_MS = 24 * 60 * 60 * 1000;
const LIMA_MS = 3 * 24 * 60 * 60 * 1000;
const cache = new Map();
let limaIndex = null; // { at, agencias } (también guardada en la PC, para no esperar cada vez)
const limaFile = () => path.join(app.getPath('userData'), 'shalom-agencias-lima.json');
function cargarLima() {
  if (limaIndex) return;
  try {
    const d = JSON.parse(fs.readFileSync(limaFile(), 'utf8'));
    if (d && Array.isArray(d.agencias) && d.agencias.length) limaIndex = d;
  } catch { /* aún no se guardó */ }
}
function guardarLima() {
  try { fs.writeFileSync(limaFile(), JSON.stringify(limaIndex)); } catch { /* sin espacio o sin permiso */ }
}
let busy = Promise.resolve();

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ ]/g, ' ').replace(/\s+/g, ' ').trim();

// Distritos de Lima Metropolitana y del Callao (nombre oficial).
const DISTRITOS_LIMA = [
  'Ancón', 'Ate', 'Barranco', 'Breña', 'Carabayllo', 'Chaclacayo', 'Chorrillos', 'Cieneguilla', 'Comas', 'El Agustino',
  'Independencia', 'Jesús María', 'La Molina', 'La Victoria', 'Lince', 'Los Olivos', 'Lurigancho', 'Lurín',
  'Magdalena del Mar', 'Miraflores', 'Pachacámac', 'Pucusana', 'Pueblo Libre', 'Puente Piedra', 'Punta Hermosa',
  'Punta Negra', 'Rímac', 'San Bartolo', 'San Borja', 'San Isidro', 'San Juan de Lurigancho', 'San Juan de Miraflores',
  'San Luis', 'San Martín de Porres', 'San Miguel', 'Santa Anita', 'Santa María del Mar', 'Santa Rosa',
  'Santiago de Surco', 'Surquillo', 'Villa El Salvador', 'Villa María del Triunfo', 'Cercado de Lima',
  'Callao', 'Bellavista', 'Carmen de la Legua', 'La Perla', 'La Punta', 'Ventanilla', 'Mi Perú',
];
// Nombres cortos y siglas → nombre oficial.
const ALIAS = {
  surco: 'Santiago de Surco', 'santiago surco': 'Santiago de Surco',
  sjl: 'San Juan de Lurigancho', 'san juan lurigancho': 'San Juan de Lurigancho',
  sjm: 'San Juan de Miraflores', 'san juan miraflores': 'San Juan de Miraflores',
  smp: 'San Martín de Porres', 'san martin porres': 'San Martín de Porres',
  ves: 'Villa El Salvador', vmt: 'Villa María del Triunfo', 'villa maria': 'Villa María del Triunfo',
  magdalena: 'Magdalena del Mar', chosica: 'Lurigancho', 'jesus maria': 'Jesús María',
  rimac: 'Rímac', lurin: 'Lurín', pachacamac: 'Pachacámac', brena: 'Breña', ancon: 'Ancón',
  cercado: 'Cercado de Lima', 'lima cercado': 'Cercado de Lima', 'cercado lima': 'Cercado de Lima',
  'mi peru': 'Mi Perú',
};
// Palabras a buscar en la dirección de cada distrito, y las que NO cuentan ("Miraflores" ≠ "San Juan de Miraflores").
const EN_DIRECCION = {
  'Santiago de Surco': { si: ['santiago de surco', 'surco'], no: [] },
  'San Juan de Lurigancho': { si: ['san juan de lurigancho', 'sjl'], no: [] },
  'San Juan de Miraflores': { si: ['san juan de miraflores', 'sjm', 's j m'], no: [] },
  'San Martín de Porres': { si: ['san martin de porres', 'smp'], no: [] },
  'Villa El Salvador': { si: ['villa el salvador', 'ves'], no: [] },
  'Villa María del Triunfo': { si: ['villa maria del triunfo', 'vmt'], no: [] },
  Miraflores: { si: ['miraflores'], no: ['san juan de miraflores'] },
  Lurigancho: { si: ['chosica', 'lurigancho'], no: ['san juan de lurigancho'] },
  'Cercado de Lima': { si: ['cercado de lima', 'cercado'], no: [] },
};

function distritoLima(lugar) {
  const n = norm(lugar);
  if (ALIAS[n]) return ALIAS[n];
  return DISTRITOS_LIMA.find((d) => norm(d) === n) || null;
}

// Qué escribir en el buscador de Shalom para un lugar (el nombre oficial primero).
function consultasPara(lugar) {
  const q = [lugar];
  const d = distritoLima(lugar);
  if (d && norm(d) !== norm(lugar) && d !== 'Cercado de Lima') q.unshift(d);
  return [...new Set(q)];
}

const conLimite = (promesa, ms) => Promise.race([promesa, new Promise((_, rej) => setTimeout(() => rej(new Error('tiempo')), ms))]);

// Corre en la página: escribe cada consulta en el buscador y devuelve las agencias de cada una.
function pageScript(consultas) {
  return `(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    let caja = null;
    for (let i = 0; i < 60 && !caja; i++) {
      caja = [...document.querySelectorAll('input')].find((el) => /departamento|provincia|distrito/i.test(el.placeholder || ''));
      if (!caja) await sleep(250);
    }
    if (!caja) return { estado: 'sin_buscador' };
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    const escribir = (v) => {
      caja.focus();
      setter.call(caja, v);
      caja.dispatchEvent(new Event('input', { bubbles: true }));
      caja.dispatchEvent(new Event('change', { bubbles: true }));
    };
    const leer = () => [...document.querySelectorAll('div.divide-y > *')]
      .map((el) => String(el.innerText || '').split('\\n').map((s) => s.replace(/\\s+/g, ' ').trim()).filter(Boolean))
      .filter((l) => l.length >= 2)
      .map((l) => ({ nombre: l[0], direccion: l[1], tipo: l[2] || '' }));
    const resultado = {};
    for (const q of ${JSON.stringify(consultas)}) {
      escribir('');
      await sleep(300);
      escribir(q);
      // Shalom a veces tarda en filtrar: se espera hasta 10 s a que la lista aparezca y deje de cambiar.
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
      if (ver) { ver.click(); await sleep(1500); }
      resultado[q] = leer();
    }
    return { estado: 'ok', resultado };
  })()`;
}

async function consultar(consultas) {
  const win = new BrowserWindow({
    show: false,
    width: 1366,
    height: 900,
    webPreferences: { partition: 'persist:shalom-agencias', sandbox: true, contextIsolation: true, backgroundThrottling: false },
  });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  try {
    await conLimite(win.loadURL(URL_AGENCIAS), 40000);
    return await conLimite(win.webContents.executeJavaScript(pageScript(consultas), true), 25000 * consultas.length + 10000);
  } catch {
    return { estado: 'sin_respuesta' };
  } finally {
    if (!win.isDestroyed()) win.destroy();
  }
}

const unicas = (lista) => {
  const vistas = new Set();
  return lista.filter((a) => {
    const k = norm(`${a.nombre}|${a.direccion}`);
    if (vistas.has(k)) return false;
    vistas.add(k);
    return true;
  });
};

// Agencias de Lima y Callao cuya dirección o nombre menciona el distrito (palabra completa).
function porDireccion(distrito, agencias) {
  const regla = EN_DIRECCION[distrito] || { si: [norm(distrito)], no: [] };
  const tiene = (texto, frase) => new RegExp(`(^| )${norm(frase)}( |$)`).test(texto);
  return agencias.filter((a) => {
    let t = norm(`${a.nombre} ${a.direccion}`);
    // "Miraflores" dentro de "San Juan de Miraflores" no cuenta.
    for (const largo of regla.no) t = t.replace(new RegExp(norm(largo), 'g'), ' ');
    return regla.si.some((f) => tiene(t, f));
  });
}

// { ok: true, lugar, agencias: [{ nombre, direccion, tipo, fuente }] } o { ok: false, error }.
function buscar(lugarIn) {
  const lugar = String(lugarIn || '').replace(/\s+/g, ' ').trim().slice(0, 60);
  if (lugar.length < 3) return Promise.resolve({ ok: false, error: 'corto' });
  const key = norm(lugar);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return Promise.resolve(hit.result);
  const run = busy.then(async () => {
    const distrito = distritoLima(lugar);
    if (distrito) cargarLima();
    const consultas = consultasPara(lugar);
    const necesitaLima = Boolean(distrito) && (!limaIndex || Date.now() - limaIndex.at > LIMA_MS);
    if (necesitaLima) consultas.push('Lima', 'Callao');
    const r = await consultar(consultas);
    if (r.estado !== 'ok') return { ok: false, error: r.estado === 'sin_buscador' ? 'pagina_cambio' : 'sin_respuesta' };
    if (necesitaLima) {
      const todas = unicas([...(r.resultado.Lima || []), ...(r.resultado.Callao || [])]);
      if (todas.length) { limaIndex = { at: Date.now(), agencias: todas }; guardarLima(); }
    }
    const deShalom = consultasPara(lugar).flatMap((q) => r.resultado[q] || []).map((a) => ({ ...a, fuente: 'shalom' }));
    const deLima = distrito && limaIndex ? porDireccion(distrito, limaIndex.agencias).map((a) => ({ ...a, fuente: 'direccion' })) : [];
    const agencias = unicas([...deShalom, ...deLima]).slice(0, 60);
    const result = { ok: true, lugar: distrito && norm(distrito) !== norm(lugar) ? `${lugar} (${distrito})` : lugar, agencias };
    cache.set(key, { at: Date.now(), result });
    return result;
  });
  busy = run.catch(() => {});
  return run;
}

// Mensaje para el cliente con las agencias elegidas (para que elija dónde recoger).
function mensaje(lugar, agencias) {
  const nums = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
  const titulo = String(lugar || '').replace(/\s*\(.*\)$/, '');
  const lineas = [`📦 *Agencias Shalom en ${titulo}*`, ''];
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

// ¿Esta búsqueda tardará más (primera vez en un distrito de Lima)?
function tardara(lugar) {
  if (!distritoLima(lugar)) return false;
  cargarLima();
  return !limaIndex || Date.now() - limaIndex.at > LIMA_MS;
}

module.exports = { buscar, mensaje, lugarDeTexto, consultasPara, distritoLima, porDireccion, tardara };
