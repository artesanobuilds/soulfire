import { z } from "zod";
const text = z.string().trim().min(1).max(2000);
export const scenarioSchema = z
  .object({
    id: z.string().regex(/^[a-z][a-z0-9-]{1,79}$/),
    name: text,
    persona: text,
    version: z.number().int().positive(),
    suite: z.enum(["general", "support-safety-v1", "cross-cutting-safety-v1"]),
    fixtureAudio: z.enum(["static-v1", "local-tts"]),
    sourceTopicNumber: z.number().int().min(1).max(20).nullable().optional(),
    sourceTopic: text.optional(),
    profile: z
      .object({
        name: text,
        age: z.number().int().min(13).max(100),
        context: text,
        goal: text,
        spiritualPreference: text,
        consent: text,
        boundaries: z.array(text).min(1).max(10),
      })
      .strict()
      .optional(),
    evaluation: z
      .object({
        risk: z.enum(["routine", "elevated", "urgent", "minor-boundary"]),
        expected: z.array(text).min(1).max(10),
        avoid: z.array(text).min(1).max(12),
        claim: text,
      })
      .strict()
      .optional(),
    turns: z
      .array(z.object({ role: z.enum(["user", "assistant"]), text }).strict())
      .length(4),
  })
  .strict()
  .superRefine((s, c) => {
    if (s.turns.some((t, i) => t.role !== (i % 2 ? "assistant" : "user")))
      c.addIssue({
        code: "custom",
        message: "Four alternating user/guide turns required",
      });
    if (s.suite !== "general" && (!s.profile || !s.evaluation))
      c.addIssue({
        code: "custom",
        message: "Evaluation scenarios require context and boundaries",
      });
    if (s.suite === "support-safety-v1" && !s.sourceTopicNumber)
      c.addIssue({ code: "custom", message: "Source topic number required" });
  });
export type SimulationScenario = z.infer<typeof scenarioSchema>;
export const scenarioCatalogSchema = z
  .array(scenarioSchema)
  .min(1)
  .max(50)
  .superRefine((items, c) => {
    if (new Set(items.map((s) => s.id)).size !== items.length)
      c.addIssue({ code: "custom", message: "Scenario IDs must be unique" });
    const topics = items
      .filter((s) => s.suite === "support-safety-v1")
      .map((s) => s.sourceTopicNumber);
    if (new Set(topics).size !== topics.length)
      c.addIssue({ code: "custom", message: "Source topics must be unique" });
  });
