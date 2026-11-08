import { test, expect } from "@playwright/test";

const reply = {
  kind: "conversation",
  message: "We can take this one step at a time.",
  exercise: null,
  practiceOffer: null,
};
const event = (name: string, data: unknown) =>
  `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`;

test.beforeEach(async ({ page }) => {
  await page.route("**/api/status", (route) =>
    route.fulfill({ json: { configured: true } }),
  );
  await page.goto("/");
  await page
    .getByRole("button", { name: "Begin journey", exact: true })
    .click();
});

test("Enter sends, Shift+Enter adds a line, and the prompt follows the conversation", async ({
  page,
}) => {
  const requests: Array<{ messages: Array<{ content: string }> }> = [];
  await page.route("**/api/companion", (route) => {
    requests.push(route.request().postDataJSON());
    return route.fulfill({ json: { reply } });
  });
  const input = page.locator("#opening");
  await expect(input).toHaveAccessibleName("What’s weighing on you today?");
  await expect(input).toHaveAttribute("placeholder", "Begin wherever you are…");
  await input.fill("A fictional question.");
  await input.press("End");
  await input.press("Shift+Enter");
  await input.pressSequentially("A little more context.");
  expect(requests).toHaveLength(0);
  await expect(input).toHaveValue(
    "A fictional question.\nA little more context.",
  );
  await input.press("Enter");
  await expect(page.getByRole("log")).toContainText(reply.message);
  expect(requests).toHaveLength(1);
  expect(requests[0].messages[0].content).toBe(
    "A fictional question.\nA little more context.",
  );
  await expect(input).toHaveValue("");
  await expect(input).toBeFocused();
  await expect(input).toHaveAccessibleName("Talk this through");
  await expect(input).toHaveAttribute(
    "placeholder",
    "Ask a question, or tell me what feels different…",
  );
  await input.fill("One follow-up question.");
  await input.press("Enter");
  await expect(page.locator(".chat-assistant:not(.chat-pending)")).toHaveCount(
    2,
  );
  expect(requests[1].messages).toHaveLength(3);
  await page.getByRole("button", { name: "Start fresh", exact: true }).click();
  await page
    .getByRole("button", { name: "Clear & begin again", exact: true })
    .click();
  await expect(input).toHaveAccessibleName("What’s weighing on you today?");
  await expect(input).toHaveAttribute("placeholder", "Begin wherever you are…");
});

test("waiting is animated immediately, repeated submissions are blocked, and Stop restores the draft", async ({
  page,
}, info) => {
  let finish!: () => void;
  let calls = 0;
  const waiting = new Promise<void>((resolve) => {
    finish = resolve;
  });
  await page.route("**/api/companion", async (route) => {
    calls++;
    await waiting;
    await route.fulfill({ json: { reply } }).catch(() => {});
  });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const input = page.locator("#opening");
  await input.fill("A fictional delayed question.");
  await input.press("Enter");
  const status = page.locator(".composer-response-status");
  await expect(status).toContainText("Thinking…");
  await expect(status).toHaveAttribute("role", "status");
  await expect(page.getByLabel("Response in progress")).toBeVisible();
  await expect(status.locator(".response-dots > span").first()).toHaveCSS(
    "animation-name",
    "response-pulse",
  );
  await page
    .getByRole("button", { name: "Stop", exact: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath("waiting.png") });
  await input.press("Enter");
  await input.press("Control+Enter");
  expect(calls).toBe(1);
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  finish();
  await expect(status).toHaveCount(0);
  await expect(page.getByLabel("Response in progress")).toHaveCount(0);
  await expect(input).toHaveValue("A fictional delayed question.");
  await expect(input).toHaveAccessibleName("What’s weighing on you today?");
  await expect(page.getByRole("log")).not.toContainText(reply.message);
});

test("IME confirmation and held Enter do not send prematurely", async ({
  page,
}) => {
  let calls = 0;
  await page.route("**/api/companion", (route) => {
    calls++;
    return route.fulfill({ json: { reply } });
  });
  const input = page.locator("#opening");
  await input.fill("A fictional composed question.");
  await input.dispatchEvent("keydown", {
    key: "Enter",
    keyCode: 13,
    isComposing: true,
  });
  await input.dispatchEvent("keydown", { key: "Enter", keyCode: 229 });
  await input.dispatchEvent("keydown", {
    key: "Enter",
    keyCode: 13,
    repeat: true,
  });
  expect(calls).toBe(0);
  await expect(input).toHaveValue("A fictional composed question.");
  await input.press("Enter");
  await expect(page.getByRole("log")).toContainText(reply.message);
  expect(calls).toBe(1);
});

test("feedback continues through streaming and disappears after the validated response", async ({
  page,
}) => {
  await page.evaluate(() => {
    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
      if (input !== "/api/companion") return originalFetch(input, init);
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          (
            window as unknown as {
              testStream: ReadableStreamDefaultController<Uint8Array>;
            }
          ).testStream = controller;
        },
      });
      return new Response(stream, {
        headers: { "Content-Type": "text/event-stream" },
      });
    };
  });
  await page.locator("#opening").fill("A fictional streaming question.");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  const status = page.locator(".composer-response-status");
  await expect(status).toContainText("Thinking…");
  await page.evaluate(
    (chunk) => {
      (
        window as unknown as {
          testStream: ReadableStreamDefaultController<Uint8Array>;
        }
      ).testStream.enqueue(new TextEncoder().encode(chunk));
    },
    event("message_delta", { delta: "We can take this" }),
  );
  await expect(status).toContainText("Responding…");
  await expect(page.getByLabel("Response in progress")).toContainText(
    "We can take this",
  );
  await page.evaluate(
    (chunk) => {
      const controller = (
        window as unknown as {
          testStream: ReadableStreamDefaultController<Uint8Array>;
        }
      ).testStream;
      controller.enqueue(new TextEncoder().encode(chunk));
      controller.close();
    },
    event("result", { reply }),
  );
  await expect(page.getByRole("log")).toContainText(reply.message);
  await expect(status).toHaveCount(0);
  await expect(page.getByLabel("Response in progress")).toHaveCount(0);
});

for (const preference of ["system", "scene"] as const) {
  test(`waiting remains legible without animation for ${preference} motion preference`, async ({
    page,
  }) => {
    if (preference === "system")
      await page.emulateMedia({ reducedMotion: "reduce" });
    else
      await page
        .getByRole("button", { name: "Pause motion", exact: true })
        .click();
    let finish!: () => void;
    const waiting = new Promise<void>((resolve) => {
      finish = resolve;
    });
    await page.route("**/api/companion", async (route) => {
      await waiting;
      await route.fulfill({ json: { reply } }).catch(() => {});
    });
    await page.locator("#opening").fill("A fictional quiet request.");
    await page.locator("#opening").press("Enter");
    const status = page.locator(".composer-response-status");
    await expect(status).toContainText("Thinking…");
    await expect(status.locator(".response-dots > span").first()).toHaveCSS(
      "animation-name",
      "none",
    );
    await page.getByRole("button", { name: "Stop", exact: true }).click();
    finish();
  });
}
