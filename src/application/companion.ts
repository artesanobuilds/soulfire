import {
  replySchema,
  type Reply,
  type Message,
  type requestSchema,
} from "../lib/schema";
import type { z } from "zod";
import type { MemoryRepository } from "../domain/memory";
import { allowsMemory } from "../domain/session";
import { safetyNotice } from "../lib/safety";
export type CompanionInput = z.infer<typeof requestSchema>;
export type ModelRequest = {
  messages: Message[];
  language: CompanionInput["language"];
  intent: CompanionInput["intent"];
  step?: CompanionInput["step"];
  memoryContext?: string;
};
export interface ModelProvider {
  readonly name: string;
  generate(
    input: ModelRequest,
    signal: AbortSignal,
  ): Promise<{ reply: unknown; model: string; responseId?: string }>;
}
export class ModelFailure extends Error {
  constructor(
    public readonly kind: "refused" | "incomplete" | "invalid",
    message: string,
  ) {
    super(message);
  }
}
export type RunEvent = {
  operation: "companion";
  outcome:
    | "success"
    | "safety"
    | "canceled"
    | "failure"
    | "refused"
    | "incomplete"
    | "invalid";
  durationMs: number;
  usedMemory: boolean;
};
export async function runCompanion(
  input: CompanionInput,
  signal: AbortSignal,
  model: ModelProvider,
  repository: MemoryRepository,
  observe: (event: RunEvent) => void = () => {},
) {
  const started = Date.now();
  let usedMemory = false;
  const report = (outcome: RunEvent["outcome"]) => {
    try {
      observe({
        operation: "companion",
        outcome,
        durationMs: Date.now() - started,
        usedMemory,
      });
    } catch {
      /* Observability must not break the user operation. */
    }
  };
  try {
    signal.throwIfAborted();
    const notice = safetyNotice(
      input.messages.filter((m) => m.role === "user").at(-1)?.content || "",
    );
    if (notice) {
      report("safety");
      return {
        reply: { message: notice, kind: "support", exercise: null } as Reply,
        provenance: { source: "Application safety notice", memoryUsed: false },
      };
    }
    let memoryContext: string | undefined;
    if (input.useMemory && input.intent !== "reflection") {
      const snapshot = await repository.read();
      if (
        snapshot.memory &&
        allowsMemory(
          { useMemoryForThisRequest: true, intent: input.intent },
          snapshot.memory.content.useWithAI,
        )
      ) {
        const { goal, challenge, preferences } = snapshot.memory.content;
        memoryContext = JSON.stringify({ goal, challenge, preferences });
        usedMemory = true;
      }
    }
    signal.throwIfAborted();
    const result = await model.generate(
      {
        messages:
          input.intent === "reflection"
            ? input.messages.filter((m) => m.role === "user").slice(-1)
            : input.messages,
        language: input.language,
        intent: input.intent,
        step: input.step,
        memoryContext,
      },
      signal,
    );
    signal.throwIfAborted();
    const parsed = replySchema.safeParse(result.reply);
    if (!parsed.success)
      throw new ModelFailure(
        "invalid",
        "The response did not match a safe practice. Your work is unchanged; try again or choose a local example.",
      );
    const reply = parsed.data;
    if (input.intent !== "practice" && reply.exercise)
      throw new ModelFailure(
        "invalid",
        "An exercise requires practice mode. Your current practice has not changed.",
      );
    if (
      reply.exercise?.blocks.some(
        (b) =>
          [
            "action",
            "reflection",
            "conversation",
            "__proto__",
            "constructor",
            "prototype",
          ].includes(b.id) ||
          new Set(b.options).size !== b.options.length ||
          (b.type === "reflect" &&
            (b.options.length > 0 || b.items.length > 0)) ||
          (b.type === "choose" && b.items.length > 0),
      )
    )
      throw new ModelFailure(
        "invalid",
        "The practice had conflicting controls. Your work is unchanged; try again or choose a local example.",
      );
    report("success");
    return {
      reply,
      provenance: {
        schemaVersion: 1,
        source: model.name,
        model: result.model,
        responseId: result.responseId,
        memoryUsed: usedMemory,
      },
    };
  } catch (error) {
    report(
      signal.aborted
        ? "canceled"
        : error instanceof ModelFailure
          ? error.kind
          : "failure",
    );
    throw error;
  }
}
