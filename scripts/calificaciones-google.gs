/**
 * Calificaciones de MultiChat Pro guardadas en una hoja de Google.
 * La página de descarga (y la app) envían cada calificación aquí; la página muestra las que tienen "Mostrar" = Sí.
 * Para ocultar una calificación: en la hoja, escribe "No" en su columna "Mostrar".
 *
 * Instalación: Hoja de Google → Extensiones → Apps Script → pega este código → Implementar → Nueva implementación
 * → tipo "Aplicación web" → Ejecutar como: Yo → Quién tiene acceso: Cualquier usuario → Implementar → copia la URL.
 */
const SHEET = 'Calificaciones';
const MAX_PER_HOUR = 60; // freno contra envíos masivos

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET);
  if (!sh) {
    sh = ss.insertSheet(SHEET);
    sh.appendRow(['Fecha', 'Estrellas', 'Comentario', 'Nombre', 'Origen', 'Mostrar']);
    sh.setFrozenRows(1);
  }
  return sh;
}

function out_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

// Texto seguro para la hoja: sin etiquetas, sin fórmulas (=, +, -, @ al inicio) y con largo máximo.
function clean_(value, max) {
  let s = String(value || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

// Lista pública: solo las calificaciones con "Mostrar" = Sí (las más nuevas primero).
function doGet() {
  const rows = sheet_().getDataRange().getValues().slice(1);
  const list = rows
    .filter((r) => r[1] && String(r[5]).trim().toLowerCase() !== 'no')
    .map((r) => ({
      date: Utilities.formatDate(new Date(r[0]), 'America/Lima', 'yyyy-MM-dd'),
      stars: Math.min(5, Math.max(1, Math.round(Number(r[1])))),
      text: String(r[2] || '').replace(/^'/, ''),
      name: String(r[3] || '').replace(/^'/, '') || 'Cliente de MultiChat',
    }))
    .reverse()
    .slice(0, 300);
  return out_(list);
}

// Nueva calificación: { stars, text, name, publish, source }.
function doPost(e) {
  let d = {};
  try { d = JSON.parse(e.postData.contents); } catch (err) { return out_({ ok: false }); }
  const stars = Math.round(Number(d.stars));
  if (!(stars >= 1 && stars <= 5) || d.website) return out_({ ok: false }); // "website" = trampa para robots
  const cache = CacheService.getScriptCache();
  const count = Number(cache.get('count') || 0);
  if (count >= MAX_PER_HOUR) return out_({ ok: false, error: 'busy' });
  cache.put('count', String(count + 1), 3600);
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    sheet_().appendRow([
      new Date(), stars, clean_(d.text, 300), clean_(d.name, 40) || 'Cliente de MultiChat',
      clean_(d.source, 20) || 'web', d.publish === false ? 'No' : 'Sí',
    ]);
  } finally {
    lock.releaseLock();
  }
  return out_({ ok: true });
}
