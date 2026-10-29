import { test, expect } from "@playwright/test";
import { samples } from "../../src/lib/catalog";
// Writes only to the separately launched test server's synthetic SQLite store.
test.beforeEach(async ({ request, baseURL, page }) => {
  // The server stays credential-free; UI/model responses are explicit fixtures.
  await page.route("**/api/status", (r) =>
    r.fulfill({ json: { configured: true } }),
  );
  test.skip(
    process.env.SOULFIRE_TEST_ISOLATED !== "1",
    "Requires the isolated architecture validation server; never mutate real local memory.",
  );
  expect((await (await request.get("/api/status")).json()).configured).toBe(
    false,
  );
  const old = await (await request.get("/api/memory")).json();
  if (old.memory) {
    if (!old.memory.content.goal.startsWith("Synthetic:"))
      throw new Error("Unexpected non-test memory; left untouched.");
    const clear = await request.delete("/api/memory", {
      headers: { Origin: baseURL! },
      data: { expectedRevision: old.revision },
    });
    expect(clear.status()).toBe(200);
  }
});

test("explicit memory persists, personalizes only a selected request, and delete rejects stale saves", async ({
  page,
  request,
  baseURL,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "My memory", exact: true }).click();
  const goal = page.getByLabel("A goal I want to remember", { exact: true });
  await expect(goal).toHaveValue("");
  await goal.fill("Synthetic: learn pottery.");
  await page
    .getByLabel("What helps me / what to avoid", { exact: true })
    .fill("Synthetic: short visual prompts.");
  await page
    .getByLabel("Allow these notes to be selected for AI requests")
    .check();
  await page
    .getByRole("button", { name: "Remember these notes", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Memory saved on this Mac" }),
  ).toBeVisible();
  const saved = await (await request.get("/api/memory")).json();
  expect(saved.memory.source).toBe("user_confirmed");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page
    .getByRole("button", { name: "Begin journey", exact: true })
    .click();
  await expect(
    page.getByLabel("Include my saved memory with this request"),
  ).not.toBeChecked();
  await page.getByLabel("Include my saved memory with this request").check();
  await page
    .getByLabel("What’s weighing on you today?")
    .fill("A fictional first pottery class.");
  const sent: Record<string, unknown>[] = [];
  await page.route("**/api/companion", async (route) => {
    sent.push(route.request().postDataJSON());
    await route.fulfill({
      json: {
        reply: {
          kind: "practice",
          message:
            "A synthetic model fixture connected to the volunteered goal.",
          exercise: {
            ...samples.worry,
            title: "Steady hands at the pottery table.",
            blocks: [
              {
                ...samples.worry.blocks[0],
                items: [
                  "Pack the clay tools",
                  "Ask the teacher for a demonstration",
                  "How the first pot turns out",
                ],
              },
            ],
          },
        },
      },
    });
  });
  await page
    .getByRole("button", { name: "Send & find a practice", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Steady hands at the pottery table." }),
  ).toBeVisible();
  expect(sent[0].useMemory).toBe(true);
  expect(JSON.stringify(sent)).not.toContain("Synthetic: learn pottery."); // Looked up by server, not trusted client memory.
  await page
    .getByRole("button", { name: "Try this practice", exact: true })
    .click();
  await expect(page.locator(".thought-picker")).toContainText(
    "Pack the clay tools",
  );
  await page.reload();
  await expect(page.locator("main")).not.toContainText(
    "Synthetic: learn pottery.",
  );
  await page.getByRole("button", { name: "My memory", exact: true }).click();
  await expect(goal).toHaveValue("Synthetic: learn pottery.");
  await goal.fill("Synthetic: enjoy a small clay project.");
  await page
    .getByLabel("Allow these notes to be selected for AI requests")
    .uncheck();
  await page
    .getByRole("button", { name: "Save memory changes", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Memory saved on this Mac" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Forget all memory", exact: true })
    .click();
  await page.getByRole("button", { name: "Keep memory", exact: true }).click();
  await expect(goal).toHaveValue("Synthetic: enjoy a small clay project.");
  await page
    .getByRole("button", { name: "Forget all memory", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Delete memory now", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Memory deleted" }),
  ).toBeVisible();
  const deleted = await (await request.get("/api/memory")).json();
  expect(deleted.memory).toBeNull();
  const stale = await request.put("/api/memory", {
    headers: { Origin: baseURL! },
    data: {
      consent: true,
      expectedRevision: saved.revision,
      content: saved.memory.content,
    },
  });
  expect(stale.status()).toBe(409);
  expect((await (await request.get("/api/memory")).json()).memory).toBeNull();
});

test("visual placement, simple editing, saved scene resume and reduced motion agree", async ({
  page,
}, info) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Begin journey", exact: true })
    .click();
  await page.getByRole("button", { name: /Try the example/ }).click();
  await page
    .getByRole("button", { name: "Try this practice", exact: true })
    .click();
  await expect(page.locator(".visual-exercise")).toHaveAttribute(
    "data-scene-version",
    "1",
  );
  await page
    .locator(".thought-picker")
    .getByRole("button", { name: /Rehearse my opening/ })
    .click();
  await page
    .getByRole("button", { name: "Place in I can release", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Place in I can release", exact: true })
    .click();
  await expect(page.locator(".visual-exercise [role=status]")).toContainText(
    "Rehearse my opening: I can release",
  );
  await page
    .getByText("Edit thoughts / simple controls", { exact: true })
    .click();
  await expect(
    page.getByLabel("Move Rehearse my opening", { exact: true }),
  ).toHaveValue("2");
  await page
    .getByLabel("Move Rehearse my opening", { exact: true })
    .selectOption("0");
  await expect(page.locator(".visual-exercise [role=status]")).toContainText(
    "I can prepare",
  );
  await page
    .getByText("Edit thoughts / simple controls", { exact: true })
    .click();
  await page.getByText("Save and return later", { exact: true }).click();
  await page
    .getByLabel("Keep this practice on this device", { exact: true })
    .check();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("soulfire.saved-practice.v1") || "{}")
            .sceneVersion,
      ),
    )
    .toBe(1);
  await page.reload();
  await page.getByRole("button", { name: /Resume/ }).click();
  await expect(page.locator(".visual-exercise [role=status]")).toContainText(
    "I can prepare",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".thought-stone").first()).toHaveCSS(
    "transition-duration",
    "0s",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .locator(".exercise-block.sort")
    .screenshot({ path: info.outputPath("visual-influence-map.png") });
  // Existing private work must never be imported into new durable memory.
  await page.getByRole("button", { name: "My memory", exact: true }).click();
  await expect(
    page.getByLabel("A goal I want to remember", { exact: true }),
  ).toHaveValue("");
});

test("unavailable memory and malformed generation keep the local practice usable", async ({
  page,
}) => {
  let memoryDown = true;
  await page.route("**/api/memory", (r) =>
    memoryDown
      ? r.fulfill({
          status: 503,
          json: { error: "Synthetic storage unavailable." },
        })
      : r.fallback(),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "My memory", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "Synthetic storage unavailable",
  );
  await expect(
    page.getByRole("button", { name: "Remember these notes", exact: true }),
  ).toHaveCount(0);
  memoryDown = false;
  await page
    .getByRole("button", { name: "Reload saved memory", exact: true })
    .click();
  await expect(
    page.getByLabel("A goal I want to remember", { exact: true }),
  ).toHaveValue("");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page
    .getByRole("button", { name: "Begin journey", exact: true })
    .click();
  await page
    .getByLabel("What’s weighing on you today?")
    .fill("Synthetic draft survives invalid UI.");
  await page.route("**/api/companion", (r) =>
    r.fulfill({
      json: {
        reply: {
          kind: "practice",
          message: "Fixture",
          exercise: {
            ...samples.worry,
            html: "<script>window.unsafe=true</script>",
          },
        },
      },
    }),
  );
  await page
    .getByRole("button", { name: "Send & find a practice", exact: true })
    .click();
  await expect(page.locator("main [role=alert]")).toContainText(
    "could not be read safely",
  );
  await expect(page.getByLabel("What’s weighing on you today?")).toHaveValue(
    "Synthetic draft survives invalid UI.",
  );
  expect(await page.evaluate(() => "unsafe" in window)).toBe(false);
  await page.getByRole("button", { name: /Try the example/ }).click();
  await page
    .getByRole("button", { name: "Try this practice", exact: true })
    .click();
  await expect(page.locator(".visual-exercise")).toBeVisible();
});
