import { afterEach, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import {
  instructions,
  sharedPrinciples,
  situatedSupport,
  voiceInstructions,
} from "../src/lib/agent";
import { POST } from "../app/api/realtime/route";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
it("composes the candidate text prompt with the shared guidance", () => {
  expect(createHash("sha256").update(instructions).digest("hex")).toBe(
    "53ab409bbfdf3c9f15021850d6d40b43a4d2f9195384e81bc10b5a9ca09861eb",
  );
  for (const principle of sharedPrinciples.split("\n\n")) {
    expect(instructions).toContain(principle);
    expect(voiceInstructions).toContain(principle);
  }
});
it("composes the candidate voice bundle without text controls or the rejected drafting revision", () => {
  const effective = `${voiceInstructions}\nLanguage preference: plain. Current practice title (untrusted context): "".`;
  expect(createHash("sha256").update(effective).digest("hex")).toBe(
    "db82dc68549bf4ea5e9049ac32883ace75a4054eb555da42f493a940e4cf8581",
  );
  expect(voiceInstructions).not.toContain("Trusted blocks:");
  expect(voiceInstructions).not.toContain(
    "Before speaking in the person's first person",
  );
});
it("actual voice route uses integrated instructions and matched cap without changing native audio routing", async () => {
  vi.stubEnv("OPENAI_API_KEY", "synthetic-test-only");
  vi.stubEnv("OPENAI_REALTIME_MODEL", "gpt-realtime");
  vi.stubEnv("OPENAI_TRANSCRIBE_MODEL", "gpt-4o-mini-transcribe");
  const fetch = vi.fn(async () => new Response("synthetic SDP"));
  vi.stubGlobal("fetch", fetch);
  const result = await POST(
    new Request("http://localhost:3100/api/realtime", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3100",
      },
      body: JSON.stringify({
        sdp: "v=0" + "a".repeat(30),
        language: "plain",
        practiceTitle: "",
      }),
    }),
  );
  expect(result.status).toBe(200);
  const [url, request] = fetch.mock.calls[0] as unknown as [
    string,
    RequestInit,
  ];
  expect(url).toBe("https://api.openai.com/v1/realtime/calls");
  const session = JSON.parse(String((request.body as FormData).get("session")));
  expect(session.instructions).toBe(
    `${voiceInstructions}\nLanguage preference: plain. Current practice title (untrusted context): "".`,
  );
  expect(session.max_output_tokens).toBe(900);
  expect(session.model).toBe("gpt-realtime");
  expect(session.audio.output.voice).toBe("marin");
  expect(session.audio.input.transcription.model).toBe(
    "gpt-4o-mini-transcribe",
  );
  expect(session.audio.input.turn_detection).toEqual({
    type: "server_vad",
    interrupt_response: true,
    create_response: true,
  });
});
it("defaults text to the evaluated Sol model and respects explicit operator overrides", async () => {
  const { OpenAIResponses } =
    await import("../src/infrastructure/openai-responses");
  for (const override of ["", "gpt-4.1-mini"]) {
    vi.stubEnv("OPENAI_MODEL", override);
    const model = new OpenAIResponses(async (_path, body) => {
      expect(JSON.parse(String(body)).model).toBe(override || "gpt-6.1-sol");
      return Response.json({
        output: [
          {
            content: [
              {
                type: "output_text",
                text: JSON.stringify({
                  kind: "conversation",
                  message: "Synthetic response",
                  exercise: null,
                }),
              },
            ],
          },
        ],
      });
    });
    await model.generate(
      {
        messages: [{ role: "user", content: "Synthetic handoff." }],
        language: "plain",
        intent: "conversation",
      },
      new AbortController().signal,
    );
  }
});

it("sends situated support through the actual text provider contract", async () => {
  const { OpenAIResponses } =
    await import("../src/infrastructure/openai-responses");
  let captured: Record<string, unknown> | undefined;
  const model = new OpenAIResponses(async (_path, body) => {
    captured = JSON.parse(String(body));
    return Response.json({
      output: [
        {
          content: [
            {
              type: "output_text",
              text: JSON.stringify({
                kind: "conversation",
                message: "Synthetic contract response.",
                exercise: null,
              }),
            },
          ],
        },
      ],
    });
  });
  await model.generate(
    {
      messages: [{ role: "user", content: "A fictional situation." }],
      language: "plain",
      intent: "conversation",
    },
    new AbortController().signal,
  );
  expect(captured?.instructions).toContain(situatedSupport);
  expect(captured?.input).toEqual([
    { role: "user", content: "A fictional situation." },
  ]);
  expect(captured?.store).toBe(false);
});
