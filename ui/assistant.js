'use strict';

// Asistente con IA: muestra 3 respuestas sugeridas para el mensaje del cliente. La elegida se pega en el chat;
// nunca se envía sola. Usa $, api, state, passwordMode y closeCoffee de ui.js.

let aiOpen = false;
let aiAccount = '';
let aiBusy = false;

async function openAssistantPanel({ text = '', accountName = '', ship = null } = {}) {
  if (state.locked || passwordMode) return;
  closeCoffee();
  aiAccount = accountName;
  $('ai-message').value = text;
  $('ai-account').textContent = accountName ? `Cuenta: ${accountName}` : '';
  $('ai-results').replaceChildren();
  $('ai-status').textContent = '';
  const config = await api.assistantConfig();
  $('ai-context').value = config.context;
  $('ai-key').value = '';
  $('ai-key').placeholder = config.hasKey ? 'Clave guardada ✓ (escribe otra para cambiarla)' : 'sk-ant-…';
  $('ai-config').open = !config.hasKey || !config.context;
  $('ai-modal').hidden = false;
  if (!aiOpen) api.setOverlay(true);
  aiOpen = true;
  $('ai-ship-state').textContent = '';
  const found = await api.detectShipment(text);
  $('ai-ship-order').value = found.orden || '';
  $('ai-ship-code').value = found.codigo || '';
  if (ship && ship.reading) {
    $('ai-ship-state').textContent = '📷 Leyendo el ticket de la foto…';
    return;
  }
  if (text && config.hasKey) suggestNow();
  else if (!config.hasKey) $('ai-key').focus();
  else $('ai-message').focus();
}

function closeAssistantPanel() {
  if (!aiOpen) return;
  aiOpen = false;
  $('ai-modal').hidden = true;
  api.setOverlay(false);
}

function replyCard(reply) {
  const card = document.createElement('div');
  card.className = 'ai-reply';
  const label = Object.assign(document.createElement('div'), { className: 'ai-reply-label', textContent: reply.label });
  const text = Object.assign(document.createElement('div'), { className: 'ai-reply-text', textContent: reply.text });
  const paste = Object.assign(document.createElement('button'), { type: 'button', className: 'primary', textContent: 'Pegar en el chat' });
  paste.addEventListener('click', async () => {
    const result = await api.pasteReply(reply.text);
    if (result.ok) closeAssistantPanel();
    else $('ai-status').textContent = 'Abre un chat para pegar la respuesta.';
  });
  card.append(label, text, paste);
  return card;
}

async function suggestNow() {
  if (aiBusy) return;
  const message = $('ai-message').value.trim();
  if (!message) {
    $('ai-status').textContent = 'Pega o selecciona el mensaje del cliente.';
    return;
  }
  aiBusy = true;
  $('ai-suggest').disabled = true;
  $('ai-status').textContent = '✨ Pensando respuestas…';
  $('ai-results').replaceChildren();
  const result = await api.suggestReplies(message, aiAccount);
  aiBusy = false;
  $('ai-suggest').disabled = false;
  if (!result.ok) {
    $('ai-status').textContent = result.error;
    if (result.needsKey) $('ai-config').open = true;
    return;
  }
  $('ai-status').textContent = 'Elige una, pégala en el chat y revísala antes de enviar.';
  $('ai-results').replaceChildren(...result.replies.map(replyCard));
}

$('ai-suggest').addEventListener('click', suggestNow);

// Estado del envío según Shalom, en una línea (sin nombres ni DNI).
function shipLine(r) {
  if (!r) return '';
  if (r.ok) {
    const fechas = [r.registrado_el && `registrado el ${r.registrado_el}`, r.en_destino_el && `en destino desde el ${r.en_destino_el}`, r.entregado_el && `entregado el ${r.entregado_el}`].filter(Boolean);
    return `Shalom: "${r.estado}"${fechas.length ? ` · ${fechas.join(' · ')}` : ''}`;
  }
  return {
    no_encontrada: 'Shalom no encontró esa orden: revisa el N° y el código del ticket.',
    datos_invalidos: 'Revisa el N° de orden (solo números) y el código de 4 caracteres.',
  }[r.error] || 'No se pudo consultar Shalom en este momento.';
}

async function trackNow() {
  if (aiBusy) return;
  aiBusy = true;
  $('ai-ship-go').disabled = true;
  $('ai-suggest').disabled = true;
  $('ai-ship-state').textContent = '🔎 Consultando el rastreo de Shalom…';
  $('ai-status').textContent = '';
  $('ai-results').replaceChildren();
  const result = await api.trackAndReply({ orden: $('ai-ship-order').value, codigo: $('ai-ship-code').value, text: $('ai-message').value });
  aiBusy = false;
  $('ai-ship-go').disabled = false;
  $('ai-suggest').disabled = false;
  const r = result.rastreo || {};
  if (r.codigo_corregido) $('ai-ship-code').value = r.codigo_corregido;
  $('ai-ship-state').textContent = `${r.codigo_corregido ? `✓ Código corregido a ${r.codigo_corregido} (la foto se leyó distinto) · ` : ''}${shipLine(r)}`;
  if (!result.ok) {
    $('ai-status').textContent = result.error;
    if (result.needsKey) $('ai-config').open = true;
    return;
  }
  $('ai-status').textContent = 'Elige una, pégala en el chat y revísala antes de enviar.';
  $('ai-results').replaceChildren(...result.replies.map(replyCard));
}
$('ai-ship-go').addEventListener('click', trackNow);
$('ai-ship-code').addEventListener('input', (e) => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); });
$('ai-ship-order').addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, ''); });
$('ai-message').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) suggestNow();
});
$('ai-save').addEventListener('click', async () => {
  const result = await api.saveAssistantConfig({ key: $('ai-key').value, context: $('ai-context').value });
  if (!result.ok) {
    $('ai-config-status').textContent = result.error || 'No se pudo guardar.';
    return;
  }
  $('ai-key').value = '';
  $('ai-key').placeholder = result.hasKey ? 'Clave guardada ✓ (escribe otra para cambiarla)' : 'sk-ant-…';
  $('ai-config-status').textContent = '✓ Guardado';
  setTimeout(() => { $('ai-config-status').textContent = ''; }, 2500);
});
$('ai-close').addEventListener('click', closeAssistantPanel);
$('ai-modal').addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeAssistantPanel();
});
$('ai-btn').addEventListener('click', () => (aiOpen ? closeAssistantPanel() : api.openAssistant()));
api.onAssistant(openAssistantPanel);

// N° de orden y código leídos de la foto del ticket: se llenan y se consulta el envío.
function applyTicketPhoto(found) {
  if (!found || !found.ok) {
    $('ai-ship-state').textContent = (found && found.error) || 'No se pudo leer la foto.';
    return;
  }
  if (found.orden) $('ai-ship-order').value = found.orden;
  if (found.codigo) $('ai-ship-code').value = found.codigo;
  if (found.orden && found.codigo) trackNow();
  else $('ai-ship-state').textContent = `Leído del ticket: ${found.orden ? `orden ${found.orden}` : 'falta el N° de orden'} · ${found.codigo ? `código ${found.codigo}` : 'falta el código'}. Completa lo que falta.`;
}
api.onAiShip(applyTicketPhoto);
$('ai-ship-photo').addEventListener('click', async () => {
  $('ai-ship-state').textContent = '📷 Leyendo el ticket de la foto copiada…';
  applyTicketPhoto(await api.shipFromClipboard());
});
