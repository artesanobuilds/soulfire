import { ensureSimulationAudio } from "../src/application/simulation-audio";
import {
  LocalSyntheticSpeech,
  localSpeechAvailable,
} from "../src/infrastructure/local-synthetic-speech";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import { SqliteHistoryRepository } from "../src/infrastructure/sqlite-history";
import { memoryPath } from "../src/infrastructure/sqlite-memory";
import { simulationConfigSchema } from "../src/domain/simulation";
import { historyEventSchema } from "../src/domain/history";
import { advanceSimulation } from "../src/application/simulations";
import {
  liveSimulationAvailable,
  simulationModel,
} from "../src/infrastructure/simulation-model";
const args = process.argv.slice(2);
const option = (key: string, fallback: string) => {
  const i = args.indexOf(key);
  return i < 0 ? fallback : args[i + 1] || fallback;
};
const live = args.includes("--live"),
  runs = Number(option("--runs", "1"));
if (!Number.isInteger(runs) || runs < 1 || runs > 3)
  throw Error("Choose one to three bounded runs.");
if (live) {
  if (!args.includes("--confirm-paid") || runs !== 1)
    throw Error("Live mode requires --confirm-paid and exactly one run.");
  const { loadEnvConfig } = await import("@next/env");
  loadEnvConfig(process.cwd(), false, { info: () => {}, error: () => {} });
  if (!liveSimulationAvailable())
    throw Error(
      "Live mode needs the existing server key and verified SOULFIRE_SIM_INPUT_USD_PER_MILLION / SOULFIRE_SIM_OUTPUT_USD_PER_MILLION. No request was made.",
    );
}
const config = simulationConfigSchema.parse({
  scenario: option("--scenario", "first-presentation"),
  mode: option("--mode", "text"),
  delivery: "background",
  engine: live ? "live-text" : "fixture",
  allowPaid: live,
  maxCostUsd: Number(option("--max-cost-usd", "0")),
});
if (live && config.mode === "voice" && !localSpeechAvailable())
  throw Error("Local Kokoro is unavailable; no paid request was made.");
const output = option(
  "--output",
  join(homedir(), "Library", "Application Support", "soulfire-simulations"),
);
process.env.SOULFIRE_DATA_DIR = output;
const dir = dirname(memoryPath());
mkdirSync(dir, { recursive: true, mode: 0o700 });
const repo = new SqliteHistoryRepository(join(dir, "history.sqlite"));
const owner = "synthetic-cli-v1";
const summaries = [];
for (let i = 0; i < runs; i++) {
  let run = await repo.createRun(owner, config);
  const signal = AbortSignal.timeout(180000);
  try {
    while (run.cursor < 4) {
      const result = await advanceSimulation(
        owner,
        run.id,
        run.cursor,
        signal,
        repo,
        (claim) => simulationModel(repo, owner, run.id, claim),
      );
      run = result.run;
      if (live && config.mode === "voice") {
        await ensureSimulationAudio(
          owner,
          run.id,
          run.cursor - 1,
          signal,
          repo,
          new LocalSyntheticSpeech(),
        );
        run = await repo.run(owner, run.id);
      }
    }
  } catch {
    await repo.control(owner, run.id, "fail");
    run = await repo.run(owner, run.id);
  }
  const detail = await repo.read(owner, run.id);
  const folder = join(dir, run.id);
  mkdirSync(folder, { mode: 0o700 });
  const events = detail.events.map(
    ({
      id,
      turnId,
      sequence,
      receivedAt,
      feedback,
      feedbackRevision,
      ...e
    }) => {
      void id;
      void turnId;
      void sequence;
      void receivedAt;
      void feedback;
      void feedbackRevision;
      return historyEventSchema.parse(e);
    },
  );
  writeFileSync(
    join(folder, "import.json"),
    JSON.stringify(
      { synthetic: true, version: 1, scenario: config.scenario, events },
      null,
      2,
    ),
    { mode: 0o600 },
  );
  writeFileSync(
    join(folder, "result.json"),
    JSON.stringify(
      {
        run,
        ...detail,
        evidence:
          config.mode === "voice"
            ? live
              ? "Model-generated text + locally synthesized audio; no microphone or speech-to-speech round trip"
              : "Simulated voice-path events; no microphone, playback or real audio round trip"
            : "Synthetic text simulation",
        providerRequestReservations: run.providerRequests,
        actualProviderRequests: live
          ? "Not independently observed; see reservation count"
          : 0,
      },
      null,
      2,
    ),
    { mode: 0o600 },
  );
  summaries.push({
    runId: run.id,
    status: run.status,
    turns: run.cursor,
    engine: config.engine,
    result: join(folder, "result.json"),
    import: join(folder, "import.json"),
    reservedEstimatedCostUsd: run.reservedCostUsd,
  });
}
console.log(JSON.stringify({ synthetic: true, results: summaries }, null, 2));
if (summaries.some((r) => r.status !== "completed")) process.exitCode = 1;
