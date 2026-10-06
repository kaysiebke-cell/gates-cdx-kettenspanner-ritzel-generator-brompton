#!/usr/bin/env python3
"""Ritzel-Generator als eigenständige Linux-Anwendung.

Eigenes GTK-Fenster mit WebKitGTK statt Browser: keine Adressleiste, kein
Tab, eigenes Symbol im Menü. Die Oberfläche (web/) wird lokal ausgeliefert,
alles läuft offline. Downloads (STL/ZIP/STEP) landen in ~/Downloads.
"""
import functools
import http.server
import os
import sys
import threading
from urllib.parse import urlparse

import gi
gi.require_version('Gtk', '3.0')
gi.require_version('WebKit2', '4.1')
from gi.repository import Gtk, Gdk, GLib, WebKit2   # noqa: E402

TITEL = 'Gates CDX Riemenspanner-Ritzel Generator'
HIER = os.path.dirname(os.path.abspath(__file__))


def finde_web():
    for p in (os.environ.get('RITZEL_WEB'),
              '/usr/share/ritzel-generator/web',
              os.path.join(HIER, '..', 'web')):
        if p and os.path.isfile(os.path.join(p, 'index.html')):
            return os.path.abspath(p)
    sys.exit('web/index.html nicht gefunden')


def finde_icon():
    for p in ('/usr/share/icons/hicolor/512x512/apps/ritzel-generator.png',
              os.path.join(HIER, 'freecad-starter', 'icon.png')):
        if os.path.isfile(p):
            return p
    return None


class Leise(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


def starte_server(verzeichnis):
    handler = functools.partial(Leise, directory=verzeichnis)
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv.server_address[1]


def freier_name(ordner, name):
    name = os.path.basename(name) or 'download'
    stamm, ende = os.path.splitext(name)
    pfad, n = os.path.join(ordner, name), 1
    while os.path.exists(pfad):
        pfad = os.path.join(ordner, f'{stamm} ({n}){ende}')
        n += 1
    return pfad


class App(Gtk.Window):
    def __init__(self, port):
        super().__init__(title=TITEL)
        self.port = port
        self.set_default_size(1280, 820)
        icon = finde_icon()
        if icon:
            self.set_icon_from_file(icon)

        s = WebKit2.Settings()
        s.set_enable_webgl(True)
        s.set_hardware_acceleration_policy(WebKit2.HardwareAccelerationPolicy.ALWAYS)
        s.set_enable_developer_extras(False)
        self.web = WebKit2.WebView.new_with_settings(s)
        self.web.connect('decide-policy', self.on_policy)
        self.web.connect('context-menu', lambda *a: True)   # kein Browser-Kontextmenü
        self.add(self.web)

        ctx = self.web.get_context()
        ctx.connect('download-started', self.on_download)
        self.connect('destroy', Gtk.main_quit)
        self.web.load_uri(f'http://127.0.0.1:{port}/')
        self.show_all()

    # Fremde Adressen (z. B. GitHub-Links) im Standardbrowser öffnen,
    # nie im App-Fenster.
    def on_policy(self, web, decision, typ):
        if typ in (WebKit2.PolicyDecisionType.NAVIGATION_ACTION,
                   WebKit2.PolicyDecisionType.NEW_WINDOW_ACTION):
            uri = decision.get_navigation_action().get_request().get_uri()
            u = urlparse(uri)
            if u.scheme in ('http', 'https') and u.hostname != '127.0.0.1':
                decision.ignore()
                Gtk.show_uri_on_window(self, uri, Gdk.CURRENT_TIME)
                return True
        return False

    def on_download(self, ctx, download):
        download.connect('decide-destination', self.on_ziel)
        download.connect('finished', self.on_fertig)
        download.connect('failed', self.on_fehler)

    def on_ziel(self, download, vorschlag):
        ordner = GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_DOWNLOAD) \
            or os.path.expanduser('~')
        os.makedirs(ordner, exist_ok=True)
        pfad = freier_name(ordner, vorschlag or 'download')
        download.set_destination('file://' + pfad)
        download._ziel = pfad
        return True

    def meldung(self, text, art=Gtk.MessageType.INFO):
        d = Gtk.MessageDialog(transient_for=self, modal=False, message_type=art,
                              buttons=Gtk.ButtonsType.OK, text=text)
        d.connect('response', lambda w, r: w.destroy())
        d.show()

    def on_fertig(self, download):
        ziel = getattr(download, '_ziel', None)
        if ziel:
            self.meldung(f'Gespeichert unter:\n{ziel}')

    def on_fehler(self, download, fehler):
        self.meldung(f'Download fehlgeschlagen: {fehler.message}', Gtk.MessageType.ERROR)


def main():
    GLib.set_prgname('ritzel-generator')
    GLib.set_application_name(TITEL)
    port = starte_server(finde_web())
    App(port)
    Gtk.main()


if __name__ == '__main__':
    main()
