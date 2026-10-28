import { describe, it, expect } from "vitest";
import {
  musicComparisonPlan,
  musicRequestSchema,
  musicSampleSchema,
  musicBriefs,
  blindMusicPair,
  readMusicRatings,
  emptyMusicRatings,
  sameMusicBrief,
} from "../src/domain/music-lab";
import type { MusicSample } from "../src/domain/music-lab";
import { musicFixture } from "./fixtures/music-lab";
describe("Music Lab honest comparison protocol", () => {
  it("plans twelve real runs across identical briefs, three styles and two seeds", () => {
    const plan = musicComparisonPlan();
    expect(plan).toHaveLength(12);
    expect(
      new Set(plan.map((p) => `${p.model}:${p.style}:${p.seed}`)).size,
    ).toBe(12);
    for (const model of ["ace", "stable"])
      expect(plan.filter((p) => p.model === model)).toHaveLength(6);
  });
  it("does not accept command paths, private free text or unsafe generation sizes", () => {
    for (const patch of [
      { seconds: 600 },
      { seed: -1 },
      { model: "remote" },
      { prompt: "private health notes" },
      { python: "/bin/sh" },
    ])
      expect(
        musicRequestSchema.safeParse({
          model: "ace",
          style: "piano",
          seed: 101,
          seconds: 30,
          ...patch,
        }).success,
      ).toBe(false);
  });
  it("uses instrumental nonclinical common briefs with meaningful style differences", () => {
    expect(new Set(Object.values(musicBriefs)).size).toBe(3);
    for (const brief of Object.values(musicBriefs)) {
      expect(brief).toContain("no vocals");
      expect(brief).not.toMatch(/treat|diagnos|therapy/);
    }
  });
  it("returns no fake sample when a model is unavailable", () => {
    expect(blindMusicPair([], "piano", 101, false)).toEqual([]);
    expect(blindMusicPair([musicFixture()], "piano", 101, false)).toHaveLength(
      1,
    );
  });
  it("blinds identities by order without inventing model matches", () => {
    const a = musicFixture(),
      b = musicFixture("stable", "22222222-2222-4222-8222-222222222222");
    expect(blindMusicPair([a, b], "piano", 101, false)).toEqual([a, b]);
    expect(blindMusicPair([a, b], "piano", 101, true)).toEqual([b, a]);
    expect(sameMusicBrief(a, b)).toBe(true);
    expect(
      sameMusicBrief(a, { ...b, request: { ...b.request, seed: 202 } }),
    ).toBe(false);
  });
  it("keeps blank ratings blank and rejects scores outside explicit user choices", () => {
    const row = {
      sampleId: musicFixture().id,
      mode: "bed",
      ratings: emptyMusicRatings,
    };
    expect(
      readMusicRatings(JSON.stringify([row]))[0].ratings.pleasantness,
    ).toBeNull();
    expect(() =>
      readMusicRatings(
        JSON.stringify([
          { ...row, ratings: { ...emptyMusicRatings, pleasantness: 6 } },
        ]),
      ),
    ).toThrow();
  });
  it("rejects corrupt or excessive saved data without silently replacing it", () => {
    expect(readMusicRatings(null)).toEqual([]);
    expect(() => readMusicRatings("{bad")).toThrow();
    expect(() => readMusicRatings("x".repeat(200001))).toThrow();
  });
  it("requires actual finite measurements and matching render metrics", () => {
    const sample = musicFixture();
    expect(
      musicSampleSchema.safeParse({
        ...sample,
        metrics: { ...sample.metrics, integratedLufs: NaN },
      }).success,
    ).toBe(false);
    const metrics = { ...sample.metrics } as Partial<MusicSample["metrics"]>;
    delete metrics.loopLufs;
    expect(musicSampleSchema.safeParse({ ...sample, metrics }).success).toBe(
      false,
    );
  });
});
