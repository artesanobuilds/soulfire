import { z } from "zod";
import { musicRequestSchema, type MusicSample } from "./music-lab";
import { currentTechnicalIssues } from "./current-music";
export const currentBatchSchema = z
  .object({
    id: z.string().uuid(),
    request: musicRequestSchema,
    candidateCount: z.number().int().min(1).max(3).default(1),
    mode: z.enum(["compare", "session"]).default("compare"),
  })
  .strict();
export type CurrentBatchInput = z.infer<typeof currentBatchSchema>;
export function technicalFit(sample: MusicSample) {
  if (currentTechnicalIssues(sample).length) return 0;
  const m = sample.metrics;
  const loudness = Math.max(0, 1 - Math.abs(m.matchedLufs + 21) / 0.3);
  const clipping = Math.max(0, 1 - m.clippedFraction / 0.001);
  const peak = Math.min(1, Math.max(0, (-m.matchedTruePeakDb - 2.5) / 1.5));
  return Math.round((loudness * 0.4 + clipping * 0.4 + peak * 0.2) * 100);
}
export function planCurrentSession(samples: MusicSample[]) {
  if (
    !samples.length ||
    samples.length > 3 ||
    samples.some((s) => currentTechnicalIssues(s).length)
  )
    throw Error("Choose one to three technically checked pieces.");
  const unique = samples.filter(
    (s, i) =>
      samples.findIndex((a) => a.metrics.pcmSha256 === s.metrics.pcmSha256) ===
      i,
  );
  const reasons: string[] = [];
  for (let i = 0; i < (unique.length > 1 ? unique.length : 0); i++) {
    const a = unique[i].metrics,
      b = unique[(i + 1) % unique.length].metrics;
    // A conservative engineering margin, not a calibrated probability of musical fit.
    if (
      a.estimatedKey == null ||
      b.estimatedKey == null ||
      (a.keyConfidence ?? 0) < 0.3 ||
      (b.keyConfidence ?? 0) < 0.3
    )
      reasons.push("Tonal compatibility is uncertain.");
    else if (a.estimatedKey !== b.estimatedKey)
      reasons.push("Estimated tonal centers differ.");
    if (
      a.estimatedBpm == null ||
      b.estimatedBpm == null ||
      (a.tempoConfidence ?? 0) < 0.4 ||
      (b.tempoConfidence ?? 0) < 0.4
    )
      reasons.push("Pulse compatibility is uncertain.");
    else if (Math.abs(a.estimatedBpm - b.estimatedBpm) > 6)
      reasons.push("Estimated pulses differ.");
    if (Math.abs(a.matchedLufs - b.matchedLufs) > 0.5)
      reasons.push("Listening levels differ.");
  }
  return {
    samples: unique,
    transition: reasons.length
      ? ("quiet-gap" as const)
      : ("crossfade" as const),
    reasons: [...new Set(reasons)],
    secondsOfUniqueMusic: unique.reduce((n, s) => n + s.metrics.duration, 0),
    disclaimer:
      "Compatibility is an acoustic estimate, not a guarantee of musical fit. Preview transitions and choose what you like.",
  };
}

export const currentBatchManifestSchema = z
  .object({
    version: z.literal(1),
    policyVersion: z.literal("current-candidates-20261029"),
    job: z
      .object({
        id: z.string().uuid(),
        request: musicRequestSchema,
        phase: z.enum(["done", "cancelled", "error"]),
        message: z.string().max(4000),
        sampleId: z.string().uuid().optional(),
        candidateIds: z.array(z.string().uuid()).max(3),
        requestedCandidates: z.number().int().min(1).max(3),
        completedCandidates: z.number().int().min(0).max(3),
        candidateErrors: z.array(z.string().max(1000)).max(3),
        mode: z.enum(["compare", "session"]),
      })
      .strict(),
  })
  .strict();
