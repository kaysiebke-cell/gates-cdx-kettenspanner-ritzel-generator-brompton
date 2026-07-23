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
export const STEP_API = 'https://gates-cdx-kettenspanner-ritzel-generator-brompton.kaysiebke.workers.dev';
