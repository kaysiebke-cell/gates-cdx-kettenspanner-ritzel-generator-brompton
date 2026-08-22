# 📱 Ritzel-Generator aufs Handy laden

## ⬇️ Direkt herunterladen (immer die neueste Fassung)

**➡️ [ritzel-generator.apk herunterladen](https://github.com/kaysiebke-cell/gates-cdx-kettenspanner-ritzel-generator-brompton/releases/download/app/ritzel-generator.apk)**

Diese Datei wird bei **jeder Änderung automatisch aktualisiert** — der Link
bleibt aber immer derselbe. Am besten im Handy-Browser als **Lesezeichen**
speichern.

*(Falls der Link mal klemmt: [alle Fassungen ansehen](https://github.com/kaysiebke-cell/gates-cdx-kettenspanner-ritzel-generator-brompton/releases) → Release „Ritzel-Generator (Android-App)" → unter „Assets" auf `ritzel-generator.apk`.)*

## 📲 Installieren — 3 Schritte

1. Den Link oben **im Handy-Browser** öffnen → `ritzel-generator.apk` lädt herunter.
2. Die Datei **öffnen** (Benachrichtigung antippen oder in „Downloads").
3. Wenn gefragt: **„Aus dieser Quelle installieren" erlauben** → **Installieren**.

Passiert beim Antippen nichts, fehlt die Freigabe:
**Einstellungen → Apps → Spezieller App-Zugriff → Unbekannte Apps installieren** →
Browser bzw. Dateien-App erlauben.

## Was die App kann

Sie bringt die komplette Web-App mit und **läuft ohne Netz** — Werte ändern,
3D-Vorschau drehen, STL-ZIP erzeugen, alles auf dem Gerät.

Heruntergeladene Dateien landen im Ordner **„Downloads"**:

- **ZIP (Ritzel + Bügel als STL)** wird auf dem Gerät gebaut, geht also offline.
- **STEP-ZIP** (nur bei Standardwerten) holt die fertige Datei aus dem Release
  „serie" — dafür braucht das Handy einmal Netz.

## ⚠️ Beim Aktualisieren

- **Nicht vorher deinstallieren** — einfach die neue APK **über die alte drüber
  installieren**.
- Behält der Browser die alte Datei in „Downloads"? Dann die alte
  `ritzel-generator.apk` dort löschen, damit du sicher die neue erwischst.

## 🔑 Einmalig: Signaturschlüssel anlegen

Ohne festen Schlüssel bekommt jede APK aus der CI eine andere Signatur —
Android verweigert dann das Drüber-Installieren, und du müsstest jedes Mal
deinstallieren.

Einmal am PC anlegen:

```bash
keytool -genkeypair -v -keystore ritzel-generator.jks -keyalg RSA -keysize 2048 \
        -validity 10000 -alias ritzel
```

Dann in GitHub hinterlegen (*Settings → Secrets and variables → Actions*):

| Name | Inhalt |
|---|---|
| `SIGNIER_KEYSTORE_B64` | Ausgabe von `base64 -w0 ritzel-generator.jks` |
| `SIGNIER_KEYSTORE_PASSWORT` | das Passwort für die Datei |
| `SIGNIER_ALIAS` | `ritzel` |
| `SIGNIER_ALIAS_PASSWORT` | das Passwort für den Alias |

**Die `.jks`-Datei gut aufheben** — geht sie verloren, lässt sich nie wieder ein
Update über die bestehende Installation legen.

Solange die Schlüssel fehlen, baut GitHub eine Debug-APK. Die lässt sich
installieren und benutzen, nur Updates darüber gehen dann nicht.

## Selbst bauen (am PC)

```bash
npm install && npm run build
cd android && ./gradlew assembleDebug
```

Die fertige Datei liegt dann unter
`android/app/build/outputs/apk/debug/app-debug.apk`.

## Ohne Installation: im Browser

Geht auch ohne APK: <https://kaysiebke-cell.github.io/gates-cdx-kettenspanner-ritzel-generator-brompton/>
