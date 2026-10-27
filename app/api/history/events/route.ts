import { z } from "zod";
import { browserHistoryEventSchema, promptVersion } from "@/src/domain/history";
import { localHistory } from "@/src/infrastructure/sqlite-history";
import {
  historyGuard,
  requiredOwner,
  historyJson,
  historyFailure,
} from "@/src/infrastructure/history-http";
import { jsonBody } from "@/src/lib/server";
export const runtime = "nodejs";
export async function POST(req: Request) {
  try {
    historyGuard(req, true);
    const input = z
      .object({
        sessionId: z.string().uuid(),
        events: z.array(browserHistoryEventSchema).min(1).max(10),
      })
      .strict()
      .parse(await jsonBody(req, 70000));
    const events = input.events.map((e) => ({
      ...e,
      provenance: {
        source: "browser-final" as const,
        model:
          e.channel === "voice"
            ? process.env.OPENAI_REALTIME_MODEL || "gpt-realtime"
            : "application",
        promptVersion,
        playback:
          e.kind === "interrupted"
            ? ("interrupted" as const)
            : e.role === "assistant"
              ? ("unknown" as const)
              : ("not-applicable" as const),
      },
    }));
    return historyJson(
      await localHistory().append(requiredOwner(req), input.sessionId, events),
    );
  } catch (e) {
    return historyFailure(e);
  }
}
