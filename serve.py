#!/usr/bin/env python3
"""Servidor estático mínimo para probar la app en el móvil por Wi-Fi.

    python3 serve.py [puerto]

Sirve el directorio donde vive este fichero, en todas las interfaces,
para poder abrirlo desde el teléfono con http://<ip-del-mac>:8123
"""
import functools
import http.server
import os
import socket
import socketserver
import sys

DIR = os.path.dirname(os.path.abspath(__file__))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8123


class Handler(http.server.SimpleHTTPRequestHandler):
    # El service worker y el manifest necesitan tipos correctos.
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.webmanifest': 'application/manifest+json',
        '.js': 'text/javascript',
        '.json': 'application/json',
    }

    def end_headers(self):
        # Sin caché del navegador: al recargar siempre se ve la última versión.
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stderr.write("%s %s\n" % (self.address_string(), fmt % args))


def lan_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 80))
        return s.getsockname()[0]
    except Exception:
        return '127.0.0.1'
    finally:
        s.close()


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == '__main__':
    handler = functools.partial(Handler, directory=DIR)
    with Server(('0.0.0.0', PORT), handler) as httpd:
        print(f"  En este Mac : http://localhost:{PORT}")
        print(f"  En el móvil : http://{lan_ip()}:{PORT}   (misma Wi-Fi)")
        print("  Ctrl+C para parar")
        httpd.serve_forever()
