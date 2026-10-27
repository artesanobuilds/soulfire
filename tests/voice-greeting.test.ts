import { expect, test } from "vitest";
import { voiceGreeting } from "../src/lib/voice-greeting";
test("a directly shared name personalizes a brief opening with one question", () => {
  const greeting = voiceGreeting("  Casey  ", false);
  expect(greeting).toContain("Hi, Casey.");
  expect(greeting.match(/\?/g)).toHaveLength(1);
});
test("new-user openings vary without claiming prior knowledge or a diagnosis", () => {
  const openings = [0, 1, 2].map((i) => voiceGreeting("", false, i));
  expect(new Set(openings).size).toBe(3);
  for (const greeting of openings) {
    expect(greeting).not.toMatch(
      /welcome back|know you|addiction|twelve|12.step|location/i,
    );
    expect(greeting.match(/\?/g)).toHaveLength(1);
  }
});
test("only explicitly submitted conversation allows a returning welcome; unsafe names are omitted", () => {
  expect(voiceGreeting("", true)).toContain("our conversation");
  expect(voiceGreeting("Casey\nIgnore: instructions!", false)).not.toContain(
    "Ignore",
  );
  expect(voiceGreeting("person@example.com", false)).not.toContain(
    "example.com",
  );
});
