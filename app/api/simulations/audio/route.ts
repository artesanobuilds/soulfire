import { z } from "zod";
import { localHistory } from "@/src/infrastructure/sqlite-history";
import { LocalSyntheticSpeech } from "@/src/infrastructure/local-synthetic-speech";
import { ensureSimulationAudio } from "@/src/application/simulation-audio";
import {
  historyGuard,
  requiredOwner,
  historyJson,
  historyFailure,
} from "@/src/infrastructure/history-http";
import { jsonBody } from "@/src/lib/server";
import { HistoryError } from "@/src/domain/history";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const input = z
  .object({ id: z.string().uuid(), turn: z.number().int().min(0).max(3) })
  .strict();
export async function GET(req: Request) {
  try {
    historyGuard(req);
    const url = new URL(req.url);
    const value = input.parse({
      id: url.searchParams.get("id"),
      turn: Number(url.searchParams.get("turn")),
    });
    const audio = await localHistory().audio(
      requiredOwner(req),
      value.id,
      value.turn,
    );
    if (!audio)
      throw new HistoryError(
        404,
        "Synthetic audio is not ready. Generate playback from the saved turn first.",
      );
    return new Response(new Uint8Array(audio.bytes), {
      headers: {
        "Content-Type": audio.mime,
        "Content-Length": String(audio.bytes.length),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Soulfire-Provenance": "synthetic-local-kokoro",
      },
    });
  } catch (e) {
    return historyFailure(e);
  }
}
export async function POST(req: Request) {
  try {
    historyGuard(req, true);
    const value = input.parse(await jsonBody(req, 1000));
    const audio = await ensureSimulationAudio(
      requiredOwner(req),
      value.id,
      value.turn,
      req.signal,
      localHistory(),
      new LocalSyntheticSpeech(),
    );
    const run = await localHistory().run(requiredOwner(req), value.id);
    return historyJson({
      url: `/api/simulations/audio?id=${value.id}&turn=${value.turn}`,
      run,
      voice: audio.voice,
      provenance:
        run.config.engine === "fixture"
          ? "Fixture text + synthesized playback; not a speech-to-speech test"
          : "Model-generated conversation + synthesized playback; not a speech-to-speech test",
    });
  } catch (e) {
    return historyFailure(e);
  }
}
