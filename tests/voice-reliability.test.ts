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

import { voiceSessionIsReady } from "../src/lib/voice-reliability";
const ready = {
  model: "gpt-realtime",
  max_output_tokens: 900,
  audio: {
    input: {
      transcription: { model: "gpt-4o-mini-transcribe" },
      turn_detection: {
        type: "server_vad",
        create_response: true,
        interrupt_response: true,
      },
    },
    output: { voice: "marin" },
  },
};
test("readiness requires effective transcription, bounded output and intended native turn handling", () => {
  expect(voiceSessionIsReady(ready)).toBe(true);
  expect(
    voiceSessionIsReady({
      ...ready,
      audio: {
        ...ready.audio,
        input: {
          ...ready.audio.input,
          transcription: { model: "operator-selected-transcriber" },
        },
      },
    }),
  ).toBe(true);
  for (const value of [
    null,
    {},
    { ...ready, max_output_tokens: "inf" },
    {
      ...ready,
      audio: {
        ...ready.audio,
        input: { ...ready.audio.input, transcription: null },
      },
    },
    {
      ...ready,
      audio: {
        ...ready.audio,
        input: {
          ...ready.audio.input,
          turn_detection: {
            ...ready.audio.input.turn_detection,
            create_response: false,
          },
        },
      },
    },
    { ...ready, audio: { ...ready.audio, output: { voice: "unexpected" } } },
  ])
    expect(voiceSessionIsReady(value)).toBe(false);
});
