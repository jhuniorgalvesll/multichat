'use strict';

// Voz de los pagos con el motor de voz de Windows (System.Speech, el mismo de Narrador), fuera de la ventana:
// suena aunque haya música o YouTube, con la ventana oculta o la pantalla apagada. Voz de mujer en español, volumen al
// máximo y un "ding" antes. Si Windows no tiene voces en español, avisa para usar la voz de la ventana.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const SCRIPT = `
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voices = $s.GetInstalledVoices() | Where-Object { $_.Enabled } | ForEach-Object { $_.VoiceInfo }
$v = $voices | Where-Object { $_.Culture.Name -like 'es*' -and $_.Gender -eq 'Female' } | Select-Object -First 1
if (-not $v) { $v = $voices | Where-Object { $_.Culture.Name -like 'es*' } | Select-Object -First 1 }
if (-not $v) { exit 3 }
$s.SelectVoice($v.Name)
$s.Volume = 100
$s.Rate = 0
$s.SetOutputToDefaultAudioDevice()
if ($env:MC_CHIME -and (Test-Path $env:MC_CHIME)) { (New-Object System.Media.SoundPlayer $env:MC_CHIME).PlaySync() }
$s.Speak($env:MC_TEXT)
`;

let files = null;
const queue = [];
let busy = false;

// "Ding" de dos notas (WAV generado una vez).
function chimeWav() {
  const rate = 22050;
  const notes = [[880, 0, 0.45], [1318.5, 0.14, 0.45]];
  const length = Math.floor(rate * 0.65);
  const data = Buffer.alloc(length * 2);
  for (let i = 0; i < length; i++) {
    const t = i / rate;
    let v = 0;
    for (const [freq, start, dur] of notes) {
      if (t < start || t > start + dur) continue;
      const k = t - start;
      const env = Math.min(1, k / 0.02) * Math.exp(-k * 7);
      v += Math.sin(2 * Math.PI * freq * k) * env * 0.45;
    }
    data.writeInt16LE(Math.max(-1, Math.min(1, v)) * 32767, i * 2);
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

function prepare() {
  if (files) return files;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'multichat-voz-'));
  files = { script: path.join(dir, 'hablar.ps1'), chime: path.join(dir, 'ding.wav') };
  fs.writeFileSync(files.script, `﻿${SCRIPT}`, 'utf8');
  fs.writeFileSync(files.chime, chimeWav());
  return files;
}

function next() {
  if (busy || !queue.length) return;
  busy = true;
  const { text, fallback } = queue.shift();
  let done = false;
  const finish = (ok) => {
    if (done) return;
    done = true;
    busy = false;
    if (!ok) fallback(text);
    next();
  };
  try {
    const f = prepare();
    const child = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', f.script], {
      windowsHide: true,
      env: { ...process.env, MC_TEXT: text, MC_CHIME: f.chime },
      stdio: 'ignore',
    });
    const timer = setTimeout(() => { child.kill(); finish(true); }, 30000);
    child.on('error', () => { clearTimeout(timer); finish(false); });
    child.on('exit', (code) => { clearTimeout(timer); finish(code === 0); });
  } catch {
    finish(false);
  }
}

// Dice el texto. `fallback(text)` se usa si no se pudo con Windows (otro sistema, sin voces en español, error).
function speak(text, fallback) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 300);
  if (!clean) return;
  if (process.platform !== 'win32') {
    fallback(clean);
    return;
  }
  queue.push({ text: clean, fallback });
  next();
}

module.exports = { speak };
