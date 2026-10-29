import { it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { musicFixture } from "./fixtures/music-lab";
import {
  musicCatalog,
  musicSample,
  musicCataloguePolicy,
} from "../src/infrastructure/music-lab-runtime";
import { GET as audio } from "../app/api/music-lab/audio/route";
import { currentCataloguePolicySchema } from "../src/domain/current-catalogue";
let root = "";
const active = musicFixture(),
  old = { ...musicFixture(), id: "22222222-2222-4222-8222-222222222222" };
const policy = {
  schemaVersion: 1 as const,
  version: "fixture-catalogue",
  publishedAt: "2026-10-29T22:00:00Z",
  expectedSeedCount: 1,
  seedSampleIds: [active.id],
  retiredSampleIds: [old.id],
  description: "New stereo catalogue",
};
beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "current-catalogue-"));
  process.env.SOULFIRE_MUSIC_LAB_DIR = root;
  for (const s of [active, old]) {
    const p = join(root, "samples", s.id);
    await mkdir(p, { recursive: true });
    await writeFile(join(p, "sample.json"), JSON.stringify(s));
    await writeFile(join(p, "bed.wav"), Buffer.alloc(128, 7));
  }
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
  delete process.env.SOULFIRE_MUSIC_LAB_DIR;
});
it("legacy installations retain their catalogue until a complete replacement is published", async () =>
  expect(await musicCatalog()).toHaveLength(2));
it("replacement retires old recommendations while exact saved identities still resolve", async () => {
  await writeFile(join(root, "catalogue.json"), JSON.stringify(policy));
  expect((await musicCatalog()).map((s) => s.id)).toEqual([active.id]);
  expect(await musicCatalog(true)).toHaveLength(2);
  expect((await musicSample(old.id))?.metrics.pcmSha256).toBe(
    old.metrics.pcmSha256,
  );
});
it("archived saved audio remains range-readable without silently using a new piece", async () => {
  await writeFile(join(root, "catalogue.json"), JSON.stringify(policy));
  const response = await audio(
    new Request(
      `http://127.0.0.1:3100/api/music-lab/audio?id=${old.id}&mode=bed`,
      { headers: { range: "bytes=0-15" } },
    ),
  );
  expect(response.status).toBe(206);
  expect(new Uint8Array(await response.arrayBuffer())).toEqual(
    new Uint8Array(16).fill(7),
  );
});
it("a corrupt publication fails closed instead of reactivating retired material", async () => {
  await writeFile(join(root, "catalogue.json"), "{}");
  await expect(musicCatalog()).rejects.toThrow();
  expect((await musicSample(old.id))?.id).toBe(old.id);
});
it("duplicate, incomplete, overlapping and path-like identities are rejected", () => {
  for (const patch of [
    { seedSampleIds: [] },
    { retiredSampleIds: [active.id] },
    { seedSampleIds: [active.id, active.id], expectedSeedCount: 2 },
    { seedSampleIds: ["../../outside"] },
  ])
    expect(() =>
      currentCataloguePolicySchema.parse({ ...policy, ...patch }),
    ).toThrow();
});
it("missing explicit ids do not invent saved audio", async () => {
  expect(await musicSample("33333333-3333-4333-8333-333333333333")).toBeNull();
  expect(await musicSample("../../outside")).toBeNull();
  expect(await musicCataloguePolicy()).toBeNull();
});

it("an incomplete on-disk publication is not presented as a complete new shelf", async () => {
  await writeFile(
    join(root, "catalogue.json"),
    JSON.stringify({
      ...policy,
      seedSampleIds: ["33333333-3333-4333-8333-333333333333"],
    }),
  );
  await expect(musicCatalog()).rejects.toThrow("incomplete");
  expect(await musicSample(old.id)).not.toBeNull();
});
