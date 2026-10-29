import { musicLabCommand as command } from "./music-lab-command";
import {
  currentMusicPrompt,
  currentTechnicalIssues,
} from "../domain/current-music";
import { randomUUID } from "node:crypto";
import { writeFile, mkdir, rename, rm, stat, statfs } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import { HttpError } from "../lib/server";
import {
  musicBriefs,
  musicSampleSchema,
  type MusicRequest,
  type MusicJob,
} from "../domain/music-lab";
import {
  modelAvailability,
  getModelRuntime,
  musicCatalog,
  musicLabDirectory,
  ensureMusicStorage,
  musicStorageBytes,
} from "./music-lab-runtime";
type Active = { job: MusicJob; abort: AbortController };
const key = Symbol.for("soulfire.music-lab.jobs");
const root = globalThis as unknown as Record<
  symbol,
  { jobs: Map<string, Active>; active: string | null; cancelled: Set<string> }
>;
const state =
  root[key] ||
  (root[key] = { jobs: new Map(), active: null, cancelled: new Set() });
export function getMusicJob(id: string) {
  return state.jobs.get(id)?.job;
}
export function cancelMusicJob(id: string) {
  const active = state.jobs.get(id);
  if (!active) {
    state.cancelled.add(id);
    while (state.cancelled.size > 200)
      state.cancelled.delete(state.cancelled.values().next().value!);
    return true;
  }
  if (active.job.phase === "running") {
    active.job.phase = "cancelled";
    active.job.message = "Cancelled. No generated sample was added.";
    active.abort.abort();
  }
  return true;
}
export async function startMusicJob(
  request: MusicRequest,
  id: string = randomUUID(),
) {
  if (state.cancelled.has(id))
    throw new HttpError(409, "This generation was already cancelled.");
  const previous = state.jobs.get(id);
  if (previous) return previous.job;
  if (state.active)
    throw new HttpError(
      409,
      "One local generation is already running. Stop it or wait before starting another.",
    );
  state.active = id;
  try {
    const availability = (await modelAvailability()).find(
      (m) => m.model === request.model,
    )!;
    if (!availability.ready) throw new HttpError(409, availability.message);
    await ensureMusicStorage();
    const disk = await statfs(musicLabDirectory());
    if (disk.bavail * disk.bsize < 50 * 1024 ** 3)
      throw new HttpError(
        507,
        "Less than 50 GiB is free. No model was started.",
      );
    if ((await musicStorageBytes()) > 2 * 1024 ** 3 - 200 * 1024 ** 2)
      throw new HttpError(
        507,
        "The 2 GiB local result budget is nearly full. Archive samples deliberately before generating more.",
      );
    const catalog = await musicCatalog();
    if (catalog.length >= 100)
      throw new HttpError(
        409,
        "The local sample limit is reached. Archive or remove samples deliberately before generating more.",
      );
    if (state.cancelled.has(id))
      throw new HttpError(409, "This generation was already cancelled.");
    const job: MusicJob = {
      id,
      request,
      phase: "running",
      message:
        "Generating locally, then measuring and preparing matched listening renders…",
    };
    const active = { job, abort: new AbortController() };
    state.jobs.set(id, active);
    state.active = id;
    while (state.jobs.size > 200) {
      const oldest = state.jobs.keys().next().value;
      if (oldest && oldest !== state.active) state.jobs.delete(oldest);
      else break;
    }
    void run(active).finally(() => {
      if (state.active === id) state.active = null;
    });
    return job;
  } catch (error) {
    if (state.active === id) state.active = null;
    throw error;
  }
}
async function run(active: Active) {
  const { job, abort } = active;
  const folder = join(musicLabDirectory(), "samples", job.id);
  try {
    await mkdir(folder, { recursive: true, mode: 0o700 });
    const runtime = (await getModelRuntime(job.request.model))!;
    const result = await command(
      runtime.python,
      [join(process.cwd(), "scripts/run-music-model.py")],
      {
        runtime,
        request: job.request,
        prompt: job.request.current
          ? currentMusicPrompt(job.request.current)
          : musicBriefs[job.request.style],
        output: join(folder, "source.wav"),
      },
      abort.signal,
      900000,
    );
    abort.signal.throwIfAborted();
    const timing = JSON.parse(result.text);
    const source = await stat(join(folder, "source.wav"));
    if (source.size > 100000000)
      throw Error("Audio output exceeded its bound.");
    const analysisPython =
      process.env.SOULFIRE_MUSIC_LAB_ANALYSIS_PYTHON ||
      join(homedir(), "Coding", "AI-native", "tts", "venv", "bin", "python");
    job.message =
      "Music generated. Checking loudness, peaks and preparing listening audio; this can take a few minutes…";
    const measured = await command(
      analysisPython,
      [join(process.cwd(), "scripts/measure-music.py")],
      {
        folder,
        currentOnly: !!job.request.current,
        app: process.cwd(),
        ffmpeg: process.env.SOULFIRE_FFMPEG || "/usr/local/bin/ffmpeg",
      },
      abort.signal,
      120000,
    );
    abort.signal.throwIfAborted();
    const sample = musicSampleSchema.parse({
      id: job.id,
      ...(job.request.current ? { currentOnly: true } : {}),
      request: job.request,
      modelVersion:
        job.request.model === "ace"
          ? "acestep-v15-turbo / MLX / 8 steps / CFG 1 / no LM rewrite"
          : "SA3 Small-Music / MLX / 8 steps / CFG 1",
      codeRevision: runtime.codeRevision,
      weightsRevision: runtime.weightsRevision,
      createdAt: new Date().toISOString(),
      ...timing,
      peakRssBytes: result.rss ?? timing.peakRssBytes,
      metrics: JSON.parse(measured.text),
    });
    if (job.request.current) {
      await rm(join(folder, "model-output"), { recursive: true, force: true });
      const issues = currentTechnicalIssues(sample);
      if (issues.length)
        throw Error(
          "The candidate did not pass Current audio checks: " +
            issues.join(" "),
        );
    }
    await writeFile(
      join(folder, "sample.tmp.json"),
      JSON.stringify(sample, null, 2),
      { mode: 0o600 },
    );
    abort.signal.throwIfAborted();
    await rename(join(folder, "sample.tmp.json"), join(folder, "sample.json"));
    job.phase = "done";
    job.sampleId = sample.id;
    job.message =
      "Generated and measured locally. Ready for deliberate listening.";
  } catch (error) {
    job.phase = abort.signal.aborted ? "cancelled" : "error";
    job.message = abort.signal.aborted
      ? "Cancelled. No generated sample was added."
      : error instanceof Error
        ? error.message
        : "Local generation failed.";
    await rm(folder, { recursive: true, force: true }).catch(() => {});
  }
}
