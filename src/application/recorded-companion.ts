import {
  runCompanion,
  type CompanionInput,
  type ModelProvider,
} from "./companion";
import type { MemoryRepository } from "../domain/memory";
import {
  HistoryError,
  promptVersion,
  type HistoryRepository,
  type HistoryInput,
} from "../domain/history";
export async function runRecordedCompanion(
  input: CompanionInput,
  signal: AbortSignal,
  model: ModelProvider,
  memory: MemoryRepository,
  recording?: {
    owner: string;
    sessionId: string;
    turnKey: string;
    repository: HistoryRepository;
  },
) {
  if (!recording) return runCompanion(input, signal, model, memory);
  if (input.intent === "reflection")
    throw new HistoryError(
      400,
      "Private reflection sharing is excluded from conversation history.",
    );
  const { repository, owner, sessionId, turnKey } = recording;
  const content = input.messages
    .filter((m) => m.role === "user")
    .at(-1)?.content;
  if (!content)
    throw new HistoryError(400, "A submitted user message is required.");
  const provenance = {
    source: "server" as const,
    model: model.name,
    promptVersion,
    playback: "not-applicable" as const,
  };
  const start = await repository.append(owner, sessionId, [
    {
      eventKey: `${turnKey}:user`,
      turnKey,
      kind: "message",
      channel: "text",
      role: "user",
      text: content,
      provenance,
    },
  ]);
  if (start.duplicates)
    throw new HistoryError(
      409,
      "This turn was already submitted. Review history before sending it again.",
    );
  try {
    const result = await runCompanion(input, signal, model, memory);
    let saved = true;
    try {
      await repository.append(owner, sessionId, [
        {
          eventKey: `${turnKey}:assistant`,
          turnKey,
          kind: "message",
          channel: "text",
          role: "assistant",
          text: result.reply.message,
          ...(result.reply.exercise ? { exercise: result.reply.exercise } : {}),
          provenance: {
            ...provenance,
            model:
              "model" in result.provenance
                ? String(result.provenance.model)
                : "application-safety",
            memoryUsed: result.provenance.memoryUsed,
          },
          ...("responseId" in result.provenance && result.provenance.responseId
            ? { providerResponseId: String(result.provenance.responseId) }
            : {}),
        },
      ]);
    } catch {
      saved = false;
    }
    return { ...result, history: { saved, sessionId } };
  } catch (e) {
    const event: HistoryInput = {
      eventKey: `${turnKey}:terminal`,
      turnKey,
      kind: signal.aborted ? "canceled" : "error",
      channel: "text",
      provenance,
    };
    try {
      await repository.append(owner, sessionId, [event]);
    } catch {
      /* Paused/deleted history must not be revived. */
    }
    throw e;
  }
}
