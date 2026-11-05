'use strict';

// Fotos guardadas por la app: las de las respuestas rápidas (QR de Yape/Plin, cuentas, productos)
// las boletas o guías de envío de Shalom/Olva, y los logos y QR de los tickets. Se guardan como copia en la carpeta de la app,
// así no dependen del archivo original. Cada tipo va en su propia carpeta.
const fs = require('fs');
const path = require('path');
const { app, nativeImage } = require('electron');

const SAFE_NAME = /^[a-z0-9]{6,32}\.(jpg|png)$/;
const MAX_SIDE = 1600;

// Recorta los márgenes casi blancos o transparentes alrededor del dibujo.
function trimMargins(image) {
  const { width, height } = image.getSize();
  const px = image.toBitmap(); // BGRA
  const blank = (x, y) => {
    const i = (y * width + x) * 4;
    return px[i + 3] < 16 || (px[i] > 240 && px[i + 1] > 240 && px[i + 2] > 240);
  };
  let top = 0; let bottom = height - 1; let left = 0; let right = width - 1;
  const rowBlank = (y) => { for (let x = 0; x < width; x++) if (!blank(x, y)) return false; return true; };
  const colBlank = (x) => { for (let y = top; y <= bottom; y++) if (!blank(x, y)) return false; return true; };
  while (top < bottom && rowBlank(top)) top++;
  while (bottom > top && rowBlank(bottom)) bottom--;
  while (left < right && colBlank(left)) left++;
  while (right > left && colBlank(right)) right--;
  const box = { x: left, y: top, width: right - left + 1, height: bottom - top + 1 };
  if (box.width < 8 || box.height < 8 || (box.width === width && box.height === height)) return image;
  return image.crop(box);
}

// `format`: 'jpg' para fotos (más livianas) o 'png' para logos y QR (conservan la transparencia).
function createMediaStore(folderName, format = 'jpg') {
  function folder() {
    const dir = path.join(app.getPath('userData'), folderName);
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  function filePath(name) {
    return SAFE_NAME.test(name) ? path.join(folder(), name) : null;
  }

  function exists(name) {
    const file = filePath(name);
    return Boolean(file && fs.existsSync(file));
  }

  // Copia una imagen elegida por el usuario: la achica si es muy grande y la guarda en `format`.
  // `trim`: quita los bordes blancos o transparentes (así el logo usa todo su espacio en el ticket).
  // `source`: ruta del archivo o una imagen ya cargada (nativeImage).
  function importImage(source, { trim = false } = {}) {
    let image = typeof source === 'string' ? nativeImage.createFromPath(source) : source;
    if (image.isEmpty()) return null;
    if (trim) image = trimMargins(image);
    const { width, height } = image.getSize();
    if (Math.max(width, height) > MAX_SIDE) {
      image = width >= height ? image.resize({ width: MAX_SIDE, quality: 'best' }) : image.resize({ height: MAX_SIDE, quality: 'best' });
    }
    const name = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}.${format}`;
    fs.writeFileSync(path.join(folder(), name), format === 'png' ? image.toPNG() : image.toJPEG(90));
    return name;
  }

  function load(name) {
    const file = filePath(name);
    if (!file) return null;
    const image = nativeImage.createFromPath(file);
    return image.isEmpty() ? null : image;
  }

  // Recorta los bordes en blanco de una imagen ya guardada (mismo nombre).
  function trimStored(name) {
    const image = load(name);
    if (!image) return;
    const trimmed = trimMargins(image);
    if (trimmed !== image) fs.writeFileSync(filePath(name), format === 'png' ? trimmed.toPNG() : trimmed.toJPEG(90));
  }

  function thumbnail(name) {
    const image = load(name);
    return image ? image.resize({ height: 96, quality: 'good' }).toDataURL() : null;
  }

  // Borra las fotos de esta carpeta que ya no se usan.
  function cleanup(usedNames) {
    const used = new Set(usedNames);
    for (const name of fs.readdirSync(folder())) {
      if (SAFE_NAME.test(name) && !used.has(name)) fs.rmSync(path.join(folder(), name), { force: true });
    }
  }

  function dataUrl(name) {
    const image = load(name);
    return image ? image.toDataURL() : null;
  }

  return { exists, importImage, trimStored, load, thumbnail, dataUrl, cleanup, filePath };
}

module.exports = {
  SAFE_NAME,
  templateImages: createMediaStore('respuestas'),
  receipts: createMediaStore('boletas'),
  ticketImages: createMediaStore('tickets', 'png'),
};
