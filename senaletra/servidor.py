"""Servidor local, solo accesible desde este equipo. Python 3.8+."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import os, webbrowser, threading
os.chdir(Path(__file__).resolve().parent)
class Handler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, '.mjs': 'text/javascript', '.wasm': 'application/wasm', '.task': 'application/octet-stream'}
if __name__ == '__main__':
    try:
        server = ThreadingHTTPServer(('127.0.0.1', 8000), Handler)
        print('SeñaLetra: http://localhost:8000\nMantén esta ventana abierta. Ctrl+C para cerrar.')
        threading.Timer(1, lambda: webbrowser.open('http://localhost:8000')).start()
        server.serve_forever()
    except OSError:
        print('El puerto 8000 está ocupado. Cierra el servidor anterior o usa XAMPP.'); input('Enter para salir...')
    except KeyboardInterrupt:
        print('\nServidor cerrado.')
