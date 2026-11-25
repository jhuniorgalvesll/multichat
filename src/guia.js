'use strict';

// "Modo vendedor nuevo": guía paso a paso para atender una venta (saludar → entender qué necesita → precio →
// envío → agencia → datos → cobrar → verificar → ticket → confirmar). Cada paso tiene un consejo y un botón que
// hace la acción en MultiChat (pegar un mensaje, abrir las agencias, el ticket...). Nada se envía solo: lo pegado
// se revisa y se envía con Enter. El dueño puede cambiar los pasos.

const ACCIONES = {
  texto: 'Pegar el mensaje en el chat',
  respuestas: 'Abrir respuestas rápidas',
  opciones: 'Pegar opciones de envío',
  agencias: 'Buscar agencias Shalom',
  formulario: 'Pegar formulario de datos',
  pagos: 'Ver pagos de hoy',
  verificar: 'Verificar captura copiada',
  ticket: 'Abrir el ticket de envío',
  ninguna: '',
};

const PASOS = [
  {
    titulo: '👋 Saludar',
    consejo: 'Responde rápido y con amabilidad. Si sabes su nombre, úsalo. Nunca dejes un chat sin responder más de 5 minutos.',
    texto: '¡Hola! 😊 Gracias por escribirnos. ¿En qué producto estás interesado(a)?',
    accion: 'texto',
  },
  {
    titulo: '🔎 Entender qué necesita',
    consejo: 'Antes de dar precio pregunta: para qué lo necesita, cuánta cantidad y a qué ciudad se envía.',
    texto: '¿Para qué lo necesitas y qué cantidad buscas? ¿A qué ciudad o distrito sería el envío? 🌱',
    accion: 'texto',
  },
  {
    titulo: '💲 Dar el precio',
    consejo: 'Usa las respuestas rápidas (con fotos y precios). Di el total claro, con el envío si corresponde.',
    texto: '',
    accion: 'respuestas',
  },
  {
    titulo: '🚚 Opciones de envío',
    consejo: 'Que el cliente elija: Olva (a domicilio) o Shalom (recoge en agencia).',
    texto: '',
    accion: 'opciones',
  },
  {
    titulo: '🏢 Elegir agencia (si es Shalom)',
    consejo: 'Busca su distrito o provincia y mándale las agencias con sus pesos y horarios para que elija una.',
    texto: '',
    accion: 'agencias',
  },
  {
    titulo: '📝 Pedir datos de envío',
    consejo: 'Pega el formulario. Revisa que el DNI tenga 8 dígitos y el celular 9. Si falta algo, pídelo antes de cobrar.',
    texto: '',
    accion: 'formulario',
  },
  {
    titulo: '💳 Cobrar',
    consejo: 'Di el monto exacto. Pide que manden la captura del pago.',
    texto: 'Perfecto 😊 El total es S/ ___. Puedes pagar por Yape o Plin y enviarnos la captura del pago, por favor.',
    accion: 'texto',
  },
  {
    titulo: '🛡️ Verificar el pago',
    consejo: 'NUNCA despaches solo con la captura: espera el aviso de MultiChat (con voz) o verifica la captura copiada (Ctrl+C). Si no coincide, avisa al encargado.',
    texto: '',
    accion: 'pagos',
  },
  {
    titulo: '🖨️ Imprimir el ticket',
    consejo: 'Selecciona el mensaje con los datos del cliente y abre el ticket: se llena solo. Revisa nombre, DNI y destino antes de imprimir.',
    texto: '',
    accion: 'ticket',
  },
  {
    titulo: '✅ Confirmar y despedirse',
    consejo: 'Confirma que el pedido quedó registrado. Cuando lo despaches, manda la foto del ticket o el código de Shalom.',
    texto: '¡Listo! 🎉 Tu pedido ya está registrado. Apenas lo despachemos te enviamos el código de seguimiento. ¡Gracias por tu compra! 🌱',
    accion: 'texto',
  },
];

const txt = (v, n) => String(v || '').replace(/\r/g, '').slice(0, n);
function limpiar(pasos) {
  if (!Array.isArray(pasos)) return null;
  const out = pasos.slice(0, 15).map((p) => ({
    titulo: txt(p && p.titulo, 60).trim(),
    consejo: txt(p && p.consejo, 400).trim(),
    texto: txt(p && p.texto, 2000).trim(),
    accion: Object.prototype.hasOwnProperty.call(ACCIONES, p && p.accion) ? p.accion : 'ninguna',
  })).filter((p) => p.titulo);
  return out.length ? out : null;
}

module.exports = { ACCIONES, PASOS, limpiar };
