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
    const recording = input.history
      ? {
          ...input.history,
          owner: requiredOwner(req),
          repository: localHistory(),
        }
      : undefined;
    if (
      req.headers
        .get("accept")
        ?.split(",")
        .some((value) => value.trim().split(";")[0] === "text/event-stream")
    ) {
      const controller = new AbortController();
      const signal = AbortSignal.any([
        req.signal,
        controller.signal,
        AbortSignal.timeout(45000),
      ]);
      const encoder = new TextEncoder();
      const stream = new ReadableStream<Uint8Array>({
        async start(output) {
          const send = (event: string, data: unknown) => {
            signal.throwIfAborted();
            output.enqueue(
              encoder.encode(
                `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
              ),
            );
          };
          try {
            const result = await runRecordedCompanion(
              input,
              signal,
              new OpenAIResponses(),
              localMemory(),
              recording,
              (delta) => send("message_delta", { delta }),
            );
            send("result", result);
          } catch (e) {
            // Never forward raw provider errors, user content or credentials.
            if (!controller.signal.aborted && !req.signal.aborted) {
              const failureResponse = companionFailure(e);
              const error = {
                ...(await failureResponse.json()),
                status: failureResponse.status,
              };
              output.enqueue(
                encoder.encode(
                  `event: error\ndata: ${JSON.stringify(error)}\n\n`,
                ),
              );
            }
          } finally {
            try {
              output.close();
            } catch {
              /* The browser canceled the stream. */
            }
          }
        },
        cancel() {
          controller.abort();
        },
      });
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-store",
          "X-Accel-Buffering": "no",
        },
      });
    }
    const result = await runRecordedCompanion(
      input,
      req.signal,
      new OpenAIResponses(),
      localMemory(),
      recording,
    );
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return companionFailure(e);
  }
}
function companionFailure(e: unknown) {
  return failure(
    e instanceof HistoryError
      ? new HttpError(e.status, e.message)
      : e instanceof ModelFailure
        ? new HttpError(e.kind === "refused" ? 422 : 502, e.message)
        : e,
  );
}
