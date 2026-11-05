'use strict';

const {
  app, BrowserWindow, WebContentsView, Menu, Tray, ipcMain,
  session, shell, dialog, nativeImage, clipboard, ClipboardItem, powerMonitor, nativeTheme,
} = require('electron');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const store = require('./store');
const { hashSecret, verifySecret, normalizeAnswer } = require('./security');
const SERVICES = require('./services');
const sales = require('./sales');
const payments = require('./payments');
const updater = require('./updater');
const CHANGELOG = require('./changelog');
const notifier = require('./notifier');
const { templateImages: media, receipts, ticketImages } = require('./media');
const tickets = require('./tickets');

const APP_NAME = 'MultiChat Pro';
const CREATOR = 'lliuya.pe';
const CREATOR_YAPE = '925459643'; // "Invítale un cafecito al creador" (voluntario)
const BAR_HEIGHT = 52;   // igual que --bar-h en ui.css
const TILE_HEADER = 26;  // igual que .tile-head en ui.css
const TILE_GAP = 2;
const MIN_PASSWORD = 4;
const ICON = path.join(__dirname, '..', 'build', 'icon.png');

// WhatsApp Web rechaza navegadores que no reconoce: nos presentamos como Chrome normal.
const PLATFORM_UA = {
  win32: 'Windows NT 10.0; Win64; x64',
  darwin: 'Macintosh; Intel Mac OS X 10_15_7',
  linux: 'X11; Linux x86_64',
}[process.platform];
const CHROME_MAJOR = process.versions.chrome.split('.')[0];
const CHROME_UA = `Mozilla/5.0 (${PLATFORM_UA}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROME_MAJOR}.0.0.0 Safari/537.36`;

const ZOOM_STEPS = [0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2];
const TAG_COLORS = [
  ['Sin color', null],
  ['Verde', '#25D366'],
  ['Azul', '#2F80ED'],
  ['Rojo', '#EB5757'],
  ['Naranja', '#F2994A'],
  ['Morado', '#9B51E0'],
  ['Amarillo', '#F2C94C'],
];
// Horario de atención [inicio, fin]. Fuera de él no llegan avisos (se guarda como el rango de silencio).
const ATTENTION_HOURS = [['07:00', '19:00'], ['08:00', '18:00'], ['08:00', '20:00'], ['09:00', '18:00'], ['07:00', '22:00']];
const BLUR_CSS = 'html { filter: blur(14px) !important; }';
const MAX_TEMPLATES = 50;

const ALLOWED_PERMISSIONS = new Set([
  'notifications', 'media', 'clipboard-read', 'clipboard-sanitized-write', 'fullscreen',
]);

let win = null;
let tray = null;
let quitting = false;
let activeId = null;
let locked = false;
let overlayOpen = false; // una ventana de la barra (p. ej. contraseña) tapa el contenido
let panelWidth = 0;      // panel lateral derecho (registro de venta) abierto
let tiles = [];          // cuentas visibles ahora y su posición

const views = new Map();     // id -> WebContentsView (solo cuentas cargadas en memoria)
const unread = new Map();    // id -> número de mensajes sin leer
const favicons = new Map();  // id -> url del favicon
const lastUsed = new Map();  // id -> timestamp de la última vez que estuvo visible
const configuredSessions = new WeakSet();
const blurKeys = new Map();  // id -> promesa con la clave del CSS de difuminado

let startHidden = process.argv.includes('--hidden');

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', showWindow);
  app.whenReady().then(init);
}

// ---------- Cuentas ----------

function accounts() {
  return store.get().accounts;
}

// Pestañas abiertas (las cerradas siguen guardadas para poder reabrirlas).
// Las cuentas de un servicio que esta versión no conoce se ignoran (no se borran) en lugar de romper la app.
function openAccounts() {
  return accounts().filter((a) => !a.closed && SERVICES[a.service]);
}

function findAccount(id) {
  return accounts().find((a) => a.id === id);
}

function isGrid() {
  return store.get().settings.layout === 'grid';
}

function setupSession(ses) {
  if (configuredSessions.has(ses)) return;
  configuredSessions.add(ses);
  ses.setUserAgent(CHROME_UA);
  ses.setPermissionRequestHandler((_wc, permission, callback) => {
    callback(ALLOWED_PERMISSIONS.has(permission));
  });
  ses.setPermissionCheckHandler((_wc, permission) => ALLOWED_PERMISSIONS.has(permission));
}

function idForWebContents(wc) {
  for (const [id, view] of views) {
    if (view.webContents === wc) return id;
  }
  return null;
}

function createView(acc) {
  const svc = SERVICES[acc.service];
  const ses = session.fromPartition(`persist:${acc.id}`);
  setupSession(ses);

  const view = new WebContentsView({
    webPreferences: {
      session: ses,
      preload: path.join(__dirname, 'preload-service.js'),
      contextIsolation: true,
      sandbox: true,
      spellcheck: false,
    },
  });
  const wc = view.webContents;
  views.set(acc.id, view);

  wc.on('page-title-updated', (_e, title) => {
    const match = title.match(/\((\d+)\)/);
    unread.set(acc.id, match ? Number(match[1]) : 0);
    pushState();
  });
  wc.on('page-favicon-updated', (_e, urls) => {
    if (urls[0]) favicons.set(acc.id, urls[0]);
    pushState();
  });
  wc.on('dom-ready', syncNotifyState);
  wc.on('did-finish-load', () => {
    wc.setZoomFactor(acc.zoom || 1);
    blurKeys.delete(acc.id); // el CSS insertado se pierde al recargar
    applyPrivacyBlur();
  });
  wc.setWindowOpenHandler((details) => handleWindowOpen(svc, details));
  wc.on('context-menu', (_e, params) => showEditMenu(wc, params));
  wc.on('did-create-window', (child) => {
    child.setMenuBarVisibility(false);
    child.webContents.setWindowOpenHandler((details) => handleWindowOpen(svc, details));
  });
  wc.on('before-input-event', (event, input) => handleShortcut(event, input));
  wc.on('focus', () => {
    // En la cuadrícula, hacer clic dentro de una cuenta la marca como activa.
    if (activeId !== acc.id && views.get(acc.id) === view) {
      activeId = acc.id;
      pushState();
    }
  });
  wc.on('render-process-gone', (_e, details) => {
    if (details.reason !== 'clean-exit') wc.reload();
  });

  win.contentView.addChildView(view);
  view.setVisible(false);
  wc.loadURL(svc.url);
  return view;
}

function hostMatches(url, hosts) {
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === 'https:' && hosts.some((h) => hostname === h || hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

// Ventanas emergentes de la página: las de inicio de sesión o de vincular cuentas de Meta se abren
// dentro de la app (con la misma sesión); los enlaces a otros sitios, en el navegador.
function handleWindowOpen(svc, { url }) {
  const redirect = /^https:\/\/l[m]?\.facebook\.com\/l\.php/.test(url) || /^https:\/\/l\.instagram\.com\//.test(url);
  if (svc.popupHosts && !redirect && hostMatches(url, svc.popupHosts)) {
    return {
      action: 'allow',
      overrideBrowserWindowOptions: { width: 900, height: 720, autoHideMenuBar: true, icon: ICON, parent: win },
    };
  }
  if (/^https?:\/\//.test(url)) shell.openExternal(url);
  return { action: 'deny' };
}

function destroyView(id) {
  const view = views.get(id);
  if (!view) return;
  views.delete(id);
  blurKeys.delete(id);
  win.contentView.removeChildView(view);
  view.webContents.close();
}

// Libera la memoria de una cuenta. La sesión queda guardada en disco,
// así que al volver a abrirla no hay que escanear el QR otra vez.
function hibernate(id) {
  if (tiles.some((t) => t.id === id)) return;
  destroyView(id);
  pushState();
}

function hibernateIdle() {
  const minutes = store.get().settings.hibernateMinutes;
  if (!minutes) return;
  const limit = Date.now() - minutes * 60_000;
  for (const id of [...views.keys()]) {
    const acc = findAccount(id);
    if (id !== activeId && acc && !acc.keepAlive && (lastUsed.get(id) || 0) < limit) {
      hibernate(id);
    }
  }
}

function setActive(id) {
  const acc = findAccount(id);
  if (!acc || acc.closed || !SERVICES[acc.service] || locked) return;
  activeId = id;
  store.get().activeId = id;
  store.save();
  applyLayout();
  views.get(id)?.webContents.focus();
  pushState();
}

function addAccount(service) {
  const svc = SERVICES[service];
  if (!svc) return;
  const used = new Set(accounts().filter((a) => a.service === service).map((a) => a.name));
  let n = 1;
  const base = svc.tabName || svc.name;
  while (used.has(`${base} ${n}`)) n++;
  const acc = {
    id: `${service}-${Date.now().toString(36)}`,
    service,
    name: `${base} ${n}`,
    keepAlive: false,
    muted: false,
  };
  accounts().push(acc);
  store.save();
  setActive(acc.id);
  // Pide el nombre al momento (p. ej. "Fertisen 1") escribiendo directo en la pestaña.
  win.webContents.send('tab:start-rename', acc.id);
}

// Pestaña que queda activa al cerrar `id`: la de al lado, como en un navegador.
function neighborOf(id) {
  const list = openAccounts();
  const i = list.findIndex((a) => a.id === id);
  const next = list[i + 1] || list[i - 1];
  return next ? next.id : null;
}

function afterTabGone(id, nextId) {
  unread.delete(id);
  favicons.delete(id);
  lastUsed.delete(id);
  if (activeId === id) {
    activeId = null;
    if (nextId) setActive(nextId);
  }
  store.save();
  applyLayout();
  pushState();
}

async function closeTab(id) {
  const acc = findAccount(id);
  if (!acc || acc.closed) return;
  const { response, checkboxChecked } = await dialog.showMessageBox(win, {
    type: 'question',
    buttons: ['Cerrar pestaña', 'Cancelar'],
    defaultId: 0,
    cancelId: 1,
    title: 'Cerrar pestaña',
    message: `¿Cerrar "${acc.name}"?`,
    detail: 'La sesión queda guardada: puedes volver a abrirla desde el botón + → Pestañas cerradas, sin escanear el QR.',
    checkboxLabel: 'Cerrar también la sesión (habrá que escanear el QR otra vez)',
  });
  if (response !== 0) return;
  if (checkboxChecked) {
    await deleteAccount(id);
    return;
  }
  const nextId = neighborOf(id);
  acc.closed = true;
  destroyView(id);
  afterTabGone(id, nextId);
}

function reopenTab(id) {
  const acc = findAccount(id);
  if (!acc) return;
  acc.closed = false;
  store.save();
  setActive(id);
}

async function confirmDelete(id) {
  const acc = findAccount(id);
  if (!acc) return;
  const { response } = await dialog.showMessageBox(win, {
    type: 'warning',
    buttons: ['Eliminar', 'Cancelar'],
    defaultId: 1,
    cancelId: 1,
    title: 'Eliminar cuenta',
    message: `¿Eliminar "${acc.name}"?`,
    detail: 'Se cerrará la sesión en esta app. Para volver a usarla tendrás que escanear el código QR de nuevo.',
  });
  if (response === 0) await deleteAccount(id);
}

async function deleteAccount(id) {
  const nextId = neighborOf(id);
  destroyView(id);
  await session.fromPartition(`persist:${id}`).clearStorageData();
  store.get().accounts = accounts().filter((a) => a.id !== id);
  afterTabGone(id, nextId);
}

// ---------- Ventana y distribución ----------

function computeTiles(ids) {
  const bounds = win.getContentBounds();
  const width = Math.max(0, bounds.width - panelWidth);
  const { height } = bounds;
  const areaHeight = Math.max(0, height - BAR_HEIGHT);
  if (!isGrid()) {
    return ids.map((id) => ({ id, x: 0, y: BAR_HEIGHT, width, height: areaHeight, header: false }));
  }
  const n = ids.length;
  const cols = n <= 1 ? 1 : n <= 4 ? 2 : n <= 9 ? 3 : 4;
  const rows = Math.ceil(n / cols);
  const tileW = Math.floor((width - TILE_GAP * (cols - 1)) / cols);
  const tileH = Math.floor((areaHeight - TILE_GAP * (rows - 1)) / rows);
  return ids.map((id, i) => ({
    id,
    x: (i % cols) * (tileW + TILE_GAP),
    y: BAR_HEIGHT + Math.floor(i / cols) * (tileH + TILE_GAP),
    width: tileW,
    height: tileH,
    header: true,
  }));
}

// Muestra la cuenta activa (o todas, en cuadrícula) y oculta el resto.
function applyLayout() {
  if (!win || win.isDestroyed()) return;
  let ids = [];
  if (!locked && !overlayOpen) {
    ids = isGrid() ? openAccounts().map((a) => a.id) : activeId ? [activeId] : [];
  }
  tiles = computeTiles(ids);
  const now = Date.now();
  for (const tile of tiles) {
    const view = views.get(tile.id) || createView(findAccount(tile.id));
    const top = tile.header ? TILE_HEADER : 0;
    view.setBounds({ x: tile.x, y: tile.y + top, width: tile.width, height: Math.max(0, tile.height - top) });
    view.setVisible(true);
    lastUsed.set(tile.id, now);
  }
  const shown = new Set(ids);
  for (const [id, view] of views) {
    if (!shown.has(id)) view.setVisible(false);
  }
  syncNotifyState();
}

// ---------- No molestar, silencio y privacidad ----------

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function dndActive() {
  const dnd = store.get().settings.dnd;
  if (dnd.enabled) return true;
  if (!dnd.schedule) return false;
  const [from, to] = dnd.hours.split('-').map(toMinutes);
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  return from <= to ? minutes >= from && minutes < to : minutes >= from || minutes < to;
}

// Cada cuenta sabe si debe ocultar el texto (app bloqueada) o no avisar (silenciada / no molestar).
// Durante "no molestar" solo suenan las cuentas que estás mirando.
function syncNotifyState() {
  const dnd = dndActive();
  const visible = new Set(tiles.map((t) => t.id));
  for (const [id, view] of views) {
    const acc = findAccount(id);
    const muted = Boolean(acc && acc.muted);
    view.webContents.send('notify-state', {
      locked,
      suppress: muted || dnd,
      account: acc ? acc.name : '',
      custom: store.get().settings.customNotifications,
    });
    view.webContents.setAudioMuted(muted || (dnd && !visible.has(id)));
  }
}

let lastDnd = null;
function checkDndSchedule() {
  const now = dndActive();
  if (now === lastDnd) return;
  lastDnd = now;
  syncNotifyState();
  pushState();
}

function updateDnd(changes) {
  Object.assign(store.get().settings.dnd, changes);
  store.save();
  lastDnd = null;
  checkDndSchedule();
}

function applyPrivacyBlur() {
  const on = Boolean(store.get().settings.privacyBlur && win && !win.isDestroyed() && !win.isFocused());
  for (const [id, view] of views) {
    const wc = view.webContents;
    if (on && !blurKeys.has(id)) {
      blurKeys.set(id, wc.insertCSS(BLUR_CSS));
    } else if (!on && blurKeys.has(id)) {
      const pending = blurKeys.get(id);
      blurKeys.delete(id);
      pending.then((key) => { if (!wc.isDestroyed()) wc.removeInsertedCSS(key); }).catch(() => {});
    }
  }
}

// ---------- Zoom y etiquetas ----------

function setZoom(id, factor) {
  const acc = findAccount(id);
  if (!acc) return;
  acc.zoom = factor;
  views.get(id)?.webContents.setZoomFactor(factor);
  store.save();
  pushState();
}

function stepZoom(direction) {
  const acc = findAccount(activeId);
  if (!acc) return;
  const current = acc.zoom || 1;
  const i = ZOOM_STEPS.findIndex((z) => z >= current - 0.001);
  const next = direction === 0 ? 1 : ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, Math.max(0, i + direction))];
  setZoom(acc.id, next);
}

// ---------- Respuestas rápidas ----------

// Pega el texto en el chat abierto (y lo deja copiado). Nunca envía: el usuario decide.
const MAX_TEMPLATE_IMAGES = 6;

// El portapapeles de Electron es asíncrono (como el de los navegadores).
const copyText = (text) => clipboard.writeText(text).catch(() => {});
// Pega el texto como Ctrl+V. WhatsApp borra los saltos de línea si el texto se escribe de golpe,
// pero los respeta al pegarlo.
async function pasteText(wc, text) {
  if (!text) return;
  await copyText(text);
  wc.paste();
}

const copyImage = (image) => clipboard
  .write([new ClipboardItem({ 'image/png': new Blob([image.toPNG()], { type: 'image/png' }) })])
  .catch(() => {});

// {saludo}, {cuenta} y {fecha} se reemplazan al momento de usar la respuesta.
function fillVariables(text) {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour >= 5 && hour < 12 ? 'Buenos días' : hour >= 12 && hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  const acc = findAccount(activeId);
  return text
    .replace(/\{saludo\}/gi, greeting)
    .replace(/\{cuenta\}/gi, acc ? acc.name : '')
    .replace(/\{fecha\}/gi, now.toLocaleDateString('es-PE'));
}

// Pega las fotos (como Ctrl+V) y luego el texto en el chat abierto. WhatsApp muestra la vista
// previa con el texto como descripción; el usuario revisa y presiona Enter. Nunca se envía solo.
async function insertTemplate(template) {
  const text = fillVariables(template.text);
  const view = views.get(activeId);
  if (!view || locked) {
    await copyText(text);
    return;
  }
  const wc = view.webContents;
  wc.focus();
  for (const name of template.images || []) {
    const image = media.load(name);
    if (!image) continue;
    await copyImage(image);
    wc.paste();
    await sleep(900); // tiempo para que se abra la vista previa de la foto
  }
  await pasteText(wc, text);
}

function showQuickMenu() {
  if (locked) return;
  const templates = store.get().templates;
  const preview = (text) => text.replace(/\s+/g, ' ').slice(0, 40) + (text.length > 40 ? '…' : '');
  const items = templates.map((t) => ({
    label: `${t.images && t.images.length ? '📷 ' : ''}${t.title} — ${preview(t.text)}`,
    click: () => insertTemplate(t),
  }));
  if (!items.length) items.push({ label: 'Aún no tienes respuestas rápidas', enabled: false });
  items.push({ type: 'separator' }, { label: 'Administrar respuestas rápidas…', click: openTemplatesDialog });
  Menu.buildFromTemplate(items).popup({ window: win });
}

async function pickTemplateImages() {
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: 'Agregar fotos (QR de Yape/Plin, cuentas, productos)',
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Imágenes', extensions: ['png', 'jpg', 'jpeg'] }],
  });
  if (canceled) return [];
  return filePaths.slice(0, MAX_TEMPLATE_IMAGES)
    .map((file) => media.importImage(file))
    .filter(Boolean)
    .map((name) => ({ name, thumb: media.thumbnail(name) }));
}

// Respuestas de ejemplo para pagos, la primera vez. El usuario les agrega su QR y sus datos.
const STARTER_TEMPLATES = [
  ['Yape', '{saludo} 😊 Puedes pagar por Yape escaneando el QR.\nNombre: (tu nombre)\nNúmero: (tu número)\nEnvíanos la captura del pago, por favor.'],
  ['Plin', '{saludo} 😊 Puedes pagar por Plin escaneando el QR.\nNombre: (tu nombre)\nNúmero: (tu número)\nEnvíanos la captura del pago, por favor.'],
  ['Cuentas bancarias', 'Nuestras cuentas:\nBCP: (número)  CCI: (número)\nInterbank: (número)  CCI: (número)\nTitular: (nombre)\nEnvíanos la constancia cuando hagas el depósito.'],
  ['Link de pago', 'Aquí tienes tu link de pago con tarjeta 💳:\n(pega aquí el link)\nAvísanos cuando lo completes.'],
  ['Datos para envío', 'Para enviar tu pedido necesitamos:\n• Nombre completo\n• DNI\n• Celular\n• Agencia de Shalom u Olva de destino (o dirección)'],
];

function seedTemplates() {
  const data = store.get();
  if (data.templatesSeeded) return;
  data.templatesSeeded = true;
  if (!data.templates.length) {
    data.templates = STARTER_TEMPLATES.map(([title, text], i) => ({ id: `inicio${i}`, title, text, images: [] }));
  }
  store.save();
}

function openTemplatesDialog() {
  if (!locked) win.webContents.send('ui:templates');
}

function saveTemplates(list) {
  if (!Array.isArray(list)) return { ok: false, error: 'Datos no válidos.' };
  const clean = list
    .map((t) => ({
      id: typeof t.id === 'string' && /^[a-z0-9]{1,20}$/.test(t.id) ? t.id : Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title: String(t.title || '').trim().slice(0, 40),
      text: String(t.text || '').slice(0, 2000),
      images: (Array.isArray(t.images) ? t.images : [])
        .filter((name) => typeof name === 'string' && media.exists(name))
        .slice(0, MAX_TEMPLATE_IMAGES),
    }))
    .filter((t) => t.text.trim() || t.images.length);
  if (clean.length > MAX_TEMPLATES) return { ok: false, error: `Máximo ${MAX_TEMPLATES} respuestas rápidas.` };
  for (const t of clean) if (!t.title) t.title = t.text.trim().slice(0, 20) || 'Foto';
  store.get().templates = clean;
  store.save();
  media.cleanup(clean.flatMap((t) => t.images));
  pushState();
  return { ok: true };
}

// ---------- Notificaciones con respuesta ----------

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function showServiceNotification(id, payload) {
  const acc = findAccount(id);
  if (!acc) return;
  notifier.show({
    kind: 'message',
    accountId: id,
    accountName: acc.name,
    notifId: payload.id,
    title: locked ? 'Mensaje nuevo' : payload.title,
    body: locked ? 'Desbloquea MultiChat Pro para verlo' : payload.body,
    icon: locked ? '' : payload.icon,
    canReply: !locked,
  });
}

// Ventanita "Actualizando MultiChat Pro…" mientras se cierra para instalar la versión nueva.
function showUpdatingWindow() {
  const box = new BrowserWindow({
    width: 340,
    height: 128,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    backgroundColor: '#140b2e',
    webPreferences: { sandbox: true, contextIsolation: true },
  });
  box.loadFile(path.join(__dirname, '..', 'ui', 'updating.html'));
  box.once('ready-to-show', () => box.show());
}

// Al abrir una versión nueva: aviso "Se actualizó a vX" (una sola vez).
function announceUpdated() {
  const { settings } = store.get();
  const version = app.getVersion();
  if (settings.lastVersion && settings.lastVersion !== version) {
    notifier.show({
      kind: 'updated',
      accountName: 'MultiChat Pro',
      title: `✓ Actualizada a la versión ${version}`,
      body: 'Mira las novedades haciendo clic en el logo de MultiChat Pro.',
      canReply: false,
    });
  }
  settings.lastVersion = version;
  store.save();
}

function openFromNotification(data) {
  showWindow();
  if (data.kind === 'payment') return showTodayPayments();
  if (data.kind === 'update') return updater.install();
  if (data.kind === 'updated') return win.webContents.send('ui:about');
  if (!data.accountId || !findAccount(data.accountId)) return;
  setActive(data.accountId);
  if (data.notifId) views.get(data.accountId)?.webContents.send('notify-open', data.notifId);
}

// Corre dentro de la página: espera a que se abra el chat de la notificación y deja el cursor en la caja de mensaje.
// Solo en WhatsApp se puede comprobar que el chat abierto es el correcto (por su encabezado).
async function composeInPage(title, service) {
  const sleepInPage = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const composer = () => (service === 'whatsapp'
    ? document.querySelector('#main footer [contenteditable="true"]')
    : document.querySelector('#editable-message-text, .input-message-input[contenteditable="true"], [contenteditable="true"][role="textbox"], textarea'));
  const chatMatches = () => {
    if (service !== 'whatsapp' || !title) return false;
    const header = document.querySelector('#main header');
    return Boolean(header && norm(header.innerText).includes(norm(title)));
  };
  for (let i = 0; i < 30 && !(composer() && (service !== 'whatsapp' || chatMatches())); i++) await sleepInPage(100);
  const box = composer();
  if (!box) return { ready: false, verified: false };
  box.focus();
  return { ready: true, verified: chatMatches() };
}

// Responde desde la notificación. Solo se envía solo si se confirmó que el chat abierto es el
// del remitente; si no, se abre la app con la respuesta escrita para que el usuario la envíe.
async function replyFromNotification(data, text) {
  const acc = findAccount(data.accountId);
  const view = views.get(data.accountId);
  if (!acc || !view || locked || !text.trim()) return { sent: false };
  const wc = view.webContents;
  if (!win.isVisible()) setActive(acc.id);
  wc.send('notify-open', data.notifId);
  const script = `(${composeInPage.toString()})(${JSON.stringify(data.title)}, ${JSON.stringify(acc.service)})`;
  const result = await wc.executeJavaScript(script, true).catch(() => ({ ready: false, verified: false }));
  if (result.ready) {
    wc.focus();
    await pasteText(wc, text);
    await sleep(200);
  }
  if (result.ready && result.verified) {
    wc.sendInputEvent({ type: 'keyDown', keyCode: 'Enter' });
    wc.sendInputEvent({ type: 'char', keyCode: '\r' });
    wc.sendInputEvent({ type: 'keyUp', keyCode: 'Enter' });
    await sleep(700);
    const empty = await wc.executeJavaScript(
      "!(document.querySelector('#main footer [contenteditable=\"true\"]') || {}).innerText?.trim()", true,
    ).catch(() => false);
    if (empty) return { sent: true };
  }
  if (!result.ready) await copyText(text);
  showWindow();
  setActive(acc.id);
  return { sent: false };
}

// ---------- Tema claro / oscuro ----------

function applyTheme() {
  nativeTheme.themeSource = store.get().settings.theme;
}

function setTheme(theme) {
  store.get().settings.theme = theme;
  store.save();
  applyTheme();
  pushState();
}

// ---------- Recordatorios ----------

function reminders() {
  return store.get().reminders;
}

function saveReminder({ accountId, note, at }) {
  const date = new Date(at);
  if (!findAccount(accountId)) return { ok: false, error: 'Elige una cuenta.' };
  if (Number.isNaN(date.getTime()) || date.getTime() < Date.now() - 60_000) {
    return { ok: false, error: 'Elige una fecha y hora futura.' };
  }
  reminders().push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    accountId,
    note: String(note || '').trim().slice(0, 300),
    at: date.toISOString(),
  });
  reminders().sort((a, b) => a.at.localeCompare(b.at));
  store.save();
  pushState();
  return { ok: true };
}

function deleteReminder(id) {
  store.get().reminders = reminders().filter((r) => r.id !== id);
  store.save();
  pushState();
}

function checkReminders() {
  const now = new Date().toISOString();
  const due = reminders().filter((r) => r.at <= now);
  if (!due.length) return;
  for (const r of due) {
    const acc = findAccount(r.accountId);
    notifier.show({
      kind: 'reminder',
      accountId: r.accountId,
      accountName: acc ? acc.name : 'MultiChat Pro',
      title: '⏰ Recordatorio',
      body: locked ? 'Tienes un recordatorio pendiente' : (r.note || 'Revisar este chat'),
      canReply: false,
    });
  }
  store.get().reminders = reminders().filter((r) => r.at > now);
  store.save();
  pushState();
}

function openReminderDialog(accountId, note = '') {
  if (locked) return;
  win.webContents.send('ui:reminder', { accountId: accountId || activeId, note });
}

function showRemindersMenu() {
  if (locked) return;
  const items = reminders().map((r) => {
    const acc = findAccount(r.accountId);
    const when = new Date(r.at).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
    const note = r.note ? ` — ${r.note.slice(0, 40)}${r.note.length > 40 ? '…' : ''}` : '';
    return {
      label: `${when} · ${acc ? acc.name : '¿?'}${note}`,
      submenu: [
        { label: 'Abrir cuenta', enabled: Boolean(acc && !acc.closed), click: () => setActive(r.accountId) },
        { label: 'Eliminar recordatorio', click: () => deleteReminder(r.id) },
      ],
    };
  });
  if (!items.length) items.push({ label: 'No tienes recordatorios pendientes', enabled: false });
  items.push({ type: 'separator' }, { label: 'Nuevo recordatorio…', click: () => openReminderDialog(activeId) });
  Menu.buildFromTemplate(items).popup({ window: win });
}

// ---------- Registro de ventas ----------

// ---------- Tickets de envío (ticketera) ----------

const CHANNEL_BY_SERVICE = { whatsapp: 'WhatsApp', messenger: 'Facebook', metabusiness: 'Facebook', instagram: 'Instagram' };

function seedTicketProfiles() {
  const data = store.get();
  if (!data.ticketProfilesSeeded) {
    data.ticketProfilesSeeded = true;
    if (!data.ticketProfiles.length) {
      data.ticketProfiles = tickets.seedProfiles(ticketImages, path.join(__dirname, '..', 'build', 'ticket'));
    }
    store.save();
  }
  // Una vez: recorta los bordes en blanco de los logos subidos antes de la v1.2.2, para que salgan a su tamaño.
  if (!data.ticketLogosTrimmed) {
    data.ticketLogosTrimmed = true;
    for (const profile of data.ticketProfiles) if (profile.logo) ticketImages.trimStored(profile.logo);
    store.save();
  }
}

function ticketProfileView(profile) {
  return { ...profile, logoUrl: ticketImages.dataUrl(profile.logo), qrUrl: ticketImages.dataUrl(profile.qr) };
}

// Abre el panel del ticket con los datos detectados en el texto que el usuario seleccionó.
function openTicketFor(id, selection = '') {
  if (locked) return;
  const acc = findAccount(id || activeId);
  win.webContents.send('ticket:new', {
    accountId: acc ? acc.id : null,
    channel: acc ? CHANNEL_BY_SERVICE[acc.service] || 'WhatsApp' : 'WhatsApp',
    prefill: tickets.parseSelection(selection, sales.parseSelection(selection.replace(/[*_~]/g, ''))),
  });
}

// ---------- Formularios para pedir los datos de envío ----------

function shippingForms() {
  const settings = store.get().settings;
  if (!settings.shippingForms) settings.shippingForms = { ...tickets.DEFAULT_FORMS };
  return settings.shippingForms;
}

// Pega el formulario de Shalom u Olva en el chat abierto; el usuario lo revisa y presiona Enter.
async function pasteShippingForm(carrier) {
  const view = views.get(activeId);
  const text = shippingForms()[carrier];
  if (!view || locked || !text) return;
  view.webContents.focus();
  await pasteText(view.webContents, text);
}

function shippingFormItems() {
  return [
    { label: 'Formulario Shalom (agencia)', click: () => pasteShippingForm('Shalom') },
    { label: 'Formulario Olva (domicilio)', click: () => pasteShippingForm('Olva') },
    { type: 'separator' },
    { label: 'Editar formularios…', click: () => win.webContents.send('ui:forms') },
  ];
}

function saveShippingForms(forms) {
  if (!forms || typeof forms !== 'object') return { ok: false, error: 'Datos no válidos.' };
  const clean = {};
  for (const carrier of ['Shalom', 'Olva']) {
    clean[carrier] = String(forms[carrier] || '').slice(0, 2000).trim() || tickets.DEFAULT_FORMS[carrier];
  }
  store.get().settings.shippingForms = clean;
  store.save();
  return { ok: true };
}

async function openTicketFromSelection() {
  const view = views.get(activeId);
  let selection = '';
  if (view) {
    try {
      selection = String(await view.webContents.executeJavaScript('String(window.getSelection())', true));
    } catch {
      selection = '';
    }
  }
  openTicketFor(activeId, selection);
}

// Dibuja el ticket en una ventana oculta con la medida del papel: 72 × 297 mm, siempre la misma.
// Con la hoja igual a la de la ticketera, el ticket empieza arriba (sin espacio en blanco).
async function renderTicketWindow(ticket) {
  const profiles = store.get().ticketProfiles;
  const profile = profiles.find((p) => p.id === ticket.profileId) || profiles[0] || {};
  const page = new BrowserWindow({ show: false, width: 320, height: 1200, webPreferences: { sandbox: true, contextIsolation: true } });
  await page.loadFile(path.join(__dirname, '..', 'ui', 'ticket.html'));
  await page.webContents.executeJavaScript(`
    renderTicket(document.getElementById('page'), ${JSON.stringify(ticket)}, ${JSON.stringify(ticketProfileView(profile))});
    Promise.all([...document.images].map((img) => img.complete ? 1 : new Promise((r) => { img.addEventListener('load', r); img.addEventListener('error', r); })));
  `);
  const heightMm = tickets.PAGE_MM.height;
  return { page, heightMm };
}

// Imprime (con el diálogo de Windows para elegir la ticketera) o guarda el ticket en PDF.
// `printer`: nombre de la ticketera para imprimir directo (sin diálogo); vacío = mostrar el diálogo de Windows.
// No se guarda ningún dato del destinatario: solo se imprime.
async function printTicket(input, { pdf = false, printer = '' } = {}) {
  const ticket = tickets.sanitizeTicket(input || {});
  if (!ticket.name) return { ok: false, error: 'Escribe el nombre del destinatario.' };
  const { page, heightMm } = await renderTicketWindow(ticket);
  let result;
  try {
    if (pdf) {
      const data = await page.webContents.printToPDF({
        pageSize: { width: tickets.PAGE_MM.width / 25.4, height: heightMm / 25.4 },
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        printBackground: true,
        preferCSSPageSize: true,
      });
      const safeName = ticket.name.replace(/[^\w áéíóúñÁÉÍÓÚÑ-]/g, '').trim().replace(/\s+/g, '-').slice(0, 40) || 'cliente';
      const { canceled, filePath } = await dialog.showSaveDialog(win, {
        title: 'Guardar ticket en PDF',
        defaultPath: `ticket-${ticket.carrier.toLowerCase()}-${safeName}.pdf`,
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
      });
      if (canceled || !filePath) return { ok: false, canceled: true };
      fs.writeFileSync(filePath, data);
      result = { ok: true, file: filePath };
    } else {
      const printers = await page.webContents.getPrintersAsync();
      const device = printers.find((p) => p.name === printer);
      if (printer && !device) return { ok: false, error: `No se encuentra la impresora "${printer}". Revisa que esté conectada.` };
      result = await new Promise((resolve) => {
        page.webContents.print({
          silent: Boolean(device),
          deviceName: device ? device.name : undefined,
          printBackground: true,
          margins: { marginType: 'none' },
          pageSize: { width: Math.round(tickets.PAGE_MM.width * 1000), height: Math.round(heightMm * 1000) },
        }, (success, reason) => resolve(success ? { ok: true } : { ok: false, canceled: reason === 'Print job canceled', error: reason }));
      });
    }
  } finally {
    page.destroy();
  }
  store.get().settings.lastTicketProfile = ticket.profileId;
  if (!pdf && result.ok) store.get().settings.ticketPrinter = printer;
  store.save();
  return result;
}

// Abre imágenes que nativeImage no lee (WebP, GIF, BMP) con Chromium y las pasa a PNG.
async function decodeImage(file) {
  const image = nativeImage.createFromPath(file);
  if (!image.isEmpty()) return image;
  const page = new BrowserWindow({ show: false, webPreferences: { sandbox: true, contextIsolation: true } });
  try {
    await page.loadURL(pathToFileURL(file).href);
    const dataUrl = await page.webContents.executeJavaScript(`(async () => {
      const img = document.querySelector('img');
      if (!img) return '';
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d').drawImage(img, 0, 0);
      return canvas.toDataURL('image/png');
    })()`);
    return dataUrl ? nativeImage.createFromDataURL(dataUrl) : image;
  } catch {
    return image;
  } finally {
    page.destroy();
  }
}

async function pickTicketImage(kind) {
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: 'Elegir imagen (logo o QR)',
    properties: ['openFile'],
    filters: [{ name: 'Imágenes', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'] }],
  });
  if (canceled || !filePaths[0]) return null;
  const name = ticketImages.importImage(await decodeImage(filePaths[0]), { trim: kind === 'logo' });
  if (!name) return null;
  const { width, height } = ticketImages.load(name).getSize();
  return { name, url: ticketImages.dataUrl(name), width, height };
}

function saveTicketProfiles(list) {
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Debe haber al menos un remitente.' };
  const clean = list.slice(0, 20).map((p) => tickets.sanitizeProfile(p || {}, ticketImages));
  store.get().ticketProfiles = clean;
  store.save();
  ticketImages.cleanup(clean.flatMap((p) => [p.logo, p.qr]).filter(Boolean));
  return { ok: true };
}

// ---------- Envíos (Shalom / Olva) ----------

function shipmentView(sale) {
  return { ...sale, receiptThumb: sale.receipt ? receipts.thumbnail(sale.receipt) : null };
}

function saveSaleAndRefresh(sale) {
  const result = sales.save(sale);
  if (result.ok) receipts.cleanup(sales.usedReceipts());
  pushState();
  return result;
}

async function attachReceipt(id) {
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: 'Foto de la boleta o guía de envío',
    properties: ['openFile'],
    filters: [{ name: 'Imágenes', extensions: ['png', 'jpg', 'jpeg'] }],
  });
  if (canceled || !filePaths[0]) return null;
  const name = receipts.importImage(filePaths[0]);
  if (!name) return null;
  const result = sales.updateShipment(id, { receipt: name });
  receipts.cleanup(sales.usedReceipts());
  return result.ok ? shipmentView(result.sale) : null;
}

function trackShipment(id) {
  const sale = sales.get(id);
  if (!sale) return { ok: false };
  const url = store.get().settings.trackingUrls[sale.carrier];
  if (!url) return { ok: false, needUrl: sale.carrier === 'Shalom' || sale.carrier === 'Olva', carrier: sale.carrier };
  if (sale.orderNumber) copyText(sale.orderNumber);
  shell.openExternal(url);
  return { ok: true, copied: Boolean(sale.orderNumber) };
}

function setTrackingUrl(carrier, url) {
  const clean = String(url || '').trim();
  if (!['Shalom', 'Olva'].includes(carrier)) return { ok: false, error: 'Empresa no válida.' };
  if (clean && !/^https?:\/\/[^\s]+$/i.test(clean)) return { ok: false, error: 'Pega la dirección completa, por ejemplo https://…' };
  store.get().settings.trackingUrls[carrier] = clean;
  store.save();
  return { ok: true };
}

function shippingMessage(sale) {
  const hour = new Date().getHours();
  const greeting = hour >= 5 && hour < 12 ? 'Buenos días' : hour >= 12 && hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  const firstName = sale.customer.split(' ')[0] || '';
  const url = store.get().settings.trackingUrls[sale.carrier];
  const lines = [`${greeting}${firstName ? ` ${firstName}` : ''} 👋`];
  if (sale.carrier === 'Recojo en tienda') {
    lines.push('Tu pedido ya está listo para recoger en tienda 🏪');
  } else {
    lines.push(`Tu pedido fue enviado por ${sale.carrier} 🚚`);
    if (sale.orderNumber) lines.push(`N° de orden: ${sale.orderNumber}`);
    if (sale.destination) lines.push(`Destino: ${sale.destination}`);
    if (url) lines.push(`Puedes rastrearlo aquí: ${url}`);
    if (sale.receipt) lines.push('Te adjuntamos la foto de la boleta.');
  }
  lines.push('¡Gracias por tu compra! 🐾');
  return lines.join('\n');
}

// Espera (en la página de WhatsApp) a que el chat esté abierto y listo para escribir.
async function waitForComposer(wc, timeout) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const ready = await wc.executeJavaScript(
      "(() => { const box = document.querySelector('#main footer [contenteditable=\"true\"]'); if (box) box.focus(); return Boolean(box); })()", true,
    ).catch(() => false);
    if (ready) return true;
    await sleep(500);
  }
  return false;
}

// Pega la boleta y el mensaje de envío en el chat del cliente. El usuario revisa y presiona Enter.
// Si la venta tiene celular y es WhatsApp, abre ese chat con el enlace oficial de WhatsApp.
async function sendShipmentToCustomer(id) {
  const sale = sales.get(id);
  if (!sale || locked) return { ok: false, error: 'Venta no encontrada.' };
  const acc = openAccounts().find((a) => a.name === sale.account) || findAccount(activeId);
  if (!acc) return { ok: false, error: 'Abre la cuenta de WhatsApp de esta venta.' };
  setActive(acc.id);
  const wc = views.get(acc.id).webContents;
  let openedChat = false;
  if (acc.service === 'whatsapp' && sale.phone) {
    const phone = sale.phone.length === 9 ? `51${sale.phone}` : sale.phone;
    await wc.loadURL(`https://web.whatsapp.com/send?phone=${phone}`).catch(() => {});
    openedChat = await waitForComposer(wc, 25_000);
  }
  wc.focus();
  const image = sale.receipt ? receipts.load(sale.receipt) : null;
  if (image) {
    await copyImage(image);
    wc.paste();
    await sleep(900);
  }
  await pasteText(wc, shippingMessage(sale));
  return { ok: true, openedChat };
}

async function exportSales() {
  const date = new Date().toISOString().slice(0, 10);
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: 'Exportar ventas a Excel',
    defaultPath: `ventas-${date}.csv`,
    filters: [{ name: 'Excel (CSV)', extensions: ['csv'] }],
  });
  if (canceled || !filePath) return false;
  fs.writeFileSync(filePath, sales.toCsv());
  shell.showItemInFolder(filePath);
  return true;
}

// ---------- Copia de seguridad ----------

const SAFE_ID = /^[a-z]+-[a-z0-9]+$/;

async function exportBackup() {
  const date = new Date().toISOString().slice(0, 10);
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: 'Exportar configuración',
    defaultPath: `multichat-pro-${date}.json`,
    filters: [{ name: 'Copia de MultiChat Pro', extensions: ['json'] }],
  });
  if (canceled || !filePath) return;
  const data = store.get();
  const backup = {
    app: APP_NAME,
    version: app.getVersion(),
    exportedAt: new Date().toISOString(),
    accounts: data.accounts,
    templates: data.templates,
    settings: data.settings,
  };
  fs.writeFileSync(filePath, JSON.stringify(backup, null, 2));
  dialog.showMessageBox(win, {
    type: 'info',
    title: 'Copia de seguridad',
    message: 'Configuración exportada.',
    detail: 'Incluye tus pestañas (nombres, colores, ajustes), respuestas rápidas y configuración.\nNo incluye las sesiones de WhatsApp ni la contraseña.',
  });
}

async function importBackup() {
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: 'Importar configuración',
    properties: ['openFile'],
    filters: [{ name: 'Copia de MultiChat Pro', extensions: ['json'] }],
  });
  if (canceled || !filePaths[0]) return;
  let backup;
  try {
    backup = JSON.parse(fs.readFileSync(filePaths[0], 'utf8'));
    if (backup.app !== APP_NAME || !Array.isArray(backup.accounts)) throw new Error('formato');
  } catch {
    dialog.showMessageBox(win, { type: 'error', title: 'Importar', message: 'El archivo no es una copia válida de MultiChat Pro.' });
    return;
  }
  const data = store.get();
  let added = 0;
  for (const a of backup.accounts) {
    if (!a || !SAFE_ID.test(a.id) || !SERVICES[a.service] || findAccount(a.id)) continue;
    data.accounts.push({
      id: a.id,
      service: a.service,
      name: String(a.name || SERVICES[a.service].short).slice(0, 40),
      keepAlive: Boolean(a.keepAlive),
      muted: Boolean(a.muted),
      closed: Boolean(a.closed),
      tag: TAG_COLORS.some(([, c]) => c === a.tag) ? a.tag : null,
      zoom: ZOOM_STEPS.includes(a.zoom) ? a.zoom : 1,
    });
    added++;
  }
  const templates = Array.isArray(backup.templates) ? backup.templates : [];
  const known = new Set(data.templates.map((t) => t.id));
  saveTemplates([...data.templates, ...templates.filter((t) => t && !known.has(t.id))].slice(0, MAX_TEMPLATES));
  if (backup.settings && typeof backup.settings === 'object') {
    for (const [key, value] of Object.entries(store.DEFAULTS.settings)) {
      if (key !== 'dnd' && typeof backup.settings[key] === typeof value) data.settings[key] = backup.settings[key];
    }
  }
  store.save();
  win.setAlwaysOnTop(data.settings.alwaysOnTop);
  applyLayout();
  pushState();
  dialog.showMessageBox(win, {
    type: 'info',
    title: 'Importar',
    message: `Se importaron ${added} pestañas y tus respuestas rápidas.`,
    detail: added ? 'Las cuentas nuevas pedirán escanear el código QR la primera vez.' : '',
  });
}

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 760,
    minHeight: 480,
    title: APP_NAME,
    icon: ICON,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#140b2e',
    webPreferences: {
      preload: path.join(__dirname, 'preload-ui.js'),
      contextIsolation: true,
      sandbox: true,
      autoplayPolicy: 'no-user-gesture-required', // el "ding" de los pagos suena aunque no se haya hecho clic
    },
  });
  win.setMenuBarVisibility(false);
  win.setAlwaysOnTop(store.get().settings.alwaysOnTop);
  win.on('focus', applyPrivacyBlur);
  win.on('blur', applyPrivacyBlur);
  win.loadFile(path.join(__dirname, '..', 'ui', 'index.html'));
  win.once('ready-to-show', () => {
    if (!startHidden) win.show();
  });
  win.on('resize', () => {
    applyLayout();
    pushState();
  });
  win.on('close', (event) => {
    if (!quitting && store.get().settings.closeToTray) {
      event.preventDefault();
      win.hide();
    }
  });
  win.on('page-title-updated', (e) => e.preventDefault());
  win.webContents.on('before-input-event', (event, input) => handleShortcut(event, input));
  // La barra siempre al 100 %: si se agranda con Ctrl + rueda, los paneles dejan de calzar con los chats.
  win.webContents.on('did-finish-load', () => win.webContents.setZoomFactor(1));
  win.webContents.on('zoom-changed', () => win.webContents.setZoomFactor(1));
}

function showWindow() {
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
}

function pushState() {
  if (!win || win.isDestroyed()) return;
  const data = store.get();
  const list = openAccounts().map((a) => ({
    ...a,
    serviceName: SERVICES[a.service].name,
    color: SERVICES[a.service].color,
    unread: unread.get(a.id) || 0,
    favicon: favicons.get(a.id) || null,
    loaded: views.has(a.id),
  }));
  const total = list.reduce((sum, a) => sum + (a.muted ? 0 : a.unread), 0);
  win.setTitle(total ? `(${total}) ${APP_NAME}` : APP_NAME);
  if (tray) tray.setToolTip(total ? `${APP_NAME} — ${total} sin leer` : APP_NAME);
  if (process.platform !== 'win32') app.setBadgeCount(total);
  win.webContents.send('state', {
    accounts: list,
    activeId,
    total,
    layout: data.settings.layout,
    tiles: tiles.filter((t) => t.header),
    locked,
    dnd: dndActive(),
    dark: nativeTheme.shouldUseDarkColors,
    reminderCount: data.reminders.length,
    pendingShipments: sales.pendingShipments().length,
    templateCount: data.templates.length,
    hasPassword: Boolean(data.lock),
    securityQuestion: data.lock ? data.lock.question : null,
    version: app.getVersion(),
    creator: CREATOR,
    creatorYape: CREATOR_YAPE,
  });
}

function createTray() {
  tray = new Tray(nativeImage.createFromPath(ICON).resize({ width: 16, height: 16 }));
  tray.setToolTip(APP_NAME);
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: `Abrir ${APP_NAME}`, click: showWindow },
    { label: 'Bloquear', click: lockApp },
    { type: 'separator' },
    { label: 'Salir', click: quit },
  ]));
  tray.on('click', showWindow);
}

function quit() {
  quitting = true;
  app.quit();
}

// ---------- Contraseña ----------

function lockApp() {
  if (!store.get().lock || locked) return;
  locked = true;
  applyLayout();
  pushState();
}

function unlockApp() {
  locked = false;
  applyLayout();
  views.get(activeId)?.webContents.focus();
  pushState();
}

// Pequeña espera tras un intento fallido para que no se pueda adivinar a la fuerza.
const failDelay = () => new Promise((resolve) => setTimeout(resolve, 700));

async function tryUnlock(password) {
  const lock = store.get().lock;
  if (!lock || !verifySecret(password, lock.password)) {
    await failDelay();
    return false;
  }
  unlockApp();
  return true;
}

async function resetPassword(answer, password) {
  const lock = store.get().lock;
  if (!lock) return { ok: false, error: 'No hay contraseña configurada.' };
  if (String(password || '').length < MIN_PASSWORD) {
    return { ok: false, error: `La nueva contraseña debe tener al menos ${MIN_PASSWORD} caracteres.` };
  }
  if (!verifySecret(normalizeAnswer(answer), lock.answer)) {
    await failDelay();
    return { ok: false, error: 'La respuesta no es correcta.' };
  }
  lock.password = hashSecret(password);
  store.save();
  unlockApp();
  return { ok: true };
}

async function savePassword({ mode, current, password, question, answer }) {
  const data = store.get();
  if (mode !== 'setup') {
    if (!data.lock || !verifySecret(current, data.lock.password)) {
      await failDelay();
      return { ok: false, error: 'La contraseña actual no es correcta.' };
    }
  }
  if (mode === 'remove') {
    data.lock = null;
    store.save();
    pushState();
    return { ok: true };
  }
  if (String(password || '').length < MIN_PASSWORD) {
    return { ok: false, error: `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.` };
  }
  if (mode === 'setup') {
    const q = String(question || '').trim();
    const a = normalizeAnswer(answer);
    if (!q || !a) return { ok: false, error: 'Escribe la pregunta de seguridad y su respuesta.' };
    data.lock = { password: hashSecret(password), question: q.slice(0, 120), answer: hashSecret(a) };
  } else {
    data.lock.password = hashSecret(password);
  }
  store.save();
  pushState();
  return { ok: true };
}

function checkAutoLock() {
  const minutes = store.get().settings.autoLockMinutes;
  if (minutes && powerMonitor.getSystemIdleTime() >= minutes * 60) lockApp();
}

// ---------- Menús ----------

function showEditMenu(wc, params) {
  const template = [];
  if (params.linkURL) {
    template.push(
      { label: 'Abrir enlace en el navegador', click: () => shell.openExternal(params.linkURL) },
      { label: 'Copiar enlace', click: () => copyText(params.linkURL) },
      { type: 'separator' },
    );
  }
  if (params.hasImageContents) {
    template.push({ label: 'Copiar imagen', click: () => wc.copyImageAt(params.x, params.y) }, { type: 'separator' });
  }
  const selection = params.selectionText.trim();
  template.push(
    {
      label: selection ? '🖨 Imprimir ticket de envío con lo seleccionado' : '🖨 Imprimir ticket de envío…',
      click: () => openTicketFor(idForWebContents(wc), selection),
    },
    { label: '📝 Pedir datos de envío', submenu: shippingFormItems() },
    { label: 'Recordarme de este chat…', click: () => openReminderDialog(idForWebContents(wc), selection.slice(0, 300)) },
    { type: 'separator' },
    { label: 'Cortar', role: 'cut', enabled: params.editFlags.canCut },
    { label: 'Copiar', role: 'copy', enabled: params.editFlags.canCopy },
    { label: 'Pegar', role: 'paste', enabled: params.editFlags.canPaste },
    { type: 'separator' },
    { label: 'Seleccionar todo', role: 'selectAll' },
  );
  Menu.buildFromTemplate(template).popup({ window: win });
}

function showAddMenu() {
  const template = Object.entries(SERVICES).map(([key, svc]) => ({
    label: svc.name,
    click: () => addAccount(key),
  }));
  const closed = accounts().filter((a) => a.closed && SERVICES[a.service]);
  template.push(
    { type: 'separator' },
    {
      label: 'Pestañas cerradas',
      enabled: closed.length > 0,
      submenu: closed.map((a) => ({
        label: `${a.name} (${SERVICES[a.service].name})`,
        submenu: [
          { label: 'Volver a abrir', click: () => reopenTab(a.id) },
          { label: 'Eliminar definitivamente…', click: () => confirmDelete(a.id) },
        ],
      })),
    },
  );
  Menu.buildFromTemplate(template).popup({ window: win });
}

function showTabMenu(id) {
  const acc = findAccount(id);
  if (!acc) return;
  const loaded = views.has(id);
  Menu.buildFromTemplate([
    { label: 'Renombrar', click: () => win.webContents.send('tab:start-rename', id) },
    { label: '🖨 Imprimir ticket de envío…', click: () => openTicketFor(id) },
    { label: 'Recordarme de esta cuenta…', click: () => openReminderDialog(id) },
    { label: 'Recargar', enabled: loaded, click: () => views.get(id)?.webContents.reload() },
    { type: 'separator' },
    {
      label: 'Siempre activa (no se suspende)',
      type: 'checkbox',
      checked: acc.keepAlive,
      click: () => { acc.keepAlive = !acc.keepAlive; store.save(); pushState(); },
    },
    {
      label: 'Silenciar notificaciones',
      type: 'checkbox',
      checked: acc.muted,
      click: () => {
        acc.muted = !acc.muted;
        store.save();
        syncNotifyState();
        pushState();
      },
    },
    {
      label: 'Color de etiqueta',
      submenu: TAG_COLORS.map(([label, color]) => ({
        label,
        type: 'radio',
        checked: (acc.tag || null) === color,
        click: () => { acc.tag = color; store.save(); pushState(); },
      })),
    },
    {
      label: `Zoom (${Math.round((acc.zoom || 1) * 100)}%)`,
      submenu: ZOOM_STEPS.map((z) => ({
        label: `${Math.round(z * 100)}%`,
        type: 'radio',
        checked: Math.abs((acc.zoom || 1) - z) < 0.001,
        click: () => setZoom(id, z),
      })),
    },
    {
      label: 'Suspender ahora (liberar memoria)',
      enabled: loaded && !tiles.some((t) => t.id === id),
      click: () => hibernate(id),
    },
    { type: 'separator' },
    { label: 'Cerrar pestaña', accelerator: 'CmdOrCtrl+W', click: () => closeTab(id) },
    { label: 'Eliminar cuenta…', click: () => confirmDelete(id) },
  ]).popup({ window: win });
}

function setLayout(layout) {
  store.get().settings.layout = layout;
  store.save();
  applyLayout();
  pushState();
}

function showSettingsMenu() {
  const data = store.get();
  const settings = data.settings;
  const radio = (key, value, label) => ({
    label,
    type: 'radio',
    checked: settings[key] === value,
    click: () => { settings[key] = value; store.save(); },
  });
  const openPasswordDialog = (mode) => win.webContents.send('ui:password', mode);

  const security = data.lock
    ? [
      { label: 'Bloquear ahora', accelerator: 'CmdOrCtrl+L', click: lockApp },
      { label: 'Cambiar contraseña…', click: () => openPasswordDialog('change') },
      { label: 'Quitar contraseña…', click: () => openPasswordDialog('remove') },
      {
        label: 'Bloqueo automático',
        submenu: [
          radio('autoLockMinutes', 0, 'Nunca'),
          radio('autoLockMinutes', 5, 'Tras 5 minutos sin usar la PC'),
          radio('autoLockMinutes', 15, 'Tras 15 minutos sin usar la PC'),
          radio('autoLockMinutes', 30, 'Tras 30 minutos sin usar la PC'),
          radio('autoLockMinutes', 60, 'Tras 1 hora sin usar la PC'),
        ],
      },
    ]
    : [{ label: 'Poner contraseña…', click: () => openPasswordDialog('setup') }];

  Menu.buildFromTemplate([
    {
      label: 'Vista',
      submenu: [
        { label: 'Una cuenta a la vez', type: 'radio', checked: !isGrid(), click: () => setLayout('single') },
        { label: 'Varias a la vez (cuadrícula)', type: 'radio', checked: isGrid(), accelerator: 'CmdOrCtrl+G', click: () => setLayout('grid') },
      ],
    },
    {
      label: 'Horario de atención y no molestar',
      submenu: [
        {
          label: 'Avisar solo en horario de atención',
          type: 'checkbox',
          checked: settings.dnd.schedule,
          click: () => updateDnd({ schedule: !settings.dnd.schedule }),
        },
        { type: 'separator' },
        ...ATTENTION_HOURS.map(([start, end]) => ({
          label: `Atención de ${start} a ${end}`,
          type: 'radio',
          checked: settings.dnd.hours === `${end}-${start}`,
          click: () => updateDnd({ hours: `${end}-${start}`, schedule: true }),
        })),
        { type: 'separator' },
        {
          label: 'No molestar ahora (silenciar todo)',
          type: 'checkbox',
          checked: settings.dnd.enabled,
          click: () => updateDnd({ enabled: !settings.dnd.enabled }),
        },
      ],
    },
    {
      label: 'Apariencia',
      submenu: [
        { label: 'Claro', type: 'radio', checked: settings.theme === 'light', click: () => setTheme('light') },
        { label: 'Oscuro', type: 'radio', checked: settings.theme === 'dark', click: () => setTheme('dark') },
        { label: 'Igual que Windows', type: 'radio', checked: settings.theme === 'system', click: () => setTheme('system') },
      ],
    },
    {
      label: 'Notificaciones con botón Responder',
      type: 'checkbox',
      checked: settings.customNotifications,
      click: () => {
        settings.customNotifications = !settings.customNotifications;
        store.save();
        syncNotifyState();
      },
    },
    {
      label: 'Avisos de Yape y Plin (Enlace Móvil)',
      submenu: [
        {
          label: 'Avisar cuando llegue un Yape o Plin',
          type: 'checkbox',
          checked: settings.paymentAlerts,
          click: () => { settings.paymentAlerts = !settings.paymentAlerts; store.save(); pushPayments(); },
        },
        {
          label: 'Decir los pagos en voz alta',
          type: 'checkbox',
          checked: settings.paymentVoice,
          click: () => { settings.paymentVoice = !settings.paymentVoice; store.save(); },
        },
        {
          label: 'Probar aviso y voz',
          click: () => onPayment({ app: 'Yape', name: 'Melissa Galvez', amount: 50, at: Date.now(), test: true }),
        },
        { type: 'separator' },
        { label: 'Pagos de hoy…', click: showTodayPayments },
        { label: 'Revisar notificaciones de Enlace Móvil…', click: showPhoneLinkCheck },
      ],
    },
    { label: 'Respuestas rápidas…', click: openTemplatesDialog },
    {
      label: 'Páginas de rastreo',
      submenu: ['Shalom', 'Olva'].map((carrier) => ({
        label: `${carrier}: ${settings.trackingUrls[carrier] || '(sin configurar)'}…`,
        click: () => win.webContents.send('ui:tracking-url', { carrier, url: settings.trackingUrls[carrier] }),
      })),
    },
    { type: 'separator' },
    ...security,
    {
      label: 'Difuminar chats al salir de la app',
      type: 'checkbox',
      checked: settings.privacyBlur,
      click: () => { settings.privacyBlur = !settings.privacyBlur; store.save(); applyPrivacyBlur(); },
    },
    { type: 'separator' },
    {
      label: 'Mantener siempre encima',
      type: 'checkbox',
      checked: settings.alwaysOnTop,
      click: () => {
        settings.alwaysOnTop = !settings.alwaysOnTop;
        win.setAlwaysOnTop(settings.alwaysOnTop);
        store.save();
      },
    },
    {
      label: 'Suspender cuentas inactivas',
      submenu: [
        radio('hibernateMinutes', 0, 'Nunca'),
        radio('hibernateMinutes', 5, 'Después de 5 minutos'),
        radio('hibernateMinutes', 15, 'Después de 15 minutos'),
        radio('hibernateMinutes', 30, 'Después de 30 minutos'),
        radio('hibernateMinutes', 60, 'Después de 1 hora'),
      ],
    },
    {
      label: 'Al cerrar, seguir en la bandeja',
      type: 'checkbox',
      checked: settings.closeToTray,
      click: () => { settings.closeToTray = !settings.closeToTray; store.save(); },
    },
    {
      label: 'Iniciar con el sistema',
      type: 'checkbox',
      checked: settings.openAtLogin,
      click: () => {
        settings.openAtLogin = !settings.openAtLogin;
        app.setLoginItemSettings({ openAtLogin: settings.openAtLogin, args: ['--hidden'] });
        store.save();
      },
    },
    {
      label: 'Copia de seguridad',
      submenu: [
        { label: 'Exportar configuración…', click: exportBackup },
        { label: 'Importar configuración…', click: importBackup },
      ],
    },
    { type: 'separator' },
    { label: 'Ver uso de memoria', click: showMemory },
    { label: 'Registro de ventas…', click: () => win.webContents.send('ui:sales') },
    { label: 'Envíos pendientes…', click: () => win.webContents.send('ui:shipments') },
    { label: 'Remitentes de tickets (logo, QR, datos)…', click: () => win.webContents.send('ui:ticket-profiles') },
    { label: 'Formularios de envío (Shalom / Olva)…', click: () => win.webContents.send('ui:forms') },
    { type: 'separator' },
    { label: '☕ Invítale un cafecito al creador', click: () => win.webContents.send('ui:coffee') },
    { label: 'Buscar actualizaciones…', click: () => updater.checkNow() },
    { label: `Acerca de ${APP_NAME}`, click: showAbout },
    { type: 'separator' },
    { label: `Salir de ${APP_NAME}`, click: quit },
  ]).popup({ window: win });
}

function showAbout() {
  dialog.showMessageBox(win, {
    type: 'info',
    icon: nativeImage.createFromPath(ICON).resize({ width: 64, height: 64 }),
    title: `Acerca de ${APP_NAME}`,
    message: `${APP_NAME}  v${app.getVersion()}`,
    detail: `Creado por ${CREATOR}\n\nVarias cuentas de WhatsApp, Telegram, Meta Business Suite y más en una sola app.\n\n☕ ¿Te ayuda en tu negocio? Invítale un cafecito al creador por Yape: ${CREATOR_YAPE.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')}\n\nInstalada en: ${path.dirname(app.getPath('exe'))}`,
  });
}

function showMemory() {
  const metrics = app.getAppMetrics();
  const mbByPid = new Map(metrics.map((m) => [m.pid, (m.memory.workingSetSize || 0) / 1024]));
  const lines = [];
  let accountsTotal = 0;
  for (const acc of openAccounts()) {
    const view = views.get(acc.id);
    if (!view) {
      lines.push(`${acc.name}: suspendida (0 MB)`);
      continue;
    }
    const mb = mbByPid.get(view.webContents.getOSProcessId()) || 0;
    accountsTotal += mb;
    lines.push(`${acc.name}: ${Math.round(mb)} MB${acc.keepAlive ? ' · siempre activa' : ''}`);
  }
  const total = metrics.reduce((sum, m) => sum + (m.memory.workingSetSize || 0), 0) / 1024;
  dialog.showMessageBox(win, {
    type: 'info',
    title: 'Uso de memoria',
    message: `Total de ${APP_NAME}: ${Math.round(total)} MB`,
    detail: `${lines.join('\n') || 'No hay cuentas.'}\n\nApp base (barra, procesos internos): ${Math.round(total - accountsTotal)} MB`,
  });
}

// ---------- Atajos ----------

function handleShortcut(event, input) {
  if (input.type !== 'keyDown' || !(input.control || input.meta) || locked) return;
  const list = openAccounts();
  const key = input.key.toLowerCase();
  if (/^[1-9]$/.test(key)) {
    const acc = list[Number(key) - 1];
    if (acc) setActive(acc.id);
  } else if (key === 'tab' && list.length) {
    const i = list.findIndex((a) => a.id === activeId);
    const next = list[(i + (input.shift ? -1 : 1) + list.length) % list.length];
    setActive(next.id);
  } else if (key === 'w' && activeId) {
    closeTab(activeId);
  } else if (key === 'l') {
    lockApp();
  } else if (key === 'g') {
    setLayout(isGrid() ? 'single' : 'grid');
  } else if (key === 'r' && input.shift) {
    showQuickMenu();
  } else if (key === 'p') {
    openTicketFromSelection();
  } else if (key === '=' || key === '+') {
    stepZoom(1);
  } else if (key === '-') {
    stepZoom(-1);
  } else if (key === '0') {
    stepZoom(0);
  } else {
    return;
  }
  event.preventDefault();
}

// ---------- IPC ----------

function registerIpc() {
  ipcMain.on('ui:ready', pushState);
  ipcMain.on('ui:overlay', (_e, open) => {
    overlayOpen = Boolean(open);
    applyLayout();
    pushState();
  });
  ipcMain.on('tab:select', (_e, id) => setActive(id));
  ipcMain.on('tab:menu', (_e, id) => showTabMenu(id));
  ipcMain.on('tab:close', (_e, id) => closeTab(id));
  ipcMain.on('add:menu', showAddMenu);
  ipcMain.on('add:service', (_e, service) => addAccount(service));
  ipcMain.on('settings:menu', showSettingsMenu);
  ipcMain.on('layout:toggle', () => setLayout(isGrid() ? 'single' : 'grid'));
  ipcMain.on('lock:now', lockApp);
  ipcMain.on('quick:menu', showQuickMenu);
  ipcMain.on('ui:panel', (_e, width) => {
    panelWidth = Math.max(0, Math.min(1000, Number(width) || 0));
    applyLayout();
    pushState();
  });
  ipcMain.handle('sales:list', () => (locked ? [] : sales.list()));
  ipcMain.handle('sales:save', (_e, sale) => (locked ? { ok: false, error: 'La app está bloqueada.' } : saveSaleAndRefresh(sale)));
  ipcMain.handle('sales:delete', (_e, id) => {
    if (locked) return;
    sales.remove(id);
    receipts.cleanup(sales.usedReceipts());
    pushState();
  });
  ipcMain.handle('ship:list', () => (locked ? [] : sales.pendingShipments().map(shipmentView)));
  ipcMain.handle('ship:update', (_e, id, changes) => {
    if (locked) return { ok: false };
    const result = sales.updateShipment(id, changes || {});
    pushState();
    return result.ok ? { ok: true, sale: shipmentView(result.sale) } : result;
  });
  ipcMain.handle('ship:attach-receipt', (_e, id) => (locked ? null : attachReceipt(id)));
  ipcMain.handle('ship:track', (_e, id) => (locked ? { ok: false } : trackShipment(id)));
  ipcMain.handle('ship:set-url', (_e, carrier, url) => (locked ? { ok: false } : setTrackingUrl(carrier, url)));
  ipcMain.handle('ship:send', (_e, id) => (locked ? { ok: false } : sendShipmentToCustomer(id)));
  ipcMain.handle('sales:export', () => (locked ? false : exportSales()));
  // El botón de la luna apaga "no molestar" del todo (también el horario) o lo enciende ya.
  ipcMain.on('dnd:toggle', () => updateDnd(dndActive() ? { enabled: false, schedule: false } : { enabled: true }));
  ipcMain.handle('templates:get', () => store.get().templates.map((t) => ({
    ...t,
    images: (t.images || []).map((name) => ({ name, thumb: media.thumbnail(name) })).filter((img) => img.thumb),
  })));
  ipcMain.handle('templates:pick-images', () => (locked ? [] : pickTemplateImages()));
  ipcMain.handle('templates:save', (_e, list) => saveTemplates(list));
  ipcMain.handle('lock:unlock', (_e, password) => tryUnlock(password));
  ipcMain.handle('lock:reset', (_e, answer, password) => resetPassword(answer, password));
  ipcMain.handle('lock:save', (_e, payload) => savePassword(payload || {}));
  ipcMain.on('tab:rename', (_e, id, name) => {
    const acc = findAccount(id);
    const clean = String(name || '').trim().slice(0, 40);
    if (acc && clean) {
      acc.name = clean;
      store.save();
      syncNotifyState();
    }
    pushState();
  });
  ipcMain.on('tab:reorder', (_e, ids) => {
    const byId = new Map(accounts().map((a) => [a.id, a]));
    const open = ids.map((id) => byId.get(id)).filter((a) => a && !a.closed);
    if (open.length === openAccounts().length && new Set(open).size === open.length) {
      // Las demás (cerradas o de servicios desconocidos) se conservan al final.
      const rest = accounts().filter((a) => !open.includes(a));
      store.get().accounts = [...open, ...rest];
      store.save();
    }
    applyLayout();
    pushState();
  });
  ipcMain.on('badge:icon', (_e, dataUrl, count) => {
    if (process.platform !== 'win32' || !win) return;
    const image = count ? nativeImage.createFromDataURL(dataUrl) : null;
    win.setOverlayIcon(image, count ? `${count} sin leer` : '');
  });
  ipcMain.on('svc:notify', (event, payload) => {
    const id = idForWebContents(event.sender);
    if (id && payload && Number.isInteger(payload.id)) showServiceNotification(id, payload);
  });
  ipcMain.handle('ticket:profiles', () => (locked ? [] : store.get().ticketProfiles.map(ticketProfileView)));
  ipcMain.handle('ticket:save-profiles', (_e, list) => (locked ? { ok: false } : saveTicketProfiles(list)));
  ipcMain.handle('ticket:pick-image', (_e, kind) => (locked ? null : pickTicketImage(kind)));
  ipcMain.handle('ticket:print', (_e, ticket, options) => (locked ? { ok: false } : printTicket(ticket, options || {})));
  ipcMain.handle('ticket:last-profile', () => store.get().settings.lastTicketProfile || '');
  // Pega en el chat abierto los datos del envío para que el cliente los confirme (el usuario presiona Enter).
  ipcMain.handle('ticket:to-chat', async (_e, text) => {
    const view = views.get(activeId);
    const message = String(text || '').slice(0, 3000);
    if (!view || locked || !message) {
      await copyText(message);
      return { ok: false };
    }
    view.webContents.focus();
    await pasteText(view.webContents, message);
    return { ok: true };
  });
  ipcMain.on('forms:menu', () => {
    if (!locked) Menu.buildFromTemplate(shippingFormItems()).popup({ window: win });
  });
  ipcMain.handle('forms:get', () => ({ forms: { ...shippingForms() }, defaults: tickets.DEFAULT_FORMS }));
  ipcMain.handle('forms:save', (_e, forms) => (locked ? { ok: false } : saveShippingForms(forms)));
  ipcMain.handle('ticket:printers', async () => {
    const printers = await win.webContents.getPrintersAsync();
    const saved = store.get().settings.ticketPrinter;
    return {
      printers: printers.map((p) => ({ name: p.name, label: p.displayName || p.name, isDefault: Boolean(p.isDefault) })),
      selected: saved === undefined ? null : saved,
    };
  });
  ipcMain.on('ticket:from-selection', openTicketFromSelection);
  ipcMain.on('coffee:copy', () => copyText(CREATOR_YAPE));
  ipcMain.handle('app:about', () => ({
    name: APP_NAME,
    version: app.getVersion(),
    creator: CREATOR,
    year: new Date().getFullYear(),
    installedAt: path.dirname(app.getPath('exe')),
    update: updater.state,
    changelog: CHANGELOG,
  }));
  ipcMain.handle('update:check', () => updater.check());
  ipcMain.on('update:install', () => updater.install());
  ipcMain.handle('payments:state', () => paymentsState());
  ipcMain.on('payments:set', (_e, key, value) => { if (!locked) setPaymentOption(key, value); });
  ipcMain.on('payments:test', () => { if (!locked) onPayment({ app: 'Yape', name: 'Melissa Galvez', amount: 50, at: Date.now(), test: true }); });
  ipcMain.on('payments:open-phone-link', () => shell.openExternal('ms-phone:').catch(() => {}));
  ipcMain.on('theme:toggle', () => setTheme(nativeTheme.shouldUseDarkColors ? 'light' : 'dark'));
  ipcMain.on('reminders:menu', showRemindersMenu);
  ipcMain.handle('reminders:save', (_e, reminder) => (locked ? { ok: false, error: 'La app está bloqueada.' } : saveReminder(reminder || {})));
  notifier.register({ open: openFromNotification, reply: replyFromNotification });
  ipcMain.on('svc:notification-click', (event) => {
    const id = idForWebContents(event.sender);
    showWindow();
    if (id) setActive(id);
  });
}

// ---------- Avisos de Yape y Plin (por Enlace Móvil de Windows) ----------

let paymentWatcher = null;
const todayPayments = []; // solo en memoria: pagos avisados desde que se abrió la app hoy

const PAY_VERB = { Yape: 'te yapeó', Plin: 'te plineó', BBVA: 'te pagó' };
const PAY_LABEL = { Yape: 'Yape', Plin: 'Plin · BBVA', BBVA: 'BBVA Empresas · Cobro con QR' };

const money = (n) => `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Monto para decirlo en voz alta: "50 soles", "25 soles con 50 céntimos", "1 sol".
function spokenMoney(n) {
  const soles = Math.floor(n + 1e-9);
  const cents = Math.round((n - soles) * 100);
  const main = soles === 1 ? '1 sol' : `${soles} soles`;
  if (!soles) return `${cents} céntimos`;
  return cents ? `${main} con ${cents} céntimos` : main;
}

function announcePayment(payment) {
  if (!store.get().settings.paymentVoice || !win || win.isDestroyed()) return;
  const text = locked
    ? `Recibiste un ${payment.app}`
    : `${payment.name} ${PAY_VERB[payment.app]} ${spokenMoney(payment.amount)}`;
  win.webContents.send('ui:speak', text);
}

function onPayment(payment) {
  const today = new Date().toDateString();
  while (todayPayments.length && new Date(todayPayments[0].at).toDateString() !== today) todayPayments.shift();
  if (!payment.test) todayPayments.push(payment);
  pushPayments();
  if (!payment.test && !store.get().settings.paymentAlerts) return;
  const verb = PAY_VERB[payment.app];
  // Los pagos se avisan siempre, también en "no molestar": son ventas.
  notifier.show({
    kind: 'payment',
    payApp: payment.app,
    accountName: PAY_LABEL[payment.app],
    title: locked ? `Pago recibido por ${payment.app}` : `${payment.name} ${verb} ${money(payment.amount)}`,
    body: locked ? 'Desbloquea MultiChat Pro para ver el detalle' : payment.test ? 'Prueba: así llegarán los pagos de Yape y Plin' : `Hoy: ${todayPayments.length} pago${todayPayments.length === 1 ? '' : 's'} · ${money(todayPayments.reduce((t, p) => t + p.amount, 0))}`,
    canReply: false,
  });
  announcePayment(payment);
}

// Últimas notificaciones del celular que llegaron por Enlace Móvil (solo en memoria, no se guardan).
const phoneNotifications = [];
let lastPhoneAt = 0;

function onPhoneNotification(item) {
  lastPhoneAt = item.at;
  phoneNotifications.unshift(item);
  phoneNotifications.length = Math.min(phoneNotifications.length, 40);
  // "Leer todas las notificaciones del celular": los pagos ya se dicen aparte; se respeta el horario de atención.
  const { settings } = store.get();
  if (settings.readAllPhone && !item.payment && !locked && !dndActive() && win && !win.isDestroyed()) {
    const [app, ...rest] = item.texts;
    win.webContents.send('ui:speak', `${rest.length ? `${app}. ${rest.join('. ')}` : app}`.slice(0, 220));
  }
  pushPayments();
}

// El panel de pagos (botón de la barra) se actualiza en vivo.
function pushPayments() {
  if (win && !win.isDestroyed()) win.webContents.send('payments:update');
}

async function paymentsState() {
  const { settings } = store.get();
  const today = new Date().toDateString();
  const list = locked ? [] : todayPayments.filter((p) => new Date(p.at).toDateString() === today);
  const dbFound = process.platform === 'win32' && fs.existsSync(payments.databasePath());
  return {
    alerts: settings.paymentAlerts,
    voice: settings.paymentVoice,
    readAll: settings.readAllPhone,
    windows: process.platform === 'win32',
    phoneLink: { running: await payments.phoneLinkRunning(), dbFound, lastAt: lastPhoneAt, watching: Boolean(paymentWatcher && paymentWatcher.running) },
    today: list.map(({ app: payApp, name, amount, at }) => ({ app: payApp, label: PAY_LABEL[payApp], name, amount, at })),
    total: list.reduce((t, p) => t + p.amount, 0),
    recent: locked ? [] : phoneNotifications.slice(0, 25),
  };
}

function setPaymentOption(key, value) {
  const map = { alerts: 'paymentAlerts', voice: 'paymentVoice', readAll: 'readAllPhone' };
  if (!map[key]) return;
  store.get().settings[map[key]] = Boolean(value);
  store.save();
}

function syncPaymentWatcher() {
  if (process.platform !== 'win32') return;
  // Siempre vigila (los avisos se activan o no con "paymentAlerts"), así el panel muestra lo que llega del celular.
  paymentWatcher = paymentWatcher || payments.createWatcher({ onPayment, onPhoneNotification });
  paymentWatcher.start();
}

function showTodayPayments() {
  if (locked) return;
  const total = todayPayments.reduce((t, p) => t + p.amount, 0);
  const lines = todayPayments.map((p) => `${new Date(p.at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}  ${p.app}  ${p.name}  ${money(p.amount)}`);
  dialog.showMessageBox(win, {
    type: 'info',
    title: 'Pagos de hoy',
    message: todayPayments.length ? `Hoy: ${todayPayments.length} pagos · ${money(total)}` : 'Todavía no llegaron pagos de Yape o Plin hoy.',
    detail: (lines.join('\n') || 'Los pagos aparecen aquí cuando llega su notificación por Enlace Móvil.')
      + '\n\nSolo se cuentan los que llegaron con MultiChat abierto. No se guardan.',
  });
}

// Muestra las últimas notificaciones de Enlace Móvil tal como llegan, para ajustar el formato si un pago no se reconoce.
function showPhoneLinkCheck() {
  if (locked) return;
  const watcher = paymentWatcher || payments.createWatcher({ onPayment });
  const recent = process.platform === 'win32' ? watcher.recentPhoneLink() : null;
  dialog.showMessageBox(win, {
    type: recent && recent.length ? 'info' : 'warning',
    title: 'Revisar Enlace Móvil',
    message: recent === null
      ? 'No se encontraron notificaciones de Windows. ¿Enlace Móvil está instalado y conectado al iPhone?'
      : recent.length ? 'Últimas notificaciones que llegaron por Enlace Móvil:' : 'Enlace Móvil todavía no mostró notificaciones.',
    detail: recent && recent.length
      ? recent.map((t, i) => `${i + 1}. ${t}`).join('\n\n') + '\n\nSi un Yape o Plin aparece aquí pero no se avisó, envía una captura de esta ventana al creador.'
      : 'En el iPhone: Ajustes → Bluetooth (conectado a la PC) y Ajustes → Notificaciones → Yape / BBVA → "Compartir notificaciones" activado.',
  });
}

// ---------- Inicio ----------

function init() {
  store.load();
  // Reabierta después de una actualización de madrugada: sigue oculta en la bandeja, como estaba.
  if (store.get().settings.openHiddenOnce) {
    startHidden = true;
    store.get().settings.openHiddenOnce = false;
    store.save();
  }
  sales.load();
  seedTemplates();
  seedTicketProfiles();
  applyTheme();
  nativeTheme.on('updated', pushState);
  app.setAppUserModelId('com.multichat.app');
  registerIpc();
  createWindow();
  createTray();

  const data = store.get();
  locked = Boolean(data.lock);

  // Al abrir solo se cargan la última cuenta usada y las marcadas como "siempre activa".
  for (const acc of openAccounts()) {
    if (acc.keepAlive) createView(acc);
  }
  const first = openAccounts().find((a) => a.id === data.activeId) || openAccounts()[0];
  activeId = first ? first.id : null;
  applyLayout();
  pushState();

  // "Iniciar con el sistema" siempre apunta a esta instalación: se reescribe (o se borra) en cada inicio,
  // así Windows no sigue abriendo una copia vieja de la app.
  app.setLoginItemSettings({ openAtLogin: Boolean(data.settings.openAtLogin), args: ['--hidden'] });

  syncPaymentWatcher();
  setTimeout(announceUpdated, 4000);
  updater.start({
    getWindow: () => win,
    onChange: (state) => { if (win && !win.isDestroyed()) win.webContents.send('update:state', state); },
    notify: (version) => notifier.show({
      kind: 'update',
      accountName: 'Actualización de MultiChat Pro',
      title: `Versión v${version} descargada`,
      body: 'No hace falta cerrar nada: se instala sola cuando cierres MultiChat o de madrugada si la PC no se usa.',
      canReply: false,
    }),
    beforeInstall: (quiet) => {
      // Después de instalar, MultiChat se abre solo; si fue de madrugada, se queda oculto en la bandeja.
      store.get().settings.openHiddenOnce = quiet && !(win && win.isVisible());
      store.flush();
      if (!quiet) showUpdatingWindow();
    },
  });
  setInterval(hibernateIdle, 60_000);
  setInterval(checkAutoLock, 30_000);
  setInterval(checkDndSchedule, 30_000);
  setInterval(checkReminders, 20_000);
  checkReminders();
  powerMonitor.on('lock-screen', () => {
    if (store.get().settings.autoLockMinutes) lockApp();
  });
}

app.on('before-quit', () => {
  quitting = true;
  notifier.closeAll();
  store.flush();
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') quit();
});
app.on('activate', showWindow);
