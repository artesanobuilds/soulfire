// Local-only, explicit activation after validation. No Git push or audio deletion.
import {
  readFile,
  writeFile,
  mkdir,
  rename,
  symlink,
  lstat,
} from "node:fs/promises";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";
import { musicSampleSchema } from "../src/domain/music-lab";
import {
  currentTechnicalIssues,
  currentSeedCatalogue,
} from "../src/domain/current-music";
import { currentCataloguePolicySchema } from "../src/domain/current-catalogue";
import {
  musicLabDirectory,
  musicCatalog,
  musicCataloguePolicy,
} from "../src/infrastructure/music-lab-runtime";
const reportRoot = join(
  process.cwd(),
  "docs/research-runs/2026-10-29-current-listening-feedback",
);
const progress = JSON.parse(
  await readFile(join(reportRoot, "rebuild-progress.json"), "utf8"),
);
const original = JSON.parse(
  await readFile(
    join(reportRoot, "../2026-10-29-current-musicality/inventory.json"),
    "utf8",
  ),
);
const eligible = currentSeedCatalogue.filter((s) => s.eligible);
const selected = [];
const all = [];
const seen = new Set<string>();
const hash = async (p: string) =>
  createHash("sha256")
    .update(await readFile(p))
    .digest("hex");
for (const item of progress.completed) {
  const folder = join(
    musicLabDirectory(),
    "catalogue-staging",
    progress.version,
    item.id,
  );
  const sample = musicSampleSchema.parse(
    JSON.parse(await readFile(join(folder, "sample.json"), "utf8")),
  );
  if (
    sample.id !== item.id ||
    currentTechnicalIssues(sample).length ||
    item.technicalIssues.length
  )
    throw Error("Candidate failed validation: " + item.id);
  if (
    (await hash(join(folder, "source.wav"))) !== sample.metrics.sha256 ||
    (await hash(join(folder, "raw-source.wav"))) !==
      sample.preparation!.rawSha256
  )
    throw Error("Candidate audio hash changed");
  all.push({ ...item, sample, bedSha256: await hash(join(folder, "bed.wav")) });
}
for (const seed of eligible) {
  const candidates = all
    .filter((r) => r.conceptId === seed.id)
    .sort((a, b) => a.boundaryPenalty - b.boundaryPenalty);
  if (candidates.length !== 2)
    throw Error("Need two checked candidates: " + seed.id);
  const winner = candidates.find((r) => !seen.has(r.sample.metrics.pcmSha256));
  if (!winner) throw Error("Duplicate composition across concepts");
  seen.add(winner.sample.metrics.pcmSha256);
  selected.push(winner);
}
if (selected.length !== 36) throw Error("Eligible catalogue incomplete");
const policy = currentCataloguePolicySchema.parse({
  schemaVersion: 1,
  version: progress.version,
  publishedAt: new Date().toISOString(),
  expectedSeedCount: 36,
  seedSampleIds: selected.map((r) => r.id),
  retiredSampleIds: original.records.map((r: { id: string }) => r.id),
  description:
    "New catalogue: 36 newly generated stereo pieces with checked releases. Earlier versions remain available to saved sessions.",
});
const plan = {
  version: progress.version,
  selection:
    "Boundary/technical QA within listener-informed musical profiles; not a subjective quality verdict",
  selected: selected.map((r) => ({
    id: r.id,
    conceptId: r.conceptId,
    name: r.name,
    candidate: r.candidate,
    playableSeconds: r.playableSeconds,
    rawSha256: r.sample.preparation.rawSha256,
    sourceSha256: r.sample.metrics.sha256,
    pcmSha256: r.sample.metrics.pcmSha256,
    bedSha256: r.bedSha256,
    boundaryPenalty: r.boundaryPenalty,
    profile: r.profile,
    shift: r.shift,
  })),
  policy,
};
if (process.argv.includes("--activate")) {
  const oldPolicy = await musicCataloguePolicy();
  if (oldPolicy && oldPolicy.version !== policy.version)
    throw Error(
      "Catalogue changed concurrently; preserve it before activation",
    );
  const history = join(musicLabDirectory(), "catalogue-history");
  await mkdir(history, { recursive: true, mode: 0o700 });
  const before = join(history, policy.version + "-before.json");
  try {
    await writeFile(
      before,
      JSON.stringify(
        {
          policy: oldPolicy,
          previousSamples: await musicCatalog(true),
          retiredOriginalHashes: original.records.map(
            (r: { id: string; sourceSha256: string }) => ({
              id: r.id,
              sourceSha256: r.sourceSha256,
            }),
          ),
          replacement: plan,
        },
        null,
        2,
      ),
      { flag: "wx", mode: 0o600 },
    );
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e;
  }
  for (const row of selected) {
    const src = join(
        musicLabDirectory(),
        "catalogue-staging",
        policy.version,
        row.id,
      ),
      dst = join(musicLabDirectory(), "samples", row.id);
    await mkdir(join(musicLabDirectory(), "samples"), { recursive: true });
    try {
      await lstat(dst);
      if ((await hash(join(dst, "source.wav"))) !== row.sample.metrics.sha256)
        throw Error("Existing destination differs");
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
      await rename(src, dst);
      await symlink(dst, src, "dir");
    }
  }
  const temp = join(musicLabDirectory(), "catalogue.json.tmp");
  await writeFile(temp, JSON.stringify(policy, null, 2), { mode: 0o600 });
  await rename(temp, join(musicLabDirectory(), "catalogue.json"));
  const active = await musicCatalog();
  if (
    active.some((s) => policy.retiredSampleIds.includes(s.id)) ||
    !policy.seedSampleIds.every((id) => active.some((s) => s.id === id))
  )
    throw Error("Publication verification failed");
  await writeFile(
    join(reportRoot, "publication.json"),
    JSON.stringify(
      {
        ...plan,
        activated: true,
        activeCount: active.length,
        archivedCount: original.records.length,
      },
      null,
      2,
    ),
  );
  console.log({
    activated: policy.version,
    newSeeds: 36,
    activeCount: active.length,
    archived: original.records.length,
  });
} else {
  await writeFile(
    join(reportRoot, "catalogue-selection.json"),
    JSON.stringify(plan, null, 2),
  );
  const arg = process.argv.indexOf("--test-root");
  if (arg >= 0) {
    const test = resolve(process.argv[arg + 1]);
    if (!test.startsWith("/tmp/"))
      throw Error("Test root must be scoped to /tmp");
    await mkdir(join(test, "samples"), { recursive: true });
    for (const row of [
      ...selected.map((r) => ({
        id: r.id,
        path: join(
          musicLabDirectory(),
          "catalogue-staging",
          policy.version,
          r.id,
        ),
      })),
      ...original.records.map((r: { id: string }) => ({
        id: r.id,
        path: join(musicLabDirectory(), "samples", r.id),
      })),
    ]) {
      try {
        await symlink(row.path, join(test, "samples", row.id), "dir");
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e;
      }
    }
    for (const name of ["runtime.json", "offline-cache"]) {
      try {
        await symlink(
          join(musicLabDirectory(), name),
          join(test, name),
          name.endsWith(".json") ? "file" : "dir",
        );
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e;
      }
    }
    await writeFile(
      join(test, "catalogue.json"),
      JSON.stringify(policy, null, 2),
    );
  }
  console.log({
    prepared: true,
    newSeeds: 36,
    candidates: all.length,
    retired: policy.retiredSampleIds.length,
    shortest: Math.min(...selected.map((r) => r.playableSeconds)),
    longest: Math.max(...selected.map((r) => r.playableSeconds)),
  });
}
