'use strict';

const api = window.toast;
const $ = (id) => document.getElementById(id);

const reportSize = () => api.size(document.getElementById('toast').offsetHeight);
new ResizeObserver(reportSize).observe($('toast'));

api.onData((data) => {
  $('account').textContent = data.accountName || 'MultiChat Pro';
  $('title').textContent = data.title || '';
  $('body').textContent = data.body || '';
  if (data.icon && /^(https?|data):/.test(data.icon)) {
    $('avatar').src = data.icon;
    $('avatar').hidden = false;
    $('avatar').onerror = () => { $('avatar').hidden = true; };
  }
  $('reply-btn').hidden = !data.canReply;
  if (data.kind === 'payment') {
    document.body.classList.add('payment', { Yape: 'yape', Plin: 'plin', BBVA: 'bbva' }[data.payApp] || 'plin');
    $('open-btn').hidden = true;
    $('actions').hidden = true;
  }
  $('open-btn').textContent = { reminder: 'Abrir cuenta', update: 'Actualizar ahora' }[data.kind] || 'Abrir chat';
  if (data.kind === 'update') document.body.classList.add('update');
  reportSize();
});

// Mientras el mouse está encima o se escribe, la notificación no se cierra sola.
document.addEventListener('mouseenter', () => api.hold(true));
document.addEventListener('mouseleave', () => {
  if ($('reply-form').hidden) api.hold(false);
});

$('close').addEventListener('click', () => api.close());
$('content').addEventListener('click', () => api.open());
$('open-btn').addEventListener('click', () => api.open());

$('reply-btn').addEventListener('click', () => {
  api.hold(true);
  $('actions').hidden = true;
  $('reply-form').hidden = false;
  $('reply-text').focus();
});

$('reply-text').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    $('reply-form').requestSubmit();
  }
  if (e.key === 'Escape') api.close();
});

$('reply-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = $('reply-text').value.trim();
  if (!text) return;
  const send = e.target.querySelector('.send');
  send.disabled = true;
  $('reply-text').disabled = true;
  $('status').hidden = false;
  $('status').textContent = 'Enviando…';
  const result = await api.reply(text);
  $('reply-form').hidden = true;
  $('status').className = result.sent ? 'status ok' : 'status';
  $('status').textContent = result.sent
    ? '✓ Respuesta enviada'
    : 'Abrimos el chat con tu respuesta escrita: revisa y presiona Enter para enviarla.';
});
