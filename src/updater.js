'use strict';

// Actualizaciones automáticas (Releases de jhuniorgalvesll/multichat).
// Con MultiChat abierto NUNCA se cierra ni se reinicia: revisa al abrir y cada hora, descarga la versión nueva en
// segundo plano y solo avisa con una ventanita encima de la app. La versión descargada se instala la próxima vez
// que se abre MultiChat (por ejemplo, al prender la PC): antes de abrir las cuentas aparece una ventanita
// "Actualizando MultiChat Pro…" unos segundos, como en otras apps. Las cuentas y ajustes no se tocan.
const { app, dialog } = require('electron');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const CHECK_EVERY = 60 * 60 * 1000; // cada hora
const CACHE_DIR = 'multichat-updater'; // = updaterCacheDirName de electron-builder

let updater = null;
let state = { status: 'idle', version: '' }; // idle | checking | downloading | ready | latest | error | dev
let askedFor = '';
let getWindow = () => null;
let onChange = () => {};
let notify = () => {}; // muestra el aviso "Hay una versión nueva" encima de la app

function set(next) {
  state = { ...state, ...next };
  onChange(state);
}

const newer = (a, b) => {
  const pa = String(a).split('.').map(Number);
  const pb = String(b).split('.').map(Number);
  for (let i = 0; i < 3; i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) > (pb[i] || 0);
  return false;
};

function load() {
  if (updater) return updater;
  ({ autoUpdater: updater } = require('electron-updater'));
  updater.autoDownload = true;
  updater.autoInstallOnAppQuit = false; // se instala al abrir, nunca al cerrar ni con la app abierta
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

// Instalador ya descargado de una versión más nueva que la instalada (o null).
function pendingInstaller() {
  if (!app.isPackaged || process.platform !== 'win32') return null;
  try {
    const dir = path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), CACHE_DIR, 'pending');
    const info = JSON.parse(fs.readFileSync(path.join(dir, 'update-info.json'), 'utf8'));
    const file = path.join(dir, path.basename(String(info.fileName || '')));
    const version = (String(info.fileName).match(/(\d+\.\d+\.\d+)/) || [])[1];
    if (!version || !newer(version, app.getVersion()) || !fs.existsSync(file)) return null;
    return { file, version };
  } catch {
    return null;
  }
}

// Ventanita "Actualizando MultiChat Pro…" que sigue visible mientras se instala (la app ya se cerró) y se va
// sola cuando MultiChat vuelve a abrirse. Es un pequeño script de Windows, no necesita nada instalado.
function showInstallingSplash(version) {
  const script = `
Add-Type -AssemblyName System.Windows.Forms, System.Drawing
$f = New-Object Windows.Forms.Form
$f.FormBorderStyle = 'None'; $f.StartPosition = 'CenterScreen'; $f.TopMost = $true; $f.ShowInTaskbar = $false
$f.Size = New-Object Drawing.Size(380, 120); $f.BackColor = [Drawing.Color]::FromArgb(24, 14, 56)
$t = New-Object Windows.Forms.Label; $t.Text = 'Actualizando MultiChat Pro a la versión ${version}...'
$t.ForeColor = 'White'; $t.Font = New-Object Drawing.Font('Segoe UI', 11, [Drawing.FontStyle]::Bold)
$t.AutoSize = $true; $t.Location = New-Object Drawing.Point(22, 22)
$s = New-Object Windows.Forms.Label; $s.Text = 'Se abrirá sola en unos segundos. Tus cuentas siguen conectadas.'
$s.ForeColor = [Drawing.Color]::FromArgb(200, 190, 230); $s.Font = New-Object Drawing.Font('Segoe UI', 9)
$s.AutoSize = $true; $s.Location = New-Object Drawing.Point(23, 50)
$p = New-Object Windows.Forms.ProgressBar; $p.Style = 'Marquee'; $p.MarqueeAnimationSpeed = 25
$p.Size = New-Object Drawing.Size(334, 8); $p.Location = New-Object Drawing.Point(23, 84)
$f.Controls.AddRange(@($t, $s, $p))
$gone = $false; $start = Get-Date
$timer = New-Object Windows.Forms.Timer; $timer.Interval = 700
$timer.Add_Tick({
  $running = Get-Process -Name 'MultiChat' -ErrorAction SilentlyContinue
  if (-not $running) { $script:gone = $true }
  if (($script:gone -and $running) -or ((Get-Date) - $start).TotalSeconds -gt 90) { Start-Sleep -Seconds 2; $f.Close() }
})
$timer.Start(); [void]$f.ShowDialog()
`;
  try {
    const file = path.join(os.tmpdir(), 'multichat-actualizando.ps1');
    fs.writeFileSync(file, `﻿${script}`, 'utf8');
    spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-WindowStyle', 'Hidden', '-File', file], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    }).unref();
  } catch { /* sin ventanita, la instalación sigue igual */ }
}

// Al abrir MultiChat, antes de crear ventanas: si hay una versión descargada, la instala y la app se vuelve a abrir
// sola. Devuelve true si se está instalando (no hay que seguir abriendo la app).
function installPendingOnStart() {
  const pending = pendingInstaller();
  if (!pending) return false;
  showInstallingSplash(pending.version);
  try {
    // Mismos parámetros que usa electron-updater: instalación silenciosa y volver a abrir la app al terminar.
    spawn(pending.file, ['--updated', '/S', '--force-run'], { detached: true, stdio: 'ignore' }).unref();
  } catch {
    return false;
  }
  setTimeout(() => app.exit(0), 300);
  return true;
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
    if (!latest || !newer(latest, app.getVersion())) set({ status: 'latest' });
  } catch {
    set({ status: 'error' });
  }
  return state;
}

// Desde el menú ⚙: revisa ahora y avisa el resultado.
async function checkNow() {
  const win = getWindow();
  const show = (message, detail = '') => dialog.showMessageBox(win, { type: 'info', title: 'Actualizaciones', message, detail });
  if (!app.isPackaged) return show('Las actualizaciones funcionan solo en la app instalada.');
  if (state.status === 'ready') return notify(state.version);
  try {
    const result = await load().checkForUpdates();
    const latest = result && result.updateInfo ? result.updateInfo.version : '';
    if (!latest || !newer(latest, app.getVersion())) return show(`Tienes la última versión (v${app.getVersion()}).`);
    return show(`Descargando la versión v${latest}…`, 'Te avisaremos cuando esté lista.');
  } catch {
    return show('No se pudo revisar si hay actualizaciones.', 'Revisa tu conexión a internet e inténtalo más tarde.');
  }
}

module.exports = { start, check, checkNow, installPendingOnStart, get state() { return state; } };
