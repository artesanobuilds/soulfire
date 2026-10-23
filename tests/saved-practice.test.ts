import { describe, it, expect } from "vitest";
import { readSavedPractice } from "../src/lib/saved-practice";
import { samples } from "../src/lib/catalog";
const saved = {
  version: 1,
  exercise: samples.worry,
  example: true,
  fields: { reflection: "private" },
  cards: {},
  action: "one step",
  reflection: "my words",
  language: "plain",
  practiceStep: 1,
  view: "practice",
};
describe("saved practice recovery", () => {
  it("round-trips a bounded practice without conversation or sharing consent", () => {
    expect(readSavedPractice(JSON.stringify(saved))).toEqual(saved);
    expect(
      readSavedPractice(
        JSON.stringify({
          ...saved,
          messages: [{ role: "user", content: "private conversation" }],
        }),
      ),
    ).toBeNull();
  });
  it("rejects corrupt, oversized, outdated and unsafe component data", () => {
    for (const raw of [
      null,
      "{",
      "x".repeat(60001),
      JSON.stringify({ ...saved, version: 2 }),
      JSON.stringify({ ...saved, action: "x".repeat(601) }),
      JSON.stringify({
        ...saved,
        exercise: {
          ...saved.exercise,
          blocks: [{ type: "html", html: "<script>" }],
        },
      }),
    ])
      expect(readSavedPractice(raw)).toBeNull();
  });
});
