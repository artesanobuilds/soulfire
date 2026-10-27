import { z } from "zod";

export const currentKinds = ["river", "rain", "breeze", "warmth"] as const;
export type CurrentKind = (typeof currentKinds)[number];
export const currentLabels: Record<CurrentKind, string> = {
  river: "River",
  rain: "Rain",
  breeze: "Breeze",
  warmth: "Warm tones",
};
export const currentGoals = {
  focus: "Focus",
  unwind: "Unwind",
  settle: "Settle a busy mind",
  explore: "Explore",
} as const;
const kinds = z.array(z.enum(currentKinds)).max(4);
export const currentInputSchema = z
  .object({
    goal: z.enum(["focus", "unwind", "settle", "explore"]),
    preferred: kinds,
    excluded: kinds,
    intensity: z.number().min(0).max(1),
    brightness: z.number().min(0).max(1),
    movement: z.number().min(0).max(1),
    minutes: z.number().int().min(1).max(60),
    words: z.string().max(300).optional(),
  })
  .strict();
export type CurrentInput = z.infer<typeof currentInputSchema>;
export const currentRecipeSchema = currentInputSchema
  .omit({ words: true })
  .extend({
    version: z.literal(1),
    id: z.string().regex(/^current-[0-9a-f]{8}$/),
    seed: z.number().int().min(0).max(0xffffffff),
    volume: z.number().min(0).max(0.7),
    name: z.string().trim().min(1).max(60),
    layers: z
      .array(
        z
          .object({
            kind: z.enum(currentKinds),
            level: z.number().min(0).max(1),
            muted: z.boolean(),
          })
          .strict(),
      )
      .min(1)
      .max(4),
  })
  .strict()
  .superRefine((value, ctx) => {
    const ids = value.layers.map((l) => l.kind);
    if (
      new Set(ids).size !== ids.length ||
      ids.some((k) => value.excluded.includes(k))
    )
      ctx.addIssue({
        code: "custom",
        message: "Recipe layers must be unique and respect exclusions.",
      });
  });
export type CurrentRecipe = z.infer<typeof currentRecipeSchema>;
export const currentStorageKey = "soulfire.current.mixes.v1";
export const defaultCurrentInput: CurrentInput = {
  goal: "unwind",
  preferred: ["river", "warmth"],
  excluded: [],
  intensity: 0.45,
  brightness: 0.4,
  movement: 0.35,
  minutes: 10,
  words: "",
};

export function hashCurrent(text: string) {
  let hash = 2166136261;
  for (const character of text)
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return hash >>> 0;
}
export function currentRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}
export function createCurrentRecipe(
  raw: CurrentInput,
  variation = 0,
): CurrentRecipe {
  const input = currentInputSchema.parse(raw);
  const terms: Record<CurrentKind, string> = {
    river: "water|river|stream",
    rain: "rain|rainfall",
    breeze: "wind|breeze",
    warmth: "warm tones|tones|warmth",
  };
  const words = input.words?.toLowerCase() || "";
  const excluded = currentKinds.filter(
    (k) =>
      input.excluded.includes(k) ||
      new RegExp(
        `(?:no|not|without|avoid|exclude)\\s+(?:any\\s+)?(?:${terms[k]})\\b`,
        "i",
      ).test(words),
  );
  const preferred = currentKinds.filter(
    (k) =>
      !excluded.includes(k) &&
      (input.preferred.includes(k) ||
        new RegExp(`\\b(?:${terms[k]})\\b`, "i").test(words)),
  );
  const allowed = currentKinds.filter((k) => !excluded.includes(k));
  if (!allowed.length)
    throw Error("Keep at least one sound available to create a mix.");
  const seed = hashCurrent(
    JSON.stringify({
      ...input,
      preferred,
      excluded,
      words: input.words?.trim() || "",
      variation,
    }),
  );
  const random = currentRandom(seed);
  // Creative starting balances, not clinical mappings or prescriptions.
  const weights = {
    focus: [0.2, 0, 0.55, 0.7],
    unwind: [0.7, 0.15, 0.2, 0.6],
    settle: [0.55, 0.1, 0.65, 0.3],
    explore: [0.5, 0.5, 0.5, 0.5],
  }[input.goal];
  let layers = currentKinds
    .filter(
      (k, i) =>
        !excluded.includes(k) && (weights[i] > 0.15 || preferred.includes(k)),
    )
    .map((kind) => ({
      kind,
      level: Math.min(
        0.9,
        Math.max(
          0.1,
          (preferred.includes(kind)
            ? 0.7
            : weights[currentKinds.indexOf(kind)] * 0.6) *
            (0.65 + input.intensity * 0.5) +
            (random() - 0.5) * 0.12,
        ),
      ),
      muted: false,
    }));
  if (!layers.length) layers = [{ kind: allowed[0], level: 0.5, muted: false }];
  const names = [
    "Morning",
    "Golden",
    "Quiet",
    "Open",
    "Soft",
    "Willow",
    "Silver",
    "Daylight",
  ];
  const places = [
    "Drift",
    "Reach",
    "Horizon",
    "Stream",
    "Grove",
    "Shore",
    "Water",
    "Clearing",
  ];
  const { words: _words, ...settings } = input;
  void _words;
  return currentRecipeSchema.parse({
    ...settings,
    preferred,
    excluded,
    version: 1,
    volume: 0.25,
    id: `current-${seed.toString(16).padStart(8, "0")}`,
    seed,
    name: `${names[seed % names.length]} ${places[(seed >>> 5) % places.length]}`,
    layers,
  });
}
export function readCurrentMixes(raw: string | null): CurrentRecipe[] {
  if (raw === null) return [];
  if (raw.length > 60000)
    throw Error(
      "Saved Current mixes could not be read. They were left unchanged.",
    );
  try {
    const parsed = z
      .array(currentRecipeSchema)
      .max(12)
      .safeParse(JSON.parse(raw));
    if (parsed.success) return parsed.data;
  } catch {
    /* Preserve unreadable storage; do not echo its content. */
  }
  throw Error(
    "Saved Current mixes could not be read. They were left unchanged.",
  );
}
