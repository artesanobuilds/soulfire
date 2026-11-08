import { test, expect } from "@playwright/test";
import { samples } from "../../src/lib/catalog";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/status", (route) =>
    route.fulfill({ json: { configured: true } }),
  );
  await page.goto("/");
  await page
    .getByRole("button", { name: "Begin journey", exact: true })
    .click();
});
const event = (name: string, data: unknown) =>
  `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`;

test("conversation first, multiple turns, optional practice and private working fields", async ({
  page,
}) => {
  const bodies: Array<{
    intent: string;
    messages: Array<{ role: string; content: string }>;
  }> = [];
  await page.route("**/api/companion", (route) => {
    const body = route.request().postDataJSON();
    bodies.push(body);
    const reply =
      body.intent === "practice"
        ? {
            kind: "practice",
            message: "Here is an optional exercise.",
            exercise: samples.worry,
            practiceOffer: null,
          }
        : {
            kind: "conversation",
            message:
              bodies.length === 1
                ? "You can prepare while leaving the outcome open."
                : "We can focus on the next concrete action.",
            exercise: null,
            practiceOffer:
              bodies.length === 2
                ? { kind: "exercise", label: "Sort what is yours to carry" }
                : null,
          };
    return route.fulfill({
      contentType: "text/event-stream",
      body:
        event("message_delta", { delta: reply.message.slice(0, 10) }) +
        event("message_delta", { delta: reply.message.slice(10) }) +
        event("result", { reply }),
    });
  });
  const prompt = page.locator("#opening");
  await prompt.fill("I have a fictional presentation tomorrow.");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByRole("log")).toContainText(
    "You can prepare while leaving the outcome open.",
  );
  expect(bodies[0].intent).toBe("conversation");
  await expect(page.locator(".conversation-practice-pane")).toBeHidden();
  await prompt.fill("How can I prepare without overthinking?");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByLabel("Optional practice")).toBeVisible();
  expect(bodies[1].messages.map((m) => m.role)).toEqual([
    "user",
    "assistant",
    "user",
  ]);
  await expect(page.getByRole("log")).toContainText(
    "fictional presentation tomorrow",
  );
  await page.getByRole("button", { name: "Shape this practice" }).click();
  await expect(
    page.getByRole("button", { name: "Try this practice" }),
  ).toBeVisible();
  expect(bodies[2].intent).toBe("practice");
  await page
    .getByLabel("My understanding of the situation")
    .fill("PRIVATE WORKING NOTE");
  await page.getByRole("button", { name: "Try this practice" }).click();
  await expect(page.getByRole("log")).toBeVisible();
  await page
    .getByLabel("Talk this through", { exact: true })
    .fill("Another conversational question.");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByRole("log")).toContainText(
    "We can focus on the next concrete action.",
  );
  expect(JSON.stringify(bodies)).not.toContain("PRIVATE WORKING NOTE");
  await expect(page.locator(".practice-main")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `test-results/conversation-studio-${test.info().project.name}.png`,
    fullPage: true,
  });
});

test("offer dismissal and optional Current/meditation stay explicit with no automatic generation", async ({
  page,
}) => {
  let posts = 0;
  await page.route("**/api/companion", (route) => {
    posts++;
    return route.fulfill({
      json: {
        reply: {
          kind: "conversation",
          message: "A quiet moment is available if you want it.",
          exercise: null,
          practiceOffer: {
            kind: "meditation",
            label: "Make room for a quiet moment",
          },
        },
      },
    });
  });
  await page
    .getByLabel("What’s weighing on you today?")
    .fill("I would like a quiet moment.");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await page.getByRole("button", { name: "Not now", exact: true }).click();
  await expect(page.locator(".conversation-practice-pane")).toBeHidden();
  await page
    .getByText("Language & optional practices", { exact: true })
    .click();
  await page
    .getByRole("button", { name: "Create a meditation", exact: true })
    .click();
  await expect(page.getByRole("log")).toContainText(
    "A quiet moment is available",
  );
  await page
    .getByRole("button", { name: "Back to Soulfire", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Create with Current", exact: true })
    .click();
  await expect(page.getByRole("log")).toBeVisible();
  expect(posts).toBe(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("truncated stream discards provisional answer and restores draft for retry", async ({
  page,
}) => {
  await page.route("**/api/companion", (route) =>
    route.fulfill({
      contentType: "text/event-stream",
      body: event("message_delta", { delta: "UNVALIDATED PARTIAL RESPONSE" }),
    }),
  );
  await page
    .getByLabel("What’s weighing on you today?")
    .fill("Please help with a fictional worry.");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(
    page
      .getByRole("region", { name: "Conversation", exact: true })
      .getByRole("alert"),
  ).toContainText("interrupted");
  await expect(page.getByRole("log")).not.toContainText("UNVALIDATED");
  await expect(page.getByLabel("What’s weighing on you today?")).toHaveValue(
    "Please help with a fictional worry.",
  );
});

test("stop cancels a turn and does not let late response create a practice", async ({
  page,
}) => {
  let complete: (() => void) | undefined;
  await page.route("**/api/companion", async (route) => {
    await new Promise<void>((resolve) => {
      complete = resolve;
    });
    await route
      .fulfill({
        json: {
          reply: {
            kind: "practice",
            message: "Late reply",
            exercise: samples.worry,
          },
        },
      })
      .catch(() => {});
  });
  await page
    .getByLabel("What’s weighing on you today?")
    .fill("A fictional request to cancel.");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByLabel("Response in progress")).toBeVisible();
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  complete?.();
  await expect(page.getByRole("log")).not.toContainText("Late reply");
  await expect(page.getByLabel("What’s weighing on you today?")).toHaveValue(
    "A fictional request to cancel.",
  );
  await expect(page.locator(".conversation-practice-pane")).toBeHidden();
});

test("a new practice offer remains usable alongside an active exercise", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Try the example", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Try this practice", exact: true })
    .click();
  await page.route("**/api/companion", (route) =>
    route.fulfill({
      json: {
        reply: {
          kind: "conversation",
          message: "You can take a quiet moment without solving this now.",
          exercise: null,
          practiceOffer: { kind: "meditation", label: "Try a quiet moment" },
        },
      },
    }),
  );
  await page
    .getByLabel("Talk this through", { exact: true })
    .fill("I would like some quiet now.");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByLabel("Optional practice")).toBeVisible();
  await expect(page.locator(".practice-main")).toBeVisible();
  await page
    .getByLabel("Optional practice")
    .getByRole("button", { name: "Create a meditation" })
    .click();
  await expect(
    page.getByRole("button", { name: "Return to this practice", exact: true }),
  ).toBeVisible();
});

test("invalid history in a stream is paused so the next turn can continue", async ({
  page,
}) => {
  const session = { id: "12345678-1234-4234-8234-123456789abc" };
  await page.route("**/api/history", (route) =>
    route.fulfill({
      json:
        route.request().method() === "POST" ? { session } : { sessions: [] },
    }),
  );
  await page
    .getByRole("button", { name: "Save future conversations", exact: true })
    .click();
  await page
    .getByLabel(
      "Save future submitted text and final voice transcripts on this Mac.",
    )
    .check();
  await page
    .getByRole("button", { name: "Start saving future turns", exact: true })
    .click();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  let count = 0;
  const bodies: Array<{ history?: unknown }> = [];
  await page.route("**/api/companion", (route) => {
    bodies.push(route.request().postDataJSON());
    count++;
    return route.fulfill({
      contentType: "text/event-stream",
      body:
        count === 1
          ? event("error", {
              error: "The saved session is no longer available.",
              status: 409,
            })
          : event("result", {
              reply: {
                kind: "conversation",
                message: "We can keep talking.",
                exercise: null,
                practiceOffer: null,
              },
            }),
    });
  });
  await page
    .getByLabel("What’s weighing on you today?")
    .fill("A fictional new question.");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: "Save future conversations",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByRole("log")).toContainText("We can keep talking.");
  expect(bodies[0].history).toBeDefined();
  expect(bodies[1].history).toBeUndefined();
});
