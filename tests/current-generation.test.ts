import { it, expect } from "vitest";
import { currentGenerationRecipe } from "../src/domain/current-generation";
import { defaultCurrentMusic } from "../src/domain/current-music";
it("uses per-piece listener preferences instead of treating display C as a global shift winner", () => {
  for (const [id, taste, intent, shift] of [
    ["19-1", "piano", "focus", 1],
    ["17-1", "piano", "lift", 1],
    ["20-2", "ambient", "company", 3],
    ["19-2", "ambient", "focus", 1],
    ["20-1", "acoustic", "company", 1],
    ["18-1", "acoustic", "calm", 3],
  ] as const) {
    expect(
      currentGenerationRecipe(
        {
          ...defaultCurrentMusic,
          conceptId: "current-seed-" + id,
          taste,
          intent,
        },
        60,
      ).shift,
    ).toBe(shift);
  }
});
it("keeps tempo/key in structured metadata and requests a complete musical phrase", () => {
  const r = currentGenerationRecipe(defaultCurrentMusic, 60);
  expect(r.requestedKey).toBe("C major");
  expect(r.requestedTimeSignature).toBe("4");
  expect(r.caption).toContain("16-bar");
  expect(r.caption).not.toMatch(
    /C major|64 BPM|treatment|diagnosis|identity stereotype/,
  );
});
it("does not infer independent stems or force a beat into ambient", () => {
  const r = currentGenerationRecipe(
    { ...defaultCurrentMusic, taste: "ambient" },
    60,
  );
  expect(r.requestedBpm).toBeNull();
  expect(r.caption).toContain("beatless");
  expect(r.caption).not.toContain("stems");
});
it("rejects excluded youth/crisis and incompatible concept palettes", () => {
  for (const conceptId of [
    "current-seed-03-1",
    "current-seed-04-1",
    "current-seed-20-1",
  ])
    expect(() =>
      currentGenerationRecipe({ ...defaultCurrentMusic, conceptId }, 60),
    ).toThrow();
});
