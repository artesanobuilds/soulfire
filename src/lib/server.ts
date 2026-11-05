import { ZodError } from "zod";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
const attempts: number[] = [];
export function guard(req: Request, countAttempt = true) {
  const url = new URL(req.url);
  const origin = req.headers.get("origin");
  if (!["127.0.0.1", "localhost", "[::1]"].includes(url.hostname))
    throw new HttpError(403, "This prototype is restricted to localhost.");
  // Next may normalize req.url to localhost while the browser uses 127.0.0.1.
  // Validate the actual Host before using it to check the same-origin boundary.
  const host = req.headers.get("host") || url.host;
  if (!/^(localhost|127\.0\.0\.1|\[::1\])(?::[0-9]{1,5})?$/i.test(host))
    throw new HttpError(403, "This prototype is restricted to localhost.");
  const expectedOrigin = `${url.protocol}//${host.toLowerCase()}`;
  if (origin && origin !== expectedOrigin)
    throw new HttpError(
      403,
      "This request must come from the local soulfire page.",
    );
  if (!countAttempt) return;
  const now = Date.now();
  while (attempts.length && attempts[0] < now - 60000) attempts.shift();
  if (attempts.length >= 20)
    throw new HttpError(429, "Please pause a moment before trying again.");
  attempts.push(now);
}
export function key() {
  const k = process.env.OPENAI_API_KEY;
  if (!k)
    throw new HttpError(
      503,
      "The AI companion is not connected yet. Configure the server-side OpenAI key to use live responses. You can still explore an example.",
    );
  return k;
}
export async function boundedBody(req: Request, max = 40000) {
  const reader = req.body?.getReader();
  if (!reader) throw new HttpError(400, "No request content.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const r = await reader.read();
    if (r.done) break;
    size += r.value.byteLength;
    if (size > max) {
      await reader.cancel();
      throw new HttpError(
        413,
        "This request is too large. Try a shorter message.",
      );
    }
    chunks.push(r.value);
  }
  return Buffer.concat(chunks);
}
export async function jsonBody(req: Request, max = 40000) {
  try {
    return JSON.parse((await boundedBody(req, max)).toString());
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(400, "The request could not be read. Try again.");
  }
}
export async function provider(
  path: string,
  body: BodyInit,
  req: Pick<Request, "signal">,
  contentType?: string,
) {
  const res = await fetch(`https://api.openai.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key()}`,
      ...(contentType ? { "Content-Type": contentType } : {}),
    },
    body,
    signal: AbortSignal.any([req.signal, AbortSignal.timeout(45000)]),
  });
  if (!res.ok) {
    if (res.status === 429) {
      // Only inspect allowlisted machine codes. Never expose or log the provider's
      // raw message, request body, credentials, account identifiers or user text.
      const payload: unknown = await res.json().catch(() => null);
      const error =
        payload && typeof payload === "object" && "error" in payload
          ? (payload as { error: unknown }).error
          : null;
      const codes =
        error && typeof error === "object"
          ? [
              (error as { code?: unknown }).code,
              (error as { type?: unknown }).type,
            ]
          : [];
      const quota = codes.some(
        (code) =>
          code === "insufficient_quota" ||
          code === "billing_hard_limit_reached" ||
          code === "billing_not_active",
      );
      const rate = codes.includes("rate_limit_exceeded");
      const category = quota
        ? "quota_or_billing_limit"
        : rate
          ? "rate_limit"
          : "unclassified_429";
      console.warn("Soulfire provider request rejected", {
        status: 429,
        category,
      });
      throw new HttpError(
        429,
        quota
          ? "The AI provider reports that API quota is unavailable or a billing limit was reached. Check the API account's billing and usage limits before retrying. Your draft is still here."
          : rate
            ? "The AI provider's request or token rate limit was reached. Wait a little before trying again. Your draft is still here."
            : "The AI provider rejected this request with a usage-limit response (429), but did not identify whether it is a temporary rate limit or unavailable quota. Check API usage and billing if it continues. Your draft is still here.",
      );
    }
    throw new HttpError(
      502,
      "The AI service could not complete this request. Your drafts are still here; try again or use an example.",
    );
  }
  return res;
}
export function failure(e: unknown) {
  const status =
    e instanceof HttpError
      ? e.status
      : e instanceof ZodError
        ? 400
        : e instanceof Error && ["AbortError", "TimeoutError"].includes(e.name)
          ? 504
          : 502;
  const error =
    e instanceof HttpError
      ? e.message
      : status === 400
        ? "The request was not valid. Try a shorter message."
        : status === 504
          ? "The request stopped or timed out. You can try again."
          : "The response could not be read safely. Try again or use an example.";
  return Response.json(
    { error },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}
