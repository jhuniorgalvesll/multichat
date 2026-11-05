# Fertisem Checkout Lite — Public Sanitized Copy

Versión pública y sanitizada de **Fertisem Checkout Lite v1.6.19** para WooCommerce.

**Autor:** lliuya.pe  
**Copyright:** © 2026 lliuya.pe  
**Licencia:** GPL-2.0-or-later

## Privacidad y sanitización

Esta publicación NO contiene los datos operativos reales usados en producción. Antes de hacerla pública se reemplazaron u ocultaron, entre otros:

- dirección real de tienda y puntos de recojo;
- nombres y asignaciones reales de transportistas;
- plazos reales de despacho/entrega;
- condiciones reales de flete y reglas comerciales;
- URLs internas o de producción;
- teléfonos, correos, RUC/DNI, credenciales, tokens y datos de clientes;
- QR, datos bancarios y credenciales de métodos de pago.

La versión pública usa valores de demostración como **Transportista A/B/C**, **Tienda de ejemplo**, **Dirección de ejemplo, Perú** y **según configuración**.

## Obtener el ZIP público

El paquete sanitizado está dividido en partes dentro de `parts/` para conservar íntegro el archivo binario en esta publicación.

### Windows / PowerShell

Desde esta carpeta ejecuta:

```powershell
.\rebuild.ps1
```

### Linux / macOS

```sh
./rebuild.sh
```

El resultado será:

`fertisem-checkout-lite-v1.6.19-public-sanitized.zip`

SHA-256 esperado:

`fc59b971e63b901b6409b0367acab4cea4b0e8405a411923a6af11aec31dd0d7`

## Funciones

- Checkout WooCommerce en 5 pasos.
- Responsive para escritorio, tablet y móvil.
- Barra tipo app en móvil.
- Selector de recojo en tienda.
- Proveedores de entrega configurables.
- Revisión de datos antes de pagar.
- Selector visual de métodos de pago con popup.
- Compatibilidad con HPOS.
- SVG inline y sin librerías externas pesadas.

## Importante

Esta es una **copia pública sanitizada**. Antes de usarla en producción debes configurar tus propios datos, transportistas, reglas de entrega, pagos y valores comerciales.

Sitio del autor: https://lliuya.pe/
