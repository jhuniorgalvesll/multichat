'use strict';

// Verificador de pagos: lee la captura de Yape / Plin que manda un cliente y la compara con los pagos que de verdad
// llegaron (registro diario de paylog). El texto de la imagen se lee con el lector de texto (OCR) que ya trae
// Windows, sin internet ni programas extra. La imagen no se guarda: se borra apenas se lee.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');

const OCR_SCRIPT = `
param([string]$path)
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.Encoding]::UTF8
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
$null = [Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics, ContentType = WindowsRuntime]
$asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
  $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation\`1'
})[0]
function Await($op, $type) {
  $task = $asTask.MakeGenericMethod($type).Invoke($null, @($op))
  $task.Wait(-1) | Out-Null
  $task.Result
}
$file = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($path)) ([Windows.Storage.StorageFile])
$stream = Await ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
$decoder = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
$bitmap = Await ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
$result = Await ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])
$stream.Dispose()
$result.Lines | ForEach-Object { $_.Text }
`;

// Lee el texto de una imagen PNG (buffer). Resuelve con el texto, o '' si no se pudo.
function readImageText(pngBuffer) {
  if (process.platform !== 'win32') return Promise.resolve('');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'multichat-ocr-'));
  const image = path.join(dir, 'captura.png');
  const script = path.join(dir, 'ocr.ps1');
  fs.writeFileSync(image, pngBuffer);
  fs.writeFileSync(script, `﻿${OCR_SCRIPT}`, 'utf8');
  return new Promise((resolve) => {
    execFile('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script, image], {
      windowsHide: true,
      timeout: 25000,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024,
    }, (err, stdout) => {
      fs.rmSync(dir, { recursive: true, force: true });
      resolve(err ? '' : String(stdout || '').trim());
    });
  });
}

const MONTHS = { ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5, jul: 6, ago: 7, set: 8, sep: 8, oct: 9, nov: 10, dic: 11 };

// Datos de la captura: monto, hora, fecha, número de operación y app.
function parseReceipt(text) {
  const t = String(text || '').replace(/\r/g, '');
  const info = { amount: null, time: null, date: null, operation: '', app: '' };
  if (/yape/i.test(t)) info.app = 'Yape';
  else if (/plin|bbva|interbank|scotiabank/i.test(t)) info.app = 'Plin';
  // Monto: "S/ 50", "S/50.00", y lo que el lector suele confundir ("SI 50", "S/. 50").
  const money = t.match(/S\s*[/I1l|]\s*\.?\s*(\d{1,5}(?:[.,]\d{1,2})?)\b/);
  if (money) info.amount = Number(money[1].replace(',', '.'));
  // Hora: "10:42 a. m.", "13:21", "07.15 p.m." (con punto solo si dice a. m. / p. m., para no confundir montos).
  for (const m of t.matchAll(/\b(\d{1,2})\s*(:|\.)\s*(\d{2})\s*(?:([ap])\.?\s*m\b\.?)?/gi)) {
    if (m[2] === '.' && !m[4]) continue;
    let h = Number(m[1]);
    const min = Number(m[3]);
    if (m[4]) {
      if (/p/i.test(m[4]) && h < 12) h += 12;
      if (/a/i.test(m[4]) && h === 12) h = 0;
    }
    if (h < 24 && min < 60) {
      info.time = { h, m: min };
      break;
    }
  }
  const date = t.match(/\b(\d{1,2})\s*(?:de\s*)?(ene|feb|mar|abr|may|jun|jul|ago|set|sep|oct|nov|dic)[a-z]*\.?\s*(?:de\s*)?(\d{4})?/i);
  if (date) {
    const now = new Date();
    info.date = { d: Number(date[1]), mo: MONTHS[date[2].toLowerCase().slice(0, 3)], y: date[3] ? Number(date[3]) : now.getFullYear() };
  }
  const numeric = !date && t.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
  if (numeric) info.date = { d: Number(numeric[1]), mo: Number(numeric[2]) - 1, y: Number(numeric[3]) };
  const op = t.match(/(?:operaci[oó]n|c[oó]d(?:igo)?\.?\s*de\s*operaci[oó]n|n[°º]?\s*de\s*operaci[oó]n)\D{0,6}(\d{5,12})/i);
  if (op) info.operation = op[1];
  return info;
}

// Busca la captura en los pagos que llegaron. payments: [{ app, name, amount, at }].
// Resultado: 'confirmed' (monto y hora coinciden), 'probable' (monto coincide; hora no se leyó o difiere un poco),
// 'not-found' (ningún pago de ese monto) o 'unreadable' (no se leyó el monto).
function match(info, payments) {
  if (!info.amount) return { status: 'unreadable', matches: [] };
  const sameAmount = payments.filter((p) => Math.abs(p.amount - info.amount) < 0.005);
  if (!sameAmount.length) return { status: 'not-found', matches: [] };
  if (info.time) {
    const ref = new Date();
    if (info.date) ref.setFullYear(info.date.y, info.date.mo, info.date.d);
    ref.setHours(info.time.h, info.time.m, 0, 0);
    const close = sameAmount
      .map((p) => ({ ...p, diffMin: Math.abs(p.at - ref.getTime()) / 60000 }))
      .sort((a, b) => a.diffMin - b.diffMin);
    if (close[0].diffMin <= 5) return { status: 'confirmed', matches: close.slice(0, 3) };
    return { status: 'probable', matches: close.slice(0, 3) };
  }
  return { status: 'probable', matches: sameAmount.slice(-3).reverse() };
}

module.exports = { readImageText, parseReceipt, match };
