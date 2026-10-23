import { z } from "zod";
import { exerciseSchema } from "./schema";
export const savedPracticeKey = "soulfire.saved-practice.v1";
export const savedPracticeSchema = z
  .object({
    version: z.literal(1),
    exercise: exerciseSchema,
    example: z.boolean(),
    fields: z.record(z.string().max(40), z.string().max(1500)),
    cards: z.record(
      z.string().max(40),
      z
        .array(
          z.object({
            id: z.string().max(80),
            text: z.string().max(180),
            group: z.number().int().min(0).max(5),
          }),
        )
        .max(12),
    ),
    action: z.string().max(600),
    reflection: z.string().max(1500),
    language: z.enum(["open", "spiritual", "plain"]),
    practiceStep: z.number().int().min(0).max(4),
    view: z.enum(["suggestion", "practice", "meditation", "review", "finish"]),
  })
  .strict();
export function readSavedPractice(raw: string | null) {
  if (!raw || raw.length > 60000) return null;
  try {
    const result = savedPracticeSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
