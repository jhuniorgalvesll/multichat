'use strict';

// Consulta RUC / DNI en la página oficial de SUNAT, en una ventana VISIBLE de MultiChat (gratis).
// La página de SUNAT tiene sus propias verificaciones (Cloudflare y Google): no se esquivan; si aparece la de
// Cloudflare, la persona la marca en la ventana. MultiChat solo escribe el número, pulsa "Buscar" una vez y lee el
// resultado que SUNAT muestra (RUC, razón social, estado, condición, domicilio fiscal) para copiarlo.
const { BrowserWindow } = require('electron');

const URL_SUNAT = process.env.MULTICHAT_SUNAT_URL || 'https://e-consultaruc.sunat.gob.pe/cl-ti-itmrconsruc/FrameCriterioBusquedaWeb.jsp';

// Llena el formulario (por RUC o por DNI) y pulsa Buscar. Devuelve true si lo encontró.
function fillScript(tipo, numero) {
  return `(() => {
    const $ = (id) => document.getElementById(id);
    const set = (el, v) => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(el, v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };
    if (${JSON.stringify(tipo)} === 'ruc') {
      if ($('btnPorRuc')) $('btnPorRuc').click();
      const caja = $('txtRuc');
      if (!caja || !$('btnAceptar')) return false;
      set(caja, ${JSON.stringify(numero)});
    } else {
      if ($('btnPorDocumento')) $('btnPorDocumento').click();
      const tipoDoc = $('cmbTipdoc');
      const caja = $('txtNumeroDocumento');
      if (!caja || !$('btnAceptar')) return false;
      if (tipoDoc) { tipoDoc.value = '1'; tipoDoc.dispatchEvent(new Event('change', { bubbles: true })); }
      set(caja, ${JSON.stringify(numero)});
    }
    setTimeout(() => $('btnAceptar').click(), 400);
    return true;
  })()`;
}

// Lee la ficha del contribuyente ("Número de RUC:" seguido de su valor, etc.). Si hay una lista con un solo
// resultado (búsqueda por DNI), la abre. Devuelve { estado: 'ficha', datos } | { estado: 'lista', n } | { estado: '' }.
const READ_SCRIPT = `(() => {
  const norm = (s) => String(s || '').replace(/\\s+/g, ' ').trim();
  const lineas = String(document.body ? document.body.innerText : '').split('\\n').map(norm).filter(Boolean);
  const valor = (re) => {
    const i = lineas.findIndex((l) => re.test(l));
    if (i < 0) return '';
    const mismo = lineas[i].replace(re, '').replace(/^[:\\s]+/, '');
    return mismo || lineas[i + 1] || '';
  };
  if (lineas.some((l) => /^N\\S{1,3}mero de RUC/i.test(l))) {
    return {
      estado: 'ficha',
      datos: {
        ruc: valor(/^N\\S{1,3}mero de RUC:?/i),
        tipo: valor(/^Tipo (de )?Contribuyente:?/i),
        nombreComercial: valor(/^Nombre Comercial:?/i),
        estadoContribuyente: valor(/^Estado( del Contribuyente)?:?$/i) || valor(/^Estado del Contribuyente:?/i),
        condicion: valor(/^Condici\\S{1,3}n( del Contribuyente)?:?$/i) || valor(/^Condici\\S{1,3}n del Contribuyente:?/i),
        domicilio: valor(/^Domicilio Fiscal:?/i),
      },
    };
  }
  const items = [...document.querySelectorAll('a.aRucs, .aRucs')];
  if (items.length === 1) { items[0].click(); return { estado: 'abriendo' }; }
  if (items.length > 1) return { estado: 'lista', n: items.length };
  if (/no se encontr|no existe|no registra/i.test(lineas.join(' '))) return { estado: 'no_encontrado' };
  return { estado: '' };
})()`;

let ventana = null;

// tipo: 'ruc' | 'dni'. onResult({ ok, datos } | { ok: false, error }) se llama una vez.
function consultar({ tipo, numero, parent, onResult }) {
  if (ventana && !ventana.isDestroyed()) ventana.destroy();
  const win = new BrowserWindow({
    width: 980,
    height: 760,
    parent: parent || undefined,
    title: 'Consulta RUC · SUNAT',
    autoHideMenuBar: true,
    webPreferences: { partition: 'persist:sunat', sandbox: true, contextIsolation: true },
  });
  ventana = win;
  let llenado = false;
  let terminado = false;
  const fin = (result) => {
    if (terminado) return;
    terminado = true;
    clearInterval(timer);
    onResult(result);
  };
  // Revisa la página cada segundo: cuando aparece el formulario (después de la verificación) lo llena una vez,
  // y cuando aparece la ficha la lee.
  const timer = setInterval(async () => {
    if (win.isDestroyed()) return fin({ ok: false, error: 'cerrada' });
    try {
      const wc = win.webContents;
      if (!llenado) {
        llenado = Boolean(await wc.executeJavaScript(fillScript(tipo, numero), true));
        return;
      }
      const leido = await wc.executeJavaScript(READ_SCRIPT, true);
      if (leido.estado === 'ficha' && leido.datos.ruc) fin({ ok: true, datos: leido.datos });
      else if (leido.estado === 'no_encontrado') {
        fin({ ok: false, error: 'no_encontrado' });
        if (!win.isDestroyed()) win.close(); // el mensaje ya se muestra en MultiChat
      }
      else if (leido.estado === 'lista') fin({ ok: false, error: 'varios', n: leido.n });
    } catch { /* la página está cargando */ }
  }, 1000);
  win.on('closed', () => { if (ventana === win) ventana = null; fin({ ok: false, error: 'cerrada' }); });
  win.loadURL(URL_SUNAT).catch(() => fin({ ok: false, error: 'sin_conexion' }));
  // 3 minutos como máximo (por si nadie marca la verificación).
  setTimeout(() => fin({ ok: false, error: 'tiempo' }), 180000);
  return win;
}

// RUC (11 dígitos que empiezan con 10, 15, 16, 17 o 20) o DNI (8 dígitos) dentro de un texto.
function detectar(texto) {
  const t = String(texto || '');
  const ruc = (t.match(/\b(10|15|16|17|20)\d{9}\b/) || [])[0];
  if (ruc) return { tipo: 'ruc', numero: ruc };
  const dni = (t.match(/\b\d{8}\b/) || [])[0];
  if (dni) return { tipo: 'dni', numero: dni };
  return null;
}

module.exports = { consultar, detectar };
