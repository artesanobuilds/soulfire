import { z } from "zod";
import { currentMusicPrompt } from "@/src/domain/current-music";
import { historyGuard } from "@/src/infrastructure/history-http";
import { failure, jsonBody, HttpError } from "@/src/lib/server";
import { currentBatchSchema } from "@/src/domain/current-session";
import {
  getCurrentBatch,
  restoredCurrentBatch,
  startCurrentBatch,
  cancelCurrentBatch,
} from "@/src/infrastructure/current-batches";
import { currentTechnicalIssues } from "@/src/domain/current-music";
import {
  musicCatalog,
  modelAvailability,
  musicCataloguePolicy,
} from "@/src/infrastructure/music-lab-runtime";
import {
  startMusicJob,
  cancelMusicJob,
  getMusicJob,
} from "@/src/infrastructure/music-lab-jobs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  try {
    historyGuard(req);
    const id = new URL(req.url).searchParams.get("job");
    if (id) {
      z.string().uuid().parse(id);
      const job = (await restoredCurrentBatch(id)) || getMusicJob(id);
      if (!job || !job.request.current)
        throw new HttpError(
          404,
          "This Current job is unavailable. It may have ended when the server restarted.",
        );
      return Response.json(
        { job },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    const [all, models, catalogue] = await Promise.all([
      musicCatalog(true),
      modelAvailability(),
      musicCataloguePolicy(),
    ]);
    const retired = new Set(catalogue?.retiredSampleIds || []);
    const samples = all.filter((s) => !retired.has(s.id));
    return Response.json(
      {
        samples: samples.filter((s) => !currentTechnicalIssues(s).length),
        archivedSamples: all.filter(
          (s) => retired.has(s.id) && !currentTechnicalIssues(s).length,
        ),
        catalogue: catalogue
          ? { version: catalogue.version, description: catalogue.description }
          : null,
        excludedCount: samples.filter(
          (s) => s.request.model === "ace" && currentTechnicalIssues(s).length,
        ).length,
        availability: models.find((m) => m.model === "ace"),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: Request) {
  try {
    historyGuard(req, true);
    const input = currentBatchSchema.parse(await jsonBody(req, 2000));
    if (
      input.request.model !== "ace" ||
      !input.request.current ||
      input.request.style !== input.request.current.taste
    )
      throw new HttpError(400, "Choose an available Current music preference.");
    currentMusicPrompt(input.request.current);
    return Response.json(
      {
        job:
          input.candidateCount > 1
            ? await startCurrentBatch(input)
            : await startMusicJob(input.request, input.id),
      },
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
    const job = (await restoredCurrentBatch(id)) || getMusicJob(id);
    if (job && !job.request.current)
      throw new HttpError(404, "Not a Current job.");
    cancelCurrentBatch(id);
    if (!getCurrentBatch(id)) cancelMusicJob(id);
    return Response.json({ cancelled: true });
  } catch (e) {
    return failure(e);
  }
}
