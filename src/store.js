'use strict';

const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const DEFAULTS = {
  accounts: [],
  activeId: null,
  lock: null, // { password, question, answer } cuando hay contraseña
  templates: [], // respuestas rápidas: { id, title, text }
  reminders: [], // recordatorios: { id, accountId, note, at }
  ticketProfiles: [], // remitentes de los tickets de envío (logo, QR, datos fijos)
  settings: {
    hibernateMinutes: 30, // 0 = nunca suspender
    autoLockMinutes: 0, // 0 = nunca bloquear por inactividad
    layout: 'single', // 'single' = una cuenta a la vez, 'grid' = varias a la vez
    dnd: { enabled: false, schedule: false, hours: '19:00-07:00' }, // silencio fuera de 07:00-19:00
    privacyBlur: false, // difuminar los chats cuando la app no está en primer plano
    alwaysOnTop: false,
    theme: 'system', // 'system' | 'light' | 'dark'
    customNotifications: true, // notificaciones propias con botón "Responder"
    trackingUrls: { Shalom: '', Olva: 'https://www.olvacourier.com/' }, // páginas de rastreo
    closeToTray: true,
    openAtLogin: false,
    paymentAlerts: true, // avisos de Yape y Plin que llegan por Enlace Móvil
    paymentVoice: true, // decir en voz alta "Melissa te yapeó 50 soles"
    readAllPhone: false, // leer en voz alta todas las notificaciones del celular (no solo los pagos)
    keepAwake: true, // que la laptop no se suspenda (la pantalla sí se apaga): así sigue diciendo los pagos
    bubble: false, // burbuja flotante: aparece 2 minutos al llegar un mensaje o pago con MultiChat en segundo plano
    replyAlertMinutes: 10, // semáforo de respuesta: rojo después de estos minutos sin contestar
  },
};

let file;
let data;
let saveTimer = null;

function load() {
  file = path.join(app.getPath('userData'), 'config.json');
  try {
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    const settings = { ...DEFAULTS.settings, ...raw.settings };
    settings.dnd = { ...DEFAULTS.settings.dnd, ...settings.dnd };
    settings.trackingUrls = { ...DEFAULTS.settings.trackingUrls, ...settings.trackingUrls };
    data = { ...structuredClone(DEFAULTS), ...raw, settings };
  } catch {
    data = structuredClone(DEFAULTS);
  }
  return data;
}

function get() {
  return data;
}

// Guarda con un pequeño retraso para agrupar cambios seguidos.
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flush, 300);
}

// Escritura atómica: primero a un archivo temporal y luego se renombra.
function flush() {
  if (!file) return;
  clearTimeout(saveTimer);
  saveTimer = null;
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}

module.exports = { DEFAULTS, load, get, save, flush };
