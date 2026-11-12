'use strict';

// "¿De quién es este pago?": cuando llega un Yape o Plin, busca entre los chats que escribieron hace poco el que
// corresponde al nombre del pago ("Rosa Díaz" ↔ chat "Rosa Diaz 🌱"). Si ningún nombre coincide y un solo chat mandó
// una foto (la captura del pago) en los últimos minutos, sugiere ese. Solo sugiere: abrir el chat es con un clic.
// Usa lo que ya llega a MultiChat (los avisos de mensaje nuevo y los chats que esperan datos de envío).
// Solo en memoria; se olvida en 3 horas.

const KEEP_MS = 3 * 60 * 60 * 1000;
const PHOTO_MS = 15 * 60 * 1000;
const PHOTO = /📷|foto|imagen|photo|image/i;

const recent = new Map(); // "cuenta|chat" -> { accountId, chat, at, notifId, photoAt }

const words = (s) => String(s || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .replace(/[^a-zñ*\s]/g, ' ')
  .split(/\s+/)
  .filter((w) => w.replace(/\*/g, '').length >= 2);

function purge() {
  const now = Date.now();
  for (const [key, c] of recent) if (now - c.at > KEEP_MS) recent.delete(key);
}

// Mensaje nuevo de un chat (aviso de la página).
function noteMessage(accountId, chat, body, notifId) {
  const name = String(chat || '').trim();
  if (!accountId || !name) return;
  purge();
  const key = `${accountId}|${name.toLowerCase()}`;
  const entry = recent.get(key) || { accountId, chat: name.slice(0, 120) };
  entry.at = Date.now();
  if (Number.isInteger(notifId)) entry.notifId = notifId;
  if (PHOTO.test(String(body || ''))) entry.photoAt = entry.at;
  recent.set(key, entry);
}

// ¿Cuánto se parecen el nombre del pago y el del chat? 0 = nada. Tiene que coincidir el primer nombre.
// "Yodver Lim*" (nombre cortado de Yape) coincide con "Yodver Lima".
function score(payName, chatName) {
  const pay = words(payName);
  const chat = words(chatName);
  if (!pay.length || !chat.length) return 0;
  const same = (p, c) => (p.endsWith('*') ? c.startsWith(p.replace(/\*+$/, '')) : p === c || (p.length >= 4 && c.startsWith(p)));
  if (!chat.some((c) => same(pay[0], c))) return 0;
  return pay.filter((p) => chat.some((c) => same(p, c))).length;
}

// extra: [{ accountId, chat }] de chats que esperan datos de envío o pago (suman un poco).
function match(payName, extra = []) {
  purge();
  const now = Date.now();
  const candidates = [...recent.values()];
  for (const e of extra) {
    if (!candidates.some((c) => c.accountId === e.accountId && c.chat.toLowerCase() === String(e.chat).toLowerCase())) {
      candidates.push({ accountId: e.accountId, chat: e.chat, at: e.since || now - KEEP_MS / 2, waiting: true });
    } else {
      candidates.find((c) => c.accountId === e.accountId && c.chat.toLowerCase() === String(e.chat).toLowerCase()).waiting = true;
    }
  }
  let best = null;
  for (const c of candidates) {
    const s = score(payName, c.chat);
    if (!s) continue;
    const rank = s * 10 + (c.waiting ? 3 : 0) + (c.photoAt && now - c.photoAt < PHOTO_MS ? 2 : 0) + (1 - (now - c.at) / KEEP_MS);
    if (!best || rank > best.rank) best = { ...c, rank, why: 'nombre' };
  }
  if (best) return { accountId: best.accountId, chat: best.chat, notifId: best.notifId, why: best.why };
  // Sin nombre parecido: el único chat que mandó una foto hace poco (probablemente la captura del pago).
  const photos = candidates.filter((c) => c.photoAt && now - c.photoAt < PHOTO_MS);
  if (photos.length === 1) return { accountId: photos[0].accountId, chat: photos[0].chat, notifId: photos[0].notifId, why: 'foto' };
  return null;
}

module.exports = { noteMessage, match, score, words };
