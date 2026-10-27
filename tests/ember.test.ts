import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  createEmberSession,
  defaultEmberInput,
  emberPhrases,
  emberInputSchema,
  readEmberPreferences,
  type EmberPhrase,
} from "../src/domain/ember";
import recording from "../src/lib/ember-recording.json";
const durations = Object.fromEntries(
  Object.entries(recording.clips).map(([id, clip]) => [id, clip.seconds]),
) as Record<EmberPhrase, number>;
describe("Ember bounded local guidance", () => {
  it("builds a reproducible complete timeline with genuine silence and exact duration", () => {
    const s = createEmberSession(defaultEmberInput, durations);
    expect(createEmberSession(defaultEmberInput, durations)).toEqual(s);
    expect(s.cues[0].start).toBe(0);
    expect(s.cues.at(-1)!.start + s.cues.at(-1)!.seconds).toBeCloseTo(300);
    for (let i = 1; i < s.cues.length; i++)
      expect(
        s.cues[i].start - s.cues[i - 1].start - s.cues[i - 1].seconds,
      ).toBeGreaterThan(1);
  });
  it("intentions select distinct appropriate scripts without private context", () => {
    const focus = createEmberSession(
      { ...defaultEmberInput, intention: "focus" },
      durations,
    );
    const rest = createEmberSession(
      { ...defaultEmberInput, intention: "rest" },
      durations,
    );
    expect(focus.cues.some((c) => c.id === "focus")).toBe(true);
    expect(rest.cues.at(-1)!.id).toBe("restClose");
    expect(rest.cues.some((c) => c.id === "close")).toBe(false);
  });
  it("guidance density changes silence and comfortable breathing is opt-in", () => {
    const less = createEmberSession(
      { ...defaultEmberInput, density: "spacious" },
      durations,
    );
    const more = createEmberSession(
      { ...defaultEmberInput, density: "more", breathing: "comfortable" },
      durations,
    );
    expect(more.cues.length).toBeGreaterThan(less.cues.length);
    expect(less.cues[1].id).toBe("natural");
    expect(more.cues[1].id).toBe("comfortable");
  });
  it("all supported short and slow combinations fit without overlapping guidance", () => {
    for (const density of ["spacious", "balanced", "more"] as const)
      for (const intention of Object.keys({
        arrive: 1,
        focus: 1,
        kindness: 1,
        rest: 1,
      }) as (typeof defaultEmberInput.intention)[]) {
        const s = createEmberSession(
          {
            ...defaultEmberInput,
            minutes: 2,
            rate: 0.85,
            density,
            intention,
            breathing: "comfortable",
          },
          durations,
        );
        for (let i = 1; i < s.cues.length; i++)
          expect(s.cues[i].start).toBeGreaterThan(
            s.cues[i - 1].start + s.cues[i - 1].seconds,
          );
      }
  });
  it("does not accept health notes, unsafe volumes or unbounded durations", () => {
    for (const patch of [
      { health: "private" },
      { minutes: 0 },
      { minutes: 21 },
      { rate: 3 },
      { volume: 1 },
      { soundVolume: 1 },
    ])
      expect(
        emberInputSchema.safeParse({ ...defaultEmberInput, ...patch }).success,
      ).toBe(false);
  });
  it("saves only validated explicit settings and rejects corruption", () => {
    expect(readEmberPreferences(null)).toBeNull();
    expect(readEmberPreferences(JSON.stringify(defaultEmberInput))).toEqual(
      defaultEmberInput,
    );
    expect(() => readEmberPreferences("{bad")).toThrow();
    expect(() =>
      readEmberPreferences(
        JSON.stringify({ ...defaultEmberInput, transcript: "private" }),
      ),
    ).toThrow();
  });
  it("every spoken asset matches its complete caption and content hash", () => {
    for (const [id, clip] of Object.entries(recording.clips)) {
      expect(clip.text).toBe(emberPhrases[id as EmberPhrase]);
      expect(clip.seconds).toBeGreaterThan(1);
      const bytes = readFileSync("public" + clip.path);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(
        clip.sha256,
      );
    }
    expect(recording.directListening).toBe(false);
  });
  it("invalid clip timing fails closed rather than inventing a schedule", () => {
    expect(() =>
      createEmberSession(defaultEmberInput, { ...durations, arrival: NaN }),
    ).toThrow();
    expect(() =>
      createEmberSession(defaultEmberInput, { ...durations, arrival: 400 }),
    ).toThrow();
  });
});
