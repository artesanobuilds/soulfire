import { afterEach, expect, it, vi } from "vitest";
import { provider, failure } from "../src/lib/server";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
async function rejected(payload: unknown, status = 429, raw = false) {
  vi.stubEnv("OPENAI_API_KEY", "offline-test-not-a-key");
  const transport = vi
    .fn()
    .mockResolvedValue(
      new Response(raw ? String(payload) : JSON.stringify(payload), { status }),
    );
  vi.stubGlobal("fetch", transport);
  const log = vi.spyOn(console, "warn").mockImplementation(() => {});
  let error: unknown;
  try {
    await provider(
      "responses",
      "PRIVATE-TEST-PROMPT",
      { signal: new AbortController().signal },
      "application/json",
    );
  } catch (e) {
    error = e;
  }
  expect(transport).toHaveBeenCalledTimes(1);
  const response = failure(error);
  return { response, body: await response.json(), log };
}
it.each([
  "insufficient_quota",
  "billing_hard_limit_reached",
  "billing_not_active",
])(
  "classifies %s without recommending a blind retry or leaking raw details",
  async (code) => {
    const { response, body, log } = await rejected({
      error: { code, message: "PRIVATE-ACCOUNT-DIAGNOSTIC" },
    });
    expect(response.status).toBe(429);
    expect(body.error).toContain("API quota is unavailable or a billing limit");
    expect(body.error).not.toContain("Wait a little");
    expect(JSON.stringify([body, log.mock.calls])).not.toMatch(
      /PRIVATE-|offline-test-not-a-key/,
    );
    expect(log).toHaveBeenCalledWith("Soulfire provider request rejected", {
      status: 429,
      category: "quota_or_billing_limit",
    });
  },
);
it("separates rate limiting and supports provider type codes", async () => {
  const { body, log } = await rejected({
    error: { type: "rate_limit_exceeded", message: "PRIVATE" },
  });
  expect(body.error).toContain("request or token rate limit");
  expect(log.mock.calls[0][1]).toEqual({ status: 429, category: "rate_limit" });
});
it.each([
  { error: { code: "unknown_vendor_value", message: "PRIVATE" } },
  null,
  { error: "PRIVATE" },
  [],
])("keeps unknown 429 causes uncertain", async (payload) => {
  const { body, log } = await rejected(payload);
  expect(body.error).toContain("did not identify whether");
  expect(JSON.stringify([body, log.mock.calls])).not.toContain("PRIVATE");
});
it("handles an unreadable error body without masking the original status", async () => {
  const { response, body } = await rejected("not json", 429, true);
  expect(response.status).toBe(429);
  expect(body.error).toContain("did not identify whether");
});
it("does not mislabel a server failure as quota or expose its body", async () => {
  const { response, body, log } = await rejected(
    { error: { code: "insufficient_quota", message: "PRIVATE" } },
    503,
  );
  expect(response.status).toBe(502);
  expect(body.error).toContain("could not complete");
  expect(log).not.toHaveBeenCalled();
});
