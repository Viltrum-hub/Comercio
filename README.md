# NovaMarket

**Todo para tu día, en un solo lugar.**

Supermercado digital en español con diseño Urbano moderno: azul profundo `#173B70`, coral `#FF805C` y superficies claras. El repositorio conserva el nombre **Comercio**: https://github.com/Viltrum-hub/Comercio

## Páginas independientes

| Archivo | Contenido |
| --- | --- |
| `index.html` | Presentación, departamentos, ocho productos destacados y promociones |
| `productos.html` | Los 40 productos, búsqueda, categorías y ordenación |
| `ofertas.html` | Solo productos con descuento y cupón de bienvenida |
| `favoritos.html` | Productos guardados en este navegador |
| `contacto.html` | Formulario de prueba y preguntas frecuentes |
| `pedidos.html` | Historial de compras de demostración |

Cada opción del menú principal abre un documento HTML distinto. Todas las páginas comparten la identidad, la navegación, el carrito y el pie de página. La navegación móvil incluye las cinco secciones principales y el carrito.

## Catálogo y compra

- 40 productos en siete departamentos: frutas y verduras, lácteos y huevos, panadería, despensa, bebidas, hogar y limpieza, y carnes y pescados.
- Búsqueda sin distinción de tildes, categorías, precios ordenados y fichas de productos con ilustraciones SVG propias.
- Carrito con cantidades limitadas por producto, eliminación, favoritos y persistencia al navegar.
- Cupón `BIENVENIDO10`: 10% sobre el subtotal. Envío demo de $2.50, gratis desde $35 antes del descuento; retiro gratuito.
- Formulario validado, confirmación, resumen e historial local de pedidos.
- El carrito y los favoritos de la primera versión se leen para conservar las selecciones anteriores.
- Formulario de contacto que guarda una copia de prueba local y comunica que no se envía el mensaje.
- Privacidad, borrado de datos locales y respeto por movimiento reducido.

## Ejecutar

No requiere instalar dependencias. Desde la raíz:

```sh
python3 -m http.server 8000
```

Abre http://localhost:8000. Sirve siempre las páginas desde el mismo origen para compartir el carrito.

## Editar y generar páginas

`core.js` contiene el catálogo y los cálculos; `app.js`, las interacciones. `styles.css` y `urban.css` contienen el diseño responsive.

Las plantillas en `templates/` comparten la estructura para mantener el menú y el pie de página consistentes. Después de editarlas, ejecuta:

```sh
python3 scripts/build-pages.py
```

Las seis páginas generadas se guardan en la raíz y se suben al repositorio, de modo que cualquier servidor estático puede publicarlas sin un proceso de compilación.

## Comprobar

```sh
node --test tests/*.test.cjs
python3 tests/pages.test.py
node --check app.js
node --check core.js
```

Las pruebas comprueban precios, inventario de ejemplo, filtros por página, arranque con los elementos de cada documento, persistencia entre rutas, cupón y contacto local, generación reproducible y enlaces internos. Las pruebas de arranque usan una representación limitada del DOM y no sustituyen una revisión visual en navegador. GitHub Actions ejecuta las comprobaciones en cada push y pull request.

## GitHub Pages

En Settings → Pages selecciona Deploy from a branch, rama `main`, carpeta `/ (root)` y guarda. Subir el código no activa Pages automáticamente.

## Alcance

Tienda de demostración: no procesa pagos, envía correos, recibe mensajes en un servidor ni despacha productos. Los precios y las existencias son datos de ejemplo. Los pedidos, los mensajes de prueba y las preferencias se guardan solo en el navegador y no se sincronizan entre dispositivos. No se recopilan datos de tarjeta.

Para operar como supermercado real deben integrarse un servidor de pedidos e inventario, autenticación, una pasarela de pago con webhooks verificados y la logística del negocio. Las fuentes se solicitan a Google Fonts, con alternativas locales cuando no cargan.
