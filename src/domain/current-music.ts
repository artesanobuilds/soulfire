import { z } from "zod";
import seeds from "./current-seeds.json";
export const currentSeedCatalogue = seeds;
export function currentSeed(id: string) {
  return currentSeedCatalogue.find((s) => s.id === id);
}
import type { MusicSample, MusicStyle } from "./music-lab";
export const currentIntentLabels = {
  focus: "Find my focus",
  calm: "Feel calmer",
  overwhelm: "Less overwhelmed",
  unwind: "Wind down",
  lift: "A gentle lift",
  company: "A little company",
} as const;
export const currentMusicOptionsSchema = z
  .object({
    intent: z.enum(["focus", "calm", "overwhelm", "unwind", "lift", "company"]),
    taste: z.enum(["piano", "ambient", "acoustic"]),
    avoid: z.array(z.enum(["percussion", "bright", "nature", "vocals"])).max(4),
    feel: z.enum(["steady", "gently-shift"]),
    conceptId: z
      .string()
      .regex(/^current-seed-[0-9]{2}-[12]$/)
      .optional(),
    movement: z.enum(["opening", "developing", "closing"]).optional(),
  })
  .strict();
export type CurrentMusicOptions = z.infer<typeof currentMusicOptionsSchema>;
export const defaultCurrentMusic: CurrentMusicOptions = {
  intent: "calm",
  taste: "piano",
  avoid: ["vocals", "percussion"],
  feel: "steady",
};
export function currentMusicPrompt(options: CurrentMusicOptions) {
  const o = currentMusicOptionsSchema.parse(options);
  const seed = o.conceptId ? currentSeed(o.conceptId) : undefined;
  if (o.conceptId && (!seed?.eligible || seed.style !== o.taste))
    throw Error("This starter is not eligible for adult Current generation.");
  const goal = {
    focus:
      "Unobtrusive background for a quiet task, stable phrasing and restrained detail",
    calm: "An unhurried quiet interlude with spacious pauses",
    overwhelm:
      "Very sparse predictable phrases with little change and generous space",
    unwind: "Soft low-energy music with a gentle ending, no build",
    lift: "Light warm music with modest movement, without a dramatic climax",
    company:
      "Warm familiar-feeling instrumental phrasing, intimate and understated",
  }[o.intent];
  const palette = {
    piano: "soft felt-like piano",
    ambient: "beatless sustained warm pads and strings",
    acoustic: "restrained nylon-string acoustic guitar",
  }[o.taste];
  return `Instrumental ${palette}. ${goal}. ${seed?.character || ""} ${o.movement === "opening" ? "Begin with a sparse clear motif." : o.movement === "developing" ? "Develop a little textural variety without a dramatic build." : o.movement === "closing" ? "Return to restrained detail and a gentle ending." : ""} Simple consonant harmony, soft even dynamics. ${o.feel === "gently-shift" ? "A subtle move toward a slightly warmer texture; no abrupt changes." : "Keep the musical feel steady."} ${o.avoid.includes("bright") ? "No sharp attacks, harsh highs or bright metallic sounds." : "Natural rounded tone."} ${o.avoid.includes("percussion") ? "No drums or percussion." : "Only a very understated pulse if any."} ${o.avoid.includes("nature") ? "No environmental or nature recordings." : "No environmental effects are required."} No vocals, speech, sudden peaks, startling sounds or dramatic ending. A musical preference request, not a treatment protocol.`;
}
export function currentTechnicalIssues(s: MusicSample): string[] {
  const m = s.metrics,
    issues: string[] = [];
  if (s.request.model !== "ace")
    issues.push("This starter is not ACE-Step Turbo.");
  if (
    m.duration < 10 ||
    m.duration > 100 ||
    Math.abs(m.duration - s.request.seconds) > 3
  )
    issues.push("Duration needs review.");
  if (Math.abs(m.matchedLufs + 21) > 0.3 || m.matchedTruePeakDb > -2.5)
    issues.push("Playback loudness or peak needs review.");
  if (m.clippedFraction > 0.001)
    issues.push("The source has excessive clipping.");
  if (
    s.request.current?.avoid.includes("bright") &&
    (m.spectralCentroidHz ?? 0) > 4500
  )
    issues.push("The requested soft tone needs review.");
  if ((m.onsetRate ?? 0) > 8)
    issues.push(
      "The transient rate exceeds the restrained-music release threshold.",
    );
  return issues;
}
export function currentStarterName(
  style: MusicStyle,
  seed: number,
  options?: CurrentMusicOptions,
) {
  if (options?.conceptId) {
    const seed = currentSeed(options.conceptId);
    if (seed?.eligible) return seed.name;
  }
  if (options) {
    const titles = {
      focus: "Clearwater",
      calm: "Quiet Reach",
      overwhelm: "Open Space",
      unwind: "Evening Shore",
      lift: "First Light",
      company: "Familiar Ground",
    };
    return (
      titles[options.intent] +
      [
        " / Dawn",
        " / Meadow",
        " / River",
        " / Daylight",
        " / Garden",
        " / Horizon",
      ][seed % 6]
    );
  }
  const names = {
    piano: ["Small Morning", "Window Light"],
    ambient: ["Open Horizon", "Steady Shore"],
    acoustic: ["An Ordinary Afternoon", "Daylight Corner"],
  };
  return names[style][seed % 2];
}
export function suggestedCurrentSamples(
  samples: MusicSample[],
  options: CurrentMusicOptions,
) {
  return samples
    .filter((s) => currentTechnicalIssues(s).length === 0)
    .sort((a, b) => {
      // Editorial fit, not a health score. Explicit taste outweighs the starting palette.
      const palettes: Record<CurrentMusicOptions["intent"], MusicStyle[]> = {
        focus: ["piano", "ambient"],
        calm: ["ambient", "piano"],
        overwhelm: ["ambient"],
        unwind: ["ambient", "piano"],
        lift: ["acoustic"],
        company: ["piano", "acoustic"],
      };
      const score = (s: MusicSample) =>
        Number(s.request.style === options.taste) * 4 +
        Number(palettes[options.intent].includes(s.request.style)) +
        Number(s.request.current?.intent === options.intent) * 2;
      return score(b) - score(a) || b.createdAt.localeCompare(a.createdAt);
    })
    .filter(
      (s, i, all) =>
        all.findIndex(
          (x) =>
            x.request.style === s.request.style &&
            x.request.seed === s.request.seed,
        ) === i,
    )
    .slice(0, 80);
}
export const savedCurrentMusicSchema = z
  .object({
    version: z.literal(2),
    id: z.string().uuid(),
    name: z.string().trim().min(1).max(60),
    sampleId: z.string().uuid(),
    segments: z
      .array(
        z
          .object({
            sampleId: z.string().uuid(),
            pcmSha256: z.string().regex(/^[a-f0-9]{64}$/),
          })
          .strict(),
      )
      .min(1)
      .max(3)
      .optional(),
    transition: z.enum(["crossfade", "quiet-gap"]).optional(),
    pcmSha256: z.string().regex(/^[a-f0-9]{64}$/),
    options: currentMusicOptionsSchema,
    minutes: z.number().int().min(1).max(30),
    volume: z.number().min(0).max(0.6),
    brightness: z.number().min(0).max(1),
    space: z.number().min(0).max(0.35),
  })
  .strict();
export type SavedCurrentMusic = z.infer<typeof savedCurrentMusicSchema>;
export const currentMusicStorageKey = "soulfire.current.sessions.v2";
export function readSavedCurrentMusic(raw: string | null): SavedCurrentMusic[] {
  if (!raw) return [];
  if (raw.length > 50000) throw Error("Saved sessions exceed their limit.");
  return z.array(savedCurrentMusicSchema).max(20).parse(JSON.parse(raw));
}
