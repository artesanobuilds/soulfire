import seeds from "./current-seeds.json";
import type { CurrentMusicOptions } from "./current-music";
const currentSeed = (id: string) => seeds.find((s) => s.id === id);
export const currentCatalogueVersion = "current-listening-20261029-v1";
export function currentGenerationRecipe(
  o: CurrentMusicOptions,
  seconds: number,
) {
  const seed = o.conceptId ? currentSeed(o.conceptId) : undefined;
  if (o.conceptId && (!seed?.eligible || seed.style !== o.taste))
    throw Error("This starter is not eligible for adult Current generation.");
  const number = Number(o.conceptId?.match(/seed-(\d+)-/)?.[1] || 0);
  const classic = o.taste === "piano" && number === 19;
  const clear =
    (o.taste === "ambient" && o.intent === "company") ||
    (o.taste === "acoustic" && o.intent === "calm");
  const profile = `${o.taste}-${classic ? "classic" : clear ? "clear" : "soft"}`;
  const palette = {
    piano: classic
      ? "intimate warm felt piano, quiet familiar recurring figure, clear unhurried mid-register melody"
      : "solo felt piano, lyrical four-bar question and answer, recurring gentle motif, widely spaced bass and upper voices",
    ambient:
      "warm sustained strings and soft pad, beatless tonal ambient, overlapping long note releases, slowly moving consonant harmony",
    acoustic:
      "solo nylon-string acoustic guitar, flowing fingerstyle, sustained clear upper melody, relaxed balanced phrases, rounded bass notes with natural releases",
  }[o.taste];
  const goal = {
    focus: "steady restrained accompaniment and a simple repeating motif",
    calm: "unhurried phrases with natural breathing space",
    overwhelm: "sparse predictable phrasing and very gentle changes",
    unwind: "low-energy legato phrasing and a restful settled coda",
    lift: "light hopeful melodic answers and modest graceful movement",
    company: "warm familiar folk-like phrasing and intimate tone",
  }[o.intent];
  const variant = [
    "a small descending melodic answer",
    "a gentle rising phrase answered by a restful lower phrase",
    "a recurring two-note figure with small graceful variations",
    "a sustained melodic line above a restrained repeating accompaniment",
  ][(number + Number(o.conceptId?.slice(-1) || 0)) % 4];
  const phrase =
    o.taste === "ambient"
      ? "a complete continuous instrumental arc with a gradual resolving final section and long natural resonance"
      : `${Math.max(8, Math.round(seconds / 3.75))}-bar instrumental miniature, balanced four-bar phrases, final two bars resolve gently to the tonic with natural resonance`;
  const caption = [
    palette,
    goal,
    variant,
    "smooth diatonic voice-leading, coherent gently moving harmony",
    phrase,
    o.avoid.includes("bright")
      ? "soft rounded attacks and dark warm tone, restrained even dynamics"
      : "natural clear tone, restrained even dynamics",
    o.feel === "gently-shift"
      ? "gradually warmer voicing"
      : "consistent musical character",
    "instrumental",
    o.avoid.includes("percussion")
      ? "no drums"
      : "a very understated quiet pulse",
    o.avoid.includes("nature")
      ? "music only, intimate studio recording"
      : "subtle room ambience",
  ].join(", ");
  return {
    policyVersion: currentCatalogueVersion,
    profile,
    caption,
    shift: clear ? 3 : 1,
    requestedKey: "C major",
    requestedBpm: o.taste === "ambient" ? null : 64,
    requestedTimeSignature: o.taste === "ambient" ? "N/A" : "4",
  };
}
export const eligibleCurrentSeeds = seeds.filter((s) => s.eligible);
