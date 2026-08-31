#!/usr/bin/env python3
"""Lokaler Testserver fuer web/ — liefert nichts aus dem Cache.

Der eingebaute http.server schickt keine Cache-Header, worauf Chrome die
Bundles heuristisch zwischenspeichert: nach einem Rebuild bleibt dann das
alte JavaScript aktiv, und man sucht Fehler, die laengst behoben sind.
Darum hier "no-store" auf jede Antwort.
"""

import functools
import http.server
import sys


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8123
    verzeichnis = sys.argv[2] if len(sys.argv) > 2 else "web"
    handler = functools.partial(Handler, directory=verzeichnis)
    with http.server.ThreadingHTTPServer(("", port), handler) as server:
        print(f"Testserver auf http://localhost:{port} — Verzeichnis {verzeichnis}, ohne Cache")
        server.serve_forever()


main()
