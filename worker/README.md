# STEP-Vermittler (Cloudflare Worker)

Kleiner, kostenloser Serverless-Dienst, der den **On-Demand-STEP-Build für
eigene Werte** ermöglicht. Er hält einen GitHub-Token als Secret (der darf
niemals in die öffentliche Web-Seite) und löst damit den Actions-Build
`build-ritzel.yml` mit den gewählten Parametern aus, wartet auf das Ergebnis
und reicht die STEP-ZIP (Ritzel + Bügel) an den Browser durch.

Ohne diesen Worker funktioniert die Seite normal weiter — bei eigenen Werten
gibt es dann statt des Cloud-Build-Buttons nur einen Hinweis, der STL-Download
bleibt.

## Einrichtung (einmalig, ~10 Min)

### 1. Feingranularen GitHub-Token erstellen
GitHub → **Settings → Developer settings → Fine-grained personal access tokens
→ Generate new token**:
- **Resource owner:** dein Account
- **Repository access:** *Only select repositories* → dieses Repo
- **Permissions → Repository → Actions:** *Read and write*
- **Permissions → Repository → Contents:** *Read-only* (für den Artifact-Zugriff)
- Ablauf nach Wunsch. Token kopieren (wird nur einmal angezeigt).

### 2. Worker deployen
Node.js vorausgesetzt. Im Ordner `worker/`:

```bash
cd worker
npx wrangler login          # einmalig, öffnet den Browser
# ALLOWED_ORIGIN in wrangler.toml auf deine Pages-URL prüfen/anpassen
npx wrangler deploy
npx wrangler secret put GITHUB_TOKEN   # den Token aus Schritt 1 einfügen
```

`wrangler deploy` gibt die Worker-URL aus, z. B.
`https://ritzel-step.<dein-name>.workers.dev`.

### 3. Web-Seite verbinden
In `web/js/config.js` die Worker-URL eintragen:

```js
export const STEP_API = 'https://ritzel-step.<dein-name>.workers.dev';
```

Committen und pushen → der Pages-Deploy schaltet den Button
„📐 STEP für diese Werte bauen" bei abweichenden Werten frei.

## Ablauf zur Laufzeit
1. Browser `POST /build` mit `{ params }` → Worker prüft die Werte, löst den
   Build aus, gibt eine `id` zurück.
2. Browser pollt `GET /status?id=…` bis `done`.
3. Browser lädt `GET /result?id=…` → Worker holt das `step-download`-Artifact
   und streamt es als ZIP.

## Sicherheit / Missbrauch
- Der Worker akzeptiert nur die bekannten Parameter und klemmt sie auf
  sinnvolle Bereiche (`RANGES` in `step-proxy.js`) — keine beliebigen Eingaben.
- Er kann ausschließlich `build-ritzel.yml` auf `main` auslösen, sonst nichts.
- Der Endpunkt ist öffentlich. Wer Missbrauch (viele Builds) ausschließen
  will, kann in Cloudflare **Rate Limiting** oder **Turnstile** davorschalten.
