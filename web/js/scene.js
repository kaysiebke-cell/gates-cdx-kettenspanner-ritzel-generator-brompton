import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Auf Handys/Tablets die Renderlast senken: kein Antialias (die
// Pixelratio-Deckelung glättet genug), kleinere Schattenkarte und
// gedeckelte Pixelratio – sonst rendert ein 3×-Retina-Display in
// dreifacher Auflösung und die Vorschau ruckelt.
const istMobil = matchMedia('(max-width: 700px), (pointer: coarse)').matches;

// ── Szene ───────────────────────────────────────────────────────────
export const viewport = document.getElementById('viewport');
export const renderer = new THREE.WebGLRenderer({ antialias: !istMobil });
viewport.appendChild(renderer.domElement);
export const scene = new THREE.Scene();
const dark = matchMedia('(prefers-color-scheme: dark)').matches;
scene.background = new THREE.Color(dark ? 0x16181c : 0xf5f6f8);

export const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 2000);
camera.position.set(55, -55, 45);
camera.up.set(0, 0, 1);
export const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Schatten + Kontrast
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

scene.add(new THREE.HemisphereLight(0xf2f5ff, 0x2a2018, 0.85));
const l1 = new THREE.DirectionalLight(0xfff4e0, 2.4);   // warmes Hauptlicht
l1.position.set(60, -40, 90);
l1.castShadow = true;
l1.shadow.mapSize.set(istMobil ? 1024 : 2048, istMobil ? 1024 : 2048);
l1.shadow.camera.left = -70; l1.shadow.camera.right = 70;
l1.shadow.camera.top = 70;   l1.shadow.camera.bottom = -70;
l1.shadow.camera.near = 10;  l1.shadow.camera.far = 300;
l1.shadow.bias = -0.0002;
scene.add(l1);
const l2 = new THREE.DirectionalLight(0xcfe0ff, 0.5);   // kühles Gegenlicht
l2.position.set(-50, 60, -30); scene.add(l2);

// Ritzel-Farbe: Bronze/Kupfer (#A65400)
export const mat = new THREE.MeshStandardMaterial({
  color: 0xA65400, metalness: 0.35, roughness: 0.45,
  side: THREE.DoubleSide,
});

// Unsichtbarer Boden, der nur den Kontaktschatten empfängt
export const boden = new THREE.Mesh(
  new THREE.CircleGeometry(150, 48),
  new THREE.ShadowMaterial({ opacity: 0.28 }));
boden.receiveShadow = true;
scene.add(boden);

export function resize() {
  const w = viewport.clientWidth, h = viewport.clientHeight;
  // Pixelratio deckeln: >2 bringt kaum sichtbare Schärfe, kostet aber
  // quadratisch Leistung. Auf Handys zusätzlich auf 1.5 begrenzen.
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(devicePixelRatio, istMobil ? 1.5 : 2));
  camera.aspect = w / h; camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
// Reagiert auch, wenn nur der Viewport-Bereich seine Größe ändert
// (mobiler Layout-Wechsel, einklappende Browserleiste, Bildschirmtastatur)
new ResizeObserver(resize).observe(viewport);

export function startRenderLoop() {
  (function loop() {
    requestAnimationFrame(loop);
    controls.update();
    try { renderer.render(scene, camera); }
    catch (e) { console.error('Renderfehler:', e); }
  })();
}
