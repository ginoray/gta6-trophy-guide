// Leonida Legend — a gta6-trophy-guide-01 entry (Node 22, standard library only). The guide is this directory's
// app/ folder: plain static files a browser opens at app/index.html, offline (it loads nothing over the network),
// with the full trophy list, original per-trophy guides, a progress tracker, spoiler mode and a platinum roadmap
// driven by app/data/trophies.json. This program hands it in: it copies app/ to /output, decodes the screenshots
// (stored in the repo only as base64 text, screenshots/<name>.b64) into real JPEGs at /output/screenshots/, and
// writes /output/dossier.json, the summary the judge reads, with the vendored make.fun library. Leave
// vendor/makefun-frontend.ts as it is: the scorer requires dossier.json to be byte for byte what its own copy writes.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });

// Validate the guide's data before handing anything in: the entry stands or falls on app/data/trophies.json
// holding the complete official list — exactly 55 trophies, each with a guide written for it (a blank guide is
// a missing guide). Fail loudly here rather than let a truncated or hollow data file reach the judge.
const dataPath = join(here, 'app', 'data', 'trophies.json');
const data = JSON.parse(readFileSync(dataPath, 'utf8'));
if (!Array.isArray(data.trophies) || data.trophies.length !== 55) {
  throw new Error(`app/data/trophies.json must hold exactly 55 trophies, found ${data.trophies?.length}`);
}
for (const trophy of data.trophies) {
  if (typeof trophy.guide !== 'string' || trophy.guide.trim() === '') {
    throw new Error(`trophy ${trophy.id} (${trophy.name}) has no guide text`);
  }
}

cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });

// Screenshots live in the repo as base64 text files only (screenshots/<name>.b64), so the hand-in decodes each
// one into the JPEG the judge expects at /output/screenshots/<name>.jpg. The .b64 files themselves are never
// copied across. Names are sorted so the dossier's cover order is deterministic (1-checklist first).
const shotsDir = join(out, 'screenshots');
mkdirSync(shotsDir, { recursive: true });
const encoded = readdirSync(join(here, 'screenshots'))
  .filter((name) => name.endsWith('.b64'))
  .sort();
if (encoded.length === 0) throw new Error('no screenshots found: expected at least one screenshots/<name>.b64');
for (const name of encoded) {
  const base64 = readFileSync(join(here, 'screenshots', name), 'utf8').replace(/\s+/g, '');
  const jpeg = Buffer.from(base64, 'base64');
  if (jpeg.length < 3 || jpeg[0] !== 0xff || jpeg[1] !== 0xd8) {
    throw new Error(`screenshots/${name} does not decode to a JPEG`);
  }
  writeFileSync(join(shotsDir, name.slice(0, -'.b64'.length) + '.jpg'), jpeg);
}

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files and directories in app/ or
// 48 MiB of app files: app/ counts beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
