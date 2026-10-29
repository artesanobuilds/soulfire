// Musical design hypotheses for audition, not therapeutic prescriptions.
export const currentCompositionVersion = "current-musical-caption-20261029-v2";
export type CompositionInput = {
  intent: "focus" | "calm" | "overwhelm" | "unwind" | "lift" | "company";
  taste: "piano" | "ambient" | "acoustic";
  avoid: string[];
  feel: "steady" | "gently-shift";
  conceptId?: string;
  movement?: "opening" | "developing" | "closing";
};
export function currentCompositionCaption(o: CompositionInput) {
  const number = Number(o.conceptId?.match(/seed-(\d+)-([12])$/)?.[1] || 0);
  const variant = Number(o.conceptId?.slice(-1) || 1);
  const harmonicRoutes = ["C-Am-F-G", "C-F-G-C", "C-G-Am-F", "Am-F-C-G"];
  const route = harmonicRoutes[(number + variant) % harmonicRoutes.length];
  const palette = {
    piano:
      "solo felt piano, intimate chamber miniature, open mid-register voicings, sparse bass roots",
    ambient:
      "warm sustained string ensemble and soft synth pad, slow tonal ambient, widely spaced triads, gradual chord changes",
    acoustic:
      "solo nylon-string acoustic guitar, gentle fingerstyle, clear bass notes and upper triad inversions",
  }[o.taste];
  const phrasing = {
    focus:
      "steady recurring accompaniment, restrained two-note motif, clear four-bar phrases",
    calm: "unhurried four-bar question and answer, natural spaces between phrases",
    overwhelm: "very sparse recurring motif, predictable spacious phrasing",
    unwind: "low-energy legato phrases, settled tonic cadence",
    lift: "light ascending motif answered by a gentle descending phrase",
    company:
      "warm folk-like melody, familiar balanced question and answer phrases",
  }[o.intent];
  const movement =
    o.movement === "opening"
      ? "introduce a clear recurring motif"
      : o.movement === "developing"
        ? "repeat the motif with one small melodic variation"
        : o.movement === "closing"
          ? "return to the motif and resolve gently to the tonic"
          : "repeat a short motif with small variations and a settled ending";
  return [
    palette,
    "C major, 4/4",
    o.taste === "ambient" ? "free sustained pacing" : "64 BPM",
    o.taste === "ambient"
      ? "simple diatonic tonic-subdominant harmony"
      : `${route} diatonic harmony, one chord per bar`,
    "smooth stepwise inner voices",
    phrasing,
    movement,
    o.feel === "gently-shift"
      ? "gradually warmer voicing and a small increase in melodic warmth"
      : "consistent texture and pulse",
    o.avoid.includes("bright")
      ? "rounded attacks, dark warm tone"
      : "natural clear tone",
    "restrained even dynamics, instrumental",
    o.avoid.includes("percussion") ? "no drums" : "subtle quiet pulse",
    o.avoid.includes("nature")
      ? "music only, dry studio recording"
      : "intimate room ambience",
  ].join(", ");
}
