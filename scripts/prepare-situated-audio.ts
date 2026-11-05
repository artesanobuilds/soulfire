// Offline local speech only; never calls a model provider or uses a microphone.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  LocalSyntheticSpeech,
  localSpeechAvailable,
} from "../src/infrastructure/local-synthetic-speech";
if (!localSpeechAvailable())
  throw new Error(
    "Existing offline Kokoro is unavailable; no fallback/download allowed",
  );
const plan = JSON.parse(
  readFileSync(
    "evaluations/situated-support-comparison-plan-20261104.json",
    "utf8",
  ),
);
const cases = [
  "evaluations/situated-support-20261104.json",
  "evaluations/situated-support-heldout-20261104.json",
].flatMap((p) => JSON.parse(readFileSync(p, "utf8")).cases) as {
  id: string;
  input: string;
}[];
const ids = [
  ...plan.cases.coreOneRepeat,
  ...plan.cases.heldoutTwoRepeats,
  ...plan.cases.heldoutOneRepeat,
].filter((id: string) => id !== "practice-compatibility") as string[];
const output = "test-results/situated-audio";
mkdirSync(output, { recursive: true });
const manifest: unknown[] = [];
for (const id of ids) {
  const c = cases.find((c) => c.id === id);
  if (!c) throw new Error(`Missing ${id}`);
  const audio = await new LocalSyntheticSpeech().synthesize(
    c.input,
    "user",
    AbortSignal.timeout(60000),
  );
  writeFileSync(`${output}/${id}.wav`, audio.bytes);
  manifest.push({
    id,
    file: `${id}.wav`,
    inputSha256: createHash("sha256").update(c.input).digest("hex"),
    audioSha256: createHash("sha256").update(audio.bytes).digest("hex"),
    voice: audio.voice,
    version: audio.version,
  });
  console.log(`Prepared local audio: ${id}`);
}
writeFileSync(
  `${output}/manifest.json`,
  JSON.stringify(
    {
      status: "local WAVs generated; duration/energy verification required",
      cloudCalls: 0,
      personalMicrophone: false,
      noTimeStretchOrPauseEditing: true,
      fixtures: manifest,
    },
    null,
    2,
  ) + "\n",
);
