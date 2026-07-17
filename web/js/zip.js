// Minimaler ZIP-Writer (Methode STORE, ohne Kompression) für den Browser —
// ohne externe Abhängigkeit (three-Bundle bleibt offline-/CSP-tauglich).
// STL sind ohnehin schlecht komprimierbar; STORE ist voll ausreichend.

const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c >>> 0;
  }
  return t;
})();

function crc32(bytes) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) c = crcTable[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

// files: [{ name: string, data: Uint8Array }] -> Uint8Array (ZIP-Inhalt)
export function makeZip(files) {
  const enc = new TextEncoder();
  const local = [];    // lokale Header + Daten
  const central = [];  // Central-Directory-Einträge
  let offset = 0;

  for (const f of files) {
    const name = enc.encode(f.name);
    const data = f.data;
    const crc = crc32(data);

    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true);          // Signatur
    lh.setUint16(4, 20, true);                  // Version needed
    lh.setUint16(6, 0, true);                   // Flags
    lh.setUint16(8, 0, true);                   // Methode STORE
    lh.setUint16(10, 0, true);                  // Zeit
    lh.setUint16(12, 0, true);                  // Datum
    lh.setUint32(14, crc, true);
    lh.setUint32(18, data.length, true);        // komprimiert
    lh.setUint32(22, data.length, true);        // unkomprimiert
    lh.setUint16(26, name.length, true);
    lh.setUint16(28, 0, true);                  // Extra-Länge
    local.push(new Uint8Array(lh.buffer), name, data);

    const cd = new DataView(new ArrayBuffer(46));
    cd.setUint32(0, 0x02014b50, true);          // Signatur
    cd.setUint16(4, 20, true);                  // Version made by
    cd.setUint16(6, 20, true);                  // Version needed
    cd.setUint16(8, 0, true);
    cd.setUint16(10, 0, true);                  // Methode
    cd.setUint16(12, 0, true);
    cd.setUint16(14, 0, true);
    cd.setUint32(16, crc, true);
    cd.setUint32(20, data.length, true);
    cd.setUint32(24, data.length, true);
    cd.setUint16(28, name.length, true);
    cd.setUint16(30, 0, true);
    cd.setUint16(32, 0, true);
    cd.setUint16(34, 0, true);
    cd.setUint16(36, 0, true);
    cd.setUint32(38, 0, true);
    cd.setUint32(42, offset, true);             // Offset des lokalen Headers
    central.push(new Uint8Array(cd.buffer), name);

    offset += 30 + name.length + data.length;
  }

  const cdStart = offset;
  let cdSize = 0;
  for (const c of central) cdSize += c.length;

  const eocd = new DataView(new ArrayBuffer(22));
  eocd.setUint32(0, 0x06054b50, true);
  eocd.setUint16(8, files.length, true);
  eocd.setUint16(10, files.length, true);
  eocd.setUint32(12, cdSize, true);
  eocd.setUint32(16, cdStart, true);

  const parts = [...local, ...central, new Uint8Array(eocd.buffer)];
  let total = 0;
  for (const p of parts) total += p.length;
  const out = new Uint8Array(total);
  let pos = 0;
  for (const p of parts) { out.set(p, pos); pos += p.length; }
  return out;
}
