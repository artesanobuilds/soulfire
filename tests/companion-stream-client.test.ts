import { describe, it, expect } from "vitest";
import { readCompanionStream } from "../src/lib/companion-stream-client";
function response(chunks: string[]) {
  return new Response(
    new ReadableStream({
      start(c) {
        chunks.forEach((x) => c.enqueue(new TextEncoder().encode(x)));
        c.close();
      },
    }),
  );
}
describe("browser companion SSE reader", () => {
  it("handles chunk boundaries, CRLF and final result", async () => {
    const deltas: string[] = [];
    const data = await readCompanionStream(
      response([
        "event: message_delta\r",
        '\ndata: {"delta":"Hello"}\r\n\r',
        '\nevent: result\r\ndata: {"reply":{"message":"Hello"}}\r\n\r\n',
      ]),
      (x) => deltas.push(x),
    );
    expect(deltas).toEqual(["Hello"]);
    expect(data).toEqual({ reply: { message: "Hello" } });
  });
  it("requires a final validated result", async () => {
    await expect(
      readCompanionStream(
        response(['event: message_delta\ndata: {"delta":"partial"}\n\n']),
        () => {},
      ),
    ).rejects.toThrow("interrupted");
  });
  it("propagates sanitized endpoint errors", async () => {
    await expect(
      readCompanionStream(
        response(['event: error\ndata: {"error":"Please try again."}\n\n']),
        () => {},
      ),
    ).rejects.toThrow("Please try again.");
  });
  it("rejects extra events after result", async () => {
    await expect(
      readCompanionStream(
        response(["event: result\ndata: {}\n\nevent: result\ndata: {}\n\n"]),
        () => {},
      ),
    ).rejects.toThrow("inconsistent");
  });
});

it("preserves streamed error status for invalid history recovery", async () => {
  await expect(
    readCompanionStream(
      response([
        'event: error\ndata: {"error":"Session unavailable","status":409}\n\n',
      ]),
      () => {},
    ),
  ).rejects.toMatchObject({ status: 409 });
});

it("rejects malformed event data without displaying raw payloads", async () => {
  await expect(
    readCompanionStream(
      response(["event: result\ndata: PRIVATE_INVALID_JSON\n\n"]),
      () => {},
    ),
  ).rejects.toThrow("could not be read safely");
});
