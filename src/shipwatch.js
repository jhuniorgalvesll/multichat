'use strict';

// "Esperando datos de envío": cuando se pega el formulario de Shalom u Olva en un chat, ese chat queda esperando.
// Lo que el cliente responde (aunque sea en varios mensajes y sin títulos) se junta y se lee con parseSelection;
// cuando trae datos se avisa "📦 Fulano envió sus datos" para abrir el ticket ya lleno. Después de mandarle los datos
// para que confirme, un "sí, correcto" del cliente avisa "✅ Confirmó: imprimir".
// Nada se envía solo. De WhatsApp solo se usa: el aviso de mensaje nuevo de ese chat y, si ese chat está abierto,
// los mensajes que el cliente escribió después del formulario. Solo en memoria; se olvida al imprimir o en 12 horas.
const tickets = require('./tickets');

const KEEP_MS = 12 * 60 * 60 * 1000;
const CONFIRM = /^\s*(s[ií]+|correcto|conforme|ok(ey)?|est[aá] bien|todo bien|todo correcto|perfecto|exacto|as[ií] es|listo|de acuerdo|afirmativo|👍|✅)/i;

const waiting = new Map(); // clave "cuenta|chat" -> entrada
const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase();
const keyOf = (accountId, chat) => `${accountId}|${norm(chat)}`;

function start(accountId, chat, carrier) {
  if (!chat) return null;
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    accountId,
    chat: String(chat).slice(0, 120),
    carrier,
    since: Date.now(),
    pageTexts: [], // mensajes del cliente leídos del chat abierto (después del formulario)
    notifyTexts: [], // mensajes que llegaron por aviso con el chat cerrado
    data: {},
    official: null, // ficha oficial de la agencia Shalom que el vendedor le mandó al cliente
    announced: '',
    stage: 'datos', // 'datos' | 'confirmar'
    confirmAt: 0,
    textsAtConfirm: 0,
    confirmed: false,
  };
  waiting.set(keyOf(accountId, chat), entry);
  return entry;
}

function purge() {
  const now = Date.now();
  for (const [key, entry] of waiting) if (now - entry.since > KEEP_MS) waiting.delete(key);
}

function find(accountId, chat) {
  purge();
  return waiting.get(keyOf(accountId, chat)) || null;
}

function forAccount(accountId) {
  purge();
  return [...waiting.values()].filter((e) => e.accountId === accountId);
}

const allTexts = (entry) => {
  // Los del chat abierto ya incluyen a los que llegaron por aviso; se evitan repetidos.
  const seen = new Set(entry.pageTexts.map(norm));
  return [...entry.pageTexts, ...entry.notifyTexts.filter((t) => !seen.has(norm(t)))];
};

// Recalcula los datos. Devuelve qué avisar: { kind: 'data' | 'confirmed', entry, missing } o null.
function update(entry) {
  const texts = allTexts(entry);
  if (entry.stage === 'confirmar') {
    const after = texts.slice(entry.textsAtConfirm);
    if (!entry.confirmed && after.some((t) => CONFIRM.test(t))) {
      entry.confirmed = true;
      return { kind: 'confirmed', entry, missing: tickets.missingFields(entry.data, entry.data.carrier || entry.carrier) };
    }
    // Si después de confirmar el cliente corrige algo, se vuelve a leer todo.
  }
  const data = tickets.parseSelection(texts.join('\n'), {}, entry.carrier);
  if (!data.carrier) data.carrier = entry.carrier;
  // La ficha oficial de Shalom que mandó el vendedor manda sobre lo que escribió el cliente (agencia, destino,
  // dirección); la referencia del cliente se respeta si ya había una.
  // Ticket de Shalom: DESTINO = "Lima / Cañete / Mala / Mala" y DIRECCIÓN = la línea completa de la ficha (con su
  // referencia). Lo que el cliente escribió como agencia ("Mala") deja de ir, para no repetir.
  if (entry.official && data.carrier === 'Shalom') {
    data.destination = entry.official.destination || data.destination;
    if (entry.official.address) data.address = entry.official.address;
    delete data.agent;
  }
  entry.data = data;
  const fields = Object.keys(data).filter((k) => k !== 'carrier').length;
  const missing = tickets.missingFields(data, data.carrier);
  // Se avisa la primera vez y cada vez que cambia lo que falta o llega la ficha de la agencia (no en cada mensaje).
  const key = `${missing.join(',')}|${entry.official ? 1 : 0}`;
  if (fields >= 2 && key !== entry.announced) {
    entry.announced = key;
    return { kind: 'data', entry, missing };
  }
  return null;
}

function addNotification(accountId, chat, body) {
  const entry = find(accountId, chat);
  if (!entry || !body) return null;
  entry.notifyTexts.push(String(body).slice(0, 2000));
  return update(entry);
}

// texts: mensajes del cliente después del formulario; outTexts: los del vendedor (para la ficha de la agencia Shalom).
function setPageTexts(entry, texts, outTexts = []) {
  if (!Array.isArray(texts)) return null;
  const clean = texts.map((t) => String(t || '').slice(0, 2000)).filter(Boolean);
  const official = (Array.isArray(outTexts) ? outTexts : []).map((t) => tickets.parseShalomAgency(t)).filter(Boolean).pop() || null;
  const officialChanged = JSON.stringify(official) !== JSON.stringify(entry.official);
  if (clean.join('\n') === entry.pageTexts.join('\n') && !officialChanged) return null;
  entry.pageTexts = clean;
  entry.official = official;
  return update(entry);
}

// Se mandaron los datos al cliente para que confirme: lo que diga después ("sí, correcto") es la confirmación.
function markConfirming(entry) {
  entry.stage = 'confirmar';
  entry.confirmAt = Date.now();
  entry.textsAtConfirm = allTexts(entry).length;
  entry.confirmed = false;
}

function remove(entry) {
  for (const [key, e] of waiting) if (e === entry) waiting.delete(key);
}

// Al imprimir: se deja de esperar el chat de ese cliente.
function doneFor(ticket) {
  const done = [];
  for (const [key, e] of waiting) {
    if ((ticket.dni && e.data.dni === ticket.dni) || (ticket.name && norm(e.data.name) === norm(ticket.name))) {
      waiting.delete(key);
      done.push(e);
    }
  }
  return done;
}

function byId(id) {
  return [...waiting.values()].find((e) => e.id === id) || null;
}

module.exports = { start, find, forAccount, addNotification, setPageTexts, markConfirming, remove, doneFor, byId, purge };
