// Authorised offline starter production. No real user data, remote provider or model download.
import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { setTimeout as pause } from "node:timers/promises";
import {
  currentSeedCatalogue,
  currentTechnicalIssues,
  type CurrentMusicOptions,
} from "../src/domain/current-music";
import { musicCatalog } from "../src/infrastructure/music-lab-runtime";
import {
  startMusicJob,
  cancelMusicJob,
  getMusicJob,
} from "../src/infrastructure/music-lab-jobs";
const target = "docs/implementation/evidence/current-seed-coverage.json";
const report = {
  startedAt: new Date().toISOString(),
  eligibleConcepts: 36,
  excludedConcepts: currentSeedCatalogue
    .filter((s) => !s.eligible)
    .map((s) => ({
      id: s.id,
      sourceTopic: s.sourceTopic,
      reason:
        s.sourceTopic === 3
          ? "Youth design only; adult prototype excludes this pair."
          : "Human-support-first crisis boundary; not a normal music recommendation.",
    })),
  completed: [] as object[],
  failures: [] as object[],
  audioAudition:
    "Not subjectively auditioned. Technical checks and explicit listener preview only.",
  model: "ACE-Step 1.5 Turbo, existing pinned offline runtime",
  retention:
    "Generated source and bed stay outside Git; comparison renders are not generated or fabricated.",
};
const persist = () => writeFile(target, JSON.stringify(report, null, 2));
let active: string | undefined;
process.on("SIGINT", () => {
  if (active) cancelMusicJob(active);
  void persist().finally(() => process.exit(130));
});
for (const seed of currentSeedCatalogue.filter((s) => s.eligible)) {
  const prior = (await musicCatalog()).find(
    (s) =>
      s.request.current?.conceptId === seed.id &&
      !currentTechnicalIssues(s).length,
  );
  if (prior) {
    report.completed.push({
      conceptId: seed.id,
      name: seed.name,
      sourceTopic: seed.sourceTopic,
      sampleId: prior.id,
      pcmSha256: prior.metrics.pcmSha256,
      reusedExistingExactRecipe: true,
    });
    await persist();
    continue;
  }
  for (let attempt = 0; attempt < 2; attempt++) {
    const id = randomUUID(),
      began = Date.now();
    active = id;
    try {
      const options: CurrentMusicOptions = {
        intent: seed.intent as CurrentMusicOptions["intent"],
        taste: seed.style as CurrentMusicOptions["taste"],
        avoid: ["vocals", "percussion", "bright", "nature"],
        feel: "steady",
        conceptId: seed.id,
      };
      await startMusicJob(
        {
          model: "ace",
          style: options.taste,
          seed: seed.seed + attempt * 907,
          seconds: 30,
          current: options,
        },
        id,
      );
      while (getMusicJob(id)?.phase === "running") await pause(500);
      const job = getMusicJob(id);
      if (job?.phase !== "done")
        throw Error(job?.message || "No terminal job state.");
      const sample = (await musicCatalog()).find((s) => s.id === id);
      if (!sample) throw Error("No measured record was published.");
      report.completed.push({
        conceptId: seed.id,
        name: seed.name,
        sourceTopic: seed.sourceTopic,
        sampleId: id,
        request: sample.request,
        modelVersion: sample.modelVersion,
        codeRevision: sample.codeRevision,
        weightsRevision: sample.weightsRevision,
        metrics: sample.metrics,
        endToEndSeconds: (Date.now() - began) / 1000,
      });
      console.log(
        `${report.completed.length}/36 ${seed.id}: measured in ${((Date.now() - began) / 1000).toFixed(1)}s`,
      );
      await persist();
      break;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      report.failures.push({ conceptId: seed.id, attempt, message });
      await persist();
      console.log(`${seed.id} attempt ${attempt + 1}: ${message}`);
      if (attempt === 1) process.exitCode = 1;
    } finally {
      active = undefined;
    }
  }
}
await persist();
console.log(
  JSON.stringify({
    completed: report.completed.length,
    eligible: 36,
    excluded: 4,
    failures: report.failures.length,
  }),
);
