import { z } from "zod";
import { currentMusicOptionsSchema } from "./current-music";
export const musicModels = ["ace", "stable"] as const;
export type MusicModel = (typeof musicModels)[number];
export const musicModelLabels = {
  ace: "ACE-Step 1.5 Turbo",
  stable: "Stable Audio 3 Small-Music",
};
export const musicStyles = {
  piano: "Felt piano",
  ambient: "Beatless pads & strings",
  acoustic: "Restrained acoustic",
} as const;
export type MusicStyle = keyof typeof musicStyles;
export const musicBriefs: Record<MusicStyle, string> = {
  piano:
    "Instrumental felt piano, 64 BPM, sparse gentle notes, simple repeating diatonic harmony, spacious pauses, soft even dynamics, no drums, no vocals, no speech, no sudden peaks. Understated background music, no dramatic build or ending.",
  ambient:
    "Instrumental beatless ambient pads and soft sustained strings, slowly changing diatonic harmony, spacious texture, soft even dynamics, no percussion, no vocals, no speech, no sudden peaks. Understated background music, no dramatic build or ending.",
  acoustic:
    "Instrumental restrained nylon-string acoustic guitar, 64 BPM, sparse fingerpicked notes, simple diatonic harmony, spacious pauses, soft even dynamics, no drums, no vocals, no speech, no sudden peaks. Understated background music, no dramatic build or ending.",
};
export const musicRequestSchema = z
  .object({
    model: z.enum(musicModels),
    style: z.enum(["piano", "ambient", "acoustic"]),
    seed: z.number().int().min(0).max(2147483647),
    seconds: z.number().int().min(30).max(90),
    current: currentMusicOptionsSchema.optional(),
  })
  .strict();
export type MusicRequest = z.infer<typeof musicRequestSchema>;
export const musicMetricsSchema = z
  .object({
    duration: z.number().positive(),
    sampleRate: z.number().int().positive(),
    channels: z.number().int().min(1).max(2),
    integratedLufs: z.number().finite(),
    truePeakDb: z.number().finite(),
    loudnessRange: z.number().min(0),
    peak: z.number().min(0),
    clippedFraction: z.number().min(0).max(1),
    seamJump: z.number().min(0),
    seamRmsDifferenceDb: z.number().finite(),
    matchedLufs: z.number().finite(),
    matchedTruePeakDb: z.number().finite(),
    loopLufs: z.number().finite().nullable(),
    loopTruePeakDb: z.number().finite().nullable(),
    narrationLufs: z.number().finite().nullable(),
    narrationTruePeakDb: z.number().finite().nullable(),
    loopSeamJump: z.number().min(0).nullable(),
    estimatedKey: z.number().int().min(0).max(23).nullable().optional(),
    keyConfidence: z.number().min(0).max(1).optional(),
    estimatedBpm: z.number().min(35).max(200).nullable().optional(),
    tempoConfidence: z.number().min(0).max(1).optional(),
    chroma: z.array(z.number().nonnegative()).length(12).optional(),
    spectralCentroidHz: z.number().nonnegative().optional(),
    onsetRate: z.number().nonnegative().optional(),
    pcmSha256: z.string().regex(/^[a-f0-9]{64}$/),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();
export const musicSampleSchema = z
  .object({
    id: z.string().uuid(),
    currentOnly: z.literal(true).optional(),
    request: musicRequestSchema,
    modelVersion: z.string().max(80),
    codeRevision: z.string().max(64),
    weightsRevision: z.string().max(64),
    createdAt: z.string().datetime(),
    generationSettings: z
      .object({
        steps: z.number().int(),
        shift: z.number(),
        guidanceScale: z.number(),
        thinking: z.boolean(),
        requestedKey: z.string().max(40),
        requestedBpm: z.number().nullable(),
      })
      .strict()
      .optional(),
    latencySeconds: z.number().nonnegative(),
    loadSeconds: z.number().nonnegative(),
    inferenceSeconds: z.number().nonnegative(),
    peakRssBytes: z.number().nonnegative().nullable(),
    peakAcceleratorBytes: z.number().nonnegative().nullable(),
    metrics: musicMetricsSchema,
  })
  .strict()
  .refine(
    (s) =>
      s.currentOnly === true ||
      [
        s.metrics.loopLufs,
        s.metrics.loopTruePeakDb,
        s.metrics.narrationLufs,
        s.metrics.narrationTruePeakDb,
        s.metrics.loopSeamJump,
      ].every((v) => v !== null),
    {
      message:
        "Comparison samples require actual comparison-render measurements.",
    },
  );
export type MusicSample = z.infer<typeof musicSampleSchema>;
export type MusicAvailability = {
  model: MusicModel;
  ready: boolean;
  state:
    "ready" | "installation-pending" | "license-pending" | "weights-missing";
  message: string;
  version: string;
};
export type MusicJob = {
  id: string;
  request: MusicRequest;
  phase: "running" | "done" | "cancelled" | "error";
  message: string;
  sampleId?: string;
  candidateIds?: string[];
  completedCandidates?: number;
  requestedCandidates?: number;
  candidateErrors?: string[];
  mode?: "compare" | "session";
};
export const musicRatingNames = {
  pleasantness: "Pleasantness",
  distraction: "Distraction",
  artifacts: "Audible artifacts",
  vocals: "Unwanted vocals",
  fatigue: "Loop fatigue",
  intelligibility: "Narration intelligibility",
} as const;
export const musicRatingSchema = z
  .object({
    sampleId: z.string().uuid(),
    mode: z.enum(["bed", "narration", "loop"]),
    ratings: z
      .object({
        pleasantness: z.number().int().min(1).max(5).nullable(),
        distraction: z.number().int().min(1).max(5).nullable(),
        artifacts: z.number().int().min(1).max(5).nullable(),
        vocals: z.number().int().min(1).max(5).nullable(),
        fatigue: z.number().int().min(1).max(5).nullable(),
        intelligibility: z.number().int().min(1).max(5).nullable(),
      })
      .strict(),
  })
  .strict();
export type MusicRating = z.infer<typeof musicRatingSchema>;
export const emptyMusicRatings: MusicRating["ratings"] = {
  pleasantness: null,
  distraction: null,
  artifacts: null,
  vocals: null,
  fatigue: null,
  intelligibility: null,
};
export const musicRatingStorageKey = "soulfire.music-lab.ratings.v1";
export function readMusicRatings(raw: string | null): MusicRating[] {
  if (!raw) return [];
  if (raw.length > 200000) throw Error("Saved ratings are too large.");
  return z.array(musicRatingSchema).max(300).parse(JSON.parse(raw));
}
export function musicComparisonPlan(seconds = 30): MusicRequest[] {
  return musicModels.flatMap((model) =>
    (Object.keys(musicStyles) as MusicStyle[]).flatMap((style) =>
      [101, 202].map((seed) =>
        musicRequestSchema.parse({ model, style, seed, seconds }),
      ),
    ),
  );
}
export function sameMusicBrief(a: MusicSample, b: MusicSample) {
  return (
    a.request.style === b.request.style &&
    a.request.seed === b.request.seed &&
    a.request.seconds === b.request.seconds
  );
}
export function blindMusicPair(
  samples: MusicSample[],
  style: MusicStyle,
  seed: number,
  reverse: boolean,
): MusicSample[] {
  const choices = musicModels
    .map(
      (model) =>
        samples
          .filter(
            (s) =>
              s.request.model === model &&
              s.request.style === style &&
              s.request.seed === seed,
          )
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0],
    )
    .filter((s): s is MusicSample => !!s);
  return reverse ? choices.reverse() : choices;
}
