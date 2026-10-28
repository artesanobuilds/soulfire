import { z } from "zod";
import { historyGuard } from "@/src/infrastructure/history-http";
import { jsonBody, failure, HttpError } from "@/src/lib/server";
import { musicRequestSchema } from "@/src/domain/music-lab";
import {
  modelAvailability,
  musicCatalog,
} from "@/src/infrastructure/music-lab-runtime";
import {
  startMusicJob,
  getMusicJob,
  cancelMusicJob,
} from "@/src/infrastructure/music-lab-jobs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  try {
    historyGuard(req);
    const id = new URL(req.url).searchParams.get("job");
    if (id) {
      z.string().uuid().parse(id);
      const job = getMusicJob(id);
      if (!job)
        throw new HttpError(
          404,
          "This job is not available. It may have ended when the server restarted.",
        );
      return Response.json(
        { job },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    const [models, samples] = await Promise.all([
      modelAvailability(),
      musicCatalog(),
    ]);
    return Response.json(
      { models, samples },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: Request) {
  try {
    historyGuard(req, true);
    const input = z
      .object({ id: z.string().uuid(), request: musicRequestSchema })
      .strict()
      .parse(await jsonBody(req, 1500));
    return Response.json(
      { job: await startMusicJob(input.request, input.id) },
      { status: 202, headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(req: Request) {
  try {
    historyGuard(req, true);
    const id = z
      .string()
      .uuid()
      .parse(new URL(req.url).searchParams.get("job"));
    if (!cancelMusicJob(id))
      throw new HttpError(404, "This job is not available.");
    return Response.json(
      { cancelled: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
