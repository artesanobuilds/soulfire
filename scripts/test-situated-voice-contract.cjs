/* eslint-disable @typescript-eslint/no-require-imports -- Node-only CommonJS evaluation harness. */
const assert = require("node:assert/strict");
const { voiceContract, fitsStage } = require("./situated-voice-contract.cjs");
const expected = {
  model: "gpt-realtime-2025-08-28",
  instructions: "frozen test prompt",
  max_output_tokens: 900,
  audio: {
    input: {
      noise_reduction: { type: "far_field" },
      transcription: { model: "gpt-4o-mini-transcribe-2025-12-15" },
      turn_detection: {
        type: "server_vad",
        silence_duration_ms: 1500,
        threshold: 0.65,
        interrupt_response: true,
        create_response: true,
      },
    },
    output: { voice: "marin" },
  },
};
const fresh = () => ({
  ready: false,
  welcomesSent: 0,
  sessions: [],
  responses: [],
  errors: [],
  injection: null,
});
const applyEvent = (s, e, t = 100) => voiceContract(s, e, t, expected);
const ready = (s) =>
  applyEvent(s, {
    type: "session.updated",
    session: structuredClone(expected),
  });
let count = 0;
function test(name, fn) {
  fn();
  count++;
  console.log("PASS " + name);
}
test("pending initial transcriber settles before welcome", () => {
  const s = fresh(),
    pending = structuredClone(expected);
  pending.audio.input.transcription = null;
  assert.equal(
    applyEvent(s, { type: "session.created", session: pending }),
    null,
  );
  assert.equal(s.ready, false);
  assert.equal(ready(s), null);
  assert.equal(s.ready, true);
});
for (const [name, change] of Object.entries({
  model: (s) => (s.model = "wrong"),
  instructions: (s) => (s.instructions = "wrong"),
  cap: (s) => (s.max_output_tokens = 1800),
  voice: (s) => (s.audio.output.voice = "wrong"),
  vad: (s) => (s.audio.input.turn_detection.silence_duration_ms = 200),
  tools: (s) => (s.tools = [{ type: "function" }]),
  transcriber: (s) => (s.audio.input.transcription.model = "wrong"),
}))
  test("rejects " + name + " drift", () => {
    const s = fresh(),
      value = structuredClone(expected);
    change(value);
    assert.ok(applyEvent(s, { type: "session.created", session: value }));
  });
test("rejects transcriber loss after readiness", () => {
  const s = fresh();
  ready(s);
  const value = structuredClone(expected);
  value.audio.input.transcription = null;
  assert.ok(applyEvent(s, { type: "session.updated", session: value }));
});
const welcome = {
  type: "harness.outgoing",
  event: {
    type: "response.create",
    response: {
      input: [],
      instructions: "Synthetic welcome",
      metadata: { purpose: "welcome" },
      max_output_tokens: 512,
    },
  },
};
test("blocks response before readiness", () =>
  assert.ok(applyEvent(fresh(), welcome)));
test("allows one bounded welcome, blocks duplicates", () => {
  const s = fresh();
  ready(s);
  assert.equal(applyEvent(s, welcome), null);
  assert.ok(applyEvent(s, welcome));
});
test("blocks unbounded welcome", () => {
  const s = fresh();
  ready(s);
  const e = structuredClone(welcome);
  e.event.response.max_output_tokens = 900;
  assert.ok(applyEvent(s, e));
});
test("blocks extra context and session mutations", () => {
  for (const type of ["session.update", "conversation.item.create"]) {
    const s = fresh();
    ready(s);
    assert.ok(applyEvent(s, { type: "harness.outgoing", event: { type } }));
  }
});
const created = (id, purpose) => ({
  type: "response.created",
  response: { id, metadata: { purpose } },
});
const done = (id) => ({
  type: "response.done",
  response: { id, status: "completed" },
});
test("complete bounded session keeps welcome and guide distinct", () => {
  const s = fresh();
  ready(s);
  applyEvent(s, welcome);
  assert.equal(applyEvent(s, created("w", "welcome")), null);
  applyEvent(s, done("w"));
  s.injection = { lastNonSilentAt: 300 };
  assert.equal(applyEvent(s, created("g"), 400), null);
  assert.equal(applyEvent(s, done("g"), 600), null);
  assert.deepEqual(
    s.responses.map((r) => r.role),
    ["welcome", "guide"],
  );
  assert.ok(applyEvent(s, created("extra"), 700));
});
test("blocks guide before full fixture", () => {
  const s = fresh();
  ready(s);
  applyEvent(s, created("w", "welcome"));
  s.injection = { lastNonSilentAt: 1000 };
  assert.ok(applyEvent(s, created("early"), 500));
});
test("incomplete output stops without retry", () => {
  const s = fresh();
  ready(s);
  applyEvent(s, created("w", "welcome"));
  assert.ok(
    applyEvent(s, {
      type: "response.done",
      response: { id: "w", status: "incomplete" },
    }),
  );
});
test("stops on output usage above the response cap", () => {
  const s = fresh();
  ready(s);
  applyEvent(s, created("w", "welcome"));
  assert.ok(
    applyEvent(s, {
      type: "response.done",
      response: { id: "w", status: "completed", usage: { output_tokens: 513 } },
    }),
  );
});
test("budget rejects overrun, NaN and negative values", () => {
  assert.equal(fitsStage(9.35, 0.55), true);
  assert.equal(fitsStage(9.36, 0.55), false);
  assert.equal(fitsStage(NaN, 0.55), false);
  assert.equal(fitsStage(0, -1), false);
});
console.log(JSON.stringify({ testsPassed: count, paidCalls: 0 }));
