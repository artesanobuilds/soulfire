import { z } from "zod";
import type { Exercise } from "../lib/schema";
export const sceneSchema = z
  .object({
    version: z.literal(1),
    kind: z.literal("influence-map"),
    id: z.string().min(1).max(110),
    zones: z.array(z.string().min(1).max(180)).min(2).max(4),
    items: z.array(z.string().min(1).max(180)).max(8),
  })
  .strict();
export type SceneSpec = z.infer<typeof sceneSchema>;
export type Thought = { id: string; text: string; group: number };
// Adapter for the existing validated exercise contract. Unknown scene versions or
// unsupported blocks use the existing simple controls, never executable markup.
export function sceneFor(
  exercise: Exercise,
  blockId: string,
): SceneSpec | null {
  const block = exercise.blocks.find((b) => b.id === blockId);
  if (!block || block.type !== "sort") return null;
  const parsed = sceneSchema.safeParse({
    version: 1,
    kind: "influence-map",
    id: `${exercise.id}:${block.id}`,
    zones: block.options,
    items: block.items,
  });
  return parsed.success ? parsed.data : null;
}
