"""Valida navegación entre documentos, recursos y generación reproducible."""
from pathlib import Path
from html.parser import HTMLParser
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from importlib import import_module
build = import_module('build-pages')

class PageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.links = []
        self.assets = []
        self.current = []
        self.page = None
    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        if tag == 'body':
            self.page = attrs.get('data-page')
        if tag == 'a':
            self.links.append(attrs.get('href', ''))
            if attrs.get('aria-current') == 'page':
                self.current.append(attrs.get('href'))
        if tag == 'script':
            self.assets.append(attrs['src'])
        if tag == 'link' and attrs.get('rel') == 'stylesheet':
            self.assets.append(attrs['href'])

class PagesTest(unittest.TestCase):
    def test_generation_matches_committed_pages(self):
        before = {data['file']: (ROOT / data['file']).read_bytes() for data in build.PAGES.values()}
        build.generate()
        for name, data in before.items():
            self.assertEqual((ROOT / name).read_bytes(), data, name)
    def test_pages_have_unique_ids_valid_links_and_shared_resources(self):
        for key, data in build.PAGES.items():
            with self.subTest(page=key):
                html = (ROOT / data['file']).read_text()
                parser = PageParser()
                parser.feed(html)
                self.assertEqual(parser.page, key)
                self.assertEqual(len(parser.ids), len(set(parser.ids)))
                self.assertIn('NovaMarket', html)
                self.assertNotIn('{{', html)
                for resource in parser.assets:
                    self.assertTrue((ROOT / resource).is_file(), resource)
                for link in parser.links:
                    file = link.split('?', 1)[0].split('#', 1)[0]
                    if file and not file.startswith(('https:', 'http:', 'mailto:')):
                        self.assertTrue((ROOT / file).is_file(), link)
                for _, filename, _, _ in build.NAV:
                    self.assertIn(filename, parser.links)
                if key != 'pedidos':
                    self.assertEqual(parser.current.count(data['file']), 2)
                for element in ('searchForm', 'cartCount', 'cartDialog', 'modal', 'toast', 'mobileCount'):
                    self.assertIn(element, parser.ids)

if __name__ == '__main__':
    unittest.main()
