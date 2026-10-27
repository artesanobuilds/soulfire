import { expect, test } from "vitest";
import {
  createCurrentRecipe,
  defaultCurrentInput,
  currentRecipeSchema,
  readCurrentMixes,
  currentRandom,
  currentKinds,
} from "../src/domain/current";

test("same explicit choices and variation reproduce the complete recipe", () => {
  expect(createCurrentRecipe(defaultCurrentInput, 3)).toEqual(
    createCurrentRecipe(defaultCurrentInput, 3),
  );
  expect(createCurrentRecipe(defaultCurrentInput, 4).seed).not.toBe(
    createCurrentRecipe(defaultCurrentInput, 3).seed,
  );
  const a = currentRandom(123),
    b = currentRandom(123);
  expect(Array.from({ length: 100 }, () => a())).toEqual(
    Array.from({ length: 100 }, () => b()),
  );
});
test("goals, taste, intensity and texture settings meaningfully change recipes", () => {
  const original = createCurrentRecipe(defaultCurrentInput);
  const focused = createCurrentRecipe({
    ...defaultCurrentInput,
    goal: "focus",
  });
  expect(original.layers.map((l) => l.level)).not.toEqual(
    focused.layers.map((l) => l.level),
  );
  const quiet = createCurrentRecipe({ ...defaultCurrentInput, intensity: 0 });
  expect(quiet.layers.reduce((s, l) => s + l.level, 0)).toBeLessThan(
    original.layers.reduce((s, l) => s + l.level, 0),
  );
  expect(
    createCurrentRecipe({
      ...defaultCurrentInput,
      brightness: 0.9,
      movement: 0,
    }).brightness,
  ).toBe(0.9);
  expect(
    createCurrentRecipe({
      ...defaultCurrentInput,
      brightness: 0.9,
      movement: 0,
    }).movement,
  ).toBe(0);
});
test("explicit exclusions always win over preferred sounds and word matches", () => {
  const recipe = createCurrentRecipe({
    ...defaultCurrentInput,
    preferred: ["rain", "warmth"],
    excluded: ["rain"],
    words: "rain and warm tones",
  });
  expect(recipe.layers.some((l) => l.kind === "rain")).toBe(false);
  expect(recipe.preferred).not.toContain("rain");
  expect(recipe.layers.some((l) => l.kind === "warmth")).toBe(true);
});
test("simple negative sound words are reflected in actual ingredients", () => {
  const recipe = createCurrentRecipe({
    ...defaultCurrentInput,
    words: "water and warmth, no rain, avoid wind",
  });
  expect(recipe.excluded).toEqual(["rain", "breeze"]);
  expect(recipe.layers.map((l) => l.kind)).toEqual(["river", "warmth"]);
});
test("excluding all available sounds gives a recoverable input error", () => {
  expect(() =>
    createCurrentRecipe({
      ...defaultCurrentInput,
      excluded: [...currentKinds],
    }),
  ).toThrow("at least one sound");
});
test("private optional words never enter recipes or saved storage", () => {
  const recipe = createCurrentRecipe({
    ...defaultCurrentInput,
    words: "PRIVATE-CONTEXT-ONLY",
  });
  const serialized = JSON.stringify(recipe);
  expect(serialized).not.toContain("PRIVATE-CONTEXT-ONLY");
  expect(serialized).not.toContain('"words"');
  expect(readCurrentMixes(JSON.stringify([recipe]))).toEqual([recipe]);
});
test("saved mixes retain editable levels, duration, mute and safe master volume", () => {
  const recipe = createCurrentRecipe(defaultCurrentInput);
  recipe.volume = 0.4;
  recipe.minutes = 30;
  recipe.layers[0].muted = true;
  recipe.layers[0].level = 0.2;
  expect(readCurrentMixes(JSON.stringify([recipe]))[0]).toEqual(recipe);
  expect(currentRecipeSchema.safeParse({ ...recipe, volume: 5 }).success).toBe(
    false,
  );
  expect(
    currentRecipeSchema.safeParse({ ...recipe, minutes: 500 }).success,
  ).toBe(false);
});
test("invalid or oversized stored recipes are rejected without accepting unsafe graph parameters", () => {
  const recipe = createCurrentRecipe(defaultCurrentInput);
  for (const invalid of [
    "{broken",
    JSON.stringify([{ ...recipe, seed: -1 }]),
    JSON.stringify([
      { ...recipe, layers: [recipe.layers[0], recipe.layers[0]] },
    ]),
    JSON.stringify([{ ...recipe, excluded: [recipe.layers[0].kind] }]),
    "a".repeat(60001),
  ])
    expect(() => readCurrentMixes(invalid)).toThrow();
  expect(readCurrentMixes(null)).toEqual([]);
});
test("recipe validation bounds all user-controlled values and layer gains", () => {
  for (const goal of ["focus", "unwind", "settle", "explore"] as const)
    for (let i = 0; i < 20; i++) {
      const recipe = createCurrentRecipe(
        { ...defaultCurrentInput, goal, intensity: i / 20 },
        i,
      );
      expect(currentRecipeSchema.safeParse(recipe).success).toBe(true);
      expect(recipe.layers.every((l) => l.level >= 0 && l.level <= 1)).toBe(
        true,
      );
    }
});
