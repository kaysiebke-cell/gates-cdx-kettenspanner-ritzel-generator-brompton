#!/usr/bin/env python3
"""
Ritzel-Generator als richtiges GTK-Programm für Linux.

Formular, Reiter und Knöpfe bestehen aus echten GTK-Bausteinen und folgen dem
Systemdesign (Cinnamon: Farben, Schrift, Hell und Dunkel). Keine Webseite im
Fenster — bis auf die 3D-Vorschau, die in einer WebView zeichnet.

Gerechnet wird mit der Logik der Web-App (web/). Sie läuft im Hintergrund, und
diese Oberfläche ruft sie auf: Die Felder liest die Oberfläche aus der Seite
aus (so gibt es nur EINE Quelle: params.json), Änderungen schreibt sie dorthin
zurück, Geometrie, STL-Export und STEP-Bau bleiben unverändert.

Dieselbe Bauweise wie linux-native/ in der Schreibhilfe.
"""
import functools
import http.server
import json
import os
import sys
import threading
from urllib.parse import urlparse

import gi
gi.require_version('Gtk', '3.0')
gi.require_version('Gdk', '3.0')
gi.require_version('WebKit2', '4.1')
from gi.repository import Gtk, Gdk, GLib, WebKit2   # noqa: E402

TITEL = 'Gates CDX Riemenspanner-Ritzel Generator'
HIER = os.path.dirname(os.path.abspath(__file__))

# Alles außer dem Zeichenbereich der Seite ausblenden — die Bedienung
# übernimmt diese Oberfläche.
SEITE_CSS = """
header, nav#tabs, #form, #printview, #loader { display: none !important; }
html, body { height: 100%; margin: 0; }
#genview { display: block !important; flex: 1 1 auto !important; height: 100vh !important; }
#viewport { width: 100% !important; height: 100vh !important; flex: none !important;
            min-height: 0 !important; order: 0 !important; }
"""

DRUCK_CSS = """
body { font: 14px/1.5 system-ui, sans-serif; margin: 0; padding: 18px 26px; max-width: 900px;
       color: #222; background: #fff; }
@media (prefers-color-scheme: dark) { body { color: #ddd; background: #1e1f22; } a { color: #8ab4f8; } }
h2 { margin-top: 0; } h3 { margin: 1.4em 0 .4em; } h4 { margin: 1em 0 .3em; }
.specs { display: grid; gap: 6px; margin: 0; } .spec { display: grid; grid-template-columns: 200px 1fr; gap: 12px; }
.spec dt { font-weight: 600; } .spec dd { margin: 0; } .spec dd span { display: block; opacity: .75; font-size: 90%; }
.fieldtest, .warn, .disclaimer { padding: 10px 14px; border-left: 4px solid #e08a0d; background: rgba(128,128,128,.12); border-radius: 4px; }
.disclaimer { font-size: 88%; opacity: .85; } ul.ticks { list-style: none; padding-left: 0; }
"""

JS_AUSLESEN = """(function(){
  const out = {sections: [], footer: []};
  document.querySelectorAll('#form fieldset').forEach(fs => {
    if (fs.hidden) return;
    const rows = [];
    fs.querySelectorAll('.row').forEach(r => {
      const l = r.querySelector('label'), i = r.querySelector('input');
      if (!i) return;
      rows.push({id: i.id, label: l ? l.textContent.trim() : i.id, value: parseFloat(i.value),
                 step: parseFloat(i.step) || 1,
                 min: i.min !== '' ? parseFloat(i.min) : null,
                 max: i.max !== '' ? parseFloat(i.max) : null});
    });
    const hints = [...fs.querySelectorAll('.hint')].map(h => h.textContent.trim()).filter(Boolean);
    out.sections.push({id: fs.id, legend: ((fs.querySelector('legend') || {}).textContent || '').trim(), rows, hints});
  });
  for (const id of ['hint2', 'hint3']) { const e = document.getElementById(id); if (e && e.textContent.trim()) out.footer.push(e.textContent.trim()); }
  return JSON.stringify(out);
})()"""

JS_ZUSTAND = """(function(){
  const g = id => document.getElementById(id);
  const vis = e => !!e && e.style.display !== 'none' && !e.hidden;
  const t = id => g(id) ? g(id).textContent.trim() : '';
  const hint = id => ({v: vis(g(id)), t: t(id), always: !!g(id) && g(id).className.indexOf('hint') < 0});
  return JSON.stringify({
    ready: !!window.__ritzelRebuild && !g('loader') && t('stats') !== '',
    stats: t('stats'), stl: t('stlbtn'),
    step: {v: vis(g('stepbtn')), t: t('stepbtn')}, stephint: hint('stephint'),
    build: {v: vis(g('stepbuildbtn')), t: t('stepbuildbtn'), dis: !!g('stepbuildbtn') && g('stepbuildbtn').disabled},
    buildhint: hint('stepbuildhint'), status: hint('stepbuildstatus'),
    buegel: {v: !!g('buegelrow') && !g('buegelrow').hidden, t: t('buegellbl'), c: !!g('buegelchk') && g('buegelchk').checked},
    tabs: [t('tab-gen'), t('tab-rolle'), t('tab-print')],
    lang: t('lang-toggle'), hintson: document.body.classList.contains('hinweise'),
    hintsbtn: g('hintsbtn') ? g('hintsbtn').title : ''
  });
})()"""


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


def js(view, code, callback=None):
    """JavaScript in der WebView ausführen; callback bekommt den Text-Rückgabewert."""
    def fertig(ansicht, res, _):
        try:
            wert = ansicht.run_javascript_finish(res).get_js_value().to_string()
        except Exception:
            wert = None
        if callback:
            callback(wert)
    view.run_javascript(code, None, fertig, None)


def js_text(s):
    return json.dumps(s)


class App(Gtk.Window):
    def __init__(self, port):
        super().__init__(title=TITEL)
        self.port = port
        self.bauteil = 'gen'          # gen | rolle | print
        self.hinweise_an = False
        self.zeilen = {}              # id -> SpinButton
        self.hinweis_labels = []
        self.fertig = False
        self.druck_html = None
        self.set_default_size(1320, 840)
        self.set_icon_name('ritzel-generator')
        icon = finde_icon()
        if icon and not Gtk.IconTheme.get_default().has_icon('ritzel-generator'):
            self.set_icon_from_file(icon)

        self.baue_kopfzeile()
        self.baue_inhalt()
        self.show_all()
        self.stack.set_visible_child_name('gen')
        self.web.load_uri(f'http://127.0.0.1:{port}/')
        GLib.timeout_add(700, self.abfragen)

    # ── Kopfzeile ───────────────────────────────────────────────────
    def baue_kopfzeile(self):
        bar = Gtk.HeaderBar(show_close_button=True, title='Ritzel-Generator',
                            subtitle='Riemenspanner-Ritzel für Gates CDX / Brompton')
        self.set_titlebar(bar)

        box = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL)
        box.get_style_context().add_class('linked')
        self.reiter = {}
        erster = None
        for name, text in (('gen', 'Ritzel'), ('rolle', 'Spannrolle'), ('print', 'Druck-Empfehlungen')):
            b = Gtk.RadioButton.new_with_label_from_widget(erster, text)
            b.set_mode(False)
            if erster is None:
                erster = b
            b.connect('toggled', self.reiter_gewechselt, name)
            box.pack_start(b, False, False, 0)
            self.reiter[name] = b
        bar.set_custom_title(box)

        self.sprache_btn = Gtk.Button(label='DE / EN')
        self.sprache_btn.set_tooltip_text('Sprache wechseln / switch language')
        self.sprache_btn.connect('clicked', self.sprache_wechseln)
        bar.pack_end(self.sprache_btn)

        self.hinweis_btn = Gtk.ToggleButton()
        self.hinweis_btn.set_image(Gtk.Image.new_from_icon_name('dialog-information-symbolic', Gtk.IconSize.BUTTON))
        self.hinweis_btn.set_tooltip_text('Erklärungen einblenden')
        self.hinweis_btn.connect('toggled', self.hinweise_umschalten)
        bar.pack_end(self.hinweis_btn)

    # ── Inhalt ──────────────────────────────────────────────────────
    def baue_inhalt(self):
        s = WebKit2.Settings()
        s.set_enable_webgl(True)
        s.set_hardware_acceleration_policy(WebKit2.HardwareAccelerationPolicy.ALWAYS)
        s.set_enable_developer_extras(False)
        ucm = WebKit2.UserContentManager()
        ucm.add_style_sheet(WebKit2.UserStyleSheet(
            SEITE_CSS, WebKit2.UserContentInjectedFrames.ALL_FRAMES,
            WebKit2.UserStyleLevel.USER, None, None))
        self.web = WebKit2.WebView.new_with_user_content_manager(ucm)
        self.web.set_settings(s)
        self.web.connect('decide-policy', self.on_policy)
        self.web.connect('context-menu', lambda *a: True)
        self.web.get_context().connect('download-started', self.on_download)

        # Links: Kennzahlen + Formular, rechts die Vorschau
        links = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=6)
        links.set_size_request(380, -1)
        self.stats = Gtk.Label(xalign=0, wrap=True, use_markup=True)
        self.stats.set_margin_start(12); self.stats.set_margin_end(12); self.stats.set_margin_top(10)
        links.pack_start(self.stats, False, False, 0)

        self.form_scroll = Gtk.ScrolledWindow(hscrollbar_policy=Gtk.PolicyType.NEVER)
        self.form_box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=10)
        for m in ('start', 'end'):
            getattr(self.form_box, f'set_margin_{m}')(12)
        self.form_scroll.add(self.form_box)
        links.pack_start(self.form_scroll, True, True, 0)

        unten = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=6)
        for m in ('start', 'end', 'bottom'):
            getattr(unten, f'set_margin_{m}')(12)
        self.buegel_chk = Gtk.CheckButton(label='Riemenschutz-Bügel anzeigen')
        self.buegel_chk.connect('toggled', self.buegel_umschalten)
        self.stl_btn = Gtk.Button(label='ZIP herunterladen')
        self.stl_btn.get_style_context().add_class('suggested-action')
        self.stl_btn.connect('clicked', lambda *_: self.klick('stlbtn'))
        self.step_btn = Gtk.Button(label='STEP herunterladen')
        self.step_btn.connect('clicked', lambda *_: self.klick('stepbtn'))
        self.build_btn = Gtk.Button(label='STEP bauen')
        self.build_btn.connect('clicked', lambda *_: self.klick('stepbuildbtn'))
        self.step_hint = self.neues_hinweislabel()
        self.build_hint = self.neues_hinweislabel()
        self.status = Gtk.Label(xalign=0, wrap=True)
        self.status.get_style_context().add_class('dim-label')
        for w in (self.buegel_chk, self.stl_btn, self.step_btn, self.step_hint,
                  self.build_btn, self.build_hint, self.status):
            unten.pack_start(w, False, False, 0)
        links.pack_start(unten, False, False, 0)

        paned = Gtk.Paned(orientation=Gtk.Orientation.HORIZONTAL)
        paned.pack1(links, False, False)
        paned.pack2(self.web, True, False)
        paned.set_position(400)

        # Zweite Seite: Druck-Empfehlungen (reiner Text)
        self.druck = WebKit2.WebView()
        self.druck.connect('decide-policy', self.on_policy)
        self.druck.connect('context-menu', lambda *a: True)

        self.stack = Gtk.Stack()
        self.stack.add_named(paned, 'gen')
        self.stack.add_named(self.druck, 'print')
        self.add(self.stack)

    def neues_hinweislabel(self):
        l = Gtk.Label(xalign=0, wrap=True)
        l.get_style_context().add_class('dim-label')
        return l

    # ── Formular aus der Seite aufbauen ─────────────────────────────
    def formular_lesen(self):
        js(self.web, JS_AUSLESEN, self.formular_bauen)

    def formular_bauen(self, text):
        if not text:
            return
        daten = json.loads(text)
        for kind in self.form_box.get_children():
            self.form_box.remove(kind)
        self.zeilen.clear()
        self.hinweis_labels = []
        for sec in daten['sections']:
            rahmen = Gtk.Frame(label=sec['legend'])
            rahmen.get_label_widget().set_markup(f"<b>{GLib.markup_escape_text(sec['legend'])}</b>")
            gitter = Gtk.Grid(row_spacing=6, column_spacing=10)
            for m in ('start', 'end', 'top', 'bottom'):
                getattr(gitter, f'set_margin_{m}')(10)
            for z, r in enumerate(sec['rows']):
                lab = Gtk.Label(label=r['label'], xalign=0, wrap=True)
                lab.set_hexpand(True)
                step = r['step']
                stellen = len(f'{step:.6f}'.rstrip('0').split('.')[1]) if '.' in f'{step:.6f}'.rstrip('0') else 0
                lo = r['min'] if r['min'] is not None else -1e6
                hi = r['max'] if r['max'] is not None else 1e6
                adj = Gtk.Adjustment(value=r['value'], lower=lo, upper=hi, step_increment=step, page_increment=step * 10)
                spin = Gtk.SpinButton(adjustment=adj, digits=max(stellen, 1 if step < 1 else 0))
                spin.set_width_chars(7)
                spin.set_alignment(1.0)
                spin.connect('value-changed', self.wert_geaendert, r['id'])
                gitter.attach(lab, 0, z, 1, 1)
                gitter.attach(spin, 1, z, 1, 1)
                self.zeilen[r['id']] = spin
            ende = len(sec['rows'])
            for h in sec['hints']:
                l = self.neues_hinweislabel()
                l.set_text(h)
                l.set_no_show_all(True)
                l.set_visible(self.hinweise_an)
                gitter.attach(l, 0, ende, 2, 1)
                ende += 1
                self.hinweis_labels.append(l)
            rahmen.add(gitter)
            self.form_box.pack_start(rahmen, False, False, 0)
        for text in daten['footer']:
            l = self.neues_hinweislabel()
            l.set_text(text)
            l.set_no_show_all(True)
            l.set_visible(self.hinweise_an)
            self.form_box.pack_start(l, False, False, 0)
            self.hinweis_labels.append(l)
        self.form_box.show_all()
        for l in self.hinweis_labels:
            l.set_visible(self.hinweise_an)

    def wert_geaendert(self, spin, feld_id):
        wert = spin.get_value()
        js(self.web, f"""(function(id,v){{var i=document.getElementById(id); if(!i) return '';
            i.value=v; i.dispatchEvent(new Event('input',{{bubbles:true}}));
            i.dispatchEvent(new Event('change',{{bubbles:true}})); return '';}})({js_text(feld_id)},{wert})""")

    # ── Bedienung ───────────────────────────────────────────────────
    def klick(self, element_id):
        js(self.web, f"(function(){{var e=document.getElementById({js_text(element_id)}); if(e) e.click(); return '';}})()")

    def buegel_umschalten(self, chk):
        if getattr(self, '_sperre', False):
            return
        an = 'true' if chk.get_active() else 'false'
        js(self.web, f"""(function(){{var c=document.getElementById('buegelchk'); if(!c) return '';
            c.checked={an}; c.dispatchEvent(new Event('change',{{bubbles:true}})); return '';}})()""")

    def reiter_gewechselt(self, knopf, name):
        if not knopf.get_active() or not self.fertig:
            return
        self.bauteil = name
        if name == 'print':
            self.stack.set_visible_child_name('print')
            self.hinweis_btn.set_sensitive(False)
            self.druck_laden()
            return
        self.stack.set_visible_child_name('gen')
        self.hinweis_btn.set_sensitive(True)
        web_id = 'tab-gen' if name == 'gen' else 'tab-rolle'
        js(self.web, f"(function(){{document.getElementById('{web_id}').click(); return '';}})()",
           lambda _: self.formular_lesen())

    def sprache_wechseln(self, *_):
        js(self.web, "(function(){document.getElementById('lang-toggle').click(); return '';})()",
           lambda _: (self.formular_lesen(), self.druck_laden()))

    def hinweise_umschalten(self, knopf):
        self.hinweise_an = knopf.get_active()
        for l in self.hinweis_labels:
            l.set_visible(self.hinweise_an)
        js(self.web, f"document.body.classList.toggle('hinweise', {str(self.hinweise_an).lower()}) && ''")

    def druck_laden(self):
        def zeigen(html):
            if html is None:
                return
            self.druck.load_html(f'<html><head><meta charset="utf-8"><style>{DRUCK_CSS}</style></head>'
                                 f'<body>{html}</body></html>', f'http://127.0.0.1:{self.port}/')
        js(self.web, "document.getElementById('printview').innerHTML", zeigen)

    # ── Regelmäßig den Zustand der Seite übernehmen ─────────────────
    def abfragen(self):
        js(self.web, JS_ZUSTAND, self.zustand)
        return True

    def zustand(self, text):
        if not text:
            return
        z = json.loads(text)
        erstmals = z['ready'] and not self.fertig
        if erstmals:
            self.fertig = True
            self.formular_lesen()
            self.druck_laden()
        self.stats.set_text(z['stats'])
        self.stl_btn.set_label(z['stl'].lstrip('💾 ').strip() or 'ZIP herunterladen')
        for knopf, d in ((self.step_btn, z['step']), (self.build_btn, z['build'])):
            knopf.set_visible(d['v'])
            knopf.set_label(d['t'].lstrip('📐 ').strip())
        self.build_btn.set_sensitive(not z['build']['dis'])
        for label, d in ((self.step_hint, z['stephint']), (self.build_hint, z['buildhint'])):
            label.set_text(d['t'])
            label.set_visible(d['v'] and d['t'] != '' and (d['always'] or self.hinweise_an))
        self.status.set_text(z['status']['t'])
        self.status.set_visible(z['status']['v'] and z['status']['t'] != '')
        self.buegel_chk.set_visible(z['buegel']['v'] and self.bauteil == 'gen')
        self.buegel_chk.set_label(z['buegel']['t'])
        self._sperre = True
        self.buegel_chk.set_active(z['buegel']['c'])
        self._sperre = False
        for name, text in zip(('gen', 'rolle', 'print'), z['tabs']):
            if text:
                self.reiter[name].set_label(text)
        if z['hintsbtn']:
            self.hinweis_btn.set_tooltip_text(z['hintsbtn'])

    # ── Fremde Links, Downloads ─────────────────────────────────────
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
    app = Gtk.Application(application_id='de.ritzelgenerator.native')
    app.fenster = None

    def aktivieren(app):
        if app.fenster is None:
            app.fenster = App(port)
            app.add_window(app.fenster)
            app.fenster.stack.set_visible_child_name('gen')
        app.fenster.present()      # zweiter Start: Fenster nach vorn

    app.connect('activate', aktivieren)
    return app.run([sys.argv[0]])


if __name__ == '__main__':
    sys.exit(main())
