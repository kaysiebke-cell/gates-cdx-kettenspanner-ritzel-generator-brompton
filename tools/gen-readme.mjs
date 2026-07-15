// Generiert die Druck-Empfehlungs-Abschnitte in README.md (EN) und
// README.de.md (DE) aus der EINZIGEN Datenquelle web/js/print-data.js.
// Ersetzt den Inhalt zwischen <!-- PRINT:START --> und <!-- PRINT:END -->.
// Aufruf: `node tools/gen-readme.mjs` (Teil von `npm run build`).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { H, PROPS, SPECS, PRINTERS, REQS, NOTES } from '../web/js/print-data.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Pipe in Tabellenzellen maskieren, sonst bricht die Markdown-Tabelle.
const cell = s => String(s).replace(/\|/g, '\\|');

const TABLE_HEAD = {
  de: ['Parameter', 'Empfehlung', 'Details'],
  en: ['Parameter', 'Recommendation', 'Details'],
};

function section(L) {
  const h = H[L];
  const out = [];
  // Praxis-Kasten + Eigenschaften
  out.push(`> ${h.fieldtest}`);
  out.push('>');
  out.push(`> **${h.props_label}:** ${PROPS[L].join(' · ')}`);
  out.push('');
  // Einstellungen (Tabelle)
  out.push(`### ${h.settings}`);
  out.push('');
  out.push(`| ${TABLE_HEAD[L].join(' | ')} |`);
  out.push('|---|---|---|');
  for (const s of SPECS) out.push(`| **${cell(s.p[L])}** | ${cell(s.v[L])} | ${cell(s.d[L])} |`);
  out.push('');
  // Drucker
  out.push(`### ${h.printers}`);
  out.push('');
  for (const p of PRINTERS) out.push(`- ${p}`);
  out.push('');
  out.push(`**${h.reqs}:** ${REQS[L].join(' · ')}`);
  out.push('');
  // Hinweise
  out.push(`### ${h.notes}`);
  out.push('');
  NOTES.forEach((n, i) => out.push(`${i + 1}. **${n.t[L]}** – ${n.d[L]}`));
  out.push('');
  // Disclaimer
  out.push(`> ${h.disclaimer}`);
  return out.join('\n');
}

const MARKER = /<!-- PRINT:START[\s\S]*?<!-- PRINT:END -->/;

for (const { file, lang } of [
  { file: 'README.md', lang: 'en' },
  { file: 'README.de.md', lang: 'de' },
]) {
  const path = join(root, file);
  const src = readFileSync(path, 'utf8');
  if (!MARKER.test(src)) {
    console.error(`✗ ${file}: Marker <!-- PRINT:START --> … <!-- PRINT:END --> fehlt`);
    process.exitCode = 1;
    continue;
  }
  const block =
    '<!-- PRINT:START (auto-generiert aus web/js/print-data.js – nicht von Hand ändern; `npm run build`) -->\n' +
    section(lang) + '\n' +
    '<!-- PRINT:END -->';
  const out = src.replace(MARKER, block);
  if (out !== src) writeFileSync(path, out);
  console.log(`✓ ${file}: Druck-Abschnitt (${lang}) generiert`);
}
