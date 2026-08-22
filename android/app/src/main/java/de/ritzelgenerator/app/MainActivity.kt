package de.ritzelgenerator.app

import android.app.DownloadManager
import android.content.ContentValues
import android.content.Context
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.MediaStore
import android.util.Base64
import android.view.ViewGroup
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.webkit.ServiceWorkerClientCompat
import androidx.webkit.ServiceWorkerControllerCompat
import androidx.webkit.WebSettingsCompat
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewFeature

/**
 * Hüllt die Web-Fassung in eine Android-App – nicht mehr als das.
 *
 * Die Dateien aus `web/` liegen als Assets in der App; der Build kopiert sie
 * dorthin (siehe `app/build.gradle`). Gerechnet und gerendert wird auf dem
 * Gerät, es gibt keinen Server.
 *
 * Geladen wird **nicht** über `file://`, sondern über den [WebViewAssetLoader]
 * unter einer echten https-Adresse. Unter `file://` gilt jede Datei als
 * eigener Ursprung — der Service Worker der Seite ließe sich dort nicht
 * registrieren, und die Offline-Fähigkeit wäre dahin.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    /** Virtuelle Adresse, unter der die Assets erscheinen. */
    private val startseite =
        "https://appassets.androidplatform.net/assets/www/index.html"

    override fun onCreate(zustand: Bundle?) {
        super.onCreate(zustand)

        val laden = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView = WebView(this).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT,
            )
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.allowFileAccess = false
            settings.allowContentAccess = false
            // Die Seite bringt ihr eigenes Layout mit; kein Hineinzoomen nötig.
            settings.builtInZoomControls = false
            settings.textZoom = 100

            addJavascriptInterface(DownloadBruecke(), "AndroidDownload")

            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(
                    ansicht: WebView,
                    anfrage: WebResourceRequest,
                ): WebResourceResponse? = laden.shouldInterceptRequest(anfrage.url)

                override fun onPageFinished(ansicht: WebView, url: String) {
                    ansicht.evaluateJavascript(DOWNLOAD_BRUECKE_JS, null)
                }
            }
        }

        // Der Service Worker der Seite holt seine Dateien selbst — und SEINE
        // Anfragen laufen NICHT durch shouldInterceptRequest der WebView.
        // Ohne diesen zweiten Weg gingen sie ins echte Netz, wo es
        // appassets.androidplatform.net nicht gibt: Die App bliebe beim
        // zweiten Start leer, sobald der Worker die Kontrolle übernommen hat.
        if (WebViewFeature.isFeatureSupported(WebViewFeature.SERVICE_WORKER_BASIC_USAGE)) {
            ServiceWorkerControllerCompat.getInstance().setServiceWorkerClient(
                object : ServiceWorkerClientCompat() {
                    override fun shouldInterceptRequest(
                        anfrage: WebResourceRequest,
                    ): WebResourceResponse? = laden.shouldInterceptRequest(anfrage.url)
                }
            )
        }

        // Dunkelmodus: die Seite wertet prefers-color-scheme aus, dafür muss der
        // WebView die Einstellung des Geräts weitergeben.
        if (WebViewFeature.isFeatureSupported(WebViewFeature.ALGORITHMIC_DARKENING)) {
            WebSettingsCompat.setAlgorithmicDarkeningAllowed(webView.settings, true)
        }

        setContentView(webView)

        if (zustand == null) {
            webView.loadUrl(startseite)
        } else {
            webView.restoreState(zustand)
        }

        // Zurück-Taste blättert in der Seite, statt die App gleich zu schließen.
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })
    }

    override fun onSaveInstanceState(zustand: Bundle) {
        super.onSaveInstanceState(zustand)
        webView.saveState(zustand)
    }

    override fun onDestroy() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            webView.destroy()
        }
        super.onDestroy()
    }

    /**
     * Speichert, was die Seite zum Herunterladen anbietet.
     *
     * Nötig, weil ein WebView Klicks auf `<a download>` mit `blob:`-Adresse
     * NICHT an den DownloadListener weiterreicht — und genau die benutzt der
     * STL/ZIP-Export (er baut die Datei im Browser zusammen). Ohne diese
     * Brücke passierte beim Antippen des Download-Knopfes schlicht nichts.
     */
    private inner class DownloadBruecke {

        /** Im Browser erzeugte Datei (STL/ZIP), als Base64 herübergereicht. */
        @JavascriptInterface
        fun speichereBase64(name: String, typ: String, base64: String) {
            try {
                val daten = Base64.decode(base64, Base64.DEFAULT)
                val werte = ContentValues().apply {
                    put(MediaStore.Downloads.DISPLAY_NAME, name)
                    put(MediaStore.Downloads.MIME_TYPE, typ)
                    put(MediaStore.Downloads.IS_PENDING, 1)
                }
                val ziel = contentResolver.insert(
                    MediaStore.Downloads.EXTERNAL_CONTENT_URI, werte
                ) ?: run { melde("Speichern fehlgeschlagen"); return }

                contentResolver.openOutputStream(ziel)?.use { it.write(daten) }

                werte.clear()
                werte.put(MediaStore.Downloads.IS_PENDING, 0)
                contentResolver.update(ziel, werte, null, null)
                melde("Gespeichert unter „Downloads“: $name")
            } catch (e: Exception) {
                melde("Speichern fehlgeschlagen: ${e.message}")
            }
        }

        /** Fertige STEP-ZIP aus dem GitHub-Release — normaler Netz-Download. */
        @JavascriptInterface
        fun speichereUrl(url: String, name: String) {
            try {
                val anfrage = DownloadManager.Request(Uri.parse(url))
                    .setTitle(name)
                    .setDestinationInExternalPublicDir(
                        android.os.Environment.DIRECTORY_DOWNLOADS, name
                    )
                    .setNotificationVisibility(
                        DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED
                    )
                (getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager).enqueue(anfrage)
                melde("Download gestartet: $name")
            } catch (e: Exception) {
                melde("Download fehlgeschlagen: ${e.message}")
            }
        }

        @JavascriptInterface
        fun fehler(text: String) = melde("Download fehlgeschlagen: $text")
    }

    private fun melde(text: String) = runOnUiThread {
        Toast.makeText(this, text, Toast.LENGTH_LONG).show()
    }

    private companion object {
        /**
         * Überschreibt click() auf Anker-Elementen: `blob:`/`data:` gehen als
         * Base64 über die Brücke, http(s) an den DownloadManager. Alles andere
         * läuft unverändert weiter.
         *
         * Ein Listener auf `document` reichte nicht: die Seite erzeugt den
         * Anker im Skript und klickt ihn, ohne ihn ins Dokument zu hängen —
         * so ein Klick steigt nirgendwo auf.
         */
        const val DOWNLOAD_BRUECKE_JS = """
(function () {
  if (window.__apkDownload) return;
  window.__apkDownload = 1;
  var orig = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    var href = this.href || '';
    if (!this.hasAttribute('download')) return orig.apply(this, arguments);
    var name = this.getAttribute('download') || 'download';
    if (href.indexOf('http') === 0) { AndroidDownload.speichereUrl(href, name); return; }
    if (href.indexOf('blob:') === 0 || href.indexOf('data:') === 0) {
      fetch(href).then(function (r) { return r.blob(); }).then(function (b) {
        var leser = new FileReader();
        leser.onloadend = function () {
          var t = String(leser.result), i = t.indexOf(',');
          AndroidDownload.speichereBase64(
            name, b.type || 'application/octet-stream', t.substring(i + 1));
        };
        leser.readAsDataURL(b);
      }).catch(function (e) { AndroidDownload.fehler(String(e)); });
      return;
    }
    return orig.apply(this, arguments);
  };
})();
"""
    }
}
