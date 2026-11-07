export class CompanionStreamError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

/** Consume a bounded SSE response. A final result is required before callers commit state. */
export async function readCompanionStream(
  response: Response,
  onDelta: (text: string) => void,
): Promise<unknown> {
  if (!response.body)
    throw new Error("The response stream was unavailable. Please try again.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let size = 0;
  let receivedResult = false;
  let result: unknown;
  let completed = false;
  const consume = (event: string) => {
    let name = "message";
    const lines: string[] = [];
    for (const line of event.split("\n")) {
      if (line.startsWith("event:")) name = line.slice(6).trim();
      if (line.startsWith("data:")) lines.push(line.slice(5).trimStart());
    }
    if (!lines.length) return;
    let data: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(lines.join("\n"));
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
        throw new Error();
      data = parsed as Record<string, unknown>;
    } catch {
      throw new Error(
        "The response could not be read safely. Please try again.",
      );
    }
    if (receivedResult)
      throw new Error(
        "The response stream was inconsistent. Please try again.",
      );
    if (name === "message_delta" && typeof data.delta === "string")
      onDelta(data.delta);
    if (name === "error")
      throw new CompanionStreamError(
        typeof data.error === "string"
          ? data.error
          : "The response could not finish. Please try again.",
        typeof data.status === "number" ? data.status : undefined,
      );
    if (name === "result") {
      result = data;
      receivedResult = true;
    }
  };
  try {
    while (true) {
      const { value, done } = await reader.read();
      size += value?.byteLength || 0;
      if (size > 262144)
        throw new Error("The response was too large. Please try again.");
      buffer += decoder.decode(value, { stream: !done });
      // Normalize only complete CRLFs: a CR at the chunk boundary remains buffered.
      buffer = buffer.replace(/\r\n/g, "\n");
      let boundary;
      while ((boundary = buffer.indexOf("\n\n")) !== -1) {
        consume(buffer.slice(0, boundary));
        buffer = buffer.slice(boundary + 2);
      }
      if (done) break;
    }
    if (buffer.trim()) consume(buffer);
    if (!receivedResult)
      throw new Error(
        "The response was interrupted. Your draft is available to try again.",
      );
    completed = true;
    return result;
  } finally {
    if (!completed) await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
