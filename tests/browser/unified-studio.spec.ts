import { test, expect } from "@playwright/test";
import { samples } from "../../src/lib/catalog";
test("studio keeps private practice through quiet tools and exposes separate voice test", async ({
  page,
}) => {
  const sent: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST") sent.push(r.url());
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Begin journey", exact: true })
    .click();
  await expect(
    page.getByRole("log", { name: "Our conversation" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Try the example/ }).click();
  await expect(page.getByLabel("Practice journey")).toContainText("Understand");
  await page
    .getByLabel("My understanding of the situation")
    .fill("Private corrected premise");
  await page.getByRole("button", { name: "Try this practice" }).click();
  if ((page.viewportSize()?.width || 0) < 851)
    await page.getByText("Take a quiet moment", { exact: true }).click();
  await page.getByRole("button", { name: "Open Ember", exact: true }).click();
  await page
    .getByRole("button", { name: "Return to this practice", exact: true })
    .click();
  if ((page.viewportSize()?.width || 0) < 851)
    await page.getByText("Take a quiet moment", { exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Open Ember", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open Current", exact: true }).click();
  await page
    .getByRole("button", { name: "Return to this practice", exact: true })
    .click();
  await page.getByRole("button", { name: "Compare voice options" }).click();
  await expect(
    page.getByRole("heading", { name: "A reply you can read and hear" }),
  ).toBeVisible();
  await page
    .getByLabel("Your question", { exact: true })
    .fill("A separate draft");
  await page
    .getByRole("button", { name: "Return to this practice", exact: true })
    .click();
  await page.getByRole("button", { name: "Compare voice options" }).click();
  await expect(page.getByLabel("Your question", { exact: true })).toHaveValue(
    "A separate draft",
  );
  await page
    .getByRole("button", { name: "Return to this practice", exact: true })
    .click();
  await page.getByText("My space", { exact: true }).click();
  await page.getByRole("button", { name: "My memory", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByText("My space", { exact: true })).toBeFocused();
  expect(
    sent.filter(
      (u) => u.includes("/api/companion") || u.includes("/api/experimental/"),
    ),
  ).toHaveLength(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/studio-${test.info().project.name}.png`,
    fullPage: true,
  });
});
test("generated practice uses current submitted premise and correction requires explicit send", async ({
  page,
}) => {
  await page.route("**/api/status", (r) =>
    r.fulfill({ json: { configured: true } }),
  );
  let calls = 0;
  await page.route("**/api/companion", (r) => {
    calls++;
    const intent = r.request().postDataJSON().intent;
    expect(intent).toBe(calls === 1 ? "conversation" : "practice");
    if (intent === "conversation")
      return r.fulfill({
        json: {
          reply: {
            kind: "conversation",
            message: "Tell me what feels most important about that.",
            exercise: null,
          },
        },
      });
    return r.fulfill({
      json: {
        reply: {
          kind: "practice",
          message: "An optional practice.",
          exercise: samples.worry,
        },
      },
    });
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Begin journey", exact: true })
    .click();
  await page
    .getByLabel("What’s weighing on you today?")
    .fill("Current fictional premise");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByRole("log")).toContainText(
    "Tell me what feels most important about that.",
  );
  await page
    .getByText("Language & optional practices", { exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Shape a practice from our conversation",
      exact: true,
    })
    .click();
  await expect(
    page.getByLabel("My understanding of the situation"),
  ).toHaveValue("Current fictional premise");
  await page
    .getByLabel("My understanding of the situation")
    .fill("Corrected private premise");
  await page
    .getByRole("button", { name: "Review this in conversation" })
    .click();
  await expect(
    page.getByLabel("Talk this through", { exact: true }),
  ).toHaveValue("Corrected private premise");
  expect(calls).toBe(2);
});

test("exact speech test keeps accepted history and selected language without auto-playing", async ({
  page,
}) => {
  const sent: Array<{
    messages: Array<{ content: string }>;
    language: string;
  }> = [];
  await page.route("**/api/experimental/reasoned-voice", async (r) => {
    sent.push(r.request().postDataJSON());
    await r.fulfill({
      json: {
        reply: { message: "An editable fictional reply." },
        audio: null,
        audioError:
          "Speech is unavailable. Your complete reply is available to read; no new answer was requested.",
      },
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Compare voice options" }).click();
  await page.getByLabel("Voice test language").selectOption("spiritual");
  await page
    .getByLabel("Your question", { exact: true })
    .fill("Fictional first question");
  await page.getByRole("button", { name: "Ask and prepare speech" }).click();
  await expect(page.getByLabel("Your reply")).toContainText(
    "An editable fictional reply.",
  );
  await page
    .getByLabel("Your question", { exact: true })
    .fill("Fictional follow-up");
  await page.getByRole("button", { name: "Ask and prepare speech" }).click();
  await expect(page.getByLabel("Your reply")).toContainText(
    "An editable fictional reply.",
  );
  expect(sent).toHaveLength(2);
  expect(sent[1].language).toBe("spiritual");
  expect(sent[1].messages).toHaveLength(3);
  await page.getByRole("button", { name: "Start new conversation" }).click();
  await expect(page.getByLabel("Your question", { exact: true })).toHaveValue(
    "",
  );
  await expect(page.getByLabel("Your reply")).toHaveCount(0);
});

test("private understanding participates in opt-in saving and replacement confirmation", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Begin journey", exact: true })
    .click();
  await page.getByRole("button", { name: /Try the example/ }).click();
  await page
    .getByLabel("My understanding of the situation")
    .fill("A private saved understanding");
  await page.getByRole("button", { name: "Try this practice" }).click();
  await page.getByText("Save and return later", { exact: true }).click();
  await page
    .getByLabel("Keep this practice on this device", { exact: true })
    .check();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("soulfire.saved-practice.v1") || "{}")
            .understanding,
      ),
    )
    .toBe("A private saved understanding");
  await page.reload();
  await page.getByRole("button", { name: "Practices", exact: true }).click();
  await page
    .getByRole("button", { name: "Explore step 1", exact: true })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("soulfire.saved-practice.v1") || "{}")
          .understanding,
    ),
  ).toBe("A private saved understanding");
});

test("provider quota failure preserves question and does not retry automatically", async ({
  page,
}) => {
  let calls = 0;
  await page.route("**/api/experimental/reasoned-voice", (r) => {
    calls++;
    return r.fulfill({
      status: 429,
      json: {
        error:
          "The AI provider reports that API quota is unavailable or a billing limit was reached. Check the API account's billing and usage limits before retrying. Your draft is still here.",
      },
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Compare voice options" }).click();
  await page
    .getByLabel("Your question", { exact: true })
    .fill("A fictional diagnostic question");
  await page.getByRole("button", { name: "Ask and prepare speech" }).click();
  await expect(
    page.locator(".reasoned-voice-studio [role=alert]"),
  ).toContainText("API quota is unavailable");
  await expect(
    page.locator(".reasoned-voice-studio [role=alert]"),
  ).not.toContainText("Review or type");
  await expect(page.getByLabel("Your question", { exact: true })).toHaveValue(
    "A fictional diagnostic question",
  );
  await expect(page.getByLabel("Your reply")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Ask and prepare speech" }),
  ).toBeEnabled();
  expect(calls).toBe(1);
});
