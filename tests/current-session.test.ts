import { it, expect } from "vitest";
import {
  currentSeedCatalogue,
  currentMusicPrompt,
  defaultCurrentMusic,
  currentStarterName,
} from "../src/domain/current-music";
import {
  planCurrentSession,
  technicalFit,
  currentBatchSchema,
} from "../src/domain/current-session";
import { musicFixture } from "./fixtures/music-lab";
import { musicSampleSchema } from "../src/domain/music-lab";
it("eligible catalogue has exactly two starters for each adult noncrisis source area", () => {
  const eligible = currentSeedCatalogue.filter((s) => s.eligible);
  expect(eligible).toHaveLength(36);
  expect(new Set(eligible.map((s) => s.sourceTopic)).size).toBe(18);
  for (const n of new Set(eligible.map((s) => s.sourceTopic)))
    expect(eligible.filter((s) => s.sourceTopic === n)).toHaveLength(2);
  expect(eligible.some((s) => [3, 4].includes(s.sourceTopic))).toBe(false);
  expect(new Set(eligible.map((s) => s.seed)).size).toBe(36);
});
it("source concepts change actual musical descriptions and retain friendly names", () => {
  for (const seed of currentSeedCatalogue.filter((s) => s.eligible)) {
    const options = {
      ...defaultCurrentMusic,
      taste: seed.style as "piano" | "ambient" | "acoustic",
      conceptId: seed.id,
    };
    expect(currentMusicPrompt(options)).toContain(seed.character);
    expect(currentStarterName(options.taste, seed.seed, options)).toBe(
      seed.name,
    );
  }
});
it("excluded youth/crisis concepts never compile to a music request", () => {
  for (const n of [3, 4])
    expect(() =>
      currentMusicPrompt({
        ...defaultCurrentMusic,
        taste: n === 3 ? "piano" : "acoustic",
        conceptId: `current-seed-0${n}-1`,
      }),
    ).toThrow("not eligible");
});
it("bounded batch rejects runaway count or unsupported mode", () => {
  const x = {
    id: musicFixture().id,
    request: musicFixture().request,
    candidateCount: 4,
  };
  expect(() => currentBatchSchema.parse(x)).toThrow();
});
it("unknown compatibility fades to quiet instead of claiming a match", () => {
  const a = musicFixture(),
    b = {
      ...a,
      id: "22222222-2222-4222-8222-222222222222",
      metrics: { ...a.metrics, pcmSha256: "e".repeat(64) },
    };
  const p = planCurrentSession([a, b]);
  expect(p.transition).toBe("quiet-gap");
  expect(p.reasons).toContain("Tonal compatibility is uncertain.");
  expect(p.secondsOfUniqueMusic).toBe(60);
});
it("measured compatible key and pulse permit crossfades without an efficacy claim", () => {
  const a = musicFixture(),
    metrics = {
      ...a.metrics,
      estimatedKey: 0,
      keyConfidence: 0.3,
      estimatedBpm: 64,
      tempoConfidence: 0.6,
    };
  const b = {
    ...a,
    id: "22222222-2222-4222-8222-222222222222",
    metrics: { ...metrics, pcmSha256: "e".repeat(64) },
  };
  expect(planCurrentSession([{ ...a, metrics }, b]).transition).toBe(
    "crossfade",
  );
  expect(
    planCurrentSession([
      { ...a, metrics },
      { ...b, metrics: { ...b.metrics, estimatedKey: 7 } },
    ]).transition,
  ).toBe("quiet-gap");
});
it("duplicate PCM is one movement, not invented variety", () =>
  expect(
    planCurrentSession([musicFixture(), musicFixture()]).samples,
  ).toHaveLength(1));
it("failed technical gates cannot become a session or a high rank", () => {
  const s = musicFixture();
  s.metrics.matchedTruePeakDb = 0;
  expect(technicalFit(s)).toBe(0);
  expect(() => planCurrentSession([s])).toThrow();
});
it("bed-only records honestly mark unprepared comparison measurements null", () => {
  const s = musicFixture(),
    metrics = {
      ...s.metrics,
      loopLufs: null,
      loopTruePeakDb: null,
      narrationLufs: null,
      narrationTruePeakDb: null,
      loopSeamJump: null,
    };
  expect(
    musicSampleSchema.parse({ ...s, currentOnly: true, metrics }).currentOnly,
  ).toBe(true);
  expect(() => musicSampleSchema.parse({ ...s, metrics })).toThrow();
});

it("loop closure also checks the final movement against the first", () => {
  const base = musicFixture();
  const pieces = [60, 66, 72].map((bpm, i) => ({
    ...base,
    metrics: {
      ...base.metrics,
      pcmSha256: String(i + 1).repeat(64),
      estimatedKey: 0,
      keyConfidence: 0.3,
      estimatedBpm: bpm,
      tempoConfidence: 0.6,
    },
  }));
  expect(planCurrentSession(pieces).transition).toBe("quiet-gap");
});
