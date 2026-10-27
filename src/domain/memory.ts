import { z } from "zod";
export const memoryContentSchema = z
  .object({
    goal: z.string().trim().max(280),
    challenge: z.string().trim().max(280),
    preferences: z.string().trim().max(280),
    useWithAI: z.boolean(),
  })
  .strict();
export type MemoryContent = z.infer<typeof memoryContentSchema>;
export const memoryRecordSchema = z
  .object({
    schemaVersion: z.literal(1),
    revision: z.number().int().positive(),
    source: z.literal("user_confirmed"),
    updatedAt: z.string().datetime(),
    content: memoryContentSchema,
  })
  .strict();
export type MemoryRecord = z.infer<typeof memoryRecordSchema>;
export type MemorySnapshot = { revision: number; memory: MemoryRecord | null };
export interface MemoryRepository {
  read(): Promise<MemorySnapshot>;
  replace(
    content: MemoryContent,
    expectedRevision: number,
  ): Promise<MemorySnapshot>;
  delete(expectedRevision: number): Promise<MemorySnapshot>;
}
export class MemoryConflict extends Error {
  constructor() {
    super(
      "Memory changed in another window. Reload it before saving or deleting.",
    );
  }
}
export const blankMemory: MemoryContent = {
  goal: "",
  challenge: "",
  preferences: "",
  useWithAI: false,
};
