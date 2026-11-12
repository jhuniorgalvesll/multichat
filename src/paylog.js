'use strict';

// Registro del día de trabajo: pagos (Yape, Plin, BBVA), notificaciones del celular que llegan por Enlace Móvil y
// tickets impresos. El día de trabajo empieza a las 7:00 a. m. (lo de la madrugada cuenta para el día anterior).
// Solo se guarda el día actual: al empezar el día siguiente se borra solo y todo vuelve a cero. No se exporta nada.
// Archivo en la carpeta de datos de la app (pagos/2026-11-05.json). Solo queda en esta PC.
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const MAX_NOTIFICATIONS = 400; // por día
const MAX_PRINTS = 300;
const DAY_STARTS_AT = 7; // 7:00 a. m.

// Día de trabajo de una fecha: antes de las 7:00 a. m. todavía es el día anterior.
function dayKey(date = new Date()) {
  const d = new Date(new Date(date).getTime() - DAY_STARTS_AT * 3600000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function folder() {
  const dir = path.join(app.getPath('userData'), 'pagos');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function fileFor(day) {
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? path.join(folder(), `${day}.json`) : null;
}

const list = (value) => (Array.isArray(value) ? value : []);

function read(day = dayKey()) {
  try {
    const data = JSON.parse(fs.readFileSync(fileFor(day), 'utf8'));
    return { payments: list(data.payments), notifications: list(data.notifications), prints: list(data.prints) };
  } catch {
    return { payments: [], notifications: [], prints: [] };
  }
}

function write(day, data) {
  const file = fileFor(day);
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data));
  fs.renameSync(tmp, file);
}

// Borra los días anteriores (y los archivos que no son del día actual). Se llama al abrir y cada pocos minutos.
function purgeOldDays() {
  const today = dayKey();
  try {
    for (const name of fs.readdirSync(folder())) {
      if (/^\d{4}-\d{2}-\d{2}\.json(\.tmp)?$/.test(name) && !name.startsWith(today)) fs.rmSync(path.join(folder(), name), { force: true });
    }
  } catch { /* nada que borrar */ }
}

// Solo se registra lo del día actual (un aviso atrasado de ayer no se mezcla con hoy).
function isToday(at) {
  return dayKey(at) === dayKey();
}

function addPayment({ app: payApp, name, amount, at, text, source, repeated, chat }) {
  if (!isToday(at)) return;
  const day = dayKey(at);
  const data = read(day);
  data.payments.push({
    app: payApp, name, amount, at, text: String(text || '').slice(0, 300),
    ...(source ? { source } : {}), ...(repeated ? { repeated: true } : {}),
    ...(chat ? { chat: { accountId: chat.accountId, title: String(chat.title).slice(0, 120), why: chat.why, notifId: chat.notifId } } : {}),
  });
  write(day, data);
}

function addNotification({ texts, payment, at }) {
  if (!isToday(at)) return;
  const day = dayKey(at);
  const data = read(day);
  data.notifications.unshift({ texts: texts.slice(0, 6).map((t) => String(t).slice(0, 300)), payment: Boolean(payment), at });
  data.notifications.length = Math.min(data.notifications.length, MAX_NOTIFICATIONS);
  write(day, data);
}

// Ticket impreso (o guardado en PDF): se guarda el ticket completo para poder reimprimirlo durante el día.
function addPrint(ticket, { pdf = false, chat = '' } = {}) {
  const day = dayKey();
  const data = read(day);
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  data.prints.unshift({ id, at: Date.now(), pdf: Boolean(pdf), ticket, ...(chat ? { chat: String(chat).slice(0, 120) } : {}) });
  data.prints.length = Math.min(data.prints.length, MAX_PRINTS);
  write(day, data);
}

// Ticket corregido desde "Impresiones de hoy": reemplaza al anterior en el historial (misma fila).
function updatePrint(id, ticket, { pdf = false } = {}) {
  const data = read();
  const entry = data.prints.find((p) => p.id === id);
  if (!entry) return false;
  entry.ticket = ticket;
  entry.pdf = Boolean(pdf);
  entry.editedAt = Date.now();
  write(dayKey(), data);
  return true;
}

function findPrint(id) {
  return read().prints.find((p) => p.id === id) || null;
}

// Vuelve a revisar las notificaciones guardadas del día con la versión actual del lector de pagos: los pagos que
// antes no se reconocían (por ejemplo, Yape con el nombre "Yodver Lim*") se agregan al día. Devuelve cuántos sumó.
function recover(parse, day = dayKey()) {
  const data = read(day);
  let added = 0;
  for (const n of data.notifications) {
    if (n.payment) continue;
    const texts = list(n.texts);
    if (/whatsapp|telegram|messenger|instagram/i.test(texts.join(' '))) continue;
    const p = parse(texts);
    if (!p) continue;
    n.payment = true;
    if (data.payments.some((x) => Math.abs(x.at - n.at) < 2000 && Math.abs(x.amount - p.amount) < 0.005)) continue;
    data.payments.push({ app: p.app, name: p.name, amount: p.amount, at: n.at, text: String(p.text || '').slice(0, 300) });
    added += 1;
  }
  if (added) {
    data.payments.sort((a, b) => a.at - b.at);
    write(day, data);
  }
  return added;
}

module.exports = { dayKey, read, addPayment, addNotification, addPrint, updatePrint, findPrint, recover, purgeOldDays };
