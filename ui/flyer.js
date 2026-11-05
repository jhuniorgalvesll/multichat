'use strict';

// Creador de estados y ofertas: arma una imagen con la foto del producto, el precio y el logo de la empresa,
// lista para pegar en el chat o subir a los estados de WhatsApp. No se envía nada solo.
// Usa $, api, state, passwordMode y closeCoffee de ui.js.

const FLYER_THEMES = {
  violeta: { name: 'Violeta', bg: ['#2e1065', '#7c3aed', '#db2777'], text: '#ffffff', sub: 'rgba(255,255,255,0.85)', badge: '#fde047', badgeText: '#3b0764', tag: '#fde047', tagText: '#3b0764' },
  verde: { name: 'Campo', bg: ['#052e16', '#15803d', '#84cc16'], text: '#ffffff', sub: 'rgba(255,255,255,0.88)', badge: '#fde047', badgeText: '#14532d', tag: '#ffffff', tagText: '#15803d' },
  naranja: { name: 'Oferta', bg: ['#7f1d1d', '#dc2626', '#f59e0b'], text: '#ffffff', sub: 'rgba(255,255,255,0.9)', badge: '#ffffff', badgeText: '#b91c1c', tag: '#fde047', tagText: '#7f1d1d' },
  blanco: { name: 'Elegante', bg: ['#ffffff', '#f1f5f9', '#e2e8f0'], text: '#0f172a', sub: '#475569', badge: '#dc2626', badgeText: '#ffffff', tag: '#0f172a', tagText: '#ffffff', light: true },
};

const FLYER_SIZES = { estado: { w: 1080, h: 1920, label: 'Estado (vertical)' }, post: { w: 1080, h: 1080, label: 'Cuadrado' } };

const flyer = {
  open: false,
  theme: 'violeta',
  size: 'estado',
  photo: null, // HTMLImageElement
  logo: null,
  profiles: [],
};

function loadImg(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Parte el texto en líneas que entren en `maxWidth` (como mucho `maxLines`, la última con "…").
function wrapLines(ctx, text, maxWidth, maxLines) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth || !line) line = test;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    let last = lines[maxLines - 1];
    while (last && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
    lines[maxLines - 1] = `${last}…`;
  }
  return lines;
}

// Dibuja la imagen "cubriendo" el recuadro (recorta lo que sobra, sin deformar).
function drawCover(ctx, img, x, y, w, h) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale;
  const sh = h / scale;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
}

function drawContain(ctx, img, x, y, w, h) {
  const scale = Math.min(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

const FONT = '"Segoe UI", system-ui, sans-serif';

function drawFlyer(canvas) {
  const t = FLYER_THEMES[flyer.theme];
  const { w: W, h: H } = FLYER_SIZES[flyer.size];
  const tall = flyer.size === 'estado';
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const data = {
    tag: $('fly-tag').value.trim(),
    name: $('fly-name').value.trim() || 'Nombre del producto',
    price: $('fly-price').value.trim(),
    old: $('fly-old').value.trim(),
    text: $('fly-text').value.trim(),
    footer: $('fly-footer').value.trim(),
  };

  // Fondo en degradado con círculos de luz.
  const bg = ctx.createLinearGradient(0, 0, W, H);
  t.bg.forEach((c, i) => bg.addColorStop(i / (t.bg.length - 1), c));
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = t.light ? 0.5 : 0.14;
  for (const [cx, cy, r, color] of [[W * 0.9, H * 0.08, W * 0.45, t.light ? '#ddd6fe' : '#ffffff'], [W * 0.05, H * 0.75, W * 0.5, t.light ? '#fecaca' : '#ffffff']]) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Logo arriba, en una cápsula blanca.
  let y = tall ? 70 : 50;
  if (flyer.logo) {
    const lw = 460;
    const lh = tall ? 150 : 120;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.25)';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, (W - lw) / 2, y, lw, lh, lh / 2);
    ctx.fill();
    ctx.restore();
    drawContain(ctx, flyer.logo, (W - lw) / 2 + 40, y + 18, lw - 80, lh - 36);
    y += lh + (tall ? 50 : 30);
  }

  // Medidas del texto (para centrar todo en el espacio libre del estado vertical).
  const photoSize = tall ? 820 : 560;
  const maxW = tall ? W - 140 : W - (70 + photoSize + 60) - 60;
  ctx.font = `900 ${tall ? 92 : 64}px ${FONT}`;
  const nameLines = wrapLines(ctx, data.name, maxW, tall ? 2 : 3);
  ctx.font = `500 ${tall ? 50 : 38}px ${FONT}`;
  const textLines = data.text ? wrapLines(ctx, data.text, maxW, tall ? 3 : 5) : [];
  const footerSpace = data.footer ? (tall ? 210 : 140) : 60;
  let blockTop = tall ? y + 40 : y + 20;
  if (tall) {
    const block = photoSize + 70 + nameLines.length * 104 + (textLines.length ? 14 + textLines.length * 62 : 0);
    blockTop = Math.max(y + 30, y + (H - footerSpace - y - block) / 2);
  }

  // Foto del producto.
  const px = tall ? (W - photoSize) / 2 : 70;
  const py = blockTop;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 50;
  ctx.shadowOffsetY = 20;
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, px - 14, py - 14, photoSize + 28, photoSize + 28, 56);
  ctx.fill();
  ctx.restore();
  ctx.save();
  roundRect(ctx, px, py, photoSize, photoSize, 44);
  ctx.clip();
  if (flyer.photo) drawCover(ctx, flyer.photo, px, py, photoSize, photoSize);
  else {
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(px, py, photoSize, photoSize);
    ctx.fillStyle = '#94a3b8';
    ctx.font = `600 ${tall ? 44 : 36}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('📷 Elige la foto del producto', px + photoSize / 2, py + photoSize / 2);
  }
  ctx.restore();

  // Etiqueta ("OFERTA", "NUEVO"...) sobre la esquina de la foto.
  if (data.tag) {
    ctx.font = `900 ${tall ? 56 : 46}px ${FONT}`;
    const tw = ctx.measureText(data.tag.toUpperCase()).width + 70;
    const th = tall ? 96 : 80;
    ctx.save();
    ctx.translate(px - 10, py + 40);
    ctx.rotate(-0.08);
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 20;
    ctx.fillStyle = t.tag;
    roundRect(ctx, 0, 0, tw, th, 22);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = t.tagText;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(data.tag.toUpperCase(), tw / 2, th / 2 + 3);
    ctx.restore();
  }

  // Precio en un círculo grande sobre la esquina de la foto.
  if (data.price) {
    const r = tall ? 175 : 140;
    const cx = px + photoSize - r * 0.55;
    const cy = py + photoSize - r * 0.45;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 40;
    ctx.fillStyle = t.badge;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = t.badgeText;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    if (data.old) {
      ctx.font = `600 ${Math.round(r * 0.22)}px ${FONT}`;
      const oldText = `Antes S/ ${data.old}`;
      ctx.globalAlpha = 0.75;
      ctx.fillText(oldText, cx, cy - r * 0.42);
      const ow = ctx.measureText(oldText).width;
      ctx.fillRect(cx - ow / 2, cy - r * 0.42 - r * 0.08, ow, 4);
      ctx.globalAlpha = 1;
    }
    ctx.font = `800 ${Math.round(r * 0.3)}px ${FONT}`;
    ctx.fillText('S/', cx, cy - r * 0.08);
    let size = Math.round(r * 0.62);
    ctx.font = `900 ${size}px ${FONT}`;
    while (ctx.measureText(data.price).width > r * 1.6 && size > 30) {
      size -= 4;
      ctx.font = `900 ${size}px ${FONT}`;
    }
    ctx.fillText(data.price, cx, cy + r * 0.55);
  }

  // Nombre del producto y texto.
  ctx.textAlign = tall ? 'center' : 'left';
  ctx.textBaseline = 'top';
  const tx = tall ? W / 2 : px + photoSize + 60;
  let ty = tall ? py + photoSize + 70 : py + 10;
  ctx.fillStyle = t.text;
  ctx.font = `900 ${tall ? 92 : 64}px ${FONT}`;
  for (const line of nameLines) {
    ctx.fillText(line, tx, ty);
    ty += tall ? 104 : 74;
  }
  if (textLines.length) {
    ty += tall ? 14 : 10;
    ctx.fillStyle = t.sub;
    ctx.font = `500 ${tall ? 50 : 38}px ${FONT}`;
    for (const line of textLines) {
      ctx.fillText(line, tx, ty);
      ty += tall ? 62 : 48;
    }
  }

  // Pie: teléfono y tienda.
  if (data.footer) {
    ctx.font = `700 ${tall ? 46 : 36}px ${FONT}`;
    const fw = Math.min(W - 100, ctx.measureText(data.footer).width + 90);
    const fh = tall ? 100 : 80;
    const fy = H - fh - (tall ? 70 : 44);
    ctx.fillStyle = t.light ? '#0f172a' : 'rgba(0,0,0,0.35)';
    roundRect(ctx, (W - fw) / 2, fy, fw, fh, fh / 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(wrapLines(ctx, data.footer, fw - 60, 1)[0] || '', W / 2, fy + fh / 2 + 2);
  }
}

function renderFlyer() {
  drawFlyer($('fly-canvas'));
}

async function openFlyer() {
  if (state.locked || passwordMode) return;
  closeCoffee();
  flyer.profiles = await api.ticketProfiles();
  const select = $('fly-profile');
  select.replaceChildren(new Option('Sin logo', ''), ...flyer.profiles.map((p) => new Option(p.name, p.id)));
  if (!flyer.open && flyer.profiles[0] && !select.dataset.touched) {
    select.value = flyer.profiles[0].id;
    await applyFlyerProfile();
  }
  for (const s of document.querySelectorAll('.fly-swatch')) s.classList.toggle('on', s.dataset.theme === flyer.theme);
  $('flyer-modal').hidden = false;
  if (!flyer.open) api.setOverlay(true);
  flyer.open = true;
  $('fly-status').textContent = '';
  renderFlyer();
  $('fly-name').focus();
}

async function applyFlyerProfile() {
  const profile = flyer.profiles.find((p) => p.id === $('fly-profile').value);
  flyer.logo = profile ? await loadImg(profile.logoUrl) : null;
  if (profile && !$('fly-footer').dataset.touched) {
    $('fly-footer').value = [profile.phone && `📲 ${profile.phone}`, profile.website].filter(Boolean).join('  ·  ');
  }
  renderFlyer();
}

function closeFlyer() {
  if (!flyer.open) return;
  flyer.open = false;
  $('flyer-modal').hidden = true;
  api.setOverlay(false);
}

function flyerPng() {
  const canvas = document.createElement('canvas');
  drawFlyer(canvas);
  return canvas.toDataURL('image/png');
}

// Botones de plantilla y tamaño.
$('fly-themes').replaceChildren(...Object.entries(FLYER_THEMES).map(([key, t]) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'fly-swatch';
  b.dataset.theme = key;
  b.title = t.name;
  b.style.background = `linear-gradient(135deg, ${t.bg.join(', ')})`;
  b.addEventListener('click', () => {
    flyer.theme = key;
    for (const s of document.querySelectorAll('.fly-swatch')) s.classList.toggle('on', s.dataset.theme === key);
    renderFlyer();
  });
  b.classList.toggle('on', key === flyer.theme);
  return b;
}));
for (const b of document.querySelectorAll('#fly-sizes button')) {
  b.addEventListener('click', () => {
    flyer.size = b.dataset.size;
    for (const o of document.querySelectorAll('#fly-sizes button')) o.classList.toggle('on', o === b);
    renderFlyer();
  });
}

for (const id of ['fly-tag', 'fly-name', 'fly-price', 'fly-old', 'fly-text', 'fly-footer']) $(id).addEventListener('input', renderFlyer);
$('fly-footer').addEventListener('input', () => { $('fly-footer').dataset.touched = '1'; });
$('fly-profile').addEventListener('change', () => {
  $('fly-profile').dataset.touched = '1';
  applyFlyerProfile();
});
$('fly-photo').addEventListener('click', async () => {
  const url = await api.pickFlyerImage();
  if (!url) return;
  flyer.photo = await loadImg(url);
  $('fly-photo').textContent = '📷 Cambiar foto';
  renderFlyer();
});
$('fly-paste').addEventListener('click', async () => {
  const result = await api.pasteFlyer(flyerPng());
  if (!result.ok) return;
  if (result.copied) {
    $('fly-status').textContent = '✓ Imagen copiada: pégala con Ctrl+V donde quieras.';
    return;
  }
  closeFlyer();
});
$('fly-save').addEventListener('click', async () => {
  const result = await api.saveFlyer(flyerPng());
  if (result.ok) $('fly-status').textContent = '✓ Imagen guardada. Súbela a tus estados desde el celular o WhatsApp Web.';
});
$('fly-close').addEventListener('click', closeFlyer);
$('flyer-modal').addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeFlyer();
});
api.onFlyer(openFlyer);
