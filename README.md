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

## Novedades v1.25.1

- **Llamadas de WhatsApp Web**: las ventanas que WhatsApp abre para sí mismo (como la de una llamada) se abren dentro de la app con la misma sesión, en lugar de bloquearse. Se permite elegir parlante o audífonos y compartir pantalla, con un selector para elegir qué pantalla o ventana compartir.

## Novedades v1.25.0

- **Agencias Shalom al instante**: la app trae la lista oficial completa (501 agencias), así que los resultados salen mientras escribes, en menos de 1 segundo, aunque la PC todavía no haya descargado la lista del día. En segundo plano se pregunta a la página de Shalom (máximo 8 segundos) y se suman las agencias que falten (p. ej. Sapallanga al buscar Huancayo). Si un lugar no está en la lista, *Buscar* pregunta a Shalom con 8 segundos como máximo. La actualización diaria ya no bloquea las búsquedas, y si falla se muestra el motivo y se sigue usando la lista anterior.

## Novedades v1.24.0

- **Lista completa de agencias Shalom, al día**: MultiChat recorre la página oficial departamento por departamento (25 departamentos, unas 500 agencias en 1 minuto) y guarda la lista en la PC. Se actualiza sola una vez al día en segundo plano y avisa "🏢 Agencias Shalom: 2 nuevas, 1 cerrada" con el detalle; las cerradas dejan de salir en las búsquedas y las nuevas aparecen. Si la actualización sale incompleta (sin internet, página lenta), se conserva la lista anterior. En la ventana de agencias se ve "Lista oficial: 501 agencias · actualizada hoy", los últimos cambios y *🔄 Actualizar ahora*. Las búsquedas juntan la búsqueda en vivo de Shalom con la lista completa.

## Novedades v1.23.2

- **Agencias de todo el distrito**: el buscador de Shalom solo entiende el nombre oficial y, con nombres repetidos, muestra uno. Ahora MultiChat traduce nombres cortos y siglas de Lima (Surco → Santiago de Surco, SJL, SJM, SMP, VES, VMT, Magdalena, Chosica, Cercado…) y, para distritos de Lima y Callao, suma las agencias cuya dirección menciona el distrito (revisa la lista completa de Lima y Callao; se guarda 3 días, la primera vez tarda unos 20 segundos). Departamentos (Junín, Ayacucho…) y provincias (Huancayo, Cañete…) traen todas sus agencias.

## Novedades v1.23.1

- **Agencias Shalom desde el mensaje del cliente**: selecciona el mensaje con su dirección (por ejemplo "Av. San Juan Mz A, Santiago de Surco 15058") → clic derecho → *🏢 Agencias Shalom cerca de "Santiago de Surco"*. También entiende "envío a Ayacucho" o "para Huancayo". La agencia cuya dirección coincide con la del cliente sale primero ("📍 Cerca de la dirección del cliente").
- Corregido: algunos lugares (como Santiago de Surco) decían "no muestra agencias" porque Shalom tardaba en filtrar; ahora se espera hasta 10 segundos.

## Novedades v1.23.0

- **🏢 Agencias Shalom por lugar**: 📝 Pedir datos de envío → *🏢 Buscar agencias Shalom por lugar…* (también en ⚙ o seleccionando el lugar en el chat → clic derecho → *Ver agencias Shalom en "Huancayo"*). Se busca en la página oficial de Shalom y aparecen las agencias con nombre, dirección, referencia y tamaño. Marcas hasta 10 y se pegan en el chat, numeradas, con "¿En cuál agencia prefieres recoger tu pedido?". Tú presionas Enter.

## Novedades v1.22.1

- **Verificar con código y N° de operación**: al llegar un pago se guardan su código de seguridad (Yape) y su número de operación si el aviso los trae. El verificador lee de la captura del cliente el código de seguridad y el N° de operación: si coincide → "✅ Pago confirmado · ✓ El código de seguridad coincide"; si hay un pago de ese monto pero el código u operación es distinto → "⚠️ El código NO coincide" (posible captura editada o de otro pago). También se puede escribir el código o la operación a mano.

## Novedades v1.22.0

- **✅ Confirmar pago en 1 clic**: cuando un Yape o Plin se reconoce con el chat del cliente, el aviso trae *✅ Confirmar pago* (y *💬 Abrir chat*); también en Pagos de hoy. Abre el chat y pega "✅ ¡Recibimos tu pago de S/ 45.00 por Yape! Muchas gracias 🙌"; tú presionas Enter.
- **🧾 Constancia al chat**: en Pagos de hoy, una imagen "Pago recibido · Constancia del negocio" con monto, nombre, medio, fecha, hora y código de seguridad, con tu logo; se pega en el chat del cliente.
- **⚠ Enlace Móvil cerrado**: si se cierra (y en esta PC ya se usaba), aviso y voz "Los Yape no van a llegar", con botón para abrirlo; como mucho cada 30 minutos. Opción en ⚙ → Pagos.
- **🔎 Buscar en Impresiones de hoy** por nombre, DNI, celular, N° de pedido o destino.
- **Cuentas pesadas**: una cuenta que no estás mirando y usa más de 1,2 GB de memoria se recarga sola (la sesión sigue iniciada). Opción en ⚙ → Sistema.

## Novedades v1.21.6

- **Seguridad**:
  - "Abrir enlace en el navegador" y los enlaces de los chats solo abren direcciones web (http/https), correo y teléfono; se bloquean enlaces que abren programas o archivos de Windows (file:, ms-…, search-ms:…).
  - Las ventanas de SUNAT, eldni.com y Shalom no pueden abrir ventanas emergentes (publicidad).
  - La ventana de MultiChat no puede cambiar a otra página.
  - El ejecutable quedó cerrado a usos de desarrollador (correr código con él o depurarlo desde afuera).

## Novedades v1.21.5

- **Barra más limpia**: se ocultaron los botones ✨ IA y ⏰ Recordatorios para dar espacio a las pestañas. Siguen en ⚙ → *Herramientas* (✨ Asistente con IA, ⏰ Recordatorios) y en el clic derecho del chat. Para volver a verlos: ⚙ → Apariencia → *Mostrar los botones ✨ IA y ⏰ Recordatorios en la barra*.

## Novedades v1.21.4

- **Dólar del día corregido**: ahora sí aparece en la barra y es el **tipo de cambio de SUNAT** del día: "$ C 3.447 · V 3.453" (compra y venta). Si SUNAT no responde, se muestra un valor referencial "$ ≈ 3.443".

## Novedades v1.21.3

- **Ventanas de una en una**: el botón de cuadrícula (o Ctrl+G) agrega una cuenta por clic: 2 → 3 → … → todas → vuelve a una. Se ven la cuenta activa y las siguientes en el orden de tus pestañas; el botón muestra el número.

## Novedades v1.21.2

- **Dólar del día y próxima fecha** en la barra, en letra fina: tipo de cambio interbancario oficial del BCRP (pasa el mouse para ver compra y venta; se actualiza cada 3 horas) y "🎄 en 32 días" para la próxima fecha especial (aparece 45 días antes). Se quita en ⚙ → Apariencia. En pantallas angostas se oculta.

## Novedades v1.21.1

- **Pestañas movibles**: arrastra una pestaña (WhatsApp, Telegram, Instagram…) a la izquierda o a la derecha y queda guardada en ese lugar. O clic derecho en la pestaña → *⬅ Mover a la izquierda* / *Mover a la derecha ➡*.

## Novedades v1.21.0

- **Clientes VIP**: clic derecho dentro del chat → *⭐ Marcar a … como VIP*. Sus mensajes avisan con "⭐ VIP", borde dorado y un sonido especial de cuatro notas. Se quita igual.
- **Corrector de ortografía** en español mientras escribes (subrayado rojo); clic derecho sobre la palabra → sugerencias o "Agregar al diccionario". Se apaga en ⚙ → Apariencia.
- **Mismos ajustes en varias PCs**: ⚙ → *🔄 Mismos ajustes en varias PCs* → eliges una carpeta de OneDrive, Google Drive o Dropbox (la misma en cada PC). Se comparten respuestas rápidas (con fotos), remitentes (logo y QR), formularios, opciones de envío, datos del negocio y páginas de rastreo. Gana el último cambio. No se comparten cuentas, chats, pagos ni claves.
- **Tema por temporada**: colores, emoji y saludo en Navidad, Año Nuevo, San Valentín, Día de la Madre, Día del Padre, Fiestas Patrias y Canción Criolla; luego vuelve tu color. Se apaga en ⚙ → Apariencia.

## Novedades v1.20.0

- **Opciones de envío para el cliente**: en 📝 *Pedir datos de envío* → *📋 Opciones de envío (para que el cliente elija)* se pega un mensaje ordenado (con negritas de WhatsApp) que explica Olva (domicilio) y Shalom (agencia): tiempos, pago del producto y del flete. Es informativo: el chat no queda esperando datos. Se edita en *Editar formularios*. Las PCs nuevas reciben una plantilla sin datos del negocio.

## Novedades v1.19.6

- **Destinatario automático**: en el ticket de envío, si hay un DNI de 8 dígitos (detectado o escrito) y el destinatario está vacío, MultiChat busca el nombre por DNI y llena *Destinatario* ("✓ Nombre encontrado por DNI: revísalo"). No cambia un nombre que ya escribiste.

## Novedades v1.19.5

- **DNI → nombre automático**: al consultar un DNI, cuando la búsqueda muestra el resultado de ese DNI, MultiChat toma el nombre completo (solo eso) y cierra la ventana. Luego: *💬 Pegar en el chat* (nombre y DNI listos para WhatsApp, tú presionas Enter) o *🖨 Usar en el ticket* (destinatario y DNI).

## Novedades v1.19.4

- **RUC o DNI, cada uno a su página**: el RUC (11 dígitos) se consulta en SUNAT; el DNI (8 dígitos) abre directo la búsqueda de datos por DNI (eldni.com) en una ventana con el número escrito y buscado. Copias el nombre, lo pegas en MultiChat y *Usar en el ticket*. MultiChat no lee esa página.

## Novedades v1.19.3

- **Consulta → ticket**: después de consultar un RUC o DNI, *🖨 Usar en el ticket* llena el destinatario (nombre o razón social) y el DNI (del RUC 10 o del DNI consultado). Si el DNI no tiene RUC, pegas el nombre (por ejemplo de eldni.com) y lo pasas al ticket. Completas agencia o dirección y presionas Imprimir.

## Novedades v1.19.0

- **Consultar RUC o DNI en SUNAT (gratis)**: selecciona el número en el chat → clic derecho → *🔎 Consultar RUC/DNI … en SUNAT*, o ⚙ → *Consultar RUC o DNI*. Se abre la página oficial de SUNAT en una ventana con el número ya escrito (si SUNAT pide verificación, la marcas tú) y MultiChat muestra RUC, razón social, estado, condición y domicilio fiscal para copiarlos. No se salta ninguna verificación de SUNAT.

## Novedades v1.18.5

- **Sugerir respuestas gratis**: sin clave de Anthropic, *✨ Sugerir 3 respuestas* busca en "Datos de tu negocio" lo que pregunta el cliente (producto, precio, envío, pago, horario, ubicación) y arma 3 respuestas con ese texto, sin IA y sin costo. Si no encuentra el dato, propone confirmarlo. La clave de Anthropic queda como opción de pago.

## Novedades v1.18.4

- **Consultar envío gratis**: sin clave de Anthropic, MultiChat arma solo las 3 respuestas (estado, cálida y breve) con el estado y las fechas que da Shalom, sin IA y sin costo. Con clave, las escribe la IA; si la IA falla, quedan las de MultiChat.

## Novedades v1.18.3

- **Código del ticket mal leído**: si Shalom no encuentra la orden, MultiChat prueba las letras que el lector suele confundir (W/V, O/0, I/1, S/5, B/8…) y, si una funciona, corrige el código y avisa "✓ Código corregido".

## Novedades v1.18.2

- **Actualizar ahora**: el aviso "Actualización lista" y el panel del logo tienen el botón *Actualizar ahora* (MultiChat se cierra unos segundos y vuelve a abrirse con tus cuentas). "Buscar actualizaciones" encuentra la versión más nueva aunque ya haya otra descargada.

## Novedades v1.18.1

- **Consultar envío desde la foto del ticket**: clic derecho sobre la foto del ticket de Shalom en el chat → *📦 Consultar envío Shalom con este ticket*. Lee el N° de orden y el código impresos (Windows), consulta Shalom y la IA propone las 3 respuestas. También: botón "📷 Leer N° y código de una foto del ticket" en el asistente (con la foto copiada).
- Corregido: el estado se lee del título de Shalom ("En origen", "En destino"...), no de la barra de etapas.

## Novedades v1.18.0

- **Consultar envío de Shalom** desde el asistente con IA: con el N° de orden y el código de 4 caracteres del ticket (se detectan solos en el mensaje del cliente), MultiChat consulta el rastreo público de Shalom y la IA propone 3 respuestas usando **solo** lo que dice Shalom (estado y fechas), sin inventar plazos, agencias ni costos, y sin escribir datos personales. Tú eliges una y presionas Enter.

## Novedades v1.17.4

- **La PC ya no se calienta**: "Seguir avisando con la pantalla apagada" se apagó para todos, así Windows apaga la pantalla y suspende la laptop normal. Los pagos que lleguen mientras duerme se registran al volver. Quien quiera puede activarlo en ⚙ → Pagos (avisa que la laptop no se duerme y puede calentarse).

## Novedades v1.17.3

- Los Yape registrados hoy antes de actualizar también muestran su **código de seguridad** (se toma del aviso guardado del celular).

## Novedades v1.17.2

- **Código de seguridad de Yape**: la voz lo dice dígito por dígito ("Miguel Rojas te yapeó 16 soles. Código de seguridad: 4, 2, 7") y aparece en el aviso y en Pagos de hoy, para compararlo con la captura del cliente.

## Novedades v1.17.1

- La calificación se pide **una vez al día hasta que se envíe** ("Mañana" la pospone un día). En PCs nuevas empieza el día siguiente a instalar; en las que ya se usaban, desde ahora.

## Novedades v1.17.0

- **⭐ Calificar MultiChat** (logo de MultiChat Pro o ⚙): estrellas, comentario y nombre opcional; se envía por WhatsApp al creador (el cliente presiona Enviar). Se pide una sola vez a los 7 días de uso. Las calificaciones aprobadas salen en la página de descarga.

## Novedades v1.16.0

- **Pago ↔ chat**: al llegar un Yape o Plin, sugiere el chat del cliente (nombre parecido o el único que mandó una foto) y con un clic lo abre.
- **Pago repetido**: mismo nombre y monto en menos de 15 minutos → aviso "⚠ Pago repetido".
- **Ticket**: código del N° de pedido en barras, QR (con los datos del envío) o los dos.
- **Más empresas**: formularios y botones para Marvisur, Flores y Cruz del Sur.
- **Respuestas rápidas** con `{cliente}` (nombre del chat) y `{pedido}` (N° de su ticket de hoy).
- **Modo compacto** (⚙ → Apariencia) y **guía de inicio** de 4 pasos en PCs nuevas.
- **Página de descarga**: https://jhuniorgalvesll.github.io/multichat/

## Novedades v1.15.0

- **MultiChat para Mac** (chip Apple M1, M2, M3, M4 e Intel). Descarga en Releases:
  - Mac con chip Apple: `MultiChat-<versión>-arm64.dmg`
  - Mac con Intel: `MultiChat-<versión>-x64.dmg`
- Cómo instalar en Mac: abre el `.dmg` y arrastra **MultiChat** a **Aplicaciones**. La primera vez, macOS avisa que no puede verificar al desarrollador (la app no está firmada con Apple): ve a **Ajustes del Sistema → Privacidad y seguridad** y pulsa **Abrir igualmente** (solo una vez).
- En Mac: voz de Mac para los pagos, Cmd+C / Cmd+V en los chats, atajos con ⌘. Las actualizaciones avisan igual; "Descargar versión nueva" baja el `.dmg` para reemplazar la app.
- Lo que es solo de Windows: avisos de Yape y Plin del celular (Enlace Móvil), lectura de capturas y bajar el brillo con la pantalla en negro.

## Novedades v1.14.0

- **Actualización obligatoria**: si la PC está muy atrasada (3 versiones o más, p. ej. 1.10 → 1.14) o la actualización espera **10 días**, sale "Actualización obligatoria" con cuenta regresiva de 10 minutos y se instala sola, **directo a la última versión**. Si se está usando la PC, espera a que la dejen un minuto; con la app oculta, se instala cuando nadie usa la PC.

## Novedades v1.13.0

- **Recordatorio de actualización**: la versión nueva se descarga sola. Si nadie reinicia MultiChat, a los **2 días** sale un aviso suave ("Más tarde" / "Actualizar ahora"), se repite **cada 3 días** y desde la **semana** pasa a "Actualización necesaria" cada 4 horas hasta que se actualice.
- **Actualizar ahora**: se cierra unos segundos, se instala y vuelve a abrirse sola; las cuentas siguen conectadas.

## Novedades v1.12.1

- **Remitentes de tickets**: las PCs nuevas empiezan sin remitentes; al hacer el primer ticket se pide agregar los datos de la propia empresa (nombre, logo, QR, dirección). Quien ya tenía remitentes los conserva.

## Novedades v1.12.0

- **Más liviana**: instalador y app más pequeños, abre más rápido y usa menos memoria.
- **📱 Conectar mi celular**: guía para **Android** o **iPhone** (en Pagos de hoy y en ⚙ Configuración) con los pasos de Enlace Móvil para recibir los avisos de Yape, Plin y del banco.

## Novedades v1.11.0

- **Pantalla apagada de verdad sin perder pagos**: en muchas laptops, cuando Windows apaga la pantalla entra en "reposo
  moderno" y congela los programas hasta tocar el mouse. Con *Seguir avisando con la pantalla apagada* (activado),
  MultiChat no deja que Windows apague la pantalla: tras unos minutos sin uso (⚙ → Pagos → *Poner la pantalla en negro
  después de*, 5 min) la pone en negro y baja el brillo al mínimo; la laptop sigue despierta y los Yape/Plin se dicen y
  se registran al instante. Al mover el mouse o tocar una tecla vuelve el brillo.
- **Impresiones de hoy → ✏️ Editar**: abre el ticket con sus datos para corregirlo; al imprimir (o guardar PDF)
  reemplaza al anterior en el historial (marcado "corregido"). Se sigue borrando al día siguiente.

## Novedades v1.10.8

- **Voz de los pagos más confiable**: ahora la dice el motor de voz de Windows (el de Narrador), fuera de la ventana, así
  suena aunque haya música o YouTube, con la ventana oculta o la pantalla apagada. Voz de mujer en español, volumen al
  máximo y "ding" antes. Si Windows no tiene voces en español, la dice la ventana como antes.

## Novedades v1.10.7

- Ficha de agencia copiada de **shalom.pe → Agencias** (nombre, "Departamento / Provincia / Distrito / Localidad",
  dirección con "Ref.", "a km", "Grande / Co", horario, teléfono): se lee aunque los textos lleguen en otro orden o con
  el lugar partido en dos líneas. Destino = el lugar; Dirección = la línea completa con su referencia.

## Novedades v1.10.6

- Corregido *Imprimir con lo seleccionado* en Shalom: si lo seleccionado incluye la ficha oficial de la agencia (aunque no
  se seleccione el horario), **Destino** = "Lima / Cañete / Mala / Mala" y **Dirección** = la línea completa con su
  referencia; ya no se toma "MALA" como destino ni "Marchand" como dirección.

## Novedades v1.10.5

- Formulario del ticket con **Shalom**: debajo del destinatario (nombre, DNI, celular, sin cambios) solo aparecen
  **Destino** ("Lima / Cañete / Mala / Mala") y **Dirección de la agencia** (con su referencia). Agencia, distrito,
  referencias y nota se ocultan y quedan vacíos; si traían algo, se pasa a Destino o Dirección. Olva sigue igual.

## Novedades v1.10.4

- El aviso **"⚠ Falta: apellidos (nombre completo)"** vale para **todas las empresas** (Shalom, Olva, Marvisur…).

## Novedades v1.10.3

- **Olva** (a domicilio): el cliente da la dirección de su casa y referencias; las líneas sin título después de la
  dirección van a **Referencia 1 → Referencia 2 → Nota** (nunca a "Destino").
- **Shalom**: el destinatario debe ir con **nombre y apellidos completos**; si el cliente pone solo "Melisa", el aviso y el
  ticket dicen **"⚠ Falta: apellidos (nombre completo)"** para pedírselos antes de imprimir.
- Frases sueltas ("En un momento le envío los datos", "Si correcto") ya no se toman como agencia o destino.

## Novedades v1.10.2

- Ticket de **Shalom** con la ficha oficial de la agencia: **DESTINO** = solo "Lima / Cañete / Mala / Mala" y
  **DIRECCIÓN** = la línea completa con su referencia ("Av. Marchand # 250, Distrito De Mala . Referencia: …"); ya no se
  separa la referencia ni se repite la agencia. **Olva** sigue con dirección, distrito, referencias y nota por separado.

## Novedades v1.10.1

- El chat queda *esperando datos* apenas aparece en pantalla el formulario de envío que mandaste **hoy**, aunque lo
  hayas pegado a mano (antes solo con el botón 📝). Un formulario ya impreso no vuelve a avisar.
- Lectura de WhatsApp Web más robusta (por el data-id "true_/false_" de cada mensaje).
- ⚙ → Ventas y envíos → **Revisar lectura de datos de envío**: muestra qué lee la app del chat abierto.

## Novedades v1.10.0 — datos de envío automáticos

1. Mandas el formulario con **📝 Pedir datos de envío** (Shalom u Olva): ese chat queda *esperando datos* (📦 en la pestaña).
2. Cuando el cliente responde —aunque sea **sin títulos** (nombre, 8 dígitos = DNI, 9 dígitos = celular, "Jr./Av." =
   dirección, "oficina/agencia", "Ciudad, Provincia, Región") y en **varios mensajes**— aparece
   **"📦 Fulano envió sus datos"** con lo que falta (por ejemplo, "Falta: DNI") y el botón **Abrir ticket** (ya lleno).
3. **Shalom**: si le mandas la ficha oficial de la agencia (copiada de la página de Shalom: agencia, "Ayacucho / Huanta /
   …", dirección, "Ref, …", horario), el ticket usa esos datos oficiales.
4. Mandas **📋 Enviar datos al cliente para confirmar**; cuando responde **"sí, correcto"** aparece
   **"✅ Confirmó: Imprimir ticket"**. Al imprimir, el chat deja de esperar.

Cómo se leen las respuestas: por el aviso de mensaje nuevo de ese chat y, si ese chat está abierto, solo los mensajes
escritos después del formulario. Solo en chats donde mandaste el formulario, solo en memoria, se olvida al imprimir o a
las 12 horas. Nada se envía solo. *Imprimir con lo seleccionado* también entiende ahora las respuestas sin títulos.

## Novedades v1.9.3 — todo del día

- El **día de trabajo empieza a las 7:00 a. m.** (lo de la madrugada cuenta para el día anterior).
- **Pagos y notificaciones del celular: solo del día actual.** Al empezar el día siguiente se borran solos y el total
  vuelve a S/ 0.00. Se quitaron la navegación por días anteriores y la exportación a Excel.
- **🖨 Impresiones de hoy** (panel de pagos o ⚙ → Ventas y envíos): cada ticket impreso (o guardado en PDF) con hora,
  empresa, nombre, destino y N° de orden; contador por Shalom y Olva; botón **Reimprimir** (con la ticketera elegida).
  También se borra solo al día siguiente.
- La bienvenida del día muestra los tickets impresos hoy en lugar de lo cobrado ayer.

## Novedades v1.9.2 — yapeos por correo del BCP

- Cuando llega el correo **"Constancia de recepción de Yapeo a celular BCP"** (*"Recibiste un yapeo de S/ 1,157.00 de
  Negociaciones Josecito Sac."*), MultiChat lo toma del aviso de Windows del **nuevo Outlook** (o del clásico): aviso,
  voz, total del día (cuenta como Yape, marcado "correo BCP"), registro y Excel. No pide contraseñas.
- Solo se usan los avisos de correo de **BCP/BBVA** que dicen que recibiste un pago; los demás correos se ignoran y no
  se guardan. Si el mismo yapeo llega también por el celular, no se cuenta dos veces.
- Requisito: Outlook abierto (puede estar minimizado) con las notificaciones de escritorio activadas.

## Novedades v1.9.1

- Corregido: los avisos de Yape *"Confirmación de Pago · Yodver Lim\* te envió un pago por S/ 45"* (nombre con asterisco
  y a veces sin la palabra "Yape") no se reconocían. Al abrir, se vuelven a revisar las notificaciones guardadas de hoy y
  ayer y se suman los pagos que faltaban.
- El total cobrado muestra **cuántos Yape y cuántos Plin** hay y cuánto suma cada uno (BBVA Empresas cuenta como Plin).

## Novedades v1.9.0 — configuración nueva y app más animada

- **⚙ Configuración**: ya no es la lista gris de Windows; es un panel que se desliza desde la derecha y se cierra al hacer
  clic fuera. Arriba: buscador ("contraseña", "voz"…) y accesos rápidos (Bloquear, Modo oscuro, No molestar,
  Cuadrícula). Debajo, secciones con ícono que se abren con un clic: Avisos, Pagos, Ventas y envíos, Herramientas,
  Apariencia, Seguridad, Ventana y sistema, MultiChat Pro. Interruptores modernos en lugar de vistos.
- **Bienvenida del día** (una vez al día al abrir): saludo según la hora, cobrado ayer y hoy, envíos pendientes,
  mensajes sin leer y recordatorios de hoy, con números animados. Se apaga en Apariencia.
- **Botones con nombre**: al pasar el mouse, cada botón de la barra se estira y muestra su nombre y su atajo (Ctrl+P…).
- **Color de la app**: violeta, azul, verde, naranja o rosa (Apariencia → Color de la app).
- **Animaciones** al cambiar de pestaña, al abrir ventanas y al subir el total cobrado (se pueden apagar).

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
