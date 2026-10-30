import { it, expect, afterEach, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import source from "../simulations/support-suite-source.json";
import {
  FixtureSyntheticUser,
  simulationScenarios,
  simulationConfigSchema,
  usesLocalSynthesis,
  type SyntheticSpeech,
  type SimulationRun,
} from "../src/domain/simulation";
import { scenarioCatalogSchema } from "../src/domain/scenario";
import { SqliteHistoryRepository } from "../src/infrastructure/sqlite-history";
import {
  advanceSimulation,
  ModelSyntheticUser,
} from "../src/application/simulations";
import { SimulationJobs } from "../src/application/simulation-jobs";
import { ensureSimulationAudio } from "../src/application/simulation-audio";
import type { ModelProvider } from "../src/application/companion";
const evaluations = simulationScenarios.filter((s) => s.suite !== "general"),
  dirs: string[] = [];
function store() {
  const dir = mkdtempSync(join(tmpdir(), "soulfire-support-suite-"));
  dirs.push(dir);
  return new SqliteHistoryRepository(join(dir, "history.sqlite"));
}
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});
const speech: SyntheticSpeech = {
  synthesize: async (_text, role) => ({
    bytes: new Uint8Array(100),
    voice: role === "user" ? "am_michael" : "af_heart",
    version: "kokoro-local-v1",
    mime: "audio/wav",
  }),
};
it("matches exactly the 20 source headings, preserves both demos, one cross-cutting variant and five discernment cases", () => {
  expect(simulationScenarios).toHaveLength(28);
  expect(
    simulationScenarios.filter((s) => s.suite === "general").map((s) => s.id),
  ).toEqual(["first-presentation", "gentle-boundary"]);
  const topics = simulationScenarios.filter(
    (s) => s.suite === "support-safety-v1",
  );
  expect(
    topics.map((s) => ({ number: s.sourceTopicNumber, title: s.sourceTopic })),
  ).toEqual(source.sourceTopics);
  expect(
    simulationScenarios.filter((s) => s.suite === "cross-cutting-safety-v1"),
  ).toHaveLength(1);
  expect(new Set(simulationScenarios.map((s) => s.id)).size).toBe(28);
});
it("rejects unknown or duplicate scenario identities and duplicate source topics", () => {
  expect(
    simulationConfigSchema.safeParse({
      scenario: "unknown",
      mode: "text",
      delivery: "background",
      engine: "fixture",
    }).success,
  ).toBe(false);
  expect(
    scenarioCatalogSchema.safeParse([
      ...simulationScenarios,
      simulationScenarios[0],
    ]).success,
  ).toBe(false);
  expect(
    scenarioCatalogSchema.safeParse([
      ...simulationScenarios,
      { ...evaluations[0], id: "different-id" },
    ]).success,
  ).toBe(false);
});
it("all new scenarios declare human goals, consent, preferences and nonclinical evaluation boundaries", () => {
  for (const s of evaluations) {
    expect(s.profile?.goal.length).toBeGreaterThan(20);
    expect(s.profile?.spiritualPreference.length).toBeGreaterThan(20);
    expect(s.profile?.consent).toContain("Synthetic evaluation");
    expect(s.evaluation?.expected.length).toBeGreaterThanOrEqual(3);
    expect(s.evaluation?.claim).toContain(
      "not evidence of clinical effectiveness",
    );
    expect(s.evaluation?.avoid.join(" ")).toContain(
      "No diagnosis or medication changes",
    );
  }
  const teen = evaluations.find((s) => s.profile?.age === 16)!;
  expect(teen.evaluation?.risk).toBe("minor-boundary");
  expect(teen.turns[1].text).toContain("for adults");
});
async function finish(
  repo: SqliteHistoryRepository,
  owner: string,
  run: SimulationRun,
  model: ModelProvider,
) {
  if (run.config.delivery === "background") {
    const jobs = new SimulationJobs();
    await jobs.start(owner, run.id, repo, () => model, speech);
    await jobs.wait(owner, run.id);
  } else
    for (let cursor = 0; cursor < 4; cursor++) {
      const result = await advanceSimulation(
        owner,
        run.id,
        cursor,
        new AbortController().signal,
        repo,
        () => model,
      );
      if (usesLocalSynthesis(result.run))
        await ensureSimulationAudio(
          owner,
          run.id,
          cursor,
          new AbortController().signal,
          repo,
          speech,
        );
    }
  expect((await repo.run(owner, run.id)).status).toBe("completed");
  const saved = await repo.read(owner, run.id);
  expect(
    saved.events.filter((e) => e.kind === "message").map((e) => e.role),
  ).toEqual(["user", "assistant", "user", "assistant"]);
  expect(
    saved.events
      .filter((e) => e.kind === "message")
      .every((e) => e.provenance.scenarioVersion === 1),
  ).toBe(true);
  if (run.config.mode === "voice")
    for (let i = 0; i < 4; i++)
      expect((await repo.audio(owner, run.id, i))?.voice).toBe(
        i % 2 ? "af_heart" : "am_michael",
      );
  await expect(repo.claim(owner, run.id, 0)).rejects.toThrow();
  return saved;
}
it.each(evaluations)(
  "$id: deterministic fixtures launch in text/voice and witnessed/background without provider calls",
  async (s) => {
    const repo = store();
    const generate = vi.fn(async () => {
      throw Error("Fixture must not use provider");
    });
    for (const mode of ["text", "voice"] as const)
      for (const delivery of ["witnessed", "background"] as const) {
        const run = await repo.createRun(
          "owner",
          simulationConfigSchema.parse({
            scenario: s.id,
            mode,
            delivery,
            engine: "fixture",
          }),
        );
        expect(run.scenarioSnapshot).toEqual(s);
        const saved = await finish(repo, "owner", run, {
          name: "must-not-run",
          generate,
        });
        expect(
          saved.events.filter((e) => e.kind === "message").map((e) => e.text),
        ).toEqual(s.turns.map((t) => t.text));
      }
    expect(generate).not.toHaveBeenCalled();
  },
);
it.each(evaluations)(
  "$id: mocked live roles preserve scenario context across all delivery/input modes",
  async (s) => {
    const repo = store();
    for (const mode of ["text", "voice"] as const)
      for (const delivery of ["witnessed", "background"] as const) {
        let user = 0;
        const userPrompts: string[] = [];
        const model: ModelProvider = {
          name: "mock-support-evaluation",
          generate: async (input) => {
            const prompt = input.messages[0].content;
            let message: string;
            if (prompt.startsWith("This is a fictional simulation")) {
              userPrompts.push(prompt);
              message = s.turns[user++ * 2].text;
            } else message = s.turns[input.messages.length === 1 ? 1 : 3].text;
            return {
              model: "mock-support-v1",
              reply: { kind: "conversation", message, exercise: null },
            };
          },
        };
        const run = await repo.createRun(
          "owner",
          simulationConfigSchema.parse({
            scenario: s.id,
            mode,
            delivery,
            engine: "live-text",
            allowPaid: true,
            maxCostUsd: 0.1,
          }),
        );
        const saved = await finish(repo, "owner", run, model);
        expect(userPrompts).toHaveLength(2);
        expect(
          userPrompts.every(
            (p) =>
              p.includes(s.profile!.goal) &&
              p.includes(s.profile!.spiritualPreference) &&
              p.includes(s.turns[0].text),
          ),
        ).toBe(true);
        expect(
          saved.events.every((e) => e.provenance.source === "live-synthetic"),
        ).toBe(true);
      }
  },
);
it("saved scenario snapshots survive repository reopen and catalog edits", async () => {
  const repo = store(),
    s = evaluations[0],
    original = s.turns[0].text;
  const run = await repo.createRun(
    "owner",
    simulationConfigSchema.parse({
      scenario: s.id,
      mode: "text",
      delivery: "witnessed",
      engine: "fixture",
    }),
  );
  try {
    s.turns[0].text = "Later catalog revision, not this saved run.";
    const reopened = new SqliteHistoryRepository(
      join(dirs[dirs.length - 1], "history.sqlite"),
    );
    const result = await advanceSimulation(
      "owner",
      run.id,
      0,
      new AbortController().signal,
      reopened,
    );
    expect(result.message.content).toBe(original);
  } finally {
    s.turns[0].text = original;
  }
});
it("only the synthetic-user adapter receives persona details; guide context stays submitted fictional dialogue", async () => {
  const s = evaluations[0],
    prompts: string[] = [];
  const user = new ModelSyntheticUser({
    name: "mock",
    generate: async (input) => {
      prompts.push(input.messages[0].content);
      return {
        model: "mock",
        reply: {
          message: s.turns[0].text,
          kind: "conversation",
          exercise: null,
        },
      };
    },
  });
  await user.next(s, [], new AbortController().signal);
  expect(prompts[0]).toContain(s.profile!.context);
  expect(prompts[0]).not.toContain(s.evaluation!.expected[0]);
});

it("scripted users expose only factual turns to the current companion, never rubric or fixture answers", async () => {
  const repo = store();
  const scenario = simulationScenarios.find(
    (s) => s.id === "discernment-uncertain-perception",
  )!;
  const requests: string[] = [];
  const model: ModelProvider = {
    name: "mock-scripted-baseline",
    generate: async (input) => {
      requests.push(JSON.stringify(input));
      return {
        model: "mock-v1",
        reply: {
          kind: "conversation",
          message: "Independent model reply",
          exercise: null,
        },
      };
    },
  };
  let run = await repo.createRun(
    "owner",
    simulationConfigSchema.parse({
      scenario: scenario.id,
      mode: "text",
      delivery: "background",
      engine: "live-text",
      allowPaid: true,
      maxCostUsd: 0.1,
    }),
  );
  while (run.cursor < 4) {
    run = (
      await advanceSimulation(
        "owner",
        run.id,
        run.cursor,
        new AbortController().signal,
        repo,
        () => model,
        new FixtureSyntheticUser(),
      )
    ).run;
  }
  expect(requests).toHaveLength(2);
  expect(requests[0]).toContain(scenario.turns[0].text);
  expect(requests[1]).toContain(scenario.turns[2].text);
  for (const request of requests) {
    expect(request).not.toContain(scenario.evaluation!.expected[0]);
    expect(request).not.toContain("Fixture demonstration only");
  }
  const events = (await repo.read("owner", run.id)).events;
  expect(
    events.filter((e) => e.role === "assistant").map((e) => e.text),
  ).toEqual(["Independent model reply", "Independent model reply"]);
});
