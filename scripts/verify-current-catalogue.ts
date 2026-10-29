// Read-only integrity check of the authorised generated catalogue; no model execution.
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";
import {
  currentSeedCatalogue,
  currentTechnicalIssues,
} from "../src/domain/current-music";
import {
  musicCatalog,
  musicLabDirectory,
  musicStorageBytes,
} from "../src/infrastructure/music-lab-runtime";
const all = await musicCatalog(),
  rows = [];
for (const seed of currentSeedCatalogue.filter((s) => s.eligible)) {
  const sample = all.find(
    (s) =>
      s.request.current?.conceptId === seed.id &&
      !currentTechnicalIssues(s).length,
  );
  if (!sample) throw Error(`No eligible real sample for ${seed.id}`);
  const source = await readFile(
    join(musicLabDirectory(), "samples", sample.id, "source.wav"),
  );
  if (
    createHash("sha256").update(source).digest("hex") !== sample.metrics.sha256
  )
    throw Error(`Source integrity failed: ${seed.id}`);
  const bed = await readFile(
    join(musicLabDirectory(), "samples", sample.id, "bed.wav"),
  );
  if (bed.length < 44) throw Error(`Missing listening render: ${seed.id}`);
  rows.push({
    conceptId: seed.id,
    sourceTopic: seed.sourceTopic,
    sampleId: sample.id,
    name: seed.name,
    sourceBytes: source.length,
    sourceSha256: sample.metrics.sha256,
    bedBytes: bed.length,
    bedSha256: createHash("sha256").update(bed).digest("hex"),
    pcmSha256: sample.metrics.pcmSha256,
    technicalIssues: currentTechnicalIssues(sample),
    duration: sample.metrics.duration,
    matchedLufs: sample.metrics.matchedLufs,
    matchedTruePeakDb: sample.metrics.matchedTruePeakDb,
  });
}
if (new Set(rows.map((s) => s.pcmSha256)).size !== 36)
  throw Error("The starter bank is not 36 distinct PCM results.");
for (const topic of new Set(rows.map((s) => s.sourceTopic)))
  if (rows.filter((s) => s.sourceTopic === topic).length !== 2)
    throw Error("Source coverage is incomplete.");
const report = {
  verifiedAt: new Date().toISOString(),
  eligibleRecipes: 36,
  actualDistinctPcm: 36,
  sourceAreas: 18,
  piecesPerSourceArea: 2,
  excludedSourceAreas: [3, 4],
  storageBytes: await musicStorageBytes(),
  rows,
  subjectiveAudition: false,
  clinicalValidation: false,
};
await writeFile(
  "docs/implementation/evidence/current-catalogue-integrity.json",
  JSON.stringify(report, null, 2),
);
console.log(
  JSON.stringify({
    eligible: 36,
    distinct: 36,
    areas: 18,
    storageGiB: report.storageBytes / 1024 ** 3,
  }),
);
