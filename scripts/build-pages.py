"""Genera las páginas estáticas compartiendo encabezado y pie de página."""
from pathlib import Path
from html import escape

ROOT = Path(__file__).resolve().parents[1]
TEMPLATES = ROOT / 'templates'
NAV = [('inicio', 'index.html', 'Inicio', 'home'), ('productos', 'productos.html', 'Productos', 'search'), ('ofertas', 'ofertas.html', 'Ofertas', 'tag'), ('favoritos', 'favoritos.html', 'Favoritos', 'heart'), ('contacto', 'contacto.html', 'Contacto', 'chat')]
PAGES = {
    'inicio': {'file': 'index.html', 'title': 'Inicio', 'template': 'inicio.html', 'description': 'NovaMarket: todo para tu día, en un solo lugar. Explora 40 productos y prueba una compra en nuestro supermercado digital.'},
    'productos': {'file': 'productos.html', 'title': 'Productos', 'template': 'catalogo.html', 'description': 'Los 40 productos de NovaMarket: frutas, carnes, lácteos, panadería, despensa, bebidas y limpieza.', 'eyebrow': 'TU LISTA EMPIEZA AQUÍ', 'heading': 'Todo lo que necesitas hoy.', 'subtitle': '40 productos, siete departamentos y una compra a tu ritmo.', 'icon': 'bag', 'search_hint': 'Buscar en todos los productos…', 'empty_title': 'No encontramos productos', 'empty_text': 'Prueba con otro nombre o cambia los filtros.', 'extra': ''},
    'ofertas': {'file': 'ofertas.html', 'title': 'Ofertas', 'template': 'catalogo.html', 'description': 'Descubre los productos con descuento en NovaMarket y usa el cupón de bienvenida en tu compra demo.', 'eyebrow': 'MÁS POR TU PRESUPUESTO', 'heading': 'Buenos precios. Buenas compras.', 'subtitle': 'Descuentos visibles para encontrar lo que te gusta por menos.', 'icon': 'tag', 'search_hint': 'Buscar entre las ofertas…', 'empty_title': 'No hay ofertas con estos filtros', 'empty_text': 'Elige otro departamento o limpia la búsqueda.', 'extra': '<div class="container offer-strip"><div><strong>Un extra en tu primera compra demo</strong><span>10% de descuento con BIENVENIDO10.</span></div><button class="primary" data-action="coupon">Copiar código <span>↗</span></button></div>'},
    'favoritos': {'file': 'favoritos.html', 'title': 'Favoritos', 'template': 'catalogo.html', 'description': 'Guarda tus productos preferidos de NovaMarket y encuéntralos aquí cuando prepares tu próxima compra.', 'eyebrow': 'TUS BUENAS ELECCIONES', 'heading': 'Lo que te gusta, a la mano.', 'subtitle': 'Pulsa el corazón de un producto para guardarlo y encontrarlo en esta página.', 'icon': 'heart', 'search_hint': 'Buscar en tus favoritos…', 'empty_title': 'Todavía no hay favoritos con estos filtros', 'empty_text': 'Guarda productos desde el catálogo o limpia los filtros para ver tu selección.', 'extra': ''},
    'contacto': {'file': 'contacto.html', 'title': 'Contacto', 'template': 'contacto.html', 'description': 'Conoce NovaMarket, consulta las preguntas frecuentes y prueba el formulario de contacto.'},
    'pedidos': {'file': 'pedidos.html', 'title': 'Mis pedidos', 'template': 'pedidos.html', 'description': 'Consulta el resumen de tus pedidos de demostración de NovaMarket guardados en este navegador.'},
}

def generate():
    base = (TEMPLATES / 'base.html').read_text()
    for page, data in PAGES.items():
        values = {key.upper(): str(value) for key, value in data.items()}
        content = (TEMPLATES / data['template']).read_text()
        for key, value in values.items():
            content = content.replace('{{' + key + '}}', value)
        navigation = ''.join(f'<a href="{url}"' + (' class="active" aria-current="page"' if key == page else '') + f'>{label}' + (' <span class="nav-tag">%</span>' if key == 'ofertas' else '') + '</a>' for key, url, label, _ in NAV)
        mobile = ''.join(f'<a href="{url}"' + (' aria-current="page"' if key == page else '') + f'><span class="icon" data-icon="{icon}"></span>{label}</a>' for key, url, label, icon in NAV)
        html = base.replace('{{PAGE}}', page).replace('{{TITLE}}', escape(data['title'])).replace('{{DESCRIPTION}}', escape(data['description'], quote=True)).replace('{{CONTENT}}', content).replace('{{NAVIGATION}}', navigation).replace('{{MOBILE_NAVIGATION}}', mobile)
        if '{{' in html:
            raise ValueError(f'Plantilla incompleta: {page}')
        (ROOT / data['file']).write_text(html)

if __name__ == '__main__':
    generate()
    print('6 páginas de NovaMarket generadas.')
