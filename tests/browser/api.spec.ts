import { test, expect } from "@playwright/test";
test("production HTTP accepts localhost and rejects a foreign origin", async ({
  request,
  baseURL,
}) => {
  const status = await request.get("/api/status");
  expect(status.status()).toBe(200);
  test.skip(
    (await status.json()).configured,
    "This test requires an unconfigured service and must not make a paid model call.",
  );
  const origin = new URL(baseURL!).origin;
  const text = await request.post("/api/companion", {
    headers: { Origin: origin },
    data: {
      messages: [
        { role: "user", content: "A fictional presentation tomorrow." },
      ],
      language: "plain",
      intent: "practice",
    },
  });
  expect(text.status()).toBe(503);
  expect((await text.json()).error).toContain("not connected");
  const voice = await request.post("/api/realtime", {
    headers: { Origin: origin },
    data: {
      sdp: "v=0\r\n" + "a".repeat(50),
      language: "plain",
      practiceTitle: "",
    },
  });
  expect(voice.status()).toBe(503);
  const foreign = await request.post("/api/companion", {
    headers: { Origin: "https://example.com" },
    data: {},
  });
  expect(foreign.status()).toBe(403);
});
