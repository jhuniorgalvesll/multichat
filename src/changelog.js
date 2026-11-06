'use strict';

// Novedades que se muestran en el panel de MultiChat Pro (clic en el logo). La más nueva primero.
module.exports = [
  {
    version: '1.10.8',
    items: ['La voz de los pagos ahora usa el motor de voz de Windows: suena siempre, aunque estés escuchando música o YouTube, con voz de mujer y al volumen máximo.'],
  },
  {
    version: '1.10.7',
    items: ['Ficha de agencia copiada de la página de Shalom: se lee bien aunque venga en otro orden ("a km", "Grande / Co") o con el lugar partido en dos líneas.'],
  },
  {
    version: '1.10.6',
    items: ['Corregido: al seleccionar el mensaje del cliente junto con la ficha de Shalom, el Destino ahora es "Lima / Cañete / Mala / Mala" (no "MALA") y la Dirección es la completa.'],
  },
  {
    version: '1.10.5',
    items: ['Ticket con Shalom: solo se ven Destino y Dirección de la agencia (los demás campos se ocultan y quedan vacíos).'],
  },
  {
    version: '1.10.4',
    items: ['El aviso "Falta: apellidos (nombre completo)" ahora también vale para Olva y cualquier otra empresa.'],
  },
  {
    version: '1.10.3',
    items: [
      'Olva: después de la dirección de la casa, las líneas sin título van a Referencia 1, Referencia 2 y Nota.',
      'Shalom: avisa si el destinatario no tiene nombre y apellidos completos ("Falta: apellidos").',
      'Las frases como "En un momento le envío los datos" ya no se toman como datos.',
    ],
  },
  {
    version: '1.10.2',
    items: ['Shalom con ficha oficial: DESTINO = "Lima / Cañete / Mala / Mala" y DIRECCIÓN = la línea completa con su referencia (Olva sigue igual).'],
  },
  {
    version: '1.10.1',
    items: [
      'Los datos de envío se detectan aunque el formulario no se haya mandado con el botón 📝 (basta con que esté en el chat abierto, enviado hoy).',
      'Lectura más segura de los mensajes de WhatsApp Web.',
      'Nuevo en ⚙ → Ventas y envíos: "Revisar lectura de datos de envío" para ver qué está leyendo la app.',
    ],
  },
  {
    version: '1.10.0',
    items: [
      'Datos de envío automáticos: después de mandar el formulario, cuando el cliente responde te avisa "📦 envió sus datos" y abre el ticket ya lleno.',
      'Entiende respuestas sin títulos y en varios mensajes, y te dice qué falta (por ejemplo, el DNI).',
      'Shalom: usa la ficha oficial de la agencia que le mandas al cliente (agencia, destino, dirección y referencia).',
      'Cuando el cliente responde "sí, correcto" a tus datos de confirmación, avisa "✅ listo para imprimir".',
    ],
  },
  {
    version: '1.9.3',
    items: [
      'Pagos solo del día de trabajo (desde las 7:00 a. m.): al día siguiente se borran solos y empieza en S/ 0.00.',
      'Se quitaron los días anteriores y el Excel.',
      'Nuevo: Impresiones de hoy, con Reimprimir y cuántos tickets de Shalom y Olva. También se borra al día siguiente.',
    ],
  },
  {
    version: '1.9.2',
    items: [
      'Yapeos que llegan por correo del BCP ("Recibiste un yapeo de S/ 1,157.00 de …"): se avisan, se dicen en voz y se suman.',
      'Se toman del aviso del nuevo Outlook; los demás correos se ignoran y no se guardan.',
    ],
  },
  {
    version: '1.9.1',
    items: [
      'Corregido: los Yape con el nombre oculto ("Yodver Lim*") no se sumaban. Ahora sí, y se recuperan los de hoy y ayer.',
      'El total cobrado muestra cuántos Yape y cuántos Plin hay, con su suma.',
    ],
  },
  {
    version: '1.9.0',
    items: [
      'Configuración nueva: panel que se desliza desde la derecha, con buscador, accesos rápidos y secciones.',
      'Bienvenida del día: lo cobrado ayer y hoy, envíos pendientes, mensajes y recordatorios.',
      'Los botones de la barra muestran su nombre al pasar el mouse.',
      'Color de la app a elección: violeta, azul, verde, naranja o rosa.',
      'Animaciones: cambio de pestaña, ventanas y el total cobrado.',
    ],
  },
  {
    version: '1.8.4',
    items: ['La burbuja aparece solo 3 segundos si estás usando otra app, y 2 minutos si la PC está sin uso.'],
  },
  {
    version: '1.8.3',
    items: [
      'Las pestañas se achican solas para que entren todas; con muchas, se ve solo el ícono con su contador.',
      'Se quitó el botón de ofertas de la barra (sigue en ⚙ → Crear estado u oferta).',
    ],
  },
  {
    version: '1.8.2',
    items: [
      'Corregido el error al verificar una captura copiada ("clipboard.readImage is not a function").',
      'La burbuja flotante viene apagada; si la activas, aparece 2 minutos al llegar un mensaje o pago.',
    ],
  },
  {
    version: '1.8.1',
    items: ['MultiChat ya no se queda encima de los demás programas: al hacer clic en otro, pasa atrás como cualquier ventana.'],
  },
  {
    version: '1.8.0',
    items: [
      'Asistente con IA: selecciona el mensaje del cliente y te sugiere 3 respuestas para pegar en el chat.',
      'Usa los datos de tu negocio (precios, envíos, pagos) y no inventa: tú revisas y envías.',
    ],
  },
  {
    version: '1.7.0',
    items: [
      'Verificador de pagos: clic derecho en la captura del cliente → te dice si el pago llegó o si puede ser falsa.',
      'Creador de estados y ofertas: foto, precio y logo en una imagen lista para pegar o subir a estados.',
    ],
  },
  {
    version: '1.6.0',
    items: [
      'Sigue diciendo los pagos con la pantalla apagada (la laptop no se suspende).',
      'Registro diario de pagos y notificaciones del celular, con días anteriores y exportar a Excel.',
      'Registra también los pagos que llegaron con MultiChat cerrado.',
      'Semáforo de respuesta: cada pestaña muestra cuánto espera el cliente (verde, amarillo, rojo).',
      'Burbuja flotante encima de otros programas con los mensajes sin leer y los pagos.',
    ],
  },
  {
    version: '1.5.3',
    items: [
      'Los cobros de BBVA Empresas se anuncian como Plin: "Melissa Galvez te plineó 50 soles".',
      'Los de Yape: "Melissa Galvez te yapeó 50 soles".',
    ],
  },
  {
    version: '1.5.2',
    items: [
      'Las actualizaciones nunca cierran MultiChat: se avisa con una ventanita encima de la app.',
      'La versión nueva se instala al volver a abrir MultiChat, con la ventanita "Actualizando…".',
    ],
  },
  {
    version: '1.5.1',
    items: [
      'Las actualizaciones ya no cierran la app: se instalan solas al cerrarla o de madrugada.',
      'Ventanita "Actualizando…" al instalar y aviso "Actualizada a la versión…".',
    ],
  },
  {
    version: '1.5.0',
    items: [
      'Panel de MultiChat Pro: versión, actualizaciones y datos del creador.',
      'Nuevo botón de pagos: Yape, Plin y BBVA del día, y todo lo que llega del celular por Enlace Móvil.',
      'Detecta si Enlace Móvil está abierto y conectado.',
      'Opción para leer en voz alta todas las notificaciones del celular.',
    ],
  },
  { version: '1.4.1', items: ['Cobros con QR de BBVA Empresas.', 'Íconos de la barra más profesionales.'] },
  { version: '1.4.0', items: ['Diseño nuevo.', 'Voz de mujer y "ding" para los pagos.'] },
  { version: '1.3.3', items: ['Aviso de actualización dentro de la app ("Actualizar ahora").'] },
  { version: '1.3.2', items: ['Los pagos se dicen en voz alta.'] },
  { version: '1.3.0', items: ['Avisos de Yape y Plin por Enlace Móvil.', 'Actualización automática.'] },
];
