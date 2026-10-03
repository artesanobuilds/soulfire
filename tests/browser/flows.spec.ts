import { test, expect } from "@playwright/test";
import { samples } from "../../src/lib/catalog";
test.beforeEach(async ({ page }) => {
  await page.goto("/");
});
async function practice(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: /Try the example/ }).click();
  await page.getByRole("button", { name: "Try this practice" }).click();
}
test("full private loop, editing, movement, repeated controls and no overflow", async ({
  page,
}) => {
  const sent: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/companion")) sent.push(r.postData() || "");
  });
  await practice(page);
  const thought = page
    .getByRole("textbox", { name: "Thought", exact: true })
    .first();
  await thought.fill("Private editable thought");
  await page
    .getByLabel("Move Private editable thought", { exact: true })
    .selectOption("2");
  await expect(page.locator(".sort-column").nth(2)).toContainText(
    "I can release",
  );
  await page
    .getByRole("button", { name: "Add a thought", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("textbox", { name: "Thought", exact: true }),
  ).toHaveCount(4);
  await page
    .getByRole("button", { name: "Remove thought", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Thought", exact: true }),
  ).toHaveCount(3);
  await page
    .getByLabel("Name what is here", { exact: true })
    .fill("PRIVATE-NEVER-SENT");
  await page
    .getByRole("button", { name: "Pause practice", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByLabel("Name what is here", { exact: true }),
  ).toHaveValue("PRIVATE-NEVER-SENT");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Begin quiet", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Pause", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.getByRole("button", { name: "Reset timer", exact: true }).click();
  await expect(page.locator(".timer")).toHaveText("1:00");
  await page
    .getByRole("button", { name: "This doesn’t feel helpful — stop & ground" })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "There is no need to focus inward",
  );
  await page.getByRole("button", { name: "Leave quiet & reflect" }).click();
  await expect(page.getByRole("checkbox", { checked: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Keep private & continue" }).click();
  await expect(
    page.getByRole("heading", { name: /Let this be enough/ }),
  ).toBeVisible();
  expect(sent).toHaveLength(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Return to the practice map" })
    .click();
  await expect(page.locator(".step-card")).toHaveCount(12);
});
test("simulated model transport renders validated responses and shares only checked fields", async ({
  page,
}) => {
  const bodies: unknown[] = [];
  await page.route("**/api/companion", async (route) => {
    bodies.push(route.request().postDataJSON());
    await route.fulfill({
      json: {
        reply:
          bodies.length === 1
            ? {
                kind: "practice",
                message: "A tailored practice.",
                exercise: samples.worry,
              }
            : {
                kind: "conversation",
                message: "One small preparation step can be enough.",
                exercise: null,
              },
      },
    });
  });
  await page.getByLabel("Language that feels right").selectOption("plain");
  await page
    .getByLabel("What’s weighing on you today?")
    .fill("My presentation is tomorrow.");
  await page
    .getByRole("button", { name: "Find a practice", exact: true })
    .click();
  await page.getByRole("button", { name: "Try this practice" }).click();
  await page
    .getByLabel("Name what is here", { exact: true })
    .fill("SECRET-UNSELECTED");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Skip quiet and reflect" }).click();
  await page.getByLabel("What did you notice?").fill("SELECTED-INSIGHT");
  await page.getByRole("checkbox", { name: /What I noticed/ }).check();
  await page.getByRole("button", { name: "Share selected & reflect" }).click();
  await expect(
    page.getByText("One small preparation step can be enough."),
  ).toBeVisible();
  expect(JSON.stringify(bodies)).not.toContain("SECRET-UNSELECTED");
  expect(JSON.stringify(bodies)).toContain("SELECTED-INSIGHT");
  expect(JSON.stringify(bodies[0])).toContain("plain");
});
test("failure and interruption retain draft; repeated clicks produce one request", async ({
  page,
}) => {
  await page
    .getByLabel("What’s weighing on you today?")
    .fill("Keep my message");
  await page.route("**/api/companion", async (route) => {
    await new Promise((r) => setTimeout(r, 1500));
    await route
      .fulfill({
        status: 503,
        json: { error: "Service unavailable. Try again." },
      })
      .catch(() => {});
  });
  await page
    .getByRole("button", { name: "Find a practice", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Stop response", exact: true })
    .click();
  await expect(page.getByLabel("What’s weighing on you today?")).toHaveValue(
    "Keep my message",
  );
  await page
    .getByRole("button", { name: "Find a practice", exact: true })
    .click();
  await expect(page.locator("main [role=alert]")).toContainText(
    "Service unavailable",
  );
  await expect(page.getByLabel("What’s weighing on you today?")).toHaveValue(
    "Keep my message",
  );
});
test("microphone denial leaves text and recovery available", async ({
  page,
}) => {
  await page.route("**/api/status", (route) =>
    route.fulfill({ json: { configured: true } }),
  );
  await page.evaluate(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      throw new DOMException("denied", "NotAllowedError");
    };
  });
  await page.getByLabel("What’s weighing on you today?").fill("Still here");
  await page.getByRole("button", { name: "Live voice", exact: true }).click();
  await expect(
    page.getByText(/Your microphone audio and submitted conversation/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Allow microphone & start" }).click();
  await expect(page.locator("main [role=alert]")).toContainText(
    "Microphone permission was denied",
  );
  await expect(page.getByLabel("What’s weighing on you today?")).toHaveValue(
    "Still here",
  );
  await expect(
    page.getByRole("button", { name: "Find a practice", exact: true }),
  ).toBeEnabled();
});
test("distinct journeys and decline keep the map available", async ({
  page,
}) => {
  for (const [topic, title] of [
    ["A pattern I can’t break", "Before the next urge."],
    ["Feeling low or disconnected", "One small act of care."],
    ["Conflict with someone", "Return to what matters."],
  ]) {
    await page
      .getByRole("button", { name: "The practice", exact: true })
      .click();
    await page.getByRole("button", { name: topic, exact: true }).click();
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Choose a different practice" })
      .click();
    await expect(page.locator(".step-card")).toHaveCount(12);
  }
});
test("dialog traps keyboard focus and restores trigger on Escape", async ({
  page,
}) => {
  const trigger = page.getByRole("button", {
    name: "Privacy & about",
    exact: true,
  });
  await trigger.click();
  await expect(
    page.getByRole("button", { name: "Close dialog" }),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(
    page.getByRole("button", { name: "Back to the practice", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Close dialog" }),
  ).toBeFocused();
  expect(
    await page.evaluate(() =>
      document.querySelector("dialog")?.contains(document.activeElement),
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
test("short mobile viewport keeps all filled action text visible and status by controls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 450 });
  await expect(page.locator(".composer-status")).toContainText(
    "AI not connected",
  );
  await page.getByRole("button", { name: "The practice", exact: true }).click();
  await page
    .getByRole("button", { name: "Conflict with someone", exact: true })
    .click();
  await page.getByRole("button", { name: "Try this practice" }).click();
  const action = page.getByLabel("My next action", { exact: true });
  await action.fill(
    "If we both feel ready, I will acknowledge my hurtful words without demanding a response. I will respect their choice and timing. I can take a pause and ask a trusted person for support first.",
  );
  await action.focus();
  expect(
    await action.evaluate((el) => el.scrollHeight <= el.clientHeight + 2),
  ).toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Nothing to get right." }),
  ).toBeVisible();
});
