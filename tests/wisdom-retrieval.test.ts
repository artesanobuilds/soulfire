import { afterEach, expect, it, vi } from "vitest";
import {
  publicWisdomContext,
  publicWisdomVoiceContext,
  retrievePublicWisdom,
  publicWisdomPivots,
  publicWisdomVersion,
} from "../src/lib/wisdom-retrieval";
import { OpenAIResponses } from "../src/infrastructure/openai-responses";
import { runCompanion, type ModelRequest } from "../src/application/companion";
import type { MemoryRepository } from "../src/domain/memory";
import { instructions, voiceInstructions } from "../src/lib/agent";
import { POST as realtime } from "../app/api/realtime/route";
const input: ModelRequest = {
  messages: [
    {
      role: "user",
      content: "I am anxious about the interview outcome and want control.",
    },
  ],
  language: "plain",
  intent: "conversation",
};
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
it("uses the reviewed public subset without a feature flag", () => {
  for (const value of ["", "false", "true"]) {
    vi.stubEnv("SOULFIRE_PUBLIC_WISDOM_ENABLED", value);
    expect(publicWisdomContext(input).context).toContain(publicWisdomVersion);
    expect(publicWisdomVoiceContext()).toContain(publicWisdomVersion);
  }
});
it("retrieves bounded, deterministic public ideas for a relevant first turn", () => {
  const a = retrievePublicWisdom(input);
  expect(a.some((p) => p.id === "sage-trust")).toBe(true);
  expect(a.length).toBeLessThanOrEqual(3);
  expect(retrievePublicWisdom(input)).toEqual(a);
  for (const p of a)
    expect(
      a.filter((x) => x.source.id === p.source.id).length,
    ).toBeLessThanOrEqual(2);
});
it("abstains for unknown/weak matches and respects the requested step", () => {
  for (const text of ["yes", "the and", "quantum banana bicycle", "control"])
    expect(
      retrievePublicWisdom({
        ...input,
        messages: [{ role: "user", content: text }],
      }),
    ).toEqual([]);
  const result = retrievePublicWisdom({ ...input, step: "3" });
  expect(result.length).toBeGreaterThan(0);
  expect(result.every((p) => p.steps.includes(3))).toBe(true);
});
it("does not retrieve using assistant text, earlier turns, private memory or reflection fields", () => {
  const x = {
    ...input,
    messages: [
      ...input.messages,
      {
        role: "assistant" as const,
        content: "interview anxious outcome control",
      },
      { role: "user" as const, content: "yes" },
    ],
    memoryContext: "interview anxious outcome control",
  };
  expect(retrievePublicWisdom(x)).toEqual([]);
  expect(retrievePublicWisdom({ ...input, intent: "reflection" })).toEqual([]);
});
it("suppresses retrieval on existing safety backstops", () => {
  expect(
    retrievePublicWisdom({
      ...input,
      messages: [
        {
          role: "user",
          content:
            "I can't keep myself safe. I feel anxious about the interview outcome.",
        },
      ],
    }),
  ).toEqual([]);
});
it("exports only the approved public subset with bounded provenance and no private review dependency", () => {
  expect(publicWisdomPivots).toHaveLength(22);
  expect(new Set(publicWisdomPivots.map((p) => p.id)).size).toBe(22);
  expect(new Set(publicWisdomPivots.map((p) => p.source.id)).size).toBe(8);
  for (const p of publicWisdomPivots) {
    expect(p.source.url).toMatch(/^https:\/\//);
    expect(p.source.locator).toBeTruthy();
    expect(["full-available-transcript", "available-summary-only"]).toContain(
      p.source.reviewBasis,
    );
    expect(p.sourceSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(p.reviewedPivotSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(p.text.length).toBeLessThanOrEqual(400);
    expect(p.limits.length).toBeLessThanOrEqual(400);
    expect(p.limits).toBeTruthy();
    expect(p.steps).not.toContain(12);
    expect(Object.keys(p).sort()).toEqual(
      [
        "id",
        "source",
        "steps",
        "text",
        "limits",
        "triggers",
        "sourceSha256",
        "reviewedPivotSha256",
      ].sort(),
    );
  }
});
it("never projects raw notes, private paths, query or memory into the reference block", () => {
  const context = publicWisdomContext(input).context;
  expect(context).toContain(publicWisdomVersion);
  expect(context).toContain("not quotes");
  expect(context).not.toContain(input.messages[0].content);
  for (const prohibited of [
    "/Users/",
    "Miguel",
    "canonicalPath",
    "Personal Growth/",
    "knowledge.json",
    "paraphrase",
    "memoryContext",
    "reviewedPivotSha256",
  ])
    expect(context).not.toContain(prohibited);
});
it("keeps the native voice bundle bounded and explicitly separate from dynamic retrieval", () => {
  const context = publicWisdomVoiceContext();
  expect(context.length).toBeLessThan(22000);
  for (const p of publicWisdomPivots) expect(context).toContain(p.id);
});
it("the text provider actually composes selected references unconditionally, preserving the whole core", async () => {
  const captures: Record<string, unknown>[] = [];
  const transport = vi.fn(async (_path: string, body: BodyInit) => {
    captures.push(JSON.parse(String(body)));
    return Response.json({
      status: "completed",
      output: [
        {
          content: [
            {
              type: "output_text",
              text: JSON.stringify({
                kind: "conversation",
                message: "A fictional response.",
                exercise: null,
              }),
            },
          ],
        },
      ],
    });
  });
  const model = new OpenAIResponses(transport);
  await model.generate(input, new AbortController().signal);
  expect(String(captures[0].instructions)).toContain(instructions);
  expect(String(captures[0].instructions)).toContain(publicWisdomVersion);
  expect(String(captures[0].instructions)).toContain("sage-trust");
  expect(String(captures[0].instructions)).not.toContain("rubin-4");
  expect(transport).toHaveBeenCalledTimes(1);
});
it("the native voice provider always receives the approved reviewed bundle", async () => {
  vi.stubEnv("OPENAI_API_KEY", "test-only-not-a-real-key");
  const captures: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, options: { body: FormData }) => {
      captures.push(String(options.body.get("session")));
      return new Response("mock-sdp");
    }),
  );
  const req = () =>
    new Request("http://localhost:3100/api/realtime", {
      method: "POST",
      headers: {
        origin: "http://localhost:3100",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sdp: "x".repeat(25),
        language: "plain",
        practiceTitle: "",
      }),
    });
  expect((await realtime(req())).status).toBe(200);
  expect(JSON.parse(captures[0]).instructions).toContain(voiceInstructions);
  expect(JSON.parse(captures[0]).instructions).toContain(publicWisdomVersion);
});
it("application safety still bypasses the provider with integrated public wisdom", async () => {
  const generate = vi.fn();
  const result = await runCompanion(
    {
      ...input,
      messages: [{ role: "user", content: "I can't keep myself safe." }],
    },
    new AbortController().signal,
    { name: "Mock", generate },
    {} as MemoryRepository,
  );
  expect(generate).not.toHaveBeenCalled();
  expect(result.reply.kind).toBe("support");
});
