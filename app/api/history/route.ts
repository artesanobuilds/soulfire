import { simulationJobs } from "@/src/application/simulation-jobs";
import { cancelSyntheticAudio } from "@/src/application/simulation-audio";
import { z } from "zod";
import { localHistory } from "@/src/infrastructure/sqlite-history";
import {
  historyGuard,
  historyOwner,
  requiredOwner,
  historyJson,
  historyFailure,
} from "@/src/infrastructure/history-http";
import { jsonBody } from "@/src/lib/server";
import {
  feedbackSchema,
  retentionDays,
  historyEventSchema,
} from "@/src/domain/history";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  try {
    historyGuard(req);
    const owner = historyOwner(req);
    const id = new URL(req.url).searchParams.get("id");
    if (id)
      return historyJson(
        await localHistory().read(
          requiredOwner(req),
          z.string().uuid().parse(id),
        ),
      );
    return historyJson(
      {
        sessions: owner ? await localHistory().list(owner) : [],
        retentionDays,
      },
      !owner,
    );
  } catch (e) {
    return historyFailure(e);
  }
}
export async function POST(req: Request) {
  try {
    historyGuard(req, true);
    const owner = requiredOwner(req);
    const input = z
      .object({
        consent: z.literal(true),
        synthetic: z
          .object({
            synthetic: z.literal(true),
            version: z.literal(1),
            scenario: z.string().min(1).max(100),
            events: z.array(historyEventSchema).max(200),
          })
          .strict()
          .optional(),
      })
      .strict()
      .parse(await jsonBody(req, 500000));
    const repo = localHistory();
    const session = await repo.create(
      owner,
      input.synthetic
        ? { synthetic: true, scenario: input.synthetic.scenario }
        : undefined,
    );
    if (input.synthetic) {
      try {
        for (let i = 0; i < input.synthetic.events.length; i += 10)
          await repo.append(
            owner,
            session.id,
            input.synthetic.events.slice(i, i + 10).map((e) => ({
              ...e,
              provenance: {
                ...e.provenance,
                source: "imported-synthetic" as const,
                claimedSource: e.provenance.source,
              },
            })),
          );
        await repo.pause(owner, session.id);
      } catch (e) {
        await repo.remove(owner, session.id);
        throw e;
      }
    }
    return historyJson({ session });
  } catch (e) {
    return historyFailure(e);
  }
}
export async function PATCH(req: Request) {
  try {
    historyGuard(req, true);
    const owner = requiredOwner(req);
    const input = z
      .discriminatedUnion("action", [
        z
          .object({ action: z.literal("pause"), id: z.string().uuid() })
          .strict(),
        z
          .object({
            action: z.literal("feedback"),
            id: z.string().uuid(),
            eventId: z.string().uuid(),
            revision: z.number().int().min(0),
            feedback: feedbackSchema,
          })
          .strict(),
      ])
      .parse(await jsonBody(req, 5000));
    const repo = localHistory();
    if (input.action === "pause") await repo.pause(owner, input.id);
    else
      await repo.feedback(
        owner,
        input.id,
        input.eventId,
        input.feedback,
        input.revision,
      );
    return historyJson({ ok: true });
  } catch (e) {
    return historyFailure(e);
  }
}
export async function DELETE(req: Request) {
  try {
    historyGuard(req, true);
    const input = z
      .object({ id: z.string().uuid(), confirm: z.literal(true) })
      .strict()
      .parse(await jsonBody(req, 1000));
    const owner = requiredOwner(req);
    simulationJobs.cancel(owner, input.id);
    cancelSyntheticAudio(owner, input.id);
    await localHistory().remove(owner, input.id);
    return historyJson({ ok: true });
  } catch (e) {
    return historyFailure(e);
  }
}
