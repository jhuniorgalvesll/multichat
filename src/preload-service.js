'use strict';

// Preload de cada cuenta (WhatsApp, Telegram, ...). Las notificaciones de la página pasan
// por aquí: se muestran como notificaciones de MultiChat (con nombre de la cuenta y botón
// "Responder"), se ocultan con la app bloqueada y no avisan si la cuenta está silenciada,
// en "no molestar" o fuera del horario de atención.
const { ipcRenderer, webFrame } = require('electron');

window.addEventListener('message', (event) => {
  if (event.source !== window || !event.data) return;
  if (event.data.__multichat === 'notification-click') {
    ipcRenderer.send('svc:notification-click');
  } else if (event.data.__multichat === 'notify') {
    const { id, title, body, icon } = event.data;
    ipcRenderer.send('svc:notify', { id, title: String(title || ''), body: String(body || ''), icon: String(icon || '') });
  }
});

ipcRenderer.on('notify-state', (_e, state) => {
  window.postMessage({ __multichat: 'notify-state', ...state }, '*');
});

// La app pide "abrir" una notificación: la página hace lo mismo que con un clic (abrir el chat).
ipcRenderer.on('notify-open', (_e, id) => {
  window.postMessage({ __multichat: 'notify-open', id }, '*');
});

function patchNotification() {
  const Native = window.Notification;
  if (!Native) return;
  const state = { locked: false, suppress: false, account: '', custom: false };
  const pending = new Map(); // id -> notificación entregada a MultiChat
  let lastId = 0;

  window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data) return;
    if (event.data.__multichat === 'notify-state') {
      state.locked = Boolean(event.data.locked);
      state.suppress = Boolean(event.data.suppress);
      state.account = String(event.data.account || '');
      state.custom = Boolean(event.data.custom);
    } else if (event.data.__multichat === 'notify-open') {
      const n = pending.get(event.data.id);
      if (!n) return;
      const click = new Event('click');
      if (typeof n.onclick === 'function') n.onclick.call(n, click);
      n.dispatchEvent(click);
    }
  });

  // Notificación que muestra MultiChat en lugar de Windows. La página la recibe como si fuera normal.
  function handOver(title, options) {
    const id = ++lastId;
    const n = new EventTarget();
    Object.assign(n, { title, body: (options && options.body) || '', tag: (options && options.tag) || '', data: options && options.data, onclick: null, onclose: null, onshow: null, onerror: null });
    n.close = () => pending.delete(id);
    pending.set(id, n);
    if (pending.size > 50) pending.delete(pending.keys().next().value);
    const icon = options && typeof options.icon === 'string' ? options.icon : '';
    window.postMessage({ __multichat: 'notify', id, title, body: n.body, icon }, '*');
    return n;
  }

  // Devuelve null si no hay que avisar; si no, el título y opciones a mostrar.
  function rewrite(title, options) {
    if (state.suppress) return null;
    if (state.locked) {
      return [state.account || 'MultiChat Pro', { body: 'Tienes un mensaje nuevo', silent: options && options.silent }];
    }
    return [state.account ? `${state.account} · ${title}` : title, options];
  }

  class MultiChatNotification extends Native {
    constructor(title, options) {
      if (state.suppress) {
        // Notificación "silenciosa": la página la crea, pero no se muestra nada.
        const silent = new EventTarget();
        silent.close = () => {};
        return silent;
      }
      if (state.custom) return handOver(title, options);
      super(...rewrite(title, options));
      this.addEventListener('click', () => {
        window.postMessage({ __multichat: 'notification-click' }, '*');
      });
    }
  }
  window.Notification = MultiChatNotification;

  // Algunas páginas avisan a través de su service worker en lugar de `new Notification`.
  const proto = window.ServiceWorkerRegistration && window.ServiceWorkerRegistration.prototype;
  if (proto && proto.showNotification) {
    const original = proto.showNotification;
    proto.showNotification = function showNotification(title, options) {
      if (state.suppress) return Promise.resolve();
      if (state.custom) {
        handOver(title, options);
        return Promise.resolve();
      }
      return original.apply(this, rewrite(title, options));
    };
  }
}

webFrame.executeJavaScript(`(${patchNotification.toString()})();`);
