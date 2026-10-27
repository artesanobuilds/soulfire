import { expect, test } from "vitest";
import { classifyVoiceError } from "../src/lib/voice-reliability";
test("only the completed-response cancellation race is nonfatal", () => {
  expect(classifyVoiceError({ code: "response_cancel_not_active" }).fatal).toBe(
    false,
  );
  for (const value of [
    null,
    "secret",
    {},
    { code: "future_error" },
    { code: "server_error" },
    { code: "rate_limit_exceeded" },
  ])
    expect(classifyVoiceError(value).fatal).toBe(true);
});
test("diagnostics never retain arbitrary provider content", () => {
  const result = classifyVoiceError({
    code: "PRIVATE-CODE",
    message: "PRIVATE-MESSAGE",
    event: { transcript: "PRIVATE-TEXT" },
  });
  expect(JSON.stringify(result)).toBe('{"fatal":true,"category":"unknown"}');
});
