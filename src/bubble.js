'use strict';

// Burbuja flotante (opcional, apagada de fábrica): un círculo con el logo encima de los demás programas. Aparece solo
// cuando llega un mensaje nuevo o un pago con MultiChat en segundo plano, y se va sola a los 2 minutos.
// Muestra los mensajes sin leer y, con un pago, el aviso "+ S/ 50 · Melissa".
// Clic: abre MultiChat. Se puede arrastrar a cualquier lugar (la posición se recuerda).
const { BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');

const SIZE = 76; // burbuja sola
const WIDE = 300; // con el aviso de pago al costado
const SHOW_FOR = 2 * 60 * 1000; // se esconde sola a los 2 minutos

let bubbleWin = null;
let ctx = { getState: () => ({ unread: 0, accounts: [] }), onOpen: () => {}, settings: () => ({}), save: () => {}, onMenu: () => {} };
let wantVisible = false;
let payment = null; // { text, until }
let paymentTimer = null;
let hideTimer = null;

function position() {
  const { workArea } = screen.getPrimaryDisplay();
  const saved = ctx.settings().bubblePos;
  const x = saved && Number.isFinite(saved.x) ? saved.x : workArea.x + workArea.width - SIZE - 24;
  const y = saved && Number.isFinite(saved.y) ? saved.y : workArea.y + Math.round(workArea.height * 0.35);
  // Que no quede fuera de la pantalla (por ejemplo, si cambió el monitor).
  const area = screen.getDisplayNearestPoint({ x, y }).workArea;
  return {
    x: Math.min(Math.max(x, area.x), area.x + area.width - SIZE),
    y: Math.min(Math.max(y, area.y), area.y + area.height - SIZE),
  };
}

function bounds() {
  const { x, y } = position();
  const wide = payment && payment.until > Date.now();
  return wide ? { x: x - (WIDE - SIZE), y, width: WIDE, height: SIZE } : { x, y, width: SIZE, height: SIZE };
}

function create() {
  if (bubbleWin && !bubbleWin.isDestroyed()) return bubbleWin;
  bubbleWin = new BrowserWindow({
    ...bounds(),
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    focusable: false,
    alwaysOnTop: true,
    show: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload-bubble.js'),
      contextIsolation: true,
      sandbox: true,
      backgroundThrottling: false,
    },
  });
  bubbleWin.setAlwaysOnTop(true, 'screen-saver');
  bubbleWin.loadFile(path.join(__dirname, '..', 'ui', 'bubble.html'));
  bubbleWin.webContents.once('did-finish-load', () => {
    update();
    if (wantVisible) bubbleWin.showInactive();
  });
  bubbleWin.on('closed', () => { bubbleWin = null; });
  return bubbleWin;
}

function update() {
  if (!bubbleWin || bubbleWin.isDestroyed()) return;
  const state = ctx.getState();
  bubbleWin.webContents.send('bubble:state', {
    unread: state.unread,
    accounts: state.accounts,
    payment: payment && payment.until > Date.now() ? payment : null,
  });
  bubbleWin.setBounds(bounds());
}

function hide() {
  wantVisible = false;
  clearTimeout(hideTimer);
  if (bubbleWin && !bubbleWin.isDestroyed()) bubbleWin.hide();
}

// Algo nuevo llegó (mensaje o pago): la burbuja aparece 2 minutos, si está activada.
function popup() {
  if (ctx.settings().bubble !== true) return;
  wantVisible = true;
  clearTimeout(hideTimer);
  hideTimer = setTimeout(hide, SHOW_FOR);
  const w = create();
  if (!w.webContents.isLoading()) {
    update();
    w.showInactive();
  }
}

function showPayment(text) {
  payment = { text, until: Date.now() + 8000 };
  clearTimeout(paymentTimer);
  paymentTimer = setTimeout(() => { payment = null; update(); }, 8100);
  update();
  popup();
}

function init(options) {
  ctx = { ...ctx, ...options };
  let drag = null;
  ipcMain.on('bubble:drag-start', () => {
    drag = { start: screen.getCursorScreenPoint(), pos: position() };
  });
  ipcMain.on('bubble:drag-move', () => {
    if (!drag || !bubbleWin) return;
    const now = screen.getCursorScreenPoint();
    const x = drag.pos.x + now.x - drag.start.x;
    const y = drag.pos.y + now.y - drag.start.y;
    ctx.settings().bubblePos = { x, y };
    bubbleWin.setBounds(bounds());
  });
  ipcMain.on('bubble:drag-end', (_e, moved) => {
    drag = null;
    if (moved) ctx.save();
    else {
      hide();
      ctx.onOpen();
    }
  });
  ipcMain.on('bubble:menu', () => ctx.onMenu(bubbleWin));
}

module.exports = { init, update, popup, hide, showPayment };
