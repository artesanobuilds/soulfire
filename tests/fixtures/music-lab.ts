import {
  musicSampleSchema,
  type MusicSample,
} from "../../src/domain/music-lab";
export function musicFixture(
  model: "ace" | "stable" = "ace",
  id = "11111111-1111-4111-8111-111111111111",
): MusicSample {
  return musicSampleSchema.parse({
    id,
    request: { model, style: "piano", seed: 101, seconds: 30 },
    modelVersion: "TEST FIXTURE ONLY",
    codeRevision: "a".repeat(40),
    weightsRevision: "b".repeat(40),
    createdAt: "2026-10-28T00:00:00.000Z",
    latencySeconds: 2,
    loadSeconds: 1,
    inferenceSeconds: 1,
    peakRssBytes: null,
    peakAcceleratorBytes: null,
    metrics: {
      duration: 30,
      sampleRate: 48000,
      channels: 2,
      integratedLufs: -18,
      truePeakDb: -1,
      loudnessRange: 2,
      peak: 0.8,
      clippedFraction: 0,
      seamJump: 0.01,
      seamRmsDifferenceDb: 1,
      matchedLufs: -21,
      matchedTruePeakDb: -4,
      loopLufs: -21,
      loopTruePeakDb: -4,
      narrationLufs: -21,
      narrationTruePeakDb: -4,
      loopSeamJump: 0.001,
      pcmSha256: "d".repeat(64),
      sha256: "c".repeat(64),
    },
  });
}
