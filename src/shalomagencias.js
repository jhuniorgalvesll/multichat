'use strict';

// Agencias de Shalom por lugar (departamento, provincia o distrito), desde la página oficial
// https://shalom.com.pe/agencias. Se abre la página en una ventana oculta, se escribe el lugar en su buscador
// (como lo haría una persona) y se lee la lista que la página muestra: nombre, dirección con referencia y tamaño.
// No se usa ni se descifra ningún dato interno de la página.
//
// El buscador de Shalom solo entiende el nombre oficial ("Santiago de Surco", no "Surco") y, si el nombre se repite
// en otra región ("Miraflores", "San Miguel"), muestra solo uno. Por eso:
//  1) se traducen nombres cortos y siglas de Lima (Surco, SJL, SJM, SMP, VES, VMT, Chosica…);
//  2) se guarda en la PC la LISTA COMPLETA de agencias del Perú (se recorre la página departamento por departamento,
//     unas 500 agencias en 1 minuto). Se actualiza sola una vez al día: las agencias que Shalom cierra salen de la
//     lista y las nuevas entran. Si una actualización sale incompleta (sin internet, página lenta), se conserva la
//     anterior para no dar por cerradas agencias que siguen abiertas;
//  3) al buscar se juntan la búsqueda en vivo de Shalom y la lista completa (por departamento, por nombre y por
//     distrito en la dirección), sin repetir.
const fs = require('fs');
const path = require('path');
const { app, BrowserWindow } = require('electron');

const URL_AGENCIAS = process.env.MULTICHAT_SHALOM_AGENCIAS_URL || 'https://shalom.com.pe/agencias';
const CACHE_MS = 6 * 60 * 60 * 1000;
const INDICE_MS = 20 * 60 * 60 * 1000; // la lista completa se renueva si tiene más de 20 horas
const DEPARTAMENTOS = ['Amazonas', 'Áncash', 'Apurímac', 'Arequipa', 'Ayacucho', 'Cajamarca', 'Callao', 'Cusco',
  'Huancavelica', 'Huánuco', 'Ica', 'Junín', 'La Libertad', 'Lambayeque', 'Lima', 'Loreto', 'Madre de Dios', 'Moquegua',
  'Pasco', 'Piura', 'Puno', 'San Martín', 'Tacna', 'Tumbes', 'Ucayali'];
const cache = new Map();
let indice = null; // { at, agencias: [{ nombre, direccion, tipo, dep }], cambios: { at, nuevas, cerradas } }
const indiceFile = () => path.join(app.getPath('userData'), 'shalom-agencias.json');
function cargarIndice() {
  if (indice) return;
  try {
    const d = JSON.parse(fs.readFileSync(indiceFile(), 'utf8'));
    if (d && Array.isArray(d.agencias) && d.agencias.length) indice = d;
  } catch { /* aún no se guardó */ }
}
function guardarIndice() {
  try { fs.writeFileSync(indiceFile(), JSON.stringify(indice)); } catch { /* sin espacio o sin permiso */ }
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
  const d = distritoLima(lugar);
  // Nombre corto o sigla (SURCO, SJL…): solo el nombre oficial (el corto no da resultados en Shalom).
  if (d && norm(d) !== norm(lugar)) return d === 'Cercado de Lima' ? [] : [d];
  return [lugar];
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
        if (n === 0 && i >= 12) break; // 5 s sin resultados: este lugar no tiene agencias con ese nombre
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

// Agencias de la lista completa que corresponden a un lugar: su departamento, su nombre o su dirección.
function buscarEnIndice(lugar) {
  cargarIndice();
  if (!indice) return [];
  const n = norm(lugar);
  const distrito = distritoLima(lugar);
  if (distrito) return porDireccion(distrito, indice.agencias.filter((a) => ['lima', 'callao'].includes(norm(a.dep))));
  const dep = DEPARTAMENTOS.find((d) => norm(d) === n);
  if (dep) return indice.agencias.filter((a) => norm(a.dep) === n);
  const tiene = (t) => new RegExp(`(^| )${n}( |$)`).test(t);
  return indice.agencias.filter((a) => tiene(norm(`${a.nombre} ${a.direccion}`)));
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
    const consultas = consultasPara(lugar);
    const r = consultas.length ? await consultar(consultas) : { estado: 'ok', resultado: {} };
    const enVivo = r.estado === 'ok' ? consultas.flatMap((q) => r.resultado[q] || []).map((a) => ({ ...a, fuente: 'shalom' })) : [];
    const deLista = buscarEnIndice(lugar).map((a) => ({ ...a, fuente: distrito ? 'direccion' : 'lista' }));
    if (r.estado !== 'ok' && !deLista.length) return { ok: false, error: r.estado === 'sin_buscador' ? 'pagina_cambio' : 'sin_respuesta' };
    const agencias = unicas([...enVivo, ...deLista]).slice(0, 80);
    const result = { ok: true, lugar: distrito && norm(distrito) !== norm(lugar) ? `${lugar} (${distrito})` : lugar, agencias };
    if (r.estado === 'ok') cache.set(key, { at: Date.now(), result });
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

// Renueva la lista completa (todas las agencias del Perú, departamento por departamento). Devuelve los cambios
// respecto a la lista anterior: { nuevas: [...], cerradas: [...] } o null si no se pudo o no hacía falta.
const claveAgencia = (a) => norm(`${a.nombre}|${a.direccion}`);
function actualizarIndice({ forzar = false } = {}) {
  cargarIndice();
  if (!forzar && indice && Date.now() - indice.at < INDICE_MS) return Promise.resolve(null);
  const run = busy.then(async () => {
    const r = await consultar(DEPARTAMENTOS);
    if (r.estado !== 'ok') return null;
    const agencias = [];
    for (const dep of DEPARTAMENTOS) for (const a of r.resultado[dep] || []) agencias.push({ ...a, dep });
    const nueva = unicas(agencias);
    const anterior = indice ? indice.agencias : [];
    // Lista incompleta (página lenta o sin internet): no se reemplaza, para no "cerrar" agencias que siguen abiertas.
    if (nueva.length < 300 || (anterior.length && nueva.length < anterior.length * 0.85)) return null;
    const antes = new Set(anterior.map(claveAgencia));
    const ahora = new Set(nueva.map(claveAgencia));
    const cambios = anterior.length ? {
      at: Date.now(),
      nuevas: nueva.filter((a) => !antes.has(claveAgencia(a))),
      cerradas: anterior.filter((a) => !ahora.has(claveAgencia(a))),
    } : null;
    indice = { at: Date.now(), agencias: nueva, cambios: cambios && (cambios.nuevas.length || cambios.cerradas.length) ? cambios : (indice && indice.cambios) || null };
    guardarIndice();
    cache.clear();
    return cambios;
  });
  busy = run.catch(() => {});
  return run;
}

// Resumen de la lista para la ventana: cuántas agencias, de cuándo y los últimos cambios.
function estado() {
  cargarIndice();
  if (!indice) return null;
  const c = indice.cambios;
  return {
    total: indice.agencias.length,
    at: indice.at,
    cambios: c ? { at: c.at, nuevas: c.nuevas.slice(0, 20), cerradas: c.cerradas.slice(0, 20), nNuevas: c.nuevas.length, nCerradas: c.cerradas.length } : null,
  };
}

// ¿Esta búsqueda tardará más? (todavía no hay lista completa en la PC)
function tardara() {
  cargarIndice();
  return !indice;
}

module.exports = { buscar, mensaje, lugarDeTexto, consultasPara, distritoLima, porDireccion, tardara, actualizarIndice, estado, buscarEnIndice };
