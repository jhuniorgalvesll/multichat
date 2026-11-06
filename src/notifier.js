'use strict';

// Notificaciones propias de MultiChat: ventanitas en la esquina inferior derecha con
// botón "Responder". Se usan en lugar de las de Windows porque esas no permiten escribir.
const { BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');

const WIDTH = 360;
const GAP = 10;
const MAX_TOASTS = 4;
const LIFETIME = 8000;

const toasts = []; // { win, data, height, timer, hold }
let handlers = { open: () => {}, reply: async () => ({ sent: false }) };

function layout() {
  const { workArea } = screen.getPrimaryDisplay();
  let bottom = workArea.y + workArea.height - GAP;
  for (let i = toasts.length - 1; i >= 0; i--) {
    const toast = toasts[i];
    bottom -= toast.height;
    toast.win.setBounds({ x: workArea.x + workArea.width - WIDTH - GAP, y: bottom, width: WIDTH, height: toast.height });
    bottom -= GAP;
  }
}

function close(toast) {
  const i = toasts.indexOf(toast);
  if (i < 0) return;
  toasts.splice(i, 1);
  clearTimeout(toast.timer);
  if (!toast.win.isDestroyed()) toast.win.destroy();
  layout();
}

function schedule(toast) {
  clearTimeout(toast.timer);
  // Los pagos se quedan más tiempo en pantalla para no perderlos.
  if (!toast.hold) toast.timer = setTimeout(() => close(toast), { payment: 20000, update: 20000, updated: 12000, shipdata: 30000 }[toast.data.kind] || LIFETIME);
}

function find(event) {
  return toasts.find((t) => !t.win.isDestroyed() && t.win.webContents === event.sender);
}

// data: { accountId, accountName, title, body, icon, notifId, canReply, kind }
function show(data) {
  if (toasts.length >= MAX_TOASTS) close(toasts[0]);
  const win = new BrowserWindow({
    width: WIDTH,
    height: 96,
    show: false,
    frame: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload-toast.js'),
      contextIsolation: true,
      sandbox: true,
    },
  });
  win.setAlwaysOnTop(true, 'screen-saver');
  const toast = { win, data, height: 96, timer: null, hold: false };
  toasts.push(toast);
  win.loadFile(path.join(__dirname, '..', 'ui', 'toast.html'));
  win.webContents.once('did-finish-load', () => {
    win.webContents.send('toast:data', data);
    layout();
    win.showInactive();
    schedule(toast);
  });
}

function register(nextHandlers) {
  handlers = nextHandlers;
  ipcMain.on('toast:size', (event, height) => {
    const toast = find(event);
    if (!toast) return;
    toast.height = Math.max(60, Math.min(320, Math.ceil(Number(height) || 96)));
    layout();
  });
  ipcMain.on('toast:hold', (event, hold) => {
    const toast = find(event);
    if (!toast) return;
    toast.hold = Boolean(hold);
    schedule(toast);
  });
  ipcMain.on('toast:close', (event) => {
    const toast = find(event);
    if (toast) close(toast);
  });
  ipcMain.on('toast:open', (event) => {
    const toast = find(event);
    if (!toast) return;
    close(toast);
    handlers.open(toast.data);
  });
  ipcMain.handle('toast:reply', async (event, text) => {
    const toast = find(event);
    if (!toast) return { sent: false };
    const result = await handlers.reply(toast.data, String(text || '').slice(0, 4000));
    toast.hold = false;
    toast.timer = setTimeout(() => close(toast), result.sent ? 1500 : 3500);
    return result;
  });
}

function closeAll() {
  for (const toast of [...toasts]) close(toast);
}

module.exports = { show, register, closeAll };
