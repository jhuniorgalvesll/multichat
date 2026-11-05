'use strict';

// Actualizaciones automáticas desde GitHub (Releases del repositorio público de instaladores).
// La app revisa al abrir y cada 4 horas; si hay versión nueva la descarga en segundo plano y pregunta
// si reiniciar ahora. Las cuentas y ajustes no se tocan (están en la carpeta de datos, no en la de la app).
const { app, dialog } = require('electron');

const CHECK_EVERY = 4 * 60 * 60 * 1000;

let updater = null;
let state = { status: 'idle', version: '' }; // idle | checking | downloading | ready | latest | error
let askedFor = '';
let getWindow = () => null;
let onChange = () => {};

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
  updater.on('update-downloaded', async (info) => {
    set({ status: 'ready', version: info.version });
    if (askedFor === info.version) return;
    askedFor = info.version;
    const win = getWindow();
    const { response } = await dialog.showMessageBox(win && !win.isDestroyed() ? win : undefined, {
      type: 'info',
      title: 'Actualización lista',
      message: `Hay una nueva versión de MultiChat Pro (v${info.version}).`,
      detail: 'Ya se descargó. Al reiniciar se instala en unos segundos; tus cuentas y ajustes no se tocan.',
      buttons: ['Reiniciar ahora', 'Después (al cerrar la app)'],
      defaultId: 0,
      cancelId: 1,
    });
    if (response === 0) setImmediate(() => updater.quitAndInstall(true, true));
  });
  return updater;
}

// Solo en la app instalada (no al probar con "npm start").
function start(options = {}) {
  getWindow = options.getWindow || getWindow;
  onChange = options.onChange || onChange;
  if (!app.isPackaged || process.platform !== 'win32') return;
  const check = () => load().checkForUpdates().catch(() => set({ status: 'error' }));
  setTimeout(check, 15_000);
  setInterval(check, CHECK_EVERY);
}

// Desde el menú: revisa ahora y avisa el resultado.
async function checkNow() {
  const win = getWindow();
  const show = (message, detail = '') => dialog.showMessageBox(win, { type: 'info', title: 'Actualizaciones', message, detail });
  if (!app.isPackaged) return show('Las actualizaciones funcionan solo en la app instalada.');
  if (state.status === 'ready') {
    askedFor = '';
    return load().emit('update-downloaded', { version: state.version });
  }
  try {
    const result = await load().checkForUpdates();
    const latest = result && result.updateInfo ? result.updateInfo.version : '';
    if (!latest || latest === app.getVersion()) return show(`Tienes la última versión (v${app.getVersion()}).`);
    return show(`Descargando la versión v${latest}…`, 'Te avisaremos cuando esté lista para instalar.');
  } catch {
    return show('No se pudo revisar si hay actualizaciones.', 'Revisa tu conexión a internet e inténtalo más tarde.');
  }
}

module.exports = { start, checkNow, get state() { return state; } };
