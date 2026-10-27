import { runRecordedCompanion } from "@/src/application/recorded-companion";
import { localHistory } from "@/src/infrastructure/sqlite-history";
import { requiredOwner } from "@/src/infrastructure/history-http";
import { HistoryError } from "@/src/domain/history";
import { requestSchema } from "@/src/lib/schema";
import { guard, jsonBody, failure, HttpError } from "@/src/lib/server";
import { ModelFailure } from "@/src/application/companion";
import { OpenAIResponses } from "@/src/infrastructure/openai-responses";
import { localMemory } from "@/src/infrastructure/sqlite-memory";
export const runtime = "nodejs";
export async function POST(req: Request) {
  try {
    guard(req);
    const input = requestSchema.parse(await jsonBody(req));
    const result = await runRecordedCompanion(
      input,
      req.signal,
      new OpenAIResponses(),
      localMemory(),
      input.history
        ? {
            ...input.history,
            owner: requiredOwner(req),
            repository: localHistory(),
          }
        : undefined,
    );
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return failure(
      e instanceof HistoryError
        ? new HttpError(e.status, e.message)
        : e instanceof ModelFailure
          ? new HttpError(e.kind === "refused" ? 422 : 502, e.message)
          : e,
    );
  }
}
