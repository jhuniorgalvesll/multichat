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
// "Recibiste un Plin de MELISSA GALVEZ por S/ 50.00", "MELISSA GALVEZ te plineó S/ 50",
// BBVA Empresas: "Cobro con QR" · "HUGO PAUL DIAZ BLACIDO  te hizo un pago de S/ 11.0".
const PAYMENT_PHRASE = /te\s+(?:envi[oó]|ha enviado|hizo|yape[oó]|pline[oó]|transfiri[oó]|pag[oó])|yapearon|recibiste|cobro con qr|abono/i;

function parsePayment(texts) {
  const all = texts.join('\n');
  const isYape = /yape/i.test(all);
  const isBank = /plin|bbva/i.test(all);
  if (!isYape && !isBank && !/cobro con qr/i.test(all)) return null;
  if (!PAYMENT_PHRASE.test(all)) return null;
  const money = all.match(/S\/\.?\s*([\d.,]+)/i);
  if (!money) return null;
  let raw = money[1].replace(/[.,]$/, '');
  if (/,\d{2}$/.test(raw)) raw = raw.replace(/\./g, '').replace(',', '.');
  else raw = raw.replace(/,/g, '');
  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  // El nombre se busca en cada línea por separado (título, cuerpo...), así no se mezcla con el nombre de la app.
  const lines = texts.map((t) => t.replace(/\s+/g, ' ').trim())
    .filter((t) => !/^(yape|plin|bbva|bbva ?empresas|bbva per[uú]|enlace m[oó]vil|cobro con qr)$/i.test(t));
  const NAME = "([\\p{L}][\\p{L} .'-]{1,60}?)";
  const patterns = [
    new RegExp(`^(?:¡?te yapearon!?\\s*|¡?yape!?\\s*)?${NAME}\\s+te\\s+(?:envi[oó]|ha enviado|hizo|yape[oó]|pline[oó]|transfiri[oó]|pag[oó])`, 'iu'),
    new RegExp(`(?:de|desde)\\s+${NAME}\\s+(?:por|de|con|a\\s+tu|S\\/)`, 'iu'),
    new RegExp(`S\\/\\.?\\s*[\\d.,]+\\s+(?:de|desde)\\s+${NAME}(?:[.,!]|\\s+(?:por|con|a\\s+tu)|$)`, 'iu'),
  ];
  let name = '';
  search: for (const re of patterns) {
    for (const line of lines) {
      const m = line.match(re);
      if (m && !/^(un|una|tu|te|pago|yape|plin|bbva|s)$/i.test(m[1].trim())) {
        name = m[1].replace(/^(?:¡?te yapearon!?|¡?yape!?|recibiste un (?:pago|plin)|plin)\s*/i, '').trim();
        if (name) break search;
      }
    }
  }
  // Sin nombre del que paga no se toma como pago (p. ej. un cliente que escribe "ya te yapeé S/ 25").
  if (!name) return null;
  // 'BBVA': cobros con QR de BBVA Empresas (el cliente puede pagar desde Yape, Plin u otro banco).
  const app = isYape ? 'Yape' : /plin/i.test(all) ? 'Plin' : 'BBVA';
  return { app, name: cap(name), amount, text: texts.join(' · ').slice(0, 300) };
}

// ArrivalTime de Windows (FILETIME: décimas de microsegundo desde 1601) → milisegundos desde 1970.
function fileTimeToMs(value) {
  try {
    const n = typeof value === 'bigint' ? value : BigInt(value);
    if (n <= 0n) return 0;
    const ms = Number(n / 10000n) - 11644473600000;
    return ms > 1.5e12 && ms < Date.now() + 86400000 ? ms : 0;
  } catch {
    return 0;
  }
}

// Vigila la base de notificaciones de Windows. onPayment(payment) por cada pago nuevo.
// initialId: última notificación leída la vez anterior (lo que llegó después, con MultiChat cerrado, se entrega con
// catchUp: true para registrarlo sin avisar). onProgress(id) guarda hasta dónde se leyó.
function createWatcher({ onPayment, onPhoneNotification = () => {}, onStatus = () => {}, initialId = null, onProgress = () => {} }) {
  let timer = null;
  let lastId = null; // al arrancar: initialId (si sigue en la base) o el último Id; los avisos viejos no se repiten
  let catchUp = false;
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
        const max = Number(db.prepare('SELECT MAX(Id) AS id FROM Notification').get().id) || 0;
        if (initialId && initialId <= max && max - initialId < 2000) {
          lastId = initialId;
          catchUp = true;
        } else {
          lastId = max;
          onProgress(lastId);
          setStatus('ok');
          return [];
        }
      }
      const rows = db.prepare(`
        SELECT n.Id AS id, n.Payload AS payload, CAST(n.ArrivalTime AS TEXT) AS arrival, h.PrimaryId AS app
        FROM Notification n JOIN NotificationHandler h ON h.RecordId = n.HandlerId
        WHERE n.Id > ? ORDER BY n.Id`).all(lastId);
      setStatus('ok');
      for (const row of rows) lastId = Math.max(lastId, Number(row.id));
      if (rows.length) onProgress(lastId);
      return rows;
    } catch {
      setStatus('error');
      return [];
    } finally {
      try { db?.close(); } catch { /* nada */ }
    }
  }

  function poll() {
    const rows = read();
    const old = catchUp;
    catchUp = false;
    for (const row of rows) {
      if (!PHONE_LINK.test(String(row.app || ''))) continue;
      const texts = toastTexts(row.payload);
      if (!texts.length) continue;
      const isChat = /whatsapp|telegram|messenger|instagram/i.test(texts.join(' ')); // chats, no pagos
      const payment = isChat ? null : parsePayment(texts);
      // Hora real de llegada (ArrivalTime de Windows) para lo atrasado; si no, la de ahora.
      const at = (old && fileTimeToMs(row.arrival)) || Date.now();
      onPhoneNotification({ texts, payment: Boolean(payment), at, catchUp: old });
      if (payment) onPayment({ ...payment, id: row.id, at, catchUp: old });
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

// ¿Está abierto Enlace Móvil? (su proceso es PhoneExperienceHost.exe). Responde true / false / null (no se sabe).
function phoneLinkRunning() {
  if (process.platform !== 'win32') return Promise.resolve(null);
  const { execFile } = require('child_process');
  return new Promise((resolve) => {
    execFile('tasklist', ['/FI', 'IMAGENAME eq PhoneExperienceHost.exe', '/NH'], { windowsHide: true, timeout: 5000 }, (err, out) => {
      resolve(err ? null : /PhoneExperienceHost/i.test(String(out)));
    });
  });
}

module.exports = { createWatcher, phoneLinkRunning, parsePayment, toastTexts, databasePath };
