import { it, expect } from "vitest";
import { blockSchema, outputJsonSchemaForIntent } from "../src/lib/schema";
import { OpenAIResponses } from "../src/infrastructure/openai-responses";
import { runCompanion } from "../src/application/companion";
import { samples } from "../src/lib/catalog";

const block = {
  id: "fact",
  type: "reflect",
  title: "A fact",
  prompt: "What happened?",
  options: [],
  items: [],
};
it.each([
  { ...block, options: ["invented fact"] },
  { ...block, items: ["invented fact"] },
  {
    ...block,
    type: "choose",
    options: ["Clarify", "Wait"],
    items: ["Clarify"],
  },
])("rejects conflicting controls in the shared schema: %j", (candidate) => {
  expect(blockSchema.safeParse(candidate).success).toBe(false);
});
it("allows valid reflection, choice and sorting controls", () => {
  for (const candidate of [
    block,
    { ...block, type: "choose", options: ["Clarify", "Wait"] },
    {
      ...block,
      type: "sort",
      options: ["Known", "Unknown"],
      items: ["Their interpretation"],
    },
  ])
    expect(blockSchema.safeParse(candidate).success).toBe(true);
});
it.each(["conversation", "reflection"] as const)(
  "%s provider contract cannot generate practice controls",
  async (intent) => {
    const model = new OpenAIResponses(async (_path, body) => {
      const payload = JSON.parse(String(body));
      expect(payload.text.format.schema).toEqual(
        outputJsonSchemaForIntent(intent),
      );
      expect(payload.text.format.schema.properties.exercise).toEqual({
        type: "null",
      });
      expect(payload.text.format.schema.properties.kind.enum).toEqual([
        "conversation",
        "support",
      ]);
      return Response.json({
        model: "mock",
        output: [
          {
            content: [
              {
                type: "output_text",
                text: JSON.stringify({
                  kind: "conversation",
                  message: "One factual next step.",
                  exercise: null,
                }),
              },
            ],
          },
        ],
      });
    });
    await model.generate(
      {
        messages: [{ role: "user", content: "Help me decide." }],
        intent,
        language: "plain",
      },
      new AbortController().signal,
    );
  },
);
it("practice wire schema encodes empty reflection/choice fields, retaining runtime validation", () => {
  const serialized = JSON.stringify(outputJsonSchemaForIntent("practice"));
  expect(serialized).toContain('"maxItems":0');
  expect(serialized).toContain('"anyOf"');
  expect(serialized).not.toContain('"oneOf"');
  expect(serialized).toContain('"reflect"');
});
it.each(["conversation", "reflection"] as const)(
  "rejects unsolicited practice from an alternate provider in %s mode",
  async (intent) => {
    const model = {
      name: "mock",
      generate: async () => ({
        model: "mock",
        reply: {
          kind: "practice",
          message: "Unrequested practice",
          exercise: samples.worry,
        },
      }),
    };
    const memory = {
      read: async () => ({ revision: 0, memory: null }),
      replace: async () => {
        throw Error("No writes");
      },
      delete: async () => {
        throw Error("No writes");
      },
    };
    await expect(
      runCompanion(
        {
          messages: [{ role: "user", content: "I want to talk." }],
          intent,
          language: "plain",
        },
        new AbortController().signal,
        model,
        memory,
      ),
    ).rejects.toThrow("requires practice mode");
  },
);
