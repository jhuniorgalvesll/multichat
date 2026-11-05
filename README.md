# MultiChat Pro

**Descargar:** última versión en [Releases](https://github.com/jhuniorgalvesll/multichat/releases/latest) → `MultiChat-Setup-x.y.z.exe`. Después se actualiza sola.

Creado por **lliuya.pe**

Varias cuentas de WhatsApp, Telegram, Messenger, Instagram, **Meta Business Suite**, Discord y Slack en una sola app de escritorio.
Cada pestaña es una sesión independiente, así que puedes tener Fertisen 1, Fertisen 2, WhatsApp 3… al mismo tiempo.
Al agregar una cuenta, la pestaña te pide el nombre al momento.

## Cómo se usa

| Acción | Cómo |
|---|---|
| Agregar cuenta | Botón **+** arriba (o los botones de la pantalla de bienvenida) |
| Cambiar de cuenta | Clic en la pestaña, o **Ctrl+1…9** / **Ctrl+Tab** |
| Cerrar pestaña | **×** en la pestaña, clic con la rueda del mouse o **Ctrl+W**. La sesión queda guardada: se reabre desde **+ → Pestañas cerradas** |
| Ver varias a la vez | Botón de cuadrícula arriba a la derecha o **Ctrl+G** |
| Bloquear | Candado arriba (o **Ctrl+L**). Se activa en ⚙ → *Poner contraseña…* |
| Renombrar | Doble clic en la pestaña |
| Ordenar | Arrastrar la pestaña |
| Opciones de una cuenta | Clic derecho en la pestaña |
| Configuración | Engranaje ⚙ arriba a la derecha |

La primera vez, cada cuenta de WhatsApp pide escanear el QR con su teléfono. Después la sesión queda guardada.

## Funciones premium (v0.3)

Ninguna automatiza mensajes: no hay envíos automáticos, bots ni mensajes masivos, para respetar las normas de WhatsApp, Telegram y Meta. Tú siempre envías a mano.

| Función | Dónde |
|---|---|
| **Respuestas rápidas**: textos guardados que se pegan en el chat abierto (no se envían solos) | Botón ⚡ o **Ctrl+Shift+R** · ⚙ → *Respuestas rápidas…* |
| **Notificaciones con el nombre de la cuenta**: "Fertisen 1 · Juan Pérez" + el mensaje | Automático |
| **Horario de atención**: avisa solo de 07:00 a 19:00 (u otro horario) | ⚙ → *Horario de atención y no molestar* |
| **No molestar**: silencia todo al momento | Botón 🌙 |
| **Difuminar chats** cuando sales de la app, para que nadie lea por encima del hombro | ⚙ → *Difuminar chats al salir de la app* |
| **Color de etiqueta** por cuenta (franja de color en la pestaña) | Clic derecho en la pestaña → *Color de etiqueta* |
| **Zoom** por cuenta | **Ctrl +** / **Ctrl −** / **Ctrl 0**, o clic derecho → *Zoom* |
| **Siempre encima** de otras ventanas | ⚙ → *Mantener siempre encima* |
| **Copia de seguridad**: exportar/importar pestañas, respuestas rápidas y ajustes (sin sesiones ni contraseña) | ⚙ → *Copia de seguridad* |

## Novedades v1.8.4

- **Burbuja más discreta**: al llegar un mensaje o pago aparece **3 segundos** si estás usando la PC (otra app abierta) y
  **2 minutos** si la PC lleva más de un minuto sin uso (en el escritorio, sin tocar mouse ni teclado), para verla al
  volver. Se activa o apaga en ⚙ → *Burbuja flotante*.

## Novedades v1.8.3

- **Pestañas que se adaptan**: el ancho se calcula según el espacio libre de la barra. Si entran, se ven completas; si
  no, se achican (sin el tiempo de espera ni la ×) y, con muchas, solo el ícono con su contador (el nombre aparece al
  pasar el mouse). En ventanas angostas el logo queda sin el texto "MultiChat PRO".
- Se quitó el botón del creador de ofertas de la barra; sigue disponible en ⚙ → *Crear estado u oferta*.

## Novedades v1.8.2

- Corregido: *Verificar pago* / *Verificar la captura copiada* daba el error "clipboard.readImage is not a function"
  (Electron 44 lee el portapapeles de forma asíncrona).
- **Burbuja flotante apagada de fábrica** (se apaga una vez para todos). Si se activa en ⚙ → *Burbuja flotante al llegar
  mensajes o pagos*, aparece solo cuando llega algo con MultiChat en segundo plano y se esconde sola a los 2 minutos.

## Novedades v1.8.1

- Se desactiva (una vez) *Mantener siempre encima*: con esa opción la ventana no pasaba atrás al hacer clic en otro
  programa. Se puede volver a activar en ⚙.

## Novedades v1.8.0 — asistente con IA

- **✨ Asistente con IA** (botón de estrellas en la barra, o clic derecho → *Sugerir respuesta con IA*): selecciona el
  mensaje del cliente en el chat y la IA (Claude, de Anthropic) propone **3 respuestas distintas** usando los
  **datos de tu negocio** que escribes una vez (productos, precios, envíos, pagos, horario). *Pegar en el chat* deja
  el texto escrito: tú lo revisas y presionas Enter. Nunca responde ni envía solo.
- Necesita una **clave de API de Anthropic** (console.anthropic.com → API Keys), que se guarda cifrada en la PC.
  Cada sugerencia cuesta aprox. S/ 0.05–0.10 en la cuenta de Anthropic del usuario. Solo se envía el mensaje
  seleccionado y los datos del negocio, al pulsar el botón.

## Novedades v1.7.0

- **🛡️ Verificador de pagos**: clic derecho sobre la captura de Yape/Plin que manda un cliente →
  *Verificar pago de esta captura*. Windows lee el texto de la imagen (monto, hora, n° de operación, sin internet) y se
  compara con los pagos que de verdad llegaron: ✅ confirmado, 🟡 hay un pago de ese monto (revisar), ❌ **no llegó:
  posible captura falsa**. También se puede verificar una captura copiada o escribir el monto a mano
  (panel de pagos → *Verificar la captura de un cliente*). La imagen no se guarda.
- **🎨 Creador de estados y ofertas** (botón de imagen en la barra o ⚙): foto del producto, precio y precio anterior,
  etiqueta (Oferta, Nuevo…), texto, logo del remitente y pie con teléfono y tienda; 4 diseños y 2 tamaños
  (estado vertical o cuadrado). *Pegar en el chat* (WhatsApp muestra la vista previa; tú envías) o *Guardar imagen*.

## Novedades v1.6.0

- **Pantalla apagada**: con *Seguir avisando con la pantalla apagada* (panel de pagos, activado) la laptop no se
  suspende y MultiChat sigue diciendo los pagos aunque la pantalla esté apagada. La ventana ya no se "duerme" oculta.
- **Registro diario** de pagos y notificaciones del celular (carpeta `pagos/` de la app, un archivo por día): el panel
  de pagos permite ver días anteriores (‹ ›) y **exportar a Excel**. Los pagos que llegaron con MultiChat cerrado se
  registran al abrir (sin avisar), con su hora real.
- **Semáforo de respuesta**: cada pestaña con mensajes sin leer muestra cuánto lleva esperando
  (verde < 5 min, amarillo, rojo parpadeante desde 10 min).
- **Burbuja flotante**: aparece cuando MultiChat no está al frente, encima de cualquier programa; muestra los sin
  leer y un aviso verde "+ S/ 50 · Melissa" al llegar un pago. Clic: abre la cuenta con mensajes. Se arrastra a
  cualquier lugar; clic derecho → *Ocultar la burbuja* (o ⚙ → *Burbuja flotante*).

## Novedades v1.5.3

- Los cobros de **BBVA Empresas** se anuncian como Plin: aviso *"Plin · BBVA Empresas — Melissa Galvez te plineó
  S/ 50.00"* y voz *"Melissa Galvez te plineó 50 soles"*. Los de **Yape**: *"… te yapeó 50 soles"*.

## Novedades v1.5.2 — las actualizaciones nunca cierran la app

- Con MultiChat abierto **no se cierra ni se reinicia nada**: la versión nueva se descarga en segundo plano y solo
  aparece un aviso encima de la app (*Actualización lista · Entendido*), o una notificación chiquita si está en la
  bandeja.
- Se instala **la próxima vez que se abre MultiChat** (por ejemplo, al prender la PC): antes de abrir las cuentas
  aparece la ventanita **"Actualizando MultiChat Pro…"** unos segundos y luego la app se abre sola.
- Se quitaron la instalación al cerrar, la de madrugada y el botón *Instalar ahora*.

## Novedades v1.5.1 — actualizaciones sin interrumpir

- La app **ya no se cierra para actualizarse**: descarga la versión nueva en segundo plano y la instala en silencio
  **al cerrar MultiChat** o **de madrugada (1–5 a. m.) si la PC lleva 20 min sin uso**; después se vuelve a abrir
  sola (oculta en la bandeja si lo estaba). Las sesiones de WhatsApp no se cierran.
- *Instalar ahora (opcional)* muestra una ventanita **"Actualizando MultiChat Pro…"** y vuelve a abrirse en segundos.
- Al abrir la versión nueva: aviso **"✓ Actualizada a la versión X"** con *Ver novedades*.
- Los textos de la app ya no mencionan GitHub.

## Novedades v1.5.0 — paneles de MultiChat Pro y de pagos

- **Clic en el logo**: panel con la versión, el estado de las **actualizaciones** (*Buscar actualizaciones* /
  *Actualizar ahora*), las novedades de cada versión y el **creador: © lliuya.pe, todos los derechos reservados**
  (con el cafecito).
- **Botón de pagos** (billetera, reemplaza a "No molestar" y al cafecito de la barra): total cobrado hoy, lista de
  pagos de Yape, Plin y BBVA, estado de **Enlace Móvil** (conectado / cerrado, con botón *Abrir*), interruptores de
  avisos y voz, y las **últimas notificaciones del celular**. Opción para **leer en voz alta todas las
  notificaciones del celular** (respeta el horario de atención). *No molestar* sigue en ⚙ → *Horario de atención*.

## Novedades v1.4.1

- Se reconocen los cobros de **BBVA Empresas** ("Cobro con QR · HUGO PAUL DIAZ BLACIDO te hizo un pago de S/ 11.0"):
  aviso *"Hugo Paul Diaz Blacido te pagó S/ 11.00"* y voz *"… te pagó 11 soles"*.
- Botones de la barra con un estilo más profesional: íconos blancos uniformes dentro de una franja translúcida,
  que se iluminan al pasar el mouse o cuando están activos.

## Novedades v1.4.0 — nuevo diseño y voz de mujer

- **Diseño nuevo**: barra superior oscura con degradado violeta-azul y línea de colores, pestañas tipo cápsula con
  el **ícono de cada app** (WhatsApp, Telegram, Messenger, Instagram, Meta, Discord, Slack) y brillo de su color,
  contadores en degradado, botones de colores (cada herramienta con el suyo), botón **+ Cuenta**, pantalla de inicio
  con tarjetas grandes y ventanas con franja de colores.
- **Voz de los pagos**: elige una **voz de mujer** en español (Sabina, Helena, Laura… o una voz *natural* si está
  instalada), volumen al máximo y un **"ding"** antes de hablar.

## Novedades v1.3.3 — aviso de actualización dentro de la app

- Cuando hay una versión nueva, MultiChat la **descarga sola** y muestra una notificación propia:
  *"Nueva versión vX lista"* con el botón **Actualizar ahora** (se reinicia en segundos). Si no lo pulsas, se instala
  al cerrar la app. Revisa GitHub al abrir y cada hora.

## Novedades v1.3.2 — los pagos se anuncian en voz alta

- Cuando llega un Yape o Plin, MultiChat lo dice en voz alta con la voz en español de Windows (sin internet):
  *"Melissa Galvez te yapeó 50 soles"*, *"Juan Martínez te plineó 30 soles con 50 céntimos"*.
  Si la app está bloqueada solo dice *"Recibiste un Yape"*.
- ⚙ → *Avisos de Yape y Plin (Enlace Móvil)* → *Decir los pagos en voz alta* (activar/desactivar) y
  *Probar aviso y voz*.

### Conectar el iPhone con Enlace Móvil (una sola vez)

1. En la PC abre **Enlace Móvil** → *iPhone* y escanea el QR con la cámara del iPhone; acepta el emparejamiento
   por Bluetooth.
2. En el iPhone: **Ajustes → Bluetooth →** (ícono ⓘ junto a la PC) → activa **Compartir notificaciones del sistema**
   y **Mostrar notificaciones**.
3. En el iPhone: **Ajustes → Notificaciones → Yape** y **→ BBVA**: *Permitir notificaciones* activado.
4. En la PC: Enlace Móvil → ⚙ → *Notificaciones*: activadas; y en Windows → *Configuración → Sistema →
   Notificaciones* → **Enlace Móvil** activado.
5. En MultiChat: ⚙ → *Avisos de Yape y Plin* → *Revisar notificaciones de Enlace Móvil…* para ver que llegan.

## Novedades v1.3.1

- Publicación automática corregida: cada versión sube a *Releases* el instalador y el archivo `latest.yml` que usan
  las apps instaladas para actualizarse solas.

## Novedades v1.3.0 — avisos de Yape y Plin, y actualización automática

- **Avisos de Yape y Plin (BBVA)**: cuando el iPhone recibe un pago, Enlace Móvil de Windows muestra la notificación
  y MultiChat avisa: "💜 Yape · Junior Galvez te yapeó S/ 25.00" con el total del día.
  ⚙ → *Avisos de Yape y Plin (Enlace Móvil)*: activar/desactivar, *Pagos de hoy…* y *Revisar notificaciones de
  Enlace Móvil…* (para ver el texto tal como llega si un pago no se reconoce). Solo se lee el registro de
  notificaciones de Windows de tu PC; no se toca el celular, Yape ni el banco, y los pagos no se guardan.
- **Actualización automática**: la app revisa GitHub al abrir y cada 4 horas, descarga la versión nueva y pregunta
  *Reiniciar ahora / Después*. También en ⚙ → *Buscar actualizaciones…*.

### Cómo publicar una actualización

El código está en la rama `main` de `jhuniorgalvesll/multichat`.

1. Subir la versión nueva (`version` en `package.json`) a la rama `main`.
2. GitHub Actions arma el instalador en Windows y lo publica en *Releases* con su etiqueta (`v1.3.1`…).
   Si la versión no cambió, no se publica nada nuevo.
3. Las apps instaladas lo descargan solas.

## Novedades v1.2.7 — avisos para que el ticket no se descuadre

En ⚙ → *Remitentes de tickets*, para cada empresa:

| Dato | Letras recomendadas |
|---|---|
| Nombre | 25 |
| Lema bajo el logo | 32 |
| Origen | 20 |
| Remitente (recuadro) | 40 |
| Teléfono | 15 |
| Dirección | 45 |
| Correo | 35 |
| Tienda online | 28 |
| Texto "Importante" | 900 |

- Cada campo muestra **cuántas letras lleva** y se pone en rojo si se pasa.
- **Logo**: horizontal, unas 3 veces más ancho que alto, 1260 × 390 px (42 × 13 mm en el ticket). Avisa si la imagen es
  chica, vertical o demasiado alargada. **QR**: cuadrado, de al menos 600 × 600 px; avisa si no es cuadrado.
- **Revisión automática**: con un pedido de prueba bien largo (Olva a domicilio con todos los datos) dice si la empresa
  **cabe en 72 × 297 mm** y cuántos mm sobran. Botón *Ver ticket de prueba*.
- **Nunca se corta**: si un pedido no cabe en 297 mm (direcciones muy largas), la app achica la letra sola y lo avisa en
  la vista previa del ticket.

## Novedades v1.2.5 / v1.2.6

- La hoja es siempre **72 × 297 mm** (igual que la ticketera), así el ticket empieza arriba sin espacio en blanco.
- Si la empresa no tiene QR de WhatsApp, el **QR de la página web** va arriba a la derecha (sin hueco vacío).
- Al seleccionar el mensaje del cliente, se elige sola la empresa de envío: **Shalom**, **Olva** u otra
  (Marvisur, Cruz del Sur, Flores, Oltursa, Movil Bus, Civa, Excluciva, Emtrafesa, Serpost, Urbano, DHL…).

## Novedades v1.2.3 / v1.2.4 — logos del mismo tamaño en todas las empresas

- Los logos se pueden subir en PNG, JPG, **WebP**, GIF o BMP.

- Cada logo se ajusta solo para ocupar **la misma superficie que el de Fertisem** (42 × 13 mm), sea alargado o
  cuadrado (un logo cuadrado sale de 20 × 20 mm). Los bordes en blanco se recortan solos, también en los logos ya subidos.
- **+ Agregar remitente** copia los datos del primer remitente (dirección, correo, tienda, teléfono, QR, nota,
  tamaño de letra): solo se cambia el nombre y el logo.

## Novedades v1.2.2 — QR de la web y letra más pequeña

- **Dos QR en el ticket**: el de WhatsApp arriba y, abajo junto a "Tienda Online", el **QR de la página web**, que
  se crea solo con la dirección de la tienda online del remitente. Se puede quitar en ⚙ → *Remitentes de tickets*.
- **Tamaño de letra por remitente**: *Normal* o *Más pequeña* (≈85 %), mismo diseño. Útil, por ejemplo, para mascotas.
- **Logo**: los bordes blancos o transparentes se recortan solos al subirlo. Medida ideal: PNG de **1260 × 390 px**
  (en el ticket ocupa **42 × 13 mm**), sin bordes. QR de WhatsApp: cuadrado, de al menos 600 × 600 px.

## Novedades v1.2 — etiqueta renovada

- Un solo diseño de etiqueta, con **los mismos datos y tamaños de letra** que la original, ordenado en recuadros:
  remitente con esquinas redondeadas, franja "ENVÍO POR", y secciones **DESTINATARIO** y **DESTINO** con su título
  en franja negra.
- El instalador **cierra MultiChat si está abierto, borra copias antiguas** (por ejemplo `C:\Users\<usuario>\MultiChat`)
  y quita accesos directos e inicio automático viejos, para que solo quede la versión nueva. Tus cuentas y ajustes
  no se tocan.

## Novedades v1.1 — formularios para pedir los datos de envío

1. **📝 Pedir datos de envío** (botón arriba o clic derecho en el chat): pega en el chat el formulario de
   **Shalom** (nombre y apellidos, DNI, celular, nombre de la agencia, dirección de la agencia) u **Olva**
   (nombre y apellidos, DNI, celular, dirección de la casa, distrito, referencia 1, referencia 2, nota).
2. El cliente responde con el formulario lleno → selecciona su respuesta → clic derecho →
   *Imprimir ticket de envío con lo seleccionado*: cada dato se lee por su título y el ticket se llena solo.
3. **📋 Enviar datos al cliente para confirmar** → el cliente dice "sí" → **🖨 Imprimir**.

- La etiqueta imprime también **DNI, distrito, referencia 1 y 2, y nota**.
- Los formularios se editan en ⚙ → *Formularios de envío* (con botón *Restaurar originales*).
- Nada se envía solo: siempre presionas Enter tú.

## Novedades v1.0 — tickets de envío para ticketera

- **🖨 Imprimir ticket de envío** (reemplaza a "Registrar venta"): selecciona en el chat el mensaje con los datos
  del cliente → clic derecho → *Imprimir ticket de envío con lo seleccionado* (o **Ctrl+P**, o el botón 🖨).
- Formato igual a los PDF de ejemplo, **72 × 297 mm**: logo + QR, canalización y origen, recuadro del remitente,
  destinatario y celular, destino, código de barras del N° de orden, tienda, teléfono y nota "Importante".
  - Todo es editable y opcional: Destino, Agente/agencia, Dirección y Referencia sirven para Shalom y Olva
    (envío a agencia o a domicilio); solo se imprime lo que se llena.
  - *Datos del remitente (editables para este envío)*: origen, remitente, dirección, correo, tienda y teléfono
    se pueden cambiar en cada ticket sin tocar el remitente guardado.
- Se detectan solos: nombre, celular, destino (`LIMA / LIMA / SURCO`), agencia, dirección y referencia.
- **Imprimir directo**: se elige la ticketera una vez en el panel (queda recordada) y *Imprimir* imprime al instante,
  sin diálogo. Opción *Elegir cada vez* para ver el diálogo de Windows. **Guardar PDF** también.
- El ticket **no guarda datos del cliente**: solo imprime.
- La etiqueta lleva una franja **"ENVÍO POR: SHALOM / OLVA"** (o la empresa escrita en *Otra*, p. ej. Marvisur).
- **📋 Enviar datos al cliente para confirmar**: pega en el chat abierto los datos con los títulos en negrita de
  WhatsApp; el cliente valida y luego se imprime.
- **+ Agregar empresa…** en la lista de remitentes para registrar una empresa nueva sin salir del ticket.
- **Remitentes** (⚙ → *Remitentes de tickets*): FERTISEM y AGROANDINA vienen configurados con su logo y el QR de
  WhatsApp Business; se pueden editar o agregar otros.
- El registro de ventas sigue disponible en ⚙ → *Registro de ventas*.

## Novedades v0.9

- **☕ Invítale un cafecito al creador**: botón de taza arriba (o clic en el logo, o ⚙) con el Yape del creador
  (925 459 643) y botón *Copiar número*. Es voluntario: no bloquea funciones ni aparece solo.
- **Ícono nuevo** más moderno.

## Novedades v0.8 — Meta Business Suite

- Nuevo servicio **Meta Business Suite** (bandeja de entrada de Facebook e Instagram de tus páginas):
  botón **+** → *Meta Business Suite*. Se pueden tener varias (Meta Business 1, 2…), cada una con su sesión.
- Las ventanas de inicio de sesión o de vincular cuentas de Meta se abren dentro de la app con la misma sesión;
  los enlaces a otros sitios se abren en tu navegador.

## Novedades v0.7 — envíos y pagos

| Función | Dónde |
|---|---|
| **Respuestas rápidas con fotos**: QR de Yape/Plin, cuentas bancarias, link de pago, fotos de productos. Vienen 5 de ejemplo para completar | ⚡ · ⚙ → *Respuestas rápidas…* → *📷 Agregar foto* |
| **Variables**: `{saludo}` (Buenos días / tardes / noches), `{cuenta}`, `{fecha}` | En el texto de la respuesta |
| **Envío en cada venta**: Shalom / Olva / Recojo en tienda, N° de orden, destino, estado y costo | Panel de venta → *Envío* |
| **Envíos pendientes**: lista con estado, foto de la boleta, *Rastrear* y *Enviar al cliente* | ⚙ → *Envíos pendientes* |
| **Link de pago** como método de pago | Panel de venta |

- **Rastrear** abre la página de rastreo de Shalom u Olva con el N° de orden ya copiado (pégalo con Ctrl+V).
  La primera vez pide la dirección de la página; se cambia en ⚙ → *Páginas de rastreo*.
- **Enviar al cliente** abre el chat del celular de la venta (enlace oficial `web.whatsapp.com/send?phone=…`)
  y deja la foto de la boleta y el mensaje con el N° de orden y el link de rastreo listos. Tú presionas Enter.
- Las fotos se pegan como Ctrl+V: WhatsApp muestra su vista previa y el texto va como descripción.

## Novedades v0.6

| Función | Dónde |
|---|---|
| **Responder desde la notificación**, aunque la app esté oculta | Botón *Responder* en la notificación |
| **Modo claro / oscuro** | Botón 🌙/☀ arriba · ⚙ → *Apariencia* |
| **Recordatorios** de seguimiento ("Confirmar pago de Juan" en 1 hora) | Botón ⏰ · clic derecho en el chat o en la pestaña → *Recordarme…* |
| **Resumen de ventas**: hoy, semana, mes, ticket promedio, productos más vendidos y ventas por cuenta | Botón 🧾 |

**Cómo se responde sin arriesgar la cuenta:** la respuesta se envía solo si MultiChat confirma que el chat
abierto es el de la persona de la notificación (por el nombre en el encabezado del chat de WhatsApp). Si no
puede confirmarlo —o en Telegram y otras apps— abre la app con tu respuesta ya escrita para que la revises y
presiones Enter. Nunca envía nada que tú no hayas escrito.

## Registro de ventas (v0.4)

- Botón 🧾 arriba: lista de ventas con buscador, filtro por cuenta, total y **Exportar a Excel** (CSV).
- **Registrar una venta desde el chat:** selecciona el mensaje del cliente → clic derecho →
  *Registrar venta con lo seleccionado* (o **Ctrl+Shift+S**). Se abre un panel a la derecha, con el chat
  visible, y se rellenan solos **nombre, DNI, celular y monto** si están en el texto seleccionado.
- La app **no lee tus chats por su cuenta**: solo analiza el texto que tú seleccionas, al momento de hacerlo.
  Así se respetan las normas de WhatsApp contra la recolección automática de datos.
- Las ventas se guardan solo en esta PC (`ventas.json`). Son datos personales (Ley 29733 en Perú):
  pide permiso a tus clientes y no los compartas.

## Contraseña

- ⚙ → *Poner contraseña…*: eliges la contraseña y una **pregunta de seguridad**.
- Al abrir la app (o al bloquearla) se pide la contraseña.
- **¿La olvidaste?** En la pantalla de bloqueo toca *¿Olvidaste tu contraseña?*, responde la pregunta
  y crea una nueva. La respuesta no distingue mayúsculas ni tildes.
- Con la app bloqueada, las notificaciones no muestran el texto de los mensajes.
- ⚙ → *Bloqueo automático*: bloquea sola tras unos minutos sin usar la PC.
- La contraseña se guarda cifrada (hash scrypt), nunca en texto plano. Protege el acceso a la app,
  no cifra los archivos del disco.

## Ahorro de memoria

- Al abrir la app solo se carga la última cuenta usada y las marcadas como **Siempre activa**.
- Las cuentas que no usas por un rato se **suspenden** (pestaña atenuada) y liberan su memoria.
  La sesión no se pierde: al tocarla vuelve a cargar en 2–3 segundos.
- Una cuenta suspendida **no recibe notificaciones**. Marca como *Siempre activa* (clic derecho)
  las cuentas importantes.
- Tiempo de suspensión: ⚙ → *Suspender cuentas inactivas* (por defecto 30 minutos).
- ⚙ → *Ver uso de memoria* muestra cuántos MB usa cada cuenta.
- En la vista de cuadrícula todas las cuentas abiertas están cargadas, así que usa más memoria.

## Para desarrollo

Requiere Node.js 20 o superior.

```bash
npm install
npm start           # abrir la app
npm run dist:win    # crear el instalador de Windows en dist/
```

## Estructura

```
src/main.js             ventana, pestañas, sesiones, suspensión, menús, bandeja
src/services.js         lista de servicios (agregar uno nuevo = agregar una entrada)
src/store.js            guarda cuentas y configuración en config.json
src/security.js         hash de la contraseña y de la respuesta de seguridad
src/sales.js            registro de ventas y envíos, detección de DNI/celular/destino, exportación a CSV
src/media.js            fotos guardadas: respuestas rápidas, boletas y logos/QR de tickets
src/tickets.js          tickets de envío: remitentes, detección de datos, medida 72 × 297 mm
ui/ticket.*             diseño del ticket (vista previa e impresión) y código de barras Code 128
src/notifier.js         notificaciones propias con botón Responder (ui/toast.*)
src/preload-service.js  notificaciones de cada cuenta → MultiChat
src/preload-ui.js       puente seguro entre la barra y la app
ui/                     barra superior de pestañas (HTML/CSS/JS sin librerías)
```
