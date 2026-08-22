// ── Service Worker ──────────────────────────────────────────────────
// Ohne registrierten Service Worker mit fetch-Handler bietet Chrome auf
// Android KEINE Installation an ("Zum Startbildschirm hinzufügen" fehlt).
// Dieser Worker erfüllt genau diese Bedingung und macht die Seite zusätzlich
// offline lauffähig.
//
// __V__ wird im Pages-Deploy durch den Commit-Hash ersetzt (siehe
// .github/workflows/pages.yml). Dadurch bekommt jeder Deploy einen neuen
// Cache-Namen, alte Caches werden beim activate automatisch gelöscht.
const VERSION = '__V__';
const CACHE = 'ritzel-' + VERSION;

// Kern-Dateien für den Sofort-Start / Offline-Betrieb. Relative Pfade,
// damit es auch unter einem Unterpfad (username.github.io/repo/) passt.
const PRECACHE = [
  './',
  './index.html',
  './css/style.css?v=__V__',
  './manifest.webmanifest',
  './favicon.ico',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon-180.png',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Fremde Origins (z. B. Cloud-STEP-Worker) NICHT anfassen – unverändert
  // durchreichen, sonst könnten Downloads/API-Aufrufe brechen.
  if (url.origin !== self.location.origin) return;

  const accept = req.headers.get('accept') || '';

  // HTML/Navigation: network-first, damit immer die aktuelle Version kommt;
  // offline Fallback auf den Cache.
  if (req.mode === 'navigate' || accept.includes('text/html')) {
    event.respondWith((async () => {
      try {
        // Bewusst am HTTP-Cache vorbei: GitHub Pages liefert index.html mit
        // max-age=600. Ein einfaches fetch(req) darf daraus bis zu zehn
        // Minuten die ALTE Seite bedienen – und die verweist auf die alten,
        // versionierten CSS-/JS-URLs, die hier cache-first ausgeliefert
        // werden. Ergebnis: die komplette alte App trotz neuem Deploy.
        // (new Request(req, …) geht nicht: Navigations-Requests lassen sich
        // nicht kopieren, darum die URL.)
        const net = await fetch(req.url, { cache: 'reload', credentials: 'same-origin' });
        const cache = await caches.open(CACHE);
        cache.put('./index.html', net.clone());
        return net;
      } catch (e) {
        return (await caches.match('./index.html')) ||
               (await caches.match(req)) ||
               Response.error();
      }
    })());
    return;
  }

  // Statische Assets (JS-Bundles, Icons, CSS): cache-first mit
  // Hintergrund-Aktualisierung (stale-while-revalidate).
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) {
      fetch(req).then((res) => {
        if (res && res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()));
      }).catch(() => {});
      return cached;
    }
    try {
      const res = await fetch(req);
      if (res && res.ok) {
        const cache = await caches.open(CACHE);
        cache.put(req, res.clone());
      }
      return res;
    } catch (e) {
      return Response.error();
    }
  })());
});
