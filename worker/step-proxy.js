// ── STEP-Vermittler (Cloudflare Worker) ─────────────────────────────
// Sicherer Ausloeser fuer On-Demand-STEP-Builds. Die statische Pages-Seite
// darf keinen GitHub-Token enthalten; dieser Worker haelt den Token als
// Secret und loest den Actions-Build build-ritzel.yml mit den vom Nutzer
// gewaehlten Parametern aus. Danach findet er den Lauf ueber die client_id
// wieder, wartet auf das Ergebnis und reicht das STEP-Artifact als ZIP an
// den Browser durch.
//
// Erwartete Umgebungsvariablen (siehe worker/README.md):
//   GITHUB_TOKEN    fein-granularer PAT: Repo + Actions (Read/Write)
//   REPO            "owner/repo", z. B. "kaysiebke-cell/gates-cdx-..."
//   ALLOWED_ORIGIN  erlaubte Herkunft fuer CORS, z. B.
//                   "https://kaysiebke-cell.github.io"
//
// Endpunkte:
//   POST /build         { params: {...} }         -> { id }
//   GET  /status?id=ID                            -> { done, status, conclusion }
//   GET  /result?id=ID                            -> STEP-ZIP (Download)

const WORKFLOW = 'build-ritzel.yml';
const REF = 'main';
const GH = 'https://api.github.com';

// Fest hinterlegte Vorgaben, damit beim Einrichten nur der GITHUB_TOKEN
// als Secret gesetzt werden muss. Nur noetig zu aendern, wenn Repo oder
// Pages-Adresse anders sind — dann per Variable REPO / ALLOWED_ORIGIN im
// Cloudflare-Dashboard ueberschreiben.
const DEFAULT_REPO = 'kaysiebke-cell/gates-cdx-kettenspanner-ritzel-generator-brompton';
const DEFAULT_ORIGIN = 'https://kaysiebke-cell.github.io';
const repoOf = (env) => env.REPO || DEFAULT_REPO;

// Erlaubte Parameter + zulaessige Bereiche. Fremde Keys werden verworfen,
// Werte auf sinnvolle Grenzen geklemmt — so kann der oeffentliche Endpunkt
// keine entarteten oder missbraeuchlichen Builds ausloesen.
const RANGES = {
  zaehne:          [12, 18],
  eingriffswinkel: [5, 45],
  spitzen_abstand: [1, 50],
  spitzen_d:       [0, 20],
  fuss_d:          [0, 30],
  tiefe:           [0, 30],
  breite:          [1, 40],
  zahn_r:          [0, 5],
  fuehrung_w:      [0, 20],
  fuehrung_d:      [0, 120],
  bohrung_d:       [0, 40],
  nabe_d:          [0, 60],
  nabe_l:          [1, 60],
  lager_d:         [0, 60],
  lager_t:         [0, 20],
  steg_w:          [0, 30],
  seiten_t:        [0, 30],
  tasche_b:        [0, 30],
  mulde_winkel:    [0, 80],
  mulde_r:         [0, 10],
};

function reinigeParams(roh) {
  const out = {};
  if (roh && typeof roh === 'object') {
    for (const [k, r] of Object.entries(RANGES)) {
      if (!(k in roh)) continue;
      let v = Number(roh[k]);
      if (!Number.isFinite(v)) continue;
      v = Math.min(r[1], Math.max(r[0], v));
      if (k === 'zaehne') v = Math.round(v);
      out[k] = v;
    }
  }
  return out;
}

const jsonHeaders = (origin) => ({
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
});

const ghHeaders = (env) => ({
  'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
  'Accept': 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'ritzel-step-proxy',
});

// Lauf ueber die client_id im run-name wiederfinden ("Ritzel bauen <id>").
async function findeLauf(env, id) {
  const url = `${GH}/repos/${repoOf(env)}/actions/workflows/${WORKFLOW}/runs?event=workflow_dispatch&per_page=40`;
  const r = await fetch(url, { headers: ghHeaders(env) });
  if (!r.ok) return null;
  const data = await r.json();
  return (data.workflow_runs || []).find(run => (run.name || '').includes(id)) || null;
}

export default {
  async fetch(request, env) {
    const origin = env.ALLOWED_ORIGIN || DEFAULT_ORIGIN;
    const repo = repoOf(env);
    const url = new URL(request.url);

    if (request.method === 'OPTIONS')
      return new Response(null, { headers: jsonHeaders(origin) });

    try {
      // ── Build ausloesen ──
      if (request.method === 'POST' && url.pathname === '/build') {
        const body = await request.json().catch(() => ({}));
        const params = reinigeParams(body.params);
        if (!('zaehne' in params) && Object.keys(params).length === 0)
          return new Response(JSON.stringify({ error: 'keine gueltigen Parameter' }),
            { status: 400, headers: jsonHeaders(origin) });

        const id = crypto.randomUUID();
        const disp = await fetch(
          `${GH}/repos/${repo}/actions/workflows/${WORKFLOW}/dispatches`,
          {
            method: 'POST',
            headers: ghHeaders(env),
            body: JSON.stringify({
              ref: REF,
              inputs: { params_json: JSON.stringify(params), client_id: id },
            }),
          });
        if (!disp.ok)
          return new Response(JSON.stringify({ error: `dispatch ${disp.status}` }),
            { status: 502, headers: jsonHeaders(origin) });

        return new Response(JSON.stringify({ id }), { headers: jsonHeaders(origin) });
      }

      // ── Status abfragen ──
      if (request.method === 'GET' && url.pathname === '/status') {
        const id = url.searchParams.get('id') || '';
        const lauf = await findeLauf(env, id);
        if (!lauf)
          return new Response(JSON.stringify({ done: false, status: 'pending' }),
            { headers: jsonHeaders(origin) });
        return new Response(JSON.stringify({
          done: lauf.status === 'completed',
          status: lauf.status,
          conclusion: lauf.conclusion,
        }), { headers: jsonHeaders(origin) });
      }

      // ── Ergebnis (STEP-ZIP) durchreichen ──
      if (request.method === 'GET' && url.pathname === '/result') {
        const id = url.searchParams.get('id') || '';
        const lauf = await findeLauf(env, id);
        if (!lauf || lauf.status !== 'completed' || lauf.conclusion !== 'success')
          return new Response(JSON.stringify({ error: 'nicht fertig' }),
            { status: 409, headers: jsonHeaders(origin) });

        const aRes = await fetch(
          `${GH}/repos/${repo}/actions/runs/${lauf.id}/artifacts`,
          { headers: ghHeaders(env) });
        const aData = await aRes.json();
        const art = (aData.artifacts || []).find(a => a.name === 'step-download');
        if (!art)
          return new Response(JSON.stringify({ error: 'kein STEP-Artifact' }),
            { status: 404, headers: jsonHeaders(origin) });

        const zip = await fetch(
          `${GH}/repos/${repo}/actions/artifacts/${art.id}/zip`,
          { headers: ghHeaders(env) });
        if (!zip.ok)
          return new Response(JSON.stringify({ error: `artifact ${zip.status}` }),
            { status: 502, headers: jsonHeaders(origin) });

        return new Response(zip.body, {
          headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': 'attachment; filename="cdx_ritzel_buegel_custom_step.zip"',
            'Access-Control-Allow-Origin': origin,
          },
        });
      }

      return new Response(JSON.stringify({ error: 'not found' }),
        { status: 404, headers: jsonHeaders(origin) });
    } catch (e) {
      return new Response(JSON.stringify({ error: String(e) }),
        { status: 500, headers: jsonHeaders(origin) });
    }
  },
};
