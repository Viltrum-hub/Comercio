# Comercio

Sitio profesional de supermercado en español, adaptable a móviles y con ilustraciones SVG propias. Repositorio: https://github.com/Viltrum-hub/Comercio

## Funciones

- Catálogo de 18 productos, seis categorías, búsqueda sin distinción de tildes y ordenación.
- Favoritos, carrito con cantidades limitadas, eliminación y persistencia en el navegador.
- Cupón `BIENVENIDO10`: 10% sobre productos. Envío demo de $2.50, gratis desde $35 de subtotal antes del descuento; retiro gratis.
- Formulario validado, confirmación de compra de demostración, resumen e historial local de pedidos.
- Preferencia de entrega, preguntas frecuentes, privacidad y borrado de datos locales.
- Navegación móvil, diálogos accesibles, estados vacíos y respeto por movimiento reducido.

## Ejecutar localmente

No requiere instalación de dependencias. En la raíz del repositorio:

```sh
python3 -m http.server 8000
```

Abre http://localhost:8000.

## Archivos

| Archivo | Función |
| --- | --- |
| `index.html` | Estructura y contenido de la tienda |
| `styles.css` | Diseño y adaptación a móviles |
| `core.js` | Productos, filtros y cálculos en centavos |
| `app.js` | Interacciones, carrito y formularios |
| `tests/core.test.cjs` | Verificación de cantidades, precios y búsqueda |

## Verificar

```sh
node --test tests/core.test.cjs
node --check app.js
node --check core.js
```

GitHub Actions ejecuta estas comprobaciones automáticamente en pushes y pull requests.

## Publicar con GitHub Pages

En Settings → Pages selecciona Deploy from a branch, rama `main`, carpeta `/ (root)` y guarda. Los archivos ya están preparados en la raíz. La publicación requiere activar Pages en los ajustes del repositorio; subir el código no activa ese servicio automáticamente.

## Alcance de esta versión

Es una tienda de demostración: no procesa pagos, envía correos ni despacha productos. Los precios y las existencias son ejemplos. Los pedidos se guardan únicamente en el navegador, sin sincronización entre dispositivos. No se recopilan datos de tarjeta.

Para operar como supermercado real deben integrarse un servidor de pedidos e inventario, autenticación, una pasarela de pago con webhooks verificados y logística del negocio.

Las fuentes se solicitan a Google Fonts, con alternativas del dispositivo cuando no cargan. Los dibujos de productos y del encabezado están incluidos en el código.
