'use strict';

// Asistente con inteligencia artificial (Claude, de Anthropic): sugiere respuestas para el mensaje del cliente que
// el usuario seleccionó en el chat. Nunca envía nada: la respuesta elegida se pega en el chat y tú presionas Enter.
// Usa la clave de API de Anthropic del usuario (se guarda cifrada en esta PC) y cobra por uso en su cuenta.
const { safeStorage } = require('electron');
const Anthropic = require('@anthropic-ai/sdk');

const MODEL = 'claude-opus-5-5';

// Respuesta en JSON con exactamente 3 opciones.
const REPLY_SCHEMA = {
  type: 'object',
  properties: {
    replies: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string', description: 'Título corto de la opción (2 a 4 palabras), p. ej. "Precio y envío".' },
          text: { type: 'string', description: 'Texto listo para enviar por WhatsApp.' },
        },
        required: ['label', 'text'],
        additionalProperties: false,
      },
    },
  },
  required: ['replies'],
  additionalProperties: false,
};

const SYSTEM = `Ayudas a un negocio peruano que vende por WhatsApp (productos agrícolas y veterinarios, envíos por Shalom y Olva, pagos por Yape, Plin y transferencia). Te paso el mensaje de un cliente y propones 3 respuestas distintas que el vendedor puede enviar.

Cómo escribir las respuestas:
- En español peruano, cordial y directo, como escribe un vendedor por WhatsApp. Frases cortas; uno o dos emojis como mucho.
- Usa solo los datos del negocio que te doy (productos, precios, envíos, pagos). Si el cliente pregunta algo que esos datos no responden, no inventes precios, stock ni plazos: ofrece confirmarlo o pide el dato que falta.
- Las tres opciones deben ser realmente distintas (por ejemplo: responder directo, hacer una pregunta para cerrar la venta, ofrecer una alternativa).
- Puedes usar *negritas* de WhatsApp para precios o datos clave.`;

let client = null;
let clientKey = '';

function encryptKey(key) {
  const clean = String(key || '').trim();
  if (!clean) return '';
  return safeStorage.isEncryptionAvailable() ? `enc:${safeStorage.encryptString(clean).toString('base64')}` : `raw:${clean}`;
}

function decryptKey(stored) {
  const value = String(stored || '');
  try {
    if (value.startsWith('enc:')) return safeStorage.decryptString(Buffer.from(value.slice(4), 'base64'));
    if (value.startsWith('raw:')) return value.slice(4);
  } catch { /* clave guardada en otra PC: hay que volver a ponerla */ }
  return '';
}

function getClient(stored) {
  const key = decryptKey(stored);
  if (!key) return null;
  if (!client || clientKey !== key) {
    client = new Anthropic({ apiKey: key, maxRetries: 2, timeout: 60_000 });
    clientKey = key;
  }
  return client;
}

// Devuelve { ok: true, replies: [{label, text}] } o { ok: false, error }.
async function suggest({ storedKey, businessContext, customerMessage, accountName }) {
  const anthropic = getClient(storedKey);
  if (!anthropic) return { ok: false, error: 'Falta la clave de Anthropic. Ponla en "Configurar".', needsKey: true };
  const message = String(customerMessage || '').trim().slice(0, 4000);
  if (!message) return { ok: false, error: 'Selecciona en el chat el mensaje del cliente y vuelve a intentarlo.' };
  const context = String(businessContext || '').trim().slice(0, 6000);

  try {
    const response = await anthropic.beta.messages.create({
      model: MODEL,
      max_tokens: 4000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low', format: { type: 'json_schema', schema: REPLY_SCHEMA } },
      system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
      messages: [{
        role: 'user',
        content: `Datos del negocio${accountName ? ` (cuenta "${accountName}")` : ''}:\n${context || '(no hay datos cargados todavía)'}\n\nMensaje del cliente:\n${message}`,
      }],
    });
    if (response.stop_reason === 'refusal') return { ok: false, error: 'La IA no pudo responder a este mensaje. Escribe la respuesta a mano.' };
    const block = response.content.find((b) => b.type === 'text');
    const data = block ? JSON.parse(block.text) : null;
    const replies = (data && Array.isArray(data.replies) ? data.replies : [])
      .filter((r) => r && typeof r.text === 'string' && r.text.trim())
      .slice(0, 3)
      .map((r) => ({ label: String(r.label || 'Respuesta').slice(0, 40), text: r.text.trim().slice(0, 1500) }));
    if (!replies.length) return { ok: false, error: 'La IA no devolvió respuestas. Inténtalo otra vez.' };
    return { ok: true, replies };
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) return { ok: false, error: 'La clave de Anthropic no es válida. Revísala en "Configurar".', needsKey: true };
    if (err instanceof Anthropic.PermissionDeniedError) return { ok: false, error: 'Tu cuenta de Anthropic no tiene permiso para usar este modelo.' };
    if (err instanceof Anthropic.RateLimitError) return { ok: false, error: 'Demasiadas consultas seguidas o sin saldo en tu cuenta de Anthropic. Espera un momento o revisa tu saldo.' };
    if (err instanceof Anthropic.APIConnectionError) return { ok: false, error: 'Sin conexión a internet. Inténtalo de nuevo.' };
    if (err instanceof Anthropic.APIError) return { ok: false, error: `El servicio de IA respondió con un error (${err.status}). Inténtalo de nuevo.` };
    if (err instanceof SyntaxError) return { ok: false, error: 'La respuesta de la IA llegó incompleta. Inténtalo otra vez.' };
    return { ok: false, error: 'No se pudo usar la IA. Inténtalo de nuevo.' };
  }
}

module.exports = { suggest, encryptKey, decryptKey };
