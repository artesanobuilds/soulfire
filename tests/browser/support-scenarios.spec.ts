import { test, expect } from "@playwright/test";
import scenarios from "../../simulations/scenarios.json";
const evaluations = scenarios.filter((s) => s.suite !== "general");
test.beforeEach(async ({ page, request }) => {
  test.skip(
    process.env.SOULFIRE_TEST_ISOLATED !== "1",
    "Isolated keyless server required",
  );
  expect((await (await request.get("/api/status")).json()).configured).toBe(
    false,
  );
  await page.addInitScript(() => {
    localStorage.setItem("soulfire.ambient.enabled", "off");
    const items: HTMLAudioElement[] = [];
    Object.defineProperty(window, "__suiteAudio", { value: items });
    const Original = window.Audio;
    window.Audio = class extends Original {
      constructor(src?: string) {
        super(src);
        this.playbackRate = 8;
        items.push(this);
      }
    };
  });
  await page.route("**/api/memory", (r) =>
    r.fulfill({ json: { revision: 0, memory: null } }),
  );
  for (const path of ["companion", "transcribe", "realtime"])
    await page.route("**/api/" + path, (r) => r.abort());
  await page.goto("/");
  await page.getByRole("button", { name: "Simulations", exact: true }).click();
});
test.afterEach(async ({ page, baseURL }) => {
  if (process.env.SOULFIRE_TEST_ISOLATED !== "1") return;
  const data = await (await page.request.get("/api/history")).json();
  for (const s of data.sessions || []) {
    expect(s.synthetic).toBe(true);
    await page.request.delete("/api/history", {
      headers: { Origin: baseURL! },
      data: { id: s.id, confirm: true },
    });
  }
});
test("all 20 source topics and one labeled variant are selectable and launch once with saved snapshots", async ({
  page,
}, info) => {
  test.setTimeout(120000);
  const select = page.getByLabel("Synthetic scenario", { exact: true });
  await expect(select.locator("option")).toHaveCount(23);
  expect(
    await select
      .locator("option")
      .evaluateAll((items) => items.map((e) => (e as HTMLOptionElement).value)),
  ).toEqual(scenarios.map((s) => s.id));
  let creates = 0;
  page.on("request", (r) => {
    if (
      r.url().endsWith("/api/simulations") &&
      r.method() === "POST" &&
      r.postDataJSON().action === "create"
    )
      creates++;
  });
  for (const [i, s] of evaluations.entries()) {
    if (
      !(await page
        .locator(".simulation-setup")
        .evaluate((e) => (e as HTMLDetailsElement).open))
    )
      await page
        .getByText("Configure a new simulation", { exact: true })
        .click();
    await select.selectOption(s.id);
    if (i === 0) {
      await page
        .getByText("About this fictional evaluation", { exact: true })
        .click();
      await expect(page.locator(".scenario-evaluation")).toContainText(
        "not evidence of clinical effectiveness",
      );
      await page.screenshot({
        path: info.outputPath("support-catalog.png"),
        fullPage: true,
      });
      await page
        .getByText("About this fictional evaluation", { exact: true })
        .click();
    }
    await page
      .getByLabel("Simulation delivery", { exact: true })
      .selectOption("background");
    await page
      .getByLabel(
        "Save this synthetic run locally for review and feedback (30 days).",
      )
      .check();
    await page
      .getByRole("button", { name: "Launch simulation", exact: true })
      .click();
    await expect(page.locator(".simulation-status")).toContainText("Completed");
    await expect(page.locator(".simulation-turns li")).toHaveCount(4);
  }
  expect(creates).toBe(21);
  const data = await (await page.request.get("/api/simulations")).json();
  expect(data.runs).toHaveLength(21);
  expect(
    new Set(
      data.runs.map((r: { config: { scenario: string } }) => r.config.scenario),
    ).size,
  ).toBe(21);
  for (const run of data.runs) {
    expect(run.scenarioSnapshot.id).toBe(run.config.scenario);
    expect(run.scenarioVersion).toBe(1);
    expect(run.providerRequests).toBe(0);
  }
});
test("new fixture voice uses actual local synthesis, supports pause/resume, and preserves saved review", async ({
  page,
}, info) => {
  test.setTimeout(90000);
  await page
    .getByLabel("Synthetic scenario", { exact: true })
    .selectOption("support-loneliness-and-connection");
  await page
    .getByLabel("Simulation mode", { exact: true })
    .selectOption("voice");
  await page
    .getByLabel(
      "Save this synthetic run locally for review and feedback (30 days).",
    )
    .check();
  await page
    .getByRole("button", { name: "Launch simulation", exact: true })
    .click();
  await expect(
    page.locator(".simulation-turns [data-speaking=true]"),
  ).toHaveCount(1, { timeout: 30000 });
  await page
    .getByRole("button", { name: "Pause simulation", exact: true })
    .click();
  await expect(page.locator(".simulation-status")).toContainText("Paused");
  expect(
    await page.evaluate(() =>
      (
        window as unknown as { __suiteAudio: HTMLAudioElement[] }
      ).__suiteAudio.every((a) => a.paused),
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Resume simulation", exact: true })
    .click();
  await expect(page.locator(".simulation-status")).toContainText("Completed", {
    timeout: 60000,
  });
  const run = (await (await page.request.get("/api/simulations")).json())
    .runs[0];
  expect(run.providerRequests).toBe(0);
  expect(run.audioPending).toEqual([]);
  for (let turn = 0; turn < 4; turn++) {
    const audio = await page.request.get(
      `/api/simulations/audio?id=${run.id}&turn=${turn}`,
    );
    expect(audio.ok()).toBe(true);
    expect(audio.headers()["content-type"]).toBe("audio/wav");
  }
  await page
    .getByRole("button", { name: "Review and rate this run", exact: true })
    .click();
  await expect(page.locator(".history-detail")).toContainText(
    "support-loneliness-and-connection",
  );
  await expect(page.getByLabel(/Assessment for response/)).toHaveCount(2);
  await page.locator(".history-detail").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: info.outputPath("support-review.png"),
    fullPage: true,
  });
});
test("new fixture background voice synthesizes on the server without playback", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page
    .getByLabel("Synthetic scenario", { exact: true })
    .selectOption("support-stigma-and-asking-for-help");
  await page
    .getByLabel("Simulation mode", { exact: true })
    .selectOption("voice");
  await page
    .getByLabel("Simulation delivery", { exact: true })
    .selectOption("background");
  await page
    .getByLabel(
      "Save this synthetic run locally for review and feedback (30 days).",
    )
    .check();
  await page
    .getByRole("button", { name: "Launch simulation", exact: true })
    .click();
  await expect(page.locator(".simulation-status")).toContainText("Completed", {
    timeout: 60000,
  });
  const run = (await (await page.request.get("/api/simulations")).json())
    .runs[0];
  expect(run.audioPending).toEqual([]);
  expect(run.providerRequests).toBe(0);
  expect(
    await page.evaluate(() =>
      (
        window as unknown as { __suiteAudio: HTMLAudioElement[] }
      ).__suiteAudio.some((a) => a.src.includes("/api/simulations/audio")),
    ),
  ).toBe(false);
});
