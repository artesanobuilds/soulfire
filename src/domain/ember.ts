import { z } from "zod";
export const emberIntentions = {
  arrive: "Find a little space",
  focus: "Return to my attention",
  kindness: "Meet myself kindly",
  rest: "Ease toward rest",
} as const;
export const emberInputSchema = z
  .object({
    intention: z.enum(["arrive", "focus", "kindness", "rest"]),
    minutes: z.number().int().min(2).max(20),
    density: z.enum(["spacious", "balanced", "more"]),
    sound: z.enum(["quiet", "warmth", "river"]),
    voice: z.boolean(),
    rate: z.number().min(0.85).max(1.1),
    volume: z.number().min(0).max(0.8),
    soundVolume: z.number().min(0).max(0.5),
    breathing: z.enum(["natural", "comfortable"]),
  })
  .strict();
export type EmberInput = z.infer<typeof emberInputSchema>;
export const defaultEmberInput: EmberInput = {
  intention: "arrive",
  minutes: 5,
  density: "balanced",
  sound: "warmth",
  voice: true,
  rate: 1,
  volume: 0.65,
  soundVolume: 0.15,
  breathing: "natural",
};
export const emberPhrases = {
  arrival:
    "Welcome to Ember. Choose a comfortable position. Your eyes can stay open. You can pause or stop at any time. Nothing needs to be forced.",
  natural:
    "Let your breathing find its own rhythm. There is no need to make it deeper or slower. You might notice the support beneath you, or a sound in the room.",
  comfortable:
    "If it feels comfortable, allow a gentle breath in, and an easy breath out. Follow your own pace, without holding your breath. Return to natural breathing whenever you like.",
  arrive:
    "Notice something steady around you. It might be the ground, the light, or an ordinary sound. Let that be enough for this moment.",
  focus:
    "Choose one simple anchor, perhaps a sound or the feeling of your feet on the floor. When attention wanders, gently return. Wandering is part of the practice.",
  kindness:
    "You might offer yourself a few kind words. May I meet this moment with patience. If those words do not fit, choose your own, or simply rest with the sounds around you.",
  rest: "There is nothing to finish right now. Let your attention settle somewhere comfortable. You can keep your eyes open, change position, or stop whenever you wish.",
  space:
    "There is some space here to practice in your own way. Let the sounds come and go. You do not need to empty your mind.",
  return:
    "If you have become distracted, there is no need to start over. Notice where you are, and gently choose what to attend to next.",
  close:
    "As this practice comes to a close, notice the room around you. You might move your fingers, look toward the light, and take your time with whatever comes next.",
  restClose:
    "The guidance will end here. You can keep resting, or stop and return to your day in your own time. Nothing more is asked of you.",
} as const;
export type EmberPhrase = keyof typeof emberPhrases;
export type EmberCue = {
  id: EmberPhrase;
  text: string;
  start: number;
  seconds: number;
};
export type EmberSession = {
  input: EmberInput;
  name: string;
  cues: EmberCue[];
  seconds: number;
};
export function createEmberSession(
  raw: EmberInput,
  durations: Record<EmberPhrase, number>,
): EmberSession {
  const input = emberInputSchema.parse(raw),
    seconds = input.minutes * 60;
  const ids: EmberPhrase[] = ["arrival", input.breathing, input.intention];
  if (input.density !== "spacious") ids.push("space");
  if (input.density === "more") ids.push("return", "space");
  ids.push(input.intention === "rest" ? "restClose" : "close");
  const spoken = ids.reduce((n, id) => n + durations[id] / input.rate, 0);
  if (
    ids.some((id) => !Number.isFinite(durations[id]) || durations[id] <= 0) ||
    spoken > seconds - 10
  )
    throw Error(
      "Choose a longer session or less guidance for this voice speed.",
    );
  const gap = (seconds - spoken) / (ids.length - 1);
  let position = 0;
  const cues = ids.map((id, index) => {
    const cue = {
      id,
      text: emberPhrases[id],
      start: position,
      seconds: durations[id] / input.rate,
    };
    position += cue.seconds + (index < ids.length - 1 ? gap : 0);
    return cue;
  });
  return {
    input,
    name: {
      arrive: "A little room",
      focus: "A steady return",
      kindness: "A kinder moment",
      rest: "Soft landing",
    }[input.intention],
    cues,
    seconds,
  };
}
export const emberStorageKey = "soulfire.ember.preferences.v1";
export function readEmberPreferences(raw: string | null): EmberInput | null {
  if (!raw) return null;
  if (raw.length > 2000) throw Error("Saved preferences are unreadable.");
  return emberInputSchema.parse(JSON.parse(raw));
}
