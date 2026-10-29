import { it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { musicFixture } from "./fixtures/music-lab";
import { defaultCurrentMusic } from "../src/domain/current-music";
const f = vi.hoisted(() => ({
  start: vi.fn(),
  get: vi.fn(),
  cancel: vi.fn(),
  catalog: vi.fn(),
  dir: "",
}));
vi.mock("../src/infrastructure/music-lab-jobs", () => ({
  startMusicJob: f.start,
  getMusicJob: f.get,
  cancelMusicJob: f.cancel,
}));
vi.mock("../src/infrastructure/music-lab-runtime", () => ({
  musicLabDirectory: () => f.dir,
  musicCatalog: f.catalog,
}));
import {
  startCurrentBatch,
  getCurrentBatch,
  cancelCurrentBatch,
  currentBatchBusy,
  restoredCurrentBatch,
} from "../src/infrastructure/current-batches";
import type {
  MusicRequest,
  MusicSample,
  MusicJob,
} from "../src/domain/music-lab";
let samples: MusicSample[] = [],
  jobs = new Map<string, MusicJob>(),
  count = 0;
const request = {
  model: "ace" as const,
  style: "piano" as const,
  seed: 12,
  seconds: 60,
  current: defaultCurrentMusic,
};
const id = (n: number) =>
  `aaaaaaaa-0000-4000-8000-${n.toString().padStart(12, "0")}`;
beforeEach(async () => {
  f.dir = await mkdtemp(join(tmpdir(), "current-batch-test-"));
  samples = [];
  jobs = new Map();
  count = 0;
  f.start
    .mockReset()
    .mockImplementation(async (r: MusicRequest, id: string) => {
      const job: MusicJob = {
        id,
        request: r,
        phase: "done",
        sampleId: id,
        message: "TEST",
      };
      jobs.set(id, job);
      const base = musicFixture();
      samples.push({
        ...base,
        id,
        request: r,
        metrics: {
          ...base.metrics,
          duration: r.seconds,
          pcmSha256: (++count).toString(16).repeat(64),
        },
      });
      return job;
    });
  f.get.mockReset().mockImplementation((id: string) => jobs.get(id));
  f.cancel.mockReset().mockImplementation((id: string) => {
    const job = jobs.get(id);
    if (job) job.phase = "cancelled";
  });
  f.catalog.mockReset().mockImplementation(async () => samples);
});
afterEach(async () => {
  for (const key of [1, 2, 3, 4, 5, 6])
    if (getCurrentBatch(id(key))) cancelCurrentBatch(id(key));
  await vi.waitFor(() => expect(currentBatchBusy()).toBe(false));
  await rm(f.dir, { recursive: true, force: true });
});
it("prepares two bounded alternatives without inventing scores or audio", async () => {
  const job = await startCurrentBatch({
    id: id(1),
    request,
    candidateCount: 2,
    mode: "compare",
  });
  await vi.waitFor(() => expect(getCurrentBatch(job.id)?.phase).toBe("done"));
  expect(job.candidateIds).toHaveLength(2);
  expect(new Set(f.start.mock.calls.map((c) => c[0].seed)).size).toBe(2);
  expect(job.completedCandidates).toBe(2);
  expect(f.start.mock.calls.every((c) => c[0].seconds === 60)).toBe(true);
});
it("session mode requests distinct opening, developing and closing movements", async () => {
  const job = await startCurrentBatch({
    id: id(2),
    request,
    candidateCount: 3,
    mode: "session",
  });
  await vi.waitFor(() => expect(job.phase).toBe("done"));
  expect(f.start.mock.calls.map((c) => c[0].current.movement)).toEqual([
    "opening",
    "developing",
    "closing",
  ]);
});
it("cancel-before-ack tombstones the parent request", async () => {
  cancelCurrentBatch(id(3));
  await expect(
    startCurrentBatch({
      id: id(3),
      request,
      candidateCount: 2,
      mode: "compare",
    }),
  ).rejects.toThrow("already cancelled");
  expect(f.start).not.toHaveBeenCalled();
});
it("cancellation stops only the owned child and never queues the next piece", async () => {
  f.start.mockImplementation(async (r: MusicRequest, key: string) => {
    const job: MusicJob = {
      id: key,
      request: r,
      phase: "running",
      message: "TEST",
    };
    jobs.set(key, job);
    return job;
  });
  const job = await startCurrentBatch({
    id: id(4),
    request,
    candidateCount: 3,
    mode: "session",
  });
  await vi.waitFor(() => expect(f.start).toHaveBeenCalledTimes(1));
  cancelCurrentBatch(job.id);
  await vi.waitFor(() => expect(currentBatchBusy()).toBe(false));
  expect(job.phase).toBe("cancelled");
  expect(f.cancel).toHaveBeenCalledWith(f.start.mock.calls[0][1]);
  expect(f.start).toHaveBeenCalledTimes(1);
});
it("partial failures are explicit and duplicate PCM is not variety", async () => {
  f.start.mockImplementation(async (r: MusicRequest, key: string) => {
    if (++count === 1) throw Error("TEST gate rejected");
    const base = musicFixture();
    jobs.set(key, {
      id: key,
      request: r,
      phase: "done",
      sampleId: key,
      message: "TEST",
    });
    samples.push({ ...base, id: key, request: r });
    return jobs.get(key);
  });
  const job = await startCurrentBatch({
    id: id(5),
    request,
    candidateCount: 3,
    mode: "compare",
  });
  await vi.waitFor(() => expect(job.phase).toBe("done"));
  expect(job.candidateIds).toHaveLength(1);
  expect(job.candidateErrors).toEqual(
    expect.arrayContaining([
      "TEST gate rejected",
      "A duplicate PCM result was omitted.",
    ]),
  );
  expect(job.message).toContain("1 of 3");
});
it("corrupt manifests are not restored as ready", async () => {
  await mkdir(join(f.dir, "current-sessions"));
  await writeFile(
    join(f.dir, "current-sessions", id(6) + ".json"),
    JSON.stringify({ version: 1, job: { id: id(6), phase: "done" } }),
  );
  expect(await restoredCurrentBatch(id(6))).toBeUndefined();
});
