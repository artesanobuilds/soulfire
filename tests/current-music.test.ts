import { expect, it } from "vitest";
import {
  currentMusicPrompt,
  currentMusicOptionsSchema,
  currentTechnicalIssues,
  suggestedCurrentSamples,
  defaultCurrentMusic,
  readSavedCurrentMusic,
  savedCurrentMusicSchema,
} from "../src/domain/current-music";
import { musicFixture } from "./fixtures/music-lab";
import { musicRequestSchema } from "../src/domain/music-lab";
it("goals meaningfully change the musical brief without diagnosis", () => {
  const goals = [
    "focus",
    "calm",
    "overwhelm",
    "unwind",
    "lift",
    "company",
  ] as const;
  expect(
    new Set(
      goals.map((intent) =>
        currentMusicPrompt({ ...defaultCurrentMusic, intent }),
      ),
    ).size,
  ).toBe(6);
  expect(currentMusicPrompt(defaultCurrentMusic)).not.toMatch(
    /anxiety|depression|ADHD|treats/,
  );
});
it("taste, exclusions and feel are actual prompt inputs", () => {
  const p = currentMusicPrompt({
    ...defaultCurrentMusic,
    taste: "acoustic",
    avoid: ["bright", "nature"],
    feel: "gently-shift",
  });
  expect(p).toContain("nylon-string");
  expect(p).toContain("No sharp attacks");
  expect(p).toContain("No environmental");
  expect(p).toContain("slightly warmer");
});
it("rejects unknown clinical fields and arbitrary model settings", () => {
  expect(() =>
    currentMusicOptionsSchema.parse({ ...defaultCurrentMusic, diagnosis: "x" }),
  ).toThrow();
  expect(() =>
    musicRequestSchema.parse({
      model: "ace",
      style: "piano",
      seconds: 900,
      seed: 1,
      current: defaultCurrentMusic,
    }),
  ).toThrow();
});
it("checks render loudness, duration and clipping before selection", () => {
  const s = musicFixture();
  expect(currentTechnicalIssues(s)).toEqual([]);
  expect(
    currentTechnicalIssues({
      ...s,
      metrics: {
        ...s.metrics,
        matchedTruePeakDb: 0,
        clippedFraction: 0.02,
        duration: 2,
      },
    }),
  ).toHaveLength(3);
});
it("Stable never becomes a playable Current starter", () =>
  expect(currentTechnicalIssues(musicFixture("stable"))).not.toEqual([]));
it("suggests explicit taste first and deduplicates same-seed repeats", () => {
  const a = musicFixture(),
    b = {
      ...a,
      id: "22222222-2222-4222-8222-222222222222",
      request: { ...a.request, style: "ambient" as const },
    };
  const list = suggestedCurrentSamples([a, a, b], {
    ...defaultCurrentMusic,
    taste: "ambient",
  });
  expect(list.map((s) => s.id)).toEqual([b.id, a.id]);
});
it("bad output cannot sneak into suggestions", () => {
  const a = musicFixture();
  expect(
    suggestedCurrentSamples(
      [{ ...a, metrics: { ...a.metrics, matchedLufs: -2 } }],
      defaultCurrentMusic,
    ),
  ).toEqual([]);
});
it("opt-in saved sessions bind the actual PCM hash and omit feeling text", () => {
  const s = musicFixture();
  const value = {
    version: 2,
    id: s.id,
    name: "My Current",
    sampleId: s.id,
    pcmSha256: s.metrics.pcmSha256,
    options: defaultCurrentMusic,
    minutes: 5,
    volume: 0.2,
    brightness: 0.5,
    space: 0.1,
  };
  expect(readSavedCurrentMusic(JSON.stringify([value]))).toHaveLength(1);
  expect(() =>
    savedCurrentMusicSchema.parse({ ...value, feeling: "private" }),
  ).toThrow();
  expect(() =>
    readSavedCurrentMusic(JSON.stringify([{ ...value, volume: 2 }])),
  ).toThrow();
  expect(readSavedCurrentMusic(null)).toEqual([]);
});
