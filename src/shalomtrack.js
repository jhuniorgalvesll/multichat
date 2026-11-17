'use strict';

// Rastreo público de Shalom (https://shalom.com.pe/rastrea) con el N° de orden y el código de 4 caracteres del
// ticket. Abre la página real en una ventana oculta (como un navegador normal; la página usa su propia verificación
// de Google, que corre sola) y lee el resultado que muestra. Solo lectura, sin cuentas ni claves.
// Devuelve el JSON que usa el asistente: { ok, estado, estado_reconocido, registrado_el, en_destino_el,
// entregado_el, respuesta_cliente } o { ok: false, error }. No devuelve nombres ni DNI de quien recogió.
const { BrowserWindow } = require('electron');

const URL_RASTREO = 'https://shalom.com.pe/rastrea';
const ETAPAS = ['En origen', 'En tránsito', 'En destino', 'Entregado'];
const CACHE_MS = 10 * 60 * 1000;
const cache = new Map(); // "orden|codigo" -> { at, result }
let busy = Promise.resolve();

// "12/11/26 a las 10:30" → "12/11/2026 a las 10:30"
function fecha(texto) {
  const m = String(texto || '').match(/(\d{2})\/(\d{2})\/(\d{2,4})(?:\s*a las\s*(\d{1,2}:\d{2}))?/i);
  if (!m) return null;
  const year = m[3].length === 2 ? `20${m[3]}` : m[3];
  return `${m[1]}/${m[2]}/${year}${m[4] ? ` a las ${m[4]}` : ''}`;
}

// Texto para el cliente, solo con lo que dijo Shalom.
function respuestaCliente(r) {
  const partes = [];
  if (r.estado === 'Entregado') partes.push(`Según Shalom, tu envío figura como entregado${r.entregado_el ? ` el ${r.entregado_el}` : ''}.`);
  else if (r.estado === 'En destino') partes.push(`Según Shalom, tu envío ya está en la agencia de destino${r.en_destino_el ? ` desde el ${r.en_destino_el}` : ''}.`);
  else if (r.estado === 'En tránsito') partes.push('Según Shalom, tu envío está en tránsito.');
  else if (r.estado === 'En origen') partes.push('Según Shalom, tu envío está en la agencia de origen.');
  else partes.push(`Según Shalom, el estado de tu envío es "${r.estado}".`);
  if (r.registrado_el && r.estado !== 'Entregado') partes.push(`Se registró el ${r.registrado_el}.`);
  return partes.join(' ');
}

// Corre dentro de la página: llena el formulario, busca y espera el resultado (máx. ~30 s).
function pageScript(orden, codigo) {
  return `(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const norm = (s) => String(s || '').replace(/\\s+/g, ' ').trim();
    let inputs = [];
    for (let i = 0; i < 40 && inputs.length < 2; i++) {
      inputs = [...document.querySelectorAll('input')].filter((el) => /orden/i.test(el.placeholder || el.getAttribute('aria-label') || ''));
      if (inputs.length < 2) await sleep(250);
    }
    const numero = inputs.find((el) => /n[°º]?\\s*de\\s*orden/i.test(el.placeholder || '') && !/c[oó]digo/i.test(el.placeholder || ''));
    const code = inputs.find((el) => /c[oó]digo/i.test(el.placeholder || ''));
    if (!numero || !code) return { estado_pagina: 'sin_formulario' };
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    for (const [el, v] of [[numero, ${JSON.stringify(orden)}], [code, ${JSON.stringify(codigo)}]]) {
      el.focus();
      setter.call(el, v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const boton = [...document.querySelectorAll('button')].find((b) => /buscar/i.test(b.textContent || ''));
    if (!boton) return { estado_pagina: 'sin_formulario' };
    await sleep(300);
    boton.click();
    for (let i = 0; i < 60; i++) {
      await sleep(500);
      const body = norm(document.body.innerText);
      if (/no se encontr[oó] la orden/i.test(body)) return { estado_pagina: 'no_encontrada' };
      if (/recaptcha|verificaci[oó]n/i.test(body) && /error|fall/i.test(body)) return { estado_pagina: 'verificacion' };
      const marca = [...document.querySelectorAll('body *')].find((el) => el.children.length === 0 && /N[°º]\\s*DE\\s*ORDEN\\s*:/i.test(el.textContent || ''));
      if (marca) {
        let tarjeta = marca;
        for (let k = 0; k < 4 && tarjeta.parentElement; k++) tarjeta = tarjeta.parentElement;
        // El título del estado ("En origen", "En destino"...) puede aparecer un poco después que la tarjeta.
        let titulo = tarjeta.querySelector('.text-4xl');
        for (let k = 0; k < 8 && !(titulo && norm(titulo.innerText)); k++) {
          await sleep(400);
          titulo = tarjeta.querySelector('.text-4xl');
        }
        const detalle = tarjeta.querySelector('p.text-silver-title');
        // Primera línea de la tarjeta, antes de "N° DE ORDEN" (es el estado; la leyenda de etapas va después).
        const antes = String(tarjeta.innerText || '').split(/N[°º]\\s*DE\\s*ORDEN/i)[0];
        const primera = norm((antes.split('\\n').map(norm).filter(Boolean)[0]) || '');
        return {
          primera,
          estado_pagina: 'encontrada',
          titulo: titulo ? norm(titulo.innerText) : '',
          detalle: detalle ? norm(detalle.innerText) : '',
          desde: marca.nextElementSibling ? norm(marca.nextElementSibling.innerText) : norm(marca.parentElement && marca.parentElement.innerText),
          tramos_completos: tarjeta.querySelectorAll('.bg-red-600').length,
          tramos_totales: tarjeta.querySelectorAll('.relative .absolute > div').length,
          texto: norm(tarjeta.innerText).slice(0, 1500),
        };
      }
    }
    return { estado_pagina: 'sin_respuesta' };
  })()`;
}

// Con tiempo máximo: si la página no responde, la consulta termina igual (nunca queda esperando).
const conLimite = (promesa, ms) => Promise.race([promesa, new Promise((_, rej) => setTimeout(() => rej(new Error('tiempo')), ms))]);

async function abrirPagina(win) {
  for (let intento = 0; intento < 3; intento++) {
    try {
      await conLimite(win.loadURL(URL_RASTREO), 30000);
      return;
    } catch (err) {
      if (intento === 2) throw err;
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
}

async function consultar(orden, codigo) {
  const win = new BrowserWindow({
    show: false,
    width: 1280,
    height: 900,
    webPreferences: { partition: 'persist:shalom-rastreo', sandbox: true, contextIsolation: true, backgroundThrottling: false },
  });
  try {
    await abrirPagina(win);
    const leido = await conLimite(win.webContents.executeJavaScript(pageScript(orden, codigo), true), 45000);
    return leido || { estado_pagina: 'sin_respuesta' };
  } catch (err) {
    return { estado_pagina: 'sin_respuesta', motivo: String((err && err.message) || err).slice(0, 200) };
  } finally {
    if (!win.isDestroyed()) win.destroy();
  }
}

function interpretar(leido) {
  if (leido.estado_pagina === 'no_encontrada') return { ok: false, error: 'no_encontrada' };
  if (leido.estado_pagina !== 'encontrada') return { ok: false, error: leido.estado_pagina === 'sin_formulario' ? 'pagina_cambio' : 'sin_respuesta' };
  // Nunca se toma el estado de la leyenda de etapas (que nombra a las cuatro): solo del título de la tarjeta.
  const estado = leido.titulo || leido.primera || '';
  if (!estado) return { ok: false, error: 'pagina_cambio' };
  const conocido = ETAPAS.find((e) => e.toLowerCase() === estado.toLowerCase());
  const r = {
    ok: true,
    estado: conocido || estado,
    estado_reconocido: Boolean(conocido),
    registrado_el: fecha(leido.desde),
    en_destino_el: conocido === 'En destino' ? fecha(leido.detalle) : null,
    entregado_el: conocido === 'Entregado' ? fecha(leido.detalle) : null,
  };
  r.respuesta_cliente = respuestaCliente(r);
  return r;
}

// Consulta (una a la vez; el mismo envío se recuerda 10 minutos).
function rastrear(ordenIn, codigoIn) {
  const orden = String(ordenIn || '').replace(/\D/g, '');
  const codigo = String(codigoIn || '').trim().toUpperCase();
  if (!/^\d{6,12}$/.test(orden) || !/^[A-Z0-9]{4}$/.test(codigo)) return Promise.resolve({ ok: false, error: 'datos_invalidos' });
  const key = `${orden}|${codigo}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return Promise.resolve(hit.result);
  const run = busy.then(async () => {
    const result = { transportista: 'shalom', consultado_el: new Date().toISOString(), ...interpretar(await consultar(orden, codigo)) };
    if (result.ok || result.error === 'no_encontrada') cache.set(key, { at: Date.now(), result });
    return result;
  });
  busy = run.catch(() => {});
  return run;
}

// N° de orden y código de Shalom escritos en un mensaje ("orden 9560819 código C7P9").
function detectar(texto) {
  const t = String(texto || '');
  const orden = (t.match(/(?:orden|n[°º]|nro\.?|ticket)\D{0,12}(\d{6,12})/i) || t.match(/\b(\d{7,8})\b/) || [])[1] || '';
  const codigo = ((t.match(/c[oó]d(?:igo|\.)?\s*:?\s*([A-Za-z0-9]{4})\b/i) || [])[1] || '').toUpperCase();
  return { orden, codigo };
}

// N° de orden y código leídos del texto de la foto del ticket ("NRO. ORDEN: 104122737 CÓDIGO: K3CW").
// El lector de texto a veces confunde letras y números o junta las palabras ("104122737CÓDIGO").
function desdeTicket(texto) {
  const t = String(texto || '').replace(/\r/g, ' ');
  const om = t.match(/ORDEN\s*[:.;]?\s*([0-9OoIl|]{6,12})/i);
  const orden = om ? om[1].replace(/[Oo]/g, '0').replace(/[Il|]/g, '1') : '';
  const cm = t.match(/C[OÓ0]D[IÍ1l]G[O0]\s*[:.;]?\s*([A-Za-z0-9]{4})(?![A-Za-z0-9])/i);
  const codigo = cm ? cm[1].toUpperCase() : '';
  return { orden: /^\d{6,12}$/.test(orden) ? orden : '', codigo };
}

module.exports = { rastrear, detectar, desdeTicket, interpretar, fecha, respuestaCliente, consultar };
