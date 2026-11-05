import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.route("**/api/status", (r) =>
    r.fulfill({ json: { configured: true } }),
  );
  await page.goto("/");
  await page
    .getByRole("button", { name: "Begin journey", exact: true })
    .click();
});
for (const [name, question] of [
  [
    "unwanted intrusive thoughts without stated intent",
    "I am afraid I might hurt myself.",
  ],
  ["ordinary distress", "I feel low and need someone to listen."],
  ["figurative speech", "This deadline is killing me."],
  [
    "no-contact boundary",
    "There is a no-contact order but I want to apologize.",
  ],
  [
    "quoted third-party statement",
    'My friend said "I have a suicide plan." What should I do?',
  ],
])
  test(`${name} stays in conversation rather than opening generic crisis modal`, async ({
    page,
  }) => {
    await page.route("**/api/companion", (r) =>
      r.fulfill({
        json: {
          reply: {
            kind: "support",
            message:
              "A fictional supportive response with a relevant next step.",
            exercise: null,
          },
        },
      }),
    );
    await page.getByLabel("What’s weighing on you today?").fill(question);
    await page
      .getByRole("button", { name: "Send & find a practice", exact: true })
      .click();
    await expect(
      page.locator(".message-card").filter({
        hasText: "A fictional supportive response with a relevant next step.",
      }),
    ).toBeVisible();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(page.getByText("You deserve human support.")).toHaveCount(0);
  });
test("explicit present danger retains specific intervention without unrelated boilerplate", async ({
  page,
}) => {
  await page
    .getByLabel("What’s weighing on you today?")
    .fill("I cannot keep myself safe.");
  // Real local route uses the deterministic backstop before any provider request.
  await page
    .getByRole("button", { name: "Send & find a practice", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("immediate safety");
  await expect(page.getByRole("dialog")).toContainText("Safety notice:");
  await expect(page.getByRole("dialog")).not.toContainText("withdrawal");
  await page
    .getByRole("button", { name: "Return to my space", exact: true })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
test("human support is an optional inline disclosure, not an overlay", async ({
  page,
}) => {
  await page.getByText("Human support", { exact: true }).click();
  await expect(
    page.getByText("If you want support beyond this conversation", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
