import { simulationJobs } from "@/src/application/simulation-jobs";
import { cancelSyntheticAudio } from "@/src/application/simulation-audio";
import {
  LocalSyntheticSpeech,
  localSpeechAvailable,
} from "@/src/infrastructure/local-synthetic-speech";
import { z } from "zod";
import {
  simulationConfigSchema,
  simulationScenarios,
} from "@/src/domain/simulation";
import { localHistory } from "@/src/infrastructure/sqlite-history";
import { advanceSimulation } from "@/src/application/simulations";
import {
  liveSimulationAvailable,
  simulationModel,
} from "@/src/infrastructure/simulation-model";
import {
  historyGuard,
  historyOwner,
  requiredOwner,
  historyJson,
  historyFailure,
} from "@/src/infrastructure/history-http";
import { jsonBody } from "@/src/lib/server";
import { HistoryError } from "@/src/domain/history";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  try {
    historyGuard(req);
    const owner = historyOwner(req);
    const id = new URL(req.url).searchParams.get("id");
    if (id) {
      const valid = z.string().uuid().parse(id),
        authorized = requiredOwner(req),
        repo = localHistory();
      const run = await repo.run(authorized, valid),
        detail = await repo.read(authorized, valid);
      return historyJson({
        run,
        messages: detail.events
          .filter((e) => e.kind === "message")
          .map((e) => ({ role: e.role, content: e.text })),
        serverActive:
          simulationJobs.active(authorized).find((j) => j.id === valid) || null,
      });
    }
    return historyJson(
      {
        localSpeechAvailable: localSpeechAvailable(),
        serverJobs: owner ? simulationJobs.active(owner) : [],
        runs: owner ? await localHistory().runs(owner) : [],
        liveAvailable: liveSimulationAvailable(),
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
    const owner = requiredOwner(req),
      repo = localHistory();
    const input = z
      .discriminatedUnion("action", [
        z
          .object({
            action: z.literal("create"),
            config: simulationConfigSchema,
            consent: z.literal(true),
          })
          .strict(),
        z
          .object({
            action: z.literal("step"),
            id: z.string().uuid(),
            cursor: z.number().int().min(0).max(3),
          })
          .strict(),
        z
          .object({
            action: z.enum(["pause", "resume", "stop", "start"]),
            id: z.string().uuid(),
          })
          .strict(),
      ])
      .parse(await jsonBody(req, 5000));
    if (input.action === "create") {
      if (input.config.engine === "live-text" && !liveSimulationAvailable())
        throw new HistoryError(
          503,
          "Live simulations need verified pricing configuration; no paid request was made.",
        );
      if (
        input.config.mode === "voice" &&
        (input.config.engine === "live-text" ||
          simulationScenarios.find((s) => s.id === input.config.scenario)
            ?.fixtureAudio === "local-tts") &&
        !localSpeechAvailable()
      )
        throw new HistoryError(
          503,
          "Local Kokoro is unavailable; no paid request was made.",
        );
      return historyJson({ run: await repo.createRun(owner, input.config) });
    }
    if (input.action === "start") {
      await simulationJobs.start(
        owner,
        input.id,
        repo,
        (claim) => simulationModel(repo, owner, input.id, claim),
        new LocalSyntheticSpeech(),
      );
      return historyJson({
        run: await repo.run(owner, input.id),
        serverActive: true,
      });
    }
    if (input.action === "step")
      return historyJson(
        await advanceSimulation(
          owner,
          input.id,
          input.cursor,
          req.signal,
          repo,
          (claim) => simulationModel(repo, owner, input.id, claim),
        ),
      );
    simulationJobs.cancel(owner, input.id);
    cancelSyntheticAudio(owner, input.id);
    return historyJson({
      run: await repo.control(owner, input.id, input.action),
    });
  } catch (e) {
    return historyFailure(e);
  }
}
