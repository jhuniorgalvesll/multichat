## Resumen de `php`

El archivo `header-fertisem.php` es un snippet de encabezado personalizado para el sitio web Fertisem, pensado para integrarse con temas como Astra y con WooCommerce en WordPress. Sus principales características y estructura son:

### 1. Franja Superior
- Una banda roja con texto blanco y centrado muestra un mensaje promocional:  
  **"¡AHORA HAZ TU PEDIDO Y RECÍBELO DESDE 1 HORA!"**

### 2. Encabezado Principal (`<header class="fertisem-header">`)
- **Logo:** A la izquierda, enlazado a la página principal.
- **Buscador:** En el centro, con campo de texto y sugerencias automáticas (simuladas con JavaScript).
- **Iconos:** A la derecha, enlaces a pedidos, cuenta, carrito (con contador) y un botón para mostrar el menú en móviles.

### 3. Menú de Navegación (`<nav class="fertisem-nav">`)
- Menú horizontal con enlaces principales: Productos (con mega menú), Catálogo, Ofertas y Contacto.
- El mega menú de "Productos" muestra dos columnas: Agro y Veterinaria, cada una con subcategorías.

### 4. Estilos CSS (embebido)
- Colores corporativos (azul y rojo).
- Diseño responsive: adapta la disposición de los elementos en dispositivos móviles (menú hamburguesa, menú vertical).
- Mega menú ancho, con columnas para categorías.

### 5. JavaScript
- Añade sugerencias automáticas al buscador cuando el usuario escribe más de 2 caracteres.
- Las sugerencias son estáticas a modo de ejemplo.

---

**Propósito:**  
Este encabezado mejora la experiencia de usuario en tiendas online al ofrecer navegación sencilla, acceso rápido a funciones clave (cuenta, pedidos, carrito), búsqueda de productos y un menú de productos destacado.

**Nota:**  
El snippet asume integración en un entorno WordPress, pero el código es HTML/CSS/JS estándar y puede adaptarse a otros contextos.
