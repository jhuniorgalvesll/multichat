'use strict';

// "Mapa de tus ventas": cuántos envíos fueron a cada departamento (y provincia), sacado de los tickets impresos.
// Solo se guardan CONTEOS por mes (nada de nombres, DNI, teléfonos ni direcciones), en esta PC, por 24 meses.
// Archivo: ventas-mapa.json en la carpeta de datos de la app.
const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { departamentoDe } = require('./shalomagencias');

const MESES = 24;
const file = () => path.join(app.getPath('userData'), 'ventas-mapa.json');
let datos = null; // { meses: { 'AAAA-MM': { Dep: { n, prov: { Prov: n } } } }, desde }

function cargar() {
  if (datos) return datos;
  try { datos = JSON.parse(fs.readFileSync(file(), 'utf8')); } catch { datos = null; }
  if (!datos || typeof datos.meses !== 'object') datos = { meses: {}, desde: Date.now() };
  return datos;
}
function guardar() {
  try {
    const tmp = `${file()}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(datos));
    fs.renameSync(tmp, file());
  } catch { /* sin espacio o sin permiso */ }
}
const mesDe = (at) => { const d = new Date(at); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };
const lugarTicket = (t) => [t && t.destination, t && t.agent, t && t.district, t && t.address].filter(Boolean).join(' / ');

// Un ticket impreso. Devuelve el departamento o null si no se reconoció el destino.
function registrar(ticket, at = Date.now()) {
  const lugar = departamentoDe(String(ticket && ticket.destination || '')) || departamentoDe(lugarTicket(ticket));
  cargar();
  const mes = mesDe(at);
  const m = datos.meses[mes] || (datos.meses[mes] = {});
  const dep = lugar ? lugar.dep : 'Sin reconocer';
  const e = m[dep] || (m[dep] = { n: 0, prov: {} });
  e.n += 1;
  if (lugar && lugar.prov) e.prov[lugar.prov] = (e.prov[lugar.prov] || 0) + 1;
  // Solo los últimos 24 meses.
  const claves = Object.keys(datos.meses).sort();
  for (const k of claves.slice(0, Math.max(0, claves.length - MESES))) delete datos.meses[k];
  guardar();
  return lugar ? lugar.dep : null;
}

// La primera vez: se suman los tickets que ya se imprimieron hoy.
function iniciar(impresionesDeHoy) {
  if (fs.existsSync(file())) return;
  cargar();
  for (const p of impresionesDeHoy || []) if (p && p.ticket) registrar(p.ticket, p.at || Date.now());
  guardar();
}

// periodo: 'mes' (este mes) | 'anterior' | '3m' | 'ano' | 'todo'
function resumen(periodo = 'mes') {
  cargar();
  const ahora = new Date();
  const mesesAtras = (n) => { const d = new Date(ahora.getFullYear(), ahora.getMonth() - n, 1); return mesDe(d); };
  let incluir;
  if (periodo === 'anterior') incluir = (k) => k === mesesAtras(1);
  else if (periodo === '3m') incluir = (k) => k >= mesesAtras(2);
  else if (periodo === 'ano') incluir = (k) => k >= mesesAtras(11);
  else if (periodo === 'todo') incluir = () => true;
  else incluir = (k) => k === mesesAtras(0);
  const deps = {};
  for (const [mes, m] of Object.entries(datos.meses)) {
    if (!incluir(mes)) continue;
    for (const [dep, e] of Object.entries(m)) {
      const d = deps[dep] || (deps[dep] = { dep, n: 0, prov: {} });
      d.n += e.n;
      for (const [p, n] of Object.entries(e.prov || {})) d.prov[p] = (d.prov[p] || 0) + n;
    }
  }
  const lista = Object.values(deps)
    .map((d) => ({ dep: d.dep, n: d.n, provincias: Object.entries(d.prov).map(([nombre, n]) => ({ nombre, n })).sort((a, b) => b.n - a.n).slice(0, 8) }))
    .sort((a, b) => b.n - a.n);
  return { periodo, total: lista.reduce((s, d) => s + d.n, 0), deps: lista, desde: datos.desde };
}

module.exports = { registrar, iniciar, resumen };
