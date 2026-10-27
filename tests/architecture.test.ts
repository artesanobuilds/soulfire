import { afterEach, describe, expect, it, vi } from "vitest";
import {
  mkdtempSync,
  existsSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import {
  SqliteMemoryRepository,
  memoryPath,
} from "../src/infrastructure/sqlite-memory";
import { MemoryConflict, type MemoryRepository } from "../src/domain/memory";
import {
  ModelFailure,
  runCompanion,
  type CompanionInput,
  type ModelProvider,
  type RunEvent,
} from "../src/application/companion";
import { OpenAIResponses } from "../src/infrastructure/openai-responses";
import { createRequestGate } from "../src/domain/session";
import { sceneFor, sceneSchema } from "../src/domain/scene";
import { samples } from "../src/lib/catalog";
import { GET, PUT, DELETE } from "../app/api/memory/route";
const dirs: string[] = [];
const fixture = {
  goal: "SYNTHETIC-LEARN-POTTERY",
  challenge: "A fictional first class",
  preferences: "Short prompts; no religious language",
  useWithAI: true,
};
const input: CompanionInput = {
  messages: [{ role: "user", content: "A fictional pottery class tomorrow." }],
  language: "plain",
  intent: "practice",
};
function repository() {
  const dir = mkdtempSync(join(tmpdir(), "soulfire-contract-"));
  dirs.push(dir);
  return {
    dir,
    file: join(dir, "memory.sqlite"),
    repo: new SqliteMemoryRepository(join(dir, "memory.sqlite")),
  };
}
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  for (const dir of dirs.splice(0))
    rmSync(dir, { recursive: true, force: true });
});
const req = (
  method: string,
  body?: unknown,
  origin = "http://localhost:3100",
) =>
  new Request("http://localhost:3100/api/memory", {
    method,
    headers: {
      ...(origin ? { Origin: origin } : {}),
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

describe("durable memory repository contract", () => {
  it("does not create storage on read; persists across a fresh process and deletes content with a revision tombstone", async () => {
    const { repo, file } = repository();
    expect(await repo.read()).toEqual({ revision: 0, memory: null });
    expect(existsSync(file)).toBe(false);
    const saved = await repo.replace(fixture, 0);
    expect(saved.memory?.source).toBe("user_confirmed");
    expect(statSync(file).mode & 0o777).toBe(0o600);
    const output = execFileSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        `import {DatabaseSync} from 'node:sqlite';const d=new DatabaseSync(process.argv[1]);const r=d.prepare('SELECT revision,payload FROM profile').get();process.stdout.write(JSON.stringify({revision:r.revision,goal:JSON.parse(r.payload).content.goal}));d.close();`,
        file,
      ],
      { encoding: "utf8" },
    );
    expect(JSON.parse(output)).toEqual({ revision: 1, goal: fixture.goal });
    const reopened = new SqliteMemoryRepository(file);
    expect(await reopened.read()).toEqual(saved);
    expect(await reopened.delete(1)).toEqual({ revision: 2, memory: null });
    expect(await new SqliteMemoryRepository(file).read()).toEqual({
      revision: 2,
      memory: null,
    });
    expect(readFileSync(file).includes(Buffer.from(fixture.goal))).toBe(false);
    await expect(repo.replace(fixture, 1)).rejects.toBeInstanceOf(
      MemoryConflict,
    );
    expect((await repo.read()).memory).toBeNull();
  });
  it("serializes competing edits and prevents lost updates", async () => {
    const { repo, file } = repository();
    await repo.replace(fixture, 0);
    const results = await Promise.allSettled([
      repo.replace({ ...fixture, goal: "synthetic A" }, 1),
      new SqliteMemoryRepository(file).replace(
        { ...fixture, goal: "synthetic B" },
        1,
      ),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect((await repo.read()).revision).toBe(2);
  });
  it("rejects unknown migrations without rewriting the database", async () => {
    const { repo, file } = repository();
    await repo.replace(fixture, 0);
    const db = new DatabaseSync(file);
    db.exec("PRAGMA user_version=99");
    db.close();
    await expect(repo.read()).rejects.toThrow(
      "Unsupported memory database version",
    );
    const check = new DatabaseSync(file);
    expect(check.prepare("PRAGMA user_version").get()?.user_version).toBe(99);
    check.close();
  });
  it("rejects storage inside the checkout, including a symlink ancestor", () => {
    const { dir } = repository();
    vi.stubEnv("SOULFIRE_DATA_DIR", join(process.cwd(), "local-memory"));
    expect(() => memoryPath()).toThrow("outside");
    symlinkSync(process.cwd(), join(dir, "alias"));
    vi.stubEnv("SOULFIRE_DATA_DIR", join(dir, "alias", "not-created"));
    expect(() => memoryPath()).toThrow("outside");
  });
  it("requires explicit consent and local origin; API edit/conflict/delete round trip", async () => {
    const { dir } = repository();
    vi.stubEnv("SOULFIRE_DATA_DIR", dir);
    expect((await GET(req("GET"))).headers.get("Cache-Control")).toBe(
      "no-store",
    );
    expect(
      (await PUT(req("PUT", { expectedRevision: 0, content: fixture }))).status,
    ).toBe(400);
    expect(
      (
        await PUT(
          req(
            "PUT",
            { consent: true, expectedRevision: 0, content: fixture },
            "https://foreign.example",
          ),
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await PUT(
          req(
            "PUT",
            { consent: true, expectedRevision: 0, content: fixture },
            "",
          ),
        )
      ).status,
    ).toBe(403);
    const saved = await PUT(
      req("PUT", { consent: true, expectedRevision: 0, content: fixture }),
    );
    expect(saved.status).toBe(200);
    expect((await (await GET(req("GET"))).json()).memory.content.goal).toBe(
      fixture.goal,
    );
    expect(
      (
        await PUT(
          req("PUT", { consent: true, expectedRevision: 0, content: fixture }),
        )
      ).status,
    ).toBe(409);
    expect((await DELETE(req("DELETE", { expectedRevision: 1 }))).status).toBe(
      200,
    );
    expect((await (await GET(req("GET"))).json()).memory).toBeNull();
  });
});

describe("provider-neutral orchestration and synthetic evaluations", () => {
  function provider(): ModelProvider {
    return {
      name: "Synthetic contract provider",
      generate: vi.fn(async () => ({
        reply: {
          kind: "practice",
          message: "A fictional practice.",
          exercise: samples.worry,
        },
        model: "synthetic",
      })),
    };
  }
  it("uses only explicitly allowed memory, never for selected-answer reflection, and emits content-free events", async () => {
    const { repo } = repository();
    await repo.replace(fixture, 0);
    const model = provider();
    const events: RunEvent[] = [];
    const signal = new AbortController().signal;
    const output = await runCompanion(
      { ...input, useMemory: true },
      signal,
      model,
      repo,
      (e) => events.push(e),
    );
    expect(vi.mocked(model.generate).mock.calls[0][0].memoryContext).toContain(
      fixture.goal,
    );
    expect(output.provenance.source).toBe(model.name);
    expect(Object.keys(events[0]).sort()).toEqual([
      "durationMs",
      "operation",
      "outcome",
      "usedMemory",
    ]);
    expect(JSON.stringify(events)).not.toContain(fixture.goal);
    await runCompanion(input, signal, model, repo);
    await runCompanion(
      { ...input, useMemory: true, intent: "reflection" },
      signal,
      model,
      repo,
    );
    expect(
      vi
        .mocked(model.generate)
        .mock.calls.slice(1)
        .every((c) => !c[0].memoryContext),
    ).toBe(true);
    await repo.replace({ ...fixture, useWithAI: false }, 1);
    await runCompanion({ ...input, useMemory: true }, signal, model, repo);
    expect(
      vi.mocked(model.generate).mock.calls[3][0].memoryContext,
    ).toBeUndefined();
  });
  it("does not read memory unless requested; unavailable opted-in memory fails closed", async () => {
    const repo = {
      read: vi.fn(async () => {
        throw Error("synthetic storage failure");
      }),
    } as unknown as MemoryRepository;
    const model = provider();
    await runCompanion(input, new AbortController().signal, model, repo);
    expect(repo.read).not.toHaveBeenCalled();
    await expect(
      runCompanion(
        { ...input, useMemory: true },
        new AbortController().signal,
        model,
        repo,
      ),
    ).rejects.toThrow("storage failure");
    expect(model.generate).toHaveBeenCalledTimes(1);
  });
  it("cancellation rejects a late provider result; newer request IDs invalidate prior work", async () => {
    const { repo } = repository();
    const controller = new AbortController();
    let finish!: (
      value: Awaited<ReturnType<ModelProvider["generate"]>>,
    ) => void;
    const model: ModelProvider = {
      name: "Synthetic delayed provider",
      generate: () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    };
    const pending = runCompanion(input, controller.signal, model, repo);
    controller.abort();
    finish({
      reply: { kind: "practice", message: "late", exercise: samples.worry },
      model: "synthetic",
    });
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    const gate = createRequestGate();
    const first = gate.begin();
    gate.cancel();
    expect(gate.isCurrent(first)).toBe(false);
    const next = gate.begin();
    expect(gate.isCurrent(next)).toBe(true);
  });
  it("semantic validation rejects invalid or executable scenes and logs no payload", async () => {
    const { repo } = repository();
    const events: RunEvent[] = [];
    const model = provider();
    vi.mocked(model.generate).mockResolvedValue({
      reply: {
        kind: "practice",
        message: "private invalid content",
        exercise: { ...samples.worry, html: "<script>" },
      },
      model: "synthetic",
    });
    await expect(
      runCompanion(input, new AbortController().signal, model, repo, (e) =>
        events.push(e),
      ),
    ).rejects.toBeInstanceOf(ModelFailure);
    expect(events[0].outcome).toBe("invalid");
    expect(JSON.stringify(events)).not.toContain("private");
    expect(
      sceneSchema.safeParse({ version: 1, kind: "html", html: "<script>" })
        .success,
    ).toBe(false);
    expect(sceneFor(samples.worry, "sort")?.kind).toBe("influence-map");
    expect(sceneFor(samples.quiet, "intention")).toBeNull();
  });
  it("safety interrupt does not consult memory or invoke the model", async () => {
    const model = provider();
    const repo = { read: vi.fn() } as unknown as MemoryRepository;
    const result = await runCompanion(
      {
        ...input,
        useMemory: true,
        messages: [{ role: "user", content: "I have a suicide plan." }],
      },
      new AbortController().signal,
      model,
      repo,
    );
    expect(result.reply.kind).toBe("support");
    expect(model.generate).not.toHaveBeenCalled();
    expect(repo.read).not.toHaveBeenCalled();
  });
  it.each([
    ["incomplete", { status: "incomplete" }],
    [
      "refused",
      {
        output: [
          { content: [{ type: "refusal", refusal: "private response" }] },
        ],
      },
    ],
  ])(
    "distinguishes provider %s without revealing its response",
    async (kind, payload) => {
      vi.stubEnv("OPENAI_API_KEY", "synthetic-test-only");
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => Response.json(payload)),
      );
      await expect(
        new OpenAIResponses().generate(input, new AbortController().signal),
      ).rejects.toMatchObject({ kind });
    },
  );
  it("passes bounded user memory as user data, not developer instructions, with no automatic retries", async () => {
    vi.stubEnv("OPENAI_API_KEY", "synthetic-test-only");
    const fetch = vi.fn<typeof globalThis.fetch>(async () =>
      Response.json({
        output: [
          {
            content: [
              {
                type: "output_text",
                text: JSON.stringify({
                  kind: "practice",
                  message: "Fixture",
                  exercise: samples.worry,
                }),
              },
            ],
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetch);
    await new OpenAIResponses().generate(
      { ...input, memoryContext: JSON.stringify(fixture) },
      new AbortController().signal,
    );
    const body = JSON.parse(String(fetch.mock.calls[0][1]?.body));
    expect(body.store).toBe(false);
    expect(body.instructions).not.toContain(fixture.goal);
    expect(body.input[0].role).toBe("user");
    expect(body.input[0].content).toContain(fixture.goal);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
