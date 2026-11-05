'use strict';

// Registro diario de pagos (Yape, Plin, BBVA) y de las notificaciones del celular que llegan por Enlace Móvil.
// Un archivo por día en la carpeta de datos de la app (pagos/2026-11-05.json). Solo queda en esta PC.
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const MAX_NOTIFICATIONS = 400; // por día

function dayKey(date = new Date()) {
  const d = new Date(date);
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

function read(day = dayKey()) {
  const file = fileFor(day);
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    return { payments: Array.isArray(data.payments) ? data.payments : [], notifications: Array.isArray(data.notifications) ? data.notifications : [] };
  } catch {
    return { payments: [], notifications: [] };
  }
}

function write(day, data) {
  const file = fileFor(day);
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data));
  fs.renameSync(tmp, file);
}

function addPayment({ app: payApp, name, amount, at, text }) {
  const day = dayKey(at);
  const data = read(day);
  data.payments.push({ app: payApp, name, amount, at, text: String(text || '').slice(0, 300) });
  write(day, data);
}

function addNotification({ texts, payment, at }) {
  const day = dayKey(at);
  const data = read(day);
  data.notifications.unshift({ texts: texts.slice(0, 6).map((t) => String(t).slice(0, 300)), payment: Boolean(payment), at });
  data.notifications.length = Math.min(data.notifications.length, MAX_NOTIFICATIONS);
  write(day, data);
}

// Días que tienen registro, del más nuevo al más viejo.
function days() {
  try {
    return fs.readdirSync(folder()).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).map((f) => f.slice(0, 10)).sort().reverse();
  } catch {
    return [];
  }
}

// CSV de los pagos de un día (se abre en Excel).
function csv(day) {
  const rows = [['Fecha', 'Hora', 'App', 'Nombre', 'Monto (S/)']];
  for (const p of read(day).payments) {
    const d = new Date(p.at);
    rows.push([day, d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }), p.app === 'BBVA' ? 'Plin (BBVA Empresas)' : p.app, p.name, p.amount.toFixed(2)]);
  }
  return `﻿${rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\r\n')}`;
}

module.exports = { dayKey, read, addPayment, addNotification, days, csv };
