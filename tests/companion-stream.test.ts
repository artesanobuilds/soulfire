import { afterEach, describe, expect, it, vi } from "vitest";
import {
  partialMessage,
  readSseData,
} from "../src/infrastructure/companion-stream";
import { OpenAIResponses } from "../src/infrastructure/openai-responses";
import {
  runCompanion,
  type CompanionInput,
} from "../src/application/companion";
import { runRecordedCompanion } from "../src/application/recorded-companion";
import type { MemoryRepository } from "../src/domain/memory";
import { HistoryError, type HistoryRepository } from "../src/domain/history";
import * as historyStorage from "../src/infrastructure/sqlite-history";
import { POST } from "../app/api/companion/route";

const input: CompanionInput = {
  messages: [{ role: "user", content: "A fictional pottery class tomorrow." }],
  language: "plain",
  intent: "conversation",
};
const reply = {
  message: "Let's take a breath 🌿.\nWhat feels hardest?",
  kind: "conversation",
  exercise: null,
};
const memory = {
  read: vi.fn(async () => ({ revision: 0, memory: null })),
} as unknown as MemoryRepository;
const encoder = new TextEncoder();
const frame = (event: unknown) =>
  encoder.encode(`data: ${JSON.stringify(event)}\r\n\r\n`);
const completed = (json: string) => ({
  type: "response.completed",
  response: {
    status: "completed",
    model: "mock-model",
    id: "resp_mock",
    output: [{ content: [{ type: "output_text", text: json }] }],
  },
});
function source() {
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  const cancel = vi.fn();
  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;
    },
    cancel,
  });
  return {
    stream,
    cancel,
    push: (event: unknown) => controller.enqueue(frame(event)),
    close: () => controller.close(),
  };
}
function transportFor(body: ReadableStream<Uint8Array>) {
  return vi.fn(async () => new Response(body));
}
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("incremental structured conversation", () => {
  it("projects only top-level text, handles every split, escapes and surrogate pairs", () => {
    const text = 'Hi "friend" \\ 🌿\nnext';
    const json = JSON.stringify({
      exercise: { message: "PRIVATE EXERCISE" },
      message: text,
      kind: "conversation",
    });
    let previous = "";
    for (let i = 0; i <= json.length; i++) {
      const current = partialMessage(json.slice(0, i));
      expect(current.startsWith(previous)).toBe(true);
      expect(text.startsWith(current)).toBe(true);
      previous = current;
    }
    expect(previous).toBe(text);
    expect(partialMessage('{"message":"a\\uD83C')).toBe("a");
    expect(partialMessage('{"message":"a\\uD83C\\uDF3F')).toBe("a🌿");
  });
  it("decodes byte-split UTF-8, CRLF and multiple data lines", async () => {
    const bytes = encoder.encode(
      "event: test\r\ndata: 🌿\r\ndata: two\r\n\r\n",
    );
    const stream = new ReadableStream<Uint8Array>({
      start(c) {
        for (const byte of bytes) c.enqueue(Uint8Array.of(byte));
        c.close();
      },
    });
    const records = [];
    for await (const data of readSseData(stream, new AbortController().signal))
      records.push(data);
    expect(records).toEqual(["🌿\ntwo"]);
  });
  it("delivers actual deltas before provider completion, then validates final JSON", async () => {
    const upstream = source();
    const transport = transportFor(upstream.stream);
    const deltas: string[] = [];
    let first!: () => void;
    const arrived = new Promise<void>((resolve) => {
      first = resolve;
    });
    let settled = false;
    const pending = runCompanion(
      input,
      new AbortController().signal,
      new OpenAIResponses(transport),
      memory,
      undefined,
      (delta) => {
        deltas.push(delta);
        first();
      },
    ).then((result) => {
      settled = true;
      return result;
    });
    const json = JSON.stringify(reply);
    upstream.push({
      type: "response.output_text.delta",
      delta: json.slice(0, 20),
    });
    await arrived;
    expect(settled).toBe(false);
    expect(deltas.join("")).toBe(reply.message.slice(0, 8));
    upstream.push({
      type: "response.output_text.delta",
      delta: json.slice(20),
    });
    upstream.push(completed(json));
    expect((await pending).reply).toEqual(reply);
    expect(deltas.join("")).toBe(reply.message);
    const body = JSON.parse(
      (transport.mock.calls as unknown as [string, string][])[0][1],
    );
    expect(body).toMatchObject({
      stream: true,
      store: false,
      max_output_tokens: 2200,
    });
    expect(transport).toHaveBeenCalledTimes(1);
    expect(memory.read).not.toHaveBeenCalled();
  });
  it.each([
    "eof",
    "response.incomplete",
    "response.failed",
    "response.refusal.delta",
    "invalid",
    "changed",
  ])("never accepts %s as a final reply", async (mode) => {
    const upstream = source();
    const json = JSON.stringify(
      mode === "invalid" ? { ...reply, exercise: { unsafe: true } } : reply,
    );
    const pending = runCompanion(
      input,
      new AbortController().signal,
      new OpenAIResponses(transportFor(upstream.stream)),
      memory,
      undefined,
      () => {},
    );
    upstream.push({ type: "response.output_text.delta", delta: json });
    if (mode === "invalid" || mode === "changed")
      upstream.push(
        completed(mode === "changed" ? json.replace("breath", "pause") : json),
      );
    else if (mode !== "eof") upstream.push({ type: mode });
    upstream.close();
    await expect(pending).rejects.toThrow();
  });
  it("abort cancels a stalled reader without retries or completion", async () => {
    const upstream = source();
    const transport = transportFor(upstream.stream);
    const abort = new AbortController();
    const pending = new OpenAIResponses(transport).generate(
      input,
      abort.signal,
      () => {},
    );
    await Promise.resolve();
    abort.abort();
    await expect(pending).rejects.toThrow();
    expect(transport).toHaveBeenCalledTimes(1);
    expect(upstream.cancel).toHaveBeenCalled();
  });
  it("rejects practice offers from alternate providers during private reflection", async () => {
    const generate = vi.fn(async () => ({
      reply: {
        ...reply,
        practiceOffer: { kind: "exercise", label: "Try a practice" },
      },
      model: "mock",
    }));
    await expect(
      runCompanion(
        {
          ...input,
          intent: "reflection",
          useMemory: true,
          messages: [
            ...input.messages,
            { role: "assistant", content: "Prior conversation" },
            { role: "user", content: "Only this explicitly shared answer" },
          ],
        },
        new AbortController().signal,
        { name: "mock", generate },
        memory,
      ),
    ).rejects.toThrow("Private reflection");
    expect(memory.read).not.toHaveBeenCalled();
    expect(
      (generate.mock.calls as unknown as [{ messages: unknown[] }][])[0][0]
        .messages,
    ).toEqual([
      { role: "user", content: "Only this explicitly shared answer" },
    ]);
  });
  it("deterministic safety bypasses the provider and emits no provisional content", async () => {
    const model = { name: "mock", generate: vi.fn() };
    const delta = vi.fn();
    const result = await runCompanion(
      {
        ...input,
        messages: [
          { role: "user", content: "I am going to kill myself tonight" },
        ],
      },
      new AbortController().signal,
      model,
      memory,
      undefined,
      delta,
    );
    expect(result.reply.kind).toBe("support");
    expect(model.generate).not.toHaveBeenCalled();
    expect(delta).not.toHaveBeenCalled();
  });
  it("records submitted user text but never persists invalid provisional assistant text", async () => {
    const append = vi.fn(async () => ({ duplicates: 0, inserted: 1 }));
    const model = {
      name: "mock",
      generate: vi.fn(async (_input, _signal, delta) => {
        delta?.("Provisional only");
        return { reply: { message: "invalid" }, model: "mock" };
      }),
    };
    await expect(
      runRecordedCompanion(
        input,
        new AbortController().signal,
        model,
        memory,
        {
          owner: "synthetic",
          sessionId: "synthetic",
          turnKey: "synthetic",
          repository: { append } as unknown as HistoryRepository,
        },
        () => {},
      ),
    ).rejects.toThrow();
    expect(
      append.mock.calls
        .flatMap(
          (call) =>
            (
              call as unknown as [
                string,
                string,
                { role?: string; kind: string }[],
              ]
            )[2],
        )
        .map((event) => event.role || event.kind),
    ).toEqual(["user", "error"]);
  });
});

describe("companion endpoint negotiation", () => {
  const request = (stream = false) =>
    new Request("http://localhost:3100/api/companion", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(stream ? { Accept: "text/event-stream" } : {}),
      },
      body: JSON.stringify(input),
    });
  it("preserves the JSON API when streaming was not requested", async () => {
    vi.stubEnv("OPENAI_API_KEY", "synthetic-key");
    const fetch = vi.fn(async () =>
      Response.json(completed(JSON.stringify(reply)).response),
    );
    vi.stubGlobal("fetch", fetch);
    const response = await POST(request());
    expect(response.headers.get("content-type")).toContain("application/json");
    expect((await response.json()).reply).toEqual(reply);
    expect(
      JSON.parse(
        (fetch.mock.calls as unknown as [string, RequestInit][])[0][1]
          .body as string,
      ).stream,
    ).toBeUndefined();
  });
  it("streams deltas and a validated terminal result over the endpoint", async () => {
    vi.stubEnv("OPENAI_API_KEY", "synthetic-key");
    const upstream = source();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(upstream.stream)),
    );
    const response = await POST(request(true));
    const reading = response.text();
    const json = JSON.stringify(reply);
    upstream.push({ type: "response.output_text.delta", delta: json });
    upstream.push(completed(json));
    const text = await reading;
    expect(text.indexOf("event: message_delta")).toBeLessThan(
      text.indexOf("event: result"),
    );
    expect(text).toContain('"reply":');
    expect(text).not.toContain("event: error");
    expect(upstream.cancel).toHaveBeenCalled();
  });
  it("canceling the client stream releases the upstream reader", async () => {
    vi.stubEnv("OPENAI_API_KEY", "synthetic-key");
    const upstream = source();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(upstream.stream)),
    );
    const response = await POST(request(true));
    await response.body!.cancel();
    expect(upstream.cancel).toHaveBeenCalled();
  });
  it("a stream deadline yields a sanitized terminal error and releases the reader", async () => {
    vi.useFakeTimers();
    try {
      vi.stubEnv("OPENAI_API_KEY", "synthetic-key");
      const upstream = source();
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => new Response(upstream.stream)),
      );
      // Stub only timeout creation; no provider call or real 45-second delay.
      const deadline = new AbortController();
      const timeout = vi
        .spyOn(AbortSignal, "timeout")
        .mockReturnValue(deadline.signal);
      try {
        const response = await POST(request(true));
        const reading = response.text();
        deadline.abort(new DOMException("Timed out", "TimeoutError"));
        const text = await reading;
        expect(text).toContain("event: error");
        expect(text).toContain("timed out");
        expect(text).not.toContain("event: result");
        expect(upstream.cancel).toHaveBeenCalled();
      } finally {
        timeout.mockRestore();
      }
    } finally {
      vi.useRealTimers();
    }
  });
  it.each([404, 409])(
    "preserves history status %s in terminal SSE errors",
    async (status) => {
      const message =
        status === 404
          ? "History session not found."
          : "History recording is paused.";
      const append = vi.fn(async () => {
        throw new HistoryError(status, message);
      });
      const storage = vi
        .spyOn(historyStorage, "localHistory")
        .mockReturnValue({ append } as unknown as ReturnType<
          typeof historyStorage.localHistory
        >);
      const fetch = vi.fn();
      vi.stubGlobal("fetch", fetch);
      try {
        const response = await POST(
          new Request("http://localhost:3100/api/companion", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "text/event-stream",
              Cookie: `soulfire_history=${"a".repeat(43)}`,
            },
            body: JSON.stringify({
              ...input,
              history: {
                sessionId: "00000000-0000-4000-8000-000000000001",
                turnKey: "00000000-0000-4000-8000-000000000002",
              },
            }),
          }),
        );
        expect(response.status).toBe(200);
        const text = await response.text();
        expect(text).toContain("event: error");
        const data = text
          .split("\n")
          .find((line) => line.startsWith("data: "))!;
        expect(JSON.parse(data.slice(6))).toEqual({ error: message, status });
        expect(text).not.toContain("event: result");
        expect(text).not.toContain("event: message_delta");
        expect(append).toHaveBeenCalledTimes(1);
        expect(fetch).not.toHaveBeenCalled();
      } finally {
        storage.mockRestore();
      }
    },
  );
  it("sends a sanitized terminal SSE error, never raw provider error details", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("PRIVATE SECRET DATA");
      }),
    );
    vi.stubEnv("OPENAI_API_KEY", "synthetic-key");
    const response = await POST(request(true));
    expect(response.headers.get("content-type")).toContain("text/event-stream");
    const text = await response.text();
    expect(text).toContain("event: error");
    expect(text).not.toContain("PRIVATE SECRET");
    expect(text).not.toContain("event: result");
  });
});
