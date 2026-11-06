'use strict';

// Tickets de envío para ticketera (72 × 297 mm), con el formato de Shalom y Olva.
// Los "remitentes" (Fertisem, Agroandina, ...) guardan el logo, el QR y los datos fijos del ticket.
const fs = require('fs');
const path = require('path');

const CARRIERS = ['Shalom', 'Olva'];
// Otras empresas de envío que se reconocen en el mensaje del cliente (se eligen como "Otra").
const OTHER_CARRIERS = [
  [/marvisur/i, 'Marvisur'], [/cruz del sur/i, 'Cruz del Sur'], [/flores/i, 'Flores'], [/oltursa/i, 'Oltursa'],
  [/m[oó]vil ?bus/i, 'Movil Bus'], [/\bciva\b/i, 'Civa'], [/excluciva/i, 'Excluciva'], [/turismo d[ií]as/i, 'Turismo Días'],
  [/emtrafesa/i, 'Emtrafesa'], [/serpost/i, 'Serpost'], [/urbano/i, 'Urbano'], [/\bdhl\b/i, 'DHL'],
];
const CHANNELS = ['WhatsApp', 'Facebook', 'Instagram', 'TikTok', 'Tienda Online', 'Otro'];
const PAGE_MM = { width: 72.2, height: 296.9 }; // medida de los PDF de ejemplo

// **texto** sale en negrita en el ticket.
const NOTE = '**Importante:** Fertisem es el vendedor del pedido. Antes del despacho se embala, se verifica y se '
  + 'envían al cliente fotos y video como constancia del estado y contenido.\n'
  + 'Desde la entrega al courier afiliado, el **CLIENTE asume la responsabilidad exclusiva** del traslado y de '
  + 'cualquier incidencia en ruta, la cual se gestiona directamente con el courier usando la guía de envío.\n'
  + 'Al recibir, el CLIENTE debe revisar antes de firmar. Si hay daño o faltante, exigir anotación en la guía, '
  + 'tomar fotos/video y reportar de inmediato. **La firma implica conformidad.**';

// Remitentes iniciales, tomados de los tickets de ejemplo. Los logos y el QR vienen en build/ticket/.
const DEFAULT_PROFILES = [
  {
    id: 'fertisem',
    name: 'FERTISEM',
    logoFile: 'fertisem-logo.png',
    qrFile: 'qr-whatsapp.png',
    slogan: '',
    origin: 'MALA',
    sender: 'FERTISEM E.I.R.L',
    address: 'JIRON REAL N° 125 MALA - LIMA',
    email: 'VENTAS@FERTISEM.PE',
    website: 'www.fertisem.pe',
    phone: '950 233 689',
    note: NOTE,
  },
  {
    id: 'agroandina',
    name: 'AGROANDINA',
    logoFile: 'agroandina-logo.png',
    qrFile: 'qr-whatsapp.png',
    slogan: 'Tu tienda Agricola online',
    origin: 'Tienda Online',
    sender: 'AGROANDINA',
    address: '',
    email: '',
    website: 'www.fertisem.pe',
    phone: '967 867 089',
    note: NOTE,
  },
];

const text = (value, max) => String(value ?? '').trim().slice(0, max);

// Crea los remitentes de ejemplo la primera vez, copiando sus imágenes a la carpeta de la app.
function seedProfiles(images, defaultsDir) {
  return DEFAULT_PROFILES.map(({ logoFile, qrFile, ...profile }) => ({
    ...profile,
    logo: fs.existsSync(path.join(defaultsDir, logoFile)) ? images.importImage(path.join(defaultsDir, logoFile)) || '' : '',
    qr: fs.existsSync(path.join(defaultsDir, qrFile)) ? images.importImage(path.join(defaultsDir, qrFile)) || '' : '',
  }));
}

function sanitizeProfile(input, images) {
  const image = (name) => (typeof name === 'string' && images.exists(name) ? name : '');
  return {
    id: typeof input.id === 'string' && /^[a-z0-9]{1,24}$/.test(input.id)
      ? input.id
      : Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: text(input.name, 40) || 'REMITENTE',
    logo: image(input.logo),
    qr: image(input.qr),
    slogan: text(input.slogan, 60),
    origin: text(input.origin, 40),
    sender: text(input.sender, 80),
    address: text(input.address, 120),
    email: text(input.email, 80),
    website: text(input.website, 80),
    phone: text(input.phone, 40),
    note: text(input.note, 1500),
    // 'small': letras más pequeñas en todo el ticket (p. ej. para productos de mascotas).
    textSize: input.textSize === 'small' ? 'small' : 'normal',
    // Segundo QR, creado con la tienda online, junto al de WhatsApp.
    webQr: input.webQr !== false,
  };
}

function sanitizeTicket(input) {
  const ticket = {
    // Shalom, Olva u otra empresa escrita por el usuario (p. ej. Marvisur).
    carrier: CARRIERS.includes(input.carrier) ? input.carrier : text(input.carrier, 30) || 'Shalom',
    profileId: text(input.profileId, 24),
    channel: CHANNELS.includes(input.channel) ? input.channel : 'WhatsApp',
    name: text(input.name, 90),
    phone: text(input.phone, 20).replace(/[^\d+ ]/g, ''),
    destination: text(input.destination, 140),
    agent: text(input.agent, 120),
    address: text(input.address, 220),
    reference: text(input.reference, 220),
    reference2: text(input.reference2, 220),
    district: text(input.district, 80),
    note: text(input.note, 220),
    dni: text(input.dni, 20).replace(/\D/g, '').slice(0, 12),
    orderNumber: text(input.orderNumber, 30).replace(/[^\x20-\x7e]/g, ''),
  };
  // Datos del remitente cambiados solo para este ticket (si no vienen, se usan los del remitente).
  const overrides = { origin: 40, sender: 80, senderAddress: 120, email: 80, website: 80, storePhone: 40 };
  for (const [key, max] of Object.entries(overrides)) {
    if (typeof input[key] === 'string') ticket[key] = text(input[key], max);
  }
  return ticket;
}

// Formularios que se envían al cliente para pedirle sus datos (editables en ⚙ → Formularios de envío).
// Los títulos coinciden con los que entiende parseSelection, así la respuesta se lee sola.
const DEFAULT_FORMS = {
  Shalom: [
    '*DATOS PARA TU ENVÍO POR SHALOM* 📦',
    'Por favor completa y envíanos:',
    '',
    '*Nombre y apellidos completos:* ',
    '*DNI:* ',
    '*Celular:* ',
    '*Nombre de la agencia Shalom:* ',
    '*Dirección de la agencia:* ',
  ].join('\n'),
  Olva: [
    '*DATOS PARA TU ENVÍO POR OLVA* 📦',
    'Por favor completa y envíanos:',
    '',
    '*Nombre y apellidos completos:* ',
    '*DNI:* ',
    '*Celular:* ',
    '*Dirección de tu casa:* ',
    '*Distrito:* ',
    '*Referencia 1:* ',
    '*Referencia 2:* ',
    '*Nota (por si no te encuentran):* ',
  ].join('\n'),
};

// Campo del ticket según el título de la línea ("DNI:", "Distrito:", "Referencia 2:", ...).
function fieldForLabel(label) {
  const l = label.toLowerCase();
  if (/direcci/.test(l)) return 'address';
  if (/agencia|agente|oficina|^\s*(shalom|olva|marvisur)\s*$/.test(l)) return 'agent';
  if (/distrito/.test(l)) return 'district';
  if (/ref\w*\.?\s*2|segunda ref/.test(l)) return 'reference2';
  if (/ref/.test(l)) return 'reference';
  if (/nota|observ/.test(l)) return 'note';
  if (/destino|ciudad|provincia|departamento/.test(l)) return 'destination';
  if (/dni|documento/.test(l)) return 'dni';
  if (/celular|cel\b|tel[eé]fono|whatsapp|n[uú]mero/.test(l)) return 'phone';
  if (/nombre|recibe|destinatario|cliente/.test(l)) return 'name';
  return null;
}

// Palabras que no forman parte de un nombre (para no tomar "Si correcto" o "Marvisur podría ser" como nombre).
const NOT_NAME = /\b(si|sí|no|ok|okey|correcto|perfecto|gracias|hola|buenas|buenos|tardes|d[ií]as|noches|porfa+|por|favor|podr[ií]a|ser|env[ií]a|env[ií]alo|m[aá]nd(?:a|ame|alo)|entonces|quiero|necesito|cu[aá]nto|precio|ya|listo|pagu[eé]|yape[eé]?|plin|me|lo|te|mi|su|est[aá]|bien|aqu[ií]|mis|datos|misma|oficina|agencia|sede|referencia|nota)\b/i;
const ADDRESS_START = /^(jr\.?|jir[oó]n|av\.?|avenida|calle|ca\.|psje\.?|pasaje|mz\.?|manzana|lote|lt\.?|urb\.?|urbanizaci[oó]n|asoc\.?|asociaci[oó]n|prolong|carretera|km|sector|aa\.?\s?hh|a\.?h\.?|pueblo joven|block|edificio)\b/i;

// Una línea sin título: ¿qué dato es? Usa el orden en que el cliente suele escribir (nombre, DNI, celular, ...).
function classifyLine(line, found, carrier, first = false) {
  const compact = line.replace(/[\s.-]/g, '');
  if (/^\d{8}$/.test(compact) && !found.dni) return 'dni';
  if (/^(\+?51)?9\d{8}$/.test(compact) && !found.phone) return 'phone';
  if (/^\d+$/.test(compact)) return null;
  if (ADDRESS_START.test(line) && !found.address) return 'address';
  if (/\b(oficina|agencia|sede|counter|terminal)\b/i.test(line) && !found.agent) return 'agent';
  const words = line.split(/\s+/).filter(Boolean);
  if (!found.name && words.length >= 2 && words.length <= 6 && /^[\p{L}\s.'-]+$/u.test(line) && !NOT_NAME.test(line)) return 'name';
  // La primera línea con una sola palabra ("Melisa") también es el nombre: luego se avisa que faltan los apellidos.
  if (!found.name && first && words.length === 1 && /^[\p{L}'-]{3,}$/u.test(line) && !NOT_NAME.test(line)) return 'name';
  // Lugar: "QUILLABAMBA, LA CONVENCIÓN, CUSCO" o "Lima / Lima / Surco" (en Olva va a domicilio: no hay destino).
  if (carrier !== 'Olva' && /[,/]/.test(line) && !found.destination && /^[\p{L}\s,./-]+$/u.test(line)) return 'destination';
  // Olva: el cliente da la dirección de su casa y luego sus referencias (y a veces una nota).
  if (carrier === 'Olva' && found.address && !/^(s[ií]|ok|correcto|gracias|perfecto|listo)\b/i.test(line)) {
    if (!found.reference) return 'reference';
    if (!found.reference2) return 'reference2';
    if (!found.note) return 'note';
    return null;
  }
  if (NOT_NAME.test(line) && line.split(/\s+/).length <= 4 && !/\d/.test(line)) return null; // "Si correcto", "Marvisur podría ser"
  // Shalom: una línea corta que no es una frase ("Mala", "Huancayo El Tambo") es el nombre de la agencia.
  if (carrier === 'Shalom' && !found.agent && !NOT_NAME.test(line) && line.split(/\s+/).length <= 6) return 'agent';
  if (carrier !== 'Olva' && !found.destination && !NOT_NAME.test(line) && /^[\p{L}\s,./-]+$/u.test(line)) return 'destination';
  return null;
}

// Saca los datos del envío del texto que el usuario seleccionó en el chat (la respuesta del cliente).
// `base` trae lo que detectó el registro de ventas (nombre, DNI, celular) para textos sin títulos.
// `carrier`: Shalom u Olva si se sabe qué formulario se envió (ayuda a ubicar las líneas sin título).
function parseSelection(raw, base = {}, carrier = '') {
  const t = String(raw || '').slice(0, 4000).replace(/[*_~]/g, '');
  const found = {};
  if (/shalom/i.test(t)) found.carrier = 'Shalom';
  else if (/olva/i.test(t)) found.carrier = 'Olva';
  else {
    const other = OTHER_CARRIERS.find(([re]) => re.test(t));
    if (other) found.carrier = other[1];
  }

  // 1) Líneas con título: "Título: valor" (el valor también puede venir en la línea siguiente).
  const lines = t.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !/^(datos para tu env[ií]o|por favor completa)/i.test(l))
    // "DNI. 44581929", "Cel. 993998874" → con dos puntos, para leerlos como título y valor.
    .map((l) => l.replace(/^(dni|cel|celular|tel[eé]fono|telf|ruc)\s*[.]\s*/i, '$1: '));
  const untitled = [];
  lines.forEach((line, i) => {
    const m = line.match(/^([^:]{2,60}?)\s*:\s*(.*)$/);
    const field = m ? fieldForLabel(m[1]) : null;
    if (!m || !field) {
      untitled.push(line);
      return;
    }
    if (found[field]) return;
    let value = m[2].trim();
    if (!value && lines[i + 1] && !/^[^:]{2,60}:/.test(lines[i + 1])) value = lines[i + 1];
    if (value) found[field] = value.replace(/\s+/g, ' ').slice(0, 220);
  });

  // 2) Líneas sin título (como responden casi todos los clientes): se reconocen por su forma.
  untitled.forEach((line, i) => {
    const field = classifyLine(line, found, carrier || found.carrier, i === 0);
    if (field && !found[field]) found[field] = line.replace(/\s+/g, ' ').slice(0, 220);
  });
  if (found.dni) found.dni = found.dni.replace(/\D/g, '');
  if (found.phone) found.phone = found.phone.replace(/[^\d+ ]/g, '').trim();

  // 3) Lo que detectó el registro de ventas, si faltaba algo.
  if (!found.name && base.customer) found.name = base.customer;
  if (!found.phone && base.phone) found.phone = base.phone;
  if (!found.dni && base.dni) found.dni = base.dni;
  for (const key of Object.keys(found)) if (!found[key]) delete found[key];
  return found;
}

// Datos oficiales de una agencia Shalom que el vendedor copia de la página de Shalom y le manda al cliente:
//   HUANTA / Ayacucho / Huanta / Huanta / Huanta / Jr. Gervasio Santillana N°976 - Huanta - Ayacucho. Ref, Cruce ... /
//   a km / Grande / Co / Cómo llegar / LUNES A SÁBADOS 08:00 AM A 08:00 PM ...
// Devuelve { agent, destination, address } o null si el texto no parece una ficha de agencia.
function parseShalomAgency(raw) {
  const lines = String(raw || '').replace(/[*_~]/g, '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const placeIndex = lines.findIndex((l) => (l.match(/\//g) || []).length >= 2 && /^[\p{L}\s/.-]+$/u.test(l));
  const looksOfficial = placeIndex >= 0 && (lines.some((l) => /c[oó]mo llegar|lunes a|domingos?\b|\b\d{1,2}:\d{2}\s*(am|pm)/i.test(l)) || placeIndex <= 2);
  if (!looksOfficial) return null;
  const agent = placeIndex > 0 ? lines[placeIndex - 1] : '';
  const destination = lines[placeIndex].replace(/\s*\/\s*/g, ' / ');
  // La dirección va completa, con su referencia ("Av. Marchand # 250, Distrito De Mala . Referencia: …"), como en los
  // tickets de Shalom; no se separa en otro campo.
  const address = lines.slice(placeIndex + 1).find((l) => l.length > 8 && !/^(a km|c[oó]mo llegar|lunes|domingo|grande|mediana|peque|\d)/i.test(l)) || '';
  const result = { agent, destination, address: address.trim() };
  for (const key of Object.keys(result)) if (!result[key]) delete result[key];
  return result.destination ? result : null;
}

// Datos que faltan para imprimir el ticket según la empresa de envío.
function missingFields(data, carrier) {
  const need = carrier === 'Olva'
    ? [['name', 'nombre'], ['dni', 'DNI'], ['phone', 'celular'], ['address', 'dirección']]
    : [['name', 'nombre'], ['dni', 'DNI'], ['phone', 'celular'], ['agent', 'agencia o destino']];
  // Shalom: con el destino de la ficha oficial ("Lima / Cañete / Mala / Mala") no hace falta el nombre de la agencia.
  const missing = need.filter(([key]) => !data[key] && !(key === 'agent' && data.destination)).map(([, label]) => label);
  // Shalom, Olva y cualquier empresa entregan solo con nombre y apellidos completos (como en el DNI): "Melisa" sola no alcanza.
  if (data.name && data.name.trim().split(/\s+/).length < 2) missing.unshift('apellidos (nombre completo)');
  return missing;
}

module.exports = {
  CARRIERS, CHANNELS, PAGE_MM, DEFAULT_FORMS, seedProfiles, sanitizeProfile, sanitizeTicket, parseSelection, parseShalomAgency, missingFields,
};
