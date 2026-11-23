'use strict';

// "Mismos ajustes en varias PCs": guarda las respuestas rápidas (con sus fotos), los remitentes del ticket (logo y
// QR), los formularios de envío, las opciones de envío, los datos del negocio y las páginas de rastreo en un archivo
// dentro de una carpeta que se sincroniza sola (OneDrive, Google Drive, Dropbox...). Cada PC con la misma carpeta
// elegida toma los cambios de las otras. Gana el último cambio. No se comparten cuentas, chats, pagos ni claves.
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { templateImages, ticketImages } = require('./media');

const FILE = 'MultiChat-ajustes.json';
const EVERY = 30 * 1000;

let ctx = null; // { store, onApplied }
let timer = null;
let lastHash = '';

const hash = (v) => crypto.createHash('sha1').update(JSON.stringify(v)).digest('hex');

// Lo que se comparte entre PCs.
function snapshotData() {
  const data = ctx.store.get();
  const s = data.settings;
  return {
    templates: data.templates || [],
    ticketProfiles: data.ticketProfiles || [],
    shippingForms: s.shippingForms || null,
    shippingInfo: typeof s.shippingInfo === 'string' ? s.shippingInfo : null,
    aiContext: s.aiContext || '',
    trackingUrls: s.trackingUrls || null,
  };
}

function imagesOf(d) {
  const tpl = d.templates.flatMap((t) => (Array.isArray(t.images) ? t.images : [])).map((n) => [templateImages, n]);
  const prof = d.ticketProfiles.flatMap((p) => [p.logo, p.qr]).filter(Boolean).map((n) => [ticketImages, n]);
  return [...tpl, ...prof];
}

function folder() {
  const dir = ctx.store.get().settings.syncFolder;
  return dir && fs.existsSync(dir) ? dir : '';
}

function deviceId() {
  const s = ctx.store.get().settings;
  if (!s.syncDevice) {
    s.syncDevice = crypto.randomBytes(6).toString('hex');
    ctx.store.save();
  }
  return s.syncDevice;
}

// Escribe el archivo compartido si los datos de esta PC cambiaron.
function push(force = false) {
  const dir = folder();
  if (!dir) return false;
  const data = snapshotData();
  const h = hash(data);
  if (!force && h === lastHash) return false;
  const images = {};
  for (const [store, name] of imagesOf(data)) {
    const file = store.filePath(name);
    if (file && fs.existsSync(file)) images[name] = fs.readFileSync(file).toString('base64');
  }
  const out = { app: 'MultiChat Pro', version: 1, device: deviceId(), pc: os.hostname(), updatedAt: Date.now(), data, images };
  const target = path.join(dir, FILE);
  fs.writeFileSync(`${target}.tmp`, JSON.stringify(out));
  fs.renameSync(`${target}.tmp`, target);
  lastHash = h;
  const s = ctx.store.get().settings;
  s.syncAppliedAt = out.updatedAt;
  s.syncLastAt = out.updatedAt;
  ctx.store.save();
  return true;
}

// Toma los cambios de otra PC (si el archivo es más nuevo que lo último que esta PC escribió o tomó).
function pull() {
  const dir = folder();
  if (!dir) return false;
  let snap;
  try {
    snap = JSON.parse(fs.readFileSync(path.join(dir, FILE), 'utf8'));
  } catch {
    return false;
  }
  const s = ctx.store.get().settings;
  if (!snap || snap.app !== 'MultiChat Pro' || !snap.data || snap.device === deviceId()) return false;
  if (Number(snap.updatedAt) <= Number(s.syncAppliedAt || 0)) return false;
  // Fotos primero (mismo nombre en esta PC).
  const d = snap.data;
  for (const [store, name] of imagesOf({ templates: d.templates || [], ticketProfiles: d.ticketProfiles || [] })) {
    const b64 = snap.images && snap.images[name];
    const file = store.filePath(name);
    if (b64 && file && !fs.existsSync(file)) fs.writeFileSync(file, Buffer.from(b64, 'base64'));
  }
  const data = ctx.store.get();
  if (Array.isArray(d.templates)) data.templates = d.templates;
  if (Array.isArray(d.ticketProfiles)) data.ticketProfiles = d.ticketProfiles;
  if (d.shippingForms && typeof d.shippingForms === 'object') s.shippingForms = d.shippingForms;
  if (typeof d.shippingInfo === 'string') s.shippingInfo = d.shippingInfo;
  if (typeof d.aiContext === 'string') s.aiContext = d.aiContext;
  if (d.trackingUrls && typeof d.trackingUrls === 'object') s.trackingUrls = d.trackingUrls;
  s.syncAppliedAt = Number(snap.updatedAt);
  s.syncLastAt = Date.now();
  ctx.store.save();
  lastHash = hash(snapshotData());
  if (ctx.onApplied) ctx.onApplied(snap.pc || 'otra PC');
  return true;
}

function tick() {
  try {
    // Primero se toman los cambios de otra PC; si no hubo, se suben los de esta.
    if (!pull()) push();
  } catch { /* carpeta no disponible por ahora */ }
}

function start(options) {
  ctx = options;
  clearInterval(timer);
  timer = null;
  if (!folder()) return;
  lastHash = '';
  tick();
  timer = setInterval(tick, EVERY);
}

function status() {
  const s = ctx ? ctx.store.get().settings : {};
  return { folder: s.syncFolder || '', lastAt: s.syncLastAt || 0 };
}

module.exports = { start, tick, status, FILE };
