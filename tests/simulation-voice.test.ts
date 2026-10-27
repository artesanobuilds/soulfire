import { afterEach, it, expect, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { SqliteHistoryRepository } from "../src/infrastructure/sqlite-history";
import {
  simulationConfigSchema,
  type SyntheticSpeech,
  type SyntheticAudio,
} from "../src/domain/simulation";
import { advanceSimulation } from "../src/application/simulations";
import {
  ensureSimulationAudio,
  cancelSyntheticAudio,
} from "../src/application/simulation-audio";
import { SimulationJobs } from "../src/application/simulation-jobs";
import {
  GET as readAudio,
  POST as prepareAudio,
} from "../app/api/simulations/audio/route";
import { historyOwner } from "../src/infrastructure/history-http";
const dirs: string[] = [];
function repo() {
  const dir = mkdtempSync(join(tmpdir(), "soulfire-speech-test-"));
  dirs.push(dir);
  return {
    dir,
    store: new SqliteHistoryRepository(join(dir, "history.sqlite")),
  };
}
const config = simulationConfigSchema.parse({
  scenario: "first-presentation",
  mode: "voice",
  delivery: "background",
  engine: "live-text",
  allowPaid: true,
  maxCostUsd: 0.1,
});
const model = {
  name: "synthetic-model-mock",
  generate: vi.fn(async () => ({
    model: "mock-voice-text-v1",
    reply: {
      kind: "conversation",
      exercise: null,
      message: "A fictional short turn about preparing one sentence.",
    },
  })),
};
const bytes = Buffer.alloc(100);
bytes.write("RIFF", 0);
bytes.write("WAVE", 8);
const speech: SyntheticSpeech = {
  synthesize: vi.fn(
    async (_text, role) =>
      ({
        bytes,
        voice: role === "user" ? "am_michael" : "af_heart",
        version: "kokoro-local-v1",
        mime: "audio/wav",
      }) as SyntheticAudio,
  ),
};
afterEach(() => {
  for (const dir of dirs.splice(0))
    rmSync(dir, { recursive: true, force: true });
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});
it("requires explicit paid consent for dynamic voice while permitting the configured bounded mode", () => {
  expect(
    simulationConfigSchema.safeParse({ ...config, allowPaid: false }).success,
  ).toBe(false);
  expect(simulationConfigSchema.safeParse(config).success).toBe(true);
});
it("synthesizes finalized model turns with distinct voices, durable cache and no model requests on replay", async () => {
  const { store, dir } = repo(),
    r = await store.createRun("owner", config);
  for (let i = 0; i < 2; i++) {
    await advanceSimulation(
      "owner",
      r.id,
      i,
      new AbortController().signal,
      store,
      () => model,
    );
    expect((await store.run("owner", r.id)).audioPending).toContain(i);
    const audio = await ensureSimulationAudio(
      "owner",
      r.id,
      i,
      new AbortController().signal,
      store,
      speech,
    );
    expect(audio.voice).toBe(i === 0 ? "am_michael" : "af_heart");
  }
  expect((await store.run("owner", r.id)).audioPending).toEqual([]);
  const restored = new SqliteHistoryRepository(join(dir, "history.sqlite"));
  await ensureSimulationAudio(
    "owner",
    r.id,
    0,
    new AbortController().signal,
    restored,
    speech,
  );
  expect(speech.synthesize).toHaveBeenCalledTimes(2);
  expect(model.generate).toHaveBeenCalledTimes(2);
  await expect(restored.audio("stranger", r.id, 0)).rejects.toThrow(
    "not found",
  );
  await restored.remove("owner", r.id);
  const db = new DatabaseSync(join(dir, "history.sqlite"));
  expect(
    db.prepare("SELECT COUNT(*) AS n FROM simulation_audio").get()?.n,
  ).toBe(0);
  db.close();
});
it("cancels in-flight synthesis and rejects duplicates without saving late audio", async () => {
  const { store } = repo(),
    r = await store.createRun("owner", config);
  await advanceSimulation(
    "owner",
    r.id,
    0,
    new AbortController().signal,
    store,
    () => model,
  );
  let finish!: () => void;
  let observed: AbortSignal | undefined;
  const slow: SyntheticSpeech = {
    synthesize: async (_t, _r, signal) => {
      observed = signal;
      await new Promise<void>((resolve) => (finish = resolve));
      return speech.synthesize("Synthetic", "user", signal);
    },
  };
  const task = ensureSimulationAudio(
    "owner",
    r.id,
    0,
    new AbortController().signal,
    store,
    slow,
  );
  await vi.waitFor(() => expect(observed).toBeDefined());
  await expect(
    ensureSimulationAudio(
      "owner",
      r.id,
      0,
      new AbortController().signal,
      store,
      slow,
    ),
  ).rejects.toThrow("already being voiced");
  cancelSyntheticAudio("owner", r.id);
  expect(observed!.aborted).toBe(true);
  finish();
  await expect(task).rejects.toThrow();
  expect(await store.audio("owner", r.id, 0)).toBe(null);
  expect((await store.run("owner", r.id)).audioPending).toEqual([0]);
});
it("deleting during synthesis prevents audio resurrection", async () => {
  const { store } = repo(),
    r = await store.createRun("owner", config);
  await advanceSimulation(
    "owner",
    r.id,
    0,
    new AbortController().signal,
    store,
    () => model,
  );
  let finish!: () => void;
  const slow: SyntheticSpeech = {
    synthesize: async () => {
      await new Promise<void>((resolve) => (finish = resolve));
      return speech.synthesize(
        "Synthetic",
        "user",
        new AbortController().signal,
      );
    },
  };
  const task = ensureSimulationAudio(
    "owner",
    r.id,
    0,
    new AbortController().signal,
    store,
    slow,
  );
  await vi.waitFor(() => expect(finish).toBeDefined());
  await store.remove("owner", r.id);
  finish();
  await expect(task).rejects.toThrow("not found");
});
it("server job finishes four dynamic turns and audio independently of a browser, duplicate starts do not duplicate generation", async () => {
  const { store } = repo(),
    r = await store.createRun("owner", config),
    jobs = new SimulationJobs();
  await Promise.all([
    jobs.start("owner", r.id, store, () => model, speech),
    jobs.start("owner", r.id, store, () => model, speech),
  ]);
  await jobs.wait("owner", r.id);
  const saved = await store.run("owner", r.id);
  expect(saved.status).toBe("completed");
  expect(saved.audioPending).toEqual([]);
  expect(model.generate).toHaveBeenCalledTimes(4);
  expect(speech.synthesize).toHaveBeenCalledTimes(4);
  expect(jobs.active("owner")).toEqual([]);
  expect(
    (await store.read("owner", r.id)).events.filter(
      (e) => e.kind === "message",
    ),
  ).toHaveLength(4);
});
it("server job cancellation invalidates model output, and a new process never auto-resumes", async () => {
  const { store } = repo(),
    r = await store.createRun("owner", config),
    jobs = new SimulationJobs();
  let finish!: () => void;
  const slow = {
    name: "mock",
    generate: async () => {
      await new Promise<void>((resolve) => (finish = resolve));
      return model.generate();
    },
  };
  await jobs.start("owner", r.id, store, () => slow, speech);
  await vi.waitFor(() => expect(finish).toBeDefined());
  jobs.cancel("owner", r.id);
  await store.control("owner", r.id, "stop");
  finish();
  await jobs.wait("owner", r.id);
  expect((await store.run("owner", r.id)).cursor).toBe(0);
  expect((await store.run("owner", r.id)).status).toBe("stopped");
  expect(new SimulationJobs().active("owner")).toEqual([]);
  expect(speech.synthesize).not.toHaveBeenCalled();
});
it("speech failure preserves generated text and resumes pending audio without another model request for that turn", async () => {
  const { store } = repo(),
    r = await store.createRun("owner", config),
    jobs = new SimulationJobs();
  const broken: SyntheticSpeech = {
    synthesize: async () => {
      throw Error("Synthetic failure");
    },
  };
  await jobs.start("owner", r.id, store, () => model, broken);
  await jobs.wait("owner", r.id);
  expect((await store.run("owner", r.id)).cursor).toBe(1);
  expect((await store.run("owner", r.id)).audioPending).toEqual([0]);
  await store.control("owner", r.id, "pause");
  await store.control("owner", r.id, "resume");
  await jobs.start("owner", r.id, store, () => model, speech);
  await jobs.wait("owner", r.id);
  expect(model.generate).toHaveBeenCalledTimes(4);
  expect(speech.synthesize).toHaveBeenCalledTimes(4);
  expect((await store.run("owner", r.id)).status).toBe("completed");
});
it("audio endpoints enforce local owner and serve cached synthetic audio without TTS or paid calls", async () => {
  const { store, dir } = repo();
  vi.stubEnv("SOULFIRE_DATA_DIR", dir);
  const base = "http://127.0.0.1:3100/api/simulations/audio",
    headers = {
      Origin: "http://127.0.0.1:3100",
      Cookie: "soulfire_history=" + "a".repeat(43),
      "Content-Type": "application/json",
    };
  const owner = historyOwner(new Request(base, { headers }))!,
    r = await store.createRun(owner, config);
  await advanceSimulation(
    owner,
    r.id,
    0,
    new AbortController().signal,
    store,
    () => model,
  );
  await ensureSimulationAudio(
    owner,
    r.id,
    0,
    new AbortController().signal,
    store,
    speech,
  );
  const get = await readAudio(
    new Request(base + `?id=${r.id}&turn=0`, { headers }),
  );
  expect(get.status).toBe(200);
  expect(get.headers.get("Content-Type")).toBe("audio/wav");
  expect(get.headers.get("Cache-Control")).toContain("no-store");
  expect(
    (await readAudio(new Request(base + `?id=${r.id}&turn=0`))).status,
  ).toBe(401);
  expect(
    (
      await prepareAudio(
        new Request(base, {
          method: "POST",
          headers,
          body: JSON.stringify({
            id: r.id,
            turn: 0,
            text: "Caller text is forbidden",
          }),
        }),
      )
    ).status,
  ).toBe(400);
  const prepared = await prepareAudio(
    new Request(base, {
      method: "POST",
      headers,
      body: JSON.stringify({ id: r.id, turn: 0 }),
    }),
  );
  expect(prepared.status).toBe(200);
  expect((await prepared.json()).voice).toBe("am_michael");
  expect(speech.synthesize).toHaveBeenCalledTimes(1);
  expect(model.generate).toHaveBeenCalledTimes(1);
});
