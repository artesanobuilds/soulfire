import { it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
const fixtures = vi.hoisted(() => ({
  command: vi.fn(),
  availability: vi.fn(),
  runtime: vi.fn(),
  catalog: vi.fn(),
}));
vi.mock("../src/infrastructure/music-lab-command", () => ({
  musicLabCommand: fixtures.command,
}));
vi.mock("../src/infrastructure/music-lab-runtime", () => ({
  musicLabDirectory: () => process.env.SOULFIRE_MUSIC_LAB_DIR,
  ensureMusicStorage: async () => {},
  modelAvailability: fixtures.availability,
  getModelRuntime: fixtures.runtime,
  musicCatalog: fixtures.catalog,
  musicStorageBytes: async () => 0,
}));
import {
  startMusicJob,
  cancelMusicJob,
  getMusicJob,
} from "../src/infrastructure/music-lab-jobs";
const request = {
  model: "ace" as const,
  style: "piano" as const,
  seed: 101,
  seconds: 30,
};
let folder = "";
beforeEach(async () => {
  folder = await mkdtemp(join(tmpdir(), "soulfire-music-jobs-"));
  process.env.SOULFIRE_MUSIC_LAB_DIR = folder;
  fixtures.availability
    .mockReset()
    .mockResolvedValue([{ model: "ace", ready: true }]);
  fixtures.catalog.mockReset().mockResolvedValue([]);
  fixtures.runtime.mockReset().mockResolvedValue({
    python: "/not-executed",
    root: "/fixture",
    codeRevision: "a".repeat(40),
    weightsRevision: "b".repeat(40),
  });
  fixtures.command
    .mockReset()
    .mockImplementation(
      (_p, _a, _i, signal: AbortSignal) =>
        new Promise((_r, reject) =>
          signal.addEventListener(
            "abort",
            () => reject(new DOMException("Cancelled", "AbortError")),
            { once: true },
          ),
        ),
    );
});
afterEach(async () => {
  await rm(folder, { recursive: true, force: true });
});
// State lives under a process symbol. Each case uses a unique UUID and awaits cleanup.
const id = (n: number) =>
  `00000000-0000-4000-8000-${n.toString().padStart(12, "0")}`;
it("cancelling before POST creates a tombstone and no worker", async () => {
  cancelMusicJob(id(1));
  await expect(startMusicJob(request, id(1))).rejects.toThrow(
    "already cancelled",
  );
  expect(fixtures.command).not.toHaveBeenCalled();
});
it("only one worker is reserved even across concurrent setup awaits", async () => {
  const settled = await Promise.allSettled([
    startMusicJob(request, id(2)),
    startMusicJob(request, id(3)),
  ]);
  expect(settled.filter((s) => s.status === "fulfilled")).toHaveLength(1);
  const job = settled.find(
    (s) => s.status === "fulfilled",
  ) as PromiseFulfilledResult<Awaited<ReturnType<typeof startMusicJob>>>;
  await vi.waitFor(() => expect(fixtures.command).toHaveBeenCalled());
  cancelMusicJob(job.value.id);
  await vi.waitFor(() =>
    expect(getMusicJob(job.value.id)?.phase).toBe("cancelled"),
  );
});
it("a gated model never starts a worker or fabricates a sample", async () => {
  fixtures.availability.mockResolvedValue([
    { model: "stable", ready: false, message: "Terms pending" },
  ]);
  await expect(
    startMusicJob({ ...request, model: "stable" }, id(4)),
  ).rejects.toThrow("Terms pending");
  expect(fixtures.command).not.toHaveBeenCalled();
});
it("failed generation becomes an explicit error and no measured record", async () => {
  fixtures.command.mockRejectedValue(Error("Synthetic worker failed"));
  const job = await startMusicJob(request, id(5));
  await vi.waitFor(() => expect(getMusicJob(job.id)?.phase).toBe("error"));
  expect(getMusicJob(job.id)?.sampleId).toBeUndefined();
});
it("a cancellation arriving during setup prevents delayed startup", async () => {
  let release: ((x: unknown) => void) | undefined;
  fixtures.availability.mockImplementation(
    () =>
      new Promise((r) => {
        release = r;
      }),
  );
  const pending = startMusicJob(request, id(6));
  cancelMusicJob(id(6));
  release!([{ model: "ace", ready: true }]);
  await expect(pending).rejects.toThrow("already cancelled");
  expect(fixtures.command).not.toHaveBeenCalled();
});
