import { randomUUID } from "node:crypto";
import { mkdir, writeFile, rename, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { setTimeout as pause } from "node:timers/promises";
import { HttpError } from "../lib/server";
import {
  type CurrentBatchInput,
  technicalFit,
  currentBatchManifestSchema,
} from "../domain/current-session";
import { type MusicJob, type MusicRequest } from "../domain/music-lab";
import { musicCatalog, musicLabDirectory } from "./music-lab-runtime";
import { startMusicJob, getMusicJob, cancelMusicJob } from "./music-lab-jobs";
const key = Symbol.for("soulfire.current.batches.v1");
const root = globalThis as unknown as Record<
  symbol,
  {
    jobs: Map<
      string,
      { job: MusicJob; child: string | null; cancelled: boolean }
    >;
    active: string | null;
    tombstones: Set<string>;
  }
>;
const state =
  root[key] ||
  (root[key] = { jobs: new Map(), active: null, tombstones: new Set() });
export function currentBatchBusy() {
  return state.active !== null;
}
export function getCurrentBatch(id: string) {
  return state.jobs.get(id)?.job;
}
export function cancelCurrentBatch(id: string) {
  const entry = state.jobs.get(id);
  if (!entry) {
    state.tombstones.add(id);
    while (state.tombstones.size > 200)
      state.tombstones.delete(state.tombstones.values().next().value!);
    return;
  }
  if (entry.job.phase !== "running") return;
  entry.cancelled = true;
  if (entry.child) cancelMusicJob(entry.child);
  entry.job.phase = "cancelled";
  entry.job.message =
    "Preparation cancelled. Any completed, technically checked pieces remain on your local shelf; nothing starts playing.";
}
async function persist(job: MusicJob) {
  const directory = join(musicLabDirectory(), "current-sessions");
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const entries = await readdir(directory);
  if (entries.length >= 200 && !entries.includes(job.id + ".json"))
    throw Error("The local job-manifest limit is reached.");
  const final = join(directory, job.id + ".json"),
    tmp = final + ".tmp";
  await writeFile(
    tmp,
    JSON.stringify(
      { version: 1, policyVersion: "current-candidates-20261029", job },
      null,
      2,
    ),
    { mode: 0o600 },
  );
  await rename(tmp, final);
}
export async function restoredCurrentBatch(id: string) {
  const live = getCurrentBatch(id);
  if (live) return live;
  try {
    const b = await readFile(
      join(musicLabDirectory(), "current-sessions", id + ".json"),
    );
    if (b.length > 20000) return;
    const d = currentBatchManifestSchema.parse(JSON.parse(b.toString()));
    if (d.job.id !== id) return;
    return d.job;
  } catch {
    return;
  }
}
export async function startCurrentBatch(input: CurrentBatchInput) {
  if (state.tombstones.has(input.id))
    throw new HttpError(409, "This preparation was already cancelled.");
  const old = await restoredCurrentBatch(input.id);
  if (old) return old;
  if (state.tombstones.has(input.id))
    throw new HttpError(409, "This preparation was already cancelled.");
  const concurrent = getCurrentBatch(input.id);
  if (concurrent) return concurrent;
  if (state.active)
    throw new HttpError(
      409,
      "A Current preparation is already running. Cancel it or wait before starting another.",
    );
  const job: MusicJob = {
    id: input.id,
    request: input.request,
    phase: "running",
    message: `Preparing ${input.candidateCount} ${input.mode === "session" ? "movements" : "alternatives"} locally…`,
    candidateIds: [],
    requestedCandidates: input.candidateCount,
    completedCandidates: 0,
    candidateErrors: [],
    mode: input.mode,
  };
  const entry = { job, child: null as string | null, cancelled: false };
  state.jobs.set(job.id, entry);
  state.active = job.id;
  while (state.jobs.size > 100) {
    const oldest = state.jobs.keys().next().value;
    if (oldest && oldest !== state.active) state.jobs.delete(oldest);
    else break;
  }
  void (async () => {
    const deadline = Date.now() + 8 * 60 * 1000;
    try {
      for (let i = 0; i < input.candidateCount; i++) {
        if (entry.cancelled) break;
        const child = randomUUID();
        entry.child = child;
        const request: MusicRequest = {
          ...input.request,
          seed: (input.request.seed + i * 104729) % 2147483647,
          current: {
            ...input.request.current!,
            ...(input.mode === "session"
              ? {
                  movement:
                    i === 0
                      ? ("opening" as const)
                      : i === input.candidateCount - 1
                        ? ("closing" as const)
                        : ("developing" as const),
                }
              : {}),
          },
        };
        job.message = `Preparing ${i + 1} of ${input.candidateCount}: generating and measuring locally. Your current audio can keep playing.`;
        try {
          await startMusicJob(request, child);
          while (getMusicJob(child)?.phase === "running") {
            if (entry.cancelled || Date.now() > deadline) {
              cancelMusicJob(child);
              if (!entry.cancelled)
                throw Error("Preparation exceeded its eight-minute limit.");
              break;
            }
            const status = getMusicJob(child);
            if (status)
              job.message = `Piece ${i + 1} of ${input.candidateCount}: ${status.message}`;
            await pause(300);
          }
          if (entry.cancelled) break;
          const terminal = getMusicJob(child);
          if (terminal?.phase !== "done")
            throw Error(
              terminal?.message || "The candidate ended without a result.",
            );
          job.candidateIds!.push(terminal.sampleId!);
          job.completedCandidates = job.candidateIds!.length;
        } catch (e) {
          if (entry.cancelled) break;
          job.candidateErrors!.push(
            e instanceof Error ? e.message : "Candidate preparation failed.",
          );
          if (Date.now() > deadline) break;
        } finally {
          entry.child = null;
        }
      }
      if (entry.cancelled) return;
      const catalog = await musicCatalog();
      const seen = new Set<string>();
      job.candidateIds = job.candidateIds!.filter((id) => {
        const sample = catalog.find((s) => s.id === id);
        if (!sample) return false;
        if (seen.has(sample.metrics.pcmSha256)) {
          job.candidateErrors!.push("A duplicate PCM result was omitted.");
          return false;
        }
        seen.add(sample.metrics.pcmSha256);
        return true;
      });
      job.completedCandidates = job.candidateIds.length;
      if (job.mode === "compare")
        job.candidateIds!.sort(
          (a, b) =>
            technicalFit(catalog.find((s) => s.id === b)!) -
            technicalFit(catalog.find((s) => s.id === a)!),
        );
      job.phase = job.candidateIds!.length ? "done" : "error";
      job.sampleId = job.candidateIds![0];
      job.message = job.candidateIds!.length
        ? `${job.candidateIds!.length} of ${input.candidateCount} pieces passed technical checks. Compare or assemble them deliberately; musical quality still needs your preview.`
        : "No candidate passed. Your existing music is still available; adjust the request and try again.";
    } catch (e) {
      job.phase = "error";
      job.message = e instanceof Error ? e.message : "Preparation failed.";
    } finally {
      entry.child = null;
      if (state.active === job.id) state.active = null;
      await persist(job).catch(() => {
        job.message +=
          " The session manifest could not be saved; individual measured pieces remain local.";
      });
    }
  })();
  return job;
}
