// Offline only. The production transport is replaced before any request can leave.
// This script has no live mode, credentials lookup, fetch or paid execution path.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { OpenAIResponses } from "../src/infrastructure/openai-responses";
import { instructions, voiceInstructions } from "../src/lib/agent";

const base = "a73e1b15ced1958fc6d33277fddd8731027ca376";
const oldSource = execFileSync("git", ["show", `${base}:src/lib/agent.ts`], {
  encoding: "utf8",
});
// agent.ts exports string constants only; imports are forbidden in this snapshot.
if (/^import /m.test(oldSource))
  throw new Error("Baseline needs manual import review");
const baseline = await import(
  `data:text/javascript;base64,${Buffer.from(oldSource).toString("base64")}`
);
const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const core = JSON.parse(
  readFileSync("evaluations/situated-support-20261104.json", "utf8"),
).cases;
const heldout = JSON.parse(
  readFileSync("evaluations/situated-support-heldout-20261104.json", "utf8"),
).cases;
const cases = [...core, ...heldout] as {
  id: string;
  input: string;
  intent: "conversation" | "practice";
  language: "plain" | "open";
}[];
const requests: {
  case: string;
  arm: string;
  mode: "text" | "voice";
  request: Record<string, unknown>;
  userTextForLocalSpeechOnly?: string;
}[] = [];
const originalModel = process.env.OPENAI_MODEL;
process.env.OPENAI_MODEL = "gpt-6.1-sol";
try {
  for (const c of cases) {
    let captured: Record<string, unknown> | undefined;
    const provider = new OpenAIResponses(async (_path, body) => {
      captured = JSON.parse(String(body));
      return Response.json({
        output: [
          {
            content: [
              {
                type: "output_text",
                text: JSON.stringify({
                  kind: "conversation",
                  message: "Offline transport fixture; not model output.",
                  exercise: null,
                }),
              },
            ],
          },
        ],
      });
    });
    await provider.generate(
      {
        messages: [{ role: "user", content: c.input }],
        language: c.language,
        intent: c.intent,
      },
      new AbortController().signal,
    );
    if (!captured) throw new Error("Missing capture");
    const current = captured as Record<string, unknown>;
    if (
      JSON.stringify(current.input) !==
      JSON.stringify([{ role: "user", content: c.input }])
    )
      throw new Error("Unexpected context");
    const suffix = String(current.instructions).slice(instructions.length);
    for (const arm of ["baseline", "candidate"]) {
      const text = {
        ...current,
        instructions:
          (arm === "baseline" ? baseline.instructions : instructions) + suffix,
      };
      requests.push({ case: c.id, arm, mode: "text", request: text });
      const voice =
        (arm === "baseline" ? baseline.voiceInstructions : voiceInstructions) +
        `\nLanguage preference: ${c.language}. Current practice title (untrusted context): "".`;
      requests.push({
        case: c.id,
        arm,
        mode: "voice",
        request: {
          model: "gpt-realtime-2025-08-28",
          instructions: voice,
          max_output_tokens: 900,
          audio: {
            input: {
              noise_reduction: { type: "far_field" },
              transcription: { model: "gpt-4o-mini-transcribe-2025-12-15" },
              turn_detection: {
                type: "server_vad",
                silence_duration_ms: 1500,
                threshold: 0.65,
                interrupt_response: true,
                create_response: true,
              },
            },
            output: { voice: "marin" },
          },
        },
        userTextForLocalSpeechOnly: c.input,
      });
    }
  }
} finally {
  if (originalModel === undefined) delete process.env.OPENAI_MODEL;
  else process.env.OPENAI_MODEL = originalModel;
}
const serialized = JSON.stringify(requests, null, 2) + "\n";
if (
  /mustNot|\"must\"|Wisdom\/|Personal\/Personal|wisdom-raw|current-text-raw/.test(
    serialized,
  )
)
  throw new Error("Unexpected rubric/private context");
mkdirSync("test-results", { recursive: true });
writeFileSync(
  "test-results/situated-evaluation-offline-requests.json",
  serialized,
);
const report = {
  status: "offline capture only; no model outputs",
  caseCount: cases.length,
  requestCount: requests.length,
  networkRequests: 0,
  candidatePromptHashes: {
    text: hash(instructions),
    voice: hash(voiceInstructions),
  },
  baselinePromptHashes: {
    text: hash(baseline.instructions),
    voice: hash(baseline.voiceInstructions),
  },
  maxTextRequestBytes: Math.max(
    ...requests
      .filter((r) => r.mode === "text")
      .map((r) => Buffer.byteLength(JSON.stringify(r.request))),
  ),
  maxVoiceInstructionBytes: Math.max(
    ...requests
      .filter((r) => r.mode === "voice")
      .map((r) => Buffer.byteLength(String(r.request.instructions))),
  ),
  requestBundleSha256: hash(serialized),
  inputAudit:
    "Only fictional case input; no rubric, retrieval, memory or vault context",
  baselineProviderUnchanged:
    execFileSync(
      "git",
      ["show", `${base}:src/infrastructure/openai-responses.ts`],
      { encoding: "utf8" },
    ) === readFileSync("src/infrastructure/openai-responses.ts", "utf8"),
};
writeFileSync(
  "test-results/situated-evaluation-offline-audit.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));

const plan = JSON.parse(
  readFileSync(
    "evaluations/situated-support-comparison-plan-20261104.json",
    "utf8",
  ),
);
const selected: string[] = [
  ...plan.cases.coreOneRepeat,
  ...plan.cases.heldoutTwoRepeats,
  ...plan.cases.heldoutOneRepeat,
];
const schedule: {
  order: number;
  mode: string;
  case: string;
  repeat: number;
  arm: string;
  requestSha256: string;
  audioFile?: string;
}[] = [];
for (const mode of ["text", "voice"]) {
  for (const [index, id] of selected.entries()) {
    if (mode === "voice" && id === "practice-compatibility") continue;
    const repeats = plan.cases.heldoutTwoRepeats.includes(id) ? 2 : 1;
    for (let repeat = 0; repeat < repeats; repeat++) {
      const arms =
        (index + repeat) % 2 === 0
          ? ["baseline", "candidate"]
          : ["candidate", "baseline"];
      for (const arm of arms) {
        const request = requests.find(
          (r) => r.case === id && r.arm === arm && r.mode === mode,
        );
        if (!request) throw new Error("Missing scheduled request");
        schedule.push({
          order: schedule.length + 1,
          mode,
          case: id,
          repeat: repeat + 1,
          arm,
          requestSha256: hash(JSON.stringify(request.request)),
          ...(mode === "voice" ? { audioFile: `${id}.wav` } : {}),
        });
      }
    }
  }
}
if (
  schedule.filter((s) => s.mode === "text").length !== 18 ||
  schedule.filter((s) => s.mode === "voice").length !== 16
)
  throw new Error("Schedule violates stage count");
writeFileSync(
  "test-results/situated-evaluation-schedule.json",
  JSON.stringify(
    {
      status: "prepared; no execution authorized",
      candidateFrozenAt: "6a08401",
      tasks: schedule,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  "Prepared fixed schedule: 18 text requests and 16 native sessions; execution remains disabled.",
);
