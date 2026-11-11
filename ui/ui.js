'use strict';

const api = window.multichat;
const $ = (id) => document.getElementById(id);
const tabsEl = $('tabs');
const emptyEl = $('empty');
const servicesEl = $('services');
const tileHeadsEl = $('tile-heads');

const SERVICES = [
  ['whatsapp', 'WhatsApp', '#25D366'],
  ['telegram', 'Telegram', '#2AABEE'],
  ['messenger', 'Messenger', '#0866FF'],
  ['instagram', 'Instagram', '#E1306C'],
  ['metabusiness', 'Meta Business Suite', '#0081FB'],
  ['discord', 'Discord', '#5865F2'],
  ['slack', 'Slack', '#4A154B'],
];

// Íconos simples (blancos) de cada app, para las pestañas y la pantalla de inicio.
const SERVICE_GLYPHS = {
  whatsapp: '<svg viewBox="0 0 24 24"><path d="M12 2.2a9.7 9.7 0 0 0-8.4 14.6L2.3 21.7l5-1.3A9.7 9.7 0 1 0 12 2.2zm0 17.7a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 19.9zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8 1c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11.2 11.2 0 0 0 4.3 3.8c1.6.7 2.2.7 3 .6a2.6 2.6 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .2-1.2c-.1-.2-.2-.2-.5-.4z"/></svg>',
  telegram: '<svg viewBox="0 0 24 24"><path d="M21.4 4.1 2.9 11.2c-1.3.5-1.2 1.2-.2 1.5l4.7 1.5 1.8 5.6c.2.6.4.8.8.8s.6-.2 1-.5l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.7-.8l3.1-14.7c.3-1.3-.5-1.9-1.5-1.3zM9.8 14.6l-.4 3.9-1.6-5 9.9-6.2-7.9 7.3z"/></svg>',
  messenger: '<svg viewBox="0 0 24 24"><path d="M12 2.2C6.5 2.2 2.2 6.2 2.2 11.6c0 2.8 1.2 5.3 3.1 7v3.2l3-1.7c1.1.3 2.3.5 3.7.5 5.5 0 9.8-4 9.8-9S17.5 2.2 12 2.2zm1 12.2-2.5-2.7-4.9 2.7 5.4-5.7 2.6 2.7 4.8-2.7z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24"><path d="M12 7.3a4.7 4.7 0 1 0 0 9.4 4.7 4.7 0 0 0 0-9.4zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm4.9-8.9a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2zM20 4a5.4 5.4 0 0 0-3.9-1.8C14.9 2 9.1 2 7.9 2.2A5.4 5.4 0 0 0 4 4a5.4 5.4 0 0 0-1.8 3.9C2 9.1 2 14.9 2.2 16.1A5.4 5.4 0 0 0 4 20a5.4 5.4 0 0 0 3.9 1.8c1.2.1 7 .1 8.2 0A5.4 5.4 0 0 0 20 20a5.4 5.4 0 0 0 1.8-3.9c.1-1.2.1-7 0-8.2A5.4 5.4 0 0 0 20 4zm-1.8 13.9a3.2 3.2 0 0 1-1.8 1.8c-1.3.5-4.3.4-4.4.4s-3.1.1-4.4-.4a3.2 3.2 0 0 1-1.8-1.8C5.3 16.6 5.4 13.6 5.4 12s-.1-4.6.4-5.9a3.2 3.2 0 0 1 1.8-1.8C8.9 3.8 11.9 3.9 12 3.9s3.1-.1 4.4.4a3.2 3.2 0 0 1 1.8 1.8c.5 1.3.4 4.3.4 5.9s.1 4.6-.4 5.9z"/></svg>',
  metabusiness: '<svg viewBox="0 0 24 24"><path d="M17.3 6.3c-2 0-3.5 1.6-5.3 4.2-1.8-2.6-3.3-4.2-5.3-4.2C3.9 6.3 2 9.3 2 12.6 2 15.4 3.4 17.7 6 17.7c2 0 3.3-1.4 6-5.6 2.7 4.2 4 5.6 6 5.6 2.6 0 4-2.3 4-5.1 0-3.3-1.9-6.3-4.7-6.3zM6.1 15.8c-1.4 0-2.1-1.3-2.1-3.2 0-2.4 1.2-4.4 2.6-4.4 1.2 0 2.2 1.2 4.3 4.3-1.9 2.8-3.4 3.3-4.8 3.3zm11.8 0c-1.4 0-2.9-.5-4.8-3.3 2.1-3.1 3.1-4.3 4.3-4.3 1.4 0 2.6 2 2.6 4.4 0 1.9-.7 3.2-2.1 3.2z"/></svg>',
  discord: '<svg viewBox="0 0 24 24"><path d="M19.3 5.3A16.4 16.4 0 0 0 15.2 4l-.5 1a15.2 15.2 0 0 0-5.4 0l-.5-1a16.4 16.4 0 0 0-4.1 1.3A17 17 0 0 0 2 16.8a16.6 16.6 0 0 0 5 2.5l1.1-1.7a10.6 10.6 0 0 1-1.7-.8l.4-.3a11.8 11.8 0 0 0 10.4 0l.4.3a10.6 10.6 0 0 1-1.7.8l1.1 1.7a16.6 16.6 0 0 0 5-2.5 17 17 0 0 0-2.7-11.5zM8.9 14.5c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2zm6.2 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2z"/></svg>',
  slack: '<svg viewBox="0 0 24 24"><path d="M6.2 14.4a2 2 0 1 1-2-2h2zm1 0a2 2 0 0 1 4 0v5a2 2 0 1 1-4 0zm2-8.2a2 2 0 1 1 2-2v2zm0 1a2 2 0 0 1 0 4h-5a2 2 0 1 1 0-4zm8.2 2a2 2 0 1 1 2 2h-2zm-1 0a2 2 0 0 1-4 0v-5a2 2 0 1 1 4 0zm-2 8.2a2 2 0 1 1-2 2v-2zm0-1a2 2 0 0 1 0-4h5a2 2 0 1 1 0 4z"/></svg>',
};

let state = { accounts: [], activeId: null, total: 0, tiles: [], locked: false };
let renamingId = null;
let renameDraft = null;
let draggedId = null;
let lastBadge = -1;
let wasLocked = null;

// ---------- Pestañas ----------

function dotFor(acc) {
  return serviceDot(acc.service, acc.serviceName, acc.color);
}

// Cuadradito de color con el ícono de la app (o su inicial si no hay ícono).
function serviceDot(service, name, color) {
  const dot = document.createElement('span');
  dot.className = 'dot';
  dot.style.setProperty('--svc', color);
  if (service === 'instagram') dot.style.background = 'linear-gradient(45deg, #f9a825, #e1306c 50%, #833ab4)';
  if (SERVICE_GLYPHS[service]) dot.innerHTML = SERVICE_GLYPHS[service];
  else dot.textContent = (name || '?')[0];
  return dot;
}

// Semáforo de respuesta: cuánto lleva esperando el cliente. Verde < 5 min, amarillo, rojo desde el límite.
function waitLevel(since) {
  const min = (Date.now() - since) / 60000;
  const limit = state.replyAlertMinutes || 10;
  return { min, level: min >= limit ? 'red' : min >= limit / 2 ? 'yellow' : 'green' };
}

function waitText(min) {
  if (min < 1) return 'ahora';
  if (min < 60) return `${Math.floor(min)} min`;
  return `${Math.floor(min / 60)} h`;
}

function waitChip(since) {
  const { min, level } = waitLevel(since);
  const chip = document.createElement('span');
  chip.className = `wait wait-${level}`;
  chip.dataset.since = since;
  chip.textContent = waitText(min);
  chip.title = 'Tiempo que lleva esperando respuesta';
  return chip;
}

// Actualiza los tiempos cada 20 segundos sin redibujar las pestañas.
setInterval(() => {
  for (const chip of document.querySelectorAll('.wait')) {
    const { min, level } = waitLevel(Number(chip.dataset.since));
    chip.textContent = waitText(min);
    chip.className = `wait wait-${level}`;
  }
}, 20000);

function badgeFor(acc) {
  const badge = document.createElement('span');
  badge.className = 'badge';
  badge.classList.toggle('muted', acc.muted);
  badge.textContent = acc.unread > 99 ? '99+' : acc.unread;
  return badge;
}

function renameInput(acc) {
  const input = document.createElement('input');
  input.className = 'rename';
  const firstTime = renameDraft === null;
  input.value = firstTime ? acc.name : renameDraft;
  input.addEventListener('input', () => { renameDraft = input.value; });
  const finish = (save) => {
    if (renamingId !== acc.id) return;
    renamingId = null;
    renameDraft = null;
    if (save) api.rename(acc.id, input.value);
    else render();
  };
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') finish(true);
    if (e.key === 'Escape') finish(false);
  });
  input.addEventListener('blur', () => finish(true));
  requestAnimationFrame(() => {
    input.focus();
    if (firstTime) input.select();
  });
  return input;
}

function renderTab(acc) {
  const tab = document.createElement('button');
  tab.className = 'tab';
  tab.style.setProperty('--svc', acc.color);
  tab.classList.toggle('active', acc.id === state.activeId);
  tab.classList.toggle('suspended', !acc.loaded);
  tab.title = `${acc.name} · ${acc.serviceName}${acc.loaded ? '' : ' (suspendida)'}`;
  if (acc.tag) {
    tab.classList.add('tagged');
    tab.style.setProperty('--tag', acc.tag);
  }
  tab.draggable = renamingId !== acc.id;
  tab.dataset.id = acc.id;

  tab.append(dotFor(acc));
  if (renamingId === acc.id) {
    tab.append(renameInput(acc));
  } else {
    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = acc.name;
    tab.append(label);
  }
  if (acc.unread) tab.append(badgeFor(acc));
  if (acc.unread && acc.waitingSince && !acc.muted) tab.append(waitChip(acc.waitingSince));
  if (acc.waitingData && acc.waitingData.length) {
    const chip = Object.assign(document.createElement('span'), { className: 'ship-chip', textContent: `📦${acc.waitingData.length > 1 ? acc.waitingData.length : ''}` });
    chip.title = `Esperando datos de envío: ${acc.waitingData.map((w) => `${w.chat} (${w.carrier}${w.stage === 'confirmar' ? ', por confirmar' : ''})`).join(' · ')}`;
    tab.append(chip);
  }

  const close = document.createElement('span');
  close.className = 'close';
  close.title = 'Cerrar pestaña (Ctrl+W)';
  close.innerHTML = '<svg viewBox="0 0 12 12"><path d="M2 2l8 8M10 2l-8 8"/></svg>';
  close.addEventListener('click', (e) => {
    e.stopPropagation();
    api.closeTab(acc.id);
  });
  tab.append(close);

  tab.addEventListener('click', () => {
    if (renamingId !== acc.id) api.select(acc.id);
  });
  tab.addEventListener('auxclick', (e) => {
    if (e.button === 1) api.closeTab(acc.id); // clic con la rueda del mouse
  });
  tab.addEventListener('dblclick', (e) => {
    if (!e.target.closest('.close')) startRename(acc.id);
  });
  tab.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    api.tabMenu(acc.id);
  });

  tab.addEventListener('dragstart', (e) => {
    draggedId = acc.id;
    tab.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });
  tab.addEventListener('dragend', () => {
    draggedId = null;
    tab.classList.remove('dragging');
  });
  tab.addEventListener('dragover', (e) => {
    if (!draggedId || draggedId === acc.id) return;
    e.preventDefault();
    const dragged = tabsEl.querySelector(`[data-id="${draggedId}"]`);
    const { left, width } = tab.getBoundingClientRect();
    tab.parentNode.insertBefore(dragged, e.clientX < left + width / 2 ? tab : tab.nextSibling);
  });
  tab.addEventListener('drop', (e) => {
    e.preventDefault();
    api.reorder([...tabsEl.children].map((el) => el.dataset.id));
  });

  return tab;
}

function startRename(id) {
  renamingId = id;
  renameDraft = null;
  render();
}

// En la vista de cuadrícula, cada cuenta lleva arriba su nombre y sus no leídos.
function renderTileHeads() {
  const byId = new Map(state.accounts.map((a) => [a.id, a]));
  tileHeadsEl.replaceChildren(...state.tiles.map((tile) => {
    const acc = byId.get(tile.id);
    const head = document.createElement('div');
    head.className = 'tile-head';
    if (acc) head.style.setProperty('--svc', acc.color);
    head.classList.toggle('active', tile.id === state.activeId);
    if (acc && acc.tag) {
      head.classList.add('tagged');
      head.style.setProperty('--tag', acc.tag);
    }
    head.style.left = `${tile.x}px`;
    head.style.top = `${tile.y}px`;
    head.style.width = `${tile.width}px`;
    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = acc ? acc.name : '';
    head.append(acc ? dotFor(acc) : '', label);
    if (acc && acc.unread) head.append(badgeFor(acc));
    head.addEventListener('click', () => api.select(tile.id));
    head.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      api.tabMenu(tile.id);
    });
    return head;
  }));
}

// Ancho de las pestañas según el espacio libre de la barra: normal (190 px) si entran todas; si no, más angostas,
// y con muchas, solo el ícono con su contador (el nombre se ve al pasar el mouse).
function fitTabs() {
  const n = tabsEl.children.length;
  const bar = document.querySelector('.bar');
  const measure = () => {
    const others = [...bar.children].filter((el) => el !== tabsEl && !el.classList.contains('spacer'))
      .reduce((sum, el) => sum + el.offsetWidth + 6, 0);
    return Math.floor((bar.clientWidth - others - 30 - 6 * (n - 1)) / Math.max(n, 1));
  };
  // En ventanas angostas el logo queda sin el texto "MultiChat PRO" para dar lugar a las pestañas.
  bar.classList.remove('bar-tight');
  if (!n) return;
  if (measure() < 60) bar.classList.add('bar-tight');
  const width = Math.max(40, Math.min(190, measure()));
  tabsEl.style.setProperty('--tab-w', `${width}px`);
  tabsEl.classList.toggle('tabs-mid', width < 130);
  tabsEl.classList.toggle('tabs-mini', width < 92);
}
window.addEventListener('resize', fitTabs);

let lastActiveId = null;

function applyLook() {
  const [a, b] = ACCENT_COLORS[state.accent] || ACCENT_COLORS.violeta;
  document.documentElement.style.setProperty('--acc1', a);
  document.documentElement.style.setProperty('--acc2', b);
  document.body.classList.toggle('no-anim', state.animations === false);
}

function render() {
  applyLook();
  tabsEl.replaceChildren(...state.accounts.map(renderTab));
  // Animación al cambiar de pestaña (solo cuando cambia, no en cada actualización).
  if (state.activeId !== lastActiveId) {
    tabsEl.querySelector('.tab.active')?.classList.add('just-active');
    lastActiveId = state.activeId;
  }
  fitTabs();
  emptyEl.hidden = state.accounts.length > 0;
  tabsEl.querySelector('.tab.active')?.scrollIntoView({ inline: 'nearest' });
  renderTileHeads();

  const grid = state.layout === 'grid';
  $('layout-grid').hidden = grid;
  $('layout-single').hidden = !grid;
  $('layout').title = grid ? 'Ver una cuenta a la vez (Ctrl+G)' : 'Ver varias cuentas a la vez (Ctrl+G)';
  $('lock-btn').hidden = !state.hasPassword;
  $('theme-moon').hidden = state.dark;
  $('theme-sun').hidden = !state.dark;
  $('theme').title = state.dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
  $('reminder-count').hidden = !state.reminderCount;
  $('reminder-count').textContent = state.reminderCount;

  for (const el of document.querySelectorAll('.js-version')) el.textContent = `v${state.version}`;
  for (const el of document.querySelectorAll('.js-creator')) el.textContent = state.creator;

  renderLock();
  updateTaskbarBadge(state.total);
}

// Ícono con el número de no leídos para la barra de tareas de Windows.
function updateTaskbarBadge(count) {
  if (count === lastBadge) return;
  lastBadge = count;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 32;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#e53935';
  ctx.beginPath();
  ctx.arc(16, 16, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${count > 9 ? 16 : 20}px Segoe UI, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(count > 99 ? '99+' : String(count), 16, 17);
  api.setBadgeIcon(canvas.toDataURL(), count);
}

// ---------- Pantalla de bloqueo ----------

function showUnlockForm() {
  $('reset-form').hidden = true;
  $('unlock-form').hidden = false;
  $('unlock-error').textContent = '';
  $('unlock-pw').value = '';
  $('unlock-pw').focus();
}

function renderLock() {
  if (state.locked === wasLocked) return;
  wasLocked = state.locked;
  $('lock').hidden = !state.locked;
  if (state.locked) {
    closePasswordDialog();
    closeTemplatesDialog();
    closeSalesList();
    closeSalePanel();
    closeReminderDialog();
    closeShipments();
    closeUrlDialog();
    closeCoffee();
    closeTicketPanel();
    closeProfiles();
    closeForms();
    showUnlockForm();
  }
}

async function withBusy(form, task) {
  const submit = form.querySelector('button[type="submit"]');
  submit.disabled = true;
  try {
    await task();
  } finally {
    submit.disabled = false;
  }
}

$('unlock-form').addEventListener('submit', (e) => {
  e.preventDefault();
  withBusy(e.target, async () => {
    const ok = await api.unlock($('unlock-pw').value);
    if (!ok) {
      $('unlock-error').textContent = 'Contraseña incorrecta.';
      $('unlock-pw').select();
    }
  });
});

$('forgot').addEventListener('click', () => {
  $('unlock-form').hidden = true;
  $('reset-form').hidden = false;
  $('reset-question').textContent = state.securityQuestion || '';
  for (const id of ['reset-answer', 'reset-pw', 'reset-pw2']) $(id).value = '';
  $('reset-error').textContent = '';
  $('reset-answer').focus();
});

$('back-unlock').addEventListener('click', showUnlockForm);

$('reset-form').addEventListener('submit', (e) => {
  e.preventDefault();
  if ($('reset-pw').value !== $('reset-pw2').value) {
    $('reset-error').textContent = 'Las contraseñas nuevas no coinciden.';
    return;
  }
  withBusy(e.target, async () => {
    const result = await api.resetPassword($('reset-answer').value, $('reset-pw').value);
    if (!result.ok) $('reset-error').textContent = result.error;
  });
});

// ---------- Poner / cambiar / quitar contraseña ----------

const PASSWORD_DIALOG = {
  setup: { title: 'Poner contraseña', submit: 'Guardar' },
  change: { title: 'Cambiar contraseña', submit: 'Cambiar' },
  remove: { title: 'Quitar contraseña', submit: 'Quitar contraseña' },
};
let passwordMode = null;

function openPasswordDialog(mode) {
  closeCoffee();
  if (templatesOpen) closeTemplatesDialog();
  closeSalesList();
  closeShipments();
  closeReminderDialog();
  passwordMode = mode;
  $('pw-title').textContent = PASSWORD_DIALOG[mode].title;
  $('pw-submit').textContent = PASSWORD_DIALOG[mode].submit;
  for (const el of document.querySelectorAll('#pw-form [data-show]')) {
    el.hidden = !el.dataset.show.split(' ').includes(mode);
  }
  for (const input of document.querySelectorAll('#pw-form input')) input.value = '';
  $('pw-question').selectedIndex = 0;
  $('pw-custom-label').hidden = true;
  $('pw-error').textContent = '';
  $('pw-modal').hidden = false;
  api.setOverlay(true);
  $('pw-form').querySelector('label:not([hidden]) input').focus();
}

function closePasswordDialog() {
  if (!passwordMode) return;
  passwordMode = null;
  $('pw-modal').hidden = true;
  api.setOverlay(false);
}

$('pw-question').addEventListener('change', () => {
  $('pw-custom-label').hidden = $('pw-question').value !== 'custom';
});

$('pw-cancel').addEventListener('click', closePasswordDialog);

$('pw-modal').addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closePasswordDialog();
});

$('pw-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const mode = passwordMode;
  if (mode !== 'remove' && $('pw-new').value !== $('pw-new2').value) {
    $('pw-error').textContent = 'Las contraseñas no coinciden.';
    return;
  }
  const question = $('pw-question').value === 'custom' ? $('pw-custom').value : $('pw-question').value;
  withBusy(e.target, async () => {
    const result = await api.savePassword({
      mode,
      current: $('pw-current').value,
      password: $('pw-new').value,
      question,
      answer: $('pw-answer').value,
    });
    if (result.ok) closePasswordDialog();
    else $('pw-error').textContent = result.error;
  });
});

// ---------- Respuestas rápidas ----------

let templatesOpen = false;

function templateImage(row, img) {
  const box = document.createElement('div');
  box.className = 'tpl-img';
  box.dataset.name = img.name;
  const pic = document.createElement('img');
  pic.src = img.thumb;
  pic.alt = '';
  const remove = document.createElement('button');
  remove.type = 'button';
  remove.title = 'Quitar foto';
  remove.textContent = '✕';
  remove.addEventListener('click', () => box.remove());
  box.append(pic, remove);
  row.querySelector('.tpl-add-img').before(box);
}

function templateRow(t = { id: '', title: '', text: '', images: [] }) {
  const row = document.createElement('div');
  row.className = 'tpl-row';
  row.dataset.id = t.id;
  const title = document.createElement('input');
  title.className = 'tpl-title';
  title.placeholder = 'Nombre (ej.: Saludo, Precios, Horario)';
  title.maxLength = 40;
  title.value = t.title;
  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'tpl-del';
  del.title = 'Eliminar';
  del.textContent = '✕';
  del.addEventListener('click', () => {
    row.remove();
    updateTemplatesEmpty();
  });
  const text = document.createElement('textarea');
  text.className = 'tpl-text';
  text.placeholder = 'Texto de la respuesta';
  text.maxLength = 2000;
  text.value = t.text;
  const images = document.createElement('div');
  images.className = 'tpl-images';
  const add = document.createElement('button');
  add.type = 'button';
  add.className = 'tpl-add-img';
  add.textContent = '📷 Agregar foto';
  add.addEventListener('click', async () => {
    for (const img of await api.pickTemplateImages()) templateImage(row, img);
  });
  images.append(add);
  row.append(title, del, text, images);
  for (const img of t.images || []) templateImage(row, img);
  return row;
}

function updateTemplatesEmpty() {
  const list = $('tpl-list');
  list.querySelector('.tpl-empty')?.remove();
  if (!list.querySelector('.tpl-row')) {
    const empty = document.createElement('p');
    empty.className = 'tpl-empty';
    empty.textContent = 'Todavía no tienes respuestas rápidas.';
    list.append(empty);
  }
}

async function openTemplatesDialog() {
  if (templatesOpen || passwordMode || state.locked) return;
  closeCoffee();
  closeSalesList();
  closeShipments();
  closeReminderDialog();
  templatesOpen = true;
  const templates = await api.getTemplates();
  $('tpl-list').replaceChildren(...templates.map(templateRow));
  updateTemplatesEmpty();
  $('tpl-error').textContent = '';
  $('tpl-modal').hidden = false;
  api.setOverlay(true);
}

function closeTemplatesDialog() {
  if (!templatesOpen) return;
  templatesOpen = false;
  $('tpl-modal').hidden = true;
  api.setOverlay(false);
}

$('tpl-add').addEventListener('click', () => {
  const row = templateRow();
  $('tpl-list').append(row);
  updateTemplatesEmpty();
  row.querySelector('input').focus();
});

$('tpl-cancel').addEventListener('click', closeTemplatesDialog);

$('tpl-modal').addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeTemplatesDialog();
});

$('tpl-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const list = [...document.querySelectorAll('#tpl-list .tpl-row')].map((row) => ({
    id: row.dataset.id,
    title: row.querySelector('.tpl-title').value,
    text: row.querySelector('.tpl-text').value,
    images: [...row.querySelectorAll('.tpl-img')].map((el) => el.dataset.name),
  }));
  withBusy(e.target, async () => {
    const result = await api.saveTemplates(list);
    if (result.ok) closeTemplatesDialog();
    else $('tpl-error').textContent = result.error;
  });
});

// ---------- Ventas ----------

const PANEL_WIDTH = 400; // igual que .side-panel en ui.css
const SALE_FIELDS = [
  'customer', 'dni', 'phone', 'product', 'quantity', 'amount', 'payment', 'notes',
  'carrier', 'orderNumber', 'shipStatus', 'destination', 'shippingCost',
];
const FIELD_LABELS = {
  customer: 'nombre', dni: 'DNI', phone: 'celular', amount: 'monto', carrier: 'empresa de envío', destination: 'destino',
};
let salePanelOpen = false;
let editingSaleId = null;
let editingReceipt = '';
let reopenAfterEdit = 'sales'; // a qué lista volver después de editar una venta

function updateShipFields() {
  $('ship-detail').hidden = !$('sale-carrier').value;
}
$('sale-carrier').addEventListener('change', updateShipFields);
let salesListOpen = false;
let allSales = [];

const money = (n) => `S/ ${Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function toLocalInput(date) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function fillAccountSelect(select, selected, withAll) {
  const names = [...new Set(state.accounts.map((a) => a.name))];
  if (selected && !names.includes(selected)) names.push(selected);
  const options = names.map((name) => new Option(name, name, false, name === selected));
  if (withAll) options.unshift(new Option('Todas las cuentas', '', false, !selected));
  select.replaceChildren(...options);
}

function openSalePanel({ sale = null, accountId = null, prefill = {} } = {}) {
  if (state.locked) return;
  closeCoffee();
  closeTicketPanel();
  closeSalesList();
  closeShipments();
  closeTemplatesDialog();
  closeReminderDialog();
  editingSaleId = sale ? sale.id : null;
  editingReceipt = sale ? sale.receipt || '' : '';
  const accountName = sale ? sale.account
    : (state.accounts.find((a) => a.id === (accountId || state.activeId)) || {}).name || '';
  fillAccountSelect($('sale-account'), accountName, false);
  $('sale-date').value = toLocalInput(sale ? sale.date : new Date());
  const values = { ...(sale || { quantity: 1, payment: 'Efectivo', ...prefill }) };
  if (!values.shipStatus) values.shipStatus = 'Por enviar';
  if (!values.shippingCost) values.shippingCost = '';
  for (const field of SALE_FIELDS) {
    const el = $(`sale-${field}`);
    el.value = values[field] ?? (field === 'quantity' ? 1 : '');
    el.classList.toggle('auto', !sale && prefill[field] !== undefined);
  }
  updateShipFields();
  const detected = Object.keys(prefill).filter((k) => FIELD_LABELS[k]).map((k) => FIELD_LABELS[k]);
  $('sale-detected').hidden = sale || !detected.length;
  $('sale-detected').textContent = `Detectado en el mensaje: ${detected.join(', ')}. Revisa que esté bien.`;
  $('sale-title').textContent = sale ? 'Editar venta' : 'Registrar venta';
  $('sale-error').textContent = '';
  $('sale-panel').hidden = false;
  if (!salePanelOpen) api.setPanel(PANEL_WIDTH);
  salePanelOpen = true;
  const firstEmpty = ['sale-customer', 'sale-dni', 'sale-phone', 'sale-product'].find((id) => !$(id).value);
  $(firstEmpty || 'sale-product').focus();
}

function closeSalePanel() {
  if (!salePanelOpen) return;
  salePanelOpen = false;
  editingSaleId = null;
  $('sale-panel').hidden = true;
  api.setPanel(0);
}

$('sale-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const date = new Date($('sale-date').value);
  const sale = {
    id: editingSaleId,
    account: $('sale-account').value,
    date: Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString(),
  };
  for (const field of SALE_FIELDS) sale[field] = $(`sale-${field}`).value;
  sale.receipt = editingReceipt;
  withBusy(e.target, async () => {
    const result = await api.saveSale(sale);
    if (!result.ok) {
      $('sale-error').textContent = result.error;
      return;
    }
    const reopen = editingSaleId ? reopenAfterEdit : null;
    closeSalePanel();
    if (reopen === 'shipments') openShipments();
    else if (reopen) openSalesList();
  });
});

for (const id of ['sale-close', 'sale-cancel']) $(id).addEventListener('click', closeSalePanel);
$('sale-panel').addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeSalePanel();
});
for (const field of SALE_FIELDS) {
  $(`sale-${field}`).addEventListener('input', (e) => e.target.classList.remove('auto'));
}

function renderSales() {
  const query = $('sales-search').value.trim().toLowerCase();
  const account = $('sales-filter').value;
  const rows = allSales.filter((sale) => (!account || sale.account === account)
    && (!query || [sale.customer, sale.dni, sale.phone, sale.product, sale.notes].join(' ').toLowerCase().includes(query)));
  $('sales-body').replaceChildren(...rows.map((sale) => {
    const tr = document.createElement('tr');
    const cells = [
      new Date(sale.date).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }),
      sale.account, sale.customer, sale.dni, sale.phone,
      sale.quantity > 1 ? `${sale.quantity} × ${sale.product}` : sale.product,
      money(sale.amount), sale.payment,
    ];
    cells.forEach((value, i) => {
      const td = document.createElement('td');
      td.textContent = value;
      if (i === 2 || i === 5) td.className = 'wrap';
      if (i === 6) td.className = 'num';
      tr.append(td);
    });
    const del = document.createElement('button');
    del.textContent = 'Eliminar';
    del.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!confirm(`¿Eliminar la venta de ${sale.customer || sale.dni || sale.phone}?`)) return;
      await api.deleteSale(sale.id);
      allSales = await api.listSales();
      renderSales();
    });
    const td = document.createElement('td');
    td.append(del);
    tr.append(td);
    tr.addEventListener('click', () => {
      reopenAfterEdit = 'sales';
      openSalePanel({ sale });
    });
    return tr;
  }));
  $('sales-empty').hidden = rows.length > 0;
  const total = rows.reduce((sum, sale) => sum + sale.amount, 0);
  $('sales-total').textContent = `${rows.length} ${rows.length === 1 ? 'venta' : 'ventas'} · Total ${money(total)}`;
  renderSalesSummary(account ? allSales.filter((sale) => sale.account === account) : allSales);
}

// Resumen: hoy, semana, mes, ticket promedio, productos más vendidos y ventas por cuenta.
function renderSalesSummary(list) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfDay.getDate() - ((startOfDay.getDay() + 6) % 7)); // lunes
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const since = (from) => list.filter((sale) => new Date(sale.date) >= from);
  const sum = (rows) => rows.reduce((total, sale) => total + sale.amount, 0);
  const plural = (n) => `${n} ${n === 1 ? 'venta' : 'ventas'}`;
  const kpi = (label, value, sub) => {
    const el = document.createElement('div');
    el.className = 'kpi';
    for (const [cls, text] of [['k-label', label], ['k-value', value], ['k-sub', sub]]) {
      const div = document.createElement('div');
      div.className = cls;
      div.textContent = text;
      el.append(div);
    }
    return el;
  };
  const today = since(startOfDay);
  const week = since(startOfWeek);
  const month = since(startOfMonth);
  $('sales-kpis').replaceChildren(
    kpi('Hoy', money(sum(today)), plural(today.length)),
    kpi('Esta semana', money(sum(week)), plural(week.length)),
    kpi('Este mes', money(sum(month)), plural(month.length)),
    kpi('Ticket promedio', money(list.length ? sum(list) / list.length : 0), 'por venta'),
  );

  const ranking = (key) => {
    const totals = new Map();
    for (const sale of list) {
      const name = sale[key] || '—';
      totals.set(name, (totals.get(name) || 0) + sale.amount);
    }
    return [...totals].sort((a, b) => b[1] - a[1]).slice(0, 5);
  };
  const block = (title, rows) => {
    const box = document.createElement('div');
    const h3 = document.createElement('h3');
    h3.textContent = title;
    box.append(h3);
    const max = rows.length ? rows[0][1] || 1 : 1;
    for (const [name, value] of rows) {
      const row = document.createElement('div');
      row.className = 'bar-row';
      row.innerHTML = '<span class="name"></span><span class="val"></span><div class="track"><div class="fill"></div></div>';
      row.querySelector('.name').textContent = name;
      row.querySelector('.val').textContent = money(value);
      row.querySelector('.fill').style.width = `${Math.max(2, (value / max) * 100)}%`;
      box.append(row);
    }
    return box;
  };
  $('sales-insights').replaceChildren(
    block('Productos más vendidos', ranking('product')),
    block('Ventas por cuenta', ranking('account')),
  );
  $('sales-insights').hidden = list.length === 0;
}

async function openSalesList() {
  if (state.locked || passwordMode) return;
  closeCoffee();
  closeSalePanel();
  closeShipments();
  closeTemplatesDialog();
  closeReminderDialog();
  allSales = await api.listSales();
  const accounts = [...new Set([...state.accounts.map((a) => a.name), ...allSales.map((s) => s.account)])].filter(Boolean);
  $('sales-filter').replaceChildren(new Option('Todas las cuentas', ''), ...accounts.map((n) => new Option(n, n)));
  $('sales-search').value = '';
  renderSales();
  $('sales-modal').hidden = false;
  if (!salesListOpen) api.setOverlay(true);
  salesListOpen = true;
  $('sales-search').focus();
}

function closeSalesList() {
  if (!salesListOpen) return;
  salesListOpen = false;
  $('sales-modal').hidden = true;
  api.setOverlay(false);
}

$('sales-search').addEventListener('input', renderSales);
$('sales-filter').addEventListener('change', renderSales);
$('sales-close').addEventListener('click', closeSalesList);
$('sales-new').addEventListener('click', () => openSalePanel());
$('sales-export').addEventListener('click', () => api.exportSales());
$('sales-modal').addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeSalesList();
});

// ---------- Envíos pendientes ----------

let shipmentsOpen = false;
let shipments = [];

function shipButton(label, onClick, primary = false) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = primary ? 'act primary' : 'act';
  btn.textContent = label;
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    onClick(btn);
  });
  return btn;
}

function shipCell(...children) {
  const td = document.createElement('td');
  td.append(...children);
  return td;
}

function textWithSub(main, sub) {
  const frag = document.createDocumentFragment();
  frag.append(main || '—');
  if (sub) {
    const span = document.createElement('span');
    span.className = 'sub';
    span.textContent = sub;
    frag.append(span);
  }
  return frag;
}

function renderShipments() {
  const query = $('ship-search').value.trim().toLowerCase();
  const carrier = $('ship-filter').value;
  const rows = shipments.filter((sale) => (!carrier || sale.carrier === carrier)
    && (!query || [sale.customer, sale.dni, sale.phone, sale.orderNumber, sale.destination].join(' ').toLowerCase().includes(query)));

  $('ship-body').replaceChildren(...rows.map((sale) => {
    const tr = document.createElement('tr');
    const date = new Date(sale.date).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' });

    const order = document.createElement('input');
    order.className = 'inline';
    order.value = sale.orderNumber;
    order.placeholder = 'N° de orden';
    order.addEventListener('click', (e) => e.stopPropagation());
    order.addEventListener('change', async () => {
      const result = await api.updateShipment(sale.id, { orderNumber: order.value });
      if (result.ok) Object.assign(sale, result.sale);
    });

    const status = document.createElement('select');
    status.className = 'inline status-pill';
    for (const s of ['Por enviar', 'Enviado', 'En agencia', 'Entregado']) status.append(new Option(s, s, false, s === sale.shipStatus));
    status.dataset.s = sale.shipStatus;
    status.addEventListener('click', (e) => e.stopPropagation());
    status.addEventListener('change', async () => {
      await api.updateShipment(sale.id, { shipStatus: status.value });
      if (status.value === 'Entregado') {
        shipments = shipments.filter((s) => s.id !== sale.id);
        renderShipments();
      } else {
        sale.shipStatus = status.value;
        status.dataset.s = status.value;
      }
    });

    const receipt = document.createElement('div');
    const attach = async () => {
      const updated = await api.attachReceipt(sale.id);
      if (updated) {
        Object.assign(sale, updated);
        renderShipments();
      }
    };
    if (sale.receiptThumb) {
      const img = document.createElement('img');
      img.className = 'receipt-thumb';
      img.src = sale.receiptThumb;
      img.title = 'Cambiar foto de la boleta';
      img.addEventListener('click', (e) => {
        e.stopPropagation();
        attach();
      });
      receipt.append(img);
    } else {
      receipt.append(shipButton('📷 Adjuntar', attach));
    }

    const track = shipButton('Rastrear', async () => {
      const result = await api.trackShipment(sale.id);
      if (result.needUrl) openUrlDialog({ carrier: result.carrier, url: '', thenTrack: sale.id });
    });
    const send = shipButton('Enviar al cliente', async (btn) => {
      btn.disabled = true;
      closeShipments();
      const result = await api.sendShipment(sale.id);
      if (!result.ok) alert(result.error);
    }, true);
    const trackable = sale.carrier === 'Shalom' || sale.carrier === 'Olva';

    tr.append(
      shipCell(date),
      shipCell(textWithSub(sale.customer, [sale.dni && `DNI ${sale.dni}`, sale.phone].filter(Boolean).join(' · '))),
      shipCell(textWithSub(sale.carrier, sale.account)),
      shipCell(order),
      shipCell(sale.destination || '—'),
      shipCell(status),
      shipCell(receipt),
      shipCell(...(trackable ? [track, send] : [send])),
    );
    tr.children[4].className = 'wrap';
    tr.lastElementChild.className = 'ship-actions';
    tr.addEventListener('click', () => {
      reopenAfterEdit = 'shipments';
      closeShipments();
      openSalePanel({ sale });
    });
    return tr;
  }));
  $('ship-empty').hidden = rows.length > 0;
}

async function openShipments() {
  if (state.locked || passwordMode) return;
  closeCoffee();
  closeSalePanel();
  closeSalesList();
  closeTemplatesDialog();
  closeReminderDialog();
  shipments = await api.listShipments();
  renderShipments();
  $('ship-modal').hidden = false;
  if (!shipmentsOpen) api.setOverlay(true);
  shipmentsOpen = true;
}

function closeShipments() {
  if (!shipmentsOpen) return;
  shipmentsOpen = false;
  $('ship-modal').hidden = true;
  api.setOverlay(false);
}

$('ship-close').addEventListener('click', closeShipments);
$('ship-search').addEventListener('input', renderShipments);
$('ship-filter').addEventListener('change', renderShipments);
$('ship-modal').addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeShipments();
});

// ---------- Página de rastreo ----------

let urlDialog = null; // { carrier, thenTrack, reopenShipments }

function openUrlDialog({ carrier, url = '', thenTrack = null }) {
  if (state.locked) return;
  const reopenShipments = shipmentsOpen;
  closeShipments();
  urlDialog = { carrier, thenTrack, reopenShipments };
  $('url-title').textContent = `Página de rastreo de ${carrier}`;
  $('url-input').value = url || '';
  $('url-error').textContent = '';
  $('url-modal').hidden = false;
  api.setOverlay(true);
  $('url-input').focus();
}

function closeUrlDialog() {
  if (!urlDialog) return;
  const { reopenShipments } = urlDialog;
  urlDialog = null;
  $('url-modal').hidden = true;
  api.setOverlay(false);
  if (reopenShipments && !state.locked) openShipments();
}

$('url-cancel').addEventListener('click', closeUrlDialog);
$('url-modal').addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeUrlDialog();
});
$('url-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const { carrier, thenTrack } = urlDialog;
  withBusy(e.target, async () => {
    const result = await api.setTrackingUrl(carrier, $('url-input').value);
    if (!result.ok) {
      $('url-error').textContent = result.error;
      return;
    }
    closeUrlDialog();
    if (thenTrack) api.trackShipment(thenTrack);
  });
});

// ---------- Ticket de envío (ticketera) ----------

// En pantallas grandes: formulario + vista previa en tamaño real. En laptops: solo el formulario
// y la vista previa chica en la esquina (clic para agrandarla).
const TICKET_PANEL_WIDE = 700;
const TICKET_PANEL_COMPACT = 430;
const WIDE_SCREEN = 1500;
const TICKET_FIELDS = [
  'profileId', 'channel', 'name', 'dni', 'phone', 'destination', 'agent', 'address', 'district',
  'reference', 'reference2', 'note', 'orderNumber',
];
// Datos del remitente editables en cada ticket → campo del remitente del que se llenan.
const TICKET_SENDER_FIELDS = {
  origin: 'origin', sender: 'sender', senderAddress: 'address', email: 'email', website: 'website', storePhone: 'phone',
};
const TICKET_LABELS = {
  name: 'nombre', dni: 'DNI', phone: 'celular', destination: 'destino', agent: 'agencia', address: 'dirección',
  district: 'distrito', reference: 'referencia 1', reference2: 'referencia 2', note: 'nota',
};
let ticketPanelOpen = false;
let ticketPanelWidth = 0;

function layoutTicketPanel() {
  const width = window.innerWidth >= WIDE_SCREEN ? TICKET_PANEL_WIDE : TICKET_PANEL_COMPACT;
  const compact = width === TICKET_PANEL_COMPACT;
  $('ticket-panel').classList.toggle('compact', compact);
  $('ticket-panel').style.setProperty('--panel-w', `${width}px`);
  $('ticket-preview-label').textContent = compact ? 'Vista previa (clic para agrandar)' : 'Vista previa · 72 × 297 mm';
  if (!compact) $('ticket-preview-wrap').classList.remove('expanded');
  if (width !== ticketPanelWidth) {
    ticketPanelWidth = width;
    api.setPanel(width);
  }
}
let ticketCarrier = 'Shalom';
let ticketProfiles = [];

function ticketData() {
  const data = { carrier: ticketCarrier === 'Otra' ? $('ticket-carrierName').value.trim() : ticketCarrier };
  for (const field of TICKET_FIELDS) data[field] = $(`ticket-${field}`).value;
  for (const field of Object.keys(TICKET_SENDER_FIELDS)) data[field] = $(`ticket-${field}`).value;
  return data;
}


function fillSenderFields() {
  const profile = ticketProfiles.find((p) => p.id === $('ticket-profileId').value) || ticketProfiles[0] || {};
  for (const [field, key] of Object.entries(TICKET_SENDER_FIELDS)) $(`ticket-${field}`).value = profile[key] || '';
}

function updateTicketPreview() {
  const data = ticketData();
  const profile = ticketProfiles.find((p) => p.id === data.profileId) || ticketProfiles[0] || {};
  const root = window.renderTicket($('ticket-preview'), data, profile);
  $('ticket-fit').hidden = !root.dataset.fit;
}

// Shalom solo usa Destino ("Lima / Cañete / Mala / Mala") y Dirección (la de la agencia, con su referencia), como
// en sus tickets: los demás campos de destino se ocultan y quedan vacíos. Lo que tenían se pasa a esos dos campos.
const SHALOM_HIDDEN = ['agent', 'district', 'reference', 'reference2', 'note'];

function shapeForShalom() {
  const val = (id) => $(`ticket-${id}`).value.trim();
  const agent = val('agent');
  if (agent && !val('destination')) $('ticket-destination').value = agent;
  else if (agent && !val('address')) $('ticket-address').value = agent;
  const extras = [val('district'), val('reference') && `Referencia: ${val('reference')}`, val('reference2'), val('note')].filter(Boolean);
  if (extras.length) $('ticket-address').value = [val('address'), ...extras].filter(Boolean).join(' . ').slice(0, 220);
  for (const id of SHALOM_HIDDEN) $(`ticket-${id}`).value = '';
}

function setTicketCarrier(carrier) {
  ticketCarrier = ['Shalom', 'Olva', 'Otra'].includes(carrier) ? carrier : 'Shalom';
  for (const btn of document.querySelectorAll('#ticket-carrier button')) btn.classList.toggle('on', btn.dataset.carrier === ticketCarrier);
  $('ticket-carrierName-label').hidden = ticketCarrier !== 'Otra';
  const shalom = ticketCarrier === 'Shalom';
  if (shalom) shapeForShalom();
  for (const id of SHALOM_HIDDEN) $(`ticket-${id}`).closest('label').hidden = shalom;
  $('ticket-address').closest('label').firstChild.textContent = shalom ? 'Dirección de la agencia (con su referencia) ' : 'Dirección (de la agencia o de la casa) ';
  $('ticket-destination').closest('label').firstChild.textContent = shalom ? 'Destino ' : 'Destino (opcional) ';
  $('ticket-destination').placeholder = shalom ? 'Lima / Cañete / Mala / Mala' : 'LIMA / LIMA / SANTIAGO DE SURCO';
  updateTicketPreview();
  if (ticketCarrier === 'Otra' && ticketPanelOpen) $('ticket-carrierName').focus();
}

// Texto con los títulos en negrita de WhatsApp (*así*), para que el cliente confirme sus datos.
function ticketSummary() {
  const data = ticketData();
  const lines = ['*DATOS DE ENVÍO* 📦'];
  const add = (label, value) => {
    if (String(value || '').trim()) lines.push(`*${label}:* ${String(value).trim()}`);
  };
  add('Empresa de envío', data.carrier);
  add('Destinatario', data.name);
  add('DNI', data.dni);
  add('Celular', data.phone);
  add('Destino', data.destination);
  add('Agencia', data.agent);
  add(data.agent ? 'Dirección de la agencia' : 'Dirección', data.address);
  add('Distrito', data.district);
  add(data.reference2 ? 'Referencia 1' : 'Referencia', data.reference);
  add('Referencia 2', data.reference2);
  add('Nota', data.note);
  lines.push('', '¿Tus datos están correctos? ✅ Confírmanos para enviar tu pedido.');
  return lines.join('\n');
}

// Lista de impresoras: la ticketera elegida queda guardada para imprimir directo la próxima vez.
async function loadTicketPrinters() {
  const { printers, selected } = await api.ticketPrinters();
  const current = selected !== null ? selected : (printers.find((p) => p.isDefault) || {}).name || '';
  const options = printers.map((p) => new Option(`${p.label}${p.isDefault ? ' (predeterminada)' : ''}`, p.name, false, p.name === current));
  options.push(new Option('Elegir cada vez (mostrar el diálogo de Windows)', '', false, current === ''));
  $('ticket-printer').replaceChildren(...options);
}

const NEW_PROFILE = '__nuevo';
let profileBeforeNew = '';
let selectNewestProfile = false;

async function loadTicketProfiles(selected) {
  ticketProfiles = await api.ticketProfiles();
  let current = selected || $('ticket-profileId').value || (await api.lastTicketProfile());
  if (selectNewestProfile && ticketProfiles.length) current = ticketProfiles[ticketProfiles.length - 1].id;
  selectNewestProfile = false;
  $('ticket-profileId').replaceChildren(
    ...ticketProfiles.map((p) => new Option(p.name, p.id, false, p.id === current)),
    new Option('+ Agregar empresa…', NEW_PROFILE),
  );
  profileBeforeNew = $('ticket-profileId').value;
}

// Ticket abierto para corregir uno de "Impresiones de hoy": al imprimir, reemplaza a ese en el historial.
let editingPrint = null; // { id, at } o null

async function openTicketPanel({ accountId = null, channel = 'WhatsApp', prefill = {}, missing = [], editPrint = null } = {}) {
  if (state.locked || passwordMode) return;
  closeCoffee();
  closeSalesList();
  closeShipments();
  closeTemplatesDialog();
  closeReminderDialog();
  closeSalePanel();
  editingPrint = editPrint;
  await Promise.all([loadTicketProfiles(prefill.profileId || undefined), loadTicketPrinters()]);
  fillSenderFields();
  for (const field of TICKET_FIELDS.filter((f) => f !== 'profileId')) {
    const el = $(`ticket-${field}`);
    el.value = prefill[field] || '';
    el.classList.toggle('auto', Boolean(prefill[field]) && !editPrint);
  }
  // Al corregir un ticket ya impreso se respetan también los datos del remitente que tenía.
  if (editPrint) for (const field of Object.keys(TICKET_SENDER_FIELDS)) if (typeof prefill[field] === 'string') $(`ticket-${field}`).value = prefill[field];
  $('ticket-channel').value = channel;
  const detected = Object.keys(prefill).filter((k) => TICKET_LABELS[k] && prefill[k]).map((k) => TICKET_LABELS[k]);
  $('ticket-detected').hidden = !detected.length && !missing.length && !editPrint;
  $('ticket-detected').textContent = editPrint
    ? `✏️ Corrigiendo el ticket de las ${hhmm(editPrint.at)}: al imprimir (o guardar PDF) reemplaza al anterior en "Impresiones de hoy".`
    : `Detectado en el mensaje: ${detected.join(', ')}. Revisa que esté bien.`
      + (missing.length ? ` ⚠ Falta: ${missing.join(', ')}.` : '');
  $('ticket-detected').classList.toggle('has-missing', missing.length > 0);
  $('ticket-error').textContent = '';
  if (prefill.carrier && !['Shalom', 'Olva'].includes(prefill.carrier)) {
    $('ticket-carrierName').value = prefill.carrier;
    setTicketCarrier('Otra');
  } else {
    setTicketCarrier(prefill.carrier || ticketCarrier);
  }
  $('ticket-panel').hidden = false;
  $('ticket-preview-wrap').classList.remove('expanded');
  ticketPanelOpen = true;
  layoutTicketPanel();
  $(['ticket-name', 'ticket-phone', 'ticket-destination'].find((id) => !$(id).value) || 'ticket-orderNumber').focus();
}

function closeTicketPanel() {
  if (!ticketPanelOpen) return;
  ticketPanelOpen = false;
  ticketPanelWidth = 0;
  $('ticket-panel').hidden = true;
  api.setPanel(0);
}

async function submitTicket(pdf) {
  const form = $('ticket-form');
  await withBusy(form, async () => {
    $('ticket-error').textContent = '';
    const result = await api.printTicket(ticketData(), { pdf, printer: $('ticket-printer').value, editId: editingPrint ? editingPrint.id : '' });
    if (result.ok) closeTicketPanel();
    else if (!result.canceled) $('ticket-error').textContent = result.error || 'No se pudo imprimir.';
  });
}

for (const btn of document.querySelectorAll('#ticket-carrier button')) {
  btn.addEventListener('click', () => setTicketCarrier(btn.dataset.carrier));
}
$('ticket-form').addEventListener('input', (e) => {
  e.target.classList.remove('auto');
  updateTicketPreview();
});
$('ticket-form').addEventListener('change', (e) => {
  if (e.target.id === 'ticket-profileId' && e.target.value === NEW_PROFILE) {
    // "+ Agregar empresa…": se abre la ventana de remitentes con una fila nueva.
    e.target.value = profileBeforeNew;
    openProfiles({ addNew: true });
    return;
  }
  if (e.target.id === 'ticket-profileId') {
    profileBeforeNew = e.target.value;
    fillSenderFields();
  }
  updateTicketPreview();
});
$('ticket-form').addEventListener('submit', (e) => {
  e.preventDefault();
  submitTicket(false);
});
$('ticket-pdf').addEventListener('click', () => submitTicket(true));
$('ticket-to-chat').addEventListener('click', async () => {
  const result = await api.ticketToChat(ticketSummary());
  $('ticket-to-chat').textContent = result.ok ? '✓ Datos pegados en el chat: revisa y presiona Enter' : '✓ Datos copiados: pégalos en el chat con Ctrl+V';
  setTimeout(() => { $('ticket-to-chat').textContent = '📋 Enviar datos al cliente para confirmar'; }, 4000);
});
$('ticket-close').addEventListener('click', closeTicketPanel);
$('ticket-preview-wrap').addEventListener('click', () => {
  if ($('ticket-panel').classList.contains('compact')) $('ticket-preview-wrap').classList.toggle('expanded');
});
window.addEventListener('resize', () => {
  if (ticketPanelOpen) layoutTicketPanel();
});
$('ticket-panel').addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeTicketPanel();
});

// ---------- Remitentes de los tickets ----------

let profilesOpen = false;
const PROFILE_FIELDS = [
  ['name', 'Nombre del remitente (para elegirlo)'], ['slogan', 'Lema bajo el logo (opcional)'],
  ['origin', 'Origen'],
  ['sender', 'Remitente (texto del recuadro)'], ['phone', 'Teléfono'],
  ['address', 'Dirección', 'full'], ['email', 'Correo'], ['website', 'Tienda online'],
  ['note', 'Texto "Importante"', 'full', 'textarea'],
];

// Letras recomendadas por dato, para que cada uno quepa en su línea del ticket de 72 mm.
// Pasarse no rompe nada (el ticket se ajusta solo), pero el texto se parte en más líneas o la letra se achica.
const PROFILE_LIMITS = {
  name: 25, slogan: 32, origin: 20, sender: 40, phone: 15, address: 45, email: 35, website: 28, note: 900,
};

// Ticket de ejemplo con muchos datos (envío Olva a domicilio), para revisar si una empresa cabe en 297 mm.
const SAMPLE_TICKET = {
  carrier: 'Olva', channel: 'WhatsApp', name: 'María Fernanda Quispe Huamán', dni: '45678912', phone: '987654321',
  destination: 'Lima / Lima / San Juan de Lurigancho', address: 'Av. Próceres de la Independencia 1234, Dpto. 301',
  district: 'San Juan de Lurigancho', reference: 'Frente al parque central', reference2: 'Puerta verde, 2.º piso',
  note: 'Llamar antes de llegar', orderNumber: '123456789012',
};

// Dibuja un ticket de prueba con los datos que se están escribiendo y avisa si cabe en 72 × 297 mm.
async function checkProfileFit(row) {
  if (!row.isConnected) return;
  const profile = {};
  for (const input of row.querySelectorAll('input[data-key], textarea[data-key], select[data-key]')) {
    profile[input.dataset.key] = input.type === 'checkbox' ? input.checked : input.value;
  }
  for (const box of row.querySelectorAll('.prof-image')) {
    const img = box.querySelector('img');
    profile[`${box.dataset.key}Url`] = !img.hidden && img.src ? img.src : '';
  }
  const preview = row.querySelector('.prof-preview');
  const status = row.querySelector('.prof-check-fit span');
  // Se mide en una copia invisible (la vista previa puede estar oculta), ya con el logo cargado.
  const probe = document.createElement('div');
  probe.className = 'prof-probe';
  document.body.append(probe);
  const copy = window.renderTicket(probe, SAMPLE_TICKET, profile);
  await Promise.all([...copy.querySelectorAll('img')].map((img) => img.decode().catch(() => {})));
  window.fitTicket(copy);
  const usage = window.ticketUsage(copy);
  const fit = copy.dataset.fit;
  probe.remove();
  if (!preview.hidden) window.renderTicket(preview, SAMPLE_TICKET, profile);
  if (!usage) return;
  status.className = fit ? 'warn' : 'ok';
  status.textContent = fit
    ? '⚠ Con un pedido largo no cabe en 297 mm: la app achicará la letra. Acorta el texto "Importante" o la dirección.'
    : `✓ Cabe bien en 72 × 297 mm: el ticket de prueba usa ${usage.usedMm} mm y sobran ${usage.freeMm} mm.`;
}

// Avisos del logo según la imagen ya recortada.
function logoWarning(width, height) {
  if (!width || !height) return '';
  const ratio = width / height;
  if (width < 500 && height < 300) return '⚠ Imagen chica: puede salir borrosa. Usa una de al menos 1260 × 390 px.';
  if (ratio < 0.8) return '⚠ Logo vertical: saldrá angosto. Mejor un logo horizontal (más ancho que alto).';
  if (ratio > 6) return '⚠ Logo muy alargado: saldrá bajito. Lo ideal es unas 3 veces más ancho que alto.';
  return '';
}

function profileImage(row, key, label, profile) {
  const box = document.createElement('div');
  box.className = 'prof-image';
  box.dataset.key = key;
  box.dataset.name = profile[key] || '';
  const img = document.createElement('img');
  img.alt = '';
  img.hidden = !profile[`${key}Url`];
  if (profile[`${key}Url`]) img.src = profile[`${key}Url`];
  const pick = document.createElement('button');
  pick.type = 'button';
  pick.textContent = profile[key] ? `Cambiar ${label}` : `Elegir ${label}`;
  pick.addEventListener('click', async () => {
    const chosen = await api.pickTicketImage(key);
    if (!chosen) return;
    box.dataset.name = chosen.name;
    img.src = chosen.url;
    img.hidden = false;
    pick.textContent = `Cambiar ${label}`;
    if (key === 'logo') warn.textContent = logoWarning(chosen.width, chosen.height);
    if (key === 'qr') warn.textContent = Math.abs(chosen.width - chosen.height) > chosen.width * 0.15
      ? '⚠ El QR debe ser cuadrado: recórtalo para que no salga deformado.' : '';
    row.dispatchEvent(new Event('input'));
  });
  const warn = document.createElement('span');
  warn.className = 'prof-warn';
  box.append(`${label}:`, img, pick, warn);
  return box;
}

function profileRow(profile = { note: '' }) {
  const row = document.createElement('div');
  row.className = 'prof-row';
  row.dataset.id = profile.id || '';
  for (const [key, label, wide, kind] of PROFILE_FIELDS) {
    const wrap = document.createElement('label');
    if (wide) wrap.className = 'full';
    const input = document.createElement(kind || 'input');
    input.dataset.key = key;
    input.value = profile[key] || '';
    const limit = PROFILE_LIMITS[key];
    const count = document.createElement('span');
    count.className = 'prof-count';
    const updateCount = () => {
      const n = input.value.length;
      count.textContent = `${n} / ${limit} letras${n > limit ? ' · muy largo, acórtalo' : ''}`;
      count.classList.toggle('over', n > limit);
    };
    input.addEventListener('input', updateCount);
    updateCount();
    wrap.append(label, input, count);
    row.append(wrap);
  }
  const size = document.createElement('label');
  const sizeSelect = document.createElement('select');
  sizeSelect.dataset.key = 'textSize';
  sizeSelect.append(new Option('Normal', 'normal'), new Option('Más pequeña', 'small'));
  sizeSelect.value = profile.textSize === 'small' ? 'small' : 'normal';
  size.append('Tamaño de letra del ticket', sizeSelect);
  const webQr = document.createElement('label');
  webQr.className = 'prof-check';
  const webQrInput = document.createElement('input');
  webQrInput.type = 'checkbox';
  webQrInput.dataset.key = 'webQr';
  webQrInput.checked = profile.webQr !== false;
  webQr.append(webQrInput, ' Imprimir también el QR de la tienda online (se crea solo con la dirección web)');
  row.append(size, webQr);
  const images = document.createElement('div');
  images.className = 'prof-images';
  images.append(profileImage(row, 'logo', 'logo', profile), profileImage(row, 'qr', 'QR', profile));
  const check = document.createElement('div');
  check.className = 'prof-check-fit';
  const status = document.createElement('span');
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.textContent = 'Ver ticket de prueba';
  const preview = document.createElement('div');
  preview.className = 'prof-preview';
  preview.hidden = true;
  toggle.addEventListener('click', () => {
    preview.hidden = !preview.hidden;
    toggle.textContent = preview.hidden ? 'Ver ticket de prueba' : 'Ocultar ticket de prueba';
    checkProfileFit(row);
  });
  check.append(status, toggle);
  let timer = 0;
  row.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => checkProfileFit(row), 250);
  });
  row.addEventListener('change', () => checkProfileFit(row));
  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'prof-del';
  del.textContent = 'Eliminar remitente';
  del.addEventListener('click', () => row.remove());
  const hint = document.createElement('p');
  hint.className = 'prof-hint';
  hint.textContent = 'Logo: horizontal, unas 3 veces más ancho que alto, de 1260 × 390 px (en el ticket mide 42 × 13 mm); '
    + 'los bordes en blanco se recortan solos. QR de WhatsApp: cuadrado, de al menos 600 × 600 px. '
    + 'Texto "Importante": hasta 900 letras.';
  row.append(images, hint, check, preview, del);
  requestAnimationFrame(() => checkProfileFit(row));
  return row;
}

// Una empresa nueva empieza con los datos del primer remitente (dirección, correo, tienda, teléfono, QR, nota...),
// porque casi siempre son los mismos: solo se cambia el nombre y el logo.
let firstProfile = null;

function newProfileData() {
  if (!firstProfile) return { note: '' };
  const { id, name, logo, logoUrl, slogan, ...shared } = firstProfile;
  return shared;
}

async function openProfiles({ addNew = false } = {}) {
  if (state.locked || passwordMode) return;
  closeCoffee();
  closeSalesList();
  closeShipments();
  closeTemplatesDialog();
  closeReminderDialog();
  const list = await api.ticketProfiles();
  firstProfile = list[0] || null;
  $('prof-list').replaceChildren(...list.map(profileRow));
  $('prof-error').textContent = '';
  $('prof-modal').hidden = false;
  if (!profilesOpen) api.setOverlay(true);
  profilesOpen = true;
  if (addNew) {
    const row = profileRow(newProfileData());
    $('prof-list').append(row);
    row.scrollIntoView();
    row.querySelector('input').focus();
    selectNewestProfile = true;
  }
}

function closeProfiles(saved = false) {
  if (!profilesOpen) return;
  if (!saved) selectNewestProfile = false;
  profilesOpen = false;
  $('prof-modal').hidden = true;
  api.setOverlay(false);
}

$('prof-add').addEventListener('click', () => {
  const row = profileRow(newProfileData());
  $('prof-list').append(row);
  row.querySelector('input').focus();
});
$('prof-cancel').addEventListener('click', () => closeProfiles());
$('prof-modal').addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeProfiles();
});
$('prof-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const list = [...document.querySelectorAll('#prof-list .prof-row')].map((row) => {
    const profile = { id: row.dataset.id };
    for (const input of row.querySelectorAll('[data-key]')) {
      profile[input.dataset.key] = input.type === 'checkbox' ? input.checked : input.value;
    }
    for (const box of row.querySelectorAll('.prof-image')) profile[box.dataset.key] = box.dataset.name;
    return profile;
  });
  withBusy(e.target, async () => {
    const result = await api.saveTicketProfiles(list);
    if (!result.ok) {
      $('prof-error').textContent = result.error || 'No se pudo guardar.';
      return;
    }
    closeProfiles(true);
    if (ticketPanelOpen) {
      await loadTicketProfiles();
      fillSenderFields();
      updateTicketPreview();
    }
  });
});

// ---------- Formularios de envío ----------

let formsOpen = false;
let formDefaults = {};

async function openForms() {
  if (state.locked || passwordMode) return;
  closeCoffee();
  closeSalesList();
  closeShipments();
  closeTemplatesDialog();
  closeReminderDialog();
  closeProfiles();
  const { forms, defaults } = await api.getForms();
  formDefaults = defaults;
  $('forms-Shalom').value = forms.Shalom;
  $('forms-Olva').value = forms.Olva;
  $('forms-modal').hidden = false;
  if (!formsOpen) api.setOverlay(true);
  formsOpen = true;
}

function closeForms() {
  if (!formsOpen) return;
  formsOpen = false;
  $('forms-modal').hidden = true;
  api.setOverlay(false);
}

$('ask-data').addEventListener('click', () => api.formsMenu());
$('forms-cancel').addEventListener('click', closeForms);
$('forms-reset').addEventListener('click', () => {
  $('forms-Shalom').value = formDefaults.Shalom;
  $('forms-Olva').value = formDefaults.Olva;
});
$('forms-modal').addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeForms();
});
$('forms-form').addEventListener('submit', (e) => {
  e.preventDefault();
  withBusy(e.target, async () => {
    const result = await api.saveForms({ Shalom: $('forms-Shalom').value, Olva: $('forms-Olva').value });
    if (result.ok) closeForms();
  });
});

// ---------- Cafecito para el creador ----------

let coffeeOpen = false;

function openCoffee() {
  if (state.locked || passwordMode) return;
  closeSalesList();
  closeShipments();
  closeTemplatesDialog();
  closeReminderDialog();
  $('coffee-number').textContent = String(state.creatorYape || '').replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
  $('coffee-copy').textContent = 'Copiar número';
  $('coffee-modal').hidden = false;
  if (!coffeeOpen) api.setOverlay(true);
  coffeeOpen = true;
}

function closeCoffee() {
  closeDrawer(); // las otras ventanas llaman a closeCoffee() antes de abrirse: también cierran los paneles laterales
  if (typeof closeVerify === 'function' && verifyOpen) closeVerify();
  if (typeof closeFlyer === 'function' && flyer.open) closeFlyer();
  if (typeof closeAssistantPanel === 'function' && aiOpen) closeAssistantPanel();
  if (welcomeOpen) closeWelcome();
  if (typeof closePhoneGuide === 'function' && phoneOpen) closePhoneGuide();
  if (!coffeeOpen) return;
  coffeeOpen = false;
  $('coffee-modal').hidden = true;
  api.setOverlay(false);
}

// ---------- Paneles laterales: MultiChat Pro (logo) y Pagos y celular ----------

let drawerOpen = ''; // '' | 'about' | 'pay'

function openDrawer(name) {
  if (state.locked || passwordMode) return;
  closeCoffee();
  closeSalesList();
  closeShipments();
  closeTemplatesDialog();
  closeReminderDialog();
  if (drawerOpen && drawerOpen !== name) closeDrawer();
  $(`${name}-modal`).hidden = false;
  if (!drawerOpen) api.setOverlay(true);
  drawerOpen = name;
  if (name === 'about') loadAbout();
  else if (name === 'settings') loadSettings();
  else if (name === 'prints') loadPrints();
  else loadPayments();
}

function closeDrawer() {
  if (!drawerOpen) return;
  $(`${drawerOpen}-modal`).hidden = true;
  drawerOpen = '';
  api.setOverlay(false);
}

for (const name of ['about', 'pay', 'settings', 'prints']) {
  $(`${name}-close`).addEventListener('click', closeDrawer);
  $(`${name}-modal`).addEventListener('click', (e) => {
    if (e.target === $(`${name}-modal`)) closeDrawer();
  });
  $(`${name}-modal`).addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer();
  });
}

$('brand').addEventListener('click', () => (drawerOpen === 'about' ? closeDrawer() : openDrawer('about')));
$('pay-btn').addEventListener('click', () => (drawerOpen === 'pay' ? closeDrawer() : openDrawer('pay')));
api.onPaymentsPanel(() => openDrawer('pay'));
api.onPrintsPanel(() => openDrawer('prints'));
$('pay-prints').addEventListener('click', () => openDrawer('prints'));
$('about-coffee').addEventListener('click', () => {
  closeDrawer();
  openCoffee();
});

// -- Impresiones de hoy: historial del día con Reimprimir (se borra solo al día siguiente) --

async function loadPrints() {
  const data = await api.printsState();
  $('prints-total').textContent = data.total;
  $('prints-split').replaceChildren(...[['Shalom', data.shalom], ['Olva', data.olva], ['Otras', data.others]]
    .filter(([name, n]) => n || name !== 'Otras')
    .map(([name, n]) => {
      const chip = Object.assign(document.createElement('span'), { className: 'pay-chip' });
      chip.append(Object.assign(document.createElement('b'), { textContent: String(n) }), ` ${name}`);
      return chip;
    }));
  $('prints-list').replaceChildren(...(data.list.length ? data.list.map((p) => {
    const row = document.createElement('div');
    row.className = 'print-row';
    const badge = Object.assign(document.createElement('span'), { className: `print-carrier ${String(p.carrier).toLowerCase()}`, textContent: p.carrier });
    const info = Object.assign(document.createElement('div'), { className: 'pay-who', textContent: p.name });
    info.append(Object.assign(document.createElement('small'), {
      textContent: `${hhmm(p.at)}${p.edited ? ' · corregido' : ''}${p.pdf ? ' · PDF' : ''}${p.place ? ` · ${p.place}` : ''}${p.orderNumber ? ` · N° ${p.orderNumber}` : ''}`,
    }));
    const edit = Object.assign(document.createElement('button'), { type: 'button', className: 'drawer-btn small', textContent: '✏️ Editar', title: 'Corregir algún dato y volver a imprimir' });
    edit.addEventListener('click', async () => {
      const saved = await api.getPrint(p.id);
      if (!saved) return;
      closeDrawer();
      openTicketPanel({ channel: saved.ticket.channel || 'WhatsApp', prefill: saved.ticket, editPrint: { id: saved.id, at: saved.at } });
    });
    const again = Object.assign(document.createElement('button'), { type: 'button', className: 'drawer-btn small', textContent: '🖨 Reimprimir' });
    again.addEventListener('click', async () => {
      again.disabled = true;
      again.textContent = 'Imprimiendo…';
      const result = await api.reprint(p.id);
      again.textContent = result.ok ? '✓ Listo' : '⚠ No se pudo';
      if (!result.ok && result.error) again.title = result.error;
      setTimeout(() => { again.disabled = false; again.textContent = '🖨 Reimprimir'; }, 2500);
    });
    const actions = Object.assign(document.createElement('div'), { className: 'print-actions' });
    actions.append(edit, again);
    row.append(badge, info, actions);
    return row;
  }) : [Object.assign(document.createElement('p'), { className: 'drawer-empty', textContent: 'Todavía no imprimiste tickets hoy.' })]));
}

// -- Conectar el celular (Android o iPhone) --

let phoneOpen = false;
function showPhoneSteps(type) {
  for (const b of document.querySelectorAll('#phone-tabs button')) b.classList.toggle('on', b.dataset.phone === type);
  $('phone-steps-android').hidden = type !== 'android';
  $('phone-steps-iphone').hidden = type !== 'iphone';
}
async function openPhoneGuide() {
  if (state.locked || passwordMode) return;
  closeCoffee();
  const panel = await api.settingsPanel();
  showPhoneSteps((panel && panel.phoneType) || 'android');
  $('phone-modal').hidden = false;
  if (!phoneOpen) api.setOverlay(true);
  phoneOpen = true;
}
function closePhoneGuide() {
  if (!phoneOpen) return;
  phoneOpen = false;
  $('phone-modal').hidden = true;
  api.setOverlay(false);
}
for (const b of document.querySelectorAll('#phone-tabs button')) {
  b.addEventListener('click', () => {
    showPhoneSteps(b.dataset.phone);
    api.settingsDo('phoneType', b.dataset.phone);
  });
}
$('phone-close').addEventListener('click', closePhoneGuide);
$('phone-open-link').addEventListener('click', () => api.openPhoneLink());
$('phone-modal').addEventListener('keydown', (e) => { if (e.key === 'Escape') closePhoneGuide(); });
$('pay-phone').addEventListener('click', () => openPhoneGuide());
api.onPhoneGuide(openPhoneGuide);

// -- Configuración --

const ACCENT_COLORS = {
  violeta: ['#7c3aed', '#db2777'],
  azul: ['#2563eb', '#06b6d4'],
  verde: ['#059669', '#84cc16'],
  naranja: ['#ea580c', '#f59e0b'],
  rosa: ['#db2777', '#f43f5e'],
};
let settingsOpenSections = new Set(['avisos']);

function settingRow(item) {
  const row = document.createElement('div');
  row.className = `set-row set-${item.type}`;
  row.dataset.search = `${item.label} ${item.hint || ''}`.toLowerCase();
  const text = document.createElement('div');
  text.className = 'set-text';
  text.append(Object.assign(document.createElement('div'), { className: 'set-label', textContent: item.label }));
  if (item.hint) text.append(Object.assign(document.createElement('div'), { className: 'set-hint', textContent: item.hint }));
  row.append(text);
  const run = async (value) => {
    const next = await api.settingsDo(item.id, value);
    if (next) renderSettings(next);
    else closeDrawer();
  };
  if (item.type === 'toggle') {
    const input = Object.assign(document.createElement('input'), { type: 'checkbox', checked: item.value, className: 'set-switch' });
    input.addEventListener('change', () => run(input.checked));
    row.append(input);
    row.addEventListener('click', (e) => { if (e.target !== input) { input.checked = !input.checked; run(input.checked); } });
  } else if (item.type === 'choice') {
    const select = document.createElement('select');
    select.className = 'set-select';
    for (const o of item.options) select.append(new Option(o.label, o.value, false, String(o.value) === String(item.value)));
    select.addEventListener('change', () => run(select.value));
    row.append(select);
  } else if (item.type === 'accent') {
    const dots = document.createElement('div');
    dots.className = 'accent-dots';
    for (const name of item.options) {
      const b = document.createElement('button');
      b.type = 'button';
      b.title = name[0].toUpperCase() + name.slice(1);
      b.className = `accent-dot${name === item.value ? ' on' : ''}`;
      b.style.background = `linear-gradient(135deg, ${ACCENT_COLORS[name].join(', ')})`;
      b.addEventListener('click', () => run(name));
      dots.append(b);
    }
    row.append(dots);
  } else {
    row.append(Object.assign(document.createElement('span'), { className: 'set-chevron', textContent: '›' }));
    row.addEventListener('click', () => run());
  }
  return row;
}

function renderSettings(panel) {
  $('settings-quick').replaceChildren(...panel.quick.map((q) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `quick-btn${q.on ? ' on' : ''}`;
    b.append(Object.assign(document.createElement('span'), { className: 'quick-icon', textContent: q.icon }), q.label);
    b.addEventListener('click', async () => {
      const next = await api.settingsDo(q.id);
      if (next) renderSettings(next);
      else closeDrawer();
    });
    return b;
  }));
  $('settings-sections').replaceChildren(...panel.sections.map((section) => {
    const box = document.createElement('details');
    box.className = 'set-section';
    box.dataset.id = section.id;
    box.open = settingsOpenSections.has(section.id);
    box.style.setProperty('--sec', section.color);
    const summary = document.createElement('summary');
    summary.append(Object.assign(document.createElement('span'), { className: 'sec-icon', textContent: section.icon }), section.title);
    box.append(summary, ...section.items.map(settingRow));
    box.addEventListener('toggle', () => {
      if (box.open) settingsOpenSections.add(section.id);
      else settingsOpenSections.delete(section.id);
    });
    return box;
  }));
  filterSettings();
}

function filterSettings() {
  const q = $('settings-search').value.trim().toLowerCase();
  let any = false;
  for (const section of document.querySelectorAll('.set-section')) {
    let visible = 0;
    const title = section.querySelector('summary').textContent.toLowerCase();
    for (const row of section.querySelectorAll('.set-row')) {
      const show = !q || row.dataset.search.includes(q) || title.includes(q);
      row.hidden = !show;
      if (show) visible += 1;
    }
    section.hidden = !visible;
    if (q && visible) section.open = true;
    any = any || visible > 0;
  }
  $('settings-quick').hidden = Boolean(q);
  $('settings-none').hidden = any;
}

async function loadSettings() {
  $('settings-search').value = '';
  const panel = await api.settingsPanel();
  if (panel) renderSettings(panel);
  setTimeout(() => $('settings-search').focus(), 50);
}

$('settings-search').addEventListener('input', filterSettings);

// -- Botones de la barra con su nombre: al pasar el mouse el botón se estira y muestra el nombre (y el atajo) --

function syncButtonLabel(button) {
  const title = button.getAttribute('title');
  if (title === null) return;
  const shortcut = (title.match(/\((Ctrl[^)]*)\)/) || [])[1] || '';
  const name = title.replace(/\s*\([^)]*\)\s*$/, '').split(' · ')[0].trim();
  let label = button.querySelector('.btn-label');
  if (!label) {
    label = document.createElement('span');
    label.className = 'btn-label';
    button.append(label);
  }
  label.textContent = name;
  if (shortcut) label.append(Object.assign(document.createElement('kbd'), { textContent: shortcut }));
  button.setAttribute('aria-label', title);
  button.removeAttribute('title');
}

for (const button of document.querySelectorAll('.toolbar .icon-btn')) syncButtonLabel(button);
new MutationObserver((changes) => {
  for (const change of changes) if (change.target.classList.contains('icon-btn')) syncButtonLabel(change.target);
}).observe(document.querySelector('.toolbar'), { subtree: true, attributes: true, attributeFilter: ['title'] });

// -- Bienvenida del día --

let welcomeOpen = false;

// Cuenta del 0 al número final (animación); sin animaciones, pone el número directo.
function countUp(el, to, format) {
  if (state.animations === false) {
    el.textContent = format(to);
    return;
  }
  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / 900);
    el.textContent = format(to * (1 - (1 - t) ** 3));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

api.onWelcome((data) => {
  if (state.locked || passwordMode) return;
  closeCoffee();
  $('wel-icon').textContent = data.icon;
  $('wel-title').textContent = data.name ? `${data.greeting}, ${data.name}` : `${data.greeting}`;
  $('wel-date').textContent = data.date;
  const money = (n) => `S/ ${Math.round(n).toLocaleString('es-PE')}`;
  countUp($('wel-yesterday'), data.prints, (n) => String(Math.round(n)));
  $('wel-yesterday-label').textContent = 'Tickets impresos hoy';
  countUp($('wel-today'), data.today.total, money);
  $('wel-today-label').textContent = `Cobrado hoy · ${data.today.count} pago${data.today.count === 1 ? '' : 's'}`;
  countUp($('wel-ship'), data.pendingShipments, (n) => String(Math.round(n)));
  countUp($('wel-unread'), data.unread, (n) => String(Math.round(n)));
  $('wel-rem').replaceChildren(...(data.reminders.length ? [
    Object.assign(document.createElement('div'), { className: 'wel-rem-title', textContent: '⏰ Recordatorios de hoy' }),
    ...data.reminders.map((r) => Object.assign(document.createElement('div'), {
      className: 'wel-rem-item',
      textContent: `${new Date(r.at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })} · ${r.account ? `${r.account}: ` : ''}${r.note}`,
    })),
  ] : []));
  $('welcome-modal').hidden = false;
  if (!welcomeOpen) api.setOverlay(true);
  welcomeOpen = true;
  $('wel-go').focus();
});

function closeWelcome() {
  if (!welcomeOpen) return;
  welcomeOpen = false;
  $('welcome-modal').hidden = true;
  api.setOverlay(false);
}

$('wel-go').addEventListener('click', closeWelcome);
$('welcome-modal').addEventListener('click', (e) => { if (e.target === $('welcome-modal')) closeWelcome(); });
$('welcome-modal').addEventListener('keydown', (e) => { if (e.key === 'Escape') closeWelcome(); });

// -- Panel de MultiChat Pro --

const UPDATE_TEXT = {
  idle: ['Actualizaciones automáticas', 'Se revisan solas. Nunca se cierra la app mientras trabajas.', 'Buscar actualizaciones'],
  checking: ['Buscando actualizaciones…', 'Un momento.', ''],
  downloading: ['Descargando la versión {v}…', 'Te avisaremos cuando esté lista.', ''],
  ready: ['Versión {v} descargada', 'Se instalará sola la próxima vez que abras MultiChat. No se cierra nada ahora.', ''],
  latest: ['Tienes la última versión', 'Las actualizaciones se revisan solas.', 'Buscar de nuevo'],
  error: ['No se pudo revisar', 'Revisa tu conexión a internet.', 'Intentar de nuevo'],
  dev: ['Actualizaciones automáticas', 'Funcionan en la app instalada.', ''],
};

function showUpdateState(update) {
  const status = UPDATE_TEXT[update.status] ? update.status : 'idle';
  const [title, sub, action] = UPDATE_TEXT[status].map((t) => t.replace('{v}', update.version ? `v${update.version}` : ''));
  $('update-card').dataset.status = status;
  $('update-title').textContent = title;
  $('update-sub').textContent = sub;
  $('update-action').textContent = action;
  $('update-action').hidden = !action;
}

async function loadAbout() {
  const info = await api.about();
  $('about-version').textContent = `Versión ${info.version}`;
  $('creator-rights').textContent = `© ${info.year} ${info.creator}. Todos los derechos reservados.`;
  showUpdateState(info.update);
  $('changelog').replaceChildren(...info.changelog.slice(0, 5).map((entry, i) => {
    const box = document.createElement('div');
    box.className = 'change';
    const head = document.createElement('div');
    head.className = 'change-version';
    head.textContent = `v${entry.version}${i === 0 && entry.version === info.version ? ' · instalada' : ''}`;
    const list = document.createElement('ul');
    for (const item of entry.items) {
      const li = document.createElement('li');
      li.textContent = item;
      list.append(li);
    }
    box.append(head, list);
    return box;
  }));
}

$('update-action').addEventListener('click', async () => {
  showUpdateState({ status: 'checking' });
  showUpdateState(await api.checkUpdate());
});
api.onAboutPanel(() => openDrawer('about'));

// Aviso de versión nueva encima de la app: no cierra ni reinicia nada.
let updatePopupOpen = false;
api.onUpdateReady(({ version, items }) => {
  if (state.locked || passwordMode) return;
  closeCoffee();
  $('upd-version').textContent = `Versión ${version}`;
  $('upd-items').replaceChildren(...(items || []).map((text) => Object.assign(document.createElement('li'), { textContent: text })));
  $('upd-items').hidden = !(items && items.length);
  $('update-modal').hidden = false;
  if (!updatePopupOpen) api.setOverlay(true);
  updatePopupOpen = true;
  $('upd-ok').focus();
});
function closeUpdatePopup() {
  if (!updatePopupOpen) return;
  updatePopupOpen = false;
  $('update-modal').hidden = true;
  api.setOverlay(false);
}
$('upd-ok').addEventListener('click', closeUpdatePopup);
$('update-modal').addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeUpdatePopup();
});
api.onUpdateState((update) => {
  if (drawerOpen === 'about') showUpdateState(update);
});

// -- Panel de pagos y celular --

const PAY_ICON = { Yape: 'yape', Plin: 'plin', BBVA: 'bbva' };
const soles = (n) => `S/ ${Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const hhmm = (at) => new Date(at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

function agoText(at) {
  if (!at) return '';
  const min = Math.round((Date.now() - at) / 60000);
  if (min < 1) return 'hace un momento';
  if (min < 60) return `hace ${min} min`;
  return `a las ${hhmm(at)}`;
}

async function loadPayments() {
  const data = await api.paymentsState();
  $('pay-prints').textContent = `🖨 Impresiones de hoy (${data.prints})`;
  // Enlace Móvil: abierto / cerrado / no disponible
  const link = data.phoneLink;
  let status = 'off';
  let sub = 'Ábrelo y conecta tu iPhone para recibir los avisos.';
  if (!data.windows) sub = 'Disponible solo en Windows.';
  else if (link.running) {
    status = 'on';
    sub = link.lastAt ? `Conectado · última notificación ${agoText(link.lastAt)}` : 'Abierto · esperando notificaciones del celular';
  } else if (link.running === null && link.dbFound) {
    status = 'unknown';
    sub = 'Recibiendo notificaciones de Windows';
  }
  $('link-card').dataset.status = status;
  $('link-title').textContent = status === 'on' ? 'Enlace Móvil conectado' : status === 'unknown' ? 'Enlace Móvil' : 'Enlace Móvil cerrado';
  $('link-sub').textContent = sub;
  $('link-open').hidden = !data.windows || status === 'on';

  const prevTotal = Number($('pay-total').dataset.value || 0);
  $('pay-total').dataset.value = data.total;
  if (data.total > prevTotal && state.animations !== false) {
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / 800);
      $('pay-total').textContent = soles(prevTotal + (data.total - prevTotal) * (1 - (1 - t) ** 3));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    $('pay-total').closest('.pay-total').classList.remove('bump');
    void $('pay-total').offsetWidth;
    $('pay-total').closest('.pay-total').classList.add('bump');
  } else $('pay-total').textContent = soles(data.total);
  $('pay-total-count').textContent = `${data.today.length} pago${data.today.length === 1 ? '' : 's'}`;
  // Cuántos Yape y cuántos Plin (los cobros de BBVA Empresas cuentan como Plin), con su suma.
  const groups = [['Yape', (p) => p.app === 'Yape'], ['Plin', (p) => p.app !== 'Yape']].map(([name, test]) => {
    const list = data.today.filter(test);
    return { name, count: list.length, total: list.reduce((t, p) => t + p.amount, 0) };
  });
  $('pay-split').replaceChildren(...groups.map((g) => {
    const chip = document.createElement('span');
    chip.className = `pay-chip ${g.name.toLowerCase()}`;
    chip.append(Object.assign(document.createElement('b'), { textContent: `${g.count} ${g.name}` }), ` · ${soles(g.total)}`);
    return chip;
  }));
  $('pay-list').replaceChildren(...(data.today.length ? data.today.slice().reverse().map((p) => {
    const row = document.createElement('div');
    row.className = `pay-row ${PAY_ICON[p.app] || 'plin'}`;
    const badge = document.createElement('span');
    badge.className = 'pay-app';
    badge.textContent = p.app === 'BBVA' ? 'Plin' : p.app;
    const who = document.createElement('div');
    who.className = 'pay-who';
    who.textContent = p.name;
    const when = document.createElement('small');
    when.textContent = `${p.label} · ${hhmm(p.at)}`;
    who.append(when);
    const amount = document.createElement('div');
    amount.className = 'pay-amount';
    amount.textContent = soles(p.amount);
    row.append(badge, who, amount);
    return row;
  }) : [Object.assign(document.createElement('p'), { className: 'drawer-empty', textContent: 'Todavía no llegaron pagos hoy.' })]));

  $('opt-alerts').checked = data.alerts;
  $('opt-voice').checked = data.voice;
  $('opt-readall').checked = data.readAll;
  $('opt-awake').checked = data.keepAwake;

  $('phone-list').replaceChildren(...(data.recent.length ? data.recent.map((n) => {
    const row = document.createElement('div');
    row.className = 'phone-row';
    row.classList.toggle('is-payment', n.payment);
    const [app, ...rest] = n.texts;
    const head = document.createElement('div');
    head.className = 'phone-app';
    head.textContent = app;
    const time = document.createElement('span');
    time.textContent = hhmm(n.at);
    head.append(time);
    const body = document.createElement('div');
    body.className = 'phone-text';
    body.textContent = rest.join(' · ');
    row.append(head, body);
    return row;
  }) : [Object.assign(document.createElement('p'), { className: 'drawer-empty', textContent: 'Aquí aparecen las notificaciones que llegan del celular mientras MultiChat está abierto.' })]));

  $('pay-count').hidden = !data.today.length;
  $('pay-count').textContent = data.today.length;
}

for (const [id, key] of [['opt-alerts', 'alerts'], ['opt-voice', 'voice'], ['opt-readall', 'readAll'], ['opt-awake', 'keepAwake']]) {
  $(id).addEventListener('change', () => api.setPaymentOption(key, $(id).checked));
}
$('pay-test').addEventListener('click', () => api.testPayment());
$('pay-verify').addEventListener('click', () => {
  closeDrawer();
  showVerify({ status: 'ask' });
});

// ---------- Verificador de pagos ----------

let verifyOpen = false;
const VERIFY = {
  reading: ['⏳', 'Leyendo la captura…', 'Un momento.'],
  ask: ['🛡️', 'Verificar un pago', 'Haz clic derecho sobre la captura que te mandó el cliente → "Verificar pago de esta captura". O escribe el monto aquí abajo.'],
  confirmed: ['✅', 'Pago confirmado', 'Este pago sí llegó a tu cuenta.'],
  probable: ['🟡', 'Hay un pago de ese monto', 'Revisa que el nombre y la hora coincidan antes de despachar.'],
  'not-found': ['❌', 'Este pago NO llegó', 'No hay ningún pago de ese monto. Puede ser una captura falsa: revisa tu app de Yape o BBVA antes de despachar.'],
  unreadable: ['❓', 'No pude leer el monto', 'Escribe el monto de la captura aquí abajo para buscarlo.'],
};

function showVerify(result) {
  if (state.locked || passwordMode) return;
  closeCoffee();
  const [icon, title, text] = VERIFY[result.status] || VERIFY.ask;
  $('verify-card').dataset.status = result.status;
  $('verify-icon').textContent = icon;
  $('verify-title').textContent = result.status === 'not-found' && result.info && result.info.amount
    ? `No llegó ningún pago de ${soles(result.info.amount)}` : title;
  $('verify-text').textContent = result.reason ? `${result.reason} ${text}` : text;
  const info = result.info || {};
  const read = [];
  if (info.amount && !result.manual) read.push(`Monto ${soles(info.amount)}`);
  if (info.time && !result.manual) read.push(`Hora ${String(info.time.h).padStart(2, '0')}:${String(info.time.m).padStart(2, '0')}`);
  if (info.operation) read.push(`Operación ${info.operation}`);
  if (info.app) read.push(info.app);
  $('verify-read').textContent = read.length ? `En la captura: ${read.join(' · ')}` : '';
  $('verify-read').hidden = !read.length;
  $('verify-matches').replaceChildren(...(result.matches || []).map((p) => {
    const row = document.createElement('div');
    row.className = `pay-row ${PAY_ICON[p.app] || 'plin'}`;
    const badge = Object.assign(document.createElement('span'), { className: 'pay-app', textContent: p.app === 'BBVA' ? 'Plin' : p.app });
    const who = Object.assign(document.createElement('div'), { className: 'pay-who', textContent: p.name });
    const when = document.createElement('small');
    const day = new Date(p.at).toDateString() === new Date().toDateString() ? 'hoy' : new Date(p.at).toLocaleDateString('es-PE');
    when.textContent = `${p.label} · ${day} ${hhmm(p.at)}`;
    who.append(when);
    const amount = Object.assign(document.createElement('div'), { className: 'pay-amount', textContent: soles(p.amount) });
    row.append(badge, who, amount);
    return row;
  }));
  $('verify-modal').hidden = false;
  if (!verifyOpen) api.setOverlay(true);
  verifyOpen = true;
  if (result.status === 'unreadable' || result.status === 'ask') $('verify-amount').focus();
}

function closeVerify() {
  if (!verifyOpen) return;
  verifyOpen = false;
  $('verify-modal').hidden = true;
  api.setOverlay(false);
}

api.onVerify(showVerify);
$('verify-close').addEventListener('click', closeVerify);
$('verify-modal').addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeVerify();
});
$('verify-check').addEventListener('click', () => api.verifyManual($('verify-amount').value, $('verify-time').value.trim()));
$('verify-amount').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') $('verify-check').click();
});
$('verify-paste').addEventListener('click', () => api.verifyClipboard());
$('link-open').addEventListener('click', () => api.openPhoneLink());
api.onPaymentsUpdate(() => {
  if (drawerOpen === 'prints') loadPrints();
  if (drawerOpen === 'pay') loadPayments();
  else api.paymentsState().then((data) => {
    $('pay-count').hidden = !data.today.length;
    $('pay-count').textContent = data.today.length;
  });
});
setInterval(() => { if (drawerOpen === 'pay') loadPayments(); }, 15000);
$('coffee-close').addEventListener('click', closeCoffee);
$('coffee-modal').addEventListener('click', (e) => {
  if (e.target === $('coffee-modal')) closeCoffee();
});
$('coffee-modal').addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeCoffee();
});
$('coffee-copy').addEventListener('click', () => {
  api.copyCreatorYape();
  $('coffee-copy').textContent = '¡Número copiado! Gracias 💜';
});

// ---------- Recordatorios ----------

let reminderOpen = false;

function setReminderTime(date) {
  $('rem-at').value = toLocalInput(date);
}

function openReminderDialog({ accountId = null, note = '' } = {}) {
  if (state.locked || passwordMode) return;
  closeCoffee();
  closeSalesList();
  closeShipments();
  closeTemplatesDialog();
  const selected = state.accounts.find((a) => a.id === (accountId || state.activeId));
  $('rem-account').replaceChildren(...state.accounts.map((a) => new Option(a.name, a.id, false, selected && a.id === selected.id)));
  $('rem-note').value = note;
  setReminderTime(new Date(Date.now() + 60 * 60_000));
  for (const chip of document.querySelectorAll('#rem-chips button')) chip.classList.toggle('on', chip.dataset.min === '60');
  $('rem-error').textContent = '';
  $('rem-modal').hidden = false;
  if (!reminderOpen) api.setOverlay(true);
  reminderOpen = true;
  $('rem-note').focus();
}

function closeReminderDialog() {
  if (!reminderOpen) return;
  reminderOpen = false;
  $('rem-modal').hidden = true;
  api.setOverlay(false);
}

for (const chip of document.querySelectorAll('#rem-chips button')) {
  chip.addEventListener('click', () => {
    let date;
    if (chip.dataset.min) {
      date = new Date(Date.now() + Number(chip.dataset.min) * 60_000);
    } else {
      date = new Date();
      date.setDate(date.getDate() + 1);
      date.setHours(Number(chip.dataset.tomorrow), 0, 0, 0);
    }
    setReminderTime(date);
    for (const other of document.querySelectorAll('#rem-chips button')) other.classList.toggle('on', other === chip);
  });
}

$('rem-at').addEventListener('input', () => {
  for (const chip of document.querySelectorAll('#rem-chips button')) chip.classList.remove('on');
});
$('rem-cancel').addEventListener('click', closeReminderDialog);
$('rem-modal').addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeReminderDialog();
});

$('rem-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const at = new Date($('rem-at').value);
  withBusy(e.target, async () => {
    const result = await api.saveReminder({
      accountId: $('rem-account').value,
      note: $('rem-note').value,
      at: Number.isNaN(at.getTime()) ? '' : at.toISOString(),
    });
    if (result.ok) closeReminderDialog();
    else $('rem-error').textContent = result.error;
  });
});

// ---------- Inicio ----------

for (const [key, name, color] of SERVICES) {
  const btn = document.createElement('button');
  btn.className = 'service';
  btn.style.setProperty('--svc', color);
  const hint = document.createElement('small');
  hint.textContent = '+ Agregar cuenta';
  btn.append(serviceDot(key, name, color), name, hint);
  btn.addEventListener('click', () => api.addService(key));
  servicesEl.append(btn);
}

$('add').addEventListener('click', () => api.addMenu());
$('settings').addEventListener('click', () => (drawerOpen === 'settings' ? closeDrawer() : openDrawer('settings')));
$('layout').addEventListener('click', () => api.toggleLayout());
$('lock-btn').addEventListener('click', () => api.lockNow());
$('quick').addEventListener('click', () => api.quickMenu());
$('theme').addEventListener('click', () => api.toggleTheme());
$('reminders').addEventListener('click', () => api.remindersMenu());
$('print-ticket').addEventListener('click', () => (ticketPanelOpen ? closeTicketPanel() : api.ticketFromSelection()));
tabsEl.addEventListener('wheel', (e) => { tabsEl.scrollLeft += e.deltaY; }, { passive: true });

api.onState((next) => {
  state = next;
  if (renamingId && !state.accounts.some((a) => a.id === renamingId)) renamingId = null;
  render();
});
api.onStartRename(startRename);
api.onPasswordDialog(openPasswordDialog);
api.onTemplatesDialog(openTemplatesDialog);
api.onNewSale(openSalePanel);
api.onReminderDialog(openReminderDialog);
api.onTrackingUrlDialog(openUrlDialog);
api.onCoffeeDialog(openCoffee);
api.onNewTicket(openTicketPanel);
api.onSalesList(openSalesList);
api.onShipments(openShipments);
api.onTicketProfiles(openProfiles);
api.onFormsDialog(openForms);

// ---------- Voz: anuncia los pagos de Yape y Plin ----------
// Usa las voces en español que trae Windows (funcionan sin internet). Se prefiere una voz de mujer
// y, si está instalada, una voz "natural" (más humana).
const FEMALE_VOICES = /sabina|helena|laura|dalia|paloma|elvira|elena|lupe|lucia|lucía|camila|valentina|ximena|renata|female|mujer/i;
const MALE_VOICES = /ra[uú]l|pablo|jorge|alvaro|álvaro|gerardo|alonso|male|hombre/i;

function spanishVoice() {
  const voices = speechSynthesis.getVoices().filter((v) => /^es\b|^es-/i.test(v.lang));
  const score = (v) => (FEMALE_VOICES.test(v.name) ? 0 : MALE_VOICES.test(v.name) ? 20 : 10)
    + (/natural|neural|online/i.test(v.name) ? 0 : 5)
    + (['es-PE', 'es-MX', 'es-US', 'es-419', 'es-ES'].indexOf(v.lang) + 1 || 6);
  return voices.sort((a, b) => score(a) - score(b))[0] || null;
}

// "Ding" corto antes de hablar, para que el aviso se note aunque haya ruido.
function chime() {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    for (const [freq, at] of [[880, 0], [1318.5, 0.14]]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + at);
      gain.gain.linearRampToValueAtTime(0.9, now + at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + at + 0.45);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + at);
      osc.stop(now + at + 0.5);
    }
    setTimeout(() => ctx.close(), 1200);
  } catch { /* sin sonido */ }
}

function speak(text) {
  if (!('speechSynthesis' in window) || !text) return;
  const say = () => {
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = spanishVoice();
    if (voice) utterance.voice = voice;
    utterance.lang = voice ? voice.lang : 'es-PE';
    utterance.volume = 1; // al máximo (el resto lo da el volumen de Windows)
    utterance.rate = 1;
    utterance.pitch = 1.05;
    chime();
    // Chrome a veces deja la voz "trabada" (en pausa) cuando la ventana está en segundo plano: se destraba antes.
    if (speechSynthesis.paused) speechSynthesis.resume();
    setTimeout(() => speechSynthesis.speak(utterance), 550); // si llegan varios pagos, se dicen uno tras otro
  };
  if (speechSynthesis.getVoices().length) return say();
  // Las voces de Windows cargan unos instantes después de abrir la app.
  let done = false;
  const once = () => { if (!done) { done = true; say(); } };
  speechSynthesis.addEventListener('voiceschanged', once, { once: true });
  setTimeout(once, 1500);
}

api.onSpeak(speak);
api.ready();
