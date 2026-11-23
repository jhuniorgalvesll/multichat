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
  // Cliente VIP: borde dorado y un sonido especial (tres notas que suben).
  if (data.vip) {
    document.body.classList.add('vip');
    vipSound();
  }
  if (data.kind === 'phone-off') {
    document.body.classList.add('update');
    $('open-btn').textContent = 'Abrir Enlace Móvil';
    $('reply-btn').hidden = true;
  }
  if (data.kind === 'agencias') {
    document.body.classList.add('update');
    $('reply-btn').hidden = true;
  }
  if (data.kind === 'vip-info') {
    $('open-btn').hidden = true;
    $('actions').hidden = true;
  }
  if (data.kind === 'payment') {
    document.body.classList.add('payment', { Yape: 'yape', Plin: 'plin', BBVA: 'bbva' }[data.payApp] || 'plin');
    // Pago con el chat del cliente reconocido: abrir su chat o confirmarle el pago en un clic.
    const conChat = Boolean(data.chat);
    $('open-btn').hidden = !conChat;
    $('actions').hidden = !conChat;
    $('confirm-btn').hidden = !conChat;
  }
  $('open-btn').textContent = { payment: '💬 Abrir chat', 'phone-off': 'Abrir Enlace Móvil', agencias: 'Ver cambios', reminder: 'Abrir cuenta', update: 'Ver detalles', updated: 'Ver novedades', shipdata: data.confirmed ? '🖨 Imprimir ticket' : '📦 Abrir ticket' }[data.kind] || 'Abrir chat';
  if (data.kind === 'shipdata') document.body.classList.add('update');
  if (data.kind === 'update' || data.kind === 'updated') document.body.classList.add('update');
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
$('confirm-btn').addEventListener('click', (e) => { e.stopPropagation(); api.action('confirm'); });

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

function vipSound() {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    for (const [freq, at] of [[784, 0], [988, 0.12], [1319, 0.24], [1568, 0.36]]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + at);
      gain.gain.linearRampToValueAtTime(0.8, now + at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + at + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + at);
      osc.stop(now + at + 0.45);
    }
    setTimeout(() => ctx.close(), 1500);
  } catch { /* sin sonido */ }
}
