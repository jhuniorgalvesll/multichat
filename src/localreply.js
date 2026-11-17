'use strict';

// Respuestas sugeridas SIN IA (gratis): busca en "Datos de tu negocio" las líneas que responden lo que pregunta el
// cliente (precios, envíos, pagos, horario, ubicación o el producto que nombra) y arma 3 opciones con ese texto.
// No inventa: si no encuentra el dato, propone confirmarlo. Nunca envía nada; el vendedor elige y presiona Enter.

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const TEMAS = [
  { tema: 'precio', pregunta: /precio|cuanto|cuesta|costo|vale|valor|sale\b|oferta|promo/, linea: /s\/|precio|soles|\boferta|promo/ },
  { tema: 'envio', pregunta: /envi|shalom|olva|agencia|delivery|llega|demora|provincia|despach|courier|marvisur/, linea: /envi|shalom|olva|agencia|delivery|despach|marvisur|provincia/ },
  { tema: 'pago', pregunta: /pag|yape|plin|transfer|deposit|cuenta|bcp|bbva|interbank|tarjeta/, linea: /yape|plin|bcp|bbva|interbank|cuenta|pago|transfer|tarjeta/ },
  { tema: 'horario', pregunta: /horario|atienden|abierto|abren|cierran|hora/, linea: /horario|lunes|sabado|domingo|a\. ?m|p\. ?m|\bhoras?\b/ },
  { tema: 'ubicacion', pregunta: /donde|ubica|direccion|tienda fisica|local|recoger/, linea: /direccion|ubicad|av\.|jr\.|calle|tienda|local/ },
];
const VACIAS = new Set('hola buenas buenos dias tardes noches quiero quisiera saber tienen tiene precio cuanto cuesta para favor gracias como donde cual cuales esta estan este esto hacen envios envio puedo pueden mandar sobre tambien seria podria producto productos cuestan venden vendes tienes unidad unidades precios costos'.split(' '));

// Cada dato por separado: una línea con varios productos ("Fipronil: S/ 45. Abono: S/ 38.") se parte en frases.
function lineasNegocio(contexto) {
  return String(contexto || '').split(/\n+/)
    .flatMap((l) => l.split(/(?<=\.)\s+(?=[A-ZÁÉÍÓÚÑ])/))
    .map((l) => l.trim()).filter((l) => l.length > 2).slice(0, 120);
}

// Líneas de "Datos de tu negocio" que responden el mensaje, por tema o por producto nombrado.
function buscar(mensaje, contexto) {
  const m = norm(mensaje);
  const lineas = lineasNegocio(contexto);
  const temas = TEMAS.filter((t) => t.pregunta.test(m));
  const palabras = [...new Set(m.split(/[^a-zñ0-9]+/).filter((w) => w.length >= 4 && !VACIAS.has(w)))];
  const elegidas = [];
  for (const l of lineas) {
    const n = norm(l);
    const porProducto = palabras.some((w) => n.includes(w) || (w.length >= 6 && n.includes(w.slice(0, -1))));
    const porTema = temas.some((t) => t.linea.test(n));
    if (porProducto || porTema) elegidas.push({ l, peso: (porProducto ? 2 : 0) + (porTema ? 1 : 0) });
  }
  // Si nombró un producto, van sus líneas (y las de otros temas que preguntó, como envío o pago); el tema "precio"
  // ya queda cubierto por la línea del producto.
  const deProducto = elegidas.filter((e) => e.peso >= 2);
  let final = elegidas;
  if (deProducto.length) {
    const otros = TEMAS.filter((t) => t.tema !== 'precio' && temas.includes(t));
    final = [...deProducto, ...elegidas.filter((e) => e.peso < 2 && otros.some((t) => t.linea.test(norm(e.l))))];
  }
  final.sort((a, b) => b.peso - a.peso);
  return { lineas: final.slice(0, 4).map((e) => e.l), temas: temas.map((t) => t.tema) };
}

function saludo() {
  const h = new Date().getHours();
  return h >= 5 && h < 12 ? 'Buenos días' : h >= 12 && h < 19 ? 'Buenas tardes' : 'Buenas noches';
}

// Cierre según lo que preguntó (una pregunta para avanzar la venta).
function cierre(temas) {
  if (temas.includes('precio')) return '¿Cuántas unidades necesitas?';
  if (temas.includes('envio')) return '¿A qué ciudad sería el envío?';
  if (temas.includes('pago')) return '¿Por cuál medio prefieres pagar?';
  return '¿Te ayudo con algo más?';
}

function sugerir(mensaje, contexto) {
  const texto = String(mensaje || '').trim();
  if (!texto) return { ok: false, error: 'Selecciona en el chat el mensaje del cliente y vuelve a intentarlo.' };
  const { lineas, temas } = buscar(texto, contexto);
  if (!lineasNegocio(contexto).length) {
    return { ok: false, error: 'Escribe tus precios, envíos, pagos y horario en "⚙ Configurar → Datos de tu negocio" para que MultiChat arme las respuestas (gratis).', needsContext: true };
  }
  if (!lineas.length) {
    return {
      ok: true,
      local: true,
      replies: [
        { label: 'Confirmar el dato', text: `${saludo()} 😊 Gracias por escribirnos. Déjame confirmarte ese dato y te respondo en un momento.` },
        { label: 'Pedir detalle', text: `${saludo()}, gracias por tu mensaje. ¿Me das un poco más de detalle para ayudarte mejor?` },
        { label: 'Breve', text: 'Hola 😊 Te confirmo en un momento.' },
      ],
    };
  }
  const datos = lineas.join('\n');
  const corto = lineas.slice(0, 2).join('\n');
  return {
    ok: true,
    local: true,
    replies: [
      { label: 'Respuesta directa', text: `${saludo()} 😊\n${datos}` },
      { label: 'Para cerrar la venta', text: `${saludo()}, gracias por escribirnos.\n${datos}\n${cierre(temas)}` },
      { label: 'Breve', text: `${corto}\n¿Te ayudo con algo más?` },
    ],
  };
}

module.exports = { sugerir, buscar };
