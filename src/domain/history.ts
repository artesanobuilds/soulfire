import { z } from "zod";
import { exerciseSchema } from "../lib/schema";
export const historyVersion = "history-v1";
export const promptVersion = "soulfire-poc1-20261024";
export const retentionDays = 30;
const key = z.string().regex(/^[A-Za-z0-9_.:-]{1,160}$/);
export const historyEventSchema = z
  .object({
    eventKey: key,
    turnKey: key,
    kind: z.enum([
      "message",
      "started",
      "ended",
      "interrupted",
      "canceled",
      "error",
    ]),
    channel: z.enum(["text", "voice"]),
    role: z.enum(["user", "assistant"]).optional(),
    text: z.string().min(1).max(6000).optional(),
    clientOrder: z.number().int().min(0).max(100000).optional(),
    providerItemId: key.optional(),
    providerResponseId: key.optional(),
    exercise: exerciseSchema.optional(),
    provenance: z
      .object({
        source: z.enum([
          "server",
          "browser-final",
          "fixture",
          "live-synthetic",
          "imported-synthetic",
        ]),
        model: z.string().max(120),
        promptVersion: z.string().max(80),
        applicationVersion: z.string().max(80).optional(),
        scenarioVersion: z.number().int().positive().optional(),
        playback: z.enum(["not-applicable", "unknown", "interrupted"]),
        memoryUsed: z.boolean().optional(),
        claimedSource: z
          .enum([
            "fixture",
            "live-synthetic",
            "server",
            "browser-final",
            "imported-synthetic",
          ])
          .optional(),
      })
      .strict(),
  })
  .strict()
  .superRefine((v, c) => {
    if (v.kind === "message" && (!v.role || !v.text))
      c.addIssue({
        code: "custom",
        message: "A finalized message needs role and text",
      });
    if (v.kind !== "message" && (v.role || v.text || v.exercise))
      c.addIssue({
        code: "custom",
        message: "Lifecycle events cannot contain conversation content",
      });
    if (v.exercise && v.role !== "assistant")
      c.addIssue({
        code: "custom",
        message: "Only generated replies have an exercise",
      });
  });
export type HistoryInput = z.infer<typeof historyEventSchema>;
// Browser events are claims about final voice transcripts, never trusted identities.
export const browserHistoryEventSchema = z
  .object({
    eventKey: key,
    turnKey: key,
    kind: z.enum([
      "message",
      "started",
      "ended",
      "interrupted",
      "canceled",
      "error",
    ]),
    channel: z.enum(["text", "voice"]),
    role: z.enum(["user", "assistant"]).optional(),
    text: z.string().min(1).max(6000).optional(),
    clientOrder: z.number().int().min(0).max(100000),
    providerItemId: key.optional(),
    providerResponseId: key.optional(),
  })
  .strict()
  .superRefine((v, c) => {
    if (v.kind === "message" && (v.channel !== "voice" || !v.role || !v.text))
      c.addIssue({
        code: "custom",
        message: "Only final voice messages enter through this route",
      });
    if (v.kind !== "message" && (v.role || v.text))
      c.addIssue({
        code: "custom",
        message: "Lifecycle content is not accepted",
      });
  });
export type BrowserHistoryEvent = z.infer<typeof browserHistoryEventSchema>;
export const feedbackSchema = z
  .object({
    rating: z.enum(["spot-on", "not-quite", "unrated"]),
    note: z.string().max(1000),
  })
  .strict();
export type Feedback = z.infer<typeof feedbackSchema>;
export type HistoryEvent = HistoryInput & {
  id: string;
  turnId: string;
  sequence: number;
  receivedAt: string;
  feedback: Feedback | null;
  feedbackRevision: number;
};
export type HistorySession = {
  id: string;
  createdAt: string;
  updatedAt: string;
  state: "recording" | "paused";
  synthetic: boolean;
  scenario: string | null;
  schemaVersion: 1;
  consentVersion: 1;
  eventCount: number;
};
export type HistoryDetail = { session: HistorySession; events: HistoryEvent[] };
export interface HistoryRepository {
  create(
    owner: string,
    options?: { synthetic: boolean; scenario: string },
  ): Promise<HistorySession>;
  list(owner: string): Promise<HistorySession[]>;
  read(owner: string, id: string): Promise<HistoryDetail>;
  append(
    owner: string,
    id: string,
    events: HistoryInput[],
  ): Promise<{ inserted: number; duplicates: number }>;
  pause(owner: string, id: string): Promise<void>;
  remove(owner: string, id: string): Promise<void>;
  feedback(
    owner: string,
    id: string,
    eventId: string,
    value: Feedback,
    revision: number,
  ): Promise<void>;
}
export class HistoryError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function redactHistory(text: string) {
  return text
    .replace(/\bsk-[A-Za-z0-9_-]{16,}\b/g, "[redacted credential]")
    .replace(/\bBearer\s+[A-Za-z0-9._~-]{16,}/gi, "Bearer [redacted]")
    .replace(
      /\b(?:password|api[_ -]?key|secret)\s*[:=]\s*\S+/gi,
      "[redacted credential]",
    );
}
