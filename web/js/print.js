// ── Druck-Empfehlungen (Tab-Inhalt) ─────────────────────────────────
// Rendert den App-Tab aus der EINZIGEN Datenquelle (print-data.js).
// Dieselben Daten erzeugen per tools/gen-readme.mjs die README-Abschnitte.
// Nur ins Shell-Bundle importiert – kein 3D nötig.
import { H, PROPS, SPECS, PRINTERS, REQS, NOTES } from './print-data.js';

const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

export function renderPrint(lang) {
  const L = lang === 'en' ? 'en' : 'de';
  const h = H[L];
  const specs = SPECS.map(s =>
    `<div class="spec"><dt>${esc(s.p[L])}</dt>` +
    `<dd><b>${esc(s.v[L])}</b><span>${esc(s.d[L])}</span></dd></div>`).join('');
  const printers = PRINTERS.map(p => `<li>${esc(p)}</li>`).join('');
  const reqs = REQS[L].map(r => `<li>${esc(r)}</li>`).join('');
  const notes = NOTES.map(n => `<li><b>${esc(n.t[L])}</b> – ${esc(n.d[L])}</li>`).join('');
  return (
    `<article class="printdoc">` +
    `<h2>${esc(h.heading)}</h2>` +
    `<div class="fieldtest">` +
      `<p>${esc(h.fieldtest)}</p>` +
      `<p class="props"><b>${esc(h.props_label)}:</b> ` +
      PROPS[L].map(esc).join(' · ') + `</p>` +
    `</div>` +
    `<h3>${esc(h.settings)}</h3>` +
    `<dl class="specs">${specs}</dl>` +
    `<h3>${esc(h.printers)}</h3><ul class="ticks">${printers}</ul>` +
    `<h4>${esc(h.reqs)}</h4><ul>${reqs}</ul>` +
    `<h3>${esc(h.notes)}</h3><ol class="notes">${notes}</ol>` +
    `<p class="disclaimer">${esc(h.disclaimer)}</p>` +
    `</article>`
  );
}
