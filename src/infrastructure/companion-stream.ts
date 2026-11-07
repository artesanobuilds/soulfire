/** Decode SSE across arbitrary byte boundaries, without retaining provider metadata. */
export async function* readSseData(
  body: ReadableStream<Uint8Array>,
  signal: AbortSignal,
) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const abort = () => {
    void reader.cancel().catch(() => {});
  };
  signal.addEventListener("abort", abort, { once: true });
  try {
    while (true) {
      signal.throwIfAborted();
      const { value, done } = await reader.read();
      signal.throwIfAborted();
      buffer += decoder.decode(value, { stream: !done });
      if (buffer.length > 262144) throw new Error("Oversized stream event");
      let match: RegExpExecArray | null;
      while ((match = /\r?\n\r?\n/.exec(buffer))) {
        const frame = buffer.slice(0, match.index);
        buffer = buffer.slice(match.index + match[0].length);
        const data = frame
          .split(/\r?\n/)
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).replace(/^ /, ""))
          .join("\n");
        if (data) yield data;
      }
      if (done) break;
    }
  } finally {
    signal.removeEventListener("abort", abort);
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

/** Project only a top-level JSON message string. Never expose JSON or exercise fields.
 * The projection is provisional; the complete response must still pass validation.
 */
export function partialMessage(json: string): string {
  let depth = 0;
  for (let i = 0; i < json.length; i++) {
    const char = json[i];
    if (char === "{" || char === "[") depth++;
    else if (char === "}" || char === "]") depth--;
    else if (char === '"') {
      const start = i++;
      for (; i < json.length; i++) {
        if (json[i] === "\\") i++;
        else if (json[i] === '"') break;
      }
      if (i >= json.length) return "";
      if (depth !== 1 || JSON.parse(json.slice(start, i + 1)) !== "message")
        continue;
      let pos = i + 1;
      while (/\s/.test(json[pos] || "x")) pos++;
      if (json[pos++] !== ":") continue;
      while (/\s/.test(json[pos] || "x")) pos++;
      if (json[pos++] !== '"') return "";
      let raw = "";
      while (pos < json.length) {
        const c = json[pos++];
        if (c === '"') return JSON.parse('"' + raw + '"');
        if (c === "\\") {
          if (pos >= json.length) break;
          const escape = json[pos++];
          if (escape === "u") {
            if (pos + 4 > json.length) break;
            raw += "\\u" + json.slice(pos, pos + 4);
            pos += 4;
          } else raw += "\\" + escape;
        } else raw += c;
      }
      const result: string = JSON.parse('"' + raw + '"');
      // Hold a high surrogate until its pair arrives, including escaped pairs.
      return /[\uD800-\uDBFF]$/.test(result) ? result.slice(0, -1) : result;
    }
  }
  return "";
}
