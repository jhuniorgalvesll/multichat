'use strict';

// Asistente con IA: muestra 3 respuestas sugeridas para el mensaje del cliente. La elegida se pega en el chat;
// nunca se envía sola. Usa $, api, state, passwordMode y closeCoffee de ui.js.

let aiOpen = false;
let aiAccount = '';
let aiBusy = false;

async function openAssistantPanel({ text = '', accountName = '' } = {}) {
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
