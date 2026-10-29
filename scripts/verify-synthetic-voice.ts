// Explicit local-only verification. Provider is an in-process mock; no env loading or network model call.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { SqliteHistoryRepository } from "../src/infrastructure/sqlite-history";
import {
  LocalSyntheticSpeech,
  localSpeechAvailable,
} from "../src/infrastructure/local-synthetic-speech";
import { SimulationJobs } from "../src/application/simulation-jobs";
import { simulationConfigSchema } from "../src/domain/simulation";
if (!process.argv.includes("--synthetic-only"))
  throw Error("Use --synthetic-only. This command never enables a real model.");
const output =
  process.env.SOULFIRE_SYNTHETIC_FIXTURE_DIR ||
  "/tmp/soulfire-dynamic-voice-validation-20261024";
const data =
  process.env.SOULFIRE_DATA_DIR ||
  "/tmp/soulfire-architecture-testdata-20261024";
mkdirSync(output, { recursive: true, mode: 0o700 });
mkdirSync(data, { recursive: true, mode: 0o700 });
if (!localSpeechAvailable())
  throw Error("Existing local Kokoro installation unavailable.");
const cookie = "t".repeat(43),
  owner = createHash("sha256").update(cookie).digest("hex");
const repo = new SqliteHistoryRepository(join(data, "history.sqlite"));
const config = simulationConfigSchema.parse({
  scenario: "first-presentation",
  mode: "voice",
  delivery: "background",
  engine: "live-text",
  allowPaid: true,
  maxCostUsd: 0.1,
});
const run = await repo.createRun(owner, config);
const messages = [
  "I want to rehearse a short fictional welcome.",
  "Try one opening sentence, then pause.",
  "I can practice once and let the rest unfold.",
  "That is a small, clear next step.",
];
let calls = 0;
const model = {
  name: "mock-provider-local-verification",
  generate: async () => ({
    model: "mock-dynamic-voice-v1",
    reply: { message: messages[calls++], kind: "conversation", exercise: null },
  }),
};
const jobs = new SimulationJobs();
const started = Date.now();
await jobs.start(owner, run.id, repo, () => model, new LocalSyntheticSpeech());
await jobs.wait(owner, run.id);
const saved = await repo.run(owner, run.id),
  detail = await repo.read(owner, run.id);
if (saved.cursor !== 4 || saved.audioPending?.length)
  throw Error(
    "Dynamic local synthesis did not complete; saved synthetic state remains for diagnosis.",
  );
const audio = [];
for (let i = 0; i < 4; i++) {
  const item = await repo.audio(owner, run.id, i);
  if (!item) throw Error("Missing generated audio");
  writeFileSync(join(output, `turn-${i}.wav`), item.bytes, { mode: 0o600 });
  audio.push({
    turn: i,
    voice: item.voice,
    bytes: item.bytes.length,
    format: item.mime,
  });
}
const abort = new AbortController();
const pending = new LocalSyntheticSpeech().synthesize(
  "This fictional long sentence is only for a cancellation check.",
  "user",
  abort.signal,
);
setTimeout(() => abort.abort(), 50);
let canceled = false;
try {
  await pending;
} catch (e) {
  canceled = e instanceof Error && e.name === "AbortError";
}
if (!canceled) throw Error("Local child cancellation was not observed");
writeFileSync(
  join(output, "browser-fixture.json"),
  JSON.stringify(
    {
      cookie,
      run: saved,
      messages: detail.events
        .filter((e) => e.kind === "message")
        .map((e) => ({ role: e.role, content: e.text })),
    },
    null,
    2,
  ),
  { mode: 0o600 },
);
const report = {
  syntheticOnly: true,
  provider: "in-process mock",
  mockedModelCalls: calls,
  paidRequests: 0,
  localTts: "Kokoro-82M",
  serverJobCompleted: true,
  seconds: (Date.now() - started) / 1000,
  audio,
  actualChildAbortObserved: canceled,
  directListening: false,
  realSpeechToSpeech: false,
};
writeFileSync(join(output, "result.json"), JSON.stringify(report, null, 2), {
  mode: 0o600,
});
console.log(JSON.stringify(report));
