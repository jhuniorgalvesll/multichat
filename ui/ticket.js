'use strict';

// Dibuja el ticket de envío (72 × 297 mm). Se usa en la vista previa y en la página de impresión.

// Code 128 (juego B): anchos de barra/espacio de cada símbolo.
const CODE128 = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112',
];

function code128Svg(value) {
  const chars = [...value].filter((c) => c >= ' ' && c <= '~');
  if (!chars.length) return null;
  const codes = [104, ...chars.map((c) => c.charCodeAt(0) - 32)];
  const checksum = codes.reduce((sum, code, i) => sum + code * (i === 0 ? 1 : i), 0) % 103;
  const widths = [...codes, checksum, 106].map((code) => CODE128[code]).join('');
  const quiet = 10;
  let x = quiet;
  let bars = '';
  [...widths].forEach((w, i) => {
    const width = Number(w);
    if (i % 2 === 0) bars += `<rect x="${x}" y="0" width="${width}" height="40"/>`;
    x += width;
  });
  const total = x + quiet;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} 40" preserveAspectRatio="none">${bars}</svg>`;
}

// QR de la tienda online, dibujado en SVG con qrcode-generator (ui/vendor/qrcode.js).
function webQrSvg(website) {
  const site = String(website || '').trim();
  if (!site || typeof qrcode !== 'function') return null;
  const url = /^https?:\/\//i.test(site) ? site : `https://${site.replace(/^\/+/, '')}`;
  const qr = qrcode(0, 'M');
  qr.addData(url);
  qr.make();
  const n = qr.getModuleCount();
  let d = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + 2} ${r + 2}h1v1h-1z`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n + 4} ${n + 4}" shape-rendering="crispEdges"><path d="${d}"/></svg>`;
}

const ICONS = {
  truck: '<svg viewBox="0 0 48 48" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round"><path d="M3 12h26v20H3zM29 19h9l7 7v6H29z"/><circle cx="12" cy="36" r="4" fill="#000"/><circle cx="36" cy="36" r="4" fill="#000"/></svg>',
  box: '<svg viewBox="0 0 48 48" fill="none" stroke="#000" stroke-width="2" stroke-linejoin="round"><path d="M4 18 24 9l20 9-20 9z"/><path d="M4 18v14l20 9 20-9V18"/><path d="M24 27v14"/><path d="M24 2c3 2 6 3 9 3v6c0 5-4 8-9 10-5-2-9-5-9-10V5c3 0 6-1 9-3z" fill="#fff"/><path d="m20 11 3 3 5-5"/></svg>',
  pin: '<svg viewBox="0 0 48 48" fill="none" stroke="#000" stroke-width="2.4" stroke-linejoin="round"><path d="M24 44S9 29 9 18a15 15 0 0 1 30 0c0 11-15 26-15 26z"/><circle cx="24" cy="18" r="6"/><path d="M14 46h20"/></svg>',
};

function el(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== undefined && content !== null) node.textContent = content;
  return node;
}

function field(label, value) {
  const frag = document.createDocumentFragment();
  if (!value) return frag;
  const big = label === 'DESTINO:' || label === 'AGENCIA:';
  frag.append(el('div', 't-label', label), el('div', big ? 't-value t-big' : 't-value', value));
  return frag;
}

function formatPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 9) return `+51 ${digits}`;
  if (digits.length === 11 && digits.startsWith('51')) return `+51 ${digits.slice(2)}`;
  return phone || '';
}

// Datos del remitente que se pueden cambiar en cada ticket → campo del remitente que reemplazan.
const SENDER_OVERRIDES = {
  origin: 'origin', sender: 'sender', senderAddress: 'address', email: 'email', website: 'website', storePhone: 'phone',
};

// Todos los logos se ven del mismo tamaño, sea cual sea la forma de la imagen: ocupan la misma superficie
// que un logo horizontal típico (42 × 13 mm). Un logo alargado sale de 42 mm de ancho; uno cuadrado, de 20 × 20 mm.
const LOGO = { area: 42 * 13, maxWidth: 42, maxHeight: 20 };

function sizeLogo(node) {
  const ratio = node.naturalWidth / node.naturalHeight;
  if (!ratio || !Number.isFinite(ratio)) return;
  let height = Math.sqrt(LOGO.area / ratio);
  if (height * ratio > LOGO.maxWidth) height = LOGO.maxWidth / ratio;
  if (height > LOGO.maxHeight) height = LOGO.maxHeight;
  node.style.width = `${(height * ratio).toFixed(2)}mm`;
  node.style.height = `${height.toFixed(2)}mm`;
}

function logoImage(src) {
  const node = img('t-logo', src);
  if (node.complete && node.naturalWidth) sizeLogo(node);
  else node.addEventListener('load', () => sizeLogo(node));
  return node;
}

function img(className, src) {
  const node = el('img', className);
  node.src = src;
  node.alt = '';
  return node;
}

// Nota "Importante" del remitente; **texto** sale en negrita.
function noteBlock(profile, className) {
  const note = el('div', className);
  for (const paragraph of String(profile.note || '').split(/\n+/).filter(Boolean)) {
    const p = el('p');
    paragraph.split(/\*\*/).forEach((part, i) => p.append(i % 2 ? el('b', '', part) : part));
    note.append(p);
  }
  return note;
}

function barcodeBlock(ticket, className) {
  const svg = code128Svg(ticket.orderNumber || '');
  if (!svg) return null;
  const box = el('div', className);
  box.innerHTML = svg;
  box.append(el('div', `${className}-code`, ticket.orderNumber));
  return box;
}

// Recuadro con su título en una franja negra (DESTINATARIO, DESTINO) y un ícono a la izquierda.
function section(title, icon, body) {
  const card = el('div', 't-card');
  card.append(el('div', 't-card-title', title));
  const row = el('div', 't-card-row');
  const iconBox = el('div', 't-icon');
  iconBox.innerHTML = icon;
  row.append(iconBox, body);
  card.append(row);
  return card;
}

// profile: { name, logoUrl, qrUrl, slogan, origin, sender, address, email, website, phone, note }
// Mismos datos y tamaños de letra que la etiqueta original; solo cambia la presentación.
function renderTicket(container, ticket, baseProfile = {}) {
  const profile = { ...baseProfile };
  for (const [key, profileKey] of Object.entries(SENDER_OVERRIDES)) {
    if (typeof ticket[key] === 'string') profile[profileKey] = ticket[key];
  }
  const root = el('div', profile.textSize === 'small' ? 'ticket t-small' : 'ticket');
  const webQr = profile.webQr !== false ? webQrSvg(profile.website) : null;

  const head = el('div', 't-head');
  const brand = el('div', 't-brand');
  brand.append(profile.logoUrl ? logoImage(profile.logoUrl) : el('div', 't-logo-text', profile.name || ''));
  if (profile.slogan) brand.append(el('div', 't-slogan', profile.slogan));
  const meta = el('div', 't-meta');
  const line = (label, value) => {
    const row = el('div');
    row.append(el('b', '', `${label}: `), value || '');
    return row;
  };
  if (ticket.channel) meta.append(line('Canalizacion', ticket.channel));
  if (profile.origin) meta.append(line('Origen', profile.origin));
  brand.append(meta);
  head.append(brand);
  // Arriba a la derecha va el QR de WhatsApp; si la empresa no tiene, ahí va el de la página web.
  const webQrBox = () => {
    const qr = el('div', 't-qr-box');
    const code = el('div', 't-qr t-qr-web');
    code.innerHTML = webQr;
    qr.append(code, el('div', 't-qr-caption', 'Página web'));
    return qr;
  };
  if (profile.qrUrl) {
    const qr = el('div', 't-qr-box');
    qr.append(img('t-qr', profile.qrUrl));
    if (webQr) qr.append(el('div', 't-qr-caption', 'WhatsApp'));
    head.append(qr);
  } else if (webQr) {
    head.append(webQrBox());
  } else {
    head.classList.add('t-no-qr');
  }
  const footQr = profile.qrUrl && webQr;
  root.append(head);

  if (profile.sender || profile.address || profile.email) {
    const sender = el('div', 't-sender');
    if (profile.sender) sender.append(el('div', 't-sender-name', `REMITENTE: ${profile.sender}`));
    if (profile.address) sender.append(el('div', '', `DIRECCION : ${profile.address}`));
    if (profile.email) sender.append(el('div', '', `CORREO: ${profile.email}`));
    root.append(sender);
  }

  // Empresa de envío bien visible, para diferenciar las cajas de Shalom y Olva.
  if (ticket.carrier) {
    const band = el('div', 't-carrier');
    const truck = el('span', 't-truck');
    truck.innerHTML = ICONS.truck;
    band.append(truck, el('span', 't-carrier-label', 'ENVÍO POR:'), el('span', 't-carrier-name', ticket.carrier));
    root.append(band);
  }

  const who = el('div', 't-block');
  who.append(el('div', 't-value t-name', ticket.name));
  if (ticket.dni) {
    const dni = el('div', 't-value t-big');
    dni.append(el('b', '', 'DNI: '), ticket.dni);
    who.append(dni);
  }
  const phone = el('div', 't-value t-big');
  phone.append(el('b', '', 'CEL: '), formatPhone(ticket.phone));
  who.append(phone);
  root.append(section('DESTINATARIO', ICONS.box, who));

  // Solo se imprime lo que se llenó (cada envío puede ir a agencia o a domicilio).
  const where = el('div', 't-block');
  where.append(
    field('DESTINO:', ticket.destination),
    field('AGENCIA:', ticket.agent),
    field('DIRECCION:', ticket.address),
    field('DISTRITO:', ticket.district),
    field(ticket.reference2 ? 'REFERENCIA 1:' : 'REFERENCIA:', ticket.reference),
    field('REFERENCIA 2:', ticket.reference2),
    field('NOTA:', ticket.note),
  );
  if (where.childElementCount) root.append(section('DESTINO', ICONS.pin, where));

  root.append(barcodeBlock(ticket, 't-barcode') || el('div', 't-spacer'));

  const foot = el('div', footQr ? 't-foot t-foot-qr' : 't-foot');
  const footText = el('div', 't-foot-text');
  if (profile.website) footText.append(line('Tienda Online', profile.website));
  if (profile.phone) footText.append(line('Telefono', profile.phone));
  foot.append(footText);
  if (footQr) foot.append(webQrBox());
  root.append(foot);
  if (profile.note) root.append(noteBlock(profile, 't-note'));

  container.replaceChildren(root);
  fitTicket(root);
  return root;
}

// Cuánto ocupa el contenido del ticket, en mm (la hoja mide 297 mm). Funciona aunque la vista esté achicada.
function ticketUsage(root) {
  const box = root.getBoundingClientRect();
  if (!box.height) return null;
  const mmPerPx = 296.9 / box.height;
  const last = root.lastElementChild;
  const bottom = last ? last.getBoundingClientRect().bottom - box.top : 0;
  const used = bottom * mmPerPx + 3; // + margen de abajo
  return { usedMm: Math.round(used), freeMm: Math.round(296.9 - used) };
}

// Si los datos no caben en 297 mm (direcciones o textos muy largos), achica la letra por pasos
// en vez de cortar el final del ticket. root.dataset.fit: '' = normal, 'small' o 'tight' = se achicó.
function fitTicket(root) {
  // Se vuelve a medir cuando terminan de cargar el logo y el QR (cambian el alto del ticket).
  if (!root.dataset.fitWatch) {
    root.dataset.fitWatch = '1';
    for (const image of root.querySelectorAll('img')) if (!image.complete) image.addEventListener('load', () => fitTicket(root));
  }
  if (root.dataset.fit === 'small') root.classList.remove('t-small');
  if (root.dataset.fit === 'tight') root.classList.remove('t-tight', ...(root.dataset.fitAddedSmall ? ['t-small'] : []));
  root.dataset.fit = '';
  root.dataset.fitAddedSmall = '';
  for (const step of ['small', 'tight']) {
    const usage = ticketUsage(root);
    if (!usage || usage.freeMm >= 0) return;
    if (step === 'small' && root.classList.contains('t-small')) continue;
    root.classList.add(step === 'small' ? 't-small' : 't-tight');
    if (step === 'small') root.dataset.fitAddedSmall = '1';
    root.dataset.fit = step;
  }
}

window.ticketUsage = ticketUsage;
window.fitTicket = fitTicket;

window.renderTicket = renderTicket;
