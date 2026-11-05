'use strict';

// Actualizaciones automáticas desde GitHub (Releases de jhuniorgalvesll/multichat).
// La app revisa al abrir y cada hora; si hay versión nueva la descarga sola en segundo plano y avisa con una
// notificación de MultiChat "Actualizar ahora". Si no se pulsa, se instala sola al cerrar la app.
// Las cuentas y ajustes no se tocan (están en la carpeta de datos, no en la de la app).
const { app, dialog } = require('electron');

const CHECK_EVERY = 60 * 60 * 1000; // cada hora

let updater = null;
let state = { status: 'idle', version: '' }; // idle | checking | downloading | ready | latest | error
let askedFor = '';
let getWindow = () => null;
let onChange = () => {};
let notify = () => {}; // muestra la notificación "Actualizar ahora" dentro de MultiChat

function set(next) {
  state = { ...state, ...next };
  onChange(state);
}

function load() {
  if (updater) return updater;
  ({ autoUpdater: updater } = require('electron-updater'));
  updater.autoDownload = true;
  updater.autoInstallOnAppQuit = true; // si eliges "Después", se instala al cerrar la app
  updater.on('checking-for-update', () => set({ status: 'checking' }));
  updater.on('update-available', (info) => set({ status: 'downloading', version: info.version }));
  updater.on('update-not-available', () => set({ status: 'latest' }));
  updater.on('error', () => set({ status: 'error' }));
  updater.on('update-downloaded', (info) => {
    set({ status: 'ready', version: info.version });
    if (askedFor === info.version) return;
    askedFor = info.version;
    notify(info.version);
  });
  return updater;
}

// Solo en la app instalada (no al probar con "npm start").
function start(options = {}) {
  getWindow = options.getWindow || getWindow;
  onChange = options.onChange || onChange;
  notify = options.notify || notify;
  if (!app.isPackaged || process.platform !== 'win32') return;
  const check = () => load().checkForUpdates().catch(() => set({ status: 'error' }));
  setTimeout(check, 15_000);
  setInterval(check, CHECK_EVERY);
}

// Desde el panel de MultiChat Pro: revisa sin ventanas; el resultado llega por onChange (state).
async function check() {
  if (!app.isPackaged || process.platform !== 'win32') {
    set({ status: 'dev' });
    return state;
  }
  if (state.status === 'ready' || state.status === 'downloading') return state;
  try {
    const result = await load().checkForUpdates();
    const latest = result && result.updateInfo ? result.updateInfo.version : '';
    if (!latest || latest === app.getVersion()) set({ status: 'latest' });
  } catch {
    set({ status: 'error' });
  }
  return state;
}

// Desde el menú: revisa ahora y avisa el resultado.
async function checkNow() {
  const win = getWindow();
  const show = (message, detail = '') => dialog.showMessageBox(win, { type: 'info', title: 'Actualizaciones', message, detail });
  if (!app.isPackaged) return show('Las actualizaciones funcionan solo en la app instalada.');
  if (state.status === 'ready') return notify(state.version);
  try {
    const result = await load().checkForUpdates();
    const latest = result && result.updateInfo ? result.updateInfo.version : '';
    if (!latest || latest === app.getVersion()) return show(`Tienes la última versión (v${app.getVersion()}).`);
    return show(`Descargando la versión v${latest}…`, 'Te avisaremos cuando esté lista para instalar.');
  } catch {
    return show('No se pudo revisar si hay actualizaciones.', 'Revisa tu conexión a internet e inténtalo más tarde.');
  }
}

// "Actualizar ahora": cierra MultiChat, instala en segundo plano y la vuelve a abrir.
function install() {
  if (state.status === 'ready') setImmediate(() => load().quitAndInstall(true, true));
}

module.exports = { start, check, checkNow, install, get state() { return state; } };
