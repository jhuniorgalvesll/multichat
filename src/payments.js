'use strict';

// Avisos de pagos de Yape y Plin (BBVA) que llegan del iPhone a Windows por "Enlace Móvil".
// Windows guarda cada notificación que muestra en wpndatabase.db; aquí se leen solo las de Enlace Móvil
// que hablan de Yape o Plin. No se toca el celular, ni Yape, ni el banco: solo se lee ese archivo de la PC.
const fs = require('fs');
const os = require('os');
const path = require('path');

const POLL_MS = 5000;
// Enlace Móvil (antes "Tu teléfono"): sus notificaciones llevan este identificador de app.
const PHONE_LINK = /YourPhone|PhoneExperienceHost|PhoneLink/i;

function databasePath() {
  const base = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  return path.join(base, 'Microsoft', 'Windows', 'Notifications', 'wpndatabase.db');
}

// Textos de la notificación (<text>…</text> del XML del toast).
function toastTexts(payload) {
  const xml = Buffer.isBuffer(payload) || payload instanceof Uint8Array ? Buffer.from(payload).toString('utf8') : String(payload || '');
  const decode = (s) => s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, '&');
  return [...xml.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/gi)].map((m) => decode(m[1]).trim()).filter(Boolean);
}

const cap = (s) => s.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (_, sep, ch) => sep + ch.toUpperCase());

// Saca { app: 'Yape' | 'Plin', name, amount } del texto. Acepta varias formas, por ejemplo:
// "Junior Galvez te envió un pago por S/ 25", "¡Te yapearon S/ 25! Junior Galvez…",
// "Recibiste un Plin de MELISSA GALVEZ por S/ 50.00", "MELISSA GALVEZ te plineó S/ 50".
function parsePayment(texts) {
  const all = texts.join('\n');
  const isYape = /yape/i.test(all);
  const isPlin = /plin/i.test(all) || (/bbva/i.test(all) && /recib|abon|transfer|envi[oó]/i.test(all));
  if (!isYape && !isPlin) return null;
  const money = all.match(/S\/\.?\s*([\d.,]+)/i);
  if (!money) return null;
  let raw = money[1].replace(/[.,]$/, '');
  if (/,\d{2}$/.test(raw)) raw = raw.replace(/\./g, '').replace(',', '.');
  else raw = raw.replace(/,/g, '');
  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const body = texts.filter((t) => !/^(yape|plin|bbva|bbva per[uú]|enlace m[oó]vil)$/i.test(t)).join(' ');
  const NAME = "([\\p{L}][\\p{L} .'-]{1,60}?)";
  const patterns = [
    new RegExp(`${NAME}\\s+te\\s+(?:envi[oó]|ha enviado|yape[oó]|pline[oó]|transfiri[oó]|pag[oó])`, 'iu'),
    new RegExp(`(?:de|desde)\\s+${NAME}\\s+(?:por|de|con|a\\s+tu|S\\/)`, 'iu'),
    new RegExp(`S\\/\\.?\\s*[\\d.,]+\\s+(?:de|desde)\\s+${NAME}(?:[.,!]|\\s+(?:por|con|a\\s+tu)|$)`, 'iu'),
  ];
  let name = '';
  for (const re of patterns) {
    const m = body.match(re);
    if (m && !/^(un|una|tu|te|pago|yape|plin|bbva|s)$/i.test(m[1].trim())) {
      name = m[1].replace(/^(?:¡?te yapearon!?|¡?yape!?|recibiste un (?:pago|plin)|plin)\s*/i, '').trim();
      if (name) break;
    }
  }
  // Sin nombre del que paga no se toma como pago (p. ej. un cliente que escribe "ya te yapeé S/ 25").
  if (!name) return null;
  return { app: isYape ? 'Yape' : 'Plin', name: cap(name), amount, text: texts.join(' · ').slice(0, 300) };
}

// Vigila la base de notificaciones de Windows. onPayment(payment) por cada pago nuevo.
function createWatcher({ onPayment, onStatus = () => {} }) {
  let timer = null;
  let lastId = null; // al arrancar se toma el último Id: los avisos viejos no se repiten
  let copyDir = null;
  let status = '';

  const setStatus = (next) => {
    if (next !== status) {
      status = next;
      onStatus(status);
    }
  };

  function open(file) {
    const { DatabaseSync } = require('node:sqlite');
    try {
      return new DatabaseSync(file, { readOnly: true });
    } catch {
      // Windows tiene el archivo abierto: se lee una copia (con su diario -wal para no perder lo último).
      copyDir = copyDir || fs.mkdtempSync(path.join(os.tmpdir(), 'multichat-wpn-'));
      const copy = path.join(copyDir, 'wpn.db');
      for (const ext of ['', '-wal']) {
        fs.rmSync(copy + ext, { force: true });
        if (fs.existsSync(file + ext)) fs.copyFileSync(file + ext, copy + ext);
      }
      return new DatabaseSync(copy, { readOnly: false });
    }
  }

  function read() {
    const file = databasePath();
    if (!fs.existsSync(file)) {
      setStatus('sin-enlace');
      return [];
    }
    let db;
    try {
      db = open(file);
      if (lastId === null) {
        lastId = Number(db.prepare('SELECT MAX(Id) AS id FROM Notification').get().id) || 0;
        setStatus('ok');
        return [];
      }
      const rows = db.prepare(`
        SELECT n.Id AS id, n.Payload AS payload, h.PrimaryId AS app
        FROM Notification n JOIN NotificationHandler h ON h.RecordId = n.HandlerId
        WHERE n.Id > ? ORDER BY n.Id`).all(lastId);
      setStatus('ok');
      for (const row of rows) lastId = Math.max(lastId, Number(row.id));
      return rows;
    } catch {
      setStatus('error');
      return [];
    } finally {
      try { db?.close(); } catch { /* nada */ }
    }
  }

  function poll() {
    for (const row of read()) {
      if (!PHONE_LINK.test(String(row.app || ''))) continue;
      const texts = toastTexts(row.payload);
      if (/whatsapp|telegram|messenger|instagram/i.test(texts.join(' '))) continue; // chats, no pagos
      const payment = parsePayment(texts);
      if (payment) onPayment({ ...payment, id: row.id, at: Date.now() });
    }
  }

  // Últimas notificaciones de Enlace Móvil tal como llegan, para revisar el formato si un pago no se reconoce.
  function recentPhoneLink(limit = 8) {
    const file = databasePath();
    if (!fs.existsSync(file)) return null;
    let db;
    try {
      db = open(file);
      return db.prepare(`
        SELECT n.Payload AS payload, h.PrimaryId AS app
        FROM Notification n JOIN NotificationHandler h ON h.RecordId = n.HandlerId
        ORDER BY n.Id DESC LIMIT 200`).all()
        .filter((row) => PHONE_LINK.test(String(row.app || '')))
        .slice(0, limit)
        .map((row) => toastTexts(row.payload).join(' · '));
    } catch {
      return null;
    } finally {
      try { db?.close(); } catch { /* nada */ }
    }
  }

  return {
    start() {
      if (timer || process.platform !== 'win32') return;
      poll();
      timer = setInterval(poll, POLL_MS);
    },
    stop() {
      clearInterval(timer);
      timer = null;
      lastId = null;
    },
    get running() { return Boolean(timer); },
    get status() { return status; },
    recentPhoneLink,
  };
}

module.exports = { createWatcher, parsePayment, toastTexts, databasePath };
