'use strict';

const api = window.bubble;
const $ = (id) => document.getElementById(id);

api.onState((state) => {
  $('badge').hidden = !state.unread;
  $('badge').textContent = state.unread > 99 ? '99+' : state.unread;
  $('bubble').classList.toggle('has-unread', Boolean(state.unread));
  const names = state.accounts.filter((a) => a.unread).map((a) => `${a.name}: ${a.unread}`);
  $('bubble').title = names.length ? `Sin leer · ${names.join(' · ')}` : 'MultiChat Pro · clic para abrir, arrastra para mover';
  $('pay').hidden = !state.payment;
  if (state.payment) $('pay').textContent = state.payment.text;
});

// Arrastrar para mover (el puntero queda "capturado" aunque salga de la burbuja); un clic sin moverse abre
// MultiChat. Clic derecho: opciones.
let down = null;
const bubbleEl = $('bubble');
bubbleEl.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  bubbleEl.setPointerCapture(e.pointerId);
  down = { x: e.screenX, y: e.screenY, moved: false };
  api.dragStart();
});
bubbleEl.addEventListener('pointermove', (e) => {
  if (!down) return;
  if (Math.abs(e.screenX - down.x) + Math.abs(e.screenY - down.y) > 4) down.moved = true;
  if (down.moved) api.dragMove();
});
bubbleEl.addEventListener('pointerup', (e) => {
  if (!down) return;
  bubbleEl.releasePointerCapture(e.pointerId);
  api.dragEnd(down.moved);
  down = null;
});
bubbleEl.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  api.menu();
});
