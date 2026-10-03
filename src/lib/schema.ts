import { z } from "zod";
const short = z.string().min(1).max(180);
export const blockSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9_-]{1,40}$/),
    type: z.enum(["sort", "reflect", "choose"]),
    title: short,
    prompt: z.string().max(500),
    options: z.array(short).max(6),
    items: z.array(short).max(8),
  })
  .strict();
export const exerciseSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: z.string().regex(/^[a-z0-9_-]{1,60}$/),
    step: z.enum(["1", "3", "10", "11"]),
    principle: short,
    title: short,
    purpose: z.string().max(500),
    blocks: z.array(blockSchema).min(1).max(4),
    actionPrompt: short,
    actionSuggestion: z.string().max(300),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (new Set(v.blocks.map((b) => b.id)).size !== v.blocks.length)
      ctx.addIssue({ code: "custom", message: "Duplicate blocks" });
    for (const b of v.blocks)
      if ((b.type === "sort" || b.type === "choose") && b.options.length < 2)
        ctx.addIssue({ code: "custom", message: "Options required" });
  });
export const replySchema = z
  .object({
    message: z.string().min(1).max(3000),
    kind: z.enum(["practice", "conversation", "support"]),
    exercise: exerciseSchema.nullable(),
  })
  .strict()
  .superRefine((v, c) => {
    if (v.kind !== "practice" && v.exercise)
      c.addIssue({
        code: "custom",
        message: "Non-practice cannot contain exercise",
      });
    if (v.kind === "practice" && !v.exercise)
      c.addIssue({ code: "custom", message: "Practice required" });
  });
export type Exercise = z.infer<typeof exerciseSchema>;
export type Reply = z.infer<typeof replySchema>;
export const messageSchema = z
  .object({
    role: z.enum(["user", "assistant"]),
    content: z.string().min(1).max(6000),
  })
  .strict();
export type Message = z.infer<typeof messageSchema>;
export const requestSchema = z
  .object({
    messages: z.array(messageSchema).min(1).max(30),
    language: z.enum(["open", "spiritual", "plain"]),
    intent: z.enum(["practice", "conversation", "reflection"]),
    step: z.enum(["1", "3", "10", "11"]).optional(),
  })
  .strict();
export const outputJsonSchema = z.toJSONSchema(replySchema, {
  unrepresentable: "any",
});
