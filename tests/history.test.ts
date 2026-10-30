import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { SqliteHistoryRepository } from "../src/infrastructure/sqlite-history";
import {
  historyEventSchema,
  promptVersion,
  type HistoryInput,
} from "../src/domain/history";
import { runRecordedCompanion } from "../src/application/recorded-companion";
import { advanceSimulation } from "../src/application/simulations";
import { simulationConfigSchema } from "../src/domain/simulation";
import { GET, POST, PATCH, DELETE } from "../app/api/history/route";
import { POST as ingest } from "../app/api/history/events/route";
const dirs: string[] = [];
function repository(clock?: () => Date) {
  const dir = mkdtempSync(join(tmpdir(), "soulfire-history-unit-"));
  dirs.push(dir);
  return {
    repo: new SqliteHistoryRepository(join(dir, "history.sqlite"), clock),
    dir,
  };
}
const event = (key = "first"): HistoryInput => ({
  eventKey: key,
  turnKey: "turn-1",
  kind: "message",
  channel: "text",
  role: "user",
  text: "Synthetic pottery practice.",
  provenance: {
    source: "fixture",
    model: "fixture-v1",
    promptVersion,
    playback: "not-applicable",
  },
});
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
  vi.unstubAllEnvs();
});
describe("explicit local history", () => {
  it("empty read creates no DB; ownership and server identities survive reopen", async () => {
    const { repo, dir } = repository();
    expect(await repo.list("a")).toEqual([]);
    expect(existsSync(join(dir, "history.sqlite"))).toBe(false);
    const s = await repo.create("a");
    await repo.append("a", s.id, [event()]);
    const restored = await new SqliteHistoryRepository(
      join(dir, "history.sqlite"),
    ).read("a", s.id);
    expect(restored.events[0].sequence).toBe(1);
    expect(restored.events[0].id).not.toBe("first");
    await expect(repo.read("b", s.id)).rejects.toThrow("not found");
    expect(await repo.list("b")).toEqual([]);
  });
  it("deduplicates identical events, rejects changed replay and preserves receipt order/turn IDs", async () => {
    const { repo } = repository();
    const s = await repo.create("a");
    expect(await repo.append("a", s.id, [event()])).toEqual({
      inserted: 1,
      duplicates: 0,
    });
    expect(await repo.append("a", s.id, [event()])).toEqual({
      inserted: 0,
      duplicates: 1,
    });
    await expect(
      repo.append("a", s.id, [{ ...event(), text: "Changed" }]),
    ).rejects.toThrow("reused");
    await repo.append("a", s.id, [
      { ...event("second"), role: "assistant", clientOrder: 0 },
    ]);
    const d = await repo.read("a", s.id);
    expect(d.events.map((e) => e.sequence)).toEqual([1, 2]);
    expect(d.events[0].turnId).toBe(d.events[1].turnId);
  });
  it("pause blocks future writes; deletion removes feedback/content and stale events cannot recreate it", async () => {
    const { repo, dir } = repository();
    const s = await repo.create("a");
    await repo.append("a", s.id, [{ ...event(), role: "assistant" }]);
    const d = await repo.read("a", s.id);
    await repo.feedback(
      "a",
      s.id,
      d.events[0].id,
      { rating: "spot-on", note: "Synthetic usefulness note" },
      0,
    );
    await expect(
      repo.feedback(
        "a",
        s.id,
        d.events[0].id,
        { rating: "not-quite", note: "stale" },
        0,
      ),
    ).rejects.toThrow("changed");
    await repo.pause("a", s.id);
    await expect(repo.append("a", s.id, [event("late")])).rejects.toThrow(
      "paused",
    );
    await repo.remove("a", s.id);
    expect(await repo.list("a")).toEqual([]);
    await expect(repo.append("a", s.id, [event("late")])).rejects.toThrow(
      "deleted",
    );
    expect(
      readFileSync(join(dir, "history.sqlite")).includes(
        Buffer.from("Synthetic usefulness note"),
      ),
    ).toBe(false);
  });
  it("expires after 30 days and rejects future schemas", async () => {
    let now = new Date("2026-01-01T00:00:00Z");
    const { repo, dir } = repository(() => now);
    await repo.create("a");
    now = new Date("2026-02-02T00:00:00Z");
    expect(await repo.list("a")).toEqual([]);
    const db = new DatabaseSync(join(dir, "history.sqlite"));
    db.exec("PRAGMA user_version=99");
    db.close();
    await expect(repo.list("a")).rejects.toThrow("version");
  });
  it("validates content boundaries and redacts common credentials before storage/export", async () => {
    expect(
      historyEventSchema.safeParse({ ...event(), kind: "error" }).success,
    ).toBe(false);
    const { repo } = repository();
    const s = await repo.create("a");
    await repo.append("a", s.id, [
      { ...event(), text: "api_key=syntheticCredential12345678" },
    ]);
    expect((await repo.read("a", s.id)).events[0].text).toBe(
      "[redacted credential]",
    );
  });
  it("records submitted text only, feedback-ready response provenance, and blocks duplicate model execution", async () => {
    const { repo } = repository();
    const s = await repo.create("a");
    const model = {
      name: "fixture",
      generate: vi.fn(async () => ({
        reply: {
          kind: "conversation",
          message: "Synthetic guide reply",
          exercise: null,
        },
        model: "fixture-v1",
      })),
    };
    const memory = {
      read: vi.fn(async () => ({ revision: 0, memory: null })),
      replace: vi.fn(),
      delete: vi.fn(),
    };
    const input = {
      messages: [
        { role: "user" as const, content: "Earlier unsaved synthetic context" },
        { role: "user" as const, content: "Only this submitted turn" },
      ],
      language: "plain" as const,
      intent: "conversation" as const,
    };
    const recording = {
      owner: "a",
      sessionId: s.id,
      turnKey: "request-1",
      repository: repo,
    };
    await runRecordedCompanion(
      input,
      new AbortController().signal,
      model,
      memory,
      recording,
    );
    const d = await repo.read("a", s.id);
    expect(d.events.map((e) => e.text)).toEqual([
      "Only this submitted turn",
      "Synthetic guide reply",
    ]);
    expect(d.events[1].provenance.model).toBe("fixture-v1");
    await expect(
      runRecordedCompanion(
        input,
        new AbortController().signal,
        model,
        memory,
        recording,
      ),
    ).rejects.toThrow("already submitted");
    expect(model.generate).toHaveBeenCalledTimes(1);
    await expect(
      runRecordedCompanion(
        { ...input, intent: "reflection" },
        new AbortController().signal,
        model,
        memory,
        recording,
      ),
    ).rejects.toThrow("excluded");
  });
  it("canceled/failed generation saves status without error payload or late assistant text", async () => {
    const { repo } = repository();
    const s = await repo.create("a");
    const abort = new AbortController();
    const model = {
      name: "fixture",
      generate: async () => {
        abort.abort();
        return {
          reply: { message: "late", kind: "conversation", exercise: null },
          model: "fixture",
        };
      },
    };
    await expect(
      runRecordedCompanion(
        {
          messages: [{ role: "user", content: "Synthetic" }],
          language: "plain",
          intent: "conversation",
        },
        abort.signal,
        model,
        { read: vi.fn(), replace: vi.fn(), delete: vi.fn() },
        { owner: "a", sessionId: s.id, turnKey: "cancel", repository: repo },
      ),
    ).rejects.toThrow();
    expect((await repo.read("a", s.id)).events.map((e) => e.kind)).toEqual([
      "message",
      "canceled",
    ]);
  });
  it("HTTP requires explicit consent, owner cookie and origin; validates voice intake and exports scoped data", async () => {
    const { dir } = repository();
    vi.stubEnv("SOULFIRE_DATA_DIR", dir);
    const url = "http://127.0.0.1:3101/api/history";
    const first = await GET(new Request(url));
    const cookie = first.headers.get("set-cookie")!.split(";")[0];
    const req = (method: string, body: unknown, withCookie = true) =>
      new Request(url, {
        method,
        headers: {
          Origin: "http://127.0.0.1:3101",
          "Content-Type": "application/json",
          ...(withCookie ? { cookie } : {}),
        },
        body: JSON.stringify(body),
      });
    expect((await POST(req("POST", { consent: true }, false))).status).toBe(
      401,
    );
    expect((await POST(req("POST", { consent: false }))).status).toBe(400);
    const s = (await (await POST(req("POST", { consent: true }))).json())
      .session;
    const voice = {
      eventKey: "item-1",
      turnKey: "utterance-1",
      kind: "message",
      channel: "voice",
      role: "assistant",
      text: "Synthetic final voice transcript",
      clientOrder: 1,
      providerItemId: "item-1",
    };
    const ingestReq = () =>
      new Request(url + "/events", {
        method: "POST",
        headers: {
          Origin: "http://127.0.0.1:3101",
          cookie,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId: s.id, events: [voice] }),
      });
    expect((await ingest(ingestReq())).status).toBe(200);
    expect((await (await ingest(ingestReq())).json()).duplicates).toBe(1);
    const d = await (
      await GET(new Request(url + "?id=" + s.id, { headers: { cookie } }))
    ).json();
    expect(d.events[0].provenance.playback).toBe("unknown");
    expect((await GET(new Request(url + "?id=" + s.id))).status).toBe(401);
    expect(
      (await PATCH(req("PATCH", { action: "pause", id: s.id }))).status,
    ).toBe(200);
    expect((await ingest(ingestReq())).status).toBe(409);
    expect(
      (await DELETE(req("DELETE", { id: s.id, confirm: true }))).status,
    ).toBe(200);
  });
});
describe("bounded synthetic runs", () => {
  const config = simulationConfigSchema.parse({
    scenario: "first-presentation",
    mode: "voice",
    delivery: "background",
    engine: "fixture",
  });
  it("replays four alternating deterministic turns with saved synthetic provenance and no provider", async () => {
    const { repo } = repository();
    let run = await repo.createRun("sim", config);
    const model = vi.fn();
    for (let i = 0; i < 4; i++) {
      const result = await advanceSimulation(
        "sim",
        run.id,
        i,
        new AbortController().signal,
        repo,
        model,
      );
      run = result.run;
      expect(result.audio).toContain(
        `/audio/simulations/first-presentation-${i}`,
      );
    }
    expect(run.status).toBe("completed");
    expect(model).not.toHaveBeenCalled();
    const d = await repo.read("sim", run.id);
    expect(d.session.synthetic).toBe(true);
    expect(d.events.map((e) => e.role)).toEqual([
      "user",
      "assistant",
      "user",
      "assistant",
    ]);
    expect(d.events.every((e) => e.provenance.source === "fixture")).toBe(true);
  });
  it("duplicate claims, stale completions, pause/resume and deletion cannot spawn extra turns", async () => {
    const { repo } = repository();
    const r = await repo.createRun("sim", config);
    const claim = await repo.claim("sim", r.id, 0);
    await expect(repo.claim("sim", r.id, 0)).rejects.toThrow("in progress");
    await repo.control("sim", r.id, "pause");
    await expect(
      repo.finish(
        "sim",
        r.id,
        claim.claim!,
        { role: "user", content: "late" },
        "fixture",
      ),
    ).rejects.toThrow("late output");
    await repo.control("sim", r.id, "resume");
    await advanceSimulation("sim", r.id, 0, new AbortController().signal, repo);
    await repo.control("sim", r.id, "stop");
    await expect(repo.claim("sim", r.id, 1)).rejects.toThrow();
    await repo.remove("sim", r.id);
    await expect(repo.run("sim", r.id)).rejects.toThrow();
  });
  it("rejects unconsented live/voice configuration and enforces budget reservation", async () => {
    expect(
      simulationConfigSchema.safeParse({ ...config, engine: "live-text" })
        .success,
    ).toBe(false);
    const { repo } = repository();
    const r = await repo.createRun("sim", {
      ...config,
      mode: "text",
      engine: "live-text",
      allowPaid: true,
      maxCostUsd: 0.01,
    });
    const c = await repo.claim("sim", r.id, 0);
    await expect(repo.reserve("sim", r.id, c.claim!, 0.02)).rejects.toThrow(
      "limit",
    );
    await repo.reserve("sim", r.id, c.claim!, 0.005);
    expect((await repo.run("sim", r.id)).reservedCostUsd).toBe(0.005);
  });
});

it("migrates history v1 without changing saved turns", async () => {
  const { repo, dir } = repository();
  const saved = await repo.create("a");
  await repo.append("a", saved.id, [event()]);
  const db = new DatabaseSync(join(dir, "history.sqlite"));
  db.exec("DROP TABLE simulation_runs; PRAGMA user_version=1");
  db.close();
  expect((await repo.read("a", saved.id)).events[0].text).toBe(
    "Synthetic pottery practice.",
  );
  const db2 = new DatabaseSync(join(dir, "history.sqlite"));
  expect(db2.prepare("PRAGMA user_version").get()?.user_version).toBe(3);
  db2.close();
});
it("stopping an in-flight model simulation prevents a late generated turn from being stored", async () => {
  const { repo } = repository();
  const config = simulationConfigSchema.parse({
    scenario: "first-presentation",
    mode: "text",
    delivery: "background",
    engine: "live-text",
    allowPaid: true,
    maxCostUsd: 0.1,
  });
  const run = await repo.createRun("sim", config);
  let finish!: () => void;
  const pending = new Promise<void>((r) => {
    finish = r;
  });
  const task = advanceSimulation(
    "sim",
    run.id,
    0,
    new AbortController().signal,
    repo,
    () => ({
      name: "mock-live",
      generate: async () => {
        await pending;
        return {
          model: "mock",
          reply: {
            message: "Synthetic late user turn",
            kind: "conversation",
            exercise: null,
          },
        };
      },
    }),
  );
  await vi.waitFor(async () =>
    expect((await repo.run("sim", run.id)).status).toBe("generating"),
  );
  await repo.control("sim", run.id, "stop");
  finish();
  await expect(task).rejects.toThrow("late output");
  expect(
    (await repo.read("sim", run.id)).events.some((e) => e.kind === "message"),
  ).toBe(false);
});
it.each([400, 2200])(
  "simulation transport with %i tokens refuses over-budget calls before networking",
  async (outputLimit) => {
    const { simulationModel } =
      await import("../src/infrastructure/simulation-model");
    vi.stubEnv("OPENAI_API_KEY", "synthetic-test-only");
    vi.stubEnv("SOULFIRE_SIM_INPUT_USD_PER_MILLION", "0.4");
    vi.stubEnv("SOULFIRE_SIM_OUTPUT_USD_PER_MILLION", "1.6");
    const { repo } = repository();
    const config = simulationConfigSchema.parse({
      scenario: "first-presentation",
      mode: "text",
      delivery: "background",
      engine: "live-text",
      allowPaid: true,
      maxCostUsd: 0.000001,
    });
    const run = await repo.createRun("sim", config);
    const claim = await repo.claim("sim", run.id, 0);
    const network = vi.spyOn(globalThis, "fetch");
    try {
      await expect(
        simulationModel(
          repo,
          "sim",
          run.id,
          claim.claim!,
          outputLimit,
        ).generate(
          {
            messages: [{ role: "user", content: "Synthetic" }],
            language: "plain",
            intent: "conversation",
          },
          new AbortController().signal,
        ),
      ).rejects.toThrow("limit");
      expect(network).not.toHaveBeenCalled();
    } finally {
      network.mockRestore();
    }
  },
);

it("paid request count stays bounded across canceled/resumed turns", async () => {
  const { repo } = repository();
  const run = await repo.createRun(
    "sim",
    simulationConfigSchema.parse({
      scenario: "first-presentation",
      mode: "text",
      delivery: "background",
      engine: "live-text",
      allowPaid: true,
      maxCostUsd: 0.1,
    }),
  );
  for (let i = 0; i < 4; i++) {
    const claim = await repo.claim("sim", run.id, 0);
    await repo.reserve("sim", run.id, claim.claim!, 0.001);
    await repo.control("sim", run.id, "pause");
    await repo.control("sim", run.id, "resume");
  }
  const fifth = await repo.claim("sim", run.id, 0);
  await expect(
    repo.reserve("sim", run.id, fifth.claim!, 0.001),
  ).rejects.toThrow("four-request");
  expect((await repo.run("sim", run.id)).providerRequests).toBe(4);
});

it.each([400, 2200])(
  "bounded live adapter at %i tokens validates provider output without personal memory",
  async (outputLimit) => {
    const { simulationModel } =
      await import("../src/infrastructure/simulation-model");
    vi.stubEnv("OPENAI_API_KEY", "synthetic-test-only");
    vi.stubEnv("OPENAI_MODEL", "gpt-4.1-mini");
    vi.stubEnv("SOULFIRE_SIM_INPUT_USD_PER_MILLION", "0.4");
    vi.stubEnv("SOULFIRE_SIM_OUTPUT_USD_PER_MILLION", "1.6");
    const { repo } = repository();
    const run = await repo.createRun(
      "sim",
      simulationConfigSchema.parse({
        scenario: "first-presentation",
        mode: "text",
        delivery: "background",
        engine: "live-text",
        allowPaid: true,
        maxCostUsd: 0.1,
      }),
    );
    const payloads: Record<string, unknown>[] = [];
    const network = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (url, init) => {
        expect(String(url)).toBe("https://api.openai.com/v1/responses");
        const payload = JSON.parse(String(init?.body));
        payloads.push(payload);
        expect(payload.store).toBe(false);
        expect(payload.max_output_tokens).toBe(outputLimit);
        expect(payload.text.format.strict).toBe(true);
        expect(JSON.stringify(payload.input)).not.toContain(
          "notes I explicitly chose to remember",
        );
        return Response.json({
          id: "resp_synthetic",
          model: "mock-verified-model",
          output: [
            {
              content: [
                {
                  type: "output_text",
                  text: JSON.stringify({
                    message:
                      payloads.length % 2
                        ? "I want to practice a short fictional presentation."
                        : "Try rehearsing one opening sentence.",
                    kind: "conversation",
                    exercise: null,
                  }),
                },
              ],
            },
          ],
        });
      });
    try {
      for (let i = 0; i < 4; i++)
        await advanceSimulation(
          "sim",
          run.id,
          i,
          new AbortController().signal,
          repo,
          (claim) => simulationModel(repo, "sim", run.id, claim, outputLimit),
        );
      const saved = await repo.read("sim", run.id);
      expect(saved.events.map((e) => e.role)).toEqual([
        "user",
        "assistant",
        "user",
        "assistant",
      ]);
      expect(
        saved.events.every(
          (e) =>
            e.provenance.source === "live-synthetic" &&
            e.provenance.model === "mock-verified-model",
        ),
      ).toBe(true);
      expect(network).toHaveBeenCalledTimes(4);
      expect((await repo.run("sim", run.id)).providerRequests).toBe(4);
      expect((await repo.run("sim", run.id)).reservedCostUsd).toBeGreaterThan(
        0,
      );
      expect((await repo.run("sim", run.id)).status).toBe("completed");
    } finally {
      network.mockRestore();
    }
  },
);

it("synthetic import preserves claimed provenance without granting it trusted live status", async () => {
  const { dir } = repository();
  vi.stubEnv("SOULFIRE_DATA_DIR", dir);
  const base = "http://127.0.0.1:3100/api/history";
  const bootstrap = await GET(new Request(base));
  const cookie = bootstrap.headers.get("set-cookie")!.split(";")[0];
  const headers = {
    Origin: "http://127.0.0.1:3100",
    Cookie: cookie,
    "Content-Type": "application/json",
  };
  const created = await POST(
    new Request(base, {
      method: "POST",
      headers,
      body: JSON.stringify({
        consent: true,
        synthetic: {
          synthetic: true,
          version: 1,
          scenario: "Synthetic import test",
          events: [
            {
              ...event(),
              provenance: { ...event().provenance, source: "live-synthetic" },
            },
          ],
        },
      }),
    }),
  );
  expect(created.status).toBe(200);
  const { session } = await created.json();
  const read = await GET(new Request(base + "?id=" + session.id, { headers }));
  const detail = await read.json();
  expect(detail.session.synthetic).toBe(true);
  expect(detail.events[0].provenance.source).toBe("imported-synthetic");
  expect(detail.events[0].provenance.claimedSource).toBe("live-synthetic");
  expect(detail.session.state).toBe("paused");
});
