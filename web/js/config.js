// ── Konfiguration ───────────────────────────────────────────────────
// STEP_API: URL des Cloudflare-Workers (oder einer anderen Serverless-
// Funktion), der On-Demand-STEP-Builds für eigene Werte auslöst.
//
// Leer lassen ("") = Funktion aus: Bei abweichenden Werten erscheint dann
// nur ein Hinweis (kein Cloud-Build-Button), der STL-Download bleibt.
//
// So aktivierst du den Cloud-Build für eigene Werte:
//   1. Worker aus worker/ deployen (siehe worker/README.md).
//   2. Die vom Worker vergebene URL hier eintragen, z. B.
//      export const STEP_API = 'https://ritzel-step.dein-name.workers.dev';
//   3. Änderung committen → Pages-Deploy schaltet den Button frei.
// Wieder aktiv, seit der Worker auch die Spannrolle bauen kann. Er wurde
// damals abgeschaltet, weil der Bau fehlschlug — laeuft er wieder nicht,
// genuegt es, hier '' einzutragen: dann erscheint statt des Knopfs wieder
// der erklaerende Hinweis. Voraussetzung im Worker ist das Secret
// GITHUB_TOKEN (Repo + Actions, Read/Write), siehe worker/README.md.
export const STEP_API = 'https://gates-cdx-kettenspanner-ritzel-generator-brompton.kaysiebke.workers.dev';
