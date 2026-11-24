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
//  3) la app trae la lista completa del día en que se publicó, así que buscar es INSTANTÁNEO desde el primer uso
//     (por departamento, por nombre y por distrito en la dirección). Solo si un lugar no aparece en la lista se
//     pregunta en vivo a la página de Shalom (máximo 8 segundos).
// Los datos que la página recibe vienen cifrados y protegidos con reCAPTCHA: no se tocan; se lee lo que la página
// muestra, igual que una persona.
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
let indice = null; // { at, agencias: [{ nombre, direccion, tipo, dep }], cambios: { at, nuevas, cerradas }, incluida }
let ultimoIntento = null; // { at, ok, error } de la última actualización en segundo plano
const indiceFile = () => path.join(app.getPath('userData'), 'shalom-agencias.json');
// Lista que viene dentro de la app (todas las agencias del Perú el día que se publicó la versión): así la búsqueda
// es instantánea desde el primer día, aunque la PC todavía no haya descargado la lista del día.
const INCLUIDA = path.join(__dirname, 'data', 'shalom-agencias.json');
function cargarIndice() {
  if (indice) return;
  let propia = null;
  let incluida = null;
  try { propia = JSON.parse(fs.readFileSync(indiceFile(), 'utf8')); } catch { /* aún no se guardó */ }
  try { incluida = JSON.parse(fs.readFileSync(INCLUIDA, 'utf8')); } catch { /* no debería faltar */ }
  const valida = (d) => d && Array.isArray(d.agencias) && d.agencias.length >= 100;
  // Una lista guardada sin fichas (versiones anteriores) no reemplaza a la incluida, que trae pesos y horarios.
  const conFichas = (d) => d.agencias.some((a) => a.ubicacion);
  if (valida(propia) && (!valida(incluida) || (propia.at >= incluida.at && (conFichas(propia) || !conFichas(incluida))))) indice = propia;
  else if (valida(incluida)) indice = { ...incluida, incluida: true, cambios: (valida(propia) && propia.cambios) || null };
}
function guardarIndice() {
  try { fs.writeFileSync(indiceFile(), JSON.stringify(indice)); } catch { /* sin espacio o sin permiso */ }
}
let actualizando = null;

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
function pageScript(consultas, detalle = false) {
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
    // Ficha de cada agencia (clic en la agencia, como una persona): ubicación, pesos que envía y recibe
    // (el cuadro que sale al pasar el mouse por el tamaño), horario y teléfono. Luego se cierra la ficha.
    const items = () => [...document.querySelectorAll('div.divide-y > *')];
    const limpio = (s) => String(s || '').replace(/\\s+/g, ' ').replace(/\\s+([.,])/g, '$1').trim();
    const ficha = () => {
      const s = [...document.querySelectorAll('span.text-red-shalom.text-xs')].find((x) => x.offsetParent);
      if (!s) return null;
      let e = s;
      for (let k = 0; k < 10 && e; k++) { e = e.parentElement; if (e && /DOMINGO|LUNES|LLEGAR/i.test(e.innerText) && e.querySelector('p')) break; }
      return e ? { e, s } : null;
    };
    // Se busca cada agencia por su nombre (no por su posición: la lista puede reordenarse al cerrar la ficha).
    const cerrarFicha = () => {
      const f = ficha();
      const x = f && [...f.e.querySelectorAll('div.cursor-pointer')].find((d) => d.querySelector('svg') && !d.querySelector('span'));
      if (x) x.click();
    };
    const detalles = async (nombres, q) => {
      const out = {};
      for (const nombre of nombres) {
        let it = null;
        for (let k = 0; k < 40 && !it; k++) {
          it = items().find((x) => limpio(String(x.innerText || '').split('\\n')[0]) === nombre);
          // Si la lista desapareció (quedó abierta una ficha), se cierra; si sigue sin lista, se vuelve a buscar.
          if (!it && !items().length) {
            if (k % 10 === 3) cerrarFicha();
            if (k % 10 === 8) { escribir(''); await sleep(200); escribir(q); await sleep(1200); }
          }
          if (!it) {
            const ver = [...document.querySelectorAll('button, a, span, div')].find((el) => el.children.length === 0 && /^ver todo$/i.test((el.textContent || '').trim()));
            if (ver && k % 5 === 0) ver.click();
            await sleep(100);
          }
        }
        if (!it) continue;
        it.click();
        let f = null;
        for (let k = 0; k < 30 && !f; k++) { await sleep(100); f = ficha(); }
        if (!f) continue;
        const ps = [...f.e.querySelectorAll('p')].map((x) => limpio(x.innerText));
        f.s.parentElement.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        let tip = '';
        for (let k = 0; k < 10 && !tip; k++) { await sleep(80); tip = [...f.e.querySelectorAll('.tooltip')].map((t) => t.innerText).join('\\n'); }
        const horario = [];
        f.e.querySelectorAll('div.font-bold').forEach((b) => { const v = b.nextElementSibling; if (v) horario.push(limpio(b.innerText) + ': ' + limpio(v.innerText)); });
        const telefono = [...f.e.querySelectorAll('div')].map((d) => (d.children.length === 0 ? limpio(d.innerText) : '')).find((t) => /^[\\d\\s()+-]{6,}$/.test(t)) || '';
        // Solo si la ficha abierta es la de esta agencia.
        if (limpio(ps[0]).toLowerCase() === nombre.toLowerCase()) {
          out[nombre] = {
            ubicacion: ps[1] || '',
            envia: limpio((tip.match(/Env[ií]a:?\\s*(.+)/i) || [])[1]),
            recibe: limpio((tip.match(/Recibe:?\\s*(.+)/i) || [])[1]),
            horario,
            telefono,
          };
        }
        f.s.parentElement.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
        cerrarFicha();
        for (let k = 0; k < 30 && !items().length; k++) await sleep(100);
      }
      return out;
    };
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
      if (${detalle ? 'true' : 'false'}) {
        const det = await detalles([...new Set(resultado[q].map((a) => limpio(a.nombre)))], q);
        resultado[q] = resultado[q].map((a) => (det[limpio(a.nombre)] ? { ...a, ...det[limpio(a.nombre)] } : a));
      }
    }
    return { estado: 'ok', resultado };
  })()`;
}

async function consultar(consultas, maxMs = 0, detalle = false) {
  const win = new BrowserWindow({
    show: false,
    width: 1366,
    height: 900,
    // En Windows una ventana oculta normal no "pinta" la página y la lista de Shalom sale vacía (0 agencias).
    // Con dibujo fuera de pantalla (offscreen) la página se comporta como visible, sin mostrarse.
    webPreferences: { partition: 'persist:shalom-agencias', sandbox: true, contextIsolation: true, backgroundThrottling: false, offscreen: true },
  });
  try { win.webContents.setFrameRate(10); } catch { /* opcional */ }
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  const t0 = Date.now();
  try {
    await conLimite(win.loadURL(URL_AGENCIAS), maxMs || 40000);
    const resto = maxMs ? Math.max(1000, maxMs - (Date.now() - t0)) : 25000 * consultas.length + 10000 + (detalle ? 20 * 60 * 1000 : 0);
    return await conLimite(win.webContents.executeJavaScript(pageScript(consultas, detalle), true), resto);
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

// Partes de la ubicación oficial ("Junin / Huancayo / El Tambo / Pio Pata" → departamento, provincia, distrito).
const partesUbicacion = (a) => String(a.ubicacion || '').split('/').map(norm).filter(Boolean).slice(0, 3);
// Ubicación para mostrar: sin el nombre de la agencia al final.
function ubicacionCorta(a) {
  const p = String(a.ubicacion || '').split('/').map((x) => x.trim()).filter(Boolean);
  if (p.length >= 4 || (p.length > 1 && norm(p[p.length - 1]) === norm(a.nombre))) p.pop();
  return p.join(' / ');
}

// Agencias de la lista completa que corresponden a un lugar: su departamento, su provincia o distrito oficial
// (de la ficha de Shalom), su nombre o su dirección.
function buscarEnIndice(lugar) {
  cargarIndice();
  if (!indice) return [];
  const n = norm(lugar);
  if (!n) return [];
  const distrito = distritoLima(lugar);
  if (distrito) {
    const limaCallao = indice.agencias.filter((a) => ['lima', 'callao'].includes(norm(a.dep)));
    const nd = norm(distrito);
    const porUbicacion = limaCallao.filter((a) => partesUbicacion(a)[2] === nd || (nd === 'cercado de lima' && partesUbicacion(a)[2] === 'lima'));
    return unicas([...porUbicacion, ...porDireccion(distrito, limaCallao)]);
  }
  const dep = DEPARTAMENTOS.find((d) => norm(d) === n);
  if (dep) return indice.agencias.filter((a) => norm(a.dep) === n);
  // Provincia o distrito oficial (p. ej. "Huancayo" trae también Sapallanga, El Tambo y Chilca).
  const porUbicacion = indice.agencias.filter((a) => partesUbicacion(a).slice(1).includes(n));
  const tiene = (t) => new RegExp(`(^| )${n}( |$)`).test(t);
  const porTexto = indice.agencias.filter((a) => tiene(norm(`${a.nombre} ${a.direccion}`)));
  return unicas([...porUbicacion, ...porTexto]);
}

// { ok: true, lugar, agencias: [{ nombre, direccion, tipo, fuente }] } o { ok: false, error }.
// Primero la lista guardada en la PC (al instante). Solo si ahí no hay nada se pregunta a la página de Shalom,
// con 8 segundos como máximo.
const VIVO_MS = 8000;
async function buscar(lugarIn) {
  const lugar = String(lugarIn || '').replace(/\s+/g, ' ').trim().slice(0, 60);
  if (lugar.length < 3) return { ok: false, error: 'corto' };
  const key = norm(lugar);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.result;
  const distrito = distritoLima(lugar);
  const nombre = distrito && norm(distrito) !== norm(lugar) ? `${lugar} (${distrito})` : lugar;
  const deLista = buscarEnIndice(lugar).map((a) => ({ ...a, fuente: distrito ? 'direccion' : 'lista' }));
  if (deLista.length) {
    // Ordenadas por provincia y distrito (como en la ficha oficial), para que la lista no salga desordenada.
    const orden = (x) => norm(String(x.ubicacion || `${x.dep} / ${x.nombre}`));
    const result = { ok: true, lugar: nombre, agencias: unicas(deLista).sort((x, y) => orden(x).localeCompare(orden(y))).slice(0, 80) };
    cache.set(key, { at: Date.now(), result });
    return result;
  }
  const consultas = consultasPara(lugar);
  if (!consultas.length) return { ok: true, lugar: nombre, agencias: [] };
  const r = await consultar(consultas, VIVO_MS);
  if (r.estado !== 'ok') return { ok: true, lugar: nombre, agencias: [], sinRespuesta: true };
  const enVivo = consultas.flatMap((q) => r.resultado[q] || []).map((a) => ({ ...a, fuente: 'shalom' }));
  const result = { ok: true, lugar: nombre, agencias: unicas(enVivo).slice(0, 80) };
  cache.set(key, { at: Date.now(), result });
  return result;
}

// Después de mostrar la lista guardada: pregunta a Shalom (máx. 8 s, en segundo plano) por si hay agencias de ese
// lugar cuya dirección no lo menciona (p. ej. "Sapallanga" al buscar Huancayo). Devuelve solo las que faltaban.
let turnoCompletar = 0;
let enCurso = Promise.resolve();
async function completar(lugarIn) {
  const lugar = String(lugarIn || '').replace(/\s+/g, ' ').trim().slice(0, 60);
  const n = norm(lugar);
  if (lugar.length < 3 || distritoLima(lugar) || DEPARTAMENTOS.some((d) => norm(d) === n)) return [];
  const hit = cache.get(n);
  if (!hit || hit.completo) return [];
  // Mientras se escribe llegan varios pedidos: uno a la vez y solo el último.
  const mio = ++turnoCompletar;
  await enCurso;
  if (mio !== turnoCompletar || hit.completo) return [];
  hit.completo = true;
  const p = consultar(consultasPara(lugar), VIVO_MS);
  enCurso = p.catch(() => {});
  const r = await p;
  if (r.estado !== 'ok') { hit.completo = false; return []; }
  const ya = new Set(hit.result.agencias.map(claveAgencia));
  const extra = unicas(Object.values(r.resultado).flat()).filter((a) => !ya.has(claveAgencia(a))).map((a) => ({ ...a, fuente: 'shalom' }));
  hit.result = { ...hit.result, agencias: [...hit.result.agencias, ...extra].slice(0, 80) };
  return extra;
}

// "HASTA 200 KG / 3 M3" → "hasta 200 kg / 3 m³"
const peso = (t) => String(t || '').toLowerCase().replace(/\bm3\b/g, 'm³').replace(/paquete (\w)\b/, (_m, l) => `paquete ${l.toUpperCase()}`).trim();
// "LUNES A SÁBADOS: 08:00 AM A 08:00 PM" → "Lunes a sábados: 08:00 a. m. a 08:00 p. m."
const hora = (t) => {
  const [dias, horas = ''] = String(t || '').split(/:\s(.+)/);
  const d = dias.toLowerCase();
  return `${d.charAt(0).toUpperCase()}${d.slice(1)}: ${horas.replace(/\bA\b/g, 'a').replace(/\bAM\b/g, 'a. m.').replace(/\bPM\b/g, 'p. m.')}`.trim();
};

// Mensaje para el cliente con las agencias elegidas, con el mismo orden y datos que la ficha de la página oficial
// de Shalom (nombre, ubicación, dirección, tamaño con los pesos, horario y teléfono), cada dato en su línea y con
// espacios entre bloques para que en el celular se lea limpio, sin "a km" ni "Cómo llegar".
function mensaje(lugar, agencias) {
  const nums = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
  const titulo = String(lugar || '').replace(/\s*\(.*\)$/, '').toLowerCase().replace(/(^|\s)(\S)/g, (_m, e, l) => e + l.toUpperCase()).replace(/ (De|Del|La|Las|Los|El) /g, (m) => m.toLowerCase());
  const limpia = (t) => String(t || '').replace(/\s+([.,])/g, '$1').replace(/\s+/g, ' ').trim();
  const bloques = agencias.map((a, i) => {
    const b = [`${agencias.length > 1 ? `${nums[i] || `${i + 1}.`} ` : ''}*${limpia(a.nombre).toUpperCase()}*`];
    if (a.ubicacion) b.push('', limpia(a.ubicacion));
    b.push('', limpia(a.direccion));
    const pesos = [a.envia && `Envía: ${peso(a.envia)}`, a.recibe && `Recibe: ${peso(a.recibe)}`].filter(Boolean);
    if (a.tipo || pesos.length) b.push('', ...[a.tipo && `🏢 Agencia ${limpia(a.tipo).toLowerCase()}`, ...pesos.map((x) => `⚖️ ${x}`)].filter(Boolean));
    if (Array.isArray(a.horario) && a.horario.length) {
      b.push('');
      for (const h of a.horario) {
        const [dias, horas = ''] = String(h).split(/:\s(.+)/);
        b.push(`🕗 *${limpia(dias)}*`, limpia(horas));
      }
    }
    if (a.telefono) b.push('', `📞 ${limpia(a.telefono)}`);
    return b.join('\n');
  });
  return [`📦 *AGENCIAS SHALOM EN ${titulo.toUpperCase()}*`, '', bloques.join('\n\n━━━━━━━━━━━━━━\n\n'), '', '━━━━━━━━━━━━━━', '', '¿En cuál agencia prefieres recoger tu pedido? 😊'].join('\n');
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
  if (!forzar && indice && !indice.incluida && Date.now() - indice.at < INDICE_MS) return Promise.resolve(null);
  if (actualizando) return actualizando;
  actualizando = (async () => {
    const r = await consultar(DEPARTAMENTOS, 0, true);
    if (r.estado !== 'ok') {
      ultimoIntento = { at: Date.now(), ok: false, error: r.estado === 'sin_buscador' ? 'La página de Shalom no cargó su buscador' : 'La página de Shalom no respondió a tiempo' };
      return null;
    }
    const agencias = [];
    for (const dep of DEPARTAMENTOS) for (const a of r.resultado[dep] || []) agencias.push({ ...a, dep });
    const anterior = indice ? indice.agencias : [];
    // Si la ficha de alguna agencia no se pudo leer esta vez, se conserva la de la lista anterior.
    const previas = new Map(anterior.map((a) => [claveAgencia(a), a]));
    const nueva = unicas(agencias).map((a) => {
      const vieja = previas.get(claveAgencia(a));
      return a.ubicacion || !vieja ? a : { ...vieja, ...a, ubicacion: vieja.ubicacion, envia: vieja.envia, recibe: vieja.recibe, horario: vieja.horario, telefono: vieja.telefono };
    });
    // Lista incompleta (página lenta o sin internet): no se reemplaza, para no "cerrar" agencias que siguen abiertas.
    if (nueva.length < 300 || (anterior.length && nueva.length < anterior.length * 0.85)) {
      ultimoIntento = { at: Date.now(), ok: false, error: `La página de Shalom mostró solo ${nueva.length} agencias` };
      return null;
    }
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
    ultimoIntento = { at: Date.now(), ok: true };
    return cambios;
  })().finally(() => { actualizando = null; });
  return actualizando;
}

// Resumen de la lista para la ventana: cuántas agencias, de cuándo y los últimos cambios.
function estado() {
  cargarIndice();
  if (!indice) return null;
  const c = indice.cambios;
  return {
    total: indice.agencias.length,
    at: indice.at,
    incluida: Boolean(indice.incluida),
    actualizando: Boolean(actualizando),
    fallo: ultimoIntento && !ultimoIntento.ok ? ultimoIntento : null,
    cambios: c ? { at: c.at, nuevas: c.nuevas.slice(0, 20), cerradas: c.cerradas.slice(0, 20), nNuevas: c.nuevas.length, nCerradas: c.cerradas.length } : null,
  };
}

// ¿Esta búsqueda tardará? (el lugar no está en la lista guardada: se pregunta a Shalom, máx. 8 s)
function tardara(lugar) {
  return !buscarEnIndice(String(lugar || '')).length;
}

module.exports = { pageScript, ubicacionCorta, peso, hora, buscar, completar, mensaje, lugarDeTexto, consultasPara, distritoLima, porDireccion, tardara, actualizarIndice, estado, buscarEnIndice };
