'use strict';

// "Seguir avisando con la pantalla apagada": en muchas laptops, cuando Windows apaga la pantalla entra en "reposo
// moderno" y congela los programas hasta que se toca el mouse (los Yape no se dicen a tiempo). Por eso, con esta
// opción, MultiChat no deja que Windows apague la pantalla: cuando no se usa la PC unos minutos, la pone en negro y baja
// el brillo al mínimo. Se ve apagada, pero la laptop sigue despierta: los pagos se dicen y se registran al instante.
// Al mover el mouse o tocar una tecla, todo vuelve como estaba.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const { BrowserWindow, screen, powerMonitor, powerSaveBlocker } = require('electron');

const BRIGHTNESS_SCRIPT = `
param([string]$set)
$ErrorActionPreference = 'SilentlyContinue'
if ($set -ne '') {
  Get-CimInstance -Namespace root/WMI -ClassName WmiMonitorBrightnessMethods | Invoke-CimMethod -MethodName WmiSetBrightness -Arguments @{ Timeout = 0; Brightness = [byte]$set } | Out-Null
} else {
  (Get-CimInstance -Namespace root/WMI -ClassName WmiMonitorBrightness | Select-Object -First 1).CurrentBrightness
}
`;

let settings = () => ({});
let blocker = null;
let windows = [];
let savedBrightness = null;
let idleTimer = null;
let wakeTimer = null;
let scriptFile = null;

function runBrightness(arg) {
  if (process.platform !== 'win32') return Promise.resolve('');
  if (!scriptFile) {
    scriptFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'multichat-brillo-')), 'brillo.ps1');
    fs.writeFileSync(scriptFile, `﻿${BRIGHTNESS_SCRIPT}`, 'utf8');
  }
  return new Promise((resolve) => {
    execFile('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptFile, String(arg ?? '')], { windowsHide: true, timeout: 10000 }, (err, out) => resolve(err ? '' : String(out || '').trim()));
  });
}

const active = () => windows.length > 0;

async function blackOut() {
  if (active()) return;
  windows = screen.getAllDisplays().map((display) => {
    const w = new BrowserWindow({
      ...display.bounds,
      frame: false,
      show: false,
      skipTaskbar: true,
      alwaysOnTop: true,
      resizable: false,
      movable: false,
      fullscreenable: true,
      backgroundColor: '#000000',
      webPreferences: { sandbox: true, contextIsolation: true },
    });
    w.setAlwaysOnTop(true, 'screen-saver');
    w.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent('<!doctype html><html><body style="margin:0;background:#000;cursor:none"></body></html>'));
    w.once('ready-to-show', () => w.showInactive());
    w.on('closed', () => { windows = windows.filter((x) => x !== w); });
    return w;
  });
  const current = Number(await runBrightness(''));
  savedBrightness = Number.isFinite(current) && current > 0 ? current : null;
  if (savedBrightness !== null) runBrightness(0);
  // Se vuelve al usar la PC (mouse o teclado).
  clearInterval(wakeTimer);
  wakeTimer = setInterval(() => { if (powerMonitor.getSystemIdleTime() < 2) wake(); }, 700);
}

function wake() {
  clearInterval(wakeTimer);
  wakeTimer = null;
  for (const w of windows) if (!w.isDestroyed()) w.destroy();
  windows = [];
  if (savedBrightness !== null) runBrightness(savedBrightness);
  savedBrightness = null;
}

// Aplica la opción: mantiene la PC despierta y, sin uso por `blackScreenMinutes`, pone la pantalla en negro.
function sync() {
  const s = settings();
  const on = Boolean(s.keepAwake);
  if (on && blocker === null) blocker = powerSaveBlocker.start('prevent-display-sleep');
  if (!on && blocker !== null) {
    powerSaveBlocker.stop(blocker);
    blocker = null;
  }
  clearInterval(idleTimer);
  idleTimer = null;
  if (!on) {
    wake();
    return;
  }
  idleTimer = setInterval(() => {
    const minutes = Math.max(1, Number(settings().blackScreenMinutes) || 5);
    if (!active() && powerMonitor.getSystemIdleTime() >= minutes * 60) blackOut();
  }, 5000);
}

function init(getSettings) {
  settings = getSettings;
  sync();
}

module.exports = { init, sync, wake };
